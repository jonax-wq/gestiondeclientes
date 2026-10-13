-- ====================================================================
-- SISTEMA FLOW STREAM - CONSULTAS SQL ÚTILES Y FRECUENTES
-- Archivo: database/queries_utiles.sql
-- ====================================================================

-- 1. CONSULTA CLAVE: CLIENTES QUE VENCEN EN 2 DÍAS O MENOS (Para enviar WhatsApp)
-- Esta consulta filtra exactamente a los clientes que requieren recordatorio
SELECT 
    c.id AS cliente_id,
    c.nombre AS cliente_nombre,
    c.celular_completo AS telefono_whatsapp,
    cs.plataforma,
    p.nombre_perfil,
    c.pin,
    c.fecha_vencimiento,
    DATEDIFF(c.fecha_vencimiento, CURDATE()) AS dias_para_vencer,
    CASE 
        WHEN DATEDIFF(c.fecha_vencimiento, CURDATE()) = 2 THEN '⚠️ Vence en 2 días'
        WHEN DATEDIFF(c.fecha_vencimiento, CURDATE()) = 1 THEN '🚨 Vence mañana'
        WHEN DATEDIFF(c.fecha_vencimiento, CURDATE()) = 0 THEN '🔥 Vence HOY'
        ELSE '⛔ Ya venció'
    END AS estado_alerta
FROM clientes c
INNER JOIN perfiles p ON c.perfil_id = p.id
INNER JOIN cuentas_streaming cs ON p.cuenta_id = cs.id
WHERE DATEDIFF(c.fecha_vencimiento, CURDATE()) BETWEEN 0 AND 2
ORDER BY c.fecha_vencimiento ASC;


-- 2. CONSULTA: VER PERFILES DISPONIBLES (LIBRES PARA VENDER)
-- Muestra qué cuentas tienen perfiles libres para asignarle a un nuevo cliente
SELECT 
    cs.id AS cuenta_id,
    cs.plataforma,
    cs.correo AS correo_cuenta,
    p.id AS perfil_id,
    p.numero_perfil,
    p.nombre_perfil,
    p.pin
FROM perfiles p
INNER JOIN cuentas_streaming cs ON p.cuenta_id = cs.id
WHERE p.estado = 'disponible'
ORDER BY cs.plataforma ASC, p.numero_perfil ASC;


-- 3. CONSULTA: REPORTE GENERAL DE CLIENTES ACTIVOS CON DETALLES DE CUENTA
SELECT 
    c.id,
    c.nombre AS cliente,
    c.celular_completo AS whatsapp,
    cs.plataforma,
    cs.correo AS cuenta_correo,
    p.nombre_perfil,
    c.pin,
    c.fecha_inicio,
    c.fecha_vencimiento,
    DATEDIFF(c.fecha_vencimiento, CURDATE()) AS dias_restantes,
    c.precio_cobrado
FROM clientes c
INNER JOIN perfiles p ON c.perfil_id = p.id
INNER JOIN cuentas_streaming cs ON p.cuenta_id = cs.id
ORDER BY c.fecha_vencimiento ASC;


-- 4. QUERY: RENOVAR MEMBRESÍA DE UN CLIENTE POR 30 DÍAS ADICIONALES
-- Reemplazar ':cliente_id' con el ID del cliente a renovar
/*
UPDATE clientes
SET 
    fecha_inicio = CURDATE(),
    fecha_vencimiento = DATE_ADD(fecha_vencimiento, INTERVAL 30 DAY),
    estado = 'activo',
    recordatorio_enviado = 0
WHERE id = 1;
*/


-- 5. QUERY: LIBERAR PERFIL CUANDO UN CLIENTE CANCELA
-- Paso A: Actualizar estado del cliente
/*
UPDATE clientes 
SET estado = 'cancelado' 
WHERE id = 1;

-- Paso B: Devolver el perfil a estado 'disponible'
UPDATE perfiles 
SET estado = 'disponible' 
WHERE id = (SELECT perfil_id FROM clientes WHERE id = 1);
*/


-- 6. BALANCE FINANCIERO MENSUAL (INGRESOS VS COSTOS)
SELECT 
    (SELECT COALESCE(SUM(precio_cobrado), 0) FROM clientes WHERE estado IN ('activo', 'por_vencer')) AS total_ingresos_clientes,
    (SELECT COALESCE(SUM(costo_cuenta), 0) FROM cuentas_streaming WHERE estado = 'activa') AS total_costo_cuentas,
    (
        (SELECT COALESCE(SUM(precio_cobrado), 0) FROM clientes WHERE estado IN ('activo', 'por_vencer')) -
        (SELECT COALESCE(SUM(costo_cuenta), 0) FROM cuentas_streaming WHERE estado = 'activa')
    ) AS ganancia_neta_estimada;
