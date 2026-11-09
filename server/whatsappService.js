import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios y rutas de almacenamiento persistente
const AUTH_DIR = path.join(__dirname, 'auth_baileys');
const CONFIG_FILE = path.join(__dirname, 'auto_reminder_config.json');
const HISTORY_FILE = path.join(__dirname, 'auto_reminder_history.json');

// Supabase client para ejecución 100% en servidor
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://svgsvikpkwicrnclbvmy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sFyCdytn85hoDMDWCuDjTA_cNx0-4Gn';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Plantillas por defecto
const DEFAULT_TEMPLATES = {
  recordatorio_2dias: `👋 ¡Hola {nombre}! Te saluda tu proveedor de streaming.\n\nTe recordamos que a tu membresía de *{plataforma}* le quedan *{dias}* para finalizar:\n👤 *Perfil:* {perfil}\n🔒 *PIN:* {pin}\n📅 *Fecha de vencimiento:* {fecha}\n\nSi deseas continuar con el servicio y no perder tu acceso ni recomendaciones, por favor responde a este mensaje para renovar tu pantalla. 🍿🎬`,
  vence_hoy: `🚨 ¡Hola {nombre}! Tu cuenta de *{plataforma}* (Perfil: *{perfil}*) vence *HOY* ({fecha}).\n\nPara no quedarte sin servicio esta noche, por favor confírmanos tu pago de renovación a la brevedad. ¡Muchas gracias! ⭐`
};

// Estado en memoria de WhatsApp
let sock = null;
let currentQrDataUrl = null;
let connectionStatus = {
  status: 'disconnected', // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
  isConnected: false,
  phoneNumber: '',
  pushName: '',
  lastConnected: null,
  error: null
};

let autoReminderJobRunning = false;

// ---------------------------------------------------------------------------
// Helpers de Configuración e Historial
// ---------------------------------------------------------------------------

export function getAutoReminderConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return {
        enabled: true,
        sendHour: 9,
        sendMinute: 0,
        anticipationDays: [2, 0],
        delaySeconds: 6,
        lastRunDate: null,
        ...data
      };
    }
  } catch (err) {
    console.error('[WhatsApp Service] Error leyendo auto_reminder_config.json:', err.message);
  }
  return {
    enabled: true,
    sendHour: 9,
    sendMinute: 0,
    anticipationDays: [2, 0],
    delaySeconds: 6,
    lastRunDate: null
  };
}

export function saveAutoReminderConfig(newConfig) {
  try {
    const current = getAutoReminderConfig();
    const merged = { ...current, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('[WhatsApp Service] Error guardando configuración:', err.message);
    throw err;
  }
}

export function getReminderHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[WhatsApp Service] Error leyendo historial:', err.message);
  }
  return [];
}

