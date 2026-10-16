import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Calendar,
  Shield,
  Sparkles,
  Save,
  RotateCcw
} from 'lucide-react';
import {
  generarPlantillaWhatsApp,
  construirEnlaceWhatsApp,
  calcularDiasRestantes,
  formatearFecha,
  guardarPlantillaCustom,
  restaurarPlantillaDefecto
} from '../utils/storage';
import { isSupabaseConfigured, guardarPlantillaEnSupabase } from '../utils/supabaseClient';
import { PLATFORMS } from '../constants/platforms';
import { WhatsAppIcon, WhatsAppBadgeIcon } from './icons/WhatsAppIcon';
import { useToast } from '../context/ToastContext';

export function WhatsAppModal({
  cliente,
  perfil,
  cuenta,
  isOpen,
  onClose,
  onMarkSent,
  initialTemplate = null
}) {
  const toast = useToast();
  const [tipoPlantilla, setTipoPlantilla] = useState(initialTemplate || 'recordatorio_2dias');
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Inicializar plantilla según los días restantes o plantilla inicial especificada
  useEffect(() => {
    if (cliente) {
      let plantillaInicial = initialTemplate;
      if (!plantillaInicial) {
        const dias = calcularDiasRestantes(cliente.fechaVencimiento);
        if (dias === 0) {
          plantillaInicial = 'vence_hoy';
        } else if (dias < 0) {
          plantillaInicial = 'vencido';
        } else if (dias > 5) {
          plantillaInicial = 'entrega_cuenta';
        } else {
          plantillaInicial = 'recordatorio_2dias';
        }
      }
      setTipoPlantilla(plantillaInicial);
      const texto = generarPlantillaWhatsApp(plantillaInicial, cliente, perfil, cuenta);
      setMensajeTexto(texto);
    }
  }, [cliente, perfil, cuenta, initialTemplate]);

  if (!isOpen || !cliente) return null;

  const diasRestantes = calcularDiasRestantes(cliente.fechaVencimiento);
  const platformInfo = cuenta ? PLATFORMS[cuenta.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;

  const handleCambiarPlantilla = (nuevaPlantilla) => {
    setTipoPlantilla(nuevaPlantilla);
    const texto = generarPlantillaWhatsApp(nuevaPlantilla, cliente, perfil, cuenta);
    setMensajeTexto(texto);
  };

  const handleCopiarMensaje = () => {
    navigator.clipboard.writeText(mensajeTexto);
    setCopiado(true);
    toast.success('Mensaje de WhatsApp copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleGuardarPlantilla = async () => {
    const res = guardarPlantillaCustom(tipoPlantilla, mensajeTexto, cliente, perfil, cuenta);
    if (isSupabaseConfigured && res.plantillaGuardada) {
      await guardarPlantillaEnSupabase(tipoPlantilla, res.plantillaGuardada);
    }
    setGuardadoExitoso(true);
    toast.success('Plantilla personalizada guardada con éxito');
    setTimeout(() => setGuardadoExitoso(false), 3500);
  };

  const handleInsertarVariable = (tag) => {
    setMensajeTexto(prev => prev + ` ${tag}`);
  };

  const handleRestaurarDefecto = async () => {
    const defecto = restaurarPlantillaDefecto(tipoPlantilla);
    if (isSupabaseConfigured && defecto) {
      await guardarPlantillaEnSupabase(tipoPlantilla, defecto);
    }
    const texto = generarPlantillaWhatsApp(tipoPlantilla, cliente, perfil, cuenta);
    setMensajeTexto(texto);
    toast.info('Plantilla restablecida a su versión original');
  };

  const handleEnviarWhatsApp = () => {
    const enlace = construirEnlaceWhatsApp(cliente.codigoPais, cliente.celular, mensajeTexto);
    window.open(enlace, '_blank', 'noopener,noreferrer');
    if (onMarkSent) {
      onMarkSent(cliente.id);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Cabecera */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <WhatsAppBadgeIcon size={38} />
            <div>
              <h2 className="modal-title">Enviar Mensaje por WhatsApp</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Chat directo a {cliente.codigoPais} {cliente.celular} ({cliente.nombre || 'Cliente'})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="modal-body">
          {/* Tarjeta resumen del cliente y servicio */}
          <div className="modal-summary-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  className="platform-pill"
                  style={{
                    backgroundColor: platformInfo.badgeBg,
                    color: platformInfo.textColor,
                    borderColor: platformInfo.borderColor
                  }}
                >
                  {platformInfo.name}
                </span>
                <span className="modal-summary-title">
                  {perfil ? perfil.nombre : 'Perfil asignado'}
                </span>
                <span className="pin-badge">PIN: {cliente.pin || 'Sin PIN'}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> {cliente.codigoPais} {cliente.celular}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> Vence: {formatearFecha(cliente.fechaVencimiento)}
                </span>
              </div>
            </div>

            {/* Badge de alerta de días */}
            <div>
              {diasRestantes < 0 && (
                <span className="expiry-tag expired">
                  ⛔ Venció hace {Math.abs(diasRestantes)} {Math.abs(diasRestantes) === 1 ? 'día' : 'días'}
                </span>
              )}
              {diasRestantes === 0 && (
                <span className="expiry-tag urgent-today pulse-attention">
                  🔥 Vence hoy
                </span>
              )}
              {diasRestantes === 1 && (
                <span className="expiry-tag urgent-2 pulse-amber">
                  ⚠️ Vence en 1 día
                </span>
              )}
              {diasRestantes === 2 && (
                <span className="expiry-tag urgent-2 pulse-amber">
                  ⚠️ Vence en 2 días
                </span>
              )}
              {diasRestantes > 2 && (
                <span className="expiry-tag active">
                  🟢 Vence en {diasRestantes} días
                </span>
              )}
            </div>
          </div>

          {/* Selector de plantilla de mensaje */}
          <div className="form-group">
            <label className="form-label">Seleccionar Plantilla de Mensaje:</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`pill-btn ${tipoPlantilla === 'recordatorio_2dias' ? 'active' : ''}`}
                onClick={() => handleCambiarPlantilla('recordatorio_2dias')}
              >
                🔔 Recordatorio (2 Días)
              </button>
              <button
                type="button"
                className={`pill-btn ${tipoPlantilla === 'vence_hoy' ? 'active' : ''}`}
                onClick={() => handleCambiarPlantilla('vence_hoy')}
              >
                🔥 Vence Hoy
              </button>
              <button
                type="button"
                className={`pill-btn ${tipoPlantilla === 'entrega_cuenta' ? 'active' : ''}`}
                onClick={() => handleCambiarPlantilla('entrega_cuenta')}
              >
                🎉 Entrega de Datos
              </button>
              <button
                type="button"
                className={`pill-btn ${tipoPlantilla === 'gracias_renovacion' ? 'active' : ''}`}
                onClick={() => handleCambiarPlantilla('gracias_renovacion')}
                style={{ borderColor: tipoPlantilla === 'gracias_renovacion' ? '#fbbf24' : undefined }}
              >
                ⭐ Gracias por Renovar
              </button>
              <button
                type="button"
                className={`pill-btn ${tipoPlantilla === 'vencido' ? 'active' : ''}`}
                onClick={() => handleCambiarPlantilla('vencido')}
              >
                ⚠️ Vencido
              </button>
            </div>
          </div>

          {/* Editor de mensaje */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <label className="form-label">Mensaje a Enviar (puedes editarlo):</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleGuardarPlantilla}
                  style={{
                    background: guardadoExitoso ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid ' + (guardadoExitoso ? '#10b981' : 'rgba(99, 102, 241, 0.5)'),
                    color: guardadoExitoso ? '#34d399' : '#a5b4fc',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Guardar este mensaje para usarlo en todos los próximos envíos de esta plantilla"
                >
                  {guardadoExitoso ? <Check size={13} /> : <Save size={13} />}
                  <span>{guardadoExitoso ? '¡Plantilla Guardada!' : '💾 Guardar Plantilla'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestaurarDefecto}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    cursor: 'pointer'
                  }}
                  title="Restaurar a la plantilla original de fábrica"
                >
                  <RotateCcw size={12} />
                  <span>Restaurar</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopiarMensaje}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiado ? '#34d399' : '#94a3b8',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    cursor: 'pointer'
                  }}
                >
                  {copiado ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
            <textarea
              className="form-textarea"
              rows={6}
              value={mensajeTexto}
              onChange={(e) => setMensajeTexto(e.target.value)}
              style={{ fontSize: '0.88rem', lineHeight: '1.4' }}
            />

            {/* Chips de variables automáticas */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Insertar dato del cliente:</span>
              {[
                { tag: '{nombre}', label: '👤 {nombre}' },
                { tag: '{plataforma}', label: '📺 {plataforma}' },
                { tag: '{perfil}', label: '🔖 {perfil}' },
                { tag: '{pin}', label: '🔑 {pin}' },
                { tag: '{fecha}', label: '📅 {fecha}' },
                { tag: '{dias}', label: '⏳ {dias}' }
              ].map(v => (
                <button
                  key={v.tag}
                  type="button"
                  className="var-chip-btn"
                  onClick={() => handleInsertarVariable(v.tag)}
                  title={`Insertar ${v.tag} en el mensaje`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Barra de acción destacada para guardar plantilla para todos */}
            <div className="modal-callout-box">
              <span className="modal-callout-text">
                ¿Deseas que este texto sea la plantilla fija para todos los clientes?
              </span>
              <button
                type="button"
                onClick={handleGuardarPlantilla}
                style={{
                  background: guardadoExitoso ? '#10b981' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                }}
              >
                {guardadoExitoso ? <Check size={14} /> : <Save size={14} />}
                <span>{guardadoExitoso ? '✅ ¡Plantilla Guardada!' : '💾 Guardar para todos'}</span>
              </button>
            </div>

            {guardadoExitoso && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                color: '#6ee7b7',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '4px'
              }}>
                <Check size={14} />
                <span>
                  <strong>¡Plantilla guardada para todos los clientes!</strong> Al abrir cualquier otro cliente, se usará este nuevo texto insertando su nombre y perfil correspondiente.
                </span>
              </div>
            )}
          </div>

          {/* Vista previa con estilo de WhatsApp */}
          <div className="whatsapp-preview-box">
            <span style={{ fontSize: '0.72rem', color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vista previa en WhatsApp
            </span>
            <div className="wa-bubble">
              {mensajeTexto}
              <div style={{
                fontSize: '0.68rem',
                color: '#8696a0',
                textAlign: 'right',
                marginTop: '6px'
              }}>
                Ahora ✓✓
              </div>
            </div>
          </div>
        </div>

        {/* Pie de modal con botón de envío */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-whatsapp"
            onClick={handleEnviarWhatsApp}
            style={{ padding: '10px 22px', fontSize: '0.95rem' }}
          >
            <WhatsAppIcon size={19} color="#063c19" />
            <span>Abrir Chat en WhatsApp</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
