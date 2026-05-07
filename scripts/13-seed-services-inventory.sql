-- =============================================================
-- Script 13 — Servicios e Inventario completo
-- Ejecutar en Supabase SQL Editor
-- NOTA: Limpia datos previos de demo antes de insertar
-- =============================================================

-- Eliminar servicios de demo del script 02 para evitar duplicados
DELETE FROM public.services WHERE name IN (
  'Corte Clásico', 'Corte + Barba', 'Afeitado Tradicional',
  'Corte Niño', 'Tratamiento Capilar'
);

-- Eliminar inventario de demo del script 02
DELETE FROM public.inventory WHERE product_name IN (
  'Shampoo Profesional', 'Cera para Cabello', 'Aceite para Barba',
  'Toallas Desechables', 'Cuchillas de Afeitar'
);

-- ─────────────────────────────────────────────────────────────
-- SERVICIOS (15)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.services (name, description, price, duration, is_active) VALUES

-- Cortes básicos
('Corte Clásico',           'Corte de cabello tradicional con tijera y máquina, incluye lavado.',                    18.00,  30, true),
('Corte Degradado',         'Fade o degradado a máquina con acabado pulido en los bordes.',                          20.00,  35, true),
('Corte Infantil',          'Corte suave y rápido para niños menores de 12 años.',                                   15.00,  25, true),
('Corte + Barba',           'Corte de cabello y arreglo completo de barba en una sola sesión.',                      28.00,  50, true),
('Corte Premium',           'Corte personalizado con diseño, consulta de estilo y acabado con productos.',           35.00,  60, true),

-- Barba
('Arreglo de Barba',        'Perfilado, recorte y definición de barba con navaja.',                                  15.00,  25, true),
('Afeitado Tradicional',    'Afeitado completo a navaja con toalla caliente, loción y aftershave.',                  20.00,  30, true),
('Diseño de Barba',         'Diseño artístico de barba con formas personalizadas.',                                  22.00,  35, true),

-- Tratamientos
('Tratamiento Capilar',     'Hidratación profunda con mascarilla nutritiva, ideal para cabello seco o dañado.',      25.00,  45, true),
('Tratamiento Anti-caída',  'Aplicación de suero y masaje capilar estimulante para combatir la caída del cabello.', 30.00,  40, true),
('Keratina Express',        'Alisado semipermanente que elimina el frizz y da brillo por hasta 3 meses.',            55.00,  90, true),

-- Otros servicios
('Tinte Completo',          'Coloración completa con tinte profesional, incluye lavado y acondicionador.',           45.00,  80, true),
('Mechas / Highlights',     'Decoloración parcial para mechas naturales o de contraste.',                            60.00, 100, true),
('Cejas Diseño',            'Depilación y diseño de cejas con hilo o cera para un acabado preciso.',                 12.00,  20, true),
('Masaje Capilar + Spa',    'Experiencia de relajación con masaje de cuero cabelludo, aceites esenciales y vapor.',  35.00,  50, true);



-- ─────────────────────────────────────────────────────────────
-- INVENTARIO (25 productos)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.inventory (product_name, quantity, min_stock, supplier, cost_per_unit) VALUES

-- Cuidado del cabello
('Shampoo Profesional 1L',          24,  6, 'Distribuidora Belleza Pro',   8.50),
('Shampoo Anti-Caída 500ml',        12,  4, 'Distribuidora Belleza Pro',  11.00),
('Acondicionador Hidratante 1L',    18,  5, 'Distribuidora Belleza Pro',   9.00),
('Mascarilla Nutritiva 500g',       10,  3, 'Productos KeraCare',         14.00),
('Keratina Liquida 1L',              6,  2, 'Productos KeraCare',         28.00),
('Tónico Capilar Anti-caída 200ml', 15,  4, 'Distribuidora Belleza Pro',  12.00),
('Aceite de Argán 100ml',           20,  5, 'Cosmética Natural SRL',      10.00),

-- Cuidado de barba
('Aceite para Barba 50ml',          22,  5, 'Cosmética Natural SRL',       8.00),
('Bálsamo para Barba 100ml',        18,  4, 'Cosmética Natural SRL',       9.50),
('Cera para Bigote 30g',            14,  3, 'Barbería Supplies Co.',        6.00),
('Aftershave Loción 250ml',         16,  4, 'Barbería Supplies Co.',        7.50),
('Gel de Afeitar 200ml',            20,  5, 'Distribuidora Belleza Pro',    5.50),

-- Peinado y estilo
('Cera Moldeadora 100g',            25,  6, 'Barbería Supplies Co.',        7.00),
('Pomada Mate 100g',                20,  5, 'Barbería Supplies Co.',        8.00),
('Gel Fijador Fuerte 250ml',        22,  5, 'Distribuidora Belleza Pro',    4.50),
('Laca Spray Fijadora 400ml',       15,  4, 'Distribuidora Belleza Pro',    6.00),
('Crema para Peinar 150ml',         12,  3, 'Cosmética Natural SRL',        7.00),

-- Tintes y coloración
('Tinte Negro N°1 (60g)',           10,  3, 'Colorline Argentina',          4.50),
('Tinte Castaño N°4 (60g)',         12,  3, 'Colorline Argentina',          4.50),
('Oxidante 20 Vol 1L',              10,  3, 'Colorline Argentina',          6.00),
('Decolorante Polvo 500g',           8,  2, 'Colorline Argentina',          9.00),

-- Consumibles y equipamiento
('Toallas Desechables x100',        40, 10, 'Suministros DEF',              0.50),
('Cuchillas Afeitar Gillette x10',  30,  8, 'Suministros DEF',              2.00),
('Guantes Descartables Talle M x50',20,  6, 'Suministros DEF',              3.50),
('Papel Cuello x500',               15,  5, 'Suministros DEF',              2.50);

