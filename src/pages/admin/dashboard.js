// src/pages/admin/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Clock,
  CheckCircle,
  CreditCard,
  Briefcase,
  ShieldCheck,
  Target,
  BarChart3,
  Store,
  CalendarDays
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    clientes: 0,
    productos: 0,
    ordenes: 0,
    vendedores: 0,
    pagosHoy: 0,
    deudaTotal: 0
  });
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    cargarDatos();
    
    // Recargar datos cada 30 segundos
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      if (!pb.authStore.isValid) {
        return;
      }

      const currentUser = pb.authStore.model;
      if (!currentUser || currentUser.role !== 'admin') {
        return;
      }
      
      setUser(currentUser);

      // Obtener clientes
      const clientes = await pb.collection('users').getFullList({
        filter: 'role = "cliente" || role = "user"'
      });

      // Obtener productos
      const productos = await pb.collection('products').getFullList({
        filter: 'activo = true'
      });

      // Obtener órdenes
      const ordenes = await pb.collection('orders').getFullList();

      // Obtener vendedores
      let vendedores = [];
      try {
        vendedores = await pb.collection('vendedores').getFullList({
          filter: 'activo = true'
        });
      } catch (e) {
        console.log('Colección vendedores no encontrada');
      }

      // Obtener pagos
      const pagos = await pb.collection('payments').getFullList();

      // Pagos pendientes de hoy
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const pagosHoy = pagos.filter(p => {
        if (p.estado !== 'pendiente') return false;
        const fechaVencimiento = new Date(p.fechaVencimiento);
        return fechaVencimiento >= inicioHoy && fechaVencimiento < finHoy;
      });

      // Deuda total
      const deudaTotal = pagos
        .filter(p => p.estado === 'pendiente' || p.estado === 'atrasado')
        .reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);

      // Obtener nombres de clientes para pagos pendientes
      const pagosConClientes = await Promise.all(
        pagosHoy.map(async pago => {
          if (pago.userId) {
            try {
              const cliente = await pb.collection('users').getOne(pago.userId);
              return { ...pago, clienteNombre: cliente.nombre || cliente.email };
            } catch (e) {
              return { ...pago, clienteNombre: 'Cliente' };
            }
          }
          return { ...pago, clienteNombre: 'Sin cliente' };
        })
      );

      setStats({
        clientes: clientes.length,
        productos: productos.length,
        ordenes: ordenes.length,
        vendedores: vendedores.length,
        pagosHoy: pagosHoy.length,
        deudaTotal: deudaTotal
      });

      setPagosPendientes(pagosConClientes);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = async (pago) => {
    const monto = pago.montoProgramado || pago.monto || 0;
    if (!confirm(`¿Confirmar cobro de $${monto.toLocaleString()} para ${pago.clienteNombre}?`)) return;

    try {
      // Actualizar pago
      await pb.collection('payments').update(pago.id, {
        estado: 'pagado',
        montoPagado: monto,
        fechaPago: new Date().toISOString()
      });

      // Actualizar orden
      if (pago.orderId) {
        const orden = await pb.collection('orders').getOne(pago.orderId);
        const nuevoSaldo = (orden.saldoRestante || 0) - monto;
        
        await pb.collection('orders').update(pago.orderId, {
          saldoRestante: nuevoSaldo > 0 ? nuevoSaldo : 0,
          pagosRealizados: (orden.pagosRealizados || 0) + 1,
          estadoPago: nuevoSaldo <= 0 ? 'completada' : orden.estadoPago
        });
      }

      await cargarDatos();
    } catch (error) {
      console.error('Error al cobrar:', error);
      alert('Error al procesar el pago');
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const accionesRapidas = [
    { nombre: 'Clientes', icono: Users, ruta: '/admin/clientes', color: 'from-blue-500 to-blue-600' },
    { nombre: 'Productos', icono: Package, ruta: '/admin/productos', color: 'from-purple-500 to-purple-600' },
    { nombre: 'Órdenes', icono: ShoppingBag, ruta: '/admin/ordenes', color: 'from-orange-500 to-orange-600' },
    { nombre: 'Vendedores', icono: Store, ruta: '/admin/vendedores', color: 'from-green-500 to-green-600' },
    { nombre: 'Pagos', icono: CreditCard, ruta: '/admin/pagos', color: 'from-teal-500 to-teal-600' },
    { nombre: 'Tandas', icono: Target, ruta: '/admin/tandas', color: 'from-pink-500 to-pink-600' },
    { nombre: 'KYC', icono: ShieldCheck, ruta: '/admin/kyc', color: 'from-indigo-500 to-indigo-600' },
    { nombre: 'Bolsa Trabajo', icono: Briefcase, ruta: '/admin/bolsa-trabajo', color: 'from-yellow-500 to-yellow-600' },
    { nombre: 'Reportes', icono: BarChart3, ruta: '/admin/reportes', color: 'from-red-500 to-red-600' },
  ];

  // ✅ Prevenir error de hidratación
  if (!mounted) {
    return null;
  }

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
        <title>Dashboard | MarketDesliz Admin</title>
      </Head>

      <AdminLayout>
        <div className="space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Users size={20} className="text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.clientes}</span>
              </div>
              <p className="text-xs text-gray-500">Clientes</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Package size={20} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.productos}</span>
              </div>
              <p className="text-xs text-gray-500">Productos</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag size={20} className="text-orange-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.ordenes}</span>
              </div>
              <p className="text-xs text-gray-500">Órdenes</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Store size={20} className="text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.vendedores}</span>
              </div>
              <p className="text-xs text-gray-500">Vendedores</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Clock size={20} className="text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.pagosHoy}</span>
              </div>
              <p className="text-xs text-gray-500">Pagos hoy</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <DollarSign size={20} className={stats.deudaTotal > 0 ? 'text-red-500' : 'text-green-500'} />
                <span className="text-xl font-bold text-gray-900">{formatMoney(stats.deudaTotal)}</span>
              </div>
              <p className="text-xs text-gray-500">Deuda total</p>
            </div>
          </div>

          {/* Pagos pendientes hoy */}
          {pagosPendientes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-yellow-50">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-yellow-600" />
                  <h2 className="font-semibold text-gray-900">Pagos pendientes hoy ({pagosPendientes.length})</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {pagosPendientes.map(pago => (
                  <div key={pago.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-yellow-50/30">
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
                      <span className="text-lg font-bold text-[#6C3BFF]">{formatMoney(pago.montoProgramado || pago.monto || 0)}</span>
                      <button
                        onClick={() => handleCobrar(pago)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition"
                      >
                        <CheckCircle size={14} /> Cobrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin pagos pendientes */}
          {pagosPendientes.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No hay pagos pendientes</h3>
              <p className="text-sm text-gray-500">Todos los pagos del día están al día</p>
            </div>
          )}

          {/* Acciones rápidas */}
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

          {/* Estado del sistema */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-white rounded-xl px-4 py-3 border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sistema funcionando correctamente | Última actualización: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}