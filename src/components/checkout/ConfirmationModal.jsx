// src/components/checkout/ConfirmationModal.jsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, ChevronRight, ArrowLeft, AlertTriangle, Loader } from 'lucide-react';
import pb from '../../lib/pocketbase';

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Por definir';
  return new Date(dateString).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

export default function ConfirmationModal({ orderId, type, productName, onClose }) {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) loadOrderDetails();
    else setLoading(false);
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const order = await pb.collection('orders').getOne(orderId, { expand: 'userId,productId,vendedorId' });
      setOrderDetails(order);
      if (order.tipo === 'credito') {
        try {
          const pagosList = await pb.collection('payments').getFullList({ filter: `orderId = "${orderId}"`, sort: 'numeroSemana' });
          setPayments(pagosList);
        } catch (e) { console.warn('No se pudieron cargar los pagos:', e.message); }
      }
    } catch (error) { console.error('Error cargando orden:', error); }
    finally { setLoading(false); }
  };

  const titles = {
    contado: '¡Producto apartado!', credito: '¡Crédito aprobado!',
    visita: '¡Visita agendada!', entrega: '¡Entrega agendada!'
  };
  const messages = {
    contado: `Tu producto "${productName}" ha sido apartado exitosamente.`,
    credito: `Tu crédito para "${productName}" ha sido aprobado. El cobrador te visitará pronto.`,
    visita: `Hemos agendado la visita para mostrarte "${productName}".`,
    entrega: `Hemos agendado la entrega de "${productName}".`
  };
  const nextSteps = {
    contado: ['Realiza el pago de contado', 'Muestra este comprobante al vendedor', 'Recibe tu producto', 'Califica tu experiencia'],
    credito: ['Realiza el pago del enganche', 'Un cobrador te visitará en tu domicilio', 'Recibirás tu tarjeta MarketDesliz', 'Realiza tus pagos semanales puntualmente', 'Mantén tus pagos al día para subir de nivel'],
    visita: ['Un asesor se pondrá en contacto contigo', 'Confirmará la fecha y hora de visita', 'Irá a tu domicilio a mostrarte el producto', 'Podrás decidir la compra después de la visita'],
    entrega: ['Un asesor se pondrá en contacto contigo', 'Confirmará la fecha y hora de entrega', 'Llevarán el producto a tu domicilio', 'Podrás pagar al recibir el producto']
  };

  const getDiaPago = () => {
    if (orderDetails?.fechaProximoPago) {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return days[new Date(orderDetails.fechaProximoPago).getDay()];
    }
    return 'Lunes o Martes';
  };

  const handleVerCuenta = () => { router.push('/perfil'); onClose?.(); };
  const handleVolverProductos = () => { router.push('/productos'); onClose?.(); };
  const handleVerPagos = () => { router.push('/perfil?tab=pagos'); onClose?.(); };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-10 text-center shadow-2xl">
          <Loader size={40} className="text-[#6C3BFF] animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Cargando detalles de tu solicitud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-7">

          {/* Ícono de éxito */}
          <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#10b981]/30">
            <CheckCircle size={32} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            {titles[type] || '¡Solicitud completada!'}
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            {messages[type] || 'Tu solicitud ha sido procesada exitosamente.'}
          </p>

          {/* Detalles de la orden */}
          {orderDetails && (type === 'contado' || type === 'credito') && (
            <div className="bg-[#6C3BFF]/5 rounded-2xl p-4 border border-[#6C3BFF]/10 mb-4 space-y-2">
              <p className="text-xs font-bold text-[#6C3BFF] uppercase tracking-wide mb-3">Detalles de tu solicitud</p>

              {[
                ['Producto', productName || orderDetails.expand?.productId?.nombre || 'Producto'],
                ['Tipo', type === 'contado' ? 'Contado' : 'Crédito'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-700">{value}</span>
                </div>
              ))}

              {type === 'contado' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Precio de lista</span>
                    <span className="text-gray-400 line-through">{formatMoney(orderDetails.precioOriginal)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-[#6C3BFF]/10">
                    <span className="font-bold text-gray-800">Total a pagar</span>
                    <span className="font-bold text-[#10b981] text-base">{formatMoney(orderDetails.totalPagar)}</span>
                  </div>
                </>
              )}

              {type === 'credito' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Precio del producto</span>
                    <span className="font-medium text-gray-700">{formatMoney(orderDetails.precioOriginal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Enganche</span>
                    <span className="font-bold text-[#6C3BFF]">{formatMoney(orderDetails.enganche)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pago semanal</span>
                    <span className="font-medium text-gray-700">{formatMoney(orderDetails.pagoSemanal)} × {orderDetails.semanasTotales} semanas</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Día de pago</span>
                    <span className="font-medium text-gray-700">{getDiaPago()}</span>
                  </div>
                  {orderDetails.fechaProximoPago && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Primer pago</span>
                      <span className="font-medium text-gray-700">{formatDate(orderDetails.fechaProximoPago)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-[#6C3BFF]/10">
                    <span className="font-bold text-gray-800">Total a pagar</span>
                    <span className="font-bold text-[#6C3BFF] text-base">{formatMoney(orderDetails.totalPagar)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 text-right font-mono">
                    #{orderId?.substring(0, 12)?.toUpperCase()}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Calendario de pagos */}
          {type === 'credito' && payments.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Calendar size={13} /> Calendario de pagos
              </p>
              <div className="max-h-36 overflow-y-auto space-y-2">
                {payments.slice(0, 6).map((pago, index) => (
                  <div key={pago.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        {pago.numeroSemana === 0 ? 'Enganche' : `Semana ${pago.numeroSemana}`}
                      </span>
                      {pago.fechaVencimiento && (
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(pago.fechaVencimiento).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[#6C3BFF]">{formatMoney(pago.montoProgramado)}</span>
                  </div>
                ))}
                {payments.length > 6 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+ {payments.length - 6} pagos más</p>
                )}
              </div>
            </div>
          )}

          {/* Próximos pasos */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Próximos pasos</p>
            <ol className="space-y-2.5">
              {(nextSteps[type] || ['Revisa tu perfil para más información']).map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-500 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-[#6C3BFF] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {/* Recordatorio crédito */}
          {type === 'credito' && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-5 text-xs text-amber-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <p>Los pagos son <strong>cada 8 días</strong>. Un cobrador te visitará en tu domicilio. Mantén tus pagos al día para <strong>subir de nivel</strong> y acceder a más beneficios.</p>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-2.5">
            {type === 'credito' && (
              <button
                onClick={handleVerPagos}
                className="w-full py-3 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                Ver mi plan de pagos <ChevronRight size={16} />
              </button>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleVolverProductos}
                className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={15} /> Seguir viendo
              </button>
              <button
                onClick={handleVerCuenta}
                className="py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                Ver mi cuenta <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}