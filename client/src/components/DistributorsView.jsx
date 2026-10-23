import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Send, 
  Clock, 
  DollarSign, 
  Trash2, 
  RefreshCw, 
  PauseCircle, 
  PlayCircle, 
  Crown, 
  ShieldCheck,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  ArrowUpDown,
  Filter,
  Sparkles,
  ExternalLink,
  X,
  FileText
} from 'lucide-react';
import { calcularDiasRestantes, formatearFecha, addDays, getTodayDate } from '../utils/storage';
import { useToast } from '../context/ToastContext';
import { EditDistributorModal } from './EditDistributorModal';

/**
 * Genera un color consistente basado en el nombre
 */
function getAvatarGradient(name = '') {
  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #06b6d4, #0284c7)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * Modal para previsualizar y enviar mensaje de credenciales a WhatsApp
 */
function ShareDistributorModal({ isOpen, onClose, distributor }) {
  const toast = useToast();
  const [templateType, setTemplateType] = useState('bienvenida'); // 'bienvenida' | 'recordatorio' | 'renovado'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !distributor) return null;

  const rawPhone = (distributor.whatsapp || '').replace(/\D/g, '');
  const appUrl = window.location.origin;
  const dias = distributor.fecha_expiracion ? calcularDiasRestantes(distributor.fecha_expiracion) : null;
  const expiracionTexto = distributor.fecha_expiracion 
    ? `${formatearFecha(distributor.fecha_expiracion)} (${dias >= 0 ? `en ${dias} días` : 'Vencido'})`
    : 'Permanente (Sin límite)';

  let mensaje = '';
  if (templateType === 'bienvenida') {
    mensaje = `👋 ¡Hola *${distributor.nombre}*! Te saluda el Administrador de *Flow Stream*.

Tu acceso como Distribuidor de streaming ya se encuentra *ACTIVO*:

🌐 *Enlace del sistema:* ${appUrl}
🔑 *Tu Código de Distribuidor:* *${distributor.codigo_distribuidor}*
📅 *Vigencia de tu licencia:* ${expiracionTexto}

📲 *Instrucciones de ingreso:*
1. Abre el enlace arriba en tu celular o computadora.
2. Ingresa tu código *${distributor.codigo_distribuidor}* en la pantalla de acceso.
3. ¡Listo! Podrás gestionar tus cuentas de streaming, clientes y generar mensajes de WhatsApp directos.

¡Muchos éxitos con tus ventas! 🍿🎬`;
  } else if (templateType === 'recordatorio') {
    mensaje = `👋 ¡Hola *${distributor.nombre}*! Te recordamos desde la Administración de *Flow Stream*:

Tu licencia de Distribuidor (*${distributor.codigo_distribuidor}*) está por vencer:
📅 *Vigencia:* ${expiracionTexto}
💰 *Cuota mensual:* ${Number(distributor.precio_mensual) > 0 ? `S/ ${Number(distributor.precio_mensual).toFixed(2)}` : 'A convenir'}

Por favor responde a este mensaje para renovar tu acceso y no interrumpir la gestión de tus clientes y cuentas. 🍿`;
  } else {
    mensaje = `⭐ ¡Hola *${distributor.nombre}*! Confirmamos la renovación de tu licencia de Distribuidor en *Flow Stream*:

🔑 *Código:* *${distributor.codigo_distribuidor}*
📅 *Nueva Vigencia:* ${expiracionTexto}
✅ *Estado:* ACTIVO

¡Gracias por seguir trabajando con nosotros! A seguir vendiendo con éxito. 🎬🚀`;
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopied(true);
      toast.success('¡Mensaje copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleSendWhatsApp = () => {
    if (!rawPhone) {
      toast.error('Este distribuidor no tiene un número registrado.');
      return;
    }
    const waLink = `https://wa.me/${rawPhone}?text=${encodeURIComponent(mensaje)}`;
    window.open(waLink, '_blank');
    toast.success('Abriendo WhatsApp con el mensaje listo...');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-container modal-new-client" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <MessageCircle size={22} />
            </div>
            <div>
              <h2 className="modal-title">Enviar Credenciales por WhatsApp</h2>
              <p className="modal-subtitle">
                Para: <strong>{distributor.nombre}</strong> ({distributor.codigo_distribuidor})
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selector de Plantilla */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`pill-btn ${templateType === 'bienvenida' ? 'active' : ''}`}
              onClick={() => setTemplateType('bienvenida')}
            >
              🎉 Bienvenida & Acceso
            </button>
            <button
              type="button"
              className={`pill-btn ${templateType === 'recordatorio' ? 'active' : ''}`}
              onClick={() => setTemplateType('recordatorio')}
            >
              ⏰ Aviso de Vencimiento
            </button>
            <button
              type="button"
              className={`pill-btn ${templateType === 'renovado' ? 'active' : ''}`}
              onClick={() => setTemplateType('renovado')}
            >
              ⭐ Renovación Exitosa
            </button>
          </div>

          {/* Vista previa del mensaje */}
          <div>
            <label className="form-label" style={{ marginBottom: '6px' }}>
              Vista Previa del Mensaje (con formato de WhatsApp):
            </label>
            <div style={{
              background: '#0c1317',
              color: '#e9edef',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #202c33',
              fontSize: '0.86rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              maxHeight: '220px',
              overflowY: 'auto',
              fontFamily: 'inherit'
            }}>
              {mensaje}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '140px' }}
              onClick={handleCopyMessage}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
            </button>

            <button
              type="button"
              className="btn btn-whatsapp"
              style={{ flex: 1.4, minWidth: '180px', justifyContent: 'center' }}
              onClick={handleSendWhatsApp}
            >
              <Send size={16} />
              <span>Enviar a {distributor.whatsapp ? distributor.whatsapp : 'WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DistributorsView({
  distribuidores = [],
  onNewDistributor,
  onRenewDistributor,
  onToggleStatusDistributor,
  onDeleteDistributor,
  onUpdateDistributor
}) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'activos' | 'por_vencer' | 'vencidos' | 'suspendidos'
  const [sortBy, setSortBy] = useState('vencimiento'); // 'vencimiento' | 'recientes' | 'nombre' | 'precio'
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Modales
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [sharingDistributor, setSharingDistributor] = useState(null);

  // Copiar código de distribuidor al portapapeles
  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`¡Código ${code} copiado!`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.info(`Código: ${code}`);
    }
  };

  // Métricas avanzadas
  const metrics = useMemo(() => {
    const total = distribuidores.length;
    let activosCount = 0;
    let porVencerCount = 0;
    let vencidosCount = 0;
    let suspendidosCount = 0;
    let totalIngresos = 0;

    distribuidores.forEach(d => {
      totalIngresos += Number(d.precio_mensual) || 0;
      if (d.estado === 'suspendido') {
        suspendidosCount++;
        return;
      }

      if (!d.fecha_expiracion) {
        activosCount++;
        return;
      }

      const dias = calcularDiasRestantes(d.fecha_expiracion);
      if (dias < 0) {
        vencidosCount++;
      } else {
        activosCount++;
        if (dias <= 5) {
          porVencerCount++;
        }
      }
    });

    const activeRate = total > 0 ? Math.round((activosCount / total) * 100) : 0;

    return {
      total,
      activos: activosCount,
      porVencer: porVencerCount,
      vencidos: vencidosCount,
      suspendidos: suspendidosCount,
      totalIngresos,
      activeRate
    };
  }, [distribuidores]);

  // Lista filtrada y ordenada
  const processedDistribuidores = useMemo(() => {
    // 1. Filtrar
    const filtered = distribuidores.filter(dist => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !term ||
        (dist.nombre || '').toLowerCase().includes(term) ||
        (dist.codigo_distribuidor || '').toLowerCase().includes(term) ||
        (dist.whatsapp || '').includes(term) ||
        (dist.notas || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      const dias = dist.fecha_expiracion ? calcularDiasRestantes(dist.fecha_expiracion) : 9999;
      const isVencido = dist.fecha_expiracion && dias < 0;
      const isPorVencer = dist.fecha_expiracion && dias >= 0 && dias <= 5;

      if (filterStatus === 'activos') {
        return dist.estado === 'activo' && !isVencido;
      }
      if (filterStatus === 'por_vencer') {
        return dist.estado === 'activo' && isPorVencer;
      }
      if (filterStatus === 'vencidos') {
        return isVencido;
      }
      if (filterStatus === 'suspendidos') {
        return dist.estado === 'suspendido';
      }

      return true;
    });

    // 2. Ordenar
    return filtered.sort((a, b) => {
      // SuperAdmin principal siempre primero
      if (a.codigo_distribuidor === 'DIST-2026') return -1;
      if (b.codigo_distribuidor === 'DIST-2026') return 1;

      if (sortBy === 'nombre') {
        return (a.nombre || '').localeCompare(b.nombre || '');
      }
      if (sortBy === 'precio') {
        return (Number(b.precio_mensual) || 0) - (Number(a.precio_mensual) || 0);
      }
      if (sortBy === 'recientes') {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idB - idA;
      }
      // Por defecto: 'vencimiento' (más próximos a vencer primero)
      const diasA = a.fecha_expiracion ? calcularDiasRestantes(a.fecha_expiracion) : 9999;
      const diasB = b.fecha_expiracion ? calcularDiasRestantes(b.fecha_expiracion) : 9999;
      return diasA - diasB;
    });
  }, [distribuidores, searchTerm, filterStatus, sortBy]);

  return (
    <div className="distributors-view" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Encabezado de la Sección con Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              Gestión de Distribuidores
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              LICENCIAS DIST-XXXX
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '4px 0 0 0' }}>
            Control de revendedores, vigencias de licencias, recaudación y envío de credenciales
          </p>
        </div>

        <button 
          type="button"
          className="btn btn-primary"
          onClick={onNewDistributor}
          style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            border: 'none',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700
          }}
        >
          <Plus size={18} />
          <span>Nuevo Distribuidor</span>
        </button>
      </div>

      {/* 2. Grid de Métricas Ultra-Modernas (4 Tarjetas KPI) */}
      <div className="stats-grid">
        {/* Total Distribuidores */}
        <div 
          className="stat-card" 
          onClick={() => setFilterStatus('todos')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
          title="Ver todos los distribuidores"
        >
          <div className="stat-info">
            <span className="stat-label">Total Distribuidores</span>
            <span className="stat-value stat-val-emerald">{metrics.total}</span>
            <span className="stat-subtext">
              <strong style={{ color: '#10b981' }}>{metrics.activeRate}%</strong> activos en el sistema
            </span>
          </div>
          <div className="stat-icon emerald">
            <Users size={22} />
          </div>
        </div>

        {/* Activos */}
        <div 
          className="stat-card" 
          onClick={() => setFilterStatus('activos')}
          style={{ cursor: 'pointer' }}
          title="Ver distribuidores activos"
        >
          <div className="stat-info">
            <span className="stat-label">Licencias Activas</span>
            <span className="stat-value stat-val-cyan">{metrics.activos}</span>
            <span className="stat-subtext">
              {metrics.porVencer > 0 ? (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠️ {metrics.porVencer} vencen en ≤5 días</span>
              ) : (
                'Sin vencimientos urgentes'
              )}
            </span>
          </div>
          <div className="stat-icon cyan">
            <UserCheck size={22} />
          </div>
        </div>

        {/* Vencidos / Por Renovar */}
        <div 
          className={`stat-card ${metrics.vencidos > 0 ? 'card-urgent pulse-amber' : ''}`}
          onClick={() => setFilterStatus('vencidos')}
          style={{ cursor: 'pointer' }}
          title="Ver licencias vencidas"
        >
          <div className="stat-info">
            <span className={`stat-label ${metrics.vencidos > 0 ? 'stat-lbl-amber' : ''}`}>
              Vencidos / Por Renovar
            </span>
            <span className={`stat-value ${metrics.vencidos > 0 ? 'stat-val-amber' : ''}`}>
              {metrics.vencidos}
            </span>
            <span className="stat-subtext">
              {metrics.vencidos > 0 ? 'Requieren cobro o renovación' : 'Todos al día'}
            </span>
          </div>
          <div className="stat-icon amber">
            <Clock size={22} />
          </div>
        </div>

        {/* Facturación Mensual Estimada (MRR) */}
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Facturación Mensual (MRR)</span>
            <span className="stat-value stat-val-purple" style={{ color: '#c084fc' }}>
              S/ {metrics.totalIngresos.toFixed(2)}
            </span>
            <span className="stat-subtext">
              {metrics.total > 0 
                ? `Promedio: S/ ${(metrics.totalIngresos / metrics.total).toFixed(1)} / dist.` 
                : 'Ingresos por cuotas'}
            </span>
          </div>
          <div className="stat-icon purple" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* 3. Contenedor Principal: Barra de Herramientas y Tabla */}
      <div className="content-card" style={{ padding: '20px', borderRadius: '16px' }}>
        
        {/* Barra de Herramientas: Buscador + Píldoras + Ordenar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
          
          {/* Buscador inteligente */}
          <div className="search-input-wrapper" style={{ flex: '1', minWidth: '240px', maxWidth: '420px' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text"
              className="search-input"
              placeholder="Buscar por código (DIST-XXXX), nombre o WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="clear-search-btn" 
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Filtros rápidos */}
          <div className="filter-pills" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className={`pill-btn pill-todos ${filterStatus === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterStatus('todos')}
            >
              <span>Todos</span>
              <span className="counter-badge">{metrics.total}</span>
            </button>

            <button 
              type="button"
              className={`pill-btn pill-activos ${filterStatus === 'activos' ? 'active' : ''}`}
              onClick={() => setFilterStatus('activos')}
            >
              <CheckCircle2 size={13} />
              <span>Activos</span>
              <span className="counter-badge">{metrics.activos}</span>
            </button>

            <button 
              type="button"
              className={`pill-btn ${filterStatus === 'por_vencer' ? 'active' : ''}`}
              onClick={() => setFilterStatus('por_vencer')}
              style={filterStatus === 'por_vencer' ? { background: 'rgba(245, 158, 11, 0.25)', borderColor: '#f59e0b', color: '#fbbf24' } : {}}
            >
              <AlertTriangle size={13} />
              <span>Por Vencer (≤5d)</span>
              <span className="counter-badge" style={{ background: '#f59e0b', color: '#000' }}>{metrics.porVencer}</span>
            </button>

            <button 
              type="button"
              className={`pill-btn pill-urgent ${filterStatus === 'vencidos' ? 'active' : ''}`}
              onClick={() => setFilterStatus('vencidos')}
            >
              <Clock size={13} />
              <span>Vencidos</span>
              <span className="counter-badge">{metrics.vencidos}</span>
            </button>

            <button 
              type="button"
              className={`pill-btn pill-vencidos ${filterStatus === 'suspendidos' ? 'active' : ''}`}
              onClick={() => setFilterStatus('suspendidos')}
            >
              <UserX size={13} />
              <span>Suspendidos</span>
              <span className="counter-badge">{metrics.suspendidos}</span>
            </button>
          </div>

          {/* Selector de Orden */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={15} color="var(--text-secondary)" />
            <select
              className="form-select"
              style={{ fontSize: '0.84rem', padding: '6px 12px', width: 'auto', background: 'var(--bg-input)' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="vencimiento">Ordenar: Vencimiento próximo</option>
              <option value="recientes">Ordenar: Más recientes</option>
              <option value="nombre">Ordenar: Alfabético (A - Z)</option>
              <option value="precio">Ordenar: Mayor cuota (S/)</option>
            </select>
          </div>
        </div>

        {/* 4. Lista de Distribuidores o Estado Vacío */}
        {processedDistribuidores.length === 0 ? (
          <div className="empty-state" style={{ padding: '56px 20px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Users size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
              {searchTerm ? 'No se encontraron distribuidores' : 'Sin distribuidores registrados'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              {searchTerm 
                ? 'Intenta buscando con otro término o limpia los filtros seleccionados.' 
                : 'Crea tu primera licencia DIST-XXXX para revendedores y empieza a distribuir tu sistema.'}
            </p>
            {!searchTerm && (
              <button 
                type="button"
                className="btn btn-primary"
                onClick={onNewDistributor}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '10px 22px' }}
              >
                <Plus size={16} />
                <span>Registrar Primer Distribuidor</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* VISTA DESKTOP: Tabla Estilizada con Diseño Moderno */}
            <div className="table-responsive desktop-only-view">
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '160px' }}>Código DIST</th>
                    <th>Distribuidor / Negocio</th>
                    <th>WhatsApp</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                    <th>Vigencia de Licencia</th>
                    <th>Cuota Mensual</th>
                    <th style={{ textAlign: 'center', width: '250px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {processedDistribuidores.map((dist) => {
                    const diasRestantes = dist.fecha_expiracion ? calcularDiasRestantes(dist.fecha_expiracion) : null;
                    const isVencido = dist.fecha_expiracion && diasRestantes < 0;
                    const isPorVencer = dist.fecha_expiracion && diasRestantes >= 0 && diasRestantes <= 5;
                    const isSuspendido = dist.estado === 'suspendido';
                    const isMaster = Boolean(dist.es_superadmin) || dist.codigo_distribuidor === 'DIST-2026';

                    // Iniciales del avatar
                    const initials = (dist.nombre || 'D')
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr 
                        key={dist.id || dist.codigo_distribuidor}
                        className={isSuspendido ? 'row-expired' : isVencido ? 'row-urgent' : ''}
                        style={{ transition: 'background-color 0.2s' }}
                      >
                        {/* Código DIST con botón de copia rápida */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              letterSpacing: '1px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              background: isMaster ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.14)',
                              color: isMaster ? '#818cf8' : '#34d399',
                              border: `1.5px solid ${isMaster ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                              display: 'inline-block'
                            }}>
                              {dist.codigo_distribuidor}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(dist.codigo_distribuidor)}
                              title="Copiar código al portapapeles"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: 'var(--text-secondary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: '4px'
                              }}
                            >
                              {copiedCode === dist.codigo_distribuidor ? (
                                <Check size={16} color="#10b981" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Nombre / Negocio con Avatar */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: getAvatarGradient(dist.nombre),
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                            }}>
                              {initials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                                {dist.nombre}
                              </span>
                              {isMaster && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#818cf8', fontWeight: 800 }}>
                                  <Crown size={12} />
                                  <span>SUPER-ADMINISTRADOR</span>
                                </div>
                              )}
                              {dist.notas && (
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dist.notas}>
                                  📝 {dist.notas}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* WhatsApp */}
                        <td>
                          {dist.whatsapp ? (
                            <a
                              href={`https://wa.me/${dist.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: '#34d399',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                textDecoration: 'none'
                              }}
                            >
                              <MessageCircle size={15} />
                              <span>{dist.whatsapp}</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              - Sin WhatsApp -
                            </span>
                          )}
                        </td>

                        {/* Estado */}
                        <td style={{ textAlign: 'center' }}>
                          {isSuspendido ? (
                            <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.35)', fontWeight: 700 }}>
                              ● Suspendido
                            </span>
                          ) : isVencido ? (
                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.35)', fontWeight: 700 }}>
                              ⚠️ Vencido
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 700 }}>
                              ● Activo
                            </span>
                          )}
                        </td>

                        {/* Vigencia con Alertas de Color */}
                        <td>
                          {dist.fecha_expiracion ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ 
                                fontWeight: 700, 
                                color: isVencido ? '#f43f5e' : isPorVencer ? '#f59e0b' : 'var(--text-primary)', 
                                fontSize: '0.9rem' 
                              }}>
                                {formatearFecha(dist.fecha_expiracion)}
                              </span>
                              <span style={{ 
                                fontSize: '0.76rem', 
                                fontWeight: 600,
                                color: isVencido ? '#f43f5e' : isPorVencer ? '#f59e0b' : '#10b981' 
                              }}>
                                {diasRestantes < 0 
                                  ? `🔴 Venció hace ${Math.abs(diasRestantes)} días` 
                                  : diasRestantes === 0 
                                  ? '⚠️ ¡Vence hoy!' 
                                  : diasRestantes <= 5
                                  ? `🟡 Quedan ${diasRestantes} días`
                                  : `🟢 Quedan ${diasRestantes} días`}
                              </span>
                            </div>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 700 }}>
                              ♾️ Permanente
                            </span>
                          )}
                        </td>

                        {/* Precio / Cuota Mensual */}
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '0.94rem', color: Number(dist.precio_mensual) > 0 ? '#34d399' : 'var(--text-secondary)' }}>
                            {Number(dist.precio_mensual) > 0 ? `S/ ${Number(dist.precio_mensual).toFixed(2)}` : 'Gratis'}
                          </span>
                        </td>

                        {/* Acciones Completas y Modernas */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Compartir por WhatsApp con modal de plantilla */}
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => setSharingDistributor(dist)}
                              title="Enviar mensaje y credenciales por WhatsApp"
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                borderRadius: '8px'
                              }}
                            >
                              <Send size={13} />
                              <span>WhatsApp</span>
                            </button>

                            {/* Editar Distribuidor */}
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingDistributor(dist)}
                              title="Editar datos, precio, notas o vigencia"
                              style={{ padding: '6px 9px', borderRadius: '8px' }}
                            >
                              <Edit3 size={13} color="#818cf8" />
                            </button>

                            {/* Renovar (+30 días) */}
                            {!isMaster && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => onRenewDistributor(dist)}
                                title="Renovar suscripción (+30 días)"
                                style={{ padding: '6px 9px', fontSize: '0.78rem', borderRadius: '8px' }}
                              >
                                <RefreshCw size={13} color="#06b6d4" />
                                <span>+30d</span>
                              </button>
                            )}

                            {/* Suspender / Activar */}
                            {!isMaster && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => onToggleStatusDistributor(dist)}
                                title={isSuspendido ? 'Reactivar distribuidor' : 'Suspender acceso del distribuidor'}
                                style={{ padding: '6px 8px', borderRadius: '8px' }}
                              >
                                {isSuspendido ? (
                                  <PlayCircle size={15} color="#10b981" />
                                ) : (
                                  <PauseCircle size={15} color="#f59e0b" />
                                )}
                              </button>
                            )}

                            {/* Eliminar (Solo si no es Master) */}
                            {!isMaster && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => onDeleteDistributor(dist)}
                                title="Eliminar distribuidor"
                                style={{ padding: '6px 8px', color: '#f43f5e', borderRadius: '8px' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}

                            {/* Si es Master, mostrar badge */}
                            {isMaster && (
                              <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700, padding: '4px 8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px' }}>
                                Principal
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MOBILE: Tarjetas Táctiles Modernas */}
            <div className="mobile-only-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {processedDistribuidores.map((dist) => {
                const diasRestantes = dist.fecha_expiracion ? calcularDiasRestantes(dist.fecha_expiracion) : null;
                const isVencido = dist.fecha_expiracion && diasRestantes < 0;
                const isPorVencer = dist.fecha_expiracion && diasRestantes >= 0 && diasRestantes <= 5;
                const isSuspendido = dist.estado === 'suspendido';
                const isMaster = Boolean(dist.es_superadmin) || dist.codigo_distribuidor === 'DIST-2026';
                const initials = (dist.nombre || 'D').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

                return (
                  <div 
                    key={dist.id || dist.codigo_distribuidor}
                    className="mobile-client-card"
                    style={{
                      borderLeft: `4px solid ${isMaster ? '#6366f1' : isSuspendido ? '#f43f5e' : isVencido ? '#f59e0b' : '#10b981'}`,
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'var(--bg-card)'
                    }}
                  >
                    <div className="mobile-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: getAvatarGradient(dist.nombre),
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.82rem'
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isMaster ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: isMaster ? '#818cf8' : '#10b981',
                              fontSize: '0.8rem'
                            }}>
                              {dist.codigo_distribuidor}
                            </span>
                            {isMaster && <Crown size={14} color="#818cf8" />}
                          </div>
                          <h4 style={{ margin: '3px 0 0 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {dist.nombre}
                          </h4>
                        </div>
                      </div>

                      {/* Badge Estado */}
                      <div>
                        {isSuspendido ? (
                          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>Suspendido</span>
                        ) : isVencido ? (
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>Vencido</span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>Activo</span>
                        )}
                      </div>
                    </div>

                    <div className="mobile-card-body" style={{ margin: '12px 0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>WhatsApp:</span>
                        <span style={{ fontWeight: 600 }}>{dist.whatsapp || 'No registrado'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Vigencia:</span>
                        <span style={{ 
                          fontWeight: 700,
                          color: isVencido ? '#f43f5e' : isPorVencer ? '#f59e0b' : 'var(--text-primary)'
                        }}>
                          {dist.fecha_expiracion 
                            ? `${formatearFecha(dist.fecha_expiracion)} (${diasRestantes >= 0 ? `${diasRestantes}d` : 'Vencido'})` 
                            : 'Permanente'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Cuota Mensual:</span>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>
                          {Number(dist.precio_mensual) > 0 ? `S/ ${Number(dist.precio_mensual).toFixed(2)}` : 'Gratis'}
                        </span>
                      </div>
                      {dist.notas && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          📝 {dist.notas}
                        </div>
                      )}
                    </div>

                    {/* Acciones Móviles */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setSharingDistributor(dist)}
                        style={{ flex: 1.2, background: '#10b981', color: '#fff', border: 'none', justifyContent: 'center' }}
                      >
                        <Send size={14} />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingDistributor(dist)}
                        title="Editar"
                      >
                        <Edit3 size={14} color="#818cf8" />
                      </button>

                      {!isMaster && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => onRenewDistributor(dist)}
                          title="+30 Días"
                        >
                          <RefreshCw size={14} color="#06b6d4" />
                          <span>+30d</span>
                        </button>
                      )}

                      {!isMaster && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => onToggleStatusDistributor(dist)}
                          title="Suspender/Activar"
                        >
                          {isSuspendido ? <PlayCircle size={15} color="#10b981" /> : <PauseCircle size={15} color="#f59e0b" />}
                        </button>
                      )}

                      {!isMaster && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => onDeleteDistributor(dist)}
                          style={{ color: '#f43f5e' }}
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Edición de Distribuidor */}
      <EditDistributorModal
        isOpen={Boolean(editingDistributor)}
        onClose={() => setEditingDistributor(null)}
        distributor={editingDistributor}
        onUpdateDistributor={onUpdateDistributor}
      />

      {/* Modal de Envío de Credenciales por WhatsApp */}
      <ShareDistributorModal
        isOpen={Boolean(sharingDistributor)}
        onClose={() => setSharingDistributor(null)}
        distributor={sharingDistributor}
      />
    </div>
  );
}
