import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MessageCircle, 
  RefreshCw, 
  UserMinus, 
  Copy, 
  Check, 
  Phone, 
  Calendar, 
  KeyRound, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  PlusCircle,
  Sparkles,
  Edit,
  Receipt,
  UserCheck
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
  onAddService,
  onOpenReceipt,
  activeFilter = 'todos',
  onFilterChange 
}) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [celularCopiado, setCelularCopiado] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mapeo rápido de cuenta y perfil por ID
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

  // 1. Agrupar todas las membresías/perfiles asignados por cliente único (por número de celular)
  const todosLosGrupos = useMemo(() => {
    const map = new Map();
    (clientes || []).forEach(cli => {
      const cleanPhone = (cli.celular || '').replace(/\D/g, '') || `cli-${cli.id}`;
      if (!map.has(cleanPhone)) {
        map.set(cleanPhone, {
          key: cleanPhone,
          id: cli.id,
          nombre: cli.nombre || 'Cliente',
          celular: cli.celular || '',
          codigoPais: cli.codigoPais || '+51',
          servicios: []
        });
      }
      const grp = map.get(cleanPhone);
      if (cli.nombre && cli.nombre !== 'Cliente' && (grp.nombre === 'Cliente' || !grp.nombre)) {
        grp.nombre = cli.nombre;
      }
      grp.servicios.push(cli);
    });
    return Array.from(map.values());
  }, [clientes]);

  // 2. Filtrar grupos según la pestaña activa y término de búsqueda
  const gruposFiltrados = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return todosLosGrupos.map(grp => {
      const serviciosFiltrados = grp.servicios.filter(cli => {
        const dias = calcularDiasRestantes(cli.fechaVencimiento);
        const perfilInfo = perfilesMap[cli.perfilId];
        const cuentaInfo = cuentasMap[cli.cuentaId] || perfilInfo?.cuenta;

        // Filtro por pestaña
        if (activeFilter === 'por_vencer' && (dias > 2 || dias < 0)) return false;
        if (activeFilter === 'vencidos' && dias >= 0) return false;
        if (activeFilter === 'activos' && dias < 0) return false;

        // Filtro por búsqueda
        if (!term) return true;
        const nombre = (cli.nombre || grp.nombre || '').toLowerCase();
        const cel = (cli.celular || '').toLowerCase();
        const plat = (cuentaInfo?.plataforma || '').toLowerCase();
        const prfNom = (perfilInfo?.nombre || '').toLowerCase();
        const pin = (cli.pin || '').toLowerCase();

        return (
          nombre.includes(term) ||
          cel.includes(term) ||
          plat.includes(term) ||
          prfNom.includes(term) ||
          pin.includes(term)
        );
      });

      if (serviciosFiltrados.length === 0) return null;

      return {
        ...grp,
        servicios: serviciosFiltrados
      };
    }).filter(Boolean);
  }, [todosLosGrupos, activeFilter, searchTerm, perfilesMap, cuentasMap]);

  // Resetear a la página 1 cuando cambia el filtro o término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  // Cálculo de paginación
  const totalItems = gruposFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedGrupos = gruposFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // Conteo de por vencer a 2 días o menos
  const urgentCount = clientes.filter(c => {
    const d = calcularDiasRestantes(c.fechaVencimiento);
    return d >= 0 && d <= 2;
  }).length;

  const expiredCount = clientes.filter(c => calcularDiasRestantes(c.fechaVencimiento) < 0).length;
  const activeCount = clientes.filter(c => calcularDiasRestantes(c.fechaVencimiento) >= 0).length;

  const handleCopiarCelular = (celular, id) => {
    navigator.clipboard.writeText(celular);
    setCelularCopiado(id);
    toast.success('Número de WhatsApp copiado al portapapeles');
    setTimeout(() => setCelularCopiado(null), 2000);
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
            placeholder="Buscar por celular, nombre, plataforma o PIN..."
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
            <span className="counter-badge">{todosLosGrupos.length}</span>
          </button>

          <button 
            className={`pill-btn pill-urgent ${activeFilter === 'por_vencer' ? 'active' : ''}`}
            onClick={() => onFilterChange('por_vencer')}
          >
            <Clock size={14} />
            <span>Por Vencer (≤ 2 Días)</span>
            <span className="counter-badge">
              {urgentCount}
            </span>
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

          <button className="btn btn-primary" onClick={onNewClient} style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
            <Plus size={16} />
            <span>+ Asignar Cliente</span>
          </button>
        </div>
      </div>

      {/* Tabla de Clientes (Desktop / Tablet) y Cards (Móvil) */}
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
              ? '¡Excelente! Ningún cliente está a 2 días o menos de vencer en este momento.'
              : 'Aún no tienes clientes registrados en este estado.'}
          </p>
          <button className="btn btn-primary" onClick={onNewClient}>
            <Plus size={16} />
            <span>Asignar tu primer cliente</span>
          </button>
        </div>
      ) : (
        <>
          {/* VISTA 1: TABLA TRADICIONAL (Visible en Desktop y Tablets > 768px) */}
          <div className="table-responsive desktop-only-view">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cliente / Celular</th>
                  <th>Plataforma & Perfil</th>
                  <th>PIN</th>
                  <th>Fecha Inicio</th>
                  <th>Vencimiento (30 días)</th>
                  <th>Estado & Alerta</th>
                  <th style={{ textAlign: 'center' }}>WhatsApp Directo</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGrupos.map((grupo) => {
                  const tieneMultiples = grupo.servicios.length > 1;

                  return grupo.servicios.map((cli, index) => {
                    const diasRestantes = calcularDiasRestantes(cli.fechaVencimiento);
                    const perfilInfo = perfilesMap[cli.perfilId];
                    const cuentaInfo = cuentasMap[cli.cuentaId] || perfilInfo?.cuenta;
                    const platformInfo = cuentaInfo ? PLATFORMS[cuentaInfo.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;
                    const esUrgente = diasRestantes >= 0 && diasRestantes <= 2;
                    const esVencido = diasRestantes < 0;
                    const esPrimerServicio = index === 0;
                    const esUltimoServicio = index === grupo.servicios.length - 1;

                    return (
                      <tr 
                        key={cli.id} 
                        className={`
                          ${esUrgente ? 'row-urgent' : esVencido ? 'row-expired' : ''}
                          ${tieneMultiples ? 'row-grouped' : ''}
                          ${tieneMultiples && esPrimerServicio ? 'row-grouped-start' : ''}
                          ${tieneMultiples && !esPrimerServicio ? 'row-grouped-sub' : ''}
                          ${tieneMultiples && esUltimoServicio ? 'row-grouped-end' : ''}
                        `}
                      >
                        {/* Celular y Nombre agrupados */}
                        {esPrimerServicio && (
                          <td 
                            rowSpan={tieneMultiples ? grupo.servicios.length : 1}
                            className={tieneMultiples ? 'td-client-grouped' : ''}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                                {grupo.nombre || 'Cliente'}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <span style={{ 
                                  fontFamily: 'var(--font-mono)', 
                                  fontSize: '0.8rem', 
                                  color: 'var(--text-secondary)' 
                                }}>
                                  {grupo.codigoPais} {grupo.celular}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopiarCelular(`${grupo.codigoPais}${grupo.celular}`, grupo.id)}
                                  title="Copiar número de WhatsApp"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: celularCopiado === grupo.id ? '#34d399' : '#64748b',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                >
                                  {celularCopiado === grupo.id ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                              </div>

                              {/* Badge de múltiples plataformas */}
                              {tieneMultiples && (
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '5px',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.73rem',
                                  fontWeight: 600,
                                  background: 'rgba(168, 85, 247, 0.16)',
                                  color: '#d8b4fe',
                                  border: '1px solid rgba(168, 85, 247, 0.4)'
                                }}>
                                  <Sparkles size={11} />
                                  <span>{grupo.servicios.length} plataformas</span>
                                </div>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Plataforma y Perfil */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {platformInfo.logo ? (
                              <img
                                src={platformInfo.logo}
                                alt={platformInfo.name}
                                title={platformInfo.name}
                                style={{
                                  height: '28px',
                                  maxWidth: '65px',
                                  objectFit: 'contain',
                                  borderRadius: '5px',
                                  display: 'block',
                                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)'
                                }}
                              />
                            ) : (
                              <span 
                                className="platform-pill"
                                data-platform={platformInfo.id}
                                style={{
                                  backgroundColor: platformInfo.badgeBg,
                                  color: platformInfo.textColor,
                                  borderColor: platformInfo.borderColor
                                }}
                              >
                                {platformInfo.name}
                              </span>
                            )}
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {perfilInfo?.nombre || `Perfil ${perfilInfo?.numero || '?'}`}
                            </span>
                          </div>
                        </td>

                        {/* PIN Asignado */}
                        <td>
                          <span className="pin-badge">
                            {cli.pin || perfilInfo?.pin || '----'}
                          </span>
                        </td>

                        {/* Fecha de Inicio */}
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {formatearFecha(cli.fechaInicio)}
                          </span>
                        </td>

                        {/* Fecha de Vencimiento (30 días) */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {formatearFecha(cli.fechaVencimiento)}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Plan de 30 días
                            </span>
                          </div>
                        </td>

                        {/* Estado & Días restantes */}
                        <td>
                          {diasRestantes < 0 && (
                            <span className="expiry-tag expired">
                              ⛔ Venció hace {Math.abs(diasRestantes)} {Math.abs(diasRestantes) === 1 ? 'día' : 'días'}
                            </span>
                          )}
                          {diasRestantes === 0 && (
                            <span className="expiry-tag urgent-today pulse-attention" title="Su membresía vence hoy">
                              🔥 Vence hoy
                            </span>
                          )}
                          {diasRestantes === 1 && (
                            <span className="expiry-tag urgent-2 pulse-amber" title="Falta 1 día para que acabe su membresía">
                              ⚠️ Vence en 1 día
                            </span>
                          )}
                          {diasRestantes === 2 && (
                            <span className="expiry-tag urgent-2 pulse-amber" title="Faltan exactamente 2 días para que acabe su membresía">
                              ⚠️ Vence en 2 días
                            </span>
                          )}
                          {diasRestantes > 2 && (
                            <span className="expiry-tag active">
                              🟢 Vence en {diasRestantes} días
                            </span>
                          )}
                        </td>

                        {/* ICONO Y BOTÓN DE WHATSAPP DIRECTO */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className={`btn-whatsapp-icon ${esUrgente ? 'pulse-attention' : ''}`}
                              onClick={() => onOpenWhatsApp(cli, perfilInfo, cuentaInfo)}
                              title={
                                esUrgente
                                  ? '¡ALERTA 2 DÍAS! Clic para enviar recordatorio de vencimiento por WhatsApp'
                                  : `Enviar datos de ${platformInfo.name} por WhatsApp`
                              }
                            >
                              <WhatsAppIcon size={20} color="#ffffff" />
                            </button>

                            {cli.recordatorioEnviado && (
                              <span title="Recordatorio ya enviado" style={{ color: '#34d399', fontSize: '0.72rem' }}>
                                ✓✓
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td>
                          <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-icon-action add-service"
                              onClick={() => onAddService && onAddService(cli)}
                              title="Asignar otro servicio / perfil a este cliente (Netflix, Prime, Disney, etc.)"
                            >
                              <PlusCircle size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action receipt"
                              onClick={() => onOpenReceipt && onOpenReceipt(cli, perfilInfo, cuentaInfo)}
                              title="Emitir Comprobante / Recibo Digital Oficial para WhatsApp"
                            >
                              <Receipt size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action edit"
                              onClick={() => onEditClient && onEditClient(cli)}
                              title="Editar cliente, cambiar PIN o fecha de vencimiento"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action renew"
                              onClick={() => onRenewClient(cli.id)}
                              title="Renovar membresía por 30 días más"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-action delete"
                              onClick={() => onDeleteClient(cli)}
                              title="Dar de baja este perfil"
                            >
                              <UserMinus size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>

          {/* VISTA 2: TARJETAS MÓVILES TÁCTILES (Especial para Celular <= 768px) */}
          <div className="mobile-cards-view">
            {paginatedGrupos.map((grupo) => {
              const tieneMultiples = grupo.servicios.length > 1;

              // Si solo tiene 1 servicio, renderizamos la tarjeta móvil tradicional
              if (!tieneMultiples) {
                const cli = grupo.servicios[0];
                const diasRestantes = calcularDiasRestantes(cli.fechaVencimiento);
                const perfilInfo = perfilesMap[cli.perfilId];
                const cuentaInfo = cuentasMap[cli.cuentaId] || perfilInfo?.cuenta;
                const platformInfo = cuentaInfo ? PLATFORMS[cuentaInfo.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;
                const esUrgente = diasRestantes >= 0 && diasRestantes <= 2;
                const esVencido = diasRestantes < 0;

                return (
                  <div 
                    key={cli.id} 
                    className={`client-mobile-card ${esUrgente ? 'card-urgent' : esVencido ? 'card-expired' : ''}`}
                  >
                    {/* Fila Superior: Plataforma + Perfil + PIN */}
                    <div className="mobile-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {platformInfo.logo ? (
                          <img
                            src={platformInfo.logo}
                            alt={platformInfo.name}
                            title={platformInfo.name}
                            style={{
                              height: '24px',
                              maxWidth: '55px',
                              objectFit: 'contain',
                              borderRadius: '4px',
                              display: 'block',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
                            }}
                          />
                        ) : (
                          <span 
                            className="platform-pill"
                            data-platform={platformInfo.id}
                            style={{
                              backgroundColor: platformInfo.badgeBg,
                              color: platformInfo.textColor,
                              borderColor: platformInfo.borderColor,
                              fontSize: '0.75rem'
                            }}
                          >
                            {platformInfo.name}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {perfilInfo?.nombre || `Perfil ${perfilInfo?.numero || '?'}`}
                        </span>
                      </div>

                      <span className="pin-badge">
                        PIN: {cli.pin || perfilInfo?.pin || '----'}
                      </span>
                    </div>

                    {/* Fila Central: Datos del Cliente */}
                    <div className="mobile-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-light)', marginBottom: '2px' }}>
                            {grupo.nombre || 'Cliente'}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {grupo.codigoPais} {grupo.celular}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopiarCelular(`${grupo.codigoPais}${grupo.celular}`, grupo.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: celularCopiado === grupo.id ? '#34d399' : '#64748b',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                              title="Copiar número"
                            >
                              {celularCopiado === grupo.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Tag de vencimiento */}
                        <div>
                          {diasRestantes < 0 && (
                            <span className="expiry-tag expired" style={{ fontSize: '0.75rem' }}>
                              ⛔ Venció hace {Math.abs(diasRestantes)} {Math.abs(diasRestantes) === 1 ? 'día' : 'días'}
                            </span>
                          )}
                          {diasRestantes === 0 && (
                            <span className="expiry-tag urgent-today pulse-attention" style={{ fontSize: '0.75rem' }}>
                              🔥 Vence hoy
                            </span>
                          )}
                          {diasRestantes === 1 && (
                            <span className="expiry-tag urgent-2 pulse-amber" style={{ fontSize: '0.75rem' }}>
                              ⚠️ Vence en 1 día
                            </span>
                          )}
                          {diasRestantes === 2 && (
                            <span className="expiry-tag urgent-2 pulse-amber" style={{ fontSize: '0.75rem' }}>
                              ⚠️ Vence en 2 días
                            </span>
                          )}
                          {diasRestantes > 2 && (
                            <span className="expiry-tag active" style={{ fontSize: '0.75rem' }}>
                              🟢 Vence en {diasRestantes} días
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fechas de inicio y fin */}
                      <div className="mobile-card-dates-row">
                        <span>Inicio: <strong>{formatearFecha(cli.fechaInicio)}</strong></span>
                        <span>Vence (30d): <strong>{formatearFecha(cli.fechaVencimiento)}</strong></span>
                      </div>
                    </div>

                    {/* Fila Inferior: Botones de Acción Móviles */}
                    <div className="mobile-card-actions">
                      <button
                        type="button"
                        className={`btn btn-whatsapp mobile-wa-btn ${esUrgente ? 'pulse-attention' : ''}`}
                        onClick={() => onOpenWhatsApp(cli, perfilInfo, cuentaInfo)}
                      >
                        <WhatsAppIcon size={19} color="#ffffff" />
                        <span>
                          {esUrgente ? 'Avisar por WhatsApp' : 'Enviar WhatsApp'}
                        </span>
                        {cli.recordatorioEnviado && (
                          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>✓✓</span>
                        )}
                      </button>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary mobile-sub-btn add-service"
                          onClick={() => onAddService && onAddService(cli)}
                          title="Asignar otro servicio a este cliente"
                          style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
                        >
                          <PlusCircle size={14} />
                          <span>+Servicio</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary mobile-sub-btn receipt"
                          onClick={() => onOpenReceipt && onOpenReceipt(cli, perfilInfo, cuentaInfo)}
                          title="Emitir Comprobante Digital"
                        >
                          <Receipt size={14} />
                          <span>Recibo</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary mobile-sub-btn edit"
                          onClick={() => onEditClient && onEditClient(cli)}
                          title="Editar datos del cliente"
                        >
                          <Edit size={14} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary mobile-sub-btn renew"
                          onClick={() => onRenewClient(cli.id)}
                          title="Renovar membresía por 30 días más"
                        >
                          <RefreshCw size={14} />
                          <span>+30d</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary mobile-sub-btn delete"
                          onClick={() => onDeleteClient(cli)}
                          title="Dar de baja al cliente y liberar perfil"
                        >
                          <UserMinus size={14} />
                          <span>Baja</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Si tiene múltiples plataformas agrupadas:
              return (
                <div 
                  key={grupo.key} 
                  className="client-mobile-card card-multi-platform"
                >
                  {/* Cabecera del Cliente Agrupado */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '10px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={18} style={{ color: '#c084fc' }} />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-light)', margin: 0 }}>
                          {grupo.nombre || 'Cliente'}
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {grupo.codigoPais} {grupo.celular}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopiarCelular(`${grupo.codigoPais}${grupo.celular}`, grupo.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: celularCopiado === grupo.id ? '#34d399' : '#64748b',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="Copiar número"
                        >
                          {celularCopiado === grupo.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(168, 85, 247, 0.2)',
                        color: '#d8b4fe',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Sparkles size={11} />
                        {grupo.servicios.length} plataformas
                      </span>

                      <button
                        type="button"
                        onClick={() => onAddService && onAddService(grupo.servicios[0])}
                        style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#a5b4fc',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                        title="Asignar otra plataforma a este cliente"
                      >
                        <PlusCircle size={13} />
                        <span>+Servicio</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de cada uno de sus servicios */}
                  {grupo.servicios.map((cli) => {
                    const diasRestantes = calcularDiasRestantes(cli.fechaVencimiento);
                    const perfilInfo = perfilesMap[cli.perfilId];
                    const cuentaInfo = cuentasMap[cli.cuentaId] || perfilInfo?.cuenta;
                    const platformInfo = cuentaInfo ? PLATFORMS[cuentaInfo.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;
                    const esUrgente = diasRestantes >= 0 && diasRestantes <= 2;
                    const esVencido = diasRestantes < 0;

                    return (
                      <div 
                        key={cli.id}
                        className={`multi-service-item ${esUrgente ? 'item-urgent' : esVencido ? 'item-expired' : ''}`}
                      >
                        {/* Cabecera del servicio */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {platformInfo.logo ? (
                              <img
                                src={platformInfo.logo}
                                alt={platformInfo.name}
                                style={{
                                  height: '22px',
                                  maxWidth: '50px',
                                  objectFit: 'contain',
                                  borderRadius: '3px'
                                }}
                              />
                            ) : (
                              <span 
                                className="platform-pill"
                                data-platform={platformInfo.id}
                                style={{
                                  backgroundColor: platformInfo.badgeBg,
                                  color: platformInfo.textColor,
                                  borderColor: platformInfo.borderColor,
                                  fontSize: '0.72rem'
                                }}
                              >
                                {platformInfo.name}
                              </span>
                            )}
                            <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                              {perfilInfo?.nombre || `Perfil ${perfilInfo?.numero || '?'}`}
                            </span>
                          </div>

                          <span className="pin-badge" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                            PIN: {cli.pin || perfilInfo?.pin || '----'}
                          </span>
                        </div>

                        {/* Estado y fechas */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Vence: <strong style={{ color: 'var(--text-primary)' }}>{formatearFecha(cli.fechaVencimiento)}</strong>
                          </div>
                          <div>
                            {diasRestantes < 0 && (
                              <span className="expiry-tag expired" style={{ fontSize: '0.72rem' }}>
                                ⛔ Venció ({Math.abs(diasRestantes)}d)
                              </span>
                            )}
                            {diasRestantes === 0 && (
                              <span className="expiry-tag urgent-today pulse-attention" style={{ fontSize: '0.72rem' }}>
                                🔥 Vence hoy
                              </span>
                            )}
                            {diasRestantes === 1 && (
                              <span className="expiry-tag urgent-2 pulse-amber" style={{ fontSize: '0.72rem' }}>
                                ⚠️ Vence en 1 día
                              </span>
                            )}
                            {diasRestantes === 2 && (
                              <span className="expiry-tag urgent-2 pulse-amber" style={{ fontSize: '0.72rem' }}>
                                ⚠️ Vence en 2 días
                              </span>
                            )}
                            {diasRestantes > 2 && (
                              <span className="expiry-tag active" style={{ fontSize: '0.72rem' }}>
                                🟢 Vence en {diasRestantes}d
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción para este servicio específico */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                          <button
                            type="button"
                            className={`btn btn-whatsapp ${esUrgente ? 'pulse-attention' : ''}`}
                            onClick={() => onOpenWhatsApp(cli, perfilInfo, cuentaInfo)}
                            style={{ padding: '5px 10px', fontSize: '0.78rem', flex: 1, minWidth: '110px' }}
                          >
                            <WhatsAppIcon size={16} color="#ffffff" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary mobile-sub-btn receipt"
                            onClick={() => onOpenReceipt && onOpenReceipt(cli, perfilInfo, cuentaInfo)}
                            style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                            title="Recibo"
                          >
                            <Receipt size={13} />
                            <span>Recibo</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary mobile-sub-btn edit"
                            onClick={() => onEditClient && onEditClient(cli)}
                            style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                            title="Editar"
                          >
                            <Edit size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary mobile-sub-btn renew"
                            onClick={() => onRenewClient(cli.id)}
                            style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                            title="+30 días"
                          >
                            <RefreshCw size={13} />
                            <span>+30d</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary mobile-sub-btn delete"
                            onClick={() => onDeleteClient(cli)}
                            style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                            title="Dar de baja"
                          >
                            <UserMinus size={13} />
                            <span>Baja</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Paginación de Clientes */}
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
