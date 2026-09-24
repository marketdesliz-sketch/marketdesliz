// src/pages/admin/kyc.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ShieldCheck, CheckCircle, XCircle, Clock, Users, Calendar,
  Phone, MapPin, FileText, Eye, AlertCircle, User, CreditCard,
  Search, Filter, Download, Printer, ChevronRight, Info,
  RefreshCw, ChevronLeft
} from 'lucide-react';
import AdminLayoutMinimal from '../../layouts/AdminLayoutMinimal';
import pb from '../../lib/pocketbase';
import { getKYCRequests, getKYCStats, reviewKYC } from '../../lib/kycService';
import { formatDate, formatDateTime } from '../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

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

      if (!showRefreshing) {
        const statsData = await getKYCStats();
        setStats(statsData);
      }

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

  // ─── Manejadores ──────────────────────────────────────────────────────
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

  if (loading && !refreshing) {
    return (
      <AdminLayoutMinimal>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ─── Header ───────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={22} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Revisión KYC</h1>
                  <p className="text-sm text-muted-foreground">Verifica los documentos de identidad de los clientes</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => cargarDatos(true)}
                disabled={refreshing}
                className="rounded-2xl h-10 border-gray-200 text-gray-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>

          {/* ─── Stats Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Clock size={18} className="text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">{stats.pendientes}</span>
                </div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle size={18} className="text-green-500" />
                  <span className="text-2xl font-bold text-green-600">{stats.aprobadosHoy}</span>
                </div>
                <p className="text-xs text-muted-foreground">Aprobados hoy</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <XCircle size={18} className="text-red-500" />
                  <span className="text-2xl font-bold text-red-600">{stats.rechazados}</span>
                </div>
                <p className="text-xs text-muted-foreground">Rechazados</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Users size={18} className="text-primary" />
                  <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total solicitudes</p>
              </CardContent>
            </Card>
          </div>

          {/* ─── Búsqueda y tabs ──────────────────────────────────── */}
          <Card className="border-none shadow-sm rounded-2xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
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
                    const activeClasses = {
                      yellow: 'bg-yellow-500 text-white shadow-sm',
                      green: 'bg-green-500 text-white shadow-sm',
                      red: 'bg-red-500 text-white shadow-sm'
                    };
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          isActive ? activeClasses[tab.color] : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
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
                    className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="-created">Más recientes</option>
                    <option value="created">Más antiguos</option>
                    <option value="fechaEnvio">Por fecha de envío</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Error ────────────────────────────────────────────── */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700">
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

          {/* ─── Listado ──────────────────────────────────────────── */}
          {kycList.length === 0 && !loading ? (
            <Card className="border-none shadow-sm rounded-2xl p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay solicitudes</h3>
              <p className="text-sm text-muted-foreground">No hay solicitudes en esta categoría</p>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {kycList.map((kyc) => {
                  const estadoConfig = getEstadoConfig(kyc.estado);
                  const EstadoIcono = estadoConfig.icono;
                  const isPending = kyc.estado === 'pendiente';

                  return (
                    <Card
                      key={kyc.id}
                      className={`border shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow ${
                        isPending ? 'border-yellow-100 bg-yellow-50/30' :
                        kyc.estado === 'aprobado' ? 'border-green-100 bg-green-50/30' :
                        'border-red-100 bg-red-50/30'
                      }`}
                    >
                      <CardContent className="p-5">
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
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone size={12} /> {kyc.expand?.userId?.telefono || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {formatDate(kyc.fechaEnvio || kyc.created)}
                              </span>
                            </div>
                            {kyc.estado === 'rechazado' && kyc.motivoRechazo && (
                              <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle size={12} /> Motivo: {kyc.motivoRechazo}
                                </p>
                              </div>
                            )}
                          </div>

                          {isPending && (
                            <Button
                              onClick={() => {
                                setSelectedKYC(kyc);
                                setRejectReason('');
                                setShowModal(true);
                              }}
                              className="rounded-2xl h-10 bg-primary hover:bg-primary/90 font-semibold"
                            >
                              <Eye className="w-4 h-4 mr-2" /> Revisar
                            </Button>
                          )}

                          {kyc.estado === 'aprobado' && kyc.fechaRevision && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Aprobado el</p>
                              <p className="text-xs font-medium text-green-600">
                                {formatDate(kyc.fechaRevision)}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* ─── Paginación ──────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {kycList.length} de {totalItems} solicitudes
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-2xl h-10 border-gray-200 text-gray-600 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                    </Button>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-2xl h-10 border-gray-200 text-gray-600 disabled:opacity-40"
                    >
                      Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Modal de revisión ───────────────────────────────────── */}
        {showModal && selectedKYC && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={16} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Revisar documentos</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                  ×
                </button>
              </div>

              <div className="p-6">
                {/* Info cliente */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User size={16} className="text-primary" /> Datos del cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{selectedKYC.expand?.userId?.nombre}</span></div>
                    <div><span className="text-muted-foreground">Teléfono:</span> <span>{selectedKYC.expand?.userId?.telefono}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Fecha de envío:</span> <span>{formatDate(selectedKYC.fechaEnvio || selectedKYC.created)}</span></div>
                  </div>
                </div>

                {/* Documentos */}
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-primary" /> Documentos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {selectedKYC.idFront && (
                    <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                      <img
                        src={getImageUrl(selectedKYC, selectedKYC.idFront)}
                        alt="INE Frontal"
                        className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          setSelectedImage(getImageUrl(selectedKYC, selectedKYC.idFront));
                          setShowImageModal(true);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">INE Frontal</p>
                    </div>
                  )}
                  {selectedKYC.idBack && (
                    <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                      <img
                        src={getImageUrl(selectedKYC, selectedKYC.idBack)}
                        alt="INE Trasera"
                        className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          setSelectedImage(getImageUrl(selectedKYC, selectedKYC.idBack));
                          setShowImageModal(true);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">INE Trasera</p>
                    </div>
                  )}
                  {selectedKYC.foto && (
                    <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                      <img
                        src={getImageUrl(selectedKYC, selectedKYC.foto)}
                        alt="Selfie"
                        className="w-full h-32 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                        onClick={() => {
                          setSelectedImage(getImageUrl(selectedKYC, selectedKYC.foto));
                          setShowImageModal(true);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">Selfie</p>
                    </div>
                  )}
                </div>

                {/* Motivo rechazo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de rechazo (si aplica)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm transition"
                    rows="3"
                    placeholder="Ej: Documento ilegible, no coincide la foto..."
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(selectedKYC.id)}
                    className="flex-1 rounded-2xl h-12 bg-green-500 hover:bg-green-600 font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="flex-1 rounded-2xl h-12 bg-red-500 hover:bg-red-600 font-semibold"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Rechazar
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="w-full mt-3 rounded-2xl h-11 border-gray-200 text-gray-700"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Modal imagen ─────────────────────────────────────────── */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <img src={selectedImage} alt="Documento" className="w-full rounded-2xl" />
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