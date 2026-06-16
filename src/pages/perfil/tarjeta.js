// src/pages/perfil/tarjeta.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Printer, AlertTriangle, ChevronLeft, CheckCircle,
  Clock, AlertCircle, CreditCard, X
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import { getOrCreateTarjeta, getDatosTarjetaCompleta, reportarPerdidaTarjeta } from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

export default function TarjetaVirtualPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tarjetaData, setTarjetaData] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [tandas, setTandas] = useState([]);
  const [showReportarPerdida, setShowReportarPerdida] = useState(false);
  const [reportando, setReportando] = useState(false);
  const [lado, setLado] = useState('frente');

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    const currentUser = pb.authStore.model;
    if (currentUser?.role === 'vendedor') { router.push('/vendedor'); return; }
    setUser(currentUser);
    cargarDatos(currentUser.id);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) cargarDatos(user.id);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  const cargarDatos = async (userId) => {
    try {
      setLoading(true);
      const tarjeta = await getOrCreateTarjeta(userId);
      const datos = await getDatosTarjetaCompleta(tarjeta.token);
      const datosSeguros = {
        ...datos,
        planPagos: datos?.planPagos || { totalPagar: 0, enganche: 0, enganchePagado: false, pagosSemanales: [], semanasTotales: 0, pagosRealizados: 0 },
        tandas: datos?.tandas || [],
        pagosAtrasados: datos?.pagosAtrasados || 0,
        estadoColor: datos?.estadoColor || 'green',
        idCliente: datos?.idCliente || 'MDZ-00000',
        cliente: { ...datos?.cliente, nombre: datos?.cliente?.nombre || 'Cliente', telefono: datos?.cliente?.telefono || 'No disponible', foto: datos?.cliente?.foto || null, direccion: datos?.cliente?.direccion || 'Sin dirección registrada' }
      };
      setTarjetaData(datosSeguros);
      const pagosData = await pb.collection('payments').getFullList({ filter: `userId = "${userId}"`, sort: '-fechaVencimiento', expand: 'orderId' });
      setPagos(pagosData || []);
      const tandasData = await pb.collection('tanda_members').getFullList({ filter: `userId = "${userId}" && estadoPago = "al_corriente"`, expand: 'tandaId' });
      setTandas(tandasData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setTarjetaData({ idCliente: 'MDZ-00000', token: 'error', estado: 'activo', estadoColor: 'yellow', pagosAtrasados: 0, planPagos: { totalPagar: 0, enganche: 0, enganchePagado: false, pagosSemanales: [], semanasTotales: 0, pagosRealizados: 0 }, tandas: [], cliente: { id: userId, nombre: 'Cliente', telefono: 'No disponible', foto: null, direccion: 'Sin dirección registrada' } });
      setPagos([]); setTandas([]);
    } finally { setLoading(false); }
  };

  const reportarPerdida = async () => {
    setReportando(true);
    try {
      await reportarPerdidaTarjeta(tarjetaData.id);
      await cargarDatos(user.id);
      setShowReportarPerdida(false);
      alert('✅ Reporte registrado. Puedes imprimir una nueva copia de tu tarjeta con el mismo código QR.');
    } catch (error) { console.error('Error:', error); alert('Error al reportar pérdida'); }
    finally { setReportando(false); }
  };

  const getPagosAtrasados = () => pagos.filter(p => p.estado === 'pendiente' && new Date(p.fechaVencimiento) < new Date());
  const getPagosFuturos  = () => pagos.filter(p => p.estado === 'pendiente' && new Date(p.fechaVencimiento) >= new Date());
  const getPagosRealizados = () => pagos.filter(p => p.estado === 'pagado');

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  const estadoInfo = {
    green:  { label: 'Al corriente', cls: 'bg-[#10b981]/10 text-[#10b981]' },
    yellow: { label: 'En riesgo',    cls: 'bg-amber-50 text-amber-600' },
    red:    { label: 'Atrasado',     cls: 'bg-red-50 text-red-600' },
  }[tarjetaData?.estadoColor || 'green'];

  return (
    <>
      <Head><title>Mi Tarjeta Virtual | MarketDesliz</title></Head>

      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-40 pb-8">

          {/* ── Header ─────────────────────────────────────── */}
          <div className="mb-6">
            <Link href="/perfil" className="inline-flex items-center gap-1.5 text-sm text-[#6C3BFF] font-medium hover:underline mb-4">
              <ChevronLeft size={15} /> Volver a mi perfil
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard size={20} className="text-[#6C3BFF]" /> Mi Tarjeta Virtual
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">Tu tarjeta digital de MarketDesliz</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Printer size={15} /> Imprimir
                </button>
                <button
                  onClick={() => setShowReportarPerdida(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <AlertTriangle size={15} /> Reportar pérdida
                </button>
              </div>
            </div>
          </div>

          {/* ── Selector frente/reverso ─────────────────────── */}
          <div className="flex gap-2 justify-center mb-6">
            {['frente', 'reverso'].map((l) => (
              <button
                key={l}
                onClick={() => setLado(l)}
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
                  lado === l
                    ? 'bg-[#6C3BFF] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* ── Tarjeta visual ──────────────────────────────── */}
          <div className="flex justify-center mb-6">
            {tarjetaData && <TarjetaCliente datos={tarjetaData} tipo={lado} />}
          </div>

          {/* ── Info de la tarjeta ──────────────────────────── */}
          {tarjetaData && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">ID Tarjeta</p>
                  <p className="font-mono font-semibold text-sm text-gray-900">{tarjetaData.idCliente}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    tarjetaData.estado === 'activo' ? 'bg-[#10b981]/10 text-[#10b981]' :
                    tarjetaData.estado === 'inactivo' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {tarjetaData.estado === 'activo' ? 'Activa' : tarjetaData.estado === 'inactivo' ? 'Inactiva' : 'Suspendida'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Pagos</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${estadoInfo.cls}`}>
                    {estadoInfo.label}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Atrasos</p>
                  <p className="font-bold text-sm text-gray-900">{tarjetaData.pagosAtrasados} pagos</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Resumen financiero ──────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: 'Total pagado',
                value: formatMoney(getPagosRealizados().reduce((s, p) => s + (p.montoPagado || p.montoProgramado || 0), 0)),
                color: 'bg-[#10b981]'
              },
              {
                label: 'Próximo pago',
                value: getPagosFuturos().length > 0 ? formatMoney(getPagosFuturos()[0]?.montoProgramado || getPagosFuturos()[0]?.monto || 0) : '$0',
                sub: getPagosFuturos().length > 0 ? `Vence: ${formatDate(getPagosFuturos()[0]?.fechaVencimiento)}` : null,
                color: 'bg-amber-500'
              },
              {
                label: 'Deuda total',
                value: formatMoney(pagos.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado').reduce((s, p) => s + (p.montoProgramado || p.monto || 0), 0)),
                color: 'bg-[#dc3545]'
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className={`${color} rounded-2xl p-4 text-white`}>
                <p className="text-xs text-white/70 mb-1">{label}</p>
                <p className="text-lg font-bold">{value}</p>
                {sub && <p className="text-[10px] text-white/60 mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Historial de pagos ──────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

            {/* Realizados */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <CheckCircle size={15} className="text-[#10b981]" />
                <h2 className="font-semibold text-sm text-gray-900">Pagos realizados</h2>
              </div>
              {getPagosRealizados().length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-400">Sin pagos registrados</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {getPagosRealizados().slice(0, 10).map(pago => (
                    <div key={pago.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{formatMoney(pago.montoPagado || pago.montoProgramado || 0)}</p>
                        <p className="text-xs text-gray-400">{formatDate(pago.fechaPago)}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-[#10b981]/10 text-[#10b981] px-2 py-1 rounded-full">Pagado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pendientes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <Clock size={15} className="text-amber-500" />
                <h2 className="font-semibold text-sm text-gray-900">Pagos pendientes</h2>
              </div>
              {getPagosFuturos().length === 0 && getPagosAtrasados().length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-400">Sin pagos pendientes</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {getPagosAtrasados().length > 0 && (
                    <div className="mx-4 my-3 bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                        <AlertCircle size={12} /> Pagos atrasados
                      </p>
                      {getPagosAtrasados().map(pago => (
                        <div key={pago.id} className="flex justify-between items-center py-1.5 border-b border-red-100 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{formatMoney(pago.montoProgramado || pago.monto || 0)}</p>
                            <p className="text-xs text-red-400">Vencía: {formatDate(pago.fechaVencimiento)}</p>
                          </div>
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">Atrasado</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="divide-y divide-gray-50">
                    {getPagosFuturos().map(pago => (
                      <div key={pago.id} className="flex justify-between items-center px-5 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formatMoney(pago.montoProgramado || pago.monto || 0)}</p>
                          <p className="text-xs text-gray-400">Vence: {formatDate(pago.fechaVencimiento)}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-full">Pendiente</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Tandas activas ──────────────────────────────── */}
          {tandas.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <h2 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#6C3BFF]/8 rounded-lg flex items-center justify-center text-xs">🎯</span>
                Mis tandas activas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tandas.map(tanda => (
                  <div key={tanda.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{tanda.expand?.tandaId?.nombre || 'Tanda'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Posición #{tanda.posicion}</p>
                        <p className="text-xs text-[#6C3BFF] font-semibold mt-1">{formatMoney(tanda.expand?.tandaId?.monto)}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        tanda.estadoPago === 'al_corriente' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {tanda.estadoPago === 'al_corriente' ? 'Activa' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Instrucciones ───────────────────────────────── */}
          <div className="bg-[#6C3BFF]/5 border border-[#6C3BFF]/15 rounded-2xl p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-3">¿Cómo usar tu tarjeta?</h3>
            <ul className="space-y-1.5 text-sm text-gray-500">
              {[
                'Presenta esta tarjeta al cobrador (física o digital)',
                'El cobrador escaneará el código QR',
                'Podrá ver tus pagos pendientes y tandas activas',
                'Si pierdes tu tarjeta, repórtala inmediatamente',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Modal reportar pérdida ──────────────────────── */}
        {showReportarPerdida && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500" /> Reportar pérdida
                </h3>
                <button onClick={() => setShowReportarPerdida(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Al reportar la pérdida, se registrará el incidente. Puedes imprimir una nueva copia de tu tarjeta con el mismo código QR. Los pagos y tandas no se verán afectados.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowReportarPerdida(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={reportarPerdida} disabled={reportando} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors">
                  {reportando ? 'Procesando...' : 'Reportar pérdida'}
                </button>
              </div>
            </div>
          </div>
        )}
      </StoreLayout>
    </>
  );
}