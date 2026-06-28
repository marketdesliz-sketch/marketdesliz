// src/pages/[tipo]/categoria/[[...slug]].js
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Home, SlidersHorizontal,
  Package, Search, Inbox, ArrowUpDown, Plus, Minus,
  Filter, X
} from 'lucide-react';
import CategoryLayout from '../../../layouts/CategoryLayout';
import pb from '../../../lib/pocketbase';
import { CATEGORIAS, generarSlug, getCategoriasParaSidebar } from '../../../config/categorias';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Obtiene la información de una categoría desde la estructura estática
 * por nombre o slug.
 */
function getCategoriaInfoFromStatic(nombreOSlug) {
  if (!nombreOSlug) return null;
  const search = nombreOSlug.toLowerCase().trim();
  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (categoria.slug === search || categoria.nombre?.toLowerCase() === search) {
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

/**
 * Obtiene todas las subcategorías (categorías de productos) desde la estructura estática.
 */
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
        section: section.title
      });
    }
  }
  return subcategorias;
}

/**
 * Obtiene los nombres de las secciones para los filtros.
 */
function getFiltroSecciones(tipo) {
  const categoria = CATEGORIAS[tipo];
  if (!categoria || !categoria.sections) return [];
  return categoria.sections.map(section => ({
    id: generarSlug(section.title),
    title: section.title,
    categories: section.categories.map(cat => ({
      name: cat.name,
      slug: generarSlug(cat.name),
      items: cat.items || []
    }))
  }));
}

const collections = {
  productos: 'products',
  'uso-personal': 'products',
  ganado: 'products',
  instrumentos: 'products',
  tandas: 'tandas'
};

