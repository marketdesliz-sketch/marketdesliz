// src/components/desliz/DeslizProfilePage.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Bike, MapPin, Phone, MessageCircle, Star, Clock,
  ThumbsUp, ShieldCheck, CheckCircle2, AlertCircle,
  Utensils, Crown, User, Info, Send, ChevronRight,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../TerminalBar';
import Header from '../Header';
import Footer from '../Footer';
import BackButton from '../BackButton';

// ─────────────────────────────────────────────────────────────────────────
// COLORES POR TIPO · hex directo (integrado al sistema)
// ─────────────────────────────────────────────────────────────────────────
const COLOR_STYLES = {
  primary: {
    hex: T.accent,
    hexDeep: T.accentDeep,
    soft: 'rgba(79, 46, 232, 0.06)',
    softStrong: 'rgba(79, 46, 232, 0.12)',
  },
  orange: {
    hex: '#EA580C',
    hexDeep: '#C2410C',
    soft: 'rgba(234, 88, 12, 0.06)',
    softStrong: 'rgba(234, 88, 12, 0.12)',
  },
  purple: {
    hex: '#9333EA',
    hexDeep: '#7E22CE',
    soft: 'rgba(147, 51, 234, 0.06)',
    softStrong: 'rgba(147, 51, 234, 0.12)',
  },
};

