// src/pages/perfil/pagos.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { DollarSign, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, ChevronRight, ArrowLeft, TrendingUp, Package } from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function MisPagosPage() {
  const router = useRouter();
  const { orden: ordenId } = router.query;
  const [pagos, setPagos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (ordenId && ordenes.length > 0) {
      const order = ordenes.find(o => o.id === ordenId);
      setSelectedOrder(order);
      cargarPagosPorOrden(ordenId);
    }
  }, [ordenId, ordenes]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const user = pb.authStore.model;

      const ordenesData = await pb.collection('orders').getFullList({
        filter: `userId = "${user.id}"`,
        sort: '-created',
        expand: 'productId'
      });
      setOrdenes(ordenesData);

      if (!ordenId) {
        await cargarTodosLosPagos(user.id);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTodosLosPagos = async (userId) => {
    try {
      const pagosData = await pb.collection('payments').getFullList({
        filter: `userId = "${userId}"`,
        sort: '-fechaVencimiento',
        expand: 'orderId'
      });
      setPagos(pagosData);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    }
  };

  const cargarPagosPorOrden = async (orderId) => {
    try {
      const pagosData = await pb.collection('payments').getFullList({
        filter: `orderId = "${orderId}"`,
        sort: 'numeroSemana'
      });
      setPagos(pagosData);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    }
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPaymentStatus = (payment) => {
    if (payment.estado === 'pagado') {
      return { label: 'Pagado', color: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20', icon: CheckCircle };
    }
    if (payment.estado === 'atrasado') {
      return { label: 'Atrasado', color: 'bg-red-50 text-red-700 border-red-100', icon: AlertCircle };
    }
    if (payment.estado === 'parcial') {
      return { label: 'Parcial', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock };
    }
    const dueDate = new Date(payment.fechaVencimiento);
    const today = new Date();
    if (dueDate < today) {
      return { label: 'Atrasado', color: 'bg-red-50 text-red-700 border-red-100', icon: AlertCircle };
    }
    return { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock };
  };

  const calcularTotalOrden = (orden) => {
    if (orden.tipo === 'contado') {
      return orden.totalPagar || 0;
    } else if (orden.tipo === 'credito') {
      return (orden.enganche || 0) + ((orden.pagoSemanal || 0) * (orden.semanasTotales || 0));
    }
    return orden.totalPagar || 0;
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Mis Pagos | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-40 pb-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/perfil" className="inline-flex items-center gap-1 text-sm text-[#6C3BFF] hover:gap-2 transition-all mb-4 group">
              <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" /> Volver a mi perfil
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mis pagos</h1>
                <p className="text-sm text-gray-400">Historial de todos tus pagos realizados</p>
              </div>
            </div>
          </div>

          {/* Selector de orden */}
          {!ordenId && ordenes.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Filtrar por orden
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(`/perfil/pagos?orden=${e.target.value}`);
                  } else {
                    router.push('/perfil/pagos');
                  }
                }}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white"
              >
                <option value="">Todas las órdenes</option>
                {ordenes.map(orden => (
                  <option key={orden.id} value={orden.id}>
                    {orden.expand?.productId?.nombre || 'Producto'} - {formatDate(orden.created)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Información de la orden seleccionada */}
          {selectedOrder && (
            <div className="bg-gradient-to-r from-[#6C3BFF]/5 to-[#6C3BFF]/10 rounded-2xl border border-[#6C3BFF]/20 p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-[#6C3BFF]" />
                <h3 className="font-bold text-gray-900">
                  {selectedOrder.expand?.productId?.nombre || 'Producto'}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
                  <p className="text-base font-bold text-[#6C3BFF] mt-0.5">
                    {formatMoney(calcularTotalOrden(selectedOrder))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tipo</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5 capitalize">
                    {selectedOrder.tipo === 'contado' ? 'Contado' : 'Crédito'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Estado</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5 capitalize">
                    {selectedOrder.estadoPago || 'N/A'}
                  </p>
                </div>
                {selectedOrder.tipo === 'credito' && (
                  <>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Enganche</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{formatMoney(selectedOrder.enganche || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pago semanal</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{formatMoney(selectedOrder.pagoSemanal || 0)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Lista de pagos */}
          {pagos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos registrados</h3>
              <p className="text-sm text-gray-400">Aún no has realizado ningún pago</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha límite</th>
                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha de pago</th>
                      <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagos.map((pago) => {
                      const status = getPaymentStatus(pago);
                      const StatusIcon = status.icon;
                      return (
                        <tr key={pago.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 font-semibold text-gray-900">
                            {pago.numeroSemana === 0 ? 'Enganche' : `Semana ${pago.numeroSemana || pago.semana || 'N/A'}`}
                          </td>
                          <td className="p-4 font-bold text-gray-900">
                            {formatMoney(pago.estado === 'pagado' ? (pago.montoPagado || pago.montoProgramado || 0) : (pago.montoProgramado || pago.monto || 0))}
                          </td>
                          <td className="p-4 text-sm text-gray-500">{formatDate(pago.fechaVencimiento)}</td>
                          <td className="p-4 text-sm text-gray-500">{pago.fechaPago ? formatDate(pago.fechaPago) : '—'}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                              <StatusIcon size={10} /> {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumen de pagos */}
          {pagos.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#6C3BFF]" /> Resumen
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total pagado</p>
                  <p className="text-xl font-bold text-[#10b981] mt-1">
                    {formatMoney(pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pendiente</p>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {formatMoney(pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Atrasados</p>
                  <p className="text-xl font-bold text-red-500 mt-1">
                    {formatMoney(pagos.filter(p => {
                      if (p.estado === 'pagado') return false;
                      return new Date(p.fechaVencimiento) < new Date();
                    }).reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pagos realizados</p>
                  <p className="text-xl font-bold text-[#6C3BFF] mt-1">
                    {pagos.filter(p => p.estado === 'pagado').length} / {pagos.length}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </StoreLayout>
    </>
  );
}