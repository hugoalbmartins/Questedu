/*
  # Advanced Analytics and Insights System

  1. New Tables
    - `student_analytics` - Aggregated student metrics
    - `learning_sessions` - Individual learning sessions
    - `performance_snapshots` - Time-based performance snapshots
    - `insight_recommendations` - AI-generated insights
    
  2. Features
    - Session tracking
    - Performance analytics
    - Time-based metrics
    - Insight generation
    - Trend analysis
    - Comparative analytics
    
  3. Security
    - RLS for privacy
    - Parent access controls
    - Anonymized comparative data
*/

-- Session Types
DO $$ BEGIN
  CREATE TYPE session_type AS ENUM (
    'quiz',
    'study',
    'practice',
    'battle',
    'exploration'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Insight Types
DO $$ BEGIN
  CREATE TYPE insight_type AS ENUM (
    'strength',
    'weakness',
    'trend',
    'recommendation',
    'achievement',
    'warning'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Learning Sessions
CREATE TABLE IF NOT EXISTS learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_type session_type NOT NULL,
  subject text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  average_time_per_question numeric(5,2),
  xp_earned integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  session_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own sessions"
  ON learning_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = learning_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own sessions"
  ON learning_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = learning_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own sessions"
  ON learning_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = learning_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's sessions"
  ON learning_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = learning_sessions.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Student Analytics (Aggregated)
CREATE TABLE IF NOT EXISTS student_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  period_type text NOT NULL,
  total_study_time_minutes integer DEFAULT 0,
  total_questions_answered integer DEFAULT 0,
  total_correct_answers integer DEFAULT 0,
  overall_accuracy numeric(5,2) DEFAULT 0,
  subjects_studied text[] DEFAULT ARRAY[]::text[],
  strongest_subject text,
  weakest_subject text,
  most_active_day_of_week integer,
  most_active_hour_of_day integer,
  streak_maintained boolean DEFAULT false,
  achievements_unlocked integer DEFAULT 0,
  level_ups integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  battles_won integer DEFAULT 0,
  battles_lost integer DEFAULT 0,
  friends_added integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, period_start, period_type)
);

ALTER TABLE student_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own analytics"
  ON student_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_analytics.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's analytics"
  ON student_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_analytics.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Performance Snapshots
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  coins integer DEFAULT 0,
  diamonds integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  total_achievements integer DEFAULT 0,
  total_friends integer DEFAULT 0,
  global_rank integer,
  school_rank integer,
  subject_proficiencies jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, snapshot_date)
);

ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own snapshots"
  ON performance_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = performance_snapshots.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's snapshots"
  ON performance_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = performance_snapshots.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Insight Recommendations
CREATE TABLE IF NOT EXISTS insight_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  insight_type insight_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority integer DEFAULT 1,
  subject text,
  action_items jsonb DEFAULT '[]'::jsonb,
  supporting_data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  valid_until timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE insight_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own insights"
  ON insight_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = insight_recommendations.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own insights"
  ON insight_recommendations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = insight_recommendations.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's insights"
  ON insight_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = insight_recommendations.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Function to start learning session
