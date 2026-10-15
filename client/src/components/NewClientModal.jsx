import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, KeyRound, Calendar, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { COUNTRY_CODES, PLATFORMS } from '../constants/platforms';
import { getTodayDate, addDays, formatearFecha, generarId, verificarDesfase } from '../utils/storage';

export function NewClientModal({ 
  isOpen, 
  onClose, 
  cuentas = [], 
  onSaveClient, 
  preselectedPerfilId = null,
  preselectedCuentaId = null 
}) {
  const [codigoPais, setCodigoPais] = useState('+51');
  const [celular, setCelular] = useState('');
  const [nombre, setNombre] = useState('');
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState('');
  const [perfilSeleccionadoId, setPerfilSeleccionadoId] = useState('');
  const [pin, setPin] = useState('');
  const [fechaInicio, setFechaInicio] = useState(getTodayDate());
  const [fechaVencimiento, setFechaVencimiento] = useState(addDays(getTodayDate(), 30));
  const [precioCobrado, setPrecioCobrado] = useState('12.00');
  const [notas, setNotas] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtrar cuentas que tienen al menos un perfil libre (o la cuenta preseleccionada)
  const cuentasConDisponibilidad = cuentas.filter(cta => {
    return (cta.perfiles || []).some(p => p.estado === 'disponible' || (preselectedPerfilId && String(p.id) === String(preselectedPerfilId)));
  });

  // Al abrir o cambiar preselección
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setNombre('');
      setCelular('');
      setNotas('');
      setFechaInicio(getTodayDate());
      setFechaVencimiento(addDays(getTodayDate(), 30)); // Requerimiento: 30 días de duración

      if (preselectedCuentaId && preselectedPerfilId) {
        setCuentaSeleccionadaId(preselectedCuentaId);
        setPerfilSeleccionadoId(preselectedPerfilId);
        const cta = cuentas.find(c => String(c.id) === String(preselectedCuentaId));
        const prf = cta?.perfiles?.find(p => String(p.id) === String(preselectedPerfilId));
        if (prf) setPin(prf.pin || '');
      } else if (cuentasConDisponibilidad.length > 0) {
        const primeraCuenta = cuentasConDisponibilidad[0];
        setCuentaSeleccionadaId(primeraCuenta.id);
        const primerPerfilLibre = primeraCuenta.perfiles?.find(p => p.estado === 'disponible');
        if (primerPerfilLibre) {
          setPerfilSeleccionadoId(primerPerfilLibre.id);
          setPin(primerPerfilLibre.pin || '');
        }
      } else {
        setCuentaSeleccionadaId('');
        setPerfilSeleccionadoId('');
        setPin('');
      }
    }
  }, [isOpen, preselectedCuentaId, preselectedPerfilId]);

  // Al cambiar la cuenta seleccionada
  const handleCambiarCuenta = (ctaId) => {
    setCuentaSeleccionadaId(ctaId);
    const cta = cuentas.find(c => String(c.id) === String(ctaId));
    const primerPerfilLibre = cta?.perfiles?.find(p => p.estado === 'disponible');
    if (primerPerfilLibre) {
      setPerfilSeleccionadoId(primerPerfilLibre.id);
      setPin(primerPerfilLibre.pin || '');
    } else {
      setPerfilSeleccionadoId('');
      setPin('');
    }
  };

  // Al cambiar el perfil seleccionado
  const handleCambiarPerfil = (prfId) => {
    setPerfilSeleccionadoId(prfId);
    const cta = cuentas.find(c => String(c.id) === String(cuentaSeleccionadaId));
    const prf = cta?.perfiles?.find(p => String(p.id) === String(prfId));
    if (prf) {
      setPin(prf.pin || '');
    }
  };

  // Al cambiar fecha de inicio, recalcular automáticamente los 30 días
  const handleCambiarFechaInicio = (nuevaFecha) => {
    setFechaInicio(nuevaFecha);
    setFechaVencimiento(addDays(nuevaFecha, 30));
  };

  // Obtener perfiles disponibles de la cuenta actual
  const cuentaActual = cuentas.find(c => String(c.id) === String(cuentaSeleccionadaId));
  const perfilesDisponiblesCuenta = (cuentaActual?.perfiles || []).filter(
    p => p.estado === 'disponible' || (preselectedPerfilId && String(p.id) === String(preselectedPerfilId))
  );

  const handleCloseModal = () => {
    setNombre('');
    setCelular('');
    setNotas('');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!celular.trim()) {
      setErrorMsg('Por favor ingresa el número de celular del cliente.');
      return;
    }
    if (!cuentaSeleccionadaId || !perfilSeleccionadoId) {
      setErrorMsg('Debes seleccionar una cuenta y un perfil libre para asignar.');
      return;
    }

    const celularLimpio = celular.trim();
    const nuevoCliente = {
      id: 'cli-' + generarId(),
      nombre: nombre.trim() || `Cliente ${celularLimpio}`,
      codigoPais,
      celular: celularLimpio,
      celularCompleto: `${codigoPais}${celularLimpio}`,
      cuentaId: cuentaSeleccionadaId,
      perfilId: perfilSeleccionadoId,
      pin: pin.trim(),
      fechaInicio,
      fechaVencimiento, // Exactamente 30 días
      precioCobrado: parseFloat(precioCobrado) || 0,
      recordatorioEnviado: false,
      notas: notas.trim()
    };

    onSaveClient(nuevoCliente);

    // Limpiar campos para la próxima apertura
    setNombre('');
    setCelular('');
    setNotas('');
    setErrorMsg('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="modal-title">Asignar Nuevo Cliente</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Registra el celular, asigna su perfil con PIN y membresía por 30 días
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleCloseModal}>
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

            {/* 1. Número de celular del cliente (Requerimiento) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: '#25d366' }} />
                <span>Número de Celular (WhatsApp) *</span>
              </label>
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
                  placeholder="Ej. 987654321"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Nombre o Alias */}
            <div className="form-group">
              <label className="form-label">Nombre o Alias del Cliente (Opcional):</label>
              <input 
                type="text"
                className="form-input"
                placeholder="Ej. Carlos Mendoza"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            {/* 2. Asignación de Cuenta y Perfil (Requerimiento) */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cuenta Matriz:</label>
                <select 
                  className="form-select"
                  value={cuentaSeleccionadaId}
                  onChange={(e) => handleCambiarCuenta(e.target.value)}
                  required
                >
                  {cuentasConDisponibilidad.length === 0 ? (
                    <option value="">No hay cuentas con perfiles libres</option>
                  ) : (
                    cuentasConDisponibilidad.map((cta) => {
                      const libres = (cta.perfiles || []).filter(p => p.estado === 'disponible').length;
                      return (
                        <option key={cta.id} value={cta.id}>
                          {cta.plataforma} ({cta.correo}) - {libres} libres
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Perfil Asignado:</label>
                <select 
                  className="form-select"
                  value={perfilSeleccionadoId}
                  onChange={(e) => handleCambiarPerfil(e.target.value)}
                  required
                >
                  {perfilesDisponiblesCuenta.length === 0 ? (
                    <option value="">Sin perfiles libres</option>
                  ) : (
                    perfilesDisponiblesCuenta.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre || `Perfil ${p.numero}`} {p.pin ? `(PIN: ${p.pin})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* 3. PIN Asignado al cliente (Requerimiento) */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={14} style={{ color: '#fbbf24' }} />
                  <span>PIN del Perfil Asignado *</span>
                </label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Ej. 1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Este código se le enviará al cliente para acceder a su perfil
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Precio Cobrado (S/):</label>
                <input 
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="12.00"
                  value={precioCobrado}
                  onChange={(e) => setPrecioCobrado(e.target.value)}
                />
              </div>
            </div>

            {/* 4. Fecha de inicio y Fecha de Vencimiento de 30 días (Requerimiento) */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <span>Fecha de Inicio:</span>
                </label>
                <input 
                  type="date"
                  className="form-input"
                  value={fechaInicio}
                  onChange={(e) => handleCambiarFechaInicio(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: '#6366f1' }} />
                  <span>Fecha de Vencimiento (30 días):</span>
                </label>
                <input 
                  type="date"
                  className="form-input"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Banner recordatorio de los 30 días */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: '#c7d2fe',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚡</span>
              <span>
                <strong>Membresía activa por 30 días.</strong> Finalizará el <strong>{formatearFecha(fechaVencimiento)}</strong>. El sistema te alertará automáticamente con un icono de WhatsApp cuando le falten 2 días.
              </span>
            </div>

            {/* Alerta de Riesgo de Desfase */}
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
                  marginTop: '10px'
                }}>
                  <AlertTriangle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '2px' }}>
                      ⚠️ Alerta de Riesgo de Desfase:
                    </strong>
                    <span>
                      La cuenta maestra vencerá el <strong>{formatearFecha(cuentaActual.fechaCorte)}</strong> ({desfase.diasDiferencia} días antes que este cliente). 
                      Recuerda que deberás renovar la cuenta maestra oportunamente para que este perfil no sufra corte de servicio.
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Notas opcionales */}
            <div className="form-group">
              <label className="form-label">Notas Adicionales (Opcional):</label>
              <input 
                type="text"
                className="form-input"
                placeholder="Ej. Pagó por transferencia, cliente recomendado..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={18} />
              <span>Guardar y Asignar Perfil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
