// src/lib/ordersService.js
import pb from "./pocketbase";
import { activarNegocio } from './negociosService';
import {
  createOrUpdatePaymentForOrder,
  registerDownPayment as registerDownPaymentService,
  getPaymentsByOrder
} from './paymentsService';

// ============================================================
// CONFIGURACIÓN
// ============================================================
const COLLECTIONS = {
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  SOLICITUDES: 'solicitudes',
  NOTIFICACIONES: 'notificaciones'
};

// ============================================================
// ACTIVAR NEGOCIO DEL USUARIO DESPUÉS DE PRIMERA COMPRA
// ============================================================
async function activarNegocioDelUsuario(userId) {
  try {
    const negocios = await pb.collection('negocios').getFullList({
      filter: `usuarioId = "${userId}" && estadoActivacion = "pendiente_activacion"`
    });

    if (negocios.length === 0) return;

    for (const negocio of negocios) {
      console.log(`🔄 Activando negocio ${negocio.id} (${negocio.nombre}) para usuario ${userId}`);
      await activarNegocio(negocio.id);
      await pb.collection('notificaciones').create({
        usuarioId: userId,
        tipoUsuario: 'negocio',
        tipo: 'sistema',
        titulo: '🎉 ¡Tu negocio ha sido activado!',
        mensaje: `Tu negocio ${negocio.nombre} ahora es visible para los clientes.`,
        entidadId: negocio.id,
        entidadTipo: 'negocio'
      }).catch(e => console.log('Notificación opcional no creada'));
    }
  } catch (error) {
    console.error('Error activando negocio después de compra:', error);
  }
}

// ============================================================
// OBTENER ÓRDENES
// ============================================================
export async function getOrders() {
  try {
    const orders = await pb.collection(COLLECTIONS.ORDERS).getFullList({
      expand: "userId,productId,vendedorId",
      sort: "-created"
    });
    return orders;
  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    return [];
  }
}

export async function getOrdersByClient(clientId) {
  try {
    const orders = await pb.collection(COLLECTIONS.ORDERS).getFullList({
      filter: `userId = "${clientId}"`,
      expand: "productId",
      sort: "-created"
    });
    return orders;
  } catch (error) {
    console.error("Error obteniendo órdenes del cliente:", error);
    return [];
  }
}

export async function getOrderById(id) {
  try {
    const order = await pb.collection(COLLECTIONS.ORDERS).getOne(id, {
      expand: "userId,productId,vendedorId,cobradorId,comprobanteId"
    });
    return order;
  } catch (error) {
    console.error("Error obteniendo orden:", error);
    return null;
  }
}

export async function getClientOrders(clientId) {
  return getOrdersByClient(clientId);
}

export async function getActiveClientOrders(clientId) {
  try {
    const orders = await pb.collection(COLLECTIONS.ORDERS).getFullList({
      filter: `userId = "${clientId}" && estadoPago = "activa"`,
      expand: "productId",
      sort: "-created"
    });
    return orders;
  } catch (error) {
    console.error("Error obteniendo órdenes activas:", error);
    return [];
  }
}

export async function getCompletedClientOrders(clientId) {
  try {
    const orders = await pb.collection(COLLECTIONS.ORDERS).getFullList({
      filter: `userId = "${clientId}" && estadoPago = "completada"`,
      expand: "productId",
      sort: "-created"
    });
    return orders;
  } catch (error) {
    console.error("Error obteniendo órdenes completadas:", error);
    return [];
  }
}

// ============================================================
// ACTUALIZAR ESTADO DE ORDEN
// ============================================================
export async function updateOrderStatus(orderId, nuevoEstadoPago, nuevoEstadoValidacion = null) {
  try {
    const updateData = { estadoPago: nuevoEstadoPago };
    if (nuevoEstadoValidacion) {
      updateData.estadoValidacion = nuevoEstadoValidacion;
    }
    if (nuevoEstadoPago === 'completada') {
      updateData.fechaCompletada = new Date().toISOString();
      const order = await pb.collection(COLLECTIONS.ORDERS).getOne(orderId);
      if (order && order.userId) {
        await activarNegocioDelUsuario(order.userId);
      }
    }
    return await pb.collection(COLLECTIONS.ORDERS).update(orderId, updateData);
  } catch (error) {
    console.error("Error actualizando orden:", error);
    throw error;
  }
}

