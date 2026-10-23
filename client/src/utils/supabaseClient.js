import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('tu-proyecto') && 
  !supabaseAnonKey.includes('tu_clave')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Carga las cuentas y clientes desde Supabase, filtrando por el código de distribuidor si aplica.
 * @param {string} distribuidorCodigo - Código DIST-XXXX del distribuidor actual
 * @param {boolean} isSuperAdmin - Si es SuperAdmin puede ver todos o su propio lote
 */
export async function cargarDatosDesdeSupabase(distribuidorCodigo = 'DIST-2026', isSuperAdmin = false) {
  if (!supabase) return null;

  try {
    // 1. Obtener cuentas maestras
    let queryCuentas = supabase
      .from('cuentas_streaming')
      .select('*')
      .order('id', { ascending: false });

    // Si no es SuperAdmin, aislar estrictamente por su código de distribuidor
    if (!isSuperAdmin && distribuidorCodigo) {
      queryCuentas = queryCuentas.eq('distribuidor_codigo', distribuidorCodigo);
    }

    const { data: cuentasData, error: errCuentas } = await queryCuentas;
    if (errCuentas) throw errCuentas;

    // Si no hay cuentas, devolver vacío de inmediato
    const cuentaIds = (cuentasData || []).map(c => c.id);

    // 2. Obtener perfiles de las cuentas filtradas
    let perfilesData = [];
    if (cuentaIds.length > 0) {
      const { data: pData, error: errPerfiles } = await supabase
        .from('perfiles')
        .select('*')
        .in('cuenta_id', cuentaIds)
        .order('numero_perfil', { ascending: true });

      if (errPerfiles) throw errPerfiles;
      perfilesData = pData || [];
    }

    // 3. Obtener clientes
    let queryClientes = supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false });

    if (!isSuperAdmin && distribuidorCodigo) {
      queryClientes = queryClientes.eq('distribuidor_codigo', distribuidorCodigo);
    }

    const { data: clientesData, error: errClientes } = await queryClientes;
    if (errClientes) throw errClientes;

    // Agrupar perfiles por cuenta_id
    const perfilesPorCuenta = {};
    perfilesData.forEach(p => {
      if (!perfilesPorCuenta[p.cuenta_id]) {
        perfilesPorCuenta[p.cuenta_id] = [];
      }
      perfilesPorCuenta[p.cuenta_id].push({
        id: p.id,
        cuentaId: p.cuenta_id,
        numero: p.numero_perfil,
        nombre: p.nombre_perfil,
        pin: p.pin || '',
        estado: p.estado || 'disponible',
        clienteId: p.cliente_id
      });
    });

    // Formatear cuentas para el frontend
    const cuentas = (cuentasData || []).map(c => ({
      id: c.id,
      plataforma: c.plataforma,
      correo: c.correo,
      password: c.password,
      fechaCorte: c.fecha_corte_cuenta,
      costo: Number(c.costo_cuenta) || 0,
      cantidadPerfiles: c.cantidad_perfiles,
      proveedor: c.proveedor || '',
      notas: c.notas || '',
      renovaciones: c.renovaciones || 0,
      estado: c.estado || 'activa',
      distribuidorCodigo: c.distribuidor_codigo || 'DIST-2026',
      perfiles: perfilesPorCuenta[c.id] || []
    }));

    // Formatear clientes para el frontend
    const clientes = (clientesData || []).map(cli => ({
      id: cli.id,
      nombre: cli.nombre || 'Cliente',
      codigoPais: cli.codigo_pais || '+51',
      celular: cli.celular,
      celularCompleto: cli.celular_completo || `${cli.codigo_pais}${cli.celular}`,
      cuentaId: cli.cuenta_id,
      perfilId: cli.perfil_id,
      pin: cli.pin || '',
      fechaInicio: cli.fecha_inicio,
      fechaVencimiento: cli.fecha_vencimiento,
      precioCobrado: Number(cli.precio_cobrado) || 0,
      recordatorioEnviado: Boolean(cli.recordatorio_enviado),
      distribuidorCodigo: cli.distribuidor_codigo || 'DIST-2026',
      notas: cli.notas || ''
    }));

    return { cuentas, clientes };
  } catch (err) {
    console.error('Error cargando datos desde Supabase:', err);
    return null;
  }
}