CREATE OR REPLACE FUNCTION start_learning_session(
  student_id_param uuid,
  session_type_param session_type,
  subject_param text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  session_id uuid;
BEGIN
  INSERT INTO learning_sessions (
    student_id,
    session_type,
    subject,
    started_at
  ) VALUES (
    student_id_param,
    session_type_param,
    subject_param,
    now()
  ) RETURNING id INTO session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end learning session
CREATE OR REPLACE FUNCTION end_learning_session(
  session_id_param uuid,
  questions_attempted_param integer DEFAULT 0,
  questions_correct_param integer DEFAULT 0,
  xp_earned_param integer DEFAULT 0,
  coins_earned_param integer DEFAULT 0
)
RETURNS jsonb AS $$
DECLARE
  session_record RECORD;
  duration integer;
  avg_time numeric;
BEGIN
  SELECT * INTO session_record
  FROM learning_sessions
  WHERE id = session_id_param;

  IF session_record IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  duration := EXTRACT(EPOCH FROM (now() - session_record.started_at)) / 60;
  
  IF questions_attempted_param > 0 THEN
    avg_time := duration / questions_attempted_param;
  ELSE
    avg_time := 0;
  END IF;

  UPDATE learning_sessions
  SET
    ended_at = now(),
    duration_minutes = duration,
    questions_attempted = questions_attempted_param,
    questions_correct = questions_correct_param,
    average_time_per_question = avg_time,
    xp_earned = xp_earned_param,
    coins_earned = coins_earned_param
  WHERE id = session_id_param;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create daily snapshot
CREATE OR REPLACE FUNCTION create_daily_snapshot(student_id_param uuid)
RETURNS void AS $$
DECLARE
  student_record RECORD;
  total_achievements integer;
  total_friends integer;
  global_rank integer;
  school_rank integer;
BEGIN
  SELECT * INTO student_record FROM students WHERE id = student_id_param;

  SELECT COUNT(*) INTO total_achievements
  FROM student_achievements
  WHERE student_id = student_id_param;

  SELECT COUNT(*) INTO total_friends
  FROM friendships
  WHERE (requester_id = student_id_param OR receiver_id = student_id_param)
  AND status = 'approved';

  SELECT rank_position INTO global_rank
  FROM leaderboard_entries
  WHERE student_id = student_id_param
  AND leaderboard_type = 'global'
  AND period = 'all_time'
  LIMIT 1;

  SELECT rank_position INTO school_rank
  FROM leaderboard_entries
  WHERE student_id = student_id_param
  AND leaderboard_type = 'school'
  AND period = 'all_time'
  LIMIT 1;

  INSERT INTO performance_snapshots (
    student_id,
    snapshot_date,
    total_xp,
    level,
    coins,
    diamonds,
    streak_days,
    total_achievements,
    total_friends,
    global_rank,
    school_rank
  ) VALUES (
    student_id_param,
    CURRENT_DATE,
    student_record.xp,
    (student_record.xp / 1000 + 1),
    student_record.coins,
    student_record.diamonds,
    COALESCE(student_record.streak, 0),
    total_achievements,
    total_friends,
    global_rank,
    school_rank
  )
  ON CONFLICT (student_id, snapshot_date)
  DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    level = EXCLUDED.level,
    coins = EXCLUDED.coins,
    diamonds = EXCLUDED.diamonds,
    streak_days = EXCLUDED.streak_days,
    total_achievements = EXCLUDED.total_achievements,
    total_friends = EXCLUDED.total_friends,
    global_rank = EXCLUDED.global_rank,
    school_rank = EXCLUDED.school_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate weekly analytics
CREATE OR REPLACE FUNCTION generate_weekly_analytics(student_id_param uuid)
RETURNS void AS $$
DECLARE
  week_start timestamptz;
  week_end timestamptz;
  analytics_data RECORD;
BEGIN
  week_start := date_trunc('week', now());
  week_end := week_start + interval '1 week';

  SELECT
    COALESCE(SUM(duration_minutes), 0) as total_time,
    COALESCE(SUM(questions_attempted), 0) as total_questions,
    COALESCE(SUM(questions_correct), 0) as total_correct,
    CASE 
      WHEN SUM(questions_attempted) > 0 
      THEN (SUM(questions_correct)::numeric / SUM(questions_attempted) * 100)
      ELSE 0 
    END as accuracy,
    array_agg(DISTINCT subject) FILTER (WHERE subject IS NOT NULL) as subjects,
    COALESCE(SUM(xp_earned), 0) as xp,
    COALESCE(SUM(coins_earned), 0) as coins
  INTO analytics_data
  FROM learning_sessions
  WHERE student_id = student_id_param
  AND started_at >= week_start
  AND started_at < week_end;

  INSERT INTO student_analytics (
    student_id,
    period_start,
    period_end,
    period_type,
    total_study_time_minutes,
    total_questions_answered,
    total_correct_answers,
    overall_accuracy,
    subjects_studied,
    xp_earned,
    coins_earned
  ) VALUES (
    student_id_param,
    week_start,
    week_end,
    'weekly',
    analytics_data.total_time,
    analytics_data.total_questions,
    analytics_data.total_correct,
    analytics_data.accuracy,
    COALESCE(analytics_data.subjects, ARRAY[]::text[]),
    analytics_data.xp,
    analytics_data.coins
  )
  ON CONFLICT (student_id, period_start, period_type)
  DO UPDATE SET
    total_study_time_minutes = EXCLUDED.total_study_time_minutes,
    total_questions_answered = EXCLUDED.total_questions_answered,
    total_correct_answers = EXCLUDED.total_correct_answers,
    overall_accuracy = EXCLUDED.overall_accuracy,
    subjects_studied = EXCLUDED.subjects_studied,
    xp_earned = EXCLUDED.xp_earned,
    coins_earned = EXCLUDED.coins_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate insights
CREATE OR REPLACE FUNCTION generate_student_insights(student_id_param uuid)
RETURNS jsonb[] AS $$
DECLARE
  insights jsonb[] := ARRAY[]::jsonb[];
  student_record RECORD;
  weekly_stats RECORD;
  subject_stats RECORD;
BEGIN
  SELECT * INTO student_record FROM students WHERE id = student_id_param;

  SELECT * INTO weekly_stats
  FROM student_analytics
  WHERE student_id = student_id_param
  AND period_type = 'weekly'
  ORDER BY period_start DESC
  LIMIT 1;

  IF weekly_stats.overall_accuracy >= 90 THEN
    INSERT INTO insight_recommendations (
      student_id,
      insight_type,
      title,
      description,
      priority
    ) VALUES (
      student_id_param,
      'strength',
      'Excelente Precisão!',
      format('Mantiveste %s%% de precisão esta semana. Continua assim!', 
        ROUND(weekly_stats.overall_accuracy)),
      1
    )
    ON CONFLICT DO NOTHING;
  ELSIF weekly_stats.overall_accuracy < 60 THEN
    INSERT INTO insight_recommendations (
      student_id,
      insight_type,
      title,
      description,
      priority
    ) VALUES (
      student_id_param,
      'recommendation',
      'Foca na Revisão',
      'A tua precisão está abaixo do esperado. Experimenta rever a matéria antes de responder.',
      2
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF COALESCE(student_record.streak, 0) >= 7 THEN
    INSERT INTO insight_recommendations (
      student_id,
      insight_type,
      title,
      description,
      priority
    ) VALUES (
      student_id_param,
      'achievement',
      format('Sequência de %s Dias!', student_record.streak),
      'Estás numa ótima sequência! Não te esqueças de jogar amanhã.',
      1
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF weekly_stats.total_study_time_minutes < 60 THEN
    INSERT INTO insight_recommendations (
      student_id,
      insight_type,
      title,
      description,
      priority
    ) VALUES (
      student_id_param,
      'warning',
      'Pouco Tempo de Estudo',
      'Estudaste menos de 1 hora esta semana. Tenta dedicar mais tempo!',
      3
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student progress over time
CREATE OR REPLACE FUNCTION get_student_progress_timeline(
  student_id_param uuid,
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  xp integer,
  level integer,
  coins integer,
  streak_days integer,
  global_rank integer,
  achievements integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.snapshot_date as date,
    ps.total_xp as xp,
    ps.level,
    ps.coins,
    ps.streak_days,
    ps.global_rank,
    ps.total_achievements as achievements
  FROM performance_snapshots ps
  WHERE ps.student_id = student_id_param
  AND ps.snapshot_date >= CURRENT_DATE - days_back
  ORDER BY ps.snapshot_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comparative analytics
CREATE OR REPLACE FUNCTION get_comparative_analytics(
  student_id_param uuid,
  school_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  student_stats RECORD;
  school_avg RECORD;
  result jsonb;
BEGIN
  SELECT
    s.xp,
    (s.xp / 1000 + 1) as level,
    COALESCE(s.streak, 0) as streak,
    COUNT(DISTINCT sa.id) as achievements
  INTO student_stats
  FROM students s
  LEFT JOIN student_achievements sa ON sa.student_id = s.id
  WHERE s.id = student_id_param
  GROUP BY s.id;

  SELECT
    AVG(s.xp) as avg_xp,
    AVG(s.xp / 1000 + 1) as avg_level,
    AVG(COALESCE(s.streak, 0)) as avg_streak,
    AVG(achievement_count) as avg_achievements
  INTO school_avg
  FROM students s
  LEFT JOIN (
    SELECT student_id, COUNT(*) as achievement_count
    FROM student_achievements
    GROUP BY student_id
  ) sa ON sa.student_id = s.id
  WHERE s.school_id = school_id_param;

  result := jsonb_build_object(
    'student', jsonb_build_object(
      'xp', student_stats.xp,
      'level', student_stats.level,
      'streak', student_stats.streak,
      'achievements', student_stats.achievements
    ),
    'school_average', jsonb_build_object(
      'xp', ROUND(school_avg.avg_xp),
      'level', ROUND(school_avg.avg_level),
      'streak', ROUND(school_avg.avg_streak),
      'achievements', ROUND(school_avg.avg_achievements)
    ),
    'comparison', jsonb_build_object(
      'xp_percentile', 
        CASE WHEN school_avg.avg_xp > 0 
        THEN ROUND((student_stats.xp::numeric / school_avg.avg_xp) * 100) 
        ELSE 100 END,
      'above_average', student_stats.xp > school_avg.avg_xp
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_sessions_student
  ON learning_sessions(student_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_type
  ON learning_sessions(session_type, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_analytics_student
  ON student_analytics(student_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_performance_snapshots_student
  ON performance_snapshots(student_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_insight_recommendations_student
  ON insight_recommendations(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insight_recommendations_unread
  ON insight_recommendations(student_id, is_read, is_dismissed);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_learning_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_learning_session TO authenticated;
GRANT EXECUTE ON FUNCTION create_daily_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION generate_weekly_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION generate_student_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_progress_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_comparative_analytics TO authenticated;