-- ==============================================================================
-- SISTEMA FLOW STREAM: MÓDULO MULTI-DISTRIBUIDOR CENTRALIZADO (SAAS / FRANQUICIA)
-- Archivo: database/crear_sistema_multidistribuidor.sql
-- Compatible con: Supabase (PostgreSQL 14+)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en Supabase (https://supabase.com).
-- 2. Ve a la sección "SQL Editor" en el menú lateral izquierdo.
-- 3. Crea una "New Query", pega todo este contenido y presiona "Run" (Ejecutar).
-- 4. ¡Listo! Tus tablas quedarán preparadas para dar acceso a múltiples distribuidores
--    aislando las cuentas y clientes de cada uno.
-- ==============================================================================

-- 1. CREAR TABLA DE DISTRIBUIDORES
CREATE TABLE IF NOT EXISTS distribuidores (
    id SERIAL PRIMARY KEY,
    codigo_distribuidor VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    whatsapp VARCHAR(30) DEFAULT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'vencido')),
    fecha_expiracion DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    es_superadmin BOOLEAN DEFAULT FALSE,
    max_cuentas INT DEFAULT 100,
    precio_mensual NUMERIC(10, 2) DEFAULT 0.00,
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_distribuidores_codigo ON distribuidores(codigo_distribuidor);
CREATE INDEX IF NOT EXISTS idx_distribuidores_estado ON distribuidores(estado);
CREATE INDEX IF NOT EXISTS idx_distribuidores_expiracion ON distribuidores(fecha_expiracion);

-- 2. REGISTRAR DISTRIBUIDOR PRINCIPAL (SUPERADMIN MASTER)
-- Este es tu código maestro para ingresar y administrar todos los distribuidores
INSERT INTO distribuidores (
    codigo_distribuidor, 
    nombre, 
    whatsapp, 
    estado, 
    fecha_expiracion, 
    es_superadmin, 
    notas
)
VALUES (
    'DIST-2026', 
    'Administrador Principal (Master)', 
    '+51999999999', 
    'activo', 
    NULL, -- NULL significa licencia permanente / sin expiración
    TRUE, 
    'Cuenta propietaria del sistema Flow Stream'
)
ON CONFLICT (codigo_distribuidor) 
DO UPDATE SET 
    es_superadmin = TRUE, 
    estado = 'activo', 
    fecha_expiracion = NULL;


-- 3. ASOCIAR DISTRIBUIDOR A CUENTAS STREAMING
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

CREATE INDEX IF NOT EXISTS idx_cuentas_distribuidor ON cuentas_streaming(distribuidor_codigo);

-- Asignar las cuentas existentes al administrador principal
UPDATE cuentas_streaming 
SET distribuidor_codigo = 'DIST-2026' 
WHERE distribuidor_codigo IS NULL OR distribuidor_codigo = '';


-- 4. ASOCIAR DISTRIBUIDOR A CLIENTES
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

CREATE INDEX IF NOT EXISTS idx_clientes_distribuidor ON clientes(distribuidor_codigo);

-- Asignar los clientes existentes al administrador principal
UPDATE clientes 
SET distribuidor_codigo = 'DIST-2026' 
WHERE distribuidor_codigo IS NULL OR distribuidor_codigo = '';


-- 5. ASOCIAR DISTRIBUIDOR A CÓDIGOS DE ACCESO (HOGAR / OTP) SI LA TABLA EXISTE
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'codigos_acceso') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'codigos_acceso' AND column_name = 'distribuidor_codigo'
        ) THEN
            ALTER TABLE codigos_acceso 
            ADD COLUMN distribuidor_codigo VARCHAR(50) NOT NULL DEFAULT 'DIST-2026';
            
            CREATE INDEX IF NOT EXISTS idx_codigos_distribuidor ON codigos_acceso(distribuidor_codigo);
        END IF;
    END IF;
END $$;


-- 6. ASOCIAR DISTRIBUIDOR A PLANTILLAS DE WHATSAPP SI LA TABLA EXISTE
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plantillas_whatsapp') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'plantillas_whatsapp' AND column_name = 'distribuidor_codigo'
        ) THEN
            ALTER TABLE plantillas_whatsapp 
            ADD COLUMN distribuidor_codigo VARCHAR(50) NOT NULL DEFAULT 'DIST-2026';
            
            CREATE INDEX IF NOT EXISTS idx_plantillas_distribuidor ON plantillas_whatsapp(distribuidor_codigo);
        END IF;
    END IF;
END $$;


-- 7. POLÍTICAS DE ACCESO PÚBLICO (ANON) PARA DISTRIBUIDORES
-- Permite que la aplicación web valide códigos y gestione distribuidores con la API anónima de Supabase
ALTER TABLE distribuidores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de distribuidores" ON distribuidores;
CREATE POLICY "Permitir lectura publica de distribuidores"
ON distribuidores FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir gestion de distribuidores" ON distribuidores;
CREATE POLICY "Permitir gestion de distribuidores"
ON distribuidores FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Comentarios explicativos
COMMENT ON TABLE distribuidores IS 'Registro de distribuidores/revendedores autorizados con sus códigos únicos y vigencia de membresía.';
COMMENT ON COLUMN distribuidores.codigo_distribuidor IS 'Código único de acceso al sistema en formato DIST-XXXX.';
COMMENT ON COLUMN distribuidores.es_superadmin IS 'Si es TRUE, tiene acceso al panel de control de distribuidores y ve todas las cuentas.';