/**
 * Guarda una nueva cuenta completa con sus perfiles en Supabase
 */
export async function guardarCuentaEnSupabase(nuevaCuenta, distribuidorCodigo = 'DIST-2026') {
  if (!supabase) return null;

  try {
    // 1. Insertar la cuenta maestra con código de distribuidor
    const { data: cuentaCreada, error: errCta } = await supabase
      .from('cuentas_streaming')
      .insert({
        plataforma: nuevaCuenta.plataforma,
        correo: nuevaCuenta.correo,
        password: nuevaCuenta.password,
        fecha_corte_cuenta: nuevaCuenta.fechaCorte,
        costo_cuenta: nuevaCuenta.costo || 0,
        cantidad_perfiles: nuevaCuenta.cantidadPerfiles || 5,
        proveedor: nuevaCuenta.proveedor || null,
        notas: nuevaCuenta.notas || null,
        distribuidor_codigo: distribuidorCodigo || 'DIST-2026'
      })
      .select()
      .single();

    if (errCta) throw errCta;

    // 2. Insertar los perfiles asociados
    const perfilesPayload = (nuevaCuenta.perfiles || []).map(p => ({
      cuenta_id: cuentaCreada.id,
      numero_perfil: p.numero,
      nombre_perfil: p.nombre,
      pin: p.pin || '',
      estado: 'disponible'
    }));

    const { data: perfilesCreados, error: errPrf } = await supabase
      .from('perfiles')
      .insert(perfilesPayload)
      .select();

    if (errPrf) throw errPrf;

    return {
      ...nuevaCuenta,
      id: cuentaCreada.id,
      distribuidorCodigo: cuentaCreada.distribuidor_codigo,
      perfiles: (perfilesCreados || []).map(p => ({
        id: p.id,
        cuentaId: p.cuenta_id,
        numero: p.numero_perfil,
        nombre: p.nombre_perfil,
        pin: p.pin,
        estado: p.estado,
        clienteId: null
      }))
    };
  } catch (err) {
    console.error('Error guardando cuenta en Supabase:', err);
    throw err;
  }
}

/**
 * Actualiza los datos de una cuenta maestra en Supabase
 */
export async function actualizarCuentaEnSupabase(cuentaActualizada) {
  if (!supabase) return null;

  try {
    const { error: errCta } = await supabase
      .from('cuentas_streaming')
      .update({
        plataforma: cuentaActualizada.plataforma,
        correo: cuentaActualizada.correo,
        password: cuentaActualizada.password,
        fecha_corte_cuenta: cuentaActualizada.fechaCorte,
        costo_cuenta: cuentaActualizada.costo || 0,
        proveedor: cuentaActualizada.proveedor || null,
        notas: cuentaActualizada.notas || null
      })
      .eq('id', cuentaActualizada.id);

    if (errCta) throw errCta;

    if (cuentaActualizada.perfiles && cuentaActualizada.perfiles.length > 0) {
      for (const p of cuentaActualizada.perfiles) {
        if (p.id) {
          await supabase
            .from('perfiles')
            .update({
              nombre_perfil: p.nombre,
              pin: p.pin || ''
            })
            .eq('id', p.id);
        }
      }
    }

    return true;
  } catch (err) {
    console.error('Error actualizando cuenta en Supabase:', err);
    throw err;
  }
}

/**
 * Renueva una cuenta maestra (+30 días y suma renovación) en Supabase
 */
