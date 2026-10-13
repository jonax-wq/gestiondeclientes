import React from 'react';
import { UserPlus, PlusCircle, Bell, Download } from 'lucide-react';
import { FlowStreamLogo } from './icons/FlowStreamLogo';

export function Navbar({ 
  onNewClient, 
  onNewAccount, 
  urgentCount,
  onFilterUrgent,
  isCloudConnected,
  isInstallable,
  onInstallPWA
}) {
  return (
    <header className="navbar">
      <div className="brand-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FlowStreamLogo size={38} />
        </div>
        <div>
          <div className="brand-title">
            Flow Stream
            <span className="brand-badge">PRO v1.0</span>
          </div>
          <p className="brand-subtitle">
            Gestión Inteligente de Cuentas de Streaming, Perfiles y Clientes
          </p>
        </div>
      </div>

      <div className="nav-actions">
        {isCloudConnected && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.78rem',
              color: '#34d399',
              fontWeight: 600
            }} 
            title="Conectado en vivo a tu Base de Datos Supabase (PostgreSQL en la Nube)"
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
              display: 'inline-block'
            }} />
            <span>Supabase Cloud</span>
          </div>
        )}

        {isInstallable && (
          <button 
            type="button"
            className="btn btn-secondary pulse-subtle"
            onClick={onInstallPWA}
            title="Instalar Flow Stream en la pantalla de inicio de tu celular o computadora"
            style={{
              borderColor: 'rgba(99, 102, 241, 0.5)',
              color: '#c7d2fe',
              background: 'rgba(99, 102, 241, 0.15)'
            }}
          >
            <Download size={17} />
            <span>Instalar App</span>
          </button>
        )}

        {urgentCount > 0 && (
          <button 
            className="btn btn-secondary pulse-amber"
            onClick={onFilterUrgent}
            style={{ 
              borderColor: 'rgba(245, 158, 11, 0.6)', 
              color: '#fbbf24', 
              background: 'rgba(245, 158, 11, 0.15)' 
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
        >
          <PlusCircle size={18} />
          <span>Nueva Cuenta</span>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={onNewClient}
          title="Asignar un nuevo cliente a un perfil disponible"
        >
          <UserPlus size={18} />
          <span>+ Asignar Cliente</span>
        </button>
      </div>
    </header>
  );
}
