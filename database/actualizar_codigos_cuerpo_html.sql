-- ====================================================================
-- ACTUALIZACIÓN: SOPORTE PARA CORREO VISUAL HTML EN CÓDIGOS DE ACCESO
-- Ejecuta este script en el editor SQL de Supabase o PostgreSQL
-- ====================================================================

-- 1. Agregar columna cuerpo_html para almacenar la plantilla visual del correo
ALTER TABLE codigos_acceso 
ADD COLUMN IF NOT EXISTS cuerpo_html TEXT;

-- 2. Agregar columna cuerpo_texto si no existía previamente
ALTER TABLE codigos_acceso 
ADD COLUMN IF NOT EXISTS cuerpo_texto TEXT;

COMMENT ON COLUMN codigos_acceso.cuerpo_html IS 'Contenido HTML original del correo para visualización idéntica al proveedor (Netflix, Disney, etc.)';
