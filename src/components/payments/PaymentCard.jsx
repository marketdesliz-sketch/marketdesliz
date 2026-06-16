// src/components/payments/PaymentCard.jsx
import { useState } from 'react';

export default function PaymentCard({ payment, onPay, onViewDetails }) {
  const [expanded, setExpanded] = useState(false);

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
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

  const getStatusInfo = (estado) => {
    const statusMap = {
      'pagado': { label: 'Pagado', color: 'bg-green-100 text-green-800', icon: '✅' },
      'pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      'atrasado': { label: 'Atrasado', color: 'bg-red-100 text-red-800', icon: '⚠️' },
      'parcial': { label: 'Parcial', color: 'bg-blue-100 text-blue-800', icon: '🔹' }
    };
    return statusMap[estado] || { label: estado || 'Desconocido', color: 'bg-gray-100 text-gray-800', icon: '📋' };
  };

  const status = getStatusInfo(payment.estado);
  const isOverdue = (payment.estado === 'pendiente' || payment.estado === 'atrasado') && 
    payment.fechaVencimiento && new Date(payment.fechaVencimiento) < new Date();
  
  const montoMostrar = payment.estado === 'pagado' 
    ? (payment.montoPagado || payment.montoProgramado || 0)
    : (payment.montoProgramado || payment.monto || 0);
  
  const numeroSemana = payment.numeroSemana !== undefined ? payment.numeroSemana : payment.semana;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-gray-900">
              {numeroSemana === 0 ? '🔑 Enganche' : `Pago Semana ${numeroSemana || '?'}`}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Vence: {formatDate(payment.fechaVencimiento)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[#6C3BFF]">{formatMoney(montoMostrar)}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${status.color}`}>
              <span>{status.icon}</span>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Orden ID</p>
            <p className="font-mono text-xs">{payment.orderId?.slice(-8) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Cliente</p>
            <p className="font-medium truncate">{payment.expand?.userId?.nombre || 'Cliente'}</p>
          </div>
        </div>

        {isOverdue && (
          <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span>⚠️</span> Este pago está atrasado. Realiza el pago lo antes posible.
            </p>
          </div>
        )}

        {payment.estado === 'pagado' && payment.fechaPago && (
          <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600">
              ✅ Pagado el {formatDate(payment.fechaPago)}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          {(payment.estado === 'pendiente' || payment.estado === 'atrasado') && onPay && (
            <button
              onClick={() => onPay(payment)}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              💰 Pagar ahora
            </button>
          )}
          <button
            onClick={() => onViewDetails?.(payment)}
            className={`${(payment.estado === 'pendiente' || payment.estado === 'atrasado') && onPay ? 'flex-1' : 'w-full'} bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition`}
          >
            Ver detalles
          </button>
        </div>
      </div>

      {/* Expandible para más detalles */}
      {expanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-2">Detalles adicionales</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">Monto programado:</span>{' '}
              {formatMoney(payment.montoProgramado || payment.monto || 0)}
            </p>
            {payment.estado === 'pagado' && (
              <p>
                <span className="text-gray-500">Monto pagado:</span>{' '}
                {formatMoney(payment.montoPagado || payment.montoProgramado || 0)}
              </p>
            )}
            <p>
              <span className="text-gray-500">Fecha de pago:</span>{' '}
              {payment.fechaPago ? formatDate(payment.fechaPago) : 'No pagado'}
            </p>
            <p>
              <span className="text-gray-500">Método de pago:</span>{' '}
              <span className="capitalize">{payment.metodoPago || 'No especificado'}</span>
            </p>
            {payment.cobradorId && (
              <p>
                <span className="text-gray-500">Cobrador ID:</span>{' '}
                <span className="font-mono text-xs">{payment.cobradorId.slice(-8)}</span>
              </p>
            )}
            {(payment.notasAdmin || payment.notas) && (
              <p>
                <span className="text-gray-500">Notas:</span>{' '}
                {payment.notasAdmin || payment.notas}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botón para expandir */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-2 text-center text-xs text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100"
      >
        {expanded ? '▲ Ver menos' : '▼ Ver más detalles'}
      </button>
    </div>
  );
}