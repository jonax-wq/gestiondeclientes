import React from 'react';
import { UserPlus, PlusCircle, Bell, Menu, KeyRound } from 'lucide-react';

export function Navbar({
  onNewClient,
  onNewAccount,
  urgentCount,
  onFilterUrgent,
  onToggleMobileSidebar,
  onGoToCodes
}) {
  return (
    <header className="navbar">
      <div className="brand-wrapper">
        {/* Botón hamburguesa para abrir Sidebar en móviles */}
        <button
          type="button"
          className="navbar-mobile-toggle-btn"
          onClick={onToggleMobileSidebar}
          title="Abrir menú lateral"
        >
          <Menu size={20} />
        </button>

        {/* Logo oficial de Flow Stream */}
        <div className="brand-logo-container" style={{ width: '38px', height: '38px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/flow_logo.png"
            alt="Flow Stream Logo"
            className="brand-logo-img"
            style={{
              width: '38px',
              height: '38px',
              maxWidth: '38px',
              maxHeight: '38px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '1px solid rgba(99, 102, 241, 0.45)',
              boxShadow: '0 0 14px rgba(99, 102, 241, 0.4)',
              display: 'block'
            }}
          />
        </div>

        <div className="brand-text-container">
          <div className="brand-title">
            <span>Flow Stream</span>
            <span className="brand-badge">PRO</span>
          </div>
          <p className="brand-subtitle">
            Gestión Inteligente de Cuentas de Streaming
          </p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Alerta de urgentes (≤ 2 días) */}
        {urgentCount > 0 && (
          <button
            className="btn btn-secondary pulse-amber nav-urgent-btn"
            onClick={onFilterUrgent}
            title="Ver clientes por vencer en 2 días o menos"
          >
            <Bell size={16} className="pulse-attention" />
            <span className="hide-on-mobile">{urgentCount} por vencer</span>
            <span className="show-on-mobile">{urgentCount}</span>
          </button>
        )}

        {/* Acceso a Códigos Hogar (visible en desktop) */}
        {onGoToCodes && (
          <button
            className="btn btn-secondary nav-btn-codes hide-on-mobile"
            onClick={onGoToCodes}
            title="Abrir Centro de Códigos Netflix Hogar y OTP"
          >
            <KeyRound size={16} />
            <span>Códigos Hogar</span>
          </button>
        )}

        {/* Nueva Cuenta */}
        <button
          className="btn btn-secondary nav-new-account-btn"
          onClick={onNewAccount}
          title="Registrar una nueva cuenta maestra"
        >
          <PlusCircle size={17} />
          <span className="hide-on-mobile">Nueva Cuenta</span>
        </button>

        {/* Asignar Cliente */}
        <button
          className="btn btn-primary nav-new-client-btn"
          onClick={onNewClient}
          title="Asignar un nuevo cliente a un perfil"
        >
          <UserPlus size={17} />
          <span className="hide-on-mobile">+ Asignar Cliente</span>
          <span className="show-on-mobile">+ Cliente</span>
        </button>
      </div>
    </header>
  );
}
