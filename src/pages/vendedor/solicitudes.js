// src/pages/vendedor/solicitudes.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ClipboardList, Clock, DollarSign, Target,
  CreditCard, Banknote, CheckCircle, Inbox
} from 'lucide-react';
import VendedorLayout from '../../layouts/VendedorLayout';
import pb from '../../lib/pocketbase';
import { getSolicitudesPendientes } from '../../lib/vendedorService';
import SolicitudCard from '../../components/vendedor/SolicitudCard';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

export default function VendedorSolicitudesPage() {
  const router = useRouter();
  const [vendedor, setVendedor] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!pb.authStore.isValid) { router.push('/vendedor/login'); return; }
    const user = pb.authStore.model;
    if (user.role !== 'vendedor') { pb.authStore.clear(); router.push('/vendedor/login'); return; }
    cargarVendedorYSolicitudes(user);
  }, [refresh]);

  const cargarVendedorYSolicitudes = async (user) => {
    try {
      setLoading(true);
      const vendedorData = await pb.collection('vendedores').getFirstListItem(`userId = "${user.id}"`);
      setVendedor(vendedorData);
      const solicitudesData = await getSolicitudesPendientes(vendedorData.id);
      setSolicitudes(solicitudesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidada        = () => setRefresh(prev => prev + 1);
  const handleEngancheRecibido = () => setRefresh(prev => prev + 1);

  const solicitudesFiltradas = solicitudes.filter(sol => {
    if (filtro === 'credito') return sol.tipo === 'credito';
    if (filtro === 'contado') return sol.tipo === 'contado';
    return true;
  });

  const totalPendientes           = solicitudes.length;
  const totalEnganchesPendientes  = solicitudes.filter(s => !s.enganchePagado).reduce((sum, s) => sum + (s.enganche || 0), 0);
  const totalEnganchesRecibidos   = solicitudes.filter(s => s.enganchePagado).reduce((sum, s) => sum + (s.enganche || 0), 0);
  const comisionEstimada          = totalEnganchesRecibidos * 0.5;

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
    { label: 'Total pendientes',      value: totalPendientes,                    icon: ClipboardList, color: 'text-gray-900',   bg: 'bg-gray-100',          num: true },
    { label: 'Enganches por recibir', value: formatMoney(totalEnganchesPendientes), icon: Clock,      color: 'text-amber-500',  bg: 'bg-amber-50' },
    { label: 'Enganches recibidos',   value: formatMoney(totalEnganchesRecibidos),  icon: DollarSign,  color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
    { label: 'Tu comisión (50%)',     value: formatMoney(comisionEstimada),         icon: Target,      color: 'text-[#6C3BFF]', bg: 'bg-[#6C3BFF]/8' },
  ];

  const filtros = [
    { key: 'todas',   label: 'Todas',   count: solicitudes.length },
    { key: 'credito', label: 'Crédito', count: solicitudes.filter(s => s.tipo === 'credito').length, icon: CreditCard },
    { key: 'contado', label: 'Contado', count: solicitudes.filter(s => s.tipo === 'contado').length, icon: Banknote },
  ];

  return (
    <>
      <Head><title>Solicitudes Pendientes | MarketDesliz Vendedor</title></Head>

      <VendedorLayout>

        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Solicitudes pendientes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Revisa y valida las solicitudes de los clientes</p>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, color, bg, num }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className={`font-bold text-gray-900 ${num ? 'text-2xl' : 'text-lg'}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Filtros ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-5 flex flex-wrap gap-2">
          {filtros.map(({ key, label, count, icon: Icon }) => {
            const active = filtro === key;
            return (
              <button
                key={key}
                onClick={() => setFiltro(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#6C3BFF] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {Icon && <Icon size={13} />}
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Lista de solicitudes ───────────────────────── */}
        {solicitudesFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
            <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              {filtro === 'todas'
                ? <CheckCircle size={28} className="text-[#10b981]" />
                : <Inbox size={28} className="text-gray-300" />}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {filtro !== 'todas'
                ? `Sin solicitudes de ${filtro} por ahora`
                : 'No hay solicitudes pendientes'}
            </h3>
            <p className="text-xs text-gray-400">
              {filtro === 'todas' ? '¡Excelente trabajo! Todas las solicitudes han sido procesadas' : 'Vuelve más tarde o revisa otro filtro'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitudesFiltradas.map((solicitud) => (
              <SolicitudCard
                key={solicitud.id}
                solicitud={solicitud}
                onValidada={handleValidada}
                onEngancheRecibido={handleEngancheRecibido}
              />
            ))}
          </div>
        )}

        {/* ── Recordatorio comisiones ────────────────────── */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-[#10b981]/8 border border-[#10b981]/20 rounded-xl">
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