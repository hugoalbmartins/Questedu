/*
  # Personalized Learning Paths System

  1. New Tables
    - `learning_paths` - Predefined learning paths
    - `path_modules` - Modules within paths
    - `student_paths` - Student enrollment in paths
    - `module_progress` - Progress within modules
    - `adaptive_recommendations` - AI-driven suggestions
    
  2. Features
    - Custom learning paths
    - Adaptive difficulty
    - Progress tracking
    - Module prerequisites
    - Skill trees
    - Personalized recommendations
    
  3. Security
    - RLS for privacy
    - Parent visibility
    - Teacher/admin management
*/

-- Path Difficulty Levels
DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Path Status
DO $$ BEGIN
  CREATE TYPE path_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'locked'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Learning Paths (Templates)
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  school_year integer NOT NULL,
  difficulty difficulty_level DEFAULT 'beginner',
  estimated_hours integer DEFAULT 10,
  total_modules integer DEFAULT 0,
  prerequisite_path_id uuid REFERENCES learning_paths(id),
  icon text DEFAULT '📚',
  tags text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage learning paths"
  ON learning_paths FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Path Modules
CREATE TABLE IF NOT EXISTS path_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  module_order integer NOT NULL,
  title text NOT NULL,
  description text,
  content_type text DEFAULT 'quiz',
  difficulty difficulty_level DEFAULT 'beginner',
  estimated_minutes integer DEFAULT 30,
  required_accuracy numeric(5,2) DEFAULT 70.0,
  min_questions integer DEFAULT 10,
  unlock_criteria jsonb DEFAULT '{}'::jsonb,
  rewards jsonb DEFAULT '{}'::jsonb,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(path_id, module_order)
);

ALTER TABLE path_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view path modules"
  ON path_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_paths
      WHERE learning_paths.id = path_modules.path_id
      AND learning_paths.is_active = true
    )
  );

-- Student Learning Paths (Enrollment)
CREATE TABLE IF NOT EXISTS student_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  status path_status DEFAULT 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  current_module_id uuid REFERENCES path_modules(id),
  modules_completed integer DEFAULT 0,
  overall_progress numeric(5,2) DEFAULT 0,
  average_accuracy numeric(5,2) DEFAULT 0,
  total_time_minutes integer DEFAULT 0,
  is_personalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, path_id)
);

ALTER TABLE student_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own paths"
  ON student_paths FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_paths.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own paths"
  ON student_paths FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_paths.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's paths"
  ON student_paths FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_paths.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Module Progress
CREATE TABLE IF NOT EXISTS module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_path_id uuid NOT NULL REFERENCES student_paths(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES path_modules(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status path_status DEFAULT 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  accuracy numeric(5,2) DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  attempts integer DEFAULT 0,
  best_score numeric(5,2) DEFAULT 0,
  is_unlocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_path_id, module_id)
);

ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own module progress"
  ON module_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = module_progress.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own module progress"
  ON module_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = module_progress.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's module progress"
  ON module_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = module_progress.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Adaptive Recommendations
CREATE TABLE IF NOT EXISTS adaptive_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  path_id uuid REFERENCES learning_paths(id),
  module_id uuid REFERENCES path_modules(id),
  priority integer DEFAULT 1,
  reason text,
  confidence_score numeric(5,2) DEFAULT 0,
  supporting_metrics jsonb DEFAULT '{}'::jsonb,
  is_accepted boolean,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE adaptive_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own recommendations"
  ON adaptive_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = adaptive_recommendations.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own recommendations"
  ON adaptive_recommendations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = adaptive_recommendations.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Function to enroll in learning path
