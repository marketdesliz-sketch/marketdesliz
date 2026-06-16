// src/pages/admin/kyc.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
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
  Info
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';

export default function AdminKYCPage() {
  const [pendientes, setPendientes] = useState([]);
  const [aprobados, setAprobados] = useState([]);
  const [rechazados, setRechazados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pendientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    cargarKYC();
  }, []);

  const cargarKYC = async () => {
    try {
      setLoading(true);

      const pendientes = await pb.collection('kyc_verifications').getFullList({
        filter: 'estado = "pendiente"',
        expand: 'userId',
        sort: 'fechaEnvio'
      });

      const aprobados = await pb.collection('kyc_verifications').getFullList({
        filter: 'estado = "aprobado"',
        expand: 'userId',
        sort: '-fechaEnvio',
        limit: 20
      });

      const rechazados = await pb.collection('kyc_verifications').getFullList({
        filter: 'estado = "rechazado"',
        expand: 'userId',
        sort: '-fechaEnvio',
        limit: 20
      });

      setPendientes(pendientes);
      setAprobados(aprobados);
      setRechazados(rechazados);

    } catch (error) {
      console.error('Error cargando KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientAddress = async (userId) => {
    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `userId = "${userId}"`
      );
      const direccionCompleta = [
        clientRecord.direccionCalle,
        clientRecord.direccionNumero,
        clientRecord.direccionColonia,
        clientRecord.direccionCiudad
      ].filter(Boolean).join(', ');
      return direccionCompleta || 'Sin dirección registrada';
    } catch (error) {
      return 'Sin dirección registrada';
    }
  };

  const handleApprove = async (kycId) => {
    try {
      await pb.collection('kyc_verifications').update(kycId, {
        estado: 'aprobado',
        fechaActualizacion: new Date().toISOString(),
        fechaRevision: new Date().toISOString(),
        revisadoPor: pb.authStore.model?.id
      });

      cargarKYC();
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReject = async (kycId) => {
    if (!rejectReason) {
      alert('Debes especificar el motivo del rechazo');
      return;
    }

    try {
      await pb.collection('kyc_verifications').update(kycId, {
        estado: 'rechazado',
        motivoRechazo: rejectReason,
        fechaActualizacion: new Date().toISOString(),
        fechaRevision: new Date().toISOString(),
        revisadoPor: pb.authStore.model?.id
      });

      cargarKYC();
      setShowModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getImageUrl = (record, filename) => {
    if (!filename) return null;
    return pb.files.getURL(record, filename);
  };

  const [clientAddresses, setClientAddresses] = useState({});

  useEffect(() => {
    const loadAddresses = async () => {
      if (selectedKYC?.expand?.userId?.id) {
        const address = await getClientAddress(selectedKYC.expand.userId.id);
        setClientAddresses(prev => ({ ...prev, [selectedKYC.id]: address }));
      }
    };
    if (selectedKYC) {
      loadAddresses();
    }
  }, [selectedKYC]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredList = () => {
    let list = [];
    if (activeTab === 'pendientes') list = pendientes;
    else if (activeTab === 'aprobados') list = aprobados;
    else list = rechazados;

    if (searchTerm === '') return list;
    
    return list.filter(item => 
      item.expand?.userId?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.expand?.userId?.telefono?.includes(searchTerm)
    );
  };

  const estadisticas = {
    pendientes: pendientes.length,
    aprobadosHoy: aprobados.filter(a => 
      new Date(a.fechaActualizacion || a.fechaRevision).toDateString() === new Date().toDateString()
    ).length,
    rechazados: rechazados.length,
    total: pendientes.length + aprobados.length + rechazados.length
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const filteredList = getFilteredList();

  return (
    <>
      <Head>
        <title>Revisión KYC | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Revisión KYC</h1>
                <p className="text-sm text-gray-500">Verifica los documentos de identidad de los clientes</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Clock size={18} className="text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.pendientes}</span>
              </div>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">{estadisticas.aprobadosHoy}</span>
              </div>
              <p className="text-xs text-gray-500">Aprobados hoy</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <XCircle size={18} className="text-red-500" />
                <span className="text-2xl font-bold text-red-600">{estadisticas.rechazados}</span>
              </div>
              <p className="text-xs text-gray-500">Rechazados</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Users size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total solicitudes</p>
            </div>
          </div>

          {/* Search and Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'pendientes', label: 'Pendientes', icon: Clock, color: 'yellow', count: pendientes.length },
                  { id: 'aprobados', label: 'Aprobados', icon: CheckCircle, color: 'green', count: aprobados.length },
                  { id: 'rechazados', label: 'Rechazados', icon: XCircle, color: 'red', count: rechazados.length }
                ].map(tab => {
                  const Icono = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
            </div>
          </div>

          {/* Listado */}
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay solicitudes</h3>
              <p className="text-sm text-gray-400">No hay solicitudes en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((kyc) => {
                const isPending = kyc.estado === 'pendiente';
                const isApproved = kyc.estado === 'aprobado';
                const isRejected = kyc.estado === 'rechazado';
                
                return (
                  <div key={kyc.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-200 ${
                    isPending ? 'border-yellow-200 bg-yellow-50/30' : 
                    isApproved ? 'border-green-200 bg-green-50/30' : 
                    'border-red-200 bg-red-50/30'
                  }`}>
                    <div className="p-5">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{kyc.expand?.userId?.nombre || 'Cliente'}</h3>
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                <Clock size={10} /> Pendiente
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle size={10} /> Aprobado
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle size={10} /> Rechazado
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Phone size={12} /> {kyc.expand?.userId?.telefono || 'N/A'}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(kyc.fechaEnvio || kyc.created)}</span>
                          </div>
                          
                          {isRejected && kyc.motivoRechazo && (
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
                              setShowModal(true);
                              setRejectReason('');
                            }}
                            className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
                          >
                            <Eye size={14} /> Revisar
                          </button>
                        )}
                        
                        {isApproved && kyc.fechaRevision && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Aprobado el</p>
                            <p className="text-xs font-medium text-green-600">{formatDate(kyc.fechaRevision)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de revisión de documentos */}
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
                    <div className="col-span-2"><span className="text-gray-500">Dirección:</span> <span>{clientAddresses[selectedKYC.id] || 'Cargando...'}</span></div>
                    <div><span className="text-gray-500">Fecha de envío:</span> <span>{formatDate(selectedKYC.fechaEnvio || selectedKYC.created)}</span></div>
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
                    onClick={() => handleReject(selectedKYC.id)}
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

        {/* Modal para ver imagen ampliada */}
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
      </AdminLayout>
    </>
  );
}