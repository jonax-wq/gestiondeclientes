// Utilidades de Autenticación y Control de Acceso Maestro
// Sistema de seguridad con Código Único de Distribuidor (DIST-XXXX) y Clave Maestra
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY_MASTER_PASS = 'flowstream_admin_master_key';
const STORAGE_KEY_AUTH_SESSION = 'flowstream_admin_authenticated';
const STORAGE_KEY_AUTH_REMEMBER = 'flowstream_admin_authenticated_remember';
const STORAGE_KEY_CURRENT_DISTRIBUTOR = 'flowstream_current_distributor';

export const DEFAULT_MASTER_KEY = 'DIST-2026';

/**
 * Genera un código único aleatorio en formato DIST-XXXX (ej: DIST-7842).
 */
export function generateRandomDistCode() {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DIST-${code}`;
}

/**
 * Normaliza y formatea un código ingresado al estándar DIST-XXXX en mayúsculas.
 */
export function formatDistCode(input = '') {
  if (!input) return '';
  let clean = input.trim().toUpperCase().replace(/\s+/g, '');
  if (clean.startsWith('DIST-')) {
    return clean;
  }
  if (clean.startsWith('DIST')) {
    const rest = clean.slice(4).replace(/^[-_]*/, '');
    return `DIST-${rest}`;
  }
  // Si ingresó sólo la parte variable alfanumérica (3 a 6 caracteres)
  if (/^[A-Z0-9]{3,8}$/.test(clean)) {
    return `DIST-${clean}`;
  }
  return clean;
}

/**
 * Obtiene el código único / contraseña maestra configurada actualmente.
 * Si no se ha configurado ninguna, devuelve la clave por defecto 'DIST-2026'.
 */
export function getMasterPassword() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MASTER_PASS);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
  } catch (e) {
    console.error('Error al leer código maestro:', e);
  }
  return DEFAULT_MASTER_KEY;
}

/**
 * Guarda un nuevo código único de distribuidor en el almacenamiento local.
 */
export function setMasterPassword(newPassword) {
  try {
    localStorage.setItem(STORAGE_KEY_MASTER_PASS, newPassword.trim());
    return true;
  } catch (e) {
    console.error('Error al guardar código maestro:', e);
    return false;
  }
}

/**
 * Obtiene los datos del distribuidor activo en sesión
 */
export function getCurrentDistributor() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_CURRENT_DISTRIBUTOR) || 
                  localStorage.getItem(STORAGE_KEY_CURRENT_DISTRIBUTOR);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error al leer distribuidor activo:', e);
  }
  return {
    codigo_distribuidor: DEFAULT_MASTER_KEY,
    nombre: 'Administrador Principal (Master)',
    es_superadmin: true,
    estado: 'activo'
  };
}

/**
 * Guarda el distribuidor en sesión
 */
export function setCurrentDistributor(distributor, rememberMe = true) {
  try {
    const json = JSON.stringify(distributor);
    sessionStorage.setItem(STORAGE_KEY_CURRENT_DISTRIBUTOR, json);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_CURRENT_DISTRIBUTOR, json);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_DISTRIBUTOR);
    }
    return true;
  } catch (e) {
    console.error('Error al guardar distribuidor en sesión:', e);
    return false;
  }
}

/**
 * Borra la sesión del distribuidor
 */
export function clearDistributorSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY_CURRENT_DISTRIBUTOR);
    localStorage.removeItem(STORAGE_KEY_CURRENT_DISTRIBUTOR);
  } catch (e) {
    console.error('Error al limpiar sesión:', e);
  }
}

/**
 * Valida un código de distribuidor contra Supabase si está disponible.
 * Verifica estado (activo/suspendido) y fecha de expiración.
 */
export async function validarDistribuidorEnSupabase(rawCode) {
  if (!rawCode) return { success: false, error: 'Ingresa un código de distribuidor.' };
  
  const formatted = formatDistCode(rawCode);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('distribuidores')
        .select('*')
        .ilike('codigo_distribuidor', formatted)
        .maybeSingle();

      if (error) {
        console.warn('Error consultando tabla distribuidores:', error.message);
      } else if (data) {
        // 1. Revisar estado
        if (data.estado === 'suspendido') {
          return {
            success: false,
            error: `El código ${data.codigo_distribuidor} está suspendido. Comunícate con el administrador.`
          };
        }

        // 2. Revisar fecha de expiración (si no es null)
        if (data.fecha_expiracion) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const exp = new Date(data.fecha_expiracion + 'T00:00:00');
          exp.setHours(0, 0, 0, 0);

          if (exp < hoy) {
            return {
              success: false,
              error: `La membresía de este código venció el ${data.fecha_expiracion}. Renueva tu acceso con el administrador.`
            };
          }
        }

        // Válido
        return {
          success: true,
          distributor: data
        };
      }
    } catch (err) {
      console.warn('Error conectando con Supabase para validar distribuidor:', err);
    }
  }

  // Fallback: Si no está en Supabase o es offline, validar contra clave local o DIST-2026
  if (verifyMasterPassword(rawCode)) {
    const isMaster = formatted === DEFAULT_MASTER_KEY || rawCode.toUpperCase() === 'ADMIN2026';
    return {
      success: true,
      distributor: {
        codigo_distribuidor: formatted || DEFAULT_MASTER_KEY,
        nombre: isMaster ? 'Administrador Principal (Master)' : `Distribuidor ${formatted}`,
        es_superadmin: isMaster,
        estado: 'activo'
      }
    };
  }

  return {
    success: false,
    error: 'Código de distribuidor incorrecto o no registrado.'
  };
}

/**
 * Verifica si un código ingresado coincide con el código maestro local.
 */
export function verifyMasterPassword(inputPassword) {
  if (!inputPassword) return false;
  const current = getMasterPassword().trim().toUpperCase();
  const input = inputPassword.trim().toUpperCase().replace(/\s+/g, '');
  const formattedInput = formatDistCode(input);
  const formattedCurrent = formatDistCode(current);

  // 1. Coincidencia directa exacta o con formato normalizado
  if (input === current) return true;
  if (formattedInput === formattedCurrent) return true;

  // 2. Si el usuario ingresó solo los caracteres finales (ej: "2026" cuando la clave es "DIST-2026")
  if (current.startsWith('DIST-') && `DIST-${input}` === current) return true;

  // 3. Si la clave guardada no tenía prefijo y el usuario ingresa DIST-XXXX
  if (input.startsWith('DIST-') && input.replace('DIST-', '') === current) return true;

  // 4. Compatibilidad con la clave histórica por defecto
  if (input === 'ADMIN2026' || (current === 'ADMIN2026' && (input === 'DIST-2026' || formattedInput === 'DIST-2026'))) return true;

  return false;
}

/**
 * Verifica si el usuario actual tiene una sesión de administrador activa.
 */
export function isSessionAuthenticated() {
  try {
    const sessionAuth = sessionStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (sessionAuth === 'true') return true;

    const rememberAuth = localStorage.getItem(STORAGE_KEY_AUTH_REMEMBER);
    if (rememberAuth === 'true') return true;
  } catch (e) {
    console.error('Error al verificar sesión de administrador:', e);
  }
  return false;
}

/**
 * Inicia la sesión administrativa.
 */
export function authenticateAdmin(rememberMe = true, distributor = null) {
  try {
    sessionStorage.setItem(STORAGE_KEY_AUTH_SESSION, 'true');
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_AUTH_REMEMBER, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_REMEMBER);
    }
    if (distributor) {
      setCurrentDistributor(distributor, rememberMe);
    }
    return true;
  } catch (e) {
    console.error('Error al autenticar administrador:', e);
    return false;
  }
}

/**
 * Cierra la sesión de administrador y bloquea la interfaz de gestión.
 */
export function logoutAdmin() {
  try {
    sessionStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
    localStorage.removeItem(STORAGE_KEY_AUTH_REMEMBER);
    clearDistributorSession();
    return true;
  } catch (e) {
    console.error('Error al cerrar sesión de administrador:', e);
    return false;
  }
}

/**
 * Actualiza el código único de acceso tras verificar el código actual.
 */
export function changeMasterPassword(currentPass, newPass, confirmPass) {
  if (!verifyMasterPassword(currentPass)) {
    return { success: false, error: 'El código actual no es correcto.' };
  }
  if (!newPass || newPass.trim().length < 3) {
    return { success: false, error: 'El nuevo código debe tener al menos 4 caracteres (ej: DIST-XXXX).' };
  }
  
  const formattedNew = formatDistCode(newPass);
  const formattedConfirm = formatDistCode(confirmPass);

  if (formattedNew !== formattedConfirm) {
    return { success: false, error: 'La confirmación del nuevo código no coincide.' };
  }

  const saved = setMasterPassword(formattedNew);
  if (saved) {
    return { success: true, newCode: formattedNew };
  }
  return { success: false, error: 'No se pudo guardar el nuevo código en el almacenamiento.' };
}
