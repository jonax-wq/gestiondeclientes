// Utilidades de almacenamiento, cálculo de fechas y WhatsApp

const STORAGE_KEY = 'streamflow_data_v1';

// Función para sumar días a una fecha (formato YYYY-MM-DD)
export function addDays(dateStr, days) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Obtener fecha de hoy en formato YYYY-MM-DD
export function getTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calcula los días restantes hasta la fecha de vencimiento
export function calcularDiasRestantes(fechaVencimientoStr) {
  if (!fechaVencimientoStr) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(fechaVencimientoStr + 'T00:00:00');
  vencimiento.setHours(0, 0, 0, 0);

  const diffTime = vencimiento.getTime() - hoy.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Formatear fecha para lectura humana amigable (ej. 15 oct 2026)
export function formatearFecha(fechaStr) {
  if (!fechaStr) return '-';
  try {
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return fechaStr;
  } catch {
    return fechaStr;
  }
}

// Genera un ID único seguro
export function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Datos iniciales de demostración y uso inmediato
export const INITIAL_DATA = {
  cuentas: [
    {
      id: 'cta-1',
      plataforma: 'Netflix',
      correo: 'netflix.premium01@correo.com',
      password: 'PassNflx2026*',
      fechaCorte: addDays(getTodayDate(), 25),
      costo: 45.00,
      cantidadPerfiles: 5,
      proveedor: 'Proveedor Alpha',
      notas: 'Plan 4K UHD Ultra con pantalla garantizada',
      perfiles: [
        { id: 'prf-1-1', numero: 1, nombre: 'Perfil 1 - Carlos', pin: '1234', estado: 'asignado', clienteId: 'cli-1' },
        { id: 'prf-1-2', numero: 2, nombre: 'Perfil 2 - María', pin: '5678', estado: 'asignado', clienteId: 'cli-2' },
        { id: 'prf-1-3', numero: 3, nombre: 'Perfil 3 - Alejandro', pin: '9012', estado: 'asignado', clienteId: 'cli-3' },
        { id: 'prf-1-4', numero: 4, nombre: 'Perfil 4', pin: '4321', estado: 'disponible', clienteId: null },
        { id: 'prf-1-5', numero: 5, nombre: 'Perfil 5 - Kids', pin: '0000', estado: 'disponible', clienteId: null }
      ]
    },
    {
      id: 'cta-2',
      plataforma: 'Disney+',
      correo: 'disneyplus.master@correo.com',
      password: 'DisneyStar#99',
      fechaCorte: addDays(getTodayDate(), 30),
      costo: 38.00,
      cantidadPerfiles: 4,
      proveedor: 'Proveedor Beta',
      notas: 'Combo Disney+ con deportes Star',
      perfiles: [
        { id: 'prf-2-1', numero: 1, nombre: 'Pantalla 1 - Valeria', pin: '1122', estado: 'asignado', clienteId: 'cli-4' },
        { id: 'prf-2-2', numero: 2, nombre: 'Pantalla 2', pin: '3344', estado: 'disponible', clienteId: null },
        { id: 'prf-2-3', numero: 3, nombre: 'Pantalla 3', pin: '5566', estado: 'disponible', clienteId: null },
        { id: 'prf-2-4', numero: 4, nombre: 'Pantalla 4', pin: '7788', estado: 'disponible', clienteId: null }
      ]
    },
    {
      id: 'cta-3',
      plataforma: 'HBO Max',
      correo: 'hbomax.peliculas@correo.com',
      password: 'HboMax2026!',
      fechaCorte: addDays(getTodayDate(), 20),
      costo: 35.00,
      cantidadPerfiles: 5,
      proveedor: 'Proveedor Gamma',
      notas: 'Plan Platino 4 pantallas',
      perfiles: [
        { id: 'prf-3-1', numero: 1, nombre: 'HBO Perfil 1 - Roberto', pin: '2468', estado: 'asignado', clienteId: 'cli-5' },
        { id: 'prf-3-2', numero: 2, nombre: 'HBO Perfil 2', pin: '1357', estado: 'disponible', clienteId: null },
        { id: 'prf-3-3', numero: 3, nombre: 'HBO Perfil 3', pin: '9876', estado: 'disponible', clienteId: null },
        { id: 'prf-3-4', numero: 4, nombre: 'HBO Perfil 4', pin: '6543', estado: 'disponible', clienteId: null },
        { id: 'prf-3-5', numero: 5, nombre: 'HBO Perfil 5', pin: '3210', estado: 'disponible', clienteId: null }
      ]
    },
    {
      id: 'cta-4',
      plataforma: 'Prime Video',
      correo: 'amazonprime.vip@correo.com',
      password: 'AmazonVip2026$',
      fechaCorte: addDays(getTodayDate(), 18),
      costo: 25.00,
      cantidadPerfiles: 6,
      proveedor: 'Proveedor Delta',
      notas: 'Prime Video con series originales',
      perfiles: [
        { id: 'prf-4-1', numero: 1, nombre: 'Prime 1', pin: '1010', estado: 'disponible', clienteId: null },
        { id: 'prf-4-2', numero: 2, nombre: 'Prime 2', pin: '2020', estado: 'disponible', clienteId: null },
        { id: 'prf-4-3', numero: 3, nombre: 'Prime 3', pin: '3030', estado: 'disponible', clienteId: null },
        { id: 'prf-4-4', numero: 4, nombre: 'Prime 4', pin: '4040', estado: 'disponible', clienteId: null },
        { id: 'prf-4-5', numero: 5, nombre: 'Prime 5', pin: '5050', estado: 'disponible', clienteId: null },
        { id: 'prf-4-6', numero: 6, nombre: 'Prime 6', pin: '6060', estado: 'disponible', clienteId: null }
      ]
    }
  ],
  clientes: [
    // CLIENTE 1: ¡FALTAN EXACTAMENTE 2 DÍAS! (Para probar la alerta del usuario)
    {
      id: 'cli-1',
      nombre: 'Carlos Mendoza',
      codigoPais: '+51',
      celular: '987654321',
      cuentaId: 'cta-1',
      perfilId: 'prf-1-1',
      pin: '1234',
      fechaInicio: addDays(getTodayDate(), -28),
      fechaVencimiento: addDays(getTodayDate(), 2),
      precioCobrado: 12.00,
      recordatorioEnviado: false,
      notas: 'Paga puntual por Yape'
    },
    // CLIENTE 2: Vence HOY (Alerta máxima)
    {
      id: 'cli-2',
      nombre: 'María Rodríguez',
      codigoPais: '+51',
      celular: '912345678',
      cuentaId: 'cta-1',
      perfilId: 'prf-1-2',
      pin: '5678',
      fechaInicio: addDays(getTodayDate(), -30),
      fechaVencimiento: getTodayDate(),
      precioCobrado: 12.00,
      recordatorioEnviado: false,
      notas: 'Suele renovar de inmediato'
    },
    // CLIENTE 3: Activo, vence en 15 días
    {
      id: 'cli-3',
      nombre: 'Alejandro Morales',
      codigoPais: '+57',
      celular: '3001234567',
      cuentaId: 'cta-1',
      perfilId: 'prf-1-3',
      pin: '9012',
      fechaInicio: addDays(getTodayDate(), -15),
      fechaVencimiento: addDays(getTodayDate(), 15),
      precioCobrado: 13.00,
      recordatorioEnviado: false,
      notas: 'Cliente nuevo'
    },
    // CLIENTE 4: Disney+, vence en 25 días
    {
      id: 'cli-4',
      nombre: 'Valeria Castro',
      codigoPais: '+52',
      celular: '5512345678',
      cuentaId: 'cta-2',
      perfilId: 'prf-2-1',
      pin: '1122',
      fechaInicio: addDays(getTodayDate(), -5),
      fechaVencimiento: addDays(getTodayDate(), 25),
      precioCobrado: 11.50,
      recordatorioEnviado: false,
      notas: 'Usa Disney+ en Smart TV'
    },
    // CLIENTE 5: Max, vence en 1 día (Mañana)
    {
      id: 'cli-5',
      nombre: 'Roberto Peña',
      codigoPais: '+51',
      celular: '976543210',
      cuentaId: 'cta-3',
      perfilId: 'prf-3-1',
      pin: '2468',
      fechaInicio: addDays(getTodayDate(), -29),
      fechaVencimiento: addDays(getTodayDate(), 1),
      precioCobrado: 12.00,
      recordatorioEnviado: false,
      notas: 'Amigo de Roberto'
    }
  ]
};

// Cargar estado de almacenamiento local
export function cargarDatos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      guardarDatos(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.cuentas || !parsed.clientes) {
      guardarDatos(INITIAL_DATA);
      return INITIAL_DATA;
    }
    // Normalizar plataforma a HBO Max
    parsed.cuentas.forEach(c => {
      if (c.plataforma === 'Max' || c.plataforma === 'Hbo Max') {
        c.plataforma = 'HBO Max';
      }
    });
    return parsed;
  } catch (err) {
    console.error('Error al cargar datos locales:', err);
    return INITIAL_DATA;
  }
}

