-- ====================================================================
-- SISTEMA FLOW STREAM - GESTIÓN DE CUENTAS DE STREAMING Y CLIENTES
-- Archivo: database/schema_supabase_postgres.sql
-- Compatible con: Supabase, Neon Postgres, Vercel Postgres, PostgreSQL 14+
-- ====================================================================

-- 1. EXTENSIÓN PARA UUIDs (Opcional si prefieres UUID o Serial)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para actualizar automáticamente 'updated_at'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- TABLA 1: CUENTAS DE STREAMING (Cuentas Maestras / Cuentas Completas)
-- ====================================================================
CREATE TABLE IF NOT EXISTS cuentas_streaming (
    id SERIAL PRIMARY KEY,
    plataforma VARCHAR(50) NOT NULL, -- 'Netflix', 'Disney+', 'HBO Max', 'Prime Video', etc.
    correo VARCHAR(150) NOT NULL,
    password VARCHAR(150) NOT NULL,
    fecha_corte_cuenta DATE NOT NULL,
    costo_cuenta NUMERIC(10, 2) DEFAULT 0.00, -- Costo mensual en Soles (S/)
    cantidad_perfiles INT NOT NULL DEFAULT 5,
    proveedor VARCHAR(100) DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    renovaciones INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida', 'vencida')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cuentas_plataforma ON cuentas_streaming(plataforma);
CREATE INDEX IF NOT EXISTS idx_cuentas_fecha_corte ON cuentas_streaming(fecha_corte_cuenta);

DROP TRIGGER IF EXISTS trg_cuentas_updated_at ON cuentas_streaming;
CREATE TRIGGER trg_cuentas_updated_at
    BEFORE UPDATE ON cuentas_streaming
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ====================================================================
-- TABLA 2: PERFILES DE CADA CUENTA
-- ====================================================================
CREATE TABLE IF NOT EXISTS perfiles (
    id SERIAL PRIMARY KEY,
    cuenta_id INT NOT NULL REFERENCES cuentas_streaming(id) ON DELETE CASCADE,
    numero_perfil INT NOT NULL, -- 1, 2, 3, 4, 5...
    nombre_perfil VARCHAR(60) NOT NULL, -- 'Perfil 1', 'Pantalla 1'
    pin VARCHAR(10) DEFAULT '',
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'asignado', 'bloqueado')),
    cliente_id INT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_cuenta_estado ON perfiles(cuenta_id, estado);

DROP TRIGGER IF EXISTS trg_perfiles_updated_at ON perfiles;
CREATE TRIGGER trg_perfiles_updated_at
    BEFORE UPDATE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ====================================================================
-- TABLA 3: CLIENTES Y MEMBRESÍAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) DEFAULT 'Cliente',
    codigo_pais VARCHAR(6) NOT NULL DEFAULT '+51',
    celular VARCHAR(25) NOT NULL,
    celular_completo VARCHAR(35) NOT NULL,
    cuenta_id INT REFERENCES cuentas_streaming(id) ON DELETE SET NULL,
    perfil_id INT REFERENCES perfiles(id) ON DELETE SET NULL,
    pin VARCHAR(10) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    precio_cobrado NUMERIC(10, 2) DEFAULT 0.00, -- Precio cobrado al cliente en Soles (S/)
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'por_vencer', 'vencido', 'renovado', 'cancelado')),
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_vencimiento ON clientes(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_clientes_celular ON clientes(celular);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ====================================================================
-- TABLA 4: HISTORIAL DE RENOVACIONES Y TRANSACCIONES
-- ====================================================================
CREATE TABLE IF NOT EXISTS historial_renovaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    dias_agregados INT NOT NULL DEFAULT 30,
    monto_cobrado NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(50) DEFAULT 'Yape / Plin',
    comprobante_ref VARCHAR(100) DEFAULT NULL,
    notas VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_cliente ON historial_renovaciones(cliente_id);


-- Base de datos lista y limpia (0 registros). Estructuras preparadas para nuevos registros.

