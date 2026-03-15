/*
  # Streak Bonuses and Analytics Dashboard System

  1. New Tables
    - `streak_bonuses` - Bonus rewards for maintaining streaks
    - `streak_bonus_claims` - Track claimed bonuses
    - `daily_analytics` - Daily aggregated analytics
    
  2. New Views
    - `student_analytics_summary` - Comprehensive analytics view
    
  3. Functions
    - Calculate and award streak bonuses
    - Generate analytics data
    - Get performance trends
    
  4. Security
    - RLS for students and parents
*/

-- Streak Bonuses Configuration Table
CREATE TABLE IF NOT EXISTS streak_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streak_days integer UNIQUE NOT NULL,
  bonus_coins integer DEFAULT 0,
  bonus_diamonds integer DEFAULT 0,
  bonus_xp integer DEFAULT 0,
  bonus_multiplier numeric DEFAULT 1.0,
  special_reward_type text,
  special_reward_value integer DEFAULT 0,
  title text NOT NULL,
  description text,
  icon text DEFAULT '🔥',
  is_milestone boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE streak_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streak bonuses"
  ON streak_bonuses FOR SELECT
  TO authenticated
  USING (true);

-- Streak Bonus Claims Table
CREATE TABLE IF NOT EXISTS streak_bonus_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  bonus_id uuid NOT NULL REFERENCES streak_bonuses(id) ON DELETE CASCADE,
  streak_days integer NOT NULL,
  coins_earned integer DEFAULT 0,
  diamonds_earned integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  claimed_at timestamptz DEFAULT now(),
  UNIQUE(student_id, bonus_id)
);

ALTER TABLE streak_bonus_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own bonus claims"
  ON streak_bonus_claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = streak_bonus_claims.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Daily Analytics Table
CREATE TABLE IF NOT EXISTS daily_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  accuracy_percentage numeric DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  quizzes_completed integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  diamonds_earned integer DEFAULT 0,
  xp_gained integer DEFAULT 0,
  buildings_built integer DEFAULT 0,
  badges_earned integer DEFAULT 0,
  streak_day integer DEFAULT 0,
  subject_breakdown jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own analytics"
  ON daily_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = daily_analytics.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's analytics"
  ON daily_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = daily_analytics.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "System can manage analytics"
  ON daily_analytics FOR ALL
  TO authenticated
  USING (true);

-- Insert default streak bonuses
INSERT INTO streak_bonuses (streak_days, bonus_coins, bonus_diamonds, bonus_xp, bonus_multiplier, title, description, icon, is_milestone) VALUES
(1, 10, 0, 25, 1.0, 'Primeiro Dia', 'Começaste bem!', '🌟', false),
(3, 50, 5, 100, 1.1, 'Três Dias Seguidos', 'Bónus de consistência!', '🔥', true),
(5, 100, 10, 200, 1.15, 'Cinco Dias', 'Continua assim!', '⭐', false),
(7, 200, 20, 400, 1.2, 'Uma Semana', 'Impressionante!', '🏆', true),
(10, 300, 30, 600, 1.25, 'Dez Dias', 'Dedicação notável!', '💎', false),
(14, 500, 50, 1000, 1.3, 'Duas Semanas', 'Quase imparável!', '👑', true),
(21, 800, 80, 1500, 1.4, 'Três Semanas', 'Lendário!', '🌠', true),
(30, 1500, 150, 3000, 1.5, 'Um Mês', 'Mestre da Disciplina!', '🎖️', true),
(60, 3000, 300, 6000, 1.75, 'Dois Meses', 'Extraordinário!', '🔱', true),
(90, 5000, 500, 10000, 2.0, 'Três Meses', 'Imortal!', '⚡', true)
ON CONFLICT (streak_days) DO NOTHING;