// Guardar estado en almacenamiento local
export function guardarDatos(datos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  } catch (err) {
    console.error('Error al guardar datos:', err);
  }
}

const TEMPLATES_KEY = 'flowstream_templates_v1';

// Plantillas predeterminadas de fábrica
export const DEFAULT_TEMPLATES = {
  recordatorio_2dias: `👋 ¡Hola {nombre}! Te saluda tu proveedor de streaming.\n\nTe recordamos que a tu membresía de *{plataforma}* le quedan *{dias}* para finalizar:\n👤 *Perfil:* {perfil}\n🔒 *PIN:* {pin}\n📅 *Fecha de vencimiento:* {fecha}\n\nSi deseas continuar con el servicio y no perder tu acceso ni recomendaciones, por favor responde a este mensaje para renovar tu pantalla. 🍿🎬`,
  vence_hoy: `🚨 ¡Hola {nombre}! Tu cuenta de *{plataforma}* (Perfil: *{perfil}*) vence *HOY* ({fecha}).\n\nPara no quedarte sin servicio esta noche, por favor confírmanos tu pago de renovación a la brevedad. ¡Muchas gracias! ⭐`,
  entrega_cuenta: `🎉 ¡Hola {nombre}! Tu acceso a *{plataforma}* está listo y activo por 30 días:\n\n📧 *Correo:* {correo}\n🔑 *Contraseña:* {password}\n👤 *Perfil asignado:* {perfil}\n🔒 *PIN:* {pin}\n📅 *Válido hasta:* {fecha}\n\n⚠️ *Importante:* No modifiques la contraseña ni los otros perfiles. ¡Que disfrutes tus series y películas!`,
  gracias_renovacion: `🙌 ¡Muchas gracias por tu renovación, {nombre}! ⭐\n\nTu suscripción a *{plataforma}* ha sido renovada exitosamente por *30 días más*:\n\n👤 *Perfil:* {perfil}\n🔒 *PIN:* {pin}\n📅 *Nueva fecha de vencimiento:* {fecha}\n\nGracias por tu puntualidad y preferencia. ¡Que sigas disfrutando de tu contenido favorito! 🍿🎬`,
  vencido: `⚠️ Hola {nombre}, tu suscripción de *{plataforma}* (Perfil: *{perfil}*) ha vencido.\n\nEl perfil se encuentra pausado. Si deseas reactivarlo hoy mismo, escríbenos para asignarte tu acceso de inmediato. ¡Saludos!`
};

