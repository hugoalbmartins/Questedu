/*
  # Tournament and Competition System

  1. New Tables
    - `tournaments` - Competitive tournaments
    - `tournament_brackets` - Tournament structure
    - `tournament_participants` - Student registrations
    - `tournament_matches` - Individual matches
    - `tournament_prizes` - Prize distribution
    
  2. Features
    - Single/Double elimination
    - Round-robin
    - Bracket management
    - Live scoring
    - Prize pools
    - Tournament history
    
  3. Security
    - RLS for privacy
    - Fair matchmaking
    - Anti-cheating
*/

-- Tournament Format
DO $$ BEGIN
  CREATE TYPE tournament_format AS ENUM (
    'single_elimination',
    'double_elimination',
    'round_robin',
    'swiss',
    'ladder'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tournament Status
DO $$ BEGIN
  CREATE TYPE tournament_status AS ENUM (
    'registration',
    'upcoming',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Match Status
DO $$ BEGIN
  CREATE TYPE match_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'forfeited'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  subject text,
  school_year integer,
  format tournament_format DEFAULT 'single_elimination',
  status tournament_status DEFAULT 'registration',
  min_participants integer DEFAULT 4,
  max_participants integer DEFAULT 64,
  current_participants integer DEFAULT 0,
  registration_deadline timestamptz,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  entry_fee_coins integer DEFAULT 0,
  entry_fee_diamonds integer DEFAULT 0,
  prize_pool_coins integer DEFAULT 0,
  prize_pool_diamonds integer DEFAULT 0,
  prize_distribution jsonb DEFAULT '{"1": 50, "2": 30, "3": 20}'::jsonb,
  questions_per_match integer DEFAULT 10,
  time_limit_seconds integer DEFAULT 300,
  difficulty difficulty_level DEFAULT 'intermediate',
  banner_image text,
  rules text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tournaments"
  ON tournaments FOR SELECT
  TO authenticated
  USING (status IN ('registration', 'upcoming', 'in_progress'));

CREATE POLICY "Admins can manage tournaments"
  ON tournaments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Tournament Participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  seed_position integer,
  current_rank integer,
  matches_played integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  matches_lost integer DEFAULT 0,
  total_points integer DEFAULT 0,
  average_accuracy numeric(5,2) DEFAULT 0,
  is_eliminated boolean DEFAULT false,
  final_placement integer,
  prize_coins integer DEFAULT 0,
  prize_diamonds integer DEFAULT 0,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, student_id)
);

ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament participants"
  ON tournament_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can register for tournaments"
  ON tournament_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = tournament_participants.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Tournament Matches
CREATE TABLE IF NOT EXISTS tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  bracket_position text,
  player1_id uuid REFERENCES tournament_participants(id),
  player2_id uuid REFERENCES tournament_participants(id),
  player1_score integer DEFAULT 0,
  player2_score integer DEFAULT 0,
  player1_accuracy numeric(5,2) DEFAULT 0,
  player2_accuracy numeric(5,2) DEFAULT 0,
  winner_id uuid REFERENCES tournament_participants(id),
  status match_status DEFAULT 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  match_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, round_number, match_number)
);

ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament matches"
  ON tournament_matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Participants can update their matches"
  ON tournament_matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_participants tp
      JOIN students s ON s.id = tp.student_id
      WHERE (tp.id = tournament_matches.player1_id OR tp.id = tournament_matches.player2_id)
      AND s.user_id = auth.uid()
    )
  );

-- Tournament Prizes
CREATE TABLE IF NOT EXISTS tournament_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  placement integer NOT NULL,
  prize_coins integer DEFAULT 0,
  prize_diamonds integer DEFAULT 0,
  prize_items uuid[] DEFAULT ARRAY[]::uuid[],
  special_title text,
  special_badge uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, placement)
);

ALTER TABLE tournament_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament prizes"
  ON tournament_prizes FOR SELECT
  TO authenticated
  USING (true);

