// src/pages/[tipo]/categoria/[[...slug]].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Home, SlidersHorizontal,
  Package, Search, Inbox, ArrowUpDown, Plus, Minus
} from 'lucide-react';
import CategoryLayout from '../../../layouts/CategoryLayout';
import pb from '../../../lib/pocketbase';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCategoriasFromPB() {
  try {
    return await pb.collection('categorias').getFullList({ sort: 'orden', filter: 'activo = true' });
  } catch { return []; }
}

async function getSubcategoriasFromPB(categoriaId = null) {
  try {
    let filter = 'activo = true';
    if (categoriaId) filter += ` && categoriaId = "${categoriaId}"`;
    return await pb.collection('subcategorias').getFullList({ filter, sort: 'orden' });
  } catch { return []; }
}

async function getSubcategoriasUnicasDesdeProductos() {
  try {
    const productos = await pb.collection('products').getFullList({ filter: 'activo = true' });
    const set = new Set();
    productos.forEach(p => { if (p.subcategoria?.trim()) set.add(p.subcategoria.toLowerCase().trim()); });
    return Array.from(set).sort();
  } catch { return []; }
}

const collections = {
  productos: 'products', 'uso-personal': 'products',
  ganado: 'products', instrumentos: 'products', tandas: 'tandas'
};

