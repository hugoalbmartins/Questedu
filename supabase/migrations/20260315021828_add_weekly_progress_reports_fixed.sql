/*
  # Weekly Progress Reports System

  1. New Tables
    - `progress_reports` - Store generated reports
    - `parent_notification_preferences` - Control what parents receive
    
  2. Functions
    - Generate weekly report for student
    - Calculate weekly metrics
    
  3. Security
    - RLS for parents to view their children's reports
*/

-- Parent Notification Preferences Table
CREATE TABLE IF NOT EXISTS parent_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_report_enabled boolean DEFAULT true,
  monthly_report_enabled boolean DEFAULT true,
  achievement_alerts boolean DEFAULT true,
  low_performance_alerts boolean DEFAULT true,
  streak_reminders boolean DEFAULT true,
  email_delivery_day integer DEFAULT 0,
  preferred_delivery_time time DEFAULT '18:00:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(parent_user_id)
);

ALTER TABLE parent_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own notification preferences"
  ON parent_notification_preferences FOR ALL
  TO authenticated
  USING (parent_user_id = auth.uid());

-- Progress Reports Table
CREATE TABLE IF NOT EXISTS progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  report_type text NOT NULL DEFAULT 'weekly',
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  accuracy_percentage numeric DEFAULT 0,
  total_playtime_minutes integer DEFAULT 0,
  quizzes_completed integer DEFAULT 0,
  days_active integer DEFAULT 0,
  subjects_practiced jsonb DEFAULT '{}',
  achievements_unlocked integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  level_ups integer DEFAULT 0,
  buildings_built integer DEFAULT 0,
  top_subject text,
  weakest_subject text,
  improvement_areas text[],
  notable_achievements text[],
  parent_message text,
  generated_at timestamptz DEFAULT now(),
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz
);

ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view children's progress reports"
  ON progress_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = progress_reports.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own progress reports"
  ON progress_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = progress_reports.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create progress reports"
  ON progress_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate weekly progress report
CREATE OR REPLACE FUNCTION generate_weekly_progress_report(
  student_id_param uuid,
  week_start_param timestamptz DEFAULT (now() - interval '7 days'),
  week_end_param timestamptz DEFAULT now()
)
RETURNS uuid AS $$
DECLARE
  report_id uuid;
  student_record RECORD;
  quiz_stats RECORD;
  subject_stats jsonb;
  top_subj text;
  weak_subj text;
  improvements text[];
  achievements text[];
  parent_msg text;
