/*
  # Add auto-assign missions function

  1. New Functions
    - `assign_student_missions(student_id_param uuid)` - Automatically assigns daily, weekly, and monthly missions to a student if they don't already have active ones
      - Assigns 3 random daily missions (expiring end of day)
      - Assigns 2 random weekly missions (expiring end of week)
      - Assigns 1 random monthly mission (expiring end of month)
      - Skips assignment if student already has non-expired missions of that type

  2. Security
    - Function is SECURITY DEFINER to bypass RLS for inserts
    - Only assigns to the specified student
*/

CREATE OR REPLACE FUNCTION public.assign_student_missions(student_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  daily_count integer;
  weekly_count integer;
  monthly_count integer;
  mission_rec RECORD;
  daily_expiry timestamptz;
  weekly_expiry timestamptz;
  monthly_expiry timestamptz;
BEGIN
  daily_expiry := (date_trunc('day', now()) + interval '1 day')::timestamptz;
  weekly_expiry := (date_trunc('week', now()) + interval '1 week')::timestamptz;
  monthly_expiry := (date_trunc('month', now()) + interval '1 month')::timestamptz;

  SELECT count(*) INTO daily_count
  FROM player_missions pm
  JOIN missions m ON m.id = pm.mission_id
  WHERE pm.student_id = student_id_param
    AND m.mission_type = 'daily'
    AND pm.expires_at > now();

  IF daily_count = 0 THEN
    FOR mission_rec IN
      SELECT id FROM missions
      WHERE mission_type = 'daily' AND is_active = true
      ORDER BY random()
      LIMIT 3
    LOOP
      INSERT INTO player_missions (student_id, mission_id, progress, completed, expires_at)
      VALUES (student_id_param, mission_rec.id, 0, false, daily_expiry)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  SELECT count(*) INTO weekly_count
  FROM player_missions pm
  JOIN missions m ON m.id = pm.mission_id
  WHERE pm.student_id = student_id_param
    AND m.mission_type = 'weekly'
    AND pm.expires_at > now();

  IF weekly_count = 0 THEN
    FOR mission_rec IN
      SELECT id FROM missions
      WHERE mission_type = 'weekly' AND is_active = true
      ORDER BY random()
      LIMIT 2
    LOOP
      INSERT INTO player_missions (student_id, mission_id, progress, completed, expires_at)
      VALUES (student_id_param, mission_rec.id, 0, false, weekly_expiry)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  SELECT count(*) INTO monthly_count
  FROM player_missions pm
  JOIN missions m ON m.id = pm.mission_id
  WHERE pm.student_id = student_id_param
    AND m.mission_type = 'monthly'
    AND pm.expires_at > now();

  IF monthly_count = 0 THEN
    FOR mission_rec IN
      SELECT id FROM missions
      WHERE mission_type = 'monthly' AND is_active = true
      ORDER BY random()
      LIMIT 1
    LOOP
      INSERT INTO player_missions (student_id, mission_id, progress, completed, expires_at)
      VALUES (student_id_param, mission_rec.id, 0, false, monthly_expiry)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$function$;
