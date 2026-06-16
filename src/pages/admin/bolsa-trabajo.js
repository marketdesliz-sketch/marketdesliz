// src/pages/admin/bolsa-trabajo.js
import { useEffect, useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';

export default function AdminBolsaTrabajoPage() {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendiente');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [selectedOferta, setSelectedOferta] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('bolsa_trabajo').getFullList({
        sort: '-created',
        expand: 'userId'
      });
      setOfertas(records);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const aprobar = async (id) => {
    try {
      await pb.collection('bolsa_trabajo').update(id, {
        estado: 'aprobado',
        fechaRevision: new Date().toISOString(),
        revisadoPor: pb.authStore.model?.id
      });
      
      const oferta = ofertas.find(o => o.id === id);
      if (oferta?.userId) {
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
      
      cargarOfertas();
      setShowModal(false);
      setSelectedOferta(null);
      setMotivoRechazo('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar');
    }
  };

  const rechazar = async (id) => {
    if (!motivoRechazo) {
      alert('Escribe el motivo del rechazo');
      return;
    }

    try {
      await pb.collection('bolsa_trabajo').update(id, {
        estado: 'rechazado',
        motivoRechazo: motivoRechazo,
        fechaRevision: new Date().toISOString(),
        revisadoPor: pb.authStore.model?.id
      });
      
      setMotivoRechazo('');
      setShowModal(false);
      setSelectedOferta(null);
      cargarOfertas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al rechazar');
    }
  };

  const abrirModal = (oferta) => {
    setSelectedOferta(oferta);
    setMotivoRechazo('');
    setShowModal(true);
  };

  const getOfertasFiltradas = () => {
    if (filtro === 'todas') return ofertas;
    return ofertas.filter(o => o.estado === filtro);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getEstadoConfig = (estado) => {
    switch(estado) {
      case 'pendiente':
        return { icono: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pendiente' };
      case 'aprobado':
        return { icono: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Aprobado' };
      case 'rechazado':
        return { icono: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rechazado' };
      default:
        return { icono: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: estado };
    }
  };

  const estadisticas = {
    pendiente: ofertas.filter(o => o.estado === 'pendiente').length,
    aprobado: ofertas.filter(o => o.estado === 'aprobado').length,
    rechazado: ofertas.filter(o => o.estado === 'rechazado').length,
    total: ofertas.length
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

  const ofertasFiltradas = getOfertasFiltradas();

  return (
    <>
      <Head>
        <title>Revisar Bolsa de Trabajo | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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

          {/* Filtros */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { id: 'pendiente', label: 'Pendientes', icono: Clock, color: 'yellow' },
              { id: 'aprobado', label: 'Aprobadas', icono: CheckCircle, color: 'green' },
              { id: 'rechazado', label: 'Rechazadas', icono: XCircle, color: 'red' },
              { id: 'todas', label: 'Todas', icono: Briefcase, color: 'purple' }
            ].map(f => {
              const Icono = f.icono;
              const isActive = filtro === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? `bg-${f.color}-500 text-white shadow-sm` 
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icono size={14} /> {f.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ofertas.filter(o => f.id === 'todas' ? true : o.estado === f.id).length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lista de ofertas */}
          {ofertasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay ofertas</h3>
              <p className="text-sm text-gray-400">No hay ofertas en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ofertasFiltradas.map((oferta) => {
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
                            onClick={() => aprobar(oferta.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium transition"
                          >
                            <CheckCircle size={16} /> Aprobar
                          </button>
                          <button
                            onClick={() => abrirModal(oferta)}
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
          )}
        </div>

        {/* Modal de rechazo */}
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
                  onClick={() => rechazar(selectedOferta.id)}
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