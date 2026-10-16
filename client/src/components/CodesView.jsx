import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Clock, 
  ExternalLink, 
  Tv, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone,
  Info,
  ShieldCheck,
  Mail,
  Radio,
  Settings,
  HelpCircle,
  X,
  Lock,
  ArrowRight,
  Plane,
  Home,
  Shield
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

export function CodesView({ clientes = [], cuentas = [] }) {
  const toast = useToast();

  // Estados del extractor manual / portapapeles
  const [rawInput, setRawInput] = useState('');
  const [extractedData, setExtractedData] = useState({
    codigo: '',
    enlace: '',
    tipo: 'login_code',
    plataformaSugerida: 'Netflix',
    remitente: '',
    asunto: '',
    fecha: null,
    cuerpoTexto: '',
    cuentaDestino: '',
    origen: ''
  });

  // Selección de cuenta maestra / correo de recepción / cliente / perfil asociado
  const [selectedAccountId, setSelectedAccountId] = useState(() => cuentas.length > 0 ? String(cuentas[0].id) : '');
  const [selectedTargetEmail, setSelectedTargetEmail] = useState(() => cuentas.length > 0 ? cuentas[0].correo : 'central');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPlataforma, setSelectedPlataforma] = useState(() => cuentas.length > 0 ? cuentas[0].plataforma : 'Netflix');
  const [customNota, setCustomNota] = useState('');

  // Historial y estados de copiado
  const [history, setHistory] = useState(() => cargarCodigosRecientes());
  const [copiedId, setCopiedId] = useState(null);
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedEmailMessage, setCopiedEmailMessage] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');

  // 5 Tipos de códigos manejados para cuentas de streaming
  const CODE_TYPE_OPTIONS = [
    { id: 'login_code', label: 'Código de inicio de sesión', icon: KeyRound },
    { id: 'reset_password', label: 'Restablecer contraseña', icon: Lock },
    { id: 'travel_mode', label: 'Modo viaje', icon: Plane },
    { id: 'update_household', label: 'Actualizar hogar', icon: Home },
    { id: 'otp_6_digits', label: 'Código de 6 dígitos', icon: Shield },
  ];
  const [selectedCodeType, setSelectedCodeType] = useState('login_code');
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

  // Formulario de configuración IMAP
  const [imapForm, setImapForm] = useState({
    user: '',
    pass: '',
    host: 'imap.gmail.com',
    port: 993
  });
  const [isSavingImap, setIsSavingImap] = useState(false);

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

        // Si hay códigos detectados por el backend que no están en el historial local, sincronizarlos
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
    const interval = setInterval(checkImapStatus, 15000); // Revisar cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  // Forzar escaneo en el buzón central
  const handleSyncNow = async () => {
    if (!imapStatus.serverOnline) {
      toast.info('El microservicio IMAP en segundo plano no está activo. Puedes usar el extractor por portapapeles.');
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
    } catch (err) {
      toast.error('No se pudo conectar con el servidor IMAP');
    } finally {
      setIsSyncingImap(false);
    }
  };

  // Copiar mensaje completo de Gmail
  const handleCopyEmailMessage = () => {
    const textToCopy = [
      extractedData.asunto ? `Asunto: ${extractedData.asunto}` : '',
      extractedData.remitente ? `De: ${extractedData.remitente}` : '',
      extractedData.codigo ? `Código: ${extractedData.codigo}` : '',
      extractedData.enlace ? `Enlace: ${extractedData.enlace}` : '',
      '',
      extractedData.cuerpoTexto || ''
    ].filter(Boolean).join('\n');

    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedEmailMessage(true);
    toast.success('Mensaje de Gmail copiado al portapapeles');
    setTimeout(() => setCopiedEmailMessage(false), 2000);
  };

  // Acción del botón principal "⚡ Extraer Código de Gmail" (PASO 3)
  const handleGetCode = async () => {
    setIsGettingCode(true);

    // 1. Si hay texto escrito o pegado en el textarea, extraerlo
    if (rawInput && rawInput.trim()) {
      const parsed = extraerCodigoDeTexto(rawInput);
      setExtractedData({
        ...parsed,
        tipo: selectedCodeType,
        remitente: 'Pegado Manual / Portapapeles',
        asunto: `Código para ${selectedPlataforma}`,
        fecha: new Date().toISOString(),
        cuerpoTexto: rawInput,
        cuentaDestino: selectedTargetEmail || 'Manual',
        origen: 'manual'
      });
      setIsGettingCode(false);
      toast.success(parsed.codigo ? `¡Código ${parsed.codigo} extraído con éxito!` : '¡Mensaje procesado con éxito!');
      return;
    }

    // 2. Si el servicio IMAP está disponible, consultar endpoint de extracción
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
            codigo: item.codigo || '',
            enlace: item.enlace || '',
            tipo: item.tipo || selectedCodeType,
            plataformaSugerida: item.plataforma || selectedPlataforma,
            remitente: item.remitente || 'Buzón Gmail',
            asunto: item.asunto || 'Mensaje de Streaming',
            fecha: item.fecha || new Date().toISOString(),
            cuerpoTexto: item.cuerpoTexto || '',
            cuentaDestino: item.cuentaDestino || selectedTargetEmail || '',
            origen: 'gmail'
          });
          if (item.plataforma) setSelectedPlataforma(item.plataforma);
          checkImapStatus();
          toast.success(item.codigo 
            ? `¡Código ${item.codigo} extraído de Gmail con éxito!` 
            : '¡Mensaje de Gmail encontrado!'
          );
          setIsGettingCode(false);
          return;
        } else if (res.ok && !data.found) {
          if (imapStatus.connected) {
            toast.info(`Buzón escaneado. No se encontró correo reciente para ${selectedTargetEmail || 'tu cuenta'}. Puedes esperar unos segundos o pegar el texto.`);
          }
        }
      } catch (err) {
        console.error('Error al extraer de IMAP:', err);
      }
    }

    // 3. Intentar leer desde el portapapeles del dispositivo
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setRawInput(clipText);
          const parsed = extraerCodigoDeTexto(clipText);
          setExtractedData({
            ...parsed,
            tipo: selectedCodeType,
            remitente: 'Portapapeles',
            asunto: `Código para ${selectedPlataforma}`,
            fecha: new Date().toISOString(),
            cuerpoTexto: clipText,
            cuentaDestino: selectedTargetEmail || 'Portapapeles',
            origen: 'clipboard'
          });
          toast.success('¡Código y mensaje obtenidos desde tu portapapeles!');
          setIsGettingCode(false);
          return;
        }
      }
    } catch {
      // Ignorar si no hay permisos de portapapeles
    }

    setIsGettingCode(false);
    toast.info(`Pega el texto del correo o espera a que llegue a tu correo de Gmail.`);
  };

  // Guardar y probar conexión IMAP
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
        toast.success(data.message || '¡Buzón central conectado con éxito!');
        setIsConfigModalOpen(false);
        checkImapStatus();
      } else {
        toast.error(data.error || 'Error de conexión IMAP');
      }
    } catch {
      toast.error('No se pudo comunicar con el servidor de correos en localhost:3001');
    } finally {
      setIsSavingImap(false);
    }
  };

  // Desconectar buzón
  const handleDisconnectImap = async () => {
    try {
      await fetch(`${API_SERVER_URL}/api/imap/disconnect`, { method: 'POST' });
      toast.info('Buzón desconectado');
      checkImapStatus();
    } catch {
      toast.error('Error al desconectar');
    }
  };

  // Escuchar cambios en el texto pegado
  useEffect(() => {
    if (rawInput.trim()) {
      const parsed = extraerCodigoDeTexto(rawInput);
      setExtractedData(prev => ({
        ...prev,
        ...parsed,
        tipo: selectedCodeType,
        cuerpoTexto: rawInput,
        remitente: prev.remitente || 'Pegado Manual',
        asunto: prev.asunto || `Código para ${selectedPlataforma}`,
        fecha: prev.fecha || new Date().toISOString()
      }));
      if (parsed.plataformaSugerida) {
        setSelectedPlataforma(parsed.plataformaSugerida);
      }
    }
  }, [rawInput]);

  const selectedAccount = cuentas.find(cta => String(cta.id) === String(selectedAccountId));
  const selectedClient = clientes.find(c => String(c.id) === String(selectedClientId));
  const effectiveAccount = selectedAccount || cuentas.find(cta => String(cta.id) === String(selectedClient?.cuentaId));
  const clientProfile = effectiveAccount?.perfiles?.find(p => String(p.id) === String(selectedClient?.perfilId));

  // Filtrar clientes según la cuenta maestra seleccionada
  const clientesFiltrados = selectedAccountId 
    ? clientes.filter(c => String(c.cuentaId) === String(selectedAccountId))
    : clientes;

  useEffect(() => {
    if (selectedAccount?.plataforma) {
      setSelectedPlataforma(selectedAccount.plataforma);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (selectedClient?.cuentaId && !selectedAccountId) {
      setSelectedAccountId(String(selectedClient.cuentaId));
    }
  }, [selectedClientId]);

  // Pegar del portapapeles
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawInput(text);
          toast.success('Texto pegado del portapapeles');
        } else {
          toast.info('El portapapeles está vacío');
        }
      } else {
        toast.info('Usa Ctrl + V para pegar el texto del correo');
      }
    } catch {
      toast.info('Usa Ctrl + V para pegar el contenido del correo');
    }
  };

  // Copiar código principal
  const handleCopyCode = (codigo) => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    setCopiedMain(true);
    toast.success(`Código ${codigo} copiado`);
    setTimeout(() => setCopiedMain(false), 2000);
  };

  // Copiar enlace
  const handleCopyLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success('Enlace de verificación copiado');
  };

  // Guardar en historial
  const handleSaveToHistory = () => {
    if (!extractedData.codigo && !extractedData.enlace) {
      toast.error('No se ha detectado ningún código o enlace');
      return;
    }

    const saved = guardarCodigoReciente({
      cuentaId: effectiveAccount?.id || null,
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
      toast.error('Detecta o escribe un código antes de enviar');
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
    toast.success('Abriendo WhatsApp con el código listo para enviar');
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

  const formatTimeAgo = (isoString) => {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    return `Hace ${diffHours} horas`;
  };

  const filteredHistory = history.filter(item => {
    if (!historyFilter) return true;
    const q = historyFilter.toLowerCase();
    return (
      (item.codigo && item.codigo.toLowerCase().includes(q)) ||
      (item.clienteNombre && item.clienteNombre.toLowerCase().includes(q)) ||
      (item.plataforma && item.plataforma.toLowerCase().includes(q))
    );
  });

  return (
    <div className="codes-view-container">
      {/* 1. Banner Superior: Extractor Inteligente y Conexión Automática */}
      <div className="codes-header-card">
        <div className="codes-header-info">
          <div className="codes-icon-badge">
            <KeyRound size={26} color="#10b981" />
          </div>
          <div>
            <div className="codes-title-row">
              <h2 className="codes-title">Centro de Códigos de Acceso (Hogar & OTP)</h2>
              <span className="codes-badge-mode">Extractor con Soporte IMAP</span>
            </div>
            <p className="codes-subtitle">
              Extrae al instante códigos de 4 dígitos de Netflix Hogar o códigos OTP de Disney+/Max para enviarlos por WhatsApp a tus clientes con un solo clic.
            </p>
          </div>
        </div>

        {/* Estado del Buzón Central Automático */}
        <div className="codes-imap-status-bar">
          <div className="imap-status-indicator">
            {imapStatus.connected ? (
              <>
                <span className="status-dot green pulse" />
                <span>Buzón Central: <strong>{imapStatus.email}</strong> (Escuchando en vivo)</span>
              </>
            ) : imapStatus.serverOnline ? (
              <>
                <span className="status-dot amber" />
                <span>Buzón desconectado. Conéctalo para extracción 100% automática.</span>
              </>
            ) : (
              <>
                <span className="status-dot gray" />
                <span>Modo Portapapeles activo (Microservicio IMAP en segundo plano listo).</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {imapStatus.connected && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleSyncNow}
                disabled={isSyncingImap}
                title="Escanear correos de los últimos 30 minutos ahora"
              >
                <RefreshCw size={13} className={isSyncingImap ? 'spin' : ''} />
                <span>{isSyncingImap ? 'Buscando...' : 'Escanear Ahora'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsConfigModalOpen(true)}
              title="Configurar correo central y ver guía de reenvío automático"
            >
              <Settings size={14} />
              <span>Configurar Buzón</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid Principal: Extractor Inteligente y Código en Grande */}
      {/* 2. Grid Principal: Flujo Paso a Paso & Mensaje de Gmail Encontrado */}
      <div className="codes-grid">
        {/* PANEL IZQUIERDO: Extractor Flujo Paso a Paso */}
        <div className="codes-extractor-card">
          <div className="card-header-styled">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Extractor Inteligente de Códigos & Gmail
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePasteClipboard}
              title="Pegar texto del portapapeles"
            >
              <Copy size={14} />
              <span>Pegar Portapapeles</span>
            </button>
          </div>

          {/* =========================================================
              PASO 1: SELECCIONAR EL CORREO A DONDE LLEGAN LOS CORREOS
             ========================================================= */}
          <div className="step-container-box">
            <div className="step-badge-tag">
              <span className="step-num-pill">Paso 1</span>
              <span className="step-title-heading">Selecciona el correo donde llegan todos los correos:</span>
            </div>

            <div className="form-group" style={{ marginTop: '8px', marginBottom: '0' }}>
              <div className="target-mail-select-wrapper">
                <Mail size={17} className="select-icon-left" color="#ea4335" />
                <select
                  className="form-select target-mail-select"
                  value={selectedTargetEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTargetEmail(val);
                    if (val === 'central' || val === 'todos' || val === 'manual') {
                      setSelectedAccountId('');
                    } else {
                      const acc = cuentas.find(c => c.correo === val || String(c.id) === val);
                      if (acc) {
                        setSelectedAccountId(String(acc.id));
                        setSelectedPlataforma(acc.plataforma);
                        setSelectedTargetEmail(acc.correo);
                      }
                    }
                  }}
                >
                  {imapStatus.connected && (
                    <option value={imapStatus.email}>
                      📬 Buzón Central Gmail ({imapStatus.email}) [En Vivo]
                    </option>
                  )}
                  {!imapStatus.connected && (
                    <option value="central">
                      📬 Buzón Central Gmail (Reenvío unificado de correos)
                    </option>
                  )}

                  <optgroup label="Cuentas Maestras Registradas">
                    {cuentas.map(cta => (
                      <option key={cta.id} value={cta.correo}>
                        📺 {cta.plataforma} — {cta.correo} ({(cta.perfiles || []).filter(p => p.estado === 'asignado').length}/{(cta.perfiles || []).length} perfiles)
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Otras opciones">
                    <option value="todos">🌐 Cualquier cuenta / Todos los correos recibidos</option>
                    <option value="manual">📝 Entrada manual / Pegado libre</option>
                  </optgroup>
                </select>
              </div>

              {/* Indicador de cuenta activa */}
              <div className="target-account-subinfo">
                <span>
                  {selectedAccount ? (
                    <>Plataforma: <strong>{selectedAccount.plataforma}</strong> ({selectedAccount.correo})</>
                  ) : imapStatus.connected ? (
                    <>Buzón conectado: <strong>{imapStatus.email}</strong></>
                  ) : (
                    <>Buzón unificado de recepción de códigos</>
                  )}
                </span>
                <span className="platform-pill" style={{ fontSize: '0.72rem', padding: '1px 8px' }}>
                  {selectedPlataforma}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              PASO 2: SELECCIONAR EL TIPO DE CÓDIGO QUE NECESITO EXTRAER
             ========================================================= */}
          <div className="step-container-box">
            <div className="step-badge-tag">
              <span className="step-num-pill">Paso 2</span>
              <span className="step-title-heading">Selecciona el tipo de código que necesitas extraer:</span>
            </div>

            <div className="streaming-code-types-container" style={{ marginTop: '6px' }}>
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
                      if (rawInput.trim()) {
                        setExtractedData(prev => ({ ...prev, tipo: opt.id }));
                      }
                    }}
                  >
                    <IconComponent size={18} className="code-type-icon" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================
              PASO 3: BOTÓN "EXTRAER"
             ========================================================= */}
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn-extraer-principal"
              onClick={handleGetCode}
              disabled={isGettingCode || isSyncingImap}
            >
              <KeyRound size={20} className={isGettingCode || isSyncingImap ? 'spin' : ''} />
              <span>
                {isGettingCode || isSyncingImap ? 'Buscando correo en Gmail...' : '⚡ Extraer Código de Gmail'}
              </span>
            </button>
          </div>

          {/* OPCIONES SECUNDARIAS / OPCIONALES */}
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span>O pega manualmente el contenido del correo (opcional):</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {rawInput.length} caracteres
              </span>
            </label>
            <textarea
              className="form-textarea codes-textarea"
              rows={3}
              placeholder="Ejemplo: 'Hola, tu código para actualizar tu Hogar con Netflix es 4829. Validez de 15 minutos...'"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
          </div>

          <div className="codes-meta-row" style={{ marginTop: '10px' }}>
            {/* Selector de Cliente */}
            <div className="form-group" style={{ flex: 1.4, minWidth: '220px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={14} color="#25d366" />
                <span>Enviar al Cliente (Opcional):</span>
              </label>
              <select
                className="form-select"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">-- Sin asignar (Solo extraer) --</option>
                {clientesFiltrados.map(cli => {
                  const cta = cuentas.find(c => String(c.id) === String(cli.cuentaId));
                  return (
                    <option key={cli.id} value={cli.id}>
                      {cli.nombre} ({cta?.plataforma || 'Streaming'} - {cli.celular})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Código a mano si se desea */}
            <div className="form-group" style={{ flex: 0.8, minWidth: '130px' }}>
              <label className="form-label">Código a mano:</label>
              <input 
                type="text"
                className="form-input codes-manual-input"
                style={{ maxWidth: '100%' }}
                placeholder="Ej: 4920"
                maxLength={8}
                value={extractedData.codigo}
                onChange={(e) => setExtractedData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>

          {(effectiveAccount || selectedClient) && (
            <div className="codes-client-summary-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tv size={16} color="#6366f1" />
                  <span>
                    <strong>Cuenta:</strong> {effectiveAccount?.correo || selectedTargetEmail || 'Sin correo asociado'}
                    <span className="platform-pill" style={{ marginLeft: '8px', fontSize: '0.72rem', padding: '1px 6px' }}>
                      {effectiveAccount?.plataforma || selectedPlataforma}
                    </span>
                  </span>
                </div>
                {selectedClient && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={15} color="#25d366" />
                    <span><strong>Cliente:</strong> {selectedClient.nombre}</span>
                  </div>
                )}
              </div>

              {selectedClient && (
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: '#94a3b8', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span>📱 {selectedClient.codigoPais} {selectedClient.celular}</span>
                  {clientProfile && <span>👤 Perfil: {clientProfile.nombre}</span>}
                  {selectedClient.pin && <span>🔒 PIN: {selectedClient.pin}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================
            PANEL DERECHO: CÓDIGO & MENSAJE DE GMAIL ENCONTRADO (PASO 4)
           ========================================================= */}
        <div className="codes-result-card">
          <div className="result-card-inner">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px', flexWrap: 'wrap' }}>
              <span className="result-tag">
                {selectedCodeType === 'update_household' || extractedData.tipo === 'update_household' || extractedData.tipo === 'netflix_hogar' ? '🏠 CÓDIGO NETFLIX HOGAR' : 
                 selectedCodeType === 'travel_mode' || extractedData.tipo === 'travel_mode' ? '✈️ MODO VIAJE' :
                 selectedCodeType === 'reset_password' || extractedData.tipo === 'reset_password' ? '🔒 RESTABLECER CONTRASEÑA' :
                 selectedCodeType === 'otp_6_digits' || extractedData.tipo === 'otp_6_digits' ? '🛡️ CÓDIGO DE 6 DÍGITOS OTP' : '🔑 CÓDIGO DE INICIO DE SESIÓN'}
              </span>

              <span className="platform-pill" style={{ fontSize: '0.74rem', padding: '2px 8px' }}>
                {extractedData.plataformaSugerida || selectedPlataforma}
              </span>
            </div>

            {/* Visualización del Código */}
            <div className="result-code-display">
              {extractedData.codigo ? (
                <div className="code-text-neon">{extractedData.codigo}</div>
              ) : (
                <div className="code-text-placeholder">
                  _ _ _ _
                </div>
              )}
            </div>

            <p className="result-helper-text">
              {extractedData.codigo 
                ? 'Código extraído listo para enviar o copiar'
                : 'Selecciona la cuenta y tipo de código, y pulsa "Extraer Código"'}
            </p>

            {/* MENSAJE DE GMAIL ENCONTRADO */}
            {(extractedData.cuerpoTexto || extractedData.asunto || extractedData.remitente) ? (
              <div className="gmail-message-preview-card">
                <div className="gmail-preview-header">
                  <div className="gmail-logo-badge">
                    <Mail size={16} color="#ea4335" />
                    <span>Mensaje de GMAIL Encontrado</span>
                  </div>
                  {extractedData.fecha && (
                    <span className="gmail-time-tag">
                      {formatTimeAgo(extractedData.fecha)}
                    </span>
                  )}
                </div>

                <div className="gmail-preview-meta">
                  {extractedData.remitente && (
                    <div className="gmail-meta-line">
                      <span className="meta-label">De:</span>
                      <span className="meta-value">{extractedData.remitente}</span>
                    </div>
                  )}
                  {extractedData.asunto && (
                    <div className="gmail-meta-line">
                      <span className="meta-label">Asunto:</span>
                      <span className="meta-value highlight">{extractedData.asunto}</span>
                    </div>
                  )}
                  {extractedData.cuentaDestino && (
                    <div className="gmail-meta-line">
                      <span className="meta-label">Para:</span>
                      <span className="meta-value">{extractedData.cuentaDestino}</span>
                    </div>
                  )}
                </div>

                {extractedData.cuerpoTexto && (
                  <div className="gmail-preview-body">
                    {extractedData.cuerpoTexto}
                  </div>
                )}

                <div className="gmail-preview-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyEmailMessage}
                  >
                    {copiedEmailMessage ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedEmailMessage ? '¡Copiado!' : 'Copiar Mensaje de Gmail'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="gmail-placeholder-box">
                <Mail size={24} color="#64748b" style={{ opacity: 0.6, marginBottom: '6px' }} />
                <span>Aquí aparecerá el mensaje original de Gmail encontrado con su asunto, remitente y código.</span>
              </div>
            )}

            {/* Enlace oficial detectado */}
            {extractedData.enlace && (
              <div className="detected-link-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#38bdf8' }}>
                  <ExternalLink size={14} />
                  <span>Enlace oficial detectado:</span>
                </div>
                <div className="detected-link-url" title={extractedData.enlace}>
                  {extractedData.enlace}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyLink(extractedData.enlace)}
                  >
                    <Copy size={13} /> Copiar Enlace
                  </button>
                  <a 
                    href={extractedData.enlace} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    Abrir Enlace
                  </a>
                </div>
              </div>
            )}

            {/* Acciones del Resultado */}
            <div className="result-actions-column">
              <button
                type="button"
                className="btn btn-whatsapp-large"
                onClick={handleSendWhatsApp}
                disabled={!extractedData.codigo && !extractedData.enlace && !extractedData.cuerpoTexto}
              >
                <Send size={18} />
                <span>Enviar Código a WhatsApp</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleCopyCode(extractedData.codigo)}
                  disabled={!extractedData.codigo}
                >
                  {copiedMain ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  <span>{copiedMain ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleSaveToHistory}
                  disabled={!extractedData.codigo && !extractedData.enlace}
                  title="Guardar en el historial de accesos"
                >
                  <ShieldCheck size={16} color="#06b6d4" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>

            <div className="codes-notice-box">
              <Clock size={15} color="#f59e0b" />
              <span>Los códigos de acceso y enlaces de streaming expiran a los <strong>15 minutos</strong>.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Historial de Códigos Recientes */}
      <div className="codes-history-section">
        <div className="history-header-row">
          <div>
            <h3 className="history-title">Historial de Códigos Recientes</h3>
            <p className="history-subtitle">
              Últimos códigos entregados para consulta rápida o reenvío si el cliente no lo vio a tiempo.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="search-bar-mini">
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Buscar en historial..."
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
              >
                <Trash2 size={14} /> Vaciar
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="history-empty-state">
            <KeyRound size={36} color="#64748b" style={{ opacity: 0.5 }} />
            <p>No hay códigos en el historial aún.</p>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Los códigos que extraigas manualmente o recibas en tu buzón central aparecerán aquí.
            </span>
          </div>
        ) : (
          <div className="history-cards-grid">
            {filteredHistory.map((item) => (
              <div key={item.id} className="history-card">
                <div className="history-card-top">
                  <span className="history-platform-badge">
                    {item.plataforma}
                  </span>
                  <span className="history-time-badge">
                    <Clock size={12} /> {formatTimeAgo(item.fecha)}
                  </span>
                </div>

                <div className="history-card-body">
                  <div className="history-code-val">
                    {item.codigo || 'ENLACE'}
                  </div>

                  <div className="history-client-details">
                    <span className="history-client-name">
                      👤 {item.clienteNombre}
                    </span>
                    {item.clienteCelular && (
                      <span className="history-client-phone">
                        📱 {item.codigoPais} {item.clienteCelular}
                      </span>
                    )}
                    {item.perfilNombre && (
                      <span className="history-client-profile">
                        📺 {item.perfilNombre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="history-card-actions">
                  <button
                    type="button"
                    className="history-btn copy"
                    onClick={() => {
                      navigator.clipboard.writeText(item.codigo || item.enlace);
                      setCopiedId(item.id);
                      toast.success(`Copiado: ${item.codigo || 'Enlace'}`);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    title="Copiar código"
                  >
                    {copiedId === item.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedId === item.id ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    className="history-btn whatsapp"
                    onClick={() => handleResendHistoryItem(item)}
                    title="Reenviar a WhatsApp"
                  >
                    <Send size={14} />
                    <span>Reenviar</span>
                  </button>

                  <button
                    type="button"
                    className="history-btn delete"
                    onClick={() => handleDeleteHistory(item.id)}
                    title="Eliminar de historial"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MODAL DE CONFIGURACIÓN Y GUÍA DEL BUZÓN CENTRAL */}
      {isConfigModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={22} color="#10b981" />
                <h3 className="modal-title">Buzón Central de Códigos (Extracción Automática)</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsConfigModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Pestañas internas del Modal */}
            <div className="modal-inner-tabs">
              <button
                type="button"
                className={`tab-btn ${activeGuideTab === 'config' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('config')}
                style={{ borderRadius: '0', borderBottom: activeGuideTab === 'config' ? '2px solid #6366f1' : 'none' }}
              >
                ⚙️ Conectar Correo
              </button>
              <button
                type="button"
                className={`tab-btn ${activeGuideTab === 'guia_google' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('guia_google')}
                style={{ borderRadius: '0', borderBottom: activeGuideTab === 'guia_google' ? '2px solid #6366f1' : 'none' }}
              >
                🔑 Contraseña de Aplicación
              </button>
              <button
                type="button"
                className={`tab-btn ${activeGuideTab === 'guia_reenvio' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('guia_reenvio')}
                style={{ borderRadius: '0', borderBottom: activeGuideTab === 'guia_reenvio' ? '2px solid #6366f1' : 'none' }}
              >
                📬 Reenvío de tus 6-10 Correos
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {/* PESTAÑA 1: FORMULARIO DE CONEXIÓN */}
              {activeGuideTab === 'config' && (
                <form onSubmit={handleSaveImapConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="modal-tip-box">
                    💡 <strong>¿Cómo funciona?</strong> Este correo receptor recibirá copias automáticas de los códigos de tus 6 a 10 correos. Flow Stream lo vigilará cada 15 segundos y extraerá los códigos de Netflix solos.
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correo Central Receptor (Gmail / Outlook):</label>
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
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Contraseña de Aplicación de Google (16 letras):</span>
                      <a 
                        href="https://myaccount.google.com/apppasswords" 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: '#38bdf8', fontSize: '0.78rem' }}
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
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                      ⚠️ No uses tu contraseña personal habitual. Google exige una "Contraseña de Aplicación". Consulta la pestaña de arriba si necesitas ayuda.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
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
                        title="Desconectar buzón"
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* PESTAÑA 2: GUÍA DE CONTRASEÑA DE APLICACIÓN DE GOOGLE */}
              {activeGuideTab === 'guia_google' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                    Cómo crear tu Contraseña de Aplicación en Google (2 Minutos):
                  </h4>
                  <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>
                      Entra a tu cuenta de Google en: <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>myaccount.google.com/security</a>.
                    </li>
                    <li>
                      Asegúrate de que la <strong>"Verificación en 2 pasos"</strong> esté <strong>ACTIVADA</strong>. (Google no permite contraseñas de aplicación sin esto).
                    </li>
                    <li>
                      Entra directamente al enlace oficial de Google: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontWeight: 700 }}>myaccount.google.com/apppasswords</a>.
                    </li>
                    <li>
                      En "Nombre de la app", escribe: <strong>Flow Stream</strong> y presiona <strong>Crear</strong>.
                    </li>
                    <li>
                      Google te mostrará un recuadro amarillo con una contraseña de <strong>16 letras</strong> (ejemplo: <code>abcd efgh ijkl mnop</code>).
                    </li>
                    <li>
                      Copia esa clave y pégala en la pestaña <strong>"Conectar Correo"</strong> de este CRM. ¡Listo!
                    </li>
                  </ol>
                </div>
              )}

              {/* PESTAÑA 3: GUÍA DE REENVÍO AUTOMÁTICO DE TUS 6-10 CORREOS */}
              {activeGuideTab === 'guia_reenvio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                    Cómo hacer que tus 6 a 10 correos reenvíen los códigos automáticamente:
                  </h4>
                  <p>
                    Solo debes hacer este paso una única vez en cada uno de tus 6 a 10 correos personales de Gmail / Outlook:
                  </p>
                  <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>
                      Abre tu Gmail personal donde compraste la cuenta de Netflix.
                    </li>
                    <li>
                      Haz clic en el engranaje de arriba a la derecha ⚙️ y selecciona <strong>"Ver toda la configuración"</strong>.
                    </li>
                    <li>
                      Ve a la pestaña <strong>"Reenvío y correo POP/IMAP"</strong>.
                    </li>
                    <li>
                      Haz clic en <strong>"Añadir una dirección de reenvío"</strong> y escribe tu correo central (ejemplo: <code>codigos.flowstream@gmail.com</code>).
                    </li>
                    <li>
                      (Opcional pero recomendado): Crea un filtro para que <strong>SOLO</strong> se reenvíen los correos de Netflix:
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', marginTop: '4px', fontSize: '0.78rem' }}>
                        De: <code>info@mailer.netflix.com</code> ➔ Acción: <em>Reenviar a tu correo central</em>.
                      </div>
                    </li>
                    <li>
                      ¡Listo! A partir de ese momento, cada vez que un cliente pida código de TV, el correo viajará en 1 segundo a Flow Stream y aparecerá en tu pantalla solo.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setIsConfigModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
