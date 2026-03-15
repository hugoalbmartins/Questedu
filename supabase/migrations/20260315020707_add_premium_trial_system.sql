/*
  # Premium Trial System

  1. New Columns
    - `trial_started_at` - When trial was activated
    - `trial_used` - Whether user has used their trial
    - `trial_ends_at` - When trial expires
    
  2. Modifications
    - Add trial tracking columns to students table
    - Create function to check trial status
    - Create function to auto-expire trials
    
  3. Security
    - RLS policies already handle student access
    - Functions are SECURITY DEFINER for admin operations
*/

-- Add trial columns to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE students ADD COLUMN trial_started_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'trial_used'
  ) THEN
    ALTER TABLE students ADD COLUMN trial_used boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE students ADD COLUMN trial_ends_at timestamptz;
  END IF;
END $$;

-- Function to check if student is in active trial
CREATE OR REPLACE FUNCTION is_trial_active(student_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM students
    WHERE id = student_id_param
    AND trial_started_at IS NOT NULL
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at > now()
    AND NOT trial_used
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate trial for a student
CREATE OR REPLACE FUNCTION activate_trial(student_id_param uuid, trial_days integer DEFAULT 7)
RETURNS boolean AS $$
DECLARE
  already_used boolean;
BEGIN
  SELECT trial_used INTO already_used
  FROM students
  WHERE id = student_id_param;

  IF already_used THEN
    RETURN false;
  END IF;

  UPDATE students
  SET 
    trial_started_at = now(),
    trial_ends_at = now() + (trial_days || ' days')::interval,
    trial_used = true,
    is_premium = true
  WHERE id = student_id_param;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire trials
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS integer AS $$
DECLARE
  expired_count integer;
BEGIN
  WITH expired_students AS (
    UPDATE students
    SET is_premium = false
    WHERE trial_ends_at IS NOT NULL
    AND trial_ends_at <= now()
    AND is_premium = true
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.student_id = students.id
      AND subscriptions.status = 'active'
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired_students;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_trial_expires
  ON students(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_trial_started
  ON students(trial_started_at) WHERE trial_started_at IS NOT NULL;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_trial_active TO authenticated;
GRANT EXECUTE ON FUNCTION activate_trial TO authenticated;
GRANT EXECUTE ON FUNCTION expire_trials TO authenticated;