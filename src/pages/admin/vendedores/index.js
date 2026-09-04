// src/pages/admin/vendedores/index.js - OPTIMIZADO
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Code,
  Eye,
  AlertCircle,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import { getVendedoresPaginated, getVendedoresStats } from '../../../lib/vendedorService';
import pb from '../../../lib/pocketbase';

const ITEMS_PER_PAGE = 10;

export default function AdminVendedoresPage() {
  const router = useRouter();

  // ─── Parámetros de URL ──────────────────────────────────────────────
  const { page = 1, search = '', estado = 'todos', sort = '-created' } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Filtros sincronizados con URL ──────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [filterEstado, setFilterEstado] = useState(estado || 'todos');
  const [sortBy, setSortBy] = useState(sort || '-created');

  // ─── Estadísticas ────────────────────────────────────────────────────
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    comisionPromedio: 0
  });

  // ─── Verificar admin ─────────────────────────────────────────────────
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        if (!pb.authStore.isValid) {
          router.push('/admin/login');
          return;
        }
        const user = pb.authStore.model;
        if (user?.role !== 'admin') {
          pb.authStore.clear();
          router.push('/admin/login');
          return;
        }
      } catch (error) {
        console.error('Error en verificación:', error);
        router.push('/admin/login');
      }
    };
    verificarAdmin();
  }, []);

  // ─── Cargar datos ─────────────────────────────────────────────────────
  const cargarVendedores = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess('');

      // Estadísticas (solo en carga inicial)
      if (!showRefreshing) {
        const stats = await getVendedoresStats();
        setEstadisticas(stats);
      }

      // Vendedores paginados
      const result = await getVendedoresPaginated({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        estado: filterEstado,
        sort: sortBy
      });

      setVendedores(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error cargando vendedores:', err);
      setError('No se pudieron cargar los vendedores. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filterEstado, sortBy]);

  // ─── Efecto de carga ──────────────────────────────────────────────────
  useEffect(() => {
    cargarVendedores();
  }, [cargarVendedores]);

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
    router.push({ pathname: '/admin/vendedores', query }, undefined, { shallow: true });
  }, [currentPage, searchTerm, filterEstado, sortBy, router]);

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

  // ─── Acciones ─────────────────────────────────────────────────────────
  const toggleActivo = async (vendedorId, activo) => {
    try {
      await pb.collection('vendedores').update(vendedorId, {
        activo: !activo
      });
      setSuccess('✅ Estado actualizado correctamente');
      cargarVendedores(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cambiar el estado del vendedor');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading && vendedores.length === 0 && !refreshing) {
    return (
      <AdminLayoutMinimal>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayoutMinimal>
    );
  }

  return (
    <>
      <Head>
        <title>Vendedores | MarketDesliz Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-7xl mx-auto">

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Vendedores</h1>
                  <p className="text-sm text-gray-500">Administra todos los vendedores registrados</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => cargarVendedores(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
                <Link
                  href="/admin/vendedores/crear"
                  className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition shadow-sm"
                >
                  <UserPlus size={16} /> Nuevo vendedor
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                >
                  <ArrowLeft size={16} /> Dashboard
                </Link>
              </div>
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

          {/* ─── Stats Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Users size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total vendedores</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">{estadisticas.activos}</span>
              </div>
              <p className="text-xs text-gray-500">Vendedores activos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <XCircle size={18} className="text-red-500" />
                <span className="text-2xl font-bold text-red-600">{estadisticas.inactivos}</span>
              </div>
              <p className="text-xs text-gray-500">Vendedores inactivos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Percent size={18} className="text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.comisionPromedio}%</span>
              </div>
              <p className="text-xs text-gray-500">Comisión promedio</p>
            </div>
          </div>

          {/* ─── Barra de búsqueda y filtros ───────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] text-sm"
                  placeholder="Buscar por nombre, email, teléfono o código..."
                />
              </form>
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={filterEstado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>
              <div className="relative">
                <select
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="-created">Más recientes</option>
                  <option value="created">Más antiguos</option>
                  <option value="nombre">Por nombre</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Tabla de vendedores ────────────────────────────────────── */}
          {vendedores.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {searchTerm || filterEstado !== 'todos' ? 'No se encontraron vendedores' : 'No hay vendedores registrados'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {searchTerm || filterEstado !== 'todos'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Comienza creando tu primer vendedor'}
              </p>
              {!searchTerm && filterEstado === 'todos' && (
                <Link
                  href="/admin/vendedores/crear"
                  className="inline-flex items-center gap-2 text-[#6C3BFF] hover:underline text-sm"
                >
                  <Plus size={14} /> Crear nuevo vendedor
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comisión</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zona</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {vendedores.map((v, index) => (
                        <tr key={v.id} className={`hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-5 py-3">
                            <code className="text-xs font-mono font-medium text-gray-600">{v.codigo}</code>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-medium text-gray-900">{v.nombre}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail size={12} /> {v.email}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone size={12} /> {v.telefono}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <Percent size={10} /> {v.comisionPorcentaje}%
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin size={12} /> {v.zona || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar size={12} /> {formatDate(v.created)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              v.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {v.activo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                              {v.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleActivo(v.id, v.activo)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                  v.activo
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}
                              >
                                {v.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <Link
                                href={`/admin/vendedores/${v.id}`}
                                className="px-3 py-1.5 bg-[#6C3BFF]/10 text-[#6C3BFF] rounded-lg text-xs font-medium hover:bg-[#6C3BFF]/20 transition flex items-center gap-1"
                              >
                                <Eye size={12} /> Ver
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ─── Paginación ────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Mostrando {vendedores.length} de {totalItems} vendedores
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

          {/* ─── Información adicional ──────────────────────────────────── */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Información importante</p>
                <p className="text-sm text-blue-600">
                  Los vendedores pueden iniciar sesión en <strong className="font-mono">/vendedor/login</strong> con su correo y contraseña.
                  Cada vendedor tiene su propio código QR para que los clientes lo escaneen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayoutMinimal>
    </>
  );
}