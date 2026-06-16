// src/pages/productos/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Heart, Home,
  Package, Calendar, CreditCard, ShoppingCart,
  Zap, Info, CheckCircle, Sparkles
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import PhoneModal from '../../components/checkout/PhoneModal';
import ServiceSelector from '../../components/checkout/ServiceSelector';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import ConfirmationModal from '../../components/checkout/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import FavoriteButton from '../../components/FavoriteButton';

const formatMoney = (amount) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);

export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [confirmationType, setConfirmationType] = useState(null);

  const [enganchePorcentaje, setEnganchePorcentaje] = useState(25);
  const [pagoSemanal, setPagoSemanal] = useState(100);
  const [planCalculado, setPlanCalculado] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showGoToCart, setShowGoToCart] = useState(false);

  const [frecuenciaPago, setFrecuenciaPago] = useState('semanal');
  const [categoriaInfo, setCategoriaInfo] = useState(null);

  // ✅ NUEVO: Estados para productos relacionados
  const [productosRelacionados, setProductosRelacionados] = useState([]);
  const [loadingRelacionados, setLoadingRelacionados] = useState(false);
  const [subcategoriaInfo, setSubcategoriaInfo] = useState(null);

  const getOpcionesPago = (precioTotal) =>
    precioTotal < 1000
      ? [50, 100, 150, 200, 250, 300, 400, 500]
      : [100, 150, 200, 250, 300, 400, 500];

  useEffect(() => {
    const checkAuth = () => {
      const user = pb.authStore.model;
      setIsAuthenticated(!!user);
      if (user) setUserPhone(user.telefono || '');
    };
    checkAuth();
    const unsubscribe = pb.authStore.onChange(() => checkAuth());
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      cargarProducto();
      if (isAuthenticated) verificarFavorito();
    }
  }, [id, isAuthenticated]);

  // ✅ NUEVO: Función para cargar productos relacionados
  const cargarProductosRelacionados = async (categoria, productoId) => {
    if (!categoria) return;

    try {
      setLoadingRelacionados(true);
      const relacionados = await pb.collection('products').getFullList({
        filter: `categoria = "${categoria}" && id != "${productoId}" && activo = true && stock > 0`,
        sort: '-created',
        limit: 6
      });

      const relacionadosFormateados = relacionados.map(prod => ({
        id: prod.id,
        nombre: prod.nombre,
        precio: prod.precio,
        precioContado: Math.round(prod.precio * 2 / 3),
        pagoSemanal: prod.pagoSemanal || Math.round(prod.precio * 0.05),
        imagen: prod.imagen ? pb.files.getURL(prod, prod.imagen) : '/images/placeholder.png',
        categoria: prod.categoria,
        stock: prod.stock
      }));

      setProductosRelacionados(relacionadosFormateados);
    } catch (error) {
      console.error('Error cargando productos relacionados:', error);
    } finally {
      setLoadingRelacionados(false);
    }
  };

  const cargarProducto = async () => {
    try {
      setLoading(true);
      const record = await pb.collection('products').getOne(id);

      const productoData = {
        id: record.id,
        nombre: record.nombre || 'Producto sin nombre',
        descripcion: record.descripcion || 'Sin descripción',
        precioTotal: record.precio || 0,
        enganche: record.enganche || 0,
        pagoSemanal: record.pagoSemanal || 0,
        semanas: record.semanas || 12,
        categoria: record.categoria || 'General',
        stock: record.stock || 0,
        agotado: record.stock === 0,
        nuevo: record.nuevo || false,
        sku: record.sku || record.id.substring(0, 6).toUpperCase()
      };

      if (record.imagen && Array.isArray(record.imagen) && record.imagen.length > 0) {
        const urls = record.imagen.map(img => pb.files.getURL(record, img));
        productoData.imagenes = urls;
        productoData.imagen = urls[0];
      } else if (record.imagen) {
        productoData.imagen = pb.files.getURL(record, record.imagen);
        productoData.imagenes = [productoData.imagen];
      } else {
        productoData.imagenes = ['/images/placeholder.png'];
        productoData.imagen = '/images/placeholder.png';
      }

      productoData.precioContado = Math.round(productoData.precioTotal * 2 / 3);

      if (record.categoriaId) {
        try {
          const cat = await pb.collection('categorias').getOne(record.categoriaId);
          setCategoriaInfo({ id: cat.id, nombre: cat.nombre, slug: cat.slug });
        } catch (e) { }
      }

      // Cargar subcategoría desde subcategoriaId
      if (record.subcategoriaId) {
        try {
          const subcat = await pb.collection('subcategorias').getOne(record.subcategoriaId);
          setSubcategoriaInfo({
            id: subcat.id,
            nombre: subcat.nombre,
            slug: subcat.slug
          });
        } catch (e) {
          console.error('Error cargando subcategoría:', e);
        }
      }

      // Si no hay categoriaId pero sí hay categoria texto, intentar buscar la categoría por nombre
      if (!record.categoriaId && record.categoria) {
        try {
          const catPorNombre = await pb.collection('categorias').getFirstListItem(
            `nombre ~ "${record.categoria}" || slug = "${record.categoria.toLowerCase().replace(/\s+/g, '-')}"`
          );
          if (catPorNombre) {
            setCategoriaInfo({ id: catPorNombre.id, nombre: catPorNombre.nombre, slug: catPorNombre.slug });
          }
        } catch (e) {
          // No se encontró categoría, usar el texto plano
          console.log('Categoría no encontrada en BD:', record.categoria);
        }
      }

      setProducto(productoData);
      setImageUrls(productoData.imagenes || [productoData.imagen || '/images/placeholder.png']);
      calcularPlan(25, 100);

      // ✅ NUEVO: Cargar productos relacionados de la misma categoría
      if (productoData.categoria) {
        cargarProductosRelacionados(productoData.categoria, id);
      }

    } catch (error) {
      console.error('Error cargando producto:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificarFavorito = async () => {
    if (!isAuthenticated || !id) return;
    try {
      const user = pb.authStore.model;
      const result = await pb.collection('favoritos').getFirstListItem(
        `userId = "${user.id}" && productId = "${id}"`
      );
      setIsFavorite(!!result);
    } catch (error) { setIsFavorite(false); }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) { setShowPhoneModal(true); return; }
    setFavoriteLoading(true);
    try {
      const user = pb.authStore.model;
      if (isFavorite) {
        const favorite = await pb.collection('favoritos').getFirstListItem(
          `userId = "${user.id}" && productId = "${id}"`
        );
        await pb.collection('favoritos').delete(favorite.id);
        setIsFavorite(false);
        setToastMessage(`${producto?.nombre} eliminado de favoritos`);
        setToastType('info');
      } else {
        await pb.collection('favoritos').create({ userId: user.id, productId: id });
        setIsFavorite(true);
        setToastMessage(`${producto?.nombre} agregado a favoritos`);
        setToastType('success');
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      setToastMessage('Error al guardar en favoritos');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } finally { setFavoriteLoading(false); }
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);

  const calcularPlan = (porcentajeEnganche, pagoMonto, frecuencia = 'semanal') => {
    if (!producto) return null;
    const enganche = Math.round(producto.precioTotal * porcentajeEnganche / 100);
    const saldoRestante = producto.precioTotal - enganche;
    const montoPorPeriodo = frecuencia === 'quincenal' ? pagoMonto * 2 : pagoMonto;
    const periodosCompletos = Math.floor(saldoRestante / montoPorPeriodo);
    const ultimoPago = saldoRestante - (periodosCompletos * montoPorPeriodo);
    const pagos = [];
    for (let i = 0; i < periodosCompletos; i++) pagos.push(montoPorPeriodo);
    if (ultimoPago > 0) pagos.push(ultimoPago);

    const plan = {
      enganche, enganchePorcentaje: porcentajeEnganche,
      pagoMonto: montoPorPeriodo,
      pagoSemanal: frecuencia === 'semanal' ? pagoMonto : Math.round(montoPorPeriodo / 2),
      pagoQuincenal: montoPorPeriodo,
      frecuenciaPago: frecuencia,
      saldoRestante,
      totalPeriodos: ultimoPago > 0 ? periodosCompletos + 1 : periodosCompletos,
      pagos,
      totalPagar: enganche + saldoRestante,
      ultimoPago: ultimoPago > 0 ? ultimoPago : null
    };
    setPlanCalculado(plan);
    return plan;
  };

  const handleCambiarEnganche = (porcentaje) => {
    setEnganchePorcentaje(porcentaje);
    calcularPlan(porcentaje, pagoSemanal);
  };

  const handleCambiarPago = (monto) => {
    setPagoSemanal(monto);
    calcularPlan(enganchePorcentaje, monto, frecuenciaPago);
  };

  const agregarAlCarrito = () => {
    if (producto.agotado) {
      setToastMessage('Producto agotado');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const carritoActual = JSON.parse(localStorage.getItem('carrito') || '[]');
    const productoParaCarrito = {
      id: producto.id, nombre: producto.nombre,
      precio: producto.precioTotal, precioContado: producto.precioContado,
      enganche: producto.enganche, pagoSemanal: producto.pagoSemanal,
      semanas: producto.semanas, imagen: producto.imagen, cantidad: 1
    };
    const existe = carritoActual.find(item => item.id === producto.id);
    if (existe) {
      existe.cantidad = (existe.cantidad || 1) + 1;
      setToastMessage(`${producto.nombre} (cantidad: ${existe.cantidad})`);
    } else {
      carritoActual.push(productoParaCarrito);
      setToastMessage(`${producto.nombre} agregado al carrito`);
    }
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    window.dispatchEvent(new Event('carritoActualizado'));
    setToastType('success');
    setShowGoToCart(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleApartarProducto = () => {
    if (producto.agotado) {
      setToastMessage('Producto agotado');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    isAuthenticated ? setShowServiceSelector(true) : setShowPhoneModal(true);
  };

  const handlePhoneSuccess = (phone) => {
    setUserPhone(phone);
    setShowPhoneModal(false);
    setShowServiceSelector(true);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceSelector(false);
    if (service === 'credito' && !planCalculado) calcularPlan(enganchePorcentaje, pagoSemanal);
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = (id, type) => {
    setOrderId(id);
    setConfirmationType(type);
    setShowCheckout(false);
    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    router.push('/perfil');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  if (!producto) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-3">Producto no encontrado</h1>
          <Link href="/productos" className="text-[#6C3BFF] hover:underline text-sm">
            ← Volver a productos
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{producto.nombre} | MarketDesliz</title>
      </Head>

      <StoreLayout noPadding>
        {/* ── Breadcrumb dinámico ──────────────────────────────────── */}
        <div className="bg-gray-50 pt-[140px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1.5 text-sm text-gray-600 flex-wrap font-medium py-0">
              <Link href="/" className="flex items-center gap-1 hover:text-[#6C3BFF] transition-colors">
                <Home size={13} /> Inicio
              </Link>
              <ChevronRight size={13} className="text-gray-300" />
              <Link href="/productos" className="hover:text-[#6C3BFF] transition-colors">Productos</Link>

              {/* Categoría - con fallback a producto.categoria texto */}
              {(categoriaInfo || producto?.categoria) && (
                <>
                  <ChevronRight size={13} className="text-gray-300" />
                  {categoriaInfo ? (
                    <Link
                      href={`/productos/categoria/${categoriaInfo.slug}`}
                      className="hover:text-[#6C3BFF] transition-colors capitalize"
                    >
                      {categoriaInfo.nombre}
                    </Link>
                  ) : (
                    <span className="capitalize text-gray-500">
                      {producto.categoria}
                    </span>
                  )}
                </>
              )}

              {/* Subcategoría - solo si existe subcategoriaInfo */}
              {subcategoriaInfo && (
                <>
                  <ChevronRight size={13} className="text-gray-300" />
                  <Link
                    href={`/productos/categoria/${categoriaInfo?.slug || producto?.categoria?.toLowerCase().replace(/\s+/g, '-')}/${subcategoriaInfo.slug}`}
                    className="hover:text-[#6C3BFF] transition-colors capitalize"
                  >
                    {subcategoriaInfo.nombre}
                  </Link>
                </>
              )}

              {/* Producto actual */}
              <ChevronRight size={13} className="text-gray-300" />
              <span className="text-gray-600 font-medium truncate max-w-[200px]">{producto.nombre}</span>
            </nav>
          </div>
        </div>

        {/* ── Contenido principal ───────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* ── Galería ───────────────────────────────────────── */}
            <div className="space-y-3">
              {/* Imagen principal */}
              <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square group border border-gray-100">
                <img
                  src={imageUrls[currentImageIndex]}
                  alt={`${producto.nombre} - Imagen ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                    >
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                    >
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {currentImageIndex + 1}/{imageUrls.length}
                    </div>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              {imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === index
                        ? 'border-[#6C3BFF] shadow-sm'
                        : 'border-gray-100 opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={url} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info del producto ─────────────────────────────── */}
            <div className="space-y-5">

              {/* Badges + favorito */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-xs font-semibold text-[#6C3BFF] bg-[#6C3BFF]/8 px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {producto.categoria}
                  </span>
                  {producto.nuevo && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">Nuevo</span>
                  )}
                  {producto.agotado && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Agotado</span>
                  )}
                </div>
                <FavoriteButton productId={producto.id} productName={producto.nombre} onToggle={verificarFavorito} />
              </div>

              {/* Nombre */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{producto.nombre}</h1>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{producto.descripcion}</p>
              </div>

              {/* Precios */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Precio de contado</span>
                  <span className="text-xl font-bold text-[#10b981]">{formatMoney(producto.precioContado)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Precio total a crédito</span>
                  <span className="text-lg font-bold text-gray-900">{formatMoney(producto.precioTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Ahorro pagando de contado</span>
                  <span className="text-base font-bold text-[#10b981]">{formatMoney(producto.precioTotal - producto.precioContado)}</span>
                </div>
              </div>

              {/* Selector de enganche */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-[#6C3BFF]" /> Elige tu enganche (crédito)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 20, 15].map(porcentaje => (
                    <button
                      key={porcentaje}
                      onClick={() => handleCambiarEnganche(porcentaje)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${enganchePorcentaje === porcentaje
                        ? 'bg-[#6C3BFF] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                        }`}
                    >
                      {porcentaje}% · {formatMoney(Math.round(producto.precioTotal * porcentaje / 100))}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frecuencia de pago */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
                  <Calendar size={15} className="text-[#6C3BFF]" /> Frecuencia de pago
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[['semanal', 'Semanal'], ['quincenal', 'Quincenal']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => {
                        setFrecuenciaPago(val);
                        calcularPlan(enganchePorcentaje, pagoSemanal, val);
                      }}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${frecuenciaPago === val
                        ? 'bg-[#6C3BFF] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto por período */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2.5">
                  ¿Cuánto quieres pagar cada {frecuenciaPago === 'semanal' ? 'semana' : 'quincena'}?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {producto && getOpcionesPago(producto.precioTotal).map(monto => (
                    <button
                      key={monto}
                      onClick={() => handleCambiarPago(monto)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${pagoSemanal === monto
                        ? 'bg-[#6C3BFF] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                        }`}
                    >
                      ${monto}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen del plan */}
              {planCalculado && (
                <div className="bg-[#6C3BFF]/5 rounded-2xl p-5 border border-[#6C3BFF]/15 space-y-2">
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                    <CheckCircle size={15} className="text-[#6C3BFF]" /> Tu plan de pagos
                  </p>
                  {[
                    ['Enganche inicial', formatMoney(planCalculado.enganche), 'text-[#6C3BFF]'],
                    ['Saldo a financiar', formatMoney(planCalculado.saldoRestante), 'text-gray-900'],
                    [
                      frecuenciaPago === 'semanal' ? 'Pago semanal' : 'Pago quincenal',
                      `${formatMoney(planCalculado.pagoMonto)} × ${planCalculado.totalPeriodos} ${frecuenciaPago === 'semanal' ? 'semanas' : 'quincenas'}`,
                      'text-gray-900'
                    ],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                  {planCalculado.ultimoPago > 0 && planCalculado.ultimoPago !== planCalculado.pagoMonto && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Último pago</span>
                      <span>{formatMoney(planCalculado.ultimoPago)}</span>
                    </div>
                  )}
                  <div className="pt-3 mt-1 border-t border-[#6C3BFF]/15 flex justify-between font-bold">
                    <span className="text-gray-800">Total a pagar</span>
                    <span className="text-[#6C3BFF]">{formatMoney(planCalculado.totalPagar)}</span>
                  </div>
                  <p className="text-xs text-gray-400 pt-1">Sin intereses · Último pago ajustado automáticamente</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={agregarAlCarrito}
                  disabled={producto.agotado}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all border ${producto.agotado
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                    }`}
                >
                  <ShoppingCart size={17} />
                  Agregar al carrito
                </button>
                <button
                  onClick={handleApartarProducto}
                  disabled={producto.agotado}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${producto.agotado
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white shadow-sm'
                    }`}
                >
                  <Zap size={17} />
                  Apartar producto
                </button>
              </div>

              {/* Info flexibilidad */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Sparkles size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">Flexibilidad de pagos</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Al elegir <span className="text-[#6C3BFF] font-medium">"Comprar a Crédito"</span> podrás definir tu propio monto de pago semanal. Desde $50 hasta $500 · Sin intereses
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Productos relacionados (NUEVO) ────────────────────────────── */}
        {(productosRelacionados.length > 0 || loadingRelacionados) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Productos relacionados</h2>
                <p className="text-sm text-gray-500 mt-1">También en {producto.categoria}</p>
              </div>
              <Link
                href={`/productos?categoria=${encodeURIComponent(producto.categoria)}`}
                className="text-sm text-[#6C3BFF] hover:underline flex items-center gap-1 transition"
              >
                Ver todo <ChevronRight size={14} />
              </Link>
            </div>

            {loadingRelacionados ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {productosRelacionados.map((relacionado) => (
                  <ProductoRelacionadoCard key={relacionado.id} producto={relacionado} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Modales ───────────────────────────────────────────── */}
        {showPhoneModal && (
          <PhoneModal product={producto} onClose={() => setShowPhoneModal(false)} onSuccess={handlePhoneSuccess} />
        )}

        {showServiceSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="font-bold text-gray-900">¿Qué deseas hacer?</h3>
                <button onClick={() => setShowServiceSelector(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors">×</button>
              </div>
              <div className="p-6">
                <ServiceSelector product={producto} planCalculado={planCalculado} onSelect={handleServiceSelect} />
              </div>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="font-bold text-gray-900">
                  {selectedService === 'contado' && 'Comprar de Contado'}
                  {selectedService === 'credito' && 'Comprar a Crédito'}
                  {selectedService === 'visita' && 'Solicitar Visita'}
                  {selectedService === 'entrega' && 'Solicitar Entrega'}
                </h3>
                <button onClick={() => setShowCheckout(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors">×</button>
              </div>
              <div className="p-6">
                <CheckoutForm
                  product={producto} phone={userPhone} tipoSolicitud={selectedService}
                  planCalculado={selectedService === 'credito' ? planCalculado : null}
                  onConfirm={handleCheckoutConfirm}
                  onBack={() => { setShowCheckout(false); setShowServiceSelector(true); }}
                />
              </div>
            </div>
          </div>
        )}

        {showConfirmation && (
          <ConfirmationModal orderId={orderId} type={confirmationType} productName={producto.nombre} onClose={handleConfirmationClose} />
        )}

        {showToast && (
          <ToastNotification message={toastMessage} type={toastType} showGoToCart={showGoToCart} onClose={() => setShowToast(false)} />
        )}
      </StoreLayout>
    </>
  );
}

// ── Componente para tarjeta de producto relacionado ─────────────────────
function ProductoRelacionadoCard({ producto }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/productos/${producto.id}`)}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      {/* Imagen */}
      <div className="relative h-36 sm:h-44 bg-gray-50 overflow-hidden">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {producto.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-medium px-2 py-1 bg-red-500 rounded-full">Agotado</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-[#6C3BFF] transition">
          {producto.nombre}
        </h3>

        <div className="mt-2 space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Paga</span>
            <span className="text-sm font-semibold text-[#10b981]">
              {formatMoney(producto.pagoSemanal)}<span className="text-xs">/semana</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Enganche</span>
            <span className="text-sm font-semibold text-[#6C3BFF]">
              {formatMoney(Math.round(producto.precio * 0.15))}
            </span>
          </div>
        </div>

        {/* Botón rápido */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/productos/${producto.id}`);
          }}
          className="w-full mt-3 py-1.5 text-center text-xs font-medium text-[#6C3BFF] border border-[#6C3BFF]/30 rounded-lg hover:bg-[#6C3BFF] hover:text-white transition"
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
}