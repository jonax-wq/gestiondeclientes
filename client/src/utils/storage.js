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
