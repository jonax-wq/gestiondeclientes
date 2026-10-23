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
import { DistributorsView } from './components/DistributorsView';
import { DatabaseModal } from './components/DatabaseModal';
import { NewClientModal } from './components/NewClientModal';
import { EditClientModal } from './components/EditClientModal';
import { DeleteClientModal } from './components/DeleteClientModal';
import { NewAccountModal } from './components/NewAccountModal';
import { EditAccountModal } from './components/EditAccountModal';
import { NewDistributorModal } from './components/NewDistributorModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AdminLockScreen } from './components/AdminLockScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { isSessionAuthenticated, logoutAdmin, getCurrentDistributor } from './utils/auth';
import { 
  cargarDatos, 
  guardarDatos, 
  calcularDiasRestantes, 
  addDays, 
  getTodayDate,
  actualizarPlantillasGuardadas,
  formatearFecha
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
  vaciarTodoEnSupabase,
  obtenerDistribuidoresDesdeSupabase,
  crearDistribuidorEnSupabase,
  actualizarDistribuidorEnSupabase,
  renovarDistribuidorEnSupabase,
  eliminarDistribuidorEnSupabase
} from './utils/supabaseClient';
import { KeyRound } from 'lucide-react';
import { useToast } from './context/ToastContext';

