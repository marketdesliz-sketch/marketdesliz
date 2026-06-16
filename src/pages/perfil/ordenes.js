// src/pages/perfil/ordenes.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, DollarSign, Calendar } from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function MisOrdenesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas'); // todas, activas, completadas

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const user = pb.authStore.model;

      const ordenesData = await pb.collection('orders').getFullList({
        filter: `userId = "${user.id}"`,
        sort: '-created',
        expand: 'productId'
      });

      setOrdenes(ordenesData);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no definida';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusInfo = (estado, tipoSolicitud) => {
    const statusMap = {
      'pendiente_pago': { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
      'activa': { label: 'Activa', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: CheckCircle },
      'completada': { label: 'Completada', color: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20', icon: CheckCircle },
      'cancelada': { label: 'Cancelada', color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle }
    };
    return statusMap[estado] || { label: estado, color: 'bg-gray-50 text-gray-600 border-gray-100', icon: AlertCircle };
  };

  const getFilteredOrders = () => {
    if (filter === 'activas') {
      return ordenes.filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago');
    }
    if (filter === 'completadas') {
      return ordenes.filter(o => o.estadoPago === 'completada');
    }
    return ordenes;
  };

  const filteredOrdenes = getFilteredOrders();

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
        <title>Mis Órdenes | MarketDesliz</title>
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
                <Package size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mis órdenes</h1>
                <p className="text-sm text-gray-400">Historial completo de tus compras</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-6 border-b border-gray-100">
            <button
              onClick={() => setFilter('todas')}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                filter === 'todas'
                  ? 'border-[#6C3BFF] text-[#6C3BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('activas')}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                filter === 'activas'
                  ? 'border-[#6C3BFF] text-[#6C3BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setFilter('completadas')}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
                filter === 'completadas'
                  ? 'border-[#6C3BFF] text-[#6C3BFF]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completadas
            </button>
          </div>

          {/* Lista de órdenes */}
          {filteredOrdenes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes órdenes</h3>
              <p className="text-sm text-gray-400 mb-6">Aún no has realizado ninguna compra</p>
              <Link href="/productos" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white rounded-xl font-semibold text-sm transition-colors">
                Ver productos <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrdenes.map((orden) => {
                const status = getStatusInfo(orden.estadoPago);
                const StatusIcon = status.icon;
                const esCredito = orden.tipo === 'credito';
                const total = esCredito
                  ? (orden.enganche || 0) + ((orden.pagoSemanal || 0) * (orden.semanasTotales || 0))
                  : orden.totalPagar;

                return (
                  <div key={orden.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">
                            {orden.expand?.productId?.nombre || orden.productName || 'Producto'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {esCredito ? (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                <CreditCard size={10} /> Crédito
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">
                                <DollarSign size={10} /> Contado
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                          <StatusIcon size={10} /> {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-2">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Fecha</p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">{formatDate(orden.created)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
                          <p className="text-base font-bold text-[#6C3BFF] mt-0.5">{formatMoney(total)}</p>
                        </div>
                        {esCredito && (
                          <>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Enganche</p>
                              <p className="text-sm font-medium text-gray-700 mt-0.5">{formatMoney(orden.enganche)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pago semanal</p>
                              <p className="text-sm font-medium text-gray-700 mt-0.5">{formatMoney(orden.pagoSemanal)} <span className="text-gray-400 text-xs">x {orden.semanasTotales} sem</span></p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-gray-100 flex gap-4">
                        <Link
                          href={`/perfil/ordenes/${orden.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[#6C3BFF] hover:gap-2 transition-all"
                        >
                          Ver detalles <ChevronRight size={13} />
                        </Link>
                        {orden.estadoPago === 'activa' && (
                          <Link
                            href={`/perfil/pagos?orden=${orden.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[#10b981] hover:gap-2 transition-all"
                          >
                            Ver pagos <ChevronRight size={13} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </StoreLayout>
    </>
  );
}