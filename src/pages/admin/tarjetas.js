// src/pages/admin/tarjetas.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router'; // ✅ NUEVO
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,      // ✅ NUEVO
  ChevronLeft,   // ✅ NUEVO
  ChevronRight,  // ✅ NUEVO
  UserPlus,
  Download,
  Printer,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  DollarSign
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';
import {
  getOrCreateTarjeta,
  getDatosTarjeta,
  getTarjetasPaginated,   // ✅ NUEVO
  getTarjetasStats,       // ✅ NUEVO
  eliminarTarjeta         // ✅ NUEVO
} from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';
import { formatDate } from '../../lib/utils';

const ITEMS_PER_PAGE = 10; // ✅ NUEVO

export default function AdminTarjetasPage() {
  const router = useRouter(); // ✅ NUEVO

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const { page = 1, search = '', estado = 'todos', sort = '-created' } = router.query; // ✅ NUEVO
  const currentPage = parseInt(page) || 1; // ✅ NUEVO

  // ─── Estados ──────────────────────────────────────────────────────────
  const [tarjetas, setTarjetas] = useState([]);
  const [clientesSinTarjeta, setClientesSinTarjeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ NUEVO
  const [error, setError] = useState(null); // ✅ NUEVO
  const [success, setSuccess] = useState(''); // ✅ NUEVO
  const [totalItems, setTotalItems] = useState(0); // ✅ NUEVO
  const [totalPages, setTotalPages] = useState(1); // ✅ NUEVO

  // ─── Filtros sincronizados con URL ────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(search || ''); // ✅ NUEVO
  const [filterEstado, setFilterEstado] = useState(estado || 'todos'); // ✅ NUEVO
  const [sortBy, setSortBy] = useState(sort || '-created'); // ✅ NUEVO

  // ─── Estadísticas ──────────────────────────────────────────────────────
  const [stats, setStats] = useState({ // ✅ NUEVO (reemplaza hardcode)
    total: 0,
    activas: 0,
    inactivas: 0,
    suspendidas: 0,
    sinTarjeta: 0
  });

  // ─── Estados para modales ────────────────────────────────────────────
  const [selectedTarjeta, setSelectedTarjeta] = useState(null);
  const [tarjetaData, setTarjetaData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGenerarMasivaModal, setShowGenerarMasivaModal] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [editForm, setEditForm] = useState({ idCliente: '', estado: 'activo' });
  const [selectedClientesMasivos, setSelectedClientesMasivos] = useState([]);

  // Función local para actualizar estado de tarjeta (evita dependencia inexistente)
  const actualizarEstadoTarjeta = async (clienteId, nuevoEstado) => {
    try {
      await pb.collection('clients').update(clienteId, {
        tarjetaEstado: nuevoEstado
      });
    } catch (error) {
      console.error('Error actualizando estado de tarjeta:', error);
      throw error;
    }
  };

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess('');

      // Estadísticas (solo en carga inicial)
      if (!showRefreshing) {
        const statsData = await getTarjetasStats();
        setStats(statsData);
      }

      // Tarjetas paginadas
      const result = await getTarjetasPaginated({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        estado: filterEstado,
        sort: sortBy
      });

      setTarjetas(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

      // Cargar clientes sin tarjeta (para generación masiva) - solo si es necesario
      if (!showRefreshing) {
        await cargarClientesSinTarjeta();
      }

    } catch (err) {
      console.error('Error cargando tarjetas:', err);
      setError('No se pudieron cargar las tarjetas. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filterEstado, sortBy]);

  // ─── Cargar clientes sin tarjeta ──────────────────────────────────────
  const cargarClientesSinTarjeta = async () => {
    try {
      // Obtener todos los clientes (solo IDs y nombres para el modal)
      const todosClientes = await pb.collection('users').getList(1, 50, {
        filter: 'role = "cliente"',
        sort: 'nombre',
        fields: 'id,nombre,telefono'
      });

      // Obtener IDs de clientes con tarjeta
      const conTarjeta = await pb.collection('clients').getFullList({
        filter: 'tarjetaId != null && tarjetaId != ""',
        fields: 'userId'
      });
      const conTarjetaIds = new Set(conTarjeta.map(c => c.userId));

      // Filtrar clientes sin tarjeta
      const sinTarjeta = todosClientes.items.filter(c => !conTarjetaIds.has(c.id));
      setClientesSinTarjeta(sinTarjeta);
    } catch (error) {
      console.error('Error cargando clientes sin tarjeta:', error);
    }
  };

  // ─── Efecto de carga ──────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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
    router.push({ pathname: '/admin/tarjetas', query }, undefined, { shallow: true });
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

  // ─── Funciones de negocio ─────────────────────────────────────────────
  const generarTarjeta = async (clienteId) => {
    setGenerando(true);
    try {
      await getOrCreateTarjeta(clienteId);
      setSuccess('✅ Tarjeta generada correctamente');
      await cargarDatos(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al generar la tarjeta');
    } finally {
      setGenerando(false);
    }
  };

  const generarTarjetasMasivas = async () => {
    if (selectedClientesMasivos.length === 0) {
      setError('Selecciona al menos un cliente');
      return;
    }

    setGenerando(true);
    let generadas = 0;
    let errores = 0;

    for (const clienteId of selectedClientesMasivos) {
      try {
        await getOrCreateTarjeta(clienteId);
        generadas++;
      } catch (error) {
        errores++;
        console.error(`Error generando tarjeta para ${clienteId}:`, error);
      }
    }

    setSuccess(`✅ ${generadas} tarjetas generadas, ${errores} errores`);
    setShowGenerarMasivaModal(false);
    setSelectedClientesMasivos([]);
    await cargarDatos(true);
    setGenerando(false);
  };

  const verTarjeta = async (tarjeta) => {
    try {
      const datos = await getDatosTarjeta(tarjeta.token || tarjeta.idCliente);
      setTarjetaData(datos);
      setSelectedTarjeta(tarjeta);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar la tarjeta');
    }
  };

  const editarTarjeta = async () => {
    try {
      if (!selectedTarjeta) return;
      // Actualizar estado de la tarjeta
      await actualizarEstadoTarjeta(selectedTarjeta.id, editForm.estado);
      setSuccess('✅ Tarjeta actualizada');
      setShowEditModal(false);
      await cargarDatos(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar la tarjeta');
    }
  };

  const eliminarTarjetaConfirm = async () => {
    try {
      if (!selectedTarjeta) return;
      await eliminarTarjeta(selectedTarjeta.id);
      setSuccess('✅ Tarjeta eliminada');
      setShowDeleteModal(false);
      await cargarDatos(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar la tarjeta');
    }
  };

  const imprimirTarjeta = () => window.print();

  // ─── Exportación a Excel (mejorada) ──────────────────────────────────
  const exportarExcel = () => {
    const data = tarjetas.map(t => ({
      'ID Cliente': t.idCliente,
      'Cliente': t.clienteNombre,
      'Teléfono': t.clienteTelefono,
      'Estado': t.estado || 'activo',
      'Fecha creación': new Date(t.created).toLocaleDateString(),
      'Token': t.token
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarjetas');
    XLSX.writeFile(workbook, `tarjetas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ─── Badge de estado ──────────────────────────────────────────────────
  const getEstadoBadge = (estado) => {
    const config = {
      activo: { color: 'bg-green-100 text-green-800', label: 'Activo' },
      inactivo: { color: 'bg-red-100 text-red-800', label: 'Inactivo' },
      suspendido: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspendido' }
    };
    const info = config[estado] || config.activo;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Gestión de Tarjetas | Admin</title>
        <style>{`
          .loading-spinner { width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #6C3BFF; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
          .modal-content { background: white; border-radius: 16px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; }
          @media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; top: 0; left: 0; width: 100%; } }
        `}</style>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💳 Gestión de Tarjetas</h1>
              <p className="text-gray-500 mt-1">Administra las tarjetas de clientes</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => cargarDatos(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              <button
                onClick={() => setShowGenerarMasivaModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>📦</span> Generación masiva
              </button>
              <button
                onClick={exportarExcel}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
              >
                <span>📊</span> Exportar Excel
              </button>
            </div>
          </div>

          {/* ─── Mensajes de éxito/error ────────────────────────────────── */}
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

          {/* ─── Estadísticas ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total tarjetas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activas}</div>
              <div className="text-sm text-gray-500">Activas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.inactivas}</div>
              <div className="text-sm text-gray-500">Inactivas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.suspendidas}</div>
              <div className="text-sm text-gray-500">Suspendidas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.sinTarjeta}</div>
              <div className="text-sm text-gray-500">Sin tarjeta</div>
            </div>
          </div>

          {/* ─── Barra de búsqueda y filtros ───────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] text-sm"
                  placeholder="Buscar por cliente, ID o teléfono..."
                />
              </form>
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={filterEstado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                >
                  <option value="todos">📋 Todos los estados</option>
                  <option value="activo">✅ Activas</option>
                  <option value="inactivo">❌ Inactivas</option>
                  <option value="suspendido">⏸️ Suspendidas</option>
                </select>
              </div>
              <div className="relative">
                <select
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="-created">Más recientes</option>
                  <option value="created">Más antiguas</option>
                  <option value="clienteNombre">Por cliente</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Tabla de tarjetas ──────────────────────────────────────── */}
          {tarjetas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterEstado !== 'todos' ? 'No se encontraron tarjetas' : 'No hay tarjetas registradas'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterEstado !== 'todos'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Genera tarjetas desde la sección de clientes'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">ID Cliente</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Cliente</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Teléfono</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Estado</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Fecha</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tarjetas.map((tarjeta) => (
                        <tr key={tarjeta.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-mono text-sm">{tarjeta.idCliente || 'N/A'}</td>
                          <td className="p-4 font-medium">{tarjeta.clienteNombre}</td>
                          <td className="p-4 text-gray-600">{tarjeta.clienteTelefono || 'N/A'}</td>
                          <td className="p-4">{getEstadoBadge(tarjeta.estado || 'activo')}</td>
                          <td className="p-4 text-sm text-gray-500">{formatDate(tarjeta.created)}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => verTarjeta(tarjeta)}
                                className="text-purple-600 hover:text-purple-800 transition"
                                title="Ver tarjeta"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTarjeta(tarjeta);
                                  setEditForm({ idCliente: tarjeta.idCliente, estado: tarjeta.estado || 'activo' });
                                  setShowEditModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTarjeta(tarjeta);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-800 transition"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
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
                    Mostrando {tarjetas.length} de {totalItems} tarjetas
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
        </div>
      </AdminLayout>

      {/* ─── Modales (sin cambios estructurales, solo ajustes de estado) ──── */}

      {/* Modal de ver tarjeta */}
      {showModal && tarjetaData && (
        <div className="modal print-area" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3>💳 Tarjeta de {tarjetaData.cliente?.nombre || 'Cliente'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-6">
              <TarjetaCliente datos={tarjetaData} tipo="frente" />
              <TarjetaCliente datos={tarjetaData} tipo="reverso" />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={imprimirTarjeta} className="flex-1 bg-[#6C3BFF] text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition">🖨️ Imprimir</button>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/cliente/${tarjetaData.token}`); alert('✅ Enlace copiado'); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold">📋 Copiar enlace</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedTarjeta && (
        <div className="modal" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">✏️ Editar tarjeta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Cliente</label>
                <input type="text" value={editForm.idCliente} disabled className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button onClick={editarTarjeta} className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && selectedTarjeta && (
        <div className="modal" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">🗑️ Eliminar tarjeta</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de eliminar la tarjeta de <strong>{selectedTarjeta.clienteNombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button onClick={eliminarTarjetaConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de generación masiva */}
      {showGenerarMasivaModal && (
        <div className="modal" onClick={() => setShowGenerarMasivaModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">📦 Generación masiva de tarjetas</h3>
            <p className="text-gray-600 mb-4">Selecciona los clientes para generar sus tarjetas:</p>
            <div className="max-h-60 overflow-y-auto border rounded-lg mb-4">
              {clientesSinTarjeta.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No hay clientes sin tarjeta</p>
              ) : (
                clientesSinTarjeta.map(cliente => (
                  <label key={cliente.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b">
                    <input
                      type="checkbox"
                      value={cliente.id}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClientesMasivos([...selectedClientesMasivos, cliente.id]);
                        } else {
                          setSelectedClientesMasivos(selectedClientesMasivos.filter(id => id !== cliente.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">{cliente.nombre || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-500">{cliente.telefono}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenerarMasivaModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button
                onClick={generarTarjetasMasivas}
                disabled={generando || selectedClientesMasivos.length === 0}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold disabled:opacity-50"
              >
                Generar {selectedClientesMasivos.length} tarjeta(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