CREATE OR REPLACE FUNCTION enroll_in_path(
  student_id_param uuid,
  path_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  path_record RECORD;
  first_module_id uuid;
  enrollment_id uuid;
BEGIN
  SELECT * INTO path_record FROM learning_paths WHERE id = path_id_param;

  IF path_record IS NULL OR NOT path_record.is_active THEN
    RAISE EXCEPTION 'Learning path not available';
  END IF;

  IF path_record.prerequisite_path_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM student_paths
      WHERE student_id = student_id_param
      AND path_id = path_record.prerequisite_path_id
      AND status = 'completed'
    ) THEN
      RAISE EXCEPTION 'Prerequisite path not completed';
    END IF;
  END IF;

  SELECT id INTO first_module_id
  FROM path_modules
  WHERE path_id = path_id_param
  ORDER BY module_order ASC
  LIMIT 1;

  INSERT INTO student_paths (
    student_id,
    path_id,
    status,
    started_at,
    current_module_id
  ) VALUES (
    student_id_param,
    path_id_param,
    'in_progress',
    now(),
    first_module_id
  )
  ON CONFLICT (student_id, path_id)
  DO UPDATE SET
    status = 'in_progress',
    started_at = COALESCE(student_paths.started_at, now()),
    updated_at = now()
  RETURNING id INTO enrollment_id;

  INSERT INTO module_progress (
    student_path_id,
    module_id,
    student_id,
    is_unlocked
  )
  SELECT
    enrollment_id,
    pm.id,
    student_id_param,
    (pm.id = first_module_id)
  FROM path_modules pm
  WHERE pm.path_id = path_id_param
  ON CONFLICT (student_path_id, module_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', enrollment_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update module progress
CREATE OR REPLACE FUNCTION update_module_progress(
  student_id_param uuid,
  module_id_param uuid,
  questions_attempted_param integer,
  questions_correct_param integer,
  time_spent_param integer
)
RETURNS jsonb AS $$
DECLARE
  progress_record RECORD;
  module_record RECORD;
  accuracy numeric;
  is_completed boolean;
  next_module_id uuid;
BEGIN
  SELECT * INTO module_record FROM path_modules WHERE id = module_id_param;
  
  IF questions_attempted_param > 0 THEN
    accuracy := (questions_correct_param::numeric / questions_attempted_param * 100);
  ELSE
    accuracy := 0;
  END IF;

  is_completed := (
    questions_attempted_param >= module_record.min_questions
    AND accuracy >= module_record.required_accuracy
  );

  UPDATE module_progress
  SET
    status = CASE WHEN is_completed THEN 'completed'::path_status ELSE 'in_progress'::path_status END,
    questions_attempted = questions_attempted + questions_attempted_param,
    questions_correct = questions_correct + questions_correct_param,
    accuracy = (questions_correct + questions_correct_param)::numeric / 
               NULLIF(questions_attempted + questions_attempted_param, 0) * 100,
    time_spent_minutes = time_spent_minutes + time_spent_param,
    attempts = attempts + 1,
    best_score = GREATEST(best_score, accuracy),
    completed_at = CASE WHEN is_completed THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE student_id = student_id_param
  AND module_id = module_id_param
  RETURNING * INTO progress_record;

  IF is_completed THEN
    SELECT id INTO next_module_id
    FROM path_modules
    WHERE path_id = module_record.path_id
    AND module_order > module_record.module_order
    ORDER BY module_order ASC
    LIMIT 1;

    IF next_module_id IS NOT NULL THEN
      UPDATE module_progress
      SET is_unlocked = true
      WHERE student_id = student_id_param
      AND module_id = next_module_id;

      UPDATE student_paths
      SET
        current_module_id = next_module_id,
        modules_completed = modules_completed + 1,
        updated_at = now()
      WHERE student_id = student_id_param
      AND path_id = module_record.path_id;
    ELSE
      UPDATE student_paths
      SET
        status = 'completed'::path_status,
        completed_at = now(),
        modules_completed = modules_completed + 1,
        updated_at = now()
      WHERE student_id = student_id_param
      AND path_id = module_record.path_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'completed', is_completed,
    'accuracy', accuracy
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recommended paths
CREATE OR REPLACE FUNCTION get_recommended_paths(
  student_id_param uuid,
  limit_param integer DEFAULT 5
)
RETURNS TABLE (
  path_id uuid,
  title text,
  description text,
  subject text,
  difficulty difficulty_level,
  estimated_hours integer,
  total_modules integer,
  match_score numeric,
  reason text
) AS $$
DECLARE
  student_record RECORD;
BEGIN
  SELECT
    s.school_year,
    array_agg(DISTINCT qr.subject) FILTER (WHERE qr.subject IS NOT NULL) as studied_subjects,
    AVG(CASE WHEN qr.is_correct THEN 1.0 ELSE 0.0 END) * 100 as avg_accuracy
  INTO student_record
  FROM students s
  LEFT JOIN quiz_responses qr ON qr.student_id = s.id
  WHERE s.id = student_id_param
  GROUP BY s.id, s.school_year;

  RETURN QUERY
  SELECT
    lp.id as path_id,
    lp.title,
    lp.description,
    lp.subject,
    lp.difficulty,
    lp.estimated_hours,
    lp.total_modules,
    CASE
      WHEN lp.subject = ANY(student_record.studied_subjects) THEN 90.0
      WHEN lp.school_year = student_record.school_year THEN 80.0
      ELSE 50.0
    END as match_score,
    CASE
      WHEN lp.subject = ANY(student_record.studied_subjects) 
        THEN 'Baseado no teu histórico de estudo'
      WHEN lp.school_year = student_record.school_year 
        THEN 'Adequado para o teu ano escolar'
      ELSE 'Recomendado para expandir conhecimento'
    END as reason
  FROM learning_paths lp
  WHERE lp.is_active = true
  AND lp.school_year = student_record.school_year
  AND NOT EXISTS (
    SELECT 1 FROM student_paths sp
    WHERE sp.student_id = student_id_param
    AND sp.path_id = lp.id
    AND sp.status = 'completed'
  )
  ORDER BY match_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get path progress overview
CREATE OR REPLACE FUNCTION get_path_progress_overview(
  student_id_param uuid,
  path_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'path', jsonb_build_object(
      'id', lp.id,
      'title', lp.title,
      'description', lp.description,
      'total_modules', lp.total_modules
    ),
    'progress', jsonb_build_object(
      'status', sp.status,
      'overall_progress', sp.overall_progress,
      'modules_completed', sp.modules_completed,
      'current_module', pm.title,
      'total_time_minutes', sp.total_time_minutes,
      'average_accuracy', sp.average_accuracy
    ),
    'modules', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pm2.id,
          'title', pm2.title,
          'order', pm2.module_order,
          'status', mp.status,
          'is_unlocked', mp.is_unlocked,
          'accuracy', mp.accuracy,
          'attempts', mp.attempts
        ) ORDER BY pm2.module_order
      )
      FROM path_modules pm2
      LEFT JOIN module_progress mp ON mp.module_id = pm2.id 
        AND mp.student_id = student_id_param
      WHERE pm2.path_id = path_id_param
    )
  ) INTO result
  FROM student_paths sp
  JOIN learning_paths lp ON lp.id = sp.path_id
  LEFT JOIN path_modules pm ON pm.id = sp.current_module_id
  WHERE sp.student_id = student_id_param
  AND sp.path_id = path_id_param;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_subject
  ON learning_paths(subject, school_year);