// Obtener plantillas guardadas por el usuario o por defecto
export function obtenerPlantillasGuardadas() {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return { ...DEFAULT_TEMPLATES };
    return { ...DEFAULT_TEMPLATES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_TEMPLATES };
  }
}

// Fusiona y actualiza plantillas descargadas desde la nube (Supabase)
export function actualizarPlantillasGuardadas(nuevasPlantillas) {
  try {
    if (!nuevasPlantillas || typeof nuevasPlantillas !== 'object') return;
    const actuales = obtenerPlantillasGuardadas();
    const fusionadas = { ...actuales, ...nuevasPlantillas };
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(fusionadas));
    return fusionadas;
  } catch (err) {
    console.error('Error actualizando plantillas desde la nube:', err);
  }
}

// Extrae un formato general de plantilla convirtiendo datos específicos del cliente en variables {nombre}, {plataforma}, etc.
export function extraerPlantillaConVariables(textoEditado, cliente, perfil, cuenta) {
  if (!textoEditado) return '';
  let plantilla = textoEditado;

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Si el usuario no puso {nombre} explícito y dejó el nombre del cliente, reemplazarlo
  if (cliente?.nombre && cliente.nombre.trim() && !plantilla.includes('{nombre}')) {
    const regexNombre = new RegExp(escapeRegex(cliente.nombre.trim()), 'gi');
    plantilla = plantilla.replace(regexNombre, '{nombre}');
  }

  // Reemplazar plataforma si no está ya como {plataforma}
  if (cuenta?.plataforma && !plantilla.includes('{plataforma}')) {
    const regexPlat = new RegExp(escapeRegex(cuenta.plataforma.trim()), 'gi');
    plantilla = plantilla.replace(regexPlat, '{plataforma}');
  }

  // Reemplazar perfil si no está ya como {perfil}
  if (perfil?.nombre && !plantilla.includes('{perfil}')) {
    const regexPerf = new RegExp(escapeRegex(perfil.nombre.trim()), 'gi');
    plantilla = plantilla.replace(regexPerf, '{perfil}');
  }

  // Reemplazar PIN si no está como {pin}
  const pinActual = cliente?.pin || perfil?.pin;
  if (pinActual && String(pinActual).trim() && !plantilla.includes('{pin}')) {
    const regexPin = new RegExp(escapeRegex(String(pinActual).trim()), 'g');
    plantilla = plantilla.replace(regexPin, '{pin}');
  }

  // Reemplazar fecha formateada si está en el texto y no hay {fecha}
  const fechaFormateada = formatearFecha(cliente?.fechaVencimiento);
  if (fechaFormateada && fechaFormateada !== '-' && !plantilla.includes('{fecha}')) {
    const regexFecha = new RegExp(escapeRegex(fechaFormateada), 'gi');
    plantilla = plantilla.replace(regexFecha, '{fecha}');
  }

  // Reemplazar correo si aplica
  if (cuenta?.correo && !plantilla.includes('{correo}')) {
    const regexCorreo = new RegExp(escapeRegex(cuenta.correo.trim()), 'gi');
    plantilla = plantilla.replace(regexCorreo, '{correo}');
  }

  // Reemplazar password si aplica
  if (cuenta?.password && !plantilla.includes('{password}')) {
    const regexPass = new RegExp(escapeRegex(cuenta.password.trim()), 'gi');
    plantilla = plantilla.replace(regexPass, '{password}');
  }

  return plantilla;
}

