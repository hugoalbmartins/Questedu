/*
  # Update redeem_gift_card to use price_paid for commission (v2)

  ## Summary
  Drops and recreates the redeem_gift_card function with the correct return type (jsonb)
  and updated commission logic using price_paid directly.

  ## Changes
  - Drop old function signature
  - Recreate with commission = gift_card.price_paid * 0.20

  ## Notes
  1. Only the function definition changes, no data is affected
  2. All callers remain compatible (same parameters, same return structure)
*/

DROP FUNCTION IF EXISTS redeem_gift_card(text, uuid, text);

CREATE OR REPLACE FUNCTION redeem_gift_card(
  code_param text,
  student_id_param uuid,
  association_code_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  card_record record;
  student_record record;
  association_record record;
  new_premium_expires timestamptz;
  donation_amount numeric := 0;
  result jsonb;
BEGIN
  SELECT * INTO card_record
  FROM gift_cards
  WHERE code = UPPER(code_param)
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift card não encontrado ou inativo');
  END IF;

  IF card_record.expires_at IS NOT NULL AND card_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift card expirado');
  END IF;

  IF card_record.current_redemptions >= card_record.max_redemptions THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift card já foi totalmente utilizado');
  END IF;

  IF EXISTS (
    SELECT 1 FROM gift_card_redemptions
    WHERE gift_card_id = card_record.id AND student_id = student_id_param
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Já utilizaste este gift card');
  END IF;

  SELECT * INTO student_record FROM students WHERE id = student_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;

  IF card_record.premium_days > 0 THEN
    IF student_record.premium_expires_at IS NOT NULL AND student_record.premium_expires_at > now() THEN
      new_premium_expires := student_record.premium_expires_at + (card_record.premium_days || ' days')::interval;
    ELSE
      new_premium_expires := now() + (card_record.premium_days || ' days')::interval;
    END IF;

    UPDATE students SET
      is_premium = true,
      premium_expires_at = new_premium_expires,
      subscription_type = CASE
        WHEN card_record.premium_days >= 365 THEN 'annual'
        ELSE 'monthly'
      END
    WHERE id = student_id_param;
  END IF;

  IF card_record.coins_value > 0 THEN
    UPDATE students SET coins = COALESCE(coins, 0) + card_record.coins_value WHERE id = student_id_param;
  END IF;

  IF card_record.diamonds_value > 0 THEN
    UPDATE students SET diamonds = COALESCE(diamonds, 0) + card_record.diamonds_value WHERE id = student_id_param;
  END IF;

  UPDATE gift_cards SET current_redemptions = current_redemptions + 1 WHERE id = card_record.id;

  INSERT INTO gift_card_redemptions (
    gift_card_id, student_id, premium_days_granted, coins_granted, diamonds_granted
  ) VALUES (
    card_record.id, student_id_param,
    card_record.premium_days, card_record.coins_value, card_record.diamonds_value
  );

  IF association_code_param IS NOT NULL AND card_record.price_paid > 0 THEN
    SELECT * INTO association_record
    FROM parent_associations
    WHERE association_code = UPPER(association_code_param)
      AND status = 'approved';

    IF FOUND THEN
      donation_amount := card_record.price_paid * 0.20;

      INSERT INTO association_donations (association_id, student_id, amount, payment_id)
      VALUES (
        association_record.id,
        student_id_param,
        donation_amount,
        'gift_card:' || card_record.id::text
      );

      UPDATE parent_associations
      SET total_raised = COALESCE(total_raised, 0) + donation_amount
      WHERE id = association_record.id;
    END IF;
  END IF;

  result := jsonb_build_object(
    'success', true,
    'premium_days', card_record.premium_days,
    'coins', card_record.coins_value,
    'diamonds', card_record.diamonds_value,
    'donation_amount', donation_amount
  );

  RETURN result;
END;
$$;
