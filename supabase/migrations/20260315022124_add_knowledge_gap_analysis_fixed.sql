/*
  # Knowledge Gap Analysis System

  1. New Tables
    - `knowledge_gaps` - Identified learning gaps per student
    - `topic_performance` - Performance tracking per topic
    
  2. Functions
    - Identify knowledge gaps automatically
    - Generate personalized recommendations
    
  3. Security
    - RLS for students and parents to view gaps
*/

-- Topic Performance Table
CREATE TABLE IF NOT EXISTS topic_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  total_questions integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  accuracy_percentage numeric DEFAULT 0,
  last_practiced_at timestamptz,
  difficulty_level integer DEFAULT 1,
  mastery_level text DEFAULT 'novice',
  needs_review boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject, topic)
);

ALTER TABLE topic_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own topic performance"
  ON topic_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = topic_performance.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's topic performance"
  ON topic_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = topic_performance.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "System can update topic performance"
  ON topic_performance FOR ALL
  TO authenticated
  USING (true);

-- Knowledge Gaps Table
CREATE TABLE IF NOT EXISTS knowledge_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  gap_severity text DEFAULT 'medium',
  accuracy_percentage numeric DEFAULT 0,
  questions_attempted integer DEFAULT 0,
  last_attempt_at timestamptz,
  recommended_practice integer DEFAULT 5,
  personalized_tip text,
  parent_notified boolean DEFAULT false,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own knowledge gaps"
  ON knowledge_gaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = knowledge_gaps.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's knowledge gaps"
  ON knowledge_gaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = knowledge_gaps.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "System can manage knowledge gaps"
  ON knowledge_gaps FOR ALL
  TO authenticated
  USING (true);

-- Function to update topic performance
CREATE OR REPLACE FUNCTION update_topic_performance(
  student_id_param uuid,
  subject_param text,
  topic_param text,
  answered_correctly boolean
)
RETURNS void AS $$
DECLARE
  current_record RECORD;
  new_accuracy numeric;
  mastery text;
BEGIN
  SELECT * INTO current_record
  FROM topic_performance
  WHERE student_id = student_id_param
  AND subject = subject_param
  AND topic = topic_param
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO topic_performance (
      student_id,
      subject,
      topic,
      total_questions,
      correct_answers,
      accuracy_percentage,
      last_practiced_at,
      mastery_level,
      needs_review
    ) VALUES (
      student_id_param,
      subject_param,
      topic_param,
      1,
      CASE WHEN answered_correctly THEN 1 ELSE 0 END,
      CASE WHEN answered_correctly THEN 100 ELSE 0 END,
      now(),
      'novice',
      NOT answered_correctly
    );
    RETURN;
  END IF;

  new_accuracy := (
    (current_record.correct_answers + CASE WHEN answered_correctly THEN 1 ELSE 0 END)::numeric /
    (current_record.total_questions + 1)::numeric * 100
  );

  IF new_accuracy >= 90 THEN
    mastery := 'master';
  ELSIF new_accuracy >= 80 THEN
    mastery := 'proficient';
  ELSIF new_accuracy >= 70 THEN
    mastery := 'competent';
  ELSIF new_accuracy >= 60 THEN
    mastery := 'developing';
  ELSE
    mastery := 'novice';
  END IF;

  UPDATE topic_performance
  SET
    total_questions = current_record.total_questions + 1,
    correct_answers = current_record.correct_answers + CASE WHEN answered_correctly THEN 1 ELSE 0 END,
    accuracy_percentage = new_accuracy,
    last_practiced_at = now(),
    mastery_level = mastery,
    needs_review = (new_accuracy < 70),
    updated_at = now()
  WHERE student_id = student_id_param
  AND subject = subject_param
  AND topic = topic_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify knowledge gaps
CREATE OR REPLACE FUNCTION identify_knowledge_gaps(student_id_param uuid)
RETURNS void AS $$
DECLARE
  topic_record RECORD;
  severity text;
  tip text;
  existing_gap_id uuid;
