// src/pages/productos/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Heart, Home,
  Package, Calendar, CreditCard, ShoppingCart,
  Zap, Info, CheckCircle, Sparkles, Share2,
  Clock, Star, Truck, Eye, AlertCircle,
  Users, MessageCircle, ThumbsUp, ThumbsDown
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import PhoneModal from '../../components/checkout/PhoneModal';
import ServiceSelector from '../../components/checkout/ServiceSelector';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import ConfirmationModal from '../../components/checkout/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import FavoriteButton from '../../components/FavoriteButton';
import { CATEGORIAS, generarSlug } from '../../config/categorias';

// ─── Formateador de moneda ─────────────────────────────────────
const formatMoney = (amount) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);

// ─── Función para obtener categoría desde estática ────────────
function getCategoriaInfoFromStatic(categoriaTexto) {
  if (!categoriaTexto) return null;
  
  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (categoria.nombre?.toLowerCase() === categoriaTexto.toLowerCase() ||
        categoria.slug?.toLowerCase() === categoriaTexto.toLowerCase()) {
      return { nombre: categoria.nombre, slug: categoria.slug };
    }
    if (categoria.sections) {
      for (const section of categoria.sections) {
        for (const cat of section.categories) {
          if (cat.name?.toLowerCase() === categoriaTexto.toLowerCase() ||
              cat.name?.toLowerCase().replace(/\s+/g, '-') === categoriaTexto.toLowerCase()) {
            return { nombre: cat.name, slug: cat.name.toLowerCase().replace(/\s+/g, '-') };
          }
        }
      }
    }
  }
  return null;
}

function getSubcategoriaInfoFromStatic(categoriaTexto, subcategoriaTexto) {
  if (!subcategoriaTexto) return null;
  
  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (categoria.sections) {
      for (const section of categoria.sections) {
        for (const cat of section.categories) {
          if (cat.name?.toLowerCase() === categoriaTexto?.toLowerCase() ||
              cat.name?.toLowerCase().replace(/\s+/g, '-') === categoriaTexto?.toLowerCase()) {
            return { nombre: cat.name, slug: cat.name.toLowerCase().replace(/\s+/g, '-') };
          }
        }
      }
    }
  }
  return null;
}

