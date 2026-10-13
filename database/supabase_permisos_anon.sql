-- ====================================================================
-- SISTEMA FLOW STREAM - PERMISOS PARA ACCESO DIRECTO DESDE REACT
-- Archivo: database/supabase_permisos_anon.sql
-- Ejecutar en: Supabase -> SQL Editor (si recibes error 401 o 403 al conectar)
-- ====================================================================

-- Opción Recomendada: Desactivar RLS (Row Level Security) para uso personal / panel único
-- Esto permite que tu aplicación web en Vercel lea, inserte, edite y elimine sin bloqueo
ALTER TABLE cuentas_streaming DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_renovaciones DISABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- Alternativa (si prefieres mantener RLS activado y permitir operaciones públicas con la anon key):
-- --------------------------------------------------------------------
/*
ALTER TABLE cuentas_streaming ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_renovaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo anon cuentas" ON cuentas_streaming FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo anon perfiles" ON perfiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo anon clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo anon historial" ON historial_renovaciones FOR ALL USING (true) WITH CHECK (true);
*/