BEGIN
  FOR topic_record IN
    SELECT *
    FROM topic_performance
    WHERE student_id = student_id_param
    AND total_questions >= 3
    AND accuracy_percentage < 70
    AND needs_review = true
  LOOP
    IF topic_record.accuracy_percentage < 40 THEN
      severity := 'high';
      tip := 'Este tópico precisa de atenção urgente. Recomendamos prática intensiva com revisão dos conceitos básicos.';
    ELSIF topic_record.accuracy_percentage < 60 THEN
      severity := 'medium';
      tip := 'Continua a praticar este tópico. Revê os erros anteriores e tenta identificar padrões.';
    ELSE
      severity := 'low';
      tip := 'Estás quase lá! Mais algumas práticas e vais dominar este tópico.';
    END IF;

    SELECT id INTO existing_gap_id
    FROM knowledge_gaps
    WHERE student_id = student_id_param
    AND subject = topic_record.subject
    AND topic = topic_record.topic
    AND resolved = false;

    IF existing_gap_id IS NOT NULL THEN
      UPDATE knowledge_gaps
      SET
        gap_severity = severity,
        accuracy_percentage = topic_record.accuracy_percentage,
        questions_attempted = topic_record.total_questions,
        last_attempt_at = topic_record.last_practiced_at,
        recommended_practice = CASE 
          WHEN severity = 'high' THEN 10
          WHEN severity = 'medium' THEN 7
          ELSE 5
        END,
        personalized_tip = tip,
        updated_at = now()
      WHERE id = existing_gap_id;
    ELSE
      INSERT INTO knowledge_gaps (
        student_id,
        subject,
        topic,
        gap_severity,
        accuracy_percentage,
        questions_attempted,
        last_attempt_at,
        recommended_practice,
        personalized_tip,
        resolved
      ) VALUES (
        student_id_param,
        topic_record.subject,
        topic_record.topic,
        severity,
        topic_record.accuracy_percentage,
        topic_record.total_questions,
        topic_record.last_practiced_at,
        CASE 
          WHEN severity = 'high' THEN 10
          WHEN severity = 'medium' THEN 7
          ELSE 5
        END,
        tip,
        false
      );
    END IF;
  END LOOP;

  UPDATE knowledge_gaps
  SET
    resolved = true,
    resolved_at = now()
  WHERE student_id = student_id_param
  AND resolved = false
  AND (subject, topic) IN (
    SELECT subject, topic
    FROM topic_performance
    WHERE student_id = student_id_param
    AND accuracy_percentage >= 80
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized practice recommendations
CREATE OR REPLACE FUNCTION get_practice_recommendations(student_id_param uuid)
RETURNS TABLE (
  subject text,
  topic text,
  severity text,
  accuracy numeric,
  recommended_questions integer,
  tip text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kg.subject,
    kg.topic,
    kg.gap_severity,
    kg.accuracy_percentage,
    kg.recommended_practice,
    kg.personalized_tip
  FROM knowledge_gaps kg
  WHERE kg.student_id = student_id_param
  AND kg.resolved = false
  ORDER BY
    CASE kg.gap_severity
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
    END,
    kg.accuracy_percentage ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_topic_performance_student
  ON topic_performance(student_id);

CREATE INDEX IF NOT EXISTS idx_topic_performance_subject
  ON topic_performance(subject);

CREATE INDEX IF NOT EXISTS idx_topic_performance_needs_review
  ON topic_performance(needs_review) WHERE needs_review = true;

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_student
  ON knowledge_gaps(student_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_severity
  ON knowledge_gaps(gap_severity) WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_resolved
  ON knowledge_gaps(resolved);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_topic_performance TO authenticated;
GRANT EXECUTE ON FUNCTION identify_knowledge_gaps TO authenticated;
GRANT EXECUTE ON FUNCTION get_practice_recommendations TO authenticated;