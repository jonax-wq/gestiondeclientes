import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../database/backup_actual.json');
const outputPath = path.join(__dirname, '../database/migracion_completa_con_datos_y_distribuidores.sql');

let raw = fs.readFileSync(jsonPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) {
  raw = raw.slice(1);
}
const data = JSON.parse(raw);

const cuentas = Array.isArray(data.cuentas) ? data.cuentas : (data.cuentas?.value || []);
const perfiles = Array.isArray(data.perfiles) ? data.perfiles : (data.perfiles?.value || []);
const clientes = Array.isArray(data.clientes) ? data.clientes : (data.clientes?.value || []);
const historial = Array.isArray(data.historial) ? data.historial : (data.historial?.value || []);

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

let sql = `-- ==============================================================================
-- SISTEMA FLOW STREAM: MIGRACIÓN COMPLETA CON TUS DATOS + MÓDULO MULTI-DISTRIBUIDOR
-- Archivo: database/migracion_completa_con_datos_y_distribuidores.sql
-- Compatible con: Supabase (PostgreSQL 14+)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. En tu nuevo proyecto de Supabase, ve a "SQL Editor" en el menú lateral.
-- 2. Haz clic en "New query", pega TODO este archivo y presiona "Run" (Ejecutar).
-- 3. ¡Listo! Tendrás todas tus cuentas, clientes, perfiles y el sistema de distribuidores.
-- ==============================================================================

-- 1. EXTENSIÓN PARA UUIDs Y FUNCIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLA DE DISTRIBUIDORES
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

CREATE INDEX IF NOT EXISTS idx_distribuidores_codigo ON distribuidores(codigo_distribuidor);

-- Insertar SuperAdmin Master permanente
INSERT INTO distribuidores (codigo_distribuidor, nombre, estado, fecha_expiracion, es_superadmin, notas)
VALUES ('DIST-2026', 'Administrador Principal (Master)', 'activo', NULL, TRUE, 'Cuenta propietaria del sistema')
ON CONFLICT (codigo_distribuidor) DO UPDATE SET es_superadmin = TRUE, estado = 'activo', fecha_expiracion = NULL;

-- 3. TABLA DE CUENTAS STREAMING
CREATE TABLE IF NOT EXISTS cuentas_streaming (
    id SERIAL PRIMARY KEY,
    plataforma VARCHAR(50) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    password VARCHAR(150) NOT NULL,
    fecha_corte_cuenta DATE NOT NULL,
    costo_cuenta NUMERIC(10, 2) DEFAULT 0.00,
    cantidad_perfiles INT NOT NULL DEFAULT 5,
    proveedor VARCHAR(100) DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    renovaciones INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activa',
    distribuidor_codigo VARCHAR(50) NOT NULL DEFAULT 'DIST-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cuentas_plataforma ON cuentas_streaming(plataforma);
CREATE INDEX IF NOT EXISTS idx_cuentas_distribuidor ON cuentas_streaming(distribuidor_codigo);

-- 4. TABLA DE PERFILES
CREATE TABLE IF NOT EXISTS perfiles (
    id SERIAL PRIMARY KEY,
    cuenta_id INT NOT NULL REFERENCES cuentas_streaming(id) ON DELETE CASCADE,
    numero_perfil INT NOT NULL,
    nombre_perfil VARCHAR(60) NOT NULL,
    pin VARCHAR(10) DEFAULT '',
    estado VARCHAR(20) DEFAULT 'disponible',
    cliente_id INT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_cuenta_estado ON perfiles(cuenta_id, estado);

-- 5. TABLA DE CLIENTES
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
    precio_cobrado NUMERIC(10, 2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'activo',
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    distribuidor_codigo VARCHAR(50) NOT NULL DEFAULT 'DIST-2026',
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_vencimiento ON clientes(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_clientes_distribuidor ON clientes(distribuidor_codigo);

-- 6. TABLA DE HISTORIAL DE RENOVACIONES
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

-- 7. TABLA DE PLANTILLAS DE WHATSAPP
CREATE TABLE IF NOT EXISTS plantillas_whatsapp (
  id VARCHAR(50) PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(100),
  contenido TEXT NOT NULL,
  distribuidor_codigo VARCHAR(50) DEFAULT 'DIST-2026',
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE CÓDIGOS DE ACCESO (NETFLIX HOGAR & OTP)
CREATE TABLE IF NOT EXISTS codigos_acceso (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  enlace TEXT,
  tipo TEXT DEFAULT 'netflix_hogar',
  plataforma TEXT DEFAULT 'Netflix',
  cuenta_destino TEXT,
  remitente TEXT,
  asunto TEXT,
  cliente_id TEXT,
  cliente_nombre TEXT,
  cliente_celular TEXT,
  perfil_id TEXT,
  perfil_nombre TEXT,
  minutos_expiracion INT DEFAULT 15,
  usado BOOLEAN DEFAULT FALSE,
  distribuidor_codigo VARCHAR(50) DEFAULT 'DIST-2026',
  origen TEXT DEFAULT 'automatico_imap',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CONFIGURAR PERMISOS RLS PÚBLICOS
ALTER TABLE distribuidores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir distribuidores all" ON distribuidores;
CREATE POLICY "Permitir distribuidores all" ON distribuidores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE cuentas_streaming ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir cuentas all" ON cuentas_streaming;
CREATE POLICY "Permitir cuentas all" ON cuentas_streaming FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir perfiles all" ON perfiles;
CREATE POLICY "Permitir perfiles all" ON perfiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir clientes all" ON clientes;
CREATE POLICY "Permitir clientes all" ON clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE historial_renovaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir historial all" ON historial_renovaciones;
CREATE POLICY "Permitir historial all" ON historial_renovaciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE plantillas_whatsapp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir plantillas all" ON plantillas_whatsapp;
CREATE POLICY "Permitir plantillas all" ON plantillas_whatsapp FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE codigos_acceso ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir codigos all" ON codigos_acceso;
CREATE POLICY "Permitir codigos all" ON codigos_acceso FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- INSERCIÓN DE DATOS REALES EXTRAÍDOS (15 CUENTAS, 76 PERFILES, 35 CLIENTES)
-- ==============================================================================
`;

