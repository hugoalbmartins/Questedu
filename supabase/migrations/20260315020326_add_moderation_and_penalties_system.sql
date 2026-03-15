/*
  # Moderation and Penalties System

  1. New Tables
    - `user_penalties` - Track user penalties and bans
    - `penalty_appeals` - Handle penalty appeal requests
    
  2. Modifications
    - Add action_details to message_reports for admin action history
    - Add context columns for better moderation
    
  3. Security
    - Enable RLS on all new tables
    - Add policies for admins only
    - Add policies for students to view their own penalties
    
  4. Indexes
    - Add indexes for common moderation queries
*/

-- Create penalty type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'penalty_type') THEN
    CREATE TYPE penalty_type AS ENUM ('warning', 'temp_ban', 'perm_ban');
  END IF;
END $$;

-- Create appeal status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appeal_status') THEN
    CREATE TYPE appeal_status AS ENUM ('pending', 'approved', 'denied');
  END IF;
END $$;

-- User Penalties Table
CREATE TABLE IF NOT EXISTS user_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  penalty_type penalty_type NOT NULL,
  reason text NOT NULL,
  violation_ids uuid[] DEFAULT '{}',
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  active boolean DEFAULT true,
  parent_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all penalties"
  ON user_penalties FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Students can view own penalties"
  ON user_penalties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = user_penalties.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Penalty Appeals Table
CREATE TABLE IF NOT EXISTS penalty_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  penalty_id uuid NOT NULL REFERENCES user_penalties(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  appeal_text text NOT NULL,
  appeal_status appeal_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  admin_response text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE penalty_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create appeals for own penalties"
  ON penalty_appeals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = penalty_appeals.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own appeals"
  ON penalty_appeals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = penalty_appeals.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all appeals"
  ON penalty_appeals FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add action_details column to message_reports if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_reports' AND column_name = 'action_details'
  ) THEN
    ALTER TABLE message_reports ADD COLUMN action_details jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add message_context column to store surrounding messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_reports' AND column_name = 'message_context'
  ) THEN
    ALTER TABLE message_reports ADD COLUMN message_context jsonb DEFAULT '[]';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_penalties_student_active 
  ON user_penalties(student_id, active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_user_penalties_expires 
  ON user_penalties(expires_at) WHERE active = true AND expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_penalty_appeals_status 
  ON penalty_appeals(appeal_status) WHERE appeal_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_message_reports_status 
  ON message_reports(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_message_reports_created 
  ON message_reports(created_at DESC);

-- Function to check if user has active penalty
CREATE OR REPLACE FUNCTION has_active_penalty(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_penalties
    WHERE student_id = user_id
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically deactivate expired penalties
CREATE OR REPLACE FUNCTION deactivate_expired_penalties()
RETURNS void AS $$
BEGIN
  UPDATE user_penalties
  SET active = false
  WHERE active = true
  AND expires_at IS NOT NULL
  AND expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get strike count for a student (last 30 days)
CREATE OR REPLACE FUNCTION get_strike_count(student_id_param uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM user_penalties
    WHERE student_id = student_id_param
    AND issued_at > now() - interval '30 days'
    AND penalty_type IN ('warning', 'temp_ban')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_active_penalty TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_expired_penalties TO authenticated;
GRANT EXECUTE ON FUNCTION get_strike_count TO authenticated;