// ============================================================
// CREAR ÓRDENES
// ============================================================
export async function createCashOrderSimple(orderData) {
  if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

  const precioContado = Math.round(orderData.productPrice * 2 / 3);
  const order = await pb.collection(COLLECTIONS.ORDERS).create({
    userId: orderData.clientId,
    productId: orderData.productId,
    vendedorId: orderData.vendedorId || null,
    comprobanteId: orderData.comprobanteId || null,
    tipo: 'contado',
    estadoPago: 'pendiente_pago',
    estadoValidacion: 'pendiente',
    precioOriginal: orderData.productPrice,
    totalPagar: precioContado,
    enganche: precioContado,
    enganchePagado: false,
    metodoPago: orderData.paymentMethod || 'qr_vendedor',
    created: new Date().toISOString()
  });

  if (orderData.vendedorId) {
    try {
      await pb.collection(COLLECTIONS.SOLICITUDES).create({
        clienteId: orderData.clientId,
        vendedorId: orderData.vendedorId,
        productoId: orderData.productId,
        tipo: 'contado',
        estado: 'pendiente_vendedor',
        productoNombre: orderData.productName,
        productoPrecio: orderData.productPrice,
        totalPagar: precioContado,
        fechaSolicitud: new Date().toISOString()
      });
    } catch (e) {
      console.warn('No se pudo crear solicitud para vendedor:', e.message);
    }
  }
  return order;
}

export async function createCreditOrderSimple(orderData) {
  if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

  const fechaPrimerPago = getNextPaymentDate(orderData.diaPago || 'lunes');
  const fechaProximoPago = new Date(fechaPrimerPago);
  fechaProximoPago.setDate(fechaProximoPago.getDate() + 7);

  const order = await pb.collection(COLLECTIONS.ORDERS).create({
    userId: orderData.clientId,
    productId: orderData.productId,
    vendedorId: orderData.vendedorId || null,
    comprobanteId: orderData.comprobanteId || null,
    tipo: 'credito',
    estadoPago: 'pendiente_pago',
    estadoValidacion: 'pendiente',
    precioOriginal: orderData.productPrice,
    enganche: orderData.downPayment,
    enganchePagado: false,
    pagoSemanal: orderData.weeklyAmount,
    semanasTotales: orderData.totalWeeks,
    totalPagar: orderData.totalPrice,
    saldoRestante: orderData.totalPrice,
    pagosRealizados: 0,
    frecuenciaPago: 'semanal',
    metodoPago: orderData.paymentMethod || 'qr_vendedor',
    fechaPrimerPago: fechaPrimerPago.toISOString(),
    fechaProximoPago: fechaProximoPago.toISOString(),
    created: new Date().toISOString()
  });

  // NO crear payments aquí (se crean en CheckoutForm)

  if (orderData.vendedorId) {
    try {
      await pb.collection(COLLECTIONS.SOLICITUDES).create({
        clienteId: orderData.clientId,
        vendedorId: orderData.vendedorId,
        productoId: orderData.productId,
        tipo: 'credito',
        estado: 'pendiente_vendedor',
        productoNombre: orderData.productName,
        productoPrecio: orderData.productPrice,
        enganche: orderData.downPayment,
        pagoSemanal: orderData.weeklyAmount,
        semanasTotales: orderData.totalWeeks,
        totalPagar: orderData.totalPrice,
        fechaSolicitud: new Date().toISOString()
      });
    } catch (e) {
      console.warn('No se pudo crear solicitud para vendedor:', e.message);
    }
  }
  return order;
}

// ============================================================
// REGISTRAR PAGO DE ORDEN (DELEGADO A PAYMENTS SERVICE)
// ============================================================
export async function registerPayment(orderId, monto, metodoPago = 'qr', cobradorId = null) {
  return await createOrUpdatePaymentForOrder(orderId, monto, metodoPago, cobradorId);
}

// ============================================================
// REGISTRAR PAGO DE ENGANCHE (DELEGADO)
// ============================================================
export async function registerDownPayment(orderId, monto, vendedorId = null) {
  return await registerDownPaymentService(orderId, monto, vendedorId);
}

// ============================================================
// OBTENER PAGOS DE UNA ORDEN (DELEGADO)
// ============================================================
export async function getOrderPayments(orderId) {
  return await getPaymentsByOrder(orderId);
}

// ============================================================
// FUNCIÓN AUXILIAR PARA FECHAS
// ============================================================
function getNextPaymentDate(dia) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  let targetDay = dia === 'martes' ? 2 : 1;
  let daysToAdd = targetDay - dayOfWeek;
  if (daysToAdd <= 0) daysToAdd += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

