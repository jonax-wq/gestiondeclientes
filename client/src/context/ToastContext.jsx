import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000, action = null }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newToast = { id, type, title, message, duration, action };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title = '¡Éxito!', options = {}) => 
      addToast({ type: 'success', title, message, ...options }),
    error: (message, title = 'Atención', options = {}) => 
      addToast({ type: 'error', title, message, ...options }),
    warning: (message, title = 'Advertencia', options = {}) => 
      addToast({ type: 'warning', title, message, ...options }),
    info: (message, title = 'Información', options = {}) => 
      addToast({ type: 'info', title, message, ...options })
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context.toast;
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notificaciones">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const { type, title, message, duration, action } = toast;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon success" size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon error" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon warning" size={20} />;
      case 'info':
      default:
        return <Info className="toast-icon info" size={20} />;
    }
  };

  return (
    <div className={`toast-card toast-${type}`} role="alert">
      <div className="toast-content-wrapper">
        <div className="toast-icon-wrapper">
          {getIcon()}
        </div>
        <div className="toast-text-area">
          {title && <h4 className="toast-title">{title}</h4>}
          {message && <p className="toast-message">{message}</p>}
          {action && (
            <button
              type="button"
              className="toast-action-btn"
              onClick={() => {
                action.onClick?.();
                onRemove();
              }}
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          className="toast-close-btn"
          onClick={onRemove}
          title="Cerrar notificación"
        >
          <X size={16} />
        </button>
      </div>
      {duration > 0 && (
        <div 
          className="toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}
