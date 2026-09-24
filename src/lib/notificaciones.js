// src/lib/notificaciones.js
import pb from './pocketbase';

// ═════════════════════════════════════════════════════════════════════════
// TELEGRAM · vía API route server-side (token seguro)
// ═════════════════════════════════════════════════════════════════════════
export const notificarAdmin = async (mensaje, tipo = 'info') => {
  try {
    const res = await fetch('/api/notificar-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, tipo }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (error) {
    console.error('❌ Error notificando al admin:', error);
    return false;
  }
};

export const testTelegramConnection = async () => {
  return await notificarAdmin(
    '🔧 Notificación de prueba — conexión exitosa',
    'success'
  );
};

// ═════════════════════════════════════════════════════════════════════════
// UTILIDADES · puras, sin red
// ═════════════════════════════════════════════════════════════════════════

export const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatTelefono = (telefono) => {
  if (!telefono) return '';
  const limpio = telefono.replace(/\D/g, '');
  if (limpio.length === 10) {
    return `${limpio.substring(0, 3)} ${limpio.substring(3, 7)} ${limpio.substring(7, 10)}`;
  }
  return telefono;
};

export const notificarClienteWhatsApp = (telefono, mensaje) => {
  if (!telefono) return '#';
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  const telefonoConCodigo = telefonoLimpio.startsWith('52')
    ? telefonoLimpio
    : `52${telefonoLimpio}`;
  return `https://wa.me/${telefonoConCodigo}?text=${encodeURIComponent(mensaje)}`;
};

export const generarFolio = (orderId) => {
  if (!orderId) return `MDZ-${Date.now().toString().slice(-8)}`;
  return `MDZ-${orderId.substring(0, 8).toUpperCase()}`;
};

export const generarFolioKYC = (kycId) => {
  if (!kycId) return `KYC-${Date.now().toString().slice(-8)}`;
  return `KYC-${kycId.substring(0, 8).toUpperCase()}`;
};

// ═════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES AL ADMIN · helpers temáticos
// ═════════════════════════════════════════════════════════════════════════

export const notificarNuevaOrden = async (orderData) => {
  const mensaje =
    `🆕 <b>NUEVA ORDEN</b>\n\n` +
    `👤 Cliente: ${orderData.clienteNombre || 'N/A'}\n` +
    `📞 Teléfono: ${formatTelefono(orderData.clienteTelefono)}\n` +
    `📦 Producto: ${orderData.productoNombre || 'N/A'}\n` +
    `💰 Total: ${formatMoney(orderData.total)}\n` +
    `📋 Tipo: ${
      orderData.tipo === 'contado'
        ? 'Contado'
        : orderData.tipo === 'credito'
        ? 'Crédito'
        : orderData.tipo
    }\n` +
    `🆔 Folio: ${generarFolio(orderData.orderId)}`;

  return await notificarAdmin(mensaje, 'orden');
};

export const notificarNuevoPago = async (paymentData) => {
  const mensaje =
    `💰 <b>NUEVO PAGO</b>\n\n` +
    `👤 Cliente: ${paymentData.clienteNombre || 'N/A'}\n` +
    `📞 Teléfono: ${formatTelefono(paymentData.clienteTelefono)}\n` +
    `💵 Monto: ${formatMoney(paymentData.monto)}\n` +
    `📋 Método: ${paymentData.metodo || 'QR'}\n` +
    `🆔 Folio: ${generarFolio(paymentData.orderId)}`;

  return await notificarAdmin(mensaje, 'pago');
};

export const notificarNuevaKYC = async (kycData) => {
  const mensaje =
    `🔐 <b>NUEVA SOLICITUD KYC</b>\n\n` +
    `👤 Cliente: ${kycData.clienteNombre || 'N/A'}\n` +
    `📞 Teléfono: ${formatTelefono(kycData.clienteTelefono)}\n` +
    `🆔 Folio: ${generarFolioKYC(kycData.kycId)}`;

  return await notificarAdmin(mensaje, 'kyc');
};

export const notificarSolicitudVendedor = async (solicitudData) => {
  const mensaje =
    `📋 <b>SOLICITUD VALIDADA POR VENDEDOR</b>\n\n` +
    `👤 Cliente: ${solicitudData.clienteNombre || 'N/A'}\n` +
    `📦 Producto: ${solicitudData.productoNombre || 'N/A'}\n` +
    `💰 Enganche: ${formatMoney(solicitudData.enganche)}\n` +
    `👔 Vendedor: ${solicitudData.vendedorNombre || 'N/A'}`;

  return await notificarAdmin(mensaje, 'orden');
};

export const notificarCambioNivel = async (nivelData) => {
  const mensaje =
    `⭐ <b>CAMBIO DE NIVEL</b>\n\n` +
    `👤 Cliente: ${nivelData.clienteNombre || 'N/A'}\n` +
    `🏆 Nuevo nivel: ${nivelData.nuevoNivel} — ${nivelData.nombreNivel}\n` +
    `🎯 Tanda disponible: ${formatMoney(nivelData.tandaDisponible)}`;

  return await notificarAdmin(mensaje, 'nivel');
};

// ═════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES · PocketBase (colección `notificaciones`)
// Modelo: cada notificación pertenece a un usuarioId
// ═════════════════════════════════════════════════════════════════════════

/**
 * Obtener todas las notificaciones de un usuario
 * @param {string} usuarioId - ID del usuario (users.id)
 * @param {number} limit - máx. de registros (default 50)
 */
export async function getNotificaciones(usuarioId, limit = 50) {
  if (!pb || !usuarioId) return [];
  try {
    return await pb.collection('notificaciones').getFullList({
      filter: `usuarioId = "${usuarioId}"`,
      sort: '-created',
      limit,
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

/**
 * Obtener solo las no leídas de un usuario
 */
export async function getNotificacionesNoLeidas(usuarioId) {
  if (!pb || !usuarioId) return [];
  try {
    return await pb.collection('notificaciones').getFullList({
      filter: `usuarioId = "${usuarioId}" && leida = false`,
      sort: '-created',
    });
  } catch (error) {
    console.error('Error obteniendo no leídas:', error);
    return [];
  }
}

/**
 * Contar no leídas (usa el índice de PB, no trae registros)
 */
export async function countNotificacionesNoLeidas(usuarioId) {
  if (!pb || !usuarioId) return 0;
  try {
    const result = await pb.collection('notificaciones').getList(1, 1, {
      filter: `usuarioId = "${usuarioId}" && leida = false`,
      fields: 'id',
    });
    return result.totalItems;
  } catch (error) {
    console.error('Error contando no leídas:', error);
    return 0;
  }
}

/**
 * Marcar una notificación como leída
 */
export async function marcarNotificacionLeida(notificacionId) {
  if (!pb || !notificacionId) return { success: false };
  try {
    await pb.collection('notificaciones').update(notificacionId, {
      leida: true,
      leidaEn: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error marcando como leída:', error);
    return { success: false };
  }
}

/**
 * Marcar todas las notificaciones de un usuario como leídas
 */
export async function marcarTodasLeidas(usuarioId) {
  if (!pb || !usuarioId) return { success: false, count: 0 };
  try {
    const noLeidas = await pb.collection('notificaciones').getFullList({
      filter: `usuarioId = "${usuarioId}" && leida = false`,
      fields: 'id',
    });

    await Promise.all(
      noLeidas.map((n) =>
        pb.collection('notificaciones').update(n.id, {
          leida: true,
          leidaEn: new Date().toISOString(),
        })
      )
    );

    return { success: true, count: noLeidas.length };
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Crear una notificación
 * @param {Object} data
 * @param {string} data.usuarioId - requerido
 * @param {string} data.titulo - requerido
 * @param {string} data.mensaje - requerido
 * @param {string} [data.tipoUsuario] - cliente|vendedor|negocio|admin
 * @param {string} [data.tipo] - nivel_up|tanda_disponible|...
 * @param {string} [data.entidadId]
 * @param {string} [data.entidadTipo]
 * @param {Object} [data.datos]
 */
export async function crearNotificacion(data) {
  if (!pb) return { success: false, error: 'PocketBase no disponible' };

  const { usuarioId, titulo, mensaje } = data || {};
  if (!usuarioId || !titulo || !mensaje) {
    return {
      success: false,
      error: 'usuarioId, titulo y mensaje son requeridos',
    };
  }

  try {
    const notificacion = await pb.collection('notificaciones').create({
      usuarioId,
      titulo,
      mensaje,
      tipoUsuario: data.tipoUsuario || 'cliente',
      tipo: data.tipo || 'sistema',
      entidadId: data.entidadId || null,
      entidadTipo: data.entidadTipo || null,
      datos: data.datos || null,
      leida: false,
    });
    return { success: true, data: notificacion };
  } catch (error) {
    console.error('Error creando notificación:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una notificación (solo admin según rules, pero por si acaso)
 */
export async function eliminarNotificacion(notificacionId) {
  if (!pb || !notificacionId) return { success: false };
  try {
    await pb.collection('notificaciones').delete(notificacionId);
    return { success: true };
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    return { success: false };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// ALIAS DE COMPATIBILIDAD
// Mantengo los nombres viejos apuntando a los nuevos para no romper imports
// (ej. getNotificacionesNegocio → getNotificaciones)
// ═════════════════════════════════════════════════════════════════════════

/** @deprecated usar getNotificaciones(usuarioId) */
export async function getNotificacionesNegocio(usuarioId) {
  return getNotificaciones(usuarioId);
}

/** @deprecated usar crearNotificacion(data) */
export async function crearNotificacionNegocio(data) {
  return crearNotificacion({ ...data, tipoUsuario: 'negocio' });
}

export const isTelegramConfigurado = () =>
  // Ya no podemos saberlo desde el cliente (el token es server-side).
  // Se mantiene la firma por compatibilidad, siempre devuelve true.
  true;