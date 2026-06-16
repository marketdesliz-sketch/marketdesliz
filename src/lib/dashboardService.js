// src/lib/dashboardService.js
import pb from "./pocketbase";

/**
 * Obtener estadísticas generales del dashboard (admin)
 */
export async function getDashboardStats() {
  try {
    // Clientes
    const clients = await pb.collection("users").getFullList({
      filter: 'role = "cliente"'
    });

    // Órdenes activas
    const activeOrders = await pb.collection("orders").getFullList({
      filter: 'estadoPago = "activa" || estadoPago = "pendiente_pago"'
    });

    // Órdenes completadas
    const completedOrders = await pb.collection("orders").getFullList({
      filter: 'estadoPago = "completada"'
    });

    // Pagos de hoy
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const paymentsToday = await pb.collection("payments").getFullList({
      filter: `fechaVencimiento >= "${today}" && fechaVencimiento < "${tomorrowStr}"`
    });

    const paidToday = paymentsToday.filter(p => p.estado === 'pagado').length;
    const pendingToday = paymentsToday.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado').length;

    // Tareas pendientes (cobros)
    const tasksToday = await pb.collection("cobros").getFullList({
      filter: 'estado = "pendiente"',
      expand: "userId",
      sort: "fechaProgramada"
    });

    // KYC pendientes
    const kycPending = await pb.collection("kyc_verifications").getFullList({
      filter: 'estado = "pendiente"'
    });

    // Tandas activas
    const tandasActivas = await pb.collection("tandas").getFullList({
      filter: 'estado = "abierta" || estado = "en_curso"'
    });

    // Vendedores activos
    const vendedores = await pb.collection("vendedores").getFullList({
      filter: 'activo = true'
    });

    // Total recaudado (suma de pagos completados)
    const allPaidPayments = await pb.collection("payments").getFullList({
      filter: 'estado = "pagado"'
    });
    const totalRecaudado = allPaidPayments.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);

    return {
      clients: clients.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      paymentsToday: paymentsToday.length,
      paidToday,
      pendingToday,
      tasksToday: tasksToday.length,
      kycPending: kycPending.length,
      tandasActivas: tandasActivas.length,
      vendedores: vendedores.length,
      totalRecaudado,
      tasksTodayList: tasksToday.slice(0, 5)
    };

  } catch (error) {
    console.error("Error obteniendo estadísticas del dashboard:", error);
    return {
      clients: 0,
      activeOrders: 0,
      completedOrders: 0,
      paymentsToday: 0,
      paidToday: 0,
      pendingToday: 0,
      tasksToday: 0,
      kycPending: 0,
      tandasActivas: 0,
      vendedores: 0,
      totalRecaudado: 0,
      tasksTodayList: []
    };
  }
}

/**
 * Obtener estadísticas para vendedor
 */
export async function getVendedorDashboardStats(vendedorId) {
  try {
    const solicitudes = await pb.collection("solicitudes").getFullList({
      filter: `vendedorId = "${vendedorId}"`
    });

    const pendientes = solicitudes.filter(s => s.estado === 'pendiente_vendedor').length;
    const validadas = solicitudes.filter(s => s.estado === 'vendedor_validado').length;
    const completadas = solicitudes.filter(s => s.estado === 'completada').length;
    
    const enganchesRecibidos = solicitudes
      .filter(s => s.enganchePagado)
      .reduce((sum, s) => sum + (s.enganche || 0), 0);

    // Obtener datos del vendedor para comisiones
    let vendedorData = null;
    try {
      vendedorData = await pb.collection("vendedores").getOne(vendedorId);
    } catch (e) {}

    return {
      totalSolicitudes: solicitudes.length,
      pendientes,
      validadas,
      completadas,
      enganchesRecibidos,
      comisionEstimada: enganchesRecibidos * 0.5,
      totalComisiones: vendedorData?.totalComisiones || 0,
      comisionesPendientes: vendedorData?.comisionesPendientes || 0
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas del vendedor:", error);
    return {
      totalSolicitudes: 0,
      pendientes: 0,
      validadas: 0,
      completadas: 0,
      enganchesRecibidos: 0,
      comisionEstimada: 0,
      totalComisiones: 0,
      comisionesPendientes: 0
    };
  }
}

/**
 * Obtener estadísticas para cliente
 */
export async function getClienteDashboardStats(userId) {
  try {
    const orders = await pb.collection("orders").getFullList({
      filter: `userId = "${userId}"`
    });

    const activeOrders = orders.filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago');
    const completedOrders = orders.filter(o => o.estadoPago === 'completada');

    const pagos = await pb.collection("payments").getFullList({
      filter: `userId = "${userId}"`
    });

    const deudaTotal = pagos
      .filter(p => p.estado === 'pendiente' || p.estado === 'atrasado')
      .reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);
    
    const pagosRealizados = pagos
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);

    const pagosAtrasados = pagos.filter(p => p.estado === 'atrasado').length;

    // Datos del cliente
    let clientData = null;
    try {
      clientData = await pb.collection("clients").getFirstListItem(`userId = "${userId}"`);
    } catch (e) {}

    return {
      totalCompras: orders.length,
      ordenesActivas: activeOrders.length,
      ordenesCompletadas: completedOrders.length,
      deudaTotal,
      pagosRealizados,
      pagosPendientes: pagos.filter(p => p.estado === 'pendiente').length,
      pagosAtrasados,
      nivel: clientData?.nivel || 0,
      productosPagados: clientData?.productosPagados || 0,
      trustScore: clientData?.trustScore || 0,
      tandaDisponible: clientData?.tandaDisponible || 0
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas del cliente:", error);
    return {
      totalCompras: 0,
      ordenesActivas: 0,
      ordenesCompletadas: 0,
      deudaTotal: 0,
      pagosRealizados: 0,
      pagosPendientes: 0,
      pagosAtrasados: 0,
      nivel: 0,
      productosPagados: 0,
      trustScore: 0,
      tandaDisponible: 0
    };
  }
}

/**
 * Obtener ingresos por semana (para gráficas)
 */
export async function getWeeklyIncome(weeks = 4) {
  try {
    const result = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() - 1) - (i * 7));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const payments = await pb.collection("payments").getFullList({
        filter: `estado = "pagado" && fechaPago >= "${startOfWeek.toISOString()}" && fechaPago <= "${endOfWeek.toISOString()}"`
      });
      
      const total = payments.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
      
      result.push({
        week: `${startOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`,
        total
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error obteniendo ingresos semanales:", error);
    return [];
  }
}