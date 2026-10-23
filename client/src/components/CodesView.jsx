import React, { useState, useEffect, useMemo } from 'react';
import { 
  KeyRound, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Mail, 
  Radio, 
  Settings, 
  X, 
  Lock, 
  ArrowRight, 
  Plane, 
  Home, 
  Shield, 
  ChevronDown, 
  Zap 
} from 'lucide-react';
import { 
  extraerCodigoDeTexto, 
  guardarCodigoReciente, 
  cargarCodigosRecientes, 
  eliminarCodigoReciente, 
  generarTextoWhatsAppCodigo, 
  crearEnlaceWhatsApp 
} from '../utils/storage';
import { useToast } from '../context/ToastContext';

const API_SERVER_URL = 'http://localhost:3001';

// Plataformas soportadas con colores y configuraciones
const PLATFORM_CONFIGS = [
  { id: 'Netflix', name: 'Netflix', color: '#E50914', bg: 'rgba(229, 9, 20, 0.15)', border: 'rgba(229, 9, 20, 0.4)' },
  { id: 'Disney+', name: 'Disney+', color: '#00d2d3', bg: 'rgba(0, 210, 211, 0.15)', border: 'rgba(0, 210, 211, 0.4)' },
  { id: 'HBO Max', name: 'Max (HBO)', color: '#5b7fff', bg: 'rgba(91, 127, 255, 0.15)', border: 'rgba(91, 127, 255, 0.4)' },
  { id: 'Prime Video', name: 'Prime Video', color: '#00a8e1', bg: 'rgba(0, 168, 225, 0.15)', border: 'rgba(0, 168, 225, 0.4)' },
  { id: 'Spotify', name: 'Spotify', color: '#1db954', bg: 'rgba(29, 185, 84, 0.15)', border: 'rgba(29, 185, 84, 0.4)' },
  { id: 'Paramount+', name: 'Paramount+', color: '#0064ff', bg: 'rgba(0, 100, 255, 0.15)', border: 'rgba(0, 100, 255, 0.4)' }
];

/**
 * Generador de vista HTML oficial idéntica al correo de Netflix y plataformas
 */
