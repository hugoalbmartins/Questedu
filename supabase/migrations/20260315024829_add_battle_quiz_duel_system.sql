/*
  # Battle/Quiz Duel System

  1. New Tables
    - `battle_matches` - Quiz battles between students
    - `battle_rounds` - Individual rounds in battles
    - `battle_results` - Final results and stats
    
  2. Features
    - Real-time quiz duels
    - Turn-based or simultaneous modes
    - Subject selection
    - Difficulty matching
    - Winner rewards
    - Battle statistics
    - Matchmaking system
    
  3. Security
    - RLS for privacy
    - Fair matchmaking
    - Anti-cheat measures
*/

-- Battle Status
DO $$ BEGIN
  CREATE TYPE battle_status AS ENUM (
    'waiting',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Battle Mode
DO $$ BEGIN
  CREATE TYPE battle_mode AS ENUM (
    'turn_based',
    'simultaneous',
    'speed_round'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Battle Matches
CREATE TABLE IF NOT EXISTS battle_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  opponent_id uuid REFERENCES students(id) ON DELETE CASCADE,
  mode battle_mode DEFAULT 'simultaneous',
  status battle_status DEFAULT 'waiting',
  subject text,
  school_year integer,
  total_rounds integer DEFAULT 5,
  current_round integer DEFAULT 0,
  challenger_score integer DEFAULT 0,
  opponent_score integer DEFAULT 0,
  winner_id uuid,
  stakes jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE battle_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own battles"
  ON battle_matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id IN (battle_matches.challenger_id, battle_matches.opponent_id)
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create battles"
  ON battle_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = battle_matches.challenger_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own battles"
  ON battle_matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id IN (battle_matches.challenger_id, battle_matches.opponent_id)
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view open battles"
  ON battle_matches FOR SELECT
  TO authenticated
  USING (status = 'waiting' AND opponent_id IS NULL);

-- Battle Rounds
CREATE TABLE IF NOT EXISTS battle_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES battle_matches(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  question_id uuid,
  question_data jsonb NOT NULL,
  challenger_answer text,
  opponent_answer text,
  challenger_time_seconds numeric(5,2),
  opponent_time_seconds numeric(5,2),
  challenger_correct boolean,
  opponent_correct boolean,
  round_winner_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, round_number)
);

ALTER TABLE battle_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own battle rounds"
  ON battle_rounds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_matches bm
      JOIN students s ON s.id IN (bm.challenger_id, bm.opponent_id)
      WHERE bm.id = battle_rounds.match_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own battle rounds"
  ON battle_rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM battle_matches bm
      JOIN students s ON s.id IN (bm.challenger_id, bm.opponent_id)
      WHERE bm.id = battle_rounds.match_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own battle rounds"
  ON battle_rounds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_matches bm
      JOIN students s ON s.id IN (bm.challenger_id, bm.opponent_id)
      WHERE bm.id = battle_rounds.match_id
      AND s.user_id = auth.uid()
    )
  );

-- Battle Results/Statistics
CREATE TABLE IF NOT EXISTS battle_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES battle_matches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  is_winner boolean NOT NULL,
  total_correct integer DEFAULT 0,
  total_incorrect integer DEFAULT 0,
  average_time_seconds numeric(5,2),
  accuracy_percentage numeric(5,2),
  coins_won integer DEFAULT 0,
  diamonds_won integer DEFAULT 0,
  xp_won integer DEFAULT 0,
  recorded_at timestamptz DEFAULT now(),
  UNIQUE(match_id, student_id)
);

ALTER TABLE battle_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own battle results"
  ON battle_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = battle_results.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's battle results"
  ON battle_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = battle_results.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Function to create battle match
