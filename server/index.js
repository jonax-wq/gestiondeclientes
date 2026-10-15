import express from 'express';
import cors from 'cors';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'imap_config.json');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Estado en memoria
let imapClient = null;
let isMonitoring = false;
let monitorStatus = {
  connected: false,
  email: '',
  provider: 'gmail',
  lastCheck: null,
  error: null,
  codesFoundCount: 0
};

// Historial en memoria de códigos extraídos por el backend
let extractedCodesHistory = [];

/**
 * Cargar configuración guardada
 */
function loadSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error leyendo imap_config.json:', err.message);
  }
  return null;
}

/**
 * Guardar configuración en archivo local seguro
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando imap_config.json:', err.message);
  }
}

/**
 * Parser de texto para extraer códigos de Netflix Hogar y OTPs
 */
function extractCodesFromEmail(text, html, subject, toHeaders) {
  const content = `${subject || ''}\n${text || ''}\n${html ? html.replace(/<[^>]+>/g, ' ') : ''}`;
  const lower = content.toLowerCase();

  // 1. Detectar plataforma
  let plataforma = 'Netflix';
  if (lower.includes('disney') || lower.includes('star+')) plataforma = 'Disney+';
  else if (lower.includes('max') || lower.includes('hbo')) plataforma = 'HBO Max';
  else if (lower.includes('prime') || lower.includes('amazon')) plataforma = 'Prime Video';
  else if (lower.includes('paramount')) plataforma = 'Paramount+';
  else if (lower.includes('spotify')) plataforma = 'Spotify';

  // 2. Extraer enlaces de confirmación oficial
  let enlace = '';
  const urlMatches = content.match(/https?:\/\/[^\s<>"{}|\\^`]+[^\s<>"{}|\\^`.,;:?!)]/gi) || [];
  for (const url of urlMatches) {
    const uLower = url.toLowerCase();
    if (
      uLower.includes('netflix.com/update-primary-location') ||
      uLower.includes('netflix.com/youraccount') ||
      uLower.includes('netflix.com/travel') ||
      uLower.includes('disneyplus.com/begin') ||
      uLower.includes('max.com/tvsignin') ||
      uLower.includes('amazon.com/mytv')
    ) {
      enlace = url;
      break;
    }
  }

  // 3. Extraer códigos numéricos
  let codigo = '';
  let tipo = 'general';

  // A. Netflix Hogar (4 dígitos)
  const netflixHogarRegex = /(?:c[oó]digo(?: de confirmaci[oó]n| para actualizar| de acceso)?(?:\s+es)?(?:\s*:)?|\bhogar\b[^\d]{1,25})\s*(\d{4})\b/i;
  const matchNetflix = content.match(netflixHogarRegex);

  // B. OTP Multiplataforma (6 dígitos)
  const otp6Regex = /(?:c[oó]digo|otp|passcode|one-time code|c[oó]digo de un solo uso)[^\d]{1,25}(\d{6})\b/i;
  const matchOtp6 = content.match(otp6Regex);

  if (matchNetflix) {
    codigo = matchNetflix[1];
    tipo = 'netflix_hogar';
  } else if (matchOtp6) {
    codigo = matchOtp6[1];
    tipo = 'otp_acceso';
  } else {
    // Si no coincide con palabras clave, buscar patrones aislados
    const matches4 = content.match(/\b\d{4}\b/g);
    const matches6 = content.match(/\b\d{6}\b/g);

    if (plataforma === 'Netflix' && matches4 && matches4.length > 0) {
      codigo = matches4[0];
      tipo = 'netflix_hogar';
    } else if (matches6 && matches6.length > 0) {
      codigo = matches6[0];
      tipo = 'otp_acceso';
    } else if (matches4 && matches4.length > 0) {
      codigo = matches4[0];
      tipo = 'netflix_hogar';
    }
  }

  if (!codigo && enlace) {
    tipo = 'enlace_hogar';
  }

  // Intentar detectar la cuenta destinataria original
  let cuentaDestino = '';
  if (toHeaders) {
    const emailMatches = toHeaders.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    if (emailMatches.length > 0) {
      cuentaDestino = emailMatches[0];
    }
  }

  return {
    codigo,
    enlace,
    tipo,
    plataforma,
    cuentaDestino
  };
}

/**
 * Iniciar conexión IMAP y monitoreo
 */
async function startImapMonitor(config) {
  if (imapClient) {
    try {
      await imapClient.logout();
    } catch {
      // Ignorar error al cerrar cliente anterior
    }
    imapClient = null;
  }

  const host = config.host || (config.user.includes('gmail') ? 'imap.gmail.com' : 'outlook.office365.com');
  const port = parseInt(config.port, 10) || 993;

  imapClient = new ImapFlow({
    host,
    port,
    secure: true,
    auth: {
      user: config.user.trim(),
      pass: config.pass.replace(/\s+/g, '') // Eliminar espacios de la contraseña de aplicación
    },
    logger: false
  });

  try {
    await imapClient.connect();
    monitorStatus = {
      connected: true,
      email: config.user,
      provider: host.includes('gmail') ? 'gmail' : 'outlook',
      lastCheck: new Date().toISOString(),
      error: null,
      codesFoundCount: extractedCodesHistory.length
    };
    isMonitoring = true;
    console.log(`[IMAP] Conectado exitosamente a ${config.user} en ${host}:${port}`);

    // Realizar un escaneo inicial inmediato de los correos recientes
    await scanRecentMessages();

    // Iniciar ciclo de revisión periódica cada 15 segundos
    startPeriodicPolling();

    return { success: true, message: 'Conectado exitosamente al buzón central' };
  } catch (err) {
    console.error('[IMAP] Error de conexión:', err.message);
    monitorStatus = {
      connected: false,
      email: config.user,
      provider: host.includes('gmail') ? 'gmail' : 'outlook',
      lastCheck: new Date().toISOString(),
      error: err.message,
      codesFoundCount: extractedCodesHistory.length
    };
    isMonitoring = false;
    throw err;
  }
}

/**
 * Escanear mensajes recientes (últimos 30 minutos)
 */
async function scanRecentMessages() {
  if (!imapClient || !isMonitoring) return [];

  const foundCodes = [];
  let lock = null;

  try {
    lock = await imapClient.getMailboxLock('INBOX');
    monitorStatus.lastCheck = new Date().toISOString();

    // Buscar mensajes de las últimas 2 horas
    const sinceDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const messages = imapClient.fetch(
      { since: sinceDate },
      { source: true, envelope: true, uid: true }
    );

    for await (const message of messages) {
      try {
        const parsed = await simpleParser(message.source);
        const subject = parsed.subject || '';
        const from = parsed.from ? parsed.from.text : '';
        const to = parsed.to ? parsed.to.text : '';

        // Filtrar si parece de streaming o confirmación
        const lowerFrom = from.toLowerCase();
        const lowerSub = subject.toLowerCase();

        const isStreaming = 
          lowerFrom.includes('netflix') || 
          lowerFrom.includes('disney') || 
          lowerFrom.includes('hbo') || 
          lowerFrom.includes('max') || 
          lowerFrom.includes('amazon') || 
          lowerSub.includes('código') || 
          lowerSub.includes('codigo') || 
          lowerSub.includes('hogar') || 
          lowerSub.includes('acceso') ||
          lowerSub.includes('verification');

        if (isStreaming) {
          const extracted = extractCodesFromEmail(parsed.text, parsed.html, subject, to);

          if (extracted.codigo || extracted.enlace) {
            const codeItem = {
              id: 'code-' + message.uid + '-' + Date.now().toString(36),
              uid: message.uid,
              fecha: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
              codigo: extracted.codigo,
              enlace: extracted.enlace,
              tipo: extracted.tipo,
              plataforma: extracted.plataforma,
              remitente: from,
              asunto: subject,
              cuentaDestino: extracted.cuentaDestino || to,
              origen: 'automatico_imap'
            };

            // Evitar duplicar códigos idénticos recibidos en los últimos 15 min
            const yaExiste = extractedCodesHistory.some(
              c => c.codigo === codeItem.codigo && Math.abs(new Date(c.fecha) - new Date(codeItem.fecha)) < 15 * 60 * 1000
            );

            if (!yaExiste) {
              extractedCodesHistory = [codeItem, ...extractedCodesHistory].slice(0, 50);
              foundCodes.push(codeItem);
              monitorStatus.codesFoundCount = extractedCodesHistory.length;
              console.log(`[IMAP] ⚡ ¡NUEVO CÓDIGO DETECTADO! [${extracted.plataforma}] Código: ${extracted.codigo}`);
            }
          }
        }
      } catch (parseErr) {
        // Ignorar error al parsear un correo específico
      }
    }
  } catch (err) {
    console.error('[IMAP] Error escaneando mensajes:', err.message);
    monitorStatus.error = err.message;
  } finally {
    if (lock) {
      lock.release();
    }
  }

  return foundCodes;
}

let pollingInterval = null;

function startPeriodicPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    if (isMonitoring && imapClient) {
      try {
        await scanRecentMessages();
      } catch (err) {
        console.error('[IMAP Polling] Error:', err.message);
      }
    }
  }, 15000); // Cada 15 segundos
}

// ====================================================================
// RUTAS DE LA API REST
// ====================================================================

// 1. Estado del servicio
app.get('/api/imap/status', (req, res) => {
  res.json({
    status: monitorStatus,
    codesCount: extractedCodesHistory.length,
    latestCodes: extractedCodesHistory.slice(0, 10)
  });
});

// 2. Probar y Guardar Configuración
app.post('/api/imap/config', async (req, res) => {
  const { user, pass, host, port } = req.body;

  if (!user || !pass) {
    return res.status(400).json({ error: 'Debes proporcionar correo y contraseña de aplicación' });
  }

  const cleanConfig = {
    user: user.trim(),
    pass: pass.trim(),
    host: host || (user.includes('gmail') ? 'imap.gmail.com' : 'outlook.office365.com'),
    port: parseInt(port, 10) || 993
  };

  try {
    await startImapMonitor(cleanConfig);
    saveConfig(cleanConfig);
    res.json({
      success: true,
      message: `¡Conexión exitosa con ${cleanConfig.user}! El sistema está escuchando correos en tiempo real.`
    });
  } catch (err) {
    res.status(401).json({
      error: `Error de conexión: ${err.message}. Verifica que tengas activa la Verificación en 2 Pasos y hayas generado una Contraseña de Aplicación de 16 caracteres.`
    });
  }
});

// 3. Forzar sincronización inmediata
app.post('/api/imap/sync-now', async (req, res) => {
  try {
    const newCodes = await scanRecentMessages();
    res.json({
      success: true,
      message: `Escaneo completado. ${newCodes.length} nuevos códigos detectados.`,
      newCodes,
      allCodes: extractedCodesHistory
    });
  } catch (err) {
    res.status(500).json({ error: 'Error durante la sincronización: ' + err.message });
  }
});

// 4. Obtener todos los códigos extraídos automáticamente
app.get('/api/imap/codes', (req, res) => {
  res.json({
    codes: extractedCodesHistory
  });
});

// 5. Desconectar buzón
app.post('/api/imap/disconnect', async (req, res) => {
  try {
    if (pollingInterval) clearInterval(pollingInterval);
    if (imapClient) {
      await imapClient.logout();
      imapClient = null;
    }
    isMonitoring = false;
    monitorStatus.connected = false;
    res.json({ success: true, message: 'Buzón desconectado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Arrancar servidor
app.listen(PORT, async () => {
  console.log(`[StreamFlow IMAP Service] Servidor escuchando en http://localhost:${PORT}`);

  // Intentar conectar automáticamente si ya había configuración guardada
  const saved = loadSavedConfig();
  if (saved && saved.user && saved.pass) {
    console.log(`[StreamFlow IMAP] Conectando automáticamente con configuración guardada (${saved.user})...`);
    try {
      await startImapMonitor(saved);
    } catch (err) {
      console.warn(`[StreamFlow IMAP] No se pudo autoconectar al arrancar:`, err.message);
    }
  }
});
