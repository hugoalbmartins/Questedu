/*
  # Chat Parental Controls and Message Retention System

  ## Overview
  This migration implements a comprehensive parental control system for chat with:
  - Message retention (60 days auto-delete unless flagged)
  - Temporary and permanent user blocking
  - Total chat restriction capabilities
  - Block history tracking
  - Automatic expiration handling

  ## New Tables

  ### chat_parental_blocks
  Tracks individual user blocks (temporary or permanent)
  - `id` (uuid, primary key)
  - `student_id` (uuid, the student who is blocked from chatting)
  - `blocked_friend_id` (uuid, the specific friend blocked)
  - `parent_id` (uuid, the parent who created the block - references auth.users)
  - `blocked_at` (timestamptz, when block was applied)
  - `blocked_until` (timestamptz, null for permanent blocks)
  - `is_permanent` (boolean, true for permanent blocks)
  - `reason` (text, optional reason for block)
  - `created_at` (timestamptz)

  ### chat_block_history
  Historical record of temporary blocks for tracking 10-day limit
  - `id` (uuid, primary key)
  - `student_id` (uuid)
  - `blocked_friend_id` (uuid)
  - `parent_id` (uuid, references auth.users)
  - `blocked_date` (timestamptz)
  - `unblocked_date` (timestamptz, null if still active)
  - `days_count` (integer, number of days blocked)
  - `created_at` (timestamptz)

  ### chat_restrictions
  Total chat restrictions for a student
  - `id` (uuid, primary key)
  - `student_id` (uuid)
  - `parent_id` (uuid, references auth.users)
  - `all_chats_blocked` (boolean)
  - `blocked_at` (timestamptz)
  - `blocked_until` (timestamptz, null for permanent)
  - `is_permanent` (boolean)
  - `created_at` (timestamptz)

  ## Modified Tables

  ### chat_messages
  Added fields:
  - `retention_expires_at` (timestamptz, auto-calculated as created_at + 60 days)
  - `is_flagged_by_parent` (boolean, prevents deletion)
  - `parent_notes` (text, optional notes from parent)

  ## Security
  - Enable RLS on all new tables
  - Parents can only manage blocks for their own students
  - Students cannot see block details
  - Block validation happens server-side

  ## Functions
  - `calculate_retention_date()` - Auto-calculates retention_expires_at
  - `check_chat_blocked()` - Validates if chat is blocked
  - `count_blocked_days()` - Counts total temporary block days
*/

-- Add new columns to chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'retention_expires_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN retention_expires_at timestamptz DEFAULT (now() + interval '60 days');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'is_flagged_by_parent'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN is_flagged_by_parent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'parent_notes'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN parent_notes text;
  END IF;
END $$;

-- Create chat_parental_blocks table
CREATE TABLE IF NOT EXISTS chat_parental_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  blocked_friend_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_at timestamptz DEFAULT now(),
  blocked_until timestamptz,
  is_permanent boolean DEFAULT false,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Create chat_block_history table
CREATE TABLE IF NOT EXISTS chat_block_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  blocked_friend_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_date timestamptz NOT NULL,
  unblocked_date timestamptz,
  days_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create chat_restrictions table
