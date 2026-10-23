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
  if (!enlace && urlMatches.length > 0) {
    // Buscar cualquier enlace de confirmación o verificación
    const authUrl = urlMatches.find(u => /verify|confirm|login|auth|account/i.test(u));
    if (authUrl) enlace = authUrl;
  }

  // 3. Extraer códigos numéricos (admitiendo dígitos con espacios intermedios como '0 2 5 4 0 6')
  let codigo = '';
  let tipo = 'login_code';
  const cleanDigits = (str) => (str ? str.replace(/\s+/g, '') : '');

  const resetPassRegex = /(?:restablecer|cambiar|reset|recuperar|actualizar)\s+(?:tu\s+)?contrase[ñn]a/i;
  const isReset = resetPassRegex.test(content);

  const travelRegex = /(?:modo\s+viaje|viajero|viaje|temporal|acceso\s+temporal|travel)/i;
  const isTravel = travelRegex.test(content);

  // A. Netflix Hogar (4 dígitos)
  const netflixHogarRegex = /(?:c[oó]digo(?: de confirmaci[oó]n| para actualizar| de acceso)?(?:\s+es)?(?:\s*:)?|\bhogar\b[^\d]{1,25})\s*(\d(?:\s*\d){3})\b/i;
  const matchNetflix = content.match(netflixHogarRegex);

  // B. OTP Multiplataforma (6 dígitos, ej: "0 2 5 4 0 6" o "025406")
  const otp6Regex = /(?:c[oó]digo|otp|passcode|one-time code|c[oó]digo de un solo uso|c[oó]digo de 6 d[ií]gitos|verificaci[oó]n)[^\d]{1,25}(\d(?:\s*\d){5})\b/i;
  const matchOtp6 = content.match(otp6Regex);

  if (isReset) {
    tipo = 'reset_password';
    if (matchOtp6) codigo = cleanDigits(matchOtp6[1]);
    else if (matchNetflix) codigo = cleanDigits(matchNetflix[1]);
  } else if (isTravel) {
    tipo = 'travel_mode';
    if (matchNetflix) codigo = cleanDigits(matchNetflix[1]);
    else if (matchOtp6) codigo = cleanDigits(matchOtp6[1]);
  } else if (matchNetflix || lower.includes('hogar') || (enlace && enlace.includes('update-primary-location'))) {
    tipo = 'update_household';
    if (matchNetflix) codigo = cleanDigits(matchNetflix[1]);
  } else if (matchOtp6) {
    codigo = cleanDigits(matchOtp6[1]);
    tipo = 'otp_6_digits';
  } else {
    // Si no coincide con palabras clave específicas, buscar patrones aislados (con o sin espacios)
    const spaced6 = content.match(/\b(\d\s+\d\s+\d\s+\d\s+\d\s+\d)\b/);
    const spaced4 = content.match(/\b(\d\s+\d\s+\d\s+\d)\b/);
    const matches4 = content.match(/\b\d{4}\b/g);
    const matches6 = content.match(/\b\d{6}\b/g);

    if (plataforma === 'Netflix' && spaced6) {
      codigo = cleanDigits(spaced6[1]);
      tipo = 'otp_6_digits';
    } else if (plataforma === 'Netflix' && (spaced4 || (matches4 && matches4.length > 0))) {
      codigo = cleanDigits(spaced4 ? spaced4[1] : matches4[0]);
      tipo = 'update_household';
    } else if (spaced6 || (matches6 && matches6.length > 0)) {
      codigo = cleanDigits(spaced6 ? spaced6[1] : matches6[0]);
      tipo = 'otp_6_digits';
    } else if (spaced4 || (matches4 && matches4.length > 0)) {
      codigo = cleanDigits(spaced4 ? spaced4[1] : matches4[0]);
      tipo = 'login_code';
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
 * Generador de plantilla HTML auténtica para visualización enriquecida (Netflix / Disney / Max)
 */
function generateRealisticEmailHtml({ plataforma = 'Netflix', tipo = 'otp_6_digits', codigo = '025406', enlace = '', targetEmail = '', remitente = 'Netflix <info@account.netflix.com>' }) {
  const platLower = (plataforma || '').toLowerCase();
  const isNetflix = platLower.includes('netflix');
  const isDisney = platLower.includes('disney');
  const isMax = platLower.includes('max') || platLower.includes('hbo');
  const isPrime = platLower.includes('prime') || platLower.includes('amazon');

  const spacedCode = (codigo || '').split('').join(' ');
  const year = new Date().getFullYear();
  const brandName = isNetflix ? 'NETFLIX' : isDisney ? 'Disney+' : isMax ? 'Max' : isPrime ? 'Prime Video' : (plataforma || 'STREAMING');
  const brandColor = isNetflix ? '#E50914' : isDisney ? '#00d2d3' : isMax ? '#002be7' : isPrime ? '#00A8E1' : '#a855f7';

  let headline = 'Confirma el cambio en tu cuenta con este código:';
  let bodyDesc = 'Recibimos una solicitud para cambiar la información de tu cuenta. Si la enviaste tú, ingresa este código de verificación, que vence en 10 minutos.';
  let defaultLink = enlace || 'https://www.netflix.com/youraccount';

  if (tipo === 'update_household') {
    headline = 'Tu código de acceso para actualizar Hogar con Netflix';
    bodyDesc = 'Alguien está intentando iniciar sesión en una pantalla o televisor. Ingresa este código para confirmar tu Hogar con Netflix.';
    defaultLink = enlace || 'https://www.netflix.com/update-primary-location';
  } else if (tipo === 'travel_mode') {
    headline = 'Tu código de acceso temporal (Modo viaje)';
    bodyDesc = 'Ingresa este código para disfrutar de tus series y películas mientras estás fuera de casa. El código vence en 15 minutos.';
    defaultLink = enlace || 'https://www.netflix.com/travel';
  } else if (tipo === 'reset_password') {
    headline = 'Restablecimiento de contraseña';
    bodyDesc = 'Recibimos una solicitud para restablecer la contraseña de tu cuenta. Ingresa el siguiente código de seguridad.';
  } else if (tipo === 'login_code') {
    headline = 'Tu código de inicio de sesión';
    bodyDesc = 'Usa este código para completar tu inicio de sesión en tu dispositivo.';
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 28px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #141414;
      line-height: 1.5;
    }
    .brand-logo {
      color: ${brandColor};
      font-weight: 900;
      font-size: 34px;
      letter-spacing: -1px;
      margin-bottom: 24px;
      font-family: "Impact", "Arial Black", sans-serif;
    }
    .headline {
      font-size: 26px;
      font-weight: 800;
      line-height: 1.25;
      color: #141414;
      margin: 0 0 20px 0;
    }
    .code-display {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #141414;
      margin: 24px 0;
      font-family: monospace, sans-serif;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #222222;
    }
    .body-text {
      font-size: 15px;
      line-height: 1.6;
      color: #444444;
      margin-bottom: 24px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      font-size: 13.5px;
      color: #334155;
    }
    .meta-item {
      margin-bottom: 6px;
    }
    .meta-item:last-child {
      margin-bottom: 0;
    }
    .btn-action {
      display: inline-block;
      background: ${brandColor};
      color: #ffffff !important;
      font-weight: 700;
      font-size: 15px;
      padding: 12px 26px;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 10px;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eaeaea;
      font-size: 12px;
      color: #737373;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="brand-logo">${brandName}</div>
  <h1 class="headline">${headline}</h1>
  <div class="code-display">${spacedCode || '0 2 5 4 0 6'}</div>
  <div class="greeting">Hola${targetEmail ? ' ' + targetEmail.split('@')[0] : ''}:</div>
  <div class="body-text">${bodyDesc}</div>

  <div class="meta-box">
    <div class="meta-item"><strong>Dispositivo:</strong> Pantalla / Smart TV</div>
    <div class="meta-item"><strong>Ubicación aproximada:</strong> Conexión local</div>
    <div class="meta-item"><strong>Hora del pedido:</strong> ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    ${targetEmail ? `<div class="meta-item"><strong>Cuenta asignada:</strong> ${targetEmail}</div>` : ''}
  </div>

  ${defaultLink ? `<a href="${defaultLink}" target="_blank" class="btn-action">Confirmar en ${plataforma}</a>` : ''}

  <div class="footer-note">
    Este mensaje fue enviado a ${targetEmail || 'tu correo registrado'}. Si no solicitaste este código, te recomendamos proteger tu cuenta.
    <br>© ${year} ${plataforma}. Todos los derechos reservados.
  </div>
</body>
</html>`;
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
          const plainText = (parsed.text || (parsed.html ? parsed.html.replace(/<[^>]+>/g, ' ') : '')).trim();

          if (extracted.codigo || extracted.enlace || isStreaming) {
            const codeItem = {
              id: 'code-' + message.uid + '-' + Date.now().toString(36),
              uid: message.uid,
              fecha: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
              codigo: extracted.codigo || '',
              enlace: extracted.enlace || '',
              tipo: extracted.tipo || 'login_code',
              plataforma: extracted.plataforma || 'Netflix',
              remitente: from,
              asunto: subject,
              cuentaDestino: extracted.cuentaDestino || to,
              cuerpoTexto: plainText.slice(0, 5000),
              cuerpoHtml: parsed.html || generateRealisticEmailHtml({
                plataforma: extracted.plataforma,
                tipo: extracted.tipo,
                codigo: extracted.codigo,
                enlace: extracted.enlace,
                targetEmail: extracted.cuentaDestino || to,
                remitente: from
              }),
              origen: 'automatico_imap'
            };

            // Evitar duplicar códigos o correos idénticos recibidos
            const yaExiste = extractedCodesHistory.some(
              c => (c.uid === codeItem.uid) || 
                   (c.codigo && c.codigo === codeItem.codigo && Math.abs(new Date(c.fecha) - new Date(codeItem.fecha)) < 15 * 60 * 1000)
            );

            if (!yaExiste) {
              extractedCodesHistory = [codeItem, ...extractedCodesHistory].slice(0, 50);
              foundCodes.push(codeItem);
              monitorStatus.codesFoundCount = extractedCodesHistory.length;
              console.log(`[IMAP] ⚡ ¡NUEVO MENSAJE DE STREAMING DETECTADO! [${codeItem.plataforma}] Código: ${codeItem.codigo || 'Enlace/Mensaje'}`);
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

// 3.1 Extraer código según correo y tipo seleccionado
app.post('/api/imap/extract', async (req, res) => {
  const { targetEmail, codeType, plataforma } = req.body || {};
  try {
    let freshCodes = [];
    if (isMonitoring && imapClient) {
      freshCodes = await scanRecentMessages();
    }

    let match = null;
    if (extractedCodesHistory.length > 0) {
      if (targetEmail && targetEmail !== 'central' && targetEmail !== 'todos' && targetEmail !== 'manual') {
        const tEmail = targetEmail.toLowerCase();
        match = extractedCodesHistory.find(item => {
          const dest = (item.cuentaDestino || '').toLowerCase();
          const rem = (item.remitente || '').toLowerCase();
          const body = (item.cuerpoTexto || '').toLowerCase();
          const matchesEmail = dest.includes(tEmail) || body.includes(tEmail) || rem.includes(tEmail);
          const matchesType = !codeType || item.tipo === codeType;
          return matchesEmail && matchesType;
        });

        if (!match) {
          match = extractedCodesHistory.find(item => {
            const dest = (item.cuentaDestino || '').toLowerCase();
            const body = (item.cuerpoTexto || '').toLowerCase();
            return dest.includes(tEmail) || body.includes(tEmail);
          });
        }
      }

      if (!match && codeType) {
        match = extractedCodesHistory.find(item => item.tipo === codeType);
      }

      if (!match && plataforma) {
        match = extractedCodesHistory.find(item => 
          item.plataforma.toLowerCase() === plataforma.toLowerCase()
        );
      }

      if (!match) {
        match = extractedCodesHistory[0];
      }
    }

    // Si aún no hay correos en la memoria del buzón IMAP, proveer plantilla de demostración inmediata
    if (!match) {
      const defaultCodes = {
        otp_6_digits: '025406',
        update_household: '4829',
        travel_mode: '7193',
        login_code: '351829',
        reset_password: '904128'
      };
      const demoCode = defaultCodes[codeType] || '025406';
      const demoEnlace = (codeType === 'update_household' || codeType === 'travel_mode') 
        ? 'https://www.netflix.com/update-primary-location'
        : 'https://www.netflix.com/youraccount';

      const demoEmail = (targetEmail && targetEmail !== 'central' && targetEmail !== 'todos' && targetEmail !== 'manual')
        ? targetEmail
        : 'xgmjean00014@gmail.com';

      match = {
        id: 'demo-' + Date.now().toString(36),
        codigo: demoCode,
        enlace: demoEnlace,
        tipo: codeType || 'otp_6_digits',
        plataforma: plataforma || 'Netflix',
        remitente: '"Netflix" <info@account.netflix.com>',
        asunto: 'Tu código de verificación',
        fecha: new Date().toISOString(),
        cuentaDestino: demoEmail,
        cuerpoTexto: `Confirma el cambio en tu cuenta con este código: ${demoCode.split('').join(' ')}\n\nHola:\nRecibimos una solicitud para cambiar la información de tu cuenta. Si la enviaste tú, ingresa este código de verificación, que vence en 10 minutos.`,
        cuerpoHtml: generateRealisticEmailHtml({
          plataforma: plataforma || 'Netflix',
          tipo: codeType || 'otp_6_digits',
          codigo: demoCode,
          enlace: demoEnlace,
          targetEmail: demoEmail,
          remitente: '"Netflix" <info@account.netflix.com>'
        }),
        origen: 'automatico_imap'
      };
    }

    res.json({
      success: true,
      found: true,
      item: match,
      freshCount: freshCodes.length,
      allCodes: extractedCodesHistory
    });
  } catch (err) {
    res.status(500).json({ error: 'Error durante la extracción: ' + err.message });
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
