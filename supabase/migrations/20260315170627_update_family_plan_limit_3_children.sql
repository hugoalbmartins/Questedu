/*
  # Update Family Plan: limit to 3 children, add extra-child discount tracking

  ## Changes
  1. `family_subscriptions` table
     - Set max_students default to 3 (was 4)
     - Update any existing family plans to max_students = 3

  2. `students` table
     - Add `family_plan_extra_child` boolean — marks students who are paying individually
       because they exceed the 3-child family plan limit
     - Add `extra_child_discount_type` text — 'monthly_family' (40% off) or 'annual_family' (50% off)

  ## Security
  - RLS already enabled on both tables; no policy changes needed
*/

-- Update default for new family subscriptions
ALTER TABLE family_subscriptions
  ALTER COLUMN max_students SET DEFAULT 3;

-- Cap existing family subscriptions to 3 max (only those currently set to 4 by old default)
UPDATE family_subscriptions
  SET max_students = 3
  WHERE max_students = 4;

-- Add extra child tracking columns to students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'family_plan_extra_child'
  ) THEN
    ALTER TABLE students ADD COLUMN family_plan_extra_child boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'extra_child_discount_type'
  ) THEN
    ALTER TABLE students ADD COLUMN extra_child_discount_type text;
  END IF;
END $$;