CREATE TABLE IF NOT EXISTS chat_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  all_chats_blocked boolean DEFAULT true,
  blocked_at timestamptz DEFAULT now(),
  blocked_until timestamptz,
  is_permanent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_parental_blocks_student ON chat_parental_blocks(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_parental_blocks_friend ON chat_parental_blocks(blocked_friend_id);
CREATE INDEX IF NOT EXISTS idx_chat_parental_blocks_until ON chat_parental_blocks(blocked_until);
CREATE INDEX IF NOT EXISTS idx_chat_block_history_student ON chat_block_history(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_restrictions_student ON chat_restrictions(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_retention ON chat_messages(retention_expires_at) WHERE is_flagged_by_parent = false;

-- Enable RLS
ALTER TABLE chat_parental_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_block_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_parental_blocks
CREATE POLICY "Parents can view blocks for their students"
  ON chat_parental_blocks
  FOR SELECT
  TO authenticated
  USING (
    parent_id = auth.uid()
    OR student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "Parents can create blocks for their students"
  ON chat_parental_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "Parents can update blocks for their students"
  ON chat_parental_blocks
  FOR UPDATE
  TO authenticated
  USING (
    parent_id = auth.uid()
    AND student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "Parents can delete blocks for their students"
  ON chat_parental_blocks
  FOR DELETE
  TO authenticated
  USING (
    parent_id = auth.uid()
    AND student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- RLS Policies for chat_block_history
CREATE POLICY "Parents can view block history for their students"
  ON chat_block_history
  FOR SELECT
  TO authenticated
  USING (
    parent_id = auth.uid()
    OR student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- RLS Policies for chat_restrictions
CREATE POLICY "Parents can view restrictions for their students"
  ON chat_restrictions
  FOR SELECT
  TO authenticated
  USING (
    parent_id = auth.uid()
    OR student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "Parents can create restrictions for their students"
  ON chat_restrictions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "Parents can update restrictions for their students"
  ON chat_restrictions
  FOR UPDATE
  TO authenticated
  USING (
    parent_id = auth.uid()
    AND student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "Parents can delete restrictions for their students"
  ON chat_restrictions
  FOR DELETE
  TO authenticated
  USING (
    parent_id = auth.uid()
    AND student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- Function to check if a chat is blocked
CREATE OR REPLACE FUNCTION check_chat_blocked(
  p_student_id uuid,
  p_friend_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blocked boolean;
BEGIN
  -- Check total chat restriction
  SELECT EXISTS (
    SELECT 1 FROM chat_restrictions
    WHERE student_id = p_student_id
    AND all_chats_blocked = true
    AND (is_permanent = true OR blocked_until > now())
  ) INTO v_blocked;

  IF v_blocked THEN
    RETURN true;
  END IF;

  -- Check specific friend block (both directions)
  SELECT EXISTS (
    SELECT 1 FROM chat_parental_blocks
    WHERE ((student_id = p_student_id AND blocked_friend_id = p_friend_id)
       OR (student_id = p_friend_id AND blocked_friend_id = p_student_id))
    AND (is_permanent = true OR blocked_until > now())
  ) INTO v_blocked;

  RETURN v_blocked;
END;
$$;

-- Function to count total blocked days for a specific friendship
CREATE OR REPLACE FUNCTION count_blocked_days(
  p_student_id uuid,
  p_friend_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_days integer;
BEGIN
  SELECT COALESCE(SUM(days_count), 0)
  INTO v_total_days
  FROM chat_block_history
  WHERE student_id = p_student_id
  AND blocked_friend_id = p_friend_id;

  RETURN v_total_days;
END;
$$;

-- Trigger function to set retention date on new messages
CREATE OR REPLACE FUNCTION set_message_retention()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.retention_expires_at := NEW.created_at + interval '60 days';
  RETURN NEW;
END;
$$;

-- Create trigger for retention date
DROP TRIGGER IF EXISTS set_message_retention_trigger ON chat_messages;
CREATE TRIGGER set_message_retention_trigger
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_retention();

-- Function to cleanup expired messages (to be called by scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM chat_messages
  WHERE retention_expires_at < now()
  AND is_flagged_by_parent = false;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Function to update block history when block expires
CREATE OR REPLACE FUNCTION update_block_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Move expired temporary blocks to history
  INSERT INTO chat_block_history (
    student_id,
    blocked_friend_id,
    parent_id,
    blocked_date,
    unblocked_date,
    days_count
  )
  SELECT
    student_id,
    blocked_friend_id,
    parent_id,
    blocked_at,
    blocked_until,
    EXTRACT(DAY FROM (blocked_until - blocked_at))::integer
  FROM chat_parental_blocks
  WHERE blocked_until <= now()
  AND is_permanent = false
  AND NOT EXISTS (
    SELECT 1 FROM chat_block_history cbh
    WHERE cbh.student_id = chat_parental_blocks.student_id
    AND cbh.blocked_friend_id = chat_parental_blocks.blocked_friend_id
    AND cbh.blocked_date = chat_parental_blocks.blocked_at
  );

  -- Delete expired blocks
  DELETE FROM chat_parental_blocks
  WHERE blocked_until <= now()
  AND is_permanent = false;
END;
$$;