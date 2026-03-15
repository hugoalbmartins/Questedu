/*
  # Badges and Achievement Titles System

  1. New Tables
    - `badges` - Available badges to unlock
    - `student_badges` - Badges earned by students
    - `achievement_titles` - Titles students can earn and equip
    - `student_titles` - Titles earned by students
    
  2. Modifications
    - Add equipped_title to students table
    
  3. Functions
    - Check and award badges automatically
    - Calculate title eligibility
    
  4. Security
    - RLS policies for students to view and equip
*/

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏅',
  category text DEFAULT 'general',
  rarity text DEFAULT 'common',
  requirement_type text NOT NULL,
  requirement_value integer DEFAULT 1,
  requirement_subject text,
  xp_reward integer DEFAULT 50,
  coins_reward integer DEFAULT 100,
  diamonds_reward integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_secret boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-secret badges"
  ON badges FOR SELECT
  TO authenticated
  USING (is_secret = false OR true);

-- Student Badges Table
CREATE TABLE IF NOT EXISTS student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(student_id, badge_id)
);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own badges"
  ON student_badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_badges.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own badge progress"
  ON student_badges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_badges.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Achievement Titles Table
CREATE TABLE IF NOT EXISTS achievement_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  color text DEFAULT '#6B7280',
  requirement_type text NOT NULL,
  requirement_badges text[],
  requirement_achievements integer,
  requirement_level integer,
  requirement_streak integer,
  rarity text DEFAULT 'common',
  is_premium_only boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievement_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view titles"
  ON achievement_titles FOR SELECT
  TO authenticated
  USING (true);

-- Student Titles Table
CREATE TABLE IF NOT EXISTS student_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title_id uuid NOT NULL REFERENCES achievement_titles(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(student_id, title_id)
);

ALTER TABLE student_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own titles"
  ON student_titles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_titles.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage own titles"
  ON student_titles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_titles.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Add equipped_title column to students
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'equipped_title_id'
  ) THEN
    ALTER TABLE students ADD COLUMN equipped_title_id uuid REFERENCES achievement_titles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert default badges
INSERT INTO badges (key, name, description, icon, category, rarity, requirement_type, requirement_value, xp_reward, coins_reward, diamonds_reward) VALUES
('first_quiz', 'Primeiro Passo', 'Completa o teu primeiro quiz', '🎯', 'progression', 'common', 'quizzes_completed', 1, 50, 100, 0),
('quiz_master_10', 'Aprendiz', 'Completa 10 quizzes', '📚', 'progression', 'common', 'quizzes_completed', 10, 100, 200, 5),
('quiz_master_50', 'Estudioso', 'Completa 50 quizzes', '📖', 'progression', 'rare', 'quizzes_completed', 50, 250, 500, 10),
('quiz_master_100', 'Sábio', 'Completa 100 quizzes', '🎓', 'progression', 'epic', 'quizzes_completed', 100, 500, 1000, 25),
('accuracy_80', 'Precisão', 'Mantém 80% de precisão em 20 perguntas', '🎯', 'accuracy', 'rare', 'accuracy_streak', 20, 200, 300, 10),
('accuracy_90', 'Mestre da Precisão', 'Mantém 90% de precisão em 20 perguntas', '🏹', 'accuracy', 'epic', 'accuracy_streak', 20, 300, 500, 15),
('perfect_quiz', 'Perfeição', 'Completa um quiz sem erros', '⭐', 'accuracy', 'rare', 'perfect_quizzes', 1, 150, 250, 10),
('streak_3', 'Consistente', 'Mantém 3 dias de streak', '🔥', 'streaks', 'common', 'streak_days', 3, 100, 150, 5),
('streak_7', 'Dedicado', 'Mantém 7 dias de streak', '🔥', 'streaks', 'rare', 'streak_days', 7, 250, 400, 10),
('streak_14', 'Determinado', 'Mantém 14 dias de streak', '🔥', 'streaks', 'epic', 'streak_days', 14, 500, 800, 20),
('streak_30', 'Inabalável', 'Mantém 30 dias de streak', '🔥', 'streaks', 'legendary', 'streak_days', 30, 1000, 1500, 50),
('portuguese_master', 'Mestre do Português', 'Completa 50 questões de Português com 80% de precisão', '📝', 'subjects', 'rare', 'subject_mastery', 50, 200, 300, 10),
('math_master', 'Mestre da Matemática', 'Completa 50 questões de Matemática com 80% de precisão', '🔢', 'subjects', 'rare', 'subject_mastery', 50, 200, 300, 10),
('science_master', 'Mestre do Estudo do Meio', 'Completa 50 questões de Estudo do Meio com 80% de precisão', '🔬', 'subjects', 'rare', 'subject_mastery', 50, 200, 300, 10),
('english_master', 'Mestre do Inglês', 'Completa 50 questões de Inglês com 80% de precisão', '🇬🇧', 'subjects', 'rare', 'subject_mastery', 50, 200, 300, 10),
('village_level_5', 'Construtor', 'Alcança nível 5 de aldeia', '🏘️', 'village', 'common', 'village_level', 5, 150, 200, 5),
('village_level_10', 'Arquiteto', 'Alcança nível 10 de aldeia', '🏛️', 'village', 'rare', 'village_level', 10, 300, 500, 15),
('coins_1000', 'Rico', 'Acumula 1000 moedas', '💰', 'wealth', 'common', 'total_coins', 1000, 100, 200, 5),
('coins_5000', 'Milionário', 'Acumula 5000 moedas', '💎', 'wealth', 'rare', 'total_coins', 5000, 300, 500, 15),
('friend_maker', 'Sociável', 'Adiciona 5 amigos', '👥', 'social', 'common', 'friends_count', 5, 100, 150, 5)
ON CONFLICT (key) DO NOTHING;