// Insertar cuentas
sql += `\n-- A. INSERTAR CUENTAS STREAMING\n`;
if (cuentas && cuentas.length > 0) {
  sql += `INSERT INTO cuentas_streaming (id, plataforma, correo, password, fecha_corte_cuenta, costo_cuenta, cantidad_perfiles, proveedor, notas, renovaciones, estado, distribuidor_codigo, created_at, updated_at)\nVALUES\n`;
  const ctaRows = cuentas.map(c => {
    return `  (${c.id}, ${escapeSql(c.plataforma)}, ${escapeSql(c.correo)}, ${escapeSql(c.password)}, ${escapeSql(c.fecha_corte_cuenta)}, ${c.costo_cuenta || 0}, ${c.cantidad_perfiles || 5}, ${escapeSql(c.proveedor)}, ${escapeSql(c.notas)}, ${c.renovaciones || 0}, ${escapeSql(c.estado || 'activa')}, 'DIST-2026', ${escapeSql(c.created_at)}, ${escapeSql(c.updated_at)})`;
  });
  sql += ctaRows.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n`;
  sql += `SELECT setval('cuentas_streaming_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cuentas_streaming));\n`;
}

// Insertar perfiles
sql += `\n-- B. INSERTAR PERFILES DE CUENTAS\n`;
if (perfiles && perfiles.length > 0) {
  sql += `INSERT INTO perfiles (id, cuenta_id, numero_perfil, nombre_perfil, pin, estado, cliente_id, created_at, updated_at)\nVALUES\n`;
  const prfRows = perfiles.map(p => {
    return `  (${p.id}, ${p.cuenta_id}, ${p.numero_perfil}, ${escapeSql(p.nombre_perfil)}, ${escapeSql(p.pin || '')}, ${escapeSql(p.estado || 'disponible')}, ${p.cliente_id ? p.cliente_id : 'NULL'}, ${escapeSql(p.created_at)}, ${escapeSql(p.updated_at)})`;
  });
  sql += prfRows.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n`;
  sql += `SELECT setval('perfiles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM perfiles));\n`;
}

// Insertar clientes
sql += `\n-- C. INSERTAR CLIENTES Y ASIGNACIONES\n`;
if (clientes && clientes.length > 0) {
  sql += `INSERT INTO clientes (id, nombre, codigo_pais, celular, celular_completo, cuenta_id, perfil_id, pin, fecha_inicio, fecha_vencimiento, precio_cobrado, estado, recordatorio_enviado, distribuidor_codigo, notas, created_at, updated_at)\nVALUES\n`;
  const cliRows = clientes.map(cli => {
    return `  (${cli.id}, ${escapeSql(cli.nombre)}, ${escapeSql(cli.codigo_pais || '+51')}, ${escapeSql(cli.celular)}, ${escapeSql(cli.celular_completo)}, ${cli.cuenta_id ? cli.cuenta_id : 'NULL'}, ${cli.perfil_id ? cli.perfil_id : 'NULL'}, ${escapeSql(cli.pin || '')}, ${escapeSql(cli.fecha_inicio)}, ${escapeSql(cli.fecha_vencimiento)}, ${cli.precio_cobrado || 0}, ${escapeSql(cli.estado || 'activo')}, ${cli.recordatorio_enviado ? 'TRUE' : 'FALSE'}, 'DIST-2026', ${escapeSql(cli.notas)}, ${escapeSql(cli.created_at)}, ${escapeSql(cli.updated_at)})`;
  });
  sql += cliRows.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n`;
  sql += `SELECT setval('clientes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clientes));\n`;
}

// Insertar historial si hay
if (historial && historial.length > 0) {
  sql += `\n-- D. INSERTAR HISTORIAL DE RENOVACIONES\n`;
  sql += `INSERT INTO historial_renovaciones (id, cliente_id, fecha_pago, dias_agregados, monto_cobrado, metodo_pago, comprobante_ref, notas, created_at)\nVALUES\n`;
  const histRows = historial.map(h => {
    return `  (${h.id}, ${h.cliente_id}, ${escapeSql(h.fecha_pago)}, ${h.dias_agregados || 30}, ${h.monto_cobrado || 0}, ${escapeSql(h.metodo_pago || 'Yape / Plin')}, ${escapeSql(h.comprobante_ref)}, ${escapeSql(h.notas)}, ${escapeSql(h.created_at)})`;
  });
  sql += histRows.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n`;
  sql += `SELECT setval('historial_renovaciones_id_seq', (SELECT COALESCE(MAX(id), 1) FROM historial_renovaciones));\n`;
}

// Insertar plantillas predeterminadas
sql += `\n-- E. INSERTAR PLANTILLAS DE WHATSAPP PREDETERMINADAS\n`;
sql += `INSERT INTO plantillas_whatsapp (id, tipo, titulo, contenido, distribuidor_codigo)
VALUES 
  ('recordatorio_2dias', 'recordatorio_2dias', 'Aviso de Vencimiento (≤ 2 días)', '👋 ¡Hola {nombre}! Te saluda tu proveedor de streaming.\n\nTe recordamos que a tu membresía de *{plataforma}* le quedan *{dias}* para finalizar:\n👤 *Perfil:* {perfil}\n🔒 *PIN:* {pin}\n📅 *Fecha de vencimiento:* {fecha}\n\nSi deseas continuar con el servicio y no perder tu acceso ni recomendaciones, por favor responde a este mensaje para renovar tu pantalla. 🍿🎬', 'DIST-2026'),
  ('vence_hoy', 'vence_hoy', 'Membresía Vence Hoy', '🚨 ¡Hola {nombre}! Tu cuenta de *{plataforma}* (Perfil: *{perfil}*) vence *HOY* ({fecha}).\n\nPara no quedarte sin servicio esta noche, por favor confírmanos tu pago de renovación a la brevedad. ¡Muchas gracias! ⭐', 'DIST-2026'),
  ('entrega_cuenta', 'entrega_cuenta', 'Entrega de Cuenta / Datos de Acceso', '🎉 ¡Hola {nombre}! Tu acceso a *{plataforma}* está listo y activo por 30 días:\n\n📧 *Correo:* {correo}\n🔑 *Contraseña:* {password}\n👤 *Perfil asignado:* {perfil}\n🔒 *PIN:* {pin}\n📅 *Válido hasta:* {fecha}\n\n⚠️ *Importante:* No modifiques la contraseña ni los otros perfiles. ¡Que disfrutes tus series y películas!', 'DIST-2026'),
  ('vencido', 'vencido', 'Servicio Vencido', '⚠️ Hola {nombre}, tu suscripción de *{plataforma}* (Perfil: *{perfil}*) ha vencido.\n\nEl perfil se encuentra pausado. Si deseas reactivarlo hoy mismo, escríbenos para asignarte tu acceso de inmediato. ¡Saludos!', 'DIST-2026')
ON CONFLICT (id) DO NOTHING;\n`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log('Script de migración generado exitosamente en:', outputPath);