export default function App() {
  const toast = useToast();
  const [data, setData] = useState(() => cargarDatos());
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(isSupabaseConfigured);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'portal' || window.location.hash === '#portal') {
        return 'portal';
      }
    } catch (e) {}
    return 'clientes';
  });
  const [clientFilter, setClientFilter] = useState('todos'); // 'todos' | 'por_vencer' | 'activos' | 'vencidos'

  // Distribuidor Activo en Sesión y SuperAdmin
  const [currentDistributor, setCurrentDistributor] = useState(() => getCurrentDistributor());
  const isSuperAdmin = Boolean(currentDistributor?.es_superadmin) || currentDistributor?.codigo_distribuidor === 'DIST-2026';

  // Lista de distribuidores (para SuperAdmin)
  const [distribuidores, setDistribuidores] = useState([]);
  const [isNewDistributorOpen, setIsNewDistributorOpen] = useState(false);

  // Autenticación de Administrador (Contraseña Maestra / PIN)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => isSessionAuthenticated());
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLockAdmin = () => {
    logoutAdmin();
    setIsAdminAuthenticated(false);
    toast.info('Panel de administración bloqueado.');
  };

  // Estados de interfaz y Sidebar
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);

  // Tema Claro / Oscuro con persistencia en localStorage
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('flowstream_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('flowstream_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    document.documentElement.classList.add('no-transitions');
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 60);
  };

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

  // Cargar datos desde Supabase en el arranque o cambio de distribuidor
  useEffect(() => {
    async function initSupabase() {
      if (isSupabaseConfigured) {
        setIsLoadingCloud(true);
        try {
          const distCode = currentDistributor?.codigo_distribuidor || 'DIST-2026';
          const cloudData = await cargarDatosDesdeSupabase(distCode, isSuperAdmin);
          if (cloudData) {
            setData(cloudData);
            setIsCloudConnected(true);
          }

          // Cargar distribuidores si es SuperAdmin
          if (isSuperAdmin) {
            const distList = await obtenerDistribuidoresDesdeSupabase();
            if (distList && distList.length > 0) {
              setDistribuidores(distList);
            }
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
  }, [currentDistributor?.codigo_distribuidor, isSuperAdmin]);

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

  // ====================================================================
  // HANDLERS DE DISTRIBUIDORES (SUPERADMIN)
  // ====================================================================

  const handleSaveDistributor = async (distData, sendWhatsApp = true) => {
    let saved = distData;
    if (isCloudConnected) {
      try {
        const res = await crearDistribuidorEnSupabase(distData);
        if (res) saved = res;
      } catch (err) {
        console.error('Error creando distribuidor en Supabase:', err);
        toast.error('Error guardando distribuidor en la nube.');
        return;
      }
    }

    setDistribuidores(prev => [saved, ...prev]);
    toast.success(`¡Distribuidor ${saved.nombre} (${saved.codigo_distribuidor}) registrado exitosamente!`);

    if (sendWhatsApp && saved.whatsapp) {
      const rawPhone = saved.whatsapp.replace(/\D/g, '');
      const appUrl = window.location.origin;
      const dias = saved.fecha_expiracion ? calcularDiasRestantes(saved.fecha_expiracion) : null;
      const expiracionTexto = saved.fecha_expiracion 
        ? `${formatearFecha(saved.fecha_expiracion)} (${dias >= 0 ? `en ${dias} días` : 'Vencido'})`
        : 'Permanente (Sin límite)';

      const mensaje = `👋 ¡Hola *${saved.nombre}*! Te saluda el Administrador de *Flow Stream*.

Tu acceso como Distribuidor de streaming ya se encuentra *ACTIVO*:

🌐 *Enlace del sistema:* ${appUrl}
🔑 *Tu Código de Distribuidor:* *${saved.codigo_distribuidor}*
📅 *Vigencia de tu licencia:* ${expiracionTexto}

📲 *Instrucciones de ingreso:*
1. Abre el enlace arriba en tu celular o computadora.
2. Ingresa tu código *${saved.codigo_distribuidor}* en la pantalla de acceso.
3. ¡Listo! Podrás gestionar tus cuentas de streaming, clientes y generar mensajes de WhatsApp directos.

¡Muchos éxitos con tus ventas! 🍿🎬`;

      const waLink = `https://wa.me/${rawPhone}?text=${encodeURIComponent(mensaje)}`;
      window.open(waLink, '_blank');
    }
  };

  const handleRenewDistributor = async (dist) => {
    if (isCloudConnected) {
      try {
        const res = await renovarDistribuidorEnSupabase(dist.id, 30);
        if (res) {
          setDistribuidores(prev => prev.map(d => d.id === dist.id ? res : d));
          toast.success(`Distribuidor ${dist.nombre} renovado +30 días (hasta ${formatearFecha(res.fecha_expiracion)})`);
          return;
        }
      } catch (err) {
        console.error('Error renovando distribuidor en Supabase:', err);
      }
    }

    const nuevaFecha = addDays(dist.fecha_expiracion || getTodayDate(), 30);
    setDistribuidores(prev => prev.map(d => d.codigo_distribuidor === dist.codigo_distribuidor ? { ...d, fecha_expiracion: nuevaFecha, estado: 'activo' } : d));
    toast.success(`Distribuidor renovado hasta ${formatearFecha(nuevaFecha)}`);
  };

  const handleToggleStatusDistributor = async (dist) => {
    const nuevoEstado = dist.estado === 'suspendido' ? 'activo' : 'suspendido';
    if (isCloudConnected) {
      try {
        await actualizarDistribuidorEnSupabase(dist.id, { estado: nuevoEstado });
      } catch (err) {
        console.error('Error actualizando estado en Supabase:', err);
      }
    }

    setDistribuidores(prev => prev.map(d => (d.id === dist.id || d.codigo_distribuidor === dist.codigo_distribuidor) ? { ...d, estado: nuevoEstado } : d));
    toast.info(`Distribuidor ${dist.nombre} ahora está ${nuevoEstado.toUpperCase()}`);
  };

  const handleDeleteDistributor = (dist) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar Distribuidor?',
      message: `¿Estás seguro de que deseas eliminar al distribuidor ${dist.nombre} (${dist.codigo_distribuidor})?\n\nPerderá el acceso al sistema inmediatamente.`,
      confirmText: 'Sí, Eliminar Distribuidor',
      variant: 'danger',
      onConfirm: async () => {
        if (isCloudConnected) {
          try {
            await eliminarDistribuidorEnSupabase(dist.id);
          } catch (err) {
            console.error('Error eliminando en Supabase:', err);
          }
        }
        setDistribuidores(prev => prev.filter(d => d.codigo_distribuidor !== dist.codigo_distribuidor));
        toast.info(`Distribuidor ${dist.nombre} eliminado.`);
      }
    });
  };

  const handleUpdateDistributor = async (distId, updates) => {
    if (isCloudConnected) {
      try {
        const res = await actualizarDistribuidorEnSupabase(distId, updates);
        if (res) {
          setDistribuidores(prev => prev.map(d => (d.id === distId || d.codigo_distribuidor === distId) ? res : d));
          return res;
        }
      } catch (err) {
        console.error('Error actualizando distribuidor en Supabase:', err);
      }
    }

    setDistribuidores(prev => prev.map(d => (d.id === distId || d.codigo_distribuidor === distId) ? { ...d, ...updates } : d));
  };

  // ====================================================================
  // HANDLERS DE CLIENTES Y CUENTAS
  // ====================================================================

  // 1. Guardar Nuevo Cliente
  const handleSaveClient = async (nuevoCliente) => {
    let clientToSave = nuevoCliente;
    const distCode = currentDistributor?.codigo_distribuidor || 'DIST-2026';

    if (isCloudConnected) {
      try {
        const guardado = await guardarClienteEnSupabase(nuevoCliente, distCode);
        if (guardado) clientToSave = guardado;
      } catch (err) {
        console.error('Error guardando cliente en Supabase:', err);
      }
    }

    setData(prev => {
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

  // 2. Renovar Membresía de Cliente (+30 Días)
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

    const cta = cuentas.find(c => String(c.id) === String(cli.cuentaId));
    const prf = cta?.perfiles?.find(p => String(p.id) === String(cli.perfilId));

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
  };

  // 2.1. Abrir Modal de Edición de Cliente
  const handleOpenEditClient = (cliente) => {
    setClientToEdit(cliente);
    setIsEditClientOpen(true);
  };

  // 2.2. Actualizar datos de un cliente existente
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

  // 3.1. Confirmar baja del cliente
  const handleConfirmDeleteClient = async (clienteId, perfilId) => {
    if (isCloudConnected) {
      try {
        await eliminarClienteEnSupabase(clienteId, perfilId);
      } catch (err) {
        console.error('Error eliminando cliente en Supabase:', err);
      }
    }

    setData(prev => {
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
    const distCode = currentDistributor?.codigo_distribuidor || 'DIST-2026';

    if (isCloudConnected) {
      try {
        const guardada = await guardarCuentaEnSupabase(nuevaCuenta, distCode);
        if (guardada) cuentaToSave = guardada;
      } catch (err) {
        console.error('Error guardando cuenta en Supabase:', err);
      }
    }

    setData(prev => ({
      ...prev,
      cuentas: [cuentaToSave, ...prev.cuentas]
    }));

    toast.success(`Cuenta de ${cuentaToSave.plataforma} agregada con éxito`, 'Cuenta Creada');
  };

  // 4.1. Abrir Modal de Edición de Cuenta
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
      const updatedCuentas = prev.cuentas.map(c => 
        String(c.id) === String(cuentaActualizada.id) ? cuentaActualizada : c
      );
      return { ...prev, cuentas: updatedCuentas };
    });

    toast.success(`Cuenta de ${cuentaActualizada.plataforma} actualizada correctamente`, 'Cambios Guardados');
  };

  // 4.3. Renovar Cuenta Maestra (+30 Días)
  const handleRenewAccount = async (cuentaId) => {
    const cta = cuentas.find(c => String(c.id) === String(cuentaId));
    if (!cta) return;

    const hoy = getTodayDate();
    const diasRestantes = calcularDiasRestantes(cta.fechaCorte);
    const fechaBase = diasRestantes < 0 ? hoy : cta.fechaCorte;
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

  // 0. Si el usuario no está autenticado y está intentando acceder a los módulos de administración:
  if (!isAdminAuthenticated && activeTab !== 'portal') {
    return (
      <div className="app-root lock-screen-active">
        <AdminLockScreen 
          onUnlock={(dist) => {
            if (dist) setCurrentDistributor(dist);
            setIsAdminAuthenticated(true);
            toast.success(`¡Acceso concedido! Bienvenido, ${dist?.nombre || 'Administrador'}.`);
          }}
          onGoToPortal={() => {
            setActiveTab('portal');
          }}
        />
      </div>
    );
  }

  // 0.1 Si el usuario es un cliente navegando en el portal de autoservicio sin autenticación admin:
  if (!isAdminAuthenticated && activeTab === 'portal') {
    return (
      <div className="app-root customer-portal-standalone">
        <header className="standalone-portal-header">
          <div className="brand-wrapper">
            <div className="brand-logo-container">
              <img src="/flow_logo.png" alt="Flow Stream Logo" className="brand-logo-img" />
            </div>
            <div className="brand-text-container">
              <div className="brand-title">
                <span>Flow Stream</span>
                <span className="brand-badge-mini" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7', border: '1px solid rgba(139, 92, 246, 0.4)' }}>CLIENTES</span>
              </div>
              <p className="brand-subtitle">Portal de Auto-Servicio y Consulta de Membresías</p>
            </div>
          </div>

          <div className="portal-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleToggleTheme}
              title="Cambiar tema claro/oscuro"
            >
              {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('clientes')}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', boxShadow: '0 0 12px rgba(139, 92, 246, 0.35)' }}
              title="Acceso restringido para el Administrador del CRM"
            >
              <KeyRound size={15} />
              <span>Acceso Admin 🔐</span>
            </button>
          </div>
        </header>

        <main className="standalone-portal-main">
          <CustomerPortalView 
            clientes={clientes}
            cuentas={cuentas}
            onOpenReceipt={handleOpenReceipt}
            onOpenWhatsApp={handleOpenWhatsApp}
            onGoToAdmin={() => setActiveTab('clientes')}
            isAdminAuthenticated={false}
          />
        </main>

        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          cliente={receiptSelection.cliente}
          perfil={receiptSelection.perfil}
          cuenta={receiptSelection.cuenta}
        />
      </div>
    );
  }

  return (
    <div className={`app-root ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Barra Lateral Profesional Responsiva */}
      <Sidebar 
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        clientCount={clientes.length}
        urgentCount={urgentClients.length}
        accountCount={cuentas.length}
        distributorCount={distribuidores.length}
        currentDistributor={currentDistributor}
        isCloudConnected={isCloudConnected}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        onLockAdmin={handleLockAdmin}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
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
            onLockAdmin={handleLockAdmin}
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

          {activeTab === 'distribuidores' && isSuperAdmin && (
            <DistributorsView 
              distribuidores={distribuidores}
              onNewDistributor={() => setIsNewDistributorOpen(true)}
              onRenewDistributor={handleRenewDistributor}
              onToggleStatusDistributor={handleToggleStatusDistributor}
              onDeleteDistributor={handleDeleteDistributor}
              onUpdateDistributor={handleUpdateDistributor}
            />
          )}

          {activeTab === 'portal' && (
            <CustomerPortalView 
              clientes={clientes}
              cuentas={cuentas}
              onOpenReceipt={handleOpenReceipt}
              onOpenWhatsApp={handleOpenWhatsApp}
              onGoToAdmin={() => setActiveTab('clientes')}
              isAdminAuthenticated={isAdminAuthenticated}
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
            cuentas={cuentas}
            onConfirmDelete={handleConfirmDeleteClient}
          />

          <NewAccountModal 
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

          {/* Modal Nuevo Distribuidor (SuperAdmin) */}
          <NewDistributorModal
            isOpen={isNewDistributorOpen}
            onClose={() => setIsNewDistributorOpen(false)}
            onSaveDistributor={handleSaveDistributor}
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

          <ReceiptModal 
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            cliente={receiptSelection.cliente}
            perfil={receiptSelection.perfil}
            cuenta={receiptSelection.cuenta}
          />

          <DatabaseModal
            isOpen={isDatabaseOpen}
            onClose={() => setIsDatabaseOpen(false)}
            cuentas={cuentas}
            clientes={clientes}
            onImportData={handleImportData}
            onClearAllData={handleClearAllData}
          />

          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
          />

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

      <BottomNav 
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        urgentCount={urgentClients.length}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
