// src/lib/ordersService.js
import pb from "./pocketbase";
import { activarNegocio } from './negociosService';

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
    // Buscar negocios de este usuario que estén pendientes de activación
    const negocios = await pb.collection('negocios').getFullList({
      filter: `usuarioId = "${userId}" && estadoActivacion = "pendiente_activacion"`
    });

    if (negocios.length === 0) return;

    // Activar cada negocio pendiente
    for (const negocio of negocios) {
      console.log(`🔄 Activando negocio ${negocio.id} (${negocio.nombre}) para usuario ${userId}`);
      await activarNegocio(negocio.id);

      // ✅ Opcional: Crear notificación de activación
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

// ============================================================
// ÓRDENES POR CLIENTE
// ============================================================
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

// ============================================================
// OBTENER ORDEN POR ID
// ============================================================
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

// ============================================================
// OBTENER ÓRDENES POR CLIENTE (CON EXPAND)
// ============================================================
export async function getClientOrders(clientId) {
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

// ============================================================
// OBTENER ÓRDENES ACTIVAS DEL CLIENTE
// ============================================================
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

// ============================================================
// OBTENER ÓRDENES COMPLETADAS DEL CLIENTE
// ============================================================
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
    const updateData = {
      estadoPago: nuevoEstadoPago
    };

    if (nuevoEstadoValidacion) {
      updateData.estadoValidacion = nuevoEstadoValidacion;
    }

    if (nuevoEstadoPago === 'completada') {
      updateData.fechaCompletada = new Date().toISOString();

      // Obtener la orden para saber el userId
      const order = await pb.collection(COLLECTIONS.ORDERS).getOne(orderId);
      if (order && order.userId) {
        await activarNegocioDelUsuario(order.userId);
      }
    }

    const updated = await pb.collection(COLLECTIONS.ORDERS).update(orderId, updateData);
    return updated;
  } catch (error) {
    console.error("Error actualizando orden:", error);
    throw error;
  }
}

// ============================================================
// CREAR ORDEN DE CONTADO (VERSIÓN SIMPLIFICADA PARA CHECKOUT)
// ============================================================
export async function createCashOrderSimple(orderData) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    // Calcular precio de contado
    const precioContado = Math.round(orderData.productPrice * 2 / 3);

    // Crear orden con CAMPOS CORRECTOS
    const order = await pb.collection(COLLECTIONS.ORDERS).create({
      // Relaciones
      userId: orderData.clientId,
      productId: orderData.productId,
      vendedorId: orderData.vendedorId || null,
      comprobanteId: orderData.comprobanteId || null,

      // Tipo y estados
      tipo: 'contado',
      estadoPago: 'pendiente_pago',
      estadoValidacion: 'pendiente',

      // Montos
      precioOriginal: orderData.productPrice,
      totalPagar: precioContado,
      enganche: precioContado,
      enganchePagado: false,

      // Método de pago
      metodoPago: orderData.paymentMethod || 'qr_vendedor',

      // Fechas
      created: new Date().toISOString()
    });

    // Crear solicitud para el vendedor si existe
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
  } catch (error) {
    console.error("Error creando orden de contado:", error);
    throw error;
  }
}

// ============================================================
// CREAR ORDEN DE CRÉDITO (VERSIÓN SIMPLIFICADA PARA CHECKOUT)
// ============================================================
export async function createCreditOrderSimple(orderData) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    // Calcular fecha del próximo pago
    const fechaPrimerPago = getNextPaymentDate(orderData.diaPago || 'lunes');
    const fechaProximoPago = new Date(fechaPrimerPago);
    fechaProximoPago.setDate(fechaProximoPago.getDate() + 7);

    // Crear orden con CAMPOS CORRECTOS
    const order = await pb.collection(COLLECTIONS.ORDERS).create({
      // Relaciones
      userId: orderData.clientId,
      productId: orderData.productId,
      vendedorId: orderData.vendedorId || null,
      comprobanteId: orderData.comprobanteId || null,

      // Tipo y estados
      tipo: 'credito',
      estadoPago: 'pendiente_pago',
      estadoValidacion: 'pendiente',

      // Montos
      precioOriginal: orderData.productPrice,
      enganche: orderData.downPayment,
      enganchePagado: false,
      pagoSemanal: orderData.weeklyAmount,
      semanasTotales: orderData.totalWeeks,
      totalPagar: orderData.totalPrice,
      saldoRestante: orderData.totalPrice,
      pagosRealizados: 0,

      // Frecuencia y método
      frecuenciaPago: 'semanal',
      metodoPago: orderData.paymentMethod || 'qr_vendedor',

      // Fechas
      fechaPrimerPago: fechaPrimerPago.toISOString(),
      fechaProximoPago: fechaProximoPago.toISOString(),
      created: new Date().toISOString()
    });

    // ✅ NO CREAR PAYMENTS AQUÍ - Se crean en CheckoutForm.jsx con crearPaymentsParaOrden()
    // Esto evita duplicación de pagos

    // Crear solicitud para el vendedor si existe
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
  } catch (error) {
    console.error("Error creando orden de crédito:", error);
    throw error;
  }
}

