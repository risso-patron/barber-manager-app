-- Crear usuarios de prueba para demostración
-- Nota: En producción, estos usuarios se crearían a través del registro normal

-- Insertar usuarios de prueba directamente en la tabla users
-- (En un entorno real, estos se crearían a través de Supabase Auth)

INSERT INTO public.users (id, name, email, role, phone, created_at, updated_at) VALUES
-- Admin de prueba
('11111111-1111-1111-1111-111111111111', 'Carlos Administrador', 'admin@barbermanager.com', 'admin', '+1234567890', NOW(), NOW()),

-- Empleado de prueba
('22222222-2222-2222-2222-222222222222', 'María Barbera', 'empleado@barbermanager.com', 'employee', '+1234567891', NOW(), NOW()),

-- Cliente de prueba
('33333333-3333-3333-3333-333333333333', 'Juan Cliente', 'cliente@barbermanager.com', 'client', '+1234567892', NOW(), NOW());

-- Insertar algunas citas de ejemplo
INSERT INTO public.appointments (id, client_id, barber_id, service_id, appointment_date, appointment_time, status, notes, created_at, updated_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', (SELECT id FROM public.services WHERE name = 'Corte Clásico' LIMIT 1), CURRENT_DATE + INTERVAL '1 day', '10:00:00', 'confirmed', 'Cliente regular', NOW(), NOW()),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', (SELECT id FROM public.services WHERE name = 'Corte + Barba' LIMIT 1), CURRENT_DATE + INTERVAL '2 days', '14:30:00', 'pending', 'Primera vez con barba', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', (SELECT id FROM public.services WHERE name = 'Corte Clásico' LIMIT 1), CURRENT_DATE - INTERVAL '1 week', '11:00:00', 'completed', 'Muy satisfecho con el servicio', NOW(), NOW());

-- Insertar algunos registros de tiempo para el empleado
INSERT INTO public.time_logs (id, employee_id, date, time_in, time_out, total_hours, created_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '1 day', '09:00:00', '17:00:00', 8.0, NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '2 days', '09:15:00', '17:30:00', 8.25, NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '3 days', '08:45:00', '16:45:00', 8.0, NOW());

-- Insertar algunos movimientos de inventario
INSERT INTO public.inventory_movements (id, inventory_id, movement_type, quantity, reason, created_by, created_at) VALUES
('gggggggg-gggg-gggg-gggg-gggggggggggg', (SELECT id FROM public.inventory WHERE product_name = 'Shampoo Profesional' LIMIT 1), 'out', -2, 'Uso diario', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', (SELECT id FROM public.inventory WHERE product_name = 'Cera para Cabello' LIMIT 1), 'out', -1, 'Servicio cliente', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', (SELECT id FROM public.inventory WHERE product_name = 'Aceite para Barba' LIMIT 1), 'in', 5, 'Reposición stock', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days');
