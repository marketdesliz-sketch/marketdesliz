// src/pages/bolsa-trabajo/index.js
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Briefcase, Plus, LayoutGrid, Building2,
  Search, DollarSign, MapPin, Clock, Phone, Mail,
  Inbox, ChevronRight, ChevronLeft, Home, Filter,
  X, ShoppingBag, Wrench, ChefHat, Truck, Grid2X2,
  Users, ArrowRight, Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL DEL HERO · LOCAL
// Guárdala en: /public/images/bolsa-trabajo-hero.jpg
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/bolsa-trabajo-hero.jpg';

const ITEMS_PER_PAGE = 12;

// ─── Categorías válidas · SIN CAMBIOS ────────────────────────────────────
const CATEGORIAS_BOLSA = [
  'ventas', 'atencion_cliente', 'administracion', 'tecnologia',
  'oficios', 'construccion', 'limpieza', 'cocina',
  'chofer', 'repartidor', 'informal', 'otro',
];

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

// ─── Categorías populares · 6 cards, estilo negocios · SIN CAMBIOS ───────
const CATEGORIAS_POPULARES = [
  { nombre: 'ventas',           label: 'Ventas',              icon: ShoppingBag },
  { nombre: 'atencion_cliente', label: 'Atención al cliente', icon: Users },
  { nombre: 'oficios',          label: 'Oficios',             icon: Wrench },
  { nombre: 'cocina',           label: 'Cocina',              icon: ChefHat },
  { nombre: 'repartidor',       label: 'Repartidor',          icon: Truck },
  { nombre: 'mas',              label: 'Más categorías',      icon: Grid2X2, esMas: true },
];

