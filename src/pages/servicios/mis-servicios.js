// src/pages/servicios/mis-servicios.js
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Wrench, Eye, MapPin, Star, Clock, CheckCircle, XCircle,
  AlertCircle, Filter, RefreshCw, Pencil, Plus, ShieldCheck,
  ChevronLeft, ChevronRight, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
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

const getEstadoInfo = (estado) => {
  switch (estado) {
    case 'activo':
      return { label: 'Activo', color: '#1A7F4B', bg: 'rgba(26, 127, 75, 0.08)', icon: CheckCircle };
    case 'pendiente_activacion':
      return { label: 'Pendiente', color: '#B8820E', bg: 'rgba(184, 130, 14, 0.08)', icon: Clock };
    case 'inactivo':
      return { label: 'Inactivo', color: T.inkMid, bg: 'rgba(15, 15, 15, 0.05)', icon: XCircle };
    default:
      return { label: 'Pendiente', color: '#B8820E', bg: 'rgba(184, 130, 14, 0.08)', icon: Clock };
  }
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

function StatCard({ icon: Icon, label, value, valueColor = T.ink }) {
  return (
    <div
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
            background: 'rgba(79, 46, 232, 0.06)',
            borderRadius: '6px',
          }}
        >
          <Icon size={14} strokeWidth={1.75} style={{ color: T.accent }} />
        </div>
        <p
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {label}
        </p>
      </div>

      <p
        className="text-[28px] leading-none tabular-nums tracking-[-0.02em]"
        style={{ color: valueColor, fontWeight: 400, fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </p>
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="px-3 h-7 text-[11.5px] uppercase tracking-[0.15em] transition-all"
      style={{
        background: active ? T.bg : 'transparent',
        color: active ? T.ink : hover ? T.inkMid : T.inkFaint,
        borderRadius: '4px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        boxShadow: active ? '0 1px 2px rgba(15,15,15,0.04)' : 'none',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      {label}
    </button>
  );
}

function ServicioAdminCard({ servicio }) {
  const [hover, setHover] = useState(false);
  const estadoInfo = getEstadoInfo(servicio.estadoActivacion);
  const EstadoIcon = estadoInfo.icon;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col p-5 transition-all duration-300"
      style={{
        background: T.bg,
        border: `1px solid ${hover ? 'rgba(15,15,15,0.14)' : T.line}`,
        borderRadius: '8px',
        boxShadow: hover
          ? '0 1px 2px rgba(15,15,15,0.04), 0 8px 24px rgba(15,15,15,0.06)'
          : 'none',
        transitionTimingFunction: T.ease,
      }}
    >
      {/* Header de la card: thumbnail + info + estado */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Thumbnail */}
          <div
            className="flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              width: '60px',
              height: '60px',
              background: 'rgba(15, 15, 15, 0.03)',
              border: `1px solid ${T.line}`,
              borderRadius: '8px',
            }}
          >
            {servicio.imagen ? (
              <img
                src={servicio.imagen}
                alt={servicio.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Wrench size={22} strokeWidth={1.5} style={{ color: T.inkGhost }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h3
                className="text-[15px] leading-snug tracking-[-0.005em] truncate"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {servicio.nombre}
              </h3>
              {servicio.verificado && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 shrink-0"
                  style={{
                    background: 'rgba(26, 127, 75, 0.08)',
                    color: '#1A7F4B',
                    borderRadius: '3px',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={9} strokeWidth={2.5} /> Verificado
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11.5px] flex-wrap">
              {servicio.categoria && (
                <span
                  className="px-2 py-0.5"
                  style={{
                    background: 'rgba(15, 15, 15, 0.04)',
                    color: T.inkMid,
                    borderRadius: '3px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontSize: '9.5px',
                  }}
                >
                  {servicio.categoria}
                </span>
              )}
              {servicio.direccion && (
                <span
                  className="flex items-center gap-1 truncate max-w-[220px]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  <MapPin size={10} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                  {servicio.direccion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estado badge */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
          style={{
            background: estadoInfo.bg,
            color: estadoInfo.color,
            borderRadius: '4px',
            fontSize: '9.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 600,
          }}
        >
          <EstadoIcon size={10} strokeWidth={2.5} /> {estadoInfo.label}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div
          className="p-3 text-center"
          style={{
            background: 'rgba(15, 15, 15, 0.02)',
            borderRadius: '6px',
          }}
        >
          <p
            className="text-[9.5px] uppercase tracking-[0.15em] mb-1.5"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            Visitas
          </p>
          <p
            className="text-[15px] tabular-nums"
            style={{ color: T.ink, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
          >
            {servicio.visitas}
          </p>
        </div>
        <div
          className="p-3 text-center"
          style={{
            background: 'rgba(15, 15, 15, 0.02)',
            borderRadius: '6px',
          }}
        >
          <p
            className="text-[9.5px] uppercase tracking-[0.15em] mb-1.5"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            Calificación
          </p>
          <div className="flex items-center justify-center gap-1">
            <Star
              size={11}
              strokeWidth={1.5}
              style={{ fill: '#F5B400', color: '#F5B400' }}
            />
            <p
              className="text-[15px] tabular-nums"
              style={{ color: T.ink, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
            >
              {servicio.calificacion.toFixed(1)}
            </p>
          </div>
        </div>
        <div
          className="p-3 text-center"
          style={{
            background: 'rgba(15, 15, 15, 0.02)',
            borderRadius: '6px',
          }}
        >
          <p
            className="text-[9.5px] uppercase tracking-[0.15em] mb-1.5"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            Precio
          </p>
          <p
            className="text-[15px] tabular-nums"
            style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
          >
            {servicio.precioBase > 0 ? `$${servicio.precioBase.toLocaleString()}` : '—'}
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/servicios/${servicio.id}`}
          className="flex items-center justify-center gap-1.5 h-10 text-[12.5px] transition-colors"
          style={{
            background: 'transparent',
            border: `1px solid ${T.line}`,
            borderRadius: '6px',
            color: T.inkMid,
            fontWeight: 500,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Eye size={13} strokeWidth={1.75} /> Ver
        </Link>
        <Link
          href={`/servicios/editar?id=${servicio.id}`}
          className="flex items-center justify-center gap-1.5 h-10 text-white text-[12.5px] transition-colors"
          style={{
            background: T.accent,
            borderRadius: '6px',
            fontWeight: 500,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
        >
          <Pencil size={13} strokeWidth={1.75} /> Editar
        </Link>
      </div>

      {/* Aviso pendiente */}
      {servicio.estadoActivacion === 'pendiente_activacion' && (
        <div
          className="mt-3 flex items-start gap-2 px-3 py-2.5"
          style={{
            background: 'rgba(184, 130, 14, 0.06)',
            borderLeft: '2px solid #B8820E',
            borderRadius: '4px',
          }}
        >
          <AlertCircle
            size={12}
            strokeWidth={1.75}
            style={{ color: '#B8820E', flexShrink: 0, marginTop: 2 }}
          />
          <p
            className="text-[11.5px] leading-[1.55]"
            style={{ color: '#8A6109', fontWeight: 450 }}
          >
            Tu servicio está pendiente de aprobación. Pronto aparecerá en la lista pública.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function MisServiciosPage() {
  const router = useRouter();

  const { user, isAuthenticated, loading: authLoading, openLogin } = useAuth();

  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cargarMisServicios = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const records = await pb.collection('servicios').getFullList({
        filter: `usuarioId = "${user.id}"`,
        sort: '-created',
        expand: 'municipioId,localidadId',
      });

      const serviciosData = records.map((s) => {
        let imagenUrl = null;
        if (s.logo) {
          imagenUrl = pb.files.getURL(s, s.logo);
        } else if (s.imagenes) {
          const arr = Array.isArray(s.imagenes) ? s.imagenes : [s.imagenes];
          if (arr.length > 0 && arr[0]) {
            imagenUrl = pb.files.getURL(s, arr[0]);
          }
        }

        return {
          id: s.id,
          nombre: s.nombre || '',
          descripcion: s.descripcion || '',
          categoria: s.categoria || '',
          direccion: s.direccion || '',
          telefono: s.telefono || '',
          whatsapp: s.whatsapp || '',
          horario: s.horario || '',
          precioBase: s.precioBase || 0,
          imagen: imagenUrl,
          visitas: s.visitas || 0,
          calificacion: s.calificacion || 0,
          totalComentarios: s.totalComentarios || 0,
          estadoActivacion: s.estadoActivacion || 'pendiente_activacion',
          activo: s.activo !== false,
          verificado: s.verificado === true,
          destacado: s.destacado === true,
          esMarketDesliz: s.esMarketDesliz === true,
          creado: s.created,
          actualizado: s.updated,
          municipioNombre: s.expand?.municipioId?.nombre || '',
          localidadNombre: s.expand?.localidadId?.nombre || '',
        };
      });

      setServicios(serviciosData);
    } catch (err) {
      console.error('Error cargando servicios:', err);
      setError('No pudimos cargar tus servicios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      openLogin();
      return;
    }

    cargarMisServicios();
  }, [authLoading, user, cargarMisServicios, openLogin]);

  const stats = useMemo(() => {
    const total = servicios.length;
    const activos = servicios.filter((s) => s.estadoActivacion === 'activo').length;
    const pendientes = servicios.filter((s) => s.estadoActivacion === 'pendiente_activacion').length;
    const visitasTotales = servicios.reduce((sum, s) => sum + (s.visitas || 0), 0);
    return { total, activos, pendientes, visitasTotales };
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return servicios;
    if (filtroEstado === 'activos') return servicios.filter((s) => s.estadoActivacion === 'activo');
    if (filtroEstado === 'pendientes') return servicios.filter((s) => s.estadoActivacion === 'pendiente_activacion');
    if (filtroEstado === 'inactivos') return servicios.filter((s) => s.estadoActivacion === 'inactivo');
    return servicios;
  }, [servicios, filtroEstado]);

  const totalPages = Math.ceil(serviciosFiltrados.length / itemsPerPage);
  const paginatedServicios = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return serviciosFiltrados.slice(start, start + itemsPerPage);
  }, [serviciosFiltrados, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado]);

  const notifications = [
    { id: 1, title: '¡Nuevos servicios!', description: 'Descubre lo nuevo esta semana', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const navigateTo = (path) => router.push(path);

  // ─── Loading ─────────────────────────────────────────────
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
                Cargando
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ───────────────────────────────────────────────
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
              <XCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Error al cargar tus servicios
              </h1>
              <p
                className="text-[13.5px] mb-8 max-w-md mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <button
                onClick={cargarMisServicios}
                className="inline-flex items-center gap-2 h-11 px-6 text-white text-[13.5px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                <RefreshCw size={14} strokeWidth={1.75} /> Reintentar
              </button>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Sin autenticación ───────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <>
        <Head><title>Inicia sesión | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/servicios" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
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

              <h1
                className="text-[32px] md:text-[40px] leading-tight tracking-[-0.03em] mb-3"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Inicia sesión
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  para continuar.
                </span>
              </h1>

              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas iniciar sesión para ver tus servicios.
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
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
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

  // ─── Render principal ────────────────────────────────────
  return (
    <>
      <Head>
        <title>Mis Servicios | MarketDesliz</title>
        <meta
          name="description"
          content="Gestiona todos tus servicios registrados en MarketDesliz."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/servicios" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Header editorial ─────────────────────────── */}
          <section className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-4"
                  style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                >
                  Gestión · Proveedor de servicios
                </p>

                <h1
                  className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em] mb-2"
                  style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                >
                  Mis
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}servicios.
                  </span>
                </h1>

                <p className="text-[14px]" style={{ color: T.inkSoft, fontWeight: 450 }}>
                  Gestiona todos tus servicios registrados.
                </p>
              </div>

              <Link
                href="/servicios/registro"
                className="inline-flex items-center gap-2 h-10 px-5 shrink-0 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                <Plus size={14} strokeWidth={2} /> Registrar nuevo
              </Link>
            </div>
          </section>

          {/* ─── Stats ────────────────────────────────────── */}
          <section className="mb-10">
            <SectionLabel>Resumen</SectionLabel>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatCard icon={Wrench} label="Total" value={stats.total} />
              <StatCard
                icon={CheckCircle}
                label="Activos"
                value={stats.activos}
                valueColor="#1A7F4B"
              />
              <StatCard
                icon={Clock}
                label="Pendientes"
                value={stats.pendientes}
                valueColor="#B8820E"
              />
              <StatCard
                icon={Eye}
                label="Visitas"
                value={stats.visitasTotales}
                valueColor={T.accent}
              />
            </div>
          </section>

          {/* ─── Filtros ──────────────────────────────────── */}
          <section className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  <Filter size={11} strokeWidth={1.75} />
                  Filtrar
                </div>

                <div
                  className="flex gap-1 p-1"
                  style={{
                    background: 'rgba(15,15,15,0.03)',
                    borderRadius: '6px',
                  }}
                >
                  {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'activos', label: 'Activos' },
                    { key: 'pendientes', label: 'Pendientes' },
                    { key: 'inactivos', label: 'Inactivos' },
                  ].map((opcion) => (
                    <FilterChip
                      key={opcion.key}
                      label={opcion.label}
                      active={filtroEstado === opcion.key}
                      onClick={() => setFiltroEstado(opcion.key)}
                    />
                  ))}
                </div>
              </div>

              <span
                className="text-[11px] tabular-nums"
                style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
              >
                {serviciosFiltrados.length}{' '}
                {serviciosFiltrados.length === 1 ? 'servicio' : 'servicios'}
              </span>
            </div>
          </section>

          {/* ─── Lista ────────────────────────────────────── */}
          {serviciosFiltrados.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <Wrench
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {filtroEstado !== 'todos'
                  ? `No tienes servicios ${filtroEstado}`
                  : 'No tienes servicios registrados'}
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {filtroEstado !== 'todos'
                  ? 'Cambia el filtro para ver otros servicios.'
                  : 'Registra tu primer servicio y empieza a recibir clientes.'}
              </p>
              <Link
                href="/servicios/registro"
                className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Plus size={14} strokeWidth={2} /> Registrar servicio
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {paginatedServicios.map((servicio) => (
                  <ServicioAdminCard key={servicio.id} servicio={servicio} />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage > 1) {
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.color = T.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.line;
                      e.currentTarget.style.color = T.inkMid;
                    }}
                  >
                    <ChevronLeft size={13} strokeWidth={1.75} /> Anterior
                  </button>

                  <span
                    className="px-3 text-[12px] tabular-nums"
                    style={{
                      color: T.inkFaint,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage < totalPages) {
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.color = T.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.line;
                      e.currentTarget.style.color = T.inkMid;
                    }}
                  >
                    Siguiente <ChevronRight size={13} strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </>
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