const tipoNombres = {
  productos: 'Productos',
  'uso-personal': 'Uso Personal',
  ganado: 'Ganado',
  instrumentos: 'Instrumentos',
  tandas: 'Tandas'
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
    categoria: item.categoria || '',
    subcategoria: item.subcategoria || '',
    imagen: item.imagen ? pb.files.getURL(item, item.imagen) : null,
    agotado: item.stock === 0 || false,
    nuevo: item.nuevo || false,
    tipo,
    created: item.created,
    sku: item.sku || item.id?.substring(0, 6).toUpperCase()
  };
  if (tipo === 'uso-personal') { base.talla = item.size; base.color = item.color; }
  else if (tipo === 'ganado') { base.raza = item.breed; base.edad = item.age; base.peso = item.weight; base.salud = item.healthStatus; }
  else if (tipo === 'instrumentos') { base.marca = item.brand; base.modelo = item.model; base.tipoInstrumento = item.type; }
  else if (tipo === 'tandas') {
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

const filterItems = (items, tipo, categoriaSlug, subcategoriaSlug, activeFilters = {}) => {
  if (!items.length) return [];
  let filtered = [...items];

  // Filtrar por categoría principal (slug)
  if (categoriaSlug && categoriaSlug !== 'todos') {
    const searchTerm = categoriaSlug.toLowerCase().replace(/-/g, ' ');
    filtered = filtered.filter(item => {
      const s = (item.subcategoria || '').toLowerCase();
      const c = (item.categoria || '').toLowerCase();
      const n = (item.nombre || '').toLowerCase();
      return s.includes(searchTerm) || c.includes(searchTerm) || n.includes(searchTerm);
    });
  }

  // Filtrar por subcategoría (slug)
  if (categoriaSlug && subcategoriaSlug) {
    const sc = categoriaSlug.toLowerCase().replace(/-/g, ' ');
    const ss = subcategoriaSlug.toLowerCase().replace(/-/g, ' ');
    filtered = filtered.filter(i => (i.categoria || '').toLowerCase().includes(sc));
    filtered = filtered.filter(i =>
      (i.subcategoria || '').toLowerCase().includes(ss) ||
      (i.nombre || '').toLowerCase().includes(ss)
    );
  }

  // Filtros activos (checkboxes)
  if (Object.keys(activeFilters).length > 0) {
    Object.entries(activeFilters).forEach(([, filterItemsArr]) => {
      if (filterItemsArr.length > 0) {
        filtered = filtered.filter(item =>
          filterItemsArr.some(fi => {
            const s = fi.toLowerCase().trim();
            const sub = (item.subcategoria || '').toLowerCase().trim();
            const nom = (item.nombre || '').toLowerCase().trim();
            const desc = (item.descripcion || '').toLowerCase().trim();
            const ss = s.endsWith('s') ? s.slice(0, -1) : s;
            const subS = sub.endsWith('s') ? sub.slice(0, -1) : sub;
            return sub.includes(s) || subS.includes(s) || sub.includes(ss) || nom.includes(s) || desc.includes(s);
          })
        );
      }
    });
  }

  return filtered;
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const getNombreFromSlug = (slug) => {
  if (!slug) return '';
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// ── Breadcrumb (mejorado con datos estáticos) ──────────────────────────────
function Breadcrumb({ tipo, slugs = [], itemCount, sortBy, setSortBy, categoriaInfo }) {
  const router = useRouter();
  const displayTipo = tipoNombres[tipo] || tipo?.replace(/-/g, ' ') || '';

  return (
    <div className="bg-white border-b border-gray-100 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">

          {/* Ruta */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
            <button
              onClick={() => window.history.length > 1 ? router.back() : router.push('/')}
              className="flex items-center gap-1 text-[#6C3BFF] font-medium hover:underline"
            >
              <ChevronLeft size={13} /> Volver
            </button>
            <span className="text-gray-200">·</span>
            <Link href="/" className="flex items-center gap-1 hover:text-[#6C3BFF] transition-colors">
              <Home size={12} /> Inicio
            </Link>
            <ChevronRight size={12} className="text-gray-300" />
            <Link href={`/${tipo}`} className="hover:text-[#6C3BFF] transition-colors capitalize">{displayTipo}</Link>

            {slugs.map((slug, idx) => {
              const href = `/${tipo}/categoria/${slugs.slice(0, idx + 1).join('/')}`;
              const isLast = idx === slugs.length - 1;
              // Intentar obtener nombre desde la estructura estática
              let nombreMostrado = getNombreFromSlug(slug);
              if (categoriaInfo && idx === 0) {
                // Si es la categoría principal, usar el nombre real
                nombreMostrado = categoriaInfo.nombre || nombreMostrado;
              }
              if (categoriaInfo?.subcategorias && idx === 1) {
                // Buscar subcategoría
                const sub = categoriaInfo.subcategorias.find(s => s.slug === slug);
                if (sub) nombreMostrado = sub.nombre;
              }
              return (
                <span key={idx} className="flex items-center gap-1.5">
                  <ChevronRight size={12} className="text-gray-300" />
                  {isLast
                    ? <span className="text-gray-600 font-medium">{nombreMostrado}</span>
                    : <Link href={href} className="hover:text-[#6C3BFF] transition-colors">{nombreMostrado}</Link>
                  }
                </span>
              );
            })}
          </nav>

          {/* Contador + orden */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{itemCount} {itemCount === 1 ? 'resultado' : 'resultados'}</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] bg-white transition-all cursor-pointer"
              >
                <option value="relevance">Relevancia</option>
                <option value="newest">Más nuevos</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="popular">Más populares</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filtros laterales (dinámicos desde CATEGORIAS) ──────────────────────────
function CategoryFilters({ onFilterChange, activeFilters, tipo, onClearAll, items, categoriaSlug }) {
  const [expanded, setExpanded] = useState({});

  // Inicializar expandidos dinámicamente
  useEffect(() => {
    const secciones = getFiltroSecciones(tipo);
    const initial = {};
    secciones.forEach((sec, idx) => {
      initial[sec.id] = idx === 0; // Solo la primera abierta por defecto
    });
    setExpanded(initial);
  }, [tipo]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Obtener secciones para el tipo actual desde la estructura estática
  const secciones = useMemo(() => getFiltroSecciones(tipo), [tipo]);

  // Calcular contadores por categoría/subcategoría
  const counts = useMemo(() => {
    const countsMap = {};
    if (!items) return countsMap;
    items.forEach(item => {
      const cat = item.categoria?.trim() || '';
      const sub = item.subcategoria?.trim() || '';
      if (cat) countsMap[cat] = (countsMap[cat] || 0) + 1;
      if (sub) countsMap[sub] = (countsMap[sub] || 0) + 1;
    });
    return countsMap;
  }, [items]);

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr?.length > 0);

  // Si no hay secciones, mostrar mensaje
  if (secciones.length === 0) {
    return (
      <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24 p-4">
        <p className="text-sm text-gray-400 text-center">No hay filtros disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-[#6C3BFF]" /> Filtros
        </h3>
        {hasActiveFilters && (
          <button onClick={onClearAll} className="text-xs text-[#6C3BFF] font-medium hover:underline">
            Limpiar todos
          </button>
        )}
      </div>

      <div className="p-4 space-y-1">
        {secciones.map((section) => (
          <div key={section.id} className="border-b border-gray-50 pb-3 last:border-0">
            <button
              onClick={() => toggle(section.id)}
              className="flex items-center justify-between w-full py-2 text-left group"
            >
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide group-hover:text-[#6C3BFF] transition-colors">
                {section.title}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {section.categories.reduce((acc, cat) => acc + (counts[cat.name] || 0), 0)}
                </span>
                {expanded[section.id]
                  ? <Minus size={13} className="text-gray-400" />
                  : <Plus size={13} className="text-gray-400" />}
              </span>
            </button>

            {expanded[section.id] && (
              <div className="space-y-1.5 pl-1 pt-1">
                {section.categories.map((cat) => {
                  const isActive = activeFilters[section.id]?.includes(cat.name);
                  const count = counts[cat.name] || 0;
                  // Si no hay items en esta categoría, no mostrarla (opcional)
                  if (count === 0) return null;
                  return (
                    <label key={cat.name} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => onFilterChange(section.id, cat.name, e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#6C3BFF] rounded"
                      />
                      <span className={`text-sm transition-colors ${isActive ? 'text-[#6C3BFF] font-medium' : 'text-gray-600 group-hover:text-[#6C3BFF]'}`}>
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">{count}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="w-3.5 h-3.5 accent-[#6C3BFF] rounded" />
            <span className="text-sm font-medium text-gray-800">Pick Up Disponible</span>
          </label>
          <p className="text-xs text-gray-400 mt-1.5">Recoge en tienda sin costo adicional</p>
        </div>
      </div>
    </div>
  );
}

// ── ProductCard (sin cambios, pero añadimos soporte para contador de favoritos) ──
function ProductCard({ item, tipo, onSelect }) {
  const esTanda = tipo === 'tandas';
  const esServicio = tipo === 'servicios';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">

      {/* Imagen */}
      <Link href={`/${tipo}/${item.id}`} className="block">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {item.imagen ? (
            <img
              src={item.imagen}
              alt={item.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={36} className="text-gray-300" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {item.nuevo && !item.agotado && (
              <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Nuevo</span>
            )}
            {item.agotado && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Agotado</span>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1">
        {item.sku && (
          <span className="text-[9px] text-gray-300 font-mono mb-1">{item.sku}</span>
        )}

        <Link href={`/${tipo}/${item.id}`}>
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-[#6C3BFF] transition-colors min-h-[40px]">
            {item.nombre}
          </h3>
        </Link>

        {/* Badges categoría */}
        <div className="flex flex-wrap gap-1 mt-1.5 mb-2">
          {item.categoria && (
            <span className="text-[9px] font-semibold text-[#6C3BFF] bg-[#6C3BFF]/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {item.categoria}
            </span>
          )}
          {item.subcategoria && (
            <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {item.subcategoria}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed min-h-[32px] mb-2">{item.descripcion}</p>

        {/* Precios */}
        {!esServicio && !esTanda && (
          <div className="mt-auto space-y-1 pt-2.5 border-t border-gray-50">
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-400">Desde</span>
              <span className="text-sm font-bold text-gray-900">{formatMoney(item.precio)}</span>
            </div>
            {item.enganche > 0 && (
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">Enganche</span>
                <span className="text-sm font-semibold text-[#6C3BFF]">{formatMoney(item.enganche)}</span>
              </div>
            )}
            {item.paga > 0 && (
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-400">Pago semanal</span>
                <span className="text-sm font-semibold text-[#10b981]">{formatMoney(item.paga)}</span>
              </div>
            )}
          </div>
        )}

        {esServicio && (
          <div className="mt-auto pt-2.5 border-t border-gray-50">
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-400">Precio</span>
              <span className="text-sm font-bold text-gray-900">{formatMoney(item.precio)}</span>
            </div>
          </div>
        )}

        {esTanda && (
          <div className="mt-auto space-y-1 pt-2.5 border-t border-gray-50">
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-400">Monto por ronda</span>
              <span className="text-sm font-bold text-[#6C3BFF]">{formatMoney(item.montoTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-400">Participantes</span>
              <span className="text-xs text-gray-700">{item.totalMiembros}</span>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onSelect(item.id)}
            disabled={item.agotado}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
              item.agotado
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white'
            }`}
          >
            {item.agotado ? 'Agotado' : esTanda ? 'Unirme' : 'Lo quiero'}
          </button>
          <Link
            href={`/${tipo}/${item.id}`}
            className="flex-1 border border-[#6C3BFF] text-[#6C3BFF] py-2 rounded-xl text-xs font-bold text-center hover:bg-[#6C3BFF] hover:text-white transition-colors"
          >
            Ver
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CategoriaPage() {
  const router = useRouter();
  const { tipo, slug = [] } = router.query;
  const categoriaSlug = slug[0];
  const subcategoriaSlug = slug[1];

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [subcategoriaNombre, setSubcategoriaNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [categoriaInfo, setCategoriaInfo] = useState(null);

  // ============================================================
  // 1. CARGAR ITEMS (productos, tandas, etc.)
  // ============================================================
  useEffect(() => {
    const cargarItems = async () => {
      try {
        setLoading(true);
        const busqueda = router.query.busqueda;

        // Obtener información de categoría desde estructura estática
        let catInfo = null;
        if (categoriaSlug) {
          const staticInfo = getCategoriaInfoFromStatic(categoriaSlug);
          if (staticInfo) {
            catInfo = staticInfo;
            // Obtener subcategorías para el breadcrumb
            if (tipo) {
              const subs = getSubcategoriasFromStatic(tipo);
              catInfo.subcategorias = subs;
            }
          }
        }
        setCategoriaInfo(catInfo);
        setCategoriaNombre(catInfo?.nombre || getNombreFromSlug(categoriaSlug));
        setSubcategoriaNombre(getNombreFromSlug(subcategoriaSlug));

        let records = [];
        if (tipo === 'tandas') {
          records = await pb.collection('tandas').getFullList({
            filter: 'estado = "abierta"',
            sort: '-created'
          });
        } else {
          let filter = 'activo = true';
          if (busqueda?.trim()) {
            const term = busqueda.trim();
            filter += ` && (nombre ~ "${term}" || descripcion ~ "${term}" || sku ~ "${term}")`;
          }
          // Si hay categoría específica, filtrar por categoría (usando el nombre o slug)
          if (categoriaSlug && categoriaSlug !== 'todos') {
            const catName = catInfo?.nombre || getNombreFromSlug(categoriaSlug);
            if (catName) {
              // Buscar en campo categoria (texto) o en categoriaId (relación)
              filter += ` && (categoria ~ "${catName}" || categoriaId != "")`;
            }
          }
          records = await pb.collection('products').getFullList({ filter, sort: '-created' });
        }

        // Normalizar items
        const itemsData = records.map(item => normalizeItem(item, tipo));
        setItems(itemsData);
      } catch (error) {
        console.error('Error cargando items:', error);
      } finally {
        setLoading(false);
      }
    };
    if (tipo) cargarItems();
  }, [tipo, categoriaSlug, router.query.busqueda]);

  // ============================================================
  // 2. FILTRAR Y ORDENAR (con useMemo para optimizar)
  // ============================================================
  const itemsFiltrados = useMemo(() => {
    if (items.length === 0) return [];

    let filtered = filterItems(items, tipo, categoriaSlug, subcategoriaSlug, activeFilters);

    // Búsqueda por texto (si viene en query)
    const busqueda = router.query.busqueda;
    if (busqueda?.trim()) {
      const t = busqueda.trim().toLowerCase();
      filtered = filtered.filter(item =>
        (item.nombre || '').toLowerCase().includes(t) ||
        (item.descripcion || '').toLowerCase().includes(t) ||
        (item.sku || '').toLowerCase().includes(t) ||
        (item.subcategoria || '').toLowerCase().includes(t) ||
        (item.categoria || '').toLowerCase().includes(t)
      );
    }

    // Ordenar
    if (sortBy === 'price_asc') filtered.sort((a, b) => a.precio - b.precio);
    else if (sortBy === 'price_desc') filtered.sort((a, b) => b.precio - a.precio);
    else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
    else if (sortBy === 'popular') filtered.sort((a, b) => (b.visitas || 0) - (a.visitas || 0));

    return filtered;
  }, [items, tipo, categoriaSlug, subcategoriaSlug, activeFilters, sortBy, router.query.busqueda]);

  // Actualizar filteredItems cuando cambie itemsFiltrados
  useEffect(() => {
    setFilteredItems(itemsFiltrados);
    setCurrentPage(1);
  }, [itemsFiltrados]);

  // ============================================================
  // 3. MANEJO DE FILTROS Y PAGINACIÓN
  // ============================================================
  const handleFilterChange = useCallback((section, item, isChecked) => {
    setActiveFilters(prev => {
      const n = { ...prev };
      if (isChecked) {
        if (!n[section]) n[section] = [];
        if (!n[section].includes(item)) n[section].push(item);
      } else {
        if (n[section]) {
          n[section] = n[section].filter(i => i !== item);
          if (!n[section].length) delete n[section];
        }
      }
      return n;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const handleSelect = (itemId) => router.push(`/${tipo}/solicitar/${itemId}`);

  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const esServicio = tipo === 'servicios';
  const esInstrumento = tipo === 'instrumentos';
  const tipoLabel = esServicio ? 'servicios' : esInstrumento ? 'instrumentos' : 'productos';

  // ============================================================
  // 4. ESTADOS DE CARGA Y ERROR
  // ============================================================
  if (loading) {
    return (
      <CategoryLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </CategoryLayout>
    );
  }

  // ============================================================
  // 5. RENDERIZADO PRINCIPAL
  // ============================================================
  return (
    <>
      <Head>
        <title>{subcategoriaNombre || categoriaNombre || 'Categoría'} | MarketDesliz</title>
        <meta name="description" content={`Explora ${tipoLabel} en ${categoriaNombre || 'categoría'}`} />
      </Head>

      <CategoryLayout>
        <div className="pt-20 pb-10">

          {/* Breadcrumb */}
          <Breadcrumb
            tipo={tipo}
            slugs={slug}
            itemCount={filteredItems.length}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categoriaInfo={categoriaInfo}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-7">

            {/* Sidebar de filtros (dinámico) */}
            <CategoryFilters
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              tipo={tipo}
              onClearAll={handleClearAllFilters}
              items={items}
              categoriaSlug={categoriaSlug}
            />

            {/* Resultados */}
            <div className="flex-1 min-w-0">

              {/* Filtros activos (badges) */}
              {Object.values(activeFilters).some(a => a?.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(activeFilters).flatMap(([, arr]) =>
                    (arr || []).map(item => (
                      <span key={item} className="flex items-center gap-1.5 bg-[#6C3BFF]/8 text-[#6C3BFF] text-xs font-medium px-3 py-1.5 rounded-full">
                        {item}
                        <button
                          onClick={() => {
                            const section = Object.keys(activeFilters).find(k => activeFilters[k]?.includes(item));
                            if (section) handleFilterChange(section, item, false);
                          }}
                          className="hover:text-[#5b2ee6]"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                  <button onClick={handleClearAllFilters} className="text-xs text-gray-400 hover:text-gray-600 px-2">
                    Limpiar todo
                  </button>
                </div>
              )}

              {/* Estado vacío */}
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {router.query.busqueda ? <Search size={28} className="text-gray-400" /> : <Inbox size={28} className="text-gray-300" />}
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2">
                    {router.query.busqueda
                      ? `Sin resultados para "${router.query.busqueda}"`
                      : `No hay ${tipoLabel} disponibles`}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                    {router.query.busqueda
                      ? 'Intenta con otra palabra clave o revisa la ortografía.'
                      : `No se encontraron ${tipoLabel} en esta categoría.`}
                  </p>
                  <Link
                    href={`/${tipo}`}
                    className="inline-flex items-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Ver todos los {tipoLabel}
                  </Link>
                </div>
              ) : (
                <>
                  {/* Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedItems.map((item) => (
                      <ProductCard key={item.id} item={item} tipo={tipo} onSelect={handleSelect} />
                    ))}
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-500">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                      >
                        Siguiente <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CategoryLayout>
    </>
  );
}