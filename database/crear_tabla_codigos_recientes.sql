-- ====================================================================
-- TABLA DE CÓDIGOS DE ACCESO EXTRAÍDOS (NETFLIX HOGAR & OTP)
-- Para almacenar los códigos recibidos automáticamente por correo
-- o manualmente por el administrador.
-- ====================================================================

CREATE TABLE IF NOT EXISTS codigos_acceso (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  enlace TEXT,
  tipo TEXT DEFAULT 'netflix_hogar', -- 'netflix_hogar' | 'otp_acceso' | 'enlace_hogar' | 'general'
  plataforma TEXT DEFAULT 'Netflix',
  cuenta_destino TEXT,               -- Correo al que llegó originalmente
  remitente TEXT,
  asunto TEXT,
  cliente_id TEXT,                   -- ID del cliente asignado (opcional)
  cliente_nombre TEXT,
  cliente_celular TEXT,
  perfil_id TEXT,
  perfil_nombre TEXT,
  minutos_expiracion INT DEFAULT 15,
  usado BOOLEAN DEFAULT FALSE,
  origen TEXT DEFAULT 'automatico_imap', -- 'automatico_imap' | 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_codigos_acceso_fecha ON codigos_acceso (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_codigos_acceso_cliente ON codigos_acceso (cliente_id);
CREATE INDEX IF NOT EXISTS idx_codigos_acceso_codigo ON codigos_acceso (codigo);

-- Habilitar permisos para el cliente anónimo (si usas Supabase)
ALTER TABLE codigos_acceso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de codigos"
ON codigos_acceso FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir insercion de codigos"
ON codigos_acceso FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de codigos"
ON codigos_acceso FOR UPDATE
TO anon, authenticated
USING (true);

COMMENT ON TABLE codigos_acceso IS 'Historial de códigos OTP y de Netflix Hogar extraídos automáticamente de correos o ingresados manualmente.';
