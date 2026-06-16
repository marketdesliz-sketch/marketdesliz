// src/pages/vendedor/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import pb from '../../lib/pocketbase';

export default function VendedorDashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [vendedor, setVendedor] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    totalComision: 0,
    comisionPendiente: 0,
    comisionPagada: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      if (!pb.authStore.isValid) {
        router.push('/vendedor/login');
        return;
      }

      const user = pb.authStore.model;
      if (user.role !== 'vendedor') {
        pb.authStore.clear();
        router.push('/vendedor/login');
        return;
      }
      setUser(user);

      // Obtener datos del vendedor
      const vendedorData = await pb.collection('vendedores').getFirstListItem(
        `userId = "${user.id}"`
      );
      setVendedor(vendedorData);

      // Cargar ventas
      await cargarVentas(vendedorData.id);

    } catch (error) {
      console.error('Error:', error);
      router.push('/vendedor/login');
    } finally {
      setLoading(false);
    }
  };

  const cargarVentas = async (vendedorId) => {
    try {
      const ventasData = await pb.collection('solicitudes').getFullList({
        filter: `vendedorId = "${vendedorId}"`,
        expand: 'clienteId,productoId',
        sort: '-fechaSolicitud'
      });
      const ventasFormateadas = ventasData.map(s => ({
        id: s.id,
        fechaVenta: s.fechaSolicitud,
        clienteId: s.clienteId,
        productoId: s.productoId,
        montoEnganche: s.enganche || 0,
        comisionVendedor: Math.round((s.enganche || 0) * 0.5),
        pagada: s.estado === 'completada',
        expand: s.expand
      }));
      setVentas(ventasFormateadas);

      // Calcular estadísticas
      const totalComision = ventasFormateadas.reduce((sum, v) => sum + (v.comisionVendedor || 0), 0);
      const comisionPagada = ventasFormateadas.filter(v => v.pagada).reduce((sum, v) => sum + (v.comisionVendedor || 0), 0);
      const comisionPendiente = totalComision - comisionPagada;

      setEstadisticas({
        totalVentas: ventasFormateadas.length,
        totalComision,
        comisionPendiente,
        comisionPagada
      });

    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    localStorage.removeItem('vendedorData');
    router.push('/vendedor/login');
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | MarketDesliz Vendedor</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">MarketDesliz</h1>
              <p className="text-sm opacity-90">Panel de Vendedor</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">👤 {user?.nombre || 'Vendedor'}</span>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition"
              >
                🚪 Salir
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalVentas}</p>
                  <p className="text-sm text-gray-500">Ventas realizadas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatMoney(estadisticas.totalComision)}</p>
                  <p className="text-sm text-gray-500">Comisión total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{formatMoney(estadisticas.comisionPendiente)}</p>
                  <p className="text-sm text-gray-500">Por cobrar</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{formatMoney(estadisticas.comisionPagada)}</p>
                  <p className="text-sm text-gray-500">Ya pagado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del vendedor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👤 Mi información</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Código</p>
                <p className="font-mono font-medium">{vendedor?.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{user?.nombre || 'Vendedor'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Comisión</p>
                <p className="font-medium text-green-600">{vendedor?.comisionPorcentaje}% del enganche</p>
              </div>
            </div>
          </div>

          {/* Tabla de ventas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">📋 Historial de ventas</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Fecha</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Cliente</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Producto</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Enganche</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Tu comisión</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-gray-500">
                        No tienes ventas registradas aún
                      </td>
                    </tr>
                  ) : (
                    ventas.map((venta) => (
                      <tr key={venta.id} className="hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-600">{formatDate(venta.fechaVenta)}</td>
                        <td className="p-3 text-sm font-medium text-gray-900">
                          {venta.expand?.clienteId?.nombre || 'Cliente'}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {venta.expand?.productoId?.nombre || 'Producto'}
                        </td>
                        <td className="p-3 text-sm font-medium text-purple-600">
                          {formatMoney(venta.montoEnganche)}
                        </td>
                        <td className="p-3 text-sm font-medium text-green-600">
                          {formatMoney(venta.comisionVendedor)}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${venta.pagada
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {venta.pagada ? '✅ Pagada' : '⏳ Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información de pago */}
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📅</span>
              <h3 className="font-bold text-blue-800">Días de pago</h3>
            </div>
            <p className="text-sm text-blue-700">
              Los pagos de comisiones se realizan <strong>todos los miércoles</strong>.
              El pago incluye todas las ventas validadas de la semana anterior.
            </p>
          </div>
        </main>
      </div>

      <style jsx>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #6C3BFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
