import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

export function UrgentAlertBanner({ urgentClients = [], onActionClick }) {
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

      <button 
        className="btn btn-whatsapp urgent-action-btn" 
        onClick={onActionClick}
      >
        <WhatsAppIcon size={18} color="#063c19" />
        <span className="hide-on-mobile">Gestionar y Enviar WhatsApp</span>
        <span className="show-on-mobile">Enviar WhatsApp ({urgentClients.length})</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