-- Insert default achievement titles
INSERT INTO achievement_titles (key, title, description, color, requirement_type, rarity, requirement_achievements, requirement_level, requirement_streak) VALUES
('novice', 'Novato', 'Título inicial', '#9CA3AF', 'default', 'common', 0, 0, 0),
('scholar', 'Estudioso', 'Desbloqueia 5 badges', '#3B82F6', 'badges', 'common', 5, 0, 0),
('sage', 'Sábio', 'Desbloqueia 10 badges', '#8B5CF6', 'badges', 'rare', 10, 0, 0),
('master', 'Mestre', 'Desbloqueia 20 badges', '#F59E0B', 'badges', 'epic', 20, 0, 0),
('legend', 'Lenda', 'Desbloqueia 30 badges', '#EF4444', 'badges', 'legendary', 30, 0, 0),
('fire_keeper', 'Guardião da Chama', 'Mantém 14 dias de streak', '#F97316', 'streak', 'rare', 0, 0, 14),
('eternal_flame', 'Chama Eterna', 'Mantém 30 dias de streak', '#DC2626', 'streak', 'epic', 0, 0, 30),
('architect', 'Arquiteto', 'Alcança nível 10 de aldeia', '#059669', 'level', 'rare', 0, 10, 0),
('emperor', 'Imperador', 'Alcança nível 20 de aldeia', '#7C3AED', 'level', 'epic', 0, 20, 0),
('perfectionist', 'Perfeccionista', 'Completa 5 quizzes perfeitos', '#EC4899', 'special', 'rare', 0, 0, 0)
ON CONFLICT (key) DO NOTHING;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(student_id_param uuid)
RETURNS void AS $$
DECLARE
  badge_record RECORD;
  student_record RECORD;
  quiz_count integer;
  accuracy numeric;
  streak_days integer;
  subject_accuracy numeric;
