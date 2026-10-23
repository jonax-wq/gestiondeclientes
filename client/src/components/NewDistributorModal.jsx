import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Dices, 
  Calendar, 
  DollarSign, 
  Phone, 
  FileText, 
  Sparkles,
  Send,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { generateRandomDistCode, formatDistCode } from '../utils/auth';
import { addDays, getTodayDate } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export function NewDistributorModal({ isOpen, onClose, onSaveDistributor }) {
  const toast = useToast();
  const [nombre, setNombre] = useState('');
  const [codigoPais, setCodigoPais] = useState('+51');
  const [whatsapp, setWhatsapp] = useState('');
  const [codigoDist, setCodigoDist] = useState('');
  const [duracion, setDuracion] = useState('30'); // '30' | '60' | '90' | '180' | '365' | 'permanente'
  const [precio, setPrecio] = useState('');
  const [notas, setNotas] = useState('');
  const [esSuperadmin, setEsSuperadmin] = useState(false);
  const [sendWhatsAppImmediate, setSendWhatsAppImmediate] = useState(true);

  // Inicializar código aleatorio al abrir modal
  useEffect(() => {
    if (isOpen) {
      setCodigoDist(generateRandomDistCode());
      setNombre('');
      setWhatsapp('');
      setPrecio('');
      setNotas('');
      setDuracion('30');
      setEsSuperadmin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRollCode = () => {
    const nuevo = generateRandomDistCode();
    setCodigoDist(nuevo);
    toast.info(`Nuevo código generado: ${nuevo}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('Por favor ingresa el nombre del distribuidor.');
      return;
    }

    if (!codigoDist.trim()) {
      toast.error('Debes asignar un código DIST-XXXX.');
      return;
    }

    const formattedCode = formatDistCode(codigoDist);
    let fechaExpiracion = null;

    if (duracion !== 'permanente') {
      const dias = parseInt(duracion, 10) || 30;
      fechaExpiracion = addDays(getTodayDate(), dias);
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    const telefonoCompleto = cleanPhone ? `${codigoPais}${cleanPhone}` : null;

    const payload = {
      codigo_distribuidor: formattedCode,
      nombre: nombre.trim(),
      whatsapp: telefonoCompleto,
      estado: 'activo',
      fecha_expiracion: fechaExpiracion,
      es_superadmin: esSuperadmin,
      precio_mensual: Number(precio) || 0,
      notas: notas.trim() || null
    };

    onSaveDistributor(payload, sendWhatsAppImmediate);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container modal-new-client" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        {/* Cabecera */}
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <UserCheck size={22} />
            </div>
            <div>
              <h2 className="modal-title">Registrar Nuevo Distribuidor</h2>
              <p className="modal-subtitle">Crea una licencia con código único para un revendedor</p>
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
          {/* 1. Nombre del Distribuidor */}
          <div className="form-group">
            <label className="form-label required">Nombre del Distribuidor o Negocio</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Max Stream Perú / Juan Gómez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* 2. Código de Distribuidor con generador 🎲 */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label required" style={{ margin: 0 }}>
                Código Único (DIST-XXXX)
              </label>
              <button
                type="button"
                className="btn-random-generate"
                onClick={handleRollCode}
                title="Generar otro código aleatorio"
                style={{ padding: '3px 10px', fontSize: '12px' }}
              >
                <Dices size={14} />
                <span>Generar otro</span>
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ 
                  fontWeight: 700, 
                  letterSpacing: '1.5px', 
                  color: '#10b981', 
                  fontFamily: 'monospace',
                  fontSize: '16px' 
                }}
                value={codigoDist}
                onChange={(e) => setCodigoDist(e.target.value.toUpperCase())}
                placeholder="DIST-XXXX"
                required
              />
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              Este es el código que el distribuidor ingresará para entrar a su panel privado.
            </span>
          </div>

          {/* 3. WhatsApp del Distribuidor */}
          <div className="form-group">
            <label className="form-label">Número de WhatsApp (Opcional)</label>
            <div className="phone-input-group">
              <select
                className="country-code-select"
                value={codigoPais}
                onChange={(e) => setCodigoPais(e.target.value)}
              >
                <option value="+51">🇵🇪 +51 (Perú)</option>
                <option value="+57">🇨🇴 +57 (Colombia)</option>
                <option value="+52">🇲🇽 +52 (México)</option>
                <option value="+54">🇦🇷 +54 (Argentina)</option>
                <option value="+56">🇨🇱 +56 (Chile)</option>
                <option value="+593">🇪🇨 +593 (Ecuador)</option>
                <option value="+591">🇧🇴 +591 (Bolivia)</option>
                <option value="+58">🇻🇪 +58 (Venezuela)</option>
                <option value="+1">🇺🇸 +1 (USA)</option>
                <option value="+34">🇪🇸 +34 (España)</option>
              </select>
              <input
                type="tel"
                className="form-input"
                placeholder="999 888 777"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
          </div>

          {/* 4. Duración de la Licencia y Precio */}
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Vigencia de la Licencia</label>
              <select
                className="form-select"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
              >
                <option value="30">30 días (1 Mes)</option>
                <option value="60">60 días (2 Meses)</option>
                <option value="90">90 días (3 Meses)</option>
                <option value="180">180 días (6 Meses)</option>
                <option value="365">365 días (1 Año)</option>
                <option value="permanente">♾️ Permanente (Sin límite)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Costo Mensual (S/ o $)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 5. Notas */}
          <div className="form-group">
            <label className="form-label">Notas Internas</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Pagado por Yape, recomendado por cliente X"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* 6. Opción SuperAdmin */}
          <div style={{ 
            background: 'rgba(99, 102, 241, 0.08)', 
            border: '1px solid rgba(99, 102, 241, 0.25)', 
            borderRadius: '10px', 
            padding: '12px 14px', 
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crown size={18} color="#818cf8" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ¿Permisos de Super-Administrador?
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Podrá ver y gestionar la lista de otros distribuidores.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              id="chk-superadmin"
              checked={esSuperadmin}
              onChange={(e) => setEsSuperadmin(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>

          {/* 7. Opción de enviar WhatsApp inmediatamente */}
          {whatsapp && (
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer', 
              marginBottom: '16px',
              fontSize: '13px',
              color: 'var(--text-primary)'
            }}>
              <input
                type="checkbox"
                checked={sendWhatsAppImmediate}
                onChange={(e) => setSendWhatsAppImmediate(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Send size={14} color="#10b981" />
                Abrir WhatsApp con credenciales al guardar
              </span>
            </label>
          )}

          {/* Acciones */}
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
            >
              <UserCheck size={16} />
              <span>Crear Distribuidor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
