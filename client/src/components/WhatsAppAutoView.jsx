import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Power, 
  Send, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle,
  History,
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { useToast } from '../context/ToastContext';
import { calcularDiasRestantes, formatearFecha } from '../utils/storage';

export function WhatsAppAutoView({ clientes = [], cuentas = [] }) {
  const toast = useToast();

  // Estados de WhatsApp
  const [statusData, setStatusData] = useState({
    status: 'disconnected',
    isConnected: false,
    phoneNumber: '',
    pushName: '',
    qrCode: null
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Estados de Configuración
  const [config, setConfig] = useState({
    enabled: true,
    sendHour: 9,
    sendMinute: 0,
    anticipationDays: [2, 0],
    delaySeconds: 6,
    lastRunDate: null
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Estados de Historial
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Estados de Prueba y Ejecución Manual
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('👋 ¡Hola! Este es un mensaje de prueba desde tu sistema Flow Stream CRM.');
  const [sendingTest, setSendingTest] = useState(false);
  const [runningJob, setRunningJob] = useState(false);
  const [lastRunSummary, setLastRunSummary] = useState(null);

  // Polling para actualizar QR y conexión en tiempo real
  const pollTimerRef = useRef(null);

  // 1. Obtener estado del backend
  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.warn('Backend de WhatsApp no disponible en http://localhost:3001:', err.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  // 2. Obtener configuración
  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {}
  };

  // 3. Obtener historial
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchHistory();

    // Iniciar polling constante si está esperando QR o conectando
    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Iniciar conexión con WhatsApp (genera QR)
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/connect', { method: 'POST' });
      const data = await res.json();
      setStatusData(prev => ({ ...prev, ...data }));
      toast.info('Generando código QR de WhatsApp...');
      setTimeout(fetchStatus, 2500);
    } catch (err) {
      toast.error('Error conectando al servicio de WhatsApp: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  // Desconectar sesión
  const handleDisconnect = async () => {
    if (!window.confirm('¿Deseas cerrar la sesión de WhatsApp en el sistema?')) return;
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/disconnect', { method: 'POST' });
      const data = await res.json();
      setStatusData({
        status: 'disconnected',
        isConnected: false,
        phoneNumber: '',
        pushName: '',
        qrCode: null
      });
      toast.success(data.message || 'WhatsApp desconectado.');
    } catch (err) {
      toast.error('Error al desconectar: ' + err.message);
    }
  };

  // Guardar configuración
  const handleSaveConfig = async (e) => {
    e?.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Configuración guardada exitosamente.');
      }
    } catch (err) {
      toast.error('Error guardando configuración: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Enviar mensaje de prueba
  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.warning('Ingresa un número de celular de prueba.');
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`¡Mensaje de prueba enviado con éxito a ${data.to}!`);
        fetchHistory();
      } else {
        toast.error('Error enviando mensaje: ' + (data.error || 'Fallo desconocido'));
      }
    } catch (err) {
      toast.error('Error en envío de prueba: ' + err.message);
    } finally {
      setSendingTest(false);
    }
  };

  // Ejecutar despacho inmediato a los clientes urgentes de hoy
  const handleRunAutoNow = async () => {
    if (!statusData.isConnected) {
      toast.warning('Primero debes vincular tu WhatsApp escaneando el código QR.');
      return;
    }

    setRunningJob(true);
    setLastRunSummary(null);
    toast.info('Iniciando envío de recordatorios automáticos...');

    try {
      const res = await fetch('http://localhost:3001/api/whatsapp/run-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force: true,
          dryRun: false,
          clientData: { clientes, cuentas }
        })
      });
      const data = await res.json();
      setLastRunSummary(data);

      if (data.success) {
        if (data.totalSent > 0) {
          toast.success(`¡Despacho completado! Se enviaron ${data.totalSent} recordatorios.`);
        } else {
          toast.info('No hay clientes pendientes de aviso para el día de hoy.');
        }
        fetchHistory();
      } else {
        toast.error(data.message || 'Error durante la ejecución.');
      }
    } catch (err) {
      toast.error('Error ejecutando despacho automático: ' + err.message);
    } finally {
      setRunningJob(false);
    }
  };

  // Clientes urgentes actuales en memoria (≤ 2 días)
  const urgentClients = clientes.filter(c => {
    const d = calcularDiasRestantes(c.fechaVencimiento);
    return d >= 0 && d <= 2;
  });

  return (
    <div className="whatsapp-auto-view">
      {/* Cabecera Principal */}
      <div className="whatsapp-auto-header-card">
        <div className="whatsapp-header-left">
          <div className="whatsapp-logo-badge">
            <WhatsAppIcon size={26} color="#ffffff" />
          </div>
          <div>
            <h2 className="whatsapp-auto-title">
              Automatización de WhatsApp
            </h2>
            <p className="whatsapp-auto-subtitle">
              Envío 100% automático y desatendido de recordatorios de vencimiento mediante código QR.
            </p>
          </div>
        </div>

        <div className="whatsapp-header-right">
          {statusData.isConnected ? (
            <div className="status-badge-connected">
              <span className="status-dot-pulse"></span>
              <span>Conectado: <strong>{statusData.phoneNumber}</strong></span>
            </div>
          ) : (
            <div className="status-badge-disconnected">
              <span className="status-dot-off"></span>
              <span>Desconectado</span>
            </div>
          )}
        </div>
      </div>

      <div className="whatsapp-auto-grid">
        {/* COLUMNA 1: Estado de Conexión y Código QR */}
        <div className="whatsapp-card qr-card">
          <div className="card-header-clean">
            <div className="card-header-title">
              <QrCode size={19} color="#10b981" />
              <span>Conexión de WhatsApp</span>
            </div>
            {statusData.isConnected && (
              <button 
                type="button" 
                className="btn-text-danger" 
                onClick={handleDisconnect}
                title="Cerrar sesión de WhatsApp"
              >
                <Power size={14} />
                <span>Desvincular</span>
              </button>
            )}
          </div>

          <div className="card-body-clean">
            {/* 1. ESTADO: CONECTADO */}
            {statusData.isConnected ? (
              <div className="connected-box">
                <div className="connected-icon-wrapper">
                  <CheckCircle2 size={46} color="#10b981" />
                </div>
                <h3 className="connected-title">¡WhatsApp Vinculado con Éxito!</h3>
                <p className="connected-phone">{statusData.phoneNumber}</p>
                {statusData.pushName && (
                  <p className="connected-sub">Sesión: {statusData.pushName}</p>
                )}
                <div className="connected-features">
                  <div className="feature-item">
                    <ShieldCheck size={16} color="#10b981" />
                    <span>Protección anti-spam activa (pausa de 6s entre envíos)</span>
                  </div>
                  <div className="feature-item">
                    <Clock size={16} color="#6366f1" />
                    <span>Planificador automático programado en el servidor</span>
                  </div>
                </div>

                {/* Formulario rápido de prueba */}
                <div className="test-send-section">
                  <h4 className="test-send-title">
                    <Send size={14} />
                    <span>Enviar mensaje de prueba</span>
                  </h4>
                  <form onSubmit={handleSendTest} className="test-send-form">
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Ej. +51987654321" 
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={sendingTest}
                    >
                      {sendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>{sendingTest ? 'Enviando...' : 'Probar'}</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : statusData.status === 'qr_ready' && statusData.qrCode ? (
              /* 2. ESTADO: QR LISTO PARA ESCANEAR */
              <div className="qr-box">
                <div className="qr-image-wrapper">
                  <img 
                    src={statusData.qrCode} 
                    alt="Código QR de WhatsApp" 
                    className="qr-image"
                  />
                </div>
                <div className="qr-instructions">
                  <h4 className="instructions-title">Pasos para conectar:</h4>
                  <ol className="instructions-list">
                    <li>Abre WhatsApp en tu teléfono celular.</li>
                    <li>Toca en <strong>Menú (⋮)</strong> o <strong>Configuración (⚙️)</strong>.</li>
                    <li>Selecciona <strong>Dispositivos vinculados</strong>.</li>
                    <li>Toca en <strong>Vincular un dispositivo</strong> y apunta tu cámara al código QR.</li>
                  </ol>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  <RefreshCw size={14} className={connecting ? 'animate-spin' : ''} />
                  <span>Regenerar QR</span>
                </button>
              </div>
            ) : (
              /* 3. ESTADO: DESCONECTADO */
              <div className="disconnected-box">
                <div className="disconnected-icon-circle">
                  <Smartphone size={38} color="#6366f1" />
                </div>
                <h3 className="disconnected-title">Vincula tu número de WhatsApp</h3>
                <p className="disconnected-desc">
                  Escanea el código QR una sola vez desde tu teléfono para que el servidor pueda despachar los recordatorios en automático.
                </p>
                <button 
                  type="button" 
                  className="btn btn-whatsapp btn-lg"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  <WhatsAppIcon size={20} color="#ffffff" />
                  <span>{connecting ? 'Iniciando servicio...' : 'Vincular WhatsApp ahora'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 2: Configuración del Cron y Ejecución Manual */}
        <div className="whatsapp-card config-card">
          <div className="card-header-clean">
            <div className="card-header-title">
              <Settings size={19} color="#6366f1" />
              <span>Programación y Despacho</span>
            </div>
          </div>

          <div className="card-body-clean">
            {/* Panel de Despacho Inmediato */}
            <div className="manual-dispatch-card">
              <div className="dispatch-header">
                <div>
                  <h4 className="dispatch-title">Despacho Inmediato</h4>
                  <p className="dispatch-subtitle">
                    Envía los recordatorios a todos los clientes que vencen hoy o en 2 días sin esperar a la hora programada.
                  </p>
                </div>
                <span className="dispatch-badge">
                  {urgentClients.length} por vencer
                </span>
              </div>

              <button 
                type="button" 
                className="btn btn-primary btn-run-auto"
                onClick={handleRunAutoNow}
                disabled={runningJob || !statusData.isConnected}
              >
                {runningJob ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Enviando recordatorios en segundo plano...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Ejecutar Envío Automático Ahora ({urgentClients.length})</span>
                  </>
                )}
              </button>

              {lastRunSummary && (
                <div className="last-run-alert">
                  <strong>Resultado último despacho:</strong> {lastRunSummary.totalSent} enviados con éxito, {lastRunSummary.totalErrors} errores.
                </div>
              )}
            </div>

            {/* Formulario de Configuración Diaria */}
            <form onSubmit={handleSaveConfig} className="cron-config-form">
              <h4 className="config-section-title">
                <Clock size={16} />
                <span>Horario y Parámetros del Servidor</span>
              </h4>

              <div className="form-toggle-row">
                <div>
                  <label className="toggle-label">Envío automático diario</label>
                  <p className="toggle-desc">El servidor revisará y enviará recordatorios automáticamente todos los días.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={config.enabled}
                    onChange={e => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="form-grid-row">
                <div className="form-group">
                  <label className="field-label">Hora del despacho diario</label>
                  <select 
                    className="form-input"
                    value={config.sendHour}
                    onChange={e => setConfig(prev => ({ ...prev, sendHour: parseInt(e.target.value, 10) }))}
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, '0')}:00 {h >= 12 ? 'PM' : 'AM'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">Pausa anti-spam entre mensajes</label>
                  <select 
                    className="form-input"
                    value={config.delaySeconds}
                    onChange={e => setConfig(prev => ({ ...prev, delaySeconds: parseInt(e.target.value, 10) }))}
                  >
                    <option value={4}>4 segundos</option>
                    <option value={6}>6 segundos (Recomendado)</option>
                    <option value={8}>8 segundos (Máxima seguridad)</option>
                    <option value={10}>10 segundos</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary"
                disabled={savingConfig}
                style={{ width: '100%', marginTop: '10px' }}
              >
                {savingConfig ? 'Guardando...' : 'Guardar Horario y Parámetros'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Historial de Envíos Recientes */}
      <div className="whatsapp-card history-card" style={{ marginTop: '20px' }}>
        <div className="card-header-clean">
          <div className="card-header-title">
            <History size={19} color="#06b6d4" />
            <span>Registro de Recordatorios Enviados ({history.length})</span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={fetchHistory}
            disabled={loadingHistory}
          >
            <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="card-body-clean">
          {history.length === 0 ? (
            <div className="empty-history-box">
              <Bot size={32} style={{ opacity: 0.4 }} />
              <p>Aún no se han enviado recordatorios automáticos.</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Cliente</th>
                    <th>Celular</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 15).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="history-date">
                          {new Date(item.fechaEnvio).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </td>
                      <td>
                        <strong>{item.nombre}</strong>
                      </td>
                      <td>
                        <span className="history-phone">{item.celular}</span>
                      </td>
                      <td>
                        <span className="history-plat">{item.plataforma} · {item.perfil}</span>
                      </td>
                      <td>
                        {item.estado === 'enviado' ? (
                          <span className="history-status success">
                            <CheckCircle2 size={13} />
                            <span>Enviado ✓✓</span>
                          </span>
                        ) : (
                          <span className="history-status error" title={item.error}>
                            <AlertCircle size={13} />
                            <span>Error</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

