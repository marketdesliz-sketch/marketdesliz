// src/pages/productos.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Grid2X2, Heart, Package, Sofa, CookingPot, Waves,
  Shirt, Bed, Guitar, Tag, Layout,
} from 'lucide-react';
import pb from '../lib/pocketbase';
import { formatMoney } from '../lib/utils';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL DEL HERO · LOCAL
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/productos-hero.jpg';

// ─────────────────────────────────────────────────────────────────────────
// Mapa de íconos por categoría · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const iconMap = {
  'hogar': Sofa,
  'cortinas': Layout,
  'cocina': CookingPot,
  'electronicos': Waves,
  'electrónicos': Waves,
  'ropa': Shirt,
  'instrumentos': Guitar,
  'colchones': Bed,
  'sábanas': Bed,
  'cubre salas': Sofa,
  'almohadas': Bed,
  'cubre': Sofa,
  'sala': Sofa,
  'muebles': Sofa,
  'linea blanca': Waves,
  'electrodomesticos': Waves,
  'más categorías': Grid2X2,
};

const getIcon = (nombre) => {
  const lower = nombre?.toLowerCase().trim() || '';
  if (iconMap[lower]) return iconMap[lower];
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return icon;
    }
  }
  return Tag;
};

// ─────────────────────────────────────────────────────────────────────────
// TextLink · link de texto puro con touch
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
// CategoryCard · minimalista
// ─────────────────────────────────────────────────────────────────────────
function CategoryCard({ cat, onClick }) {
  const [hover, setHover] = useState(false);
  const IconComponent = getIcon(cat.nombre);

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
        border: `1px solid ${hover ? T.line : 'transparent'}`,
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
          background: hover ? T.accent : 'rgba(15, 15, 15, 0.04)',
          borderRadius: '8px',
          transitionTimingFunction: T.ease,
        }}
      >
        <IconComponent
          size={20}
          strokeWidth={1.75}
          style={{
            color: hover ? '#FFFFFF' : T.inkMid,
            transition: `color 0.3s ${T.ease}`,
          }}
        />
      </div>
      <span
        className="text-[12px] text-center transition-colors duration-300"
        style={{
          color: hover ? T.ink : T.inkMid,
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
// ProductCard · minimalista con hover premium
// ─────────────────────────────────────────────────────────────────────────
function ProductCard({ producto, isFavorite, onToggleFavorite, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group cursor-pointer flex flex-col transition-all duration-300"
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

        {/* Botón favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          className="absolute top-3 right-3 flex items-center justify-center transition-all duration-200"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(250, 250, 249, 0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '50%',
            WebkitTapHighlightColor: 'transparent',
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
      </div>

      {/* Info */}
      <div className="px-4 py-3.5 flex flex-col gap-1.5">
        <h3
          className="text-[13.5px] leading-snug tracking-[-0.005em] truncate"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          {producto.nombre}
        </h3>

        <p
          className="text-[16px] tabular-nums tracking-[-0.01em]"
          style={{
            color: T.ink,
            fontWeight: 500,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {formatMoney(producto.paga)}
          <span
            className="text-[11px] ml-1"
            style={{ color: T.inkSoft, fontWeight: 450 }}
          >
            / semana
          </span>
        </p>

        {producto.precio > 0 && (
          <p className="text-[11.5px]" style={{ color: T.inkSoft }}>
            Enganche{' '}
            <span
              className="tabular-nums"
              style={{
                color: T.accent,
                fontWeight: 500,
                fontFeatureSettings: '"tnum"',
              }}
            >
              {formatMoney(producto.enganche)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────
export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar favoritos desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Cargar productos y categorías · LÓGICA SIN CAMBIOS
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // 1. Productos activos con expand
        const products = await pb.collection('products').getFullList({
          filter: 'activo = true',
          sort: '-created',
          expand: 'categoriaId',
        });

        const productosData = products.map((p) => {
          let imagenUrl = null;
          if (p.imagen && Array.isArray(p.imagen) && p.imagen.length > 0) {
            imagenUrl = pb.files.getURL(p, p.imagen[0]);
          } else if (p.imagen && typeof p.imagen === 'string') {
            imagenUrl = pb.files.getURL(p, p.imagen);
          }

          return {
            id: p.id,
            nombre: p.nombre || 'Producto sin nombre',
            descripcion: p.descripcion || 'Sin descripción',
            precio: p.precio || 0,
            enganche: p.enganche || 0,
            paga: p.pagoSemanal || 0,
            categoria: p.expand?.categoriaId?.nombre || '',
            categoriaId: p.categoriaId,
            imagen: imagenUrl,
            semanas: p.semanas || 12,
            stock: p.stock || 0,
            nuevo: p.nuevo || false,
          };
        });

        setProductos(productosData);

        // 2. Categorías con conteo de productos
        const todasCategorias = await pb.collection('categorias').getFullList({
          filter: 'activo = true && vertical = "products"',
          sort: 'nombre',
          fields: 'id,nombre,slug',
        });

        const conteo = {};
        productosData.forEach((p) => {
          if (p.categoriaId) {
            conteo[p.categoriaId] = (conteo[p.categoriaId] || 0) + 1;
          }
        });

        let categoriasConConteo = todasCategorias
          .map((cat) => ({
            id: cat.id,
            nombre: cat.nombre,
            slug: cat.slug || cat.nombre
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, ''),
            count: conteo[cat.id] || 0,
          }))
          .filter((cat) => cat.count > 0)
          .sort((a, b) => b.count - a.count);

        // ─── AGREGAR "MÁS CATEGORÍAS" SI HAY MENOS DE 6 ───────────
        if (categoriasConConteo.length < 6) {
          categoriasConConteo.push({
            id: 'mas-categorias',
            nombre: 'Más categorías',
            slug: 'mas',
            count: 0,
            esMasCategorias: true,
          });
        }

        setCategorias(categoriasConConteo);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Favoritos · SIN CAMBIOS
  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const navigateTo = (path) => router.push(path);

  const notifications = [
    { id: 1, title: '¡Nueva colección!', description: 'Descubre la línea Otoño 2026', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── FILTRAR PRODUCTOS POR CATEGORÍAS VISIBLES · SIN CAMBIOS ───
  const categoriaIds = categorias
    .filter((cat) => !cat.esMasCategorias)
    .map((cat) => cat.id);

  const productosFiltradosPorCategoria = productos.filter(
    (p) => p.categoriaId && categoriaIds.includes(p.categoriaId)
  );

  const filteredProducts = productosFiltradosPorCategoria.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Productos | MarketDesliz</title>
        <meta
          name="description"
          content="Explora nuestros productos a crédito con pagos semanales."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        {/* ═══ BOTÓN DE RETROCESO · componente compartido ═══ */}
        <BackButton fallback="/" />

        {/* ═══ BARRA TERMINAL ═══ */}
        <TerminalBar mode="rotating" />

        {/* ═══ HEADER compartido con buscador activo ═══ */}
        <Header
          notifications={notifications}
          unreadCount={unreadCount}
          showSearch
          searchPlaceholder="Buscar productos, categorías..."
        />

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
                alt="Productos MarketDesliz"
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
              Catálogo · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Todo lo que<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                necesitas.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Compra productos de calidad a crédito y al contado.
            </p>
          </section>

          {/* ─── CATEGORÍAS ────────────────────────────────── */}
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
              <TextLink label="Ver todas" onClick={() => navigateTo('/productos/categoria/todos')} />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: T.line,
                    borderTopColor: T.accent,
                  }}
                />
              </div>
            ) : categorias.length === 0 ? (
              <p className="text-[13px] py-8" style={{ color: T.inkFaint }}>
                No hay categorías con productos disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {categorias.map((cat) => {
                  const handleClick = cat.esMasCategorias
                    ? () => navigateTo('/productos/categoria/todos')
                    : () => navigateTo(`/productos/categoria/${cat.slug}`);
                  return (
                    <CategoryCard key={cat.id} cat={cat} onClick={handleClick} />
                  );
                })}
              </div>
            )}
          </section>

          {/* ─── PRODUCTOS DESTACADOS ──────────────────────── */}
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
                Productos destacados
              </h2>
              <TextLink label="Ver todos" onClick={() => navigateTo('/productos/categoria/todos')} />
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: T.line,
                    borderTopColor: T.accent,
                  }}
                />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-[13px] py-8" style={{ color: T.inkFaint }}>
                No hay productos en estas categorías.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {filteredProducts.slice(0, 12).map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    isFavorite={favorites.includes(producto.id)}
                    onToggleFavorite={() => toggleFavorite(producto.id)}
                    onClick={() => navigateTo(`/productos/${producto.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ─── BANNER · Solicitar visita ─────────────────── */}
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
                  Atención personalizada
                </p>
                <h3
                  className="text-[22px] md:text-[28px] leading-[1.15] tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  ¿Quieres que un vendedor te visite?
                </h3>
                <p
                  className="text-[13.5px] md:text-[15px] leading-[1.55] mt-2"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Solicita una visita a tu domicilio sin compromiso. Te mostramos
                  el catálogo completo y resolvemos tus dudas.
                </p>
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
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Solicitar visita →
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
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
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