function appendReminderHistory(entry) {
  try {
    const history = getReminderHistory();
    history.unshift(entry);
    // Conservar los últimos 500 registros
    const trimmed = history.slice(0, 500);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WhatsApp Service] Error guardando historial:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Conexión y Autenticación con Baileys (WhatsApp Web Protocol)
// ---------------------------------------------------------------------------

export async function initWhatsApp() {
  if (connectionStatus.isConnected && sock) {
    return connectionStatus;
  }

  connectionStatus.status = 'connecting';
  connectionStatus.error = null;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[WhatsApp Service] Iniciando Baileys v${version.join('.')} (Última: ${isLatest})`);

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      browser: ['Flow Stream CRM', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Código QR generado
      if (qr) {
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 7 });
          connectionStatus.status = 'qr_ready';
          connectionStatus.isConnected = false;
          console.log('[WhatsApp Service] Nuevo código QR listo para escanear');
        } catch (qrErr) {
          console.error('[WhatsApp Service] Error generando QR DataURL:', qrErr.message);
        }
      }

      // Conexión abierta y exitosa
      if (connection === 'open') {
        const rawId = sock?.user?.id || '';
        const phone = rawId.split(':')[0] || rawId.split('@')[0];
        connectionStatus = {
          status: 'connected',
          isConnected: true,
          phoneNumber: phone ? `+${phone}` : '',
          pushName: sock?.user?.name || '',
          lastConnected: new Date().toISOString(),
          error: null
        };
        currentQrDataUrl = null;
        console.log(`[WhatsApp Service] ✅ ¡WhatsApp conectado exitosamente como ${connectionStatus.phoneNumber}!`);
      }

      // Conexión cerrada
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.warn(`[WhatsApp Service] Conexión cerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`);

        connectionStatus.isConnected = false;
        currentQrDataUrl = null;

        if (statusCode === DisconnectReason.loggedOut) {
          connectionStatus.status = 'disconnected';
          connectionStatus.phoneNumber = '';
          connectionStatus.pushName = '';
          // Limpiar credenciales caducadas
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {}
        } else if (shouldReconnect) {
          connectionStatus.status = 'connecting';
          setTimeout(() => {
            initWhatsApp();
          }, 4000);
        } else {
          connectionStatus.status = 'disconnected';
        }
      }
    });

    return connectionStatus;
  } catch (err) {
    console.error('[WhatsApp Service] Error al inicializar socket:', err);
    connectionStatus.status = 'disconnected';
    connectionStatus.isConnected = false;
    connectionStatus.error = err.message;
    throw err;
  }
}

export function getWhatsAppStatus() {
  return {
    ...connectionStatus,
    qrCode: currentQrDataUrl
  };
}

export async function disconnectWhatsApp() {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
    }
  } catch (e) {
    // Si ya estaba desconectado
  }

  connectionStatus = {
    status: 'disconnected',
    isConnected: false,
    phoneNumber: '',
    pushName: '',
    lastConnected: null,
    error: null
  };
  currentQrDataUrl = null;

  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch (e) {}

  return { success: true, message: 'WhatsApp desconectado y sesión cerrada.' };
}

// ---------------------------------------------------------------------------
// Enviar Mensajes Individuales
// ---------------------------------------------------------------------------

export async function sendWhatsAppMessage(phone, messageText) {
  if (!connectionStatus.isConnected || !sock) {
    throw new Error('WhatsApp no está conectado. Escanea el código QR primero.');
  }

  if (!phone || !messageText) {
    throw new Error('Número de celular y mensaje son obligatorios.');
  }

  // Limpiar número (solo dígitos)
  let cleanNumber = String(phone).replace(/\D/g, '');
  if (!cleanNumber) {
    throw new Error(`Número de teléfono inválido: ${phone}`);
  }

  // Si tiene 9 dígitos (estándar Perú/móviles), anteponer código país 51 por defecto si no lo tiene
  if (cleanNumber.length === 9) {
    cleanNumber = `51${cleanNumber}`;
  }

  const jid = `${cleanNumber}@s.whatsapp.net`;

  try {
    const res = await sock.sendMessage(jid, { text: messageText });
    return {
      success: true,
      messageId: res?.key?.id,
      to: cleanNumber
    };
  } catch (err) {
    console.error(`[WhatsApp Service] Error enviando a ${cleanNumber}:`, err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Algoritmo de Días Restantes y Formato de Plantilla
// ---------------------------------------------------------------------------

function calcularDiasRestantes(fechaVencimiento) {
  if (!fechaVencimiento) return 999;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [year, month, day] = String(fechaVencimiento).split('-').map(Number);
  const vencimiento = new Date(year, (month || 1) - 1, day || 1);
  vencimiento.setHours(0, 0, 0, 0);

  const diffTime = vencimiento.getTime() - hoy.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const [year, month, day] = String(fechaStr).split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mIndex = parseInt(month, 10) - 1;
  return `${day} ${meses[mIndex] || month} ${year}`;
}

function generarTextoRecordatorio(tipo, cli, prf, cta, templates = DEFAULT_TEMPLATES) {
  const base = templates[tipo] || DEFAULT_TEMPLATES[tipo] || DEFAULT_TEMPLATES.recordatorio_2dias;
  const diasNum = calcularDiasRestantes(cli.fechaVencimiento);
  const diasTexto = diasNum === 2 ? '2 días' : diasNum === 1 ? '1 día (vence mañana)' : diasNum === 0 ? 'hoy' : `${diasNum} días`;

  return base
    .replace(/{nombre}/g, cli.nombre || 'Estimado cliente')
    .replace(/{plataforma}/g, cta?.plataforma || 'Streaming')
    .replace(/{perfil}/g, prf?.nombre || `Perfil ${prf?.numero_perfil || prf?.numero || '?'}`)
    .replace(/{pin}/g, cli.pin || prf?.pin || 'Sin PIN')
    .replace(/{fecha}/g, formatearFecha(cli.fechaVencimiento))
    .replace(/{dias}/g, diasTexto)
    .replace(/{correo}/g, cta?.correo || '')
    .replace(/{password}/g, cta?.password || '');
}

// ---------------------------------------------------------------------------
// Despacho Automático de Recordatorios
// ---------------------------------------------------------------------------

export async function runAutomatedReminders(options = {}) {
  const { force = false, dryRun = false, clientData = null } = options;
  const config = getAutoReminderConfig();

  if (!config.enabled && !force) {
    return { success: false, message: 'El envío automático está desactivado en la configuración.' };
  }

  if (!connectionStatus.isConnected && !dryRun) {
    return { success: false, message: 'WhatsApp no está conectado. Conecta tu sesión escaneando el QR.' };
  }

  if (autoReminderJobRunning) {
    return { success: false, message: 'Ya hay un proceso de envío en ejecución actualmente.' };
  }

  autoReminderJobRunning = true;
  console.log(`[WhatsApp Auto] 🚀 Iniciando verificación de recordatorios (DryRun: ${dryRun})...`);

  const results = {
    totalEvaluated: 0,
    totalEligible: 0,
    totalSent: 0,
    totalErrors: 0,
    details: []
  };

  try {
    let clientes = [];
    let cuentas = [];
    let perfiles = [];
    let plantillas = { ...DEFAULT_TEMPLATES };

    // 1. Obtener datos desde Supabase o desde el payload local
    if (clientData && clientData.clientes) {
      clientes = clientData.clientes || [];
      cuentas = clientData.cuentas || [];
    } else {
      const [resCli, resCta, resPrf, resPlat] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('cuentas_streaming').select('*'),
        supabase.from('perfiles').select('*'),
        supabase.from('plantillas_whatsapp').select('*')
      ]);

      clientes = resCli.data || [];
      cuentas = resCta.data || [];
      perfiles = resPrf.data || [];

      if (resPlat.data && resPlat.data.length > 0) {
        resPlat.data.forEach(p => {
          if (p.id || p.tipo) plantillas[p.id || p.tipo] = p.contenido;
        });
      }
    }

    results.totalEvaluated = clientes.length;

    // Mapas rápidos
    const cuentasMap = {};
    cuentas.forEach(c => { cuentasMap[c.id] = c; cuentasMap[String(c.id)] = c; });
    const perfilesMap = {};
    perfiles.forEach(p => { perfilesMap[p.id] = p; perfilesMap[String(p.id)] = p; });

    // Fecha de hoy en formato YYYY-MM-DD
    const hoyStr = new Date().toISOString().split('T')[0];
    const history = getReminderHistory();

    // 2. Filtrar clientes urgentes que no hayan recibido aviso hoy
    for (const cli of clientes) {
      if (!cli.fechaVencimiento || !cli.celular) continue;

      const dias = calcularDiasRestantes(cli.fechaVencimiento);
      const esUrgente = dias >= 0 && dias <= 2; // Vence hoy, mañana o en 2 días

      if (!esUrgente) continue;

      // Verificar si ya se le envió aviso hoy para este mismo vencimiento
      const alreadySentToday = history.some(h => 
        String(h.clienteId) === String(cli.id) &&
        h.fechaEnvio &&
        h.fechaEnvio.startsWith(hoyStr) &&
        h.estado === 'enviado'
      );

      if (alreadySentToday && !force) {
        results.details.push({
          cliente: cli.nombre,
          celular: cli.celular,
          dias,
          estado: 'omitido_ya_enviado_hoy'
        });
        continue;
      }

      results.totalEligible++;

      const prf = perfilesMap[cli.perfil_id || cli.perfilId];
      const cta = cuentasMap[cli.cuenta_id || cli.cuentaId] || cuentasMap[prf?.cuenta_id];
      const tipoTemplate = dias === 0 ? 'vence_hoy' : 'recordatorio_2dias';
      const mensaje = generarTextoRecordatorio(tipoTemplate, cli, prf, cta, plantillas);

      const phoneToUse = `${cli.codigo_pais || cli.codigoPais || '+51'}${cli.celular}`;

      if (dryRun) {
        results.totalSent++;
        results.details.push({
          clienteId: cli.id,
          nombre: cli.nombre,
          celular: phoneToUse,
          plataforma: cta?.plataforma || 'Streaming',
          perfil: prf?.nombre || `Perfil ${prf?.numero_perfil || '?' }`,
          dias,
          estado: 'simulado_dry_run',
          mensaje
        });
        continue;
      }

      // Enviar por WhatsApp con pausa de seguridad
      try {
        console.log(`[WhatsApp Auto] Enviando recordatorio a ${cli.nombre} (${phoneToUse})...`);
        const sendRes = await sendWhatsAppMessage(phoneToUse, mensaje);

        results.totalSent++;
        const logEntry = {
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          clienteId: cli.id,
          nombre: cli.nombre,
          celular: phoneToUse,
          plataforma: cta?.plataforma || 'Streaming',
          perfil: prf?.nombre || `Perfil ${prf?.numero_perfil || '?' }`,
          dias,
          fechaEnvio: new Date().toISOString(),
          estado: 'enviado',
          messageId: sendRes?.messageId
        };
        appendReminderHistory(logEntry);
        results.details.push(logEntry);

        // Actualizar flag en Supabase
        try {
          await supabase
            .from('clientes')
            .update({ recordatorio_enviado: true, ultimo_recordatorio: new Date().toISOString() })
            .eq('id', cli.id);
        } catch (dbErr) {
          console.warn('[WhatsApp Auto] Aviso actualización Supabase:', dbErr.message);
        }

        // Pausa de seguridad de 5 a 7 segundos para evitar filtros anti-spam de WhatsApp
        const delayMs = (config.delaySeconds || 6) * 1000;
        await new Promise(r => setTimeout(r, delayMs));

      } catch (sendErr) {
        results.totalErrors++;
        const errEntry = {
          clienteId: cli.id,
          nombre: cli.nombre,
          celular: phoneToUse,
          dias,
          fechaEnvio: new Date().toISOString(),
          estado: 'error',
          error: sendErr.message
        };
        appendReminderHistory(errEntry);
        results.details.push(errEntry);
      }
    }

    // Actualizar última fecha de ejecución exitosa
    saveAutoReminderConfig({ lastRunDate: hoyStr });
    console.log(`[WhatsApp Auto] ✅ Despacho completado. Enviados: ${results.totalSent}, Errores: ${results.totalErrors}`);

    return {
      success: true,
      ...results
    };

  } catch (err) {
    console.error('[WhatsApp Auto] Error general durante despacho:', err);
    return {
      success: false,
      error: err.message,
      ...results
    };
  } finally {
    autoReminderJobRunning = false;
  }
}

// ---------------------------------------------------------------------------
// Enviar Mensajes Masivos / Difusión (Avisos de Caída / Mantenimiento)
// ---------------------------------------------------------------------------

export async function sendBroadcastMessages(messages = [], options = {}) {
  const { delaySeconds = 4, reason = 'incidencia' } = options;

  if (!connectionStatus.isConnected || !sock) {
    throw new Error('WhatsApp no está conectado. Conecta tu WhatsApp primero en el módulo "WhatsApp Auto".');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('No se proporcionaron mensajes para enviar.');
  }

  const results = [];
  let totalSent = 0;
  let totalErrors = 0;

  for (let i = 0; i < messages.length; i++) {
    const item = messages[i];
    try {
      const res = await sendWhatsAppMessage(item.phone, item.message);
      totalSent++;
      const successEntry = {
        id: `inc_${Date.now()}_${i}`,
        clienteId: item.clienteId,
        nombre: item.nombre,
        celular: item.phone,
        plataforma: item.plataforma || 'General',
        perfil: item.perfil || '',
        fechaEnvio: new Date().toISOString(),
        estado: 'enviado',
        tipo: reason,
        messageId: res.messageId
      };
      appendReminderHistory(successEntry);
      results.push({ ...item, success: true, messageId: res.messageId });
    } catch (err) {
      totalErrors++;
      const errorEntry = {
        id: `inc_${Date.now()}_${i}`,
        clienteId: item.clienteId,
        nombre: item.nombre,
        celular: item.phone,
        plataforma: item.plataforma || 'General',
        perfil: item.perfil || '',
        fechaEnvio: new Date().toISOString(),
        estado: 'error',
        tipo: reason,
        error: err.message
      };
      appendReminderHistory(errorEntry);
      results.push({ ...item, success: false, error: err.message });
    }

    // Esperar pausa anti-spam si hay más mensajes en la cola
    if (i < messages.length - 1 && delaySeconds > 0) {
      await new Promise(r => setTimeout(r, delaySeconds * 1000));
    }
  }

  return {
    success: true,
    totalSent,
    totalErrors,
    results
  };
}

// ---------------------------------------------------------------------------
// Scheduler / Cron automático en segundo plano
// ---------------------------------------------------------------------------

let schedulerInterval = null;

export function startAutoReminderScheduler() {
  if (schedulerInterval) clearInterval(schedulerInterval);

  console.log('[WhatsApp Scheduler] ⏰ Planificador diario de recordatorios iniciado.');

  // Revisar cada 10 minutos
  schedulerInterval = setInterval(async () => {
    try {
      const config = getAutoReminderConfig();
      if (!config.enabled) return;
      if (!connectionStatus.isConnected) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];

      // Si coincide la hora configurada (ej. 9:00 AM) y no se ha ejecutado hoy
      if (currentHour === (config.sendHour ?? 9) && config.lastRunDate !== todayStr) {
        console.log(`[WhatsApp Scheduler] Es la hora programada (${currentHour}:00). Ejecutando envío automático...`);
        await runAutomatedReminders();
      }
    } catch (err) {
      console.error('[WhatsApp Scheduler] Error en chequeo periódico:', err.message);
    }
  }, 10 * 60 * 1000); // 10 minutos
}

