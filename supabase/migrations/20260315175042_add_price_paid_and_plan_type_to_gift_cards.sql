/*
  # Add price_paid and plan_type to gift_cards

  ## Summary
  This migration adds two new columns to the `gift_cards` table to properly
  track the commercial value of each gift card, enabling accurate commission
  calculation for associations.

  ## Changes

  ### Modified Tables
  - `gift_cards`
    - `plan_type` (text): Identifies the subscription plan the gift card represents.
      Values: 'individual_monthly', 'family_monthly', 'individual_annual', 'family_annual', 'custom'
    - `price_paid` (numeric): The actual purchase price of the gift card in EUR.
      Defaults by plan type:
        - individual_monthly: €1.99
        - family_monthly: €4.99
        - individual_annual: €21.49
        - family_annual: €53.88

  ## Notes
  1. Existing records will default to plan_type = 'custom' and price_paid = 0
  2. Commission for associations is always 20% of price_paid
  3. No destructive changes — only new columns added
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_cards' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE gift_cards ADD COLUMN plan_type text NOT NULL DEFAULT 'custom';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gift_cards' AND column_name = 'price_paid'
  ) THEN
    ALTER TABLE gift_cards ADD COLUMN price_paid numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
