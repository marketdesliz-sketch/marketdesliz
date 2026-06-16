// src/pages/checkout.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';
import CheckoutForm from '../components/checkout/CheckoutForm';
import ConfirmationModal from '../components/checkout/ConfirmationModal';

export default function CheckoutPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [confirmationType, setConfirmationType] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [planCalculado, setPlanCalculado] = useState(null);
  const [enganchePorcentaje, setEnganchePorcentaje] = useState(25);
  const [pagoSemanal, setPagoSemanal] = useState(100);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar?redirect=/checkout');
      return;
    }
    setUser(pb.authStore.model);
    
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado && JSON.parse(carritoGuardado).length > 0) {
      const items = JSON.parse(carritoGuardado);
      setCarrito(items);
      prepararCheckoutData(items);
    } else {
      router.push('/carrito');
    }
    setLoading(false);
  }, []);

  const prepararCheckoutData = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + ((item.precio || 0) * (item.cantidad || 1));
    }, 0);
    
    const enganche = Math.round(total * 0.15);
    const saldoRestante = total - enganche;
    const semanas = 12;
    const pagoSemanalMonto = Math.ceil(saldoRestante / semanas);
    const ultimoPago = saldoRestante - (pagoSemanalMonto * (semanas - 1));
    
    const pagos = Array(semanas - 1).fill(pagoSemanalMonto);
    pagos.push(ultimoPago);
    
    setCheckoutData({
      total,
      enganche,
      saldoRestante,
      semanas,
      pagoSemanal: pagoSemanalMonto,
      ultimoPago,
      pagos
    });
    
    setPlanCalculado({
      enganche,
      enganchePorcentaje: 15,
      pagoSemanal: pagoSemanalMonto,
      saldoRestante,
      semanas: pagos.length,
      pagos,
      totalPagar: total,
      ultimoPago
    });
  };

  const handleCheckoutConfirm = (id, type) => {
    setOrderId(id);
    setConfirmationType(type);
    setShowConfirmation(true);
    localStorage.removeItem('carrito');
    window.dispatchEvent(new Event('carritoActualizado'));
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => {
      const precio = item.precio || 0;
      return total + (precio * (item.cantidad || 1));
    }, 0);
  };

  const handleCambiarEnganche = (porcentaje) => {
    setEnganchePorcentaje(porcentaje);
    if (checkoutData) {
      const nuevoEnganche = Math.round(checkoutData.total * porcentaje / 100);
      const nuevoSaldoRestante = checkoutData.total - nuevoEnganche;
      const semanas = checkoutData.semanas;
      const nuevoPagoSemanal = Math.ceil(nuevoSaldoRestante / semanas);
      const nuevoUltimoPago = nuevoSaldoRestante - (nuevoPagoSemanal * (semanas - 1));
      
      const nuevosPagos = Array(semanas - 1).fill(nuevoPagoSemanal);
      nuevosPagos.push(nuevoUltimoPago);
      
      setPlanCalculado({
        enganche: nuevoEnganche,
        enganchePorcentaje: porcentaje,
        pagoSemanal: nuevoPagoSemanal,
        saldoRestante: nuevoSaldoRestante,
        semanas: nuevosPagos.length,
        pagos: nuevosPagos,
        totalPagar: checkoutData.total,
        ultimoPago: nuevoUltimoPago
      });
    }
  };

  const handleCambiarPagoSemanal = (monto) => {
    setPagoSemanal(monto);
    if (checkoutData) {
      const enganche = planCalculado?.enganche || Math.round(checkoutData.total * 0.15);
      const saldoRestante = checkoutData.total - enganche;
      const semanasCompletas = Math.floor(saldoRestante / monto);
      const ultimoPago = saldoRestante - (semanasCompletas * monto);
      
      const pagos = Array(semanasCompletas).fill(monto);
      if (ultimoPago > 0) pagos.push(ultimoPago);
      
      setPlanCalculado({
        ...planCalculado,
        pagoSemanal: monto,
        semanas: pagos.length,
        pagos,
        ultimoPago
      });
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </StoreLayout>
    );
  }

  // ✅ CORREGIDO: Crear un producto virtual con campos en español
  const carritoProducto = {
    id: 'carrito',
    nombre: `Compra de ${carrito.length} ${carrito.length === 1 ? 'producto' : 'productos'}`,
    precio: calcularTotal(),
    precioContado: Math.round(calcularTotal() * 0.66),
    enganche: planCalculado?.enganche || 0,
    pagoSemanal: planCalculado?.pagoSemanal || 0,
    semanas: planCalculado?.semanas || 12,
    descripcion: carrito.map(item => `• ${item.nombre || item.name} x${item.cantidad || 1}`).join('\n')
  };

  return (
    <>
      <Head>
        <title>Finalizar compra | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-[#6C3BFF] transition"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">📋 Finalizar compra</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Resumen de productos del carrito */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">🛒 Productos</h2>
                
                <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                  {carrito.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.imagen ? (
                          <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.nombre || item.name}</p>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">Cantidad: {item.cantidad || 1}</span>
                          <span className="text-sm font-medium text-[#6C3BFF]">
                            {formatMoney((item.precio || 0) * (item.cantidad || 1))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total productos</span>
                    <span className="text-[#6C3BFF]">{formatMoney(calcularTotal())}</span>
                  </div>
                </div>
                
                <Link
                  href="/carrito"
                  className="block text-center text-sm text-gray-500 mt-4 hover:text-[#6C3BFF] transition"
                >
                  ← Editar carrito
                </Link>
              </div>
            </div>

            {/* Formulario de checkout */}
            <div className="lg:col-span-2">
              {/* Selector de enganche para múltiples productos */}
              <div className="bg-purple-50 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">🎯 Elige tu enganche (Crédito)</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[25, 20, 15].map(porcentaje => (
                    <button
                      key={porcentaje}
                      onClick={() => handleCambiarEnganche(porcentaje)}
                      className={`py-3 rounded-xl font-semibold transition-all ${enganchePorcentaje === porcentaje
                        ? 'bg-[#6C3BFF] text-white shadow-md'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-[#6C3BFF]'
                      }`}
                    >
                      {porcentaje}% - {formatMoney(Math.round(calcularTotal() * porcentaje / 100))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de pago semanal */}
              <div className="bg-blue-50 rounded-xl p-5 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">💰 ¿Cuánto quieres pagar cada semana?</h3>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[50, 100, 150, 200, 250, 300, 400, 500].map(monto => (
                    <button
                      key={monto}
                      onClick={() => handleCambiarPagoSemanal(monto)}
                      className={`py-2 rounded-xl font-semibold transition-all ${pagoSemanal === monto
                        ? 'bg-[#6C3BFF] text-white shadow-md'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-[#6C3BFF]'
                      }`}
                    >
                      ${monto}/sem
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan de pagos */}
              {planCalculado && (
                <div className="bg-green-50 rounded-xl p-5 mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">📋 Tu plan de pagos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enganche inicial:</span>
                      <span className="font-bold text-[#6C3BFF]">{formatMoney(planCalculado.enganche)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo a financiar:</span>
                      <span className="font-bold">{formatMoney(planCalculado.saldoRestante)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagos semanales:</span>
                      <span className="font-bold">{formatMoney(planCalculado.pagoSemanal)} x {planCalculado.semanas} semanas</span>
                    </div>
                    {planCalculado.ultimoPago > 0 && planCalculado.ultimoPago !== planCalculado.pagoSemanal && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Último pago:</span>
                        <span>{formatMoney(planCalculado.ultimoPago)}</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-green-200">
                      <div className="flex justify-between font-bold">
                        <span>Total a pagar:</span>
                        <span className="text-[#6C3BFF]">{formatMoney(planCalculado.totalPagar)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">✓ Sin intereses • Último pago ajustado automáticamente</p>
                </div>
              )}

              <CheckoutForm
                product={carritoProducto}
                phone={user?.telefono || ''}
                tipoSolicitud="credito"
                planCalculado={planCalculado}
                onConfirm={handleCheckoutConfirm}
                onBack={() => router.push('/carrito')}
              />
            </div>
          </div>
        </div>
      </StoreLayout>

      {showConfirmation && (
        <ConfirmationModal
          orderId={orderId}
          type={confirmationType}
          productName={`Compra de ${carrito.length} ${carrito.length === 1 ? 'producto' : 'productos'}`}
          onClose={() => {
            setShowConfirmation(false);
            router.push('/perfil/ordenes');
          }}
        />
      )}

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