// src/pages/solicitar/transferencia.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function TransferenciaPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (!pendingOrder) {
      router.push('/productos');
      return;
    }

    const orderData = JSON.parse(pendingOrder);
    setOrder(orderData);
    cargarProducto(orderData.product);
  }, []);

  const cargarProducto = async (productId) => {
    try {
      const record = await pb.collection('products').getOne(productId);
      setProducto({
        id: record.id,
        nombre: record.nombre,
        precio: record.precio
      });
    } catch (error) {
      console.error('Error cargando producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ✅ CORREGIDO: usar order.product (no productId)
  const getReferencia = () => {
    if (!order) return '';
    return `MD-${order.product?.substring(0, 6) || 'GEN'}-${Date.now().toString().slice(-6)}`;
  };

  if (loading || !order || !producto) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </StoreLayout>
    );
  }

  // ✅ CORREGIDO: usar totalPrice y downPayment
  const montoPagar = (order.tipo || order.tipoSolicitud) === 'contado'
    ? order.totalPrice      // ✅ Usar totalPrice
    : order.downPayment;    // ✅ Usar downPayment

  const clienteNombre = order.clienteData?.nombre || 'Cliente';
  const clienteTelefono = order.clienteData?.telefono || '';
  const clienteColonia = order.clienteData?.colonia || 'No especificada';
  const referencia = getReferencia();
  const montoTexto = formatMoney(montoPagar);

  const whatsappMessage = `Hola, soy ${clienteNombre}%0A` +
    `Teléfono: ${clienteTelefono}%0A` +
    `Colonia: ${clienteColonia}%0A` +
    `Realicé una transferencia por ${montoTexto}%0A` +
    `Referencia: ${referencia}%0A` +
    `Adjunto mi comprobante de pago.`;

  // Número de WhatsApp desde variable de entorno o constante
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '521234567890';

  return (
    <>
      <Head>
        <title>Transferencia | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏦</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Transferencia Bancaria</h1>
            <p className="text-gray-600 mt-2">Realiza tu pago y confirma para activar tu cuenta</p>
          </div>

          {/* Información del pago */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">💰 Monto a pagar</h2>
            <div className="text-center">
              <p className="text-4xl font-bold text-[#6C3BFF]">{formatMoney(montoPagar)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {(order.tipo || order.tipoSolicitud) === 'contado' ? 'Pago de contado' : 'Enganche inicial'}
              </p>
            </div>
          </div>

          {/* Datos bancarios */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏦 Datos de la cuenta</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Banco</p>
                  <p className="font-medium">BBVA México</p>
                </div>
                <button
                  onClick={() => copyToClipboard('BBVA México', 'banco')}
                  className="text-sm text-[#6C3BFF] hover:text-purple-700"
                >
                  {copied === 'banco' ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Beneficiario</p>
                  <p className="font-medium">MarketDesliz S.A. de C.V.</p>
                </div>
                <button
                  onClick={() => copyToClipboard('MarketDesliz S.A. de C.V.', 'beneficiario')}
                  className="text-sm text-[#6C3BFF] hover:text-purple-700"
                >
                  {copied === 'beneficiario' ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">CLABE Interbancaria</p>
                  <p className="font-mono text-sm font-medium">0123 4567 8901 2345 67</p>
                </div>
                <button
                  onClick={() => copyToClipboard('012345678901234567', 'clabe')}
                  className="text-sm text-[#6C3BFF] hover:text-purple-700"
                >
                  {copied === 'clabe' ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Número de cuenta</p>
                  <p className="font-mono text-sm font-medium">1234 5678 9012 3456</p>
                </div>
                <button
                  onClick={() => copyToClipboard('1234567890123456', 'cuenta')}
                  className="text-sm text-[#6C3BFF] hover:text-purple-700"
                >
                  {copied === 'cuenta' ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-xs text-gray-500">Referencia</p>
                  <p className="font-mono text-sm font-medium">{getReferencia()}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(getReferencia(), 'referencia')}
                  className="text-sm text-[#6C3BFF] hover:text-purple-700"
                >
                  {copied === 'referencia' ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* Resumen de la compra */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Resumen de tu compra</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Producto:</span>
                <span className="font-medium">{producto.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span>{order.clienteData?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Teléfono:</span>
                <span>{order.clienteData?.telefono}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Colonia:</span>
                <span>{order.clienteData?.colonia || 'No especificada'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo:</span>
                <span className="capitalize">{(order.tipo || order.tipoSolicitud) === 'contado' ? 'Compra de contado' : 'Compra a crédito'}</span>
              </div>
              {(order.tipo || order.tipoSolicitud) === 'credito' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pagos semanales:</span>
                    {/* ✅ CORREGIDO: usar weeklyAmount y totalWeeks */}
                    <span>{formatMoney(order.weeklyAmount)} x {order.totalWeeks} semanas</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-500 font-medium">Total a pagar:</span>
                    {/* ✅ CORREGIDO: usar downPayment, weeklyAmount y totalWeeks */}
                    <span className="font-bold text-[#6C3BFF]">{formatMoney(order.downPayment + (order.weeklyAmount * order.totalWeeks))}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-yellow-50 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Instrucciones importantes</h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>✓ Realiza la transferencia por el monto exacto</li>
              <li>✓ Usa la referencia proporcionada para identificarte</li>
              <li>✓ Guarda el comprobante de pago</li>
              <li>✓ Envía el comprobante por WhatsApp al 55 1234 5678</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/solicitar/confirmacion"
              className="flex-1 bg-[#6C3BFF] text-white text-center py-3 rounded-lg font-bold hover:bg-purple-700 transition"
            >
              Ya realicé el pago
            </Link>
            <button
              onClick={() => window.location.href = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              className="flex-1 bg-green-600 text-white text-center py-3 rounded-lg font-bold hover:bg-green-700 transition"
            >
              📱 Enviar comprobante por WhatsApp
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Tu cuenta se activará en un plazo máximo de 24 horas después de confirmar tu pago
          </p>
        </div>
      </StoreLayout>

      <style jsx>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #6C3BFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}