CREATE INDEX IF NOT EXISTS idx_path_modules_path
  ON path_modules(path_id, module_order);

CREATE INDEX IF NOT EXISTS idx_student_paths_student
  ON student_paths(student_id, status);

CREATE INDEX IF NOT EXISTS idx_module_progress_student
  ON module_progress(student_id, status);

CREATE INDEX IF NOT EXISTS idx_adaptive_recommendations_student
  ON adaptive_recommendations(student_id, is_dismissed);

-- Insert sample learning paths
INSERT INTO learning_paths (title, description, subject, school_year, difficulty, estimated_hours, total_modules) VALUES
('Matemática Fundamental - 4º Ano', 'Domina os conceitos essenciais de matemática do 4º ano', 'matematica', 4, 'beginner', 15, 10),
('Português Avançado - 4º Ano', 'Melhora a tua escrita e compreensão de texto', 'portugues', 4, 'intermediate', 12, 8),
('Ciências Naturais - 4º Ano', 'Explora o mundo das ciências', 'estudo_meio', 4, 'beginner', 10, 6),
('Inglês para Iniciantes', 'Aprende o básico de inglês', 'ingles', 4, 'beginner', 8, 5)
ON CONFLICT DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION enroll_in_path TO authenticated;
GRANT EXECUTE ON FUNCTION update_module_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_paths TO authenticated;
GRANT EXECUTE ON FUNCTION get_path_progress_overview TO authenticated;