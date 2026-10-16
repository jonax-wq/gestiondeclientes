import React from 'react';
import { 
  Users, 
  Tv, 
  KeyRound, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Bell, 
  Cloud, 
  HardDrive,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { FlowStreamLogo } from './icons/FlowStreamLogo';

export function Sidebar({
  activeTab,
  onSelectTab,
  clientCount = 0,
  urgentCount = 0,
  accountCount = 0,
  isCloudConnected = false,
  isMobileOpen = false,
  onCloseMobile = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {},
  theme = 'dark',
  onToggleTheme = () => {}
}) {
  const navItems = [
    {
      id: 'clientes',
      label: 'Clientes',
      desc: 'Gestión y membresías',
      icon: Users,
      badge: clientCount,
      urgentBadge: urgentCount > 0 ? urgentCount : null,
      color: '#6366f1'
    },
    {
      id: 'cuentas',
      label: 'Cuentas Maestras',
      desc: 'Perfiles y contraseñas',
      icon: Tv,
      badge: accountCount,
      color: '#06b6d4'
    },
    {
      id: 'codigos',
      label: 'Códigos Hogar & OTP',
      desc: 'Extractor de correos',
      icon: KeyRound,
      badge: 'PRO',
      badgeColor: '#10b981',
      color: '#10b981'
    },
    {
      id: 'portal',
      label: 'Portal Auto-Servicio',
      desc: 'Vista para el cliente',
      icon: Globe,
      badge: 'Cliente',
      badgeColor: '#8b5cf6',
      color: '#a855f7'
    }
  ];

  return (
    <>
      {/* Overlay oscuro para móviles al abrir el drawer */}
      {isMobileOpen && (
        <div 
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Cabecera del Sidebar */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img 
              src="/flow_logo.png" 
              alt="Flow Stream Logo" 
              className="sidebar-logo" 
              style={{
                width: '36px',
                height: '36px',
                maxWidth: '36px',
                maxHeight: '36px',
                borderRadius: '10px',
                objectFit: 'cover',
                border: '1px solid rgba(99, 102, 241, 0.45)',
                boxShadow: '0 0 14px rgba(99, 102, 241, 0.35)',
                display: 'block',
                flexShrink: 0
              }}
            />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <div className="sidebar-app-name">
                  <span>Flow Stream</span>
                  <span className="brand-badge-mini">PRO</span>
                </div>
                <span className="sidebar-app-role">Panel Administrativo</span>
              </div>
            )}
          </div>

          {/* Botón cerrar en móvil */}
          <button 
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            title="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sección de Navegación Principal */}
        <div className="sidebar-nav-section">
          {!isCollapsed && <div className="sidebar-section-title">MÓDULOS DEL CRM</div>}
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  data-id={item.id}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div 
                    className="sidebar-nav-icon-wrapper"
                    style={{ color: isActive ? '#fff' : item.color }}
                  >
                    <Icon size={20} />
                  </div>

                  {!isCollapsed && (
                    <div className="sidebar-nav-content">
                      <div className="sidebar-nav-title-row">
                        <span className="sidebar-nav-label">{item.label}</span>
                        
                        {/* Badges de alertas o contadores */}
                        <div className="sidebar-badges-row">
                          {item.urgentBadge && (
                            <span 
                              className="sidebar-badge urgent" 
                              title={`${item.urgentBadge} clientes por vencer (≤ 2 días)`}
                            >
                              <Bell size={11} /> {item.urgentBadge}
                            </span>
                          )}

                          {item.badge && !item.urgentBadge && (
                            <span 
                              className={`sidebar-badge count badge-${item.id}`}
                              style={item.badgeColor ? { background: `${item.badgeColor}22`, color: item.badgeColor, borderColor: `${item.badgeColor}55` } : {}}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="sidebar-nav-desc">{item.desc}</span>
                    </div>
                  )}

                  {/* Dot indicador colapsado si tiene alertas */}
                  {isCollapsed && item.urgentBadge && (
                    <span className="sidebar-collapsed-alert-dot" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Banner de atajo rápido: Códigos de Hogar */}
        {!isCollapsed && (
          <div className="sidebar-quick-card">
            <div className="quick-card-header">
              <Sparkles size={16} color="#10b981" />
              <span>Netflix Hogar & OTP</span>
            </div>
            <p className="quick-card-text">
              Pega el correo de Gmail y extrae el código de TV en 1 segundo.
            </p>
            <button 
              className="quick-card-btn"
              onClick={() => {
                onSelectTab('codigos');
                onCloseMobile();
              }}
            >
              Extraer Código
            </button>
          </div>
        )}

        {/* Pie del Sidebar: Almacenamiento, Tema y Collapse */}
        <div className="sidebar-footer">

          {/* Estado de Almacenamiento */}
          {!isCollapsed && (
            <div className="sidebar-storage-indicator">
              {isCloudConnected ? (
                <>
                  <Cloud size={14} color="#10b981" />
                  <span>Sincronizado con Supabase</span>
                </>
              ) : (
                <>
                  <HardDrive size={14} color="#f59e0b" />
                  <span>Almacenamiento Local Seguro</span>
                </>
              )}
            </div>
          )}

          {/* Selector de Modo Claro / Oscuro */}
          <button 
            className="sidebar-footer-action theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <Sun size={18} color="#f59e0b" />
            ) : (
              <Moon size={18} color="#6366f1" />
            )}
            {!isCollapsed && (
              <div className="db-action-text">
                <span className="theme-action-title">
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
                <span className="theme-action-sub">
                  {theme === 'dark' ? 'Cambiar a interfaz diurna' : 'Cambiar a interfaz nocturna'}
                </span>
              </div>
            )}
          </button>

          {/* Botón de colapso para Desktop */}
          <button 
            className="sidebar-collapse-toggle-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Ocultar barra</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
