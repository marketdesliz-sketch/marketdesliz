// src/pages/servicios/[id].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Heart, Wrench, MapPin, Phone,
  MessageCircle, Clock, Star, Share2, Users, Map,
  Globe, Mail, ShieldCheck, Eye, X, QrCode, Navigation, Award,
  Calendar, Copy, AlertCircle, MessageSquare, CreditCard, BadgeCheck,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import ToastNotification from '../../components/ToastNotification';
import { getServicioById, registrarVisita, getServiciosRelacionados } from '../../lib/serviciosService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Helpers · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

const formatWhatsApp = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('52') && cleaned.length === 10) cleaned = '52' + cleaned;
  return cleaned;
};

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes UI (idénticos a negocios/[id].js)
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

function ActionPill({ icon: Icon, label, onClick, variant = 'neutral', square = false, disabled = false }) {
  const [hover, setHover] = useState(false);

  const colors = {
    neutral: {
      bg: hover && !disabled ? 'rgba(15,15,15,0.06)' : 'rgba(15,15,15,0.03)',
      color: hover && !disabled ? T.ink : T.inkMid,
    },
    whatsapp: {
      bg: hover && !disabled ? '#15803D' : '#1A7F4B',
      color: '#FFFFFF',
    },
    accent: {
      bg: hover && !disabled ? T.accentDeep : T.accent,
      color: '#FFFFFF',
    },
    dark: {
      bg: hover && !disabled ? '#000000' : '#1A1A1A',
      color: '#FFFFFF',
    },
    outline: {
      bg: hover && !disabled ? 'rgba(15,15,15,0.03)' : 'transparent',
      color: hover && !disabled ? T.accent : T.inkMid,
      border: true,
    },
  };

  const c = colors[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      className={`flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${square ? '' : 'flex-1'}`}
      style={{
        height: square ? '40px' : '42px',
        width: square ? '40px' : 'auto',
        padding: square ? 0 : '0 16px',
        background: c.bg,
        color: c.color,
        borderRadius: '6px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        border: c.border ? `1px solid ${T.line}` : 'none',
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

function Badge({ variant, icon: Icon, label, dot = false }) {
  const variants = {
    official: { bg: 'rgba(79, 46, 232, 0.92)', color: '#FFFFFF' },
    verified: { bg: 'rgba(26, 127, 75, 0.92)', color: '#FFFFFF' },
    provider: { bg: 'rgba(15, 15, 15, 0.7)', color: '#FFFFFF' },
    open: { bg: 'rgba(26, 127, 75, 0.92)', color: '#FFFFFF' },
    closed: { bg: 'rgba(197, 48, 48, 0.92)', color: '#FFFFFF' },
  };
  const c = variants[variant] || variants.official;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1"
      style={{
        background: c.bg,
        color: c.color,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '4px',
        fontSize: '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontWeight: 600,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, background: '#FFFFFF', borderRadius: '50%' }} />}
      {Icon && <Icon size={10} strokeWidth={2} />}
      {label}
    </span>
  );
}

function InfoLine({ icon: Icon, text, href, external, mono = false, color = null }) {
  const content = (
    <>
      <Icon
        size={13}
        strokeWidth={1.75}
        style={{ color: color || T.inkFaint, marginTop: 3, flexShrink: 0 }}
      />
      <span
        className={`text-[13px] leading-[1.55] ${mono ? 'tabular-nums' : ''} truncate`}
        style={{
          color: href ? T.accent : T.inkMid,
          fontWeight: 450,
          fontFeatureSettings: mono ? '"tnum"' : undefined,
          textDecoration: href ? 'underline' : 'none',
          textDecorationThickness: '1px',
          textUnderlineOffset: '3px',
        }}
      >
        {text}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="flex items-start gap-3 transition-opacity hover:opacity-80 min-w-0"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-start gap-3 min-w-0">{content}</div>;
}

function ServiceBadge({ icon: Icon, label }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1"
      style={{
        background: 'rgba(15,15,15,0.03)',
        border: `1px solid ${T.line}`,
        borderRadius: '4px',
        color: T.inkMid,
        fontSize: '11px',
        fontWeight: 500,
      }}
    >
      <Icon size={11} strokeWidth={1.75} />
      {label}
    </span>
  );
}

function ShareButton({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 h-8 text-[12px] text-white"
      style={{
        background: color,
        borderRadius: '6px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function ServicioDetalle() {
  const router = useRouter();
  const { id } = router.query;

  const { user, isAuthenticated, loading: authLoading, openLogin } = useAuth();

  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [serviciosRelacionados, setServiciosRelacionados] = useState([]);
  const [loadingRelacionados, setLoadingRelacionados] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [mostrarQR, setMostrarQR] = useState(false);
  const [mostrarCompartir, setMostrarCompartir] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (id) {
      cargarServicio();
    }
  }, [id]);

  useEffect(() => {
    if (id && isAuthenticated) {
      verificarFavorito();
    } else {
      setIsFavorite(false);
    }
  }, [id, isAuthenticated]);

  const cargarServicio = async () => {
    try {
      setLoading(true);
      setError(null);

      const servicioData = await getServicioById(id);
      if (!servicioData) throw new Error('Servicio no encontrado');

      setServicio(servicioData);

      const imgs = servicioData.imagenes && servicioData.imagenes.length > 0
        ? servicioData.imagenes
        : ['/images/placeholder.png'];
      setImageUrls(imgs);

      await registrarVisita(id);

      if (servicioData.categoria) {
        cargarRelacionados(servicioData.categoria, id);
      }

      cargarReviews(id);
    } catch (err) {
      console.error('Error cargando servicio:', err);
      setError('No se pudo cargar el servicio. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const cargarRelacionados = async (categoria, servicioId) => {
    try {
      setLoadingRelacionados(true);
      const relacionados = await getServiciosRelacionados(categoria, servicioId, 6);
      setServiciosRelacionados(relacionados);
    } catch (err) {
      console.error('Error cargando relacionados:', err);
    } finally {
      setLoadingRelacionados(false);
    }
  };

  const cargarReviews = async (servicioId) => {
    try {
      setLoadingReviews(true);
      const data = await pb
        .collection('reviews_servicios')
        .getFullList({
          filter: `servicioId = "${servicioId}" && activo = true`,
          sort: '-created',
          expand: 'userId',
        })
        .catch(() => []);

      const formatted = data.map((r) => ({
        id: r.id,
        usuario: r.expand?.userId?.name || r.expand?.userId?.username || 'Usuario anónimo',
        calificacion: r.calificacion || 0,
        comentario: r.comentario || '',
        fecha: r.created,
      }));

      setReviews(formatted);
      setTotalReviews(formatted.length);
      if (formatted.length > 0) {
        const avg = formatted.reduce((a, r) => a + r.calificacion, 0) / formatted.length;
        setAverageRating(Math.round(avg * 10) / 10);
      } else {
        setAverageRating(0);
      }
    } catch {
      setReviews([]);
      setTotalReviews(0);
      setAverageRating(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  const verificarFavorito = async () => {
    if (!isAuthenticated || !id || !user) return;
    try {
      const result = await pb
        .collection('favoritos_servicios')
        .getFirstListItem(`userId = "${user.id}" && servicioId = "${id}"`)
        .catch(() => null);
      setIsFavorite(!!result);
    } catch {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      openLogin();
      return;
    }
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        const fav = await pb
          .collection('favoritos_servicios')
          .getFirstListItem(`userId = "${user.id}" && servicioId = "${id}"`);
        await pb.collection('favoritos_servicios').delete(fav.id);
        setIsFavorite(false);
        setToastMessage(`${servicio?.nombre} eliminado de favoritos`);
        setToastType('info');
      } else {
        await pb.collection('favoritos_servicios').create({ userId: user.id, servicioId: id });
        setIsFavorite(true);
        setToastMessage(`${servicio?.nombre} agregado a favoritos`);
        setToastType('success');
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      setToastMessage('Error al guardar en favoritos');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Mira este servicio: ${servicio?.nombre} en MarketDesliz`;
    try {
      if (navigator.share) await navigator.share({ title: servicio?.nombre, text, url });
      else {
        await navigator.clipboard.writeText(url);
        setToastMessage('Enlace copiado al portapapeles');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch {}
  };

  const handleWhatsApp = () => {
    if (!servicio?.whatsapp) return;
    const num = formatWhatsApp(servicio.whatsapp);
    window.open(
      `https://wa.me/${num}?text=Hola,%20vi%20tu%20servicio%20en%20MarketDesliz,%20me%20interesa`,
      '_blank'
    );
  };

  const handleCall = () => {
    if (!servicio?.telefono) return;
    window.location.href = `tel:${servicio.telefono.replace(/\D/g, '')}`;
  };

  const handleOpenMaps = () => {
    const q = servicio?.ubicacion || servicio?.direccion;
    if (q) window.open(`https://maps.google.com/?q=${encodeURIComponent(q)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      openLogin();
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
      await pb.collection('reviews_servicios').create({
        servicioId: servicio.id,
        userId: user.id,
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
      await cargarReviews(servicio.id);
    } catch {
      setToastMessage('Error al publicar la reseña.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSubmittingReview(false);
    }
  };

  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % imageUrls.length);
  const prevImage = () =>
    setCurrentImageIndex((p) => (p - 1 + imageUrls.length) % imageUrls.length);

  const renderEstrellas = (puntuacion, interactive = false) => {
    return [1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        onClick={() => interactive && setNewRating(i)}
        type={interactive ? 'button' : 'button'}
        className="transition"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: interactive ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
          transform: interactive && i <= newRating ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <Star
          size={interactive ? 22 : 14}
          strokeWidth={1.5}
          style={{
            fill: i <= puntuacion ? '#F5B400' : 'transparent',
            color: i <= puntuacion ? '#F5B400' : T.inkGhost,
          }}
        />
      </button>
    ));
  };

  const notifications = [
    { id: 1, title: '¡Nuevos servicios!', description: 'Descubre lo nuevo esta semana', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Loading ───────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <>
        <Head><title>Cargando... | MarketDesliz</title></Head>
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
                Cargando
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error || !servicio) {
    return (
      <>
        <Head><title>Servicio no encontrado | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center max-w-md mx-auto">
              <AlertCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1 className="text-[24px] mb-2" style={{ color: T.ink, fontWeight: 400 }}>
                {error || 'Servicio no encontrado'}
              </h1>
              <p className="text-[13.5px] mb-8" style={{ color: T.inkSoft, fontWeight: 450 }}>
                El servicio que buscas no existe o fue eliminado.
              </p>
              <Link
                href="/servicios"
                className="inline-flex items-center gap-2 px-5 h-10 text-white text-[13px]"
                style={{ background: T.accent, borderRadius: '6px', fontWeight: 500 }}
              >
                <ChevronLeft size={14} /> Volver a servicios
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Render principal ──────────────────────────────────────
  return (
    <>
      <Head>
        <title>{servicio.nombre} | MarketDesliz</title>
        <meta name="description" content={(servicio.descripcion || '').slice(0, 160)} />
        <meta property="og:title" content={`${servicio.nombre} | MarketDesliz`} />
        <meta property="og:description" content={(servicio.descripcion || '').slice(0, 160)} />
        <meta property="og:image" content={servicio.imagen} />
        <meta property="og:type" content="business.business" />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/servicios" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">
          {/* ─── Breadcrumb ──────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-8 pb-4">
            <div className="flex items-center gap-2 text-[12px] flex-wrap">
              <Link href="/" style={{ color: T.inkSoft }}>Inicio</Link>
              <span style={{ color: T.inkGhost }}>/</span>
              <Link href="/servicios" style={{ color: T.inkSoft }}>Servicios</Link>
              {servicio.categoria && (
                <>
                  <span style={{ color: T.inkGhost }}>/</span>
                  <Link
                    href={`/servicios?categoria=${encodeURIComponent(servicio.categoria)}`}
                    className="capitalize"
                    style={{ color: T.inkSoft }}
                  >
                    {servicio.categoria}
                  </Link>
                </>
              )}
              <span style={{ color: T.inkGhost }}>/</span>
              <span
                className="truncate max-w-[200px]"
                style={{ color: T.inkMid, fontWeight: 500 }}
              >
                {servicio.nombre}
              </span>
            </div>
          </section>

          {/* ─── Acciones superiores ─────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-6">
            <div className="flex justify-end gap-2">
              <ActionPill
                icon={Heart}
                onClick={toggleFavorite}
                variant={isFavorite ? 'accent' : 'neutral'}
                square
                disabled={favoriteLoading}
                label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              />
              <ActionPill
                icon={QrCode}
                onClick={() => setMostrarQR(true)}
                variant="neutral"
                square
                label="Ver código QR"
              />
              <ActionPill
                icon={Share2}
                onClick={() => setMostrarCompartir(!mostrarCompartir)}
                variant="neutral"
                square
                label="Compartir"
              />
            </div>

            {mostrarCompartir && (
              <div
                className="mt-4 p-5 flex flex-col gap-3"
                style={{
                  background: 'rgba(15,15,15,0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Compartir este servicio
                  </span>
                  <button
                    onClick={() => setMostrarCompartir(false)}
                    style={{ color: T.inkFaint, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ShareButton
                    label="Facebook"
                    color="#1877F2"
                    onClick={() => {
                      const url = window.location.href;
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                    }}
                  />
                  <ShareButton
                    label="WhatsApp"
                    color="#25D366"
                    onClick={() => {
                      const url = window.location.href;
                      const text = encodeURIComponent(`Mira este servicio: ${servicio.nombre}`);
                      window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                    }}
                  />
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 px-3 h-8 text-[12px]"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Copy size={12} strokeWidth={1.75} />
                    {copiado ? 'Copiado' : 'Copiar enlace'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ─── DETALLE · 2 columnas ────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* ─── GALERÍA ──────────────────────────── */}
              <div className="space-y-3">
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: '1 / 1',
                    background: 'rgba(15, 15, 15, 0.03)',
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                  }}
                >
                  <img
                    src={imageUrls[currentImageIndex] || '/images/placeholder.png'}
                    alt={`${servicio.nombre} - Imagen ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Nav flechas */}
                  {imageUrls.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        aria-label="Anterior"
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'rgba(250, 250, 249, 0.92)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          borderRadius: '50%',
                          color: T.ink,
                          border: 'none',
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={nextImage}
                        aria-label="Siguiente"
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'rgba(250, 250, 249, 0.92)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          borderRadius: '50%',
                          color: T.ink,
                          border: 'none',
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                      <div
                        className="absolute bottom-3 right-3 px-2.5 py-1 text-[11px] tabular-nums"
                        style={{
                          background: 'rgba(15, 15, 15, 0.7)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          color: '#FFFFFF',
                          borderRadius: '4px',
                          fontFeatureSettings: '"tnum"',
                          fontWeight: 500,
                        }}
                      >
                        {currentImageIndex + 1}/{imageUrls.length}
                      </div>
                    </>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex gap-1.5 flex-wrap justify-end">
                    {servicio.esMarketDesliz ? (
                      <Badge variant="official" icon={BadgeCheck} label="Oficial" />
                    ) : (
                      <Badge variant="provider" icon={Wrench} label="Proveedor" />
                    )}
                    {servicio.verificado && (
                      <Badge variant="verified" icon={ShieldCheck} label="Verificado" />
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                {imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {imageUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className="shrink-0 overflow-hidden transition-all"
                        style={{
                          width: '64px',
                          height: '64px',
                          border: `2px solid ${currentImageIndex === index ? T.accent : T.line}`,
                          borderRadius: '6px',
                          opacity: currentImageIndex === index ? 1 : 0.6,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                          background: 'transparent',
                          padding: 0,
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

              {/* ─── INFO ─────────────────────────────── */}
              <div className="flex flex-col gap-5">

                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {servicio.categoria && (
                      <span
                        className="text-[10px] uppercase tracking-[0.18em] px-2 py-1"
                        style={{
                          color: T.accent,
                          background: 'rgba(79, 46, 232, 0.06)',
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}
                      >
                        {servicio.categoria}
                      </span>
                    )}
                    {servicio.esMarketDesliz && (
                      <span
                        className="text-[10px] uppercase tracking-[0.18em] px-2 py-1 inline-flex items-center gap-1"
                        style={{
                          color: '#FFFFFF',
                          background: T.accent,
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}
                      >
                        <BadgeCheck size={10} strokeWidth={2} /> Servicio Oficial
                      </span>
                    )}
                    {servicio.verificado && (
                      <span
                        className="text-[10px] uppercase tracking-[0.18em] px-2 py-1"
                        style={{
                          color: '#1A7F4B',
                          background: 'rgba(26, 127, 75, 0.08)',
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}
                      >
                        Verificado
                      </span>
                    )}
                  </div>

                  <h1
                    className="text-[28px] md:text-[36px] leading-tight tracking-[-0.025em] mb-3"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {servicio.nombre}
                  </h1>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            strokeWidth={1.5}
                            style={{
                              fill: star <= Math.round(averageRating) ? '#F5B400' : 'transparent',
                              color: star <= Math.round(averageRating) ? '#F5B400' : T.inkGhost,
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="text-[12px] tabular-nums ml-1"
                        style={{ color: T.inkMid, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                      >
                        {averageRating.toFixed(1)}
                      </span>
                      <span
                        className="text-[11.5px]"
                        style={{ color: T.inkFaint, fontWeight: 450 }}
                      >
                        ({totalReviews} {totalReviews === 1 ? 'opinión' : 'opiniones'})
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-[12px]"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      <Eye size={12} strokeWidth={1.75} /> {servicio.visitas || 0} visitas
                    </div>
                  </div>

                  {servicio.descripcion && (
                    <p
                      className="text-[14px] leading-[1.65] mt-4"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      {servicio.descripcion}
                    </p>
                  )}
                </div>

                {/* Precio */}
                {servicio.precioBase > 0 && (
                  <div
                    className="p-5"
                    style={{
                      background: 'rgba(79, 46, 232, 0.04)',
                      border: '1px solid rgba(79, 46, 232, 0.12)',
                      borderRadius: '8px',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="text-[10px] uppercase tracking-[0.18em] mb-1"
                          style={{ color: T.inkFaint, fontWeight: 500 }}
                        >
                          Precio base
                        </p>
                        <p
                          className="text-[26px] tabular-nums tracking-[-0.02em]"
                          style={{
                            color: T.accent,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          ${servicio.precioBase.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: '42px',
                          height: '42px',
                          background: 'rgba(79, 46, 232, 0.08)',
                          borderRadius: '8px',
                        }}
                      >
                        <CreditCard size={20} strokeWidth={1.75} style={{ color: T.accent }} />
                      </div>
                    </div>
                    <p
                      className="text-[11.5px] mt-3"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      El precio final puede variar según el trabajo o distancia.
                    </p>
                  </div>
                )}

                {/* Info contacto */}
                <div
                  className="p-5 flex flex-col gap-3"
                  style={{
                    background: 'rgba(15, 15, 15, 0.02)',
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                  }}
                >
                  {servicio.direccion && (
                    <InfoLine icon={MapPin} text={servicio.direccion} />
                  )}
                  {(servicio.municipioNombre || servicio.localidadNombre) && (
                    <InfoLine
                      icon={MapPin}
                      text={[servicio.municipioNombre, servicio.localidadNombre, servicio.sectorNombre]
                        .filter(Boolean)
                        .join(' › ')}
                    />
                  )}
                  {servicio.telefono && (
                    <InfoLine icon={Phone} text={formatPhone(servicio.telefono)} mono />
                  )}
                  {servicio.whatsapp && (
                    <InfoLine
                      icon={MessageCircle}
                      text={formatPhone(servicio.whatsapp)}
                      mono
                      color="#1A7F4B"
                    />
                  )}
                  {servicio.email && (
                    <InfoLine icon={Mail} text={servicio.email} href={`mailto:${servicio.email}`} />
                  )}
                  {servicio.horario && (
                    <InfoLine icon={Clock} text={servicio.horario} />
                  )}
                  {servicio.sitioWeb && (
                    <InfoLine icon={Globe} text="Sitio web" href={servicio.sitioWeb} external />
                  )}

                  {(servicio.facebook || servicio.instagram) && (
                    <div
                      className="flex items-center gap-2 pt-3"
                      style={{ borderTop: `1px solid ${T.line}` }}
                    >
                      {servicio.facebook && (
                        <SocialCircle href={servicio.facebook} label="Facebook">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </SocialCircle>
                      )}
                      {servicio.instagram && (
                        <SocialCircle href={servicio.instagram} label="Instagram">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </SocialCircle>
                      )}
                    </div>
                  )}
                </div>

                {/* Badges de servicios */}
                <div className="flex flex-wrap gap-2">
                  {servicio.atencionWhatsapp && <ServiceBadge icon={MessageCircle} label="WhatsApp" />}
                  {servicio.citasPrevias && <ServiceBadge icon={Calendar} label="Cita previa" />}
                  {servicio.domicilio && <ServiceBadge icon={Navigation} label="A domicilio" />}
                  {servicio.servicios && <ServiceBadge icon={Award} label={servicio.servicios} />}
                </div>

                {/* Botones acción */}
                <div className="grid grid-cols-2 gap-3">
                  <ActionPill
                    icon={MessageCircle}
                    label="WhatsApp"
                    onClick={handleWhatsApp}
                    variant="whatsapp"
                    disabled={!servicio.whatsapp}
                  />
                  <ActionPill
                    icon={Phone}
                    label="Llamar"
                    onClick={handleCall}
                    variant="outline"
                    disabled={!servicio.telefono}
                  />
                </div>

                <ActionPill
                  icon={Map}
                  label="Ver ubicación en el mapa"
                  onClick={handleOpenMaps}
                  variant="accent"
                  disabled={!servicio.direccion && !servicio.ubicacion}
                />

                <div
                  className="flex items-start gap-3 p-4"
                  style={{
                    background: 'rgba(15, 15, 15, 0.02)',
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                  }}
                >
                  <ShieldCheck
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: T.accent, flexShrink: 0, marginTop: 3 }}
                  />
                  <div>
                    <p
                      className="text-[13px] mb-0.5"
                      style={{ color: T.ink, fontWeight: 500 }}
                    >
                      {servicio.esMarketDesliz
                        ? 'Servicio oficial de MarketDesliz'
                        : 'Proveedor verificado'}
                    </p>
                    <p
                      className="text-[11.5px] leading-[1.55]"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      {servicio.esMarketDesliz
                        ? 'Este servicio es ofrecido directamente por MarketDesliz.'
                        : 'Este proveedor forma parte de nuestra red de aliados. Apóyalos y ayúdanos a crecer juntos.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── OPINIONES ─────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16">
            <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
              <div>
                <SectionLabel accent>Opiniones</SectionLabel>
                <h2
                  className="text-[22px] md:text-[28px] leading-tight tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  {totalReviews} {totalReviews === 1 ? 'opinión' : 'opiniones'}
                  {averageRating > 0 && (
                    <span
                      className="text-[14px] ml-2"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      · {averageRating.toFixed(1)} de 5
                    </span>
                  )}
                </h2>
              </div>

              {isAuthenticated && (
                <button
                  onClick={() =>
                    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="text-[12px] uppercase tracking-[0.18em] transition-colors"
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
              <div className="flex justify-center py-12">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: T.line, borderTopColor: T.accent }}
                />
              </div>
            ) : totalReviews === 0 ? (
              <div className="text-center py-12">
                <MessageSquare
                  size={32}
                  strokeWidth={1.5}
                  style={{ color: T.inkGhost, margin: '0 auto 12px' }}
                />
                <p className="text-[13px]" style={{ color: T.inkFaint, fontWeight: 450 }}>
                  No hay opiniones para este servicio.
                </p>
                <p className="text-[12px] mt-1" style={{ color: T.inkFaint, fontWeight: 450 }}>
                  Sé el primero en dejar tu reseña.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4"
                    style={{
                      background: 'rgba(15, 15, 15, 0.02)',
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
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
                          <Users size={13} strokeWidth={1.75} style={{ color: T.accent }} />
                        </div>
                        <span
                          className="text-[13.5px]"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {review.usuario}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            strokeWidth={1.5}
                            style={{
                              fill: star <= review.calificacion ? '#F5B400' : 'transparent',
                              color: star <= review.calificacion ? '#F5B400' : T.inkGhost,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p
                      className="text-[13px] leading-[1.6] ml-11"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      {review.comentario}
                    </p>
                    <p
                      className="text-[11px] ml-11 mt-2"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      {new Date(review.fecha).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated ? (
              <div
                id="review-form"
                className="mt-8 pt-8"
                style={{ borderTop: `1px solid ${T.line}` }}
              >
                <SectionLabel>Deja tu opinión</SectionLabel>

                <form onSubmit={handleSubmitReview} className="flex flex-col gap-4 max-w-2xl">
                  <div>
                    <span
                      className="block text-[10px] uppercase tracking-[0.18em] mb-2"
                      style={{ color: T.inkFaint, fontWeight: 500 }}
                    >
                      Calificación
                    </span>
                    <div className="flex gap-1">{renderEstrellas(newRating, true)}</div>
                  </div>

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe tu comentario…"
                    rows="3"
                    className="w-full outline-none resize-none transition-colors"
                    style={{
                      padding: '12px 14px',
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.ink,
                      fontSize: '13.5px',
                      fontWeight: 450,
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                  />

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="self-start h-10 px-5 text-white text-[13px] flex items-center gap-2 disabled:opacity-50"
                    style={{
                      background: T.accent,
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: submittingReview ? 'not-allowed' : 'pointer',
                      border: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!submittingReview) e.currentTarget.style.background = T.accentDeep;
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                  >
                    {submittingReview ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Enviando…
                      </>
                    ) : (
                      'Publicar reseña'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div
                className="mt-8 pt-8 text-center"
                style={{ borderTop: `1px solid ${T.line}` }}
              >
                <p className="text-[13px] mb-4" style={{ color: T.inkSoft, fontWeight: 450 }}>
                  Inicia sesión para dejar tu opinión
                </p>
                <button
                  onClick={openLogin}
                  className="h-10 px-5 text-white text-[13px]"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Iniciar sesión
                </button>
              </div>
            )}
          </section>

          {/* ─── RELACIONADOS ─────────────────────────────── */}
          {(serviciosRelacionados.length > 0 || loadingRelacionados) && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <SectionLabel>Servicios relacionados</SectionLabel>
                  <p
                    className="text-[13px]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    También en {servicio.categoria}
                  </p>
                </div>
                <Link
                  href={`/servicios?categoria=${encodeURIComponent(servicio.categoria)}`}
                  className="text-[12px] uppercase tracking-[0.18em] flex items-center gap-1"
                  style={{ color: T.accent, fontWeight: 500 }}
                >
                  Ver todo <ChevronRight size={12} strokeWidth={1.75} />
                </Link>
              </div>

              {loadingRelacionados ? (
                <div className="flex justify-center py-12">
                  <div
                    className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: T.line, borderTopColor: T.accent }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {serviciosRelacionados.map((rel) => (
                    <ServicioRelacionadoCard key={rel.id} servicio={rel} />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* ─── WhatsApp flotante ────────────────────────── */}
        {servicio.whatsapp && (
          <button
            onClick={handleWhatsApp}
            className="fixed flex items-center justify-center transition-transform"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
              right: 'calc(env(safe-area-inset-right) + 24px)',
              width: '52px',
              height: '52px',
              background: '#1A7F4B',
              borderRadius: '50%',
              boxShadow: '0 4px 16px rgba(26, 127, 75, 0.35)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              zIndex: 40,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Contactar por WhatsApp"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <MessageCircle size={22} strokeWidth={1.75} />
          </button>
        )}

        <Footer variant="minimal" />
      </div>

      {/* ─── QR Modal ─────────────────────────────────── */}
      {mostrarQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setMostrarQR(false)}
        >
          <div
            className="p-6 max-w-sm w-full text-center"
            style={{
              background: T.bg,
              borderRadius: '10px',
              border: `1px solid ${T.line}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <QrCode size={64} strokeWidth={1.25} style={{ color: T.accent, margin: '0 auto 16px' }} />
            <p className="text-[13px] mb-5" style={{ color: T.inkSoft, fontWeight: 450 }}>
              Escanea para ver este servicio en MarketDesliz
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarQR(false)}
                className="flex-1 h-10 text-[13px]"
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontWeight: 500,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Cerrar
              </button>
              <button
                onClick={() => { copyLink(); setMostrarQR(false); }}
                className="flex-1 h-10 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Copiar enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <ToastNotification
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family: ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino', Georgia, 'Times New Roman', serif;
        }
        ::selection { background: rgba(79, 46, 232, 0.12); color: #0F0F0F; }
        * { -webkit-tap-highlight-color: transparent; font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1; }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ServicioRelacionadoCard · minimal
// ─────────────────────────────────────────────────────────────────────────
function ServicioRelacionadoCard({ servicio }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => router.push(`/servicios/${servicio.id}`)}
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
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'rgba(15, 15, 15, 0.03)' }}
      >
        {servicio.imagen ? (
          <img
            src={servicio.imagen}
            alt={servicio.nombre}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transitionTimingFunction: T.ease,
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wrench size={32} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        <div className="absolute top-2.5 right-2.5">
          {servicio.esMarketDesliz ? (
            <Badge variant="official" icon={BadgeCheck} label="Oficial" />
          ) : (
            <Badge variant="provider" icon={Wrench} label="Proveedor" />
          )}
        </div>
      </div>

      <div className="px-3.5 py-3 flex flex-col gap-1.5">
        <h3
          className="text-[13px] leading-snug tracking-[-0.005em] line-clamp-2"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          {servicio.nombre}
        </h3>

        {servicio.categoria && (
          <p
            className="text-[10.5px] uppercase tracking-[0.15em] truncate"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            {servicio.categoria}
          </p>
        )}

        {servicio.direccion && (
          <div className="flex items-start gap-1.5 mt-0.5">
            <MapPin
              size={11}
              strokeWidth={1.75}
              style={{ color: T.inkFaint, marginTop: 2, flexShrink: 0 }}
            />
            <span
              className="text-[11px] line-clamp-1"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              {servicio.direccion}
            </span>
          </div>
        )}

        {servicio.precioBase > 0 && (
          <p
            className="text-[14px] tabular-nums mt-1"
            style={{
              color: T.accent,
              fontWeight: 500,
              fontFeatureSettings: '"tnum"',
            }}
          >
            ${servicio.precioBase.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SocialCircle
// ─────────────────────────────────────────────────────────────────────────
function SocialCircle({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center transition-colors"
      style={{
        width: '32px',
        height: '32px',
        border: `1px solid ${T.line}`,
        borderRadius: '50%',
        color: T.inkMid,
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = T.accent;
        e.currentTarget.style.borderColor = T.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = T.inkMid;
        e.currentTarget.style.borderColor = T.line;
      }}
    >
      {children}
    </a>
  );
}