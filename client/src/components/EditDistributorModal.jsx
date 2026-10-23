import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Calendar, 
  DollarSign, 
  Phone, 
  FileText, 
  Save,
  Clock,
  ShieldCheck,
  Crown,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { addDays, getTodayDate, formatearFecha, calcularDiasRestantes } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export function EditDistributorModal({ isOpen, onClose, distributor, onUpdateDistributor }) {
  const toast = useToast();

  const [nombre, setNombre] = useState('');
  const [codigoPais, setCodigoPais] = useState('+51');
  const [whatsapp, setWhatsapp] = useState('');
  const [estado, setEstado] = useState('activo');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [esPermanente, setEsPermanente] = useState(false);
  const [precio, setPrecio] = useState('');
  const [maxCuentas, setMaxCuentas] = useState(100);
  const [notas, setNotas] = useState('');
  const [esSuperadmin, setEsSuperadmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (distributor && isOpen) {
      setNombre(distributor.nombre || '');
      
      // Parsear WhatsApp y código de país
      const fullPhone = distributor.whatsapp || '';
      if (fullPhone.startsWith('+51')) {
        setCodigoPais('+51');
        setWhatsapp(fullPhone.slice(3));
      } else if (fullPhone.startsWith('+57')) {
        setCodigoPais('+57');
        setWhatsapp(fullPhone.slice(3));
      } else if (fullPhone.startsWith('+52')) {
        setCodigoPais('+52');
        setWhatsapp(fullPhone.slice(3));
      } else if (fullPhone.startsWith('+54')) {
        setCodigoPais('+54');
        setWhatsapp(fullPhone.slice(3));
      } else if (fullPhone.startsWith('+1')) {
        setCodigoPais('+1');
        setWhatsapp(fullPhone.slice(2));
      } else {
        setCodigoPais('+51');
        setWhatsapp(fullPhone.replace(/\D/g, ''));
      }

      setEstado(distributor.estado || 'activo');
      
      if (distributor.fecha_expiracion) {
        setEsPermanente(false);
        setFechaExpiracion(distributor.fecha_expiracion.split('T')[0]);
      } else {
        setEsPermanente(true);
        setFechaExpiracion('');
      }

      setPrecio(distributor.precio_mensual ? String(distributor.precio_mensual) : '');
      setMaxCuentas(distributor.max_cuentas || 100);
      setNotas(distributor.notas || '');
      setEsSuperadmin(Boolean(distributor.es_superadmin));
    }
  }, [distributor, isOpen]);

  if (!isOpen || !distributor) return null;

  const isMasterAccount = distributor.codigo_distribuidor === 'DIST-2026';

  const handleAddDays = (days) => {
    setEsPermanente(false);
    const base = fechaExpiracion || getTodayDate();
    const nueva = addDays(base, days);
    setFechaExpiracion(nueva);
    toast.info(`Fecha extendida +${days} días: ${formatearFecha(nueva)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('El nombre del distribuidor no puede estar vacío.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    const telefonoCompleto = cleanPhone ? `${codigoPais}${cleanPhone}` : null;

    const updates = {
      nombre: nombre.trim(),
      whatsapp: telefonoCompleto,
      estado,
      fecha_expiracion: esPermanente ? null : (fechaExpiracion || null),
      precio_mensual: Number(precio) || 0,
      max_cuentas: Number(maxCuentas) || 100,
      notas: notas.trim() || null,
      es_superadmin: isMasterAccount ? true : esSuperadmin
    };

    setIsSaving(true);
    try {
      await onUpdateDistributor(distributor.id || distributor.codigo_distribuidor, updates);
      toast.success(`Distribuidor ${nombre} actualizado correctamente.`);
      onClose();
    } catch {
      toast.error('Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const diasRestantes = (!esPermanente && fechaExpiracion) 
    ? calcularDiasRestantes(fechaExpiracion) 
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container modal-new-client" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        {/* Cabecera */}
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <Edit3 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="modal-title">Editar Distribuidor</h2>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.35)'
                }}>
                  {distributor.codigo_distribuidor}
                </span>
              </div>
              <p className="modal-subtitle">Actualiza los datos, estado o vigencia de la licencia</p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="form-grid-2">
            {/* Nombre */}
            <div className="form-group full-width">
              <label className="form-label required">
                Nombre Completo o Empresa:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Juan Pérez - Streaming Max"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            {/* WhatsApp */}
            <div className="form-group">
              <label className="form-label">
                <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                WhatsApp (para credenciales):
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select 
                  className="form-select" 
                  style={{ width: '90px', flexShrink: 0 }}
                  value={codigoPais}
                  onChange={(e) => setCodigoPais(e.target.value)}
                >
                  <option value="+51">🇵🇪 +51</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+593">🇪🇨 +593</option>
                  <option value="+591">🇧🇴 +591</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+34">🇪🇸 +34</option>
                </select>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="987654321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>

            {/* Estado */}
            <div className="form-group">
              <label className="form-label">Estado de la Licencia:</label>
              <select
                className="form-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                disabled={isMasterAccount}
              >
                <option value="activo">🟢 Activo (Acceso Habilitado)</option>
                <option value="suspendido">🔴 Suspendido (Bloqueado)</option>
              </select>
            </div>

            {/* Cuota / Precio mensual */}
            <div className="form-group">
              <label className="form-label">
                <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Cuota Mensual (S/):
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                className="form-input"
                placeholder="Ej. 50.00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </div>

            {/* Límite de cuentas */}
            <div className="form-group">
              <label className="form-label">
                <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Límite de Cuentas:
              </label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="100"
                value={maxCuentas}
                onChange={(e) => setMaxCuentas(e.target.value)}
              />
            </div>
          </div>

          {/* Vigencia y Fecha de Expiración */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginTop: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#10b981" />
                <span>Vigencia de la Licencia:</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={esPermanente} 
                  onChange={(e) => setEsPermanente(e.target.checked)}
                />
                <span style={{ fontWeight: 600, color: esPermanente ? '#6366f1' : 'var(--text-secondary)' }}>
                  ♾️ Licencia Permanente (Sin límite)
                </span>
              </label>
            </div>

            {!esPermanente ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    className="form-input"
                    style={{ flex: 1, minWidth: '160px' }}
                    value={fechaExpiracion}
                    onChange={(e) => setFechaExpiracion(e.target.value)}
                    required={!esPermanente}
                  />

                  {diasRestantes !== null && (
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: diasRestantes < 0 ? 'rgba(244, 63, 94, 0.15)' : diasRestantes <= 5 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: diasRestantes < 0 ? '#f43f5e' : diasRestantes <= 5 ? '#f59e0b' : '#10b981',
                      border: '1px solid currentColor'
                    }}>
                      {diasRestantes < 0 ? `Vencido hace ${Math.abs(diasRestantes)}d` : `Quedan ${diasRestantes} días`}
                    </span>
                  )}
                </div>

                {/* Botones de extensión rápida */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    onClick={() => handleAddDays(30)}
                  >
                    +30 Días
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    onClick={() => handleAddDays(60)}
                  >
                    +60 Días
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    onClick={() => handleAddDays(90)}
                  >
                    +90 Días
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} />
                <span>Esta licencia no vencerá automáticamente y tendrá acceso ilimitado.</span>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label">
              <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Notas Administrativas / Convenio:
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Notas opcionales (ej. Pagado por Yape el 20/10, revendedor de Lima)..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* SuperAdmin Check (Solo para cuentas secundarias) */}
          {!isMasterAccount && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)'
            }}>
              <input
                type="checkbox"
                id="edit-superadmin-check"
                checked={esSuperadmin}
                onChange={(e) => setEsSuperadmin(e.target.checked)}
              />
              <label htmlFor="edit-superadmin-check" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                <strong style={{ color: '#818cf8' }}>Acceso Super-Administrador:</strong>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>
                  Le permite crear y gestionar otros distribuidores en el sistema.
                </span>
              </label>
            </div>
          )}

          {/* Botones de acción */}
          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                minWidth: '160px'
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
