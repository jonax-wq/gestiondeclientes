import React from 'react';
import { AlertTriangle, HelpCircle, X, Trash2, RefreshCw } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger' // 'danger' | 'primary' | 'warning'
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 size={24} style={{ color: '#f43f5e' }} />;
      case 'warning':
        return <AlertTriangle size={24} style={{ color: '#f59e0b' }} />;
      default:
        return <HelpCircle size={24} style={{ color: '#6366f1' }} />;
    }
  };

  const getConfirmBtnClass = () => {
    switch (variant) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn btn-warning';
      default:
        return 'btn btn-primary';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px', textAlign: 'center' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: variant === 'danger' 
            ? 'rgba(244, 63, 94, 0.15)' 
            : variant === 'warning' 
            ? 'rgba(245, 158, 11, 0.15)' 
            : 'rgba(99, 102, 241, 0.15)',
          border: `1px solid ${
            variant === 'danger' 
              ? 'rgba(244, 63, 94, 0.35)' 
              : variant === 'warning' 
              ? 'rgba(245, 158, 11, 0.35)' 
              : 'rgba(99, 102, 241, 0.35)'
          }`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          {getIcon()}
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
          {title}
        </h3>

        <div style={{ 
          fontSize: '0.88rem', 
          color: '#94a3b8', 
          lineHeight: '1.5', 
          marginBottom: '24px',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ flex: 1 }}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={getConfirmBtnClass()}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ flex: 1 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
