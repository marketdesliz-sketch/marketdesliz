// src/pages/[tipo]/categoria/[[...slug]].js
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Home, SlidersHorizontal,
  Package, Search, Inbox, ArrowUpDown, Plus, Minus,
  X, Heart,
} from 'lucide-react';
import pb from '../../../lib/pocketbase';
import { CATEGORIAS, generarSlug } from '../../../config/categorias';
import { T } from '../../../lib/tokens';
import TerminalBar from '../../../components/TerminalBar';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BackButton from '../../../components/BackButton';

// ─── Formateador de moneda · SIN CAMBIOS ────────────────────────
const formatMoney = (amount) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

// ─── Helpers · SIN CAMBIOS ──────────────────────────────────────
function getCategoriaInfoFromStatic(nombreOSlug) {
  if (!nombreOSlug) return null;
  const search = nombreOSlug.toLowerCase().trim();
  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (
      categoria.slug === search ||
      categoria.nombre?.toLowerCase() === search
    ) {
      return { key, ...categoria };
    }
    if (categoria.sections) {
      for (const section of categoria.sections) {
        for (const cat of section.categories) {
          const catSlug = generarSlug(cat.name);
          if (catSlug === search || cat.name.toLowerCase() === search) {
            return { nombre: cat.name, slug: catSlug, section: section.title };
          }
        }
      }
    }
  }
  return null;
}

function getSubcategoriasFromStatic(tipo = 'productos') {
  const categoria = CATEGORIAS[tipo];
  if (!categoria || !categoria.sections) return [];
  const subcategorias = [];
  for (const section of categoria.sections) {
    for (const cat of section.categories) {
      subcategorias.push({
        nombre: cat.name,
        slug: generarSlug(cat.name),
        items: cat.items || [],
        section: section.title,
      });
    }
  }
  return subcategorias;
}

function getFiltroSecciones(tipo) {
  const categoria = CATEGORIAS[tipo];
  if (!categoria || !categoria.sections) return [];
  return categoria.sections.map((section) => ({
    id: generarSlug(section.title),
    title: section.title,
    categories: section.categories.map((cat) => ({
      name: cat.name,
      slug: generarSlug(cat.name),
      items: cat.items || [],
    })),
  }));
}

const collections = {
  productos: 'products',
  'uso-personal': 'products',
  ganado: 'products',
  instrumentos: 'products',
  tandas: 'tandas',
};

const tipoNombres = {
  productos: 'Productos',
  'uso-personal': 'Uso Personal',
  ganado: 'Ganado',
  instrumentos: 'Instrumentos',
  tandas: 'Tandas',
};

function normalizeItem(item, tipo) {
  const base = {
    id: item.id,
    nombre: item.nombre || 'Sin nombre',
    descripcion: item.descripcion || 'Sin descripción',
    precio: item.precio || 0,
    enganche: item.enganche || 0,
    paga: item.pagoSemanal || 0,
    semanas: item.semanas || 12,
    categoriaId: item.categoriaId || '',
    subcategoria: item.subcategoria || '',
    subcategoriaId: item.subcategoriaId || '',
    imagen: item.imagen ? pb.files.getURL(item, item.imagen) : null,
    agotado: item.stock === 0 || false,
    nuevo: item.nuevo || false,
    tipo,
    created: item.created,
    sku: item.sku || item.id?.substring(0, 6).toUpperCase(),
    expand: item.expand || {},
  };
  if (tipo === 'uso-personal') {
    base.talla = item.size;
    base.color = item.color;
  } else if (tipo === 'ganado') {
    base.raza = item.breed;
    base.edad = item.age;
    base.peso = item.weight;
    base.salud = item.healthStatus;
  } else if (tipo === 'instrumentos') {
    base.marca = item.brand;
    base.modelo = item.model;
    base.tipoInstrumento = item.type;
  } else if (tipo === 'tandas') {
    base.montoTotal = item.montoTotal || item.monto || 0;
    base.montoCuota = item.montoCuota || 0;
    base.totalMiembros = item.cupoMaximo || item.totalMembers || 0;
    base.frecuencia = item.frecuencia || item.frequency || 'semanal';
    base.diaCobro = item.diaPago || item.collectionDay || 'Lunes';
    base.cuotaGasolina = item.gasFee || 25;
    base.estado = item.estado;
    base.nivelRequerido = item.nivelRequerido || 0;
  }
  return base;
}

