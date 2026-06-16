// src/pages/carrito.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';
import ConfirmModal from '../components/ConfirmModal';
import ToastNotification from '../components/ToastNotification';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

export default function CarritoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    cargarCarrito();
    window.addEventListener('carritoActualizado', cargarCarrito);
    return () => window.removeEventListener('carritoActualizado', cargarCarrito);
  }, []);

  const cargarCarrito = () => {
    const guardado = localStorage.getItem('carrito');
    if (guardado) {
      try { setCarrito(JSON.parse(guardado)); }
      catch { setCarrito([]); }
    } else {
      setCarrito([]);
    }
    setLoading(false);
  };

  const guardarCarrito = (nuevoCarrito) => {
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    setCarrito(nuevoCarrito);
    window.dispatchEvent(new Event('carritoActualizado'));
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) { eliminarDelCarrito(id); return; }
    guardarCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: nuevaCantidad } : item));
  };

  const eliminarDelCarrito = (id) => {
    guardarCarrito(carrito.filter(item => item.id !== id));
    setToastMessage('Producto eliminado del carrito');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const confirmarVaciarCarrito = () => {
    guardarCarrito([]);
    setShowConfirmModal(false);
    setToastMessage('Carrito vaciado correctamente');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const calcularSubtotal = () =>
    carrito.reduce((total, item) => total + ((item.precio || 0) * (item.cantidad || 1)), 0);

  const handleFinalizarCompra = () => {
    if (!pb.authStore.isValid) { router.push('/solicitar?redirect=/carrito'); return; }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head><title>Mi Carrito | MarketDesliz</title></Head>

      <StoreLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-[#6C3BFF] hover:border-[#6C3BFF] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={20} className="text-[#6C3BFF]" /> Mi Carrito
              </h1>
              {carrito.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}</p>
              )}
            </div>
          </div>

          {/* Vacío */}
          {carrito.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={28} className="text-gray-400" />
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Tu carrito está vacío</h2>
              <p className="text-sm text-gray-400 mb-6">Agrega productos para comenzar tu compra</p>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Ver productos <ChevronRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

              {/* Lista */}
              <div className="lg:col-span-2 space-y-3">
                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-sm transition-shadow"
                  >
                    {/* Imagen */}
                    <div className="w-20 h-20 bg-gray-50 rounded-xl shrink-0 overflow-hidden border border-gray-100">
                      {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={24} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{item.nombre}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{item.categoria || 'Producto'}</p>
                          {item.enganche && (
                            <p className="text-xs text-[#6C3BFF] mt-0.5">Enganche: {formatMoney(item.enganche)}</p>
                          )}
                        </div>
                        <button
                          onClick={() => eliminarDelCarrito(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Cantidad */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => actualizarCantidad(item.id, (item.cantidad || 1) - 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-all"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-gray-800">
                            {item.cantidad || 1}
                          </span>
                          <button
                            onClick={() => actualizarCantidad(item.id, (item.cantidad || 1) + 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-all"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Precio */}
                        <div className="text-right">
                          <p className="font-bold text-[#6C3BFF] text-base">
                            {formatMoney((item.precio || 0) * (item.cantidad || 1))}
                          </p>
                          {(item.cantidad || 1) > 1 && (
                            <p className="text-xs text-gray-400">{formatMoney(item.precio || 0)} c/u</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Vaciar carrito — acción destructiva discreta */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Vaciar carrito
                  </button>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit sticky top-24">
                <h2 className="text-base font-bold text-gray-900 mb-5">Resumen de compra</h2>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-800">{formatMoney(calcularSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Envío</span>
                    <span className="text-[#10b981] font-medium">Por calcular</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-[#6C3BFF]">{formatMoney(calcularSubtotal())}</span>
                  </div>
                </div>

                <button
                  onClick={handleFinalizarCompra}
                  className="w-full flex items-center justify-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Finalizar compra <ChevronRight size={15} />
                </button>

                <Link
                  href="/productos"
                  className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-[#6C3BFF] mt-4 transition-colors"
                >
                  <ChevronLeft size={13} /> Seguir comprando
                </Link>
              </div>
            </div>
          )}
        </div>
      </StoreLayout>

      {showConfirmModal && (
        <ConfirmModal
          title="Vaciar carrito"
          message="¿Estás seguro de que deseas eliminar todos los productos? Esta acción no se puede deshacer."
          confirmText="Sí, vaciar"
          cancelText="Cancelar"
          type="danger"
          onConfirm={confirmarVaciarCarrito}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {showToast && (
        <ToastNotification message={toastMessage} type="success" onClose={() => setShowToast(false)} />
      )}
    </>
  );
}