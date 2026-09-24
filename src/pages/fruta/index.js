// src/pages/fruta/index.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Grid2X2, Heart, Package, Apple, Banana, Carrot, Cherry,
  Citrus, Sprout, Search, Salad,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { formatMoney } from '../../lib/utils';
import { getFrutas } from '../../lib/frutasService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL DEL HERO · LOCAL
// Guárdala en: /public/images/fruta-hero.jpg
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/fruta-hero.jpg';

// ─────────────────────────────────────────────────────────────────────────
// Categorías básicas · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const CATEGORIAS_BASICAS = [
  { nombre: 'Frutas', icon: Apple },
  { nombre: 'Verduras', icon: Carrot },
  { nombre: 'Cítricos', icon: Citrus },
  { nombre: 'Tropicales', icon: Banana },
  { nombre: 'Frutos rojos', icon: Cherry },
  { nombre: 'Más categorías', icon: Grid2X2, esMasCategorias: true },
];

// ─────────────────────────────────────────────────────────────────────────
// TextLink
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
// CategoryCard · minimal
// ─────────────────────────────────────────────────────────────────────────
function CategoryCard({ cat, isActive, onClick }) {
  const [hover, setHover] = useState(false);
  const IconComponent = cat.icon;
  const highlighted = isActive || hover;

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
        cursor: 'pointer',
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
      <span
        className="text-[12px] text-center transition-colors duration-300"
        style={{
          color: highlighted ? T.ink : T.inkMid,
          fontWeight: 500,
          letterSpacing: '-0.005em',
          transitionTimingFunction: T.ease,
        }}
      >
        {cat.nombre}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FrutaCard · minimal con badges de nuevo/temporada
// ─────────────────────────────────────────────────────────────────────────
function FrutaCard({ producto, isFavorite, onToggleFavorite, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
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
      {/* Imagen */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'rgba(15, 15, 15, 0.03)' }}
      >
        {producto.imagen ? (
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
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        {/* Favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          className="absolute top-3 right-3 flex items-center justify-center"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(250, 250, 249, 0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '50%',
            WebkitTapHighlightColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Heart
            size={14}
            strokeWidth={1.75}
            style={{
              color: isFavorite ? '#C53030' : T.inkMid,
              fill: isFavorite ? '#C53030' : 'transparent',
            }}
          />
        </button>

        {/* Badge Nuevo */}
        {producto.nuevo && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5"
              style={{
                background: 'rgba(79, 46, 232, 0.92)',
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
              Nuevo
            </span>
          </div>
        )}

        {/* Badge Temporada */}
        {producto.temporada && !producto.nuevo && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5"
              style={{
                background: 'rgba(26, 127, 75, 0.92)',
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
              <Sprout size={9} strokeWidth={2.5} /> Temporada
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3.5 flex flex-col gap-1.5 flex-1">
        <h3
          className="text-[13.5px] leading-snug tracking-[-0.005em] truncate"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          {producto.nombre}
        </h3>

        {producto.categoria && (
          <p
            className="text-[11px] uppercase tracking-[0.15em] truncate"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            {producto.categoria}
          </p>
        )}

        <p
          className="text-[15px] tabular-nums tracking-[-0.01em] mt-0.5"
          style={{
            color: T.ink,
            fontWeight: 500,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {formatMoney(producto.precio)}
          {producto.unidad && (
            <span
              className="text-[11px] ml-1"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              / {producto.unidad}
            </span>
          )}
        </p>

        {producto.precioAnterior > 0 && producto.precioAnterior > producto.precio && (
          <p
            className="text-[11.5px] line-through tabular-nums"
            style={{ color: T.inkFaint, fontWeight: 450, fontFeatureSettings: '"tnum"' }}
          >
            {formatMoney(producto.precioAnterior)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function FrutaPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [frutas, setFrutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todos');

  // Cargar favoritos
  useEffect(() => {
    const saved = localStorage.getItem('frutas_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Cargar frutas
  const cargarFrutas = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getFrutas({
        page: 1,
        perPage: 100,
        search: searchTerm,
        categoria: selectedCategoria,
        sort: 'orden, nombre',
      });
      setFrutas(result.items);
    } catch (error) {
      console.error('Error cargando frutas:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoria]);

  useEffect(() => {
    cargarFrutas();
  }, [cargarFrutas]);

  const toggleFavorite = (id) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem('frutas_favorites', JSON.stringify(newFavorites));
  };

  const handleCategoriaClick = (cat) => {
    const nueva = cat === selectedCategoria ? 'todos' : cat;
    setSelectedCategoria(nueva);
  };

  const navigateTo = (path) => router.push(path);

  const notifications = [
    { id: 1, title: '¡Fruta fresca de temporada!', description: 'Descubre lo nuevo de esta semana', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Head>
        <title>Fruta de temporada | MarketDesliz</title>
        <meta
          name="description"
          content="Descubre la fruta y verdura fresca de temporada. Compra a crédito o al contado."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

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
                alt="Fruta de temporada MarketDesliz"
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

          {/* ─── EDITORIAL HEADER ──────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-12 md:pb-16">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Fruta · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Fruta fresca,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                directo a tu mesa.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Productos frescos de temporada, seleccionados para ti.
            </p>
          </section>

          {/* ─── CATEGORÍAS POPULARES ──────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-20">
            <div className="flex items-baseline justify-between mb-5">
              <h2
                className="text-[10px] md:text-[11px] uppercase tracking-[0.22em]"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Categorías populares
              </h2>
              {selectedCategoria !== 'todos' && (
                <TextLink
                  label="Ver todas"
                  onClick={() => handleCategoriaClick('todos')}
                />
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {CATEGORIAS_BASICAS.map((cat) => {
                const isActive = selectedCategoria === cat.nombre;
                const handleClick = cat.esMasCategorias
                  ? () => navigateTo('/fruta')
                  : () => handleCategoriaClick(cat.nombre);
                return (
                  <CategoryCard
                    key={cat.nombre}
                    cat={cat}
                    isActive={isActive}
                    onClick={handleClick}
                  />
                );
              })}
            </div>
          </section>

          {/* ─── BUSCADOR ──────────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2
                className="text-[10px] md:text-[11px] uppercase tracking-[0.22em]"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Buscar
              </h2>
              <span
                className="text-[11px] tabular-nums"
                style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
              >
                {loading ? '…' : `${frutas.length} ${frutas.length === 1 ? 'resultado' : 'resultados'}`}
              </span>
            </div>

            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: T.inkFaint }}
              />
              <input
                type="text"
                placeholder="Buscar fruta o verdura..."
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
                onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
              />
            </div>
          </section>

          {/* ─── GRID DE FRUTAS ────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="flex items-baseline justify-between mb-5">
              <h2
                className="text-[10px] md:text-[11px] uppercase tracking-[0.22em]"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                {selectedCategoria !== 'todos'
                  ? `Fruta · ${selectedCategoria}`
                  : 'Frutas y verduras destacadas'}
              </h2>
              <TextLink label="Ver todos" onClick={() => navigateTo('/fruta')} />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: T.line,
                    borderTopColor: T.accent,
                  }}
                />
              </div>
            ) : frutas.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
                style={{
                  background: 'rgba(15, 15, 15, 0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <Package
                  size={32}
                  strokeWidth={1.5}
                  style={{ color: T.inkGhost, marginBottom: '16px' }}
                />
                <h3
                  className="text-[15px] mb-1"
                  style={{ color: T.ink, fontWeight: 500 }}
                >
                  No hay frutas disponibles
                </h3>
                <p
                  className="text-[13px] max-w-md"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {selectedCategoria !== 'todos'
                    ? `No hay productos en "${selectedCategoria}".`
                    : 'Pronto agregaremos productos frescos.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {frutas.slice(0, 8).map((producto) => (
                  <FrutaCard
                    key={producto.id}
                    producto={producto}
                    isFavorite={favorites.includes(producto.id)}
                    onToggleFavorite={() => toggleFavorite(producto.id)}
                    onClick={() => navigateTo(`/fruta/${producto.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ─── BANNER · Entrega a domicilio ──────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10"
              style={{
                background: 'rgba(79, 46, 232, 0.04)',
                border: `1px solid rgba(79, 46, 232, 0.12)`,
                borderRadius: '8px',
              }}
            >
              <div className="flex items-start gap-4 max-w-xl">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '44px',
                    height: '44px',
                    background: T.bg,
                    border: `1px solid rgba(79, 46, 232, 0.12)`,
                    borderRadius: '8px',
                  }}
                >
                  <Salad size={20} strokeWidth={1.75} style={{ color: T.accent }} />
                </div>
                <div>
                  <p
                    className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-3"
                    style={{
                      color: T.accent,
                      fontWeight: 500,
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    Entrega a domicilio
                  </p>
                  <h3
                    className="text-[22px] md:text-[28px] leading-[1.15] tracking-[-0.02em] mb-2"
                    style={{ color: T.ink, fontWeight: 400 }}
                  >
                    ¿Quieres fruta fresca en tu domicilio?
                  </h3>
                  <p
                    className="text-[13.5px] md:text-[15px] leading-[1.55]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Solicita una entrega a tu casa sin compromiso.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigateTo('/solicitar-visita')}
                className="shrink-0 px-6 h-11 text-white text-[13px] transition-colors duration-200"
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
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Solicitar entrega →
              </button>
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