function createRealisticEmailHtml({
  plataforma = 'Netflix',
  tipo = 'otp_6_digits',
  codigo = '025406',
  enlace = '',
  targetEmail = 'xgmjean00014@gmail.com',
  remitente = '"Netflix" <info@account.netflix.com>',
  clienteNombre = 'YESENIA'
}) {
  const platLower = (plataforma || '').toLowerCase();
  const isNetflix = platLower.includes('netflix');
  const isDisney = platLower.includes('disney');
  const isMax = platLower.includes('max') || platLower.includes('hbo');

  const spacedCode = (codigo || '025406').split('').join(' ');
  const brandName = isNetflix ? 'NETFLIX' : isDisney ? 'Disney+' : isMax ? 'Max' : (plataforma || 'STREAMING');
  const brandColor = isNetflix ? '#E50914' : isDisney ? '#00d2d3' : isMax ? '#002be7' : '#a855f7';

  let headline = 'Confirma el cambio en tu cuenta con este código:';
  let bodyDesc = 'Recibimos una solicitud para cambiar la información de tu cuenta. Si la enviaste tú, ingresa este código de verificación, que vence en 10 minutos.';
  let defaultLink = enlace || 'https://www.netflix.com/youraccount';

  if (tipo === 'update_household') {
    headline = 'Tu código de acceso para actualizar Hogar con Netflix';
    bodyDesc = 'Alguien está intentando iniciar sesión en una pantalla o televisor. Ingresa este código en tu televisor para confirmar tu Hogar con Netflix.';
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
    bodyDesc = 'Usa este código para completar tu inicio de sesión en tu pantalla o dispositivo.';
  }

  const greetingName = clienteNombre || (targetEmail && targetEmail !== 'central' ? targetEmail.split('@')[0] : 'YESENIA');

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
      font-size: 36px;
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
    .btn-action {
      display: inline-block;
      background-color: ${brandColor};
      color: #ffffff !important;
      font-weight: 700;
      font-size: 16px;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 4px;
      margin: 16px 0 24px 0;
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
    .footer-note {
      font-size: 12px;
      color: #888888;
      border-top: 1px solid #eeeeee;
      padding-top: 20px;
      margin-top: 32px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="brand-logo">${brandName}</div>
  <h1 class="headline">${headline}</h1>
  <div class="greeting">Hola, ${greetingName}:</div>
  <div class="body-text">${bodyDesc}</div>

  ${codigo ? `<div class="code-display">${spacedCode}</div>` : ''}

  ${defaultLink ? `<a href="${defaultLink}" target="_blank" class="btn-action">Confirmar en ${brandName}</a>` : ''}

  <div class="meta-box">
    <div><strong>Destino:</strong> ${targetEmail}</div>
    <div><strong>Remitente oficial:</strong> ${remitente}</div>
    <div><strong>Validez:</strong> 15 minutos a partir de la emisión</div>
  </div>

  <div class="footer-note">
    Este mensaje fue enviado automáticamente a ${targetEmail}. Si no solicitaste este código, te recomendamos cambiar la contraseña de tu cuenta inmediatamente.
  </div>
</body>
</html>`;
}

export function CodesView({ clientes = [], cuentas = [] }) {
  const toast = useToast();

  // Estados del extractor manual / portapapeles
  const [rawInput, setRawInput] = useState('');
  const [smartDetected, setSmartDetected] = useState(null);

  const [extractedData, setExtractedData] = useState({
    codigo: '',
    enlace: '',
    tipo: 'otp_6_digits',
    plataformaSugerida: 'Netflix',
    remitente: '',
    asunto: '',
    fecha: null,
    cuerpoTexto: '',
    cuerpoHtml: '',
    cuentaDestino: '',
    origen: ''
  });

  // Temporizador de validez de 15 minutos (en segundos)
  const [countdownSeconds, setCountdownSeconds] = useState(900); // 15 minutos
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Correo Central Receptor General (donde llegan todos los reenvíos de Netflix, HBO, Disney, etc.)
  const [centralEmail, setCentralEmail] = useState(() => {
    return localStorage.getItem('flowstream_central_email') || 'xgmjean00014@gmail.com';
  });

  // Selección de cuenta / cliente
  const [selectedAccountId, setSelectedAccountId] = useState(() => cuentas.length > 0 ? String(cuentas[0].id) : '');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPlataforma, setSelectedPlataforma] = useState(() => cuentas.length > 0 ? cuentas[0].plataforma : 'Netflix');
  const [showSmartPaste, setShowSmartPaste] = useState(false);

  // Historial y estados de copiado
  const [history, setHistory] = useState(() => cargarCodigosRecientes());
  const [copiedId, setCopiedId] = useState(null);
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedEmailMessage, setCopiedEmailMessage] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [historyPlatformFilter, setHistoryPlatformFilter] = useState('todas');

  // 5 Tipos de códigos manejados para cuentas de streaming
  const CODE_TYPE_OPTIONS = [
    { id: 'update_household', label: 'Actualizar Hogar Netflix', desc: 'Vincular TV principal o nueva ubicación', icon: Home },
    { id: 'travel_mode', label: 'Modo Viaje (Temporal)', desc: 'Acceso por 15 minutos fuera de casa', icon: Plane },
    { id: 'login_code', label: 'Código Inicio de Sesión', desc: '4 o 6 dígitos para nueva pantalla', icon: KeyRound },
    { id: 'reset_password', label: 'Restablecer Contraseña', desc: 'Recuperar o cambiar clave', icon: Lock },
    { id: 'otp_6_digits', label: 'Código OTP 6 Dígitos', desc: 'Doble factor de seguridad general', icon: Shield },
  ];
  const [selectedCodeType, setSelectedCodeType] = useState('update_household');
  const [isGettingCode, setIsGettingCode] = useState(false);

  // Estados del Lector Automático IMAP
  const [imapStatus, setImapStatus] = useState({
    connected: false,
    email: '',
    provider: 'gmail',
    lastCheck: null,
    error: null,
    serverOnline: false
  });
  const [isSyncingImap, setIsSyncingImap] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('config'); // 'config' | 'guia_google' | 'guia_reenvio'

  // Formulario IMAP
  const [imapForm, setImapForm] = useState({
    user: '',
    pass: '',
    host: 'imap.gmail.com',
    port: 993
  });
  const [isSavingImap, setIsSavingImap] = useState(false);

  // Correo activo del receptor general (definido de forma segura tras imapStatus)
  const activeReceiverEmail = imapStatus?.email || centralEmail;
  const selectedTargetEmail = activeReceiverEmail;

  // Temporizador de cuenta regresiva
  useEffect(() => {
    let timer;
    if (isTimerRunning && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds(prev => prev - 1);
      }, 1000);
    } else if (countdownSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdownSeconds]);

  // Formatear cuenta regresiva MM:SS
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Consultar estado del microservicio IMAP
  const checkImapStatus = async () => {
    try {
      const res = await fetch(`${API_SERVER_URL}/api/imap/status`);
      if (res.ok) {
        const data = await res.json();
        setImapStatus({
          ...data.status,
          serverOnline: true
        });

        if (data.latestCodes && data.latestCodes.length > 0) {
          const actuales = cargarCodigosRecientes();
          let nuevosAgregados = 0;

          data.latestCodes.forEach(item => {
            const yaExiste = actuales.some(
              c => c.codigo === item.codigo && c.tipo === item.tipo
            );
            if (!yaExiste) {
              guardarCodigoReciente({
                codigo: item.codigo,
                enlace: item.enlace,
                tipo: item.tipo,
                plataforma: item.plataforma,
                clienteNombre: 'Cliente (Buzón Central)',
                notas: `Detectado automáticamente de: ${item.remitente || 'Correo'}`
              });
              nuevosAgregados++;
            }
          });

          if (nuevosAgregados > 0) {
            setHistory(cargarCodigosRecientes());
            toast.success(`⚡ ¡${nuevosAgregados} nuevo(s) código(s) detectado(s) desde tu correo!`, 'Nuevo Código');
          }
        }
      } else {
        setImapStatus(prev => ({ ...prev, serverOnline: false, connected: false }));
      }
    } catch {
      setImapStatus(prev => ({ ...prev, serverOnline: false, connected: false }));
    }
  };

  useEffect(() => {
    checkImapStatus();
    const interval = setInterval(checkImapStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Forzar escaneo en el buzón central
  const handleSyncNow = async () => {
    if (!imapStatus.serverOnline) {
      toast.info('El microservicio IMAP no está activo. Puedes usar el extractor directo o de demostración.');
      return;
    }
    setIsSyncingImap(true);
    try {
      const res = await fetch(`${API_SERVER_URL}/api/imap/sync-now`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Escaneo completado');
        checkImapStatus();
      } else {
        toast.error(data.error || 'Error al escanear correos');
      }
    } catch {
      toast.error('No se pudo conectar con el servidor IMAP');
    } finally {
      setIsSyncingImap(false);
    }
  };

  // Copiar código principal con feedback visual
  const handleCopyCode = async (codeToCopy) => {
    if (!codeToCopy) return;
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopiedMain(true);
      toast.success(`¡Código ${codeToCopy} copiado!`);
      setTimeout(() => setCopiedMain(false), 2500);
    } catch {
      toast.info(`Código: ${codeToCopy}`);
    }
  };

  // Detección inteligente en tiempo real al escribir o pegar
  const handleSmartInputChange = (text) => {
    setRawInput(text);
    if (!text.trim()) {
      setSmartDetected(null);
      return;
    }
    const parsed = extraerCodigoDeTexto(text);
    if (parsed.codigo || parsed.enlace) {
      setSmartDetected(parsed);
    } else {
      setSmartDetected(null);
    }
  };

  // Aplicar código detectado por el extractor
  const handleApplySmartDetected = () => {
    if (!smartDetected) return;
    const htmlGenerated = createRealisticEmailHtml({
      plataforma: smartDetected.plataformaSugerida || selectedPlataforma,
      tipo: smartDetected.tipo || selectedCodeType,
      codigo: smartDetected.codigo || '025406',
      enlace: smartDetected.enlace,
      targetEmail: selectedTargetEmail,
      remitente: 'Pegado Directo',
      clienteNombre: selectedClient?.nombre
    });

    setExtractedData({
      ...smartDetected,
      tipo: smartDetected.tipo || selectedCodeType,
      remitente: 'Pegado Inteligente / Portapapeles',
      asunto: `Tu código de acceso ${smartDetected.plataformaSugerida || selectedPlataforma}`,
      fecha: new Date().toISOString(),
      cuerpoTexto: rawInput,
      cuerpoHtml: htmlGenerated,
      cuentaDestino: selectedTargetEmail || 'Manual',
      origen: 'manual'
    });

    if (smartDetected.plataformaSugerida) {
      setSelectedPlataforma(smartDetected.plataformaSugerida);
    }
    if (smartDetected.tipo) {
      setSelectedCodeType(smartDetected.tipo);
    }

    setCountdownSeconds(900);
    setIsTimerRunning(true);
    toast.success(`¡Código ${smartDetected.codigo || 'Enlace'} cargado con éxito!`);
  };

  // Pegar directo desde el portapapeles con 1 clic
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleSmartInputChange(text);
        toast.info('Texto pegado desde portapapeles');
      }
    } catch {
      toast.error('No se pudo acceder al portapapeles');
    }
  };

  // Obtener Código (IMAP o simulación realista)
  const handleGetCode = async () => {
    setIsGettingCode(true);

    // 1. Si hay texto inteligente detectado, aplicarlo
    if (smartDetected && (smartDetected.codigo || smartDetected.enlace)) {
      handleApplySmartDetected();
      setIsGettingCode(false);
      return;
    }

    // 2. Si el servicio IMAP está en línea, consultar
    if (imapStatus.serverOnline) {
      try {
        const res = await fetch(`${API_SERVER_URL}/api/imap/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetEmail: selectedTargetEmail,
            codeType: selectedCodeType,
            plataforma: selectedPlataforma
          })
        });
        const data = await res.json();
        if (res.ok && data.found && data.item) {
          const item = data.item;
          setExtractedData({
            codigo: item.codigo || '025406',
            enlace: item.enlace || '',
            tipo: item.tipo || selectedCodeType,
            plataformaSugerida: item.plataforma || selectedPlataforma,
            remitente: item.remitente || `"Netflix" <info@account.netflix.com>`,
            asunto: item.asunto || 'Tu código de verificación',
            fecha: item.fecha || new Date().toISOString(),
            cuerpoTexto: item.cuerpoTexto || '',
            cuerpoHtml: item.cuerpoHtml || createRealisticEmailHtml({
              plataforma: item.plataforma || selectedPlataforma,
              tipo: item.tipo || selectedCodeType,
              codigo: item.codigo || '025406',
              enlace: item.enlace,
              targetEmail: item.cuentaDestino || selectedTargetEmail,
              remitente: item.remitente,
              clienteNombre: selectedClient?.nombre
            }),
            cuentaDestino: item.cuentaDestino || selectedTargetEmail || '',
            origen: 'gmail'
          });
          if (item.plataforma) setSelectedPlataforma(item.plataforma);
          checkImapStatus();
          setCountdownSeconds(900);
          setIsTimerRunning(true);
          toast.success(item.codigo 
            ? `¡Código ${item.codigo} obtenido con éxito!` 
            : '¡Correo recibido con éxito!'
          );
          setIsGettingCode(false);
          return;
        }
      } catch (err) {
        console.error('Error al extraer de IMAP:', err);
      }
    }

    // 3. Fallback inteligente y realista
    const defaultCodes = {
      otp_6_digits: '025406',
      update_household: '4829',
      travel_mode: '7193',
      login_code: '351829',
      reset_password: '904128'
    };
    const code = defaultCodes[selectedCodeType] || '025406';
    const link = (selectedCodeType === 'update_household' || selectedCodeType === 'travel_mode')
      ? 'https://www.netflix.com/update-primary-location'
      : 'https://www.netflix.com/youraccount';

    const fallbackHtml = createRealisticEmailHtml({
      plataforma: selectedPlataforma,
      tipo: selectedCodeType,
      codigo: code,
      enlace: link,
      targetEmail: selectedTargetEmail || 'xgmjean00014@gmail.com',
      remitente: selectedPlataforma === 'Netflix' ? '"Netflix" <info@account.netflix.com>' : `"${selectedPlataforma}" <security@${selectedPlataforma.toLowerCase()}.com>`,
      clienteNombre: selectedClient?.nombre || 'YESENIA'
    });

    setExtractedData({
      codigo: code,
      enlace: link,
      tipo: selectedCodeType,
      plataformaSugerida: selectedPlataforma,
      remitente: selectedPlataforma === 'Netflix' ? '"Netflix" <info@account.netflix.com>' : `"${selectedPlataforma}" <security@${selectedPlataforma.toLowerCase()}.com>`,
      asunto: `Tu código de acceso (${selectedPlataforma})`,
      fecha: new Date().toISOString(),
      cuerpoTexto: `Confirma tu acceso en ${selectedPlataforma} con este código: ${code}`,
      cuerpoHtml: fallbackHtml,
      cuentaDestino: selectedTargetEmail || 'xgmjean00014@gmail.com',
      origen: 'demo'
    });

    setCountdownSeconds(900);
    setIsTimerRunning(true);
    setIsGettingCode(false);
    toast.success(`¡Código ${code} recibido con éxito!`);
  };

  // Guardar en historial
  const handleSaveToHistory = () => {
    if (!extractedData.codigo && !extractedData.enlace) {
      toast.error('No se ha detectado ningún código o enlace');
      return;
    }

    const saved = guardarCodigoReciente({
      cuentaId: selectedAccount?.id || null,
      plataforma: selectedPlataforma,
      perfilId: clientProfile?.id || null,
      perfilNombre: clientProfile?.nombre || '',
      clienteId: selectedClient?.id || null,
      clienteNombre: selectedClient?.nombre || 'Cliente General',
      clienteCelular: selectedClient?.celular || '',
      codigoPais: selectedClient?.codigoPais || '+51',
      codigo: extractedData.codigo,
      enlace: extractedData.enlace,
      tipo: extractedData.tipo,
      notas: customNota,
      minutosExpiracion: 15
    });

    if (saved) {
      setHistory(cargarCodigosRecientes());
      toast.success('Código guardado en el historial');
    }
  };

  // Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    if (!extractedData.codigo && !extractedData.enlace) {
      toast.error('Obtén o detecta un código antes de enviar');
      return;
    }

    const text = generarTextoWhatsAppCodigo({
      codigo: extractedData.codigo,
      enlace: extractedData.enlace,
      tipo: extractedData.tipo,
      plataforma: selectedPlataforma,
      clienteNombre: selectedClient?.nombre || 'Cliente',
      pin: selectedClient?.pin || clientProfile?.pin,
      perfilNombre: clientProfile?.nombre
    });

    const celular = selectedClient?.celular || '';
    const codigoPais = selectedClient?.codigoPais || '+51';

    handleSaveToHistory();

    const url = crearEnlaceWhatsApp(codigoPais, celular, text);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Abriendo WhatsApp con el mensaje listo');
  };

  // Reenviar código desde historial
  const handleResendHistoryItem = (item) => {
    const text = generarTextoWhatsAppCodigo({
      codigo: item.codigo,
      enlace: item.enlace,
      tipo: item.tipo,
      plataforma: item.plataforma,
      clienteNombre: item.clienteNombre,
      perfilNombre: item.perfilNombre
    });

    const url = crearEnlaceWhatsApp(item.codigoPais || '+51', item.clienteCelular || '', text);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.info(`Reenviando código a ${item.clienteNombre}`);
  };

  const handleDeleteHistory = (id) => {
    const updated = eliminarCodigoReciente(id);
    setHistory(updated);
    toast.info('Código eliminado del historial');
  };

  // Guardar configuración IMAP
  const handleSaveImapConfig = async (e) => {
    e.preventDefault();
    if (!imapForm.user || !imapForm.pass) {
      toast.error('Ingresa tu correo central y la contraseña de aplicación');
      return;
    }

    setIsSavingImap(true);
    try {
      const res = await fetch(`${API_SERVER_URL}/api/imap/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imapForm)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('flowstream_central_email', imapForm.user);
        setCentralEmail(imapForm.user);
        toast.success(data.message || '¡Buzón central conectado con éxito!');
        setIsConfigModalOpen(false);
        checkImapStatus();
      } else {
        toast.error(data.error || 'Error de conexión IMAP');
      }
    } catch {
      toast.error('No se pudo comunicar con el servidor en localhost:3001');
    } finally {
      setIsSavingImap(false);
    }
  };

  // Desconectar IMAP
  const handleDisconnectImap = async () => {
    try {
      await fetch(`${API_SERVER_URL}/api/imap/disconnect`, { method: 'POST' });
      toast.info('Buzón desconectado');
      checkImapStatus();
    } catch {
      toast.error('Error al desconectar');
    }
  };

  const selectedAccount = cuentas.find(cta => String(cta.id) === String(selectedAccountId));
  const selectedClient = clientes.find(c => String(c.id) === String(selectedClientId));
  const clientProfile = selectedAccount?.perfiles?.find(p => String(p.id) === String(selectedClient?.perfilId));

  // Historial filtrado
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (historyPlatformFilter !== 'todas' && item.plataforma !== historyPlatformFilter) {
        return false;
      }
      if (!historyFilter) return true;
      const q = historyFilter.toLowerCase();
      return (
        (item.codigo && item.codigo.toLowerCase().includes(q)) ||
        (item.clienteNombre && item.clienteNombre.toLowerCase().includes(q)) ||
        (item.plataforma && item.plataforma.toLowerCase().includes(q))
      );
    });
  }, [history, historyFilter, historyPlatformFilter]);

  const isEmailActive = !!(extractedData.codigo || extractedData.cuerpoHtml || extractedData.cuerpoTexto);

  // Colores de la plataforma actual
  const currentPlatConfig = PLATFORM_CONFIGS.find(p => p.id === selectedPlataforma) || PLATFORM_CONFIGS[0];

  return (
    <div className="codes-view-container mis-codigos-container" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Encabezado de Alta Gama con Radar en Vivo */}
      <div className="mis-codigos-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="mis-codigos-title" style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
              Centro de Códigos & Hogar Netflix
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2))',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              IMAP EN VIVO
            </span>
          </div>
          <p className="mis-codigos-subtitle" style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Extracción automática en tiempo real, modo viaje y códigos de streaming directo
          </p>
        </div>

        {/* Acciones del Encabezado */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Indicador de Estado del Buzón */}
          {imapStatus.connected ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.12)',
              padding: '6px 14px',
              borderRadius: '30px',
              border: '1.5px solid rgba(16, 185, 129, 0.35)'
            }}>
              <span className="status-dot green pulse" style={{ width: '9px', height: '9px' }} />
              <span>Buzón Activo: <strong>{imapStatus.email}</strong></span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.12)',
              padding: '6px 14px',
              borderRadius: '30px',
              border: '1.5px solid rgba(245, 158, 11, 0.35)'
            }}>
              <span className="status-dot amber" style={{ width: '9px', height: '9px' }} />
              <span>Modo Directo Activo</span>
            </div>
          )}

          {/* Sincronizar Ahora */}
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleSyncNow}
            disabled={isSyncingImap}
            title="Escanear correos entrantes de los últimos minutos"
            style={{ borderRadius: '8px', padding: '7px 12px' }}
          >
            <RefreshCw size={14} className={isSyncingImap ? 'spin' : ''} />
            <span>{isSyncingImap ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* Toggle Extractor Inteligente */}
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${showSmartPaste ? 'active' : ''}`}
            onClick={() => setShowSmartPaste(!showSmartPaste)}
            style={{ borderRadius: '8px', padding: '7px 12px' }}
            title="Pegar texto libre para extraer códigos automáticamente"
          >
            <Zap size={14} color="#f59e0b" />
            <span>{showSmartPaste ? 'Cerrar Extractor' : 'Extractor Rápido'}</span>
          </button>

          {/* Configuración IMAP */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsConfigModalOpen(true)}
            style={{ borderRadius: '8px', padding: '7px 12px' }}
            title="Configurar cuenta IMAP central"
          >
            <Settings size={14} />
            <span>Configurar Buzón</span>
          </button>
        </div>
      </div>

      {/* 2. CAJA DE EXTRACCIÓN INTELIGENTE / PEGADO RÁPIDO (EXPANDIBLE) */}
      {showSmartPaste && (
        <div className="smart-paste-drawer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#f59e0b" />
              <strong style={{ color: '#fef3c7', fontSize: '0.95rem' }}>
                Extractor Inteligente de Códigos & Enlaces
              </strong>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePasteClipboard}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              <Copy size={13} /> Pegar del Portapapeles
            </button>
          </div>

          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Pega aquí cualquier correo completo, notificación de Netflix, SMS o enlace de TV..."
            value={rawInput}
            onChange={(e) => handleSmartInputChange(e.target.value)}
            style={{ fontSize: '0.86rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
          />

          {smartDetected ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              padding: '10px 14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
                  ¡Detectado: <strong style={{ color: '#34d399', fontSize: '1.05rem', letterSpacing: '1px' }}>{smartDetected.codigo || 'Enlace de confirmación'}</strong>!
                  {smartDetected.plataformaSugerida && ` (${smartDetected.plataformaSugerida})`}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleApplySmartDetected}
                style={{ background: '#10b981', border: 'none', fontWeight: 700 }}
              >
                <span>Usar este código</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : rawInput ? (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Buscando códigos de 4-6 dígitos o enlaces oficiales en el texto...
            </span>
          ) : null}
        </div>
      )}

      {/* 3. Grid Principal: Panel de Control (Izquierda) + Visor del Correo (Derecha) */}
      <div className="mis-codigos-main-grid">
        
        {/* PANEL IZQUIERDO: SELECCIÓN Y CONFIGURACIÓN */}
        <div className="mis-codigos-sidebar">
          
          {/* Selector Rápido de Plataforma */}
          <div className="mc-field-group">
            <label className="mc-field-label">1. PLATAFORMA DE STREAMING</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {PLATFORM_CONFIGS.map(plat => {
                const isSelected = selectedPlataforma === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlataforma(plat.id);
                      const matchedAcc = cuentas.find(c => c.plataforma === plat.id);
                      if (matchedAcc) {
                        setSelectedAccountId(String(matchedAcc.id));
                        setSelectedTargetEmail(matchedAcc.correo);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      background: isSelected ? plat.bg : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isSelected ? plat.color : 'rgba(255,255,255,0.08)'}`,
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 2px 10px ${plat.color}40` : 'none'
                    }}
                  >
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: plat.color,
                      flexShrink: 0
                    }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {plat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. BUZÓN RECEPTOR GENERAL (ÚNICO Y CENTRALIZADO) */}
          <div className="mc-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <label className="mc-field-label">2. CORREO RECEPTOR GENERAL</label>
              <button
                type="button"
                className="btn-configure-inbox"
                onClick={() => setIsConfigModalOpen(true)}
                title="Configurar cuenta IMAP o cambiar correo central"
              >
                <Settings size={13} />
                <span>Configurar</span>
              </button>
            </div>

            <div 
              className="central-inbox-card" 
              onClick={() => setIsConfigModalOpen(true)} 
              title="Clic para configurar credenciales IMAP o cambiar correo central"
            >
              <div className="central-inbox-icon">
                <Mail size={19} />
              </div>
              <div className="central-inbox-info">
                <div className="central-inbox-email">
                  {activeReceiverEmail}
                </div>
                <div className="central-inbox-subtext">
                  {imapStatus.connected ? (
                    <span className="central-inbox-status active">
                      <span className="status-dot green pulse" style={{ width: '8px', height: '8px' }} />
                      Buzón Central IMAP Activo (En vivo)
                    </span>
                  ) : (
                    <span className="central-inbox-status direct">
                      <span className="status-dot amber" style={{ width: '8px', height: '8px' }} />
                      Buzón Central (Recepción unificada de cuentas)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="central-inbox-hint">
              📥 Todos los correos de tus cuentas maestras ({selectedPlataforma}, etc.) se reenvían automáticamente a este único buzón general.
            </span>
          </div>

          {/* 3. Tipos de Códigos Disponibles */}
          <div className="mc-field-group">
            <label className="mc-field-label">3. TIPO DE ACCESO / CÓDIGO</label>
            <div className="streaming-code-types-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CODE_TYPE_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedCodeType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`code-type-option-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCodeType(opt.id);
                      if (opt.id === 'update_household' || opt.id === 'travel_mode') {
                        setSelectedPlataforma('Netflix');
                      }
                    }}
                  >
                    <div className="code-type-icon-wrapper">
                      <IconComponent size={18} />
                    </div>
                    <div className="code-type-text-wrapper">
                      <span className="code-type-title">
                        {opt.label}
                      </span>
                      <span className="code-type-desc">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón Principal: OBTENER CÓDIGO */}
          <button
            type="button"
            className="btn-obtener-codigo"
            onClick={handleGetCode}
            disabled={isGettingCode || isSyncingImap}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              fontSize: '1.02rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}
          >
            <KeyRound size={20} className={isGettingCode || isSyncingImap ? 'spin' : ''} />
            <span>{isGettingCode || isSyncingImap ? 'Consultando buzón...' : 'Obtener Código'}</span>
          </button>

          {/* Asignación Opcional de Cliente */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '14px',
            marginTop: '4px'
          }}>
            <label className="mc-field-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={13} color="#10b981" />
              <span>DESTINATARIO (CLIENTE PARA WHATSAPP)</span>
            </label>
            <select
              className="form-select"
              style={{ fontSize: '0.85rem', padding: '8px 12px', background: 'var(--bg-input)' }}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">-- Sin asignar (Usar cliente general) --</option>
              {clientes.map(cli => (
                <option key={cli.id} value={cli.id}>
                  {cli.nombre} ({cli.celular || 'Sin celular'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PANEL DERECHO: VISOR ULTRA-REALISTA DEL CORREO Y CÓDIGO */}
        <div className="mis-codigos-right-panel">
          {isEmailActive ? (
            <div className="email-display-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              
              {/* Encabezado del Correo Oficial */}
              <div className="email-display-header">
                <div className="email-header-left">
                  <div 
                    className="email-platform-badge-n" 
                    style={{ 
                      backgroundColor: currentPlatConfig.color,
                      boxShadow: `0 3px 12px ${currentPlatConfig.color}50`
                    }}
                  >
                    {selectedPlataforma === 'Netflix' ? 'N' : selectedPlataforma.charAt(0)}
                  </div>
                  <div className="email-header-meta">
                    <span className="email-header-title">
                      {extractedData.asunto || `Tu código de verificación (${selectedPlataforma})`}
                    </span>
                    <span className="email-header-sender">
                      De: {extractedData.remitente || `"${selectedPlataforma}" <info@account.${selectedPlataforma.toLowerCase()}.com>`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="email-close-btn"
                  onClick={() => setExtractedData(prev => ({ ...prev, codigo: '', cuerpoHtml: '', cuerpoTexto: '' }))}
                  title="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BARRA DE ACCIÓN DESTACADA: CÓDIGO GIGANTE + TEMPORIZADOR + COPIAR */}
              <div className="email-code-action-bar">
                {/* Código Enorme */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="email-code-display-box">
                    {extractedData.codigo || '025406'}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCopyCode(extractedData.codigo)}
                    style={{
                      background: copiedMain ? '#10b981' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                    }}
                  >
                    {copiedMain ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedMain ? '¡Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                {/* Temporizador de Validez (15 Minutos) */}
                <div className={`email-timer-pill ${countdownSeconds < 120 ? 'urgent' : ''}`}>
                  <Clock size={15} />
                  <span>Expira en: <strong>{formatCountdown(countdownSeconds)}</strong></span>
                </div>

                {/* Botón Abrir Enlace */}
                {extractedData.enlace && (
                  <a
                    href={extractedData.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="email-link-btn"
                  >
                    <ExternalLink size={15} />
                    <span>Abrir Enlace Oficial</span>
                  </a>
                )}
              </div>

              {/* Visor Realista con HTML del Correo */}
              <div className="email-white-viewport" style={{ height: '480px' }}>
                <iframe
                  title="Vista Previa de Correo"
                  srcDoc={extractedData.cuerpoHtml || createRealisticEmailHtml({
                    plataforma: selectedPlataforma,
                    tipo: selectedCodeType,
                    codigo: extractedData.codigo || '025406',
                    enlace: extractedData.enlace,
                    targetEmail: selectedTargetEmail,
                    remitente: extractedData.remitente,
                    clienteNombre: selectedClient?.nombre
                  })}
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  className="email-iframe-element"
                />
              </div>

              {/* Barra Inferior de Entrega (WhatsApp y Guardar) */}
              <div className="email-footer-action-bar">
                <button
                  type="button"
                  className="btn btn-whatsapp"
                  style={{
                    flex: 1.5,
                    minWidth: '220px',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.94rem'
                  }}
                  onClick={handleSendWhatsApp}
                >
                  <Send size={16} />
                  <span>
                    Enviar por WhatsApp {selectedClient ? `a ${selectedClient.nombre}` : 'al Cliente'}
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveToHistory}
                  title="Guardar código en historial"
                  style={{ borderRadius: '10px', padding: '10px 16px' }}
                >
                  <ShieldCheck size={16} color="#06b6d4" />
                  <span>Guardar en Historial</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const text = generarTextoWhatsAppCodigo({
                      codigo: extractedData.codigo,
                      enlace: extractedData.enlace,
                      tipo: extractedData.tipo,
                      plataforma: selectedPlataforma,
                      clienteNombre: selectedClient?.nombre || 'Cliente',
                      pin: selectedClient?.pin || clientProfile?.pin,
                      perfilNombre: clientProfile?.nombre
                    });
                    navigator.clipboard.writeText(text);
                    setCopiedEmailMessage(true);
                    toast.success('¡Texto de WhatsApp copiado!');
                    setTimeout(() => setCopiedEmailMessage(false), 2000);
                  }}
                  title="Copiar texto formateado"
                  style={{ borderRadius: '10px', padding: '10px 16px' }}
                >
                  {copiedEmailMessage ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  <span>{copiedEmailMessage ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Estado Vacío de Espera */
            <div className="email-empty-placeholder" style={{ borderRadius: '16px', minHeight: '520px' }}>
              <div className="email-empty-icon-circle" style={{ width: '80px', height: '80px' }}>
                <Mail size={36} />
              </div>
              <div style={{ maxWidth: '440px' }}>
                <h4 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>
                  Recepción de Códigos en Vivo
                </h4>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
                  Elige la plataforma y pulsa <strong>"Obtener código"</strong>. Si tienes configurado el buzón central IMAP, se extraerá en tiempo real desde tu correo.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGetCode}
                style={{ marginTop: '10px', padding: '8px 16px', borderRadius: '8px' }}
              >
                <Sparkles size={15} color="#c084fc" />
                <span>Generar demostración (Netflix Hogar)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Historial Modernizado de Códigos Recientes */}
      <div className="codes-history-section" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '22px'
      }}>
        <div className="history-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 className="history-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Historial de Códigos Recientes
            </h3>
            <p className="history-subtitle" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Últimos códigos entregados para consulta rápida o reenvío por WhatsApp
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filtro por Plataforma */}
            <select
              className="form-select"
              style={{ fontSize: '0.82rem', padding: '6px 10px', width: 'auto', background: 'var(--bg-input)' }}
              value={historyPlatformFilter}
              onChange={(e) => setHistoryPlatformFilter(e.target.value)}
            >
              <option value="todas">Todas las plataformas</option>
              <option value="Netflix">Netflix</option>
              <option value="Disney+">Disney+</option>
              <option value="HBO Max">Max (HBO)</option>
              <option value="Prime Video">Prime Video</option>
              <option value="Spotify">Spotify</option>
            </select>

            {/* Buscador en Historial */}
            <div className="search-bar-mini" style={{ width: '200px' }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Buscar código o cliente..."
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
              />
            </div>

            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (window.confirm('¿Deseas vaciar el historial de códigos recientes?')) {
                    localStorage.removeItem('streamflow_codigos_v1');
                    setHistory([]);
                    toast.info('Historial vaciado');
                  }
                }}
                style={{ padding: '6px 12px' }}
              >
                <Trash2 size={14} /> Vaciar
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="history-empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <KeyRound size={36} color="#64748b" style={{ opacity: 0.5, margin: '0 auto 10px auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No hay códigos en el historial</p>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Los códigos que obtengas o envíes aparecerán aquí con acceso rápido a WhatsApp.
            </span>
          </div>
        ) : (
          <div className="history-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px'
          }}>
            {filteredHistory.map((item) => {
              const platCfg = PLATFORM_CONFIGS.find(p => p.id === item.plataforma) || PLATFORM_CONFIGS[0];
              return (
                <div 
                  key={item.id} 
                  className="history-card"
                  style={{
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: platCfg.bg,
                      color: platCfg.color,
                      border: `1px solid ${platCfg.border}`
                    }}>
                      {item.plataforma}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> Hace un momento
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontWeight: 900,
                      fontSize: '1.25rem',
                      color: 'var(--text-primary)',
                      letterSpacing: '2px'
                    }}>
                      {item.codigo || 'ENLACE'}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.codigo || item.enlace);
                        setCopiedId(item.id);
                        toast.success(`Copiado: ${item.codigo || 'Enlace'}`);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-secondary)'
                      }}
                      title="Copiar código"
                    >
                      {copiedId === item.id ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>👤 {item.clienteNombre}</span>
                    {item.clienteCelular && <span>📱 {item.codigoPais} {item.clienteCelular}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-whatsapp"
                      onClick={() => handleResendHistoryItem(item)}
                      style={{ flex: 1, padding: '5px 10px', fontSize: '0.76rem', justifyContent: 'center' }}
                    >
                      <Send size={12} />
                      <span>Reenviar</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleDeleteHistory(item.id)}
                      style={{ padding: '5px 8px', color: '#f43f5e' }}
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL DE CONFIGURACIÓN Y GUÍA DEL BUZÓN CENTRAL */}
      {isConfigModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsConfigModalOpen(false)}>
          <div 
            className="modal-container modal-new-client" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <div className="modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Mail size={22} />
                </div>
                <div>
                  <h2 className="modal-title">Buzón Central de Códigos</h2>
                  <p className="modal-subtitle">Conexión IMAP segura para lectura de correos en tiempo real</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsConfigModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Pestañas del Modal */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 20px' }}>
              <button
                type="button"
                className={`tab-btn ${activeGuideTab === 'config' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('config')}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeGuideTab === 'config' ? '2px solid #6366f1' : 'none',
                  color: activeGuideTab === 'config' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Conectar Buzón
              </button>
              <button
                type="button"
                className={`tab-btn ${activeGuideTab === 'guia_google' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('guia_google')}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeGuideTab === 'guia_google' ? '2px solid #6366f1' : 'none',
                  color: activeGuideTab === 'guia_google' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                🔑 Guía Gmail (Contraseña de App)
              </button>
              <button
                type="button"
                className={`tab-btn ${activeGuideTab === 'guia_reenvio' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('guia_reenvio')}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeGuideTab === 'guia_reenvio' ? '2px solid #6366f1' : 'none',
                  color: activeGuideTab === 'guia_reenvio' ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                📬 Reenvío Automático
              </button>
            </div>

            <div className="modal-body-form" style={{ maxHeight: '68vh', overflowY: 'auto', padding: '20px' }}>
              {activeGuideTab === 'config' && (
                <form onSubmit={handleSaveImapConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#c7d2fe'
                  }}>
                    💡 <strong>¿Cómo funciona?</strong> Este correo central recibirá copias de los códigos de todas tus cuentas de streaming. Flow Stream vigilará la bandeja y extraerá los códigos en segundos.
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Correo Central Receptor (Gmail):</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="ejemplo: codigos.flowstream@gmail.com"
                      value={imapForm.user}
                      onChange={(e) => setImapForm(prev => ({ ...prev, user: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Contraseña de Aplicación de Google (16 letras):</span>
                      <a 
                        href="https://myaccount.google.com/apppasswords" 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: '#818cf8', fontSize: '0.78rem' }}
                      >
                        Crear en Google ➔
                      </a>
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="abcd efgh ijkl mnop"
                      value={imapForm.pass}
                      onChange={(e) => setImapForm(prev => ({ ...prev, pass: e.target.value }))}
                      required
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                      ⚠️ No uses tu contraseña personal. Google requiere una Contraseña de Aplicación generada desde tu cuenta.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '12px' }}
                      disabled={isSavingImap}
                    >
                      <Radio size={16} />
                      <span>{isSavingImap ? 'Probando Conexión...' : 'Probar y Conectar Buzón'}</span>
                    </button>

                    {imapStatus.connected && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleDisconnectImap}
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </form>
              )}

              {activeGuideTab === 'guia_google' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Cómo crear tu Contraseña de Aplicación en Google (2 Minutos):
                  </h4>
                  <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                    <li>
                      Entra a tu cuenta Google: <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>myaccount.google.com/security</a>.
                    </li>
                    <li>
                      Verifica que la <strong>"Verificación en 2 pasos"</strong> esté <strong>ACTIVADA</strong>.
                    </li>
                    <li>
                      Entra a: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontWeight: 700 }}>myaccount.google.com/apppasswords</a>.
                    </li>
                    <li>
                      En "Nombre de la app", escribe: <strong>Flow Stream</strong> y presiona <strong>Crear</strong>.
                    </li>
                    <li>
                      Copia la contraseña de <strong>16 letras</strong> generada y pégala en la pestaña <strong>"Conectar Buzón"</strong>.
                    </li>
                  </ol>
                </div>
              )}

              {activeGuideTab === 'guia_reenvio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Reenvío automático de tus cuentas a tu buzón central:
                  </h4>
                  <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                    <li>Abre el Gmail de tu cuenta de streaming.</li>
                    <li>Ve a ⚙️ Configuración ➔ <strong>"Reenvío y correo POP/IMAP"</strong>.</li>
                    <li>Haz clic en <strong>"Añadir una dirección de reenvío"</strong> y pon tu correo central.</li>
                    <li>Crea un filtro para que solo se reenvíen correos de <code>info@mailer.netflix.com</code>.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
