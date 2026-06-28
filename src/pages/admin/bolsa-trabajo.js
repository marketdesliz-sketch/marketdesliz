// src/pages/admin/bolsa-trabajo.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Users,
  Building2,
  Search,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Tag
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';
import { formatDate, formatPhone } from '../../lib/utils';

const ITEMS_PER_PAGE = 10;

// ─── Servicio interno para la bolsa de trabajo ──────────────────────────
const bolsaTrabajoService = {
  /**
   * Obtiene ofertas con paginación, filtros y ordenamiento
   */
  async getOfertas({ page = 1, perPage = ITEMS_PER_PAGE, estado = 'pendiente', tipo = '', categoria = '', search = '', sort = '-created' }) {
    try {
      let filter = '';

      // Filtro por estado
      if (estado && estado !== 'todas') {
        filter += `estado = "${estado}"`;
      }

      // Filtro por tipo (busco_trabajo / ofrezco_trabajo)
      if (tipo) {
        filter += filter ? ` && tipo = "${tipo}"` : `tipo = "${tipo}"`;
      }

      // Filtro por categoría
      if (categoria) {
        filter += filter ? ` && categoria = "${categoria}"` : `categoria = "${categoria}"`;
      }

      // Búsqueda por título o descripción
      if (search.trim()) {
        const term = search.trim();
        filter += filter ? ` && (titulo ~ "${term}" || descripcion ~ "${term}")` : `(titulo ~ "${term}" || descripcion ~ "${term}")`;
      }

      const result = await pb.collection('bolsa_trabajo').getList(page, perPage, {
        filter: filter || undefined,
        sort: sort,
        expand: 'userId'
      });

      return {
        items: result.items,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        page: result.page,
        perPage: result.perPage
      };
    } catch (error) {
      console.error('Error obteniendo ofertas:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas generales (contadores por estado, tipo, categoría)
   */
  async getEstadisticas() {
    try {
      const stats = {
        pendiente: 0,
        aprobado: 0,
        rechazado: 0,
        total: 0,
        porTipo: { busco_trabajo: 0, ofrezco_trabajo: 0 },
        porCategoria: {}
      };

      const all = await pb.collection('bolsa_trabajo').getFullList({
        fields: 'estado,tipo,categoria'
      });

      all.forEach(o => {
        stats.total++;
        if (o.estado === 'pendiente') stats.pendiente++;
        else if (o.estado === 'aprobado') stats.aprobado++;
        else if (o.estado === 'rechazado') stats.rechazado++;

        if (o.tipo) stats.porTipo[o.tipo] = (stats.porTipo[o.tipo] || 0) + 1;
        if (o.categoria) stats.porCategoria[o.categoria] = (stats.porCategoria[o.categoria] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { pendiente: 0, aprobado: 0, rechazado: 0, total: 0, porTipo: {}, porCategoria: {} };
    }
  },

  async aprobar(id, adminId) {
    const updateData = {
      estado: 'aprobado',
      fechaRevision: new Date().toISOString(),
      revisadoPor: adminId
    };
    const oferta = await pb.collection('bolsa_trabajo').update(id, updateData);
    // Enviar notificación
    if (oferta.userId) {
      await pb.collection('notificaciones').create({
        usuarioId: oferta.userId,
        tipoUsuario: 'cliente',
        tipo: 'sistema',
        titulo: '✅ Publicación aprobada',
        mensaje: `Tu oferta "${oferta.titulo}" ha sido aprobada en la Bolsa de Trabajo.`,
        entidadId: id,
        entidadTipo: 'bolsa_trabajo'
      });
    }
    return oferta;
  },

  async rechazar(id, motivo, adminId) {
    const updateData = {
      estado: 'rechazado',
      motivoRechazo: motivo,
      fechaRevision: new Date().toISOString(),
      revisadoPor: adminId
    };
    const oferta = await pb.collection('bolsa_trabajo').update(id, updateData);
    // Opcional: notificar al usuario
    if (oferta.userId) {
      await pb.collection('notificaciones').create({
        usuarioId: oferta.userId,
        tipoUsuario: 'cliente',
        tipo: 'sistema',
        titulo: '❌ Publicación rechazada',
        mensaje: `Tu oferta "${oferta.titulo}" ha sido rechazada. Motivo: ${motivo}`,
        entidadId: id,
        entidadTipo: 'bolsa_trabajo'
      });
    }
    return oferta;
  }
};

// ─── Componente principal ────────────────────────────────────────────────
export default function AdminBolsaTrabajoPage() {
  const router = useRouter();

  // ─── Estado local ──────────────────────────────────────────────────────
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    pendiente: 0,
    aprobado: 0,
    rechazado: 0,
    total: 0,
    porTipo: {},
    porCategoria: {}
  });
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [selectedOferta, setSelectedOferta] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Filtros desde URL ─────────────────────────────────────────────────
  const {
    estado = 'pendiente',
    tipo = '',
    categoria = '',
    search = '',
    sort = '-created',
    page = 1
  } = router.query;

  const currentPage = parseInt(page) || 1;

  // ─── Actualizar URL con filtros ───────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      estado: estado !== 'todas' ? estado : undefined,
      tipo: tipo || undefined,
      categoria: categoria || undefined,
      search: search || undefined,
      sort: sort || undefined,
      page: currentPage > 1 ? currentPage : undefined,
      ...params
    };
    // Eliminar valores vacíos
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/bolsa-trabajo', query }, undefined, { shallow: true });
  }, [estado, tipo, categoria, search, sort, currentPage, router]);

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar estadísticas (solo la primera vez o cuando cambia algo que las afecte)
      const stats = await bolsaTrabajoService.getEstadisticas();
      setEstadisticas(stats);

      // Cargar ofertas con filtros
      const result = await bolsaTrabajoService.getOfertas({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        estado,
        tipo,
        categoria,
        search,
        sort
      });

      setOfertas(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar las ofertas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, estado, tipo, categoria, search, sort]);

  // ─── Efecto de carga ──────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Manejar aprobación ──────────────────────────────────────────────
  const handleAprobar = async (id) => {
    try {
      const adminId = pb.authStore.model?.id;
      await bolsaTrabajoService.aprobar(id, adminId);
      await cargarDatos();
      setShowModal(false);
      setSelectedOferta(null);
      setMotivoRechazo('');
    } catch (err) {
      console.error('Error aprobando:', err);
      alert('Error al aprobar la oferta');
    }
  };

  // ─── Manejar rechazo ──────────────────────────────────────────────────
  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      alert('Escribe el motivo del rechazo');
      return;
    }
    try {
      const adminId = pb.authStore.model?.id;
      await bolsaTrabajoService.rechazar(selectedOferta.id, motivoRechazo, adminId);
      await cargarDatos();
      setShowModal(false);
      setSelectedOferta(null);
      setMotivoRechazo('');
    } catch (err) {
      console.error('Error rechazando:', err);
      alert('Error al rechazar la oferta');
    }
  };

  // ─── Abrir modal de rechazo ──────────────────────────────────────────
  const abrirModalRechazo = (oferta) => {
    setSelectedOferta(oferta);
    setMotivoRechazo('');
    setShowModal(true);
  };

  // ─── Cambiar filtro de estado ─────────────────────────────────────────
  const cambiarFiltroEstado = (nuevoEstado) => {
    actualizarURL({ estado: nuevoEstado, page: 1 });
  };

  // ─── Cambiar página ──────────────────────────────────────────────────
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPages) return;
    actualizarURL({ page: nuevaPagina });
  };

  // ─── Manejar búsqueda ─────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const term = formData.get('search') || '';
    actualizarURL({ search: term, page: 1 });
  };

  // ─── Obtener configuración de estado ─────────────────────────────────
  const getEstadoConfig = (estado) => {
    const configs = {
      pendiente: { icono: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pendiente' },
      aprobado: { icono: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Aprobado' },
      rechazado: { icono: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rechazado' }
    };
    return configs[estado] || { icono: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: estado };
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading && currentPage === 1) {
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
        <title>Revisar Bolsa de Trabajo | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <Briefcase size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Revisar Bolsa de Trabajo</h1>
                <p className="text-sm text-gray-500">Aprueba o rechaza las ofertas publicadas</p>
              </div>
            </div>
          </div>

          {/* ─── Stats Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-yellow-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{estadisticas.pendiente}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Pendientes</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{estadisticas.aprobado}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Aprobadas</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <XCircle size={18} className="text-red-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{estadisticas.rechazado}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Rechazadas</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Briefcase size={18} className="text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Total</p>
            </div>
          </div>

          {/* ─── Barra de búsqueda y filtros ──────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Buscar por título o descripción..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                />
              </form>

              {/* Filtros rápidos de estado */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'pendiente', label: 'Pendientes', icono: Clock, color: 'yellow' },
                  { id: 'aprobado', label: 'Aprobadas', icono: CheckCircle, color: 'green' },
                  { id: 'rechazado', label: 'Rechazadas', icono: XCircle, color: 'red' },
                  { id: 'todas', label: 'Todas', icono: Briefcase, color: 'purple' }
                ].map(f => {
                  const Icono = f.icono;
                  const isActive = estado === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => cambiarFiltroEstado(f.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? `bg-${f.color}-500 text-white shadow-sm`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icono size={14} /> {f.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {estadisticas[f.id] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtros adicionales (tipo y categoría) */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Filtros adicionales:</span>
              </div>
              <select
                value={tipo}
                onChange={(e) => actualizarURL({ tipo: e.target.value, page: 1 })}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#6C3BFF]/25"
              >
                <option value="">Todos los tipos</option>
                <option value="busco_trabajo">Busco trabajo</option>
                <option value="ofrezco_trabajo">Ofrezco trabajo</option>
              </select>
              <select
                value={categoria}
                onChange={(e) => actualizarURL({ categoria: e.target.value, page: 1 })}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#6C3BFF]/25"
              >
                <option value="">Todas las categorías</option>
                <option value="ventas">Ventas</option>
                <option value="atencion_cliente">Atención al cliente</option>
                <option value="administracion">Administración</option>
                <option value="tecnologia">Tecnología</option>
                <option value="oficios">Oficios</option>
                <option value="construccion">Construcción</option>
                <option value="limpieza">Limpieza</option>
                <option value="cocina">Cocina</option>
                <option value="chofer">Chofer</option>
                <option value="repartidor">Repartidor</option>
                <option value="informal">Informal</option>
                <option value="otro">Otro</option>
              </select>
              {search && (
                <button
                  onClick={() => actualizarURL({ search: '', page: 1 })}
                  className="text-xs text-red-500 hover:underline"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>

          {/* ─── Error ──────────────────────────────────────────────────── */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={cargarDatos}
                className="ml-auto text-sm font-medium hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* ─── Lista de ofertas ──────────────────────────────────────── */}
          {ofertas.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay ofertas</h3>
              <p className="text-sm text-gray-400">
                {search ? 'No hay resultados para tu búsqueda' : 'No hay ofertas en esta categoría'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {ofertas.map((oferta) => {
                  const EstadoIcono = getEstadoConfig(oferta.estado).icono;
                  const estadoConfig = getEstadoConfig(oferta.estado);
                  const esOfertaTrabajo = oferta.tipo === 'ofrezco_trabajo';

                  return (
                    <div key={oferta.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                      {/* Header de la tarjeta */}
                      <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 ${esOfertaTrabajo ? 'bg-blue-50' : 'bg-green-50'} rounded-lg flex items-center justify-center`}>
                              {esOfertaTrabajo ? <Building2 size={14} className="text-blue-600" /> : <Search size={14} className="text-green-600" />}
                            </div>
                            <div>
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${esOfertaTrabajo ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {esOfertaTrabajo ? 'Ofrezco trabajo' : 'Busco trabajo'}
                              </span>
                              <p className="text-xs text-gray-400 mt-1">
                                Publicado: {formatDate(oferta.created)}
                              </p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${estadoConfig.bg}`}>
                            <EstadoIcono size={12} className={estadoConfig.color} />
                            <span className={`text-xs font-medium ${estadoConfig.color}`}>{estadoConfig.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{oferta.titulo}</h3>
                            <p className="text-sm text-gray-500 mb-3">
                              Por: <span className="font-medium">{oferta.expand?.userId?.nombre || oferta.expand?.userId?.email || 'Usuario'}</span>
                              {oferta.categoria && (
                                <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                  <Tag size={10} className="inline mr-1" />
                                  {oferta.categoria}
                                </span>
                              )}
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">{oferta.descripcion}</p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              {oferta.telefono && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Phone size={13} /> {formatPhone(oferta.telefono)}
                                </div>
                              )}
                              {oferta.email && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Mail size={13} /> {oferta.email}
                                </div>
                              )}
                              {oferta.salario && (
                                <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                  <DollarSign size={13} /> {oferta.salario}
                                </div>
                              )}
                              {oferta.ubicacion && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <MapPin size={13} /> {oferta.ubicacion}
                                </div>
                              )}
                            </div>

                            {oferta.motivoRechazo && oferta.estado === 'rechazado' && (
                              <div className="mt-3 p-3 bg-red-50 rounded-xl flex items-start gap-2">
                                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-red-700">Motivo de rechazo:</p>
                                  <p className="text-xs text-red-600">{oferta.motivoRechazo}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción */}
                        {oferta.estado === 'pendiente' && (
                          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => handleAprobar(oferta.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium transition"
                            >
                              <CheckCircle size={16} /> Aprobar
                            </button>
                            <button
                              onClick={() => abrirModalRechazo(oferta)}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium transition"
                            >
                              <XCircle size={16} /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── Paginación ────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Mostrando {ofertas.length} de {totalItems} ofertas
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cambiarPagina(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => cambiarPagina(currentPage + 1)}
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

        {/* ─── Modal de rechazo ──────────────────────────────────────────── */}
        {showModal && selectedOferta && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <XCircle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Rechazar oferta</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                ¿Por qué quieres rechazar "{selectedOferta.titulo}"?
              </p>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Escribe el motivo del rechazo..."
                rows="4"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOferta(null);
                    setMotivoRechazo('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRechazar}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition"
                >
                  Rechazar oferta
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}