-- Migration 24: Loyalty points system
-- Run in Supabase SQL Editor

-- 1. Add loyalty_points column to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0
    CHECK (loyalty_points >= 0);

-- 2. Loyalty transactions log
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points       integer     NOT NULL,              -- positive = earn, negative = redeem
  type         text        NOT NULL CHECK (type IN ('earn', 'redeem', 'adjustment', 'expire')),
  description  text,
  appointment_id uuid      REFERENCES appointments(id) ON DELETE SET NULL,
  created_by   uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user_id    ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_created_at ON loyalty_transactions(created_at DESC);

-- 3. Row Level Security
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Client: read own transactions
CREATE POLICY "client_read_own_loyalty"
  ON loyalty_transactions FOR SELECT
  USING (user_id = auth.uid());

-- Admin: read/insert all
CREATE POLICY "admin_all_loyalty"
  ON loyalty_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Function: award points when appointment → 'completed'
--    Rule: 1 point per dollar of service price (integer)
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price   numeric(10,2);
  v_points  integer;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT price INTO v_price FROM services WHERE id = NEW.service_id;

    v_points := GREATEST(1, FLOOR(v_price)::integer);

    -- Credit client
    UPDATE users SET loyalty_points = loyalty_points + v_points WHERE id = NEW.client_id;

    INSERT INTO loyalty_transactions(user_id, points, type, description, appointment_id)
    VALUES (NEW.client_id, v_points, 'earn', 'Cita completada', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_loyalty ON appointments;
CREATE TRIGGER trg_award_loyalty
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points();

-- 5. Grant read on loyalty_transactions to authenticated
GRANT SELECT ON loyalty_transactions TO authenticated;
