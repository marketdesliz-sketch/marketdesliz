// src/pages/fruta/mis-frutas.js
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Apple, Package, Eye, Star, Plus, Pencil, Search, Filter,
  RefreshCw, AlertCircle, CheckCircle, XCircle, Sprout, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { formatMoney } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

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
          className="text-[10px] uppercase tracking-[0.18em] truncate"
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
      className="px-3 h-7 text-[11.5px] uppercase tracking-[0.15em] whitespace-nowrap transition-all"
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

function CategoryPill({ label, active, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="px-3 h-7 text-[11px] uppercase tracking-[0.12em] whitespace-nowrap transition-all"
      style={{
        background: active ? T.accent : hover ? 'rgba(15,15,15,0.03)' : 'transparent',
        color: active ? '#FFFFFF' : hover ? T.accent : T.inkMid,
        border: active ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
        borderRadius: '4px',
        fontWeight: 500,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FrutaAdminCard · card minimal con avisos de stock
// ─────────────────────────────────────────────────────────────────────────
function FrutaAdminCard({ fruta }) {
  const [hover, setHover] = useState(false);

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
      {/* Header: thumbnail + info + estado */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Thumbnail */}
          <div
            className="flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              width: '68px',
              height: '68px',
              background: 'rgba(15, 15, 15, 0.03)',
              border: `1px solid ${T.line}`,
              borderRadius: '8px',
            }}
          >
            {fruta.imagen ? (
              <img
                src={fruta.imagen}
                alt={fruta.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Apple size={26} strokeWidth={1.5} style={{ color: T.inkGhost }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h3
                className="text-[15px] leading-snug tracking-[-0.005em] truncate"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {fruta.nombre}
              </h3>
              {fruta.temporada && (
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
                  <Sprout size={9} strokeWidth={2.5} /> Temporada
                </span>
              )}
              {fruta.destacado && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 shrink-0"
                  style={{
                    background: 'rgba(184, 130, 14, 0.08)',
                    color: '#B8820E',
                    borderRadius: '3px',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: 600,
                  }}
                >
                  <Star size={9} strokeWidth={2.5} /> Destacado
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11.5px] flex-wrap">
              {/* ✅ categoriaNombre en vez de categoria */}
              {fruta.categoriaNombre && (
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
                  {fruta.categoriaNombre}
                </span>
              )}
              {(fruta.municipioNombre || fruta.localidadNombre) && (
                <span
                  className="truncate max-w-[220px]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {[fruta.municipioNombre, fruta.localidadNombre]
                    .filter(Boolean)
                    .join(' › ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estado badge */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
          style={{
            background: fruta.activo
              ? 'rgba(26, 127, 75, 0.08)'
              : 'rgba(15, 15, 15, 0.05)',
            color: fruta.activo ? '#1A7F4B' : T.inkMid,
            borderRadius: '4px',
            fontSize: '9.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 600,
          }}
        >
          {fruta.activo ? (
            <>
              <CheckCircle size={10} strokeWidth={2.5} /> Activo
            </>
          ) : (
            <>
              <XCircle size={10} strokeWidth={2.5} /> Inactivo
            </>
          )}
        </span>
      </div>

      {/* Métricas · 4 columnas */}
      <div className="grid grid-cols-4 gap-2 mb-4">
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
            className="text-[14px] tabular-nums"
            style={{
              color: T.accent,
              fontWeight: 500,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {formatMoney(fruta.precio)}
          </p>
          <p
            className="text-[9.5px] mt-0.5"
            style={{ color: T.inkFaint, fontWeight: 450 }}
          >
            /{fruta.unidad}
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
            Stock
          </p>
          <p
            className="text-[14px] tabular-nums"
            style={{
              color: fruta.stock === 0 ? T.red : T.ink,
              fontWeight: 500,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {fruta.stock}
          </p>
          <p
            className="text-[9.5px] mt-0.5"
            style={{ color: T.inkFaint, fontWeight: 450 }}
          >
            {fruta.unidad}
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
            Visitas
          </p>
          <p
            className="text-[14px] tabular-nums"
            style={{ color: T.ink, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
          >
            {fruta.visitas}
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
            Rating
          </p>
          <div className="flex items-center justify-center gap-1">
            <Star
              size={10}
              strokeWidth={1.5}
              style={{ fill: '#F5B400', color: '#F5B400' }}
            />
            <p
              className="text-[14px] tabular-nums"
              style={{ color: T.ink, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
            >
              {fruta.calificacion.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/fruta/${fruta.id}`}
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
          href={`/fruta/editar?id=${fruta.id}`}
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

      {/* Aviso stock bajo */}
      {fruta.stock > 0 && fruta.stock <= 5 && (
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
            Quedan pocas unidades. Considera actualizar la disponibilidad.
          </p>
        </div>
      )}

      {/* Aviso agotado */}
      {fruta.stock === 0 && (
        <div
          className="mt-3 flex items-start gap-2 px-3 py-2.5"
          style={{
            background: 'rgba(197, 48, 48, 0.06)',
            borderLeft: `2px solid ${T.red}`,
            borderRadius: '4px',
          }}
        >
          <XCircle
            size={12}
            strokeWidth={1.75}
            style={{ color: T.red, flexShrink: 0, marginTop: 2 }}
          />
          <p
            className="text-[11.5px] leading-[1.55]"
            style={{ color: T.red, fontWeight: 450 }}
          >
            Producto agotado. Actualiza el stock o desactívalo temporalmente.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function MisFrutasPage() {
  const router = useRouter();

  const { user, isAuthenticated, loading: authLoading, openLogin } = useAuth();

  const [frutas, setFrutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ✅ Renombrado a filtroCategoriaId (guarda ID, no nombre)
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const cargarMisFrutas = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // ✅ expand con categoriaId
      const records = await pb.collection('frutas').getFullList({
        filter: `usuarioId = "${user.id}"`,
        sort: '-created',
        expand: 'categoriaId,municipioId,localidadId',
      });

      const frutasData = records.map((f) => {
        let imagenUrl = null;
        if (f.imagen) {
          imagenUrl = pb.files.getURL(f, f.imagen);
        } else if (f.imagenes) {
          const arr = Array.isArray(f.imagenes) ? f.imagenes : [f.imagenes];
          if (arr.length > 0 && arr[0]) {
            imagenUrl = pb.files.getURL(f, arr[0]);
          }
        }

        return {
          id: f.id,
          nombre: f.nombre || '',
          descripcion: f.descripcion || '',
          // ✅ Categoría por relación
          categoriaId: f.categoriaId || null,
          categoriaNombre: f.expand?.categoriaId?.nombre || '',
          categoriaSlug: f.expand?.categoriaId?.slug || '',
          precio: f.precio || 0,
          precioAnterior: f.precioAnterior || 0,
          unidad: f.unidad || 'kg',
          stock: f.stock || 0,
          imagen: imagenUrl,
          activo: f.activo !== false,
          nuevo: f.nuevo === true,
          destacado: f.destacado === true,
          temporada: f.temporada === true,
          visitas: f.visitas || 0,
          calificacion: f.calificacion || 0,
          totalComentarios: f.totalComentarios || 0,
          creado: f.created,
          actualizado: f.updated,
          municipioNombre: f.expand?.municipioId?.nombre || '',
          localidadNombre: f.expand?.localidadId?.nombre || '',
          // ✅ Nuevos campos del schema
          telefono: f.telefono || '',
          whatsapp: f.whatsapp || '',
        };
      });

      setFrutas(frutasData);
    } catch (err) {
      console.error('Error cargando frutas:', err);
      setError('No pudimos cargar tus productos. Intenta de nuevo.');
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

    cargarMisFrutas();
  }, [authLoading, user, cargarMisFrutas, openLogin]);

  const stats = useMemo(() => {
    const total = frutas.length;
    const activos = frutas.filter((f) => f.activo).length;
    const inactivos = frutas.filter((f) => !f.activo).length;
    const enTemporada = frutas.filter((f) => f.temporada).length;
    const visitasTotales = frutas.reduce((sum, f) => sum + (f.visitas || 0), 0);
    const stockTotal = frutas.reduce((sum, f) => sum + (f.stock || 0), 0);
    return { total, activos, inactivos, enTemporada, visitasTotales, stockTotal };
  }, [frutas]);

  // ✅ Categorías disponibles como { id, nombre } — derivadas de las categorías de las frutas del usuario
  const categoriasDisponibles = useMemo(() => {
    const map = new Map();
    frutas.forEach((f) => {
      if (f.categoriaId && !map.has(f.categoriaId)) {
        map.set(f.categoriaId, f.categoriaNombre || f.categoriaId);
      }
    });
    const lista = Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    return [{ id: 'todas', nombre: 'Todas las categorías' }, ...lista];
  }, [frutas]);

  const frutasFiltradas = useMemo(() => {
    let result = frutas;

    // ✅ Filtro por ID
    if (filtroCategoriaId !== 'todas') {
      result = result.filter((f) => f.categoriaId === filtroCategoriaId);
    }

    if (filtroEstado === 'activos') {
      result = result.filter((f) => f.activo);
    } else if (filtroEstado === 'inactivos') {
      result = result.filter((f) => !f.activo);
    } else if (filtroEstado === 'temporada') {
      result = result.filter((f) => f.temporada);
    } else if (filtroEstado === 'agotados') {
      result = result.filter((f) => f.stock === 0);
    }

    // ✅ Búsqueda incluye categoriaNombre
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.nombre.toLowerCase().includes(s) ||
          f.categoriaNombre.toLowerCase().includes(s)
      );
    }

    return result;
  }, [frutas, filtroCategoriaId, filtroEstado, searchTerm]);

  const totalPages = Math.ceil(frutasFiltradas.length / itemsPerPage);
  const paginatedFrutas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return frutasFiltradas.slice(start, start + itemsPerPage);
  }, [frutasFiltradas, currentPage]);

  // ✅ Reset página con el nuevo nombre
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroCategoriaId, filtroEstado, searchTerm]);

  const notifications = [
    { id: 1, title: '¡Fruta fresca de temporada!', description: 'Descubre lo nuevo esta semana', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
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
                Cargando
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
          <BackButton fallback="/fruta" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <XCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1 className="text-[24px] mb-2" style={{ color: T.ink, fontWeight: 400 }}>
                Error al cargar tus productos
              </h1>
              <p
                className="text-[13.5px] mb-8 max-w-md mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <button
                onClick={cargarMisFrutas}
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

  // ─── Sin autenticación ────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <>
        <Head><title>Inicia sesión | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/fruta" />
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
                Necesitas iniciar sesión para ver tus productos.
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

  // ─── Render principal ─────────────────────────────────
  return (
    <>
      <Head>
        <title>Mis Productos | MarketDesliz</title>
        <meta
          name="description"
          content="Gestiona todos tus productos registrados en MarketDesliz."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/fruta" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Header editorial ─────────────────────────── */}
          <section className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-4"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Gestión · Fruta de temporada
                </p>

                <h1
                  className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em] mb-2"
                  style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                >
                  Mis
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}productos.
                  </span>
                </h1>

                <p className="text-[14px]" style={{ color: T.inkSoft, fontWeight: 450 }}>
                  Gestiona todos tus productos de fruta y verdura.
                </p>
              </div>

              <Link
                href="/fruta/registro"
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
                <Plus size={14} strokeWidth={2} /> Registrar producto
              </Link>
            </div>
          </section>

          {/* ─── Stats ────────────────────────────────────── */}
          <section className="mb-10">
            <SectionLabel>Resumen</SectionLabel>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatCard icon={Package} label="Total" value={stats.total} />
              <StatCard
                icon={CheckCircle}
                label="Activos"
                value={stats.activos}
                valueColor="#1A7F4B"
              />
              <StatCard
                icon={Sprout}
                label="Temporada"
                value={stats.enTemporada}
                valueColor="#1A7F4B"
              />
              <StatCard
                icon={Eye}
                label="Visitas"
                value={stats.visitasTotales}
                valueColor={T.accent}
              />
            </div>
          </section>

          {/* ─── Buscador ──────────────────────────────────── */}
          <section className="mb-6">
            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: T.inkFaint }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o categoría..."
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

          {/* ─── Filtros estado ───────────────────────────── */}
          <section className="mb-4">
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
                    { key: 'todas', label: 'Todas' },
                    { key: 'activos', label: 'Activos' },
                    { key: 'inactivos', label: 'Inactivos' },
                    { key: 'temporada', label: 'Temporada' },
                    { key: 'agotados', label: 'Agotados' },
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
                {frutasFiltradas.length}{' '}
                {frutasFiltradas.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
          </section>

          {/* ─── Filtros categoría ────────────────────────── */}
          {categoriasDisponibles.length > 1 && (
            <section className="mb-8">
              <div className="flex flex-wrap gap-2">
                {/* ✅ Pills con {id, nombre} */}
                {categoriasDisponibles.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    label={cat.nombre}
                    active={filtroCategoriaId === cat.id}
                    onClick={() => setFiltroCategoriaId(cat.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ─── Lista ────────────────────────────────────── */}
          {frutasFiltradas.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <Apple
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {searchTerm || filtroCategoriaId !== 'todas' || filtroEstado !== 'todas'
                  ? 'No se encontraron productos'
                  : 'No tienes productos registrados'}
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {searchTerm || filtroCategoriaId !== 'todas' || filtroEstado !== 'todas'
                  ? 'Cambia los filtros para ver otros productos.'
                  : 'Registra tu primer producto y empieza a vender.'}
              </p>
              <Link
                href="/fruta/registro"
                className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Plus size={14} strokeWidth={2} /> Registrar producto
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {paginatedFrutas.map((fruta) => (
                  <FrutaAdminCard key={fruta.id} fruta={fruta} />
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
                    Anterior
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
                    Siguiente
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