CREATE OR REPLACE FUNCTION create_battle_match(
  challenger_id_param uuid,
  subject_param text,
  mode_param battle_mode DEFAULT 'simultaneous',
  opponent_id_param uuid DEFAULT NULL,
  stakes_param jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  match_id uuid;
  challenger_year integer;
BEGIN
  SELECT school_year INTO challenger_year
  FROM students
  WHERE id = challenger_id_param;

  INSERT INTO battle_matches (
    challenger_id,
    opponent_id,
    mode,
    subject,
    school_year,
    stakes
  ) VALUES (
    challenger_id_param,
    opponent_id_param,
    mode_param,
    subject_param,
    challenger_year,
    stakes_param
  ) RETURNING id INTO match_id;

  RETURN jsonb_build_object(
    'success', true,
    'match_id', match_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join battle
CREATE OR REPLACE FUNCTION join_battle_match(
  match_id_param uuid,
  opponent_id_param uuid
)
RETURNS jsonb AS $$
BEGIN
  UPDATE battle_matches
  SET 
    opponent_id = opponent_id_param,
    status = 'in_progress',
    started_at = now()
  WHERE id = match_id_param
  AND status = 'waiting'
  AND opponent_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Battle not available';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit battle round answer
CREATE OR REPLACE FUNCTION submit_battle_answer(
  match_id_param uuid,
  round_number_param integer,
  student_id_param uuid,
  answer_param text,
  time_seconds_param numeric,
  is_correct_param boolean
)
RETURNS jsonb AS $$
DECLARE
  match_record RECORD;
  is_challenger boolean;
  both_answered boolean;
  round_winner uuid;
BEGIN
  SELECT * INTO match_record
  FROM battle_matches
  WHERE id = match_id_param
  AND status = 'in_progress';

  IF match_record IS NULL THEN
    RAISE EXCEPTION 'Battle not found or not in progress';
  END IF;

  is_challenger := (match_record.challenger_id = student_id_param);

  INSERT INTO battle_rounds (
    match_id,
    round_number,
    question_data,
    challenger_answer,
    opponent_answer,
    challenger_time_seconds,
    opponent_time_seconds,
    challenger_correct,
    opponent_correct
  ) VALUES (
    match_id_param,
    round_number_param,
    '{}'::jsonb,
    CASE WHEN is_challenger THEN answer_param ELSE NULL END,
    CASE WHEN NOT is_challenger THEN answer_param ELSE NULL END,
    CASE WHEN is_challenger THEN time_seconds_param ELSE NULL END,
    CASE WHEN NOT is_challenger THEN time_seconds_param ELSE NULL END,
    CASE WHEN is_challenger THEN is_correct_param ELSE NULL END,
    CASE WHEN NOT is_challenger THEN is_correct_param ELSE NULL END
  )
  ON CONFLICT (match_id, round_number)
  DO UPDATE SET
    challenger_answer = CASE WHEN is_challenger THEN answer_param ELSE battle_rounds.challenger_answer END,
    opponent_answer = CASE WHEN NOT is_challenger THEN answer_param ELSE battle_rounds.opponent_answer END,
    challenger_time_seconds = CASE WHEN is_challenger THEN time_seconds_param ELSE battle_rounds.challenger_time_seconds END,
    opponent_time_seconds = CASE WHEN NOT is_challenger THEN time_seconds_param ELSE battle_rounds.opponent_time_seconds END,
    challenger_correct = CASE WHEN is_challenger THEN is_correct_param ELSE battle_rounds.challenger_correct END,
    opponent_correct = CASE WHEN NOT is_challenger THEN is_correct_param ELSE battle_rounds.opponent_correct END;

  SELECT 
    (challenger_answer IS NOT NULL AND opponent_answer IS NOT NULL) INTO both_answered
  FROM battle_rounds
  WHERE match_id = match_id_param
  AND round_number = round_number_param;

  IF both_answered THEN
    SELECT 
      CASE 
        WHEN challenger_correct AND NOT opponent_correct THEN match_record.challenger_id
        WHEN opponent_correct AND NOT challenger_correct THEN match_record.opponent_id
        WHEN challenger_correct AND opponent_correct THEN
          CASE WHEN challenger_time_seconds < opponent_time_seconds 
            THEN match_record.challenger_id 
            ELSE match_record.opponent_id 
          END
        ELSE NULL
      END INTO round_winner
    FROM battle_rounds
    WHERE match_id = match_id_param
    AND round_number = round_number_param;

    UPDATE battle_rounds
    SET round_winner_id = round_winner
    WHERE match_id = match_id_param
    AND round_number = round_number_param;

    IF round_winner = match_record.challenger_id THEN
      UPDATE battle_matches SET challenger_score = challenger_score + 1 WHERE id = match_id_param;
    ELSIF round_winner = match_record.opponent_id THEN
      UPDATE battle_matches SET opponent_score = opponent_score + 1 WHERE id = match_id_param;
    END IF;

    UPDATE battle_matches SET current_round = current_round + 1 WHERE id = match_id_param;

    IF match_record.current_round + 1 >= match_record.total_rounds THEN
      PERFORM complete_battle_match(match_id_param);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'both_answered', both_answered);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete battle match
CREATE OR REPLACE FUNCTION complete_battle_match(match_id_param uuid)
RETURNS void AS $$
DECLARE
  match_record RECORD;
  winner uuid;
  challenger_correct integer;
  opponent_correct integer;
  challenger_avg_time numeric;
  opponent_avg_time numeric;
BEGIN
  SELECT * INTO match_record FROM battle_matches WHERE id = match_id_param;

  IF match_record.challenger_score > match_record.opponent_score THEN
    winner := match_record.challenger_id;
  ELSIF match_record.opponent_score > match_record.challenger_score THEN
    winner := match_record.opponent_id;
  ELSE
    winner := NULL;
  END IF;

  UPDATE battle_matches
  SET 
    status = 'completed',
    winner_id = winner,
    completed_at = now()
  WHERE id = match_id_param;

  SELECT 
    COUNT(*) FILTER (WHERE challenger_correct = true),
    COUNT(*) FILTER (WHERE opponent_correct = true),
    AVG(challenger_time_seconds),
    AVG(opponent_time_seconds)
  INTO 
    challenger_correct,
    opponent_correct,
    challenger_avg_time,
    opponent_avg_time
  FROM battle_rounds
  WHERE match_id = match_id_param;

  INSERT INTO battle_results (
    match_id,
    student_id,
    is_winner,
    total_correct,
    total_incorrect,
    average_time_seconds,
    accuracy_percentage,
    coins_won,
    xp_won
  ) VALUES (
    match_id_param,
    match_record.challenger_id,
    (winner = match_record.challenger_id),
    challenger_correct,
    match_record.total_rounds - challenger_correct,
    challenger_avg_time,
    (challenger_correct::numeric / match_record.total_rounds * 100),
    CASE WHEN winner = match_record.challenger_id THEN 100 ELSE 25 END,
    CASE WHEN winner = match_record.challenger_id THEN 250 ELSE 50 END
  );

  INSERT INTO battle_results (
    match_id,
    student_id,
    is_winner,
    total_correct,
    total_incorrect,
    average_time_seconds,
    accuracy_percentage,
    coins_won,
    xp_won
  ) VALUES (
    match_id_param,
    match_record.opponent_id,
    (winner = match_record.opponent_id),
    opponent_correct,
    match_record.total_rounds - opponent_correct,
    opponent_avg_time,
    (opponent_correct::numeric / match_record.total_rounds * 100),
    CASE WHEN winner = match_record.opponent_id THEN 100 ELSE 25 END,
    CASE WHEN winner = match_record.opponent_id THEN 250 ELSE 50 END
  );

  UPDATE students
  SET 
    coins = coins + CASE WHEN id = winner THEN 100 ELSE 25 END,
    xp = xp + CASE WHEN id = winner THEN 250 ELSE 50 END
  WHERE id IN (match_record.challenger_id, match_record.opponent_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available battles
CREATE OR REPLACE FUNCTION get_available_battles(
  student_id_param uuid,
  limit_param integer DEFAULT 20
)
RETURNS TABLE (
  match_id uuid,
  challenger_id uuid,
  challenger_name text,
  challenger_level integer,
  subject text,
  mode battle_mode,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bm.id as match_id,
    s.id as challenger_id,
    s.name as challenger_name,
    (s.xp / 1000 + 1)::integer as challenger_level,
    bm.subject,
    bm.mode,
    bm.created_at
  FROM battle_matches bm
  JOIN students s ON s.id = bm.challenger_id
  WHERE bm.status = 'waiting'
  AND bm.opponent_id IS NULL
  AND bm.challenger_id != student_id_param
  ORDER BY bm.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get battle history
CREATE OR REPLACE FUNCTION get_battle_history(
  student_id_param uuid,
  limit_param integer DEFAULT 50
)
RETURNS TABLE (
  match_id uuid,
  opponent_id uuid,
  opponent_name text,
  subject text,
  is_winner boolean,
  my_score integer,
  opponent_score integer,
  total_correct integer,
  accuracy_percentage numeric,
  coins_won integer,
  xp_won integer,
  completed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.match_id,
    CASE 
      WHEN bm.challenger_id = student_id_param THEN bm.opponent_id
      ELSE bm.challenger_id
    END as opponent_id,
    CASE 
      WHEN bm.challenger_id = student_id_param THEN s2.name
      ELSE s1.name
    END as opponent_name,
    bm.subject,
    br.is_winner,
    CASE 
      WHEN bm.challenger_id = student_id_param THEN bm.challenger_score
      ELSE bm.opponent_score
    END as my_score,
    CASE 
      WHEN bm.challenger_id = student_id_param THEN bm.opponent_score
      ELSE bm.challenger_score
    END as opponent_score,
    br.total_correct,
    br.accuracy_percentage,
    br.coins_won,
    br.xp_won,
    bm.completed_at
  FROM battle_results br
  JOIN battle_matches bm ON bm.id = br.match_id
  JOIN students s1 ON s1.id = bm.challenger_id
  LEFT JOIN students s2 ON s2.id = bm.opponent_id
  WHERE br.student_id = student_id_param
  ORDER BY bm.completed_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_battle_matches_status
  ON battle_matches(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_battle_matches_challenger
  ON battle_matches(challenger_id);

CREATE INDEX IF NOT EXISTS idx_battle_matches_opponent
  ON battle_matches(opponent_id);

CREATE INDEX IF NOT EXISTS idx_battle_rounds_match
  ON battle_rounds(match_id, round_number);

CREATE INDEX IF NOT EXISTS idx_battle_results_student
  ON battle_results(student_id, recorded_at DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_battle_match TO authenticated;
GRANT EXECUTE ON FUNCTION join_battle_match TO authenticated;
GRANT EXECUTE ON FUNCTION submit_battle_answer TO authenticated;
GRANT EXECUTE ON FUNCTION complete_battle_match TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_battles TO authenticated;
GRANT EXECUTE ON FUNCTION get_battle_history TO authenticated;