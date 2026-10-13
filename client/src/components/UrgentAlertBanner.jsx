import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

export function UrgentAlertBanner({ urgentClients = [], onActionClick }) {
  if (urgentClients.length === 0) return null;

  return (
    <div className="urgent-banner">
      <div className="urgent-banner-content">
        <div className="urgent-icon-box">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="urgent-title">
            ¡Tienes {urgentClients.length} {urgentClients.length === 1 ? 'cliente' : 'clientes'} con membresía por vencer (≤ 2 días)!
          </h3>
          <p className="urgent-desc">
            Envía el recordatorio por WhatsApp directamente con un solo clic para asegurar su renovación antes del corte.
          </p>
        </div>
      </div>

      <button 
        className="btn btn-whatsapp" 
        onClick={onActionClick}
      >
        <WhatsAppIcon size={19} color="#063c19" />
        <span>Gestionar y Enviar WhatsApp</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
