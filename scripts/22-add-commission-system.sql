-- Migration 22: Commission system
-- Run in Supabase SQL Editor

-- 1. Add commission_rate to users (employees only; 0.00–1.00 = 0%–100%)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,4)
    CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 1));

-- 2. Add commission_amount to appointments (set by trigger when completed)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2);

-- 3. Trigger function: calculate commission when appointment → 'completed'
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price         numeric(10,2);
  v_commission    numeric(5,4);
BEGIN
  -- Only act when status transitions INTO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Get service price
    SELECT price INTO v_price
    FROM services
    WHERE id = NEW.service_id;

    -- Get barber commission_rate
    SELECT commission_rate INTO v_commission
    FROM users
    WHERE id = NEW.barber_id;

    -- Write only if both are set
    IF v_price IS NOT NULL AND v_commission IS NOT NULL THEN
      NEW.commission_amount := ROUND(v_price * v_commission, 2);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach trigger to appointments
DROP TRIGGER IF EXISTS trg_calculate_commission ON appointments;
CREATE TRIGGER trg_calculate_commission
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission();

-- 5. Backfill existing completed appointments that have no commission_amount yet
UPDATE appointments a
SET commission_amount = ROUND(s.price * u.commission_rate, 2)
FROM services s, users u
WHERE a.service_id     = s.id
  AND a.barber_id      = u.id
  AND a.status         = 'completed'
  AND a.commission_amount IS NULL
  AND u.commission_rate IS NOT NULL;

-- 6. View: settlement summary per barber (used by /admin/reports)
CREATE OR REPLACE VIEW barber_commissions AS
SELECT
  a.barber_id,
  u.name                                    AS barber_name,
  COUNT(*)                                  AS total_services,
  SUM(s.price)                              AS gross_revenue,
  ROUND(AVG(u.commission_rate) * 100, 1)   AS commission_pct,
  SUM(a.commission_amount)                  AS total_commission
FROM appointments a
JOIN services s ON s.id = a.service_id
JOIN users    u ON u.id = a.barber_id
WHERE a.status = 'completed'
  AND a.commission_amount IS NOT NULL
GROUP BY a.barber_id, u.name;

GRANT SELECT ON barber_commissions TO authenticated;
