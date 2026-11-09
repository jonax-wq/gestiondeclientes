import React from 'react';
import { 
  Users, 
  Tv, 
  KeyRound, 
  Globe, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Lock, 
  ShieldCheck 
} from 'lucide-react';

export function Sidebar({
  activeTab,
  onSelectTab,
  clientCount = 0,
  urgentCount = 0,
  accountCount = 0,
  distributorCount = 0,
  currentDistributor = null,
  isCloudConnected = false,
  isMobileOpen = false,
  onCloseMobile = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {},
  theme = 'dark',
  onToggleTheme = () => {},
  onOpenDatabase = () => {},
  onLockAdmin = () => {},
  onOpenChangePassword = () => {}
}) {
  const isSuperAdmin = Boolean(currentDistributor?.es_superadmin) || currentDistributor?.codigo_distribuidor === 'DIST-2026';

  const navItems = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      badge: clientCount > 0 ? clientCount : null,
      urgentBadge: urgentCount > 0 ? urgentCount : null,
      color: '#6366f1'
    },
    {
      id: 'cuentas',
      label: 'Cuentas Maestras',
      icon: Tv,
      badge: accountCount > 0 ? accountCount : null,
      color: '#06b6d4'
    },
    {
      id: 'codigos',
      label: 'Códigos Hogar',
      icon: KeyRound,
      color: '#10b981'
    },
    ...(isSuperAdmin ? [{
      id: 'distribuidores',
      label: 'Distribuidores',
      icon: ShieldCheck,
      badge: distributorCount > 0 ? distributorCount : null,
      color: '#10b981'
    }] : []),
    {
      id: 'portal',
      label: 'Portal Clientes',
      icon: Globe,
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
        {/* Cabecera del Sidebar con las 3 rayitas de colapso arriba */}
        <div className="sidebar-header" style={{ marginBottom: isCollapsed ? '16px' : '20px' }}>
          {!isCollapsed ? (
            <>
              <div className="sidebar-brand">
                <img 
                  src="/flow_logo.png" 
                  alt="Flow Stream Logo" 
                  className="sidebar-logo" 
                  style={{
                    width: '32px',
                    height: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px',
                    borderRadius: '8px',
                    objectFit: 'contain',
                    flexShrink: 0
                  }}
                />
                <div className="sidebar-brand-text">
                  <div className="sidebar-app-name">
                    <span>Flow Stream</span>
                  </div>
                </div>
              </div>

              <div className="sidebar-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Botón de 3 rayitas para colapsar en Desktop */}
                <button
                  type="button"
                  className="sidebar-toggle-desktop-btn"
                  onClick={onToggleCollapse}
                  title="Ocultar barra lateral"
                >
                  <Menu size={19} />
                </button>

                {/* Botón cerrar en móvil */}
                <button 
                  type="button"
                  className="sidebar-mobile-close-btn"
                  onClick={onCloseMobile}
                  title="Cerrar menú"
                >
                  <X size={18} />
                </button>
              </div>
            </>
          ) : (
            /* Cuando está colapsado: solo las 3 rayitas centradas arriba para expandir */
            <button
              type="button"
              className="sidebar-toggle-desktop-btn collapsed-toggle"
              onClick={onToggleCollapse}
              title="Expandir barra lateral"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Sección de Navegación Principal (Cuando está colapsado: SOLO ICONOS) */}
        <div className="sidebar-nav-section">
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-id={item.id}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  title={item.label}
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
                        
                        {/* Badges de alertas o contadores numéricos */}
                        <div className="sidebar-nav-badges">
                          {item.urgentBadge && (
                            <span className="badge badge-urgent animate-pulse">
                              {item.urgentBadge}
                            </span>
                          )}
                          {item.badge !== undefined && item.badge !== null && (
                            <span 
                              className="badge"
                              style={{ 
                                background: item.badgeColor ? `${item.badgeColor}22` : undefined,
                                color: item.badgeColor || undefined,
                                border: item.badgeColor ? `1px solid ${item.badgeColor}44` : undefined
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie del Sidebar: Modo Claro/Oscuro y Cerrar Sesión */}
        <div className="sidebar-footer">
          {/* Selector de Modo Claro / Oscuro */}
          <button 
            type="button"
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
              <span className="theme-action-title">
                {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
            )}
          </button>

          {/* Bloquear Sistema / Cerrar Sesión */}
          <button
            type="button"
            className="sidebar-footer-action lock-system-btn"
            onClick={onLockAdmin}
            title="Cerrar Sesión"
          >
            <Lock size={18} color="#f43f5e" />
            {!isCollapsed && (
              <span className="theme-action-title" style={{ color: '#f87171' }}>
                Cerrar Sesión
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
