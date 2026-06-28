// src/pages/catalogos.js
import { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BookOpen, ChevronRight, Package, Inbox,
  ArrowUpDown, ChevronLeft, Home, Filter
} from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';
import { CATEGORIAS, generarSlug } from '../config/categorias';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0
  }).format(amount);
};

// ─── Colores para los catálogos ──────────────────────────────────────────
const coloresCatalogos = [
  'bg-sky-600', 'bg-[#6C3BFF]', 'bg-emerald-600', 'bg-pink-600',
  'bg-orange-500', 'bg-rose-500', 'bg-yellow-500', 'bg-green-700',
  'bg-gray-800', 'bg-red-500', 'bg-indigo-600', 'bg-teal-600',
  'bg-purple-600', 'bg-blue-600', 'bg-amber-600', 'bg-cyan-600'
];

// ─── Generar lista de catálogos desde la estructura estática ──────────────
function generarCatalogosDesdeEstructura() {
  const catalogos = [
    { id: 'todos', nombre: 'Todos', color: 'bg-gray-700', descripcion: 'Explora todo nuestro catálogo' },
    { id: 'nuevos', nombre: 'Nuevos', color: 'bg-indigo-600', descripcion: 'Lanzamientos recientes' }
  ];

  const seccionProductos = CATEGORIAS.productos;
  if (seccionProductos && seccionProductos.sections) {
    let colorIndex = 0;
    for (const section of seccionProductos.sections) {
      for (const cat of section.categories) {
        const slug = generarSlug(cat.name);
        catalogos.push({
          id: slug,
          nombre: cat.name,
          color: coloresCatalogos[colorIndex % coloresCatalogos.length],
          descripcion: `Productos de ${cat.name.toLowerCase()}`,
          categoriaExacta: cat.name,
          items: cat.items || [] // Guardamos los items (subcategorías)
        });
        colorIndex++;
      }
    }
  }

  return catalogos;
}