// ============================================================
// REGISTRAR PAGO DE ORDEN
// ============================================================
export async function registerPayment(orderId, monto, metodoPago = 'qr', cobradorId = null) {
  try {
    const order = await pb.collection(COLLECTIONS.ORDERS).getOne(orderId);

    // Actualizar orden
    const nuevosPagosRealizados = (order.pagosRealizados || 0) + 1;
    const nuevoSaldoRestante = (order.saldoRestante || order.totalPagar) - monto;

    const updateData = {
      pagosRealizados: nuevosPagosRealizados,
      saldoRestante: nuevoSaldoRestante
    };

    // Si ya no hay saldo, completar orden
    if (nuevoSaldoRestante <= 0) {
      updateData.estadoPago = 'completada';
      updateData.fechaCompletada = new Date().toISOString();

      // Activar negocio del usuario después de completar la orden
      await activarNegocioDelUsuario(order.userId);
    } else if (order.estadoPago === 'pendiente_pago') {
      updateData.estadoPago = 'activa';
    }

    const updated = await pb.collection(COLLECTIONS.ORDERS).update(orderId, updateData);

    // Crear o actualizar registro de pago
    // Buscar si ya existe un payment para esta semana
    const nextWeekNumber = (order.pagosRealizados || 0);
    const existingPayments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `orderId = "${orderId}" && numeroSemana = ${nextWeekNumber}`
    });

    if (existingPayments.length > 0) {
      // Actualizar payment existente
      await pb.collection(COLLECTIONS.PAYMENTS).update(existingPayments[0].id, {
        montoPagado: monto,
        fechaPago: new Date().toISOString(),
        estado: 'pagado',
        metodoPago: metodoPago,
        cobradorId: cobradorId || null
      });
    } else {
      // Crear nuevo payment
      await pb.collection(COLLECTIONS.PAYMENTS).create({
        orderId: orderId,
        userId: order.userId,
        numeroSemana: nextWeekNumber,
        montoProgramado: monto,
        montoPagado: monto,
        fechaVencimiento: new Date().toISOString(),
        fechaPago: new Date().toISOString(),
        estado: 'pagado',
        metodoPago: metodoPago,
        cobradorId: cobradorId || null
      });
    }

    return updated;
  } catch (error) {
    console.error("Error registrando pago:", error);
    throw error;
  }
}

// ============================================================
// REGISTRAR PAGO DE ENGANCHE
// ============================================================
export async function registerDownPayment(orderId, monto, vendedorId = null) {
  try {
    const order = await pb.collection(COLLECTIONS.ORDERS).getOne(orderId);

    // Actualizar orden
    const updateData = {
      enganchePagado: true,
      pagosRealizados: 1
    };

    // Si es crédito, activar la orden
    if (order.tipo === 'credito') {
      updateData.estadoPago = 'activa';
    } else if (order.tipo === 'contado') {
      updateData.estadoPago = 'completada';
      updateData.fechaCompletada = new Date().toISOString();

      // Activar negocio del usuario después de pagar contado
      await activarNegocioDelUsuario(order.userId);
    }

    const updated = await pb.collection(COLLECTIONS.ORDERS).update(orderId, updateData);

    // Crear payment para el enganche (semana 0)
    await pb.collection(COLLECTIONS.PAYMENTS).create({
      orderId: orderId,
      userId: order.userId,
      numeroSemana: 0,
      montoProgramado: monto,
      montoPagado: monto,
      fechaVencimiento: new Date().toISOString(),
      fechaPago: new Date().toISOString(),
      estado: 'pagado',
      metodoPago: 'qr',
      cobradorId: vendedorId || null
    });

    return updated;
  } catch (error) {
    console.error("Error registrando enganche:", error);
    throw error;
  }
}

// ============================================================
// OBTENER PAGOS DE UNA ORDEN
// ============================================================
export async function getOrderPayments(orderId) {
  try {
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `orderId = "${orderId}"`,
      sort: "numeroSemana"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    return [];
  }
}

// ============================================================
// OBTENER PRÓXIMA FECHA DE PAGO
// ============================================================
function getNextPaymentDate(dia) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Domingo, 1=Lunes, 2=Martes

  let targetDay;
  if (dia === 'lunes') {
    targetDay = 1;
  } else if (dia === 'martes') {
    targetDay = 2;
  } else {
    targetDay = 1; // Default: lunes
  }

  let daysToAdd = targetDay - dayOfWeek;
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

// ============================================================
// FUNCIONES DEPRECADAS (MANTENIDAS POR COMPATIBILIDAD)
// ============================================================

/**
 * @deprecated Usar createCashOrderSimple en su lugar
 */
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

/**
 * @deprecated Usar createCreditOrderSimple en su lugar
 */
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