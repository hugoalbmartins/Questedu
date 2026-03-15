/*
  # Gift Cards and Redemption System

  1. New Tables
    - `gift_cards` - Store gift card codes and values
    - `gift_card_redemptions` - Track redemptions
    
  2. Security
    - Enable RLS on both tables
    - Admins can create gift cards
    - Students can redeem their own codes
    
  3. Functions
    - Function to redeem gift card
    - Function to check gift card validity
*/

-- Create gift card type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_card_type') THEN
    CREATE TYPE gift_card_type AS ENUM ('premium_trial', 'premium_month', 'premium_year', 'coins', 'diamonds', 'bundle');
  END IF;
END $$;

-- Gift Cards Table
CREATE TABLE IF NOT EXISTS gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  card_type gift_card_type NOT NULL,
  premium_days integer DEFAULT 0,
  coins_value integer DEFAULT 0,
  diamonds_value integer DEFAULT 0,
  max_redemptions integer DEFAULT 1,
  current_redemptions integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gift cards"
  ON gift_cards FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active gift cards for validation"
  ON gift_cards FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Gift Card Redemptions Table
CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  redeemed_at timestamptz DEFAULT now(),
  premium_days_granted integer DEFAULT 0,
  coins_granted integer DEFAULT 0,
  diamonds_granted integer DEFAULT 0
);

ALTER TABLE gift_card_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own redemptions"
  ON gift_card_redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = gift_card_redemptions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own redemptions"
  ON gift_card_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = gift_card_redemptions.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all redemptions"
  ON gift_card_redemptions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Function to validate gift card
CREATE OR REPLACE FUNCTION validate_gift_card(code_param text)
RETURNS TABLE (
  valid boolean,
  card_type text,
  premium_days integer,
  coins_value integer,
  diamonds_value integer,
  error_message text
) AS $$
DECLARE
  card_record RECORD;
BEGIN
  SELECT * INTO card_record
  FROM gift_cards
  WHERE code = UPPER(code_param)
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, 0, 0, 0, 'Código inválido ou inativo';
    RETURN;
  END IF;

  IF card_record.expires_at IS NOT NULL AND card_record.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::text, 0, 0, 0, 'Código expirado';
    RETURN;
  END IF;

  IF card_record.current_redemptions >= card_record.max_redemptions THEN
    RETURN QUERY SELECT false, NULL::text, 0, 0, 0, 'Código já foi usado o máximo de vezes';
    RETURN;
  END IF;

  RETURN QUERY SELECT 
    true,
    card_record.card_type::text,
    card_record.premium_days,
    card_record.coins_value,
    card_record.diamonds_value,
    NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem gift card
CREATE OR REPLACE FUNCTION redeem_gift_card(
  code_param text,
  student_id_param uuid
)
RETURNS TABLE (
  success boolean,
  premium_days_granted integer,
  coins_granted integer,
  diamonds_granted integer,
  error_message text
) AS $$
DECLARE
  card_record RECORD;
  already_redeemed boolean;
BEGIN
  SELECT * INTO card_record
  FROM gift_cards
  WHERE code = UPPER(code_param)
  AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 0, 'Código inválido ou inativo';
    RETURN;
  END IF;

  IF card_record.expires_at IS NOT NULL AND card_record.expires_at < now() THEN
    RETURN QUERY SELECT false, 0, 0, 0, 'Código expirado';
    RETURN;
  END IF;

  IF card_record.current_redemptions >= card_record.max_redemptions THEN
    RETURN QUERY SELECT false, 0, 0, 0, 'Código já foi usado o máximo de vezes';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM gift_card_redemptions
    WHERE gift_card_id = card_record.id
    AND student_id = student_id_param
  ) INTO already_redeemed;

  IF already_redeemed THEN
    RETURN QUERY SELECT false, 0, 0, 0, 'Já resgataste este código';
    RETURN;
  END IF;

  INSERT INTO gift_card_redemptions (
    gift_card_id,
    student_id,
    premium_days_granted,
    coins_granted,
    diamonds_granted
  ) VALUES (
    card_record.id,
    student_id_param,
    card_record.premium_days,
    card_record.coins_value,
    card_record.diamonds_value
  );

  UPDATE gift_cards
  SET current_redemptions = current_redemptions + 1
  WHERE id = card_record.id;

  IF card_record.premium_days > 0 THEN
    UPDATE students
    SET 
      is_premium = true,
      premium_expires_at = CASE
        WHEN premium_expires_at IS NULL OR premium_expires_at < now()
        THEN now() + (card_record.premium_days || ' days')::interval
        ELSE premium_expires_at + (card_record.premium_days || ' days')::interval
      END
    WHERE id = student_id_param;
  END IF;

  IF card_record.coins_value > 0 THEN
    UPDATE students
    SET coins = coins + card_record.coins_value
    WHERE id = student_id_param;
  END IF;

  IF card_record.diamonds_value > 0 THEN
    UPDATE students
    SET diamonds = diamonds + card_record.diamonds_value
    WHERE id = student_id_param;
  END IF;

  RETURN QUERY SELECT 
    true,
    card_record.premium_days,
    card_record.coins_value,
    card_record.diamonds_value,
    NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_cards_code
  ON gift_cards(code) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gift_cards_active
  ON gift_cards(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_student
  ON gift_card_redemptions(student_id);

CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_card
  ON gift_card_redemptions(gift_card_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_gift_card TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_gift_card TO authenticated;