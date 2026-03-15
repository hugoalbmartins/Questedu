/*
  # Educational Mini-games System

  1. New Tables
    - `minigames` - Configuration of available mini-games
    - `minigame_sessions` - Track game sessions
    - `minigame_scores` - High scores and statistics
    
  2. Features
    - Memory card game with educational content
    - Progress tracking
    - Rewards system
    - Leaderboards
    
  3. Security
    - RLS for students
    - Parents can view children's scores
*/

-- Mini-games Configuration Table
CREATE TABLE IF NOT EXISTS minigames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text DEFAULT '🎮',
  difficulty_levels jsonb DEFAULT '["easy", "medium", "hard"]'::jsonb,
  reward_coins_base integer DEFAULT 10,
  reward_diamonds_base integer DEFAULT 1,
  reward_xp_base integer DEFAULT 50,
  min_school_year integer DEFAULT 1,
  max_school_year integer DEFAULT 4,
  subjects jsonb DEFAULT '["matematica", "portugues"]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE minigames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active minigames"
  ON minigames FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Mini-game Sessions Table
CREATE TABLE IF NOT EXISTS minigame_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  minigame_id uuid NOT NULL REFERENCES minigames(id) ON DELETE CASCADE,
  difficulty text NOT NULL,
  subject text,
  school_year integer,
  score integer DEFAULT 0,
  max_score integer DEFAULT 0,
  time_seconds integer DEFAULT 0,
  moves_made integer DEFAULT 0,
  items_matched integer DEFAULT 0,
  accuracy_percentage numeric DEFAULT 0,
  coins_earned integer DEFAULT 0,
  diamonds_earned integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  game_data jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE minigame_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own sessions"
  ON minigame_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = minigame_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own sessions"
  ON minigame_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = minigame_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own sessions"
  ON minigame_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = minigame_sessions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's sessions"
  ON minigame_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = minigame_sessions.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Mini-game High Scores Table
CREATE TABLE IF NOT EXISTS minigame_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  minigame_id uuid NOT NULL REFERENCES minigames(id) ON DELETE CASCADE,
  difficulty text NOT NULL,
  high_score integer DEFAULT 0,
  best_time_seconds integer,
  total_plays integer DEFAULT 0,
  total_wins integer DEFAULT 0,
  average_score numeric DEFAULT 0,
  last_played_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, minigame_id, difficulty)
);

ALTER TABLE minigame_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own scores"
  ON minigame_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = minigame_scores.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's scores"
  ON minigame_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = minigame_scores.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Insert default mini-games
INSERT INTO minigames (name, display_name, description, icon, subjects, min_school_year, max_school_year) VALUES
('memory_cards', 'Jogo da Memória', 'Encontra pares de cartas com perguntas e respostas!', '🎴', '["matematica", "portugues", "estudo_meio", "ingles"]'::jsonb, 1, 4),
('math_race', 'Corrida Matemática', 'Resolve problemas de matemática o mais rápido possível!', '🏃', '["matematica"]'::jsonb, 1, 4),
('word_builder', 'Construtor de Palavras', 'Forma palavras corretamente!', '📝', '["portugues"]'::jsonb, 1, 4)
ON CONFLICT (name) DO NOTHING;

