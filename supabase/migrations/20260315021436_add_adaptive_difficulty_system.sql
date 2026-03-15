/*
  # Adaptive Difficulty System

  1. New Tables
    - `student_subject_levels` - Track student proficiency per subject
    - `question_difficulty_tracking` - Track question difficulty and success rates
    
  2. Modifications
    - Add columns to track performance metrics
    
  3. Functions
    - Calculate recommended difficulty
    - Update proficiency based on performance
    
  4. Security
    - RLS policies for student access
*/

-- Student Subject Levels Table
CREATE TABLE IF NOT EXISTS student_subject_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  current_level integer DEFAULT 1,
  total_questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  accuracy_percentage numeric DEFAULT 0,
  recent_performance numeric DEFAULT 0,
  level_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject)
);

ALTER TABLE student_subject_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own subject levels"
  ON student_subject_levels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_subject_levels.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own subject levels"
  ON student_subject_levels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_subject_levels.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Question Difficulty Tracking Table
CREATE TABLE IF NOT EXISTS question_difficulty_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  times_answered integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  success_rate numeric DEFAULT 0,
  average_time_seconds numeric DEFAULT 0,
  difficulty_rating integer DEFAULT 1,
  last_calibrated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_id)
);

ALTER TABLE question_difficulty_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view question difficulty"
  ON question_difficulty_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update question difficulty"
  ON question_difficulty_tracking FOR ALL
  TO authenticated
  USING (true);

-- Function to get recommended difficulty for student
CREATE OR REPLACE FUNCTION get_recommended_difficulty(
  student_id_param uuid,
  subject_param text
)
RETURNS integer AS $$
DECLARE
  current_level integer;
  recent_performance numeric;
  recommended_difficulty integer;
BEGIN
  SELECT 
    COALESCE(current_level, 1),
    COALESCE(recent_performance, 0.5)
  INTO current_level, recent_performance
  FROM student_subject_levels
  WHERE student_id = student_id_param
  AND subject = subject_param;

  IF NOT FOUND THEN
    RETURN 1;
  END IF;

  IF recent_performance >= 0.85 THEN
    recommended_difficulty := LEAST(current_level + 1, 5);
  ELSIF recent_performance >= 0.70 THEN
    recommended_difficulty := current_level;
  ELSE
    recommended_difficulty := GREATEST(current_level - 1, 1);
  END IF;

  RETURN recommended_difficulty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update student proficiency
CREATE OR REPLACE FUNCTION update_student_proficiency(
  student_id_param uuid,
  subject_param text,
  answered_correctly boolean,
  question_difficulty integer DEFAULT 1
)
RETURNS void AS $$
DECLARE
  current_record RECORD;
  new_level integer;
  performance_weight numeric := 0.2;
  new_recent_performance numeric;
BEGIN
  SELECT * INTO current_record
  FROM student_subject_levels
  WHERE student_id = student_id_param
  AND subject = subject_param
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO student_subject_levels (
      student_id,
      subject,
      current_level,
      total_questions_answered,
      correct_answers,
      accuracy_percentage,
      recent_performance
    ) VALUES (
      student_id_param,
      subject_param,
      1,
      1,
      CASE WHEN answered_correctly THEN 1 ELSE 0 END,
      CASE WHEN answered_correctly THEN 100 ELSE 0 END,
      CASE WHEN answered_correctly THEN 1.0 ELSE 0.0 END
    );
    RETURN;
  END IF;

  new_recent_performance := (
    current_record.recent_performance * (1 - performance_weight) +
    (CASE WHEN answered_correctly THEN 1.0 ELSE 0.0 END) * performance_weight
  );

  IF new_recent_performance >= 0.85 AND current_record.total_questions_answered >= 5 THEN
    new_level := LEAST(current_record.current_level + 1, 5);
  ELSIF new_recent_performance < 0.60 AND current_record.total_questions_answered >= 5 THEN
    new_level := GREATEST(current_record.current_level - 1, 1);
  ELSE
    new_level := current_record.current_level;
  END IF;

  UPDATE student_subject_levels
  SET
    total_questions_answered = current_record.total_questions_answered + 1,
    correct_answers = current_record.correct_answers + CASE WHEN answered_correctly THEN 1 ELSE 0 END,
    accuracy_percentage = (
      (current_record.correct_answers + CASE WHEN answered_correctly THEN 1 ELSE 0 END)::numeric /
      (current_record.total_questions_answered + 1)::numeric * 100
    ),
    recent_performance = new_recent_performance,
    current_level = new_level,
    level_updated_at = CASE WHEN new_level != current_record.current_level THEN now() ELSE level_updated_at END,
    updated_at = now()
  WHERE student_id = student_id_param
  AND subject = subject_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update question difficulty tracking
CREATE OR REPLACE FUNCTION update_question_difficulty(
  question_id_param uuid,
  answered_correctly boolean,
  time_taken_seconds integer DEFAULT 30
)
RETURNS void AS $$
DECLARE
  current_record RECORD;
  new_difficulty integer;
BEGIN
  SELECT * INTO current_record
  FROM question_difficulty_tracking
  WHERE question_id = question_id_param
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO question_difficulty_tracking (
      question_id,
      times_answered,
      times_correct,
      success_rate,
      average_time_seconds,
      difficulty_rating
    ) VALUES (
      question_id_param,
      1,
      CASE WHEN answered_correctly THEN 1 ELSE 0 END,
      CASE WHEN answered_correctly THEN 100 ELSE 0 END,
      time_taken_seconds,
      1
    );
    RETURN;
  END IF;

  new_difficulty := current_record.difficulty_rating;

  IF current_record.times_answered >= 10 THEN
    IF current_record.success_rate > 85 THEN
      new_difficulty := LEAST(current_record.difficulty_rating + 1, 5);
    ELSIF current_record.success_rate < 40 THEN
      new_difficulty := GREATEST(current_record.difficulty_rating - 1, 1);
    END IF;
  END IF;

  UPDATE question_difficulty_tracking
  SET
    times_answered = current_record.times_answered + 1,
    times_correct = current_record.times_correct + CASE WHEN answered_correctly THEN 1 ELSE 0 END,
    success_rate = (
      (current_record.times_correct + CASE WHEN answered_correctly THEN 1 ELSE 0 END)::numeric /
      (current_record.times_answered + 1)::numeric * 100
    ),
    average_time_seconds = (
      (current_record.average_time_seconds * current_record.times_answered + time_taken_seconds) /
      (current_record.times_answered + 1)
    ),
    difficulty_rating = new_difficulty,
    last_calibrated_at = CASE WHEN new_difficulty != current_record.difficulty_rating THEN now() ELSE last_calibrated_at END
  WHERE question_id = question_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_subject_levels_student
  ON student_subject_levels(student_id);

CREATE INDEX IF NOT EXISTS idx_student_subject_levels_subject
  ON student_subject_levels(subject);

CREATE INDEX IF NOT EXISTS idx_question_difficulty_tracking_question
  ON question_difficulty_tracking(question_id);

CREATE INDEX IF NOT EXISTS idx_question_difficulty_tracking_difficulty
  ON question_difficulty_tracking(difficulty_rating);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_recommended_difficulty TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_proficiency TO authenticated;
GRANT EXECUTE ON FUNCTION update_question_difficulty TO authenticated;