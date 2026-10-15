import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Tv, Key, Calendar, DollarSign, Layers } from 'lucide-react';
import { PLATFORMS, PLATFORMS_LIST } from '../constants/platforms';
import { getTodayDate, addDays, generarId } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export function NewAccountModal({ isOpen, onClose, onSaveAccount }) {
  const toast = useToast();
  const [plataforma, setPlataforma] = useState('Netflix');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [fechaCorte, setFechaCorte] = useState(addDays(getTodayDate(), 30));
  const [costo, setCosto] = useState('35.00');
  const [cantidadPerfiles, setCantidadPerfiles] = useState(5);
  const [proveedor, setProveedor] = useState('');
  const [notas, setNotas] = useState('');
  const [perfilesCustom, setPerfilesCustom] = useState([]);

  const generarSlotsPerfiles = (count) => {
    const arr = [];
    for (let i = 1; i <= count; i++) {
      arr.push({
        numero: i,
        nombre: `Perfil ${i}`,
        pin: `${i}${i}${i}${i}`.substring(0, 4)
      });
    }
    setPerfilesCustom(arr);
  };

  const resetForm = () => {
    setPlataforma('Netflix');
    setCorreo('');
    setPassword('');
    setFechaCorte(addDays(getTodayDate(), 30));
    setCosto('35.00');
    setProveedor('');
    setNotas('');
    const defaultCount = PLATFORMS['Netflix']?.defaultProfiles || 5;
    setCantidadPerfiles(defaultCount);
    generarSlotsPerfiles(defaultCount);
  };

  // Limpiar completamente todos los campos cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSelectPlatform = (platformId) => {
    setPlataforma(platformId);
    const defaultCount = PLATFORMS[platformId]?.defaultProfiles || 5;
    setCantidadPerfiles(defaultCount);
    generarSlotsPerfiles(defaultCount);
  };

  const handleCambiarCantidad = (num) => {
    const val = parseInt(num, 10) || 1;
    setCantidadPerfiles(val);
    generarSlotsPerfiles(val);
  };

  const handleUpdatePerfilField = (index, field, value) => {
    setPerfilesCustom(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!correo.trim() || !password.trim()) {
      toast.warning('Por favor completa el correo y la contraseña de la cuenta.', 'Campos obligatorios');
      return;
    }

    const accountId = 'cta-' + generarId();
    const nuevosPerfiles = perfilesCustom.map((p, idx) => ({
      id: `prf-${accountId}-${idx + 1}`,
      numero: p.numero,
      nombre: p.nombre.trim() || `Perfil ${p.numero}`,
      pin: p.pin.trim() || '',
      estado: 'disponible',
      clienteId: null
    }));

    const nuevaCuenta = {
      id: accountId,
      plataforma,
      correo: correo.trim(),
      password: password.trim(),
      fechaCorte,
      costo: parseFloat(costo) || 0,
      cantidadPerfiles: parseInt(cantidadPerfiles, 10),
      proveedor: proveedor.trim(),
      notas: notas.trim(),
      perfiles: nuevosPerfiles
    };

    onSaveAccount(nuevaCuenta);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Tv size={20} />
            </div>
            <div>
              <h2 className="modal-title">Registrar Cuenta Completa</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Agrega la cuenta matriz que compraste y sus pantallas / perfiles
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleCloseModal}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="modal-body">
            {/* Selección de Plataforma */}
            <div className="form-group">
              <label className="form-label">Plataforma de Streaming:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PLATFORMS_LIST.map((p) => {
                  const isSelected = plataforma === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className="pill-btn"
                      onClick={() => handleSelectPlatform(p.id)}
                      style={{
                        borderColor: isSelected ? p.color : undefined,
                        background: isSelected ? p.badgeBg : undefined,
                        color: isSelected ? '#fff' : undefined,
                        fontWeight: isSelected ? 700 : 500
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Credenciales de la Cuenta */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Correo / Usuario de Acceso:</label>
                <input 
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña de la Cuenta:</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Clave de la cuenta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Fecha de corte y cantidad de perfiles */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <span>Fecha de Renovación / Corte:</span>
                </label>
                <input 
                  type="date"
                  className="form-input"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} />
                  <span>Cantidad de Perfiles / Pantallas:</span>
                </label>
                <select 
                  className="form-select"
                  value={cantidadPerfiles}
                  onChange={(e) => handleCambiarCantidad(e.target.value)}
                >
                  <option value={1}>1 Perfil (Cuenta personal)</option>
                  <option value={2}>2 Perfiles</option>
                  <option value={3}>3 Perfiles</option>
                  <option value={4}>4 Perfiles</option>
                  <option value={5}>5 Perfiles (Estándar)</option>
                  <option value={6}>6 Perfiles (Familiar)</option>
                  <option value={7}>7 Perfiles</option>
                  <option value={8}>8 Perfiles</option>
                </select>
              </div>
            </div>

            {/* Costo y Proveedor */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Costo Mensual de la Cuenta (S/):</label>
                <input 
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="35.00"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Proveedor / Vendedor (Opcional):</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Ej. Proveedor Pedro"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                />
              </div>
            </div>

            {/* Configuración de Perfiles Iniciales */}
            <div className="form-group">
              <label className="form-label">Configuración de Pantallas / Perfiles y sus PINs:</label>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '190px',
                overflowY: 'auto'
              }}>
                {perfilesCustom.map((p, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 110px', gap: '8px', alignItems: 'center' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#c7d2fe',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      #{p.numero}
                    </div>
                    <input 
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      value={p.nombre}
                      placeholder={`Perfil ${p.numero}`}
                      onChange={(e) => handleUpdatePerfilField(idx, 'nombre', e.target.value)}
                    />
                    <input 
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                      value={p.pin}
                      placeholder="PIN (ej. 1234)"
                      onChange={(e) => handleUpdatePerfilField(idx, 'pin', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label className="form-label">Notas Adicionales (Opcional):</label>
              <input 
                type="text"
                className="form-input"
                placeholder="Ej. No cambiar contraseña, garantía de 30 días"
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
              <PlusCircle size={18} />
              <span>Guardar Cuenta y Crear Perfiles</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
