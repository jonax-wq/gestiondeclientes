import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { StatsHeader } from './components/StatsHeader';
import { UrgentAlertBanner } from './components/UrgentAlertBanner';
import { ClientsView } from './components/ClientsView';
import { AccountsView } from './components/AccountsView';
import { CodesView } from './components/CodesView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { DatabaseModal } from './components/DatabaseModal';
import { NewClientModal } from './components/NewClientModal';
import { EditClientModal } from './components/EditClientModal';
import { DeleteClientModal } from './components/DeleteClientModal';
import { NewAccountModal } from './components/NewAccountModal';
import { EditAccountModal } from './components/EditAccountModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ConfirmModal } from './components/ConfirmModal';
import { 
  cargarDatos, 
  guardarDatos, 
  calcularDiasRestantes, 
  addDays, 
  getTodayDate,
  actualizarPlantillasGuardadas,
  formatearFecha,
  verificarDesfase
} from './utils/storage';
import {
  isSupabaseConfigured,
  cargarDatosDesdeSupabase,
  cargarPlantillasDesdeSupabase,
  guardarCuentaEnSupabase,
  actualizarCuentaEnSupabase,
  renovarCuentaEnSupabase,
  eliminarCuentaEnSupabase,
  guardarClienteEnSupabase,
  actualizarClienteEnSupabase,
  renovarClienteEnSupabase,
  eliminarClienteEnSupabase,
  marcarWhatsAppEnviadoEnSupabase,
  vaciarTodoEnSupabase
} from './utils/supabaseClient';
import { Users, Tv, KeyRound, Globe } from 'lucide-react';
import { useToast } from './context/ToastContext';

