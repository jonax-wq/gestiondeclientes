import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Phone, 
  KeyRound, 
  Calendar, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  Search,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { COUNTRY_CODES, PLATFORMS } from '../constants/platforms';
import { getTodayDate, addDays, formatearFecha, generarId } from '../utils/storage';

export function NewClientModal({ 
  isOpen, 
  onClose, 
  cuentas = [], 
  clientes = [],
  initialClient = null,
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

  // Estados para búsqueda y autocompletado de cliente existente
  const [selectedExistingClient, setSelectedExistingClient] = useState(null);
  const [searchExistingQuery, setSearchExistingQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const searchDropdownRef = useRef(null);
  const phoneGroupRef = useRef(null);

  // Lista única de clientes ya registrados en el sistema (deduplicados por celular)
  const uniqueClients = useMemo(() => {
    const map = new Map();
    (clientes || []).forEach(c => {
      const cleanPhone = (c.celular || '').replace(/\D/g, '');
      if (cleanPhone && !map.has(cleanPhone)) {
        map.set(cleanPhone, {
          id: c.id,
          nombre: c.nombre || `Cliente ${cleanPhone}`,
          celular: c.celular || '',
          codigoPais: c.codigoPais || '+51',
          notas: c.notas || ''
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [clientes]);

  // Filtrar cuentas que tienen al menos un perfil libre (o la cuenta preseleccionada)
  const cuentasConDisponibilidad = cuentas.filter(cta => {
    return (cta.perfiles || []).some(p => p.estado === 'disponible' || (preselectedPerfilId && String(p.id) === String(preselectedPerfilId)));
  });

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (phoneGroupRef.current && !phoneGroupRef.current.contains(e.target)) {
        setShowPhoneSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Al abrir o cambiar preselección
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setNotas('');
      setFechaInicio(getTodayDate());
      setFechaVencimiento(addDays(getTodayDate(), 30)); // Requerimiento: 30 días de duración
      setSearchExistingQuery('');
      setShowSearchDropdown(false);
      setShowPhoneSuggestions(false);

      if (initialClient) {
        setNombre(initialClient.nombre || '');
        setCelular(initialClient.celular || '');
        setCodigoPais(initialClient.codigoPais || '+51');
        setNotas(initialClient.notas || '');
        setSelectedExistingClient(initialClient);
      } else {
        setNombre('');
        setCelular('');
        setSelectedExistingClient(null);
      }

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
  }, [isOpen, preselectedCuentaId, preselectedPerfilId, initialClient]);

  // Selección de cliente existente
  const handleSelectExistingClient = (client) => {
    setCodigoPais(client.codigoPais || '+51');
    setCelular(client.celular || '');
    setNombre(client.nombre || '');
    if (client.notas && !notas) {
      setNotas(client.notas);
    }
    setSelectedExistingClient(client);
    setShowPhoneSuggestions(false);
    setShowSearchDropdown(false);
    setSearchExistingQuery('');
  };

  const handleClearExistingClient = () => {
    setSelectedExistingClient(null);
    setCelular('');
    setNombre('');
    setNotas('');
    setShowPhoneSuggestions(false);
  };

  // Sugerencias en tiempo real al escribir celular
  const phoneSuggestions = useMemo(() => {
    if (selectedExistingClient) return [];
    const query = celular.trim();
    if (!query || query.length < 2) return [];

    const cleanNum = query.replace(/\D/g, '');
    return uniqueClients.filter(c => {
      const cNum = (c.celular || '').replace(/\D/g, '');
      return cleanNum && cNum.includes(cleanNum);
    }).slice(0, 5);
  }, [celular, uniqueClients, selectedExistingClient]);

  // Resultados del buscador rápido superior
  const searchResults = useMemo(() => {
    if (!searchExistingQuery.trim()) return uniqueClients.slice(0, 6);
    const q = searchExistingQuery.toLowerCase().trim();
    const qNum = q.replace(/\D/g, '');

    return uniqueClients.filter(c => {
      const cNum = (c.celular || '').replace(/\D/g, '');
      const matchNum = qNum && cNum.includes(qNum);
      const matchName = (c.nombre || '').toLowerCase().includes(q);
      return matchNum || matchName;
    }).slice(0, 8);
  }, [searchExistingQuery, uniqueClients]);

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
    setSelectedExistingClient(null);
    setShowPhoneSuggestions(false);
    setShowSearchDropdown(false);
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
    setSelectedExistingClient(null);
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
              <h2 className="modal-title">Asignar Nuevo Perfil / Cliente</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Asigna un perfil con PIN y membresía por 30 días a un cliente nuevo o recurrente
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
                gap: '8px',
                marginBottom: '12px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* A. CLIENTE EXISTENTE SELECCIONADO (Banner visual) */}
            {selectedExistingClient ? (
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    flexShrink: 0
                  }}>
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>
                      {nombre} <span style={{ color: '#818cf8', fontWeight: 500 }}>({codigoPais} {celular})</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                      Asignando servicio adicional a este cliente recurrente
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearExistingClient}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                  title="Cambiar cliente o escribir datos nuevos"
                >
                  <X size={12} />
                  <span>Cambiar</span>
                </button>
              </div>
            ) : uniqueClients.length > 0 && (
              /* B. BUSCADOR RÁPIDO DE CLIENTE REGISTRADO */
              <div ref={searchDropdownRef} style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#a5b4fc'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: '#818cf8' }} />
                    <span>¿Es un cliente recurrente? Búscalo aquí:</span>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {uniqueClients.length} registrados
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '34px', fontSize: '0.84rem' }}
                    placeholder="Escribe su nombre o celular para autocompletar..."
                    value={searchExistingQuery}
                    onChange={(e) => {
                      setSearchExistingQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                  />
                  {searchExistingQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchExistingQuery(''); setShowSearchDropdown(false); }}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown de coincidencias */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 60,
                      marginTop: '4px',
                      background: 'var(--bg-card, #1e293b)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      borderRadius: '8px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                      maxHeight: '220px',
                      overflowY: 'auto'
                    }}
                  >
                    <div style={{ padding: '6px 12px', fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      Haz clic en un cliente para cargar sus datos automáticamente:
                    </div>
                    {searchResults.map((c) => (
                      <div
                        key={c.celular}
                        onClick={() => handleSelectExistingClient(c)}
                        style={{
                          padding: '9px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserCheck size={15} style={{ color: '#818cf8' }} />
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9' }}>{c.nombre}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.codigoPais} {c.celular}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Seleccionar
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. Número de celular del cliente con autocompletado reactivo */}
            <div className="form-group" ref={phoneGroupRef}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: '#25d366' }} />
                <span>Número de Celular (WhatsApp) *</span>
              </label>
              <div className="phone-input-group" style={{ position: 'relative' }}>
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
                  onChange={(e) => {
                    setCelular(e.target.value);
                    setShowPhoneSuggestions(true);
                    if (selectedExistingClient && e.target.value !== selectedExistingClient.celular) {
                      setSelectedExistingClient(null);
                    }
                  }}
                  onFocus={() => setShowPhoneSuggestions(true)}
                  autoFocus={!selectedExistingClient}
                  required
                />

                {/* Sugerencias flotantes al escribir el número de teléfono */}
                {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 55,
                    marginTop: '4px',
                    background: 'var(--bg-card, #1e293b)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.55)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '6px 12px', fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      Coincidencias encontradas (haz clic para autocompletar):
                    </div>
                    {phoneSuggestions.map((sug) => (
                      <div
                        key={sug.celular}
                        onClick={() => handleSelectExistingClient(sug)}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserCheck size={14} style={{ color: '#818cf8' }} />
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9' }}>{sug.nombre}</span>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>({sug.codigoPais} {sug.celular})</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>Autocompletar</span>
                      </div>
                    ))}
                  </div>
                )}
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
            <div className="info-alert-banner">
              <span>⚡</span>
              <span>
                <strong>Membresía activa por 30 días.</strong> Finalizará el <strong>{formatearFecha(fechaVencimiento)}</strong>. El sistema te alertará automáticamente con un icono de WhatsApp cuando le falten 2 días.
              </span>
            </div>

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
