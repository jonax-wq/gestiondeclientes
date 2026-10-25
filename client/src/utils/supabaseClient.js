import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://svgsvikpkwicrnclbvmy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sFyCdytn85hoDMDWCuDjTA_cNx0-4Gn';

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

    let { data: cuentasData, error: errCuentas } = await queryCuentas;
    if (errCuentas && String(errCuentas.message || '').includes('distribuidor_codigo')) {
      const fallback = await supabase.from('cuentas_streaming').select('*').order('id', { ascending: false });
      cuentasData = fallback.data;
      errCuentas = fallback.error;
    }
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

    let { data: clientesData, error: errClientes } = await queryClientes;
    if (errClientes && String(errClientes.message || '').includes('distribuidor_codigo')) {
      const fallback = await supabase.from('clientes').select('*').order('id', { ascending: false });
      clientesData = fallback.data;
      errClientes = fallback.error;
    }
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
    let cuentaPayload = {
      plataforma: nuevaCuenta.plataforma,
      correo: nuevaCuenta.correo,
      password: nuevaCuenta.password,
      fecha_corte_cuenta: nuevaCuenta.fechaCorte,
      costo_cuenta: nuevaCuenta.costo || 0,
      cantidad_perfiles: nuevaCuenta.cantidadPerfiles || 5,
      proveedor: nuevaCuenta.proveedor || null,
      notas: nuevaCuenta.notas || null,
      distribuidor_codigo: distribuidorCodigo || 'DIST-2026'
    };

    let { data: cuentaCreada, error: errCta } = await supabase
      .from('cuentas_streaming')
      .insert(cuentaPayload)
      .select()
      .single();

    if (errCta && String(errCta.message || '').includes('distribuidor_codigo')) {
      delete cuentaPayload.distribuidor_codigo;
      const retry = await supabase.from('cuentas_streaming').insert(cuentaPayload).select().single();
      cuentaCreada = retry.data;
      errCta = retry.error;
    }

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
    const cuentaIdNum = nuevoCliente.cuentaId != null ? parseInt(nuevoCliente.cuentaId, 10) : null;
    const perfilIdNum = nuevoCliente.perfilId != null ? parseInt(nuevoCliente.perfilId, 10) : null;

    const payload = {
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
    };

    // 1. Insertar el cliente con reintentos inteligentes (distribuidor_codigo y secuencias)
    let clienteCreado = null;
    let currentPayload = { ...payload };

    let { data: resData, error: errCli } = await supabase
      .from('clientes')
      .insert(currentPayload)
      .select()
      .single();

    // Reintento A: si la columna distribuidor_codigo no existe en el schema cache de Supabase
    if (errCli && String(errCli.message || '').includes('distribuidor_codigo')) {
      console.warn('Aviso: Columna distribuidor_codigo no encontrada en Supabase. Reintentando sin la columna...');
      delete currentPayload.distribuidor_codigo;
      const resSinDist = await supabase
        .from('clientes')
        .insert(currentPayload)
        .select()
        .single();
      resData = resSinDist.data;
      errCli = resSinDist.error;
    }

    // Reintento B: si la secuencia de PostgreSQL (clientes_id_seq) está desfasada (código 23505 - clave primaria duplicada)
    if (errCli && (errCli.code === '23505' || String(errCli.message || '').toLowerCase().includes('clientes_pkey'))) {
      console.warn('Secuencia clientes_id_seq desfasada en Supabase. Auto-recuperando con MAX(id) + 1...');
      const { data: maxRows } = await supabase
        .from('clientes')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      const nextId = (maxRows && maxRows.length > 0 && Number.isInteger(maxRows[0].id))
        ? maxRows[0].id + 1
        : 100;

      let resRetry = await supabase
        .from('clientes')
        .insert({ ...currentPayload, id: nextId })
        .select()
        .single();

      if (resRetry.error && String(resRetry.error.message || '').includes('distribuidor_codigo')) {
        delete currentPayload.distribuidor_codigo;
        resRetry = await supabase
          .from('clientes')
          .insert({ ...currentPayload, id: nextId })
          .select()
          .single();
      }

      if (resRetry.error) {
        throw resRetry.error;
      }
      clienteCreado = resRetry.data;
    } else if (errCli) {
      throw errCli;
    } else {
      clienteCreado = resData;
    }

    if (!clienteCreado) {
      throw new Error('No se recibió la confirmación del cliente creado en Supabase');
    }

    // 2. Marcar el perfil como 'asignado' y vincular el cliente
    if (perfilIdNum && !isNaN(perfilIdNum)) {
      const { error: errPrf } = await supabase
        .from('perfiles')
        .update({
          estado: 'asignado',
          cliente_id: clienteCreado.id,
          pin: nuevoCliente.pin || ''
        })
        .eq('id', perfilIdNum);

      if (errPrf) {
        console.warn('Aviso: Perfil no pudo actualizarse en Supabase:', errPrf.message);
      }
    }

    return {
      ...nuevoCliente,
      id: clienteCreado.id,
      cuentaId: clienteCreado.cuenta_id != null ? clienteCreado.cuenta_id : nuevoCliente.cuentaId,
      perfilId: clienteCreado.perfil_id != null ? clienteCreado.perfil_id : nuevoCliente.perfilId,
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
    const cuentaIdNum = clienteActualizado.cuentaId != null ? parseInt(clienteActualizado.cuentaId, 10) : null;
    const perfilIdNum = clienteActualizado.perfilId != null ? parseInt(clienteActualizado.perfilId, 10) : null;
    const perfilAnteriorIdNum = perfilAnteriorId != null ? parseInt(perfilAnteriorId, 10) : null;

    const { error: errCli } = await supabase
      .from('clientes')
      .update({
        nombre: clienteActualizado.nombre,
        codigo_pais: codigoPaisLimpio,
        celular: celularLimpio,
        celular_completo: celularCompleto,
        cuenta_id: isNaN(cuentaIdNum) ? null : cuentaIdNum,
        perfil_id: isNaN(perfilIdNum) ? null : perfilIdNum,
        pin: clienteActualizado.pin || '',
        fecha_inicio: clienteActualizado.fechaInicio,
        fecha_vencimiento: clienteActualizado.fechaVencimiento,
        precio_cobrado: Number(clienteActualizado.precioCobrado) || 0,
        notas: clienteActualizado.notas || null
      })
      .eq('id', clienteActualizado.id);

    if (errCli) throw errCli;

    // Manejo de perfiles: liberar perfil anterior si cambió
    if (perfilAnteriorIdNum && !isNaN(perfilAnteriorIdNum) && perfilAnteriorIdNum !== perfilIdNum) {
      await supabase
        .from('perfiles')
        .update({ estado: 'disponible', cliente_id: null })
        .eq('id', perfilAnteriorIdNum);
    }

    // Asignar el nuevo perfil (marcarlo como asignado y asociar cliente_id)
    if (perfilIdNum && !isNaN(perfilIdNum)) {
      await supabase
        .from('perfiles')
        .update({
          estado: 'asignado',
          cliente_id: clienteActualizado.id,
          pin: clienteActualizado.pin || ''
        })
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