BEGIN
  SELECT * INTO student_record FROM students WHERE id = student_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT DATE(answered_at)) INTO quiz_count
  FROM quiz_history
  WHERE student_id = student_id_param;

  SELECT 
    AVG(CASE WHEN answered_correctly THEN 100.0 ELSE 0.0 END) INTO accuracy
  FROM (
    SELECT answered_correctly
    FROM quiz_history
    WHERE student_id = student_id_param
    ORDER BY answered_at DESC
    LIMIT 20
  ) recent;

  SELECT COALESCE(current_streak, 0) INTO streak_days
  FROM quiz_streaks
  WHERE student_id = student_id_param;

  FOR badge_record IN SELECT * FROM badges LOOP
    IF NOT EXISTS (
      SELECT 1 FROM student_badges 
      WHERE student_id = student_id_param 
      AND badge_id = badge_record.id
    ) THEN
      CASE badge_record.requirement_type
        WHEN 'quizzes_completed' THEN
          IF quiz_count >= badge_record.requirement_value THEN
            INSERT INTO student_badges (student_id, badge_id, progress)
            VALUES (student_id_param, badge_record.id, quiz_count);
            
            UPDATE students
            SET 
              coins = coins + badge_record.coins_reward,
              diamonds = diamonds + badge_record.diamonds_reward,
              xp = xp + badge_record.xp_reward
            WHERE id = student_id_param;
          END IF;

        WHEN 'streak_days' THEN
          IF streak_days >= badge_record.requirement_value THEN
            INSERT INTO student_badges (student_id, badge_id, progress)
            VALUES (student_id_param, badge_record.id, streak_days);
            
            UPDATE students
            SET 
              coins = coins + badge_record.coins_reward,
              diamonds = diamonds + badge_record.diamonds_reward,
              xp = xp + badge_record.xp_reward
            WHERE id = student_id_param;
          END IF;

        WHEN 'village_level' THEN
          IF student_record.village_level >= badge_record.requirement_value THEN
            INSERT INTO student_badges (student_id, badge_id, progress)
            VALUES (student_id_param, badge_record.id, student_record.village_level);
            
            UPDATE students
            SET 
              coins = coins + badge_record.coins_reward,
              diamonds = diamonds + badge_record.diamonds_reward,
              xp = xp + badge_record.xp_reward
            WHERE id = student_id_param;
          END IF;

        WHEN 'accuracy_streak' THEN
          IF accuracy >= 80 THEN
            INSERT INTO student_badges (student_id, badge_id, progress)
            VALUES (student_id_param, badge_record.id, ROUND(accuracy)::integer);
            
            UPDATE students
            SET 
              coins = coins + badge_record.coins_reward,
              diamonds = diamonds + badge_record.diamonds_reward,
              xp = xp + badge_record.xp_reward
            WHERE id = student_id_param;
          END IF;

        ELSE
          NULL;
      END CASE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award titles
CREATE OR REPLACE FUNCTION check_and_award_titles(student_id_param uuid)
RETURNS void AS $$
DECLARE
  title_record RECORD;
  badges_count integer;
  streak_days integer;
  village_lvl integer;
BEGIN
  SELECT COUNT(*) INTO badges_count
  FROM student_badges
  WHERE student_id = student_id_param;

  SELECT COALESCE(current_streak, 0) INTO streak_days
  FROM quiz_streaks
  WHERE student_id = student_id_param;

  SELECT village_level INTO village_lvl
  FROM students
  WHERE id = student_id_param;

  FOR title_record IN SELECT * FROM achievement_titles LOOP
    IF NOT EXISTS (
      SELECT 1 FROM student_titles
      WHERE student_id = student_id_param
      AND title_id = title_record.id
    ) THEN
      CASE title_record.requirement_type
        WHEN 'default' THEN
          INSERT INTO student_titles (student_id, title_id)
          VALUES (student_id_param, title_record.id);

        WHEN 'badges' THEN
          IF badges_count >= COALESCE(title_record.requirement_achievements, 0) THEN
            INSERT INTO student_titles (student_id, title_id)
            VALUES (student_id_param, title_record.id);
          END IF;

        WHEN 'streak' THEN
          IF streak_days >= COALESCE(title_record.requirement_streak, 0) THEN
            INSERT INTO student_titles (student_id, title_id)
            VALUES (student_id_param, title_record.id);
          END IF;

        WHEN 'level' THEN
          IF village_lvl >= COALESCE(title_record.requirement_level, 0) THEN
            INSERT INTO student_titles (student_id, title_id)
            VALUES (student_id_param, title_record.id);
          END IF;

        ELSE
          NULL;
      END CASE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON student_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_student_titles_student ON student_titles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_titles_title ON student_titles(title_id);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_award_badges TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_titles TO authenticated;