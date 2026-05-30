-- ============================================================
-- 19-business-settings-rls-and-seed.sql
-- Políticas RLS + seed inicial de configuración como JSON
-- ============================================================

-- RLS: todos los autenticados pueden leer
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.business_settings;
CREATE POLICY "Authenticated users can read settings" ON public.business_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS: solo admins pueden escribir
DROP POLICY IF EXISTS "Admin can manage settings" ON public.business_settings;
CREATE POLICY "Admin can manage settings" ON public.business_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed: 4 grupos de configuración como JSON
-- Ejecutar una sola vez; no sobreescribe si ya existe (ON CONFLICT DO NOTHING)

INSERT INTO public.business_settings (setting_key, setting_value, description) VALUES
(
  'business',
  '{"name":"Mi Barbería Premium","email":"info@mibarberia.com","phone":"+1 (555) 123-4567","address":"Av. Principal 123","city":"Ciudad de México","country":"México","website":"www.mibarberia.com","description":"La mejor barbería de la ciudad"}',
  'Datos generales del negocio'
),
(
  'schedule',
  '{"monday":{"open":"09:00","close":"18:00","isOpen":true},"tuesday":{"open":"09:00","close":"18:00","isOpen":true},"wednesday":{"open":"09:00","close":"18:00","isOpen":true},"thursday":{"open":"09:00","close":"18:00","isOpen":true},"friday":{"open":"09:00","close":"18:00","isOpen":true},"saturday":{"open":"10:00","close":"16:00","isOpen":true},"sunday":{"open":"10:00","close":"14:00","isOpen":false}}',
  'Horarios de atención por día'
),
(
  'notifications',
  '{"emailNotifications":true,"smsNotifications":true,"appointmentReminders":true,"cancelationAlerts":true,"dailySummary":true,"weeklyReport":false}',
  'Preferencias de notificaciones'
),
(
  'payments',
  '{"acceptCash":true,"acceptCard":true,"acceptTransfer":true,"currency":"USD","taxRate":16,"cancellationFee":0}',
  'Métodos y configuración de pagos'
)
ON CONFLICT (setting_key) DO NOTHING;
