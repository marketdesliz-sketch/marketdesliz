// src/pages/catalogos.js
import { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BookOpen, ChevronRight, ChevronLeft, Inbox, Archive,
  Filter, Phone, Mail, MapPin, ArrowRight, Sparkles,
  Shirt, Footprints, ShoppingBag, Layers, Crown, Star,
  Scissors, Package
} from 'lucide-react';
import pb from '../lib/pocketbase';

// ─── Helpers ────────────────────────────────────────────
const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0
  }).format(amount);
};

const generarSlug = (nombre) =>
  (nombre || '').toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// ─── DATA: Categorías editoriales ÉP ────────────────────
const CATEGORIAS_EP = [
  { nombre: 'Blazers',    icono: Shirt },
  { nombre: 'Vestidos',   icono: Sparkles },
  { nombre: 'Camisas',    icono: Shirt },
  { nombre: 'Playeras',   icono: Shirt },
  { nombre: 'Pantalones', icono: Layers },
  { nombre: 'Jeans',      icono: Layers },
  { nombre: 'Faldas',     icono: Scissors },
  { nombre: 'Sudaderas',  icono: Shirt },
  { nombre: 'Chamarras',  icono: Package },
  { nombre: 'Abrigos',    icono: Package },
  { nombre: 'Suéteres',   icono: Shirt },
  { nombre: 'Shorts',     icono: Scissors },
  { nombre: 'Accesorios', icono: Star },
  { nombre: 'Calzado',    icono: Footprints },
  { nombre: 'Bolsos',     icono: ShoppingBag },
  { nombre: 'Otro',       icono: Crown },
];

// ─── DATA: Subcategorías editoriales ÉP ─────────────────
const SUBCATEGORIAS_EP = [
  'Casual', 'Formal', 'Deportivo', 'Fiesta',
  'Oficina', 'Playa', 'Invierno', 'Verano', 'Otro'
];

