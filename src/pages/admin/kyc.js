// src/pages/admin/kyc.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Eye,
  AlertCircle,
  User,
  CreditCard,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  Info,
  RefreshCw,
  ChevronLeft
} from 'lucide-react';
import AdminLayoutMinimal from '../../layouts/AdminLayoutMinimal';
import pb from '../../lib/pocketbase';
import { getKYCRequests, getKYCStats, reviewKYC } from '../../lib/kycService';
import { formatDate, formatDateTime } from '../../lib/utils';

const ITEMS_PER_PAGE = 10;

export default function AdminKYCPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const { page = 1, estado = 'pendientes', search = '', sort = '-created' } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({
    pendientes: 0,
    aprobadosHoy: 0,
    rechazados: 0,
    total: 0
  });

  const [selectedKYC, setSelectedKYC] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Estadísticas (solo en carga inicial)
      if (!showRefreshing) {
        const statsData = await getKYCStats();
        setStats(statsData);
      }

      // Lista de solicitudes KYC
      const result = await getKYCRequests({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: search || '',
        estado: estado || 'pendientes',
        sort: sort || '-created'
      });

      setKycList(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error cargando KYC:', err);
      setError('No se pudieron cargar las solicitudes. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, estado, search, sort]);

  // ─── Efecto de carga ──────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Actualizar URL con filtros ──────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      estado: estado !== 'pendientes' ? estado : undefined,
      search: search || undefined,
      sort: sort !== '-created' ? sort : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/kyc', query }, undefined, { shallow: true });
  }, [currentPage, estado, search, sort, router]);

  // ─── Manejadores de eventos ──────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    actualizarURL({ search: term, page: 1 });
  };

  const handleTabChange = (newEstado) => {
    actualizarURL({ estado: newEstado, page: 1 });
  };

  const handleSortChange = (newSort) => {
    actualizarURL({ sort: newSort, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    actualizarURL({ page: newPage });
  };

  // ─── Acciones de aprobación/rechazo (usando reviewKYC) ─────────────
  const handleApprove = async (kycId) => {
    try {
      await reviewKYC(kycId, 'aprobado', '');
      await cargarDatos(true);
      setShowModal(false);
      setSelectedKYC(null);
    } catch (error) {
      console.error('Error aprobando:', error);
      alert('Error al aprobar la solicitud');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Debes especificar el motivo del rechazo');
      return;
    }
    try {
      await reviewKYC(selectedKYC.id, 'rechazado', rejectReason);
      await cargarDatos(true);
      setShowModal(false);
      setSelectedKYC(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rechazando:', error);
      alert('Error al rechazar la solicitud');
    }
  };

  // ─── Utilidades ──────────────────────────────────────────────────────
  const getImageUrl = (record, filename) => {
    if (!filename) return null;
    return pb.files.getURL(record, filename);
  };

  const getEstadoConfig = (estado) => {
    const configs = {
      pendiente: { icono: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pendiente' },
      aprobado: { icono: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', label: 'Aprobado' },
      rechazado: { icono: XCircle, bg: 'bg-red-50', text: 'text-red-700', label: 'Rechazado' }
    };
    return configs[estado] || configs.pendiente;
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading && !refreshing) {
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
        <title>Revisión KYC | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-7xl mx-auto">

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Revisión KYC</h1>
                  <p className="text-sm text-gray-500">Verifica los documentos de identidad de los clientes</p>
                </div>
              </div>
              <button
                onClick={() => cargarDatos(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>

          {/* ─── Stats Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Clock size={18} className="text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.pendientes}</span>
              </div>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">{stats.aprobadosHoy}</span>
              </div>
              <p className="text-xs text-gray-500">Aprobados hoy</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <XCircle size={18} className="text-red-500" />
                <span className="text-2xl font-bold text-red-600">{stats.rechazados}</span>
              </div>
              <p className="text-xs text-gray-500">Rechazados</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Users size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total solicitudes</p>
            </div>
          </div>

          {/* ─── Búsqueda y tabs ────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                  placeholder="Buscar por nombre o teléfono..."
                />
              </form>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'pendientes', label: 'Pendientes', icon: Clock, color: 'yellow', count: stats.pendientes },
                  { id: 'aprobados', label: 'Aprobados', icon: CheckCircle, color: 'green', count: stats.aprobadosHoy },
                  { id: 'rechazados', label: 'Rechazados', icon: XCircle, color: 'red', count: stats.rechazados }
                ].map(tab => {
                  const Icono = tab.icon;
                  const isActive = estado === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? `bg-${tab.color}-500 text-white shadow-sm`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icono size={14} /> {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="relative">
                <select
                  className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-[#6C3BFF]"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="-created">Más recientes</option>
                  <option value="created">Más antiguos</option>
                  <option value="fechaEnvio">Por fecha de envío</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Error ──────────────────────────────────────────────────── */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => cargarDatos()}
                className="ml-auto text-sm font-medium hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* ─── Listado ────────────────────────────────────────────────── */}
          {kycList.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay solicitudes</h3>
              <p className="text-sm text-gray-400">No hay solicitudes en esta categoría</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {kycList.map((kyc) => {
                  const estadoConfig = getEstadoConfig(kyc.estado);
                  const EstadoIcono = estadoConfig.icono;
                  const isPending = kyc.estado === 'pendiente';

                  return (
                    <div key={kyc.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-200 ${
                      isPending ? 'border-yellow-200 bg-yellow-50/30' :
                      kyc.estado === 'aprobado' ? 'border-green-200 bg-green-50/30' :
                      'border-red-200 bg-red-50/30'
                    }`}>
                      <div className="p-5">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="font-bold text-gray-900 text-lg">
                                {kyc.expand?.userId?.nombre || 'Cliente'}
                              </h3>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                                <EstadoIcono size={10} /> {estadoConfig.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Phone size={12} /> {kyc.expand?.userId?.telefono || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {formatDate(kyc.fechaEnvio || kyc.created)}
                              </span>
                            </div>
                            {kyc.estado === 'rechazado' && kyc.motivoRechazo && (
                              <div className="mt-2 p-2 bg-red-100/50 rounded-lg">
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle size={12} /> Motivo: {kyc.motivoRechazo}
                                </p>
                              </div>
                            )}
                          </div>

                          {isPending && (
                            <button
                              onClick={() => {
                                setSelectedKYC(kyc);
                                setRejectReason('');
                                setShowModal(true);
                              }}
                              className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
                            >
                              <Eye size={14} /> Revisar
                            </button>
                          )}

                          {kyc.estado === 'aprobado' && kyc.fechaRevision && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Aprobado el</p>
                              <p className="text-xs font-medium text-green-600">
                                {formatDate(kyc.fechaRevision)}
                              </p>
                            </div>
                          )}
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
                    Mostrando {kycList.length} de {totalItems} solicitudes
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

        {/* ─── Modal de revisión ────────────────────────────────────────── */}
        {showModal && selectedKYC && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={16} className="text-[#6C3BFF]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Revisar documentos</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>

              <div className="p-6">
                {/* Información del cliente */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User size={16} /> Datos del cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{selectedKYC.expand?.userId?.nombre}</span></div>
                    <div><span className="text-gray-500">Teléfono:</span> <span>{selectedKYC.expand?.userId?.telefono}</span></div>
                    <div className="col-span-2"><span className="text-gray-500">Fecha de envío:</span> <span>{formatDate(selectedKYC.fechaEnvio || selectedKYC.created)}</span></div>
                  </div>
                </div>

                {/* Documentos */}
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText size={16} /> Documentos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {selectedKYC.idFront && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <img
                        src={getImageUrl(selectedKYC, selectedKYC.idFront)}
                        alt="INE Frontal"
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          setSelectedImage(getImageUrl(selectedKYC, selectedKYC.idFront));
                          setShowImageModal(true);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">INE Frontal</p>
                    </div>
                  )}
                  {selectedKYC.idBack && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <img
                        src={getImageUrl(selectedKYC, selectedKYC.idBack)}
                        alt="INE Trasera"
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          setSelectedImage(getImageUrl(selectedKYC, selectedKYC.idBack));
                          setShowImageModal(true);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">INE Trasera</p>
                    </div>
                  )}
                  {selectedKYC.foto && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <img
                        src={getImageUrl(selectedKYC, selectedKYC.foto)}
                        alt="Selfie"
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          setSelectedImage(getImageUrl(selectedKYC, selectedKYC.foto));
                          setShowImageModal(true);
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">Selfie</p>
                    </div>
                  )}
                </div>

                {/* Motivo de rechazo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de rechazo (si aplica)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows="3"
                    placeholder="Ej: Documento ilegible, no coincide la foto..."
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedKYC.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
                  >
                    <CheckCircle size={16} /> Aprobar
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition"
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full mt-3 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Modal de imagen ampliada ─────────────────────────────────── */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <img src={selectedImage} alt="Documento" className="w-full rounded-lg" />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-lg flex items-center justify-center text-white hover:bg-black/70 transition"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </AdminLayoutMinimal>
    </>
  );
}