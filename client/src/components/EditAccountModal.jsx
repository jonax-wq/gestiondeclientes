import React, { useState, useEffect } from 'react';
import { X, Edit, Tv, Calendar, DollarSign, Layers, PlusCircle, RefreshCw } from 'lucide-react';
import { PLATFORMS, PLATFORMS_LIST } from '../constants/platforms';
import { addDays, formatearFecha, getTodayDate } from '../utils/storage';

export function EditAccountModal({ 
  isOpen, 
  onClose, 
  cuenta, 
  onUpdateAccount 
}) {
  const [plataforma, setPlataforma] = useState('Netflix');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [fechaCorte, setFechaCorte] = useState('');
  const [costo, setCosto] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [notas, setNotas] = useState('');
  const [perfiles, setPerfiles] = useState([]);

  useEffect(() => {
    if (cuenta) {
      setPlataforma(cuenta.plataforma || 'Netflix');
      setCorreo(cuenta.correo || '');
      setPassword(cuenta.password || '');
      setFechaCorte(cuenta.fechaCorte || '');
      setCosto(cuenta.costo != null ? String(cuenta.costo) : '35.00');
      setProveedor(cuenta.proveedor || '');
      setNotas(cuenta.notas || '');
      setPerfiles(cuenta.perfiles ? [...cuenta.perfiles] : []);
    }
  }, [cuenta, isOpen]);

  if (!isOpen || !cuenta) return null;

  const handleRenovar30Dias = () => {
    setFechaCorte(addDays(fechaCorte || getTodayDate(), 30));
  };

  const handleUpdatePerfil = (index, field, value) => {
    setPerfiles(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!correo.trim() || !password.trim()) {
      alert('Correo y contraseña son obligatorios.');
      return;
    }

    const cuentaActualizada = {
      ...cuenta,
      plataforma,
      correo: correo.trim(),
      password: password.trim(),
      fechaCorte,
      costo: parseFloat(costo) || 0,
      proveedor: proveedor.trim(),
      notas: notas.trim(),
      perfiles
    };

    onUpdateAccount(cuentaActualizada);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
              <h2 className="modal-title">Editar Cuenta Maestra</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Actualiza credenciales, costo mensual o renueva la fecha de corte
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Selección de Plataforma */}
            <div className="form-group">
              <label className="form-label">Plataforma:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PLATFORMS_LIST.map((p) => {
                  const isSelected = plataforma === p.id || plataforma === p.name;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      className="pill-btn"
                      onClick={() => setPlataforma(p.id)}
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

            {/* Credenciales */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Correo / Usuario de Acceso:</label>
                <input 
                  type="email"
                  className="form-input"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña de la Cuenta:</label>
                <input 
                  type="text"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Fecha de corte con botón de renovación mensual */}
            <div className="form-row">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>Fecha de Renovación / Corte:</span>
                  </label>
                  <button 
                    type="button"
                    onClick={handleRenovar30Dias}
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.72rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    title="Sumar 30 días a la fecha de corte"
                  >
                    <RefreshCw size={11} />
                    <span>+30 días</span>
                  </button>
                </div>
                <input 
                  type="date"
                  className="form-input"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Costo Mensual de la Cuenta (S/):</label>
                <input 
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
              </div>
            </div>

            {/* Proveedor y Notas */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Proveedor / Vendedor:</label>
                <input 
                  type="text"
                  className="form-input"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Ej. Proveedor Alfa"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas Adicionales:</label>
                <input 
                  type="text"
                  className="form-input"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Garantía, observaciones..."
                />
              </div>
            </div>

            {/* Edición de nombres y PINs de perfiles */}
            <div className="form-group">
              <label className="form-label">Pantallas / Perfiles y sus PINs:</label>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '180px',
                overflowY: 'auto'
              }} className="custom-scroll">
                {perfiles.map((p, idx) => (
                  <div key={p.id || idx} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 110px', gap: '8px', alignItems: 'center' }}>
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
                      onChange={(e) => handleUpdatePerfil(idx, 'nombre', e.target.value)}
                    />
                    <input 
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                      value={p.pin || ''}
                      placeholder="PIN"
                      onChange={(e) => handleUpdatePerfil(idx, 'pin', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Edit size={16} />
              <span>Guardar Cambios de Cuenta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
