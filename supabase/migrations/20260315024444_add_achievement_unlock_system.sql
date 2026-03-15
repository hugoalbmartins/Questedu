/*
  # Achievement Unlock System with Notifications

  1. New Tables
    - `achievement_templates` - Available achievements
    - `student_achievements` - Unlocked achievements
    - `achievement_progress` - Progress tracking
    - `achievement_notifications` - Unlock notifications
    
  2. Features
    - Achievement definitions
    - Progress tracking
    - Auto-unlock detection
    - Notification system
    - Reward distribution
    - Achievement categories
    
  3. Security
    - RLS for privacy
    - Automatic unlock validation
*/

-- Achievement Categories
DO $$ BEGIN
  CREATE TYPE achievement_category AS ENUM (
    'learning',
    'social',
    'progression',
    'mastery',
    'special',
    'seasonal'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Achievement Templates
CREATE TABLE IF NOT EXISTS achievement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category achievement_category NOT NULL,
  icon text DEFAULT '🏆',
  rarity text DEFAULT 'common',
  points integer DEFAULT 10,
  unlock_criteria jsonb NOT NULL,
  reward_coins integer DEFAULT 0,
  reward_diamonds integer DEFAULT 0,
  reward_xp integer DEFAULT 0,
  is_secret boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active achievements"
  ON achievement_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Student Achievements (Unlocked)
CREATE TABLE IF NOT EXISTS student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievement_templates(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  progress_at_unlock jsonb DEFAULT '{}'::jsonb,
  is_showcased boolean DEFAULT false,
  UNIQUE(student_id, achievement_id)
);

ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own achievements"
  ON student_achievements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_achievements.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own achievements"
  ON student_achievements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_achievements.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's achievements"
  ON student_achievements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_achievements.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view showcased achievements"
  ON student_achievements FOR SELECT
  TO authenticated
  USING (
    is_showcased = true
    AND EXISTS (
      SELECT 1 FROM student_profiles
      WHERE student_profiles.student_id = student_achievements.student_id
      AND student_profiles.is_profile_public = true
    )
  );

-- Achievement Progress Tracking
CREATE TABLE IF NOT EXISTS achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievement_templates(id) ON DELETE CASCADE,
  current_progress jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(student_id, achievement_id)
);

ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
  ON achievement_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = achievement_progress.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Achievement Notifications
