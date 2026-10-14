import React from 'react';
import { UserPlus, PlusCircle, Bell } from 'lucide-react';

export function Navbar({
  onNewClient,
  onNewAccount,
  urgentCount,
  onFilterUrgent
}) {
  return (
    <header className="navbar">
      <div className="brand-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/flow_logo.png"
            alt="Flow Stream Logo"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '1px solid rgba(99, 102, 241, 0.45)',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
            }}
          />
        </div>
        <div>
          <div className="brand-title">
            Flow Stream
            <span className="brand-badge">PRO v1.0</span>
          </div>
          <p className="brand-subtitle">
            Gestión Inteligente de Cuentas de Streaming
          </p>
        </div>
      </div>

      <div className="nav-actions">
        {urgentCount > 0 && (
          <button
            className="btn btn-secondary pulse-amber"
            onClick={onFilterUrgent}
            style={{
              borderColor: 'rgba(245, 158, 11, 0.6)',
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.15)',
              whiteSpace: 'nowrap'
            }}
            title="Ver clientes a los que les faltan 2 días o menos para vencer"
          >
            <Bell size={18} className="pulse-attention" />
            <span>{urgentCount} por vencer (≤ 2 días)</span>
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={onNewAccount}
          title="Registrar una nueva cuenta maestra con sus perfiles"
          style={{ whiteSpace: 'nowrap' }}
        >
          <PlusCircle size={18} />
          <span>Nueva Cuenta</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={onNewClient}
          title="Asignar un nuevo cliente a un perfil disponible"
          style={{ whiteSpace: 'nowrap' }}
        >
          <UserPlus size={18} />
          <span>+ Asignar Cliente</span>
        </button>
      </div>
    </header>
  );
}
