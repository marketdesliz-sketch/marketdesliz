// src/lib/generateSchedule.js

/**
 * Genera el calendario de pagos para una orden a crédito
 * @param {Object} params
 * @param {string} params.orderId - ID de la orden
 * @param {string} params.userId - ID del usuario/cliente
 * @param {number} params.downPayment - Monto del enganche
 * @param {number} params.weeklyAmount - Monto del pago semanal
 * @param {number} params.totalWeeks - Número total de semanas
 * @param {number} params.lastPaymentAmount - Monto del último pago (si es diferente)
 * @param {string} params.diaPago - Día de pago preferido ('lunes' o 'martes')
 * @param {Object} params.pb - Instancia de PocketBase
 * @returns {Promise<Array>} - Lista de pagos creados
 */
export async function generateSchedule({
  orderId,
  userId,
  downPayment,
  weeklyAmount,
  totalWeeks,
  lastPaymentAmount = null,
  diaPago = 'lunes',
  pb
}) {
  const payments = [];
  
  // 1. Crear pago de enganche (semana 0)
  const pagoEnganche = await pb.collection('payments').create({
    orderId: orderId,
    userId: userId,
    numeroSemana: 0,
    montoProgramado: downPayment,
    montoPagado: 0,
    fechaVencimiento: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
    metodoPago: null
  });
  payments.push(pagoEnganche);
  
  // 2. Calcular fecha del primer pago
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const targetDay = diaPago === 'martes' ? 2 : 1;
  
  let diasHastaPago = targetDay - diaSemana;
  if (diasHastaPago < 0) {
    diasHastaPago += 7;
  } else if (diasHastaPago === 0) {
    // Si hoy es el día de pago, programar para la próxima semana
    diasHastaPago = 7;
  }
  
  let fechaVencimiento = new Date(hoy);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + diasHastaPago);
  fechaVencimiento.setHours(0, 0, 0, 0);
  
  // 3. Crear pagos semanales
  for (let semana = 1; semana <= totalWeeks; semana++) {
    // Determinar monto para esta semana
    let monto = weeklyAmount;
    if (semana === totalWeeks && lastPaymentAmount && lastPaymentAmount > 0) {
      monto = lastPaymentAmount;
    }
    
    const payment = await pb.collection('payments').create({
      orderId: orderId,
      userId: userId,
      numeroSemana: semana,
      montoProgramado: monto,
      montoPagado: 0,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
      estado: 'pendiente',
      metodoPago: null
    });
    
    payments.push(payment);
    
    // Avanzar 7 días para el siguiente pago
    fechaVencimiento = new Date(fechaVencimiento);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);
  }
  
  return payments;
}

/**
 * Versión simplificada sin enganche explícito
 */
export async function generateScheduleSimple({
  orderId,
  userId,
  weeklyAmount,
  totalWeeks,
  diaPago = 'lunes',
  pb
}) {
  const payments = [];
  
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const targetDay = diaPago === 'martes' ? 2 : 1;
  
  let diasHastaPago = targetDay - diaSemana;
  if (diasHastaPago < 0) {
    diasHastaPago += 7;
  } else if (diasHastaPago === 0) {
    diasHastaPago = 7;
  }
  
  let fechaVencimiento = new Date(hoy);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + diasHastaPago);
  fechaVencimiento.setHours(0, 0, 0, 0);
  
  for (let semana = 1; semana <= totalWeeks; semana++) {
    const payment = await pb.collection('payments').create({
      orderId: orderId,
      userId: userId,
      numeroSemana: semana,
      montoProgramado: weeklyAmount,
      montoPagado: 0,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
      estado: 'pendiente',
      metodoPago: null
    });
    
    payments.push(payment);
    
    fechaVencimiento = new Date(fechaVencimiento);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);
  }
  
  return payments;
}