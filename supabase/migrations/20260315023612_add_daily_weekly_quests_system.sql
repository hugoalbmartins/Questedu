/*
  # Daily and Weekly Quests System

  1. New Tables
    - `quest_templates` - Predefined quest templates
    - `active_quests` - Currently active quests for students
    - `quest_progress` - Progress tracking for quests
    - `completed_quests` - History of completed quests
    
  2. Features
    - Daily quests (reset every 24h)
    - Weekly quests (reset every Monday)
    - Multiple quest types:
      - Answer X questions
      - Achieve X% accuracy
      - Play X minigames
      - Earn X coins
      - Maintain streak
      - Complete specific subject
    - Progressive rewards
    - Auto-generation of quests
    - Tracking and completion
    
  3. Security
    - RLS for all tables
    - Students can only see own quests
    - Parents can view children's quests
*/

-- Quest Types Enum
DO $$ BEGIN
  CREATE TYPE quest_type AS ENUM (
    'answer_questions',
    'achieve_accuracy',
    'play_minigames',
    'earn_coins',
    'maintain_streak',
    'subject_mastery',
    'perfect_quiz',
    'daily_login'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Quest Frequency Enum
DO $$ BEGIN
  CREATE TYPE quest_frequency AS ENUM ('daily', 'weekly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Quest Templates Table
CREATE TABLE IF NOT EXISTS quest_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  quest_type quest_type NOT NULL,
  frequency quest_frequency NOT NULL,
  target_value integer NOT NULL,
  min_school_year integer DEFAULT 1,
  max_school_year integer DEFAULT 4,
  subject text,
  reward_coins integer DEFAULT 50,
  reward_diamonds integer DEFAULT 5,
  reward_xp integer DEFAULT 100,
  icon text DEFAULT '🎯',
  difficulty integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quest templates"
  ON quest_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Active Quests Table
CREATE TABLE IF NOT EXISTS active_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
  frequency quest_frequency NOT NULL,
  current_progress integer DEFAULT 0,
  target_value integer NOT NULL,
  quest_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  rewards_claimed boolean DEFAULT false,
  UNIQUE(student_id, template_id, frequency, started_at)
);

ALTER TABLE active_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own active quests"
  ON active_quests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = active_quests.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own quest progress"
  ON active_quests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = active_quests.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's active quests"
  ON active_quests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = active_quests.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Completed Quests History
CREATE TABLE IF NOT EXISTS completed_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES quest_templates(id) ON DELETE CASCADE,
  quest_name text NOT NULL,
  frequency quest_frequency NOT NULL,
  target_value integer NOT NULL,
  completion_time_seconds integer,
  coins_earned integer DEFAULT 0,
  diamonds_earned integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE completed_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own completed quests"
  ON completed_quests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = completed_quests.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's completed quests"
  ON completed_quests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = completed_quests.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Insert Quest Templates
INSERT INTO quest_templates (name, description, quest_type, frequency, target_value, reward_coins, reward_diamonds, reward_xp, icon, difficulty) VALUES
('Matemático Diário', 'Responde a 10 perguntas de matemática', 'answer_questions', 'daily', 10, 50, 2, 100, '🔢', 1),
('Mestre da Precisão', 'Alcança 80% de precisão em 15 perguntas', 'achieve_accuracy', 'daily', 80, 75, 3, 150, '🎯', 2),
('Explorador de Jogos', 'Joga 3 mini-jogos', 'play_minigames', 'daily', 3, 60, 2, 120, '🎮', 1),
('Colecionador', 'Ganha 200 moedas hoje', 'earn_coins', 'daily', 200, 100, 5, 200, '🪙', 2),
('Fogo na Sequência', 'Mantém a sequência ativa', 'maintain_streak', 'daily', 1, 30, 1, 80, '🔥', 1),
('Quiz Perfeito', 'Completa um quiz com 100% de acertos', 'perfect_quiz', 'daily', 1, 150, 8, 300, '💯', 3),
('Login Diário', 'Faz login hoje', 'daily_login', 'daily', 1, 20, 1, 50, '✅', 1),

('Guerreiro Semanal', 'Responde a 100 perguntas esta semana', 'answer_questions', 'weekly', 100, 300, 15, 600, '⚔️', 1),
('Mestre Semanal', 'Alcança 85% de precisão em 50 perguntas', 'achieve_accuracy', 'weekly', 85, 400, 20, 800, '👑', 2),
('Campeão dos Jogos', 'Joga 15 mini-jogos esta semana', 'play_minigames', 'weekly', 15, 350, 18, 700, '🏆', 2),
('Magnata', 'Ganha 1500 moedas esta semana', 'earn_coins', 'weekly', 1500, 500, 25, 1000, '💰', 2),
('Incansável', 'Mantém sequência de 7 dias', 'maintain_streak', 'weekly', 7, 600, 30, 1200, '🔥', 3),
('Perfeição Matemática', 'Responde a 30 perguntas de matemática com 90%+ precisão', 'subject_mastery', 'weekly', 30, 450, 22, 900, '📐', 3)
ON CONFLICT DO NOTHING;

-- Function to generate daily quests for a student
CREATE OR REPLACE FUNCTION generate_daily_quests(student_id_param uuid)
RETURNS void AS $$
DECLARE
  student_year integer;
  template_record RECORD;
  expires_time timestamptz;
BEGIN
  SELECT school_year INTO student_year
  FROM students
  WHERE id = student_id_param;

  DELETE FROM active_quests
  WHERE student_id = student_id_param
  AND frequency = 'daily'
  AND expires_at < now();

  expires_time := date_trunc('day', now()) + interval '1 day';

  FOR template_record IN
    SELECT *
    FROM quest_templates
    WHERE frequency = 'daily'
    AND is_active = true
    AND student_year >= min_school_year
    AND student_year <= max_school_year
    ORDER BY random()
    LIMIT 3
  LOOP
    INSERT INTO active_quests (
      student_id,
      template_id,
      frequency,
      target_value,
      expires_at,
      quest_data
    ) VALUES (
      student_id_param,
      template_record.id,
      'daily',
      template_record.target_value,
      expires_time,
      jsonb_build_object(
        'name', template_record.name,
        'description', template_record.description,
        'icon', template_record.icon,
        'quest_type', template_record.quest_type::text,
        'subject', template_record.subject,
        'reward_coins', template_record.reward_coins,
        'reward_diamonds', template_record.reward_diamonds,
        'reward_xp', template_record.reward_xp
      )
    )
    ON CONFLICT (student_id, template_id, frequency, started_at) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate weekly quests for a student
CREATE OR REPLACE FUNCTION generate_weekly_quests(student_id_param uuid)
RETURNS void AS $$
DECLARE
  student_year integer;
  template_record RECORD;
  expires_time timestamptz;
BEGIN
  SELECT school_year INTO student_year
  FROM students
  WHERE id = student_id_param;

  DELETE FROM active_quests
  WHERE student_id = student_id_param
  AND frequency = 'weekly'
  AND expires_at < now();

  expires_time := date_trunc('week', now()) + interval '1 week';

  FOR template_record IN
    SELECT *
    FROM quest_templates
    WHERE frequency = 'weekly'
    AND is_active = true
    AND student_year >= min_school_year
    AND student_year <= max_school_year
    ORDER BY random()
    LIMIT 3
  LOOP
    INSERT INTO active_quests (
      student_id,
      template_id,
      frequency,
      target_value,
      expires_at,
      quest_data
    ) VALUES (
      student_id_param,
      template_record.id,
      'weekly',
      template_record.target_value,
      expires_time,
      jsonb_build_object(
        'name', template_record.name,
        'description', template_record.description,
        'icon', template_record.icon,
        'quest_type', template_record.quest_type::text,
        'subject', template_record.subject,
        'reward_coins', template_record.reward_coins,
        'reward_diamonds', template_record.reward_diamonds,
        'reward_xp', template_record.reward_xp
      )
    )
    ON CONFLICT (student_id, template_id, frequency, started_at) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update quest progress
CREATE OR REPLACE FUNCTION update_quest_progress(
  student_id_param uuid,
  quest_type_param text,
  progress_value integer DEFAULT 1,
  subject_param text DEFAULT NULL
)
RETURNS TABLE(completed_quest_ids uuid[]) AS $$
DECLARE
  quest_record RECORD;
  newly_completed uuid[] := ARRAY[]::uuid[];
BEGIN
  FOR quest_record IN
    SELECT *
    FROM active_quests aq
    JOIN quest_templates qt ON qt.id = aq.template_id
    WHERE aq.student_id = student_id_param
    AND aq.is_completed = false
    AND aq.expires_at > now()
    AND qt.quest_type::text = quest_type_param
    AND (subject_param IS NULL OR qt.subject = subject_param OR qt.subject IS NULL)
  LOOP
    UPDATE active_quests
    SET current_progress = LEAST(current_progress + progress_value, target_value)
    WHERE id = quest_record.id;

    IF (quest_record.current_progress + progress_value) >= quest_record.target_value THEN
      newly_completed := array_append(newly_completed, quest_record.id);
    END IF;
  END LOOP;

  RETURN QUERY SELECT newly_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim quest rewards
CREATE OR REPLACE FUNCTION claim_quest_rewards(quest_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  quest_record RECORD;
  rewards jsonb;
BEGIN
  SELECT aq.*, qt.name, qt.reward_coins, qt.reward_diamonds, qt.reward_xp
  INTO quest_record
  FROM active_quests aq
  JOIN quest_templates qt ON qt.id = aq.template_id
  WHERE aq.id = quest_id_param
  AND aq.is_completed = true
  AND aq.rewards_claimed = false;

  IF quest_record IS NULL THEN
    RAISE EXCEPTION 'Quest not found or already claimed';
  END IF;

  UPDATE active_quests
  SET rewards_claimed = true
  WHERE id = quest_id_param;

  UPDATE students
  SET
    coins = coins + quest_record.reward_coins,
    diamonds = diamonds + quest_record.reward_diamonds,
    xp = xp + quest_record.reward_xp
  WHERE id = quest_record.student_id;

  INSERT INTO completed_quests (
    student_id,
    template_id,
    quest_name,
    frequency,
    target_value,
    completion_time_seconds,
    coins_earned,
    diamonds_earned,
    xp_earned
  ) VALUES (
    quest_record.student_id,
    quest_record.template_id,
    quest_record.name,
    quest_record.frequency,
    quest_record.target_value,
    EXTRACT(EPOCH FROM (now() - quest_record.started_at))::integer,
    quest_record.reward_coins,
    quest_record.reward_diamonds,
    quest_record.reward_xp
  );

  rewards := jsonb_build_object(
    'coins', quest_record.reward_coins,
    'diamonds', quest_record.reward_diamonds,
    'xp', quest_record.reward_xp
  );

  RETURN rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-complete quests based on progress
CREATE OR REPLACE FUNCTION check_quest_completion()
RETURNS void AS $$
BEGIN
  UPDATE active_quests
  SET
    is_completed = true,
    completed_at = now()
  WHERE current_progress >= target_value
  AND is_completed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_active_quests_student
  ON active_quests(student_id);

CREATE INDEX IF NOT EXISTS idx_active_quests_expires
  ON active_quests(expires_at);

CREATE INDEX IF NOT EXISTS idx_active_quests_completed
  ON active_quests(is_completed, rewards_claimed);

CREATE INDEX IF NOT EXISTS idx_completed_quests_student
  ON completed_quests(student_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_quest_templates_frequency
  ON quest_templates(frequency, is_active);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_daily_quests TO authenticated;
GRANT EXECUTE ON FUNCTION generate_weekly_quests TO authenticated;
GRANT EXECUTE ON FUNCTION update_quest_progress TO authenticated;
GRANT EXECUTE ON FUNCTION claim_quest_rewards TO authenticated;
GRANT EXECUTE ON FUNCTION check_quest_completion TO authenticated;