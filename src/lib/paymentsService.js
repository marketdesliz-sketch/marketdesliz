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
// OBTENER TODOS LOS PAGOS
// ============================================================
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

// ============================================================
// OBTENER PAGO POR ID
// ============================================================
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

// ============================================================
// PAGOS POR CLIENTE
// ============================================================
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

// ============================================================
// PAGOS POR ORDEN
// ============================================================
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

// ============================================================
// PAGOS PENDIENTES (INCLUYE ATRASADOS)
// ============================================================
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

// ============================================================
// PAGOS POR FECHA
// ============================================================
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

// ============================================================
// PAGOS DE HOY
// ============================================================
export async function getTodayPayments() {
  const today = new Date().toISOString().split('T')[0];
  return getPaymentsByDate(today);
}

// ============================================================
// PAGOS ATRASADOS
// ============================================================
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

// ============================================================
// CREAR UN PAGO
// ============================================================
export async function createPaymentRecord(data) {
  try {
    const payment = await pb.collection(COLLECTIONS.PAYMENTS).create({
      orderId: data.orderId,
      userId: data.userId,
      numeroSemana: data.numeroSemana || data.semana || 1,
      montoProgramado: data.montoProgramado || data.monto || 0,
      montoPagado: 0,
      fechaVencimiento: data.fechaVencimiento || new Date().toISOString().split('T')[0],
      estado: data.estado || "pendiente"
    });
    return payment;
  } catch (error) {
    console.error("Error creando pago:", error);
    throw error;
  }
}

// ============================================================
// CREAR PLAN DE PAGOS
// ============================================================
export async function createPaymentPlan(orderId, userId, totalWeeks, weeklyAmount, startDate, diaPago = 'lunes') {
  try {
    const payments = [];
    const start = new Date(startDate);
    
    // Ajustar al día de pago
    const targetDay = diaPago === 'martes' ? 2 : 1;
    const currentDay = start.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) daysToAdd += 7;
    if (daysToAdd === 0) daysToAdd = 7;
    start.setDate(start.getDate() + daysToAdd);
    
    for (let i = 1; i <= totalWeeks; i++) {
      const dueDate = new Date(start);
      dueDate.setDate(start.getDate() + ((i - 1) * 7));
      
      const payment = await createPaymentRecord({
        orderId,
        userId,
        numeroSemana: i,
        montoProgramado: weeklyAmount,
        fechaVencimiento: dueDate.toISOString().split('T')[0],
        estado: "pendiente"
      });
      
      payments.push(payment);
    }
    
    return payments;
  } catch (error) {
    console.error("Error creando plan de pagos:", error);
    throw error;
  }
}

// ============================================================
// REGISTRAR PAGO (MARCAR COMO PAGADO) - VERSIÓN PAYMENTS
// ============================================================
export async function markPaymentAsPaid(paymentId, paymentData = {}) {
  try {
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
    
    // Actualizar orden
    if (currentPayment.orderId) {
      try {
        const order = await pb.collection(COLLECTIONS.ORDERS).getOne(currentPayment.orderId);
        const newBalance = (order.saldoRestante || 0) - montoPagado;
        
        const updateData = {
          saldoRestante: Math.max(0, newBalance),
          pagosRealizados: (order.pagosRealizados || 0) + 1
        };
        
        if (newBalance <= 0) {
          updateData.estadoPago = 'completada';
          updateData.fechaCompletada = new Date().toISOString();
        } else if (order.estadoPago === 'pendiente_pago') {
          updateData.estadoPago = 'activa';
        }
        
        await pb.collection(COLLECTIONS.ORDERS).update(currentPayment.orderId, updateData);
      } catch (orderError) {
        console.error("Error actualizando saldo de orden:", orderError);
      }
    }
    
    return updatedPayment;
  } catch (error) {
    console.error("Error marcando pago como pagado:", error);
    throw error;
  }
}

// ============================================================
// REGISTRAR MÚLTIPLES PAGOS
// ============================================================
export async function markMultiplePaymentsAsPaid(paymentIds, cobradorId) {
  try {
    const results = [];
    for (const paymentId of paymentIds) {
      const result = await markPaymentAsPaid(paymentId, { cobradorId });
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error("Error registrando múltiples pagos:", error);
    throw error;
  }
}

// ============================================================
// ACTUALIZAR PAGO
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

// ============================================================
// ELIMINAR PAGO
// ============================================================
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
// ESTADÍSTICAS DE PAGOS
// ============================================================
export async function getPaymentStats(userId) {
  try {
    let filter = "";
    if (userId) {
      filter = `userId = "${userId}"`;
    }
    
    const payments = await pb.collection(COLLECTIONS.PAYMENTS).getFullList({ filter });
    
    const stats = {
      total: payments.length,
      pagados: payments.filter(p => p.estado === "pagado").length,
      pendientes: payments.filter(p => p.estado === "pendiente").length,
      atrasados: payments.filter(p => p.estado === "atrasado").length,
      parciales: payments.filter(p => p.estado === "parcial").length,
      totalMontoProgramado: payments.reduce((sum, p) => sum + (p.montoProgramado || 0), 0),
      totalMontoPagado: payments.filter(p => p.estado === "pagado").reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0),
      montoPendiente: payments.filter(p => p.estado === "pendiente" || p.estado === "atrasado").reduce((sum, p) => sum + (p.montoProgramado || 0), 0)
    };
    
    return stats;
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return null;
  }
}

// ============================================================
// VERIFICAR SI UNA SEMANA YA FUE PAGADA
// ============================================================
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

// ============================================================
// OBTENER PRÓXIMO PAGO DEL CLIENTE
// ============================================================
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

// ============================================================
// EXPORTAR CON ALIAS PARA EVITAR CONFLICTOS
// ============================================================
// Esta función es la versión "pagos" (marca como pagado)
// Si necesitas ambas en el mismo archivo, usa:
// import { markPaymentAsPaid } from './paymentsService';
// import { registerPayment } from './ordersService';