// ─── Componente principal ──────────────────────────────────────
export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  // ─── Estados principales ─────────────────────────────────────
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // ─── Estados de autenticación ───────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userPhone, setUserPhone] = useState('');

  // ─── Estados de UI ──────────────────────────────────────────
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [confirmationType, setConfirmationType] = useState(null);

  // ─── Estados de plan de pago ────────────────────────────────
  const [enganchePorcentaje, setEnganchePorcentaje] = useState(25);
  const [pagoSemanal, setPagoSemanal] = useState(100);
  const [planCalculado, setPlanCalculado] = useState(null);
  const [frecuenciaPago, setFrecuenciaPago] = useState('semanal');

  // ─── Estados de toast ────────────────────────────────────────
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showGoToCart, setShowGoToCart] = useState(false);

  // ─── Estados de categoría y relacionados ────────────────────
  const [categoriaInfo, setCategoriaInfo] = useState(null);
  const [subcategoriaInfo, setSubcategoriaInfo] = useState(null);
  const [productosRelacionados, setProductosRelacionados] = useState([]);
  const [loadingRelacionados, setLoadingRelacionados] = useState(false);

  // ─── Estados de reviews (mock) ──────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // ─── Estados de stock y disponibilidad ──────────────────────
  const [stockLevel, setStockLevel] = useState('disponible'); // 'disponible', 'pocas', 'agotado'

  // ─── Estados de "Vistos recientemente" ──────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // ─── Estados de notificaciones ──────────────────────────────
  const [showNotifyStock, setShowNotifyStock] = useState(false);

  // ─── Memoización de opciones de pago ────────────────────────
  const getOpcionesPago = useMemo(() => {
    if (!producto) return [50, 100, 150, 200, 250, 300, 400, 500];
    return producto.precioTotal < 1000
      ? [50, 100, 150, 200, 250, 300, 400, 500]
      : [100, 150, 200, 250, 300, 400, 500];
  }, [producto]);

  // ─── Efectos ─────────────────────────────────────────────────

  // 1. Autenticación
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = pb.authStore.model;
      setIsAuthenticated(!!currentUser);
      setUser(currentUser);
      if (currentUser) setUserPhone(currentUser.telefono || '');
    };
    checkAuth();
    const unsubscribe = pb.authStore.onChange(() => checkAuth());
    return () => unsubscribe();
  }, []);

  // 2. Cargar producto cuando cambie ID
  useEffect(() => {
    if (id) {
      cargarProducto();
      if (isAuthenticated) verificarFavorito();
      // Registrar vista en historial
      registrarVista(id);
    }
  }, [id, isAuthenticated]);

  // 3. Cargar reviews (mock)
  useEffect(() => {
    if (producto) {
      cargarReviewsMock(producto.id);
    }
  }, [producto]);

  // ─── Funciones principales ──────────────────────────────────

  const cargarProducto = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ 1. Verificar caché en sessionStorage
      const cacheKey = `producto_${id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Si el caché tiene menos de 5 minutos, usarlo
        if (Date.now() - parsed.timestamp < 300000) {
          setProducto(parsed.data);
          setImageUrls(parsed.data.imagenes || ['/images/placeholder.png']);
          calcularPlan(25, 100);
          procesarCategoria(parsed.data);
          setLoading(false);
          return;
        }
      }

      // ✅ 2. Cargar desde PocketBase
      const record = await pb.collection('products').getOne(id);

      // ✅ 3. Validar que el producto esté activo
      if (!record.activo) {
        setError('Este producto no está disponible actualmente.');
        setLoading(false);
        return;
      }

      // ✅ 4. Procesar datos del producto
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
        sku: record.sku || record.id.substring(0, 6).toUpperCase(),
        diasEntrega: record.diasEntrega || 1,
        visitas: (record.visitas || 0) + 1,
        destacado: record.destacado || false,
        creado: record.created,
        actualizado: record.updated
      };

      // ✅ 5. Procesar imágenes
      if (record.imagen && Array.isArray(record.imagen) && record.imagen.length > 0) {
        const urls = record.imagen.map(img => pb.files.getURL(record, img));
        productoData.imagenes = urls;
        productoData.imagen = urls[0];
      } else if (record.imagen) {
        const url = pb.files.getURL(record, record.imagen);
        productoData.imagenes = [url];
        productoData.imagen = url;
      } else {
        productoData.imagenes = ['/images/placeholder.png'];
        productoData.imagen = '/images/placeholder.png';
      }

      productoData.precioContado = Math.round(productoData.precioTotal * 2 / 3);

      // ✅ 6. Determinar nivel de stock
      if (productoData.stock === 0) {
        setStockLevel('agotado');
      } else if (productoData.stock <= 5) {
        setStockLevel('pocas');
      } else {
        setStockLevel('disponible');
      }

      setProducto(productoData);
      setImageUrls(productoData.imagenes);
      calcularPlan(25, 100);

      // ✅ 7. Procesar categoría
      await procesarCategoria(productoData);

      // ✅ 8. Cargar productos relacionados
      if (productoData.categoria) {
        cargarProductosRelacionados(productoData.categoria, id);
      }

      // ✅ 9. Actualizar contador de visitas (en segundo plano)
      try {
        await pb.collection('products').update(id, { visitas: productoData.visitas });
      } catch (e) { /* silencioso */ }

      // ✅ 10. Guardar en caché
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: productoData,
        timestamp: Date.now()
      }));

    } catch (error) {
      console.error('Error cargando producto:', error);
      setError('No se pudo cargar el producto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const procesarCategoria = async (productoData) => {
    // ✅ 1. OBTENER CATEGORÍA (desde PocketBase o estática)
    let catInfo = null;
    if (productoData.categoriaId) {
      try {
        const cat = await pb.collection('categorias').getOne(productoData.categoriaId);
        catInfo = { id: cat.id, nombre: cat.nombre, slug: cat.slug };
      } catch (e) {}
    }

    if (!catInfo && productoData.categoria) {
      const staticInfo = getCategoriaInfoFromStatic(productoData.categoria);
      if (staticInfo) {
        catInfo = { nombre: staticInfo.nombre, slug: staticInfo.slug };
      } else {
        catInfo = {
          nombre: productoData.categoria,
          slug: productoData.categoria.toLowerCase().replace(/\s+/g, '-')
        };
      }
    }
    setCategoriaInfo(catInfo);

    // ✅ 2. OBTENER SUBCATEGORÍA
    let subInfo = null;
    if (productoData.subcategoriaId) {
      try {
        const subcat = await pb.collection('subcategorias').getOne(productoData.subcategoriaId);
        subInfo = { id: subcat.id, nombre: subcat.nombre, slug: subcat.slug };
      } catch (e) {}
    }

    if (!subInfo && productoData.categoria) {
      const staticSubInfo = getSubcategoriaInfoFromStatic(productoData.categoria, productoData.categoria);
      if (staticSubInfo) subInfo = staticSubInfo;
    }
    setSubcategoriaInfo(subInfo);
  };

  // ─── Productos relacionados ──────────────────────────────────
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
        stock: prod.stock,
        agotado: prod.stock === 0
      }));

      setProductosRelacionados(relacionadosFormateados);
    } catch (error) {
      console.error('Error cargando productos relacionados:', error);
    } finally {
      setLoadingRelacionados(false);
    }
  };

  // ─── Reviews (mock) ──────────────────────────────────────────
  const cargarReviewsMock = async (productId) => {
    setLoadingReviews(true);
    // Simular carga de reviews
    const mockReviews = [
      { id: 1, usuario: 'María G.', calificacion: 5, comentario: 'Excelente producto, llegó en perfectas condiciones.', fecha: '2024-12-15' },
      { id: 2, usuario: 'Juan P.', calificacion: 4, comentario: 'Buen producto, relación calidad-precio excelente.', fecha: '2024-12-10' },
      { id: 3, usuario: 'Ana R.', calificacion: 5, comentario: 'Muy satisfecha con mi compra. Recomendado.', fecha: '2024-12-05' },
      { id: 4, usuario: 'Carlos L.', calificacion: 3, comentario: 'Producto cumple, aunque el empaque llegó un poco dañado.', fecha: '2024-11-28' },
    ];
    setReviews(mockReviews);
    const total = mockReviews.length;
    const avg = mockReviews.reduce((acc, r) => acc + r.calificacion, 0) / total;
    setAverageRating(avg);
    setTotalReviews(total);
    setLoadingReviews(false);
  };

  // ─── Vistos recientemente ────────────────────────────────────
  const registrarVista = (productId) => {
    if (!productId) return;
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const filtered = viewed.filter(id => id !== productId);
    filtered.unshift(productId);
    if (filtered.length > 10) filtered.pop();
    localStorage.setItem('recentlyViewed', JSON.stringify(filtered));
    setRecentlyViewed(filtered);
  };

  // ─── Favoritos ───────────────────────────────────────────────
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

  // ─── Compartir ───────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    const text = `Mira este producto: ${producto.nombre} en MarketDesliz`;
    try {
      if (navigator.share) {
        await navigator.share({ title: producto.nombre, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToastMessage('Enlace copiado al portapapeles');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error al compartir:', error);
      }
    }
  };

  // ─── Notificar cuando vuelva a stock ─────────────────────────
  const handleNotifyStock = async () => {
    if (!isAuthenticated) {
      setShowPhoneModal(true);
      return;
    }
    // Simular suscripción a notificación
    setToastMessage('Te notificaremos cuando este producto vuelva a estar disponible');
    setToastType('success');
    setShowToast(true);
    setShowNotifyStock(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ─── Navegación de imágenes ──────────────────────────────────
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);

  // ─── Cálculo de plan de pagos ───────────────────────────────
  const calcularPlan = useCallback((porcentajeEnganche, pagoMonto, frecuencia = 'semanal') => {
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
  }, [producto]);

  const handleCambiarEnganche = (porcentaje) => {
    setEnganchePorcentaje(porcentaje);
    calcularPlan(porcentaje, pagoSemanal, frecuenciaPago);
  };

  const handleCambiarPago = (monto) => {
    setPagoSemanal(monto);
    calcularPlan(enganchePorcentaje, monto, frecuenciaPago);
  };

  // ─── Acciones de compra ──────────────────────────────────────
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

  // ─── Callbacks de modales ────────────────────────────────────
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

  // ─── Renderizado de estados ──────────────────────────────────

  // Estado de carga
  if (loading) {
    return (
      <StoreLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-3 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 text-sm">Cargando producto...</p>
        </div>
      </StoreLayout>
    );
  }

  // Estado de error
  if (error || !producto) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-3">
            {error || 'Producto no encontrado'}
          </h1>
          <Link href="/productos" className="text-[#6C3BFF] hover:underline text-sm">
            ← Volver a productos
          </Link>
        </div>
      </StoreLayout>
    );
  }

  // ─── Renderizado principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>{producto.nombre} | MarketDesliz</title>
        <meta name="description" content={producto.descripcion.slice(0, 160)} />
        <meta property="og:title" content={`${producto.nombre} | MarketDesliz`} />
        <meta property="og:description" content={producto.descripcion.slice(0, 160)} />
        <meta property="og:image" content={producto.imagen} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Head>

      <StoreLayout noPadding>
        {/* ── Breadcrumb dinámico ────────────────────────────────── */}
        <div className="bg-gray-50 pt-[140px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1.5 text-sm text-gray-600 flex-wrap font-medium py-0" aria-label="Breadcrumb">
              <Link href="/" className="flex items-center gap-1 hover:text-[#6C3BFF] transition-colors">
                <Home size={13} /> Inicio
              </Link>
              <ChevronRight size={13} className="text-gray-300" />
              <Link href="/productos" className="hover:text-[#6C3BFF] transition-colors">Productos</Link>

              {categoriaInfo && (
                <>
                  <ChevronRight size={13} className="text-gray-300" />
                  <Link
                    href={`/productos/categoria/${categoriaInfo.slug}`}
                    className="hover:text-[#6C3BFF] transition-colors capitalize"
                  >
                    {categoriaInfo.nombre}
                  </Link>
                </>
              )}

              {subcategoriaInfo && (
                <>
                  <ChevronRight size={13} className="text-gray-300" />
                  <Link
                    href={`/productos/categoria/${categoriaInfo?.slug || producto.categoria?.toLowerCase().replace(/\s+/g, '-')}/${subcategoriaInfo.slug}`}
                    className="hover:text-[#6C3BFF] transition-colors capitalize"
                  >
                    {subcategoriaInfo.nombre}
                  </Link>
                </>
              )}

              <ChevronRight size={13} className="text-gray-300" />
              <span className="text-gray-600 font-medium truncate max-w-[200px]">{producto.nombre}</span>
            </nav>
          </div>
        </div>

        {/* ── Contenido principal ────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* ── Galería ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square group border border-gray-100">
                <img
                  src={imageUrls[currentImageIndex] || '/images/placeholder.png'}
                  alt={`${producto.nombre} - Imagen ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                      aria-label="Siguiente imagen"
                    >
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {currentImageIndex + 1}/{imageUrls.length}
                    </div>
                  </>
                )}

                {/* Badge de stock */}
                {stockLevel === 'agotado' && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Agotado
                  </div>
                )}
                {stockLevel === 'pocas' && (
                  <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                    ¡Últimas unidades!
                  </div>
                )}
                {producto.nuevo && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Nuevo
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? 'border-[#6C3BFF] shadow-sm'
                          : 'border-gray-100 opacity-60 hover:opacity-100'
                      }`}
                      aria-label={`Ver imagen ${index + 1}`}
                    >
                      <img src={url} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info del producto ────────────────────────────────── */}
            <div className="space-y-5">
              {/* Badges + favorito + compartir */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[#6C3BFF] bg-[#6C3BFF]/8 px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {producto.categoria}
                  </span>
                  {producto.nuevo && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Nuevo</span>
                  )}
                  {producto.agotado && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Agotado</span>
                  )}
                  {stockLevel === 'pocas' && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full animate-pulse">
                      ⚡ ¡Últimas!
                    </span>
                  )}
                  {producto.destacado && (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">⭐ Destacado</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-[#6C3BFF] transition-colors rounded-full hover:bg-[#6C3BFF]/5"
                    aria-label="Compartir"
                  >
                    <Share2 size={20} />
                  </button>
                  <FavoriteButton
                    productId={producto.id}
                    productName={producto.nombre}
                    onToggle={verificarFavorito}
                  />
                </div>
              </div>

              {/* Nombre y descripción */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{producto.nombre}</h1>
                <div className="flex items-center gap-4 mt-2">
                  {/* Calificación */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={`${star <= Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({totalReviews} opiniones)
                    </span>
                  </div>
                  {/* SKU */}
                  <span className="text-xs text-gray-400">
                    SKU: {producto.sku}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">{producto.descripcion}</p>
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
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Ahorro pagando de contado</span>
                  <span className="text-base font-bold text-[#10b981]">{formatMoney(producto.precioTotal - producto.precioContado)}</span>
                </div>
                {/* Tiempo de entrega */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Truck size={14} /> Tiempo de entrega
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {producto.diasEntrega || 1} día{producto.diasEntrega > 1 ? 's' : ''}
                  </span>
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
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        enganchePorcentaje === porcentaje
                          ? 'bg-[#6C3BFF] text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                      }`}
                      aria-pressed={enganchePorcentaje === porcentaje}
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
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        frecuenciaPago === val
                          ? 'bg-[#6C3BFF] text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                      }`}
                      aria-pressed={frecuenciaPago === val}
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
                  {producto && getOpcionesPago.map(monto => (
                    <button
                      key={monto}
                      onClick={() => handleCambiarPago(monto)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        pagoSemanal === monto
                          ? 'bg-[#6C3BFF] text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                      }`}
                      aria-pressed={pagoSemanal === monto}
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
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all border ${
                    producto.agotado
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                  }`}
                  aria-label="Agregar al carrito"
                >
                  <ShoppingCart size={17} />
                  Agregar al carrito
                </button>
                <button
                  onClick={handleApartarProducto}
                  disabled={producto.agotado}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    producto.agotado
                      ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white shadow-sm'
                  }`}
                  aria-label="Apartar producto"
                >
                  <Zap size={17} />
                  Apartar producto
                </button>
              </div>

              {/* Notificación de stock */}
              {producto.agotado && isAuthenticated && (
                <button
                  onClick={handleNotifyStock}
                  className="w-full py-2 text-sm text-[#6C3BFF] border border-[#6C3BFF]/30 rounded-xl hover:bg-[#6C3BFF]/5 transition-colors"
                >
                  <AlertCircle size={14} className="inline mr-2" />
                  Avísame cuando vuelva a estar disponible
                </button>
              )}

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

          {/* ── Sección de opiniones ────────────────────────────────── */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Opiniones de clientes</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {totalReviews} opiniones · {averageRating.toFixed(1)} de 5 estrellas
                </p>
              </div>
              {isAuthenticated && (
                <button className="text-sm text-[#6C3BFF] hover:underline transition">
                  Escribir una opinión
                </button>
              )}
            </div>

            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#6C3BFF]/10 flex items-center justify-center">
                          <Users size={14} className="text-[#6C3BFF]" />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{review.usuario}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={`${star <= review.calificacion ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{review.comentario}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(review.fecha).toLocaleDateString('es-MX')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Productos relacionados ────────────────────────────────── */}
        {(productosRelacionados.length > 0 || loadingRelacionados) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 pb-8">
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

        {/* ── Vistos recientemente ──────────────────────────────────── */}
        {recentlyViewed.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Vistos recientemente</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentlyViewed.slice(0, 6).map((viewId) => (
                <Link
                  key={viewId}
                  href={`/productos/${viewId}`}
                  className="shrink-0 w-24 h-24 bg-gray-100 rounded-xl overflow-hidden hover:shadow-md transition"
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    <Eye size={24} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Modales ────────────────────────────────────────────────── */}
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
                <ServiceSelector
                  product={producto}
                  planCalculado={planCalculado}
                  onSelect={handleServiceSelect}
                />
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
                  product={producto}
                  phone={userPhone}
                  tipoSolicitud={selectedService}
                  planCalculado={selectedService === 'credito' ? planCalculado : null}
                  onConfirm={handleCheckoutConfirm}
                  onBack={() => { setShowCheckout(false); setShowServiceSelector(true); }}
                />
              </div>
            </div>
          </div>
        )}

        {showConfirmation && (
          <ConfirmationModal
            orderId={orderId}
            type={confirmationType}
            productName={producto.nombre}
            onClose={handleConfirmationClose}
          />
        )}

        {showToast && (
          <ToastNotification
            message={toastMessage}
            type={toastType}
            showGoToCart={showGoToCart}
            onClose={() => setShowToast(false)}
          />
        )}
      </StoreLayout>
    </>
  );
}

// ─── Componente de tarjeta de producto relacionado ──────────────
function ProductoRelacionadoCard({ producto }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/productos/${producto.id}`)}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      <div className="relative h-36 sm:h-44 bg-gray-50 overflow-hidden">
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {producto.agotado && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-medium px-2 py-1 bg-red-500 rounded-full">Agotado</span>
          </div>
        )}
        {!producto.agotado && producto.stock <= 5 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ¡Últimas!
          </div>
        )}
      </div>

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