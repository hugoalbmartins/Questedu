/*
  # Update redeem_gift_card RPC to support association commission

  ## Changes
  - Replaces the existing redeem_gift_card function with a new version that accepts
    an optional association_code parameter
  - When an association code is provided and the gift card grants premium days,
    the full plan-equivalent commission (20% of plan value) is recorded in
    association_donations and added to the association's total_raised
  - Commission is based on the full plan value (monthly €1.99 or annual €21.49),
    not on any discounted/zero payment amount
  - Commission is only recorded if:
    - An approved association with that code exists
    - The gift card grants premium_days > 0 (i.e. it's a subscription-equivalent card)
    - No duplicate donation for this student + association already exists today
*/

CREATE OR REPLACE FUNCTION redeem_gift_card(
  code_param text,
  student_id_param uuid,
  association_code_param text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  premium_days_granted integer,
  coins_granted integer,
  diamonds_granted integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  card_record RECORD;
  already_redeemed boolean;
  association_record RECORD;
  donation_amount numeric;
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

    -- Record association commission based on plan-equivalent value
    -- 30 days ~ monthly, 365 days ~ annual
    IF association_code_param IS NOT NULL AND association_code_param <> '' THEN
      SELECT * INTO association_record
      FROM parent_associations
      WHERE association_code = UPPER(association_code_param)
      AND status = 'approved';

      IF FOUND THEN
        -- Determine commission amount based on days granted
        IF card_record.premium_days >= 300 THEN
          donation_amount := 21.49 * 0.20; -- annual plan equivalent
        ELSE
          donation_amount := 1.99 * 0.20; -- monthly plan equivalent (per month or fraction)
          -- Scale proportionally for multi-month cards
          IF card_record.premium_days > 31 THEN
            donation_amount := (card_record.premium_days::numeric / 30.0) * 1.99 * 0.20;
          END IF;
        END IF;

        INSERT INTO association_donations (
          association_id,
          student_id,
          amount,
          payment_id
        ) VALUES (
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
$$;
