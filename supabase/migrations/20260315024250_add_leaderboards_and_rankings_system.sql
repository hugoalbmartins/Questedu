/*
  # Leaderboards and Rankings System

  1. New Tables
    - `leaderboard_entries` - Rankings entries
    - `leaderboard_history` - Historical rankings
    - `seasonal_rankings` - Season-based competitions
    
  2. Features
    - Global leaderboards
    - School leaderboards
    - Class leaderboards
    - Subject-specific rankings
    - Weekly/Monthly/All-time
    - Seasonal competitions
    - Rank tiers (Bronze, Silver, Gold, Platinum, Diamond)
    
  3. Security
    - RLS for privacy
    - Optional visibility settings
    - Safe competition environment
*/

-- Leaderboard Types
DO $$ BEGIN
  CREATE TYPE leaderboard_type AS ENUM (
    'global',
    'school',
    'class',
    'friends'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Leaderboard Period
DO $$ BEGIN
  CREATE TYPE leaderboard_period AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'all_time'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Rank Tiers
DO $$ BEGIN
  CREATE TYPE rank_tier AS ENUM (
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond',
    'master',
    'grandmaster'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Leaderboard Entries (Current Rankings)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  leaderboard_type leaderboard_type NOT NULL,
  period leaderboard_period NOT NULL,
  subject text,
  school_id uuid REFERENCES schools(id),
  score integer NOT NULL DEFAULT 0,
  rank_position integer,
  rank_tier rank_tier DEFAULT 'bronze',
  questions_answered integer DEFAULT 0,
  accuracy_percentage numeric(5,2) DEFAULT 0,
  streak_days integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(student_id, leaderboard_type, period, subject, period_start)
);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own leaderboard entries"
  ON leaderboard_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = leaderboard_entries.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view public leaderboard entries"
  ON leaderboard_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles
      WHERE student_profiles.student_id = leaderboard_entries.student_id
      AND student_profiles.is_profile_public = true
    )
  );

CREATE POLICY "Students can view same school leaderboard"
  ON leaderboard_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s1
      JOIN students s2 ON s2.school_id = s1.school_id
      WHERE s1.user_id = auth.uid()
      AND s2.id = leaderboard_entries.student_id
    )
  );

CREATE POLICY "Parents can view children's leaderboard"
  ON leaderboard_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = leaderboard_entries.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Leaderboard History (Past Rankings)
CREATE TABLE IF NOT EXISTS leaderboard_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  leaderboard_type leaderboard_type NOT NULL,
  period leaderboard_period NOT NULL,
  subject text,
  final_rank integer NOT NULL,
  final_score integer NOT NULL,
  rank_tier rank_tier,
  total_participants integer DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own leaderboard history"
  ON leaderboard_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = leaderboard_history.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's leaderboard history"
  ON leaderboard_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = leaderboard_history.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Seasonal Rankings
CREATE TABLE IF NOT EXISTS seasonal_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name text NOT NULL,
  season_number integer NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  theme text,
  special_rewards jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_number)
);

ALTER TABLE seasonal_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active seasons"
  ON seasonal_rankings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Student Season Progress
CREATE TABLE IF NOT EXISTS student_season_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasonal_rankings(id) ON DELETE CASCADE,
  season_points integer DEFAULT 0,
  season_rank integer,
  tier_reached rank_tier DEFAULT 'bronze',
  quests_completed integer DEFAULT 0,
  battles_won integer DEFAULT 0,
  special_achievements uuid[] DEFAULT ARRAY[]::uuid[],
  last_updated timestamptz DEFAULT now(),
  UNIQUE(student_id, season_id)
);

ALTER TABLE student_season_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own season progress"
  ON student_season_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_season_progress.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's season progress"
  ON student_season_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_season_progress.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Function to calculate rank tier based on score
CREATE OR REPLACE FUNCTION calculate_rank_tier(score_param integer)
RETURNS rank_tier AS $$
BEGIN
  IF score_param >= 10000 THEN
    RETURN 'grandmaster';
  ELSIF score_param >= 7500 THEN
    RETURN 'master';
  ELSIF score_param >= 5000 THEN
    RETURN 'diamond';
  ELSIF score_param >= 3000 THEN
    RETURN 'platinum';
  ELSIF score_param >= 1500 THEN
    RETURN 'gold';
  ELSIF score_param >= 500 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update leaderboard entry
CREATE OR REPLACE FUNCTION update_leaderboard_entry(
  student_id_param uuid,
  leaderboard_type_param leaderboard_type,
  period_param leaderboard_period,
  subject_param text DEFAULT NULL,
  score_delta integer DEFAULT 0
)
RETURNS void AS $$
DECLARE
  period_start_date timestamptz;
  period_end_date timestamptz;
  student_school_id uuid;
  current_score integer;
