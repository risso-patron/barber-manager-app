-- Migration 23: Attendance logs (work status persistence)
-- Run in Supabase SQL Editor

-- 1. Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in   timestamptz NOT NULL DEFAULT now(),
  check_out  timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id  ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_check_in ON attendance_logs(check_in DESC);

-- 3. Row Level Security
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Employee: read own logs
CREATE POLICY "employee_read_own_attendance"
  ON attendance_logs FOR SELECT
  USING (user_id = auth.uid());

-- Employee: insert own clock-in
CREATE POLICY "employee_insert_own_attendance"
  ON attendance_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Employee: update own clock-out (only open sessions)
CREATE POLICY "employee_update_own_attendance"
  ON attendance_logs FOR UPDATE
  USING (user_id = auth.uid() AND check_out IS NULL);

-- Admin: read all logs
CREATE POLICY "admin_read_all_attendance"
  ON attendance_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
