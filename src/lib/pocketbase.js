// src/lib/pocketbase.js
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Claves de localStorage separadas
const USER_STORAGE_KEY = 'pb_user_auth';
const ADMIN_STORAGE_KEY = 'pb_admin_auth';

// ============================================================
// 1. DEFINIR LA CLASE CustomAuthStore (CORREGIDA)
// ============================================================
class CustomAuthStore {
  constructor() {
    this.token = null;
    this.model = null;
    this.role = null;
    this.onChangeCallbacks = [];

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === USER_STORAGE_KEY || event.key === ADMIN_STORAGE_KEY) {
          this.loadFromStorage();
          this.triggerChange();
        }
      });
    }
  }

  get isValid() {
    return !!this.token && !!this.model;
  }

  get isAdminSession() {
    return this.role === 'admin';
  }

  // ✅ SOLO carga sesión de usuario normal (NUNCA admin como fallback)
  loadFromStorage() {
    if (typeof window === 'undefined') return;

    const userStored = localStorage.getItem(USER_STORAGE_KEY);
    if (userStored) {
      try {
        const { token, model } = JSON.parse(userStored);
        if (token && model && model.role !== 'admin') {
          this.token = token;
          this.model = model;
          this.role = model.role;
          return;
        }
      } catch (e) {
        console.warn('Error parsing user session:', e);
      }
    }

    this.clear();
  }

  // ✅ Carga la sesión de admin (SOLO para rutas de admin)
  loadAdminFromStorage() {
    if (typeof window === 'undefined') return false;
    
    const adminStored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (adminStored) {
      try {
        const { token, model } = JSON.parse(adminStored);
        if (token && model && model.role === 'admin') {
          this.token = token;
          this.model = model;
          this.role = model.role;
          return true;
        }
      } catch (e) {
        console.warn('Error parsing admin session:', e);
      }
    }
    return false;
  }

  // ✅ Guarda la sesión en la clave correcta según el rol
  save(token, model) {
    const role = model?.role;
    const isAdmin = role === 'admin';
    const key = isAdmin ? ADMIN_STORAGE_KEY : USER_STORAGE_KEY;

    if (token && model) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify({ token, model }));
      }
      this.token = token;
      this.model = model;
      this.role = role;
    } else {
      this.clear();
    }
    this.triggerChange();
  }

  // ✅ Limpia SOLO la sesión actual (no todas)
  clear() {
    if (this.role === 'admin') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    
    this.token = null;
    this.model = null;
    this.role = null;
    this.triggerChange();
  }

  // ✅ Limpia TODAS las sesiones (logout completo)
  clearAll() {
    this.token = null;
    this.model = null;
    this.role = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    this.triggerChange();
  }

  onChange(callback) {
    this.onChangeCallbacks.push(callback);
    return () => {
      this.onChangeCallbacks = this.onChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  triggerChange() {
    this.onChangeCallbacks.forEach(cb => cb(this));
  }
}

// ============================================================
// 2. CREAR INSTANCIA DE POCKETBASE
// ============================================================
const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

// ============================================================
// 3. ASIGNAR EL STORE PERSONALIZADO
// ============================================================
pb.authStore = new CustomAuthStore();

// ============================================================
// 4. CARGAR SESIÓN SOLO EN EL CLIENTE
// ============================================================
if (typeof window !== 'undefined') {
  pb.authStore.loadFromStorage();
}

// ============================================================
// 5. FUNCIONES DE AUTENTICACIÓN (CORREGIDAS)
// ============================================================

/**
 * Login de usuario normal (clientes, vendedores)
 * Guarda la sesión en USER_STORAGE_KEY
 */
export const loginUsuario = async (email, password) => {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    if (authData.record.role === 'admin') {
      throw new Error('No puedes iniciar sesión como administrador aquí');
    }
    
    pb.authStore.save(authData.token, authData.record);
    return { success: true, data: authData };
  } catch (error) {
    console.error('Error login:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Login de admin - CORREGIDO
 * Usa el endpoint especial de administradores de PocketBase
 * Guarda la sesión en ADMIN_STORAGE_KEY
 */
export const loginAdmin = async (email, password) => {
  try {
    // ✅ Usar pb.admins en lugar de pb.collection('_admins')
    const authData = await pb.admins.authWithPassword(email, password);
    
    // ✅ Crear modelo de admin con los datos correctos
    const adminModel = {
      id: authData.record.id,
      email: authData.record.email,
      role: 'admin',
      nombre: authData.record.name || authData.record.email?.split('@')[0] || 'Administrador'
    };
    
    pb.authStore.save(authData.token, adminModel);
    return { success: true, data: authData };
  } catch (error) {
    console.error('Error login admin:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener usuario actual (cliente/vendedor) - SOLO si no es admin
 */
export const getCurrentUser = () => {
  if (!pb.authStore.isValid) return null;
  if (pb.authStore.role === 'admin') return null;
  return pb.authStore.model;
};

/**
 * Obtener admin actual (si existe sesión de admin)
 */
export const getCurrentAdmin = () => {
  if (!pb.authStore.isValid) return null;
  if (pb.authStore.role !== 'admin') return null;
  return pb.authStore.model;
};

/**
 * Verificar si hay sesión de usuario normal activa
 */
export const isAuthenticated = () => {
  return pb.authStore.isValid && pb.authStore.role !== 'admin';
};

/**
 * Verificar si es admin
 */
export const isAdmin = () => {
  return pb.authStore.isValid && pb.authStore.role === 'admin';
};

/**
 * Verificar si es vendedor
 */
export const isVendedor = () => {
  const user = pb.authStore.model;
  return pb.authStore.isValid && user?.role === 'vendedor' && pb.authStore.role !== 'admin';
};

/**
 * Verificar si es cliente
 */
export const isCliente = () => {
  const user = pb.authStore.model;
  return pb.authStore.isValid && user?.role === 'cliente' && pb.authStore.role !== 'admin';
};

/**
 * Cerrar sesión (limpia TODO)
 */
export const logout = () => {
  pb.authStore.clearAll();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vendedorData');
    localStorage.removeItem('carrito');
    sessionStorage.removeItem('comprobanteId');
    sessionStorage.removeItem('vendedorAsignadoId');
    sessionStorage.removeItem('vendedorAsignadoNombre');
  }
};

/**
 * Obtener el token actual (para depuración o llamadas API)
 */
export const getToken = () => {
  return pb.authStore.token;
};

// ============================================================
// 6. FUNCIONES DE UTILIDAD
// ============================================================

/**
 * Obtener URL de archivo
 */
export const getFileUrl = (record, filename) => {
  if (!filename) return null;
  try {
    return pb.files.getURL(record, filename);
  } catch (error) {
    console.error('Error obteniendo URL de archivo:', error);
    return null;
  }
};

/**
 * Obtener URL de imagen de producto
 */
export const getProductImageUrl = (product) => {
  if (!product?.imagen) return null;
  return getFileUrl(product, product.imagen);
};

/**
 * Obtener nombre del rol en español
 */
export const getRoleName = (role) => {
  const roles = {
    'admin': 'Administrador',
    'vendedor': 'Vendedor',
    'cliente': 'Cliente'
  };
  return roles[role] || role || 'Desconocido';
};

/**
 * Verificar si el usuario tiene uno de los roles permitidos
 */
export const hasRole = (...roles) => {
  const user = pb.authStore.model;
  return pb.authStore.isValid && roles.includes(user?.role) && pb.authStore.role !== 'admin';
};

export default pb;
