// src/components/checkout/MetodoPagoModal.jsx
import { useState, useEffect } from 'react';
import pb from '../../lib/pocketbase';

export default function MetodoPagoModal({ product, orderData, onClose, onMetodoSeleccionado }) {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);
  const [error, setError] = useState('');
  const [limiteTransferencia, setLimiteTransferencia] = useState(false);
  const [totalSemanal, setTotalSemanal] = useState(0);
  const LIMITE_SEMANAL = 3500;

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleContinuar = () => {
    if (!metodoSeleccionado) {
      setError('Por favor selecciona un método de pago');
      return;
    }
    setError('');
    onMetodoSeleccionado(metodoSeleccionado);
  };

  const handleSeleccionar = (metodo) => {
    if (metodo === 'transferencia' && limiteTransferencia) {
      setError(`Límite de transferencia semanal alcanzado ($${LIMITE_SEMANAL.toLocaleString()}). Total esta semana: $${totalSemanal.toLocaleString()}. Usa QR.`);
      return;
    }
    setMetodoSeleccionado(metodo);
    setError('');
  };

  // Calcular montos según tipo de solicitud
  const esContado = orderData.tipoSolicitud === 'contado';
  const esCredito = orderData.tipoSolicitud === 'credito';
  
  const montoPagar = esContado 
    ? orderData.totalPrice
    : orderData.downPayment;

  // Verificar límite de transferencia semanal
  useEffect(() => {
    const verificarLimiteTransferencia = async () => {
      try {
        // Calcular inicio y fin de la semana actual (lunes a domingo)
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes...
        
        // Inicio de semana (lunes)
        const inicioSemana = new Date(hoy);
        const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        inicioSemana.setDate(hoy.getDate() - diasDesdeLunes);
        inicioSemana.setHours(0, 0, 0, 0);
        
        // Fin de semana (domingo)
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        finSemana.setHours(23, 59, 59, 999);

        // Buscar pagos con transferencia de esta semana
        const pagosSemana = await pb.collection('payments').getFullList({
          filter: `metodoPago = "transferencia" && fechaPago >= "${inicioSemana.toISOString()}" && fechaPago <= "${finSemana.toISOString()}"`
        });

        // Sumar montos
        const total = pagosSemana.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
        setTotalSemanal(total);

        // Verificar si con el nuevo pago se excede el límite
        const nuevoTotal = total + montoPagar;
        if (nuevoTotal > LIMITE_SEMANAL) {
          setLimiteTransferencia(true);
        }
      } catch (err) {
        console.warn('Error verificando límite de transferencia:', err.message);
      }
    };

    verificarLimiteTransferencia();
  }, [montoPagar]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-gray-900">
            {esContado ? '💳 Pago de contado' : '💳 Pago de enganche'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl transition"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* Resumen del pago */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 mb-6 border border-purple-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Producto</p>
                <p className="font-semibold text-gray-900">{product?.nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {esContado ? 'Precio de contado' : 'Enganche a pagar'}
                </p>
                <p className="font-bold text-purple-600 text-xl">{formatMoney(montoPagar)}</p>
              </div>
            </div>
            
            {/* Detalles de crédito */}
            {esCredito && (
              <div className="mt-3 pt-3 border-t border-purple-200 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio total del producto:</span>
                  <span className="font-medium">{formatMoney(orderData.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Enganche ({Math.round((orderData.downPayment / orderData.totalPrice) * 100)}%):</span>
                  <span className="font-medium text-purple-600">{formatMoney(orderData.downPayment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pago semanal:</span>
                  <span className="font-medium">{formatMoney(orderData.weeklyAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Semanas totales:</span>
                  <span className="font-medium">{orderData.totalWeeks}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-purple-200">
                  <span className="text-gray-700 font-semibold">Total financiado:</span>
                  <span className="font-bold text-purple-600">{formatMoney(orderData.totalPrice)}</span>
                </div>
              </div>
            )}

            {/* Detalles de contado */}
            {esContado && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio de lista:</span>
                  <span className="text-gray-400 line-through">{formatMoney(product?.precio)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuento por contado:</span>
                  <span className="font-medium text-green-600">
                    -{formatMoney((product?.precio || 0) - montoPagar)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Opción 1: QR del vendedor */}
          <div 
            onClick={() => handleSeleccionar('qr_vendedor')}
            className={`border-2 rounded-xl p-4 mb-4 cursor-pointer transition-all duration-200 ${
              metodoSeleccionado === 'qr_vendedor' 
                ? 'border-purple-600 bg-purple-50 shadow-md' 
                : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                metodoSeleccionado === 'qr_vendedor' ? 'bg-purple-600' : 'bg-purple-100'
              }`}>
                <span className="text-2xl">📱</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Pagar con QR del vendedor</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Escanea el código QR del vendedor autorizado. El vendedor validará tu compra al instante.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Validación inmediata</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Seguro</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">✓ Sin comprobante</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Sin límite</span>
                </div>
              </div>
              {metodoSeleccionado === 'qr_vendedor' && (
                <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </div>
          </div>

          {/* Opción 2: Transferencia bancaria */}
          <div 
            onClick={() => handleSeleccionar('transferencia')}
            className={`border-2 rounded-xl p-4 mb-4 transition-all duration-200 ${
              limiteTransferencia 
                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                : metodoSeleccionado === 'transferencia' 
                  ? 'border-purple-600 bg-purple-50 shadow-md cursor-pointer' 
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                limiteTransferencia 
                  ? 'bg-gray-300' 
                  : metodoSeleccionado === 'transferencia' 
                    ? 'bg-purple-600' 
                    : 'bg-blue-100'
              }`}>
                <span className="text-2xl">🏦</span>
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${limiteTransferencia ? 'text-gray-400' : 'text-gray-900'}`}>
                  Transferencia bancaria
                  {limiteTransferencia && (
                    <span className="text-xs text-red-500 ml-2 bg-red-50 px-2 py-0.5 rounded-full">Límite alcanzado</span>
                  )}
                </h3>
                <p className={`text-sm mt-1 ${limiteTransferencia ? 'text-gray-400' : 'text-gray-500'}`}>
                  {limiteTransferencia 
                    ? `Límite semanal de $${LIMITE_SEMANAL.toLocaleString()} alcanzado. Ya se transfirió $${totalSemanal.toLocaleString()} esta semana.`
                    : 'Realiza una transferencia a nuestra cuenta bancaria. Recibirás los datos al continuar.'
                  }
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {limiteTransferencia ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚫 Límite $3,500/semana</span>
                  ) : (
                    <>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Comprobante digital</span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ Validación 24h</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">🏦 SPEI</span>
                    </>
                  )}
                </div>
                {!limiteTransferencia && (
                  <div className="mt-2 text-xs text-gray-400">
                    💡 Límite semanal: ${LIMITE_SEMANAL.toLocaleString()} · Transferido esta semana: ${totalSemanal.toLocaleString()}
                  </div>
                )}
              </div>
              {metodoSeleccionado === 'transferencia' && !limiteTransferencia && (
                <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Información importante */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
            <p className="font-semibold mb-1">📌 Información importante:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>El pago del enganche es necesario para apartar tu producto</li>
              <li>Los pagos semanales inician la próxima semana</li>
              <li>Días de pago: <strong>Lunes y Martes</strong></li>
              <li>Transferencia: máximo <strong>$3,500 MXN por semana</strong></li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              ← Cancelar
            </button>
            <button
              onClick={handleContinuar}
              disabled={!metodoSeleccionado}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                metodoSeleccionado 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {metodoSeleccionado ? 'Continuar →' : 'Selecciona un método'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}