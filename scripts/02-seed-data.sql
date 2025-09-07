-- Insert default services
INSERT INTO public.services (name, description, price, duration) VALUES
('Corte Clásico', 'Corte de cabello tradicional', 25.00, 30),
('Corte + Barba', 'Corte de cabello y arreglo de barba', 35.00, 45),
('Afeitado Tradicional', 'Afeitado con navaja tradicional', 20.00, 25),
('Corte Niño', 'Corte especial para niños', 18.00, 20),
('Tratamiento Capilar', 'Tratamiento y lavado especializado', 30.00, 40);

-- Insert business settings
INSERT INTO public.business_settings (setting_key, setting_value, description) VALUES
('business_name', 'Barber Manager', 'Nombre del negocio'),
('business_hours_start', '09:00', 'Hora de apertura'),
('business_hours_end', '19:00', 'Hora de cierre'),
('appointment_duration', '30', 'Duración por defecto de citas en minutos'),
('low_stock_threshold', '5', 'Umbral para alertas de stock bajo');

-- Insert sample inventory items
INSERT INTO public.inventory (product_name, quantity, min_stock, supplier, cost_per_unit) VALUES
('Shampoo Profesional', 15, 5, 'Distribuidora ABC', 12.50),
('Cera para Cabello', 8, 3, 'Productos XYZ', 8.00),
('Aceite para Barba', 12, 4, 'Distribuidora ABC', 15.00),
('Toallas Desechables', 50, 10, 'Suministros DEF', 0.50),
('Cuchillas de Afeitar', 25, 8, 'Productos XYZ', 2.00);
