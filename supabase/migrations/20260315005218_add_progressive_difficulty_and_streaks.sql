/*
  # Sistema de Dificuldade Progressiva e Streaks

  ## Alterações

  1. **Tabela questions**
    - Adicionar coluna `school_period` (inicio_ano, meio_ano, fim_ano, revisao)
    - Adicionar coluna `topic` para categorização detalhada
    - Adicionar índices para otimização de queries

  2. **Nova Tabela quiz_streaks**
    - `student_id` (uuid, FK para students)
    - `current_streak` (integer) - dias consecutivos atuais
    - `longest_streak` (integer) - recorde de dias consecutivos
    - `last_quiz_date` (date) - última data de quiz completo
    - `total_quizzes` (integer) - total de quizzes completados
    - Índice único em student_id

  3. **Tabela subject_priorities**
    - Adicionar coluna `priority_multiplier` (numeric) - multiplicador de frequência
    - Adicionar coluna `focus_until` (timestamptz) - período de foco temporário

  4. **Tabela buildings**
    - Adicionar coluna `last_collected_at` (timestamptz) - última recolha
    - Adicionar coluna `production_ready` (boolean) - produção pronta
    - Adicionar coluna `growth_stage` (integer) - estágio de crescimento (0-4)
    - Adicionar coluna `next_production_at` (timestamptz) - próxima produção

  5. **Índices de Performance**
    - Índice composto em questions (school_year, subject, difficulty, school_period)
    - Índice composto em quiz_history (student_id, answered_at DESC)
    - Índice em buildings (student_id, production_ready)

  ## Segurança
    - RLS já está ativo em todas as tabelas modificadas
    - Políticas existentes continuam a aplicar-se
*/

-- 1. Adicionar campos à tabela questions
DO $$
BEGIN
  -- Adicionar school_period se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'school_period'
  ) THEN
    ALTER TABLE questions ADD COLUMN school_period text DEFAULT 'meio_ano';
    ALTER TABLE questions ADD CONSTRAINT questions_school_period_check 
      CHECK (school_period IN ('inicio_ano', 'meio_ano', 'fim_ano', 'revisao'));
  END IF;

  -- Adicionar topic se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'topic'
  ) THEN
    ALTER TABLE questions ADD COLUMN topic text;
  END IF;
END $$;

-- 2. Criar tabela quiz_streaks
CREATE TABLE IF NOT EXISTS quiz_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_quiz_date date,
  total_quizzes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own streak"
  ON quiz_streaks FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own streak"
  ON quiz_streaks FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own streak"
  ON quiz_streaks FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view child streaks"
  ON quiz_streaks FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- 3. Adicionar campos à tabela subject_priorities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subject_priorities' AND column_name = 'priority_multiplier'
  ) THEN
    ALTER TABLE subject_priorities ADD COLUMN priority_multiplier numeric DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subject_priorities' AND column_name = 'focus_until'
  ) THEN
    ALTER TABLE subject_priorities ADD COLUMN focus_until timestamptz;
  END IF;
END $$;

-- 4. Adicionar campos à tabela buildings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buildings' AND column_name = 'last_collected_at'
  ) THEN
    ALTER TABLE buildings ADD COLUMN last_collected_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buildings' AND column_name = 'production_ready'
  ) THEN
    ALTER TABLE buildings ADD COLUMN production_ready boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buildings' AND column_name = 'growth_stage'
  ) THEN
    ALTER TABLE buildings ADD COLUMN growth_stage integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buildings' AND column_name = 'next_production_at'
  ) THEN
    ALTER TABLE buildings ADD COLUMN next_production_at timestamptz;
  END IF;
END $$;

-- 5. Criar índices de performance
CREATE INDEX IF NOT EXISTS idx_questions_lookup 
  ON questions(school_year, subject, difficulty, school_period);

CREATE INDEX IF NOT EXISTS idx_quiz_history_student_date 
  ON quiz_history(student_id, answered_at DESC);

CREATE INDEX IF NOT EXISTS idx_buildings_production 
  ON buildings(student_id, production_ready) WHERE production_ready = true;

CREATE INDEX IF NOT EXISTS idx_quiz_streaks_student 
  ON quiz_streaks(student_id);

-- 6. Função para atualizar streak automaticamente
CREATE OR REPLACE FUNCTION update_quiz_streak()
RETURNS TRIGGER AS $$
DECLARE
  quiz_date date;
  last_date date;
  current_s integer;
  longest_s integer;
BEGIN
  -- Obter data do quiz (usar data atual)
  quiz_date := CURRENT_DATE;
  
  -- Buscar streak existente
  SELECT last_quiz_date, current_streak, longest_streak 
  INTO last_date, current_s, longest_s
  FROM quiz_streaks 
  WHERE student_id = NEW.student_id;
  
  -- Se não existe, criar
  IF NOT FOUND THEN
    INSERT INTO quiz_streaks (student_id, current_streak, longest_streak, last_quiz_date, total_quizzes)
    VALUES (NEW.student_id, 1, 1, quiz_date, 1);
    RETURN NEW;
  END IF;
  
  -- Se é o mesmo dia, não atualizar streak
  IF last_date = quiz_date THEN
    RETURN NEW;
  END IF;
  
  -- Se é dia consecutivo
  IF last_date = quiz_date - INTERVAL '1 day' THEN
    current_s := current_s + 1;
    longest_s := GREATEST(longest_s, current_s);
  -- Se perdeu a streak
  ELSIF last_date < quiz_date - INTERVAL '1 day' THEN
    current_s := 1;
  END IF;
  
  -- Atualizar
  UPDATE quiz_streaks 
  SET 
    current_streak = current_s,
    longest_streak = longest_s,
    last_quiz_date = quiz_date,
    total_quizzes = total_quizzes + 1,
    updated_at = now()
  WHERE student_id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar streak após quiz completo (5 perguntas respondidas)
CREATE OR REPLACE FUNCTION check_quiz_completion()
RETURNS TRIGGER AS $$
DECLARE
  quiz_count integer;
BEGIN
  -- Contar quantas perguntas foram respondidas hoje
  SELECT COUNT(*) INTO quiz_count
  FROM quiz_history
  WHERE student_id = NEW.student_id 
    AND answered_at::date = CURRENT_DATE;
  
  -- Se completou 5 perguntas (um quiz completo), atualizar streak
  IF quiz_count >= 5 THEN
    PERFORM update_quiz_streak();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_streak ON quiz_history;
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON quiz_history
  FOR EACH ROW
  EXECUTE FUNCTION check_quiz_completion();