import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  RefreshCw, 
  Sparkles, 
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  Smartphone
} from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { PLATFORMS } from '../constants/platforms';
import { useToast } from '../context/ToastContext';

export function AccountIncidentModal({
  isOpen,
  onClose,
  cuenta,
  clientes = [],
  onGoToWhatsAppAuto = () => {}
}) {
  const toast = useToast();

  if (!isOpen || !cuenta) return null;

  const platformInfo = PLATFORMS[cuenta.plataforma] || PLATFORMS.Otro;

  // Encontrar clientes asignados a los perfiles de esta cuenta
  const perfiles = cuenta.perfiles || [];
  const assignedClientsList = [];

  perfiles.forEach(p => {
    // Buscar cliente asignado
    let c = null;
    if (p.clienteId) {
      c = clientes.find(cli => String(cli.id) === String(p.clienteId));
    }
    if (!c && p.id != null) {
      c = clientes.find(cli => String(cli.perfilId) === String(p.id));
    }

    if (c) {
      assignedClientsList.push({
        perfil: p,
        cliente: c
      });
    }
  });

  // Estados de Selección de Clientes
  const [selectedClientIds, setSelectedClientIds] = useState(() => 
    assignedClientsList.map(item => String(item.cliente.id))
  );

  // Estados de Plantilla y Mensaje
  const PRESET_TEMPLATES = {
    caida: {
      id: 'caida',
      label: '⚠️ Caída en Proceso',
      text: `👋 ¡Hola {nombre}! Te informamos que detectamos una interrupción temporal en tu servicio de *{plataforma}* ({correo}).\n\nNuestro equipo técnico ya se encuentra gestionando el restablecimiento prioritario con el proveedor para reactivar el acceso a la brevedad.\n\nTe notificaremos por aquí apenas esté listo. ¡Agradecemos mucho tu paciencia y preferencia! ⭐`
    },
    mantenimiento: {
      id: 'mantenimiento',
      label: '🛠️ Mantenimiento Técnico',
      text: `👋 ¡Hola {nombre}! Te informamos que estamos realizando una breve actualización técnica de seguridad en tu cuenta de *{plataforma}* (Perfil: *{perfil}*).\n\nEn breves minutos tu servicio continuará operando con total normalidad.\n\n¡Gracias por tu comprensión!`
    },
    restablecido: {
      id: 'restablecido',
      label: '🔑 Acceso Reactivado',
      text: `🎉 ¡Hola {nombre}! Tu servicio de *{plataforma}* ya fue restablecido exitosamente con las nuevas credenciales activas:\n\n📧 *Correo:* {correo}\n🔑 *Contraseña:* {password}\n👤 *Perfil:* {perfil} (PIN: {pin})\n\n¡Que disfrutes tus películas y series favoritas! 🍿🎬`
    },
    codigo_hogar: {
      id: 'codigo_hogar',
      label: '📺 Código de Hogar / TV',
      text: `👋 ¡Hola {nombre}! Te recordamos que si tu Smart TV solicita actualización de hogar o código temporal en *{plataforma}*, puedes escribirnos directamente por aquí o ingresar a nuestro portal de auto-servicio y te enviaremos el código en segundos. 🍿`
    },
    personalizado: {
      id: 'personalizado',
      label: '✏️ Mensaje Libre',
      text: `Hola {nombre}, te escribimos para informarte sobre tu cuenta de *{plataforma}*...`
    }
  };

  const [activeTemplate, setActiveTemplate] = useState('caida');
  const [customText, setCustomText] = useState(PRESET_TEMPLATES.caida.text);

  // Estados de WhatsApp Bot
  const [botStatus, setBotStatus] = useState({ isConnected: false, phoneNumber: '' });
  const [loadingBotStatus, setLoadingBotStatus] = useState(true);

  // Estados de Envío y Progreso
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [sendResults, setSendResults] = useState({}); // { [clienteId]: { status: 'sent' | 'error', error: '' } }
  const [manualSentMap, setManualSentMap] = useState({});

  // Consultar estado de conexión del bot al abrir el modal
  useEffect(() => {
    let isMounted = true;
    const checkBot = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setBotStatus({
              isConnected: !!data.isConnected,
              phoneNumber: data.phoneNumber || ''
            });
          }
        }
      } catch (e) {
        if (isMounted) setBotStatus({ isConnected: false, phoneNumber: '' });
      } finally {
        if (isMounted) setLoadingBotStatus(false);
      }
    };
    checkBot();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Cambiar plantilla
  const handleSelectTemplate = (templateKey) => {
    setActiveTemplate(templateKey);
    setCustomText(PRESET_TEMPLATES[templateKey].text);
  };

  // Insertar variable en el textarea
  const handleInsertTag = (tag) => {
    setCustomText(prev => prev + ` ${tag} `);
  };

  // Seleccionar / Deseleccionar todos
  const handleToggleSelectAll = () => {
    if (selectedClientIds.length === assignedClientsList.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(assignedClientsList.map(item => String(item.cliente.id)));
    }
  };

  const handleToggleClient = (clienteId) => {
    const idStr = String(clienteId);
    setSelectedClientIds(prev => 
      prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr]
    );
  };

  // Compilar mensaje reemplazando variables dinámicas para un cliente específico
  const compileMessage = (templateString, cliente, perfil) => {
    return templateString
      .replace(/\{nombre\}/g, cliente?.nombre || 'Cliente')
      .replace(/\{plataforma\}/g, cuenta.plataforma || 'Streaming')
      .replace(/\{correo\}/g, cuenta.correo || '')
      .replace(/\{password\}/g, cuenta.password || '')
      .replace(/\{perfil\}/g, perfil?.nombre || `Perfil ${perfil?.numero || 1}`)
      .replace(/\{pin\}/g, perfil?.pin || 'Sin PIN');
  };

  // Primer cliente seleccionado para la vista previa
  const firstSelectedPair = assignedClientsList.find(item => 
    selectedClientIds.includes(String(item.cliente.id))
  ) || assignedClientsList[0];

  const previewMessage = firstSelectedPair 
    ? compileMessage(customText, firstSelectedPair.cliente, firstSelectedPair.perfil)
    : customText;

  // 1. Envío Automático con el Robot de WhatsApp
  const handleSendAutomaticBroadcast = async () => {
    if (!botStatus.isConnected) {
      toast.warning('El bot de WhatsApp no está conectado. Conéctalo desde "WhatsApp Auto".');
      return;
    }

    const targets = assignedClientsList.filter(item => 
      selectedClientIds.includes(String(item.cliente.id))
    );

    if (targets.length === 0) {
      toast.warning('Selecciona al menos un cliente afectado.');
      return;
    }

    if (!window.confirm(`¿Confirmas el envío del aviso a los ${targets.length} clientes seleccionados?`)) {
      return;
    }

    setIsSending(true);
    setSendProgress({ current: 0, total: targets.length, currentName: '' });

    const messagesToSend = targets.map(item => ({
      clienteId: item.cliente.id,
      nombre: item.cliente.nombre,
      phone: item.cliente.celular,
      plataforma: cuenta.plataforma,
      perfil: item.perfil?.nombre || '',
      message: compileMessage(customText, item.cliente, item.perfil)
    }));

    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          options: {
            delaySeconds: 4,
            reason: activeTemplate === 'caida' ? 'aviso_caida' : activeTemplate === 'mantenimiento' ? 'mantenimiento' : 'reactivacion'
          }
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Actualizar estados por cliente
        const newResults = {};
        data.results.forEach(r => {
          newResults[r.clienteId] = {
            status: r.success ? 'sent' : 'error',
            error: r.error
          };
        });
        setSendResults(newResults);

        toast.success(`¡Aviso enviado con éxito a ${data.totalSent} clientes!`);
      } else {
        toast.error('Error enviando difusión: ' + (data.error || 'Fallo desconocido'));
      }
    } catch (err) {
      toast.error('Error de conexión con el backend: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 2. Envío Manual con WhatsApp Web
  const handleSendManual = (item) => {
    const msg = compileMessage(customText, item.cliente, item.perfil);
    let cleanPhone = String(item.cliente.celular || '').replace(/\D/g, '');
    if (cleanPhone.length === 9) cleanPhone = `51${cleanPhone}`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    setManualSentMap(prev => ({ ...prev, [item.cliente.id]: true }));
    toast.info(`Abriendo chat de WhatsApp para ${item.cliente.nombre}...`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container incident-modal-container"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%' }}
      >
        {/* Cabecera del Modal con Alerta de Incidencia */}
        <div className="incident-modal-header">
          <div className="incident-header-left">
            <div className="incident-icon-pulse">
              <AlertTriangle size={24} color="#f59e0b" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="incident-title">Aviso de Caída / Mantenimiento</h3>
                <span className="incident-badge-platform" style={{ background: platformInfo.badgeBg, color: platformInfo.textColor }}>
                  {cuenta.plataforma}
                </span>
              </div>
              <p className="incident-account-info">
                Cuenta: <strong>{cuenta.correo}</strong> · {assignedClientsList.length} clientes asignados
              </p>
            </div>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="incident-modal-body">
          {assignedClientsList.length === 0 ? (
            <div className="incident-empty-box">
              <AlertCircle size={36} color="#94a3b8" />
              <h4>No hay clientes asignados a esta cuenta</h4>
              <p>Esta cuenta maestra no tiene pantallas vendidas actualmente. Los avisos se envían a los clientes activos que ocupan perfiles.</p>
            </div>
          ) : (
            <>
              {/* 1. Selector de Plantillas Rápidas */}
              <div className="incident-section">
                <label className="incident-section-label">
                  <Sparkles size={14} color="#6366f1" />
                  <span>1. Selecciona el Tipo de Incidencia / Plantilla Rápida:</span>
                </label>

                <div className="preset-chips-grid">
                  {Object.values(PRESET_TEMPLATES).map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      className={`preset-chip-btn ${activeTemplate === tmpl.id ? 'active' : ''}`}
                      onClick={() => handleSelectTemplate(tmpl.id)}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Editor del Mensaje con Etiquetas Dinámicas */}
              <div className="incident-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="incident-section-label" style={{ margin: 0 }}>
                    <MessageSquare size={14} color="#06b6d4" />
                    <span>2. Personaliza el Mensaje para WhatsApp:</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {customText.length} caracteres
                  </span>
                </div>

                {/* Pills de variables dinámicas */}
                <div className="dynamic-tags-bar">
                  <span className="tag-bar-hint">Insertar:</span>
                  {[
                    { tag: '{nombre}', label: 'Nombre' },
                    { tag: '{plataforma}', label: 'Plataforma' },
                    { tag: '{correo}', label: 'Correo' },
                    { tag: '{password}', label: 'Nueva Clave' },
                    { tag: '{perfil}', label: 'Perfil' },
                    { tag: '{pin}', label: 'PIN' }
                  ].map(t => (
                    <button
                      key={t.tag}
                      type="button"
                      className="tag-pill-btn"
                      onClick={() => handleInsertTag(t.tag)}
                      title={`Insertar ${t.tag}`}
                    >
                      +{t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-textarea incident-textarea"
                  rows={4}
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="Escribe el mensaje que recibirán tus clientes..."
                />
              </div>

              {/* 3. Previsualización en Vivo */}
              {firstSelectedPair && (
                <div className="incident-preview-card">
                  <div className="preview-header">
                    <span className="preview-label">
                      📱 Vista Previa Real (Ejemplo para {firstSelectedPair.cliente.nombre}):
                    </span>
                  </div>
                  <div className="preview-bubble">
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{previewMessage}</p>
                  </div>
                </div>
              )}

              {/* 4. Lista de Clientes Afectados con Checkboxes y Envío Manual */}
              <div className="incident-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="incident-section-label" style={{ margin: 0 }}>
                    <Smartphone size={14} color="#10b981" />
                    <span>
                      3. Clientes Afectados ({selectedClientIds.length} de {assignedClientsList.length} seleccionados):
                    </span>
                  </label>
                  <button
                    type="button"
                    className="btn-text-link"
                    onClick={handleToggleSelectAll}
                  >
                    {selectedClientIds.length === assignedClientsList.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="affected-clients-table-wrapper">
                  <table className="affected-clients-table">
                    <thead>
                      <tr>
                        <th style={{ width: '38px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedClientIds.length === assignedClientsList.length}
                            onChange={handleToggleSelectAll}
                          />
                        </th>
                        <th>Perfil / Pantalla</th>
                        <th>Cliente</th>
                        <th>Celular</th>
                        <th style={{ textAlign: 'right' }}>Estado / Envío</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedClientsList.map(item => {
                        const isSelected = selectedClientIds.includes(String(item.cliente.id));
                        const sendResult = sendResults[item.cliente.id];
                        const isManualSent = manualSentMap[item.cliente.id];

                        return (
                          <tr key={item.cliente.id} className={isSelected ? 'row-selected' : ''}>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleClient(item.cliente.id)}
                              />
                            </td>
                            <td>
                              <span className="profile-slot-chip">
                                #{item.perfil.numero} {item.perfil.nombre}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--text-primary)' }}>
                                {item.cliente.nombre}
                              </strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {item.cliente.celular}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                {sendResult?.status === 'sent' ? (
                                  <span className="badge-sent-ok">
                                    <CheckCircle2 size={13} />
                                    <span>Enviado ✓✓</span>
                                  </span>
                                ) : sendResult?.status === 'error' ? (
                                  <span className="badge-sent-error" title={sendResult.error}>
                                    <AlertCircle size={13} />
                                    <span>Error</span>
                                  </span>
                                ) : isManualSent ? (
                                  <span className="badge-sent-ok">
                                    <Check size={13} />
                                    <span>Abierto</span>
                                  </span>
                                ) : null}

                                <button
                                  type="button"
                                  className="btn-icon-wa-manual"
                                  onClick={() => handleSendManual(item)}
                                  title="Enviar manualmente por WhatsApp Web"
                                >
                                  <WhatsAppIcon size={14} color="#25d366" />
                                  <span>Chat</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con los Botones de Acción */}
        <div className="incident-modal-footer">
          <div className="footer-status-info">
            {loadingBotStatus ? (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Verificando bot...</span>
            ) : botStatus.isConnected ? (
              <span className="status-bot-badge-online">
                <span className="dot-green"></span>
                <span>Bot Conectado ({botStatus.phoneNumber})</span>
              </span>
            ) : (
              <span className="status-bot-badge-offline">
                <span className="dot-gray"></span>
                <span>Bot Desconectado (Usa envío individual o vincula en "WhatsApp Auto")</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSending}>
              Cerrar
            </button>

            {assignedClientsList.length > 0 && (
              <button
                type="button"
                className="btn btn-primary btn-broadcast-send"
                onClick={handleSendAutomaticBroadcast}
                disabled={isSending || selectedClientIds.length === 0 || !botStatus.isConnected}
                title={!botStatus.isConnected ? "Conecta el bot de WhatsApp primero para enviar automáticamente" : ""}
              >
                {isSending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Despachando avisos...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>
                      {botStatus.isConnected 
                        ? `🚀 Enviar Aviso Automático (${selectedClientIds.length})` 
                        : `Vincular Bot para Envío Automático`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
