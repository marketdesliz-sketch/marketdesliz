// src/lib/paymentsService.js
import pb from "./pocketbase";

// ============================================================
// CONSTANTES
// ============================================================
const COLLECTIONS = {
  PAYMENTS: 'payments',
  ORDERS: 'orders'
};

// ============================================================
// FUNCIONES AUXILIARES PRIVADAS
// ============================================================

/**
 * Actualiza el saldo y estado de una orden después de un pago.
 * @param {string} orderId - ID de la orden
 * @param {number} montoPagado - Monto pagado
 * @returns {Promise<Object>} - Orden actualizada
 */
async function _updateOrderBalance(orderId, montoPagado) {
  const order = await pb.collection(COLLECTIONS.ORDERS).getOne(orderId);
  const nuevoSaldo = Math.max(0, (order.saldoRestante || order.totalPagar || 0) - montoPagado);

  const updateData = {
    saldoRestante: nuevoSaldo,
    pagosRealizados: (order.pagosRealizados || 0) + 1
  };

  if (nuevoSaldo <= 0) {
    updateData.estadoPago = 'completada';
    updateData.fechaCompletada = new Date().toISOString();
    // Opcional: activar negocio si es necesario (se puede hacer con un hook o evento)
  } else if (order.estadoPago === 'pendiente_pago') {
    updateData.estadoPago = 'activa';
  }

  return await pb.collection(COLLECTIONS.ORDERS).update(orderId, updateData);
}

// ============================================================
// FUNCIONES DE CONSULTA DE PAGOS
// ============================================================

/**
 * Obtener todos los pagos
 */
export async function getPayments() {
  try {
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      expand: "userId,orderId",
      sort: "-created"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    return [];
  }
}

/**
 * Obtener pago por ID
 */
export async function getPaymentById(id) {
  try {
    const payment = await pb.collection(COLLECTIONS.PAYMENTS).getOne(id, {
      expand: "userId,orderId"
    });
    return payment;
  } catch (error) {
    console.error("Error obteniendo pago:", error);
    return null;
  }
}

/**
 * Obtener pagos por cliente
 */
export async function getPaymentsByClient(clientId) {
  try {
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `userId = "${clientId}"`,
      sort: "-fechaVencimiento",
      expand: "orderId"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos del cliente:", error);
    return [];
  }
}

/**
 * Obtener pagos por orden
 */
export async function getPaymentsByOrder(orderId) {
  try {
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `orderId = "${orderId}"`,
      sort: "numeroSemana"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos de la orden:", error);
    return [];
  }
}

/**
 * Obtener pagos pendientes (incluye atrasados)
 */
export async function getPendingPayments() {
  try {
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `estado = "pendiente" || estado = "atrasado"`,
      expand: "userId,orderId",
      sort: "fechaVencimiento"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos pendientes:", error);
    return [];
  }
}

/**
 * Obtener pagos por fecha de vencimiento
 */
export async function getPaymentsByDate(date) {
  try {
    const dateStr = new Date(date).toISOString().split('T')[0];
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `fechaVencimiento = "${dateStr}"`,
      expand: "userId,orderId"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos por fecha:", error);
    return [];
  }
}

/**
 * Obtener pagos de hoy
 */
export async function getTodayPayments() {
  const today = new Date().toISOString().split('T')[0];
  return getPaymentsByDate(today);
}

/**
 * Obtener pagos atrasados
 */
export async function getLatePayments() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `(estado = "pendiente" || estado = "atrasado") && fechaVencimiento < "${today}"`,
      expand: "userId,orderId",
      sort: "fechaVencimiento"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos atrasados:", error);
    return [];
  }
}

/**
 * Obtener próximo pago de un cliente
 */
export async function getNextPayment(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getList(1, 1, {
      filter: `userId = "${userId}" && (estado = "pendiente" || estado = "atrasado") && fechaVencimiento >= "${today}"`,
      sort: "fechaVencimiento",
      expand: "orderId"
    });
    return payments.items[0] || null;
  } catch (error) {
    console.error("Error obteniendo próximo pago:", error);
    return null;
  }
}

/**
 * Verificar si una semana ya fue pagada
 */
