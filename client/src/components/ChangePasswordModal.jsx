import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Sparkles,
  Dices,
  Copy,
  Check
} from 'lucide-react';
import { changeMasterPassword, generateRandomDistCode, formatDistCode } from '../utils/auth';
import { useToast } from '../context/ToastContext';

export function ChangePasswordModal({ isOpen, onClose }) {
  const toast = useToast();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerateRandom = () => {
    const randomCode = generateRandomDistCode();
    setNewPass(randomCode);
    setConfirmPass(randomCode);
    setShowNew(true);
    setError('');
    toast.success(`¡Código generado: ${randomCode}! Recuerda anotarlo o copiarlo.`);
  };

  const handleCopyCode = async () => {
    if (!newPass) return;
    try {
      await navigator.clipboard.writeText(newPass);
      setCopied(true);
      toast.success('¡Código copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.info(`Código: ${newPass}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!currentPass.trim()) {
      setError('Debes ingresar tu código o contraseña actual.');
      return;
    }
    if (!newPass.trim() || newPass.trim().length < 4) {
      setError('El nuevo código debe tener al menos 4 caracteres (ej: DIST-XXXX).');
      return;
    }

    const formattedNew = formatDistCode(newPass);
    const formattedConfirm = formatDistCode(confirmPass);

    if (formattedNew !== formattedConfirm) {
      setError('Los códigos nuevos no coinciden.');
      return;
    }

    const result = changeMasterPassword(currentPass, newPass, confirmPass);
    if (result.success) {
      setIsSuccess(true);
      toast.success(`¡Código de Distribuidor actualizado a ${result.newCode}!`);
      setTimeout(() => {
        handleClose();
      }, 1300);
    } else {
      setError(result.error || 'No se pudo actualizar el código de distribuidor.');
    }
  };

  const handleClose = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setError('');
    setCopied(false);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div 
        className="modal-container modal-change-password"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="modal-title">Código Único de Distribuidor</h2>
              <p className="modal-subtitle">Configura tu código de acceso al sistema (DIST-XXXX)</p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={handleClose}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            
            {/* Banner de información */}
            <div className="change-pass-banner">
              <Sparkles size={16} color="#818cf8" />
              <span>
                Este código protege tus clientes, cuentas y base de datos. Se recomienda el formato <strong>DIST-XXXX</strong> (ej: DIST-7840).
              </span>
            </div>

            {error && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="modal-success-banner">
                <CheckCircle2 size={16} color="#10b981" />
                <span>¡Código de Distribuidor actualizado con éxito! Cerrando...</span>
              </div>
            )}

            {/* Código Actual */}
            <div className="form-group">
              <label className="form-label">
                <KeyRound size={14} /> Código o Contraseña Actual
              </label>
              <div className="custom-input-with-icon">
                <Lock size={16} className="input-field-icon" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Ej: DIST-2026..."
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value.toUpperCase())}
                  autoFocus
                  disabled={isSuccess}
                />
                <button
                  type="button"
                  className="input-eye-toggle"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Nuevo Código de Distribuidor */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <ShieldCheck size={14} /> Nuevo Código de Distribuidor
                </label>
                
                {/* Botón para generar código aleatorio */}
                <button
                  type="button"
                  className="btn-generate-dist-code"
                  onClick={handleGenerateRandom}
                  disabled={isSuccess}
                  title="Generar código aleatorio en formato DIST-XXXX"
                >
                  <Dices size={14} />
                  <span>Generar Aleatorio</span>
                </button>
              </div>

              <div className="custom-input-with-icon">
                <Lock size={16} className="input-field-icon" />
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, letterSpacing: '0.05em' }}
                  placeholder="DIST-XXXX (ej: DIST-8924)"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value.toUpperCase())}
                  disabled={isSuccess}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {newPass && (
                    <button
                      type="button"
                      className="input-eye-toggle"
                      onClick={handleCopyCode}
                      title="Copiar código al portapapeles"
                      tabIndex={-1}
                    >
                      {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    </button>
                  )}
                  <button
                    type="button"
                    className="input-eye-toggle"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirmar Nuevo Código */}
            <div className="form-group">
              <label className="form-label">
                <CheckCircle2 size={14} /> Confirmar Nuevo Código
              </label>
              <div className="custom-input-with-icon">
                <Lock size={16} className="input-field-icon" />
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, letterSpacing: '0.05em' }}
                  placeholder="Vuelve a escribir el nuevo código DIST-XXXX..."
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value.toUpperCase())}
                  disabled={isSuccess}
                />
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSuccess}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-save-pass"
              disabled={isSuccess}
            >
              <ShieldCheck size={16} />
              <span>Guardar Código de Distribuidor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
