import React from 'react';
import { AlertCircle, ArrowRight, Bot } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

export function UrgentAlertBanner({ urgentClients = [], onActionClick, onGoToAuto }) {
  if (urgentClients.length === 0) return null;

  return (
    <div className="urgent-banner">
      <div className="urgent-banner-content">
        <div className="urgent-icon-box">
          <AlertCircle size={22} />
        </div>
        <div className="urgent-text-box">
          <h3 className="urgent-title">
            ¡Tienes {urgentClients.length} {urgentClients.length === 1 ? 'cliente' : 'clientes'} por vencer (≤ 2 días)!
          </h3>
          <p className="urgent-desc">
            Envía el recordatorio por WhatsApp con 1 clic para asegurar la renovación.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {onGoToAuto && (
          <button 
            type="button"
            className="btn btn-secondary urgent-action-btn"
            onClick={onGoToAuto}
            title="Configurar o ejecutar envío automático por WhatsApp"
          >
            <Bot size={16} color="#10b981" />
            <span>Auto Bot</span>
          </button>
        )}

        <button 
          className="btn btn-whatsapp urgent-action-btn" 
          onClick={onActionClick}
        >
          <WhatsAppIcon size={18} color="#ffffff" />
          <span className="hide-on-mobile">Gestionar Clientes</span>
          <span className="show-on-mobile">Clientes ({urgentClients.length})</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
