-- ==============================================================================
-- QUERY PARA SUPABASE: TABLA DE PLANTILLAS DE WHATSAPP
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase para habilitar
-- la sincronización de plantillas entre tu computadora y tu celular en tiempo real.

-- 1. Crear la tabla de plantillas si no existe
CREATE TABLE IF NOT EXISTS plantillas_whatsapp (
  id VARCHAR(50) PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(100),
  contenido TEXT NOT NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar las plantillas predeterminadas iniciales (si no están ya registradas)
INSERT INTO plantillas_whatsapp (id, tipo, titulo, contenido)
VALUES 
  (
    'recordatorio_2dias', 
    'recordatorio_2dias', 
    'Aviso de Vencimiento (≤ 2 días)',
    '👋 ¡Hola {nombre}! Te saluda tu proveedor de streaming.

Te recordamos que a tu membresía de *{plataforma}* le quedan *{dias}* para finalizar:
👤 *Perfil:* {perfil}
🔒 *PIN:* {pin}
📅 *Fecha de vencimiento:* {fecha}

Si deseas continuar con el servicio y no perder tu acceso ni recomendaciones, por favor responde a este mensaje para renovar tu pantalla. 🍿🎬'
  ),
  (
    'vence_hoy', 
    'vence_hoy', 
    'Membresía Vence Hoy',
    '🚨 ¡Hola {nombre}! Tu cuenta de *{plataforma}* (Perfil: *{perfil}*) vence *HOY* ({fecha}).

Para no quedarte sin servicio esta noche, por favor confírmanos tu pago de renovación a la brevedad. ¡Muchas gracias! ⭐'
  ),
  (
    'entrega_cuenta', 
    'entrega_cuenta', 
    'Entrega de Cuenta / Datos de Acceso',
    '🎉 ¡Hola {nombre}! Tu acceso a *{plataforma}* está listo y activo por 30 días:

📧 *Correo:* {correo}
🔑 *Contraseña:* {password}
👤 *Perfil asignado:* {perfil}
🔒 *PIN:* {pin}
📅 *Válido hasta:* {fecha}

⚠️ *Importante:* No modifiques la contraseña ni los otros perfiles. ¡Que disfrutes tus series y películas!'
  ),
  (
    'vencido', 
    'vencido', 
    'Servicio Vencido',
    '⚠️ Hola {nombre}, tu suscripción de *{plataforma}* (Perfil: *{perfil}*) ha vencido.

El perfil se encuentra pausado. Si deseas reactivarlo hoy mismo, escríbenos para asignarte tu acceso de inmediato. ¡Saludos!'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Habilitar seguridad de nivel de fila (Row Level Security)
ALTER TABLE plantillas_whatsapp ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para permitir leer y guardar plantillas desde la aplicación
DROP POLICY IF EXISTS "Permitir lectura de plantillas" ON plantillas_whatsapp;
CREATE POLICY "Permitir lectura de plantillas" 
ON plantillas_whatsapp FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion y actualizacion de plantillas" ON plantillas_whatsapp;
CREATE POLICY "Permitir insercion y actualizacion de plantillas" 
ON plantillas_whatsapp FOR ALL USING (true) WITH CHECK (true);
