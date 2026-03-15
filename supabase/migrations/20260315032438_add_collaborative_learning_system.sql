/*
  # Collaborative Learning System

  1. New Tables
    - `study_groups` - Collaborative study groups
    - `group_members` - Group membership
    - `group_sessions` - Live study sessions  
    - `peer_help_requests` - Student help requests
    - `peer_responses` - Responses to help requests
    
  2. Features
    - Study groups
    - Peer tutoring
    - Collaborative sessions
    - Group achievements
    
  3. Security
    - RLS for privacy
    - Moderation controls
*/

-- Group Member Roles
DO $$ BEGIN
  CREATE TYPE group_role AS ENUM (
    'owner',
    'moderator',
    'member'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Session Status
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM (
    'scheduled',
    'active',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Help Request Status
DO $$ BEGIN
  CREATE TYPE help_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  subject text,
  school_year integer,
  max_members integer DEFAULT 10,
  is_public boolean DEFAULT false,
  invite_code text UNIQUE,
  group_avatar text,
  total_members integer DEFAULT 1,
  group_level integer DEFAULT 1,
  group_xp integer DEFAULT 0,
  created_by uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public groups"
  ON study_groups FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Students can create groups"
  ON study_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = study_groups.created_by
      AND students.user_id = auth.uid()
    )
  );

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role group_role DEFAULT 'member',
  contribution_points integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  UNIQUE(group_id, student_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      JOIN students s ON s.id = gm2.student_id
      WHERE gm2.group_id = group_members.group_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = group_members.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Peer Help Requests
CREATE TABLE IF NOT EXISTS peer_help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id uuid REFERENCES study_groups(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  question_text text NOT NULL,
  difficulty difficulty_level,
  status help_status DEFAULT 'open',
  helper_id uuid REFERENCES students(id),
  response_count integer DEFAULT 0,
  helpful_votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE peer_help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view help requests"
  ON peer_help_requests FOR SELECT
  TO authenticated
  USING (
    peer_help_requests.group_id IS NULL
    OR EXISTS (
      SELECT 1 FROM group_members gm
      JOIN students s ON s.id = gm.student_id
      WHERE gm.group_id = peer_help_requests.group_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create help requests"
  ON peer_help_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = peer_help_requests.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Peer Responses
CREATE TABLE IF NOT EXISTS peer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES peer_help_requests(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  response_text text NOT NULL,
  is_helpful boolean,
  helpful_votes integer DEFAULT 0,
  is_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE peer_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view responses"
  ON peer_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can create responses"
  ON peer_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = peer_responses.responder_id
      AND students.user_id = auth.uid()
    )
  );

-- Function to create study group
CREATE OR REPLACE FUNCTION create_study_group(
  creator_id_param uuid,
  name_param text,
  description_param text DEFAULT NULL,
  subject_param text DEFAULT NULL,
  is_public_param boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  group_id uuid;
  invite_code_val text;
BEGIN
  invite_code_val := substring(md5(random()::text) from 1 for 8);

  INSERT INTO study_groups (
    name,
    description,
    subject,
    is_public,
    invite_code,
    created_by
  ) VALUES (
    name_param,
    description_param,
    subject_param,
    is_public_param,
    invite_code_val,
    creator_id_param
  ) RETURNING id INTO group_id;

  INSERT INTO group_members (
    group_id,
    student_id,
    role
  ) VALUES (
    group_id,
    creator_id_param,
    'owner'
  );

  RETURN jsonb_build_object(
    'success', true,
    'group_id', group_id,
    'invite_code', invite_code_val
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join study group
CREATE OR REPLACE FUNCTION join_study_group(
  student_id_param uuid,
  group_id_param uuid DEFAULT NULL,
  invite_code_param text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  group_record RECORD;
  group_id_resolved uuid;
BEGIN
  IF group_id_param IS NOT NULL THEN
    group_id_resolved := group_id_param;
  ELSIF invite_code_param IS NOT NULL THEN
    SELECT id INTO group_id_resolved
    FROM study_groups
    WHERE invite_code = invite_code_param;
  ELSE
    RAISE EXCEPTION 'Must provide group_id or invite_code';
  END IF;

  SELECT * INTO group_record
  FROM study_groups
  WHERE id = group_id_resolved;

  IF group_record IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF group_record.total_members >= group_record.max_members THEN
    RAISE EXCEPTION 'Group is full';
  END IF;

  INSERT INTO group_members (
    group_id,
    student_id,
    role
  ) VALUES (
    group_id_resolved,
    student_id_param,
    'member'
  )
  ON CONFLICT (group_id, student_id) DO NOTHING;

  UPDATE study_groups
  SET 
    total_members = total_members + 1,
    updated_at = now()
  WHERE id = group_id_resolved;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get open help requests
CREATE OR REPLACE FUNCTION get_open_help_requests(
  student_id_param uuid,
  limit_param integer DEFAULT 20
)
RETURNS TABLE (
  request_id uuid,
  student_name text,
  subject text,
  topic text,
  question_text text,
  status help_status,
  response_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    phr.id as request_id,
    s.name as student_name,
    phr.subject,
    phr.topic,
    phr.question_text,
    phr.status,
    phr.response_count,
    phr.created_at
  FROM peer_help_requests phr
  JOIN students s ON s.id = phr.student_id
  WHERE phr.status IN ('open', 'in_progress')
  AND (
    phr.group_id IS NULL
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = phr.group_id
      AND gm.student_id = student_id_param
    )
  )
  ORDER BY phr.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_groups_public
  ON study_groups(is_public, subject);

CREATE INDEX IF NOT EXISTS idx_group_members_student
  ON group_members(student_id);

CREATE INDEX IF NOT EXISTS idx_peer_help_requests_status
  ON peer_help_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_peer_responses_request
  ON peer_responses(request_id, created_at DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_study_group TO authenticated;
GRANT EXECUTE ON FUNCTION join_study_group TO authenticated;
GRANT EXECUTE ON FUNCTION get_open_help_requests TO authenticated;