BEGIN
  SELECT school_id INTO student_school_id
  FROM students
  WHERE id = student_id_param;

  CASE period_param
    WHEN 'daily' THEN
      period_start_date := date_trunc('day', now());
      period_end_date := period_start_date + interval '1 day';
    WHEN 'weekly' THEN
      period_start_date := date_trunc('week', now());
      period_end_date := period_start_date + interval '1 week';
    WHEN 'monthly' THEN
      period_start_date := date_trunc('month', now());
      period_end_date := period_start_date + interval '1 month';
    WHEN 'all_time' THEN
      period_start_date := '2020-01-01'::timestamptz;
      period_end_date := '2099-12-31'::timestamptz;
  END CASE;

  INSERT INTO leaderboard_entries (
    student_id,
    leaderboard_type,
    period,
    subject,
    school_id,
    score,
    period_start,
    period_end
  ) VALUES (
    student_id_param,
    leaderboard_type_param,
    period_param,
    subject_param,
    student_school_id,
    score_delta,
    period_start_date,
    period_end_date
  )
  ON CONFLICT (student_id, leaderboard_type, period, subject, period_start)
  DO UPDATE SET
    score = leaderboard_entries.score + score_delta,
    rank_tier = calculate_rank_tier(leaderboard_entries.score + score_delta),
    last_updated = now();

  UPDATE leaderboard_entries le
  SET rank_position = subquery.new_rank
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY leaderboard_type, period, subject, period_start
        ORDER BY score DESC, last_updated ASC
      ) as new_rank
    FROM leaderboard_entries
    WHERE leaderboard_type = leaderboard_type_param
    AND period = period_param
    AND (subject IS NULL AND subject_param IS NULL OR subject = subject_param)
    AND period_start = period_start_date
  ) subquery
  WHERE le.id = subquery.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard rankings
CREATE OR REPLACE FUNCTION get_leaderboard_rankings(
  leaderboard_type_param leaderboard_type,
  period_param leaderboard_period,
  subject_param text DEFAULT NULL,
  limit_param integer DEFAULT 100
)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  rank_position integer,
  score integer,
  rank_tier rank_tier,
  questions_answered integer,
  accuracy_percentage numeric,
  streak_days integer,
  school_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    le.student_id,
    s.name as student_name,
    le.rank_position,
    le.score,
    le.rank_tier,
    le.questions_answered,
    le.accuracy_percentage,
    le.streak_days,
    sc.name as school_name
  FROM leaderboard_entries le
  JOIN students s ON s.id = le.student_id
  LEFT JOIN schools sc ON sc.id = s.school_id
  LEFT JOIN student_profiles sp ON sp.student_id = s.id
  WHERE le.leaderboard_type = leaderboard_type_param
  AND le.period = period_param
  AND (subject_param IS NULL OR le.subject = subject_param)
  AND le.period_end > now()
  AND (sp.is_profile_public = true OR s.user_id = auth.uid() OR s.parent_id = auth.uid())
  ORDER BY le.rank_position ASC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's rank
CREATE OR REPLACE FUNCTION get_student_rank(
  student_id_param uuid,
  leaderboard_type_param leaderboard_type,
  period_param leaderboard_period,
  subject_param text DEFAULT NULL
)
RETURNS TABLE (
  rank_position integer,
  score integer,
  rank_tier rank_tier,
  total_participants integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    le.rank_position,
    le.score,
    le.rank_tier,
    (SELECT COUNT(*)::integer 
     FROM leaderboard_entries 
     WHERE leaderboard_type = leaderboard_type_param 
     AND period = period_param
     AND (subject_param IS NULL OR subject = subject_param)
     AND period_end > now()) as total_participants
  FROM leaderboard_entries le
  WHERE le.student_id = student_id_param
  AND le.leaderboard_type = leaderboard_type_param
  AND le.period = period_param
  AND (subject_param IS NULL OR le.subject = subject_param)
  AND le.period_end > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive expired leaderboards
CREATE OR REPLACE FUNCTION archive_expired_leaderboards()
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboard_history (
    student_id,
    leaderboard_type,
    period,
    subject,
    final_rank,
    final_score,
    rank_tier,
    total_participants,
    period_start,
    period_end
  )
  SELECT 
    le.student_id,
    le.leaderboard_type,
    le.period,
    le.subject,
    le.rank_position,
    le.score,
    le.rank_tier,
    (SELECT COUNT(*) FROM leaderboard_entries le2 
     WHERE le2.leaderboard_type = le.leaderboard_type 
     AND le2.period = le.period 
     AND le2.period_start = le.period_start),
    le.period_start,
    le.period_end
  FROM leaderboard_entries le
  WHERE le.period_end < now()
  ON CONFLICT DO NOTHING;

  DELETE FROM leaderboard_entries
  WHERE period_end < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_student
  ON leaderboard_entries(student_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_type_period
  ON leaderboard_entries(leaderboard_type, period, period_start);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank
  ON leaderboard_entries(rank_position, score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_school
  ON leaderboard_entries(school_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_history_student
  ON leaderboard_history(student_id, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_season_progress_student
  ON student_season_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_seasonal_rankings_active
  ON seasonal_rankings(is_active, start_date);

-- Insert current season
INSERT INTO seasonal_rankings (season_name, season_number, start_date, end_date, theme, special_rewards) VALUES
('Temporada de Primavera', 1, '2026-03-01', '2026-05-31', 'spring', '{
  "top_1": {"diamonds": 500, "title": "Campeão da Primavera"},
  "top_3": {"diamonds": 300, "title": "Mestre da Primavera"},
  "top_10": {"diamonds": 150, "badge": "spring_champion"},
  "top_100": {"diamonds": 50, "coins": 5000}
}'::jsonb)
ON CONFLICT (season_number) DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_leaderboard_entry TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_rankings TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_rank TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_rank_tier TO authenticated;
GRANT EXECUTE ON FUNCTION archive_expired_leaderboards TO authenticated;