-- Function to start a minigame session
CREATE OR REPLACE FUNCTION start_minigame_session(
  student_id_param uuid,
  minigame_name text,
  difficulty_param text,
  subject_param text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  minigame_record RECORD;
  session_id uuid;
  student_year integer;
BEGIN
  SELECT school_year INTO student_year
  FROM students
  WHERE id = student_id_param;

  SELECT * INTO minigame_record
  FROM minigames
  WHERE name = minigame_name
  AND is_active = true
  AND student_year >= min_school_year
  AND student_year <= max_school_year;

  IF minigame_record IS NULL THEN
    RAISE EXCEPTION 'Minigame not available';
  END IF;

  INSERT INTO minigame_sessions (
    student_id,
    minigame_id,
    difficulty,
    subject,
    school_year
  ) VALUES (
    student_id_param,
    minigame_record.id,
    difficulty_param,
    subject_param,
    student_year
  )
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a minigame session
CREATE OR REPLACE FUNCTION complete_minigame_session(
  session_id_param uuid,
  score_param integer,
  max_score_param integer,
  time_seconds_param integer,
  moves_param integer DEFAULT 0,
  items_matched_param integer DEFAULT 0
)
RETURNS jsonb AS $$
DECLARE
  session_record RECORD;
  minigame_record RECORD;
  accuracy numeric;
  coins integer;
  diamonds integer;
  xp integer;
  difficulty_multiplier numeric := 1.0;
  performance_bonus numeric := 0;
  is_new_high_score boolean := false;
BEGIN
  SELECT * INTO session_record
  FROM minigame_sessions
  WHERE id = session_id_param;

  IF session_record IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  SELECT * INTO minigame_record
  FROM minigames
  WHERE id = session_record.minigame_id;

  accuracy := (score_param::numeric / NULLIF(max_score_param, 0)::numeric) * 100;

  CASE session_record.difficulty
    WHEN 'easy' THEN difficulty_multiplier := 1.0;
    WHEN 'medium' THEN difficulty_multiplier := 1.5;
    WHEN 'hard' THEN difficulty_multiplier := 2.0;
  END CASE;

  IF accuracy >= 90 THEN
    performance_bonus := 0.5;
  ELSIF accuracy >= 75 THEN
    performance_bonus := 0.25;
  END IF;

  coins := FLOOR(minigame_record.reward_coins_base * difficulty_multiplier * (1 + performance_bonus));
  diamonds := FLOOR(minigame_record.reward_diamonds_base * difficulty_multiplier);
  xp := FLOOR(minigame_record.reward_xp_base * difficulty_multiplier * (1 + performance_bonus));

  UPDATE minigame_sessions
  SET
    score = score_param,
    max_score = max_score_param,
    time_seconds = time_seconds_param,
    moves_made = moves_param,
    items_matched = items_matched_param,
    accuracy_percentage = accuracy,
    coins_earned = coins,
    diamonds_earned = diamonds,
    xp_earned = xp,
    completed = true,
    completed_at = now()
  WHERE id = session_id_param;

  UPDATE students
  SET
    coins = coins + coins,
    diamonds = diamonds + diamonds,
    xp = xp + xp
  WHERE id = session_record.student_id;

  INSERT INTO minigame_scores (
    student_id,
    minigame_id,
    difficulty,
    high_score,
    best_time_seconds,
    total_plays,
    total_wins,
    average_score,
    last_played_at
  ) VALUES (
    session_record.student_id,
    session_record.minigame_id,
    session_record.difficulty,
    score_param,
    time_seconds_param,
    1,
    CASE WHEN accuracy >= 50 THEN 1 ELSE 0 END,
    score_param,
    now()
  )
  ON CONFLICT (student_id, minigame_id, difficulty)
  DO UPDATE SET
    high_score = GREATEST(minigame_scores.high_score, score_param),
    best_time_seconds = LEAST(COALESCE(minigame_scores.best_time_seconds, 999999), time_seconds_param),
    total_plays = minigame_scores.total_plays + 1,
    total_wins = minigame_scores.total_wins + CASE WHEN accuracy >= 50 THEN 1 ELSE 0 END,
    average_score = ((minigame_scores.average_score * minigame_scores.total_plays) + score_param) / (minigame_scores.total_plays + 1),
    last_played_at = now(),
    updated_at = now()
  RETURNING (high_score < score_param) INTO is_new_high_score;

  RETURN jsonb_build_object(
    'coins_earned', coins,
    'diamonds_earned', diamonds,
    'xp_earned', xp,
    'accuracy', accuracy,
    'is_new_high_score', COALESCE(is_new_high_score, false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get minigame leaderboard
CREATE OR REPLACE FUNCTION get_minigame_leaderboard(
  minigame_name text,
  difficulty_param text,
  limit_param integer DEFAULT 10
)
RETURNS TABLE (
  rank bigint,
  student_name text,
  high_score integer,
  best_time integer,
  total_plays integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY ms.high_score DESC, ms.best_time_seconds ASC) as rank,
    s.name::text,
    ms.high_score,
    ms.best_time_seconds,
    ms.total_plays
  FROM minigame_scores ms
  JOIN students s ON s.id = ms.student_id
  JOIN minigames m ON m.id = ms.minigame_id
  WHERE m.name = minigame_name
  AND ms.difficulty = difficulty_param
  ORDER BY ms.high_score DESC, ms.best_time_seconds ASC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_minigame_sessions_student
  ON minigame_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_minigame_sessions_minigame
  ON minigame_sessions(minigame_id);

CREATE INDEX IF NOT EXISTS idx_minigame_sessions_completed
  ON minigame_sessions(completed, completed_at);

CREATE INDEX IF NOT EXISTS idx_minigame_scores_student
  ON minigame_scores(student_id);

CREATE INDEX IF NOT EXISTS idx_minigame_scores_minigame
  ON minigame_scores(minigame_id, difficulty);

CREATE INDEX IF NOT EXISTS idx_minigame_scores_high_score
  ON minigame_scores(high_score DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_minigame_session TO authenticated;
GRANT EXECUTE ON FUNCTION complete_minigame_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_minigame_leaderboard TO authenticated;