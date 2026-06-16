// src/components/account/ClientOrders.jsx
import { useState } from 'react';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

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

const getStatusInfo = (estado) => {
  const statusMap = {
    'pendiente_pago': { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
    'activa': { label: 'Activa', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: CheckCircle },
    'completada': { label: 'Completada', color: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20', icon: CheckCircle },
    'cancelada': { label: 'Cancelada', color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle }
  };
  return statusMap[estado] || { label: estado, color: 'bg-gray-50 text-gray-600 border-gray-100', icon: AlertCircle };
};

export default function ClientOrders({ orders = [] }) {
  const [filter, setFilter] = useState('todas');

  const getFilteredOrders = () => {
    if (filter === 'activas') {
      return orders.filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago');
    }
    if (filter === 'completadas') {
      return orders.filter(o => o.estadoPago === 'completada');
    }
    return orders;
  };

  const filteredOrders = getFilteredOrders();

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-gray-300" />
          </div>
          <h4 className="font-medium text-gray-900 mb-2">Sin órdenes</h4>
          <p className="text-sm text-gray-400">Este cliente aún no tiene órdenes registradas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Package size={18} className="text-[#6C3BFF]" />
          Órdenes
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{orders.length}</span>
        </h3>
        <div className="flex gap-1">
          {['todas', 'activas', 'completadas'].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-2.5 py-1 text-xs rounded-lg transition ${
                filter === opt
                  ? 'bg-[#6C3BFF] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt === 'todas' ? 'Todas' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            No hay órdenes {filter === 'activas' ? 'activas' : filter === 'completadas' ? 'completadas' : ''}
          </div>
        ) : (
          filteredOrders.map((orden) => {
            const status = getStatusInfo(orden.estadoPago);
            const StatusIcon = status.icon;
            const esCredito = orden.tipo === 'credito';
            const total = esCredito
              ? (orden.enganche || 0) + ((orden.pagoSemanal || 0) * (orden.semanasTotales || 0))
              : orden.totalPagar;

            return (
              <div key={orden.id} className="p-4 hover:bg-gray-50/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {orden.expand?.productId?.nombre || orden.productName || 'Producto'}
                      </p>
                      {esCredito ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                          <CreditCard size={10} /> Crédito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded-full">
                          <DollarSign size={10} /> Contado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">{formatDate(orden.created)}</p>
                      <p className="text-xs font-bold text-[#6C3BFF]">{formatMoney(total)}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                    <StatusIcon size={10} /> {status.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
        <Link
          href={`/admin/ordenes?cliente=${orders[0]?.userId}`}
          className="text-xs text-[#6C3BFF] font-medium flex items-center justify-center gap-1 hover:gap-2 transition-all"
        >
          Ver todas las órdenes <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}"// Updated $(date)" 
