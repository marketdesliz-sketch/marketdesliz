// src/components/payments/PaymentHistory.jsx
import { useState } from 'react';
import PaymentCard from './PaymentCard';

export default function PaymentHistory({ payments, onPay, loading, title = 'Historial de pagos' }) {
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMontoPago = (p) => {
    if (p.estado === 'pagado') return p.montoPagado || p.montoProgramado || 0;
    return p.montoProgramado || p.monto || 0;
  };

  const getFilteredPayments = () => {
    let filtered = [...payments];

    if (filter !== 'todos') {
      filtered = filtered.filter(p => p.estado === filter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.expand?.userId?.nombre?.toLowerCase().includes(term) ||
        p.id?.toLowerCase().includes(term) ||
        p.orderId?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const estadisticas = {
    total: payments.length,
    pagados: payments.filter(p => p.estado === 'pagado').length,
    pendientes: payments.filter(p => p.estado === 'pendiente').length,
    atrasados: payments.filter(p => p.estado === 'atrasado').length,
    parciales: payments.filter(p => p.estado === 'parcial').length,
    totalMonto: payments.reduce((sum, p) => sum + getMontoPago(p), 0),
    montoPagado: payments.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + getMontoPago(p), 0),
    montoPendiente: payments.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado').reduce((sum, p) => sum + getMontoPago(p), 0)
  };

  const filteredPayments = getFilteredPayments();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6C3BFF] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Total: {estadisticas.total} pagos
          {estadisticas.parciales > 0 && ` · ${estadisticas.parciales} parciales`}
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Total pagado</p>
          <p className="text-lg font-bold text-green-600">{formatMoney(estadisticas.montoPagado)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Pendiente</p>
          <p className="text-lg font-bold text-yellow-600">{formatMoney(estadisticas.montoPendiente)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Pagados</p>
          <p className="text-lg font-bold text-green-600">{estadisticas.pagados}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Atrasados</p>
          <p className="text-lg font-bold text-red-600">{estadisticas.atrasados}</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'todos', label: 'Todos', count: estadisticas.total },
            { key: 'pendiente', label: 'Pendientes', count: estadisticas.pendientes },
            { key: 'pagado', label: 'Pagados', count: estadisticas.pagados },
            { key: 'atrasado', label: 'Atrasados', count: estadisticas.atrasados },
            { key: 'parcial', label: 'Parciales', count: estadisticas.parciales }
          ].filter(f => f.count > 0 || f.key === 'todos').map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f.key 
                  ? 'bg-[#6C3BFF] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o ID..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💰</div>
            <p className="text-gray-500">No hay pagos registrados</p>
            {filter !== 'todos' && (
              <button
                onClick={() => setFilter('todos')}
                className="text-sm text-[#6C3BFF] hover:underline mt-2"
              >
                Mostrar todos los pagos
              </button>
            )}
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onPay={onPay}
              onViewDetails={(p) => console.log('Ver detalles:', p)}
            />
          ))
        )}
      </div>

      {/* Resumen de pagos */}
      {filteredPayments.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Mostrando {filteredPayments.length} de {payments.length} pagos
            </span>
            <span className="font-medium">
              Total: {formatMoney(
                filteredPayments.reduce((sum, p) => sum + getMontoPago(p), 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}