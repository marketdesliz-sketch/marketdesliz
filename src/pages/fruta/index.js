// src/pages/fruta/index.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Grid2X2, Heart, Package, Apple, Banana, Carrot, Cherry,
  Citrus, Sprout, Search, Salad, Leaf, Wheat, Grape, TreePine,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { formatMoney } from '../../lib/utils';
import { getFrutas, getFrutaCategorias } from '../../lib/frutasService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';
import FrutaCard from '../../components/fruta/FrutaCard';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL DEL HERO · LOCAL
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/fruta-hero.jpg';

// Máximo de categorías padre visibles en la home
const MAX_CATEGORIAS_VISIBLES = 5;

// ─────────────────────────────────────────────────────────────────────────
// Mapa de íconos por slug/nombre · misma mecánica que productos.js
// ─────────────────────────────────────────────────────────────────────────
const iconMap = {
  'frutas': Apple,
  'fruta': Apple,
  'verduras': Carrot,
  'verdura': Carrot,
  'citricos': Citrus,
  'cítricos': Citrus,
  'citrico': Citrus,
  'tropicales': Banana,
  'tropical': Banana,
  'frutos rojos': Cherry,
  'frutos-rojos': Cherry,
  'frutos secos': Wheat,
  'frutos-secos': Wheat,
  'tuberculos': Wheat,
  'tubérculos': Wheat,
  'hojas verdes': Leaf,
  'hojas-verdes': Leaf,
  'hierbas': Leaf,
  'organicos': Sprout,
  'orgánicos': Sprout,
  'uvas': Grape,
  'arboles': TreePine,
  'árboles': TreePine,
  'mas categorias': Grid2X2,
  'más categorías': Grid2X2,
};

const getIcon = (nombre, slug) => {
  const key1 = (slug || '').toLowerCase().trim();
  const key2 = (nombre || '').toLowerCase().trim();

  if (iconMap[key1]) return iconMap[key1];
  if (iconMap[key2]) return iconMap[key2];

  // Fuzzy match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (key1.includes(key) || key.includes(key1)) return icon;
    if (key2.includes(key) || key.includes(key2)) return icon;
  }

  return Package;
};

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
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
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
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function FrutaPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [frutas, setFrutas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState('');

  // ─── Cargar favoritos ────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('frutas_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // ─── Cargar categorías (solo padre) ──────────────────────
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const todas = await getFrutaCategorias();
        // Solo padres en la home
        const padres = todas.filter((c) => c.depth === 0);
        setCategorias(padres);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      }
    };
    cargarCategorias();
  }, []);

  // ─── Cargar frutas ───────────────────────────────────────
  const cargarFrutas = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getFrutas({
        page: 1,
        perPage: 12,
        search: searchTerm,
        categoriaId: selectedCategoriaId || 'todos',
        sort: 'orden, nombre',
      });
      setFrutas(result.items);
    } catch (error) {
      console.error('Error cargando frutas:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoriaId]);

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

  // ─── Handler de categoría (toggle por ID) ────────────────
  const handleCategoriaClick = (id) => {
    const nueva = id === selectedCategoriaId ? '' : id;
    setSelectedCategoriaId(nueva);
  };

  const navigateTo = (path) => router.push(path);

  // Categoría activa (para mostrar el nombre en el título)
  const categoriaActiva = useMemo(
    () => categorias.find((c) => c.id === selectedCategoriaId),
    [categorias, selectedCategoriaId]
  );

  // Categorías visibles en home (5 + "Más categorías" si hay más)
  const categoriasParaMostrar = useMemo(() => {
    const tieneMas = categorias.length > MAX_CATEGORIAS_VISIBLES;
    const visibles = tieneMas
      ? categorias.slice(0, MAX_CATEGORIAS_VISIBLES)
      : categorias;

    const conIcono = visibles.map((cat) => ({
      ...cat,
      icon: getIcon(cat.nombre, cat.slug),
    }));

    if (tieneMas) {
      conIcono.push({
        id: '__mas__',
        nombre: 'Más categorías',
        slug: 'mas-categorias',
        icon: Grid2X2,
        esMasCategorias: true,
      });
    }

    return conIcono;
  }, [categorias]);

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
          {categorias.length > 0 && (
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
                {selectedCategoriaId && (
                  <TextLink
                    label="Ver todas"
                    onClick={() => setSelectedCategoriaId('')}
                  />
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {categoriasParaMostrar.map((cat) => {
                  const isActive = cat.id === selectedCategoriaId;
                  const handleClick = cat.esMasCategorias
                    ? () => navigateTo('/fruta/categoria/todos')
                    : () => handleCategoriaClick(cat.id);
                  return (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      isActive={isActive}
                      onClick={handleClick}
                    />
                  );
                })}
              </div>
            </section>
          )}

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
                {categoriaActiva
                  ? `Fruta · ${categoriaActiva.nombre}`
                  : 'Frutas y verduras destacadas'}
              </h2>
              <TextLink
                label="Ver todos"
                onClick={() => navigateTo('/fruta/categoria/todos')}
              />
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
                  {categoriaActiva
                    ? `No hay productos en "${categoriaActiva.nombre}".`
                    : 'Pronto agregaremos productos frescos.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {frutas.map((producto) => (
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