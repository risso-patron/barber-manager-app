-- Migration 26: Low-rating alerts
-- Run in Supabase SQL Editor

-- 1. Alerts table
CREATE TABLE IF NOT EXISTS low_rating_alerts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid        REFERENCES appointments(id) ON DELETE CASCADE,
  client_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  employee_id    uuid        REFERENCES users(id) ON DELETE SET NULL,
  rating         integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text    text,
  is_resolved    boolean     NOT NULL DEFAULT false,
  resolved_at    timestamptz,
  resolved_by    uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_low_rating_alerts_created  ON low_rating_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_low_rating_alerts_resolved ON low_rating_alerts(is_resolved);

-- 2. Row Level Security
ALTER TABLE low_rating_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_low_rating_alerts"
  ON low_rating_alerts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 3. Trigger function: fire when rating <= 2 on appointment update
CREATE OR REPLACE FUNCTION create_low_rating_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only when rating is newly set to ≤ 2
  IF NEW.rating IS NOT NULL
    AND NEW.rating <= 2
    AND (OLD.rating IS NULL OR OLD.rating IS DISTINCT FROM NEW.rating)
  THEN
    INSERT INTO low_rating_alerts(appointment_id, client_id, employee_id, rating, review_text)
    VALUES (NEW.id, NEW.client_id, NEW.employee_id, NEW.rating, NEW.review_text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_low_rating_alert ON appointments;
CREATE TRIGGER trg_low_rating_alert
  AFTER UPDATE OF rating ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_low_rating_alert();

-- 4. Grant
GRANT SELECT ON low_rating_alerts TO authenticated;