-- Function to check and award streak bonuses
CREATE OR REPLACE FUNCTION check_and_award_streak_bonuses(student_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  current_streak integer;
  bonus_record RECORD;
  rewards jsonb := '{"awarded": [], "total_coins": 0, "total_diamonds": 0, "total_xp": 0}'::jsonb;
  total_coins integer := 0;
  total_diamonds integer := 0;
  total_xp integer := 0;
  awarded_bonuses jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO current_streak
  FROM quiz_streaks
  WHERE student_id = student_id_param;

  IF current_streak = 0 THEN
    RETURN rewards;
  END IF;

  FOR bonus_record IN
    SELECT *
    FROM streak_bonuses
    WHERE streak_days <= current_streak
    AND NOT EXISTS (
      SELECT 1 FROM streak_bonus_claims
      WHERE student_id = student_id_param
      AND bonus_id = bonus_record.id
    )
    ORDER BY streak_days ASC
  LOOP
    INSERT INTO streak_bonus_claims (
      student_id,
      bonus_id,
      streak_days,
      coins_earned,
      diamonds_earned,
      xp_earned
    ) VALUES (
      student_id_param,
      bonus_record.id,
      bonus_record.streak_days,
      bonus_record.bonus_coins,
      bonus_record.bonus_diamonds,
      bonus_record.bonus_xp
    );

    UPDATE students
    SET
      coins = coins + bonus_record.bonus_coins,
      diamonds = diamonds + bonus_record.bonus_diamonds,
      xp = xp + bonus_record.bonus_xp
    WHERE id = student_id_param;

    total_coins := total_coins + bonus_record.bonus_coins;
    total_diamonds := total_diamonds + bonus_record.bonus_diamonds;
    total_xp := total_xp + bonus_record.bonus_xp;

    awarded_bonuses := awarded_bonuses || jsonb_build_object(
      'streak_days', bonus_record.streak_days,
      'title', bonus_record.title,
      'coins', bonus_record.bonus_coins,
      'diamonds', bonus_record.bonus_diamonds,
      'xp', bonus_record.bonus_xp,
      'icon', bonus_record.icon
    );
  END LOOP;

  rewards := jsonb_build_object(
    'awarded', awarded_bonuses,
    'total_coins', total_coins,
    'total_diamonds', total_diamonds,
    'total_xp', total_xp
  );

  RETURN rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record daily analytics
CREATE OR REPLACE FUNCTION record_daily_analytics(student_id_param uuid)
RETURNS void AS $$
DECLARE
  today date := CURRENT_DATE;
  stats RECORD;
  subject_data jsonb;
BEGIN
  SELECT
    COUNT(*) as questions,
    SUM(CASE WHEN answered_correctly THEN 1 ELSE 0 END) as correct,
    ROUND((SUM(CASE WHEN answered_correctly THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 1) as accuracy
  INTO stats
  FROM quiz_history
  WHERE student_id = student_id_param
  AND DATE(answered_at) = today;

  SELECT jsonb_object_agg(
    subject,
    jsonb_build_object(
      'questions', COUNT(*),
      'correct', SUM(CASE WHEN answered_correctly THEN 1 ELSE 0 END)
    )
  ) INTO subject_data
  FROM quiz_history qh
  JOIN questions q ON q.id = qh.question_id
  WHERE qh.student_id = student_id_param
  AND DATE(qh.answered_at) = today
  GROUP BY subject;

  INSERT INTO daily_analytics (
    student_id,
    date,
    questions_answered,
    correct_answers,
    accuracy_percentage,
    subject_breakdown
  ) VALUES (
    student_id_param,
    today,
    COALESCE(stats.questions, 0),
    COALESCE(stats.correct, 0),
    COALESCE(stats.accuracy, 0),
    COALESCE(subject_data, '{}'::jsonb)
  )
  ON CONFLICT (student_id, date)
  DO UPDATE SET
    questions_answered = EXCLUDED.questions_answered,
    correct_answers = EXCLUDED.correct_answers,
    accuracy_percentage = EXCLUDED.accuracy_percentage,
    subject_breakdown = EXCLUDED.subject_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance trends
CREATE OR REPLACE FUNCTION get_performance_trends(
  student_id_param uuid,
  days_param integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  questions integer,
  accuracy numeric,
  coins integer,
  xp integer,
  streak integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    da.date,
    da.questions_answered,
    da.accuracy_percentage,
    da.coins_earned,
    da.xp_gained,
    da.streak_day
  FROM daily_analytics da
  WHERE da.student_id = student_id_param
  AND da.date >= CURRENT_DATE - days_param
  ORDER BY da.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subject performance comparison
CREATE OR REPLACE FUNCTION get_subject_comparison(student_id_param uuid)
RETURNS TABLE (
  subject text,
  total_questions integer,
  correct_answers integer,
  accuracy numeric,
  recent_accuracy numeric,
  trend text
) AS $$
BEGIN
  RETURN QUERY
  WITH overall_stats AS (
    SELECT
      q.subject::text,
      COUNT(*) as total,
      SUM(CASE WHEN qh.answered_correctly THEN 1 ELSE 0 END) as correct,
      ROUND((SUM(CASE WHEN qh.answered_correctly THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 1) as acc
    FROM quiz_history qh
    JOIN questions q ON q.id = qh.question_id
    WHERE qh.student_id = student_id_param
    GROUP BY q.subject
  ),
  recent_stats AS (
    SELECT
      q.subject::text,
      ROUND((SUM(CASE WHEN qh.answered_correctly THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 1) as recent_acc
    FROM quiz_history qh
    JOIN questions q ON q.id = qh.question_id
    WHERE qh.student_id = student_id_param
    AND qh.answered_at >= NOW() - INTERVAL '7 days'
    GROUP BY q.subject
  )
  SELECT
    os.subject,
    os.total::integer,
    os.correct::integer,
    os.acc,
    COALESCE(rs.recent_acc, os.acc),
    CASE
      WHEN COALESCE(rs.recent_acc, os.acc) > os.acc + 5 THEN 'improving'
      WHEN COALESCE(rs.recent_acc, os.acc) < os.acc - 5 THEN 'declining'
      ELSE 'stable'
    END
  FROM overall_stats os
  LEFT JOIN recent_stats rs ON rs.subject = os.subject;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_streak_bonus_claims_student
  ON streak_bonus_claims(student_id);

CREATE INDEX IF NOT EXISTS idx_streak_bonus_claims_bonus
  ON streak_bonus_claims(bonus_id);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_student
  ON daily_analytics(student_id);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date
  ON daily_analytics(date);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_student_date
  ON daily_analytics(student_id, date);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_award_streak_bonuses TO authenticated;
GRANT EXECUTE ON FUNCTION record_daily_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_subject_comparison TO authenticated;