const tipoNombres = {
  productos: 'Productos', 'uso-personal': 'Uso Personal',
  ganado: 'Ganado', instrumentos: 'Instrumentos', tandas: 'Tandas'
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
  if (categoriaSlug === 'todos') {
    // no filtrar
  } else if (categoriaSlug && !subcategoriaSlug) {
    const searchTerm = categoriaSlug.toLowerCase().replace(/-/g, ' ');
    filtered = filtered.filter(item => {
      const s = (item.subcategoria || '').toLowerCase();
      const c = (item.categoria || '').toLowerCase();
      const n = (item.nombre || '').toLowerCase();
      return s.includes(searchTerm) || c.includes(searchTerm) || n.includes(searchTerm);
    });
  }
  if (categoriaSlug && subcategoriaSlug) {
    const sc = categoriaSlug.toLowerCase().replace(/-/g, ' ');
    const ss = subcategoriaSlug.toLowerCase().replace(/-/g, ' ');
    filtered = filtered.filter(i => (i.categoria || '').toLowerCase().includes(sc));
    filtered = filtered.filter(i => (i.subcategoria || '').toLowerCase().includes(ss) || (i.nombre || '').toLowerCase().includes(ss));
  }
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

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ tipo, slugs = [], itemCount, sortBy, setSortBy }) {
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
              return (
                <span key={idx} className="flex items-center gap-1.5">
                  <ChevronRight size={12} className="text-gray-300" />
                  {isLast
                    ? <span className="text-gray-600 font-medium">{getNombreFromSlug(slug)}</span>
                    : <Link href={href} className="hover:text-[#6C3BFF] transition-colors">{getNombreFromSlug(slug)}</Link>
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
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filtros laterales ─────────────────────────────────────────────────────────
function CategoryFilters({ onFilterChange, activeFilters, tipo, onClearAll }) {
  const [expanded, setExpanded] = useState({ electrodomesticos: true, electronica: true, hogar: true, cocina: true, instrumentos: true });

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const sections = tipo === 'productos'
    ? [
        { id: 'electrodomesticos', title: 'Electrodomésticos', items: ['Refrigeradores', 'Lavadoras', 'Secadoras', 'Microondas', 'Estufas', 'Hornos'] },
        { id: 'electronica', title: 'Electrónica', items: ['Celulares', 'Computadoras', 'Televisores', 'Consolas', 'Tablets'] },
        { id: 'hogar', title: 'Hogar', items: ['Muebles', 'Decoración', 'Textiles', 'Iluminación', 'Organización'] },
        { id: 'cocina', title: 'Cocina', items: ['Utensilios', 'Vajilla', 'Cubiertos', 'Electrodomésticos de Cocina'] },
      ]
    : tipo === 'instrumentos'
    ? [{ id: 'instrumentos', title: 'Instrumentos musicales', items: ['Guitarras', 'Bajos', 'Violines', 'Pianos', 'Baterías', 'Teclados'] }]
    : tipo === 'servicios'
    ? [
        { id: 'reparaciones', title: 'Reparaciones', items: ['Plomería', 'Electricidad', 'Carpintería', 'Albañilería', 'Pintura', 'Jardinería'] },
        { id: 'educacion', title: 'Educación', items: ['Clases Particulares', 'Tutorías', 'Cursos Online', 'Idiomas', 'Música', 'Artes'] },
      ]
    : [];

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr?.length > 0);

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
        {sections.map((section) => (
          <div key={section.id} className="border-b border-gray-50 pb-3 last:border-0">
            <button
              onClick={() => toggle(section.id)}
              className="flex items-center justify-between w-full py-2 text-left group"
            >
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide group-hover:text-[#6C3BFF] transition-colors">
                {section.title}
              </span>
              {expanded[section.id]
                ? <Minus size={13} className="text-gray-400" />
                : <Plus size={13} className="text-gray-400" />}
            </button>

            {expanded[section.id] && (
              <div className="space-y-1.5 pl-1 pt-1">
                {section.items.map((item) => {
                  const isActive = activeFilters[section.id]?.includes(item);
                  return (
                    <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => onFilterChange(section.id, item, e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#6C3BFF] rounded"
                      />
                      <span className={`text-sm transition-colors ${isActive ? 'text-[#6C3BFF] font-medium' : 'text-gray-600 group-hover:text-[#6C3BFF]'}`}>
                        {item}
                      </span>
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

// ── ProductCard ───────────────────────────────────────────────────────────────
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
  const categoria = slug[0];
  const subcategoria = slug[1];

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [subcategoriaNombre, setSubcategoriaNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const cargarItems = async () => {
      try {
        setLoading(true);
        setCategoriaNombre(getNombreFromSlug(categoria));
        setSubcategoriaNombre(getNombreFromSlug(subcategoria));
        const busqueda = router.query.busqueda;
        let records = [];
        if (tipo === 'tandas') {
          records = await pb.collection('tandas').getFullList({ filter: 'estado = "abierta"', sort: '-created' });
        } else {
          let filter = 'activo = true';
          if (busqueda?.trim()) {
            filter += ` && (nombre ~ "${busqueda.trim()}" || descripcion ~ "${busqueda.trim()}" || sku ~ "${busqueda.trim()}")`;
          }
          records = await pb.collection('products').getFullList({ filter, sort: '-created' });
        }
        setItems(records.map(item => ({
          id: item.id, nombre: item.nombre || 'Sin nombre', descripcion: item.descripcion || 'Sin descripción',
          precio: item.precio || 0, enganche: item.enganche || 0, paga: item.pagoSemanal || 0,
          categoria: item.categoria || '', subcategoria: item.subcategoria || '',
          imagen: item.imagen ? pb.files.getURL(item, item.imagen) : null,
          semanas: item.semanas || 12, agotado: item.stock === 0, nuevo: item.nuevo || false,
          sku: item.sku || item.id.substring(0, 6).toUpperCase(), created: item.created,
          // tandas fields
          montoTotal: item.montoTotal || item.monto || 0, montoCuota: item.montoCuota || 0,
          totalMiembros: item.cupoMaximo || 0, frecuencia: item.frecuencia || 'semanal',
          diaCobro: item.diaPago || 'Lunes', cuotaGasolina: item.gasFee || 25,
          estado: item.estado, nivelRequerido: item.nivelRequerido || 0
        })));
      } catch (error) {
        console.error('Error cargando items:', error);
      } finally {
        setLoading(false);
      }
    };
    if (tipo) cargarItems();
  }, [tipo, categoria, router.query.busqueda]);

  useEffect(() => {
    if (items.length > 0) {
      let filtered = filterItems(items, tipo, categoria, subcategoria, activeFilters);
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
      if (sortBy === 'price_asc') filtered.sort((a, b) => a.precio - b.precio);
      else if (sortBy === 'price_desc') filtered.sort((a, b) => b.precio - a.precio);
      else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
      setFilteredItems(filtered);
      setCurrentPage(1);
    }
  }, [tipo, categoria, subcategoria, items, activeFilters, sortBy, router.query.busqueda]);

  const handleFilterChange = (section, item, isChecked) => {
    setActiveFilters(prev => {
      const n = { ...prev };
      if (isChecked) { if (!n[section]) n[section] = []; if (!n[section].includes(item)) n[section].push(item); }
      else { if (n[section]) { n[section] = n[section].filter(i => i !== item); if (!n[section].length) delete n[section]; } }
      return n;
    });
  };

  const handleSelect = (itemId) => router.push(`/${tipo}/solicitar/${itemId}`);

  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const esServicio = tipo === 'servicios';
  const esInstrumento = tipo === 'instrumentos';
  const tipoLabel = esServicio ? 'servicios' : esInstrumento ? 'instrumentos' : 'productos';

  if (loading) {
    return (
      <CategoryLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </CategoryLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{subcategoriaNombre || categoriaNombre || 'Categoría'} | MarketDesliz</title>
      </Head>

      <CategoryLayout>
        <div className="pt-20 pb-10">

          {/* Breadcrumb */}
          <Breadcrumb tipo={tipo} slugs={slug} itemCount={filteredItems.length} sortBy={sortBy} setSortBy={setSortBy} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-7">

            {/* Sidebar */}
            <CategoryFilters
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              tipo={tipo}
              onClearAll={() => setActiveFilters({})}
            />

            {/* Resultados */}
            <div className="flex-1 min-w-0">

              {/* Filtros activos */}
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
                        >×</button>
                      </span>
                    ))
                  )}
                  <button onClick={() => setActiveFilters({})} className="text-xs text-gray-400 hover:text-gray-600 px-2">
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