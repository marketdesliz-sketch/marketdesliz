// src/components/checkout/TransferenciaModal.jsx
import { useState } from 'react';
import pb from '../../lib/pocketbase';

export default function TransferenciaModal({ orderData, product, onClose, onComprobanteEnviado }) {
  const [comprobante, setComprobante] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const esContado = orderData.tipoSolicitud === 'contado';
  const montoPagar = esContado ? orderData.totalPrice : orderData.downPayment;
  const LIMITE_SEMANAL = 3500;

  const handleComprobanteChange = (e) => {
    const file = e.target.files[0];
    setError('');
    
    if (!file) {
      setComprobante(null);
      setComprobantePreview(null);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe exceder los 5MB');
      e.target.value = '';
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG, WEBP o PDF');
      e.target.value = '';
      return;
    }
    
    setComprobante(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setComprobantePreview(null);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // ✅ Verificar límite de transferencia semanal
    try {
      const hoy = new Date();
      const diaSemana = hoy.getDay();
      
      // Inicio de semana (lunes)
      const inicioSemana = new Date(hoy);
      const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;
      inicioSemana.setDate(hoy.getDate() - diasDesdeLunes);
      inicioSemana.setHours(0, 0, 0, 0);
      
      // Fin de semana (domingo)
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);

      const pagosSemana = await pb.collection('payments').getFullList({
        filter: `metodoPago = "transferencia" && fechaPago >= "${inicioSemana.toISOString()}" && fechaPago <= "${finSemana.toISOString()}"`
      });

      const total = pagosSemana.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
      
      if ((total + montoPagar) > LIMITE_SEMANAL) {
        setError(`⚠️ Límite de transferencia semanal excedido ($${LIMITE_SEMANAL.toLocaleString()}).\n\nYa se ha transferido $${total.toLocaleString()} esta semana.\n\nPor favor usa el método de pago con QR del vendedor.`);
        return;
      }
    } catch (err) {
      console.warn('Error verificando límite de transferencia:', err.message);
      // Si hay error verificando, permitir continuar
    }
    
    if (!comprobante) {
      setError('Por favor selecciona el comprobante de pago');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('comprobante', comprobante);
      formData.append('mensaje', mensaje.trim() || `Transferencia para ${product?.nombre || 'producto'}`);
      formData.append('estado', 'pendiente_validacion');

      const comprobanteRecord = await pb.collection('comprobantes').create(formData);
      
      sessionStorage.setItem('comprobanteId', comprobanteRecord.id);
      
      onComprobanteEnviado(comprobanteRecord.id);
      
    } catch (err) {
      console.error('Error subiendo comprobante:', err);
      setError('Error al subir el comprobante. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const referencia = `MDZ-${(product?.id || '').substring(0, 6)}-${Date.now().toString().slice(-6)}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-gray-900">
            🏦 Transferencia bancaria
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
          {/* Datos bancarios */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span>🏦</span> Datos para transferir
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Banco:</span>
                <span className="font-medium">BBVA México</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CLABE:</span>
                <span className="font-mono font-medium">0123 4567 8901 2345 67</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Beneficiario:</span>
                <span className="font-medium">MarketDesliz S.A. de C.V.</span>
              </div>
              <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
                <span className="text-gray-700 font-semibold">Monto a transferir:</span>
                <span className="font-bold text-blue-700 text-lg">{formatMoney(montoPagar)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Concepto:</span>
                <span className="font-mono text-xs">{referencia}</span>
              </div>
            </div>
          </div>

          {/* Resumen del producto */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase">Producto</p>
                <p className="font-semibold text-sm">{product?.nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">
                  {esContado ? 'Precio contado' : 'Enganche'}
                </p>
                <p className="font-bold text-purple-600">{formatMoney(montoPagar)}</p>
              </div>
            </div>
            {!esContado && orderData.totalPrice && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                <span>Total del crédito: {formatMoney(orderData.totalPrice)}</span>
                <span className="mx-2">•</span>
                <span>{formatMoney(orderData.weeklyAmount)}/sem x {orderData.totalWeeks} sem</span>
              </div>
            )}
          </div>

          {/* Aviso de límite semanal */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <span>💡</span>
              <span>Límite de transferencia: <strong>$3,500 MXN por semana</strong>. Si excedes este monto, deberás usar QR del vendedor.</span>
            </p>
          </div>

          {/* Subir comprobante */}
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-2">
              📎 Comprobante de pago <span className="text-red-500">*</span>
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition cursor-pointer"
              onClick={() => document.getElementById('comprobanteInput').click()}
            >
              {comprobantePreview ? (
                <img 
                  src={comprobantePreview} 
                  alt="Vista previa" 
                  className="max-h-40 rounded-lg mx-auto mb-2"
                />
              ) : comprobante ? (
                <div className="text-center">
                  <span className="text-4xl">📄</span>
                  <p className="text-sm text-gray-600 mt-2">{comprobante.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-4xl">📁</span>
                  <p className="text-sm text-gray-500 mt-2">Click para seleccionar archivo</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WEBP, PDF (max 5MB)</p>
                </div>
              )}
            </div>
            
            <input
              id="comprobanteInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleComprobanteChange}
              className="hidden"
            />
            
            {comprobante && (
              <button
                onClick={() => {
                  setComprobante(null);
                  setComprobantePreview(null);
                  document.getElementById('comprobanteInput').value = '';
                }}
                className="text-xs text-red-500 hover:text-red-700 mt-2"
              >
                Eliminar archivo
              </button>
            )}
          </div>

          {/* Mensaje adicional */}
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-2">
              💬 Mensaje adicional <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows="2"
              maxLength={200}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
              placeholder="Ej: Transferencia realizada el día de hoy a las 10:30 am..."
            />
            <p className="text-xs text-gray-400 text-right mt-1">{mensaje.length}/200</p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2 whitespace-pre-line">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Aviso importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <span>⏳</span>
              <span>Una vez que subas tu comprobante, el administrador validará tu pago en un plazo de <strong>24 horas</strong>.</span>
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              ← Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={!comprobante || loading}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                !comprobante || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner-small"></span>
                  Subiendo...
                </span>
              ) : (
                'Enviar comprobante'
              )}
            </button>
          </div>
        </div>

        <style>{`
          .spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            display: inline-block;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}