export async function renovarCuentaEnSupabase(cuentaId, nuevaFechaCorte, nuevasRenovaciones) {
  if (!supabase) return null;

  try {
    const { error } = await supabase
      .from('cuentas_streaming')
      .update({
        fecha_corte_cuenta: nuevaFechaCorte,
        renovaciones: nuevasRenovaciones
      })
      .eq('id', cuentaId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error renovando cuenta en Supabase:', err);
    throw err;
  }
}

/**
 * Elimina una cuenta maestra en Supabase
 */
export async function eliminarCuentaEnSupabase(cuentaId) {
  if (!supabase) return null;

  try {
    const { error } = await supabase
      .from('cuentas_streaming')
      .delete()
      .eq('id', cuentaId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error eliminando cuenta en Supabase:', err);
    throw err;
  }
}

/**
 * Guarda un nuevo cliente y marca el perfil como asignado en Supabase
 */
export async function guardarClienteEnSupabase(nuevoCliente, distribuidorCodigo = 'DIST-2026') {
  if (!supabase) return null;

  try {
    const celularLimpio = String(nuevoCliente.celular || '').trim();
    const codigoPaisLimpio = String(nuevoCliente.codigoPais || '+51').trim();
    const celularCompleto = nuevoCliente.celularCompleto || `${codigoPaisLimpio}${celularLimpio}`;
    const cuentaIdNum = nuevoCliente.cuentaId ? parseInt(nuevoCliente.cuentaId, 10) : null;
    const perfilIdNum = nuevoCliente.perfilId ? parseInt(nuevoCliente.perfilId, 10) : null;

    // 1. Insertar el cliente con distribuidor_codigo
    const { data: clienteCreado, error: errCli } = await supabase
      .from('clientes')
      .insert({
        nombre: nuevoCliente.nombre || `Cliente ${celularLimpio}`,
        codigo_pais: codigoPaisLimpio,
        celular: celularLimpio,
        celular_completo: celularCompleto,
        cuenta_id: isNaN(cuentaIdNum) ? null : cuentaIdNum,
        perfil_id: isNaN(perfilIdNum) ? null : perfilIdNum,
        pin: nuevoCliente.pin || '',
        fecha_inicio: nuevoCliente.fechaInicio,
        fecha_vencimiento: nuevoCliente.fechaVencimiento,
        precio_cobrado: Number(nuevoCliente.precioCobrado) || 0,
        distribuidor_codigo: distribuidorCodigo || 'DIST-2026',
        notas: nuevoCliente.notas || null
      })
      .select()
      .single();

    if (errCli) throw errCli;

    // 2. Marcar el perfil como 'asignado'
    if (perfilIdNum && !isNaN(perfilIdNum)) {
      await supabase
        .from('perfiles')
        .update({
          estado: 'asignado',
          cliente_id: clienteCreado.id,
          pin: nuevoCliente.pin || ''
        })
        .eq('id', perfilIdNum);
    }

    return {
      ...nuevoCliente,
      id: clienteCreado.id,
      cuentaId: clienteCreado.cuenta_id,
      perfilId: clienteCreado.perfil_id,
      distribuidorCodigo: clienteCreado.distribuidor_codigo,
      celularCompleto
    };
  } catch (err) {
    console.error('Error guardando cliente en Supabase:', err);
    throw err;
  }
}

/**
 * Actualiza los datos de un cliente en Supabase y maneja reasignación de perfiles
 */
export async function actualizarClienteEnSupabase(clienteActualizado, perfilAnteriorId) {
  if (!supabase) return null;

  try {
    const celularLimpio = String(clienteActualizado.celular || '').trim();
    const codigoPaisLimpio = String(clienteActualizado.codigoPais || '+51').trim();
    const celularCompleto = clienteActualizado.celularCompleto || `${codigoPaisLimpio}${celularLimpio}`;
    const cuentaIdNum = clienteActualizado.cuentaId ? parseInt(clienteActualizado.cuentaId, 10) : null;
    const perfilIdNum = clienteActualizado.perfilId ? parseInt(clienteActualizado.perfilId, 10) : null;
    const perfilAnteriorIdNum = perfilAnteriorId ? parseInt(perfilAnteriorId, 10) : null;

    const { error: errCli } = await supabase
      .from('clientes')
      .update({
        nombre: clienteActualizado.nombre,
        codigo_pais: codigoPaisLimpio,
        celular: celularLimpio,
        celular_completo: celularCompleto,
        cuenta_id: isNaN(cuentaIdNum) ? null : cuentaIdNum,
        perfil_id: isNaN(perfilIdNum) ? null : perfilIdNum,
        pin: clienteActualizado.pin,
        fecha_inicio: clienteActualizado.fechaInicio,
        fecha_vencimiento: clienteActualizado.fechaVencimiento,
        precio_cobrado: Number(clienteActualizado.precioCobrado) || 0,
        notas: clienteActualizado.notas
      })
      .eq('id', clienteActualizado.id);

    if (errCli) throw errCli;

    if (perfilAnteriorIdNum && perfilAnteriorIdNum !== perfilIdNum) {
      await supabase
        .from('perfiles')
        .update({ estado: 'disponible', cliente_id: null })
        .eq('id', perfilAnteriorIdNum);

      if (perfilIdNum && !isNaN(perfilIdNum)) {
        await supabase
          .from('perfiles')
          .update({
            estado: 'asignado',
            cliente_id: clienteActualizado.id,
            pin: clienteActualizado.pin
          })
          .eq('id', perfilIdNum);
      }
    } else if (perfilIdNum && !isNaN(perfilIdNum)) {
      await supabase
        .from('perfiles')
        .update({ pin: clienteActualizado.pin })
        .eq('id', perfilIdNum);
    }

    return true;
  } catch (err) {
    console.error('Error actualizando cliente en Supabase:', err);
    throw err;
  }
}

/**
 * Renueva un cliente (+30 días) en Supabase
 */
export async function renovarClienteEnSupabase(clienteId, nuevaFechaVencimiento, monto = 0) {
  if (!supabase) return null;

  try {
    const { error: errCli } = await supabase
      .from('clientes')
      .update({
        fecha_vencimiento: nuevaFechaVencimiento,
        recordatorio_enviado: false
      })
      .eq('id', clienteId);

    if (errCli) throw errCli;

    await supabase
      .from('historial_renovaciones')
      .insert({
        cliente_id: clienteId,
        dias_agregados: 30,
        monto_cobrado: monto
      });

    return true;
  } catch (err) {
    console.error('Error renovando cliente en Supabase:', err);
    throw err;
  }
}

/**
 * Da de baja a un cliente y libera su pantalla en Supabase
 */
export async function eliminarClienteEnSupabase(clienteId, perfilId) {
  if (!supabase) return null;

  try {
    if (perfilId) {
      await supabase
        .from('perfiles')
        .update({ estado: 'disponible', cliente_id: null })
        .eq('id', perfilId);
    }

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error eliminando cliente en Supabase:', err);
    throw err;
  }
}

/**
 * Marca recordatorio de WhatsApp como enviado
 */
export async function marcarWhatsAppEnviadoEnSupabase(clienteId) {
  if (!supabase) return null;

  try {
    await supabase
      .from('clientes')
      .update({ recordatorio_enviado: true })
      .eq('id', clienteId);
  } catch (err) {
    console.error('Error marcando WhatsApp en Supabase:', err);
  }
}

/**
 * Vacía todas las tablas en Supabase
 */
export async function vaciarTodoEnSupabase() {
  if (!supabase) return null;

  try {
    await supabase.from('historial_renovaciones').delete().neq('id', 0);
    await supabase.from('clientes').delete().neq('id', 0);
    await supabase.from('perfiles').delete().neq('id', 0);
    await supabase.from('cuentas_streaming').delete().neq('id', 0);
    return true;
  } catch (err) {
    console.error('Error vaciando datos en Supabase:', err);
    throw err;
  }
}

/**
 * Carga las plantillas personalizadas de WhatsApp desde Supabase
 */
export async function cargarPlantillasDesdeSupabase() {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('plantillas_whatsapp')
      .select('*');

    if (error) {
      return null;
    }

    if (!data || data.length === 0) return null;

    const plantillas = {};
    data.forEach(p => {
      plantillas[p.id || p.tipo] = p.contenido;
    });
    return plantillas;
  } catch (err) {
    console.warn('No se pudieron cargar plantillas desde Supabase:', err);
    return null;
  }
}

/**
 * Guarda o actualiza una plantilla de WhatsApp en Supabase
 */
export async function guardarPlantillaEnSupabase(tipo, contenido) {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('plantillas_whatsapp')
      .upsert({
        id: tipo,
        tipo: tipo,
        contenido: contenido,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('No se pudo guardar la plantilla en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error guardando plantilla en Supabase:', err);
    return false;
  }
}

// ====================================================================
// MÓDULO DE DISTRIBUIDORES (SUPERADMIN)
// ====================================================================

/**
 * Obtiene la lista completa de distribuidores registrados
 */
export async function obtenerDistribuidoresDesdeSupabase() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('distribuidores')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Tabla distribuidores aún no disponible en Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error cargando distribuidores:', err);
    return [];
  }
}

