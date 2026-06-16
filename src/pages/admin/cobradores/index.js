// src/pages/admin/cobradores/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Bike,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
  Save,
  X,
  Wallet,
  TrendingUp,
  Hash
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import pb from '../../../lib/pocketbase';

export default function AdminCobradoresPage() {
  const router = useRouter();
  const [cobradores, setCobradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  const [showModal, setShowModal] = useState(false);
  const [editingCobrador, setEditingCobrador] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCobrador, setSelectedCobrador] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    zona: '',
    vehiculo: 'moto',
    activo: true
  });

  useEffect(() => {
    verificarAdmin();
  }, []);

  const verificarAdmin = async () => {
    try {
      if (!pb.authStore.isValid) {
        router.push('/admin/login');
        return;
      }
      const user = pb.authStore.model;
      if (user?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      await cargarCobradores();
    } catch (error) {
      console.error('Error en verificación:', error);
      router.push('/admin/login');
    }
  };

  const cargarCobradores = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await pb.collection('cobradores').getFullList({
        sort: '-created',
        expand: 'userId'
      });

      const cobradoresConDatos = await Promise.all(
        data.map(async (c) => {
          let cobrosAsignados = 0;
          let cobrosCompletados = 0;

          try {
            const cobros = await pb.collection('cobros').getFullList({
              filter: `cobradorId = "${c.id}"`
            });
            cobrosAsignados = cobros.length;
            cobrosCompletados = cobros.filter(cb => cb.estado === 'completado').length;
          } catch (e) {
            // colección cobros puede no tener registros aún
          }

          return {
            ...c,
            nombre: c.nombre || c.expand?.userId?.nombre || 'Sin nombre',
            telefono: c.telefono || c.expand?.userId?.telefono || 'N/A',
            cobrosAsignados,
            cobrosCompletados
          };
        })
      );

      setCobradores(cobradoresConDatos);
    } catch (error) {
      console.error('Error cargando cobradores:', error);
      setError('Error al cargar los cobradores');
    } finally {
      setLoading(false);
    }
  };

  const generarCodigo = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'COB-';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  };

  const openCreateModal = () => {
    setEditingCobrador(null);
    setFormData({
      nombre: '',
      telefono: '',
      zona: '',
      vehiculo: 'moto',
      activo: true
    });
    setShowModal(true);
  };

  const openEditModal = (cobrador) => {
    setEditingCobrador(cobrador);
    setFormData({
      nombre: cobrador.nombre || '',
      telefono: cobrador.telefono || '',
      zona: cobrador.zona || '',
      vehiculo: cobrador.vehiculo || 'moto',
      activo: cobrador.activo !== false
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.telefono) {
      setError('Nombre y teléfono son requeridos');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingCobrador) {
        await pb.collection('cobradores').update(editingCobrador.id, {
          nombre: formData.nombre,
          telefono: formData.telefono,
          zona: formData.zona,
          vehiculo: formData.vehiculo,
          activo: formData.activo
        });
      } else {
        await pb.collection('cobradores').create({
          nombre: formData.nombre,
          telefono: formData.telefono,
          zona: formData.zona,
          vehiculo: formData.vehiculo,
          activo: formData.activo,
          codigo: generarCodigo(),
          totalCobros: 0
        });
      }

      setShowModal(false);
      await cargarCobradores();
    } catch (error) {
      console.error('Error guardando cobrador:', error);
      setError(error.message || 'Error al guardar el cobrador');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (cobrador) => {
    try {
      await pb.collection('cobradores').update(cobrador.id, {
        activo: !cobrador.activo
      });
      await cargarCobradores();
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cambiar el estado del cobrador');
    }
  };

  const handleDelete = async () => {
    if (!selectedCobrador) return;

    try {
      await pb.collection('cobradores').delete(selectedCobrador.id);
      setShowDeleteConfirm(false);
      setSelectedCobrador(null);
      await cargarCobradores();
    } catch (error) {
      console.error('Error eliminando cobrador:', error);
      setError('Error al eliminar el cobrador');
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

  const getVehiculoLabel = (vehiculo) => {
    const labels = {
      moto: 'Motocicleta',
      bici: 'Bicicleta',
      auto: 'Automóvil',
      pie: 'A pie'
    };
    return labels[vehiculo] || vehiculo || 'No especificado';
  };

  const cobradoresFiltrados = cobradores.filter(c => {
    const matchesSearch = searchTerm === '' ||
      c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono?.includes(searchTerm) ||
      c.zona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'todos') return matchesSearch;
    if (filterStatus === 'activos') return matchesSearch && c.activo !== false;
    if (filterStatus === 'inactivos') return matchesSearch && c.activo === false;
    return matchesSearch;
  });

  const estadisticas = {
    total: cobradores.length,
    activos: cobradores.filter(c => c.activo !== false).length,
    inactivos: cobradores.filter(c => c.activo === false).length,
    cobrosAsignados: cobradores.reduce((sum, c) => sum + (c.cobrosAsignados || 0), 0)
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

  return (
    <>
      <Head>
        <title>Cobradores | Admin MarketDesliz</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <Bike size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Cobradores</h1>
                  <p className="text-sm text-gray-500">Administra el equipo de cobranza en campo</p>
                </div>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition shadow-sm"
              >
                <UserPlus size={16} /> Nuevo cobrador
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Bike size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total cobradores</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">{estadisticas.activos}</span>
              </div>
              <p className="text-xs text-gray-500">Activos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <XCircle size={18} className="text-gray-400" />
                <span className="text-2xl font-bold text-gray-600">{estadisticas.inactivos}</span>
              </div>
              <p className="text-xs text-gray-500">Inactivos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Wallet size={18} className="text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.cobrosAsignados}</span>
              </div>
              <p className="text-xs text-gray-500">Cobros asignados</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                  placeholder="Buscar por nombre, teléfono, zona o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'todos', label: 'Todos', icon: Bike, color: 'purple' },
                  { id: 'activos', label: 'Activos', icon: CheckCircle, color: 'green' },
                  { id: 'inactivos', label: 'Inactivos', icon: XCircle, color: 'red' }
                ].map(f => {
                  const Icono = f.icon;
                  const isActive = filterStatus === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilterStatus(f.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? `bg-${f.color}-500 text-white shadow-sm`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icono size={14} /> {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Lista de cobradores */}
          {cobradoresFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bike size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay cobradores registrados</h3>
              <p className="text-sm text-gray-400 mb-4">Comienza agregando tu primer cobrador</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 text-[#6C3BFF] hover:underline text-sm"
              >
                <UserPlus size={14} /> Crear nuevo cobrador
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zona</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehículo</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cobros</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cobradoresFiltrados.map((c, index) => (
                      <tr key={c.id} className={`hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-5 py-3">
                          <code className="text-xs font-mono font-medium text-gray-600 flex items-center gap-1">
                            <Hash size={10} /> {c.codigo || '—'}
                          </code>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-gray-900">{c.nombre}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={12} /> {c.telefono}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> {c.zona || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-500">{getVehiculoLabel(c.vehiculo)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <TrendingUp size={10} /> {c.cobrosCompletados}/{c.cobrosAsignados}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {formatDate(c.created)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => toggleActivo(c)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition ${
                              c.activo !== false
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {c.activo !== false ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {c.activo !== false ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(c)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1"
                            >
                              <Edit size={12} /> Editar
                            </button>
                            <button
                              onClick={() => { setSelectedCobrador(c); setShowDeleteConfirm(true); }}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Bike size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Información sobre cobradores</p>
                <p className="text-sm text-blue-600">
                  Los cobradores reciben tareas de cobro asignadas según su zona. Cada cobro se completa escaneando
                  el código QR del cliente y confirmando el monto pagado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de creación/edición */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                    <Bike size={16} className="text-[#6C3BFF]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingCobrador ? 'Editar cobrador' : 'Nuevo cobrador'}
                  </h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zona asignada</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="zona"
                      value={formData.zona}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      placeholder="Norte, Centro, Sur, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo</label>
                  <select
                    name="vehiculo"
                    value={formData.vehiculo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent appearance-none"
                  >
                    <option value="moto">Motocicleta</option>
                    <option value="bici">Bicicleta</option>
                    <option value="auto">Automóvil</option>
                    <option value="pie">A pie</option>
                  </select>
                </div>

                {editingCobrador && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="activo"
                      id="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#6C3BFF] rounded"
                    />
                    <label htmlFor="activo" className="text-sm text-gray-700">Cobrador activo</label>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={16} /> {editingCobrador ? 'Guardar cambios' : 'Crear cobrador'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    <X size={16} /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && selectedCobrador && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={28} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar cobrador</h3>
                <p className="text-gray-500 mb-4">
                  ¿Estás seguro de que deseas eliminar a <strong className="text-gray-900">{selectedCobrador.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setSelectedCobrador(null); }}
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