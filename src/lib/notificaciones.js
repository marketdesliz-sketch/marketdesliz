// src/lib/notificaciones.js
import pb from './pocketbase';

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
const TELEGRAM_CONFIGURADO = !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);

/**
 * Envía notificación al administrador por Telegram
 */
export const notificarAdmin = async (mensaje, tipo = 'info') => {
  if (!TELEGRAM_CONFIGURADO) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 [DEV] Telegram:', mensaje);
    }
    return false;
  }
  
  const emojis = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    pago: '💰',
    orden: '📋',
    visita: '🏠',
    entrega: '🚚',
    cliente: '👤',
    producto: '📦',
    tanda: '🎯',
    kyc: '🔐',
    nivel: '⭐',
    cobro: '💵'
  };
  
  const texto = `${emojis[tipo] || emojis.info} ${mensaje}`;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    
    if (response.ok) {
      console.log('✅ Notificación enviada a Telegram');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Telegram error:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error enviando a Telegram:', error);
    return false;
  }
};

/**
 * Prueba de conexión con Telegram
 */
export const testTelegramConnection = async () => {
  if (!TELEGRAM_CONFIGURADO) {
    console.error('❌ Telegram no configurado');
    return false;
  }
  return await notificarAdmin('🔧 Notificación de prueba - Conexión exitosa', 'success');
};

/**
 * Formatea moneda mexicana
 */
export const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Formatea teléfono mexicano (10 dígitos)
 * Formato: 55 1234 5678
 */
export const formatTelefono = (telefono) => {
  if (!telefono) return '';
  const limpio = telefono.replace(/\D/g, '');
  if (limpio.length === 10) {
    return `${limpio.substring(0, 3)} ${limpio.substring(3, 7)} ${limpio.substring(7, 10)}`;
  }
  return telefono;
};

/**
 * Genera enlace de WhatsApp
 */
export const notificarClienteWhatsApp = (telefono, mensaje) => {
  if (!telefono) return '#';
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  const telefonoConCodigo = telefonoLimpio.startsWith('52') ? telefonoLimpio : `52${telefonoLimpio}`;
  return `https://wa.me/${telefonoConCodigo}?text=${encodeURIComponent(mensaje)}`;
};

/**
 * Genera folio de orden
 */
export const generarFolio = (orderId) => {
  if (!orderId) return `MDZ-${Date.now().toString().slice(-8)}`;
  return `MDZ-${orderId.substring(0, 8).toUpperCase()}`;
};

/**
 * Genera folio de KYC
 */
export const generarFolioKYC = (kycId) => {
  if (!kycId) return `KYC-${Date.now().toString().slice(-8)}`;
  return `KYC-${kycId.substring(0, 8).toUpperCase()}`;
};

/**
 * Notificar nueva orden
 */
export const notificarNuevaOrden = async (orderData) => {
  const mensaje = 
    `🆕 <b>NUEVA ORDEN</b>\n\n` +
    `👤 Cliente: ${orderData.clienteNombre || 'N/A'}\n` +
    `📞 Teléfono: ${formatTelefono(orderData.clienteTelefono)}\n` +
    `📦 Producto: ${orderData.productoNombre || 'N/A'}\n` +
    `💰 Total: ${formatMoney(orderData.total)}\n` +
    `📋 Tipo: ${orderData.tipo === 'contado' ? 'Contado' : orderData.tipo === 'credito' ? 'Crédito' : orderData.tipo}\n` +
    `🆔 Folio: ${generarFolio(orderData.orderId)}`;
  
  return await notificarAdmin(mensaje, 'orden');
};

/**
 * Notificar nuevo pago
 */
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

/**
 * Notificar nueva solicitud KYC
 */
export const notificarNuevaKYC = async (kycData) => {
  const mensaje = 
    `🔐 <b>NUEVA SOLICITUD KYC</b>\n\n` +
    `👤 Cliente: ${kycData.clienteNombre || 'N/A'}\n` +
    `📞 Teléfono: ${formatTelefono(kycData.clienteTelefono)}\n` +
    `🆔 Folio: ${generarFolioKYC(kycData.kycId)}`;
  
  return await notificarAdmin(mensaje, 'kyc');
};

/**
 * Notificar nueva solicitud de vendedor
 */
export const notificarSolicitudVendedor = async (solicitudData) => {
  const mensaje = 
    `📋 <b>SOLICITUD VALIDADA POR VENDEDOR</b>\n\n` +
    `👤 Cliente: ${solicitudData.clienteNombre || 'N/A'}\n` +
    `📦 Producto: ${solicitudData.productoNombre || 'N/A'}\n` +
    `💰 Enganche: ${formatMoney(solicitudData.enganche)}\n` +
    `👔 Vendedor: ${solicitudData.vendedorNombre || 'N/A'}`;
  
  return await notificarAdmin(mensaje, 'orden');
};

/**
 * Notificar cambio de nivel de cliente
 */
export const notificarCambioNivel = async (nivelData) => {
  const mensaje = 
    `⭐ <b>CAMBIO DE NIVEL</b>\n\n` +
    `👤 Cliente: ${nivelData.clienteNombre || 'N/A'}\n` +
    `🏆 Nuevo nivel: ${nivelData.nuevoNivel} - ${nivelData.nombreNivel}\n` +
    `🎯 Tanda disponible: ${formatMoney(nivelData.tandaDisponible)}`;
  
  return await notificarAdmin(mensaje, 'nivel');
};

/**
 * Verificar si Telegram está configurado
 */
export const isTelegramConfigurado = () => TELEGRAM_CONFIGURADO;

// src/lib/notificaciones.js - Agregar al final del archivo

/**
 * Obtener notificaciones de un negocio desde PocketBase
 */
export async function getNotificacionesNegocio(negocioId) {
  try {
    if (!pb) {
      console.error('❌ PocketBase no está disponible');
      return [];
    }
    
    const notifications = await pb.collection('notificaciones').getFullList({
      filter: `entidadId = "${negocioId}" && entidadTipo = "negocio"`,
      sort: '-created',
      limit: 50
    });
    return notifications;
  } catch (error) {
    console.error('Error obteniendo notificaciones de negocio:', error);
    return [];
  }
}

// Agregar estas funciones al final de src/lib/notificaciones.js

/**
 * Marcar notificación como leída
 */
export async function marcarNotificacionLeida(notificacionId) {
  try {
    if (!pb) {
      console.error('❌ PocketBase no está disponible');
      return { success: false };
    }
    
    await pb.collection('notificaciones').update(notificacionId, {
      leida: true,
      leidaEn: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return { success: false };
  }
}

/**
 * Crear notificación para un negocio
 */
export async function crearNotificacionNegocio(data) {
  try {
    if (!pb) {
      console.error('❌ PocketBase no está disponible');
      return { success: false };
    }
    
    const notificacion = await pb.collection('notificaciones').create({
      ...data,
      tipoUsuario: 'negocio',
      leida: false,
      created: new Date().toISOString()
    });
    return { success: true, data: notificacion };
  } catch (error) {
    console.error('Error creando notificación:', error);
    return { success: false };
  }
}

/**
 * Obtener notificaciones no leídas de un negocio
 */
export async function getNotificacionesNoLeidas(negocioId) {
  try {
    if (!pb) {
      console.error('❌ PocketBase no está disponible');
      return [];
    }
    
    const notifications = await pb.collection('notificaciones').getFullList({
      filter: `entidadId = "${negocioId}" && entidadTipo = "negocio" && leida = false`,
      sort: '-created'
    });
    return notifications;
  } catch (error) {
    console.error('Error obteniendo notificaciones no leídas:', error);
    return [];
  }
}