// Guardar plantilla editada por el usuario (generalizándola para todos los clientes)
export function guardarPlantillaCustom(tipo, texto, cliente = null, perfil = null, cuenta = null) {
  try {
    const textoGeneralizado = cliente 
      ? extraerPlantillaConVariables(texto, cliente, perfil, cuenta)
      : texto;

    const actuales = obtenerPlantillasGuardadas();
    actuales[tipo] = textoGeneralizado;
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(actuales));
    return { exito: true, plantillaGuardada: textoGeneralizado };
  } catch (err) {
    console.error('Error al guardar plantilla:', err);
    return { exito: false, plantillaGuardada: texto };
  }
}

// Obtener la plantilla base sin sustitución de variables (para ver las etiquetas {nombre}, etc.)
export function obtenerPlantillaRaw(tipo) {
  const plantillas = obtenerPlantillasGuardadas();
  return plantillas[tipo] || DEFAULT_TEMPLATES[tipo] || DEFAULT_TEMPLATES.recordatorio_2dias;
}

// Restaurar una plantilla a su versión de fábrica
export function restaurarPlantillaDefecto(tipo) {
  try {
    const actuales = obtenerPlantillasGuardadas();
    actuales[tipo] = DEFAULT_TEMPLATES[tipo] || '';
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(actuales));
    return actuales[tipo];
  } catch {
    return DEFAULT_TEMPLATES[tipo] || '';
  }
}

