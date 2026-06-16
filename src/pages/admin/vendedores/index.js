// src/pages/admin/vendedores/index.js - ACTUALIZADO
import { useEffect, useState } from 'react';
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
  MoreVertical
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import pb from '../../../lib/pocketbase';

export default function AdminVendedoresPage() {
  const router = useRouter();
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

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
        pb.authStore.clear();
        router.push('/admin/login');
        return;
      }

      await cargarVendedores();

    } catch (error) {
      console.error('Error en verificación:', error);
      router.push('/admin/login');
    }
  };

  const cargarVendedores = async () => {
    try {
      setLoading(true);
      setError('');

      const vendedoresData = await pb.collection('vendedores').getFullList({
        sort: '-created',
        expand: 'userId'
      });

      const vendedoresConDatos = vendedoresData.map(v => ({
        ...v,
        nombre: v.expand?.userId?.nombre || 'Sin nombre',
        email: v.expand?.userId?.email || 'Sin email',
        telefono: v.expand?.userId?.telefono || 'Sin teléfono'
      }));

      setVendedores(vendedoresConDatos);

    } catch (error) {
      console.error('Error cargando vendedores:', error);
      setError('Error al cargar los vendedores');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (vendedorId, activo) => {
    try {
      await pb.collection('vendedores').update(vendedorId, {
        activo: !activo
      });
      await cargarVendedores();
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

  const vendedoresFiltrados = vendedores.filter(v => {
    const matchesSearch = searchTerm === '' ||
      v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.telefono?.includes(searchTerm) ||
      v.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'todos') return matchesSearch;
    if (filterStatus === 'activos') return matchesSearch && v.activo === true;
    if (filterStatus === 'inactivos') return matchesSearch && v.activo === false;
    return matchesSearch;
  });

  const estadisticas = {
    total: vendedores.length,
    activos: vendedores.filter(v => v.activo === true).length,
    inactivos: vendedores.filter(v => v.activo === false).length,
    comisionPromedio: vendedores.length > 0
      ? Math.round(vendedores.reduce((sum, v) => sum + (v.comisionPorcentaje || 0), 0) / vendedores.length)
      : 0
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
        <title>Vendedores | MarketDesliz Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
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

          {/* Stats Cards */}
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

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                  placeholder="Buscar por nombre, email, teléfono o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'todos', label: 'Todos', icon: Users, color: 'purple' },
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

          {/* Tabla de vendedores */}
          {vendedoresFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay vendedores registrados</h3>
              <p className="text-sm text-gray-400 mb-4">Comienza creando tu primer vendedor</p>
              <Link
                href="/admin/vendedores/crear"
                className="inline-flex items-center gap-2 text-[#6C3BFF] hover:underline text-sm"
              >
                <Plus size={14} /> Crear nuevo vendedor
              </Link>
            </div>
          ) : (
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
                    {vendedoresFiltrados.map((v, index) => (
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
          )}

          {/* Información adicional */}
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
      </AdminLayout>
    </>
  );
}