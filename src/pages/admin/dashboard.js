// src/pages/admin/dashboard.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  CreditCard,
  Briefcase,
  ShieldCheck,
  Target,
  BarChart3,
  Store,
  CalendarDays,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';
import { formatMoney } from '../../lib/utils';

// ─── Servicio interno para el dashboard ──────────────────────────────────
const dashboardService = {
  /**
   * Obtiene estadísticas del dashboard de forma eficiente
   * incluyendo tendencias comparando con el día anterior.
   */
  async getStats() {
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
      const inicioAyer = new Date(inicioHoy);
      inicioAyer.setDate(inicioAyer.getDate() - 1);
      const finAyer = new Date(inicioHoy); // fin de ayer = inicio de hoy

      // ── Función auxiliar para contar con filtro de fecha ──
      const contarConFiltro = async (collection, filterExtra = '', fields = 'id') => {
        try {
          const result = await pb.collection(collection).getList(1, 1, {
            filter: filterExtra,
            fields
          });
          return result.totalItems;
        } catch {
          return 0;
        }
      };

      // ── 1. CLIENTES (totales acumulados) ──
      const clientesHoy = await contarConFiltro(
        'users',
        'role = "cliente" || role = "user"'
      );
      const clientesAyer = await contarConFiltro(
        'users',
        `role = "cliente" || role = "user" && created < "${inicioHoy.toISOString()}"`
      );

      // ── 2. PRODUCTOS ACTIVOS (totales acumulados) ──
      const productosHoy = await contarConFiltro(
        'products',
        'activo = true'
      );
      const productosAyer = await contarConFiltro(
        'products',
        `activo = true && created < "${inicioHoy.toISOString()}"`
      );

      // ── 3. ÓRDENES (totales acumulados) ──
      const ordenesHoy = await contarConFiltro('orders', '');
      const ordenesAyer = await contarConFiltro(
        'orders',
        `created < "${inicioHoy.toISOString()}"`
      );

      // ── 4. VENDEDORES ACTIVOS (totales acumulados) ──
      let vendedoresHoy = 0;
      let vendedoresAyer = 0;
      try {
        vendedoresHoy = await contarConFiltro(
          'vendedores',
          'activo = true'
        );
        vendedoresAyer = await contarConFiltro(
          'vendedores',
          `activo = true && created < "${inicioHoy.toISOString()}"`
        );
      } catch (e) {
        console.warn('Colección vendedores no encontrada');
      }

      // ── 5. PAGOS PENDIENTES DE HOY (diario) ──
      const pagosHoyResult = await pb.collection('payments').getList(1, 50, {
        filter: `estado = "pendiente" && fechaVencimiento >= "${inicioHoy.toISOString()}" && fechaVencimiento < "${finHoy.toISOString()}"`,
        expand: 'userId',
        sort: 'fechaVencimiento'
      });

      // Pagos pendientes de ayer (para comparar)
      const pagosAyerResult = await pb.collection('payments').getList(1, 1, {
        filter: `estado = "pendiente" && fechaVencimiento >= "${inicioAyer.toISOString()}" && fechaVencimiento < "${finAyer.toISOString()}"`,
        fields: 'id'
      });

      // ── 6. DEUDA TOTAL (acumulada) ──
      const deudaPagos = await pb.collection('payments').getFullList({
        filter: 'estado = "pendiente" || estado = "atrasado"',
        fields: 'montoProgramado,monto,created'
      });
      const deudaHoy = deudaPagos.reduce(
        (sum, p) => sum + (p.montoProgramado || p.monto || 0),
        0
      );
      // Deuda de ayer (pagos pendientes/atrasados creados antes de hoy)
      const deudaAyerPagos = await pb.collection('payments').getFullList({
        filter: `estado = "pendiente" || estado = "atrasado" && created < "${inicioHoy.toISOString()}"`,
        fields: 'montoProgramado,monto'
      });
      const deudaAyer = deudaAyerPagos.reduce(
        (sum, p) => sum + (p.montoProgramado || p.monto || 0),
        0
      );

      // ── Formatear pagos de hoy con nombre de cliente ──
      const pagosHoyConCliente = pagosHoyResult.items.map((pago) => ({
        ...pago,
        clienteNombre: pago.expand?.userId?.nombre || pago.expand?.userId?.email || 'Cliente'
      }));

      // ── Construir objeto de estadísticas con tendencias ──
      const calcularTendencia = (actual, anterior) => {
        if (anterior === 0) return { diferencia: actual, porcentaje: actual > 0 ? 100 : 0 };
        const diff = actual - anterior;
        const porcentaje = Math.round((diff / anterior) * 100);
        return { diferencia: diff, porcentaje };
      };

      const stats = {
        clientes: {
          valor: clientesHoy,
          tendencia: calcularTendencia(clientesHoy, clientesAyer)
        },
        productos: {
          valor: productosHoy,
          tendencia: calcularTendencia(productosHoy, productosAyer)
        },
        ordenes: {
          valor: ordenesHoy,
          tendencia: calcularTendencia(ordenesHoy, ordenesAyer)
        },
        vendedores: {
          valor: vendedoresHoy,
          tendencia: calcularTendencia(vendedoresHoy, vendedoresAyer)
        },
        pagosHoy: {
          valor: pagosHoyResult.totalItems,
          tendencia: calcularTendencia(pagosHoyResult.totalItems, pagosAyerResult.totalItems)
        },
        deudaTotal: {
          valor: deudaHoy,
          tendencia: calcularTendencia(deudaHoy, deudaAyer)
        }
      };

      return {
        stats,
        pagosHoy: pagosHoyConCliente
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  /**
   * Registrar cobro de un pago
   */
  async registrarCobro(pagoId, monto, orderId) {
    await pb.collection('payments').update(pagoId, {
      estado: 'pagado',
      montoPagado: monto,
      fechaPago: new Date().toISOString()
    });

    if (orderId) {
      const orden = await pb.collection('orders').getOne(orderId);
      const nuevoSaldo = Math.max(0, (orden.saldoRestante || 0) - monto);

      await pb.collection('orders').update(orderId, {
        saldoRestante: nuevoSaldo,
        pagosRealizados: (orden.pagosRealizados || 0) + 1,
        estadoPago: nuevoSaldo <= 0 ? 'completada' : orden.estadoPago
      });
    }
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    clientes: { valor: 0, tendencia: { diferencia: 0, porcentaje: 0 } },
    productos: { valor: 0, tendencia: { diferencia: 0, porcentaje: 0 } },
    ordenes: { valor: 0, tendencia: { diferencia: 0, porcentaje: 0 } },
    vendedores: { valor: 0, tendencia: { diferencia: 0, porcentaje: 0 } },
    pagosHoy: { valor: 0, tendencia: { diferencia: 0, porcentaje: 0 } },
    deudaTotal: { valor: 0, tendencia: { diferencia: 0, porcentaje: 0 } }
  });
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // ─── Carga de datos ──────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      if (!pb.authStore.isValid) {
        router.push('/admin/login');
        return;
      }

      const currentUser = pb.authStore.model;
      if (currentUser?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      setUser(currentUser);

      const data = await dashboardService.getStats();
      setStats(data.stats);
      setPagosPendientes(data.pagosHoy);

    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('No se pudieron cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // ─── Efecto de montaje ──────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    cargarDatos();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarDatos(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [cargarDatos]);

  // ─── Manejar cobro ──────────────────────────────────────────────────
  const handleCobrar = useCallback(async (pago) => {
    const monto = pago.montoProgramado || pago.monto || 0;
    if (!confirm(`¿Confirmar cobro de $${monto.toLocaleString()} para ${pago.clienteNombre}?`)) return;

    try {
      await dashboardService.registrarCobro(pago.id, monto, pago.orderId);
      await cargarDatos(true);
    } catch (error) {
      console.error('Error al cobrar:', error);
      alert('Error al procesar el pago');
    }
  }, [cargarDatos]);

  // ─── Acciones rápidas ──────────────────────────────────────────────────
  const accionesRapidas = useMemo(() => [
    { nombre: 'Clientes', icono: Users, ruta: '/admin/clientes', color: 'from-blue-500 to-blue-600' },
    { nombre: 'Productos', icono: Package, ruta: '/admin/productos', color: 'from-purple-500 to-purple-600' },
    { nombre: 'Órdenes', icono: ShoppingBag, ruta: '/admin/ordenes', color: 'from-orange-500 to-orange-600' },
    { nombre: 'Vendedores', icono: Store, ruta: '/admin/vendedores', color: 'from-green-500 to-green-600' },
    { nombre: 'Pagos', icono: CreditCard, ruta: '/admin/pagos', color: 'from-teal-500 to-teal-600' },
    { nombre: 'Tandas', icono: Target, ruta: '/admin/tandas', color: 'from-pink-500 to-pink-600' },
    { nombre: 'KYC', icono: ShieldCheck, ruta: '/admin/kyc', color: 'from-indigo-500 to-indigo-600' },
    { nombre: 'Bolsa Trabajo', icono: Briefcase, ruta: '/admin/bolsa-trabajo', color: 'from-yellow-500 to-yellow-600' },
    { nombre: 'Reportes', icono: BarChart3, ruta: '/admin/reportes', color: 'from-red-500 to-red-600' },
  ], []);

  // ─── Renderizado ────────────────────────────────────────────────────
  if (!mounted) return null;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-5 h-5 bg-gray-200 rounded-full" />
                  <div className="w-12 h-6 bg-gray-200 rounded" />
                </div>
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | MarketDesliz Admin</title>
      </Head>

      <AdminLayout>
        <div className="space-y-6">

          {/* ─── Cabecera con botón de recarga ─────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={20} className="text-[#6C3BFF]" />
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <button
              onClick={() => cargarDatos(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {/* ─── Error ────────────────────────────────────────────── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
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

          {/* ─── Stats Grid con Tendencias ────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { key: 'clientes', label: 'Clientes', icon: Users, color: 'text-blue-500' },
              { key: 'productos', label: 'Productos activos', icon: Package, color: 'text-purple-500' },
              { key: 'ordenes', label: 'Órdenes totales', icon: ShoppingBag, color: 'text-orange-500' },
              { key: 'vendedores', label: 'Vendedores activos', icon: Store, color: 'text-green-500' },
              { key: 'pagosHoy', label: 'Pagos pendientes hoy', icon: Clock, color: 'text-yellow-500' },
              { key: 'deudaTotal', label: 'Deuda total', icon: DollarSign, color: 'text-red-500' }
            ].map(({ key, label, icon: Icon, color }) => {
              const stat = stats[key];
              const valor = stat?.valor ?? 0;
              const tendencia = stat?.tendencia ?? { diferencia: 0, porcentaje: 0 };
              const esPositivo = tendencia.diferencia >= 0;
              // Para deuda, un cambio negativo es bueno (baja la deuda)
              const esPositivoBueno = key === 'deudaTotal' ? !esPositivo : esPositivo;

              return (
                <div key={key} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={20} className={color} />
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {key === 'deudaTotal' ? formatMoney(valor) : valor}
                      </span>
                      {tendencia.diferencia !== 0 && (
                        <span className={`text-xs font-medium flex items-center gap-0.5 ${
                          esPositivoBueno ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {esPositivoBueno ? (
                            <TrendingUp size={12} />
                          ) : (
                            <TrendingDown size={12} />
                          )}
                          {Math.abs(tendencia.porcentaje)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{label}</p>
                    {tendencia.diferencia !== 0 && (
                      <span className={`text-[10px] font-medium ${
                        esPositivoBueno ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {esPositivoBueno ? '+' : ''}{tendencia.diferencia}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Pagos pendientes hoy ────────────────────────────── */}
          {pagosPendientes.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-yellow-50">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-yellow-600" />
                  <h2 className="font-semibold text-gray-900">
                    Pagos pendientes hoy ({pagosPendientes.length})
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {pagosPendientes.map((pago) => (
                  <div key={pago.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-yellow-50/30 hover:bg-yellow-50/50 transition">
                    <div>
                      <p className="font-medium text-gray-900">{pago.clienteNombre}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <CalendarDays size={12} />
                        Vence: {new Date(pago.fechaVencimiento).toLocaleDateString('es-MX', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                        {pago.numeroSemana !== undefined && ` · Semana ${pago.numeroSemana}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#6C3BFF]">
                        {formatMoney(pago.montoProgramado || pago.monto || 0)}
                      </span>
                      <button
                        onClick={() => handleCobrar(pago)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition shadow-sm"
                      >
                        <CheckCircle size={14} /> Cobrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No hay pagos pendientes hoy</h3>
              <p className="text-sm text-gray-500">Todos los pagos del día están al día</p>
            </div>
          )}

          {/* ─── Acciones rápidas ────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#6C3BFF]" />
                Acciones rápidas
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {accionesRapidas.map((accion) => {
                  const Icono = accion.icono;
                  return (
                    <button
                      key={accion.nombre}
                      onClick={() => window.location.href = accion.ruta}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${accion.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition`}>
                        <Icono size={18} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{accion.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Estado del sistema ────────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-white rounded-xl px-4 py-3 border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sistema funcionando correctamente
            <span className="mx-1">·</span>
            Última actualización: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}