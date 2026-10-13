import React from 'react';
import { Users, Clock, AlertTriangle, Layers, CheckCircle2, TrendingUp } from 'lucide-react';

export function StatsHeader({ 
  clientes = [], 
  cuentas = [], 
  onSelectTab,
  onSelectFilter 
}) {
  // Cálculos estadísticos en tiempo real
  let clientesActivos = 0;
  let porVencer2Dias = 0;
  let vencidos = 0;
  let totalRecaudado = 0;
  let totalCostoCuentas = 0;

  clientes.forEach(cli => {
    // Si el cliente se renovó, cada ciclo sumó su pago mensual
    const mesesCliente = 1 + Number(cli.renovaciones || 0);
    totalRecaudado += Number(cli.precioCobrado || 0) * mesesCliente;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(cli.fechaVencimiento + 'T00:00:00');
    venc.setHours(0, 0, 0, 0);
    const dias = Math.round((venc - hoy) / (1000 * 60 * 60 * 24));

    if (dias < 0) {
      vencidos++;
    } else if (dias <= 2) {
      porVencer2Dias++;
      clientesActivos++;
    } else {
      clientesActivos++;
    }
  });

  let totalPerfiles = 0;
  let perfilesOcupados = 0;

  cuentas.forEach(cta => {
    // Cada mes/renovación de la cuenta maestra suma al costo y descuenta de la ganancia
    const mesesCuenta = 1 + Number(cta.renovaciones || 0);
    totalCostoCuentas += Number(cta.costo || 0) * mesesCuenta;

    (cta.perfiles || []).forEach(p => {
      totalPerfiles++;
      if (p.estado === 'asignado') {
        perfilesOcupados++;
      }
    });
  });

  const perfilesDisponibles = totalPerfiles - perfilesOcupados;
  const gananciaNeta = totalRecaudado - totalCostoCuentas;

  return (
    <div className="stats-grid">
      {/* Clientes Activos */}
      <div 
        className="stat-card" 
        onClick={() => { onSelectTab('clientes'); onSelectFilter('activos'); }}
        style={{ cursor: 'pointer' }}
        title="Ver todos los clientes activos"
      >
        <div className="stat-info">
          <span className="stat-label">Clientes Activos</span>
          <span className="stat-value">{clientesActivos}</span>
          <span className="stat-subtext">Membresías al día</span>
        </div>
        <div className="stat-icon emerald">
          <Users size={22} />
        </div>
      </div>

      {/* Por Vencer (≤ 2 Días) - REQUERIMIENTO PRINCIPAL */}
      <div 
        className={`stat-card ${porVencer2Dias > 0 ? 'pulse-amber' : ''}`}
        onClick={() => { onSelectTab('clientes'); onSelectFilter('por_vencer'); }}
        style={{ 
          cursor: 'pointer',
          borderColor: porVencer2Dias > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined,
          background: porVencer2Dias > 0 ? 'rgba(245, 158, 11, 0.08)' : undefined
        }}
        title="Ver clientes que vencen en 2 días o menos para enviar WhatsApp"
      >
        <div className="stat-info">
          <span className="stat-label" style={{ color: porVencer2Dias > 0 ? '#fde047' : undefined }}>
            Por Vencer (≤ 2 Días)
          </span>
          <span className="stat-value" style={{ color: porVencer2Dias > 0 ? '#fbbf24' : undefined }}>
            {porVencer2Dias}
          </span>
          <span className="stat-subtext">Avisar por WhatsApp</span>
        </div>
        <div className="stat-icon amber">
          <Clock size={22} />
        </div>
      </div>

      {/* Vencidos */}
      <div 
        className="stat-card"
        onClick={() => { onSelectTab('clientes'); onSelectFilter('vencidos'); }}
        style={{ cursor: 'pointer' }}
        title="Ver clientes vencidos para renovar o liberar perfil"
      >
        <div className="stat-info">
          <span className="stat-label">Clientes Vencidos</span>
          <span className="stat-value" style={{ color: vencidos > 0 ? '#fb7185' : undefined }}>
            {vencidos}
          </span>
          <span className="stat-subtext">Requieren renovación</span>
        </div>
        <div className="stat-icon rose">
          <AlertTriangle size={22} />
        </div>
      </div>

      {/* Perfiles Disponibles */}
      <div 
        className="stat-card"
        onClick={() => onSelectTab('cuentas')}
        style={{ cursor: 'pointer' }}
        title="Ver cuentas y perfiles libres para venta"
      >
        <div className="stat-info">
          <span className="stat-label">Perfiles Disponibles</span>
          <span className="stat-value" style={{ color: '#38bdf8' }}>
            {perfilesDisponibles}
          </span>
          <span className="stat-subtext">{perfilesOcupados} de {totalPerfiles} ocupados</span>
        </div>
        <div className="stat-icon cyan">
          <Layers size={22} />
        </div>
      </div>

      {/* Ganancia Estimada */}
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">Ganancia Neta</span>
          <span className="stat-value" style={{ color: gananciaNeta >= 0 ? '#34d399' : '#f87171' }}>
            S/ {gananciaNeta.toFixed(2)}
          </span>
          <span className="stat-subtext">Ingresos: S/ {totalRecaudado.toFixed(2)} | Costos: S/ {totalCostoCuentas.toFixed(2)}</span>
        </div>
        <div className="stat-icon indigo">
          <TrendingUp size={22} />
        </div>
      </div>
    </div>
  );
}