BEGIN
  SELECT * INTO student_record
  FROM students
  WHERE id = student_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  SELECT
    COUNT(DISTINCT qh.id) as total_answered,
    SUM(CASE WHEN qh.answered_correctly THEN 1 ELSE 0 END) as correct,
    COUNT(DISTINCT DATE(qh.answered_at)) as days_active
  INTO quiz_stats
  FROM quiz_history qh
  WHERE qh.student_id = student_id_param
  AND qh.answered_at BETWEEN week_start_param AND week_end_param;

  SELECT jsonb_object_agg(
    subject,
    jsonb_build_object(
      'total', COUNT(*),
      'correct', SUM(CASE WHEN answered_correctly THEN 1 ELSE 0 END),
      'accuracy', ROUND((SUM(CASE WHEN answered_correctly THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 1)
    )
  ) INTO subject_stats
  FROM quiz_history qh
  JOIN questions q ON q.id = qh.question_id
  WHERE qh.student_id = student_id_param
  AND qh.answered_at BETWEEN week_start_param AND week_end_param
  GROUP BY subject;

  SELECT subject INTO top_subj
  FROM (
    SELECT 
      q.subject::text,
      AVG(CASE WHEN qh.answered_correctly THEN 100.0 ELSE 0.0 END) as avg_accuracy
    FROM quiz_history qh
    JOIN questions q ON q.id = qh.question_id
    WHERE qh.student_id = student_id_param
    AND qh.answered_at BETWEEN week_start_param AND week_end_param
    GROUP BY q.subject
    ORDER BY avg_accuracy DESC
    LIMIT 1
  ) t;

  SELECT subject INTO weak_subj
  FROM (
    SELECT 
      q.subject::text,
      AVG(CASE WHEN qh.answered_correctly THEN 100.0 ELSE 0.0 END) as avg_accuracy
    FROM quiz_history qh
    JOIN questions q ON q.id = qh.question_id
    WHERE qh.student_id = student_id_param
    AND qh.answered_at BETWEEN week_start_param AND week_end_param
    GROUP BY q.subject
    ORDER BY avg_accuracy ASC
    LIMIT 1
  ) t;

  improvements := ARRAY[]::text[];
  IF quiz_stats.total_answered < 20 THEN
    improvements := array_append(improvements, 'Praticar mais regularmente');
  END IF;
  
  IF weak_subj IS NOT NULL THEN
    improvements := array_append(improvements, 'Focar em ' || weak_subj);
  END IF;

  achievements := ARRAY[]::text[];
  IF quiz_stats.days_active >= 6 THEN
    achievements := array_append(achievements, 'Estudou quase todos os dias!');
  END IF;
  
  IF (quiz_stats.correct::numeric / NULLIF(quiz_stats.total_answered, 0)) >= 0.8 THEN
    achievements := array_append(achievements, 'Excelente precisão acima de 80%!');
  END IF;

  parent_msg := format(
    'Esta semana, %s respondeu a %s perguntas com %s%% de precisão. %s',
    student_record.display_name,
    COALESCE(quiz_stats.total_answered, 0),
    ROUND((quiz_stats.correct::numeric / NULLIF(quiz_stats.total_answered, 0)) * 100, 0),
    CASE 
      WHEN quiz_stats.days_active >= 5 THEN 'Manteve uma rotina de estudo consistente!'
      WHEN quiz_stats.days_active >= 3 THEN 'Praticou alguns dias. Tenta aumentar a frequência!'
      ELSE 'Precisa de mais prática regular.'
    END
  );

  INSERT INTO progress_reports (
    student_id,
    report_type,
    period_start,
    period_end,
    total_questions_answered,
    correct_answers,
    accuracy_percentage,
    days_active,
    subjects_practiced,
    top_subject,
    weakest_subject,
    improvement_areas,
    notable_achievements,
    parent_message
  ) VALUES (
    student_id_param,
    'weekly',
    week_start_param,
    week_end_param,
    COALESCE(quiz_stats.total_answered, 0),
    COALESCE(quiz_stats.correct, 0),
    ROUND((quiz_stats.correct::numeric / NULLIF(quiz_stats.total_answered, 0)) * 100, 1),
    COALESCE(quiz_stats.days_active, 0),
    COALESCE(subject_stats, '{}'::jsonb),
    top_subj,
    weak_subj,
    improvements,
    achievements,
    parent_msg
  ) RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students needing weekly reports
CREATE OR REPLACE FUNCTION get_students_for_weekly_reports()
RETURNS TABLE (
  student_id uuid,
  student_name text,
  parent_email text,
  parent_user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.display_name,
    u.email,
    s.parent_id
  FROM students s
  JOIN auth.users u ON u.id = s.parent_id
  LEFT JOIN parent_notification_preferences pnp ON pnp.parent_user_id = s.parent_id
  WHERE 
    EXTRACT(DOW FROM now()) = COALESCE(pnp.email_delivery_day, 0)
    AND (pnp.weekly_report_enabled IS NULL OR pnp.weekly_report_enabled = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_progress_reports_student
  ON progress_reports(student_id);

CREATE INDEX IF NOT EXISTS idx_progress_reports_period
  ON progress_reports(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_progress_reports_type
  ON progress_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_parent_notification_preferences_parent
  ON parent_notification_preferences(parent_user_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_weekly_progress_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_for_weekly_reports TO authenticated;