export default function App() {
  const toast = useToast();
  const [data, setData] = useState(() => cargarDatos());
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(isSupabaseConfigured);
  const [activeTab, setActiveTab] = useState('clientes'); // 'clientes' | 'cuentas' | 'codigos' | 'portal'
  const [clientFilter, setClientFilter] = useState('todos'); // 'todos' | 'por_vencer' | 'activos' | 'vencidos'

  // Estados de interfaz y Sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);

  // PWA: Soporte para instalación en pantalla de inicio de celular/computadora
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Modales
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [isDeleteClientOpen, setIsDeleteClientOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Modal de confirmación estilizado
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    variant: 'danger',
    onConfirm: () => {}
  });

  // Selecciones para acciones específicas
  const [whatsAppSelection, setWhatsAppSelection] = useState({ cliente: null, perfil: null, cuenta: null, initialTemplate: null });
  const [receiptSelection, setReceiptSelection] = useState({ cliente: null, perfil: null, cuenta: null });
  const [preselectedSlot, setPreselectedSlot] = useState({ cuentaId: null, perfilId: null });

  // Escuchar evento de instalación PWA
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.info(
        '• En Android (Chrome): Toca el menú de 3 puntos y selecciona "Agregar a la pantalla principal".\n• En iPhone (Safari): Toca el botón Compartir y selecciona "Agregar al inicio".',
        '📱 Instalar en Pantalla de Inicio',
        { duration: 8000 }
      );
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error al solicitar instalación PWA:', err);
    }
  };

  // Cargar datos desde Supabase en el arranque si las credenciales están configuradas
  useEffect(() => {
    async function initSupabase() {
      if (isSupabaseConfigured) {
        setIsLoadingCloud(true);
        try {
          const cloudData = await cargarDatosDesdeSupabase();
          if (cloudData) {
            setData(cloudData);
            setIsCloudConnected(true);
          }

          // Sincronizar plantillas de WhatsApp desde la nube
          const cloudTemplates = await cargarPlantillasDesdeSupabase();
          if (cloudTemplates) {
            actualizarPlantillasGuardadas(cloudTemplates);
          }
        } catch (err) {
          console.error('Error inicializando Supabase:', err);
        } finally {
          setIsLoadingCloud(false);
        }
      }
    }
    initSupabase();
  }, []);

  // Guardar en localStorage ante cualquier cambio (como respaldo y caché)
  useEffect(() => {
    guardarDatos(data);
  }, [data]);

  const { cuentas = [], clientes = [] } = data;

  // Clientes urgentes a los que les faltan 2 días o menos (para la alerta principal de WhatsApp)
  const urgentClients = clientes.filter(c => {
    const d = calcularDiasRestantes(c.fechaVencimiento);
    return d >= 0 && d <= 2;
  });

  // Clientes con riesgo de desfase con su cuenta maestra
  const desfaseTotalCount = clientes.filter(cli => {
    const cta = cuentas.find(c => String(c.id) === String(cli.cuentaId));
    if (!cta) return false;
    return verificarDesfase(cta.fechaCorte, cli.fechaVencimiento).tieneDesfase;
  }).length;

  // 1. Guardar Nuevo Cliente y marcar su perfil como 'asignado'
  const handleSaveClient = async (nuevoCliente) => {
    let clientToSave = nuevoCliente;
    if (isCloudConnected) {
      try {
        const guardado = await guardarClienteEnSupabase(nuevoCliente);
        if (guardado) clientToSave = guardado;
      } catch (err) {
        console.error('Error guardando cliente en Supabase:', err);
      }
    }

    setData(prev => {
      // Actualizar perfil en la cuenta correspondiente
      const updatedCuentas = prev.cuentas.map(cta => {
        if (String(cta.id) === String(clientToSave.cuentaId)) {
          const updatedPerfiles = (cta.perfiles || []).map(p => {
            if (String(p.id) === String(clientToSave.perfilId)) {
              return { 
                ...p, 
                pin: clientToSave.pin || p.pin, 
                estado: 'asignado', 
                clienteId: clientToSave.id 
              };
            }
            return p;
          });
          return { ...cta, perfiles: updatedPerfiles };
        }
        return cta;
      });

      return {
        ...prev,
        cuentas: updatedCuentas,
        clientes: [clientToSave, ...prev.clientes]
      };
    });

    toast.success(`¡Cliente ${clientToSave.nombre} asignado con éxito!`, 'Asignación Exitosa');

    // Abrir automáticamente el modal de WhatsApp para entregar los accesos al cliente
    const cta = cuentas.find(c => String(c.id) === String(clientToSave.cuentaId));
    const prf = cta?.perfiles?.find(p => String(p.id) === String(clientToSave.perfilId));
    setWhatsAppSelection({
      cliente: clientToSave,
      perfil: prf || { nombre: 'Perfil asignado', pin: clientToSave.pin },
      cuenta: cta,
      initialTemplate: 'entrega_cuenta'
    });
    setIsWhatsAppOpen(true);
  };

  // 2. Renovar Membresía de Cliente (+30 Días y suma ingreso)
  const handleRenewClient = async (clienteId) => {
    const cli = clientes.find(c => String(c.id) === String(clienteId));
    if (!cli) return;
    const hoy = getTodayDate();
    const diasRestantes = calcularDiasRestantes(cli.fechaVencimiento);
    const fechaBase = diasRestantes < 0 ? hoy : cli.fechaVencimiento;
    const nuevaFechaVencimiento = addDays(fechaBase, 30);

    if (isCloudConnected) {
      try {
        await renovarClienteEnSupabase(clienteId, nuevaFechaVencimiento, cli.precioCobrado || 0);
      } catch (err) {
        console.error('Error renovando cliente en Supabase:', err);
      }
    }

    setData(prev => {
      const updatedClientes = prev.clientes.map(c => {
        if (String(c.id) === String(clienteId)) {
          return {
            ...c,
            fechaVencimiento: nuevaFechaVencimiento,
            recordatorioEnviado: false,
            renovaciones: (c.renovaciones || 0) + 1
          };
        }
        return c;
      });

      return { ...prev, clientes: updatedClientes };
    });

    // Detectar cuenta y perfil para WhatsApp y verificación de desfase
    const cta = cuentas.find(c => String(c.id) === String(cli.cuentaId));
    const prf = cta?.perfiles?.find(p => String(p.id) === String(cli.perfilId));
    const desfase = verificarDesfase(cta?.fechaCorte, nuevaFechaVencimiento);

    toast.success(
      `¡Membresía renovada hasta el ${formatearFecha(nuevaFechaVencimiento)}! (+30 días)`,
      `Renovación: ${cli.nombre}`,
      {
        duration: 7000,
        action: {
          label: '⭐ Enviar Gracias por Renovar',
          onClick: () => handleOpenWhatsApp(cli, prf, cta, 'gracias_renovacion')
        }
      }
    );

    if (desfase.tieneDesfase) {
      setTimeout(() => {
        toast.warning(
          `La cuenta maestra vence el ${formatearFecha(cta.fechaCorte)} (${desfase.diasDiferencia} días antes que este cliente). ¡Recuerda renovar la cuenta maestra!`,
          '⚠️ Atención: Riesgo de Desfase',
          { duration: 8000 }
        );
      }, 400);
    }
  };

  // 2.1. Abrir Modal de Edición de Cliente
  const handleOpenEditClient = (cliente) => {
    setClientToEdit(cliente);
    setIsEditClientOpen(true);
  };

  // 2.2. Actualizar datos de un cliente existente y sincronizar perfiles
  const handleUpdateClient = async (clienteActualizado, perfilAnteriorId) => {
    if (isCloudConnected) {
      try {
        await actualizarClienteEnSupabase(clienteActualizado, perfilAnteriorId);
      } catch (err) {
        console.error('Error actualizando cliente en Supabase:', err);
      }
    }

    setData(prev => {
      let updatedCuentas = prev.cuentas;

      // Si se reasignó de perfil, liberar el perfil anterior y asignar el nuevo
      if (perfilAnteriorId && String(perfilAnteriorId) !== String(clienteActualizado.perfilId)) {
        updatedCuentas = updatedCuentas.map(cta => {
          const updatedPerfiles = (cta.perfiles || []).map(p => {
            if (String(p.id) === String(perfilAnteriorId)) {
              return { ...p, estado: 'disponible', clienteId: null };
            }
            if (String(p.id) === String(clienteActualizado.perfilId)) {
              return { ...p, estado: 'asignado', clienteId: clienteActualizado.id, pin: clienteActualizado.pin || p.pin };
            }
            return p;
          });
          return { ...cta, perfiles: updatedPerfiles };
        });
      } else {
        // Si el perfil es el mismo, asegurar que el PIN se sincronice en el perfil de la cuenta
        updatedCuentas = updatedCuentas.map(cta => {
          if (String(cta.id) === String(clienteActualizado.cuentaId)) {
            const updatedPerfiles = (cta.perfiles || []).map(p => {
              if (String(p.id) === String(clienteActualizado.perfilId)) {
                return { ...p, pin: clienteActualizado.pin || p.pin };
              }
              return p;
            });
            return { ...cta, perfiles: updatedPerfiles };
          }
          return cta;
        });
      }

      const updatedClientes = prev.clientes.map(cli => 
        String(cli.id) === String(clienteActualizado.id) ? clienteActualizado : cli
      );

      return { ...prev, cuentas: updatedCuentas, clientes: updatedClientes };
    });
    toast.success('Cliente actualizado correctamente', 'Cambios Guardados');
  };

  // 3. Abrir Modal para dar de baja a un cliente
  const handleOpenDeleteClient = (cliente) => {
    setClientToDelete(cliente);
    setIsDeleteClientOpen(true);
  };

  // 3.1. Confirmar baja del cliente y LIBERAR su pantalla en las cuentas
  const handleConfirmDeleteClient = async (clienteId, perfilId) => {
    if (isCloudConnected) {
      try {
        await eliminarClienteEnSupabase(clienteId, perfilId);
      } catch (err) {
        console.error('Error eliminando cliente en Supabase:', err);
      }
    }

    setData(prev => {
      // Liberar el perfil en las cuentas maestras
      const updatedCuentas = prev.cuentas.map(cta => {
        const updatedPerfiles = (cta.perfiles || []).map(p => {
          if (String(p.id) === String(perfilId) || String(p.clienteId) === String(clienteId)) {
            return { ...p, estado: 'disponible', clienteId: null };
          }
          return p;
        });
        return { ...cta, perfiles: updatedPerfiles };
      });

      const updatedClientes = prev.clientes.filter(c => String(c.id) !== String(clienteId));
      return { ...prev, cuentas: updatedCuentas, clientes: updatedClientes };
    });

    toast.info('Cliente dado de baja y pantalla liberada', 'Baja Registrada');
  };

  // 4. Guardar Nueva Cuenta Completa
  const handleSaveAccount = async (nuevaCuenta) => {
    let cuentaToSave = nuevaCuenta;
    if (isCloudConnected) {
      try {
        const guardada = await guardarCuentaEnSupabase(nuevaCuenta);
        if (guardada) cuentaToSave = guardada;
      } catch (err) {
        console.error('Error guardando cuenta en Supabase:', err);
      }
    }

    setData(prev => ({
      ...prev,
      cuentas: [cuentaToSave, ...prev.cuentas]
    }));

    toast.success(`¡Cuenta maestra ${cuentaToSave.plataforma} registrada con éxito!`, 'Cuenta Creada');
  };

  // 4.1. Abrir Modal de Edición de Cuenta Maestra
  const handleOpenEditAccount = (cuenta) => {
    setAccountToEdit(cuenta);
    setIsEditAccountOpen(true);
  };

  // 4.2. Actualizar Cuenta Maestra
  const handleUpdateAccount = async (cuentaActualizada) => {
    if (isCloudConnected) {
      try {
        await actualizarCuentaEnSupabase(cuentaActualizada);
      } catch (err) {
        console.error('Error actualizando cuenta en Supabase:', err);
      }
    }

    setData(prev => {
      const updatedCuentas = prev.cuentas.map(cta => 
        String(cta.id) === String(cuentaActualizada.id) ? cuentaActualizada : cta
      );
      return { ...prev, cuentas: updatedCuentas };
    });

    toast.success('Cuenta maestra actualizada con éxito');
  };

  // 4.3. Renovar Cuenta Maestra (+30 Días de corte mensual y descuenta de ganancia)
  const handleRenewAccount = (cuentaId) => {
    const cta = cuentas.find(c => String(c.id) === String(cuentaId));
    if (!cta) return;
    const costoFormateado = Number(cta.costo || 0).toFixed(2);

    setConfirmModal({
      isOpen: true,
      title: '¿Renovar Cuenta Maestra?',
      message: `¿Deseas renovar el corte de ${cta.plataforma} (${cta.correo}) por 30 días más?\n\n• Se extenderá la fecha de corte 30 días.\n• Se registrará el costo mensual de S/ ${costoFormateado} (descontado de tu Ganancia Neta).`,
      confirmText: 'Sí, Renovar (+30d)',
      variant: 'primary',
      onConfirm: () => ejecutarRenovacionCuenta(cuentaId)
    });
  };

  const ejecutarRenovacionCuenta = async (cuentaId) => {
    const cta = cuentas.find(c => String(c.id) === String(cuentaId));
    if (!cta) return;

    const hoy = getTodayDate();
    const diasRestantes = calcularDiasRestantes(cta.fechaCorte);
    const fechaBase = diasRestantes < 0 ? hoy : (cta.fechaCorte || hoy);
    const nuevaFechaCorte = addDays(fechaBase, 30);
    const nuevasRenovaciones = (cta.renovaciones || 0) + 1;

    if (isCloudConnected) {
      try {
        await renovarCuentaEnSupabase(cuentaId, nuevaFechaCorte, nuevasRenovaciones);
      } catch (err) {
        console.error('Error renovando cuenta en Supabase:', err);
      }
    }

    setData(prev => {
      const updatedCuentas = prev.cuentas.map(c => {
        if (String(c.id) === String(cuentaId)) {
          return {
            ...c,
            fechaCorte: nuevaFechaCorte,
            renovaciones: nuevasRenovaciones
          };
        }
        return c;
      });
      return { ...prev, cuentas: updatedCuentas };
    });

    toast.success(`Cuenta ${cta.plataforma} renovada hasta el ${formatearFecha(nuevaFechaCorte)} (+30 días)`);
  };

  // 5. Eliminar Cuenta Completa
  const handleDeleteAccount = (cuentaId) => {
    const cta = cuentas.find(c => String(c.id) === String(cuentaId));
    if (!cta) return;

    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar Cuenta Maestra?',
      message: `¿Estás seguro de que deseas eliminar la cuenta ${cta.plataforma} (${cta.correo})?\n\nSe eliminarán también las asignaciones de sus ${cta.cantidadPerfiles || 5} perfiles.`,
      confirmText: 'Sí, Eliminar Cuenta',
      variant: 'danger',
      onConfirm: () => ejecutarEliminacionCuenta(cuentaId)
    });
  };

  const ejecutarEliminacionCuenta = async (cuentaId) => {
    if (isCloudConnected) {
      try {
        await eliminarCuentaEnSupabase(cuentaId);
      } catch (err) {
        console.error('Error eliminando cuenta en Supabase:', err);
      }
    }

    setData(prev => {
      const ctaAEliminar = prev.cuentas.find(c => String(c.id) === String(cuentaId));
      const perfilIds = (ctaAEliminar?.perfiles || []).map(p => String(p.id));

      const updatedCuentas = prev.cuentas.filter(c => String(c.id) !== String(cuentaId));
      const updatedClientes = prev.clientes.filter(cli => !perfilIds.includes(String(cli.perfilId)));

      return { ...prev, cuentas: updatedCuentas, clientes: updatedClientes };
    });

    toast.info('Cuenta maestra y perfiles eliminados');
  };

  // 6. Abrir Modal de WhatsApp para un cliente
  const handleOpenWhatsApp = (cliente, perfil, cuenta, initialTemplate = null) => {
    setWhatsAppSelection({ cliente, perfil, cuenta, initialTemplate });
    setIsWhatsAppOpen(true);
  };

  // 6.1. Abrir Modal de Comprobante / Recibo Digital
  const handleOpenReceipt = (cliente, perfil, cuenta) => {
    setReceiptSelection({ cliente, perfil, cuenta });
    setIsReceiptOpen(true);
  };

  // 7. Marcar como "Recordatorio enviado"
  const handleMarkWhatsAppSent = (clienteId) => {
    if (isCloudConnected) {
      marcarWhatsAppEnviadoEnSupabase(clienteId);
    }

    setData(prev => {
      const updatedClientes = prev.clientes.map(c => {
        if (String(c.id) === String(clienteId)) {
          return { ...c, recordatorioEnviado: true };
        }
        return c;
      });
      return { ...prev, clientes: updatedClientes };
    });
  };

  // 8. Asignar perfil directo desde la vista de Cuentas
  const handleAssignProfileFromAccount = (cuentaId, perfilId) => {
    setPreselectedSlot({ cuentaId, perfilId });
    setIsNewClientOpen(true);
  };

  // 9. Restaurar datos completos
  const handleImportData = (newData) => {
    setData(newData);
  };

  // 9.1. Vaciar todos los datos para empezar de cero
  const handleClearAllData = async () => {
    if (isCloudConnected) {
      try {
        await vaciarTodoEnSupabase();
      } catch (err) {
        console.error('Error vaciando en Supabase:', err);
      }
    }
    setData({ cuentas: [], clientes: [] });
  };

  return (
    <div className={`app-root ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Barra Lateral Profesional Responsiva */}
      <Sidebar 
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        clientCount={clientes.length}
        urgentCount={urgentClients.length}
        accountCount={cuentas.length}
        desfaseCount={desfaseTotalCount}
        isCloudConnected={isCloudConnected}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        isInstallable={isInstallable}
        onInstallPWA={handleInstallPWA}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Área Principal de Contenido */}
      <div className="main-viewport">
        <div className="app-container">
          {/* 1. Barra de Navegación Principal */}
          <Navbar 
            onNewClient={() => { setPreselectedSlot({ cuentaId: null, perfilId: null }); setIsNewClientOpen(true); }}
            onNewAccount={() => setIsNewAccountOpen(true)}
            urgentCount={urgentClients.length}
            onFilterUrgent={() => { setActiveTab('clientes'); setClientFilter('por_vencer'); }}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
            onGoToCodes={() => setActiveTab('codigos')}
          />

          {/* 2. Banner de Alerta Urgente (≤ 2 Días) */}
          <UrgentAlertBanner 
            urgentClients={urgentClients}
            onActionClick={() => { setActiveTab('clientes'); setClientFilter('por_vencer'); }}
          />

          {/* 3. Métricas y KPIs (visibles en Clientes y Cuentas) */}
          {(activeTab === 'clientes' || activeTab === 'cuentas') && (
            <StatsHeader 
              clientes={clientes}
              cuentas={cuentas}
              onSelectTab={setActiveTab}
              onSelectFilter={setClientFilter}
            />
          )}

          {/* 4. Selector de Pestañas Principales */}
          <div className="tabs-header-container">
            <div className="view-tabs">
              <button 
                className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`}
                onClick={() => setActiveTab('clientes')}
              >
                <Users size={17} />
                <span>Clientes ({clientes.length})</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'cuentas' ? 'active' : ''}`}
                onClick={() => setActiveTab('cuentas')}
              >
                <Tv size={17} />
                <span>Cuentas ({cuentas.length})</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'codigos' ? 'active' : ''}`}
                onClick={() => setActiveTab('codigos')}
              >
                <KeyRound size={17} />
                <span>Códigos Hogar</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'portal' ? 'active' : ''}`}
                onClick={() => setActiveTab('portal')}
              >
                <Globe size={17} />
                <span>Portal Auto-Servicio</span>
              </button>
            </div>

            <div className="tabs-duration-hint">
              <span>Membresía: <strong>30 días</strong></span>
            </div>
          </div>

          {/* 5. Vistas de Contenido */}
          {activeTab === 'clientes' && (
            <ClientsView 
              clientes={clientes}
              cuentas={cuentas}
              onOpenWhatsApp={handleOpenWhatsApp}
              onOpenReceipt={handleOpenReceipt}
              onRenewClient={handleRenewClient}
              onDeleteClient={handleOpenDeleteClient}
              onEditClient={handleOpenEditClient}
              onNewClient={() => { setPreselectedSlot({ cuentaId: null, perfilId: null }); setIsNewClientOpen(true); }}
              activeFilter={clientFilter}
              onFilterChange={setClientFilter}
            />
          )}

          {activeTab === 'cuentas' && (
            <AccountsView 
              cuentas={cuentas}
              clientes={clientes}
              onNewAccount={() => setIsNewAccountOpen(true)}
              onAssignProfile={handleAssignProfileFromAccount}
              onDeleteAccount={handleDeleteAccount}
              onRenewAccount={handleRenewAccount}
              onEditAccount={handleOpenEditAccount}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {activeTab === 'codigos' && (
            <CodesView 
              clientes={clientes}
              cuentas={cuentas}
            />
          )}

          {activeTab === 'portal' && (
            <CustomerPortalView 
              clientes={clientes}
              cuentas={cuentas}
              onOpenReceipt={handleOpenReceipt}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {/* Modales */}
          <NewClientModal 
            key={isNewClientOpen ? `client-${preselectedSlot?.cuentaId || 'all'}-${preselectedSlot?.perfilId || 'new'}` : 'client-closed'}
            isOpen={isNewClientOpen}
            onClose={() => {
              setIsNewClientOpen(false);
              setPreselectedSlot({ cuentaId: null, perfilId: null });
            }}
            cuentas={cuentas}
            onSaveClient={handleSaveClient}
            preselectedCuentaId={preselectedSlot.cuentaId}
            preselectedPerfilId={preselectedSlot.perfilId}
          />

          <EditClientModal 
            isOpen={isEditClientOpen}
            onClose={() => setIsEditClientOpen(false)}
            cliente={clientToEdit}
            cuentas={cuentas}
            onUpdateClient={handleUpdateClient}
          />

          <DeleteClientModal 
            isOpen={isDeleteClientOpen}
            onClose={() => setIsDeleteClientOpen(false)}
            cliente={clientToDelete}
            cuenta={cuentas.find(c => c.id === clientToDelete?.cuentaId)}
            perfil={cuentas.find(c => c.id === clientToDelete?.cuentaId)?.perfiles?.find(p => p.id === clientToDelete?.perfilId)}
            onConfirmDelete={handleConfirmDeleteClient}
          />

          <NewAccountModal 
            key={isNewAccountOpen ? 'acct-modal-open' : 'acct-modal-closed'}
            isOpen={isNewAccountOpen}
            onClose={() => setIsNewAccountOpen(false)}
            onSaveAccount={handleSaveAccount}
          />

          <EditAccountModal 
            isOpen={isEditAccountOpen}
            onClose={() => setIsEditAccountOpen(false)}
            cuenta={accountToEdit}
            onUpdateAccount={handleUpdateAccount}
          />

          <WhatsAppModal 
            isOpen={isWhatsAppOpen}
            onClose={() => setIsWhatsAppOpen(false)}
            cliente={whatsAppSelection.cliente}
            perfil={whatsAppSelection.perfil}
            cuenta={whatsAppSelection.cuenta}
            initialTemplate={whatsAppSelection.initialTemplate}
            onMarkSent={handleMarkWhatsAppSent}
          />

          {/* Modal de Comprobante / Recibo Digital */}
          <ReceiptModal
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            cliente={receiptSelection.cliente}
            perfil={receiptSelection.perfil}
            cuenta={receiptSelection.cuenta}
          />

          {/* Modal de Base de Datos y Respaldo SQL */}
          <DatabaseModal
            isOpen={isDatabaseOpen}
            onClose={() => setIsDatabaseOpen(false)}
            cuentas={cuentas}
            clientes={clientes}
            onImportData={handleImportData}
            onClearAllData={handleClearAllData}
          />

          {/* Modal de Confirmación Estilizado */}
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            confirmText={confirmModal.confirmText}
            variant={confirmModal.variant}
          />
        </div>
      </div>

      {/* Barra de Navegación Inferior Fija para Móviles (Bottom Bar Táctil) */}
      <BottomNav 
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        urgentCount={urgentClients.length}
        desfaseCount={desfaseTotalCount}
      />
    </div>
  );
}
