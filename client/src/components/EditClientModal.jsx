import React, { useState, useEffect } from 'react';
import { X, Edit, Phone, KeyRound, Calendar, AlertCircle, AlertTriangle, PlusCircle } from 'lucide-react';
import { COUNTRY_CODES, PLATFORMS } from '../constants/platforms';
import { formatearFecha, addDays, getTodayDate, verificarDesfase } from '../utils/storage';

export function EditClientModal({ 
  isOpen, 
  onClose, 
  cliente, 
  cuentas = [], 
  onUpdateClient 
}) {
  const [nombre, setNombre] = useState('');
  const [codigoPais, setCodigoPais] = useState('+51');
  const [celular, setCelular] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [perfilId, setPerfilId] = useState('');
  const [pin, setPin] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [precioCobrado, setPrecioCobrado] = useState('');
  const [notas, setNotas] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre || '');
      setCodigoPais(cliente.codigoPais || '+51');
      setCelular(cliente.celular || '');
      setCuentaId(cliente.cuentaId || '');
      setPerfilId(cliente.perfilId || '');
      setPin(cliente.pin || '');
      setFechaInicio(cliente.fechaInicio || getTodayDate());
      setFechaVencimiento(cliente.fechaVencimiento || addDays(getTodayDate(), 30));
      setPrecioCobrado(cliente.precioCobrado != null ? String(cliente.precioCobrado) : '12.00');
      setNotas(cliente.notas || '');
      setErrorMsg('');
    }
  }, [cliente, isOpen]);

  if (!isOpen || !cliente) return null;

  // Cuentas disponibles o la cuenta actual
  const cuentaActual = cuentas.find(c => String(c.id) === String(cuentaId));
  const perfilesDeCuenta = (cuentaActual?.perfiles || []).filter(
    p => p.estado === 'disponible' || String(p.id) === String(cliente.perfilId)
  );

  const handleSumar30Dias = () => {
    setFechaVencimiento(addDays(fechaVencimiento || getTodayDate(), 30));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!celular.trim()) {
      setErrorMsg('El número de celular es obligatorio.');
      return;
    }

    const clienteActualizado = {
      ...cliente,
      nombre: nombre.trim() || `Cliente ${celular.trim()}`,
      codigoPais,
      celular: celular.trim(),
      cuentaId,
      perfilId,
      pin: pin.trim(),
      fechaInicio,
      fechaVencimiento,
      precioCobrado: parseFloat(precioCobrado) || 0,
      notas: notas.trim()
    };

    onUpdateClient(clienteActualizado, String(cliente.perfilId) !== String(perfilId) ? cliente.perfilId : null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Edit size={20} />
            </div>
            <div>
              <h2 className="modal-title">Editar Cliente</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Modifica los datos del cliente, membresía o reasigna pantalla
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Celular y Nombre */}
            <div className="form-group">
              <label className="form-label">Número de Celular (WhatsApp) *</label>
              <div className="phone-input-group">
                <select 
                  className="form-select country-select"
                  value={codigoPais}
                  onChange={(e) => setCodigoPais(e.target.value)}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.country})
                    </option>
                  ))}
                </select>
                <input 
                  type="tel"
                  className="form-input"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre o Alias del Cliente:</label>
              <input 
                type="text"
                className="form-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>

            {/* Cuenta y Perfil */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cuenta Matriz:</label>
                <select 
                  className="form-select"
                  value={cuentaId}
                  onChange={(e) => {
                    setCuentaId(e.target.value);
                    const cta = cuentas.find(c => c.id === e.target.value);
                    const primerLibre = cta?.perfiles?.find(p => p.estado === 'disponible');
                    if (primerLibre) {
                      setPerfilId(primerLibre.id);
                      setPin(primerLibre.pin || '');
                    }
                  }}
                >
                  {cuentas.map(cta => (
                    <option key={cta.id} value={cta.id}>
                      {cta.plataforma} ({cta.correo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Perfil Asignado:</label>
                <select 
                  className="form-select"
                  value={perfilId}
                  onChange={(e) => {
                    setPerfilId(e.target.value);
                    const prf = cuentaActual?.perfiles?.find(p => p.id === e.target.value);
                    if (prf?.pin) setPin(prf.pin);
                  }}
                >
                  {perfilesDeCuenta.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.pin ? `(PIN: ${p.pin})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PIN y Precio */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">PIN Asignado al Perfil:</label>
                <input 
                  type="text"
                  className="form-input"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ej. 1234"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Precio Cobrado (S/):</label>
                <input 
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={precioCobrado}
                  onChange={(e) => setPrecioCobrado(e.target.value)}
                />
              </div>
            </div>

            {/* Fechas de inicio y vencimiento */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha de Inicio:</label>
                <input 
                  type="date"
                  className="form-input"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Fecha de Vencimiento:</label>
                  <button 
                    type="button"
                    onClick={handleSumar30Dias}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    +30 días
                  </button>
                </div>
                <input 
                  type="date"
                  className="form-input"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Alerta de Desfase en Edición */}
            {(() => {
              const desfase = verificarDesfase(cuentaActual?.fechaCorte, fechaVencimiento);
              if (!desfase.tieneDesfase) return null;
              return (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  color: '#fef08a',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '14px'
                }}>
                  <AlertTriangle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '2px' }}>
                      ⚠️ Alerta de Riesgo de Desfase:
                    </strong>
                    <span>
                      La cuenta maestra vence el <strong>{formatearFecha(cuentaActual.fechaCorte)}</strong> ({desfase.diasDiferencia} días antes que este cliente). 
                      Deberás renovar la cuenta maestra oportunamente para evitar cortes de servicio.
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Notas */}
            <div className="form-group">
              <label className="form-label">Notas Adicionales:</label>
              <input 
                type="text"
                className="form-input"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas u observaciones"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Edit size={16} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
