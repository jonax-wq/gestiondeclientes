-- ==============================================================================
-- SISTEMA FLOW STREAM: REPARACIÓN DE SECUENCIAS, COLUMNAS Y ASIGNACIÓN DE PERFILES
-- Archivo: database/reparar_secuencias_y_asignaciones.sql
-- Compatible con: Supabase (PostgreSQL 14+)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Ingresa a tu panel en Supabase (https://supabase.com).
-- 2. Dirígete a la sección "SQL Editor" en el menú de la izquierda.
-- 3. Crea una "New Query", copia y pega todo este script y haz clic en "Run" (Ejecutar).
-- ==============================================================================

-- 1. AGREGAR COLUMNA 'distribuidor_codigo' SI FALTA EN CLIENTES O CUENTAS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'distribuidor_codigo'
    ) THEN
        ALTER TABLE clientes 
        ADD COLUMN distribuidor_codigo VARCHAR(50) NOT NULL DEFAULT 'DIST-2026';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cuentas_streaming' AND column_name = 'distribuidor_codigo'
    ) THEN
        ALTER TABLE cuentas_streaming 
        ADD COLUMN distribuidor_codigo VARCHAR(50) NOT NULL DEFAULT 'DIST-2026';
    END IF;
END $$;

-- 2. SINCRONIZAR Y ACTUALIZAR SECUENCIAS (Evita el error de clave primaria duplicada al guardar)
SELECT setval('clientes_id_seq', COALESCE((SELECT MAX(id) FROM clientes), 1));
SELECT setval('perfiles_id_seq', COALESCE((SELECT MAX(id) FROM perfiles), 1));
SELECT setval('cuentas_streaming_id_seq', COALESCE((SELECT MAX(id) FROM cuentas_streaming), 1));
SELECT setval('historial_renovaciones_id_seq', COALESCE((SELECT MAX(id) FROM historial_renovaciones), 1));

-- 3. ASEGURAR QUE TODOS LOS PERFILES ASIGNADOS REFLEJEN CORRECTAMENTE A SU CLIENTE
UPDATE perfiles p
SET estado = 'asignado',
    cliente_id = c.id,
    pin = COALESCE(NULLIF(c.pin, ''), p.pin)
FROM clientes c
WHERE c.perfil_id = p.id
  AND (p.estado != 'asignado' OR p.cliente_id IS NULL OR p.cliente_id != c.id);

-- 4. PERMISOS PÚBLICOS COMPLETOS (Evita que el RLS bloquee inserciones o actualizaciones desde React/Vercel)
ALTER TABLE cuentas_streaming DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_renovaciones DISABLE ROW LEVEL SECURITY;

-- 5. FORZAR RECARGA INMEDIATA DE LA CACHÉ DE POSTGREST (Resuelve el error 'schema cache')
NOTIFY pgrst, 'reload schema';

-- 6. VERIFICACIÓN FINAL: Mostrar los valores actuales de las secuencias y conteos
SELECT 
    'clientes' AS tabla,
    (SELECT MAX(id) FROM clientes) AS id_maximo,
    (SELECT last_value FROM clientes_id_seq) AS secuencia_actual
UNION ALL
SELECT 
    'perfiles',
    (SELECT MAX(id) FROM perfiles),
    (SELECT last_value FROM perfiles_id_seq)
UNION ALL
SELECT 
    'cuentas_streaming',
    (SELECT MAX(id) FROM cuentas_streaming),
    (SELECT last_value FROM cuentas_streaming_id_seq);
