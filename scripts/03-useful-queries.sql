-- 📊 CONSULTAS ÚTILES PARA BARBER MANAGER

-- ============================================
-- CONSULTAS DE REPORTE Y ANÁLISIS
-- ============================================

-- 1. Ver ingresos del día actual
SELECT 
  SUM(amount) as total_income,
  COUNT(*) as transactions_count
FROM public.financial_transactions
WHERE transaction_type = 'income'
  AND transaction_date = CURRENT_DATE;

-- 2. Ver gastos del mes actual
SELECT 
  category,
  SUM(amount) as total,
  COUNT(*) as count
FROM public.financial_transactions
WHERE transaction_type = 'expense'
  AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY category
ORDER BY total DESC;

-- 3. Top 5 barberos por ingresos (mes actual)
SELECT 
  u.name,
  u.email,
  COUNT(a.id) as appointments_completed,
  SUM(s.price) as total_revenue
FROM public.users u
JOIN public.appointments a ON a.barber_id = u.id
JOIN public.services s ON s.id = a.service_id
WHERE u.role = 'employee'
  AND a.status = 'completed'
  AND EXTRACT(MONTH FROM a.appointment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY u.id, u.name, u.email
ORDER BY total_revenue DESC
LIMIT 5;

-- 4. Productos con stock bajo
SELECT * FROM public.check_low_stock();

-- 5. Citas pendientes de hoy
SELECT 
  a.*,
  c.name as client_name,
  c.phone as client_phone,
  b.name as barber_name,
  s.name as service_name
FROM public.appointments a
JOIN public.users c ON c.id = a.client_id
JOIN public.users b ON b.id = a.barber_id
JOIN public.services s ON s.id = a.service_id
WHERE a.appointment_date = CURRENT_DATE
  AND a.status IN ('pending', 'confirmed')
ORDER BY a.appointment_time;

-- 6. Comisiones pendientes de pago por empleado
SELECT 
  u.name,
  u.email,
  COUNT(ec.id) as pending_commissions,
  SUM(ec.amount) as total_pending
FROM public.employee_commissions ec
JOIN public.users u ON u.id = ec.employee_id
WHERE ec.payment_status = 'pending'
GROUP BY u.id, u.name, u.email
ORDER BY total_pending DESC;

-- 7. Balance general (ingresos vs gastos) del mes
SELECT 
  (SELECT COALESCE(SUM(amount), 0) 
   FROM public.financial_transactions 
   WHERE transaction_type = 'income'
     AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as total_income,
  (SELECT COALESCE(SUM(amount), 0) 
   FROM public.financial_transactions 
   WHERE transaction_type = 'expense'
     AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as total_expenses,
  (SELECT COALESCE(SUM(amount), 0) 
   FROM public.financial_transactions 
   WHERE transaction_type = 'income'
     AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)) -
  (SELECT COALESCE(SUM(amount), 0) 
   FROM public.financial_transactions 
   WHERE transaction_type = 'expense'
     AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as net_profit;

-- 8. Servicios más populares
SELECT 
  s.name,
  s.price,
  COUNT(a.id) as times_booked,
  SUM(s.price) as total_revenue
FROM public.services s
LEFT JOIN public.appointments a ON a.service_id = s.id
WHERE a.status = 'completed'
GROUP BY s.id, s.name, s.price
ORDER BY times_booked DESC;

-- 9. Clientes más frecuentes
SELECT 
  u.name,
  u.email,
  u.phone,
  COUNT(a.id) as total_appointments,
  MAX(a.appointment_date) as last_visit
FROM public.users u
JOIN public.appointments a ON a.client_id = u.id
WHERE u.role = 'client'
  AND a.status = 'completed'
GROUP BY u.id, u.name, u.email, u.phone
ORDER BY total_appointments DESC
LIMIT 10;

-- 10. Horarios más ocupados de la semana
SELECT 
  TO_CHAR(appointment_date, 'Day') as day_of_week,
  appointment_time,
  COUNT(*) as bookings
FROM public.appointments
WHERE status IN ('confirmed', 'completed')
  AND appointment_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY TO_CHAR(appointment_date, 'Day'), appointment_time
ORDER BY bookings DESC
LIMIT 10;

-- ============================================
-- CONSULTAS ADMINISTRATIVAS
-- ============================================

-- Cambiar rol de usuario a admin
-- UPDATE public.users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';

-- Marcar comisiones como pagadas
-- UPDATE public.employee_commissions 
-- SET payment_status = 'paid', payment_date = CURRENT_DATE 
-- WHERE employee_id = 'uuid-del-empleado' AND payment_status = 'pending';

-- Agregar stock manualmente
-- UPDATE public.inventory 
-- SET quantity = quantity + 10 
-- WHERE product_name = 'Nombre del Producto';

-- Cancelar cita
-- UPDATE public.appointments 
-- SET status = 'cancelled' 
-- WHERE id = 'uuid-de-la-cita';

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Ver todas las funciones personalizadas
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