// ─── Helpers · SIN CAMBIOS ───────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ─────────────────────────────────────────────────────────────────────────
// TextLink · link de texto puro (mismo patrón que negocios)
// ─────────────────────────────────────────────────────────────────────────
function TextLink({ label, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="transition-colors duration-200"
      style={{
        color: hover ? T.accent : T.inkSoft,
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      {label} →
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SectionLabel · label de sección
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.22em]"
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

// ─────────────────────────────────────────────────────────────────────────
// CategoryCard · minimalista con count opcional
// ─────────────────────────────────────────────────────────────────────────
function CategoryCard({ cat, isActive, count, onClick }) {
  const [hover, setHover] = useState(false);
  const IconComponent = cat.icon;
  const highlighted = isActive || hover;
  const displayLabel = cat.label || cat.nombre;

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col items-center justify-center gap-3 py-6 px-3 transition-all duration-300"
      style={{
        background: 'transparent',
        border: `1px solid ${highlighted ? T.line : 'transparent'}`,
        borderRadius: '8px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        className="flex items-center justify-center transition-colors duration-300"
        style={{
          width: '44px',
          height: '44px',
          background: highlighted ? T.accent : 'rgba(15, 15, 15, 0.04)',
          borderRadius: '8px',
          transitionTimingFunction: T.ease,
        }}
      >
        <IconComponent
          size={20}
          strokeWidth={1.75}
          style={{
            color: highlighted ? '#FFFFFF' : T.inkMid,
            transition: `color 0.3s ${T.ease}`,
          }}
        />
      </div>
      <div className="text-center">
        <span
          className="text-[12px] block transition-colors duration-300"
          style={{
            color: highlighted ? T.ink : T.inkMid,
            fontWeight: 500,
            letterSpacing: '-0.005em',
            transitionTimingFunction: T.ease,
          }}
        >
          {displayLabel}
        </span>
        {!cat.esMas && count > 0 && (
          <span
            className="text-[10px] uppercase tracking-[0.15em] mt-1 block transition-colors duration-300 tabular-nums"
            style={{
              color: highlighted ? T.accent : T.inkFaint,
              fontWeight: 500,
              transitionTimingFunction: T.ease,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {count} {count === 1 ? 'oferta' : 'ofertas'}
          </span>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TypeBadge · badge de tipo de oferta
// ─────────────────────────────────────────────────────────────────────────
function TypeBadge({ tipo }) {
  const esOferta = tipo === 'ofrezco_trabajo';
  const Icon = esOferta ? Building2 : Search;
  const fg = esOferta ? T.accent : T.green;
  const bg = esOferta
    ? 'rgba(79, 46, 232, 0.08)'
    : 'rgba(26, 127, 75, 0.08)';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
      style={{
        background: bg,
        color: fg,
        borderRadius: '4px',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      <Icon size={10} strokeWidth={2.25} />
      {esOferta ? 'Ofrezco' : 'Busco'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// OfertaCard · card minimalista con acciones de contacto
// ─────────────────────────────────────────────────────────────────────────
function OfertaCard({ oferta }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col transition-all duration-300"
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
      }}
    >
      <div className="p-5 flex flex-col gap-3.5 flex-1">
        {/* Badge + fecha */}
        <div className="flex items-center justify-between gap-2">
          <TypeBadge tipo={oferta.tipo} />
          <span
            className="text-[10.5px] tabular-nums"
            style={{
              color: T.inkFaint,
              fontWeight: 450,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {formatDate(oferta.created)}
          </span>
        </div>

        {/* Título + categoría */}
        <div>
          <h3
            className="text-[15.5px] leading-snug tracking-[-0.005em]"
            style={{ color: T.ink, fontWeight: 500 }}
          >
            {oferta.titulo}
          </h3>
          <p
            className="text-[10px] uppercase tracking-[0.15em] mt-1.5"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            {getNombreCategoria(oferta.categoria)}
          </p>
        </div>

        {/* Descripción */}
        {oferta.descripcion && (
          <p
            className="text-[12.5px] leading-[1.55] line-clamp-3"
            style={{ color: T.inkSoft, fontWeight: 450 }}
          >
            {oferta.descripcion}
          </p>
        )}

        {/* Meta */}
        {(oferta.salario || oferta.ubicacion || oferta.horario) && (
          <div className="flex flex-col gap-1.5">
            {oferta.salario && (
              <div className="flex items-center gap-2">
                <DollarSign
                  size={12}
                  strokeWidth={1.75}
                  style={{ color: T.green, flexShrink: 0 }}
                />
                <span
                  className="text-[12px] tabular-nums"
                  style={{
                    color: T.green,
                    fontWeight: 500,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {oferta.salario}
                </span>
              </div>
            )}
            {oferta.ubicacion && (
              <div className="flex items-center gap-2">
                <MapPin
                  size={12}
                  strokeWidth={1.75}
                  style={{ color: T.inkFaint, flexShrink: 0 }}
                />
                <span
                  className="text-[12px] line-clamp-1"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {oferta.ubicacion}
                </span>
              </div>
            )}
            {oferta.horario && (
              <div className="flex items-center gap-2">
                <Clock
                  size={12}
                  strokeWidth={1.75}
                  style={{ color: T.inkFaint, flexShrink: 0 }}
                />
                <span
                  className="text-[12px] line-clamp-1"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {oferta.horario}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Contacto */}
        {(oferta.telefono || oferta.email) && (
          <div
            className="pt-3 mt-auto flex flex-col gap-1.5"
            style={{ borderTop: `1px solid ${T.line}` }}
          >
            {oferta.telefono && (
              <a
                href={`tel:${oferta.telefono}`}
                className="flex items-center gap-2 text-[12px] transition-colors"
                style={{
                  color: T.accent,
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Phone size={12} strokeWidth={1.75} />
                {oferta.telefono}
              </a>
            )}
            {oferta.email && (
              <a
                href={`mailto:${oferta.email}`}
                className="flex items-center gap-2 text-[12px] transition-colors"
                style={{
                  color: T.accent,
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Mail size={12} strokeWidth={1.75} />
                {oferta.email}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página principal — lógica SIN CAMBIOS (excepto gate de auth)
// ─────────────────────────────────────────────────────────────────────────
export default function BolsaTrabajoPage() {
  const router = useRouter();
  const {
    tipo = 'todos',
    categoria = '',
    q = '',
    page = '1',
    sort = 'newest',
  } = router.query;

  // Auth desde el contexto
  const { user, loading: authLoading, openLogin } = useAuth();

  const [ofertas, setOfertas] = useState([]);
  const [totalOfertas, setTotalOfertas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(tipo);
  const [filtroCategoria, setFiltroCategoria] = useState(categoria);
  const [busqueda, setBusqueda] = useState(q);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [sortBy, setSortBy] = useState(sort);
  const [totalPages, setTotalPages] = useState(0);

  // Contadores de ofertas por tipo y categoría
  const [counts, setCounts] = useState({ tipos: {}, categorias: {} });

  // Notificaciones (vacías, requeridas por Header)
  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Cargar contadores · solo con sesión ────────────────
  useEffect(() => {
    if (authLoading || !user) return;

    const cargarContadores = async () => {
      try {
        const tipos = ['busco_trabajo', 'ofrezco_trabajo'];
        const tipoCounts = {};
        for (const t of tipos) {
          const result = await pb.collection('bolsa_trabajo').getList(1, 1, {
            filter: `estado = "aprobado" && activo = true && tipo = "${t}"`,
            fields: 'id',
          });
          tipoCounts[t] = result.totalItems;
        }
        tipoCounts['todos'] = Object.values(tipoCounts).reduce(
          (a, b) => a + b,
          0
        );

        const catCounts = {};
        for (const cat of CATEGORIAS_BOLSA) {
          const result = await pb.collection('bolsa_trabajo').getList(1, 1, {
            filter: `estado = "aprobado" && activo = true && categoria = "${cat}"`,
            fields: 'id',
          });
          catCounts[cat] = result.totalItems;
        }

        setCounts({ tipos: tipoCounts, categorias: catCounts });
      } catch (err) {
        console.error('Error cargando contadores:', err);
      }
    };
    cargarContadores();
  }, [authLoading, user]);

  // ─── Cargar ofertas (con paginación y filtros) ──────────
  const cargarOfertas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let filter = 'estado = "aprobado" && activo = true';

      if (filtroTipo !== 'todos') {
        filter += ` && tipo = "${filtroTipo}"`;
      }

      if (filtroCategoria) {
        filter += ` && categoria = "${filtroCategoria}"`;
      }

      if (busqueda.trim()) {
        const term = busqueda.trim();
        filter += ` && (titulo ~ "${term}" || descripcion ~ "${term}")`;
      }

      let sortField = '-created';
      if (sortBy === 'newest') sortField = '-created';
      else if (sortBy === 'oldest') sortField = 'created';
      else if (sortBy === 'title') sortField = 'titulo';
      else if (sortBy === 'salary') sortField = 'salario';

      const result = await pb
        .collection('bolsa_trabajo')
        .getList(currentPage, ITEMS_PER_PAGE, {
          filter,
          sort: sortField,
          expand: 'userId',
        });

      setOfertas(result.items);
      setTotalOfertas(result.totalItems);
      setTotalPages(Math.ceil(result.totalItems / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error cargando ofertas:', err);
      setError('No pudimos cargar las ofertas. Intenta de nuevo.');
      setOfertas([]);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroCategoria, busqueda, currentPage, sortBy]);

  // ─── Disparar carga · solo con sesión ───────────────────
  useEffect(() => {
    if (authLoading || !user) return;
    cargarOfertas();
  }, [authLoading, user, cargarOfertas]);

  // ─── Actualizar URL con filtros ─────────────────────────
  const actualizarURL = useCallback(
    (params) => {
      const query = {
        tipo: filtroTipo,
        categoria: filtroCategoria || '',
        q: busqueda || '',
        page: currentPage,
        sort: sortBy,
        ...params,
      };
      Object.keys(query).forEach((key) => {
        if (!query[key] || query[key] === 'todos') delete query[key];
      });
      router.push(
        { pathname: '/bolsa-trabajo', query },
        undefined,
        { shallow: true }
      );
    },
    [filtroTipo, filtroCategoria, busqueda, currentPage, sortBy, router]
  );

  // ─── Handlers ────────────────────────────────────────────
  const handleFiltroTipo = (tipo) => {
    setFiltroTipo(tipo);
    setCurrentPage(1);
    actualizarURL({ tipo, page: 1 });
  };

  const handleFiltroCategoria = (cat) => {
    // Si ya está seleccionada, la quita (toggle)
    const nueva = filtroCategoria === cat ? '' : cat;
    setFiltroCategoria(nueva);
    setCurrentPage(1);
    actualizarURL({ categoria: nueva, page: 1 });
  };

  const handleBusqueda = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    actualizarURL({ q: busqueda, page: 1 });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
    actualizarURL({ sort: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    actualizarURL({ page: newPage });
  };

  const limpiarFiltros = () => {
    setFiltroTipo('todos');
    setFiltroCategoria('');
    setBusqueda('');
    setSortBy('newest');
    setCurrentPage(1);
    router.push('/bolsa-trabajo', undefined, { shallow: true });
  };

  const ofertasFiltradas = ofertas;

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

  // ─── Sin sesión · la bolsa requiere cuenta ──────────────
  if (!user) {
    return (
      <>
        <Head>
          <title>Bolsa de Trabajo | MarketDesliz</title>
          <meta
            name="description"
            content="Encuentra trabajo u ofrece empleo en tu comunidad. Publica tu oferta laboral de forma gratuita."
          />
          <meta name="theme-color" content="#0F0F0F" />
        </Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
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
                  para ver las ofertas.
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                La bolsa de trabajo está disponible solo para usuarios con
                cuenta en MarketDesliz.
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

  // ─── Loading inicial de datos ───────────────────────────
  if (loading && currentPage === 1 && !error) {
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
                Cargando ofertas
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Renderizado principal ──────────────────────────────
  return (
    <>
      <Head>
        <title>Bolsa de Trabajo | MarketDesliz</title>
        <meta
          name="description"
          content="Encuentra trabajo u ofrece empleo en tu comunidad. Publica tu oferta laboral de forma gratuita."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        {/* ═══ BOTÓN RETROCESO ═══ */}
        <BackButton fallback="/" />

        {/* ═══ BARRA TERMINAL ═══ */}
        <TerminalBar mode="rotating" />

        {/* ═══ HEADER ═══ */}
        <Header notifications={notifications} unreadCount={unreadCount} />

        {/* ═══ MAIN ═══ */}
        <main className="flex-1">
          {/* ─── IMAGEN EDITORIAL ─────────────────────────── */}
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
                src={HERO_IMAGE}
                alt="Bolsa de trabajo MarketDesliz"
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

          {/* ─── EDITORIAL HEADER ─────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-12 md:pb-16">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Bolsa de trabajo · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Oportunidades,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                en tu comunidad.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Encuentra trabajo u ofrece empleo en tu zona. Contacto directo, sin
              intermediarios.
            </p>

            <div className="flex flex-wrap items-center gap-5 mt-8">
              <button
                onClick={() => router.push('/bolsa-trabajo/publicar')}
                className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                <Plus size={14} strokeWidth={1.75} /> Publicar oferta
              </button>

              <Link
                href="/bolsa-trabajo/mis-publicaciones"
                className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] transition-colors"
                style={{
                  color: T.inkSoft,
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.inkSoft)}
              >
                <Briefcase size={13} strokeWidth={1.75} /> Mis publicaciones
              </Link>
            </div>
          </section>

          {/* ─── CATEGORÍAS POPULARES ─────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-20">
            <div className="flex items-baseline justify-between mb-5">
              <SectionLabel>Categorías populares</SectionLabel>
              {filtroCategoria && (
                <TextLink
                  label="Ver todas"
                  onClick={() => handleFiltroCategoria('')}
                />
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {CATEGORIAS_POPULARES.map((cat) => {
                const isActive = filtroCategoria === cat.nombre;
                const count = counts.categorias[cat.nombre] || 0;
                const handleClick = cat.esMas
                  ? () => {
                      setFiltroCategoria('');
                      setCurrentPage(1);
                      actualizarURL({ categoria: '', page: 1 });
                    }
                  : () => handleFiltroCategoria(cat.nombre);
                return (
                  <CategoryCard
                    key={cat.nombre}
                    cat={cat}
                    isActive={isActive}
                    count={count}
                    onClick={handleClick}
                  />
                );
              })}
            </div>
          </section>

          {/* ─── FILTROS · Buscador + selects ─────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-8">
            <div className="flex items-baseline justify-between mb-4">
              <SectionLabel>Buscar y filtrar</SectionLabel>
              <span
                className="text-[11px] tabular-nums"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {loading
                  ? '…'
                  : `${totalOfertas} ${
                      totalOfertas === 1 ? 'oferta' : 'ofertas'
                    }`}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {/* Buscador */}
              <div className="flex-1">
                <form onSubmit={handleBusqueda} className="relative">
                  <Search
                    size={14}
                    strokeWidth={1.75}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: T.inkFaint }}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por título, empresa o palabra clave..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-10 outline-none transition-colors"
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
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'rgba(15,15,15,0.2)')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = T.line)
                    }
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda('');
                        actualizarURL({ q: '', page: 1 });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{
                        color: T.inkFaint,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      aria-label="Limpiar búsqueda"
                    >
                      <X size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </form>
              </div>

              {/* Selects */}
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={filtroTipo}
                  onChange={(e) => handleFiltroTipo(e.target.value)}
                  className="outline-none appearance-none"
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontSize: '13px',
                    fontWeight: 450,
                    cursor: 'pointer',
                  }}
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="ofrezco_trabajo">Ofrezco trabajo</option>
                  <option value="busco_trabajo">Busco trabajo</option>
                </select>

                <select
                  value={filtroCategoria}
                  onChange={(e) => handleFiltroCategoria(e.target.value)}
                  className="outline-none appearance-none"
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontSize: '13px',
                    fontWeight: 450,
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIAS_BOLSA.map((cat) => (
                    <option key={cat} value={cat}>
                      {getNombreCategoria(cat)}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <Filter
                    size={13}
                    strokeWidth={1.75}
                    style={{ color: T.inkFaint }}
                  />
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="outline-none appearance-none"
                    style={{
                      height: '42px',
                      padding: '0 14px',
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontSize: '13px',
                      fontWeight: 450,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguas</option>
                    <option value="title">Por título</option>
                    <option value="salary">Por salario</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contador de filtros activos */}
            <div
              className="mt-3 flex items-center gap-2 flex-wrap text-[11.5px] tabular-nums"
              style={{
                color: T.inkFaint,
                fontWeight: 450,
                fontFeatureSettings: '"tnum"',
              }}
            >
              <Briefcase size={12} strokeWidth={1.75} />
              {loading
                ? 'Cargando...'
                : `${totalOfertas} ${
                    totalOfertas === 1 ? 'oferta' : 'ofertas'
                  } encontradas`}
              {filtroCategoria && (
                <span
                  className="px-2 py-0.5 uppercase tracking-[0.12em]"
                  style={{
                    background: 'rgba(79, 46, 232, 0.08)',
                    color: T.accent,
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {getNombreCategoria(filtroCategoria)}
                </span>
              )}
              {filtroTipo !== 'todos' && (
                <span
                  className="px-2 py-0.5 uppercase tracking-[0.12em]"
                  style={{
                    background: 'rgba(79, 46, 232, 0.08)',
                    color: T.accent,
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {filtroTipo === 'ofrezco_trabajo'
                    ? 'Ofrezco trabajo'
                    : 'Busco trabajo'}
                </span>
              )}
              {(filtroTipo !== 'todos' || filtroCategoria || busqueda) && (
                <button
                  onClick={limpiarFiltros}
                  className="ml-1 transition-colors"
                  style={{
                    color: T.inkFaint,
                    textDecoration: 'underline',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 450,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.inkSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.inkFaint)}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </section>

          {/* ─── FILTROS RÁPIDOS POR TIPO (pills) ──────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-10">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'todos', label: 'Todos', icon: LayoutGrid },
                { id: 'ofrezco_trabajo', label: 'Ofrezco trabajo', icon: Building2 },
                { id: 'busco_trabajo', label: 'Busco trabajo', icon: Search },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = filtroTipo === id;
                const count = counts.tipos[id] || 0;
                return (
                  <button
                    key={id}
                    onClick={() => handleFiltroTipo(id)}
                    className="inline-flex items-center gap-2 transition-colors"
                    style={{
                      height: '36px',
                      padding: '0 14px',
                      background: isActive ? T.ink : 'transparent',
                      color: isActive ? T.bg : T.inkMid,
                      border: `1px solid ${isActive ? T.ink : T.line}`,
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                  >
                    <Icon size={13} strokeWidth={1.75} />
                    {label}
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: '11px',
                        opacity: isActive ? 0.7 : 0.55,
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── LISTA DE OFERTAS ──────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            {error ? (
              <div
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
                style={{
                  background: 'rgba(197, 48, 48, 0.04)',
                  border: `1px solid rgba(197, 48, 48, 0.12)`,
                  borderRadius: '8px',
                }}
              >
                <Inbox
                  size={32}
                  strokeWidth={1.5}
                  style={{ color: T.red, marginBottom: '16px' }}
                />
                <h3
                  className="text-[15px] mb-1"
                  style={{ color: T.ink, fontWeight: 500 }}
                >
                  Error al cargar ofertas
                </h3>
                <p
                  className="text-[13px] max-w-md mb-6"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {error}
                </p>
                <button
                  onClick={cargarOfertas}
                  className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
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
                  Reintentar
                </button>
              </div>
            ) : ofertasFiltradas.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
                style={{
                  background: 'rgba(15, 15, 15, 0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <Inbox
                  size={32}
                  strokeWidth={1.5}
                  style={{ color: T.inkGhost, marginBottom: '16px' }}
                />
                <h3
                  className="text-[15px] mb-1"
                  style={{ color: T.ink, fontWeight: 500 }}
                >
                  No hay ofertas disponibles
                </h3>
                <p
                  className="text-[13px] max-w-md"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {busqueda
                    ? 'Intenta con otra palabra clave.'
                    : 'Sé el primero en publicar.'}
                </p>

                <div
                  className="mt-8 p-5 max-w-md w-full text-left"
                  style={{
                    background: 'rgba(79, 46, 232, 0.04)',
                    border: `1px solid rgba(79, 46, 232, 0.12)`,
                    borderRadius: '8px',
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-2"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    ¿Buscas talento o empleo?
                  </p>
                  <p
                    className="text-[13px] leading-[1.55]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Publica tu oferta gratis y llega a más personas en tu
                    comunidad.
                  </p>
                  <Link
                    href="/bolsa-trabajo/publicar"
                    className="inline-block mt-3 text-[12.5px]"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    Publicar oferta →
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {ofertasFiltradas.map((oferta) => (
                    <OfertaCard key={oferta.id} oferta={oferta} />
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${T.line}`,
                        borderRadius: '6px',
                        color: T.inkMid,
                        fontWeight: 500,
                        cursor:
                          currentPage === totalPages
                            ? 'not-allowed'
                            : 'pointer',
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
          </section>

          {/* ─── BANNER CTA · ¿Eres empresa? ───────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10"
              style={{
                background: 'rgba(79, 46, 232, 0.04)',
                border: `1px solid rgba(79, 46, 232, 0.12)`,
                borderRadius: '8px',
              }}
            >
              <div className="max-w-xl">
                <p
                  className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-3"
                  style={{
                    color: T.accent,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Publica gratis
                </p>
                <h3
                  className="text-[22px] md:text-[28px] leading-[1.15] tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  ¿Eres empresa o buscas talento?
                </h3>
                <p
                  className="text-[13.5px] md:text-[15px] leading-[1.55] mt-2"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Publica tus vacantes gratis y llega a más personas en tu
                  comunidad.
                </p>
              </div>

              <button
                onClick={() => router.push('/bolsa-trabajo/publicar')}
                className="shrink-0 px-6 h-11 text-white text-[13px] transition-colors duration-200 inline-flex items-center gap-2"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentDeep)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
              >
                Publicar oferta <ArrowRight size={13} strokeWidth={1.75} />
              </button>
            </div>
          </section>
        </main>

        {/* ═══ FOOTER público ═══ */}
        <Footer />
      </div>

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