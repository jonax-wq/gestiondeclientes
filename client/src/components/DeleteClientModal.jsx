import React from 'react';
import { X, UserMinus, AlertTriangle, Phone, Calendar, KeyRound, Tv } from 'lucide-react';
import { PLATFORMS } from '../constants/platforms';
import { formatearFecha, calcularDiasRestantes } from '../utils/storage';

export function DeleteClientModal({
  isOpen,
  onClose,
  cliente,
  cuenta,
  perfil,
  onConfirmDelete
}) {
  if (!isOpen || !cliente) return null;

  const platformInfo = cuenta ? PLATFORMS[cuenta.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;
  const diasRestantes = calcularDiasRestantes(cliente.fechaVencimiento);

  const handleConfirm = () => {
    onConfirmDelete(cliente.id, cliente.perfilId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Cabecera */}
        <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
            }}>
              <UserMinus size={20} />
            </div>
            <div>
              <h2 className="modal-title modal-title-danger">Dar de Baja Cliente</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Liberar pantalla y finalizar membresía
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="modal-body" style={{ gap: '16px' }}>
          {/* Alerta de confirmación */}
          <div className="delete-alert-box">
            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>¿Estás seguro de que deseas desvincular a este cliente?</strong>
              <div className="delete-alert-sub">
                La pantalla quedará disponible inmediatamente para que puedas asignársela a un nuevo cliente.
              </div>
            </div>
          </div>

          {/* Ficha Resumen del Cliente a dar de baja */}
          <div className="modal-summary-card" style={{ flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  {cliente.nombre || 'Cliente sin nombre'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Phone size={13} style={{ color: '#25d366' }} />
                  {cliente.codigoPais} {cliente.celular}
                </span>
              </div>

              <span 
                className="platform-pill"
                style={{
                  backgroundColor: platformInfo.badgeBg,
                  color: platformInfo.textColor,
                  borderColor: platformInfo.borderColor,
                  fontSize: '0.78rem'
                }}
              >
                {platformInfo.name}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Perfil asignado:</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  {perfil ? perfil.nombre : 'Pantalla asignada'}
                </span>
              </div>

              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>PIN de seguridad:</span>
                <span className="pin-badge" style={{ padding: '1px 6px' }}>
                  {cliente.pin || 'Sin PIN'}
                </span>
              </div>

              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Vencimiento:</span>
                <span style={{ color: '#e2e8f0' }}>
                  {formatearFecha(cliente.fechaVencimiento)}
                </span>
              </div>

              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Estado actual:</span>
                <span style={{ color: diasRestantes < 0 ? '#f87171' : diasRestantes <= 2 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                  {diasRestantes < 0 
                    ? `⛔ Venció hace ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? 'día' : 'días'}` 
                    : diasRestantes === 0 
                    ? `🔥 Vence hoy` 
                    : diasRestantes === 1 
                    ? `⚠️ Vence en 1 día` 
                    : diasRestantes === 2 
                    ? `⚠️ Vence en 2 días` 
                    : `🟢 Vence en ${diasRestantes} días`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie con botones de acción */}
        <div className="modal-footer" style={{ borderTopColor: 'rgba(239, 68, 68, 0.2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderColor: 'rgba(239, 68, 68, 0.5)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
            }}
          >
            <UserMinus size={16} />
            <span>Sí, Dar de Baja y Liberar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
