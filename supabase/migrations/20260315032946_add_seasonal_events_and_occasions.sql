/*
  # Seasonal Events and Special Occasions System

  1. New Tables
    - `seasonal_events` - Special events throughout the year
    - `event_challenges` - Event-specific challenges
    - `event_rewards` - Special event rewards
    - `student_event_progress` - Student progress in events
    - `holiday_bonuses` - Special holiday bonuses
    
  2. Features
    - Seasonal events (Christmas, Easter, etc)
    - National holidays (Portugal)
    - School events (Back to school, exams)
    - Special challenges
    - Exclusive rewards
    - Time-limited content
    
  3. Security
    - RLS for privacy
    - Admin management
    - Automated activation
*/

-- Event Types
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'holiday',
    'seasonal',
    'school',
    'national',
    'community',
    'special'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Event Status
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM (
    'upcoming',
    'active',
    'ended',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Seasonal Events
CREATE TABLE IF NOT EXISTS seasonal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  event_type event_type NOT NULL,
  status event_status DEFAULT 'upcoming',
  banner_image text,
  theme_color text DEFAULT '#4F46E5',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  total_participants integer DEFAULT 0,
  total_challenges integer DEFAULT 0,
  bonus_xp_multiplier numeric(3,2) DEFAULT 1.0,
  bonus_coins_multiplier numeric(3,2) DEFAULT 1.0,
  special_currency text,
  special_currency_icon text,
  event_data jsonb DEFAULT '{}'::jsonb,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events"
  ON seasonal_events FOR SELECT
  TO authenticated
  USING (status = 'active' OR status = 'upcoming');

CREATE POLICY "Admins can manage events"
  ON seasonal_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Event Challenges
CREATE TABLE IF NOT EXISTS event_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
  challenge_name text NOT NULL,
  challenge_description text,
  challenge_type text NOT NULL,
  difficulty difficulty_level DEFAULT 'intermediate',
  target_value integer NOT NULL,
  progress_type text DEFAULT 'cumulative',
  reward_xp integer DEFAULT 0,
  reward_coins integer DEFAULT 0,
  reward_special_currency integer DEFAULT 0,
  reward_items uuid[] DEFAULT ARRAY[]::uuid[],
  unlock_requirements jsonb DEFAULT '{}'::jsonb,
  challenge_order integer DEFAULT 1,
  is_repeatable boolean DEFAULT false,
  max_completions integer DEFAULT 1,
  total_completions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, challenge_order)
);

ALTER TABLE event_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event challenges"
  ON event_challenges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seasonal_events
      WHERE seasonal_events.id = event_challenges.event_id
      AND seasonal_events.status IN ('active', 'upcoming')
    )
  );

-- Event Rewards
CREATE TABLE IF NOT EXISTS event_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
  reward_name text NOT NULL,
  reward_description text,
  reward_type text NOT NULL,
  reward_icon text,
  cost_special_currency integer DEFAULT 0,
  cost_coins integer DEFAULT 0,
  cost_diamonds integer DEFAULT 0,
  is_exclusive boolean DEFAULT true,
  stock_quantity integer,
  total_redeemed integer DEFAULT 0,
  required_level integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event rewards"
  ON event_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM seasonal_events
      WHERE seasonal_events.id = event_rewards.event_id
      AND seasonal_events.status = 'active'
    )
  );

-- Student Event Progress
CREATE TABLE IF NOT EXISTS student_event_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
  special_currency_earned integer DEFAULT 0,
  challenges_completed integer DEFAULT 0,
  total_event_xp integer DEFAULT 0,
  total_event_coins integer DEFAULT 0,
  rank_position integer,
  participation_score integer DEFAULT 0,
  rewards_claimed uuid[] DEFAULT ARRAY[]::uuid[],
  first_participated_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  UNIQUE(student_id, event_id)
);

ALTER TABLE student_event_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own event progress"
  ON student_event_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_event_progress.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own event progress"
  ON student_event_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_event_progress.student_id
      AND students.user_id = auth.uid()
    )
  );

-- Holiday Bonuses
CREATE TABLE IF NOT EXISTS holiday_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_name text NOT NULL,
  holiday_date date NOT NULL,
  bonus_description text,
  bonus_xp_multiplier numeric(3,2) DEFAULT 1.5,
  bonus_coins_multiplier numeric(3,2) DEFAULT 1.5,
  bonus_days integer DEFAULT 1,
  icon text DEFAULT '🎉',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(holiday_name, holiday_date)
);

