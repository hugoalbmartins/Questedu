/*
  # Friend System Helper Functions (Fixed)

  1. New Tables
    - `friend_activities` - Activity feed
    
  2. Functions
    - Enhanced friend management
    - Activity tracking
    - Friend search
*/

-- Activity Types
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'achievement_unlocked',
    'level_up',
    'quest_completed',
    'badge_earned',
    'high_score',
    'streak_milestone'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Friend Activities Feed
CREATE TABLE IF NOT EXISTS friend_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  activity_data jsonb NOT NULL,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE friend_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view friends' activities"
  ON friend_activities FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND (
      EXISTS (
        SELECT 1 FROM students
        WHERE students.id = friend_activities.student_id
        AND students.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM friendships f
        JOIN students s ON s.user_id = auth.uid()
        WHERE f.status = 'approved'
        AND ((f.requester_id = friend_activities.student_id AND f.receiver_id = s.id)
        OR (f.receiver_id = friend_activities.student_id AND f.requester_id = s.id))
      )
    )
  );

CREATE POLICY "Students can create own activities"
  ON friend_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = friend_activities.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Function to get friend list
CREATE OR REPLACE FUNCTION get_friend_list(student_id_param uuid)
RETURNS TABLE (
  friend_id uuid,
  friend_name text,
  friend_level integer,
  friend_xp integer,
  friend_school text,
  friendship_created timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.requester_id = student_id_param THEN f.receiver_id
      ELSE f.requester_id
    END as friend_id,
    s.name as friend_name,
    (s.xp / 1000 + 1)::integer as friend_level,
    s.xp as friend_xp,
    sc.name as friend_school,
    f.created_at as friendship_created
  FROM friendships f
  JOIN students s ON s.id = CASE 
    WHEN f.requester_id = student_id_param THEN f.receiver_id
    ELSE f.requester_id
  END
  LEFT JOIN schools sc ON sc.id = s.school_id
  WHERE student_id_param IN (f.requester_id, f.receiver_id)
  AND f.status = 'approved'
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search for students
CREATE OR REPLACE FUNCTION search_students(
  search_query text,
  current_student_id uuid,
  limit_param integer DEFAULT 20
)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  student_level integer,
  student_xp integer,
  school_name text,
  is_friend boolean,
  has_pending_request boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name as student_name,
    (s.xp / 1000 + 1)::integer as student_level,
    s.xp as student_xp,
    sc.name as school_name,
    EXISTS(
      SELECT 1 FROM friendships f
      WHERE ((f.requester_id = current_student_id AND f.receiver_id = s.id)
      OR (f.receiver_id = current_student_id AND f.requester_id = s.id))
      AND f.status = 'approved'
    ) as is_friend,
    EXISTS(
      SELECT 1 FROM friendships f
      WHERE ((f.requester_id = current_student_id AND f.receiver_id = s.id)
      OR (f.receiver_id = current_student_id AND f.requester_id = s.id))
      AND f.status = 'pending_parent_approval'
    ) as has_pending_request
  FROM students s
  LEFT JOIN schools sc ON sc.id = s.school_id
  LEFT JOIN student_profiles sp ON sp.student_id = s.id
  WHERE s.id != current_student_id
  AND (
    s.name ILIKE '%' || search_query || '%'
    OR s.display_name ILIKE '%' || search_query || '%'
  )
  AND (sp.is_profile_public = true OR sp.is_profile_public IS NULL)
  ORDER BY 
    CASE WHEN s.name ILIKE search_query || '%' THEN 1 ELSE 2 END,
    s.xp DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests
CREATE OR REPLACE FUNCTION get_pending_requests(student_id_param uuid)
RETURNS TABLE (
  request_id uuid,
  sender_id uuid,
  sender_name text,
  sender_level integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as request_id,
    s.id as sender_id,
    s.name as sender_name,
    (s.xp / 1000 + 1)::integer as sender_level,
    f.created_at
  FROM friendships f
  JOIN students s ON s.id = f.requester_id
  WHERE f.receiver_id = student_id_param
  AND f.status = 'pending_parent_approval'
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_friend_activity(
  student_id_param uuid,
  activity_type_param activity_type,
  activity_data_param jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO friend_activities (student_id, activity_type, activity_data)
  VALUES (student_id_param, activity_type_param, activity_data_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friend activity feed
CREATE OR REPLACE FUNCTION get_friend_activity_feed(
  student_id_param uuid,
  limit_param integer DEFAULT 50
)
RETURNS TABLE (
  activity_id uuid,
  friend_id uuid,
  friend_name text,
  activity_type activity_type,
  activity_data jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id as activity_id,
    s.id as friend_id,
    s.name as friend_name,
    fa.activity_type,
    fa.activity_data,
    fa.created_at
  FROM friend_activities fa
  JOIN students s ON s.id = fa.student_id
  WHERE fa.is_public = true
  AND (
    fa.student_id = student_id_param
    OR EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'approved'
      AND ((f.requester_id = student_id_param AND f.receiver_id = fa.student_id)
      OR (f.receiver_id = student_id_param AND f.requester_id = fa.student_id))
    )
  )
  ORDER BY fa.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friend_activities_student
  ON friend_activities(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friend_activities_type
  ON friend_activities(activity_type, created_at DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_friend_list TO authenticated;
GRANT EXECUTE ON FUNCTION search_students TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_requests TO authenticated;
GRANT EXECUTE ON FUNCTION log_friend_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_activity_feed TO authenticated;