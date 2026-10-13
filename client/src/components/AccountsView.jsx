import React, { useState } from 'react';
import {
  Tv,
  Key,
  Mail,
  Calendar,
  UserCheck,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  MessageCircle,
  Plus,
  ShieldCheck,
  Edit,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { PLATFORMS } from '../constants/platforms';
import { formatearFecha, calcularDiasRestantes } from '../utils/storage';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

export function AccountsView({
  cuentas = [],
  clientes = [],
  onNewAccount,
  onAssignProfile,
  onDeleteAccount,
  onOpenWhatsApp,
  onRenewAccount,
  onEditAccount
}) {
  const [showPassword, setShowPassword] = useState({});
  const [copiedItem, setCopiedItem] = useState(null);
  const [expandedAccounts, setExpandedAccounts] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleExpand = (cuentaId) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [cuentaId]: !prev[cuentaId]
    }));
  };

  const handleToggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded = {};
    cuentas.forEach(c => {
      newExpanded[c.id] = nextState;
    });
    setExpandedAccounts(newExpanded);
  };

  // Mapear clientes por perfilId para acceso rápido
  const clientesPorPerfil = {};
  clientes.forEach(c => {
    clientesPorPerfil[c.perfilId] = c;
  });

  const togglePassword = (cuentaId) => {
    setShowPassword(prev => ({ ...prev, [cuentaId]: !prev[cuentaId] }));
  };

  const handleCopiar = (texto, key) => {
    navigator.clipboard.writeText(texto);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="content-card">
      <div className="toolbar">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
            Cuentas Maestras
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Administra tus cuentas de streaming completas y monitorea la ocupación de sus pantallas
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {cuentas.length > 0 && (
            <button 
              type="button" 
              className="pill-btn" 
              onClick={handleToggleAll}
              style={{ fontSize: '0.82rem' }}
              title={allExpanded ? 'Colapsar pantallas de todas las cuentas' : 'Desplegar pantallas de todas las cuentas'}
            >
              <Layers size={14} />
              <span>{allExpanded ? 'Ocultar Todas las Pantallas' : 'Ver Todas las Pantallas'}</span>
            </button>
          )}

          <button className="btn btn-primary" onClick={onNewAccount}>
            <Plus size={18} />
            <span>+ Registrar Cuenta Completa</span>
          </button>
        </div>
      </div>

      {cuentas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Tv size={28} />
          </div>
          <h3 className="empty-title">No tienes cuentas registradas</h3>
          <p className="empty-desc">
            Agrega tu primera cuenta completa (Netflix, Disney+, Max, etc.) con sus perfiles para empezar a vender pantallas a tus clientes.
          </p>
          <button className="btn btn-primary" onClick={onNewAccount}>
            <Plus size={16} />
            <span>Registrar Cuenta Ahora</span>
          </button>
        </div>
      ) : (
        <div className="accounts-grid">
          {cuentas.map(cta => {
            const platformInfo = PLATFORMS[cta.plataforma] || PLATFORMS.Otro;
            const perfiles = cta.perfiles || [];
            const ocupados = perfiles.filter(p => p.estado === 'asignado').length;
            const total = perfiles.length;
            const porcentaje = total > 0 ? Math.round((ocupados / total) * 100) : 0;
            const isPasswordVisible = !!showPassword[cta.id];
            const isExpanded = !!expandedAccounts[cta.id];

            return (
              <div key={cta.id} className="account-card">
                {/* Cabecera de la cuenta con color de la marca */}
                <div
                  className="account-card-header"
                  style={{
                    background: platformInfo.bgGradient,
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className="platform-pill"
                      style={{
                        backgroundColor: platformInfo.badgeBg,
                        color: platformInfo.textColor,
                        borderColor: platformInfo.borderColor,
                        fontSize: '0.88rem'
                      }}
                    >
                      {platformInfo.name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {ocupados}/{total} pantallas ocupadas
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-icon-action edit"
                      onClick={() => onEditAccount && onEditAccount(cta)}
                      title="Editar cuenta maestra, credenciales y perfiles"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action renew"
                      onClick={() => onRenewAccount && onRenewAccount(cta.id)}
                      title="Renovar corte mensual (+30 días)"
                    >
                      <RefreshCw size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action delete"
                      onClick={() => onDeleteAccount(cta.id)}
                      title="Eliminar cuenta completa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="account-card-body">
                  {/* Credenciales de la cuenta */}
                  <div className="credential-box">
                    {/* Correo */}
                    <div className="cred-row">
                      <span className="cred-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={13} /> Correo:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="cred-val">{cta.correo}</span>
                        <button
                          type="button"
                          onClick={() => handleCopiar(cta.correo, `email-${cta.id}`)}
                          style={{ background: 'none', border: 'none', color: copiedItem === `email-${cta.id}` ? '#34d399' : '#64748b', cursor: 'pointer' }}
                          title="Copiar correo"
                        >
                          {copiedItem === `email-${cta.id}` ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div className="cred-row">
                      <span className="cred-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Key size={13} /> Contraseña:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="cred-val">
                          {isPasswordVisible ? cta.password : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePassword(cta.id)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                          title={isPasswordVisible ? 'Ocultar clave' : 'Mostrar clave'}
                        >
                          {isPasswordVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopiar(cta.password, `pass-${cta.id}`)}
                          style={{ background: 'none', border: 'none', color: copiedItem === `pass-${cta.id}` ? '#34d399' : '#64748b', cursor: 'pointer' }}
                          title="Copiar contraseña"
                        >
                          {copiedItem === `pass-${cta.id}` ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Fecha de corte de la cuenta maestra con indicador de días */}
                    {(() => {
                      const diasCorte = calcularDiasRestantes(cta.fechaCorte);
                      return (
                        <div className="cred-row" style={{ alignItems: 'flex-start' }}>
                          <span className="cred-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '2px' }}>
                            <Calendar size={13} /> Corte Cuenta:
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600 }}>
                              {formatearFecha(cta.fechaCorte)}
                            </span>
                            <div style={{ marginTop: '2px' }}>
                              {diasCorte < 0 ? (
                                <span style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                  ⛔ Venció corte hace {Math.abs(diasCorte)}d
                                </span>
                              ) : diasCorte <= 3 ? (
                                <span style={{ fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                  ⚠️ Corte en {diasCorte} días
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#34d399' }}>
                                  🟢 Corte en {diasCorte} días
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Costo mensual en Soles y renovaciones */}
                    <div className="cred-row">
                      <span className="cred-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          lineHeight: 1
                        }}>S/</span>
                        <span>Costo Mensual:</span>
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
                          S/ {Number(cta.costo || 0).toFixed(2)}
                        </span>
                        {cta.renovaciones > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Renovado {cta.renovaciones} {cta.renovaciones === 1 ? 'mes' : 'meses'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón directo de Renovación de la Cuenta Maestra */}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onRenewAccount && onRenewAccount(cta.id)}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      title="Renovar mensualidad de la cuenta maestra (+30 días de corte y registra gasto mensual)"
                    >
                      <RefreshCw size={14} />
                      <span>Renovar Cuenta Maestra</span>
                    </button>
                  </div>

                  {/* Desplegable / Acordeón para Perfiles y Pantallas */}
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="profile-accordion-btn"
                      onClick={() => toggleExpand(cta.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isExpanded ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid ' + (isExpanded ? 'rgba(99, 102, 241, 0.45)' : 'var(--border-subtle)'),
                        color: isExpanded ? '#c7d2fe' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease'
                      }}
                      title={isExpanded ? 'Ocultar pantallas de esta cuenta' : 'Desplegar pantallas y perfiles de esta cuenta'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={15} style={{ color: isExpanded ? '#818cf8' : '#94a3b8' }} />
                        <span>{isExpanded ? 'Ocultar Pantallas' : `Ver Pantallas / Perfiles (${total})`}</span>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 7px',
                          borderRadius: '8px',
                          background: ocupados === total ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                          color: ocupados === total ? '#fb7185' : '#6ee7b7',
                          fontWeight: 700
                        }}>
                          {ocupados}/{total} ocupadas
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{porcentaje}%</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Contenido Desplegable: Barra de capacidad y Lista de perfiles */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        {/* Barra de progreso de ocupación */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                            <span style={{ color: '#94a3b8' }}>Capacidad vendida</span>
                            <span style={{ color: porcentaje === 100 ? '#f43f5e' : '#38bdf8', fontWeight: 700 }}>
                              {porcentaje}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${porcentaje}%`,
                                height: '100%',
                                background: porcentaje === 100 ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>

                        {/* Lista de Pantallas / Perfiles */}
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                            Perfiles ({perfiles.length}):
                          </span>
                          <div className="profiles-list">
                            {perfiles.map(p => {
                              const clienteAsignado = clientesPorPerfil[p.id];
                              const estaAsignado = p.estado === 'asignado' || !!clienteAsignado;

                              return (
                                <div
                                  key={p.id}
                                  className={`profile-slot ${estaAsignado ? 'assigned' : 'available'}`}
                                >
                                  <div className="profile-slot-top">
                                    <span className="profile-num">#{p.numero}</span>
                                    <span className={`profile-status-badge ${estaAsignado ? 'assigned' : 'available'}`}>
                                      {estaAsignado ? 'Ocupado' : 'Libre'}
                                    </span>
                                  </div>

                                  <div className="profile-title" title={p.nombre}>
                                    {p.nombre}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                    <span className="pin-badge" style={{ fontSize: '0.72rem', padding: '1px 5px' }}>
                                      PIN: {p.pin || '----'}
                                    </span>
                                  </div>

                                  {estaAsignado && clienteAsignado ? (
                                    <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                                      <div className="profile-client-name" title={clienteAsignado.nombre}>
                                        👤 {clienteAsignado.nombre}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                        <span>{clienteAsignado.celular}</span>
                                        <button
                                          type="button"
                                          onClick={() => onOpenWhatsApp(clienteAsignado, p, cta)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#25d366',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                          title="Enviar WhatsApp al cliente de esta pantalla"
                                        >
                                          <WhatsAppIcon size={14} color="#25d366" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ marginTop: '6px' }}>
                                      <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => onAssignProfile(cta.id, p.id)}
                                        style={{
                                          width: '100%',
                                          padding: '4px 6px',
                                          fontSize: '0.72rem',
                                          borderColor: 'rgba(16, 185, 129, 0.4)',
                                          color: '#6ee7b7',
                                          background: 'rgba(16, 185, 129, 0.1)'
                                        }}
                                      >
                                        <UserPlus size={12} />
                                        <span>+ Asignar</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
