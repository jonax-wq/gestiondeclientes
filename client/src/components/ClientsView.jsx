import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  UserMinus, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Sparkles,
  Edit,
  Receipt,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { PLATFORMS } from '../constants/platforms';
import { calcularDiasRestantes, formatearFecha } from '../utils/storage';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Pagination } from './Pagination';
import { useToast } from '../context/ToastContext';

export function ClientsView({ 
  clientes = [], 
  cuentas = [], 
  onOpenWhatsApp, 
  onRenewClient, 
  onDeleteClient, 
  onEditClient,
  onNewClient,
  onOpenReceipt,
  activeFilter = 'todos',
  onFilterChange 
}) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [celularCopiado, setCelularCopiado] = useState(null);
  const [pinCopiado, setPinCopiado] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estado para visibilidad de números de celular (Oculto por defecto con ojito)
  const [visiblesTelefonos, setVisiblesTelefonos] = useState(() => new Set());
  const [showAllPhones, setShowAllPhones] = useState(false);

  // 1. Mapeo rápido de cuentas y perfiles por ID
  const cuentasMap = useMemo(() => {
    const map = {};
    cuentas.forEach(cta => {
      if (cta.id != null) {
        map[cta.id] = cta;
        map[String(cta.id)] = cta;
      }
    });
    return map;
  }, [cuentas]);

  const perfilesMap = useMemo(() => {
    const map = {};
    cuentas.forEach(cta => {
      (cta.perfiles || []).forEach(p => {
        if (p.id != null) {
          map[p.id] = { ...p, cuenta: cta };
          map[String(p.id)] = { ...p, cuenta: cta };
        }
      });
    });
    return map;
  }, [cuentas]);

  // 2. Agrupación inteligente de suscripciones por Cliente único
  const clientGroups = useMemo(() => {
    const map = new Map();
    const groups = [];

    clientes.forEach(cli => {
      const rawPhone = (cli.celular || '').replace(/\D/g, '');
      const codPais = (cli.codigoPais || '+51').trim();
      // Clave única: si tiene celular con 6+ dígitos se agrupa por país+número; de lo contrario por nombre
      const groupKey = rawPhone.length >= 6 
        ? `${codPais}-${rawPhone}`
        : `name-${(cli.nombre || 'cliente').trim().toLowerCase()}`;

      const diasRestantes = calcularDiasRestantes(cli.fechaVencimiento);
      const perfilInfo = perfilesMap[cli.perfilId];
      const cuentaInfo = cuentasMap[cli.cuentaId] || perfilInfo?.cuenta;
      const platformInfo = cuentaInfo ? PLATFORMS[cuentaInfo.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;
      const esUrgente = diasRestantes >= 0 && diasRestantes <= 2;
      const esVencido = diasRestantes < 0;

      const subItem = {
        cliente: cli,
        perfilInfo,
        cuentaInfo,
        platformInfo,
        diasRestantes,
        esUrgente,
        esVencido
      };

      if (!map.has(groupKey)) {
        const newGroup = {
          key: groupKey,
          nombre: cli.nombre || 'Cliente',
          celular: cli.celular || '',
          codigoPais: codPais,
          plataformas: [subItem]
        };
        map.set(groupKey, newGroup);
        groups.push(newGroup);
      } else {
        const existingGroup = map.get(groupKey);
        if ((!existingGroup.nombre || existingGroup.nombre === 'Cliente') && cli.nombre) {
          existingGroup.nombre = cli.nombre;
        }
        existingGroup.plataformas.push(subItem);
      }
    });

    // Calcular estadísticas consolidadas por cliente
    groups.forEach(g => {
      // Ordenar plataformas: las que vencen antes o ya vencieron van primero
      g.plataformas.sort((a, b) => a.diasRestantes - b.diasRestantes);

      g.plataformaCritica = g.plataformas[0];
      g.minDiasRestantes = g.plataformaCritica?.diasRestantes ?? 999;
      g.proximoVencimiento = g.plataformaCritica?.cliente?.fechaVencimiento;

      g.tieneUrgente = g.plataformas.some(p => p.esUrgente);
      g.tieneVencido = g.plataformas.some(p => p.esVencido);
      g.tieneActivo = g.plataformas.some(p => !p.esVencido);

      g.totalPlataformas = g.plataformas.length;
    });

    return groups;
  }, [clientes, cuentasMap, perfilesMap]);

  // 3. Filtrado por estado y término de búsqueda
  const gruposFiltrados = useMemo(() => {
    return clientGroups.filter(g => {
      // Filtro por pestaña
      if (activeFilter === 'por_vencer' && !g.tieneUrgente) return false;
      if (activeFilter === 'vencidos' && !g.tieneVencido) return false;
      if (activeFilter === 'activos' && !g.tieneActivo) return false;

      // Filtro por búsqueda
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const nombreMatch = (g.nombre || '').toLowerCase().includes(term);
      const celMatch = `${g.codigoPais} ${g.celular}`.toLowerCase().includes(term);

      // Buscar también dentro de los detalles de las plataformas asignadas
      const platMatch = g.plataformas.some(p => {
        const platName = (p.platformInfo?.name || p.cuentaInfo?.plataforma || '').toLowerCase();
        const prfNom = (p.perfilInfo?.nombre || '').toLowerCase();
        const pin = (p.cliente?.pin || p.perfilInfo?.pin || '').toLowerCase();
        return platName.includes(term) || prfNom.includes(term) || pin.includes(term);
      });

      return nombreMatch || celMatch || platMatch;
    });
  }, [clientGroups, activeFilter, searchTerm]);

  // Resetear a la página 1 cuando cambia el filtro o término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  // Conteo de grupos por categorías
  const urgentCount = useMemo(() => clientGroups.filter(g => g.tieneUrgente).length, [clientGroups]);
  const expiredCount = useMemo(() => clientGroups.filter(g => g.tieneVencido).length, [clientGroups]);
  const activeCount = useMemo(() => clientGroups.filter(g => g.tieneActivo).length, [clientGroups]);

  // Paginación por Tarjeta de Cliente
  const totalItems = gruposFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedGrupos = gruposFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // Alternar visibilidad de teléfono individual
  const togglePhoneVisibility = (key, e) => {
    if (e) e.stopPropagation();
    setVisiblesTelefonos(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Alternar visibilidad global de todos los teléfonos
  const handleToggleAllPhones = () => {
    if (showAllPhones) {
      setVisiblesTelefonos(new Set());
      setShowAllPhones(false);
    } else {
      const all = new Set(clientGroups.map(g => g.key));
      setVisiblesTelefonos(all);
      setShowAllPhones(true);
    }
  };

  // Formato del teléfono (Oculto / Visible)
  const renderMaskedPhone = (codigoPais, celular, isVisible) => {
    if (!celular) return 'Sin número';
    if (isVisible) {
      return `${codigoPais} ${celular}`;
    }
    return `${codigoPais} ••• ••• •••`;
  };

  const handleCopiarCelular = (celular, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(celular);
    setCelularCopiado(id);
    toast.success('Número de WhatsApp copiado al portapapeles');
    setTimeout(() => setCelularCopiado(null), 2000);
  };

  const handleCopiarPin = (pin, id, e) => {
    if (e) e.stopPropagation();
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setPinCopiado(id);
    toast.success(`PIN ${pin} copiado`);
    setTimeout(() => setPinCopiado(null), 2000);
  };

  // Helper para renderizar el tag de vencimiento
  const renderExpiryTag = (diasRestantes) => {
    if (diasRestantes < 0) {
      return (
        <span className="expiry-tag expired">
          ⛔ Venció hace {Math.abs(diasRestantes)} {Math.abs(diasRestantes) === 1 ? 'día' : 'días'}
        </span>
      );
    }
    if (diasRestantes === 0) {
      return (
        <span className="expiry-tag urgent-today pulse-attention" title="Su membresía vence hoy">
          🔥 Vence hoy
        </span>
      );
    }
    if (diasRestantes === 1) {
      return (
        <span className="expiry-tag urgent-2 pulse-amber" title="Falta 1 día para que acabe su membresía">
          ⚠️ Vence en 1 día
        </span>
      );
    }
    if (diasRestantes === 2) {
      return (
        <span className="expiry-tag urgent-2 pulse-amber" title="Faltan exactamente 2 días">
          ⚠️ Vence en 2 días
        </span>
      );
    }
    return (
      <span className="expiry-tag active">
        🟢 Vence en {diasRestantes} días
      </span>
    );
  };

  return (
    <div className="content-card">
      {/* Barra superior de herramientas y filtros */}
      <div className="toolbar">
        {/* Buscador */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Buscar por cliente, celular, plataforma o PIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Píldoras de filtrado */}
        <div className="filter-pills">
          <button 
            className={`pill-btn pill-todos ${activeFilter === 'todos' ? 'active' : ''}`}
            onClick={() => onFilterChange('todos')}
          >
            <span>Todos</span>
            <span className="counter-badge">{clientGroups.length}</span>
          </button>

          <button 
            className={`pill-btn pill-urgent ${activeFilter === 'por_vencer' ? 'active' : ''}`}
            onClick={() => onFilterChange('por_vencer')}
          >
            <Clock size={14} />
            <span>Por Vencer (≤ 2 Días)</span>
            <span className="counter-badge">{urgentCount}</span>
          </button>

          <button 
            className={`pill-btn pill-activos ${activeFilter === 'activos' ? 'active' : ''}`}
            onClick={() => onFilterChange('activos')}
          >
            <CheckCircle2 size={14} />
            <span>Activos</span>
            <span className="counter-badge">{activeCount}</span>
          </button>

          <button 
            className={`pill-btn pill-vencidos ${activeFilter === 'vencidos' ? 'active' : ''}`}
            onClick={() => onFilterChange('vencidos')}
          >
            <AlertTriangle size={14} />
            <span>Vencidos</span>
            <span className="counter-badge">{expiredCount}</span>
          </button>

          {/* Botón para ver u ocultar números de celular */}
          <button 
            type="button" 
            className={`pill-btn pill-phone-toggle ${showAllPhones ? 'active' : ''}`}
            onClick={handleToggleAllPhones}
            title={showAllPhones ? 'Ocultar todos los celulares' : 'Mostrar todos los celulares'}
          >
            {showAllPhones ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showAllPhones ? 'Ocultar Números' : 'Ver Números'}</span>
          </button>

          <button 
            className="btn btn-primary" 
            onClick={() => onNewClient()} 
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            <Plus size={16} />
            <span>+ Asignar Cliente</span>
          </button>
        </div>
      </div>

      {/* Contenido Principal: Bloques de Tarjetas por Cliente (Todo Visible, Cero Clics Extras) */}
      {gruposFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={28} />
          </div>
          <h3 className="empty-title">No se encontraron clientes</h3>
          <p className="empty-desc">
            {searchTerm 
              ? `No hay resultados para "${searchTerm}". Intenta con otro criterio.`
              : activeFilter === 'por_vencer'
              ? '¡Excelente! Ningún cliente tiene suscripciones a 2 días o menos de vencer.'
              : 'Aún no tienes clientes registrados en este estado.'}
          </p>
          <button className="btn btn-primary" onClick={() => onNewClient()}>
            <Plus size={16} />
            <span>Asignar tu primer cliente</span>
          </button>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VISTA 1: BLOQUES DE CLIENTES DESKTOP / TABLET (> 768px)                   */}
          {/* ========================================================================= */}
          <div className="client-blocks-container desktop-only-view">
            {paginatedGrupos.map((g) => {
              const platCritica = g.plataformaCritica;
              const esUrgente = g.tieneUrgente;
              const esVencido = g.tieneVencido;
              const initialLetter = (g.nombre || 'C').charAt(0).toUpperCase();
              const isPhoneVisible = showAllPhones || visiblesTelefonos.has(g.key);

              return (
                <div 
                  key={g.key} 
                  className={`client-card-block ${esUrgente ? 'block-urgent' : esVencido ? 'block-expired' : ''}`}
                >
                  {/* 1. Cabecera del Bloque del Cliente */}
                  <div className="client-card-header">
                    {/* Izquierda: Avatar + Nombre + Celular (con ojito y copiar) + Badge de plataformas */}
                    <div className="client-header-left">
                      <div className="client-avatar-badge" title={g.nombre}>
                        {initialLetter}
                      </div>

                      <div className="client-header-info">
                        <div className="client-name-row">
                          <span className="client-name-title">{g.nombre}</span>
                          {g.totalPlataformas > 1 ? (
                            <span className="multi-plat-badge" title={`Tiene ${g.totalPlataformas} servicios contratados`}>
                              <Sparkles size={11} />
                              <span>{g.totalPlataformas} plataformas</span>
                            </span>
                          ) : (
                            <span className="single-plat-badge">
                              1 plataforma
                            </span>
                          )}
                        </div>

                        <div className="client-phone-row">
                          <span className={`client-phone-number ${!isPhoneVisible ? 'is-masked' : ''}`}>
                            {renderMaskedPhone(g.codigoPais, g.celular, isPhoneVisible)}
                          </span>
                          <button
                            type="button"
                            className="btn-eye-inline"
                            onClick={(e) => togglePhoneVisibility(g.key, e)}
                            title={isPhoneVisible ? 'Ocultar número de celular' : 'Ver número de celular'}
                          >
                            {isPhoneVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            className="btn-copy-inline"
                            onClick={(e) => handleCopiarCelular(`${g.codigoPais}${g.celular}`, g.key, e)}
                            title="Copiar WhatsApp al portapapeles"
                          >
                            {celularCopiado === g.key ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Derecha: Resumen de próximo corte + Botón + Asignar + Botón WhatsApp */}
                    <div className="client-header-right">
                      <div className="client-header-status">
                        <span className="status-label">
                          Próx. corte: <strong>{formatearFecha(g.proximoVencimiento)}</strong>
                        </span>
                        {renderExpiryTag(g.minDiasRestantes)}
                      </div>

                      <button
                        type="button"
                        className="btn-card-assign"
                        onClick={() => onNewClient({ cliente: g })}
                        title={`Asignar otra plataforma a ${g.nombre}`}
                      >
                        <Plus size={14} />
                        <span>+ Asignar pantalla</span>
                      </button>

                      <button
                        type="button"
                        className={`btn-whatsapp-header ${esUrgente ? 'pulse-attention' : ''}`}
                        onClick={() => {
                          if (platCritica) {
                            onOpenWhatsApp(platCritica.cliente, platCritica.perfilInfo, platCritica.cuentaInfo);
                          }
                        }}
                        title={`Enviar WhatsApp a ${g.nombre}`}
                      >
                        <WhatsAppIcon size={16} color="#ffffff" />
                        <span>WhatsApp</span>
                        {platCritica?.cliente?.recordatorioEnviado && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>✓✓</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Subtabla con Todas las Pantallas del Cliente (100% VISIBLES de inmediato) */}
                  <div className="client-card-table-wrapper">
                    <table className="client-card-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', minWidth: '220px' }}>Plataforma & Perfil</th>
                          <th style={{ textAlign: 'center', minWidth: '120px' }}>PIN de Acceso</th>
                          <th style={{ textAlign: 'center', minWidth: '120px' }}>Fecha Inicio</th>
                          <th style={{ textAlign: 'center', minWidth: '140px' }}>Vencimiento</th>
                          <th style={{ textAlign: 'center', minWidth: '155px' }}>Estado</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>WhatsApp</th>
                          <th style={{ textAlign: 'center', minWidth: '170px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.plataformas.map((p) => {
                          const cli = p.cliente;
                          const plat = p.platformInfo;
                          const prf = p.perfilInfo;
                          const cta = p.cuentaInfo;
                          const dias = p.diasRestantes;
                          const esItemUrgente = p.esUrgente;
                          const esItemVencido = p.esVencido;

                          return (
                            <tr 
                              key={cli.id}
                              className={`client-table-row ${esItemUrgente ? 'row-item-urgent' : esItemVencido ? 'row-item-expired' : ''}`}
                            >
                              {/* Plataforma & Perfil */}
                              <td style={{ textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {plat.logo ? (
                                    <img
                                      src={plat.logo}
                                      alt={plat.name}
                                      title={plat.name}
                                      style={{
                                        height: '26px',
                                        maxWidth: '65px',
                                        objectFit: 'contain',
                                        borderRadius: '4px',
                                        display: 'block'
                                      }}
                                    />
                                  ) : (
                                    <span 
                                      className="platform-pill"
                                      data-platform={plat.id}
                                      style={{
                                        backgroundColor: plat.badgeBg,
                                        color: plat.textColor,
                                        borderColor: plat.borderColor,
                                        fontSize: '0.75rem',
                                        padding: '3px 8px'
                                      }}
                                    >
                                      {plat.name}
                                    </span>
                                  )}
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {prf?.nombre || `Perfil ${prf?.numero || '?'}`}
                                    </span>
                                    {cta?.correo && (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {cta.correo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* PIN de Acceso con botón copiar */}
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <span className="pin-badge">
                                    <KeyRound size={11} style={{ marginRight: '3px', opacity: 0.7 }} />
                                    {cli.pin || prf?.pin || '----'}
                                  </span>
                                  {(cli.pin || prf?.pin) && (
                                    <button
                                      type="button"
                                      className="btn-copy-inline"
                                      onClick={(e) => handleCopiarPin(cli.pin || prf?.pin, cli.id, e)}
                                      title="Copiar PIN"
                                    >
                                      {pinCopiado === cli.id ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Fecha de Inicio */}
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                  {formatearFecha(cli.fechaInicio)}
                                </span>
                              </td>

                              {/* Vencimiento */}
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {formatearFecha(cli.fechaVencimiento)}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Plan de 30 días
                                  </span>
                                </div>
                              </td>

                              {/* Estado Individual */}
                              <td style={{ textAlign: 'center' }}>
                                {renderExpiryTag(dias)}
                              </td>

                              {/* WhatsApp Directo de esta pantalla */}
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-subrow-whatsapp"
                                  onClick={() => onOpenWhatsApp(cli, prf, cta)}
                                  title={`Enviar datos de ${plat.name} por WhatsApp`}
                                >
                                  <WhatsAppIcon size={15} color="#ffffff" />
                                  <span>Avisar</span>
                                </button>
                              </td>

                              {/* Acciones de la Pantalla */}
                              <td style={{ textAlign: 'center' }}>
                                <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    className="btn-icon-action receipt"
                                    onClick={() => onOpenReceipt && onOpenReceipt(cli, prf, cta)}
                                    title="Emitir Comprobante / Recibo Digital"
                                  >
                                    <Receipt size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-action edit"
                                    onClick={() => onEditClient && onEditClient(cli)}
                                    title="Editar cliente, PIN o fecha"
                                  >
                                    <Edit size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-action renew"
                                    onClick={() => onRenewClient(cli.id)}
                                    title="Renovar membresía por 30 días más"
                                  >
                                    <RefreshCw size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-action delete"
                                    onClick={() => onDeleteClient(cli)}
                                    title="Dar de baja y liberar perfil"
                                  >
                                    <UserMinus size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* VISTA 2: TARJETAS MÓVILES (< 768px)                                       */}
          {/* ========================================================================= */}
          <div className="mobile-cards-view">
            {paginatedGrupos.map((g) => {
              const platCritica = g.plataformaCritica;
              const esUrgente = g.tieneUrgente;
              const esVencido = g.tieneVencido;
              const initialLetter = (g.nombre || 'C').charAt(0).toUpperCase();
              const isPhoneVisible = showAllPhones || visiblesTelefonos.has(g.key);

              return (
                <div 
                  key={g.key}
                  className={`client-card-block mobile ${esUrgente ? 'block-urgent' : esVencido ? 'block-expired' : ''}`}
                >
                  {/* Cabecera Móvil */}
                  <div className="client-card-header mobile">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="client-avatar-badge mobile" title={g.nombre}>
                        {initialLetter}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-light)', margin: 0 }}>
                          {g.nombre}
                        </h4>
                        <div className="client-phone-row" style={{ marginTop: '2px' }}>
                          <span className={`client-phone-number ${!isPhoneVisible ? 'is-masked' : ''}`}>
                            {renderMaskedPhone(g.codigoPais, g.celular, isPhoneVisible)}
                          </span>
                          <button
                            type="button"
                            className="btn-eye-inline"
                            onClick={(e) => togglePhoneVisibility(g.key, e)}
                            title={isPhoneVisible ? 'Ocultar número' : 'Ver número'}
                          >
                            {isPhoneVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            type="button"
                            className="btn-copy-inline"
                            onClick={(e) => handleCopiarCelular(`${g.codigoPais}${g.celular}`, g.key, e)}
                            title="Copiar número"
                          >
                            {celularCopiado === g.key ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {g.totalPlataformas > 1 ? (
                      <span className="multi-plat-badge mobile">
                        <Sparkles size={11} />
                        <span>{g.totalPlataformas} servicios</span>
                      </span>
                    ) : (
                      <span className="single-plat-badge mobile">
                        1 servicio
                      </span>
                    )}
                  </div>

                  {/* Acciones principales del cliente en móvil */}
                  <div style={{ display: 'flex', gap: '8px', padding: '10px 14px 0 14px' }}>
                    <button
                      type="button"
                      className={`btn btn-whatsapp mobile-wa-btn ${esUrgente ? 'pulse-attention' : ''}`}
                      style={{ flex: 1.2 }}
                      onClick={() => {
                        if (platCritica) {
                          onOpenWhatsApp(platCritica.cliente, platCritica.perfilInfo, platCritica.cuentaInfo);
                        }
                      }}
                    >
                      <WhatsAppIcon size={17} color="#ffffff" />
                      <span>{esUrgente ? 'Alerta WhatsApp' : 'WhatsApp'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-card-assign"
                      style={{ flex: 1, height: '38px', justifyContent: 'center' }}
                      onClick={() => onNewClient({ cliente: g })}
                    >
                      <Plus size={14} />
                      <span>+ Asignar</span>
                    </button>
                  </div>

                  {/* Lista de pantallas móviles 100% visibles */}
                  <div className="mobile-expanded-subitems" style={{ padding: '12px 14px 14px 14px', borderTop: 'none' }}>
                    {g.plataformas.map((p) => {
                      const cli = p.cliente;
                      const plat = p.platformInfo;
                      const prf = p.perfilInfo;
                      const cta = p.cuentaInfo;

                      return (
                        <div key={cli.id} className="mobile-subitem-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {plat.logo ? (
                                <img src={plat.logo} alt={plat.name} style={{ height: '22px', objectFit: 'contain' }} />
                              ) : (
                                <span className="platform-pill">{plat.name}</span>
                              )}
                              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                {prf?.nombre || `Perfil ${prf?.numero || '?'}`}
                              </span>
                            </div>
                            <span className="pin-badge" style={{ fontSize: '0.78rem' }}>
                              PIN: {cli.pin || prf?.pin || '----'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Vence: <strong>{formatearFecha(cli.fechaVencimiento)}</strong></span>
                            {renderExpiryTag(p.diasRestantes)}
                          </div>

                          {/* Acciones de la pantalla */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-secondary mobile-mini-action"
                              onClick={() => onOpenWhatsApp(cli, prf, cta)}
                              title="Aviso WhatsApp"
                            >
                              <WhatsAppIcon size={13} color="#22c55e" />
                              <span>Aviso</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary mobile-mini-action"
                              onClick={() => onOpenReceipt && onOpenReceipt(cli, prf, cta)}
                              title="Recibo"
                            >
                              <Receipt size={13} />
                              <span>Recibo</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary mobile-mini-action"
                              onClick={() => onEditClient && onEditClient(cli)}
                              title="Editar"
                            >
                              <Edit size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary mobile-mini-action"
                              onClick={() => onRenewClient(cli.id)}
                              title="Renovar +30d"
                            >
                              <RefreshCw size={13} />
                              <span>+30d</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary mobile-mini-action"
                              onClick={() => onDeleteClient(cli)}
                              title="Baja"
                            >
                              <UserMinus size={13} />
                              <span>Baja</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación de Bloques de Clientes */}
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onItemsPerPageChange={(newSize) => {
              setItemsPerPage(newSize);
            }}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            itemLabel="clientes"
          />
        </>
      )}
    </div>
  );
}
