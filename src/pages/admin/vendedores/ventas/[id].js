// src/pages/admin/vendedores/ventas/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  Calendar,
  User,
  Phone,
  Eye,
  Download,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Search
} from 'lucide-react';
import AdminLayout from '../../../../layouts/AdminLayout';
import pb from '../../../../lib/pocketbase';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function VentasVendedorPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [vendedor, setVendedor] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    totalComision: 0,
    comisionPagada: 0,
    comisionPendiente: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Verificar autenticación
      if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }

      // Obtener vendedor con datos del usuario
      const vendedorData = await pb.collection('vendedores').getOne(id, {
        expand: 'userId'
      });

      if (!vendedorData) {
        setLoading(false);
        return;
      }

      setVendedor({
        ...vendedorData,
        nombre: vendedorData.expand?.userId?.nombre || 'Sin nombre',
        email: vendedorData.expand?.userId?.email || 'Sin email',
        telefono: vendedorData.expand?.userId?.telefono || 'Sin teléfono'
      });

      // Obtener estadísticas del vendedor
      const stats = await obtenerEstadisticasVendedor(id);
      setEstadisticas(stats);

      // Obtener ventas del vendedor
      const ventasData = await obtenerVentasVendedor(id);
      setVentas(ventasData);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadisticasVendedor = async (vendedorId) => {
    try {
      const vendedor = await pb.collection('vendedores').getOne(vendedorId);
      return {
        totalVentas: vendedor.totalVentas || 0,
        totalComision: vendedor.totalComisiones || 0,
        comisionPagada: (vendedor.totalComisiones || 0) - (vendedor.comisionesPendientes || 0),
        comisionPendiente: vendedor.comisionesPendientes || 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalVentas: 0,
        totalComision: 0,
        comisionPagada: 0,
        comisionPendiente: 0
      };
    }
  };

  const obtenerVentasVendedor = async (vendedorId) => {
    try {
      // Obtener solicitudes del vendedor
      const solicitudes = await pb.collection('solicitudes').getFullList({
        filter: `vendedorId = "${vendedorId}"`,
        expand: 'clienteId,productoId',
        sort: '-created'
      });

      // Transformar a formato de ventas
      return solicitudes.map(s => ({
        id: s.id,
        cliente: s.expand?.clienteId?.nombre || 'Cliente',
        clienteTelefono: s.expand?.clienteId?.telefono || 'Sin teléfono',
        producto: s.productoNombre || s.expand?.productoId?.nombre || 'Producto',
        montoTotal: s.totalPagar || 0,
        enganche: s.enganche || 0,
        comision: Math.round((s.enganche || 0) * 0.5),
        estado: s.estado,
        fecha: s.created,
        enganchePagado: s.enganchePagado || false
      }));
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      return [];
    }
  };

  const ventasFiltradas = ventas.filter(venta => {
    // Filtro por búsqueda
    if (searchTerm && !venta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !venta.producto.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Filtro por estado
    if (filterEstado !== 'todos') {
      if (filterEstado === 'completadas' && venta.estado !== 'completada') return false;
      if (filterEstado === 'pendientes' && venta.estado === 'completada') return false;
    }
    return true;
  });

  const totalComisionFiltrada = ventasFiltradas.reduce((sum, v) => sum + v.comision, 0);
  const totalVentasFiltradas = ventasFiltradas.length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!vendedor) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">Vendedor no encontrado</h3>
            <Link href="/admin/vendedores" className="text-[#6C3BFF] text-sm hover:underline">
              Volver a vendedores
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Ventas de {vendedor.nombre} | MarketDesliz Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/admin/vendedores/${id}`}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition mb-4"
            >
              <ArrowLeft size={14} /> Volver al vendedor
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
              <p className="text-sm text-gray-500">
                {vendedor.nombre} · Código: <code className="font-mono">{vendedor.codigo}</code>
              </p>
            </div>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalVentas}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={18} className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Comisión total</p>
                  <p className="text-2xl font-bold text-green-600">{formatMoney(estadisticas.totalComision)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign size={18} className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Comisión pagada</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatMoney(estadisticas.comisionPagada)}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-emerald-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Comisión pendiente</p>
                  <p className="text-2xl font-bold text-amber-600">{formatMoney(estadisticas.comisionPendiente)}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterEstado('todos')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterEstado === 'todos'
                        ? 'bg-[#6C3BFF] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilterEstado('completadas')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterEstado === 'completadas'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Completadas
                  </button>
                  <button
                    onClick={() => setFilterEstado('pendientes')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      filterEstado === 'pendientes'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pendientes
                  </button>
                </div>
                
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente o producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF]"
                  />
                </div>
              </div>
            </div>
            
            {/* Resumen filtrado */}
            <div className="px-4 py-3 bg-gray-50 rounded-b-2xl flex justify-between text-sm">
              <span className="text-gray-500">
                Mostrando <strong className="text-gray-700">{ventasFiltradas.length}</strong> de <strong className="text-gray-700">{ventas.length}</strong> ventas
              </span>
              <span className="text-gray-500">
                Comisión total: <strong className="text-green-600">{formatMoney(totalComisionFiltrada)}</strong>
              </span>
            </div>
          </div>

          {/* Tabla de ventas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enganche</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comisión</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                        <ShoppingBag size={32} className="mx-auto mb-3 text-gray-300" />
                        No hay ventas registradas
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((venta) => (
                      <tr key={venta.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(venta.fecha)}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{venta.cliente}</p>
                            <p className="text-xs text-gray-400">{venta.clienteTelefono}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{venta.producto}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-gray-900">{formatMoney(venta.enganche)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-green-600">{formatMoney(venta.comision)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            venta.estado === 'completada'
                              ? 'bg-green-100 text-green-700'
                              : venta.estado === 'vendedor_validado'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}>
                            {venta.estado === 'completada' ? '✅ Completada' :
                             venta.estado === 'vendedor_validado' ? '⏳ Validada' : '📋 Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/admin/solicitudes/${venta.id}`}
                            className="text-[#6C3BFF] hover:text-[#5a2ee6] transition"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer informativo */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Resumen de comisiones</p>
                <p className="text-sm text-blue-600">
                  Las comisiones se calculan automáticamente como el <strong>50% del enganche</strong> de cada venta.
                  Las comisiones pendientes se pagan al vendedor según el esquema acordado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}