// ============================================================
// FUNCIONES DEPRECADAS (MANTENIDAS POR COMPATIBILIDAD)
// ============================================================
export async function createCashOrder(data) {
  console.warn('⚠️ createCashOrder está deprecada. Usa createCashOrderSimple.');
  return createCashOrderSimple({
    clientId: data.clientId,
    productId: data.productId,
    productName: data.productName,
    productPrice: data.productPrice,
    totalPrice: data.totalPrice,
    cashPrice: data.cashPrice,
    paymentMethod: data.paymentMethod,
    clientData: data.clientData,
    vendedorId: data.vendedorId || null,
    comprobanteId: data.comprobanteId || null
  });
}

export async function createCreditOrder(data) {
  console.warn('⚠️ createCreditOrder está deprecada. Usa createCreditOrderSimple.');
  return createCreditOrderSimple({
    clientId: data.clientId,
    productId: data.productId,
    productName: data.productName,
    productPrice: data.productPrice,
    totalPrice: data.totalPrice,
    downPayment: data.downPayment,
    downPaymentPercentage: data.downPaymentPercentage,
    weeklyAmount: data.weeklyAmount,
    totalWeeks: data.totalWeeks,
    remainingBalance: data.remainingBalance,
    diaPago: data.diaPago || 'lunes',
    paymentMethod: data.paymentMethod,
    clientData: data.clientData,
    vendedorId: data.vendedorId || null,
    comprobanteId: data.comprobanteId || null
  });
}

// ============================================================
// FUNCIONES PARA ADMIN (PAGINACIÓN Y ESTADÍSTICAS)
// ============================================================
export async function getOrdersPaginated({ page = 1, perPage = 10, search = '', filter = 'todas', sort = '-created' } = {}) {
  try {
    let filterCondition = '';
    if (filter === 'pendientes') filterCondition = 'estadoPago = "pendiente"';
    else if (filter === 'validados') filterCondition = 'estadoPago = "validado"';
    else if (filter === 'contado') filterCondition = 'tipo = "contado"';
    else if (filter === 'credito') filterCondition = 'tipo = "credito"';
    else if (filter === 'visita') filterCondition = 'tipo = "visita"';
    else if (filter === 'entrega') filterCondition = 'tipo = "entrega"';

    if (search.trim()) {
      const term = search.trim();
      const searchFilter = `(expand.userId.nombre ~ "${term}" || expand.productId.nombre ~ "${term}" || id ~ "${term}")`;
      filterCondition = filterCondition ? `${filterCondition} && ${searchFilter}` : searchFilter;
    }

    const result = await pb.collection(COLLECTIONS.ORDERS).getList(page, perPage, {
      filter: filterCondition || undefined,
      sort: sort,
      expand: 'userId,productId'
    });

    const items = result.items.map(order => ({
      ...order,
      clienteData: order.clienteData ? (typeof order.clienteData === 'string' ? JSON.parse(order.clienteData) : order.clienteData) : null,
      cliente: order.expand?.userId?.nombre || order.cliente || 'Cliente sin nombre',
      clienteEmail: order.expand?.userId?.email || '',
      clienteTelefono: order.expand?.userId?.telefono || '',
      productoNombre: order.expand?.productId?.nombre || 'Producto'
    }));

    return {
      items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error("Error obteniendo órdenes paginadas:", error);
    throw error;
  }
}

export async function getOrdersStats() {
  try {
    const totalResult = await pb.collection(COLLECTIONS.ORDERS).getList(1, 1, { fields: 'id' });
    const tipos = ['contado', 'credito', 'visita', 'entrega'];
    const tipoCounts = {};
    for (const tipo of tipos) {
      const result = await pb.collection(COLLECTIONS.ORDERS).getList(1, 1, {
        filter: `tipo = "${tipo}"`,
        fields: 'id'
      });
      tipoCounts[tipo] = result.totalItems;
    }
    const pendientesResult = await pb.collection(COLLECTIONS.ORDERS).getList(1, 1, {
      filter: 'estadoPago = "pendiente"',
      fields: 'id'
    });
    const validadosResult = await pb.collection(COLLECTIONS.ORDERS).getList(1, 1, {
      filter: 'estadoPago = "validado"',
      fields: 'id'
    });

    return {
      total: totalResult.totalItems,
      contado: tipoCounts.contado || 0,
      credito: tipoCounts.credito || 0,
      visita: tipoCounts.visita || 0,
      entrega: tipoCounts.entrega || 0,
      pendientesValidacion: pendientesResult.totalItems,
      validados: validadosResult.totalItems
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de órdenes:", error);
    return { total: 0, contado: 0, credito: 0, visita: 0, entrega: 0, pendientesValidacion: 0, validados: 0 };
  }
}