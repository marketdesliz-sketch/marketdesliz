// src/components/desliz/DeslizServicePage.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Search, Bike, MapPin, User, ShieldCheck, Star, Clock,
  CheckCircle2, AlertCircle, Utensils, Crown, ChevronRight,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../TerminalBar';
import Header from '../Header';
import Footer from '../Footer';
import BackButton from '../BackButton';

// ─────────────────────────────────────────────────────────────────────────
// COLORES POR TIPO (usando hex directo, integrados al sistema minimal)
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
// CONFIGURACIÓN POR TIPO · SIN CAMBIOS (solo imágenes locales)
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  moto: {
    titulo: 'Deslizmoto',
    subtitulo: 'Express',
    tituloHero: 'Tu destino,',
    tituloHero2: 'en buenas manos.',
    tagline: 'Rápido. Seguro. Confiable.',
    descripcion:
      'Encuentra al conductor de moto verificado más cercano. Sin filas, sin trámites.',
    heroImage: '/images/deslizmoto-hero.jpg',
    iconPrincipal: Bike,
    placeholder: '¿A dónde quieres ir?',
    labelServicios: 'Viajes',
    labelRegistro: 'Registro',
    labelSatisfaccion: 'Satisf.',
    categoriaPlaceholder: 'Conductor',
    ctaTitulo: '¿Tienes moto?',
    ctaDescripcion: 'Únete a Deslizmoto Express y genera ingresos.',
    ctaBoton: 'Registrarme como conductor',
    categoria: 'moto',
    color: 'primary',
    rutaDetalle: '/servicios/deslizmoto',
  },
  food: {
    titulo: 'Desliz',
    subtitulo: 'Food',
    tituloHero: 'Comida caliente,',
    tituloHero2: 'a tu puerta.',
    tagline: 'Rápido. Fresco. Delicioso.',
    descripcion:
      'Pide a tu restaurante favorito. Repartidores verificados a un click.',
    heroImage: '/images/deslizfood-hero.jpg',
    iconPrincipal: Utensils,
    placeholder: '¿Qué se te antoja hoy?',
    labelServicios: 'Entregas',
    labelRegistro: 'Registro',
    labelSatisfaccion: 'Satisf.',
    categoriaPlaceholder: 'Repartidor',
    ctaTitulo: '¿Repartes comida?',
    ctaDescripcion: 'Únete a DeslizFood y llega a más clientes.',
    ctaBoton: 'Registrarme como repartidor',
    categoria: 'food',
    color: 'orange',
    rutaDetalle: '/servicios/deslizfood',
  },
  encargos: {
    titulo: 'Encargos',
    subtitulo: 'VIP',
    tituloHero: 'Mandados y encargos,',
    tituloHero2: 'a tu medida.',
    tagline: 'Exclusivo. Personal. Confiable.',
    descripcion:
      'Tu tiempo es valioso. Deja que un encargado VIP se ocupe de todo.',
    heroImage: '/images/encargos-hero.jpg',
    iconPrincipal: Crown,
    placeholder: '¿Qué necesitas encargar?',
    labelServicios: 'Encargos',
    labelRegistro: 'Registro',
    labelSatisfaccion: 'Satisf.',
    categoriaPlaceholder: 'Encargado',
    ctaTitulo: '¿Haces mandados?',
    ctaDescripcion: 'Únete a Encargos VIP y atiende clientes exclusivos.',
    ctaBoton: 'Registrarme como encargado',
    categoria: 'encargos',
    color: 'purple',
    rutaDetalle: '/servicios/encargos-vip',
  },
};

