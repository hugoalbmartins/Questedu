/*
  # Add construction state to buildings

  1. Changes
    - Add `construction_started_at` (timestamptz) — when construction began
    - Add `construction_duration_seconds` (integer) — how long construction takes
    - Add `is_constructed` (boolean) — whether building is fully built

  2. Notes
    - Existing buildings are marked as fully constructed (is_constructed = true)
    - New buildings start with is_constructed = false
    - construction_duration_seconds varies by building cost complexity
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'construction_started_at'
  ) THEN
    ALTER TABLE buildings ADD COLUMN construction_started_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'construction_duration_seconds'
  ) THEN
    ALTER TABLE buildings ADD COLUMN construction_duration_seconds integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'buildings' AND column_name = 'is_constructed'
  ) THEN
    ALTER TABLE buildings ADD COLUMN is_constructed boolean DEFAULT true;
  END IF;
END $$;

-- All existing buildings are already constructed
UPDATE buildings SET is_constructed = true WHERE is_constructed IS NULL OR is_constructed = false;
