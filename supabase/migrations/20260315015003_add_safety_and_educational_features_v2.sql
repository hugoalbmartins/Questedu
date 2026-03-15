/*
  # Safety and Educational Features Enhancement

  1. New Tables
    - `message_reports` - Store user reports of inappropriate messages
    - `profanity_list` - Configurable list of inappropriate words
    - `chat_violations` - Log of detected profanity/violations
    - `error_notebook` - Store wrong answers for review
    - `student_progress_analytics` - Detailed progress tracking
    - `chat_rate_limits` - Track message frequency per user

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
    - Add admin-only policies for moderation tables

  3. Indexes
    - Add indexes for common queries
*/

-- Create enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'action_taken', 'dismissed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profanity_severity') THEN
    CREATE TYPE profanity_severity AS ENUM ('low', 'medium', 'high', 'extreme');
  END IF;
END $$;

-- Message Reports Table
CREATE TABLE IF NOT EXISTS message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reported_message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  reported_user_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status report_status DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create reports"
  ON message_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = reporter_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reports"
  ON message_reports FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update reports"
  ON message_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Profanity List Table
CREATE TABLE IF NOT EXISTS profanity_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text UNIQUE NOT NULL,
  severity profanity_severity DEFAULT 'medium',
  language text DEFAULT 'pt',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profanity_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage profanity list"
  ON profanity_list FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Insert common Portuguese profanity (initial list - admins can extend)
INSERT INTO profanity_list (word, severity, language) VALUES
  ('idiota', 'low', 'pt'),
  ('estúpido', 'low', 'pt'),
  ('estupido', 'low', 'pt'),
  ('burro', 'low', 'pt'),
  ('parvo', 'low', 'pt'),
  ('tonto', 'low', 'pt'),
  ('imbecil', 'medium', 'pt'),
  ('cretino', 'medium', 'pt'),
  ('palhaço', 'low', 'pt'),
  ('palhaco', 'low', 'pt'),
  ('nabo', 'low', 'pt'),
  ('mongo', 'medium', 'pt'),
  ('otário', 'medium', 'pt'),
  ('otario', 'medium', 'pt')
ON CONFLICT (word) DO NOTHING;

-- Chat Violations Log
CREATE TABLE IF NOT EXISTS chat_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  violation_type text NOT NULL,
  severity text NOT NULL,
  detected_words text[] DEFAULT '{}',
  action_taken text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view violations"
  ON chat_violations FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Parents view their children violations"
  ON chat_violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = chat_violations.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Error Notebook Table
CREATE TABLE IF NOT EXISTS error_notebook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_answer text NOT NULL,
  correct_answer text NOT NULL,
  subject text NOT NULL,
  school_year integer NOT NULL,
  reviewed boolean DEFAULT false,
  mastered boolean DEFAULT false,
  review_count integer DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_notebook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own error notebook"
  ON error_notebook FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = error_notebook.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students insert to own error notebook"
  ON error_notebook FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students update own error notebook"
  ON error_notebook FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = error_notebook.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents view children error notebook"
  ON error_notebook FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = error_notebook.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Student Progress Analytics Table
CREATE TABLE IF NOT EXISTS student_progress_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  portuguese_correct integer DEFAULT 0,
  portuguese_total integer DEFAULT 0,
  math_correct integer DEFAULT 0,
  math_total integer DEFAULT 0,
  science_correct integer DEFAULT 0,
  science_total integer DEFAULT 0,
  english_correct integer DEFAULT 0,
  english_total integer DEFAULT 0,
  average_time_per_question integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  last_quiz_date timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_progress_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own analytics"
  ON student_progress_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_progress_analytics.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students update own analytics"
  ON student_progress_analytics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_progress_analytics.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students insert own analytics"
  ON student_progress_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents view children analytics"
  ON student_progress_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_progress_analytics.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Initialize analytics for existing students
INSERT INTO student_progress_analytics (student_id)
SELECT id FROM students
ON CONFLICT (student_id) DO NOTHING;

-- Chat Rate Limits Table
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, window_start)
);

ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own rate limits"
  ON chat_rate_limits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = chat_rate_limits.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Add explanation column to questions table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'explanation'
  ) THEN
    ALTER TABLE questions ADD COLUMN explanation text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_message_reports_reporter ON message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_user ON message_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_violations_student ON chat_violations(student_id);
CREATE INDEX IF NOT EXISTS idx_error_notebook_student ON error_notebook(student_id, reviewed);
CREATE INDEX IF NOT EXISTS idx_error_notebook_subject ON error_notebook(student_id, subject);
CREATE INDEX IF NOT EXISTS idx_progress_analytics_student ON student_progress_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_student ON chat_rate_limits(student_id, window_start);

-- Function to check chat rate limit (10 messages per minute)
CREATE OR REPLACE FUNCTION check_chat_rate_limit(p_student_id uuid)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  window_start := date_trunc('minute', now());
  
  SELECT message_count INTO current_count
  FROM chat_rate_limits
  WHERE student_id = p_student_id 
  AND chat_rate_limits.window_start = check_chat_rate_limit.window_start;
  
  IF current_count IS NULL THEN
    INSERT INTO chat_rate_limits (student_id, message_count, window_start)
    VALUES (p_student_id, 1, window_start);
    RETURN true;
  ELSIF current_count < 10 THEN
    UPDATE chat_rate_limits
    SET message_count = message_count + 1
    WHERE student_id = p_student_id AND chat_rate_limits.window_start = check_chat_rate_limit.window_start;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check profanity in message
CREATE OR REPLACE FUNCTION check_message_profanity(message_text text)
RETURNS TABLE(has_profanity boolean, detected_words text[], max_severity profanity_severity) AS $$
DECLARE
  word_record record;
  found_words text[] := '{}';
  highest_severity profanity_severity := 'low';
BEGIN
  FOR word_record IN 
    SELECT word, severity 
    FROM profanity_list 
    WHERE message_text ILIKE '%' || word || '%'
  LOOP
    found_words := array_append(found_words, word_record.word);
    IF word_record.severity > highest_severity THEN
      highest_severity := word_record.severity;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    array_length(found_words, 1) > 0,
    found_words,
    highest_severity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;