// Generador de plantillas de WhatsApp con reemplazo de variables
export function generarPlantillaWhatsApp(tipo, cliente, perfil, cuenta) {
  const plantillas = obtenerPlantillasGuardadas();
  let baseTemplate = plantillas[tipo] || DEFAULT_TEMPLATES[tipo] || DEFAULT_TEMPLATES.recordatorio_2dias;

  const diasNum = calcularDiasRestantes(cliente?.fechaVencimiento);
  const diasTexto = diasNum === 2 ? '2 días' : diasNum === 1 ? '1 día (vence mañana)' : diasNum === 0 ? 'hoy' : `${diasNum} días`;
  const nombre = cliente?.nombre || 'Estimado cliente';
  const plataforma = cuenta?.plataforma || 'Streaming';
  const perfilNombre = perfil?.nombre || `Perfil ${perfil?.numero || ''}`;
  const pin = cliente?.pin || perfil?.pin || 'Sin PIN';
  const fechaVenc = formatearFecha(cliente?.fechaVencimiento);
  const correo = cuenta?.correo || '';
  const password = cuenta?.password || '';

  return baseTemplate
    .replace(/\{nombre\}/g, nombre)
    .replace(/\{plataforma\}/g, plataforma)
    .replace(/\{perfil\}/g, perfilNombre)
    .replace(/\{pin\}/g, pin)
    .replace(/\{dias\}/g, diasTexto)
    .replace(/\{fecha\}/g, fechaVenc)
    .replace(/\{correo\}/g, correo)
    .replace(/\{password\}/g, password);
}

// Construye el enlace directo wa.me con texto URL codificado
export function construirEnlaceWhatsApp(codigoPais, numeroCelular, textoMensaje) {
  const prefijoLimpio = (codigoPais || '+51').replace(/\D/g, '');
  const numeroLimpio = (numeroCelular || '').replace(/\D/g, '');
  const telefonoCompleto = `${prefijoLimpio}${numeroLimpio}`;
  const textoCodificado = encodeURIComponent(textoMensaje || '');
  return `https://wa.me/${telefonoCompleto}?text=${textoCodificado}`;
}

export const crearEnlaceWhatsApp = construirEnlaceWhatsApp;