export default function CatalogosPage() {
  const router = useRouter();
  const { categoria, subcategoria, page = 1, sort = 'relevance' } = router.query;
  const [loading, setLoading] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState(categoria || 'todos');
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState(subcategoria || '');
  const [productos, setProductos] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [sortBy, setSortBy] = useState(sort);
  const [productCounts, setProductCounts] = useState({});
  const [error, setError] = useState(null);

  const itemsPerPage = 12;

  // Lista de catálogos (generada una vez al montar)
  const listaCatalogos = useMemo(() => generarCatalogosDesdeEstructura(), []);

  // Catálogo actual
  const catalogoActual = useMemo(() => {
    return listaCatalogos.find(c => c.id === catalogoSeleccionado) || listaCatalogos[0];
  }, [listaCatalogos, catalogoSeleccionado]);

  // Subcategorías del catálogo actual (desde la estructura estática)
  const subcategoriasDisponibles = useMemo(() => {
    if (!catalogoActual || catalogoActual.id === 'todos' || catalogoActual.id === 'nuevos') return [];
    return catalogoActual.items || [];
  }, [catalogoActual]);

  // ============================================================
  // 1. CARGAR CONTADORES DE PRODUCTOS POR CATÁLOGO
  // ============================================================
  useEffect(() => {
    const cargarContadores = async () => {
      try {
        setLoadingCounts(true);
        const counts = {};

        // Contar total de productos activos
        const totalProductos = await pb.collection('products').getList(1, 1, {
          filter: 'activo = true',
          fields: 'id'
        });
        counts['todos'] = totalProductos.totalItems;

        // Contar productos nuevos (últimos 30 días)
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);
        const nuevos = await pb.collection('products').getList(1, 1, {
          filter: `activo = true && created >= "${fechaLimite.toISOString()}"`,
          fields: 'id'
        });
        counts['nuevos'] = nuevos.totalItems;

        // Contar por categoría (usando el nombre exacto o slug)
        for (const cat of listaCatalogos) {
          if (cat.id === 'todos' || cat.id === 'nuevos') continue;
          const nombreCategoria = cat.categoriaExacta || cat.nombre;
          const result = await pb.collection('products').getList(1, 1, {
            filter: `activo = true && categoria = "${nombreCategoria}"`,
            fields: 'id'
          });
          counts[cat.id] = result.totalItems;
        }

        setProductCounts(counts);
      } catch (error) {
        console.error('Error cargando contadores:', error);
      } finally {
        setLoadingCounts(false);
      }
    };

    if (listaCatalogos.length > 0) cargarContadores();
  }, [listaCatalogos]);

  // ============================================================
  // 2. CARGAR PRODUCTOS (con paginación y ordenamiento)
  // ============================================================
  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let filter = 'activo = true';
      const offset = (currentPage - 1) * itemsPerPage;

      // Filtro por catálogo
      if (catalogoSeleccionado !== 'todos' && catalogoSeleccionado !== 'nuevos') {
        const nombreCategoria = catalogoActual?.categoriaExacta || catalogoActual?.nombre;
        if (nombreCategoria) {
          filter += ` && categoria = "${nombreCategoria}"`;
        }
        // Filtrar por subcategoría si está seleccionada
        if (subcategoriaSeleccionada) {
          // Buscar el nombre de la subcategoría (item) en la estructura
          const subcatItem = catalogoActual?.items?.find(item => generarSlug(item) === subcategoriaSeleccionada);
          if (subcatItem) {
            filter += ` && subcategoria = "${subcatItem}"`;
          }
        }
      }

      if (catalogoSeleccionado === 'nuevos') {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);
        filter += ` && created >= "${fechaLimite.toISOString()}"`;
      }

      // Ordenamiento
      let sortField = '-created';
      if (sortBy === 'price_asc') sortField = 'precio';
      else if (sortBy === 'price_desc') sortField = '-precio';
      else if (sortBy === 'newest') sortField = '-created';
      else if (sortBy === 'popular') sortField = '-visitas';

      const result = await pb.collection('products').getList(currentPage, itemsPerPage, {
        filter,
        sort: sortField,
        expand: 'categoriaId'
      });

      setProductos(result.items);
      setTotalProducts(result.totalItems);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError('No pudimos cargar los productos. Intenta de nuevo.');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [catalogoSeleccionado, subcategoriaSeleccionada, currentPage, sortBy, catalogoActual]);

  // Cargar productos cuando cambien los filtros
  useEffect(() => {
    if (listaCatalogos.length > 0) {
      cargarProductos();
    }
  }, [catalogoSeleccionado, subcategoriaSeleccionada, currentPage, sortBy, cargarProductos, listaCatalogos]);

  // ============================================================
  // 3. MANEJO DE SELECCIÓN DE CATÁLOGO Y SUBCATEGORÍA
  // ============================================================
  const handleSelectCatalogo = (id) => {
    setCatalogoSeleccionado(id);
    setSubcategoriaSeleccionada('');
    setCurrentPage(1);
    router.push(
      `/catalogos?categoria=${id}${id !== 'todos' && id !== 'nuevos' && subcategoriaSeleccionada ? `&subcategoria=${subcategoriaSeleccionada}` : ''}`,
      undefined,
      { shallow: true }
    );
  };

  const handleSelectSubcategoria = (slug) => {
    setSubcategoriaSeleccionada(slug);
    setCurrentPage(1);
    router.push(
      `/catalogos?categoria=${catalogoSeleccionado}&subcategoria=${slug}`,
      undefined,
      { shallow: true }
    );
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(
      `/catalogos?categoria=${catalogoSeleccionado}${subcategoriaSeleccionada ? `&subcategoria=${subcategoriaSeleccionada}` : ''}&page=${newPage}&sort=${sortBy}`,
      undefined,
      { shallow: true }
    );
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    setCurrentPage(1);
    router.push(
      `/catalogos?categoria=${catalogoSeleccionado}${subcategoriaSeleccionada ? `&subcategoria=${subcategoriaSeleccionada}` : ''}&page=1&sort=${value}`,
      undefined,
      { shallow: true }
    );
  };

  // ============================================================
  // 4. RENDERIZADO
  // ============================================================
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  if (listaCatalogos.length === 0 && !loadingCounts) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <Inbox size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No hay catálogos disponibles</h2>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>
          {catalogoActual?.nombre || 'Catálogos'} | MarketDesliz
        </title>
        <meta
          name="description"
          content={`Explora ${catalogoActual?.nombre?.toLowerCase() || 'nuestros catálogos'}. Encuentra productos de calidad en MarketDesliz.`}
        />
      </Head>

      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-36 pb-10">

          {/* ── Breadcrumb ─────────────────────────────────────────── */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap mb-6">
            <Link href="/" className="flex items-center gap-1 hover:text-[#6C3BFF] transition-colors">
              <Home size={12} /> Inicio
            </Link>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-gray-600 font-medium">Catálogos</span>
            {catalogoActual && catalogoActual.id !== 'todos' && (
              <>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="text-gray-600 font-medium">{catalogoActual.nombre}</span>
              </>
            )}
            {subcategoriaSeleccionada && (
              <>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="text-gray-600 font-medium">{subcategoriaSeleccionada.replace(/-/g, ' ')}</span>
              </>
            )}
          </nav>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Catálogos MarketDesliz</h1>
            <p className="text-gray-500 mt-2 text-sm">Explora nuestros catálogos por categoría</p>
          </div>

          {/* ── Grid de catálogos (con contadores) ────────────────── */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
            {listaCatalogos.map((cat) => {
              const count = productCounts[cat.id] || 0;
              // Si el contador es 0 y no es "todos" ni "nuevos", lo mostramos pero con opacidad
              const isActive = catalogoSeleccionado === cat.id;
              const hasProducts = count > 0 || cat.id === 'todos' || cat.id === 'nuevos';

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCatalogo(cat.id)}
                  disabled={!hasProducts}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                    isActive
                      ? 'ring-2 ring-[#6C3BFF] ring-offset-2 shadow-md scale-[1.02]'
                      : hasProducts
                      ? 'hover:shadow-md hover:-translate-y-0.5'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className={`${cat.color} py-4 px-2 text-white text-center`}>
                    <p className="font-semibold text-xs leading-tight">{cat.nombre}</p>
                    {!loadingCounts && (
                      <span className="text-[9px] font-medium text-white/70 block mt-0.5">
                        {count} {count === 1 ? 'producto' : 'productos'}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#6C3BFF] rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Banner del catálogo activo ────────────────────────── */}
          {catalogoActual && (
            <div className={`${catalogoActual.color || 'bg-gray-700'} rounded-2xl px-6 py-5 mb-5 flex items-center justify-between gap-4`}>
              <div>
                <h2 className="text-lg font-bold text-white">{catalogoActual.nombre}</h2>
                <p className="text-white/80 text-sm mt-0.5">
                  {catalogoActual.descripcion}
                  {subcategoriaSeleccionada && ` · ${subcategoriaSeleccionada.replace(/-/g, ' ')}`}
                </p>
              </div>
              <div className="text-white/60 text-sm">
                {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
              </div>
            </div>
          )}

          {/* ── Subcategorías (si las hay) ────────────────────────── */}
          {subcategoriasDisponibles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs font-medium text-gray-500 mr-1">Filtrar por:</span>
              <button
                onClick={() => handleSelectSubcategoria('')}
                className={`text-xs px-3 py-1.5 rounded-full transition ${
                  !subcategoriaSeleccionada
                    ? 'bg-[#6C3BFF] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {subcategoriasDisponibles.map((item) => {
                const slug = generarSlug(item);
                const isActive = subcategoriaSeleccionada === slug;
                return (
                  <button
                    key={slug}
                    onClick={() => handleSelectSubcategoria(slug)}
                    className={`text-xs px-3 py-1.5 rounded-full transition ${
                      isActive
                        ? 'bg-[#6C3BFF] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Ordenamiento ────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {loading ? 'Cargando...' : `${totalProducts} ${totalProducts === 1 ? 'producto' : 'productos'} encontrados`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25"
              >
                <option value="relevance">Relevancia</option>
                <option value="newest">Más nuevos</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="popular">Más populares</option>
              </select>
            </div>
          </div>

          {/* ── Lista de productos ──────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={() => cargarProductos()}
                className="mt-3 text-sm text-[#6C3BFF] font-medium hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : productos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <Inbox size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay productos en este catálogo</h3>
              <p className="text-sm text-gray-400 mb-4">Pronto tendremos más productos para ti</p>
              <button
                onClick={() => handleSelectCatalogo('todos')}
                className="text-sm text-[#6C3BFF] font-medium hover:underline"
              >
                Ver todos los productos →
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    onClick={() => router.push(`/productos/${producto.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                  >
                    {/* Imagen */}
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {producto.imagen ? (
                        <img
                          src={pb.files.getURL(producto, producto.imagen)}
                          alt={producto.nombre || 'Producto'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={36} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <span className="text-[10px] font-semibold text-[#6C3BFF] bg-[#6C3BFF]/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {producto.categoria || 'General'}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm mt-2 mb-1 line-clamp-1">
                        {producto.nombre || 'Sin nombre'}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                        {producto.descripcion || ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#6C3BFF]">
                          {formatMoney(producto.precio)}
                        </span>
                        <ChevronRight size={15} className="text-gray-300 group-hover:text-[#6C3BFF] transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Paginación ────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-500">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
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
      </StoreLayout>
    </>
  );
}