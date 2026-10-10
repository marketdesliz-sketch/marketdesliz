// src/pages/fruta/categoria/[[...slug]].js
// Página de categoría de frutas · soporta jerarquía padre → hijo
//   /fruta/categoria           → todas las frutas
//   /fruta/categoria/todos     → todas las frutas
//   /fruta/categoria/<padre>   → padre + todos sus hijos
//   /fruta/categoria/<padre>/<hijo> → solo el hijo
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Home, SlidersHorizontal,
  Package, Search, Inbox, Plus, Minus, Sprout,
} from 'lucide-react';
import pb from '../../../lib/pocketbase';
import { T } from '../../../lib/tokens';
import TerminalBar from '../../../components/TerminalBar';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BackButton from '../../../components/BackButton';
import FrutaCard from '../../../components/fruta/FrutaCard';

const ITEMS_PER_PAGE = 12;

// ─────────────────────────────────────────────────────────────────────────
// SectionLabel
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

// ─────────────────────────────────────────────────────────────────────────
// Breadcrumb
// ─────────────────────────────────────────────────────────────────────────
function Breadcrumb({
  categoriaActual,
  subcategoriaActual,
  itemCount,
}) {
  const router = useRouter();

  return (
    <div
      style={{
        background: T.bg,
        borderBottom: `1px solid ${T.line}`,
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-14 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <nav
            className="flex items-center gap-2 text-[11.5px] flex-wrap"
            style={{ color: T.inkFaint }}
          >
            <button
              onClick={() =>
                window.history.length > 1 ? router.back() : router.push('/fruta')
              }
              className="inline-flex items-center gap-1 transition-colors"
              style={{
                color: T.accent,
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ChevronLeft size={12} strokeWidth={1.75} /> Volver
            </button>
            <span style={{ color: T.inkGhost }}>·</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 transition-colors"
              style={{ color: T.inkSoft, textDecoration: 'none' }}
            >
              <Home size={11} strokeWidth={1.75} /> Inicio
            </Link>
            <ChevronRight
              size={11}
              strokeWidth={1.75}
              style={{ color: T.inkGhost }}
            />
            <Link
              href="/fruta"
              className="transition-colors"
              style={{ color: T.inkSoft, textDecoration: 'none' }}
            >
              Fruta
            </Link>

            {categoriaActual && (
              <>
                <ChevronRight
                  size={11}
                  strokeWidth={1.75}
                  style={{ color: T.inkGhost }}
                />
                {subcategoriaActual ? (
                  <Link
                    href={`/fruta/categoria/${categoriaActual.slug}`}
                    className="transition-colors"
                    style={{ color: T.inkSoft, textDecoration: 'none' }}
                  >
                    {categoriaActual.nombre}
                  </Link>
                ) : (
                  <span style={{ color: T.ink, fontWeight: 500 }}>
                    {categoriaActual.nombre}
                  </span>
                )}
              </>
            )}

            {subcategoriaActual && (
              <>
                <ChevronRight
                  size={11}
                  strokeWidth={1.75}
                  style={{ color: T.inkGhost }}
                />
                <span style={{ color: T.ink, fontWeight: 500 }}>
                  {subcategoriaActual.nombre}
                </span>
              </>
            )}

            {!categoriaActual && (
              <>
                <ChevronRight
                  size={11}
                  strokeWidth={1.75}
                  style={{ color: T.inkGhost }}
                />
                <span style={{ color: T.ink, fontWeight: 500 }}>Todas</span>
              </>
            )}
          </nav>

          <span
            className="text-[11px] tabular-nums"
            style={{
              color: T.inkFaint,
              fontWeight: 450,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {itemCount} {itemCount === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CategorySidebar · árbol de categorías con conteo
// ─────────────────────────────────────────────────────────────────────────
function CategorySidebar({
  categoriasTree,
  allFrutas,
  categoriaSlug,
  subcategoriaSlug,
}) {
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const initial = {};
    categoriasTree.forEach((cat) => {
      initial[cat.id] = cat.slug === categoriaSlug;
    });
    setExpanded(initial);
  }, [categoriasTree, categoriaSlug]);

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Conteo por categoría (a partir de TODAS las frutas cargadas)
  const counts = useMemo(() => {
    const map = {};
    if (!allFrutas) return map;
    allFrutas.forEach((f) => {
      const cid = f.categoriaId;
      if (cid) map[cid] = (map[cid] || 0) + 1;
    });
    return map;
  }, [allFrutas]);

  const countPadre = (padre) => {
    if (!padre.hijos || padre.hijos.length === 0) {
      return counts[padre.id] || 0;
    }
    return padre.hijos.reduce(
      (acc, hijo) => acc + (counts[hijo.id] || 0),
      0
    );
  };

  if (!categoriasTree || categoriasTree.length === 0) return null;

  const totalGlobal = allFrutas?.length || 0;

  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{
        width: '288px',
        background: T.bg,
        border: `1px solid ${T.line}`,
        borderRadius: '8px',
        position: 'sticky',
        top: '24px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-5 py-4"
        style={{ borderBottom: `1px solid ${T.line}` }}
      >
        <h3
          className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em]"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          <SlidersHorizontal
            size={13}
            strokeWidth={1.75}
            style={{ color: T.accent }}
          />
          Categorías
        </h3>
      </div>

      {/* Link "Todas" */}
      <div className="px-4 pt-4">
        <Link
          href="/fruta/categoria/todos"
          className="flex items-center justify-between gap-2 py-2 px-3 -mx-3 rounded transition-colors"
          style={{
            color:
              !categoriaSlug || categoriaSlug === 'todos'
                ? T.accent
                : T.inkMid,
            fontWeight:
              !categoriaSlug || categoriaSlug === 'todos' ? 600 : 500,
            fontSize: '12px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            background:
              !categoriaSlug || categoriaSlug === 'todos'
                ? 'rgba(79, 46, 232, 0.06)'
                : 'transparent',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span>Todas las frutas</span>
          <span
            className="text-[11px] tabular-nums shrink-0"
            style={{
              color: T.inkFaint,
              fontWeight: 450,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {totalGlobal}
          </span>
        </Link>
      </div>

      {/* Árbol */}
      <div className="p-4 flex flex-col gap-1">
        {categoriasTree.map((padre, sIdx) => {
          const totalPadre = countPadre(padre);
          const isExpanded = expanded[padre.id];
          const isPadreActive =
            categoriaSlug === padre.slug && !subcategoriaSlug;
          const tieneHijos = padre.hijos && padre.hijos.length > 0;

          return (
            <div
              key={padre.id}
              className="pb-3"
              style={{
                borderTop: sIdx === 0 ? 'none' : `1px solid ${T.line}`,
                paddingTop: sIdx === 0 ? 0 : '12px',
              }}
            >
              {/* Fila del padre */}
              <div className="flex items-center justify-between gap-2 py-1">
                <Link
                  href={`/fruta/categoria/${padre.slug}`}
                  className="flex-1 text-[10px] uppercase tracking-[0.18em] transition-colors"
                  style={{
                    color: isPadreActive ? T.accent : T.inkMid,
                    fontWeight: isPadreActive ? 700 : 500,
                    textDecoration: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {padre.nombre}
                </Link>

                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-1.5 py-0.5 tabular-nums"
                    style={{
                      color: T.inkFaint,
                      background: 'rgba(15,15,15,0.04)',
                      borderRadius: '4px',
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {totalPadre}
                  </span>
                  {tieneHijos && (
                    <button
                      type="button"
                      onClick={() => toggle(padre.id)}
                      className="flex items-center justify-center transition-colors"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: T.inkFaint,
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? (
                        <Minus size={12} strokeWidth={1.75} />
                      ) : (
                        <Plus size={12} strokeWidth={1.75} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Hijos */}
              {isExpanded && tieneHijos && (
                <div className="flex flex-col gap-0.5 pt-1">
                  {padre.hijos.map((hijo) => {
                    const count = counts[hijo.id] || 0;
                    const isHijoActive = subcategoriaSlug === hijo.slug;
                    return (
                      <Link
                        key={hijo.id}
                        href={`/fruta/categoria/${padre.slug}/${hijo.slug}`}
                        className="flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded transition-colors"
                        style={{
                          color: isHijoActive ? T.accent : T.inkMid,
                          fontWeight: isHijoActive ? 600 : 450,
                          fontSize: '12.5px',
                          textDecoration: 'none',
                          background: isHijoActive
                            ? 'rgba(79, 46, 232, 0.06)'
                            : 'transparent',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isHijoActive) {
                            e.currentTarget.style.background =
                              'rgba(15,15,15,0.03)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isHijoActive) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <span className="truncate">{hijo.nombre}</span>
                        <span
                          className="text-[11px] tabular-nums shrink-0"
                          style={{
                            color: T.inkFaint,
                            fontWeight: 450,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Paginación
// ─────────────────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-12">
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
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
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
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
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────
function normalizeFruta(record) {
  const imagenes = [];
  if (record.imagen) imagenes.push(pb.files.getURL(record, record.imagen));
  if (record.imagenes) {
    const arr = Array.isArray(record.imagenes)
      ? record.imagenes
      : [record.imagenes];
    arr.forEach((img) => {
      if (img) imagenes.push(pb.files.getURL(record, img));
    });
  }

  return {
    id: record.id,
    nombre: record.nombre || '',
    descripcion: record.descripcion || '',
    categoriaId: record.categoriaId || null,
    categoriaNombre: record.expand?.categoriaId?.nombre || '',
    categoriaSlug: record.expand?.categoriaId?.slug || '',
    precio: record.precio || 0,
    precioAnterior: record.precioAnterior || 0,
    unidad: record.unidad || 'kg',
    stock: record.stock || 0,
    imagen: imagenes[0] || null,
    imagenes,
    activo: record.activo !== false,
    nuevo: record.nuevo === true,
    destacado: record.destacado === true,
    temporada: record.temporada === true,
    agotado: record.stock === 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────
export default function FrutaCategoriaPage() {
  const router = useRouter();
  const { slug = [], busqueda } = router.query;
  const categoriaSlug = slug[0];
  const subcategoriaSlug = slug[1];

  const [allFrutas, setAllFrutas] = useState([]);
  const [frutasFiltradas, setFrutasFiltradas] = useState([]);
  const [categoriasTree, setCategoriasTree] = useState([]);
  const [categoriaActual, setCategoriaActual] = useState(null);
  const [subcategoriaActual, setSubcategoriaActual] = useState(null);
  const [categoriaNoEncontrada, setCategoriaNoEncontrada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState([]);

  // Cargar favoritos
  useEffect(() => {
    const saved = localStorage.getItem('frutas_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Reset de página al cambiar de categoría
  useEffect(() => {
    setCurrentPage(1);
  }, [categoriaSlug, subcategoriaSlug, busqueda]);

  // ─── Cargar datos ──────────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return;

    const cargarTodo = async () => {
      try {
        setLoading(true);
        setError(null);
        setCategoriaNoEncontrada(false);

        // 1. Cargar TODAS las categorías del vertical "frutas"
        const categoriasList = await pb
          .collection('categorias')
          .getFullList({
            filter: 'activo = true && vertical = "frutas"',
            sort: 'orden,nombre',
            fields: 'id,nombre,slug,orden,categoriaPadreId',
          });

        const padres = categoriasList.filter((c) => !c.categoriaPadreId);
        const hijos = categoriasList.filter((c) => c.categoriaPadreId);

        const tree = padres.map((padre) => ({
          id: padre.id,
          nombre: padre.nombre,
          slug: padre.slug,
          hijos: hijos
            .filter((h) => h.categoriaPadreId === padre.id)
            .map((h) => ({ id: h.id, nombre: h.nombre, slug: h.slug })),
        }));

        // Huérfanos (hijos sin padre válido)
        const huerfanos = hijos.filter(
          (h) => !padres.find((p) => p.id === h.categoriaPadreId)
        );
        if (huerfanos.length > 0) {
          tree.push({
            id: 'otros',
            nombre: 'Otros',
            slug: 'otros',
            hijos: huerfanos.map((h) => ({
              id: h.id,
              nombre: h.nombre,
              slug: h.slug,
            })),
          });
        }

        setCategoriasTree(tree);

        // 2. Resolver categoría y subcategoría desde el slug
        let catActual = null;
        let subActual = null;
        const esTodos = !categoriaSlug || categoriaSlug === 'todos';

        if (!esTodos) {
          const padre = padres.find((p) => p.slug === categoriaSlug);
          if (padre) {
            const hijosDeEste = hijos.filter(
              (h) => h.categoriaPadreId === padre.id
            );
            catActual = {
              id: padre.id,
              nombre: padre.nombre,
              slug: padre.slug,
              hijos: hijosDeEste.map((h) => ({
                id: h.id,
                nombre: h.nombre,
                slug: h.slug,
              })),
            };

            if (subcategoriaSlug) {
              const sub = hijosDeEste.find(
                (h) => h.slug === subcategoriaSlug
              );
              if (sub) {
                subActual = {
                  id: sub.id,
                  nombre: sub.nombre,
                  slug: sub.slug,
                };
              }
              // Si el hijo no existe, caemos a "solo el padre" (no rompemos)
            }
          } else {
            // Intentar como categoría huérfana
            const huerfano = hijos.find((h) => h.slug === categoriaSlug);
            if (huerfano) {
              subActual = {
                id: huerfano.id,
                nombre: huerfano.nombre,
                slug: huerfano.slug,
              };
            } else {
              setCategoriaNoEncontrada(true);
              setLoading(false);
              return;
            }
          }
        }

        setCategoriaActual(catActual);
        setSubcategoriaActual(subActual);

        // 3. Cargar TODAS las frutas activas
        const records = await pb.collection('frutas').getFullList({
          filter: 'activo = true',
          sort: 'orden,nombre',
          expand: 'categoriaId',
        });

        const todas = records.map(normalizeFruta);
        setAllFrutas(todas);

        // 4. Filtrar por categoría/subcategoría
        let filtradas = todas;
        if (subActual) {
          filtradas = filtradas.filter(
            (f) => f.categoriaId === subActual.id
          );
        } else if (catActual) {
          const ids = [catActual.id, ...catActual.hijos.map((h) => h.id)];
          filtradas = filtradas.filter(
            (f) => f.categoriaId && ids.includes(f.categoriaId)
          );
        }

        // 5. Filtrar por búsqueda
        if (busqueda?.trim()) {
          const term = busqueda.trim().toLowerCase();
          filtradas = filtradas.filter(
            (f) =>
              f.nombre.toLowerCase().includes(term) ||
              f.descripcion.toLowerCase().includes(term)
          );
        }

        setFrutasFiltradas(filtradas);
      } catch (err) {
        console.error('Error cargando categoría de fruta:', err);
        setError('No pudimos cargar los productos. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarTodo();
  }, [router.isReady, categoriaSlug, subcategoriaSlug, busqueda]);

  // Favoritos
  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('frutas_favorites', JSON.stringify(newFavs));
  };

  // Paginación
  const totalPages = Math.ceil(frutasFiltradas.length / ITEMS_PER_PAGE);
  const frutasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return frutasFiltradas.slice(start, start + ITEMS_PER_PAGE);
  }, [frutasFiltradas, currentPage]);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Título del grid
  const tituloGrid = subcategoriaActual
    ? subcategoriaActual.nombre
    : categoriaActual
    ? categoriaActual.nombre
    : 'Todas las frutas';

  return (
    <>
      <Head>
        <title>
          {subcategoriaActual?.nombre ||
            categoriaActual?.nombre ||
            'Fruta'}{' '}
          | MarketDesliz
        </title>
        <meta
          name="description"
          content={`Explora fruta fresca en ${
            subcategoriaActual?.nombre || categoriaActual?.nombre || 'el catálogo'
          }.`}
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/fruta" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">
          {/* ─── Breadcrumb ─────────────────────────── */}
          <Breadcrumb
            categoriaActual={categoriaActual}
            subcategoriaActual={subcategoriaActual}
            itemCount={frutasFiltradas.length}
          />

          <div className="max-w-[1280px] mx-auto px-6 md:px-14 py-8 md:py-10 w-full">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* ─── Sidebar ────────────────────────── */}
              <div className="hidden lg:block">
                <CategorySidebar
                  categoriasTree={categoriasTree}
                  allFrutas={allFrutas}
                  categoriaSlug={categoriaSlug}
                  subcategoriaSlug={subcategoriaSlug}
                />
              </div>

              {/* ─── Contenido ──────────────────────── */}
              <div className="flex-1 min-w-0">
                {/* Header del grid */}
                <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
                  <SectionLabel>{tituloGrid}</SectionLabel>
                  {busqueda && (
                    <span
                      className="text-[11.5px]"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Búsqueda: “{busqueda}”
                    </span>
                  )}
                </div>

                {/* Estado: no encontrada */}
                {categoriaNoEncontrada && (
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
                      className="text-[15px] mb-2"
                      style={{ color: T.ink, fontWeight: 500 }}
                    >
                      Categoría no encontrada
                    </h3>
                    <p
                      className="text-[13px] max-w-md mb-6"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      La categoría que buscas no existe o fue eliminada.
                    </p>
                    <Link
                      href="/fruta/categoria/todos"
                      className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                      style={{
                        background: T.accent,
                        borderRadius: '6px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      Ver todas las frutas
                    </Link>
                  </div>
                )}

                {/* Estado: cargando */}
                {!categoriaNoEncontrada && loading && (
                  <div className="flex justify-center py-20">
                    <div
                      className="w-6 h-6 border-2 rounded-full animate-spin"
                      style={{
                        borderColor: T.line,
                        borderTopColor: T.accent,
                      }}
                    />
                  </div>
                )}

                {/* Estado: error */}
                {!categoriaNoEncontrada && !loading && error && (
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
                      Error al cargar
                    </h3>
                    <p
                      className="text-[13px] max-w-md mb-6"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      {error}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                      style={{
                        background: T.accent,
                        borderRadius: '6px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* Estado: sin resultados */}
                {!categoriaNoEncontrada &&
                  !loading &&
                  !error &&
                  frutasFiltradas.length === 0 && (
                    <div
                      className="flex flex-col items-center justify-center py-20 px-6 text-center"
                      style={{
                        background: 'rgba(15, 15, 15, 0.02)',
                        border: `1px solid ${T.line}`,
                        borderRadius: '8px',
                      }}
                    >
                      {busqueda ? (
                        <Search
                          size={32}
                          strokeWidth={1.5}
                          style={{ color: T.inkSoft, marginBottom: '16px' }}
                        />
                      ) : (
                        <Package
                          size={32}
                          strokeWidth={1.5}
                          style={{ color: T.inkGhost, marginBottom: '16px' }}
                        />
                      )}
                      <h3
                        className="text-[15px] mb-2"
                        style={{ color: T.ink, fontWeight: 500 }}
                      >
                        {busqueda
                          ? `Sin resultados para "${busqueda}"`
                          : 'No hay frutas en esta categoría'}
                      </h3>
                      <p
                        className="text-[13px] max-w-md mb-6"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        {busqueda
                          ? 'Intenta con otra palabra clave o revisa la ortografía.'
                          : 'Pronto agregaremos productos frescos.'}
                      </p>
                      <Link
                        href="/fruta/categoria/todos"
                        className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                        style={{
                          background: T.accent,
                          borderRadius: '6px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        Ver todas las frutas
                      </Link>
                    </div>
                  )}

                {/* Estado: grid */}
                {!categoriaNoEncontrada &&
                  !loading &&
                  !error &&
                  frutasFiltradas.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                        {frutasPaginadas.map((fruta) => (
                          <FrutaCard
                            key={fruta.id}
                            producto={fruta}
                            isFavorite={favorites.includes(fruta.id)}
                            onToggleFavorite={() => toggleFavorite(fruta.id)}
                            onClick={() => router.push(`/fruta/${fruta.id}`)}
                          />
                        ))}
                      </div>

                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onChange={setCurrentPage}
                      />
                    </>
                  )}
              </div>
            </div>
          </div>
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