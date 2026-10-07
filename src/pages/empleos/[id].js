// src/pages/bolsa-trabajo/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Briefcase, Search, Building2, MapPin, Clock, DollarSign,
  Phone, Mail, MessageCircle, Share2, Copy, QrCode, X,
  ChevronLeft, AlertCircle, Calendar, ExternalLink,
  User as UserIcon, ArrowRight, Lock, Tag,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─── Helpers ────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getNombreCategoria = (cat) => {
  const map = {
    ventas: 'Ventas',
    atencion_cliente: 'Atención al cliente',
    administracion: 'Administración',
    tecnologia: 'Tecnología',
    oficios: 'Oficios',
    construccion: 'Construcción',
    limpieza: 'Limpieza',
    cocina: 'Cocina',
    chofer: 'Chofer',
    repartidor: 'Repartidor',
    informal: 'Informal',
    otro: 'Otro',
  };
  return (
    map[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes
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

function ActionPill({
  icon: Icon,
  label,
  onClick,
  variant = 'neutral',
  square = false,
}) {
  const [hover, setHover] = useState(false);

  const colors = {
    neutral: {
      bg: hover ? 'rgba(15,15,15,0.06)' : 'rgba(15,15,15,0.03)',
      color: hover ? T.ink : T.inkMid,
    },
    whatsapp: {
      bg: hover ? '#15803D' : '#1A7F4B',
      color: '#FFFFFF',
    },
    accent: {
      bg: hover ? T.accentDeep : T.accent,
      color: '#FFFFFF',
    },
    dark: {
      bg: hover ? '#000000' : '#1A1A1A',
      color: '#FFFFFF',
    },
  };

  const c = colors[variant] || colors.neutral;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      className={`flex items-center justify-center gap-2 transition-all duration-200 ${
        square ? '' : 'flex-1'
      }`}
      style={{
        height: square ? '40px' : '42px',
        width: square ? '40px' : 'auto',
        padding: square ? 0 : '0 16px',
        background: c.bg,
        color: c.color,
        borderRadius: '6px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
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

function Badge({ variant, icon: Icon, label }) {
  const variants = {
    ofrezco: { bg: 'rgba(79, 46, 232, 0.92)', color: '#FFFFFF' },
    busco: { bg: 'rgba(26, 127, 75, 0.92)', color: '#FFFFFF' },
    warning: { bg: 'rgba(184, 130, 14, 0.92)', color: '#FFFFFF' },
  };
  const c = variants[variant] || variants.ofrezco;

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
      {Icon && <Icon size={10} strokeWidth={2} />}
      {label}
    </span>
  );
}

function InfoLine({ icon: Icon, text, href, external, mono = false }) {
  const content = (
    <>
      <Icon
        size={13}
        strokeWidth={1.75}
        style={{ color: T.inkFaint, marginTop: 3, flexShrink: 0 }}
      />
      <span
        className={`text-[13px] leading-[1.55] ${mono ? 'tabular-nums' : ''}`}
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
        className="flex items-start gap-3 transition-opacity hover:opacity-80"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-start gap-3">{content}</div>;
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

function SimilarCard({ oferta }) {
  const [hover, setHover] = useState(false);
  const esOferta = oferta.tipo === 'ofrezco_trabajo';

  return (
    <Link
      href={`/bolsa-trabajo/${oferta.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col transition-all duration-300"
      style={{
        background: T.bg,
        border: `1px solid ${hover ? 'rgba(15,15,15,0.14)' : T.line}`,
        borderRadius: '8px',
        padding: '20px',
        textDecoration: 'none',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
          style={{
            background: esOferta
              ? 'rgba(79, 46, 232, 0.08)'
              : 'rgba(26, 127, 75, 0.08)',
            color: esOferta ? T.accent : T.green,
            borderRadius: '4px',
            fontSize: '9.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 600,
          }}
        >
          {esOferta ? 'Ofrezco' : 'Busco'}
        </span>
        <span
          className="text-[10.5px] tabular-nums"
          style={{
            color: T.inkFaint,
            fontWeight: 450,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {new Date(oferta.created).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>

      <h3
        className="text-[14.5px] leading-snug tracking-[-0.005em] mb-1.5 line-clamp-2"
        style={{ color: T.ink, fontWeight: 500 }}
      >
        {oferta.titulo}
      </h3>

      <p
        className="text-[10px] uppercase tracking-[0.15em] mb-3"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {getNombreCategoria(oferta.categoria)}
      </p>

      {oferta.salario && (
        <span
          className="text-[13px] tabular-nums mt-auto"
          style={{
            color: T.green,
            fontWeight: 500,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {oferta.salario}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function OfertaDetallePage() {
  const router = useRouter();
  const { id } = router.query;

  const { user, loading: authLoading, openLogin } = useAuth();

  const [oferta, setOferta] = useState(null);
  const [similares, setSimilares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mostrarCompartir, setMostrarCompartir] = useState(false);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // ─── Cargar oferta · solo con sesión resuelta ───────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (id) cargarOferta();
  }, [id, authLoading, user]);

  const cargarOferta = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await pb
        .collection('bolsa_trabajo')
        .getOne(id, { expand: 'userId' });

      if (!data) throw new Error('Oferta no encontrada');

      // Si no está aprobada y no eres el autor → bloquear
      const esAutor = user?.id && user.id === data.userId;
      if (data.estado !== 'aprobado' && !esAutor) {
        throw new Error('Esta oferta no está disponible');
      }

      setOferta(data);

      // Cargar similares (misma categoría, excluyendo esta)
      try {
        const sim = await pb.collection('bolsa_trabajo').getList(1, 3, {
          filter: `categoria = "${data.categoria}" && estado = "aprobado" && activo = true && id != "${id}"`,
          sort: '-created',
        });
        setSimilares(sim.items);
      } catch (e) {
        console.log('No similares');
      }
    } catch (err) {
      console.error('Error cargando oferta:', err);
      setError(err.message || 'No se pudo cargar la oferta');
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers de contacto ───────────────────────────────
  const handleWhatsApp = () => {
    if (!oferta?.telefono) return;
    let num = oferta.telefono.replace(/\D/g, '');
    if (!num.startsWith('52') && num.length === 10) num = '52' + num;
    window.open(
      `https://wa.me/${num}?text=Hola,%20vi%20tu%20oferta%20en%20MarketDesliz%20y%20me%20interesa`,
      '_blank'
    );
  };

  const handleCall = () => {
    if (oferta?.telefono) {
      window.location.href = `tel:${oferta.telefono.replace(/\D/g, '')}`;
    }
  };

  const handleEmail = () => {
    if (oferta?.email) {
      window.location.href = `mailto:${oferta.email}`;
    }
  };

  const abrirUbicacion = () => {
    if (oferta?.ubicacion) {
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(oferta.ubicacion)}`,
        '_blank'
      );
    }
  };

  const compartirOferta = (plataforma) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const titulo = encodeURIComponent(`${oferta.nombre} - MarketDesliz`);
    const texto = encodeURIComponent(
      `Mira esta oferta en MarketDesliz: ${oferta.titulo}`
    );
    const plataformas = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${texto}&url=${url}`,
      whatsapp: `https://wa.me/?text=${texto}%20${url}`,
      email: `mailto:?subject=${titulo}&body=${texto}%20${url}`,
    };
    window.open(plataformas[plataforma], '_blank', 'width=600,height=400');
  };

  const copyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  // ─── Auth loading ───────────────────────────────────────
  if (authLoading) {
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
                Verificando sesión
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Sin sesión · esta ruta requiere cuenta ─────────────
  if (!user) {
    return (
      <>
        <Head>
          <title>Inicia sesión | MarketDesliz</title>
          <meta name="theme-color" content="#0F0F0F" />
        </Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/bolsa-trabajo" />
          <TerminalBar mode="rotating" />
          <Header />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center mb-6"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(79, 46, 232, 0.06)',
                  borderRadius: '12px',
                }}
              >
                <Lock size={28} strokeWidth={1.5} style={{ color: T.accent }} />
              </div>
              <p
                className="text-[10px] uppercase tracking-[0.28em] mb-4"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Bolsa de trabajo
              </p>
              <h1
                className="text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.03em] mb-4"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Inicia sesión
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  para ver esta oferta.
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Las ofertas de la bolsa de trabajo están disponibles solo para
                usuarios con cuenta en MarketDesliz.
              </p>
              <button
                onClick={openLogin}
                className="h-11 px-6 text-white text-[13.5px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentDeep)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
              >
                Iniciar sesión
              </button>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
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
                Cargando oferta
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ──────────────────────────────────────────────
  if (error || !oferta) {
    return (
      <>
        <Head><title>Oferta no encontrada | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/bolsa-trabajo" />
          <TerminalBar mode="rotating" />
          <Header />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <AlertCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Oferta no encontrada
              </h1>
              <p
                className="text-[13.5px] mb-8"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error || 'La oferta que buscas no existe o fue eliminada.'}
              </p>
              <Link
                href="/bolsa-trabajo"
                className="inline-flex items-center gap-2 h-11 px-6 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <ChevronLeft size={14} strokeWidth={1.75} /> Volver a bolsa
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  const esOferta = oferta.tipo === 'ofrezco_trabajo';
  const esAutor = user?.id && user.id === oferta.userId;
  const pendiente = oferta.estado !== 'aprobado';

  return (
    <>
      <Head>
        <title>{oferta.titulo} | Bolsa de Trabajo MarketDesliz</title>
        <meta
          name="description"
          content={oferta.descripcion?.substring(0, 160) || `Oferta de trabajo en ${getNombreCategoria(oferta.categoria)}`}
        />
        <meta property="og:title" content={`${oferta.titulo} | MarketDesliz`} />
        <meta
          property="og:description"
          content={oferta.descripcion?.substring(0, 160) || 'Bolsa de trabajo'}
        />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/bolsa-trabajo" />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1">
          {/* ─── Breadcrumb ──────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-8 pb-4">
            <div className="flex items-center gap-2 text-[12px] flex-wrap">
              <Link
                href="/"
                className="transition-colors"
                style={{ color: T.inkSoft, textDecoration: 'none' }}
              >
                Inicio
              </Link>
              <span style={{ color: T.inkGhost }}>/</span>
              <Link
                href="/bolsa-trabajo"
                className="transition-colors"
                style={{ color: T.inkSoft, textDecoration: 'none' }}
              >
                Bolsa de trabajo
              </Link>
              <span style={{ color: T.inkGhost }}>/</span>
              <span
                className="truncate max-w-[220px]"
                style={{ color: T.inkMid, fontWeight: 500 }}
              >
                {oferta.titulo}
              </span>
            </div>
          </section>

          {/* ─── Acciones superiores ─────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-6">
            <div className="flex justify-end gap-2">
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
                    Compartir esta oferta
                  </span>
                  <button
                    onClick={() => setMostrarCompartir(false)}
                    style={{
                      color: T.inkFaint,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    aria-label="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ShareButton
                    label="Facebook"
                    color="#1877F2"
                    onClick={() => compartirOferta('facebook')}
                  />
                  <ShareButton
                    label="Twitter"
                    color="#1DA1F2"
                    onClick={() => compartirOferta('twitter')}
                  />
                  <ShareButton
                    label="WhatsApp"
                    color="#25D366"
                    onClick={() => compartirOferta('whatsapp')}
                  />
                  <ShareButton
                    label="Email"
                    color={T.inkMid}
                    onClick={() => compartirOferta('email')}
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
                      WebkitTapHighlightColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={12} strokeWidth={1.75} />
                    {copiado ? 'Copiado' : 'Copiar enlace'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ─── Aviso: pendiente de aprobación (solo autor) ─ */}
          {pendiente && esAutor && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-6">
              <div
                className="flex items-start gap-3 p-5"
                style={{
                  background: 'rgba(184, 130, 14, 0.06)',
                  border: '1px solid rgba(184, 130, 14, 0.25)',
                  borderRadius: '8px',
                }}
              >
                <AlertCircle
                  size={16}
                  strokeWidth={1.75}
                  style={{ color: '#B8820E', marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <p
                    className="text-[13px] mb-1"
                    style={{ color: '#8A6109', fontWeight: 500 }}
                  >
                    Esta oferta está pendiente de aprobación
                  </p>
                  <p
                    className="text-[12px] leading-[1.55]"
                    style={{ color: '#8A6109', fontWeight: 450 }}
                  >
                    El administrador la revisará pronto. Solo tú puedes verla
                    hasta entonces.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ─── HERO CARD ───────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-8">
            <div
              className="overflow-hidden"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <div className="p-6 md:p-10">
                {/* Tipo + fecha */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                  <Badge
                    variant={esOferta ? 'ofrezco' : 'busco'}
                    icon={esOferta ? Building2 : Search}
                    label={esOferta ? 'Ofrezco trabajo' : 'Busco trabajo'}
                  />
                  <span
                    className="text-[11px] tabular-nums flex items-center gap-1.5"
                    style={{
                      color: T.inkFaint,
                      fontWeight: 450,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    <Calendar size={11} strokeWidth={1.75} />
                    {formatDate(oferta.created)}
                  </span>
                </div>

                {/* Título editorial */}
                <h1
                  className="text-[32px] md:text-[52px] leading-[1.05] tracking-[-0.03em] mb-4 max-w-3xl"
                  style={{
                    color: T.ink,
                    fontWeight: 400,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  {oferta.titulo}
                </h1>

                {/* Categoría */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1"
                    style={{
                      background: 'rgba(79, 46, 232, 0.06)',
                      color: T.accent,
                      borderRadius: '4px',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      fontWeight: 500,
                    }}
                  >
                    <Tag size={10} strokeWidth={2} />
                    {getNombreCategoria(oferta.categoria)}
                  </span>
                  {oferta.salario && (
                    <span
                      className="inline-flex items-center gap-1.5 tabular-nums"
                      style={{
                        color: T.green,
                        fontSize: '14px',
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      <DollarSign size={14} strokeWidth={1.75} />
                      {oferta.salario}
                    </span>
                  )}
                </div>
              </div>

              {/* Descripción */}
              {oferta.descripcion && (
                <div
                  className="px-6 md:px-10 py-6"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <SectionLabel>Descripción</SectionLabel>
                  <p
                    className="text-[14.5px] leading-[1.7] whitespace-pre-wrap max-w-3xl"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    {oferta.descripcion}
                  </p>
                </div>
              )}

              {/* Info grid */}
              {(oferta.ubicacion || oferta.horario) && (
                <div
                  className="px-6 md:px-10 py-6"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <SectionLabel>Detalles</SectionLabel>
                  <div className="flex flex-col gap-3">
                    {oferta.ubicacion && (
                      <InfoLine icon={MapPin} text={oferta.ubicacion} />
                    )}
                    {oferta.horario && (
                      <InfoLine icon={Clock} text={oferta.horario} />
                    )}
                  </div>
                </div>
              )}

              {/* Contacto */}
              <div
                className="px-6 md:px-10 py-6"
                style={{ borderTop: `1px solid ${T.line}` }}
              >
                <SectionLabel accent>Contacto</SectionLabel>

                <div className="flex flex-col gap-3 mb-6">
                  {oferta.telefono && (
                    <InfoLine
                      icon={Phone}
                      text={formatPhone(oferta.telefono)}
                      mono
                    />
                  )}
                  {oferta.email && (
                    <InfoLine
                      icon={Mail}
                      text={oferta.email}
                      href={`mailto:${oferta.email}`}
                    />
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  {oferta.telefono && (
                    <ActionPill
                      icon={Phone}
                      label="Llamar"
                      onClick={handleCall}
                      variant="dark"
                    />
                  )}
                  {oferta.telefono && (
                    <ActionPill
                      icon={MessageCircle}
                      label="WhatsApp"
                      onClick={handleWhatsApp}
                      variant="whatsapp"
                    />
                  )}
                  {oferta.email && (
                    <ActionPill
                      icon={Mail}
                      label="Enviar correo"
                      onClick={handleEmail}
                      variant="accent"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ─── Publicado por ───────────────────────────── */}
          {(oferta.expand?.userId || oferta.userId) && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-8">
              <SectionLabel>Publicado por</SectionLabel>
              <div
                className="flex items-center gap-4 p-5"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '44px',
                    height: '44px',
                    background: 'rgba(79, 46, 232, 0.08)',
                    borderRadius: '50%',
                  }}
                >
                  <UserIcon
                    size={18}
                    strokeWidth={1.75}
                    style={{ color: T.accent }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {oferta.expand?.userId?.nombre ||
                      oferta.expand?.userId?.email ||
                      'Usuario de MarketDesliz'}
                  </p>
                  <p
                    className="text-[11.5px] mt-0.5"
                    style={{ color: T.inkFaint, fontWeight: 450 }}
                  >
                    Publicado el {formatDate(oferta.created)}
                  </p>
                </div>
                {esAutor && (
                  <Badge variant="warning" label="Eres el autor" />
                )}
              </div>
            </section>
          )}

          {/* ─── Ubicación (mapa) ────────────────────────── */}
          {oferta.ubicacion && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-12">
              <SectionLabel>Ubicación</SectionLabel>
              <div
                className="overflow-hidden"
                style={{
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  height: '260px',
                }}
              >
                <iframe
                  title="mapa"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(oferta.ubicacion)}&output=embed`}
                  allowFullScreen
                />
              </div>
              <button
                onClick={abrirUbicacion}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px]"
                style={{
                  color: T.accent,
                  fontWeight: 500,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Abrir en Google Maps <ExternalLink size={12} strokeWidth={1.75} />
              </button>
            </section>
          )}

          {/* ─── Ofertas similares ───────────────────────── */}
          {similares.length > 0 && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16">
              <div className="flex items-baseline justify-between mb-5">
                <SectionLabel>Ofertas similares</SectionLabel>
                <Link
                  href={`/bolsa-trabajo?categoria=${oferta.categoria}`}
                  className="text-[11px] uppercase tracking-[0.18em] transition-colors"
                  style={{
                    color: T.inkSoft,
                    fontWeight: 500,
                    textDecoration: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.inkSoft)}
                >
                  Ver todas →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {similares.map((s) => (
                  <SimilarCard key={s.id} oferta={s} />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* ─── WhatsApp flotante ─────────────────────────── */}
        {oferta.telefono && (
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
            <QrCode
              size={64}
              strokeWidth={1.25}
              style={{ color: T.accent, margin: '0 auto 16px' }}
            />
            <p
              className="text-[13px] mb-5"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Escanea para ver esta oferta en MarketDesliz
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
                onClick={() => {
                  copyLink();
                  setMostrarQR(false);
                }}
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