const filterItems = (items, categoriaId) => {
  if (!items.length) return [];
  if (!categoriaId) return items;
  return items.filter((item) => item.categoriaId === categoriaId);
};

const getNombreFromSlug = (slug) => {
  if (!slug) return '';
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// ─── Sub-componentes UI ─────────────────────────────────────────
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

// ─── Breadcrumb ─────────────────────────────────────────────────
function Breadcrumb({
  tipo,
  slugs = [],
  itemCount,
  sortBy,
  setSortBy,
  categoriaInfo,
  categoriaId,
  categoriasMap,
}) {
  const router = useRouter();
  const displayTipo = tipoNombres[tipo] || tipo?.replace(/-/g, ' ') || '';

  const getCategoriaNombre = (id) => {
    if (categoriasMap && id) {
      return categoriasMap[id] || id;
    }
    return null;
  };

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
                window.history.length > 1 ? router.back() : router.push('/')
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
              style={{
                color: T.inkSoft,
                textDecoration: 'none',
              }}
            >
              <Home size={11} strokeWidth={1.75} /> Inicio
            </Link>
            <ChevronRight
              size={11}
              strokeWidth={1.75}
              style={{ color: T.inkGhost }}
            />
            <Link
              href={`/${tipo}`}
              className="capitalize transition-colors"
              style={{ color: T.inkSoft, textDecoration: 'none' }}
            >
              {displayTipo}
            </Link>

            {slugs.map((slug, idx) => {
              const href = `/${tipo}/categoria/${slugs
                .slice(0, idx + 1)
                .join('/')}`;
              const isLast = idx === slugs.length - 1;
              let nombreMostrado = getNombreFromSlug(slug);

              if (idx === 0 && categoriaId && categoriasMap) {
                const realNombre = getCategoriaNombre(categoriaId);
                if (realNombre) nombreMostrado = realNombre;
              }

              if (categoriaInfo && idx === 0) {
                nombreMostrado = categoriaInfo.nombre || nombreMostrado;
              }
              if (categoriaInfo?.subcategorias && idx === 1) {
                const sub = categoriaInfo.subcategorias.find(
                  (s) => s.slug === slug
                );
                if (sub) nombreMostrado = sub.nombre;
              }
              return (
                <span key={idx} className="flex items-center gap-1.5">
                  <ChevronRight
                    size={11}
                    strokeWidth={1.75}
                    style={{ color: T.inkGhost }}
                  />
                  {isLast ? (
                    <span style={{ color: T.ink, fontWeight: 500 }}>
                      {nombreMostrado}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="transition-colors"
                      style={{ color: T.inkSoft, textDecoration: 'none' }}
                    >
                      {nombreMostrado}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
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

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="outline-none appearance-none transition-colors"
                style={{
                  height: '34px',
                  padding: '0 28px 0 12px',
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontSize: '12px',
                  fontWeight: 450,
                  cursor: 'pointer',
                }}
              >
                <option value="relevance">Relevancia</option>
                <option value="newest">Más nuevos</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="popular">Más populares</option>
              </select>
              <ArrowUpDown
                size={11}
                strokeWidth={1.75}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: T.inkFaint }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryFilters({
  tipo,
  items,
  categoriasTree,
  categoriaSlug,
  subcategoriaSlug,
}) {
  const [expanded, setExpanded] = useState({});

  // Auto-expandir el padre de la categoría activa
  useEffect(() => {
    const initial = {};
    categoriasTree.forEach((cat) => {
      initial[cat.id] = cat.slug === categoriaSlug;
    });
    setExpanded(initial);
  }, [categoriasTree, categoriaSlug]);

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Contar productos por categoría
  const counts = useMemo(() => {
    const countsMap = {};
    if (!items) return countsMap;
    items.forEach((item) => {
      const cid = item.categoriaId;
      if (cid) countsMap[cid] = (countsMap[cid] || 0) + 1;
    });
    return countsMap;
  }, [items]);

  const countPadre = (padre) => {
    if (!padre.hijos || padre.hijos.length === 0) {
      return counts[padre.id] || 0;
    }
    return padre.hijos.reduce(
      (acc, hijo) => acc + (counts[hijo.id] || 0),
      0
    );
  };

  if (!categoriasTree || categoriasTree.length === 0) {
    return null;
  }

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
                  href={`/${tipo}/categoria/${padre.slug}`}
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
                        href={`/${tipo}/categoria/${padre.slug}/${hijo.slug}`}
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

      {/* Pick Up */}
      <div className="px-4 pb-4">
        <div
          className="p-3.5"
          style={{
            background: 'rgba(15,15,15,0.02)',
            border: `1px solid ${T.line}`,
            borderRadius: '6px',
          }}
        >
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              style={{
                width: '14px',
                height: '14px',
                accentColor: T.accent,
                cursor: 'pointer',
              }}
            />
            <span
              className="text-[12px]"
              style={{ color: T.ink, fontWeight: 500 }}
            >
              Pick Up Disponible
            </span>
          </label>
          <p
            className="text-[10.5px] mt-1.5"
            style={{ color: T.inkFaint, fontWeight: 450 }}
          >
            Recoge en tienda sin costo adicional
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ProductCard ────────────────────────────────────────────────
function ProductCard({ item, tipo, onSelect, favorites, toggleFavorite }) {
  const router = useRouter();
  const categoriaNombre = item.expand?.categoriaId?.nombre || '';
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => router.push(`/${tipo}/${item.id}`)}
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
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'rgba(15,15,15,0.03)' }}
      >
        {item.imagen ? (
          <img
            src={item.imagen}
            alt={item.nombre}
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

        {/* Favorito */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className="flex items-center justify-center transition-transform"
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(250, 250, 249, 0.9)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label="Favorito"
          >
            <Heart
              size={14}
              strokeWidth={1.75}
              style={{
                fill: favorites.includes(item.id) ? '#EF4444' : 'transparent',
                color: favorites.includes(item.id) ? '#EF4444' : T.inkFaint,
              }}
            />
          </button>
        </div>

        {/* Badges */}
        {item.nuevo && !item.agotado && (
          <span
            className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5"
            style={{
              background: 'rgba(184, 130, 14, 0.92)',
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
            Nuevo
          </span>
        )}
        {item.agotado && (
          <span
            className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5"
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
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {categoriaNombre && (
          <span
            className="inline-flex items-center self-start px-2 py-0.5"
            style={{
              background: 'rgba(79, 46, 232, 0.06)',
              color: T.accent,
              borderRadius: '4px',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontWeight: 500,
            }}
          >
            {categoriaNombre}
          </span>
        )}

        <h3
          className="text-[14px] leading-snug tracking-[-0.005em] line-clamp-1"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          {item.nombre}
        </h3>

        <p
          className="text-[16px] tabular-nums tracking-[-0.01em]"
          style={{
            color: T.ink,
            fontWeight: 500,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {formatMoney(item.paga)}
          <span
            className="text-[11px] ml-1"
            style={{ color: T.inkFaint, fontWeight: 450 }}
          >
            / semana
          </span>
        </p>

        {item.precio > 0 && (
          <p
            className="text-[11.5px] tabular-nums"
            style={{
              color: T.inkSoft,
              fontWeight: 450,
              fontFeatureSettings: '"tnum"',
            }}
          >
            Enganche{' '}
            <span style={{ color: T.accent, fontWeight: 500 }}>
              {formatMoney(Math.round(item.precio * 0.25))}
            </span>
            <span style={{ color: T.inkFaint }}> (25%)</span>
          </p>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/${tipo}/${item.id}`);
          }}
          className="mt-3 inline-flex items-center justify-center gap-1.5 h-9 text-white text-[12px]"
          style={{
            background: T.accent,
            borderRadius: '6px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transitionTimingFunction: T.ease,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
        >
          Ver producto <ChevronRight size={12} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ───────────────────────────────────────────
export default function CategoriaPage({ tipoForzado = null }) {
  const router = useRouter();
  const { tipo: tipoRouter, slug = [] } = router.query;
  const tipo = tipoForzado || tipoRouter;
  const categoriaSlug = slug[0];
  const subcategoriaSlug = slug[1];

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [subcategoriaNombre, setSubcategoriaNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [categoriaInfo, setCategoriaInfo] = useState(null);
  const [categoriaId, setCategoriaId] = useState(null);
  const [subcategorias, setSubcategorias] = useState([]);
  const [categoriasMap, setCategoriasMap] = useState({});
  const [categoriasTree, setCategoriasTree] = useState([]);
  const [favorites, setFavorites] = useState([]);


  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Cargar favoritos ───────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  // ─── Cargar categorías y productos · SIN CAMBIOS ────────
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const busqueda = router.query.busqueda;

        // 1. Cargar TODAS las categorías de products con jerarquía
        let categoriasMapLocal = {};
        let arbol = [];
        try {
          const categoriasList = await pb
            .collection('categorias')
            .getFullList({
              filter: 'activo = true && vertical = "products"',
              sort: 'orden,nombre',
              fields: 'id,nombre,slug,orden,categoriaPadreId',
            });

          categoriasList.forEach((c) => {
            categoriasMapLocal[c.id] = c.nombre;
          });

          const padres = categoriasList.filter((c) => !c.categoriaPadreId);
          const hijos = categoriasList.filter((c) => c.categoriaPadreId);

          arbol = padres.map((padre) => ({
            id: padre.id,
            nombre: padre.nombre,
            slug: padre.slug,
            hijos: hijos
              .filter((h) => h.categoriaPadreId === padre.id)
              .map((h) => ({
                id: h.id,
                nombre: h.nombre,
                slug: h.slug,
              })),
          }));

          // Huérfanos (hijos sin padre válido) — se agregan al final
          const huerfanos = hijos.filter(
            (h) => !padres.find((p) => p.id === h.categoriaPadreId)
          );
          if (huerfanos.length > 0) {
            arbol.push({
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

          // 🔍 DEBUG - ver qué se cargó
          console.log('🌳 Árbol de categorías:', arbol);
          console.log('📊 Padres:', padres.map(p => ({ id: p.id, nombre: p.nombre })));
          console.log('📊 Hijos:', hijos.map(h => ({ id: h.id, nombre: h.nombre, padre: h.categoriaPadreId })));

          setCategoriasMap(categoriasMapLocal);
          setCategoriasTree(arbol);
        } catch (e) {
          console.warn('No se pudieron cargar categorías desde PocketBase:', e);
        }

        // 2. Obtener ID de categoría desde el slug
        let catId = null;
        let catInfo = null;
        let catNombre = '';

        if (categoriaSlug && categoriaSlug !== 'todos') {
          // 1. Lookup por slug EXACTO en PocketBase (caso normal)
          try {
            const catRecord = await pb
              .collection('categorias')
              .getFirstListItem(
                `slug = "${categoriaSlug}" && activo = true`,
                { fields: 'id,nombre,slug' }
              );
            if (catRecord) {
              catId = catRecord.id;
              catNombre = catRecord.nombre;
              catInfo = {
                id: catRecord.id,
                nombre: catRecord.nombre,
                slug: catRecord.slug,
              };
            }
          } catch (e1) {
            // 2. Fallback: buscar por nombre (LIKE)
            try {
              const catRecord = await pb
                .collection('categorias')
                .getFirstListItem(
                  `nombre ~ "${categoriaSlug}" && activo = true`,
                  { fields: 'id,nombre,slug' }
                );
              if (catRecord) {
                catId = catRecord.id;
                catNombre = catRecord.nombre;
                catInfo = {
                  id: catRecord.id,
                  nombre: catRecord.nombre,
                  slug: catRecord.slug,
                };
              }
            } catch (e2) {
              // 3. Fallback final: usar catálogo estático
              const staticInfo = getCategoriaInfoFromStatic(categoriaSlug);
              if (staticInfo) {
                catInfo = staticInfo;
                catNombre = staticInfo.nombre;
                try {
                  const catRecord = await pb
                    .collection('categorias')
                    .getFirstListItem(
                      `nombre ~ "${staticInfo.nombre}" && activo = true`,
                      { fields: 'id,nombre,slug' }
                    );
                  if (catRecord) {
                    catId = catRecord.id;
                    catNombre = catRecord.nombre;
                  }
                } catch (e3) {
                  console.warn(
                    `⚠️ Categoría no encontrada en PocketBase: ${categoriaSlug}`
                  );
                }
              }
            }
          }
        }

        if (!catId && categoriaSlug && categoriaSlug !== 'todos') {
          console.warn(
            `⚠️ No se encontró categoría para slug: ${categoriaSlug}, redirigiendo a /${tipo}`
          );
          router.push(`/${tipo}`);
          return;
        }

        // ✅ Cargar subcategorías (hijas)
        let subcats = [];
        if (catId) {
          try {
            subcats = await pb.collection('categorias').getFullList({
              filter: `categoriaPadreId = "${catId}" && activo = true`,
              sort: 'orden,nombre',
              fields: 'id,nombre,slug,orden',
            });
          } catch (e) {
            console.warn('No se pudieron cargar subcategorías:', e);
          }
        }

        setCategoriaId(catId);
        setCategoriaNombre(catNombre);
        setCategoriaInfo(catInfo);
        setSubcategorias(subcats);
        setSubcategoriaNombre(getNombreFromSlug(subcategoriaSlug));

        // 3. Cargar productos
        let records = [];
        if (tipo === 'tandas') {
          records = await pb.collection('tandas').getFullList({
            filter: 'estado = "abierta"',
            sort: '-created',
          });
        } else {
          let filter = 'activo = true';

          if (busqueda?.trim()) {
            const term = busqueda.trim();
            filter += ` && (nombre ~ "${term}" || descripcion ~ "${term}" || sku ~ "${term}")`;
          }

          if (catId) {
            if (subcats.length > 0) {
              // Productos de la padre Y de todas las hijas
              const ids = [catId, ...subcats.map((s) => s.id)];
              const cond = ids
                .map((id) => `categoriaId = "${id}"`)
                .join(' || ');
              filter += ` && (${cond})`;
            } else {
              filter += ` && categoriaId = "${catId}"`;
            }
          }

          records = await pb.collection('products').getFullList({
            filter: filter,
            sort: '-created',
            expand: 'categoriaId,subcategoriaId',
          });
        }

        const itemsData = records.map((item) => normalizeItem(item, tipo));
        setItems(itemsData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    if (tipo) cargarDatos();
  }, [tipo, categoriaSlug, router.query.busqueda]);

  // ─── Filtrar y ordenar · SIN CAMBIOS ────────────────────
  const itemsFiltrados = useMemo(() => {
    if (items.length === 0) return [];

    // Resolver subcategoría activa desde la URL
    let subId = null;
    if (subcategoriaSlug && subcategorias.length > 0) {
      const sub = subcategorias.find((s) => s.slug === subcategoriaSlug);
      if (sub) subId = sub.id;
    }

    // Si hay subcategoría en la URL → filtrar por ella
    // Si no → filtrar por la categoría padre (que ya incluye a las hijas)
    const catFiltro = subId || categoriaId;

    let filtered = filterItems(items, catFiltro);

    const busqueda = router.query.busqueda;
    if (busqueda?.trim()) {
      const t = busqueda.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.nombre || '').toLowerCase().includes(t) ||
          (item.descripcion || '').toLowerCase().includes(t) ||
          (item.sku || '').toLowerCase().includes(t) ||
          (item.expand?.categoriaId?.nombre || '').toLowerCase().includes(t)
      );
    }

    if (sortBy === 'price_asc') filtered.sort((a, b) => a.precio - b.precio);
    else if (sortBy === 'price_desc')
      filtered.sort((a, b) => b.precio - a.precio);
    else if (sortBy === 'newest')
      filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
    else if (sortBy === 'popular')
      filtered.sort((a, b) => (b.visitas || 0) - (a.visitas || 0));

    return filtered;
  }, [
    items,
    categoriaId,
    subcategoriaSlug,
    subcategorias,
    sortBy,
    router.query.busqueda,
    categoriaInfo,
  ]);

  useEffect(() => {
    setFilteredItems(itemsFiltrados);
    setCurrentPage(1);
  }, [itemsFiltrados]);

  const handleSelect = (itemId) => router.push(`/${tipo}/solicitar/${itemId}`);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const esServicio = tipo === 'servicios';
  const esInstrumento = tipo === 'instrumentos';
  const tipoLabel = esServicio
    ? 'servicios'
    : esInstrumento
      ? 'instrumentos'
      : 'productos';

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
                Cargando categoría
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
        <title>
          {categoriaNombre || subcategoriaNombre || 'Categoría'} | MarketDesliz
        </title>
        <meta
          name="description"
          content={`Explora ${tipoLabel} en ${categoriaNombre || 'categoría'}`}
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback={`/${tipo || ''}`} />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">
          {/* ─── Breadcrumb ───────────────────────────── */}
          <Breadcrumb
            tipo={tipo}
            slugs={slug}
            itemCount={filteredItems.length}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categoriaInfo={categoriaInfo}
            categoriaId={categoriaId}
            categoriasMap={categoriasMap}
          />

          <div className="max-w-[1280px] mx-auto px-6 md:px-14 py-8 md:py-10 w-full">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* ─── Sidebar filtros ─────────────────── */}
              <div className="hidden lg:block">
                <CategoryFilters
                  tipo={tipo}
                  items={items}
                  categoriasTree={categoriasTree}
                  categoriaSlug={categoriaSlug}
                  subcategoriaSlug={subcategoriaSlug}
                />
              </div>

              {/* ─── Resultados ──────────────────────── */}
              <div className="flex-1 min-w-0">
                {filteredItems.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-20 px-6 text-center"
                    style={{
                      background: 'rgba(15, 15, 15, 0.02)',
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      className="inline-flex items-center justify-center mb-4"
                      style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(15,15,15,0.04)',
                        borderRadius: '12px',
                      }}
                    >
                      {router.query.busqueda ? (
                        <Search
                          size={26}
                          strokeWidth={1.5}
                          style={{ color: T.inkSoft }}
                        />
                      ) : (
                        <Inbox
                          size={26}
                          strokeWidth={1.5}
                          style={{ color: T.inkGhost }}
                        />
                      )}
                    </div>
                    <h3
                      className="text-[15px] mb-2"
                      style={{ color: T.ink, fontWeight: 500 }}
                    >
                      {router.query.busqueda
                        ? `Sin resultados para "${router.query.busqueda}"`
                        : `No hay ${tipoLabel} disponibles`}
                    </h3>
                    <p
                      className="text-[13px] max-w-sm mb-6"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      {router.query.busqueda
                        ? 'Intenta con otra palabra clave o revisa la ortografía.'
                        : `No se encontraron ${tipoLabel} en esta categoría.`}
                    </p>
                    <Link
                      href={`/${tipo}`}
                      className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                      style={{
                        background: T.accent,
                        borderRadius: '6px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.accentDeep)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = T.accent)
                      }
                    >
                      Ver todos los {tipoLabel}
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                      {paginatedItems.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          tipo={tipo}
                          onSelect={handleSelect}
                          favorites={favorites}
                          toggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-12">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: 'transparent',
                            border: `1px solid ${T.line}`,
                            borderRadius: '6px',
                            color: T.inkMid,
                            fontWeight: 500,
                            cursor:
                              currentPage === 1 ? 'not-allowed' : 'pointer',
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
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
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