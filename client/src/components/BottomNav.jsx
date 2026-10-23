import React from 'react';
import { Users, Tv, KeyRound, Globe, Bell, ShieldCheck } from 'lucide-react';

export function BottomNav({
  activeTab,
  onSelectTab,
  urgentCount = 0,
  isSuperAdmin = false
}) {
  const tabs = [
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      badge: urgentCount > 0 ? urgentCount : null,
      badgeType: 'urgent',
      color: '#6366f1'
    },
    {
      id: 'cuentas',
      label: 'Cuentas',
      icon: Tv,
      color: '#06b6d4'
    },
    {
      id: 'codigos',
      label: 'Códigos',
      icon: KeyRound,
      color: '#10b981'
    },
    ...(isSuperAdmin ? [{
      id: 'distribuidores',
      label: 'Distribuidores',
      icon: ShieldCheck,
      color: '#10b981'
    }] : []),
    {
      id: 'portal',
      label: 'Portal',
      icon: Globe,
      color: '#a855f7'
    }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            style={{ '--active-color': tab.color }}
          >
            <div className="bottom-nav-icon-box">
              <Icon size={20} />
              {tab.badge && (
                <span className={`bottom-nav-badge ${tab.badgeType}`}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
