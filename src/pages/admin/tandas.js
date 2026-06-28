// src/pages/admin/tandas.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router'; // ✅ NUEVO
import Head from 'next/head';
import Link from 'next/link';
import {
  Target,
  Plus,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  BarChart3,
  CreditCard,
  CalendarDays,
  Repeat,
  MapPin,
  Building2,
  Save,
  X,
  MoreVertical,
  Info,
  Key,
  RefreshCw,      // ✅ NUEVO
  ChevronLeft,   // ✅ NUEVO
  Search,        // ✅ NUEVO
  Filter         // ✅ NUEVO
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  getTandasPaginated,   // ✅ NUEVO
  getTandasStats,       // ✅ NUEVO
  getTandaById,
  getMiembrosTanda,
  deleteTanda,
  updateTanda,
  createTanda
} from '../../lib/tandasService';
import pb from '../../lib/pocketbase';
import { formatMoney, formatDate as formatFecha } from '../../lib/utils';

const ITEMS_PER_PAGE = 10; // ✅ NUEVO

export default function AdminTandasPage() {
  const router = useRouter(); // ✅ NUEVO

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const { page = 1, search = '', estado = 'todas', sort = '-created' } = router.query; // ✅ NUEVO
  const currentPage = parseInt(page) || 1; // ✅ NUEVO

  // ─── Estados ──────────────────────────────────────────────────────────
  const [tandas, setTandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ NUEVO
  const [error, setError] = useState(null); // ✅ NUEVO
  const [success, setSuccess] = useState(''); // ✅ NUEVO
  const [totalItems, setTotalItems] = useState(0); // ✅ NUEVO
  const [totalPages, setTotalPages] = useState(1); // ✅ NUEVO
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTanda, setSelectedTanda] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ─── Filtros sincronizados con URL ────────────────────────────────────
  const [filtroEstado, setFiltroEstado] = useState(estado); // ✅ NUEVO
  const [searchTerm, setSearchTerm] = useState(search); // ✅ NUEVO
  const [sortBy, setSortBy] = useState(sort); // ✅ NUEVO

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    montoTotal: '',
    cupoMaximo: '',
    frecuencia: 'semanal',
    diaPago: 'lunes',
    fechaInicio: new Date().toISOString().split('T')[0],
    estado: 'abierta',
    codigoInvitacion: ''
  });

  // ─── Estadísticas ──────────────────────────────────────────────────────
  const [estadisticas, setEstadisticas] = useState({ // ✅ NUEVO (reemplaza el cálculo local)
    total: 0,
    enCurso: 0,
    abiertas: 0,
    completadas: 0,
    canceladas: 0,
    totalParticipantes: 0,
    totalRecaudado: 0,
    promedio: 0
  });

  // ─── Cargar datos (con paginación y filtros) ──────────────────────────
  const cargarTandas = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess('');

      // Estadísticas (solo en carga inicial)
      if (!showRefreshing) {
        const stats = await getTandasStats();
        setEstadisticas(stats);
      }

      // Tandas paginadas
      const result = await getTandasPaginated({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        estado: filtroEstado,
        sort: sortBy
      });

      setTandas(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error cargando tandas:', err);
      setError('No se pudieron cargar las tandas. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filtroEstado, sortBy]);

  // ─── Efecto de carga ──────────────────────────────────────────────────
  useEffect(() => {
    cargarTandas();
  }, [cargarTandas]);

  // ─── Actualizar URL con filtros ──────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      search: searchTerm || undefined,
      estado: filtroEstado !== 'todas' ? filtroEstado : undefined,
      sort: sortBy !== '-created' ? sortBy : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/tandas', query }, undefined, { shallow: true });
  }, [currentPage, searchTerm, filtroEstado, sortBy, router]);

  // ─── Manejadores de filtros ──────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    setSearchTerm(term);
    actualizarURL({ search: term, page: 1 });
  };

  const handleEstadoChange = (value) => {
    setFiltroEstado(value);
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

  // ─── Funciones de negocio (crear, editar, eliminar) ─────────────────
  const handleCreateTanda = async () => {
    if (!formData.nombre || !formData.montoTotal || !formData.cupoMaximo) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      await createTanda({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        montoTotal: parseFloat(formData.montoTotal),
        cupoMaximo: parseInt(formData.cupoMaximo),
        frecuencia: formData.frecuencia,
        diaPago: formData.diaPago,
        fechaInicio: formData.fechaInicio,
        estado: 'abierta',
        codigoInvitacion: formData.codigoInvitacion || null
      }, pb.authStore.model?.id);

      setSuccess('✅ Tanda creada correctamente');
      setShowCreateModal(false);
      resetForm();
      cargarTandas(true);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al crear la tanda');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTanda = async () => {
    if (!selectedTanda) return;
    if (!formData.nombre || !formData.montoTotal || !formData.cupoMaximo) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      await updateTanda(selectedTanda.id, {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        montoTotal: parseFloat(formData.montoTotal),
        cupoMaximo: parseInt(formData.cupoMaximo),
        frecuencia: formData.frecuencia,
        diaPago: formData.diaPago,
        fechaInicio: formData.fechaInicio,
        estado: formData.estado,
        codigoInvitacion: formData.codigoInvitacion || null
      });

      setSuccess('✅ Tanda actualizada correctamente');
      setShowEditModal(false);
      setSelectedTanda(null);
      resetForm();
      cargarTandas(true);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al actualizar la tanda');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTanda = async () => {
    if (!selectedTanda) return;

    try {
      setLoading(true);
      await deleteTanda(selectedTanda.id);
      setSuccess('✅ Tanda eliminada correctamente');
      setShowDeleteConfirm(false);
      setSelectedTanda(null);
      cargarTandas(true);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al eliminar la tanda');
    } finally {
      setLoading(false);
    }
  };

  const generarCodigoInvitacion = async (tandaId) => {
    try {
      setLoading(true);
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let codigo = '';
      for (let i = 0; i < 8; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }

      await pb.collection('tandas').update(tandaId, {
        codigoInvitacion: codigo
      });

      setSuccess(`✅ Código generado: ${codigo}`);
      cargarTandas(true);
    } catch (error) {
      console.error('Error generando código:', error);
      setError('Error al generar el código');
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers para modales ────────────────────────────────────────────
  const openEditModal = (tanda) => {
    setSelectedTanda(tanda);
    setFormData({
      nombre: tanda.nombre || '',
      descripcion: tanda.descripcion || '',
      montoTotal: tanda.montoTotal || '',
      cupoMaximo: tanda.cupoMaximo || '',
      frecuencia: tanda.frequency || tanda.frecuencia || 'semanal',
      diaPago: tanda.diaPago || 'lunes',
      fechaInicio: tanda.fechaInicio ? new Date(tanda.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      estado: tanda.estado || 'abierta',
      codigoInvitacion: tanda.codigoInvitacion || ''
    });
    setShowEditModal(true);
  };

  const openDetailModal = async (tanda) => {
    try {
      // Cargar miembros solo cuando se abre el modal (optimización)
      const miembrosData = await getMiembrosTanda(tanda.id);
      setSelectedTanda({ ...tanda, miembros: miembrosData });
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error cargando miembros:', error);
      setError('No se pudieron cargar los participantes');
    }
  };

  const openDeleteConfirm = (tanda) => {
    setSelectedTanda(tanda);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      montoTotal: '',
      cupoMaximo: '',
      frecuencia: 'semanal',
      diaPago: 'lunes',
      fechaInicio: new Date().toISOString().split('T')[0],
      estado: 'abierta',
      codigoInvitacion: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading && tandas.length === 0 && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Gestión de Tandas | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <Target size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Tandas</h1>
                  <p className="text-sm text-gray-500">Administra las tandas y sus participantes</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => cargarTandas(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition shadow-sm"
                >
                  <Plus size={16} /> Crear nueva tanda
                </button>
              </div>
            </div>
          </div>

          {/* ─── Stats Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Target size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total tandas</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp size={18} className="text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{estadisticas.enCurso}</span>
              </div>
              <p className="text-xs text-gray-500">En curso</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">{estadisticas.abiertas}</span>
              </div>
              <p className="text-xs text-gray-500">Abiertas</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <XCircle size={18} className="text-gray-400" />
                <span className="text-2xl font-bold text-gray-600">{estadisticas.completadas}</span>
              </div>
              <p className="text-xs text-gray-500">Completadas</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Users size={18} className="text-indigo-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.totalParticipantes}</span>
              </div>
              <p className="text-xs text-gray-500">Participantes</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <DollarSign size={18} className="text-green-500" />
                <span className="text-sm font-bold text-gray-900">{formatMoney(estadisticas.totalRecaudado)}</span>
              </div>
              <p className="text-xs text-gray-500">Total recaudado</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Wallet size={18} className="text-orange-500" />
                <span className="text-lg font-bold text-gray-900">{estadisticas.promedio}</span>
              </div>
              <p className="text-xs text-gray-500">Promedio por tanda</p>
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
                  placeholder="Buscar por nombre o descripción..."
                />
              </form>
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={filtroEstado}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  <option value="abierta">Abiertas</option>
                  <option value="en_curso">En curso</option>
                  <option value="completada">Completadas</option>
                  <option value="cancelada">Canceladas</option>
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
                  <option value="montoTotal">Por monto</option>
                  <option value="miembrosActivos">Más participantes</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Lista de tandas ────────────────────────────────────────── */}
          {tandas.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {searchTerm || filtroEstado !== 'todas' ? 'No se encontraron tandas' : 'No hay tandas creadas'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {searchTerm || filtroEstado !== 'todas'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Comienza creando tu primera tanda'}
              </p>
              {!searchTerm && filtroEstado === 'todas' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
                >
                  <Plus size={14} /> Crear nueva tanda
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {tandas.map((tanda) => {
                  const estadoConfig = getEstadoConfig(tanda.estado);
                  const EstadoIcono = estadoConfig.icono;
                  const progreso = ((tanda.miembrosActivos || 0) / (tanda.cupoMaximo || 1)) * 100;

                  return (
                    <div key={tanda.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
                      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{tanda.nombre}</h3>
                            {tanda.descripcion && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tanda.descripcion}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                              <EstadoIcono size={10} /> {estadoConfig.label}
                            </span>
                            <div className="relative group">
                              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                                <MoreVertical size={16} className="text-gray-400" />
                              </button>
                              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 w-36 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button
                                  onClick={() => openDetailModal(tanda)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl flex items-center gap-2"
                                >
                                  <Eye size={14} /> Ver detalles
                                </button>
                                <button
                                  onClick={() => generarCodigoInvitacion(tanda.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                                >
                                  <Key size={14} /> Generar código
                                </button>
                                <button
                                  onClick={() => openEditModal(tanda)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit size={14} /> Editar
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(tanda)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl flex items-center gap-2"
                                >
                                  <Trash2 size={14} /> Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-gray-50 rounded-xl">
                            <DollarSign size={16} className="text-[#6C3BFF] mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">{formatMoney(tanda.montoTotal)}</p>
                            <p className="text-xs text-gray-500">Monto por turno</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-xl">
                            <Users size={16} className="text-[#6C3BFF] mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">{tanda.miembrosActivos || 0}/{tanda.cupoMaximo || 0}</p>
                            <p className="text-xs text-gray-500">Participantes</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-xl">
                            <Repeat size={16} className="text-[#6C3BFF] mx-auto mb-1" />
                            <p className="text-sm font-bold text-gray-900 capitalize">{tanda.frequency || 'semanal'}</p>
                            <p className="text-xs text-gray-500">Frecuencia</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-xl">
                            <Calendar size={16} className="text-[#6C3BFF] mx-auto mb-1" />
                            <p className="text-sm font-bold text-gray-900 capitalize">{tanda.diaPago || 'lunes'}</p>
                            <p className="text-xs text-gray-500">Día de pago</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progreso de llenado</span>
                            <span>{Math.round(progreso)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#6C3BFF] rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
                          </div>
                        </div>

                        {tanda.codigoInvitacion && (
                          <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-purple-700 font-medium">Código de invitación</p>
                              <button
                                onClick={() => navigator.clipboard.writeText(tanda.codigoInvitacion)}
                                className="text-xs text-purple-600 hover:underline"
                              >
                                Copiar
                              </button>
                            </div>
                            <code className="text-sm font-mono font-bold text-purple-800">{tanda.codigoInvitacion}</code>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={12} />
                            <span>Inicio: {formatFecha(tanda.fechaInicio)}</span>
                          </div>
                          <button
                            onClick={() => openDetailModal(tanda)}
                            className="flex items-center gap-1 text-[#6C3BFF] hover:underline text-xs"
                          >
                            Ver detalles <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── Paginación ────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Mostrando {tandas.length} de {totalItems} tandas
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

        {/* ─── Modales (sin cambios, solo se ajusta la carga de miembros) ──── */}
        {/* Modal de detalles (ahora carga miembros al abrir) */}
        {showDetailModal && selectedTanda && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                    <Target size={16} className="text-[#6C3BFF]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedTanda.nombre}</h2>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>

              <div className="p-6 space-y-5">
                {/* Información general */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Info size={16} /> Información general</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Estado:</span> <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getEstadoConfig(selectedTanda.estado).bg} ${getEstadoConfig(selectedTanda.estado).text}`}>{selectedTanda.estado}</span></div>
                    <div><span className="text-gray-500">Código:</span> <code className="text-xs">{selectedTanda.id?.slice(-8)}</code></div>
                    {selectedTanda.descripcion && <div className="col-span-2"><span className="text-gray-500">Descripción:</span> <p className="mt-1">{selectedTanda.descripcion}</p></div>}
                    {selectedTanda.codigoInvitacion && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Código invitación:</span>{' '}
                        <code className="text-sm font-mono font-bold text-purple-600">{selectedTanda.codigoInvitacion}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalles financieros */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign size={16} /> Detalles financieros</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Monto por turno:</span> <span className="font-bold text-[#6C3BFF]">{formatMoney(selectedTanda.montoTotal)}</span></div>
                    <div><span className="text-gray-500">Cupo máximo:</span> {selectedTanda.cupoMaximo} participantes</div>
                    <div><span className="text-gray-500">Participantes actuales:</span> {selectedTanda.miembrosActivos || 0}</div>
                    <div><span className="text-gray-500">Lugares disponibles:</span> {(selectedTanda.cupoMaximo || 0) - (selectedTanda.miembrosActivos || 0)}</div>
                  </div>
                </div>

                {/* Configuración de pagos */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Calendar size={16} /> Configuración de pagos</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Frecuencia:</span> <span className="capitalize">{selectedTanda.frequency || 'semanal'}</span></div>
                    <div><span className="text-gray-500">Día de pago:</span> <span className="capitalize">{selectedTanda.diaPago}</span></div>
                    <div><span className="text-gray-500">Fecha de inicio:</span> {formatFecha(selectedTanda.fechaInicio)}</div>
                    <div><span className="text-gray-500">Creado:</span> {formatFecha(selectedTanda.created)}</div>
                  </div>
                </div>

                {/* Lista de participantes (ahora cargada al abrir el modal) */}
                {selectedTanda.miembros && selectedTanda.miembros.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Users size={16} /> Participantes ({selectedTanda.miembros.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedTanda.miembros.map((miembro, idx) => (
                        <div key={miembro.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{miembro.expand?.userId?.nombre || 'Usuario'}</p>
                            <p className="text-xs text-gray-500">Posición: {miembro.posicion || idx + 1}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${miembro.estadoPago === 'al_corriente' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {miembro.estadoPago === 'al_corriente' ? 'Al corriente' : 'Atrasado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedTanda);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-2.5 rounded-xl font-semibold hover:bg-[#5a2ee6] transition"
                  >
                    <Edit size={16} /> Editar tanda
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ModalForm (sin cambios estructurales) */}
        {showCreateModal && (
          <ModalForm
            title="Crear nueva tanda"
            formData={formData}
            onChange={handleInputChange}
            onSave={handleCreateTanda}
            onCancel={() => setShowCreateModal(false)}
            loading={loading}
            isEdit={false}
          />
        )}

        {showEditModal && selectedTanda && (
          <ModalForm
            title="Editar tanda"
            formData={formData}
            onChange={handleInputChange}
            onSave={handleUpdateTanda}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedTanda(null);
              resetForm();
            }}
            loading={loading}
            isEdit={true}
          />
        )}

        {showDeleteConfirm && selectedTanda && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={28} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar tanda</h3>
                <p className="text-gray-500 mb-4">
                  ¿Estás seguro de que deseas eliminar la tanda <strong className="text-gray-900">"{selectedTanda.nombre}"</strong>?
                  {selectedTanda.miembrosActivos > 0 && (
                    <span className="block mt-2 text-red-600">⚠️ Esta tanda tiene {selectedTanda.miembrosActivos} participantes. La acción no se puede deshacer.</span>
                  )}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteTanda}
                    disabled={loading}
                    className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedTanda(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}

// Componente ModalForm reutilizable
function ModalForm({ title, formData, onChange, onSave, onCancel, loading, isEdit }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
              <Target size={16} className="text-[#6C3BFF]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tanda *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={onChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              placeholder="Ej: Tanda Electrónica #1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={onChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent resize-none"
              placeholder="Breve descripción de la tanda"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto total ($) *</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="montoTotal"
                  value={formData.montoTotal}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                  placeholder="10000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cupo máximo *</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="cupoMaximo"
                  value={formData.cupoMaximo}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
              <div className="relative">
                <Repeat size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  name="frecuencia"
                  value={formData.frecuencia}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] bg-white appearance-none"
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Día de pago</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  name="diaPago"
                  value={formData.diaPago}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] bg-white appearance-none"
                >
                  <option value="lunes">Lunes</option>
                  <option value="martes">Martes</option>
                  <option value="miércoles">Miércoles</option>
                  <option value="jueves">Jueves</option>
                  <option value="viernes">Viernes</option>
                  <option value="sábado">Sábado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                />
              </div>
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <div className="relative">
                  <AlertCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] bg-white appearance-none"
                  >
                    <option value="abierta">Abierta</option>
                    <option value="en_curso">En curso</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ✅ Campo Código de invitación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de invitación</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="codigoInvitacion"
                value={formData.codigoInvitacion || ''}
                onChange={onChange}
                placeholder="Generar código único (opcional)"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent font-mono uppercase"
                maxLength={8}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Dejar en blanco para generar automáticamente o ingresar un código personalizado (máx 8 caracteres)
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isEdit ? <Save size={16} /> : <Plus size={16} />}
                  {isEdit ? (loading ? 'Guardando...' : 'Guardar cambios') : (loading ? 'Creando...' : 'Crear tanda')}
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function getEstadoConfig(estado) {
  const configs = {
    abierta:    { icono: AlertCircle, label: 'Abierta',   bg: 'bg-blue-100',  text: 'text-blue-800' },
    en_curso:   { icono: TrendingUp,  label: 'En curso',  bg: 'bg-green-100', text: 'text-green-800' },
    completada: { icono: CheckCircle, label: 'Completada',bg: 'bg-gray-100',  text: 'text-gray-600' },
    cancelada:  { icono: XCircle,    label: 'Cancelada',  bg: 'bg-red-100',   text: 'text-red-800' }
  };
  return configs[estado] || { icono: AlertCircle, label: estado, bg: 'bg-gray-50', text: 'text-gray-600' };
}