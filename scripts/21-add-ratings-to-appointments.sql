-- Migration 21: Add rating columns to appointments table
-- Run in Supabase SQL Editor

-- 1. Add columns
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS rating        smallint CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS review_text   text     CHECK (length(review_text) <= 1000);

-- 2. Index for fast avg-rating queries per barber
CREATE INDEX IF NOT EXISTS idx_appointments_barber_rating
  ON appointments (barber_id, rating)
  WHERE rating IS NOT NULL;

-- 3. Allow clients to set rating on their own completed appointments
--    (only if the rating hasn't been submitted yet, via API guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments'
      AND policyname = 'clients_rate_own_completed'
  ) THEN
    CREATE POLICY "clients_rate_own_completed" ON appointments
      FOR UPDATE
      USING (
        auth.uid() = client_id
        AND status = 'completed'
      )
      WITH CHECK (
        auth.uid() = client_id
        AND status = 'completed'
        AND (rating IS NULL OR (rating >= 1 AND rating <= 5))
      );
  END IF;
END $$;

-- 4. View: barber average ratings (used by booking flow Step 2)
CREATE OR REPLACE VIEW barber_avg_ratings AS
SELECT
  barber_id,
  COUNT(*) FILTER (WHERE rating IS NOT NULL)               AS total_ratings,
  ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 1)  AS avg_rating
FROM appointments
WHERE status = 'completed'
GROUP BY barber_id;

-- Grant anonymous + authenticated read on the view
GRANT SELECT ON barber_avg_ratings TO anon, authenticated;