export async function isWeekPaid(orderId, numeroSemana) {
  try {
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
      filter: `orderId = "${orderId}" && numeroSemana = ${numeroSemana} && estado = "pagado"`
    });
    return payments.length > 0;
  } catch (error) {
    console.error("Error verificando pago:", error);
    return false;
  }
}

/**
 * Estadísticas de pagos (opcional, para un usuario)
 */
export async function getPaymentStats(userId) {
  try {
    let filter = "";
    if (userId) {
      filter = `userId = "${userId}"`;
    }
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({ filter });
    return {
      total: payments.length,
      pagados: payments.filter(p => p.estado === "pagado").length,
      pendientes: payments.filter(p => p.estado === "pendiente").length,
      atrasados: payments.filter(p => p.estado === "atrasado").length,
      parciales: payments.filter(p => p.estado === "parcial").length,
      totalMontoProgramado: payments.reduce((sum, p) => sum + (p.montoProgramado || 0), 0),
      totalMontoPagado: payments.filter(p => p.estado === "pagado").reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0),
      montoPendiente: payments.filter(p => p.estado === "pendiente" || p.estado === "atrasado").reduce((sum, p) => sum + (p.montoProgramado || 0), 0)
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return null;
  }
}

// ============================================================
// CREAR O ACTUALIZAR PAGO DESDE UNA ORDEN
// ============================================================

/**
 * Crea o actualiza un pago para una orden, y actualiza el saldo de la orden.
 * @param {string} orderId - ID de la orden
 * @param {number} monto - Monto pagado
 * @param {string} metodoPago - Método de pago (ej: 'qr', 'efectivo')
 * @param {string|null} cobradorId - ID del cobrador (opcional)
 * @returns {Promise<Object>} - El registro de pago creado/actualizado
 */
export async function createOrUpdatePaymentForOrder(orderId, monto, metodoPago = 'qr', cobradorId = null) {
  const order = await pb.collection(COLLECTIONS.ORDERS).getOne(orderId);
  const nextWeekNumber = (order.pagosRealizados || 0) + 1;

  // Buscar si ya existe payment para esa semana
  const existingPayments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({
    filter: `orderId = "${orderId}" && numeroSemana = ${nextWeekNumber}`
  });

  let payment;
  if (existingPayments.length > 0) {
    payment = await pb.collection(COLLECTIONS.PAYMENTS).update(existingPayments[0].id, {
      montoPagado: monto,
      fechaPago: new Date().toISOString(),
      estado: 'pagado',
      metodoPago: metodoPago,
      cobradorId: cobradorId || null
    });
  } else {
    const fechaVencimiento = new Date();
    if (order.fechaProximoPago) {
      fechaVencimiento.setTime(new Date(order.fechaProximoPago).getTime());
    } else {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);
    }

    payment = await pb.collection(COLLECTIONS.PAYMENTS).create({
      orderId: orderId,
      userId: order.userId,
      numeroSemana: nextWeekNumber,
      montoProgramado: monto,
      montoPagado: monto,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
      fechaPago: new Date().toISOString(),
      estado: 'pagado',
      metodoPago: metodoPago,
      cobradorId: cobradorId || null
    });
  }

  await _updateOrderBalance(orderId, monto);
  return payment;
}

// ============================================================
// MARCAR PAGO COMO PAGADO (DESDE UN PAYMENT EXISTENTE)
// ============================================================

/**
 * Marca un pago existente como pagado y actualiza la orden asociada.
 * @param {string} paymentId - ID del pago
 * @param {Object} paymentData - Datos adicionales (monto, fecha, etc.)
 * @returns {Promise<Object>} - Pago actualizado
 */
export async function markPaymentAsPaid(paymentId, paymentData = {}) {
  const currentPayment = await getPaymentById(paymentId);
  if (!currentPayment) throw new Error("Pago no encontrado");

  const montoPagado = paymentData.monto || currentPayment.montoProgramado || 0;

  const updatedPayment = await pb.collection(COLLECTIONS.PAYMENTS).update(paymentId, {
    estado: "pagado",
    montoPagado: montoPagado,
    fechaPago: paymentData.fechaPago || new Date().toISOString(),
    metodoPago: paymentData.metodoPago || 'efectivo',
    cobradorId: paymentData.cobradorId || null,
    notasAdmin: paymentData.notas || ""
  });

  if (currentPayment.orderId) {
    await _updateOrderBalance(currentPayment.orderId, montoPagado);
  }

  return updatedPayment;
}

