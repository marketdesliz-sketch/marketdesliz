// src/pages/vendedor/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ClipboardList, Clock, CheckCircle, DollarSign,
  ChevronRight, Phone, Package, CreditCard, Banknote, Inbox
} from 'lucide-react';
import VendedorLayout from '../../layouts/VendedorLayout';
import pb from '../../lib/pocketbase';
import { getSolicitudesPendientes, getEstadisticasVendedor } from '../../lib/vendedorService';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

export default function VendedorDashboardPage() {
  const router = useRouter();
  const [vendedor, setVendedor] = useState(null);
  const [user, setUser] = useState(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      try {
        if (!pb.authStore.isValid) { router.replace('/vendedor/login'); return; }
        const u = pb.authStore.model;
        if (u?.role !== 'vendedor') { pb.authStore.clear(); router.replace('/vendedor/login'); return; }
        setUser(u);
        const vendedorData = await pb.collection('vendedores').getFirstListItem(
          `userId = "${u.id}" && activo = true`
        );
        setVendedor(vendedorData);
        await cargarDatos(vendedorData.id);
      } catch (error) {
        console.error('Error:', error);
        router.replace('/vendedor/login');
      } finally {
        setLoading(false);
      }
    };
    verificar();
  }, []);

  const cargarDatos = async (vendedorId) => {
    try {
      const [pendientes, stats] = await Promise.all([
        getSolicitudesPendientes(vendedorId),
        getEstadisticasVendedor(vendedorId)
      ]);
      setSolicitudesPendientes(pendientes);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </VendedorLayout>
    );
  }

  const statCards = [
    { label: 'Total solicitudes', value: estadisticas?.totalSolicitudes || 0,  icon: ClipboardList, color: 'text-[#6C3BFF]',  bg: 'bg-[#6C3BFF]/8' },
    { label: 'Pendientes',        value: estadisticas?.pendientes || 0,         icon: Clock,         color: 'text-amber-500',  bg: 'bg-amber-50' },
    { label: 'Completadas',       value: estadisticas?.completadas || 0,        icon: CheckCircle,   color: 'text-[#10b981]',  bg: 'bg-[#10b981]/10' },
    { label: 'Enganches recibidos',value: formatMoney(estadisticas?.enganchesRecibidos || 0), icon: DollarSign, color: 'text-[#6C3BFF]', bg: 'bg-[#6C3BFF]/8', money: true },
  ];

  return (
    <>
      <Head><title>Dashboard | MarketDesliz Vendedor</title></Head>

      <VendedorLayout>
        {/* ── Bienvenida ──────────────────────────────────── */}
        <div className="bg-[#6C3BFF] rounded-2xl px-6 py-5 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              Hola, {user?.nombre?.split(' ')[0] || 'Vendedor'}
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              {solicitudesPendientes.length === 0
                ? 'No tienes solicitudes pendientes. ¡Excelente!'
                : `Tienes ${solicitudesPendientes.length} solicitud${solicitudesPendientes.length !== 1 ? 'es' : ''} pendiente${solicitudesPendientes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white/50 text-xs">Código</p>
            <p className="text-white font-mono font-bold">{vendedor?.codigo}</p>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Solicitudes pendientes ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <ClipboardList size={16} className="text-[#6C3BFF]" />
              Solicitudes pendientes
            </h2>
            <Link
              href="/vendedor/solicitudes"
              className="text-xs text-[#6C3BFF] font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Ver todas <ChevronRight size={13} />
            </Link>
          </div>

          {solicitudesPendientes.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {solicitudesPendientes.slice(0, 5).map((solicitud) => {
                const esCredito = solicitud.tipo === 'credito';
                return (
                  <div
                    key={solicitud.id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${esCredito ? 'bg-[#6C3BFF]/8' : 'bg-[#10b981]/10'}`}>
                        {esCredito ? <CreditCard size={14} className="text-[#6C3BFF]" /> : <Banknote size={14} className="text-[#10b981]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {solicitud.expand?.clienteId?.nombre || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {solicitud.expand?.clienteId?.telefono}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Package size={11} /> {solicitud.expand?.productoId?.nombre || solicitud.productoNombre}
                        </p>
                        {esCredito && (
                          <p className="text-xs text-[#6C3BFF] font-medium mt-1">
                            Enganche: {formatMoney(solicitud.enganche)}
                            <span className="text-gray-400 font-normal"> · {formatMoney(solicitud.pagoSemanal)}/sem</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/vendedor/solicitudes/${solicitud.id}`}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Validar <ChevronRight size={12} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recordatorio de comisiones */}
        <div className="mt-5 flex items-start gap-3 p-4 bg-[#10b981]/8 border border-[#10b981]/20 rounded-xl">
          <DollarSign size={16} className="text-[#10b981] shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Los pagos de comisiones se realizan <strong className="text-gray-800">todos los miércoles</strong>.
            El pago incluye todas las ventas validadas de la semana anterior.
          </p>
        </div>
      </VendedorLayout>
    </>
  );
}