// src/pages/bolsa-trabajo/index.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Briefcase, Plus, LogIn, LayoutGrid, Building2,
  Search, DollarSign, MapPin, Clock, Phone, Mail,
  Inbox, ChevronRight, ChevronLeft, Home, Filter,
  X
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const ITEMS_PER_PAGE = 12;

// ─── Categorías disponibles (desde la colección) ──────────────────────────
const CATEGORIAS_BOLSA = [
  'ventas', 'atencion_cliente', 'administracion', 'tecnologia',
  'oficios', 'construccion', 'limpieza', 'cocina',
  'chofer', 'repartidor', 'informal', 'otro'
];

const getNombreCategoria = (cat) => {
  const map = {
    ventas: 'Ventas',
    atencion_cliente: 'Atención al cliente',
    administracion: 'Administración',
    tecnologia: 'Tecnología',
    oficios: 'Oficios',
    construccion: 'Construcción',
    limpieza: 'Limpieza',
    cocina: 'Cocina',
    chofer: 'Chofer',
    repartidor: 'Repartidor',
    informal: 'Informal',
    otro: 'Otro'
  };
  return map[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function BolsaTrabajoPage() {
  const router = useRouter();
  const { tipo = 'todos', categoria = '', q = '', page = '1', sort = 'newest' } = router.query;

  const [ofertas, setOfertas] = useState([]);
  const [totalOfertas, setTotalOfertas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(tipo);
  const [filtroCategoria, setFiltroCategoria] = useState(categoria);
  const [busqueda, setBusqueda] = useState(q);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [sortBy, setSortBy] = useState(sort);
  const [totalPages, setTotalPages] = useState(0);

  // Contadores de ofertas por tipo y categoría
  const [counts, setCounts] = useState({ tipos: {}, categorias: {} });

  // ─── Obtener usuario ──────────────────────────────────────────────────────
  useEffect(() => {
    setUser(pb.authStore.model);
  }, []);

  // ─── Cargar contadores ──────────────────────────────────────────────────
  useEffect(() => {
    const cargarContadores = async () => {
      try {
        // Contar por tipo
        const tipos = ['busco_trabajo', 'ofrezco_trabajo'];
        const tipoCounts = {};
        for (const t of tipos) {
          const result = await pb.collection('bolsa_trabajo').getList(1, 1, {
            filter: `estado = "aprobado" && activo = true && tipo = "${t}"`,
            fields: 'id'
          });
          tipoCounts[t] = result.totalItems;
        }
        tipoCounts['todos'] = Object.values(tipoCounts).reduce((a, b) => a + b, 0);

        // Contar por categoría
        const catCounts = {};
        for (const cat of CATEGORIAS_BOLSA) {
          const result = await pb.collection('bolsa_trabajo').getList(1, 1, {
            filter: `estado = "aprobado" && activo = true && categoria = "${cat}"`,
            fields: 'id'
          });
          catCounts[cat] = result.totalItems;
        }

        setCounts({ tipos: tipoCounts, categorias: catCounts });
      } catch (err) {
        console.error('Error cargando contadores:', err);
      }
    };
    cargarContadores();
  }, []);

  // ─── Cargar ofertas (con paginación y filtros) ──────────────────────────
  const cargarOfertas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let filter = 'estado = "aprobado" && activo = true';

      // Filtro por tipo
      if (filtroTipo !== 'todos') {
        filter += ` && tipo = "${filtroTipo}"`;
      }

      // Filtro por categoría
      if (filtroCategoria) {
        filter += ` && categoria = "${filtroCategoria}"`;
      }

      // Búsqueda por texto
      if (busqueda.trim()) {
        const term = busqueda.trim();
        filter += ` && (titulo ~ "${term}" || descripcion ~ "${term}")`;
      }

      // Ordenamiento
      let sortField = '-created';
      if (sortBy === 'newest') sortField = '-created';
      else if (sortBy === 'oldest') sortField = 'created';
      else if (sortBy === 'title') sortField = 'titulo';
      else if (sortBy === 'salary') sortField = 'salario';

      const result = await pb.collection('bolsa_trabajo').getList(currentPage, ITEMS_PER_PAGE, {
        filter,
        sort: sortField,
        expand: 'userId'
      });

      setOfertas(result.items);
      setTotalOfertas(result.totalItems);
      setTotalPages(Math.ceil(result.totalItems / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error cargando ofertas:', err);
      setError('No pudimos cargar las ofertas. Intenta de nuevo.');
      setOfertas([]);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroCategoria, busqueda, currentPage, sortBy]);

  // Recargar cuando cambian los filtros
  useEffect(() => {
    cargarOfertas();
  }, [cargarOfertas]);

  // ─── Actualizar URL con filtros ────────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      tipo: filtroTipo,
      categoria: filtroCategoria || '',
      q: busqueda || '',
      page: currentPage,
      sort: sortBy,
      ...params
    };
    // Eliminar parámetros vacíos
    Object.keys(query).forEach(key => {
      if (!query[key] || query[key] === 'todos') delete query[key];
    });
    router.push({ pathname: '/bolsa-trabajo', query }, undefined, { shallow: true });
  }, [filtroTipo, filtroCategoria, busqueda, currentPage, sortBy, router]);

  // ─── Manejadores de eventos ──────────────────────────────────────────────
  const handleFiltroTipo = (tipo) => {
    setFiltroTipo(tipo);
    setCurrentPage(1);
    actualizarURL({ tipo, page: 1 });
  };

  const handleFiltroCategoria = (cat) => {
    setFiltroCategoria(cat);
    setCurrentPage(1);
    actualizarURL({ categoria: cat, page: 1 });
  };

  const handleBusqueda = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    actualizarURL({ q: busqueda, page: 1 });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
    actualizarURL({ sort: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    actualizarURL({ page: newPage });
  };

  const limpiarFiltros = () => {
    setFiltroTipo('todos');
    setFiltroCategoria('');
    setBusqueda('');
    setSortBy('newest');
    setCurrentPage(1);
    router.push('/bolsa-trabajo', undefined, { shallow: true });
  };

  // ─── Ofertas filtradas (ya están en estado) ──────────────────────────────
  const ofertasFiltradas = ofertas;

  // ─── Renderizado ──────────────────────────────────────────────────────────
  if (loading && currentPage === 1 && !error) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Bolsa de Trabajo | MarketDesliz</title>
        <meta
          name="description"
          content="Encuentra trabajo u ofrece empleo en tu comunidad. Publica tu oferta laboral de forma gratuita."
        />
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-36 pb-10">

          {/* ── Breadcrumb ─────────────────────────────────────────── */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap mb-5">
            <Link href="/" className="flex items-center gap-1 hover:text-[#6C3BFF] transition-colors">
              <Home size={12} /> Inicio
            </Link>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-gray-600 font-medium">Bolsa de Trabajo</span>
          </nav>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bolsa de Trabajo</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Encuentra trabajo u ofrece empleo en tu comunidad
            </p>
          </div>

          {/* ── Acciones ───────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Link
              href="/bolsa-trabajo/publicar"
              className="flex items-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <Plus size={16} /> Publicar oferta
            </Link>
            {!user && (
              <Link
                href="/solicitar?redirect=/bolsa-trabajo"
                className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF] px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <LogIn size={16} /> Iniciar sesión para publicar
              </Link>
            )}
          </div>

          {/* ── Búsqueda ───────────────────────────────────────────── */}
          <form onSubmit={handleBusqueda} className="flex gap-2 mb-6 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar ofertas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] bg-white transition"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-[#6C3BFF] text-white rounded-xl text-sm font-semibold hover:bg-[#5b2ee6] transition">
              Buscar
            </button>
            {busqueda && (
              <button
                type="button"
                onClick={() => { setBusqueda(''); actualizarURL({ q: '', page: 1 }); }}
                className="px-3 py-2.5 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* ── Filtros por tipo ────────────────────────────────────── */}
          <div className="flex gap-2 mb-5 flex-wrap justify-center">
            {[
              { id: 'todos', label: 'Todos', icon: LayoutGrid },
              { id: 'ofrezco_trabajo', label: 'Ofrezco trabajo', icon: Building2 },
              { id: 'busco_trabajo', label: 'Busco trabajo', icon: Search }
            ].map(({ id, label, icon: Icon }) => {
              const count = counts.tipos[id] || 0;
              return (
                <button
                  key={id}
                  onClick={() => handleFiltroTipo(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filtroTipo === id
                      ? 'bg-[#6C3BFF] text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                  }`}
                >
                  <Icon size={14} /> {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    filtroTipo === id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Filtros por categoría ─────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-5">
            <button
              onClick={() => handleFiltroCategoria('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                !filtroCategoria
                  ? 'bg-[#6C3BFF] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas las categorías
            </button>
            {CATEGORIAS_BOLSA.map(cat => {
              const count = counts.categorias[cat] || 0;
              // No mostrar categorías sin ofertas (opcional)
              return (
                <button
                  key={cat}
                  onClick={() => handleFiltroCategoria(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    filtroCategoria === cat
                      ? 'bg-[#6C3BFF] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getNombreCategoria(cat)}
                  <span className="ml-1 text-[10px] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* ── Limpiar filtros ─────────────────────────────────────── */}
          {(filtroTipo !== 'todos' || filtroCategoria || busqueda) && (
            <div className="text-center mb-5">
              <button
                onClick={limpiarFiltros}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}

          {/* ── Contador y ordenamiento ────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <span className="text-xs text-gray-400">
              {loading ? 'Cargando...' : `${totalOfertas} ${totalOfertas === 1 ? 'oferta' : 'ofertas'} encontradas`}
            </span>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguas</option>
                <option value="title">Por título</option>
                <option value="salary">Por salario</option>
              </select>
            </div>
          </div>

          {/* ── Lista de ofertas ────────────────────────────────────── */}
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={cargarOfertas}
                className="mt-3 text-sm text-[#6C3BFF] font-medium hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : ofertasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <Inbox size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay ofertas disponibles</h3>
              <p className="text-sm text-gray-400 mb-4">
                {busqueda ? 'Intenta con otra palabra clave' : 'Sé el primero en publicar'}
              </p>
              {!busqueda && (
                <Link
                  href="/bolsa-trabajo/publicar"
                  className="inline-flex items-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  <Plus size={16} /> Publicar oferta
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ofertasFiltradas.map((oferta) => {
                  const esOferta = oferta.tipo === 'ofrezco_trabajo';
                  return (
                    <div
                      key={oferta.id}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {/* Tira de color */}
                      <div className={`h-1.5 w-full ${esOferta ? 'bg-[#6C3BFF]' : 'bg-[#10b981]'}`} />

                      <div className="p-5">
                        {/* Badge + fecha */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            esOferta
                              ? 'bg-[#6C3BFF]/8 text-[#6C3BFF]'
                              : 'bg-[#10b981]/10 text-[#10b981]'
                          }`}>
                            {esOferta ? <Building2 size={11} /> : <Search size={11} />}
                            {esOferta ? 'Ofrezco trabajo' : 'Busco trabajo'}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(oferta.created)}</span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{oferta.titulo}</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                          {getNombreCategoria(oferta.categoria)}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed">{oferta.descripcion}</p>

                        {/* Detalles */}
                        <div className="space-y-1.5 mb-4">
                          {oferta.salario && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign size={13} className="text-[#10b981] shrink-0" />
                              <span className="font-semibold text-[#10b981]">{oferta.salario}</span>
                            </div>
                          )}
                          {oferta.ubicacion && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin size={13} className="text-gray-400 shrink-0" />
                              {oferta.ubicacion}
                            </div>
                          )}
                          {oferta.horario && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock size={13} className="text-gray-400 shrink-0" />
                              {oferta.horario}
                            </div>
                          )}
                        </div>

                        {/* Contacto */}
                        <div className="pt-4 border-t border-gray-50 space-y-1.5">
                          {oferta.telefono && (
                            <a
                              href={`tel:${oferta.telefono}`}
                              className="flex items-center gap-2 text-sm text-[#6C3BFF] hover:underline"
                            >
                              <Phone size={13} /> {oferta.telefono}
                            </a>
                          )}
                          {oferta.email && (
                            <a
                              href={`mailto:${oferta.email}`}
                              className="flex items-center gap-2 text-sm text-[#6C3BFF] hover:underline"
                            >
                              <Mail size={13} /> {oferta.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Paginación ────────────────────────────────────── */}
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