ALTER TABLE holiday_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view holiday bonuses"
  ON holiday_bonuses FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Function to join event
CREATE OR REPLACE FUNCTION join_seasonal_event(
  student_id_param uuid,
  event_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  event_record RECORD;
BEGIN
  SELECT * INTO event_record
  FROM seasonal_events
  WHERE id = event_id_param;

  IF event_record IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF event_record.status != 'active' THEN
    RAISE EXCEPTION 'Event is not active';
  END IF;

  INSERT INTO student_event_progress (
    student_id,
    event_id
  ) VALUES (
    student_id_param,
    event_id_param
  )
  ON CONFLICT (student_id, event_id)
  DO UPDATE SET
    last_active_at = now();

  UPDATE seasonal_events
  SET total_participants = total_participants + 1
  WHERE id = event_id_param
  AND NOT EXISTS (
    SELECT 1 FROM student_event_progress
    WHERE student_id = student_id_param
    AND event_id = event_id_param
    AND first_participated_at < now() - interval '1 second'
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete event challenge
CREATE OR REPLACE FUNCTION complete_event_challenge(
  student_id_param uuid,
  challenge_id_param uuid,
  progress_value_param integer DEFAULT 1
)
RETURNS jsonb AS $$
DECLARE
  challenge_record RECORD;
  event_record RECORD;
  current_progress integer;
  is_completed boolean;
  reward_xp integer := 0;
  reward_coins integer := 0;
  reward_special integer := 0;
BEGIN
  SELECT ec.*, se.special_currency, se.bonus_xp_multiplier, se.bonus_coins_multiplier
  INTO challenge_record
  FROM event_challenges ec
  JOIN seasonal_events se ON se.id = ec.event_id
  WHERE ec.id = challenge_id_param;

  IF challenge_record IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  SELECT * INTO event_record
  FROM seasonal_events
  WHERE id = challenge_record.event_id;

  IF event_record.status != 'active' THEN
    RAISE EXCEPTION 'Event is not active';
  END IF;

  INSERT INTO student_event_progress (
    student_id,
    event_id
  ) VALUES (
    student_id_param,
    challenge_record.event_id
  )
  ON CONFLICT (student_id, event_id) DO NOTHING;

  current_progress := progress_value_param;
  is_completed := (current_progress >= challenge_record.target_value);

  IF is_completed THEN
    reward_xp := ROUND(challenge_record.reward_xp * challenge_record.bonus_xp_multiplier);
    reward_coins := ROUND(challenge_record.reward_coins * challenge_record.bonus_coins_multiplier);
    reward_special := challenge_record.reward_special_currency;

    UPDATE students
    SET
      xp = xp + reward_xp,
      coins = coins + reward_coins
    WHERE id = student_id_param;

    UPDATE student_event_progress
    SET
      special_currency_earned = special_currency_earned + reward_special,
      challenges_completed = challenges_completed + 1,
      total_event_xp = total_event_xp + reward_xp,
      total_event_coins = total_event_coins + reward_coins,
      participation_score = participation_score + challenge_record.target_value,
      last_active_at = now()
    WHERE student_id = student_id_param
    AND event_id = challenge_record.event_id;

    UPDATE event_challenges
    SET total_completions = total_completions + 1
    WHERE id = challenge_id_param;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'completed', is_completed,
    'rewards', jsonb_build_object(
      'xp', reward_xp,
      'coins', reward_coins,
      'special_currency', reward_special
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active events
CREATE OR REPLACE FUNCTION get_active_events()
RETURNS TABLE (
  event_id uuid,
  event_name text,
  description text,
  event_type event_type,
  banner_image text,
  theme_color text,
  starts_at timestamptz,
  ends_at timestamptz,
  total_participants integer,
  total_challenges integer,
  bonus_xp_multiplier numeric,
  bonus_coins_multiplier numeric,
  special_currency text,
  special_currency_icon text,
  days_remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id as event_id,
    se.name as event_name,
    se.description,
    se.event_type,
    se.banner_image,
    se.theme_color,
    se.starts_at,
    se.ends_at,
    se.total_participants,
    se.total_challenges,
    se.bonus_xp_multiplier,
    se.bonus_coins_multiplier,
    se.special_currency,
    se.special_currency_icon,
    EXTRACT(DAY FROM (se.ends_at - now()))::integer as days_remaining
  FROM seasonal_events se
  WHERE se.status = 'active'
  AND se.ends_at > now()
  ORDER BY se.starts_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get event leaderboard
CREATE OR REPLACE FUNCTION get_event_leaderboard(
  event_id_param uuid,
  limit_param integer DEFAULT 100
)
RETURNS TABLE (
  rank_position integer,
  student_id uuid,
  student_name text,
  participation_score integer,
  challenges_completed integer,
  special_currency_earned integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY sep.participation_score DESC, sep.challenges_completed DESC)::integer as rank_position,
    s.id as student_id,
    s.name as student_name,
    sep.participation_score,
    sep.challenges_completed,
    sep.special_currency_earned
  FROM student_event_progress sep
  JOIN students s ON s.id = sep.student_id
  WHERE sep.event_id = event_id_param
  ORDER BY sep.participation_score DESC, sep.challenges_completed DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check active holiday bonus
CREATE OR REPLACE FUNCTION get_active_holiday_bonus()
RETURNS TABLE (
  holiday_name text,
  bonus_description text,
  bonus_xp_multiplier numeric,
  bonus_coins_multiplier numeric,
  icon text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hb.holiday_name,
    hb.bonus_description,
    hb.bonus_xp_multiplier,
    hb.bonus_coins_multiplier,
    hb.icon
  FROM holiday_bonuses hb
  WHERE hb.is_active = true
  AND CURRENT_DATE BETWEEN hb.holiday_date AND (hb.holiday_date + hb.bonus_days)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seasonal_events_status
  ON seasonal_events(status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_event_challenges_event
  ON event_challenges(event_id, challenge_order);

CREATE INDEX IF NOT EXISTS idx_event_rewards_event
  ON event_rewards(event_id);

CREATE INDEX IF NOT EXISTS idx_student_event_progress_student
  ON student_event_progress(student_id, event_id);

CREATE INDEX IF NOT EXISTS idx_student_event_progress_score
  ON student_event_progress(event_id, participation_score DESC);

CREATE INDEX IF NOT EXISTS idx_holiday_bonuses_date
  ON holiday_bonuses(holiday_date, is_active);

-- Insert Portuguese holidays and events
INSERT INTO holiday_bonuses (holiday_name, holiday_date, bonus_description, bonus_xp_multiplier, bonus_coins_multiplier, icon) VALUES
('Ano Novo', '2026-01-01', 'Feliz Ano Novo! Bónus especial para começar o ano!', 2.0, 2.0, '🎆'),
('Carnaval', '2026-02-17', 'Celebra o Carnaval com bónus especiais!', 1.5, 1.5, '🎭'),
('Páscoa', '2026-04-05', 'Feliz Páscoa! Bónus de primavera!', 1.8, 1.8, '🐰'),
('Dia da Liberdade', '2026-04-25', 'Dia da Liberdade - Celebra com bónus!', 1.5, 1.5, '🌹'),
('Dia do Trabalhador', '2026-05-01', 'Dia do Trabalhador - Bónus especial!', 1.5, 1.5, '⚒️'),
('Dia de Portugal', '2026-06-10', 'Dia de Portugal, de Camões e das Comunidades!', 2.0, 2.0, '🇵🇹'),
('Natal', '2026-12-25', 'Feliz Natal! Bónus de fim de ano!', 2.5, 2.5, '🎄')
ON CONFLICT DO NOTHING;

-- Insert sample seasonal event
INSERT INTO seasonal_events (
  name,
  description,
  event_type,
  status,
  starts_at,
  ends_at,
  bonus_xp_multiplier,
  bonus_coins_multiplier,
  special_currency,
  special_currency_icon
) VALUES (
  'Volta às Aulas 2026',
  'Celebra o regresso às aulas com desafios especiais e recompensas exclusivas!',
  'school',
  'upcoming',
  '2026-09-01 00:00:00+00',
  '2026-09-30 23:59:59+00',
  1.5,
  1.5,
  'Lápis de Ouro',
  '✏️'
)
ON CONFLICT DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION join_seasonal_event TO authenticated;
GRANT EXECUTE ON FUNCTION complete_event_challenge TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_holiday_bonus TO authenticated;