// ─────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN POR TIPO · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  moto: {
    titulo: 'Deslizmoto',
    subtitulo: 'Express',
    iconPrincipal: Bike,
    color: 'primary',
    labelServicios: 'Viajes',
    labelRegistro: 'Registro',
    labelSatisfaccion: 'Satisf.',
    descripcionDefault:
      'Conductor profesional comprometido con la puntualidad y seguridad.',
    placeholderMotivo:
      'Ej: Recoger paquete en Av. Reforma 123 y llevarlo a Polanco',
    mensajeWhatsApp:
      'Hola, vi tu perfil en Deslizmoto Express y me gustaría solicitar un servicio',
    rutaLista: '/servicios/deslizmoto',
    coleccion: 'deslizmoto',
    categoria: 'moto',
  },
  food: {
    titulo: 'Desliz',
    subtitulo: 'Food',
    iconPrincipal: Utensils,
    color: 'orange',
    labelServicios: 'Entregas',
    labelRegistro: 'Registro',
    labelSatisfaccion: 'Satisf.',
    descripcionDefault:
      'Repartidor comprometido con entregar tu comida caliente y a tiempo.',
    placeholderMotivo:
      'Ej: 2 tacos de pastor y 1 agua de horchata de Tacos El Rey',
    mensajeWhatsApp:
      'Hola, vi tu perfil en DeslizFood y me gustaría hacer un pedido',
    rutaLista: '/servicios/deslizfood',
    coleccion: 'deslizmoto',
    categoria: 'food',
  },
  encargos: {
    titulo: 'Encargos',
    subtitulo: 'VIP',
    iconPrincipal: Crown,
    color: 'purple',
    labelServicios: 'Encargos',
    labelRegistro: 'Registro',
    labelSatisfaccion: 'Satisf.',
    descripcionDefault:
      'Encargado personal para mandados exclusivos y atención VIP.',
    placeholderMotivo:
      'Ej: Ir al banco a pagar un servicio y traer el comprobante',
    mensajeWhatsApp:
      'Hola, vi tu perfil en Encargos VIP y me gustaría solicitar un mandado',
    rutaLista: '/servicios/encargos-vip',
    coleccion: 'deslizmoto',
    categoria: 'encargos',
  },
};

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
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, color = T.accent }) {
  return (
    <p
      className="text-[10px] uppercase tracking-[0.22em] mb-4"
      style={{
        color,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
    </p>
  );
}

function StatBlock({ icon: Icon, value, label, color }) {
  return (
    <div
      className="p-4 flex flex-col gap-3"
      style={{
        background: T.bg,
        border: `1px solid ${T.line}`,
        borderRadius: '8px',
      }}
    >
      <Icon size={16} strokeWidth={1.75} style={{ color }} />
      <div>
        <p
          className="text-[22px] leading-none tabular-nums tracking-[-0.02em] mb-1.5"
          style={{
            color: T.ink,
            fontWeight: 400,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {value}
        </p>
        <p
          className="text-[9.5px] uppercase tracking-[0.15em]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function ActionPill({ icon: Icon, label, onClick, variant = 'neutral', colors, disabled = false }) {
  const [hover, setHover] = useState(false);

  const palette = {
    whatsapp: {
      bg: hover && !disabled ? '#15803D' : '#1A7F4B',
      color: '#FFFFFF',
      border: false,
    },
    outline: {
      bg: hover && !disabled ? colors.soft : 'transparent',
      color: hover && !disabled ? colors.hex : T.inkMid,
      border: true,
    },
    accent: {
      bg: hover && !disabled ? colors.hexDeep : colors.hex,
      color: '#FFFFFF',
      border: false,
    },
  };

  const p = palette[variant] || palette.outline;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center justify-center gap-2 w-full h-11 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: p.bg,
        color: p.color,
        border: p.border ? `1px solid ${T.line}` : 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '-0.005em',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Icon size={15} strokeWidth={1.75} />
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function DeslizProfilePage({ tipo = 'moto' }) {
  const router = useRouter();
  const { id } = router.query;
  const config = CONFIG[tipo] || CONFIG.moto;
  const colors = COLOR_STYLES[config.color] || COLOR_STYLES.primary;

  const { user, loading: authLoading, openLogin } = useAuth();

  const [prestador, setPrestador] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelacionados, setLoadingRelacionados] = useState(false);
  const [error, setError] = useState(null);

  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const IconPrincipal = config.iconPrincipal;

  // ─── Cargar prestador ─────────────────────────────────
  const cargarPrestador = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const record = await pb.collection(config.coleccion).getOne(id, {
        expand: 'userId',
      });

      if (record.tipo !== config.categoria) {
        router.replace(config.rutaLista);
        return;
      }

      const avatarUrl = record.fotoPerfil
        ? pb.files.getURL(record, record.fotoPerfil, { thumb: '600x600' })
        : null;

      const data = {
        id: record.id,
        userId: record.userId,
        tipo: record.tipo,
        nombre: record.nombre || record.expand?.userId?.nombre || 'Prestador',
        vehiculo: record.vehiculo || '—',
        placa: record.placa || '',
        rating: Number(record.rating) || 5,
        servicios: Number(record.servicios) || 0,
        experiencia: record.experiencia || 'Nuevo',
        satisfaccion: Number(record.satisfaccion) || 100,
        estado: record.estado || 'desconectado',
        zona: record.zona || '',
        descripcion: record.descripcion || config.descripcionDefault,
        whatsapp: record.whatsapp || record.expand?.userId?.telefono || '',
        telefono: record.telefono || record.expand?.userId?.telefono || '',
        avatar: avatarUrl,
        comision: Number(record.comision) ?? 5,
      };

      setPrestador(data);
      cargarRelacionados(record.id);
    } catch (err) {
      console.error('Error cargando prestador:', err);
      setError('No se pudo cargar el perfil. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [id, config, router]);

  const cargarRelacionados = async (excluirId) => {
    try {
      setLoadingRelacionados(true);
      const records = await pb
        .collection(config.coleccion)
        .getFullList({
          filter: `tipo = "${config.categoria}" && activo = true && id != "${excluirId}"`,
          sort: '-rating',
          limit: 6,
        })
        .catch(() => []);

      const data = records.map((r) => ({
        id: r.id,
        nombre: r.nombre || 'Prestador',
        vehiculo: r.vehiculo || '—',
        rating: Number(r.rating) || 5,
        servicios: Number(r.servicios) || 0,
        zona: r.zona || '',
        estado: r.estado || 'desconectado',
        avatar: r.fotoPerfil
          ? pb.files.getURL(r, r.fotoPerfil, { thumb: '300x300' })
          : null,
      }));

      setRelacionados(data);
    } catch (err) {
      console.error('Error cargando relacionados:', err);
    } finally {
      setLoadingRelacionados(false);
    }
  };

  useEffect(() => {
    cargarPrestador();
  }, [cargarPrestador]);

  // ─── Contacto ─────────────────────────────────────────
  const handleWhatsApp = () => {
    if (!prestador?.whatsapp && !prestador?.telefono) return;
    const num = formatWhatsApp(prestador.whatsapp || prestador.telefono);
    const msg = encodeURIComponent(
      motivo.trim()
        ? `${config.mensajeWhatsApp}.\n\n${motivo.trim()}`
        : config.mensajeWhatsApp
    );
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  const handleCall = () => {
    if (!prestador?.telefono) return;
    window.location.href = `tel:${prestador.telefono.replace(/\D/g, '')}`;
  };

  const handleSolicitar = () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!motivo.trim()) {
      setError('Cuéntanos qué necesitas para contactar al prestador');
      return;
    }
    setEnviando(true);
    setTimeout(() => {
      handleWhatsApp();
      setEnviando(false);
    }, 200);
  };

  const navigateTo = (path) => router.push(path);

  const notifications = [
    {
      id: 1,
      title: `¡Bienvenido a ${config.titulo} ${config.subtitulo}!`,
      description: 'Tu servicio express',
      time: 'Ahora',
      read: false,
    },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Loading ──────────────────────────────────────────
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
                Cargando perfil
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (error || !prestador) {
    return (
      <>
        <Head><title>Perfil no encontrado | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback={config.rutaLista} />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <AlertCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-3"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                {error || 'Perfil no encontrado'}
              </h1>
              <Link
                href={config.rutaLista}
                className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                style={{
                  background: colors.hex,
                  borderRadius: '6px',
                  fontWeight: 500,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                ← Volver a {config.titulo} {config.subtitulo}
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  const estaDisponible = prestador.estado === 'disponible';

  // ─── Render principal ─────────────────────────────────
  return (
    <>
      <Head>
        <title>
          {prestador.nombre} | {config.titulo} {config.subtitulo}
        </title>
        <meta
          name="description"
          content={`${prestador.descripcion}. ${prestador.rating} estrellas · ${prestador.servicios} ${config.labelServicios.toLowerCase()}.`}
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback={config.rutaLista} />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[720px] mx-auto px-6 md:px-14 py-10 md:py-14 w-full">

          {/* ═══ HERO · foto + nombre + estado ═══════════════ */}
          <section className="mb-10">
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: '4 / 3',
                background: 'rgba(15, 15, 15, 0.03)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              {prestador.avatar ? (
                <img
                  src={prestador.avatar}
                  alt={prestador.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={80} strokeWidth={1.25} style={{ color: T.inkGhost }} />
                </div>
              )}

              {/* Overlay gradient bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, rgba(15,15,15,0.8) 0%, rgba(15,15,15,0) 100%)',
                }}
              />

              {/* Badges top */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1"
                  style={{
                    background: estaDisponible
                      ? 'rgba(26, 127, 75, 0.92)'
                      : 'rgba(15, 15, 15, 0.7)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: estaDisponible ? '#FFFFFF' : '#9CA3AF',
                    }}
                  />
                  {estaDisponible ? 'Disponible' : 'Ocupado'}
                </span>

                {prestador.zona && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1"
                    style={{
                      background: 'rgba(250, 250, 249, 0.92)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      color: T.inkMid,
                      borderRadius: '4px',
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      fontWeight: 600,
                    }}
                  >
                    <MapPin size={9} strokeWidth={2.5} style={{ color: T.inkFaint }} />
                    {prestador.zona}
                  </span>
                )}
              </div>

              {/* Nombre + vehículo abajo */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h1
                    className="truncate"
                    style={{
                      color: '#FFFFFF',
                      fontSize: '24px',
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {prestador.nombre}
                  </h1>
                  <CheckCircle2
                    size={18}
                    strokeWidth={2}
                    style={{ color: '#60A5FA', fill: '#60A5FA', flexShrink: 0 }}
                  />
                </div>

                <p
                  className="truncate mb-2"
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '13px',
                    fontWeight: 450,
                  }}
                >
                  {prestador.vehiculo}
                  {prestador.placa && ` · ${prestador.placa}`}
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star
                      size={14}
                      strokeWidth={1.5}
                      style={{ color: '#F5B400', fill: '#F5B400' }}
                    />
                    <span
                      className="tabular-nums"
                      style={{
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {prestador.rating.toFixed(1)}
                    </span>
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '12px',
                        fontWeight: 450,
                      }}
                    >
                      · {prestador.servicios} {config.labelServicios.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ STATS · 3 columnas ══════════════════════════ */}
          <section className="mb-10">
            <SectionLabel color={colors.hex}>Resumen</SectionLabel>

            <div className="grid grid-cols-3 gap-3">
              <StatBlock
                icon={ShieldCheck}
                value={prestador.servicios}
                label={config.labelServicios}
                color={colors.hex}
              />
              <StatBlock
                icon={Clock}
                value={prestador.experiencia}
                label={config.labelRegistro}
                color={colors.hex}
              />
              <StatBlock
                icon={ThumbsUp}
                value={`${prestador.satisfaccion}%`}
                label={config.labelSatisfaccion}
                color={colors.hex}
              />
            </div>
          </section>

          {/* ═══ SOBRE MÍ ════════════════════════════════════ */}
          <section className="mb-10">
            <SectionLabel color={colors.hex}>Sobre mí</SectionLabel>

            <div
              className="p-5"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                borderLeft: `2px solid ${colors.hex}`,
                borderRadius: '6px',
              }}
            >
              <p
                className="text-[13.5px] leading-[1.7]"
                style={{ color: T.inkMid, fontWeight: 450 }}
              >
                {prestador.descripcion}
              </p>
            </div>
          </section>

          {/* ═══ CONTACTO DIRECTO ═══════════════════════════ */}
          {(prestador.whatsapp || prestador.telefono) && (
            <section className="mb-10">
              <SectionLabel color={colors.hex}>Contacto directo</SectionLabel>

              <div className="grid grid-cols-2 gap-3">
                {prestador.whatsapp && (
                  <ActionPill
                    icon={MessageCircle}
                    label="WhatsApp"
                    onClick={handleWhatsApp}
                    variant="whatsapp"
                    colors={colors}
                  />
                )}
                {prestador.telefono && (
                  <ActionPill
                    icon={Phone}
                    label="Llamar"
                    onClick={handleCall}
                    variant="outline"
                    colors={colors}
                  />
                )}
              </div>
            </section>
          )}

          {/* ═══ SOLICITAR SERVICIO ═════════════════════════ */}
          <section className="mb-10">
            <SectionLabel color={colors.hex}>Solicitar servicio</SectionLabel>

            <div
              className="p-5"
              style={{
                background: colors.soft,
                border: `1px solid ${colors.softStrong}`,
                borderRadius: '8px',
              }}
            >
              <p
                className="text-[12.5px] leading-[1.6] mb-4"
                style={{ color: T.inkMid, fontWeight: 450 }}
              >
                Cuéntale al prestador qué necesitas. Se abrirá WhatsApp con el
                mensaje listo.
              </p>

              <textarea
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (error) setError('');
                }}
                rows={3}
                placeholder={config.placeholderMotivo}
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
                  letterSpacing: '-0.005em',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = colors.hex)}
                onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
              />

              {error && (
                <div
                  className="mt-3 flex items-start gap-2.5 px-3 py-2.5"
                  style={{
                    background: 'rgba(197, 48, 48, 0.06)',
                    borderLeft: `2px solid ${T.red}`,
                    borderRadius: '4px',
                  }}
                >
                  <AlertCircle
                    size={13}
                    strokeWidth={1.75}
                    style={{ color: T.red, flexShrink: 0, marginTop: 2 }}
                  />
                  <p
                    className="text-[12px] leading-[1.55]"
                    style={{ color: T.red, fontWeight: 450 }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* Aviso comisión */}
              <div
                className="mt-4 flex items-start gap-2.5 px-3 py-2.5"
                style={{
                  background: T.bg,
                  border: `1px solid ${colors.softStrong}`,
                  borderRadius: '4px',
                }}
              >
                <Info
                  size={12}
                  strokeWidth={1.75}
                  style={{ color: colors.hex, flexShrink: 0, marginTop: 2 }}
                />
                <p
                  className="text-[11.5px] leading-[1.55]"
                  style={{ color: T.inkMid, fontWeight: 450 }}
                >
                  <strong style={{ color: colors.hex, fontWeight: 500 }}>
                    MarketDesliz retiene solo el 5%
                  </strong>{' '}
                  de comisión. El pago es directo entre tú y el prestador.
                </p>
              </div>

              <div className="mt-4">
                <ActionPill
                  icon={enviando ? null : Send}
                  label={enviando ? 'Enviando…' : 'Enviar solicitud por WhatsApp'}
                  onClick={handleSolicitar}
                  variant="accent"
                  colors={colors}
                  disabled={enviando}
                />
              </div>
            </div>
          </section>

          {/* ═══ RELACIONADOS ════════════════════════════════ */}
          {(relacionados.length > 0 || loadingRelacionados) && (
            <section className="mb-10">
              <div className="flex items-end justify-between gap-4 mb-4">
                <SectionLabel color={colors.hex}>
                  Otros {config.labelServicios.toLowerCase()}
                </SectionLabel>
                <Link
                  href={config.rutaLista}
                  className="text-[11px] uppercase tracking-[0.18em] flex items-center gap-1 whitespace-nowrap"
                  style={{ color: colors.hex, fontWeight: 500 }}
                >
                  Ver todos <ChevronRight size={12} strokeWidth={1.75} />
                </Link>
              </div>

              {loadingRelacionados ? (
                <div className="flex justify-center py-8">
                  <div
                    className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: T.line,
                      borderTopColor: colors.hex,
                    }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {relacionados.slice(0, 4).map((rel) => (
                    <RelacionadoCard
                      key={rel.id}
                      prestador={rel}
                      config={config}
                      colors={colors}
                      onClick={() => router.push(`${config.rutaLista}/${rel.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        <Footer variant="minimal" />
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
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
// RelacionadoCard · card minimal de prestador relacionado
// ─────────────────────────────────────────────────────────────────────────
function RelacionadoCard({ prestador, config, colors, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="text-left flex flex-col transition-all duration-300"
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
        cursor: 'pointer',
      }}
    >
      {/* Imagen */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'rgba(15, 15, 15, 0.03)' }}
      >
        {prestador.avatar ? (
          <img
            src={prestador.avatar}
            alt={prestador.nombre}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transitionTimingFunction: T.ease,
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={32} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        {prestador.estado === 'disponible' && (
          <span
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5"
            style={{
              background: 'rgba(26, 127, 75, 0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              borderRadius: '4px',
              fontSize: '8.5px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: '#FFFFFF' }} />
            Disponible
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 py-3">
        <p
          className="truncate mb-0.5"
          style={{
            color: T.ink,
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          {prestador.nombre}
        </p>
        <p
          className="truncate mb-2"
          style={{
            color: T.inkSoft,
            fontSize: '11px',
            fontWeight: 450,
          }}
        >
          {prestador.vehiculo}
        </p>
        <div className="flex items-center gap-1">
          <Star
            size={11}
            strokeWidth={1.5}
            style={{ color: '#F5B400', fill: '#F5B400' }}
          />
          <span
            className="tabular-nums"
            style={{
              color: T.ink,
              fontSize: '12px',
              fontWeight: 500,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {prestador.rating.toFixed(1)}
          </span>
          <span
            style={{
              color: T.inkFaint,
              fontSize: '10.5px',
              fontWeight: 450,
            }}
          >
            · {prestador.servicios} {config.labelServicios.toLowerCase()}
          </span>
        </div>
      </div>
    </button>
  );
}