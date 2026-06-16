// src/hooks/useCollector.js
import { useEffect, useState, useCallback } from "react";
import pb from "../lib/pocketbase";

export default function useCollector() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
      
      // Obtener pagos pendientes Y atrasados
      const pendingPayments = await pb.collection('payments').getFullList({
        filter: `(estado = "pendiente" || estado = "atrasado") && fechaVencimiento >= "${inicioHoy.toISOString().split('T')[0]}" && fechaVencimiento < "${finHoy.toISOString().split('T')[0]}"`,
        expand: 'orderId,userId',
        sort: 'fechaVencimiento'
      });
      
      const tasksFormatted = pendingPayments.map(payment => ({
        id: payment.id,
        clientId: payment.userId,
        clientName: payment.expand?.userId?.nombre || 'Cliente',
        clientPhone: payment.expand?.userId?.telefono || '',
        amount: payment.montoProgramado || payment.monto || 0,
        dueDate: payment.fechaVencimiento,
        weekNumber: payment.numeroSemana !== undefined ? payment.numeroSemana : payment.semana,
        concept: payment.numeroSemana === 0 
          ? 'Enganche' 
          : `Pago semana ${payment.numeroSemana !== undefined ? payment.numeroSemana : payment.semana}`,
        status: payment.estado,
        orderId: payment.orderId,
        orderData: payment.expand?.orderId
      }));
      
      setTasks(tasksFormatted);
    } catch (err) {
      console.error("Error cargando tareas:", err);
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function cobrar(paymentId, amount) {
    try {
      const payment = await pb.collection('payments').getOne(paymentId, {
        expand: 'orderId'
      });
      
      // Actualizar el pago como pagado
      await pb.collection('payments').update(paymentId, {
        estado: 'pagado',
        montoPagado: amount,
        fechaPago: new Date().toISOString(),
        metodoPago: 'efectivo'
      });
      
      // Actualizar la orden relacionada
      if (payment.orderId) {
        const order = payment.expand?.orderId || await pb.collection('orders').getOne(payment.orderId);
        
        const nuevosPagosRealizados = (order.pagosRealizados || 0) + 1;
        const nuevoSaldoRestante = (order.saldoRestante || order.totalPagar || 0) - amount;
        const saldoFinal = Math.max(0, nuevoSaldoRestante);
        const estaCompleta = saldoFinal <= 0;
        
        // Actualizar orden
        const updateData = {
          pagosRealizados: nuevosPagosRealizados,
          saldoRestante: saldoFinal
        };
        
        if (estaCompleta) {
          updateData.estadoPago = 'completada';
          updateData.fechaCompletada = new Date().toISOString();
        } else if (order.estadoPago === 'pendiente_pago') {
          updateData.estadoPago = 'activa';
        }
        
        await pb.collection('orders').update(payment.orderId, updateData);
        
        // Si la orden se completó, actualizar cliente
        if (estaCompleta) {
          try {
            const client = await pb.collection('clients').getFirstListItem(
              `userId = "${payment.userId}"`
            );
            
            await pb.collection('clients').update(client.id, {
              productosPagados: (client.productosPagados || 0) + 1,
              productosEnCurso: Math.max(0, (client.productosEnCurso || 0) - 1),
              deudaActual: Math.max(0, (client.deudaActual || 0) - (order.totalPagar || 0)),
              fechaUltimoPago: new Date().toISOString(),
              trustScore: Math.min(100, (client.trustScore || 0) + 2)
            });
          } catch (clientError) {
            console.warn('Error actualizando cliente:', clientError.message);
          }
        }
      }
      
      await loadTasks();
      return true;
    } catch (err) {
      console.error("Error registrando pago:", err);
      throw err;
    }
  }

  async function marcarNoPago(paymentId, motivo) {
    try {
      // Marcar pago como atrasado
      await pb.collection('payments').update(paymentId, {
        estado: 'atrasado',
        notasAdmin: motivo || 'No se realizó el pago'
      });
      
      await loadTasks();
      return true;
    } catch (err) {
      console.error("Error registrando no pago:", err);
      throw err;
    }
  }

  async function obtenerResumenDia() {
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString().split('T')[0];
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString().split('T')[0];
      
      const pagosHoy = await pb.collection('payments').getFullList({
        filter: `fechaVencimiento >= "${inicioHoy}" && fechaVencimiento < "${finHoy}"`,
        expand: 'userId'
      });
      
      const pendientes = pagosHoy.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado');
      const pagados = pagosHoy.filter(p => p.estado === 'pagado');
      
      const totalMontoPendiente = pendientes.reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);
      const totalMontoPagado = pagados.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
      
      return {
        total: pagosHoy.length,
        pendientes: pendientes.length,
        pagados: pagados.length,
        montoPendiente: totalMontoPendiente,
        montoPagado: totalMontoPagado
      };
    } catch (err) {
      console.error('Error obteniendo resumen:', err);
      return {
        total: 0,
        pendientes: 0,
        pagados: 0,
        montoPendiente: 0,
        montoPagado: 0
      };
    }
  }

  return {
    tasks,
    loading,
    error,
    cobrar,
    marcarNoPago,
    obtenerResumenDia,
    reloadTasks: loadTasks
  };
}