/**
 * Registra un nuevo distribuidor en Supabase
 */
export async function crearDistribuidorEnSupabase(distribuidor) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('distribuidores')
      .insert({
        codigo_distribuidor: distribuidor.codigo_distribuidor.toUpperCase().trim(),
        nombre: distribuidor.nombre.trim(),
        whatsapp: distribuidor.whatsapp ? distribuidor.whatsapp.trim() : null,
        estado: distribuidor.estado || 'activo',
        fecha_expiracion: distribuidor.fecha_expiracion || null,
        es_superadmin: Boolean(distribuidor.es_superadmin),
        max_cuentas: Number(distribuidor.max_cuentas) || 100,
        precio_mensual: Number(distribuidor.precio_mensual) || 0,
        notas: distribuidor.notas || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creando distribuidor en Supabase:', err);
    throw err;
  }
}

/**
 * Actualiza los datos o estado de un distribuidor
 */
export async function actualizarDistribuidorEnSupabase(id, updates) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('distribuidores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error actualizando distribuidor en Supabase:', err);
    throw err;
  }
}

/**
 * Renueva la fecha de expiración de un distribuidor agregando días
 */
export async function renovarDistribuidorEnSupabase(distribuidorId, dias = 30) {
  if (!supabase) return null;

  try {
    // 1. Obtener distribuidor actual
    const { data: dist, error: errFetch } = await supabase
      .from('distribuidores')
      .select('fecha_expiracion')
      .eq('id', distribuidorId)
      .single();

    if (errFetch) throw errFetch;

    const baseDate = dist.fecha_expiracion ? new Date(dist.fecha_expiracion + 'T00:00:00') : new Date();
    const hoy = new Date();
    const fechaReferencia = baseDate < hoy ? hoy : baseDate;
    fechaReferencia.setDate(fechaReferencia.getDate() + dias);

    const nuevaFecha = fechaReferencia.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('distribuidores')
      .update({
        fecha_expiracion: nuevaFecha,
        estado: 'activo'
      })
      .eq('id', distribuidorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error renovando distribuidor en Supabase:', err);
    throw err;
  }
}

/**
 * Elimina un distribuidor de Supabase
 */
export async function eliminarDistribuidorEnSupabase(distribuidorId) {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('distribuidores')
      .delete()
      .eq('id', distribuidorId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error eliminando distribuidor en Supabase:', err);
    throw err;
  }
}