// ─────────────────────────────────────────────────────────────────────────
// SectionLabel
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, color = T.accent }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="text-[10px] uppercase tracking-[0.22em] whitespace-nowrap"
        style={{
          color,
          fontWeight: 500,
          fontFeatureSettings: '"ss01"',
        }}
      >
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: T.line }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PrestadorCard · minimal con acento temático
// ─────────────────────────────────────────────────────────────────────────
function PrestadorCard({ prestador, config, colors, onSelect }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group text-left flex flex-col transition-all duration-300"
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
      {/* Imagen / Avatar */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 5', background: 'rgba(15, 15, 15, 0.03)' }}
      >
        {prestador.avatar ? (
          <img
            src={prestador.avatar}
            alt={prestador.nombre}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transitionTimingFunction: T.ease,
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={56} strokeWidth={1.25} style={{ color: T.inkGhost }} />
          </div>
        )}

        {/* Overlay gradient bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(15,15,15,0.75) 0%, rgba(15,15,15,0) 100%)',
          }}
        />

        {/* Estado top-left */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1"
            style={{
              background:
                prestador.estado === 'disponible'
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
                background: prestador.estado === 'disponible' ? '#FFFFFF' : '#9CA3AF',
              }}
            />
            {prestador.estado === 'disponible' ? 'Disponible' : 'Ocupado'}
          </span>
        </div>

        {/* Zona top-right */}
        {prestador.zona && (
          <span
            className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1"
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

        {/* Nombre + rating */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <div className="flex items-center gap-1.5 mb-1">
            <h3
              className="truncate"
              style={{
                color: '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 500,
                letterSpacing: '-0.005em',
              }}
            >
              {prestador.nombre}
            </h3>
            <CheckCircle2
              size={14}
              strokeWidth={2}
              style={{ color: '#60A5FA', fill: '#60A5FA', flexShrink: 0 }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="truncate"
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '11px',
                fontWeight: 450,
              }}
            >
              {prestador.vehiculo}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <Star
                size={11}
                strokeWidth={1.5}
                style={{ color: '#F5B400', fill: '#F5B400' }}
              />
              <span
                className="tabular-nums"
                style={{
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 500,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {prestador.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats en 3 columnas */}
      <div
        className="grid grid-cols-3"
        style={{
          borderTop: `1px solid ${T.line}`,
        }}
      >
        {[
          { value: prestador.servicios, label: config.labelServicios },
          { value: prestador.experiencia, label: config.labelRegistro },
          {
            value: `${prestador.satisfaccion}%`,
            label: config.labelSatisfaccion,
            accent: true,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="py-3 text-center"
            style={{
              borderLeft: i > 0 ? `1px solid ${T.line}` : 'none',
            }}
          >
            <p
              className="tabular-nums truncate px-1"
              style={{
                color: stat.accent ? colors.hex : T.ink,
                fontSize: '13.5px',
                fontWeight: 500,
                fontFeatureSettings: '"tnum"',
                letterSpacing: '-0.005em',
              }}
            >
              {stat.value}
            </p>
            <p
              className="mt-1.5 truncate px-1"
              style={{
                color: T.inkFaint,
                fontSize: '9px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Footer */}
      <div
        className="px-3.5 py-3 flex items-center justify-between transition-colors"
        style={{
          borderTop: `1px solid ${T.line}`,
          background: hover ? colors.soft : 'transparent',
          transitionTimingFunction: T.ease,
        }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{
            color: colors.hex,
            fontWeight: 500,
          }}
        >
          Ver perfil
        </span>
        <ChevronRight
          size={13}
          strokeWidth={2}
          style={{
            color: colors.hex,
            transform: hover ? 'translateX(2px)' : 'translateX(0)',
            transition: `transform 0.2s ${T.ease}`,
          }}
        />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página principal · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function DeslizServicePage({ tipo = 'moto' }) {
  const router = useRouter();
  const config = CONFIG[tipo] || CONFIG.moto;
  const colors = COLOR_STYLES[config.color] || COLOR_STYLES.primary;

  const { user, openLogin } = useAuth();

  const [prestadores, setPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const navigateTo = (path) => router.push(path);

  const cargarPrestadores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const records = await pb
        .collection('deslizmoto')
        .getFullList({
          filter: `tipo = "${config.categoria}" && activo = true`,
          sort: '-rating,-servicios',
          expand: 'userId',
        })
        .catch(() => []);

      const data = records.map((r) => {
        const avatarUrl = r.fotoPerfil
          ? pb.files.getURL(r, r.fotoPerfil, { thumb: '300x300' })
          : null;

        return {
          id: r.id,
          userId: r.userId,
          tipo: r.tipo,
          nombre:
            r.nombre || r.expand?.userId?.nombre || config.categoriaPlaceholder,
          vehiculo: r.vehiculo || '—',
          placa: r.placa || '',
          rating: Number(r.rating) || 5,
          servicios: Number(r.servicios) || 0,
          experiencia: r.experiencia || 'Nuevo',
          satisfaccion: Number(r.satisfaccion) || 100,
          estado: r.estado || 'desconectado',
          zona: r.zona || '',
          avatar: avatarUrl,
          comision: Number(r.comision) ?? 5,
        };
      });

      setPrestadores(data);
    } catch (err) {
      console.error('Error cargando prestadores:', err);
      setError('No se pudieron cargar los prestadores. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [config.categoria, config.categoriaPlaceholder]);

  useEffect(() => {
    cargarPrestadores();
  }, [cargarPrestadores]);

  const prestadoresFiltrados = prestadores.filter((d) => {
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const match =
        d.nombre.toLowerCase().includes(s) ||
        d.vehiculo.toLowerCase().includes(s) ||
        d.zona.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (selectedCategory === 'disponible' && d.estado !== 'disponible') return false;
    if (selectedCategory === 'ocupado' && d.estado !== 'ocupado') return false;
    if (selectedCategory === 'zona' && !d.zona) return false;
    return true;
  });

  const stats = {
    total: prestadores.length,
    disponibles: prestadores.filter((d) => d.estado === 'disponible').length,
    ratingPromedio:
      prestadores.length > 0
        ? (
          prestadores.reduce((a, d) => a + d.rating, 0) / prestadores.length
        ).toFixed(1)
        : '5.0',
    serviciosTotales: prestadores.reduce((a, d) => a + d.servicios, 0),
  };

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
  const IconPrincipal = config.iconPrincipal;

  // ─── Loading ──────────────────────────────────────────
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
                Buscando {config.categoriaPlaceholder.toLowerCase()}s
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Head><title>Error | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/servicios" />
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
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Error al cargar
              </h1>
              <p
                className="text-[13.5px] mb-8 max-w-md mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <button
                onClick={cargarPrestadores}
                className="h-11 px-6 text-white text-[13.5px]"
                style={{
                  background: colors.hex,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.hexDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.hex)}
              >
                Reintentar
              </button>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Render principal ─────────────────────────────────
  return (
    <>
      <Head>
        <title>
          {config.titulo} {config.subtitulo} | MarketDesliz
        </title>
        <meta
          name="description"
          content={`${config.tagline} Encuentra el ${config.categoriaPlaceholder.toLowerCase()} perfecto.`}
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/servicios" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">

          {/* ─── IMAGEN EDITORIAL ─────────────────────── */}
          <section className="w-full">
            <div
              className="relative w-full overflow-hidden"
              style={{
                background: T.bg,
                aspectRatio: '1280 / 480',
                maxHeight: '520px',
              }}
            >
              <img
                src={config.heroImage}
                alt={config.titulo}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: 'grayscale(100%) contrast(1.15) brightness(1.02)',
                  mixBlendMode: 'multiply',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </section>

          {/* ─── EDITORIAL HEADER ─────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-12 md:pb-16">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              {config.titulo} {config.subtitulo} · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              {config.tituloHero}
              <br />
              <span
                className="font-serif italic"
                style={{ color: colors.hex }}
              >
                {config.tituloHero2}
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[22px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-xl font-serif italic"
              style={{ color: T.inkMid, fontWeight: 400 }}
            >
              {config.tagline}
            </p>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-4 max-w-lg"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              {config.descripcion}
            </p>
          </section>

          {/* ─── STATS ROW ─────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-10">
            <SectionLabel color={colors.hex}>Resumen</SectionLabel>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                {
                  valor: stats.total,
                  label: `${config.categoriaPlaceholder}s`,
                  icon: IconPrincipal,
                },
                {
                  valor: stats.disponibles,
                  label: 'Disponibles',
                  icon: CheckCircle2,
                },
                {
                  valor: stats.ratingPromedio,
                  label: 'Rating promedio',
                  icon: Star,
                },
                {
                  valor: stats.serviciosTotales,
                  label: `${config.labelServicios} totales`,
                  icon: ShieldCheck,
                },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="p-5 flex flex-col gap-3"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: '32px',
                          height: '32px',
                          background: colors.soft,
                          borderRadius: '6px',
                        }}
                      >
                        <Icon
                          size={14}
                          strokeWidth={1.75}
                          style={{ color: colors.hex }}
                        />
                      </div>
                      <p
                        className="text-[10px] uppercase tracking-[0.18em] truncate"
                        style={{ color: T.inkFaint, fontWeight: 500 }}
                      >
                        {stat.label}
                      </p>
                    </div>
                    <p
                      className="text-[28px] leading-none tabular-nums tracking-[-0.02em]"
                      style={{
                        color: T.ink,
                        fontWeight: 400,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {stat.valor}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─── BUSCADOR + FILTROS ───────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-10">
            <SectionLabel color={colors.hex}>Buscar y filtrar</SectionLabel>

            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={14}
                  strokeWidth={1.75}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: T.inkFaint }}
                />
                <input
                  type="text"
                  placeholder={config.placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 outline-none transition-colors"
                  style={{
                    height: '42px',
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.ink,
                    fontSize: '13.5px',
                    fontWeight: 450,
                    letterSpacing: '-0.005em',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = colors.hex)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                />
              </div>

              {/* Chips filtros */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Todos', icon: IconPrincipal },
                  { id: 'disponible', label: 'Disponibles', icon: CheckCircle2 },
                  { id: 'ocupado', label: 'Ocupados', icon: Clock },
                  { id: 'zona', label: 'Con zona', icon: MapPin },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <FilterChip
                      key={cat.id}
                      icon={Icon}
                      label={cat.label}
                      active={isActive}
                      colors={colors}
                      onClick={() => setSelectedCategory(cat.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Contador */}
            <div
              className="mt-4 flex items-center gap-2 text-[11px]"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              <IconPrincipal size={12} strokeWidth={1.75} />
              <span>
                {prestadoresFiltrados.length}{' '}
                {prestadoresFiltrados.length === 1
                  ? config.categoriaPlaceholder.toLowerCase()
                  : config.categoriaPlaceholder.toLowerCase() + 's'}{' '}
                {prestadoresFiltrados.length === 1 ? 'encontrado' : 'encontrados'}
              </span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 text-[10px] uppercase tracking-[0.18em] underline"
                  style={{
                    color: T.inkSoft,
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </section>

          {/* ─── GRID DE PRESTADORES ──────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16">
            <SectionLabel color={colors.hex}>
              {config.categoriaPlaceholder}s disponibles
            </SectionLabel>

            {prestadoresFiltrados.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
                style={{
                  background: 'rgba(15, 15, 15, 0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <div
                  className="inline-flex items-center justify-center mb-5"
                  style={{
                    width: '56px',
                    height: '56px',
                    background: colors.soft,
                    borderRadius: '10px',
                  }}
                >
                  <IconPrincipal
                    size={24}
                    strokeWidth={1.5}
                    style={{ color: colors.hex }}
                  />
                </div>
                <h3
                  className="text-[15px] mb-1"
                  style={{ color: T.ink, fontWeight: 500 }}
                >
                  No hay {config.categoriaPlaceholder.toLowerCase()}s disponibles
                </h3>
                <p
                  className="text-[13px] max-w-md"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {searchTerm
                    ? 'Prueba con otra búsqueda.'
                    : 'Vuelve a intentarlo en unos minutos.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {prestadoresFiltrados.map((p) => (
                  <PrestadorCard
                    key={p.id}
                    prestador={p}
                    config={config}
                    colors={colors}
                    onSelect={() => router.push(`${config.rutaDetalle}/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ─── CTA REGISTRO ─────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div
              className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10"
              style={{
                background: colors.soft,
                border: `1px solid ${colors.softStrong}`,
                borderRadius: '8px',
              }}
            >
              <div className="flex items-start gap-4 max-w-xl">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: T.bg,
                    border: `1px solid ${colors.softStrong}`,
                    borderRadius: '8px',
                  }}
                >
                  <IconPrincipal
                    size={22}
                    strokeWidth={1.75}
                    style={{ color: colors.hex }}
                  />
                </div>

                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-2"
                    style={{
                      color: colors.hex,
                      fontWeight: 500,
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    Únete · {config.titulo}
                  </p>
                  <h3
                    className="text-[22px] md:text-[28px] leading-[1.15] tracking-[-0.02em] mb-2"
                    style={{ color: T.ink, fontWeight: 400 }}
                  >
                    {config.ctaTitulo}
                  </h3>
                  <p
                    className="text-[13.5px] md:text-[14.5px] leading-[1.55]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    {config.ctaDescripcion}{' '}
                    <strong style={{ color: colors.hex, fontWeight: 500 }}>
                      MarketDesliz retiene solo el {prestadores[0]?.comision ?? 5}%.
                    </strong>
                  </p>
                </div>
              </div>

              <Link
                href="/vender-con-marketdesliz/pasos/01"
                className="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: colors.hex,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.hexDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.hex)}
              >
                {config.ctaBoton}
                <ChevronRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
// FilterChip · chip minimal con acento temático
// ─────────────────────────────────────────────────────────────────────────
function FilterChip({ icon: Icon, label, active, colors, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-1.5 px-3.5 h-10 whitespace-nowrap text-[12px] transition-all shrink-0"
      style={{
        background: active ? colors.hex : hover ? 'rgba(15,15,15,0.04)' : 'transparent',
        color: active ? '#FFFFFF' : T.inkMid,
        border: active ? `1px solid ${colors.hex}` : `1px solid ${T.line}`,
        borderRadius: '6px',
        fontWeight: 500,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      <Icon size={13} strokeWidth={1.75} />
      {label}
    </button>
  );
}