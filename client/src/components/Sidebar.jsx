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
  Moon,
  Lock,
  ShieldCheck,
  Crown
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
    ...(isSuperAdmin ? [{
      id: 'distribuidores',
      label: 'Distribuidores',
      desc: 'Franquicias y licencias',
      icon: ShieldCheck,
      badge: distributorCount > 0 ? distributorCount : 'SaaS',
      badgeColor: '#10b981',
      color: '#10b981'
    }] : []),
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
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <div className="sidebar-app-name">
                  <span>Flow Stream</span>
                </div>
                <span className="sidebar-app-role">
                  {isSuperAdmin ? 'Super-Administrador' : 'Panel Distribuidor'}
                </span>
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

        {/* Tarjeta de Perfil del Distribuidor Activo */}
        {!isCollapsed && currentDistributor && (
          <div style={{
            margin: '0 12px 14px 12px',
            padding: '10px 12px',
            background: isSuperAdmin ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isSuperAdmin ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isSuperAdmin ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isSuperAdmin ? '#818cf8' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isSuperAdmin ? <Crown size={16} /> : <ShieldCheck size={16} />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ 
                fontSize: '11px', 
                fontFamily: 'monospace', 
                fontWeight: 700, 
                color: isSuperAdmin ? '#818cf8' : '#10b981',
                letterSpacing: '0.8px'
              }}>
                {currentDistributor.codigo_distribuidor || 'DIST-2026'}
              </div>
              <div style={{ 
                fontSize: '12.5px', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentDistributor.nombre || 'Distribuidor'}
              </div>
            </div>
          </div>
        )}

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
                      <span className="sidebar-nav-desc">{item.desc}</span>
                    </div>
                  )}

                  {/* Tooltip flotante en modo colapsado */}
                  {isCollapsed && (
                    <div className="sidebar-collapsed-tooltip">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Card de acceso rápido para Extractor de Códigos */}
        {!isCollapsed && (
          <div className="sidebar-quick-card">
            <div className="quick-card-badge">
              <Sparkles size={13} />
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

          {/* Bloquear Sistema / Cerrar Sesión */}
          <button
            type="button"
            className="sidebar-footer-action lock-system-btn"
            onClick={onLockAdmin}
            title={isCollapsed ? 'Bloquear Sistema' : undefined}
          >
            <Lock size={18} color="#f43f5e" />
            {!isCollapsed && (
              <div className="db-action-text">
                <span className="theme-action-title" style={{ color: '#f87171' }}>Cerrar Sesión</span>
                <span className="theme-action-sub">Bloquear panel</span>
              </div>
            )}
          </button>

          {/* Botón de colapso para Desktop */}
          <button 
            type="button"
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