CREATE TABLE IF NOT EXISTS achievement_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievement_templates(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievement_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own notifications"
  ON achievement_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = achievement_notifications.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own notifications"
  ON achievement_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = achievement_notifications.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Insert Achievement Templates
INSERT INTO achievement_templates (key, name, description, category, icon, rarity, points, unlock_criteria, reward_coins, reward_diamonds, reward_xp) VALUES
('first_question', 'Primeira Pergunta', 'Respondeu à primeira pergunta', 'learning', '🎯', 'common', 5, '{"total_questions": 1}'::jsonb, 10, 0, 50),
('answerer_10', 'Aprendiz Curioso', 'Respondeu a 10 perguntas', 'learning', '📚', 'common', 10, '{"total_questions": 10}'::jsonb, 50, 1, 100),
('answerer_50', 'Estudante Dedicado', 'Respondeu a 50 perguntas', 'learning', '📖', 'uncommon', 20, '{"total_questions": 50}'::jsonb, 100, 2, 200),
('answerer_100', 'Mestre do Saber', 'Respondeu a 100 perguntas', 'learning', '🎓', 'rare', 30, '{"total_questions": 100}'::jsonb, 200, 5, 500),
('answerer_500', 'Sábio', 'Respondeu a 500 perguntas', 'learning', '👨‍🎓', 'epic', 50, '{"total_questions": 500}'::jsonb, 500, 10, 1000),
('answerer_1000', 'Génio', 'Respondeu a 1000 perguntas', 'learning', '🧠', 'legendary', 100, '{"total_questions": 1000}'::jsonb, 1000, 25, 2500),

('accuracy_50', 'Preciso', 'Manteve 50% de precisão em 20 perguntas', 'mastery', '🎯', 'common', 15, '{"accuracy": 50, "min_questions": 20}'::jsonb, 75, 2, 150),
('accuracy_75', 'Muito Preciso', 'Manteve 75% de precisão em 50 perguntas', 'mastery', '🏹', 'uncommon', 25, '{"accuracy": 75, "min_questions": 50}'::jsonb, 150, 5, 300),
('accuracy_90', 'Perfeccionista', 'Manteve 90% de precisão em 100 perguntas', 'mastery', '💯', 'rare', 40, '{"accuracy": 90, "min_questions": 100}'::jsonb, 300, 10, 600),
('accuracy_95', 'Mestre da Precisão', 'Manteve 95% de precisão em 200 perguntas', 'mastery', '⚡', 'epic', 60, '{"accuracy": 95, "min_questions": 200}'::jsonb, 500, 15, 1000),

('streak_3', 'Persistente', 'Manteve 3 dias de sequência', 'progression', '🔥', 'common', 10, '{"streak": 3}'::jsonb, 50, 1, 100),
('streak_7', 'Dedicado', 'Manteve 7 dias de sequência', 'progression', '⭐', 'uncommon', 20, '{"streak": 7}'::jsonb, 100, 3, 250),
('streak_14', 'Comprometido', 'Manteve 14 dias de sequência', 'progression', '💪', 'rare', 35, '{"streak": 14}'::jsonb, 200, 7, 500),
('streak_30', 'Incansável', 'Manteve 30 dias de sequência', 'progression', '🏆', 'epic', 70, '{"streak": 30}'::jsonb, 500, 20, 1500),
('streak_90', 'Lenda Viva', 'Manteve 90 dias de sequência', 'progression', '👑', 'legendary', 150, '{"streak": 90}'::jsonb, 1500, 50, 5000),

('level_5', 'Nível 5', 'Alcançou nível 5', 'progression', '⬆️', 'common', 10, '{"level": 5}'::jsonb, 50, 1, 0),
('level_10', 'Nível 10', 'Alcançou nível 10', 'progression', '⬆️', 'uncommon', 20, '{"level": 10}'::jsonb, 100, 2, 0),
('level_25', 'Nível 25', 'Alcançou nível 25', 'progression', '⬆️', 'rare', 40, '{"level": 25}'::jsonb, 250, 7, 0),
('level_50', 'Nível 50', 'Alcançou nível 50', 'progression', '⬆️', 'epic', 75, '{"level": 50}'::jsonb, 500, 15, 0),
('level_100', 'Nível 100', 'Alcançou nível 100', 'progression', '⬆️', 'legendary', 150, '{"level": 100}'::jsonb, 1000, 40, 0),

('math_master', 'Mestre da Matemática', 'Dominou matemática', 'mastery', '🔢', 'rare', 50, '{"subject_mastery": "matematica", "min_questions": 100, "accuracy": 80}'::jsonb, 300, 10, 750),
('portuguese_master', 'Mestre do Português', 'Dominou português', 'mastery', '📝', 'rare', 50, '{"subject_mastery": "portugues", "min_questions": 100, "accuracy": 80}'::jsonb, 300, 10, 750),
('science_master', 'Mestre das Ciências', 'Dominou estudo do meio', 'mastery', '🔬', 'rare', 50, '{"subject_mastery": "estudo_meio", "min_questions": 100, "accuracy": 80}'::jsonb, 300, 10, 750),
('english_master', 'Mestre do Inglês', 'Dominou inglês', 'mastery', '🇬🇧', 'rare', 50, '{"subject_mastery": "ingles", "min_questions": 100, "accuracy": 80}'::jsonb, 300, 10, 750),

('social_butterfly', 'Borboleta Social', 'Fez 5 amigos', 'social', '🦋', 'uncommon', 20, '{"friends": 5}'::jsonb, 100, 3, 200),
('team_player', 'Jogador de Equipa', 'Completou 10 batalhas', 'social', '⚔️', 'uncommon', 25, '{"battles": 10}'::jsonb, 150, 5, 300),
('helpful', 'Ajudante', 'Ajudou 5 colegas', 'social', '🤝', 'rare', 30, '{"helps": 5}'::jsonb, 200, 7, 400),

('early_bird', 'Madrugador', 'Jogou antes das 8h', 'special', '🌅', 'uncommon', 15, '{"early_bird": true}'::jsonb, 75, 2, 150),
('night_owl', 'Coruja Noturna', 'Jogou depois das 22h', 'special', '🦉', 'uncommon', 15, '{"night_owl": true}'::jsonb, 75, 2, 150),
('weekend_warrior', 'Guerreiro de Fim de Semana', 'Jogou 10 fins de semana consecutivos', 'special', '⚔️', 'rare', 35, '{"weekend_streak": 10}'::jsonb, 200, 8, 500)
ON CONFLICT (key) DO NOTHING;

-- Function to unlock achievement
CREATE OR REPLACE FUNCTION unlock_achievement(
  student_id_param uuid,
  achievement_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  achievement_record RECORD;
  already_unlocked boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM student_achievements
    WHERE student_id = student_id_param
    AND achievement_id = achievement_id_param
  ) INTO already_unlocked;

  IF already_unlocked THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already unlocked');
  END IF;

  SELECT * INTO achievement_record
  FROM achievement_templates
  WHERE id = achievement_id_param
  AND is_active = true;

  IF achievement_record IS NULL THEN
    RAISE EXCEPTION 'Achievement not found';
  END IF;

  INSERT INTO student_achievements (
    student_id,
    achievement_id
  ) VALUES (
    student_id_param,
    achievement_id_param
  );

  UPDATE students
  SET
    coins = coins + achievement_record.reward_coins,
    diamonds = diamonds + achievement_record.reward_diamonds,
    xp = xp + achievement_record.reward_xp
  WHERE id = student_id_param;

  INSERT INTO achievement_notifications (
    student_id,
    achievement_id
  ) VALUES (
    student_id_param,
    achievement_id_param
  );

  RETURN jsonb_build_object(
    'success', true,
    'achievement', jsonb_build_object(
      'name', achievement_record.name,
      'description', achievement_record.description,
      'icon', achievement_record.icon,
      'rarity', achievement_record.rarity,
      'points', achievement_record.points,
      'rewards', jsonb_build_object(
        'coins', achievement_record.reward_coins,
        'diamonds', achievement_record.reward_diamonds,
        'xp', achievement_record.reward_xp
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(student_id_param uuid)
RETURNS jsonb[] AS $$
DECLARE
  student_stats RECORD;
  achievement_record RECORD;
  unlocked_achievements jsonb[] := ARRAY[]::jsonb[];
  unlock_result jsonb;
BEGIN
  SELECT 
    s.*,
    COUNT(DISTINCT sa.id) as total_achievements,
    (SELECT COUNT(*) FROM quiz_responses WHERE student_id = s.id) as total_questions,
    (SELECT COUNT(*) FROM quiz_responses WHERE student_id = s.id AND is_correct = true)::numeric / 
      NULLIF((SELECT COUNT(*) FROM quiz_responses WHERE student_id = s.id), 0) * 100 as accuracy,
    COALESCE(s.streak, 0) as streak,
    (s.xp / 1000) + 1 as level
  INTO student_stats
  FROM students s
  LEFT JOIN student_achievements sa ON sa.student_id = s.id
  WHERE s.id = student_id_param
  GROUP BY s.id;

  FOR achievement_record IN
    SELECT * FROM achievement_templates
    WHERE is_active = true
    AND id NOT IN (
      SELECT achievement_id FROM student_achievements
      WHERE student_id = student_id_param
    )
  LOOP
    IF (achievement_record.unlock_criteria->>'total_questions')::integer IS NOT NULL THEN
      IF student_stats.total_questions >= (achievement_record.unlock_criteria->>'total_questions')::integer THEN
        unlock_result := unlock_achievement(student_id_param, achievement_record.id);
        IF (unlock_result->>'success')::boolean THEN
          unlocked_achievements := array_append(unlocked_achievements, unlock_result->'achievement');
        END IF;
      END IF;
    END IF;

    IF (achievement_record.unlock_criteria->>'streak')::integer IS NOT NULL THEN
      IF student_stats.streak >= (achievement_record.unlock_criteria->>'streak')::integer THEN
        unlock_result := unlock_achievement(student_id_param, achievement_record.id);
        IF (unlock_result->>'success')::boolean THEN
          unlocked_achievements := array_append(unlocked_achievements, unlock_result->'achievement');
        END IF;
      END IF;
    END IF;

    IF (achievement_record.unlock_criteria->>'level')::integer IS NOT NULL THEN
      IF student_stats.level >= (achievement_record.unlock_criteria->>'level')::integer THEN
        unlock_result := unlock_achievement(student_id_param, achievement_record.id);
        IF (unlock_result->>'success')::boolean THEN
          unlocked_achievements := array_append(unlocked_achievements, unlock_result->'achievement');
        END IF;
      END IF;
    END IF;

    IF (achievement_record.unlock_criteria->>'accuracy')::integer IS NOT NULL THEN
      IF student_stats.total_questions >= COALESCE((achievement_record.unlock_criteria->>'min_questions')::integer, 0)
        AND student_stats.accuracy >= (achievement_record.unlock_criteria->>'accuracy')::integer THEN
        unlock_result := unlock_achievement(student_id_param, achievement_record.id);
        IF (unlock_result->>'success')::boolean THEN
          unlocked_achievements := array_append(unlocked_achievements, unlock_result->'achievement');
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN unlocked_achievements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notifications
CREATE OR REPLACE FUNCTION get_achievement_notifications(student_id_param uuid)
RETURNS TABLE (
  id uuid,
  achievement_name text,
  achievement_description text,
  achievement_icon text,
  achievement_rarity text,
  reward_coins integer,
  reward_diamonds integer,
  reward_xp integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    an.id,
    at.name,
    at.description,
    at.icon,
    at.rarity,
    at.reward_coins,
    at.reward_diamonds,
    at.reward_xp,
    an.created_at
  FROM achievement_notifications an
  JOIN achievement_templates at ON at.id = an.achievement_id
  WHERE an.student_id = student_id_param
  AND an.is_read = false
  ORDER BY an.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids uuid[])
RETURNS void AS $$
BEGIN
  UPDATE achievement_notifications
  SET is_read = true
  WHERE id = ANY(notification_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_achievements_student
  ON student_achievements(student_id);

CREATE INDEX IF NOT EXISTS idx_student_achievements_achievement
  ON student_achievements(achievement_id);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_student
  ON achievement_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_achievement_notifications_student
  ON achievement_notifications(student_id, is_read);

CREATE INDEX IF NOT EXISTS idx_achievement_templates_category
  ON achievement_templates(category, is_active);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION unlock_achievement TO authenticated;
GRANT EXECUTE ON FUNCTION check_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION get_achievement_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read TO authenticated;