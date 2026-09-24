// src/pages/perfil/favoritos.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Heart, HeartOff, Package, ArrowLeft, X, Trash2,
  DollarSign, Calendar,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Helpers · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount);
};

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

function ProductoCard({ producto, onRemove }) {
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
      {/* Imagen */}
      <Link
        href={`/productos/${producto.id}`}
        className="block relative overflow-hidden"
        style={{
          aspectRatio: '4 / 3',
          background: 'rgba(15, 15, 15, 0.03)',
          textDecoration: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
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
            <Package size={40} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        {/* Badge agotado */}
        {producto.agotado && (
          <span
            className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1"
            style={{
              background: 'rgba(197, 48, 48, 0.92)',
              color: '#FFFFFF',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '4px',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
            }}
          >
            Agotado
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-5 flex flex-col gap-3.5 flex-1">
        <div>
          <Link
            href={`/productos/${producto.id}`}
            className="block"
            style={{ textDecoration: 'none' }}
          >
            <h3
              className="text-[15.5px] leading-snug tracking-[-0.005em] truncate"
              style={{ color: T.ink, fontWeight: 500 }}
            >
              {producto.nombre}
            </h3>
          </Link>
          <p
            className="text-[10px] uppercase tracking-[0.15em] mt-1.5 truncate"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            {producto.categoria}
          </p>
        </div>

        {/* Precios */}
        <div className="flex flex-col gap-1.5">
          <PriceLine
            label="Desde"
            value={formatMoney(producto.precio)}
            color={T.ink}
          />
          <PriceLine
            label="Enganche"
            value={formatMoney(producto.enganche)}
            color={T.accent}
          />
          <PriceLine
            label="Paga"
            value={`${formatMoney(producto.paga)}/sem`}
            color={T.green}
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mt-auto pt-2">
          <Link
            href={`/productos/${producto.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 h-9 text-white text-[12.5px]"
            style={{
              background: T.accent,
              borderRadius: '6px',
              fontWeight: 500,
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
              transitionTimingFunction: T.ease,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = T.accentDeep)
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
          >
            Ver producto
          </Link>

          <button
            onClick={() => onRemove(producto.id, producto.favoritoId)}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '36px',
              height: '36px',
              background: 'transparent',
              border: `1px solid ${T.line}`,
              borderRadius: '6px',
              color: T.inkMid,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transitionTimingFunction: T.ease,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.red;
              e.currentTarget.style.color = T.red;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.line;
              e.currentTarget.style.color = T.inkMid;
            }}
            aria-label="Eliminar de favoritos"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceLine({ label, value, color }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span
        className="text-[11px] uppercase tracking-[0.14em]"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </span>
      <span
        className="text-[12.5px] tabular-nums tracking-[-0.005em]"
        style={{
          color,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function MisFavoritosPage() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState([]);
  const [productosFavoritos, setProductosFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    cargarFavoritos();
  }, []);

  // ─── Cargar favoritos · SIN CAMBIOS ─────────────────────
  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      const user = pb.authStore.model;

      const favoritosData = await pb.collection('favoritos').getFullList({
        filter: `userId = "${user.id}"`,
        expand: 'productId',
      });

      setFavoritos(favoritosData);

      if (favoritosData.length > 0) {
        const productos = favoritosData
          .map((fav) => {
            const product = fav.expand?.productId;
            if (!product) return null;

            return {
              id: product.id,
              nombre: product.nombre || 'Producto sin nombre',
              descripcion: product.descripcion || 'Sin descripción',
              precio: product.precio || 0,
              enganche: product.enganche || 0,
              paga: product.pagoSemanal || 0,
              categoria: product.categoria || 'General',
              imagen: product.imagen
                ? pb.files.getURL(product, product.imagen)
                : null,
              stock: product.stock || 0,
              agotado: product.stock === 0,
              favoritoId: fav.id,
            };
          })
          .filter((p) => p !== null);

        setProductosFavoritos(productos);
      } else {
        setProductosFavoritos([]);
      }
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Eliminar favorito · SIN CAMBIOS ────────────────────
  const removeFavorite = async (productId, favoritoId) => {
    try {
      await pb.collection('favoritos').delete(favoritoId);

      setFavoritos(favoritos.filter((f) => f.id !== favoritoId));
      setProductosFavoritos(
        productosFavoritos.filter((p) => p.id !== productId)
      );
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      alert('No se pudo eliminar el favorito');
    }
  };

  // ─── Eliminar todos · SIN CAMBIOS ───────────────────────
  const removeAllFavorites = async () => {
    if (!confirm('¿Eliminar todos los productos de favoritos?')) return;

    try {
      await Promise.all(
        favoritos.map((fav) => pb.collection('favoritos').delete(fav.id))
      );

      setFavoritos([]);
      setProductosFavoritos([]);
    } catch (error) {
      console.error('Error eliminando todos los favoritos:', error);
      alert('No se pudieron eliminar todos los favoritos');
    }
  };

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
                Cargando favoritos
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Render principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>Mis Favoritos | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/perfil" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero editorial ─────────────────────────── */}
          <section className="mb-12">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Perfil · Favoritos
            </p>

            <h1
              className="text-[40px] md:text-[64px] leading-[1] tracking-[-0.035em] max-w-3xl mb-6"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Mis favoritos
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}guardados.
              </span>
            </h1>

            <p
              className="text-[16px] md:text-[20px] leading-[1.5] max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Productos que has guardado para después.
            </p>
          </section>

          {/* ─── Lista ───────────────────────────────────── */}
          {productosFavoritos.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <HeartOff
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                No tienes productos favoritos
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Guarda tus productos favoritos tocando el corazón en cada
                producto.
              </p>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentDeep)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
              >
                <Package size={14} strokeWidth={1.75} /> Ver productos
              </Link>
            </div>
          ) : (
            <>
              {/* Contador */}
              <section className="mb-6">
                <div className="flex items-baseline justify-between">
                  <SectionLabel>Productos guardados</SectionLabel>
                  <span
                    className="text-[11px] tabular-nums"
                    style={{
                      color: T.inkFaint,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {productosFavoritos.length}{' '}
                    {productosFavoritos.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              </section>

              {/* Grid */}
              <section className="mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {productosFavoritos.map((producto) => (
                    <ProductoCard
                      key={producto.id}
                      producto={producto}
                      onRemove={removeFavorite}
                    />
                  ))}
                </div>
              </section>

              {/* Eliminar todos */}
              <section className="text-center">
                <button
                  onClick={removeAllFavorites}
                  className="inline-flex items-center gap-2 h-9 px-4 text-[12px] transition-colors"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: T.red,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    textDecorationThickness: '1px',
                    WebkitTapHighlightColor: 'transparent',
                    transitionTimingFunction: T.ease,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = '#A02424')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.red)}
                >
                  <Trash2 size={13} strokeWidth={1.75} /> Eliminar todos los
                  favoritos
                </button>
              </section>
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