import React from 'react';
import { Menu } from 'lucide-react';

export function Navbar({ onToggleMobileSidebar }) {
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
        <div className="brand-logo-container">
          <img
            src="/flow_logo.png"
            alt="Flow Stream Logo"
            className="brand-logo-img"
          />
        </div>

        <div className="brand-text-container">
          <div className="brand-title">
            <span>Flow Stream</span>
          </div>
          <p className="brand-subtitle">
            Gestión Inteligente de Cuentas de Streaming
          </p>
        </div>
      </div>
    </header>
  );
}
