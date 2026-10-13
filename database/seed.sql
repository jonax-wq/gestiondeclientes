-- ====================================================================
-- SISTEMA FLOW STREAM - DATOS DE PRUEBA INICIALES (SEED DATA)
-- Archivo: database/seed.sql
-- Ejecutar después de haber creado las tablas de schema.sql
-- ====================================================================

-- 1. Insertar Cuentas Principales de Streaming
INSERT INTO cuentas_streaming (id, plataforma, correo, password, fecha_corte_cuenta, costo_cuenta, cantidad_perfiles, proveedor, notas, estado) VALUES
(1, 'Netflix', 'netflix.premium01@correo.com', 'PassNflx2026*', '2026-11-10', 45.00, 5, 'Proveedor Alpha', 'Plan 4K UHD Ultra. No cambiar clave.', 'activa'),
(2, 'Disney+', 'disneyplus.master@correo.com', 'DisneyStar#99', '2026-11-15', 38.00, 4, 'Proveedor Beta', 'Combo Disney+ y Star con deportes.', 'activa'),
(3, 'HBO Max', 'hbomax.peliculas@correo.com', 'HboMax2026!', '2026-11-20', 35.00, 5, 'Proveedor Gamma', 'Plan Platino con 4 pantallas simultáneas.', 'activa'),
(4, 'Prime Video', 'amazonprime.vip@correo.com', 'AmazonVip2026$', '2026-11-05', 25.00, 6, 'Proveedor Delta', 'Incluye envíos Prime y series exclusivas.', 'activa');

-- 2. Insertar Perfiles para cada Cuenta
-- Perfiles de Cuenta 1 (Netflix - 5 perfiles)
INSERT INTO perfiles (id, cuenta_id, numero_perfil, nombre_perfil, pin, estado) VALUES
(1, 1, 1, 'Perfil 1 - Principal', '1234', 'asignado'),
(2, 1, 2, 'Perfil 2', '5678', 'asignado'),
(3, 1, 3, 'Perfil 3', '9012', 'asignado'),
(4, 1, 4, 'Perfil 4', '4321', 'disponible'),
(5, 1, 5, 'Perfil 5 - Kids', '0000', 'disponible');

-- Perfiles de Cuenta 2 (Disney+ - 4 perfiles)
INSERT INTO perfiles (id, cuenta_id, numero_perfil, nombre_perfil, pin, estado) VALUES
(6, 2, 1, 'Pantalla 1', '1122', 'asignado'),
(7, 2, 2, 'Pantalla 2', '3344', 'disponible'),
(8, 2, 3, 'Pantalla 3', '5566', 'disponible'),
(9, 2, 4, 'Pantalla 4', '7788', 'disponible');

-- Perfiles de Cuenta 3 (Max - 5 perfiles)
INSERT INTO perfiles (id, cuenta_id, numero_perfil, nombre_perfil, pin, estado) VALUES
(10, 3, 1, 'Max Perfil 1', '2468', 'asignado'),
(11, 3, 2, 'Max Perfil 2', '1357', 'disponible'),
(12, 3, 3, 'Max Perfil 3', '9876', 'disponible'),
(13, 3, 4, 'Max Perfil 4', '6543', 'disponible'),
(14, 3, 5, 'Max Perfil 5', '3210', 'disponible');

-- Perfiles de Cuenta 4 (Prime Video - 6 perfiles)
INSERT INTO perfiles (id, cuenta_id, numero_perfil, nombre_perfil, pin, estado) VALUES
(15, 4, 1, 'Prime 1', '1010', 'disponible'),
(16, 4, 2, 'Prime 2', '2020', 'disponible'),
(17, 4, 3, 'Prime 3', '3030', 'disponible'),
(18, 4, 4, 'Prime 4', '4040', 'disponible'),
(19, 4, 5, 'Prime 5', '5050', 'disponible'),
(20, 4, 6, 'Prime 6', '6060', 'disponible');

-- 3. Insertar Clientes asignados a los perfiles
-- Nota: Incluimos un cliente que vence en exactamente 2 días para probar la alerta de WhatsApp
INSERT INTO clientes (id, nombre, codigo_pais, celular, celular_completo, perfil_id, pin, fecha_inicio, fecha_vencimiento, precio_cobrado, estado, recordatorio_enviado, notas) VALUES
-- Cliente 1: Vence en 2 días (¡Alerta prioritaria para WhatsApp!)
(1, 'Carlos Mendoza', '+51', '987654321', '+51987654321', 1, '1234', DATE_SUB(CURDATE(), INTERVAL 28 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 12.00, 'por_vencer', 0, 'Paga por Yape'),

-- Cliente 2: Vence hoy mismo (¡Alerta urgente!)
(2, 'María Rodríguez', '+51', '912345678', '+51912345678', 2, '5678', DATE_SUB(CURDATE(), INTERVAL 30 DAY), CURDATE(), 12.00, 'por_vencer', 0, 'Suele renovar de inmediato'),

-- Cliente 3: Activo con 15 días restantes
(3, 'Alejandro Morales', '+57', '3001234567', '+573001234567', 3, '9012', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 13.00, 'activo', 0, 'Cliente frecuente'),

-- Cliente 4: Disney+ Activo con 25 días restantes
(4, 'Valeria Castro', '+52', '5512345678', '+525512345678', 6, '1122', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 11.50, 'activo', 0, 'Cliente nuevo'),

-- Cliente 5: Max Vence en 1 día
(5, 'Roberto Peña', '+51', '976543210', '+51976543210', 10, '2468', DATE_SUB(CURDATE(), INTERVAL 29 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 12.00, 'por_vencer', 0, 'Recordarle en la tarde');