export default function CatalogosEshePage() {
  const router = useRouter();
  const { categoria, subcategoria, page = 1, sort = 'newest' } = router.query;

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

  // ─── Catálogos = todas las categorías + "todos" + "nuevos" ─
  const listaCatalogos = useMemo(() => {
    return [
      { id: 'todos', nombre: 'Todas', descripcion: 'La colección completa' },
      { id: 'nuevos', nombre: 'Nuevas', descripcion: 'Últimos 30 días' },
      ...CATEGORIAS_EP.map((c) => ({
        id: generarSlug(c.nombre),
        nombre: c.nombre,
        icono: c.icono,
        descripcion: `${c.nombre} de la maison`,
        categoriaExacta: c.nombre,
      })),
    ];
  }, []);

  // ─── Catálogo actual ─────────────────────────────────────
  const catalogoActual = useMemo(() => {
    return listaCatalogos.find((c) => c.id === catalogoSeleccionado) || listaCatalogos[0];
  }, [listaCatalogos, catalogoSeleccionado]);

  // ============================================================
  // 1. CARGAR CONTADORES
  // ============================================================
  useEffect(() => {
    const cargarContadores = async () => {
      try {
        setLoadingCounts(true);
        const counts = {};

        // Total
        const total = await pb.collection('eshe_parallel').getList(1, 1, {
          filter: 'activo = true',
          fields: 'id',
        });
        counts['todos'] = total.totalItems;

        // Nuevos (últimos 30 días)
        const hace30 = new Date();
        hace30.setDate(hace30.getDate() - 30);
        const nuevos = await pb.collection('eshe_parallel').getList(1, 1, {
          filter: `activo = true && created >= "${hace30.toISOString()}"`,
          fields: 'id',
        });
        counts['nuevos'] = nuevos.totalItems;

        // Por categoría
        for (const cat of listaCatalogos) {
          if (cat.id === 'todos' || cat.id === 'nuevos') continue;
          const nombreCategoria = cat.categoriaExacta || cat.nombre;
          const result = await pb.collection('eshe_parallel').getList(1, 1, {
            filter: `activo = true && categoria = "${nombreCategoria}"`,
            fields: 'id',
          });
          counts[cat.id] = result.totalItems;
        }

        setProductCounts(counts);
      } catch (err) {
        console.error('Error cargando contadores:', err);
      } finally {
        setLoadingCounts(false);
      }
    };

    cargarContadores();
  }, [listaCatalogos]);

  // ============================================================
  // 2. CARGAR PRODUCTOS
  // ============================================================
  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let filter = 'activo = true';

      if (catalogoSeleccionado !== 'todos' && catalogoSeleccionado !== 'nuevos') {
        const nombreCategoria = catalogoActual?.categoriaExacta || catalogoActual?.nombre;
        if (nombreCategoria) {
          filter += ` && categoria = "${nombreCategoria}"`;
        }
        if (subcategoriaSeleccionada) {
          filter += ` && subcategoria = "${subcategoriaSeleccionada}"`;
        }
      }

      if (catalogoSeleccionado === 'nuevos') {
        const hace30 = new Date();
        hace30.setDate(hace30.getDate() - 30);
        filter += ` && created >= "${hace30.toISOString()}"`;
      }

      // Ordenamiento
      let sortField = '-created';
      if (sortBy === 'price_asc') sortField = 'precio';
      else if (sortBy === 'price_desc') sortField = '-precio';
      else if (sortBy === 'newest') sortField = '-created';
      else if (sortBy === 'popular') sortField = '-calificacion,-visitas';

      const result = await pb.collection('eshe_parallel').getList(currentPage, itemsPerPage, {
        filter,
        sort: sortField,
      });

      setProductos(result.items);
      setTotalProducts(result.totalItems);
    } catch (err) {
      console.error('Error cargando piezas:', err);
      setError('No pudimos cargar las piezas. Intenta de nuevo.');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, [catalogoSeleccionado, subcategoriaSeleccionada, currentPage, sortBy, catalogoActual]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // ============================================================
  // 3. HANDLERS
  // ============================================================
  const handleSelectCatalogo = (id) => {
    setCatalogoSeleccionado(id);
    setSubcategoriaSeleccionada('');
    setCurrentPage(1);
    router.push(
      `/catalogos?categoria=${id}`,
      undefined,
      { shallow: true }
    );
  };

  const handleSelectSubcategoria = (sub) => {
    const nuevo = subcategoriaSeleccionada === sub ? '' : sub;
    setSubcategoriaSeleccionada(nuevo);
    setCurrentPage(1);
    router.push(
      `/catalogos?categoria=${catalogoSeleccionado}${nuevo ? `&subcategoria=${encodeURIComponent(nuevo)}` : ''}`,
      undefined,
      { shallow: true }
    );
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(
      `/catalogos?categoria=${catalogoSeleccionado}${subcategoriaSeleccionada ? `&subcategoria=${encodeURIComponent(subcategoriaSeleccionada)}` : ''}&page=${newPage}&sort=${sortBy}`,
      undefined,
      { shallow: true }
    );
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    setCurrentPage(1);
    router.push(
      `/catalogos?categoria=${catalogoSeleccionado}${subcategoriaSeleccionada ? `&subcategoria=${encodeURIComponent(subcategoriaSeleccionada)}` : ''}&page=1&sort=${value}`,
      undefined,
      { shallow: true }
    );
  };

  // ============================================================
  // 4. HELPERS
  // ============================================================
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const getImageUrl = (pieza) => {
    if (!pieza.imagen) return null;
    try {
      const img = Array.isArray(pieza.imagen) ? pieza.imagen[0] : pieza.imagen;
      if (!img) return null;
      return pb.files.getURL(pieza, img);
    } catch (e) {
      return null;
    }
  };

  // ─── Loading editorial ───────────────────────────────────
  if (loading && currentPage === 1 && !error) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Head>
          <title>Catálogos | ÉSHÉ PARALLEL</title>
        </Head>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border border-white/20 border-t-gold rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">Cargando colecciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <Head>
        <title>Catálogos | ÉSHÉ PARALLEL</title>
        <meta
          name="description"
          content="Explora todas las categorías de ÉSHÉ PARALLEL. Piezas seleccionadas, ediciones controladas."
        />
      </Head>

      {/* Botón flotante volver */}
      <Link
        href="/eshe-parallel"
        className="fixed top-6 left-6 z-50 p-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-gold/50 transition-all group"
        aria-label="Volver a ÉSHÉ Parallel"
      >
        <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-gold transition-colors" />
      </Link>

      {/* Marca flotante */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-2">
        <span className="text-base font-light tracking-[0.1em] text-white">ÉP</span>
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 hidden sm:inline">
          Éshé Parallel
        </span>
      </div>

      <main className="flex-1">

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO EDITORIAL                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="relative border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_4775d5bbe9_8498d31e5d11f368.png"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 pt-28 sm:pt-32 pb-20 sm:pb-24">
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.4em] text-gold">
                  ÉSHÉ PARALLEL
                </span>
                <div className="h-[1px] w-16 bg-white/20" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                  Catálogos
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl font-black uppercase leading-[0.95] tracking-tighter italic text-white">
                Todas las<br />Colecciones
              </h1>

              <p className="text-lg sm:text-xl font-serif italic text-white/70 max-w-xl leading-relaxed">
                Explora cada categoría de la maison. Piezas seleccionadas, ediciones controladas.
              </p>

              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 pt-4">
                {productCounts.todos || 0} {(productCounts.todos || 0) === 1 ? 'pieza en total' : 'piezas en total'}
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SELECTOR STICKY DE CATEGORÍAS                        */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-b border-white/10 sticky top-0 z-40 bg-black/90 backdrop-blur-md">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-5 overflow-x-auto">
            <div className="flex gap-8 min-w-max">
              {listaCatalogos.map((cat) => {
                const isActive = catalogoSeleccionado === cat.id;
                const count = productCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCatalogo(cat.id)}
                    className={`text-[10px] uppercase tracking-[0.3em] font-medium transition-all whitespace-nowrap pb-1 border-b ${
                      isActive
                        ? 'text-gold border-gold'
                        : 'text-white/40 border-transparent hover:text-white/80'
                    }`}
                  >
                    {cat.nombre}
                    {!loadingCounts && count > 0 && (
                      <span className="ml-1.5 text-[8px] opacity-60">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BANNER DEL CATÁLOGO ACTIVO                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-10">
            <div className="flex flex-wrap items-center justify-between gap-6 border border-gold/30 bg-gradient-to-r from-gold/5 to-transparent p-6 sm:p-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 border border-gold/40 flex items-center justify-center shrink-0">
                  {catalogoActual?.icono ? (
                    <catalogoActual.icono className="w-6 h-6 text-gold" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-gold" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-gold mb-1">
                    Colección Activa
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                    {catalogoActual?.nombre || 'Todas'}
                  </h2>
                  <p className="text-xs font-serif italic text-white/50 mt-1">
                    {catalogoActual?.descripcion}
                    {subcategoriaSeleccionada && ` · ${subcategoriaSeleccionada}`}
                  </p>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                {totalProducts} {totalProducts === 1 ? 'pieza' : 'piezas'}
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* GRID DE CATEGORÍAS (solo cuando estamos en "todos")*/}
        {/* ═══════════════════════════════════════════════════ */}
        {catalogoSeleccionado === 'todos' && (
          <section className="border-b border-white/10">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                  Categorías
                </span>
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                  {CATEGORIAS_EP.length} categorías
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CATEGORIAS_EP.map((cat) => {
                  const slug = generarSlug(cat.nombre);
                  const count = productCounts[slug] || 0;
                  const IconComponent = cat.icono;
                  return (
                    <button
                      key={cat.nombre}
                      onClick={() => handleSelectCatalogo(slug)}
                      className="group text-left p-5 bg-[#0f0f0f] border border-white/10 hover:border-gold/50 hover:bg-gold/5 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 border border-white/20 flex items-center justify-center group-hover:border-gold/50 transition-colors">
                          <IconComponent className="w-4 h-4 text-white/60 group-hover:text-gold transition-colors" />
                        </div>
                        {!loadingCounts && (
                          <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-gold transition-colors">
                            {count}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white group-hover:text-gold transition-colors">
                        {cat.nombre}
                      </h3>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SUBCATEGORÍAS (solo cuando hay categoría activa)     */}
        {/* ═══════════════════════════════════════════════════ */}
        {catalogoSeleccionado !== 'todos' && catalogoSeleccionado !== 'nuevos' && (
          <section className="border-b border-white/10">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Filtrar por estilo
                </span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectSubcategoria('')}
                  className={`text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all ${
                    !subcategoriaSeleccionada
                      ? 'border-gold text-gold bg-gold/5'
                      : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                  }`}
                >
                  Todas
                </button>
                {SUBCATEGORIAS_EP.map((sub) => {
                  const isActive = subcategoriaSeleccionada === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => handleSelectSubcategoria(sub)}
                      className={`text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all ${
                        isActive
                          ? 'border-gold text-gold bg-gold/5'
                          : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* BARRA DE ORDENAMIENTO                                */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                {loading
                  ? 'Cargando...'
                  : `${totalProducts} ${totalProducts === 1 ? 'pieza' : 'piezas'}`}
              </span>

              <div className="flex items-center gap-3">
                <Filter className="w-3 h-3 text-white/40" />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="bg-transparent border border-white/15 text-white/80 text-[10px] uppercase tracking-[0.2em] px-3 py-2 focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
                >
                  <option value="newest" className="bg-black">Más recientes</option>
                  <option value="price_asc" className="bg-black">Precio ↑</option>
                  <option value="price_desc" className="bg-black">Precio ↓</option>
                  <option value="popular" className="bg-black">Populares</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* GRID DE PIEZAS                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="bg-black">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16">

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border border-white/20 border-t-gold rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-20 border border-red-500/30 bg-red-500/5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => cargarProductos()}
                  className="text-[10px] uppercase tracking-[0.3em] text-gold hover:text-white transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-24 border border-white/10 bg-[#0a0a0a]">
                <div className="w-16 h-16 border border-white/20 flex items-center justify-center mx-auto mb-6">
                  <Inbox className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3">
                  Archivo
                </p>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
                  Sin piezas en esta categoría
                </h3>
                <p className="text-sm font-serif italic text-white/50 mb-8 max-w-md mx-auto">
                  Pronto llegarán nuevas piezas.
                </p>
                <button
                  onClick={() => handleSelectCatalogo('todos')}
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold hover:text-white transition-colors"
                >
                  Ver todas las piezas <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                  {productos.map((pieza) => {
                    const esNuevo = pieza.nuevo;
                    const esEdicionLimitada = pieza.edicionLimitada;

                    return (
                      <Link
                        key={pieza.id}
                        href={`/eshe-parallel/${pieza.id}`}
                        className="group cursor-pointer space-y-4 block"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#0f0f0f] border border-white/10">
                          {pieza.imagen ? (
                            <img
                              src={getImageUrl(pieza)}
                              alt={pieza.nombre || 'Pieza'}
                              className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-white/20" />
                            </div>
                          )}

                          {(esNuevo || esEdicionLimitada) && (
                            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                              {esNuevo && (
                                <span className="text-[8px] uppercase tracking-[0.2em] bg-gold text-black px-2 py-1 font-bold">
                                  Nuevo
                                </span>
                              )}
                              {esEdicionLimitada && !esNuevo && (
                                <span className="text-[8px] uppercase tracking-[0.2em] bg-black border border-gold text-gold px-2 py-1 font-bold">
                                  Edición Limitada
                                </span>
                              )}
                            </div>
                          )}

                          {pieza.sku && (
                            <span className="absolute top-3 right-3 text-[8px] uppercase tracking-[0.2em] text-white/60">
                              {pieza.sku}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-gold">
                              ÉP
                            </span>
                            <div className="h-[1px] flex-1 bg-white/10" />
                            {pieza.coleccion && (
                              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 truncate">
                                {pieza.coleccion}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold uppercase tracking-wide text-white group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                            {pieza.nombre || 'Sin nombre'}
                          </h3>

                          <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                            {pieza.categoria || 'General'}
                            {pieza.subcategoria && ` · ${pieza.subcategoria}`}
                          </p>

                          <div className="flex items-end justify-between pt-2 border-t border-white/10">
                            <div>
                              <p className="text-base font-black text-white">
                                {formatMoney(pieza.precio)}
                              </p>
                              {pieza.precioAnterior && pieza.precioAnterior > pieza.precio && (
                                <p className="text-[10px] text-white/30 line-through">
                                  {formatMoney(pieza.precioAnterior)}
                                </p>
                              )}
                            </div>
                            {pieza.stock !== undefined && (
                              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                                {pieza.stock} {pieza.stock === 1 ? 'pza' : 'pzas'}
                              </span>
                            )}
                          </div>

                          <button className="text-[9px] uppercase tracking-[0.3em] font-bold flex items-center gap-2 text-white/60 hover:text-gold transition-colors pt-1">
                            Descubrir
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-16">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-[10px] uppercase tracking-[0.3em] px-5 py-3 border border-white/15 text-white/60 disabled:opacity-30 hover:border-gold hover:text-gold transition-all"
                    >
                      <ChevronLeft className="w-3 h-3 inline mr-1" /> Anterior
                    </button>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 px-4">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-[10px] uppercase tracking-[0.3em] px-5 py-3 border border-white/15 text-white/60 disabled:opacity-30 hover:border-gold hover:text-gold transition-all"
                    >
                      Siguiente <ChevronRight className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* NEWSLETTER ÉP                                        */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-t border-white/10 bg-[#0a0a0a]">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="h-[1px] w-16 bg-white/20" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-gold">
                  The Parallel List
                </span>
                <div className="h-[1px] w-16 bg-white/20" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic text-white">
                Acceso anticipado
              </h2>

              <p className="text-sm font-serif italic text-white/60 max-w-lg mx-auto">
                Recibe nuestras ediciones limitadas antes que nadie. Piezas numeradas, historias únicas.
              </p>

              <div className="flex max-w-md mx-auto gap-2 mt-8">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  className="flex-1 bg-transparent border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
                />
                <button className="bg-gold text-black px-6 py-3 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white transition-colors">
                  Suscribir
                </button>
              </div>

              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 pt-2">
                Una pieza. Pocas veces.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FOOTER EDITORIAL                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <footer className="border-t border-white/10 bg-black">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="col-span-1">
                <div className="space-y-4">
                  <span className="text-4xl font-light tracking-[0.1em] text-white">ÉP</span>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                    ÉSHÉ PARALLEL
                  </p>
                  <p className="text-xs font-serif italic text-white/50 leading-relaxed pt-2">
                    Una pieza. Pocas veces.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white mb-5">
                  Colección
                </h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Temporada actual', href: '/temporada' },
                    { label: 'Todas las piezas', href: '/eshe-parallel' },
                    { label: 'Catálogos', href: '/catalogos' },
                    { label: 'Ediciones limitadas', href: '/temporada?tipo=ediciones' },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs uppercase tracking-[0.15em] text-white/50 hover:text-gold transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white mb-5">
                  Maison
                </h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Ayuda', href: '/ayuda' },
                    { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
                    { label: 'Términos', href: '/terminos' },
                    { label: 'Privacidad', href: '/privacidad' },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs uppercase tracking-[0.15em] text-white/50 hover:text-gold transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white mb-5">
                  Contacto
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Phone className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50">28 2141 4939</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50">marketdesliz@gmail.com</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50">Ciudad de México</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                  © {new Date().getFullYear()} ÉSHÉ PARALLEL · MarketDesliz
                </p>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
                  Desliza · Descubre · Conecta
                </p>
              </div>
            </div>
          </div>
        </footer>

      </main>

      {/* Line-clamp helpers */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}