// pages/admin/dashboard.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
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
  AlertCircle,
  Crown,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { formatMoney } from '../../lib/utils';

// ─── Servicio interno para el dashboard ──────────────────────────────────
const dashboardService = {
  async getStats() {
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
      const inicioAyer = new Date(inicioHoy);
      inicioAyer.setDate(inicioAyer.getDate() - 1);
      const finAyer = new Date(inicioHoy);

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

      const clientesHoy = await contarConFiltro(
        'users',
        'role = "cliente" || role = "user"'
      );
      const clientesAyer = await contarConFiltro(
        'users',
        `role = "cliente" || role = "user" && created < "${inicioHoy.toISOString()}"`
      );

      const productosHoy = await contarConFiltro(
        'products',
        'activo = true'
      );
      const productosAyer = await contarConFiltro(
        'products',
        `activo = true && created < "${inicioHoy.toISOString()}"`
      );

      const ordenesHoy = await contarConFiltro('orders', '');
      const ordenesAyer = await contarConFiltro(
        'orders',
        `created < "${inicioHoy.toISOString()}"`
      );

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
      } catch (e) { /* silencioso */ }

      const pagosHoyResult = await pb.collection('payments').getList(1, 50, {
        filter: `estado = "pendiente" && fechaVencimiento >= "${inicioHoy.toISOString()}" && fechaVencimiento < "${finHoy.toISOString()}"`,
        expand: 'userId',
        sort: 'fechaVencimiento'
      });

      const pagosAyerResult = await pb.collection('payments').getList(1, 1, {
        filter: `estado = "pendiente" && fechaVencimiento >= "${inicioAyer.toISOString()}" && fechaVencimiento < "${finAyer.toISOString()}"`,
        fields: 'id'
      });

      const deudaPagos = await pb.collection('payments').getFullList({
        filter: 'estado = "pendiente" || estado = "atrasado"',
        fields: 'montoProgramado,monto,created'
      });
      const deudaHoy = deudaPagos.reduce(
        (sum, p) => sum + (p.montoProgramado || p.monto || 0),
        0
      );
      const deudaAyerPagos = await pb.collection('payments').getFullList({
        filter: `estado = "pendiente" || estado = "atrasado" && created < "${inicioHoy.toISOString()}"`,
        fields: 'montoProgramado,monto'
      });
      const deudaAyer = deudaAyerPagos.reduce(
        (sum, p) => sum + (p.montoProgramado || p.monto || 0),
        0
      );

      const pagosHoyConCliente = pagosHoyResult.items.map((pago) => ({
        ...pago,
        clienteNombre: pago.expand?.userId?.nombre || pago.expand?.userId?.email || 'Cliente'
      }));

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

// ─── Componente LogoMark (igual que en la página principal) ────────────
const LogoMark = ({ size = 72 }) => (
  <div className="flex items-center gap-3">
    <span className="font-logo font-bold text-4xl text-primary tracking-tight">
      ʃƪʃƪ
    </span>
    <div className="flex flex-col">
      <span className="font-bold text-xl text-textMain tracking-tight leading-none">
        Market<span className="text-primary">Desliz</span>
      </span>
      <span className="text-[10px] text-textMuted tracking-[0.2em] uppercase font-medium">
        Desliza • Descubre • Conecta
      </span>
    </div>
  </div>
);

// ─── Action Card (para opciones de admin) ──────────────────────────────
function AdminActionCard({ icon: Icon, title, subtitle, onClick, color = 'from-blue-500 to-blue-600' }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between bg-white rounded-[20px] px-[22px] py-5 shadow-card border border-white/90 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-r ${color} flex items-center justify-center shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-textMain mb-0.5 tracking-tight">{title}</p>
          <p className="text-[13px] text-textMuted font-normal">{subtitle}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#F5F4FA] flex items-center justify-center shrink-0">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

// ─── Feature Item ─────────────────────────────────────────────────────
function FeatureItem({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-[38px] h-[38px] bg-bgPage rounded-[10px] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-textMain mb-0.5 tracking-tight">{title}</p>
        <p className="text-[12px] text-textMuted font-normal">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
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

  // ─── Verificar autenticación y cargar datos ──────────────────────────
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // Verificar sesión de admin
        if (!pb.authStore.isValid) {
          router.replace('/admin/login');
          return;
        }
        const user = pb.authStore.model;
        if (user?.role !== 'admin') {
          pb.authStore.clear();
          router.replace('/admin/login');
          return;
        }
        setAdminUser(user);
        await cargarDatos();
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndLoad();
  }, []);

  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

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
  }, []);

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/admin/login');
  };

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

  // ─── Menú de administración (opciones) ──────────────────────────────
  const adminMenu = useMemo(() => [
    { name: 'KYC Pendientes', icon: ShieldCheck, path: '/admin/kyc', color: 'from-blue-500 to-blue-600' },
    { name: 'Tandas', icon: Target, path: '/admin/tandas', color: 'from-pink-500 to-pink-600' },
    { name: 'Clientes', icon: Users, path: '/admin/clientes', color: 'from-blue-500 to-blue-600' },
    { name: 'Tarjetas', icon: CreditCard, path: '/admin/tarjetas', color: 'from-teal-500 to-teal-600' },
    { name: 'Productos', icon: Package, path: '/admin/productos', color: 'from-purple-500 to-purple-600' },
    { name: 'Negocios Aliados', icon: Store, path: '/admin/negocios', color: 'from-green-500 to-green-600' },
    { name: 'Órdenes', icon: ShoppingBag, path: '/admin/ordenes', color: 'from-orange-500 to-orange-600' },
    { name: 'Pagos', icon: DollarSign, path: '/admin/pagos', color: 'from-red-500 to-red-600' },
    { name: 'Vendedores', icon: Briefcase, path: '/admin/vendedores', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Cobradores', icon: Users, path: '/admin/cobradores', color: 'from-indigo-500 to-indigo-600' },
    { name: 'Cobranza en campo', icon: CalendarDays, path: '/admin/collector', color: 'from-emerald-500 to-emerald-600' },
    { name: 'Reportes', icon: BarChart3, path: '/admin/reportes', color: 'from-red-500 to-red-600' },
    { name: 'Configuración', icon: Crown, path: '/admin/configuracion', color: 'from-gray-500 to-gray-600' },
  ], []);

  // ─── Obtener estadísticas rápidas para mostrar en la derecha ──────
  const quickStats = useMemo(() => [
    { label: 'Clientes', value: stats.clientes.valor, icon: Users },
    { label: 'Productos', value: stats.productos.valor, icon: Package },
    { label: 'Vendedores', value: stats.vendedores.valor, icon: Briefcase },
  ], [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECEAF5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6C3BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard | MarketDesliz Admin</title>
        <meta name="description" content="Panel de administración de MarketDesliz" />
      </Head>

      <div className="min-h-screen bg-[#ECEAF5] font-sans">
        {/* ─── HEADER MINIMALISTA ───────────────────────────────────── */}
        <header className="px-6 md:px-12 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <LogoMark size={56} />

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-full flex items-center justify-center">
                  <Crown size={16} className="text-[#6C3BFF]" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {adminUser?.nombre || adminUser?.email?.split('@')[0] || 'Admin'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Cerrar sesión</span>
              </button>
              <button
                onClick={() => cargarDatos(true)}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        {/* ─── CONTENIDO PRINCIPAL (tres columnas) ────────────────── */}
        <main className="max-w-7xl mx-auto px-6 md:px-12 pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px] items-start">
            {/* ─── IZQUIERDA: Menú de administración ────────────────── */}
            <div className="lg:col-span-5 pt-7">
              <div className="mb-9">
                <h1 className="text-4xl md:text-5xl font-extrabold text-textMain leading-[1.1] tracking-[-0.03em] mb-2">
                  Hola, Adm. Alan.
                </h1>
                <p className="text-xl text-textSub font-normal">
                  ¿Qué quieres hacer hoy?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {adminMenu.map((item) => (
                  <AdminActionCard
                    key={item.path}
                    icon={item.icon}
                    title={item.name}
                    subtitle={`Gestionar ${item.name.toLowerCase()}`}
                    color={item.color}
                    onClick={() => router.push(item.path)}
                  />
                ))}
              </div>
            </div>

            {/* ─── CENTRO: Glass Card con logo ───────────────────────── */}
            <div className="lg:col-span-4 flex items-center justify-center relative min-h-[420px]">
              {/* Burbujas flotantes */}
              {[
                { w: 16, h: 16, top: 80, left: 60 },
                { w: 10, h: 10, top: 160, left: 30 },
                { w: 20, h: 20, bottom: 120, right: 50 },
                { w: 11, h: 11, bottom: 180, right: 30 },
                { w: 8, h: 8, top: 240, left: 80 },
              ].map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/60 border border-white/80 backdrop-blur-sm"
                  style={{
                    width: b.w,
                    height: b.h,
                    top: b.top,
                    left: b.left,
                    bottom: b.bottom,
                    right: b.right,
                    boxShadow: "0 2px 8px rgba(130,90,220,0.10)",
                  }}
                />
              ))}

              <div className="relative inline-flex flex-col items-center">
                {/* Glass Card */}
                <div
                  className="w-[300px] h-[320px] md:w-[360px] md:h-[380px] rounded-[44px] flex flex-col items-center justify-center relative z-10 transition-all duration-500 hover:scale-105 cursor-pointer mt-16 md:mt-20"
                  style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(235,228,255,0.60) 100%)",
                    boxShadow: "30px 30px 80px rgba(130,90,220,0.18), -15px -15px 40px rgba(255,255,255,0.85), inset 0 1px 1px rgba(255,255,255,0.9)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    border: "1.5px solid rgba(255,255,255,0.75)",
                  }}
                  onClick={() => router.push('/admin/dashboard')}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className="font-logo font-bold text-7xl md:text-8xl tracking-tight"
                      style={{
                        background: 'linear-gradient(135deg, #5B2BE0, #9B5AFF)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      ʃƪʃƪ
                    </span>
                    <span className="mt-2 text-sm font-medium text-gray-500">Administración</span>
                  </div>
                </div>

                {/* Anillos inferiores */}
                <div
                  className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 mt-4"
                  style={{ width: 320 }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: 320, height: 30,
                      marginTop: -8,
                      border: "1.5px solid rgba(180,160,240,0.35)",
                    }}
                  />
                  <div
                    className="rounded-full"
                    style={{
                      width: 290, height: 22,
                      marginTop: -18, opacity: 0.7,
                      border: "1.5px solid rgba(180,160,240,0.35)",
                    }}
                  />
                  <div
                    style={{
                      width: 300, height: 22,
                      background: "radial-gradient(ellipse at center, rgba(185,160,255,0.38) 0%, rgba(180,155,255,0.10) 70%, transparent 100%)",
                      borderRadius: "50%",
                      filter: "blur(4px)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ─── DERECHA: Información rápida ──────────────────────── */}
            <div className="lg:col-span-3 pt-12 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-card border border-white/90">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#6C3BFF]" />
                  Resumen rápido
                </h3>
                <div className="space-y-4">
                  {quickStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{stat.label}</span>
                        </div>
                        <span className="font-bold text-gray-900">{stat.value}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Deuda total</span>
                    <span className="font-bold text-red-500">{formatMoney(stats.deudaTotal.valor)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pagos pendientes</span>
                    <span className="font-bold text-yellow-600">{stats.pagosHoy.valor}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-card border border-white/90">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#6C3BFF]" />
                  Acciones rápidas
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/admin/kyc')}
                    className="w-full text-left px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-sm text-gray-700"
                  >
                    ⚡ Revisar KYC pendientes
                  </button>
                  <button
                    onClick={() => router.push('/admin/pagos')}
                    className="w-full text-left px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-sm text-gray-700"
                  >
                    💰 Ver pagos del día
                  </button>
                  <button
                    onClick={() => router.push('/admin/tandas')}
                    className="w-full text-left px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-sm text-gray-700"
                  >
                    🎯 Gestionar tandas
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400">
                MarketDesliz v1.0 · {new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* ─── SECCIÓN DE PAGOS PENDIENTES (debajo de las columnas) ── */}
          {pagosPendientes.length > 0 && (
            <div className="mt-12 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
          )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes scroll-dot {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(16px); opacity: 0; }
        }
        .animate-scroll-dot {
          animation: scroll-dot 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}