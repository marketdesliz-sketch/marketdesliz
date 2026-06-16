// src/pages/vendedor/historial.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronRight, Calendar, Package, CreditCard,
  CheckCircle, Clock, XCircle, AlertCircle,
  Search, TrendingUp, Users, DollarSign, FileText,
  Eye, Home, Filter, Inbox
} from 'lucide-react';
import VendedorLayout from '../../layouts/VendedorLayout';
import pb from '../../lib/pocketbase';
import { getHistorialSolicitudes } from '../../lib/vendedorService';

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
    month: 'short',
    year: 'numeric'
  });
};

export default function VendedorHistorialPage() {
  const router = useRouter();
  const [vendedor, setVendedor] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;

  useEffect(() => {
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

    cargarDatos(user);
  }, []);

  const cargarDatos = async (user) => {
    try {
      setLoading(true);
      const vendedorData = await pb.collection('vendedores').getFirstListItem(`userId = "${user.id}"`);
      setVendedor(vendedorData);
      const historial = await getHistorialSolicitudes(vendedorData.id);
      setSolicitudes(historial);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'vendedor_validado':
        return { label: 'Validada por ti', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle };
      case 'admin_validado':
        return { label: 'Aprobada por admin', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', icon: CheckCircle };
      case 'completada':
        return { label: 'Completada', color: 'text-gray-600', bg: 'bg-gray-100', icon: CheckCircle };
      case 'cancelada':
        return { label: 'Cancelada', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
      default:
        return { label: estado, color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle };
    }
  };

  const solicitudesFiltradas = solicitudes.filter(sol => {
    if (filtro !== 'todas' && sol.estado !== filtro) return false;
    if (busqueda) {
      const nombre = sol.expand?.clienteId?.nombre?.toLowerCase() || '';
      const telefono = sol.expand?.clienteId?.telefono || '';
      const busquedaLower = busqueda.toLowerCase();
      if (!nombre.includes(busquedaLower) && !telefono.includes(busquedaLower)) return false;
    }
    return true;
  });

  const totalPaginas = Math.ceil(solicitudesFiltradas.length / itemsPorPagina);
  const solicitudesPaginadas = solicitudesFiltradas.slice(
    (pagina - 1) * itemsPorPagina,
    pagina * itemsPorPagina
  );

  const estadisticas = {
    total: solicitudes.length,
    validados: solicitudes.filter(s => s.estado === 'vendedor_validado').length,
    aprobados: solicitudes.filter(s => s.estado === 'admin_validado').length,
    completados: solicitudes.filter(s => s.estado === 'completada').length,
    cancelados: solicitudes.filter(s => s.estado === 'cancelada').length,
    totalEnganches: solicitudes.reduce((sum, s) => sum + (s.enganche || 0), 0)
  };

  const statCards = [
    { label: 'Total solicitudes', value: estadisticas.total, icon: FileText, color: 'text-gray-900', bg: 'bg-gray-100', num: true },
    { label: 'Validados', value: estadisticas.validados, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Aprobados', value: estadisticas.aprobados, icon: CheckCircle, color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
    { label: 'Completados', value: estadisticas.completados, icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Cancelados', value: estadisticas.cancelados, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total enganches', value: formatMoney(estadisticas.totalEnganches), icon: DollarSign, color: 'text-[#6C3BFF]', bg: 'bg-[#6C3BFF]/8' },
  ];

  const filtros = [
    { key: 'todas', label: 'Todas', count: solicitudes.length },
    { key: 'vendedor_validado', label: 'Validados', count: estadisticas.validados },
    { key: 'admin_validado', label: 'Aprobados', count: estadisticas.aprobados },
    { key: 'completada', label: 'Completados', count: estadisticas.completados },
    { key: 'cancelada', label: 'Cancelados', count: estadisticas.cancelados },
  ];

  if (loading) {
    return (
      <VendedorLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </VendedorLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Historial | MarketDesliz Vendedor</title>
      </Head>

      <VendedorLayout>
        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Historial de solicitudes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Todas las solicitudes que has procesado</p>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, color, bg, num }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className={`font-bold text-gray-900 ${num ? 'text-2xl' : 'text-lg'}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Filtros y búsqueda ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {filtros.map(({ key, label, count }) => {
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
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* ── Tabla de historial ─────────────────────────── */}
        {solicitudesPaginadas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-14 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Inbox size={28} className="text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              No hay solicitudes
            </h3>
            <p className="text-xs text-gray-400">
              {busqueda ? 'No se encontraron resultados para tu búsqueda' : 'Aún no has procesado ninguna solicitud'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enganche</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {solicitudesPaginadas.map((solicitud) => {
                    const estadoInfo = getEstadoInfo(solicitud.estado);
                    const EstadoIcon = estadoInfo.icon;
                    const cliente = solicitud.expand?.clienteId;
                    const producto = solicitud.expand?.productoId;
                    
                    return (
                      <tr key={solicitud.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(solicitud.created)}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-sm text-gray-900">{cliente?.nombre || 'Cliente'}</p>
                          <p className="text-xs text-gray-400">{cliente?.telefono}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-gray-900">{producto?.nombre || solicitud.productoNombre}</p>
                          <p className="text-xs text-gray-400">{formatMoney(solicitud.productoPrecio)}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                            {solicitud.tipo === 'credito' ? <CreditCard size={11} /> : <DollarSign size={11} />}
                            {solicitud.tipo === 'credito' ? 'Crédito' : 'Contado'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-semibold ${solicitud.enganchePagado ? 'text-[#10b981]' : 'text-amber-600'}`}>
                            {formatMoney(solicitud.enganche)}
                          </span>
                          {solicitud.enganchePagado && (
                            <p className="text-[10px] text-gray-400">Recibido</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${estadoInfo.bg} ${estadoInfo.color}`}>
                            <EstadoIcon size={10} /> {estadoInfo.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/vendedor/solicitudes/${solicitud.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[#6C3BFF] hover:gap-2 transition-all"
                          >
                            Ver <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Paginación ──────────────────────────────────── */}
            {totalPaginas > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-gray-100">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
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
