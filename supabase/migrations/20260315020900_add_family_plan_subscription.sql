/*
  # Family Plan Subscription System

  1. New Table
    - `family_subscriptions` - Track family plan subscriptions
    
  2. Security
    - Enable RLS on family_subscriptions
    - Add policies for parents to manage their family plan
    
  3. Functions
    - Function to check family plan limits
    - Function to add student to family plan
*/

-- Create family_subscriptions table
CREATE TABLE IF NOT EXISTS family_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  status text DEFAULT 'active',
  max_students integer DEFAULT 4,
  current_students integer DEFAULT 0,
  price_id text,
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE family_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own family subscription"
  ON family_subscriptions FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can manage own family subscription"
  ON family_subscriptions FOR ALL
  TO authenticated
  USING (parent_id = auth.uid());

-- Add family_subscription_id to students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'family_subscription_id'
  ) THEN
    ALTER TABLE students ADD COLUMN family_subscription_id uuid REFERENCES family_subscriptions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to check if family plan has available slots
CREATE OR REPLACE FUNCTION can_add_to_family_plan(family_sub_id uuid)
RETURNS boolean AS $$
DECLARE
  max_allowed integer;
  current_count integer;
BEGIN
  SELECT max_students, current_students
  INTO max_allowed, current_count
  FROM family_subscriptions
  WHERE id = family_sub_id
  AND status = 'active';

  IF max_allowed IS NULL THEN
    RETURN false;
  END IF;

  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add student to family plan
CREATE OR REPLACE FUNCTION add_student_to_family_plan(
  student_id_param uuid,
  family_sub_id uuid
)
RETURNS boolean AS $$
DECLARE
  can_add boolean;
BEGIN
  SELECT can_add_to_family_plan(family_sub_id) INTO can_add;

  IF NOT can_add THEN
    RETURN false;
  END IF;

  UPDATE students
  SET 
    is_premium = true,
    family_subscription_id = family_sub_id,
    premium_expires_at = NULL
  WHERE id = student_id_param;

  UPDATE family_subscriptions
  SET 
    current_students = current_students + 1,
    updated_at = now()
  WHERE id = family_sub_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove student from family plan
CREATE OR REPLACE FUNCTION remove_student_from_family_plan(student_id_param uuid)
RETURNS boolean AS $$
DECLARE
  family_sub_id uuid;
BEGIN
  SELECT family_subscription_id INTO family_sub_id
  FROM students
  WHERE id = student_id_param;

  IF family_sub_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE students
  SET 
    is_premium = false,
    family_subscription_id = NULL
  WHERE id = student_id_param;

  UPDATE family_subscriptions
  SET 
    current_students = GREATEST(0, current_students - 1),
    updated_at = now()
  WHERE id = family_sub_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get family plan for parent
CREATE OR REPLACE FUNCTION get_parent_family_plan(parent_id_param uuid)
RETURNS TABLE (
  id uuid,
  status text,
  max_students integer,
  current_students integer,
  student_names text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id,
    fs.status,
    fs.max_students,
    fs.current_students,
    ARRAY_AGG(s.display_name) AS student_names
  FROM family_subscriptions fs
  LEFT JOIN students s ON s.family_subscription_id = fs.id
  WHERE fs.parent_id = parent_id_param
  GROUP BY fs.id, fs.status, fs.max_students, fs.current_students;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_family_subscriptions_parent
  ON family_subscriptions(parent_id);

CREATE INDEX IF NOT EXISTS idx_family_subscriptions_status
  ON family_subscriptions(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_students_family_subscription
  ON students(family_subscription_id) WHERE family_subscription_id IS NOT NULL;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_add_to_family_plan TO authenticated;
GRANT EXECUTE ON FUNCTION add_student_to_family_plan TO authenticated;
GRANT EXECUTE ON FUNCTION remove_student_from_family_plan TO authenticated;
GRANT EXECUTE ON FUNCTION get_parent_family_plan TO authenticated;