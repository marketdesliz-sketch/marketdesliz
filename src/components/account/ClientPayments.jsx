// src/components/account/ClientPayments.jsx
import { useState } from 'react';
import { DollarSign, CheckCircle, Clock, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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

export default function ClientPayments({ payments = [] }) {
  const [showAll, setShowAll] = useState(false);
  const displayPayments = showAll ? payments : payments.slice(0, 5);

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign size={28} className="text-gray-300" />
          </div>
          <h4 className="font-medium text-gray-900 mb-2">Sin pagos</h4>
          <p className="text-sm text-gray-400">Este cliente aún no tiene pagos registrados.</p>
        </div>
      </div>
    );
  }

  const totalPagado = payments.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
  const totalPendiente = payments.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado').reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <DollarSign size={18} className="text-[#6C3BFF]" />
          Pagos
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{payments.length}</span>
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#10b981] font-medium">{formatMoney(totalPagado)} pagado</span>
          <span className="text-amber-600 font-medium">{formatMoney(totalPendiente)} pendiente</span>
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {displayPayments.map((payment) => {
          const status = getPaymentStatus(payment);
          const StatusIcon = status.icon;
          const esEnganche = payment.numeroSemana === 0;

          return (
            <div key={payment.id} className="p-4 hover:bg-gray-50/50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {esEnganche ? 'Enganche' : `Semana ${payment.numeroSemana || payment.semana || 'N/A'}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vence: {formatDate(payment.fechaVencimiento)}
                    {payment.fechaPago && ` • Pagado: ${formatDate(payment.fechaPago)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatMoney(payment.estado === 'pagado' ? (payment.montoPagado || payment.montoProgramado || 0) : (payment.montoProgramado || payment.monto || 0))}
                  </p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                    <StatusIcon size={10} /> {status.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
        {payments.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-[#6C3BFF] font-medium hover:underline"
          >
            {showAll ? 'Mostrar menos' : `Ver ${payments.length - 5} más`}
          </button>
        )}
        <Link
          href={`/admin/pagos?cliente=${payments[0]?.userId}`}
          className="text-xs text-[#6C3BFF] font-medium flex items-center gap-1 hover:gap-2 transition-all ml-auto"
        >
          Ver todos los pagos <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}