// ============================================================
// REGISTRAR PAGO DE ENGANCHE
// ============================================================

/**
 * Registra el pago del enganche de una orden (semana 0)
 * @param {string} orderId - ID de la orden
 * @param {number} monto - Monto del enganche
 * @param {string|null} vendedorId - ID del vendedor (opcional)
 * @returns {Promise<Object>} - Pago creado
 */
export async function registerDownPayment(orderId, monto, vendedorId = null) {
  const order = await pb.collection(COLLECTIONS.ORDERS).getOne(orderId);

  const payment = await pb.collection(COLLECTIONS.PAYMENTS).create({
    orderId: orderId,
    userId: order.userId,
    numeroSemana: 0,
    montoProgramado: monto,
    montoPagado: monto,
    fechaVencimiento: new Date().toISOString().split('T')[0],
    fechaPago: new Date().toISOString(),
    estado: 'pagado',
    metodoPago: 'qr',
    cobradorId: vendedorId || null
  });

  const updateData = {
    enganchePagado: true,
    pagosRealizados: 1
  };

  if (order.tipo === 'credito') {
    updateData.estadoPago = 'activa';
  } else if (order.tipo === 'contado') {
    updateData.estadoPago = 'completada';
    updateData.fechaCompletada = new Date().toISOString();
  }

  await pb.collection(COLLECTIONS.ORDERS).update(orderId, updateData);
  return payment;
}

// ============================================================
// CREAR PLAN DE PAGOS (MÚLTIPLES PAGOS)
// ============================================================

/**
 * Crea un plan de pagos para una orden (varios pagos programados)
 * @param {string} orderId - ID de la orden
 * @param {string} userId - ID del usuario
 * @param {number} totalWeeks - Número de semanas
 * @param {number} weeklyAmount - Monto semanal
 * @param {Date|string} startDate - Fecha de inicio
 * @param {string} diaPago - 'lunes' o 'martes'
 * @returns {Promise<Array>} - Lista de pagos creados
 */
export async function createPaymentPlan(orderId, userId, totalWeeks, weeklyAmount, startDate, diaPago = 'lunes') {
  const payments = [];
  const start = new Date(startDate);
  const targetDay = diaPago === 'martes' ? 2 : 1;
  const currentDay = start.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  if (daysToAdd === 0) daysToAdd = 7;
  start.setDate(start.getDate() + daysToAdd);

  for (let i = 1; i <= totalWeeks; i++) {
    const dueDate = new Date(start);
    dueDate.setDate(start.getDate() + ((i - 1) * 7));

    const payment = await pb.collection(COLLECTIONS.PAYMENTS).create({
      orderId,
      userId,
      numeroSemana: i,
      montoProgramado: weeklyAmount,
      montoPagado: 0,
      fechaVencimiento: dueDate.toISOString().split('T')[0],
      estado: "pendiente"
    });
    payments.push(payment);
  }
  return payments;
}

// ============================================================
// ACTUALIZAR / ELIMINAR PAGO
// ============================================================

export async function updatePayment(paymentId, data) {
  try {
    const payment = await pb.collection(COLLECTIONS.PAYMENTS).update(paymentId, data);
    return payment;
  } catch (error) {
    console.error("Error actualizando pago:", error);
    throw error;
  }
}

export async function deletePayment(paymentId) {
  try {
    await pb.collection(COLLECTIONS.PAYMENTS).delete(paymentId);
    return true;
  } catch (error) {
    console.error("Error eliminando pago:", error);
    throw error;
  }
}

// ============================================================
// REGISTRAR MÚLTIPLES PAGOS (BATCH)
// ============================================================

export async function markMultiplePaymentsAsPaid(paymentIds, cobradorId) {
  const results = [];
  for (const paymentId of paymentIds) {
    const result = await markPaymentAsPaid(paymentId, { cobradorId });
    results.push(result);
  }
  return results;
}