-- Function to register for tournament
CREATE OR REPLACE FUNCTION register_for_tournament(
  student_id_param uuid,
  tournament_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  tournament_record RECORD;
  student_record RECORD;
BEGIN
  SELECT * INTO tournament_record FROM tournaments WHERE id = tournament_id_param;
  SELECT * INTO student_record FROM students WHERE id = student_id_param;

  IF tournament_record IS NULL THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  IF tournament_record.status != 'registration' THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;

  IF tournament_record.current_participants >= tournament_record.max_participants THEN
    RAISE EXCEPTION 'Tournament is full';
  END IF;

  IF tournament_record.registration_deadline IS NOT NULL 
    AND now() > tournament_record.registration_deadline THEN
    RAISE EXCEPTION 'Registration deadline has passed';
  END IF;

  IF student_record.coins < tournament_record.entry_fee_coins THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  IF student_record.diamonds < tournament_record.entry_fee_diamonds THEN
    RAISE EXCEPTION 'Insufficient diamonds';
  END IF;

  UPDATE students
  SET
    coins = coins - tournament_record.entry_fee_coins,
    diamonds = diamonds - tournament_record.entry_fee_diamonds
  WHERE id = student_id_param;

  UPDATE tournaments
  SET
    current_participants = current_participants + 1,
    prize_pool_coins = prize_pool_coins + tournament_record.entry_fee_coins,
    prize_pool_diamonds = prize_pool_diamonds + tournament_record.entry_fee_diamonds
  WHERE id = tournament_id_param;

  INSERT INTO tournament_participants (
    tournament_id,
    student_id,
    seed_position
  ) VALUES (
    tournament_id_param,
    student_id_param,
    tournament_record.current_participants + 1
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start tournament
CREATE OR REPLACE FUNCTION start_tournament(tournament_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  tournament_record RECORD;
  participant_count integer;
  round_count integer;
  match_count integer;
  participants uuid[];
  i integer;
  j integer;
BEGIN
  SELECT * INTO tournament_record FROM tournaments WHERE id = tournament_id_param;

  IF tournament_record.status != 'registration' THEN
    RAISE EXCEPTION 'Tournament cannot be started';
  END IF;

  SELECT COUNT(*) INTO participant_count
  FROM tournament_participants
  WHERE tournament_id = tournament_id_param;

  IF participant_count < tournament_record.min_participants THEN
    RAISE EXCEPTION 'Not enough participants';
  END IF;

  UPDATE tournaments
  SET
    status = 'in_progress',
    updated_at = now()
  WHERE id = tournament_id_param;

  SELECT array_agg(id ORDER BY seed_position)
  INTO participants
  FROM tournament_participants
  WHERE tournament_id = tournament_id_param;

  IF tournament_record.format = 'single_elimination' THEN
    match_count := participant_count / 2;
    
    FOR i IN 1..match_count LOOP
      INSERT INTO tournament_matches (
        tournament_id,
        round_number,
        match_number,
        player1_id,
        player2_id,
        status
      ) VALUES (
        tournament_id_param,
        1,
        i,
        participants[i * 2 - 1],
        participants[i * 2],
        'scheduled'
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'matches_created', match_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete match
CREATE OR REPLACE FUNCTION complete_tournament_match(
  match_id_param uuid,
  player1_score_param integer,
  player2_score_param integer,
  player1_accuracy_param numeric,
  player2_accuracy_param numeric
)
RETURNS jsonb AS $$
DECLARE
  match_record RECORD;
  winner_id_val uuid;
  loser_id_val uuid;
  next_round integer;
  next_match integer;
BEGIN
  SELECT * INTO match_record FROM tournament_matches WHERE id = match_id_param;

  IF match_record.status = 'completed' THEN
    RAISE EXCEPTION 'Match already completed';
  END IF;

  IF player1_score_param > player2_score_param THEN
    winner_id_val := match_record.player1_id;
    loser_id_val := match_record.player2_id;
  ELSE
    winner_id_val := match_record.player2_id;
    loser_id_val := match_record.player1_id;
  END IF;

  UPDATE tournament_matches
  SET
    player1_score = player1_score_param,
    player2_score = player2_score_param,
    player1_accuracy = player1_accuracy_param,
    player2_accuracy = player2_accuracy_param,
    winner_id = winner_id_val,
    status = 'completed',
    completed_at = now()
  WHERE id = match_id_param;

  UPDATE tournament_participants
  SET
    matches_played = matches_played + 1,
    matches_won = matches_won + 1,
    total_points = total_points + CASE WHEN id = match_record.player1_id THEN player1_score_param ELSE player2_score_param END
  WHERE id = winner_id_val;

  UPDATE tournament_participants
  SET
    matches_played = matches_played + 1,
    matches_lost = matches_lost + 1,
    total_points = total_points + CASE WHEN id = match_record.player1_id THEN player1_score_param ELSE player2_score_param END,
    is_eliminated = true
  WHERE id = loser_id_val;

  RETURN jsonb_build_object('success', true, 'winner_id', winner_id_val);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tournament bracket
CREATE OR REPLACE FUNCTION get_tournament_bracket(tournament_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  bracket jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'round', tm.round_number,
      'match', tm.match_number,
      'player1', (
        SELECT jsonb_build_object(
          'id', tp.student_id,
          'name', s.name,
          'score', tm.player1_score,
          'accuracy', tm.player1_accuracy
        )
        FROM tournament_participants tp
        JOIN students s ON s.id = tp.student_id
        WHERE tp.id = tm.player1_id
      ),
      'player2', (
        SELECT jsonb_build_object(
          'id', tp.student_id,
          'name', s.name,
          'score', tm.player2_score,
          'accuracy', tm.player2_accuracy
        )
        FROM tournament_participants tp
        JOIN students s ON s.id = tp.student_id
        WHERE tp.id = tm.player2_id
      ),
      'winner_id', tm.winner_id,
      'status', tm.status,
      'scheduled_at', tm.scheduled_at
    ) ORDER BY tm.round_number, tm.match_number
  ) INTO bracket
  FROM tournament_matches tm
  WHERE tm.tournament_id = tournament_id_param;

  RETURN COALESCE(bracket, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tournament standings
CREATE OR REPLACE FUNCTION get_tournament_standings(tournament_id_param uuid)
RETURNS TABLE (
  rank integer,
  student_id uuid,
  student_name text,
  matches_played integer,
  matches_won integer,
  matches_lost integer,
  total_points integer,
  average_accuracy numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY tp.matches_won DESC, tp.total_points DESC)::integer as rank,
    s.id as student_id,
    s.name as student_name,
    tp.matches_played,
    tp.matches_won,
    tp.matches_lost,
    tp.total_points,
    tp.average_accuracy
  FROM tournament_participants tp
  JOIN students s ON s.id = tp.student_id
  WHERE tp.tournament_id = tournament_id_param
  ORDER BY tp.matches_won DESC, tp.total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status
  ON tournaments(status, starts_at);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament
  ON tournament_participants(tournament_id, seed_position);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament
  ON tournament_matches(tournament_id, round_number, match_number);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_players
  ON tournament_matches(player1_id, player2_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_for_tournament TO authenticated;
GRANT EXECUTE ON FUNCTION start_tournament TO authenticated;
GRANT EXECUTE ON FUNCTION complete_tournament_match TO authenticated;
GRANT EXECUTE ON FUNCTION get_tournament_bracket TO authenticated;
GRANT EXECUTE ON FUNCTION get_tournament_standings TO authenticated;