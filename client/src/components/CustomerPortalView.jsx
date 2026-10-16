import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Tv, 
  Smartphone, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  KeyRound, 
  FileText, 
  MessageSquare, 
  Copy, 
  Check, 
  Share2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { 
  calcularDiasRestantes, 
  formatearFecha, 
  cargarCodigosRecientes, 
  crearEnlaceWhatsApp 
} from '../utils/storage';
import { useToast } from '../context/ToastContext';

export function CustomerPortalView({
  clientes = [],
  cuentas = [],
  onOpenReceipt = () => {},
  onOpenWhatsApp = () => {}
}) {
  const toast = useToast();

  // Búsqueda por celular o nombre
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  // Códigos recientes guardados en el sistema
  const recentCodes = useMemo(() => cargarCodigosRecientes(), []);

  // Filtrar clientes por búsqueda de celular o nombre
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().replace(/\s+/g, '');
    return clientes.filter(c => {
      const cel = (c.celular || '').replace(/\D/g, '');
      const nom = (c.nombre || '').toLowerCase();
      return cel.includes(q) || nom.includes(searchQuery.toLowerCase());
    });
  }, [clientes, searchQuery]);

  // Cliente activo en la vista del portal
  const activeClient = useMemo(() => {
    if (selectedClientId) {
      return clientes.find(c => String(c.id) === String(selectedClientId)) || null;
    }
    if (filteredClients.length === 1) {
      return filteredClients[0];
    }
    return null;
  }, [selectedClientId, filteredClients, clientes]);

  // Cuenta y Perfil del cliente activo
  const activeAccount = useMemo(() => {
    if (!activeClient) return null;
    return cuentas.find(c => String(c.id) === String(activeClient.cuentaId)) || null;
  }, [activeClient, cuentas]);

  const activeProfile = useMemo(() => {
    if (!activeAccount || !activeClient) return null;
    return (activeAccount.perfiles || []).find(p => String(p.id) === String(activeClient.perfilId)) || null;
  }, [activeAccount, activeClient]);

  // Verificar si hay un código OTP o Hogar emitido recientemente (últimos 45 minutos) para este cliente o cuenta
  const activeRecentCode = useMemo(() => {
    if (!activeClient) return null;
    const now = Date.now();
    return recentCodes.find(item => {
      const matchClient = item.clienteId && String(item.clienteId) === String(activeClient.id);
      const matchPhone = item.clienteCelular && activeClient.celular && item.clienteCelular.includes(activeClient.celular);
      const matchAccount = item.cuentaId && String(item.cuentaId) === String(activeClient.cuentaId);
      
      const itemTime = new Date(item.fecha).getTime();
      const diffMinutes = (now - itemTime) / (1000 * 60);

      return (matchClient || matchPhone || matchAccount) && diffMinutes <= 45;
    });
  }, [activeClient, recentCodes]);

  // Cálculos de membresía
  const diasRestantes = activeClient ? calcularDiasRestantes(activeClient.fechaVencimiento) : 0;
  const porcentajeRestante = Math.max(0, Math.min(100, Math.round((diasRestantes / 30) * 100)));

  // Copiar enlace de este portal
  const handleCopyPortalLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    toast.success('Enlace del portal copiado al portapapeles');
  };

  // Copiar dato con feedback
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // Contactar a soporte
  const handleContactSupport = () => {
    const nombre = activeClient ? activeClient.nombre : 'Cliente';
    const plat = activeAccount ? activeAccount.plataforma : 'mi servicio';
    const msg = `Hola soporte de Flow Stream, soy *${nombre}*. Quisiera consultar sobre mi cuenta de *${plat}*.`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="customer-portal-container">
      {/* Encabezado del Portal */}
      <div className="portal-header-card">
        <div className="portal-header-content">
          <div className="portal-icon-badge">
            <Globe size={28} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="portal-title">Portal de Auto-Servicio del Cliente</h2>
              <span className="portal-badge-mode">Vista Cliente / Autoservicio</span>
            </div>
            <p className="portal-subtitle">
              Permite que tus clientes consulten su vigencia, PIN de seguridad, comprobante oficial y códigos de TV sin tener que esperar atención por mensaje.
            </p>
          </div>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm"
          onClick={handleCopyPortalLink}
          title="Copiar enlace del portal para compartir a clientes"
        >
          <Share2 size={15} />
          <span>Copiar Enlace del Portal</span>
        </button>
      </div>

      {/* Buscador de Cliente por WhatsApp / Celular */}
      <div className="portal-search-box">
        <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          📱 Consulta de Membresía (Ingresa el número de WhatsApp o Nombre del Cliente):
        </label>
        <div className="portal-input-wrapper">
          <Search size={18} color="#8b5cf6" className="portal-search-icon" />
          <input 
            type="text"
            className="form-input portal-search-input"
            placeholder="Ejemplo: 987654321 o nombre del cliente..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedClientId('');
            }}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="portal-clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedClientId('');
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Coincidencias rápidas si hay más de una */}
        {filteredClients.length > 1 && !selectedClientId && (
          <div className="portal-match-list">
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
              Selecciona tu registro entre las coincidencias encontradas:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filteredClients.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedClientId(c.id)}
                >
                  <span>👤 {c.nombre} ({c.celular})</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de demostración para el administrador */}
        <div className="portal-admin-quick-select">
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            ⚡ Acceso rápido (Admin):
          </span>
          <select 
            className="form-select"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem', height: '32px' }}
            value={activeClient?.id || ''}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSearchQuery('');
            }}
          >
            <option value="">-- Probar con un cliente registrado --</option>
            {clientes.map(cli => (
              <option key={cli.id} value={cli.id}>
                {cli.nombre} - {cli.celular}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RENDERIZADO DE LA TARJETA DE MEMBRESÍA */}
      {activeClient ? (
        <div className="portal-card-layout">
          {/* Tarjeta de Membresía VIP */}
          <div className="membership-vip-card">
            {/* Cabecera de la tarjeta */}
            <div className="vip-card-header">
              <div className="vip-brand-col">
                <span className="vip-logo-badge">FLOW STREAM</span>
                <span className="vip-platform-name">{activeAccount?.plataforma || 'STREAMING'}</span>
              </div>

              <div className="vip-status-col">
                {diasRestantes < 0 ? (
                  <span className="badge-danger-glow">🔴 MEMBRESÍA VENCIDA</span>
                ) : diasRestantes <= 2 ? (
                  <span className="badge-warning-glow">🟡 POR VENCER ({diasRestantes} DÍAS)</span>
                ) : (
                  <span className="badge-success-glow">🟢 SERVICIO ACTIVO</span>
                )}
              </div>
            </div>

            {/* Banner de Código Reciente si existe uno emitido en los últimos 45 min */}
            {activeRecentCode && (
              <div className="vip-active-code-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#f59e0b" />
                  <span style={{ fontWeight: 700, color: '#fef08a', fontSize: '0.9rem' }}>
                    ¡TU CÓDIGO DE PANTALLA ESTÁ LISTO!
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div className="vip-code-big">
                    {activeRecentCode.codigo}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(activeRecentCode.codigo, 'Código TV')}
                  >
                    {copiedText === 'Código TV' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedText === 'Código TV' ? '¡Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#fef3c7', display: 'block', marginTop: '4px' }}>
                  ⏱️ Ingrésalo en tu televisor de inmediato (validez de 15 minutos).
                </span>
              </div>
            )}

            {/* Datos Principales: Perfil y PIN */}
            <div className="vip-card-body">
              <div className="vip-data-grid">
                <div className="vip-data-item">
                  <span className="vip-label">TITULAR</span>
                  <span className="vip-value">{activeClient.nombre}</span>
                </div>

                <div className="vip-data-item">
                  <span className="vip-label">WHATSAPP</span>
                  <span className="vip-value">{activeClient.codigoPais} {activeClient.celular}</span>
                </div>

                <div className="vip-data-item">
                  <span className="vip-label">PERFIL ASIGNADO</span>
                  <span className="vip-value highlight">
                    📺 {activeProfile?.nombre || `Perfil ${activeProfile?.numero || 1}`}
                  </span>
                </div>

                <div className="vip-data-item">
                  <span className="vip-label">PIN DE ACCESO</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="vip-value pin-display">
                      {showPin ? (activeClient.pin || activeProfile?.pin || 'Sin PIN') : '••••'}
                    </span>
                    <button
                      type="button"
                      className="vip-pin-toggle-btn"
                      onClick={() => setShowPin(!showPin)}
                      title={showPin ? 'Ocultar PIN' : 'Ver PIN'}
                    >
                      {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    {(activeClient.pin || activeProfile?.pin) && (
                      <button
                        type="button"
                        className="vip-pin-copy-btn"
                        onClick={() => handleCopy(activeClient.pin || activeProfile?.pin, 'PIN')}
                        title="Copiar PIN"
                      >
                        {copiedText === 'PIN' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de Progreso de Membresía */}
              <div className="vip-progress-section">
                <div className="vip-progress-labels">
                  <span>Periodo: {formatearFecha(activeClient.fechaInicio)} - {formatearFecha(activeClient.fechaVencimiento)}</span>
                  <span style={{ fontWeight: 700, color: diasRestantes <= 2 ? '#f59e0b' : '#10b981' }}>
                    {diasRestantes >= 0 ? `${diasRestantes} días restantes` : `Vencido hace ${Math.abs(diasRestantes)} días`}
                  </span>
                </div>
                <div className="vip-progress-bar-track">
                  <div 
                    className="vip-progress-bar-fill"
                    style={{ 
                      width: `${porcentajeRestante}%`,
                      backgroundColor: diasRestantes <= 2 ? '#f59e0b' : diasRestantes < 0 ? '#f43f5e' : '#10b981'
                    }}
                  />
                </div>
              </div>

              {/* Botones de Autoservicio del Cliente */}
              <div className="vip-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onOpenReceipt(activeClient, activeProfile, activeAccount)}
                >
                  <FileText size={16} color="#6366f1" />
                  <span>Ver Comprobante Oficial</span>
                </button>

                <button
                  type="button"
                  className="btn btn-whatsapp-simple"
                  onClick={handleContactSupport}
                >
                  <MessageSquare size={16} />
                  <span>Contactar a Soporte</span>
                </button>
              </div>
            </div>

            {/* Reglas de uso resumidas */}
            <div className="vip-rules-footer">
              <ShieldCheck size={14} color="#10b981" />
              <span>Garantía activa • 1 pantalla en simultáneo • No cambiar credenciales.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Estado vacío si aún no busca nada */
        <div className="portal-empty-hero">
          <div className="portal-hero-circle">
            <Smartphone size={40} color="#8b5cf6" />
          </div>
          <h3 className="portal-hero-title">Ingresa tu número de WhatsApp para consultar tu cuenta</h3>
          <p className="portal-hero-desc">
            Podrás ver tu perfil asignado, PIN de pantalla, días restantes de tu suscripción y solicitar códigos de Netflix Hogar o comprobantes digitales.
          </p>
        </div>
      )}
    </div>
  );
}
