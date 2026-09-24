// src/pages/productos/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Heart, Home,
  Package, Calendar, CreditCard, ShoppingCart,
  Zap, CheckCircle, Sparkles, Share2,
  Star, Truck, Eye, AlertCircle,
  Users, Bell, X, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import ServiceSelector from '../../components/checkout/ServiceSelector';
import CheckoutForm from '../../components/checkout/CheckoutForm';
import ConfirmationModal from '../../components/checkout/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import FavoriteButton from '../../components/FavoriteButton';
import { CATEGORIAS, generarSlug } from '../../config/categorias';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─── Formateador de moneda · SIN CAMBIOS ────────────────────────
const formatMoney = (amount) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

// ─── Helpers de categoría · SIN CAMBIOS ─────────────────────────
function getCategoriaInfoFromStatic(categoriaTexto) {
  if (!categoriaTexto) return null;

  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (
      categoria.nombre?.toLowerCase() === categoriaTexto.toLowerCase() ||
      categoria.slug?.toLowerCase() === categoriaTexto.toLowerCase()
    ) {
      return { nombre: categoria.nombre, slug: categoria.slug };
    }
    if (categoria.sections) {
      for (const section of categoria.sections) {
        for (const cat of section.categories) {
          if (
            cat.name?.toLowerCase() === categoriaTexto.toLowerCase() ||
            cat.name?.toLowerCase().replace(/\s+/g, '-') ===
              categoriaTexto.toLowerCase()
          ) {
            return {
              nombre: cat.name,
              slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
            };
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
          if (
            cat.name?.toLowerCase() === categoriaTexto?.toLowerCase() ||
            cat.name?.toLowerCase().replace(/\s+/g, '-') ===
              categoriaTexto?.toLowerCase()
          ) {
            return {
              nombre: cat.name,
              slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
            };
          }
        }
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-4"
      style={{
        color: accent ? T.accent : T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
    </p>
  );
}

function Badge({ label, fg = '#FFFFFF', bg = 'rgba(79, 46, 232, 0.92)', icon: Icon }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1"
      style={{
        background: bg,
        color: fg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '4px',
        fontSize: '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontWeight: 600,
      }}
    >
      {Icon && <Icon size={10} strokeWidth={2.25} />}
      {label}
    </span>
  );
}

function ActionPill({
  icon: Icon,
  label,
  onClick,
  variant = 'neutral',
  square = false,
  disabled = false,
}) {
  const [hover, setHover] = useState(false);

  const colors = {
    neutral: {
      bg: hover && !disabled ? 'rgba(15,15,15,0.06)' : 'rgba(15,15,15,0.03)',
      color: hover && !disabled ? T.ink : T.inkMid,
    },
    accent: {
      bg: hover && !disabled ? T.accentDeep : T.accent,
      color: '#FFFFFF',
    },
    green: {
      bg: hover && !disabled ? '#15803D' : '#1A7F4B',
      color: '#FFFFFF',
    },
  };

  const c = colors[variant] || colors.neutral;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      className={`flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        square ? '' : 'flex-1'
      }`}
      style={{
        height: square ? '40px' : '44px',
        width: square ? '40px' : 'auto',
        padding: square ? 0 : '0 16px',
        background: c.bg,
        color: c.color,
        border: 'none',
        borderRadius: '6px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '-0.005em',
      }}
      aria-label={label || 'Acción'}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label && <span>{label}</span>}
    </button>
  );
}

function Stars({ value = 0, size = 14, interactive = false, onChange }) {
  const [hover, setHover] = useState(0);
  const display = interactive ? hover || value : value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        const inner = (
          <Star
            size={size}
            strokeWidth={1.75}
            style={{
              fill: filled ? '#F5B400' : 'transparent',
              color: filled ? '#F5B400' : T.inkGhost,
            }}
          />
        );
        if (!interactive) return <span key={star}>{inner}</span>;
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange?.(star)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transform: hover === star ? 'scale(1.12)' : 'scale(1)',
              transition: `transform 0.15s ${T.ease}`,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label={`${star} estrellas`}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ProductoRelacionadoCard
// ─────────────────────────────────────────────────────────────────────────
function ProductoRelacionadoCard({ producto }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => router.push(`/productos/${producto.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="cursor-pointer flex flex-col transition-all duration-300"
      style={{
        background: T.bg,
        border: `1px solid ${hover ? 'rgba(15,15,15,0.14)' : T.line}`,
        borderRadius: '8px',
        overflow: 'hidden',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 1px 2px rgba(15,15,15,0.04), 0 8px 24px rgba(15,15,15,0.06)'
          : 'none',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'rgba(15,15,15,0.03)' }}
      >
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transitionTimingFunction: T.ease,
          }}
          loading="lazy"
        />
        {producto.agotado && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(15,15,15,0.55)' }}
          >
            <Badge label="Agotado" bg="rgba(197, 48, 48, 0.92)" />
          </div>
        )}
        {!producto.agotado && producto.stock <= 5 && (
          <span
            className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5"
            style={{
              background: 'rgba(184, 130, 14, 0.92)',
              color: '#FFFFFF',
              borderRadius: '4px',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontWeight: 600,
            }}
          >
            ¡Últimas!
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3
          className="text-[13.5px] leading-snug line-clamp-2 tracking-[-0.005em]"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          {producto.nombre}
        </h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              Paga
            </span>
            <span
              className="text-[13.5px] tabular-nums"
              style={{
                color: T.green,
                fontWeight: 500,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {formatMoney(producto.pagoSemanal)}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              Enganche
            </span>
            <span
              className="text-[13.5px] tabular-nums"
              style={{
                color: T.accent,
                fontWeight: 500,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {formatMoney(Math.round(producto.precio * 0.15))}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/productos/${producto.id}`);
          }}
          className="mt-2 inline-flex items-center justify-center h-9 text-[12px] transition-colors"
          style={{
            background: 'transparent',
            border: `1px solid ${T.line}`,
            borderRadius: '6px',
            color: T.inkMid,
            fontWeight: 500,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transitionTimingFunction: T.ease,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.color = T.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.line;
            e.currentTarget.style.color = T.inkMid;
          }}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
export default function ProductoDetalle() {
  const router = useRouter();
  const { id } = router.query;

  // Auth desde el contexto
  const { user, loading: authLoading, openLogin } = useAuth();
  const isAuthenticated = !!user;

  // ─── Estados principales ─────────────────────────────────────
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
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

  // ─── Estados de reviews ─────────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // ─── Estados de stock y disponibilidad ──────────────────────
  const [stockLevel, setStockLevel] = useState('disponible');

  // ─── Estados de "Vistos recientemente" ──────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // ─── Estados de notificaciones ──────────────────────────────
  const [showNotifyStock, setShowNotifyStock] = useState(false);

  // ─── Estados para el formulario de reseña ─────────────────────
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Memoización de opciones de pago · SIN CAMBIOS ──────────
  const getOpcionesPago = useMemo(() => {
    if (!producto) return [50, 100, 150, 200, 250, 300, 400, 500];
    return producto.precioTotal < 1000
      ? [50, 100, 150, 200, 250, 300, 400, 500]
      : [100, 150, 200, 250, 300, 400, 500];
  }, [producto]);

  // ─── Sync teléfono desde user ───────────────────────────────
  useEffect(() => {
    if (user?.telefono) setUserPhone(user.telefono);
  }, [user]);

  // ─── Cargar producto · SIN CAMBIOS ──────────────────────────
  useEffect(() => {
    if (id && !authLoading) {
      cargarProducto();
      if (isAuthenticated) verificarFavorito();
      registrarVista(id);
    }
  }, [id, isAuthenticated, authLoading]);

  // ─── Cargar reviews · SIN CAMBIOS ───────────────────────────
  useEffect(() => {
    if (producto) {
      cargarReviews(producto.id);
    }
  }, [producto]);

  // ─── Detectar regreso de autenticación · SIN CAMBIOS ────────
  useEffect(() => {
    if (
      isAuthenticated &&
      sessionStorage.getItem('servicioPendiente') === 'abrir'
    ) {
      sessionStorage.removeItem('servicioPendiente');
      setShowServiceSelector(true);
    }
  }, [isAuthenticated]);

  // ─── Cargar producto ────────────────────────────────────────
  const cargarProducto = async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = `producto_${id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 300000) {
          setProducto(parsed.data);
          setImageUrls(parsed.data.imagenes || ['/images/placeholder.png']);
          calcularPlan(25, 100);
          procesarCategoria(parsed.data);
          setLoading(false);
          return;
        }
      }

      const record = await pb.collection('products').getOne(id, {
        expand: 'categoriaId',
      });

      if (!record.activo) {
        setError('Este producto no está disponible actualmente.');
        setLoading(false);
        return;
      }

      const productoData = {
        id: record.id,
        nombre: record.nombre || 'Producto sin nombre',
        descripcion: record.descripcion || 'Sin descripción',
        precioTotal: record.precio || 0,
        enganche: record.enganche || 0,
        pagoSemanal: record.pagoSemanal || 0,
        semanas: record.semanas || 12,
        categoria: record.expand?.categoriaId?.nombre || 'General',
        stock: record.stock || 0,
        agotado: record.stock === 0,
        nuevo: record.nuevo || false,
        sku: record.sku || record.id.substring(0, 6).toUpperCase(),
        diasEntrega: record.diasEntrega || 1,
        visitas: (record.visitas || 0) + 1,
        destacado: record.destacado || false,
        creado: record.created,
        categoriaId: record.categoriaId || null,
        actualizado: record.updated,
      };

      if (
        record.imagen &&
        Array.isArray(record.imagen) &&
        record.imagen.length > 0
      ) {
        const urls = record.imagen.map((img) => pb.files.getURL(record, img));
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

      productoData.precioContado = Math.round(productoData.precioTotal * 0.9);

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

      await procesarCategoria(productoData);

      if (productoData.categoriaId) {
        cargarProductosRelacionados(productoData.categoriaId, id);
      }

      if (id) {
        try {
          await pb
            .collection('products')
            .update(id, { visitas: productoData.visitas });
        } catch (error) {
          console.warn(
            '⚠️ No se pudo actualizar visitas (probablemente el producto no existe o no hay permisos):',
            error.message
          );
        }
      }

      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: productoData,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error cargando producto:', error);
      setError('No se pudo cargar el producto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const procesarCategoria = async (productoData) => {
    let catInfo = null;
    if (productoData.categoriaId) {
      try {
        const cat = await pb
          .collection('categorias')
          .getOne(productoData.categoriaId);
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
          slug: productoData.categoria.toLowerCase().replace(/\s+/g, '-'),
        };
      }
    }
    setCategoriaInfo(catInfo);

    let subInfo = null;
    if (productoData.subcategoriaId) {
      try {
        const subcat = await pb
          .collection('subcategorias')
          .getOne(productoData.subcategoriaId);
        subInfo = { id: subcat.id, nombre: subcat.nombre, slug: subcat.slug };
      } catch (e) {}
    }

    if (!subInfo && productoData.categoria) {
      const staticSubInfo = getSubcategoriaInfoFromStatic(
        productoData.categoria,
        productoData.categoria
      );
      if (staticSubInfo) subInfo = staticSubInfo;
    }
    setSubcategoriaInfo(subInfo);
  };

  // ─── Productos relacionados · SIN CAMBIOS ───────────────────
  const cargarProductosRelacionados = async (categoriaId, productoId) => {
    if (!categoriaId) return;
    try {
      setLoadingRelacionados(true);
      const relacionados = await pb.collection('products').getFullList({
        filter: `categoriaId = "${categoriaId}" && id != "${productoId}" && activo = true && stock > 0`,
        sort: '-created',
        limit: 6,
        expand: 'categoriaId',
      });

      const relacionadosFormateados = relacionados.map((prod) => ({
        id: prod.id,
        nombre: prod.nombre,
        precio: prod.precio,
        precioContado: Math.round(prod.precio * 0.9),
        pagoSemanal: prod.pagoSemanal || Math.round(prod.precio * 0.05),
        imagen: prod.imagen
          ? pb.files.getURL(prod, prod.imagen)
          : '/images/placeholder.png',
        categoria: prod.expand?.categoriaId?.nombre || 'General',
        stock: prod.stock,
        agotado: prod.stock === 0,
      }));

      setProductosRelacionados(relacionadosFormateados);
    } catch (error) {
      console.error('Error cargando productos relacionados:', error);
    } finally {
      setLoadingRelacionados(false);
    }
  };

  // ─── Reviews · SIN CAMBIOS ──────────────────────────────────
  const cargarReviews = async (productId) => {
    if (!productId) return;
    try {
      setLoadingReviews(true);
      const reviewsData = await pb.collection('reviews').getFullList({
        filter: `productId = "${productId}" && activo = true`,
        sort: '-created',
        expand: 'userId',
      });

      const formattedReviews = reviewsData.map((r) => ({
        id: r.id,
        usuario:
          r.expand?.userId?.name ||
          r.expand?.userId?.username ||
          'Usuario anónimo',
        calificacion: r.calificacion || 0,
        comentario: r.comentario || '',
        fecha: r.created,
      }));

      setReviews(formattedReviews);
      const total = formattedReviews.length;
      if (total > 0) {
        const avg =
          formattedReviews.reduce((acc, r) => acc + r.calificacion, 0) / total;
        setAverageRating(Math.round(avg * 10) / 10);
      } else {
        setAverageRating(0);
      }
      setTotalReviews(total);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  // ─── Vistos recientemente · SIN CAMBIOS ─────────────────────
  const registrarVista = (productId) => {
    if (!productId) return;
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const filtered = viewed.filter((id) => id !== productId);
    filtered.unshift(productId);
    if (filtered.length > 10) filtered.pop();
    localStorage.setItem('recentlyViewed', JSON.stringify(filtered));
    setRecentlyViewed(filtered);
  };

  // ─── Favoritos · SIN CAMBIOS ────────────────────────────────
  const verificarFavorito = async () => {
    if (!isAuthenticated || !id) return;
    try {
      const currentUser = pb.authStore.model;
      const result = await pb
        .collection('favoritos')
        .getFirstListItem(
          `userId = "${currentUser.id}" && productId = "${id}"`
        );
      setIsFavorite(!!result);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setFavoriteLoading(true);
    try {
      const currentUser = pb.authStore.model;
      if (isFavorite) {
        const favorite = await pb
          .collection('favoritos')
          .getFirstListItem(
            `userId = "${currentUser.id}" && productId = "${id}"`
          );
        await pb.collection('favoritos').delete(favorite.id);
        setIsFavorite(false);
        setToastMessage(`${producto?.nombre} eliminado de favoritos`);
        setToastType('info');
      } else {
        await pb
          .collection('favoritos')
          .create({ userId: currentUser.id, productId: id });
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
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ─── Compartir · SIN CAMBIOS ────────────────────────────────
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

  // ─── Notificar stock · SIN CAMBIOS ──────────────────────────
  const handleNotifyStock = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setToastMessage(
      'Te notificaremos cuando este producto vuelva a estar disponible'
    );
    setToastType('success');
    setShowToast(true);
    setShowNotifyStock(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ─── Publicar reseña · SIN CAMBIOS ──────────────────────────
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setToastMessage('Debes iniciar sesión para dejar una reseña.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    if (newRating === 0 || !newComment.trim()) {
      setToastMessage('Califica y escribe un comentario.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setSubmittingReview(true);
    try {
      await pb.collection('reviews').create({
        productId: producto.id,
        userId: pb.authStore.model.id,
        calificacion: newRating,
        comentario: newComment.trim(),
        activo: true,
      });
      setToastMessage('¡Gracias por tu reseña!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setNewRating(0);
      setNewComment('');
      await cargarReviews(producto.id);
    } catch (error) {
      console.error('Error al publicar reseña:', error);
      setToastMessage('Error al publicar la reseña. Intenta de nuevo.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ─── Navegación de imágenes ─────────────────────────────────
  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  const prevImage = () =>
    setCurrentImageIndex(
      (prev) => (prev - 1 + imageUrls.length) % imageUrls.length
    );

  // ─── Cálculo de plan · SIN CAMBIOS ──────────────────────────
  const calcularPlan = useCallback(
    (porcentajeEnganche, pagoMonto, frecuencia = 'semanal') => {
      if (!producto) return null;
      const enganche = Math.round(
        (producto.precioTotal * porcentajeEnganche) / 100
      );
      const saldoRestante = producto.precioTotal - enganche;
      const montoPorPeriodo =
        frecuencia === 'quincenal' ? pagoMonto * 2 : pagoMonto;
      const periodosCompletos = Math.floor(saldoRestante / montoPorPeriodo);
      const ultimoPago = saldoRestante - periodosCompletos * montoPorPeriodo;
      const pagos = [];
      for (let i = 0; i < periodosCompletos; i++) pagos.push(montoPorPeriodo);
      if (ultimoPago > 0) pagos.push(ultimoPago);

      const plan = {
        enganche,
        enganchePorcentaje: porcentajeEnganche,
        pagoMonto: montoPorPeriodo,
        pagoSemanal:
          frecuencia === 'semanal' ? pagoMonto : Math.round(montoPorPeriodo / 2),
        pagoQuincenal: montoPorPeriodo,
        frecuenciaPago: frecuencia,
        saldoRestante,
        totalPeriodos: ultimoPago > 0 ? periodosCompletos + 1 : periodosCompletos,
        pagos,
        totalPagar: enganche + saldoRestante,
        ultimoPago: ultimoPago > 0 ? ultimoPago : null,
      };
      setPlanCalculado(plan);
      return plan;
    },
    [producto]
  );

  const handleCambiarEnganche = (porcentaje) => {
    setEnganchePorcentaje(porcentaje);
    calcularPlan(porcentaje, pagoSemanal, frecuenciaPago);
  };

  const handleCambiarPago = (monto) => {
    setPagoSemanal(monto);
    calcularPlan(enganchePorcentaje, monto, frecuenciaPago);
  };

  // ─── Agregar al carrito · SIN CAMBIOS ───────────────────────
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
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precioTotal,
      precioContado: producto.precioContado,
      enganche: producto.enganche,
      pagoSemanal: producto.pagoSemanal,
      semanas: producto.semanas,
      imagen: producto.imagen,
      cantidad: 1,
    };
    const existe = carritoActual.find((item) => item.id === producto.id);
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

  // ─── Apartar producto · SIN CAMBIOS ─────────────────────────
  const handleApartarProducto = () => {
    if (producto.agotado) {
      setToastMessage('Producto agotado');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (!isAuthenticated) {
      sessionStorage.setItem('servicioPendiente', 'abrir');
      openLogin();
      return;
    }

    setShowServiceSelector(true);
  };

  // ─── Callbacks de modales · SIN CAMBIOS ─────────────────────
  const handlePhoneSuccess = (phone) => {
    setUserPhone(phone);
    setShowPhoneModal(false);
    const servicioPendiente = sessionStorage.getItem('servicioPendiente');
    if (servicioPendiente) {
      sessionStorage.removeItem('servicioPendiente');
      setShowServiceSelector(false);
      handleServiceSelect(servicioPendiente);
      return;
    }
    setShowServiceSelector(true);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceSelector(false);
    if (service === 'credito' && !planCalculado)
      calcularPlan(enganchePorcentaje, pagoSemanal);
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = (orderIdResp, type) => {
    setOrderId(orderIdResp);
    setConfirmationType(type);
    setShowCheckout(false);
    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    router.push('/perfil');
  };

  // ─── Loading ────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <>
        <Head><title>Cargando | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span
                className="font-serif text-[32px] block mb-5 select-none"
                style={{ color: T.inkGhost }}
              >
                ʃƪʃƪ
              </span>
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Cargando producto
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ──────────────────────────────────────────────────
  if (error || !producto) {
    return (
      <>
        <Head><title>Producto no encontrado | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/productos" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <Package
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                {error || 'Producto no encontrado'}
              </h1>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 h-11 px-6 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <ChevronLeft size={14} strokeWidth={1.75} /> Volver a productos
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Render principal ───────────────────────────────────────
  return (
    <>
      <Head>
        <title>{producto.nombre} | MarketDesliz</title>
        <meta name="description" content={producto.descripcion.slice(0, 160)} />
        <meta property="og:title" content={`${producto.nombre} | MarketDesliz`} />
        <meta
          property="og:description"
          content={producto.descripcion.slice(0, 160)}
        />
        <meta property="og:image" content={producto.imagen} />
        <meta
          property="og:url"
          content={typeof window !== 'undefined' ? window.location.href : ''}
        />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <link
          rel="canonical"
          href={typeof window !== 'undefined' ? window.location.href : ''}
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/productos" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-8 md:py-12 w-full">

          {/* ─── Breadcrumb ───────────────────────────── */}
          <nav
            className="flex items-center gap-2 text-[12px] flex-wrap mb-8"
            style={{ color: T.inkFaint }}
          >
            <Link
              href="/"
              className="transition-colors"
              style={{ color: T.inkSoft, textDecoration: 'none' }}
            >
              Inicio
            </Link>
            <span style={{ color: T.inkGhost }}>/</span>
            <Link
              href="/productos"
              className="transition-colors"
              style={{ color: T.inkSoft, textDecoration: 'none' }}
            >
              Productos
            </Link>
            {categoriaInfo && (
              <>
                <span style={{ color: T.inkGhost }}>/</span>
                <Link
                  href={`/productos/categoria/${categoriaInfo.slug}`}
                  className="capitalize transition-colors"
                  style={{ color: T.inkSoft, textDecoration: 'none' }}
                >
                  {categoriaInfo.nombre}
                </Link>
              </>
            )}
            <span style={{ color: T.inkGhost }}>/</span>
            <span
              className="truncate max-w-[200px]"
              style={{ color: T.ink, fontWeight: 500 }}
            >
              {producto.nombre}
            </span>
          </nav>

          {/* ─── Dos columnas ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* ─── GALERÍA ─────────────────────────────── */}
            <div className="flex flex-col gap-3">
              <div
                className="relative overflow-hidden group"
                style={{
                  aspectRatio: '1 / 1',
                  background: 'rgba(15,15,15,0.03)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <img
                  src={imageUrls[currentImageIndex] || '/images/placeholder.png'}
                  alt={`${producto.nombre} - Imagen ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500"
                  style={{
                    transform: 'scale(1)',
                  }}
                  loading="lazy"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = 'scale(1.03)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = 'scale(1)')
                  }
                />

                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        width: '36px',
                        height: '36px',
                        background: 'rgba(250, 250, 249, 0.9)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft size={16} strokeWidth={1.75} style={{ color: T.ink }} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        width: '36px',
                        height: '36px',
                        background: 'rgba(250, 250, 249, 0.9)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      aria-label="Siguiente imagen"
                    >
                      <ChevronRight size={16} strokeWidth={1.75} style={{ color: T.ink }} />
                    </button>
                    <span
                      className="absolute bottom-3 right-3 inline-flex items-center px-2 py-0.5 tabular-nums"
                      style={{
                        background: 'rgba(15,15,15,0.6)',
                        color: '#FFFFFF',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {currentImageIndex + 1}/{imageUrls.length}
                    </span>
                  </>
                )}

                {stockLevel === 'agotado' && (
                  <span className="absolute top-3 left-3">
                    <Badge label="Agotado" bg="rgba(197, 48, 48, 0.92)" />
                  </span>
                )}
                {stockLevel === 'pocas' && (
                  <span className="absolute top-3 left-3">
                    <Badge label="¡Últimas!" bg="rgba(184, 130, 14, 0.92)" />
                  </span>
                )}
                {producto.nuevo && (
                  <span className="absolute top-3 right-3">
                    <Badge label="Nuevo" />
                  </span>
                )}
              </div>

              {imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className="shrink-0 overflow-hidden transition-all"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '6px',
                        border: `1px solid ${
                          currentImageIndex === index
                            ? T.accent
                            : T.line
                        }`,
                        opacity: currentImageIndex === index ? 1 : 0.55,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transitionTimingFunction: T.ease,
                      }}
                    >
                      <img
                        src={url}
                        alt={`Vista ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ─── INFO ─────────────────────────────────── */}
            <div className="flex flex-col gap-6">
              {/* Badges + acciones */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    label={producto.categoria}
                    fg={T.accent}
                    bg="rgba(79, 46, 232, 0.08)"
                  />
                  {producto.nuevo && (
                    <Badge
                      label="Nuevo"
                      fg={T.accent}
                      bg="rgba(79, 46, 232, 0.08)"
                    />
                  )}
                  {producto.agotado && (
                    <Badge
                      label="Agotado"
                      fg={T.red}
                      bg="rgba(197, 48, 48, 0.08)"
                    />
                  )}
                  {stockLevel === 'pocas' && (
                    <Badge
                      label="Últimas"
                      fg="#B8820E"
                      bg="rgba(184, 130, 14, 0.08)"
                    />
                  )}
                  {producto.destacado && (
                    <Badge
                      label="Destacado"
                      fg="#B8820E"
                      bg="rgba(184, 130, 14, 0.08)"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <ActionPill
                    icon={Share2}
                    onClick={handleShare}
                    variant="neutral"
                    square
                    label="Compartir"
                  />
                  <FavoriteButton
                    productId={producto.id}
                    productName={producto.nombre}
                    onToggle={verificarFavorito}
                  />
                </div>
              </div>

              {/* Título + rating */}
              <div>
                <h1
                  className="text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.025em] mb-3"
                  style={{
                    color: T.ink,
                    fontWeight: 400,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  {producto.nombre}
                </h1>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Stars value={Math.round(averageRating)} size={14} />
                    <span
                      className="text-[12.5px] tabular-nums"
                      style={{
                        color: T.inkMid,
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {averageRating.toFixed(1)}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      ({totalReviews} opiniones)
                    </span>
                  </div>
                  <span
                    className="text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    SKU {producto.sku}
                  </span>
                </div>

                <p
                  className="text-[14px] leading-[1.65] mt-4"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {producto.descripcion}
                </p>
              </div>

              {/* Precios */}
              <div
                className="px-5"
                style={{
                  background: 'rgba(15,15,15,0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <div
                  className="flex items-baseline justify-between py-4"
                  style={{ borderBottom: `1px solid ${T.line}` }}
                >
                  <span
                    className="text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Precio de contado
                  </span>
                  <span
                    className="text-[22px] tabular-nums tracking-[-0.02em]"
                    style={{
                      color: T.green,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {formatMoney(producto.precioContado)}
                  </span>
                </div>
                <div
                  className="flex items-baseline justify-between py-4"
                  style={{ borderBottom: `1px solid ${T.line}` }}
                >
                  <span
                    className="text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Precio total a crédito
                  </span>
                  <span
                    className="text-[17px] tabular-nums"
                    style={{
                      color: T.ink,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {formatMoney(producto.precioTotal)}
                  </span>
                </div>
                <div
                  className="flex items-baseline justify-between py-4"
                  style={{ borderBottom: `1px solid ${T.line}` }}
                >
                  <span
                    className="text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Ahorro contado
                  </span>
                  <span
                    className="text-[14px] tabular-nums"
                    style={{
                      color: T.green,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {formatMoney(producto.precioTotal - producto.precioContado)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between py-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    <Truck size={12} strokeWidth={1.75} /> Entrega
                  </span>
                  <span
                    className="text-[12.5px]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {producto.diasEntrega || 1} día
                    {producto.diasEntrega > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Enganche */}
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-3 flex items-center gap-2"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  <CreditCard
                    size={12}
                    strokeWidth={1.75}
                    style={{ color: T.accent }}
                  />
                  Enganche
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 20, 15].map((porcentaje) => {
                    const isActive = enganchePorcentaje === porcentaje;
                    return (
                      <button
                        key={porcentaje}
                        onClick={() => handleCambiarEnganche(porcentaje)}
                        className="h-11 text-[12px] transition-colors"
                        style={{
                          background: isActive ? T.ink : 'transparent',
                          color: isActive ? T.bg : T.inkMid,
                          border: `1px solid ${isActive ? T.ink : T.line}`,
                          borderRadius: '6px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                          transitionTimingFunction: T.ease,
                        }}
                      >
                        {porcentaje}% ·{' '}
                        {formatMoney(
                          Math.round((producto.precioTotal * porcentaje) / 100)
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frecuencia */}
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-3 flex items-center gap-2"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  <Calendar
                    size={12}
                    strokeWidth={1.75}
                    style={{ color: T.accent }}
                  />
                  Frecuencia
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['semanal', 'Semanal'],
                    ['quincenal', 'Quincenal'],
                  ].map(([val, label]) => {
                    const isActive = frecuenciaPago === val;
                    return (
                      <button
                        key={val}
                        onClick={() => {
                          setFrecuenciaPago(val);
                          calcularPlan(enganchePorcentaje, pagoSemanal, val);
                        }}
                        className="h-11 text-[12.5px] transition-colors"
                        style={{
                          background: isActive ? T.ink : 'transparent',
                          color: isActive ? T.bg : T.inkMid,
                          border: `1px solid ${isActive ? T.ink : T.line}`,
                          borderRadius: '6px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                          transitionTimingFunction: T.ease,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monto por período */}
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-3"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  ¿Cuánto cada{' '}
                  {frecuenciaPago === 'semanal' ? 'semana' : 'quincena'}?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {producto &&
                    getOpcionesPago.map((monto) => {
                      const isActive = pagoSemanal === monto;
                      return (
                        <button
                          key={monto}
                          onClick={() => handleCambiarPago(monto)}
                          className="h-10 text-[12px] tabular-nums transition-colors"
                          style={{
                            background: isActive ? T.ink : 'transparent',
                            color: isActive ? T.bg : T.inkMid,
                            border: `1px solid ${isActive ? T.ink : T.line}`,
                            borderRadius: '6px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            transitionTimingFunction: T.ease,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          ${monto}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Resumen plan */}
              {planCalculado && (
                <div
                  className="px-5 py-4"
                  style={{
                    background: 'rgba(79, 46, 232, 0.03)',
                    border: `1px solid rgba(79, 46, 232, 0.15)`,
                    borderRadius: '8px',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: T.accent }}
                    />
                    <p
                      className="text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: T.accent, fontWeight: 500 }}
                    >
                      Tu plan de pagos
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      [
                        'Enganche inicial',
                        formatMoney(planCalculado.enganche),
                        T.accent,
                      ],
                      [
                        'Saldo a financiar',
                        formatMoney(planCalculado.saldoRestante),
                        T.ink,
                      ],
                      [
                        frecuenciaPago === 'semanal'
                          ? 'Pago semanal'
                          : 'Pago quincenal',
                        `${formatMoney(planCalculado.pagoMonto)} × ${
                          planCalculado.totalPeriodos
                        } ${frecuenciaPago === 'semanal' ? 'sem' : 'quin'}`,
                        T.ink,
                      ],
                    ].map(([label, value, color]) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span
                          className="text-[11.5px]"
                          style={{ color: T.inkSoft, fontWeight: 450 }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-[13px] tabular-nums"
                          style={{
                            color,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                    {planCalculado.ultimoPago > 0 &&
                      planCalculado.ultimoPago !==
                        planCalculado.pagoMonto && (
                        <div className="flex items-baseline justify-between gap-3">
                          <span
                            className="text-[11px]"
                            style={{ color: T.inkFaint, fontWeight: 450 }}
                          >
                            Último pago
                          </span>
                          <span
                            className="text-[11.5px] tabular-nums"
                            style={{
                              color: T.inkFaint,
                              fontWeight: 450,
                              fontFeatureSettings: '"tnum"',
                            }}
                          >
                            {formatMoney(planCalculado.ultimoPago)}
                          </span>
                        </div>
                      )}
                  </div>
                  <div
                    className="flex items-baseline justify-between gap-3 mt-4 pt-4"
                    style={{ borderTop: `1px solid rgba(79, 46, 232, 0.15)` }}
                  >
                    <span
                      className="text-[12px]"
                      style={{ color: T.ink, fontWeight: 500 }}
                    >
                      Total a pagar
                    </span>
                    <span
                      className="text-[17px] tabular-nums tracking-[-0.015em]"
                      style={{
                        color: T.accent,
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {formatMoney(planCalculado.totalPagar)}
                    </span>
                  </div>
                  <p
                    className="text-[10.5px] mt-3"
                    style={{ color: T.inkFaint, fontWeight: 450 }}
                  >
                    Sin intereses · Último pago ajustado automáticamente
                  </p>
                </div>
              )}

              {/* Botones acción */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={agregarAlCarrito}
                  disabled={producto.agotado}
                  className="inline-flex items-center justify-center gap-2 h-11 text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontWeight: 500,
                    cursor: producto.agotado ? 'not-allowed' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transitionTimingFunction: T.ease,
                  }}
                  onMouseEnter={(e) => {
                    if (!producto.agotado) {
                      e.currentTarget.style.borderColor = T.accent;
                      e.currentTarget.style.color = T.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.line;
                    e.currentTarget.style.color = T.inkMid;
                  }}
                >
                  <ShoppingCart size={14} strokeWidth={1.75} /> Agregar al carrito
                </button>

                <button
                  onClick={handleApartarProducto}
                  disabled={producto.agotado}
                  className="inline-flex items-center justify-center gap-2 h-11 text-white text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: producto.agotado ? 'not-allowed' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transitionTimingFunction: T.ease,
                  }}
                  onMouseEnter={(e) => {
                    if (!producto.agotado)
                      e.currentTarget.style.background = T.accentDeep;
                  }}
                  onMouseLeave={(e) => {
                    if (!producto.agotado)
                      e.currentTarget.style.background = T.accent;
                  }}
                >
                  <Zap size={14} strokeWidth={1.75} /> Apartar
                </button>
              </div>

              {producto.agotado && isAuthenticated && (
                <button
                  onClick={handleNotifyStock}
                  className="inline-flex items-center justify-center gap-2 h-10 text-[12.5px] transition-colors"
                  style={{
                    background: 'transparent',
                    border: `1px solid rgba(79, 46, 232, 0.25)`,
                    borderRadius: '6px',
                    color: T.accent,
                    fontWeight: 500,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transitionTimingFunction: T.ease,
                  }}
                >
                  <AlertCircle size={13} strokeWidth={1.75} /> Avísame cuando
                  vuelva a estar disponible
                </button>
              )}

              <div
                className="flex items-start gap-3 p-4"
                style={{
                  background: 'rgba(15,15,15,0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <Sparkles
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: T.accent, flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <p
                    className="text-[12.5px] mb-1"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    Flexibilidad de pagos
                  </p>
                  <p
                    className="text-[11.5px] leading-[1.55]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Al elegir{' '}
                    <span style={{ color: T.accent, fontWeight: 500 }}>
                      Comprar a Crédito
                    </span>{' '}
                    podrás definir tu propio monto de pago semanal. Desde $50
                    hasta $500 · Sin intereses.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Opiniones ────────────────────────────── */}
          <section className="mt-16 pt-10" style={{ borderTop: `1px solid ${T.line}` }}>
            <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
              <div>
                <SectionLabel>Opiniones de clientes</SectionLabel>
                <p
                  className="text-[13px]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {totalReviews}{' '}
                  {totalReviews === 1 ? 'opinión' : 'opiniones'}
                  {totalReviews > 0 &&
                    ` · ${averageRating.toFixed(1)} de 5 estrellas`}
                </p>
              </div>
              {isAuthenticated && (
                <button
                  onClick={() =>
                    document
                      .getElementById('review-form')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="text-[11px] uppercase tracking-[0.18em] transition-colors"
                  style={{
                    color: T.accent,
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Escribir opinión →
                </button>
              )}
            </div>

            {loadingReviews ? (
              <div className="flex justify-center py-10">
                <div
                  className="rounded-full animate-spin"
                  style={{
                    width: '24px',
                    height: '24px',
                    border: `2px solid ${T.line}`,
                    borderTopColor: T.accent,
                  }}
                />
              </div>
            ) : totalReviews === 0 ? (
              <div
                className="py-10 text-center"
                style={{
                  background: 'rgba(15,15,15,0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <p
                  className="text-[12.5px]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  No hay opiniones para este producto.
                </p>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  Sé el primero en dejar tu reseña.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-5"
                    style={{
                      background: 'rgba(15,15,15,0.02)',
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(79, 46, 232, 0.08)',
                            borderRadius: '50%',
                          }}
                        >
                          <Users
                            size={13}
                            strokeWidth={1.75}
                            style={{ color: T.accent }}
                          />
                        </div>
                        <span
                          className="text-[13px]"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {review.usuario}
                        </span>
                      </div>
                      <Stars value={review.calificacion} size={13} />
                    </div>
                    <p
                      className="text-[13px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      {review.comentario}
                    </p>
                    <p
                      className="text-[10.5px] mt-2 tabular-nums"
                      style={{
                        color: T.inkFaint,
                        fontWeight: 450,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {new Date(review.fecha).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <div
                id="review-form"
                className="mt-8 pt-6"
                style={{ borderTop: `1px solid ${T.line}` }}
              >
                <SectionLabel>Deja tu opinión</SectionLabel>
                <form
                  onSubmit={handleSubmitReview}
                  className="flex flex-col gap-4"
                >
                  <Stars
                    value={newRating}
                    size={26}
                    interactive
                    onChange={setNewRating}
                  />
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe tu comentario..."
                    rows="3"
                    className="w-full outline-none resize-none transition-colors"
                    style={{
                      padding: '12px 14px',
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.ink,
                      fontSize: '13.5px',
                      fontWeight: 450,
                      lineHeight: 1.55,
                      fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = T.accent)
                    }
                    onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 text-white text-[13px] self-start disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: T.accent,
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: submittingReview ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                    onMouseEnter={(e) => {
                      if (!submittingReview)
                        e.currentTarget.style.background = T.accentDeep;
                    }}
                    onMouseLeave={(e) => {
                      if (!submittingReview)
                        e.currentTarget.style.background = T.accent;
                    }}
                  >
                    {submittingReview ? 'Enviando…' : 'Publicar reseña'}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* ─── Relacionados ─────────────────────────── */}
          {(productosRelacionados.length > 0 || loadingRelacionados) && (
            <section className="mt-16">
              <div className="flex items-baseline justify-between mb-5 flex-wrap gap-3">
                <div>
                  <SectionLabel>Productos relacionados</SectionLabel>
                  <p
                    className="text-[13px]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    También en {producto.categoria}
                  </p>
                </div>
                <Link
                  href={`/productos?categoria=${encodeURIComponent(
                    producto.categoria
                  )}`}
                  className="text-[11px] uppercase tracking-[0.18em] transition-colors"
                  style={{
                    color: T.inkSoft,
                    fontWeight: 500,
                    textDecoration: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = T.inkSoft)
                  }
                >
                  Ver todo →
                </Link>
              </div>

              {loadingRelacionados ? (
                <div className="flex justify-center py-12">
                  <div
                    className="rounded-full animate-spin"
                    style={{
                      width: '24px',
                      height: '24px',
                      border: `2px solid ${T.line}`,
                      borderTopColor: T.accent,
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {productosRelacionados.map((relacionado) => (
                    <ProductoRelacionadoCard
                      key={relacionado.id}
                      producto={relacionado}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ─── Vistos recientemente ─────────────────── */}
          {recentlyViewed.length > 1 && (
            <section className="mt-12">
              <SectionLabel>Vistos recientemente</SectionLabel>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recentlyViewed.slice(0, 6).map((viewId) => (
                  <Link
                    key={viewId}
                    href={`/productos/${viewId}`}
                    className="shrink-0 flex items-center justify-center transition-colors"
                    style={{
                      width: '80px',
                      height: '80px',
                      background: 'rgba(15,15,15,0.03)',
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                      textDecoration: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Eye
                      size={20}
                      strokeWidth={1.5}
                      style={{ color: T.inkGhost }}
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <Footer variant="minimal" />
      </div>

      {/* ─── Modales ──────────────────────────────────────────── */}
      {showPhoneModal && (
        <PhoneModal
          product={producto}
          onClose={() => setShowPhoneModal(false)}
          onSuccess={handlePhoneSuccess}
        />
      )}

      {/* ─── Modal selector de servicio ───────────────────────── */}
      {showServiceSelector && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setShowServiceSelector(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 flex justify-between items-start gap-4 px-6 py-5"
              style={{
                background: T.bg,
                borderBottom: `1px solid ${T.line}`,
                zIndex: 2,
              }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-2"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  ¿Qué deseas hacer?
                </p>
                <h3
                  className="text-[20px] leading-tight tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  Elige una
                  <span
                    className="font-serif italic"
                    style={{ color: T.inkMid }}
                  >
                    {' '}opción.
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setShowServiceSelector(false)}
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(15,15,15,0.03)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Cerrar"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>

            <div className="p-6">
              <p
                className="text-[13px] leading-[1.55] mb-5"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Elige cómo quieres obtener{' '}
                <span style={{ color: T.ink, fontWeight: 500 }}>
                  {producto?.nombre}
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'contado',
                    icon: CreditCard,
                    title: 'Comprar a contado',
                    desc: 'Pago único con descuento',
                    fg: T.green,
                    bg: 'rgba(26, 127, 75, 0.06)',
                  },
                  {
                    id: 'credito',
                    icon: ShoppingCart,
                    title: 'Comprar a crédito',
                    desc: 'Enganche + pagos semanales',
                    fg: T.accent,
                    bg: 'rgba(79, 46, 232, 0.06)',
                  },
                  {
                    id: 'visita',
                    icon: Home,
                    title: 'Solicitar visita',
                    desc: 'Vendedor va a tu domicilio',
                    fg: '#0EA5E9',
                    bg: 'rgba(14, 165, 233, 0.06)',
                  },
                  {
                    id: 'entrega',
                    icon: Truck,
                    title: 'Solicitar entrega',
                    desc: 'Llevamos a tu casa',
                    fg: '#B8820E',
                    bg: 'rgba(184, 130, 14, 0.06)',
                  },
                ].map(({ id, icon: Icon, title, desc, fg, bg }) => {
                  const [hover, setHover] = useState(false);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        if (!isAuthenticated) {
                          sessionStorage.setItem('servicioPendiente', id);
                          setShowServiceSelector(false);
                          openLogin();
                          return;
                        }
                        setShowServiceSelector(false);
                        handleServiceSelect(id);
                      }}
                      onMouseEnter={() => setHover(true)}
                      onMouseLeave={() => setHover(false)}
                      className="flex flex-col items-start gap-2 p-5 text-left transition-all duration-200"
                      style={{
                        background: hover ? bg : T.bg,
                        border: `1px solid ${
                          hover ? fg : T.line
                        }`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transitionTimingFunction: T.ease,
                      }}
                    >
                      <Icon size={20} strokeWidth={1.5} style={{ color: fg }} />
                      <span
                        className="text-[13px] mt-1"
                        style={{ color: T.ink, fontWeight: 500 }}
                      >
                        {title}
                      </span>
                      <span
                        className="text-[11.5px] leading-[1.5]"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!isAuthenticated && (
                <div
                  className="mt-5 flex items-start gap-2.5 px-3.5 py-3"
                  style={{
                    background: 'rgba(184, 130, 14, 0.05)',
                    border: `1px solid rgba(184, 130, 14, 0.18)`,
                    borderLeft: '2px solid #B8820E',
                    borderRadius: '6px',
                  }}
                >
                  <Lock
                    size={13}
                    strokeWidth={1.75}
                    style={{ color: '#B8820E', flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    className="text-[11.5px] leading-[1.5]"
                    style={{ color: '#8A6109', fontWeight: 450 }}
                  >
                    Para continuar necesitas autenticarte. Se abrirá el modal
                    de inicio de sesión.
                  </span>
                </div>
              )}

              <div
                className="mt-6 pt-5 flex flex-col gap-2.5"
                style={{ borderTop: `1px solid ${T.line}` }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Producto
                  </span>
                  <span
                    className="text-[13px]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {producto?.nombre}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Precio
                  </span>
                  <span
                    className="text-[14px] tabular-nums"
                    style={{
                      color: T.accent,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {formatMoney(producto?.precioTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal checkout ──────────────────────────────────── */}
      {showCheckout && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setShowCheckout(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
              marginTop: '40px',
              marginBottom: '40px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 flex justify-between items-start gap-4 px-6 py-5"
              style={{
                background: T.bg,
                borderBottom: `1px solid ${T.line}`,
                zIndex: 2,
              }}
            >
              <h3
                className="text-[16px] leading-tight tracking-[-0.01em]"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {selectedService === 'contado' && 'Comprar de contado'}
                {selectedService === 'credito' && 'Comprar a crédito'}
                {selectedService === 'visita' && 'Solicitar visita'}
                {selectedService === 'entrega' && 'Solicitar entrega'}
              </h3>
              <button
                onClick={() => setShowCheckout(false)}
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(15,15,15,0.03)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Cerrar"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-6">
              <CheckoutForm
                product={producto}
                phone={userPhone}
                tipoSolicitud={selectedService}
                planCalculado={
                  selectedService === 'credito' ? planCalculado : null
                }
                onConfirm={handleCheckoutConfirm}
                onBack={() => {
                  setShowCheckout(false);
                  setShowServiceSelector(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal confirmación ─────────────────────────────── */}
      {showConfirmation && (
        <ConfirmationModal
          orderId={orderId}
          type={confirmationType}
          productName={producto.nombre}
          onClose={handleConfirmationClose}
        />
      )}

      {/* ─── Toast ───────────────────────────────────────────── */}
      {showToast && (
        <ToastNotification
          message={toastMessage}
          type={toastType}
          showGoToCart={showGoToCart}
          onClose={() => setShowToast(false)}
        />
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display',
            'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family:
            ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino',
            Georgia, 'Times New Roman', serif;
        }
        ::selection {
          background: rgba(79, 46, 232, 0.12);
          color: #0F0F0F;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
      `}</style>
    </>
  );
}