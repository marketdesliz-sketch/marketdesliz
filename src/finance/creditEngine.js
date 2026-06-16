// src/lib/calculateCreditPlan.js

/**
 * Calcula el plan de crédito para un producto
 * @param {Object} params
 * @param {number} params.price - Precio del producto
 * @param {number} params.downPaymentRate - Porcentaje de enganche (0.15 = 15%, 0.20 = 20%, 0.25 = 25%)
 * @param {number} params.maxWeeks - Máximo de semanas permitidas (default: 52)
 * @returns {Object} Plan de crédito calculado
 */
export function calculateCreditPlan({
  price,
  downPaymentRate = 0.15,
  maxWeeks = 52
}) {
  if (!price || price <= 0) {
    throw new Error("El precio del producto no es válido");
  }

  if (downPaymentRate < 0.15 || downPaymentRate > 0.25) {
    throw new Error("El enganche debe ser entre 15% y 25%");
  }

  // Calcular enganche
  const downPayment = Math.round(price * downPaymentRate);
  const downPaymentPercentage = Math.round(downPaymentRate * 100);

  // Saldo restante después del enganche
  const remainingBalance = price - downPayment;

  // Generar opciones de pago semanal
  const paymentOptions = generatePaymentOptions(remainingBalance, maxWeeks);

  // Generar planes para cada opción
  const weeklyPlans = paymentOptions.map(amount => {
    const exactWeeks = remainingBalance / amount;
    const fullWeeks = Math.floor(exactWeeks);
    const lastPayment = Math.round(remainingBalance - (amount * fullWeeks));
    
    // Si el último pago es 0 o muy pequeño, ajustar
    let weeks, finalLastPayment;
    if (lastPayment <= 0) {
      weeks = fullWeeks;
      finalLastPayment = 0;
    } else if (lastPayment < amount * 0.3) {
      // Si el último pago es muy chico, agregarlo a la última semana
      weeks = fullWeeks;
      finalLastPayment = lastPayment;
    } else {
      weeks = fullWeeks + 1;
      finalLastPayment = lastPayment;
    }

    // Calcular total exacto
    const totalPagar = downPayment + remainingBalance;
    const exactTotal = amount * weeks;
    const ultimoPago = exactTotal > remainingBalance 
      ? amount - (exactTotal - remainingBalance) 
      : amount;

    return {
      weeklyAmount: amount,
      weeks: weeks,
      totalPagar: totalPagar,
      remainingBalance: remainingBalance,
      lastPayment: ultimoPago !== amount ? ultimoPago : (finalLastPayment || 0),
      lastPaymentAmount: ultimoPago !== amount ? ultimoPago : (finalLastPayment || amount)
    };
  }).filter(plan => plan.weeks <= maxWeeks && plan.weeks > 0);

  // Encontrar el plan recomendado (menos semanas)
  const recommendedPlan = weeklyPlans.length > 0 
    ? weeklyPlans.reduce((best, plan) => plan.weeks < best.weeks ? plan : best)
    : null;

  return {
    price,
    downPayment,
    downPaymentPercentage,
    remainingBalance,
    maxWeeks,
    weeklyPlans,
    recommendedPlan,
    // Plan por defecto (primer plan disponible)
    defaultPlan: weeklyPlans[0] || null
  };
}

/**
 * Genera opciones de pago semanal según el saldo restante
 */
function generatePaymentOptions(remainingBalance, maxWeeks) {
  const options = [];
  
  // Rango de pagos según el saldo
  let minPayment, maxPayment, step;
  
  if (remainingBalance <= 1000) {
    minPayment = 50;
    maxPayment = 200;
    step = 25;
  } else if (remainingBalance <= 5000) {
    minPayment = 100;
    maxPayment = 500;
    step = 50;
  } else if (remainingBalance <= 20000) {
    minPayment = 200;
    maxPayment = 1000;
    step = 100;
  } else {
    minPayment = 500;
    maxPayment = 2000;
    step = 250;
  }
  
  for (let amount = minPayment; amount <= maxPayment; amount += step) {
    const weeks = Math.ceil(remainingBalance / amount);
    if (weeks <= maxWeeks) {
      options.push(amount);
    }
  }
  
  // Si no hay opciones válidas, agregar al menos una
  if (options.length === 0) {
    const minWeeksPayment = Math.ceil(remainingBalance / maxWeeks);
    options.push(minWeeksPayment);
  }
  
  return options;
}

/**
 * Formatea un plan para mostrar en UI
 */
export function formatPlanForDisplay(plan) {
  if (!plan) return null;
  
  return {
    ...plan,
    downPaymentFormatted: `$${plan.downPayment?.toLocaleString()}`,
    weeklyAmountFormatted: `$${plan.weeklyAmount?.toLocaleString()}`,
    totalFormatted: `$${plan.totalPagar?.toLocaleString()}`,
    lastPaymentFormatted: plan.lastPayment > 0 ? `$${plan.lastPayment?.toLocaleString()}` : null,
    summary: `${plan.weeks} semanas de $${plan.weeklyAmount?.toLocaleString()}${plan.lastPayment > 0 && plan.lastPayment !== plan.weeklyAmount ? ` + último pago de $${plan.lastPayment?.toLocaleString()}` : ''}`
  };
}

/**
 * Calcula plan para enganches específicos (15%, 20%, 25%)
 */
export function calculateAllDownPaymentOptions(price, maxWeeks = 52) {
  const rates = [0.15, 0.20, 0.25];
  
  return rates.map(rate => {
    const plan = calculateCreditPlan({ price, downPaymentRate: rate, maxWeeks });
    return {
      rate,
      percentage: Math.round(rate * 100),
      ...plan
    };
  });
}