// Exportar base de datos a formato SQL para ejecutar directamente
export function generarScriptSQL(datos) {
  const { cuentas = [], clientes = [] } = datos;
  let sql = `-- ====================================================================\n`;
  sql += `-- SCRIPT SQL EXPORTADO DESDE FLOW STREAM\n`;
  sql += `-- Fecha de exportación: ${new Date().toLocaleString('es-ES')}\n`;
  sql += `-- ====================================================================\n\n`;

  sql += `-- 1. Inserción de Cuentas Maestras\n`;
  if (cuentas.length === 0) {
    sql += `-- No hay cuentas registradas actualmente.\n\n`;
  } else {
    for (const c of cuentas) {
      const correo = c.correo.replace(/'/g, "''");
      const pass = c.password.replace(/'/g, "''");
      const notas = (c.notas || '').replace(/'/g, "''");
      const prov = (c.proveedor || '').replace(/'/g, "''");
      sql += `INSERT INTO cuentas_streaming (plataforma, correo, password, fecha_corte_cuenta, costo_cuenta, cantidad_perfiles, proveedor, notas, estado) VALUES ('${c.plataforma}', '${correo}', '${pass}', '${c.fechaCorte}', ${c.costo || 0}, ${c.cantidadPerfiles || 5}, '${prov}', '${notas}', 'activa');\n`;
    }
    sql += `\n`;
  }

  sql += `-- 2. Inserción de Clientes y Asignaciones\n`;
  if (clientes.length === 0) {
    sql += `-- No hay clientes registrados actualmente.\n\n`;
  } else {
    for (const cli of clientes) {
      const nombre = (cli.nombre || 'Cliente').replace(/'/g, "''");
      const cod = cli.codigoPais || '+51';
      const cel = cli.celular || '';
      const celComp = `${cod}${cel}`;
      const pin = cli.pin || '';
      const notas = (cli.notas || '').replace(/'/g, "''");
      sql += `INSERT INTO clientes (nombre, codigo_pais, celular, celular_completo, perfil_id, pin, fecha_inicio, fecha_vencimiento, precio_cobrado, estado, notas) VALUES ('${nombre}', '${cod}', '${cel}', '${celComp}', 1, '${pin}', '${cli.fechaInicio}', '${cli.fechaVencimiento}', ${cli.precioCobrado || 0}, 'activo', '${notas}');\n`;
    }
  }

  return sql;
}

// Verifica si la fecha de corte de la cuenta maestra vence antes que la fecha de vencimiento del cliente
export function verificarDesfase(fechaCorteCuenta, fechaVencimientoCliente) {
  if (!fechaCorteCuenta || !fechaVencimientoCliente) {
    return { tieneDesfase: false, diasDiferencia: 0 };
  }
  const corte = new Date(fechaCorteCuenta + 'T00:00:00');
  const venc = new Date(fechaVencimientoCliente + 'T00:00:00');
  const diffTime = corte.getTime() - venc.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return {
    tieneDesfase: diffDays < 0,
    diasDiferencia: Math.abs(diffDays),
    fechaCorte: fechaCorteCuenta,
    fechaVencimiento: fechaVencimientoCliente
  };
}

// Genera texto de comprobante de membresía oficial para enviar por WhatsApp
export function generarTextoRecibo(cliente, perfil, cuenta, folio = null) {
  const folioFinal = folio || ('FS-' + (cliente?.id?.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)));
  const fechaHoy = formatearFecha(getTodayDate());
  const fechaVenc = formatearFecha(cliente?.fechaVencimiento);
  const fechaIni = formatearFecha(cliente?.fechaInicio || getTodayDate());
  const precio = Number(cliente?.precioCobrado || 0).toFixed(2);
  const plataforma = cuenta?.plataforma || 'Streaming';
  const nombreCliente = cliente?.nombre || 'Cliente';
  const perfilNombre = perfil?.nombre || `Perfil ${perfil?.numero || 1}`;
  const pin = cliente?.pin || perfil?.pin || 'Sin PIN';

  return `🧾 *COMPROBANTE OFICIAL DE MEMBRESÍA*
━━━━━━━━━━━━━━━━━━━━━━━━
🍿 *Proveedor:* Flow Stream Oficial
📋 *N° de Folio:* #${folioFinal}
📅 *Fecha de Emisión:* ${fechaHoy}
👤 *Cliente:* ${nombreCliente}
📱 *WhatsApp:* ${cliente?.codigoPais || '+51'} ${cliente?.celular || ''}
━━━━━━━━━━━━━━━━━━━━━━━━
📺 *Servicio:* *${plataforma.toUpperCase()}*
👤 *Perfil Asignado:* ${perfilNombre}
🔒 *PIN de Seguridad:* ${pin}
🗓️ *Periodo:* ${fechaIni} al *${fechaVenc}*
💵 *Monto Pagado:* S/ ${precio}
━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Estado:* ACTIVO Y GARANTIZADO (30 DÍAS)
📌 *Reglas de uso:*
• Uso exclusivo en 1 sola pantalla en simultáneo.
• Prohibido cambiar contraseñas o alterar otros perfiles.
• Soporte técnico activo durante todo tu periodo.

⭐ *¡Muchas gracias por tu preferencia!* Disfruta tus películas y series favoritas. 🎬🍿`;
}

// ====================================================================
// CENTRO DE CÓDIGOS DE ACCESO (NETFLIX HOGAR & OTP MULTIPLATAFORMA)
// Optimizado para correos personales (Gmail, Outlook, Yahoo, etc.)
// ====================================================================

const CODIGOS_STORAGE_KEY = 'streamflow_codigos_v1';

/**
 * Analiza un texto pegado desde un correo personal de Gmail / Outlook / etc.
 * Extrae códigos de 4 dígitos (Netflix Hogar), 6 dígitos (OTP Disney/Max), y enlaces de verificación.
 */
export function extraerCodigoDeTexto(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      codigo: '',
      enlace: '',
      tipo: 'desconocido',
      plataformaSugerida: 'Netflix',
      seguridad: 'normal',
      detalles: 'Texto vacío'
    };
  }

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Detección de plataforma
  let plataformaSugerida = 'Netflix';
  if (lower.includes('disney') || lower.includes('star+')) {
    plataformaSugerida = 'Disney+';
  } else if (lower.includes('max') || lower.includes('hbo')) {
    plataformaSugerida = 'HBO Max';
  } else if (lower.includes('prime') || lower.includes('amazon')) {
    plataformaSugerida = 'Prime Video';
  } else if (lower.includes('paramount')) {
    plataformaSugerida = 'Paramount+';
  } else if (lower.includes('crunchyroll')) {
    plataformaSugerida = 'Crunchyroll';
  } else if (lower.includes('spotify')) {
    plataformaSugerida = 'Spotify';
  } else if (lower.includes('netflix')) {
    plataformaSugerida = 'Netflix';
  }

  // 2. Extraer enlaces relevantes de actualización o confirmación
  let enlace = '';
  const urlMatches = text.match(/https?:\/\/[^\s<>"{}|\\^`]+[^\s<>"{}|\\^`.,;:?!)]/gi) || [];
  for (const url of urlMatches) {
    const uLower = url.toLowerCase();
    if (
      uLower.includes('netflix.com/update-primary-location') ||
      uLower.includes('netflix.com/youraccount') ||
      uLower.includes('netflix.com/account') ||
      uLower.includes('netflix.com/travel') ||
      uLower.includes('disneyplus.com/begin') ||
      uLower.includes('max.com/tvsignin') ||
      uLower.includes('amazon.com/mytv') ||
      uLower.includes('verify') ||
      uLower.includes('confirm') ||
      uLower.includes('token')
    ) {
      enlace = url;
      break;
    }
  }
  if (!enlace && urlMatches.length > 0) {
    enlace = urlMatches[0];
  }

  // 3. Extracción de códigos según modo o detección inteligente
  let codigo = '';
  let tipo = 'login_code';

  // Detección de patrones específicos
  const netflixHogarRegex = /(?:c[oó]digo(?: de confirmaci[oó]n| para actualizar| de acceso)?(?:\s+es)?(?:\s*:)?|\bhogar\b[^\d]{1,20})\s*(\d{4})\b/i;
  const matchNetflix = text.match(netflixHogarRegex);

  const otp6Regex = /(?:c[oó]digo|otp|passcode|one-time code|c[oó]digo de un solo uso|c[oó]digo de 6 d[ií]gitos)[^\d]{1,25}(\d{6})\b/i;
  const matchOtp6 = text.match(otp6Regex);

  const resetPassRegex = /(?:restablecer|cambiar|reset|recuperar|actualizar)\s+(?:tu\s+)?contrase[ñn]a/i;
  const isReset = resetPassRegex.test(text);

  const travelRegex = /(?:modo\s+viaje|viajero|viaje|temporal|acceso\s+temporal|travel)/i;
  const isTravel = travelRegex.test(text);

  if (isReset) {
    tipo = 'reset_password';
    if (matchOtp6) codigo = matchOtp6[1];
    else if (matchNetflix) codigo = matchNetflix[1];
  } else if (isTravel) {
    tipo = 'travel_mode';
    if (matchNetflix) codigo = matchNetflix[1];
    else if (matchOtp6) codigo = matchOtp6[1];
  } else if (matchNetflix || lower.includes('hogar') || (enlace && enlace.includes('update-primary-location'))) {
    tipo = 'update_household';
    if (matchNetflix) codigo = matchNetflix[1];
  } else if (matchOtp6) {
    codigo = matchOtp6[1];
    tipo = 'otp_6_digits';
  } else {
    // Si no coincide con palabras clave, buscar por longitud
    const soloNumeros = text.replace(/[^0-9]/g, '');
    if (soloNumeros.length === 4) {
      codigo = soloNumeros;
      tipo = 'update_household';
    } else if (soloNumeros.length === 6) {
      codigo = soloNumeros;
      tipo = 'otp_6_digits';
    } else {
      const matches4 = text.match(/\b\d{4}\b/g);
      const matches6 = text.match(/\b\d{6}\b/g);

      if (plataformaSugerida === 'Netflix' && matches4 && matches4.length > 0) {
        codigo = matches4[0];
        tipo = 'update_household';
      } else if (matches6 && matches6.length > 0) {
        codigo = matches6[0];
        tipo = 'otp_6_digits';
      } else if (matches4 && matches4.length > 0) {
        codigo = matches4[0];
        tipo = 'login_code';
      }
    }
  }

  if (!codigo && enlace) {
    tipo = 'enlace_hogar';
  }

  return {
    codigo: codigo || '',
    enlace: enlace || '',
    tipo,
    plataformaSugerida,
    textoOriginal: text
  };
}

/**
 * Cargar historial de códigos recientes guardados
 */
export function cargarCodigosRecientes() {
  try {
    const raw = localStorage.getItem(CODIGOS_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Error cargando códigos recientes:', err);
    return [];
  }
}

/**
 * Guardar un nuevo código en el historial
 */
export function guardarCodigoReciente(item) {
  try {
    const actuales = cargarCodigosRecientes();
    const nuevo = {
      id: generarId(),
      fecha: new Date().toISOString(),
      cuentaId: item.cuentaId || null,
      plataforma: item.plataforma || 'Netflix',
      perfilId: item.perfilId || null,
      perfilNombre: item.perfilNombre || '',
      clienteId: item.clienteId || null,
      clienteNombre: item.clienteNombre || 'Cliente',
      clienteCelular: item.clienteCelular || '',
      codigoPais: item.codigoPais || '+51',
      codigo: item.codigo || '',
      enlace: item.enlace || '',
      tipo: item.tipo || 'netflix_hogar',
      notas: item.notas || '',
      minutosExpiracion: item.minutosExpiracion || 15,
      usado: false
    };

    const actualizados = [nuevo, ...actuales.filter(c => c.id !== nuevo.id)].slice(0, 40);
    localStorage.setItem(CODIGOS_STORAGE_KEY, JSON.stringify(actualizados));
    return nuevo;
  } catch (err) {
    console.error('Error guardando código reciente:', err);
    return null;
  }
}

/**
 * Eliminar un código del historial
 */
export function eliminarCodigoReciente(id) {
  try {
    const actuales = cargarCodigosRecientes();
    const filtrados = actuales.filter(c => c.id !== id);
    localStorage.setItem(CODIGOS_STORAGE_KEY, JSON.stringify(filtrados));
    return filtrados;
  } catch (err) {
    console.error('Error eliminando código reciente:', err);
    return [];
  }
}

/**
 * Genera el texto con formato profesional para enviar el código por WhatsApp
 */
export function generarTextoWhatsAppCodigo({ codigo, enlace, tipo, plataforma, clienteNombre, pin, perfilNombre }) {
  const nombre = clienteNombre || 'Estimado cliente';
  const plat = (plataforma || 'Netflix').toUpperCase();
  const perf = perfilNombre ? `\n👤 *Perfil:* ${perfilNombre}` : '';
  const pinText = pin ? `\n🔒 *PIN:* ${pin}` : '';

  let titulo = '📺 *CÓDIGO DE ACCESO TEMPORAL / HOGAR*';
  if (tipo === 'login_code') {
    titulo = '🔑 *CÓDIGO DE INICIO DE SESIÓN*';
  } else if (tipo === 'reset_password') {
    titulo = '🔒 *RESTABLECER CONTRASEÑA*';
  } else if (tipo === 'travel_mode') {
    titulo = '✈️ *MODO VIAJE (ACCESO TEMPORAL)*';
  } else if (tipo === 'update_household' || tipo === 'netflix_hogar') {
    titulo = '🏠 *ACTUALIZACIÓN DE HOGAR NETFLIX*';
  } else if (tipo === 'otp_6_digits' || tipo === 'otp_acceso') {
    titulo = '🛡️ *CÓDIGO DE 6 DÍGITOS (OTP)*';
  } else if (tipo === 'enlace_hogar') {
    titulo = '🔗 *ENLACE DE CONFIRMACIÓN DE HOGAR*';
  }

  let cuerpoCodigo = '';
  if (codigo) {
    cuerpoCodigo = `
🔑 *TU CÓDIGO ES:*
👉  *${codigo}*  👈`;
  }

  let cuerpoEnlace = '';
  if (enlace) {
    cuerpoEnlace = `
🔗 *O confirma directamente con este enlace oficial:*
${enlace}`;
  }

  return `${titulo}
━━━━━━━━━━━━━━━━━━━━━━━━
Hola *${nombre}*, te enviamos el acceso solicitado para tu cuenta de *${plat}*:${perf}${pinText}
${cuerpoCodigo}${cuerpoEnlace}

⏱️ *Validez:* Aproximadamente 15 minutos.
⚠️ *Recomendación:* Ingrésalo de inmediato en tu TV o pantalla para evitar que expire.

━━━━━━━━━━━━━━━━━━━━━━━━
🍿 *Flow Stream* | Soporte y Atención Oficial`;
}


