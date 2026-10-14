import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Edit
} from 'lucide-react';
import { PLATFORMS } from '../constants/platforms';
import { calcularDiasRestantes, formatearFecha } from '../utils/storage';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Pagination } from './Pagination';

export function ClientsView({ 
  clientes = [], 
  cuentas = [], 
  onOpenWhatsApp, 
  onRenewClient, 
  onDeleteClient, 
  onEditClient,
  onNewClient,
  activeFilter = 'todos',
  onFilterChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [celularCopiado, setCelularCopiado] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mapeo rápido de cuenta y perfil por ID
  const cuentasMap = {};
  const perfilesMap = {};

  cuentas.forEach(cta => {
    if (cta.id != null) {
      cuentasMap[cta.id] = cta;
      cuentasMap[String(cta.id)] = cta;
    }
    (cta.perfiles || []).forEach(p => {
      if (p.id != null) {
        perfilesMap[p.id] = { ...p, cuenta: cta };
        perfilesMap[String(p.id)] = { ...p, cuenta: cta };
      }
    });
  });

  // Filtrado y búsqueda
  const clientesFiltrados = clientes.filter(cli => {
    const dias = calcularDiasRestantes(cli.fechaVencimiento);
    const perfilInfo = perfilesMap[cli.perfilId];
    const cuentaInfo = cuentasMap[cli.cuentaId] || perfilInfo?.cuenta;

    // Filtro por pestaña
    if (activeFilter === 'por_vencer' && (dias > 2 || dias < 0)) return false;
    if (activeFilter === 'vencidos' && dias >= 0) return false;
    if (activeFilter === 'activos' && dias < 0) return false;

    // Filtro por búsqueda
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nombre = (cli.nombre || '').toLowerCase();
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

  // Resetear a la página 1 cuando cambia el filtro o término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  // Cálculo de paginación
  const totalItems = clientesFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedClientes = clientesFiltrados.slice(startIndex, startIndex + itemsPerPage);

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
            className={`pill-btn ${activeFilter === 'todos' ? 'active' : ''}`}
            onClick={() => onFilterChange('todos')}
          >
            <span>Todos</span>
            <span className="counter-badge">{clientes.length}</span>
          </button>

          <button 
            className={`pill-btn urgent ${activeFilter === 'por_vencer' ? 'active' : ''}`}
            onClick={() => onFilterChange('por_vencer')}
            style={urgentCount > 0 ? { borderColor: 'rgba(245, 158, 11, 0.6)' } : undefined}
          >
            <Clock size={14} />
            <span>Por Vencer (≤ 2 Días)</span>
            <span className="counter-badge" style={urgentCount > 0 ? { background: '#f59e0b', color: '#000' } : undefined}>
              {urgentCount}
            </span>
          </button>

          <button 
            className={`pill-btn ${activeFilter === 'activos' ? 'active' : ''}`}
            onClick={() => onFilterChange('activos')}
          >
            <CheckCircle2 size={14} />
            <span>Activos</span>
            <span className="counter-badge">{activeCount}</span>
          </button>

          <button 
            className={`pill-btn ${activeFilter === 'vencidos' ? 'active' : ''}`}
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
      {clientesFiltrados.length === 0 ? (
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
                {paginatedClientes.map((cli) => {
                  const diasRestantes = calcularDiasRestantes(cli.fechaVencimiento);
                  const perfilInfo = perfilesMap[cli.perfilId];
                  const cuentaInfo = cuentasMap[cli.cuentaId] || perfilInfo?.cuenta;
                  const platformInfo = cuentaInfo ? PLATFORMS[cuentaInfo.plataforma] || PLATFORMS.Otro : PLATFORMS.Otro;
                  const esUrgente = diasRestantes >= 0 && diasRestantes <= 2;
                  const esVencido = diasRestantes < 0;

                  return (
                    <tr 
                      key={cli.id} 
                      className={esUrgente ? 'row-urgent' : esVencido ? 'row-expired' : ''}
                    >
                      {/* Celular y Nombre */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                            {cli.nombre || 'Cliente'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span style={{ 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '0.8rem', 
                              color: '#94a3b8' 
                            }}>
                              {cli.codigoPais} {cli.celular}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopiarCelular(`${cli.codigoPais}${cli.celular}`, cli.id)}
                              title="Copiar número de WhatsApp"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: celularCopiado === cli.id ? '#34d399' : '#64748b',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                            >
                              {celularCopiado === cli.id ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Plataforma y Perfil */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span 
                            className="platform-pill"
                            style={{
                              backgroundColor: platformInfo.badgeBg,
                              color: platformInfo.textColor,
                              borderColor: platformInfo.borderColor
                            }}
                          >
                            {platformInfo.name}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
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
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                          {formatearFecha(cli.fechaInicio)}
                        </span>
                      </td>

                      {/* Fecha de Vencimiento (30 días) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                            {formatearFecha(cli.fechaVencimiento)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Plan de 30 días
                          </span>
                        </div>
                      </td>

                      {/* Estado & Días restantes */}
                      <td>
                        {diasRestantes === 2 && (
                          <span className="expiry-tag urgent-2 pulse-amber" title="Faltan exactamente 2 días para que acabe su membresía">
                            ⚠️ ¡Vence en 2 días!
                          </span>
                        )}
                        {diasRestantes === 1 && (
                          <span className="expiry-tag urgent-2 pulse-amber" title="Falta 1 día para que acabe su membresía">
                            🚨 ¡Vence mañana!
                          </span>
                        )}
                        {diasRestantes === 0 && (
                          <span className="expiry-tag urgent-today pulse-attention" title="Su membresía vence hoy">
                            🔥 ¡Vence HOY!
                          </span>
                        )}
                        {diasRestantes < 0 && (
                          <span className="expiry-tag expired">
                            ⛔ Vencido hace {Math.abs(diasRestantes)}d
                          </span>
                        )}
                        {diasRestantes > 2 && (
                          <span className="expiry-tag active">
                            🟢 Activo ({diasRestantes} días)
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
                                : 'Enviar mensaje o datos por WhatsApp'
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

                      {/* Acciones: Editar, Renovar (+30 días) y Liberar perfil */}
                      <td>
                        <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
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
                            title="Dar de baja al cliente y liberar su perfil"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* VISTA 2: TARJETAS MÓVILES TÁCTILES (Especial para Celular <= 768px) */}
          <div className="mobile-cards-view">
            {paginatedClientes.map((cli) => {
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
                      <span 
                        className="platform-pill"
                        style={{
                          backgroundColor: platformInfo.badgeBg,
                          color: platformInfo.textColor,
                          borderColor: platformInfo.borderColor,
                          fontSize: '0.75rem'
                        }}
                      >
                        {platformInfo.name}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
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
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                          {cli.nombre || 'Cliente'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#94a3b8' }}>
                            {cli.codigoPais} {cli.celular}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopiarCelular(`${cli.codigoPais}${cli.celular}`, cli.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: celularCopiado === cli.id ? '#34d399' : '#64748b',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title="Copiar número"
                          >
                            {celularCopiado === cli.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Tag de vencimiento */}
                      <div>
                        {diasRestantes === 2 && (
                          <span className="expiry-tag urgent-2 pulse-amber" style={{ fontSize: '0.75rem' }}>
                            ⚠️ Vence en 2 días
                          </span>
                        )}
                        {diasRestantes === 1 && (
                          <span className="expiry-tag urgent-2 pulse-amber" style={{ fontSize: '0.75rem' }}>
                            🚨 Vence mañana
                          </span>
                        )}
                        {diasRestantes === 0 && (
                          <span className="expiry-tag urgent-today pulse-attention" style={{ fontSize: '0.75rem' }}>
                            🔥 Vence HOY
                          </span>
                        )}
                        {diasRestantes < 0 && (
                          <span className="expiry-tag expired" style={{ fontSize: '0.75rem' }}>
                            ⛔ Vencido {Math.abs(diasRestantes)}d
                          </span>
                        )}
                        {diasRestantes > 2 && (
                          <span className="expiry-tag active" style={{ fontSize: '0.75rem' }}>
                            🟢 Vence en {diasRestantes}d
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fechas de inicio y fin */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.76rem', 
                      color: '#94a3b8',
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginTop: '6px'
                    }}>
                      <span>Inicio: <strong>{formatearFecha(cli.fechaInicio)}</strong></span>
                      <span>Vence (30d): <strong style={{ color: '#f8fafc' }}>{formatearFecha(cli.fechaVencimiento)}</strong></span>
                    </div>
                  </div>

                  {/* Fila Inferior: Botones de Acción Móviles (WhatsApp Gigante + Renovar + Liberar) */}
                  <div className="mobile-card-actions">
                    <button
                      type="button"
                      className={`btn btn-whatsapp mobile-wa-btn ${esUrgente ? 'pulse-attention' : ''}`}
                      onClick={() => onOpenWhatsApp(cli, perfilInfo, cuentaInfo)}
                    >
                      <WhatsAppIcon size={19} color="#063c19" />
                      <span>
                        {esUrgente ? 'Avisar por WhatsApp (2 Días)' : 'Enviar WhatsApp'}
                      </span>
                      {cli.recordatorioEnviado && (
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>✓✓</span>
                      )}
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
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
                        className="btn btn-secondary mobile-sub-btn"
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
