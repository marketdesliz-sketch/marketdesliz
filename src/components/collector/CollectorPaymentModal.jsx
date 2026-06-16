// src/components/collector/CollectorPaymentModal.jsx
import { useState } from 'react';

export default function CollectorPaymentModal({ 
  payment, 
  clientName, 
  onClose, 
  onConfirm, 
  processing 
}) {
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');
  const [confirmStep, setConfirmStep] = useState(1);

  if (!payment) return null;

  const handleConfirm = () => {
    if (confirmStep === 1) {
      setConfirmStep(2);
    } else {
      onConfirm({
        ...payment,
        paymentMethod,
        notes,
        collectedAt: new Date().toISOString()
      });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getMetodoIcon = (method) => {
    const icons = {
      efectivo: '💵',
      tarjeta: '💳',
      transferencia: '🏦',
      qr: '📱'
    };
    return icons[method] || '💰';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-slide-up">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">
              {confirmStep === 1 ? 'Registrar pago' : 'Confirmar pago'}
            </h3>
            <button
              onClick={onClose}
              disabled={processing}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Información del pago */}
          <div className="bg-[#F3F0FF] p-4 rounded-xl mb-6">
            <p className="text-sm text-gray-600 mb-1">Cliente</p>
            <p className="font-bold text-lg mb-3">{clientName}</p>
            
            {payment.concept && (
              <>
                <p className="text-sm text-gray-600 mb-1">Concepto</p>
                <p className="font-semibold text-gray-800 mb-3">{payment.concept}</p>
              </>
            )}
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monto a cobrar</p>
                <p className="text-2xl font-bold text-[#6C3BFF]">
                  {formatCurrency(payment.amount || payment.monto || payment.montoProgramado || 0)}
                </p>
              </div>
              
              <div className="text-right">
                {payment.numeroSemana !== undefined && (
                  <>
                    <p className="text-sm text-gray-600 mb-1">
                      {payment.numeroSemana === 0 ? 'Enganche' : `Semana ${payment.numeroSemana}`}
                    </p>
                    <p className="font-bold text-gray-800">
                      {payment.numeroSemana === 0 ? '🔑' : `#${payment.numeroSemana}`}
                    </p>
                  </>
                )}
                {payment.semana !== undefined && payment.numeroSemana === undefined && (
                  <>
                    <p className="text-sm text-gray-600 mb-1">
                      {payment.semana === 0 ? 'Enganche' : `Semana ${payment.semana}`}
                    </p>
                    <p className="font-bold text-gray-800">
                      {payment.semana === 0 ? '🔑' : `#${payment.semana}`}
                    </p>
                  </>
                )}
              </div>
            </div>

            {payment.fechaVencimiento && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vencimiento:</span>
                  <span className={`font-medium ${new Date(payment.fechaVencimiento) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatDate(payment.fechaVencimiento)}
                    {new Date(payment.fechaVencimiento) < new Date() && ' (ATRASADO)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {confirmStep === 1 ? (
            /* Paso 1: Detalles del pago */
            <>
              {/* Método de pago */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: '💵' },
                    { id: 'transferencia', label: 'Transferencia', icon: '🏦' },
                    { id: 'qr', label: 'QR', icon: '📱' },
                    { id: 'tarjeta', label: 'Tarjeta', icon: '💳' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                        paymentMethod === method.id
                          ? 'border-[#6C3BFF] bg-[#F3F0FF] text-[#6C3BFF]'
                          : 'border-gray-200 hover:border-[#6C3BFF] hover:bg-gray-50'
                      }`}
                    >
                      <span>{method.icon}</span>
                      <span className="capitalize text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar comentarios sobre el pago..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#6C3BFF] focus:ring-1 focus:ring-[#6C3BFF] outline-none transition resize-none"
                  rows="3"
                  maxLength={150}
                />
                <p className="text-xs text-gray-400 text-right mt-1">{notes.length}/150</p>
              </div>
            </>
          ) : (
            /* Paso 2: Confirmación */
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-green-800 mb-1">¿Confirmar pago?</p>
                  <p className="text-sm text-green-700">
                    Se registrará un pago de <strong>{formatCurrency(payment.amount || payment.monto || payment.montoProgramado || 0)}</strong>
                  </p>
                  {payment.concept && (
                    <p className="text-sm text-green-700 mt-1">
                      Concepto: <strong>{payment.concept}</strong>
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full capitalize">
                      {getMetodoIcon(paymentMethod)} {paymentMethod}
                    </span>
                    {notes && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                        📝 Con notas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            {confirmStep === 1 ? (
              <>
                <button
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#6C3BFF] text-white py-3 rounded-lg hover:bg-[#5A2FE0] transition-colors font-medium"
                >
                  Continuar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setConfirmStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  disabled={processing}
                >
                  ← Volver
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmar pago
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Mensaje de advertencia */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Esta acción registrará el pago permanentemente.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}