// src/pages/admin/vendedores/ventas/[id].js - OPTIMIZADO
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  Calendar,
  User,
  Phone,
  Eye,
  Download,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '../../../../layouts/AdminLayout';
import {
  getVentasVendedorPaginated,
  getEstadisticasVentasVendedor
} from '../../../../lib/vendedorService';
import { formatMoney, formatDate } from '../../../../lib/utils';
import pb from '../../../../lib/pocketbase';

const ITEMS_PER_PAGE = 10;

export default function VentasVendedorPage() {
  const router = useRouter();
  const { id } = router.query;

  // ─── Parámetros de URL ──────────────────────────────────────────────
  const { page = 1, search = '', estado = 'todos', sort = '-created' } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendedor, setVendedor] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    completadas: 0,
    pendientes: 0,
    totalEnganches: 0,
    comisionTotal: 0,
    comisionPorcentaje: 0
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Filtros sincronizados con URL ──────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [filterEstado, setFilterEstado] = useState(estado || 'todos');
  const [sortBy, setSortBy] = useState(sort || '-created');

  // ─── Cargar datos ─────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError('');
      setSuccess('');

      // Verificar autenticación
      if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }

      // Obtener vendedor (solo en carga inicial)
      if (!showRefreshing && !vendedor) {
        const vendedorData = await pb.collection('vendedores').getOne(id, {
          expand: 'userId'
        });
        setVendedor({
          ...vendedorData,
          nombre: vendedorData.expand?.userId?.nombre || 'Sin nombre',
          email: vendedorData.expand?.userId?.email || 'Sin email',
          telefono: vendedorData.expand?.userId?.telefono || 'Sin teléfono'
        });
      }

      // Estadísticas (solo en carga inicial)
      if (!showRefreshing) {
        const stats = await getEstadisticasVentasVendedor(id);
        setEstadisticas(stats);
      }

      // Ventas paginadas
      const result = await getVentasVendedorPaginated({
        vendedorId: id,
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        estado: filterEstado,
        sort: sortBy
      });

      setVentas(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error cargando ventas:', err);
      setError('No se pudieron cargar las ventas. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, currentPage, searchTerm, filterEstado, sortBy, vendedor, router]);

  // ─── Efecto de carga ──────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id, cargarDatos]);

  // ─── Actualizar URL con filtros ──────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      search: searchTerm || undefined,
      estado: filterEstado !== 'todos' ? filterEstado : undefined,
      sort: sortBy !== '-created' ? sortBy : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: `/admin/vendedores/ventas/${id}`, query }, undefined, { shallow: true });
  }, [id, currentPage, searchTerm, filterEstado, sortBy, router]);

  // ─── Manejadores de filtros ──────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    setSearchTerm(term);
    actualizarURL({ search: term, page: 1 });
  };

  const handleEstadoChange = (value) => {
    setFilterEstado(value);
    actualizarURL({ estado: value, page: 1 });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    actualizarURL({ sort: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    actualizarURL({ page: newPage });
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error && !vendedor) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">Vendedor no encontrado</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <Link href="/admin/vendedores" className="text-[#6C3BFF] text-sm hover:underline">
              Volver a vendedores
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Ventas de {vendedor?.nombre || 'Vendedor'} | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-6xl mx-auto">

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <Link
                href={`/admin/vendedores/${id}`}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition"
              >
                <ArrowLeft size={14} /> Volver al vendedor
              </Link>
              <button
                onClick={() => cargarDatos(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            <div className="mt-2">
              <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
              <p className="text-sm text-gray-500">
                {vendedor?.nombre} · Código: <code className="font-mono">{vendedor?.codigo}</code>
              </p>
            </div>
          </div>

          {/* ─── Mensajes ───────────────────────────────────────────────── */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2 text-green-700">
              <CheckCircle size={18} className="shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-sm font-medium hover:underline"
              >
                Descartar
              </button>
            </div>
          )}

          {/* ─── Tarjetas de estadísticas ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalVentas}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={18} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.completadas}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{estadisticas.pendientes}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Comisión total</p>
                  <p className="text-xl font-bold text-green-600">{formatMoney(estadisticas.comisionTotal)}</p>
                  <p className="text-xs text-gray-400">({estadisticas.comisionPorcentaje}%)</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Filtros y búsqueda ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEstadoChange('todos')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterEstado === 'todos'
                        ? 'bg-[#6C3BFF] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => handleEstadoChange('completadas')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterEstado === 'completadas'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Completadas
                  </button>
                  <button
                    onClick={() => handleEstadoChange('pendientes')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterEstado === 'pendientes'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pendientes
                  </button>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <form onSubmit={handleSearchSubmit} className="relative flex-1 md:flex-initial">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="search"
                      defaultValue={searchTerm}
                      placeholder="Buscar cliente o producto..."
                      className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF]"
                    />
                  </form>
                  <select
                    className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="-created">Más recientes</option>
                    <option value="created">Más antiguas</option>
                    <option value="enganche">Por monto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Resumen filtrado */}
            <div className="px-4 py-3 bg-gray-50 rounded-b-2xl flex justify-between text-sm">
              <span className="text-gray-500">
                Mostrando <strong className="text-gray-700">{ventas.length}</strong> de <strong className="text-gray-700">{totalItems}</strong> ventas
              </span>
              <span className="text-gray-500">
                Comisión total: <strong className="text-green-600">{formatMoney(estadisticas.comisionTotal)}</strong>
              </span>
            </div>
          </div>

          {/* ─── Tabla de ventas ────────────────────────────────────────── */}
          {ventas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <ShoppingBag size={32} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay ventas registradas</h3>
              <p className="text-sm text-gray-400">
                {searchTerm || filterEstado !== 'todos'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Este vendedor aún no tiene ventas'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enganche</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comisión</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ventas.map((venta) => {
                        const comision = Math.round((venta.enganche || 0) * (estadisticas.comisionPorcentaje / 100));
                        return (
                          <tr key={venta.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                              {formatDate(venta.fecha)}
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">{venta.cliente}</p>
                                <p className="text-xs text-gray-400">{venta.clienteTelefono}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-700">{venta.producto}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-semibold text-gray-900">{formatMoney(venta.enganche)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-semibold text-green-600">{formatMoney(comision)}</span>
                              <span className="text-xs text-gray-400 block">({estadisticas.comisionPorcentaje}%)</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                venta.estado === 'completada'
                                  ? 'bg-green-100 text-green-700'
                                  : venta.estado === 'vendedor_validado'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}>
                                {venta.estado === 'completada' ? '✅ Completada' :
                                 venta.estado === 'vendedor_validado' ? '⏳ Validada' : '📋 Pendiente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Link
                                href={`/admin/solicitudes/${venta.id}`}
                                className="text-[#6C3BFF] hover:text-[#5a2ee6] transition"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ─── Paginación ────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Mostrando {ventas.length} de {totalItems} ventas
                  </span>
                  <div className="flex items-center gap-2">
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
                </div>
              )}
            </>
          )}

          {/* ─── Footer informativo ────────────────────────────────────── */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Resumen de comisiones</p>
                <p className="text-sm text-blue-600">
                  Las comisiones se calculan como el <strong>{estadisticas.comisionPorcentaje}%</strong> del enganche de cada venta.
                  Las comisiones pendientes se pagan al vendedor según el esquema acordado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}