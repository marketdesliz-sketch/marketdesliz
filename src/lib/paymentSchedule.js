// src/lib/paymentSchedule.js
import pb from "./pocketbase";

/**
 * Genera calendario de pagos para una orden
 */
export async function generatePaymentSchedule({
  orderId,
  userId,
  paymentAmount,
  installments,
  frequency = 'semanal',
  startDate = new Date(),
}) {
  const payments = [];
  let currentDate = new Date(startDate);

  function addInterval(date) {
    const newDate = new Date(date);
    if (frequency === "semanal" || frequency === "weekly") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (frequency === "quincenal" || frequency === "biweekly") {
      newDate.setDate(newDate.getDate() + 14);
    } else if (frequency === "mensual" || frequency === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    return newDate;
  }

  for (let i = 1; i <= installments; i++) {
    currentDate = addInterval(currentDate);

    const payment = await pb.collection("payments").create({
      orderId: orderId,
      userId: userId,
      numeroSemana: i,
      montoProgramado: paymentAmount,
      montoPagado: 0,
      fechaVencimiento: currentDate.toISOString().split('T')[0],
      estado: "pendiente"
    });

    payments.push(payment);
  }

  return payments;
}

/**
 * Genera calendario de pagos con día específico (lunes/martes)
 */
export async function generatePaymentScheduleWithDay({
  orderId,
  userId,
  paymentAmount,
  installments,
  diaPago = 'lunes',
  startDate = new Date(),
}) {
  const payments = [];
  let currentDate = new Date(startDate);
  
  const targetDay = diaPago === 'martes' ? 2 : 1;

  // Ajustar al día de la semana deseado
  const currentDay = currentDate.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  if (daysToAdd === 0) daysToAdd = 7; // Si hoy es el día, próxima semana
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 1; i <= installments; i++) {
    const payment = await pb.collection("payments").create({
      orderId: orderId,
      userId: userId,
      numeroSemana: i,
      montoProgramado: paymentAmount,
      montoPagado: 0,
      fechaVencimiento: currentDate.toISOString().split('T')[0],
      estado: "pendiente"
    });

    payments.push(payment);
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return payments;
}

/**
 * Genera calendario de pagos completo con enganche
 */
export async function generateFullPaymentSchedule({
  orderId,
  userId,
  downPayment,
  weeklyAmount,
  totalWeeks,
  lastPaymentAmount = null,
  diaPago = 'lunes',
}) {
  const payments = [];

  // 1. Pago de enganche (semana 0)
  const pagoEnganche = await pb.collection("payments").create({
    orderId: orderId,
    userId: userId,
    numeroSemana: 0,
    montoProgramado: downPayment,
    montoPagado: 0,
    fechaVencimiento: new Date().toISOString().split('T')[0],
    estado: "pendiente"
  });
  payments.push(pagoEnganche);

  // 2. Pagos semanales
  const currentDate = new Date();
  const targetDay = diaPago === 'martes' ? 2 : 1;
  const currentDay = currentDate.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  if (daysToAdd === 0) daysToAdd = 7;
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 1; i <= totalWeeks; i++) {
    let monto = weeklyAmount;
    if (i === totalWeeks && lastPaymentAmount && lastPaymentAmount > 0) {
      monto = lastPaymentAmount;
    }

    const payment = await pb.collection("payments").create({
      orderId: orderId,
      userId: userId,
      numeroSemana: i,
      montoProgramado: monto,
      montoPagado: 0,
      fechaVencimiento: currentDate.toISOString().split('T')[0],
      estado: "pendiente"
    });

    payments.push(payment);
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return payments;
}

/**
 * Genera calendario de pagos para tanda
 */
export async function generateTandaPaymentSchedule({
  tandaMemberId,
  userId,
  amount,
  totalRounds,
  startDate = new Date(),
}) {
  const payments = [];
  let currentDate = new Date(startDate);

  for (let i = 1; i <= totalRounds; i++) {
    const payment = await pb.collection("tanda_pagos").create({
      tandaMemberId: tandaMemberId,
      semana: i,
      monto: amount,
      fechaPago: currentDate.toISOString().split('T')[0],
      estado: "pendiente"
    });

    payments.push(payment);
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return payments;
}