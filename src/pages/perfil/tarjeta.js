// src/pages/perfil/tarjeta.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Printer, AlertTriangle, ChevronLeft, CheckCircle,
  Clock, AlertCircle, CreditCard, X, Target,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import {
  getOrCreateTarjeta,
  getDatosTarjetaCompleta,
  reportarPerdidaTarjeta,
} from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Helpers · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-4"
      style={{
        color: accent ? T.accent : T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
    </p>
  );
}

function InfoCell({ label, value, accent = false, border = true, mono = false }) {
  return (
    <div
      className="p-4"
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
    >
      <p
        className="text-[9.5px] uppercase tracking-[0.16em] mb-2"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className={`text-[13px] tabular-nums tracking-[-0.005em] ${mono ? '' : ''}`}
        style={{
          color: accent ? T.accent : T.ink,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function EstadoBadge({ label, fg, bg }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1"
      style={{
        background: bg,
        color: fg,
        borderRadius: '4px',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function SummaryTile({ label, value, sub, color, border = true }) {
  return (
    <div
      className="p-5"
      style={{
        borderLeft: border ? `1px solid ${T.line}` : 'none',
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: border ? 1 : 0,
          right: 0,
          height: '2px',
          background: color,
          opacity: 0.85,
        }}
      />
      <p
        className="text-[9.5px] uppercase tracking-[0.18em] mb-3"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className="text-[20px] md:text-[22px] tabular-nums tracking-[-0.02em] leading-none"
        style={{
          color,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-[10.5px] mt-2 tabular-nums"
          style={{
            color: T.inkFaint,
            fontWeight: 450,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function PaymentRow({ pago, variant }) {
  // variant: 'pagado' | 'pendiente' | 'atrasado'
  const colors = {
    pagado: { fg: T.green, bg: 'rgba(26, 127, 75, 0.08)', label: 'Pagado' },
    pendiente: { fg: '#B8820E', bg: 'rgba(184, 130, 14, 0.08)', label: 'Pendiente' },
    atrasado: { fg: T.red, bg: 'rgba(197, 48, 48, 0.08)', label: 'Atrasado' },
  };
  const c = colors[variant];

  const amount =
    variant === 'pagado'
      ? pago.montoPagado || pago.montoProgramado || 0
      : pago.montoProgramado || pago.monto || 0;

  const dateLabel =
    variant === 'pagado'
      ? formatDate(pago.fechaPago)
      : `Vence: ${formatDate(pago.fechaVencimiento)}`;

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p
          className="text-[14px] tabular-nums tracking-[-0.005em]"
          style={{
            color: T.ink,
            fontWeight: 500,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {formatMoney(amount)}
        </p>
        <p
          className="text-[11px] mt-0.5 tabular-nums"
          style={{
            color: T.inkFaint,
            fontWeight: 450,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {dateLabel}
        </p>
      </div>
      <EstadoBadge label={c.label} fg={c.fg} bg={c.bg} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
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

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    const currentUser = pb.authStore.model;
    if (currentUser?.role === 'vendedor') {
      router.push('/vendedor');
      return;
    }
    setUser(currentUser);
    cargarDatos(currentUser.id);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id)
        cargarDatos(user.id);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  // ─── Cargar datos · SIN CAMBIOS ─────────────────────────
  const cargarDatos = async (userId) => {
    try {
      setLoading(true);
      const tarjeta = await getOrCreateTarjeta(userId);
      const datos = await getDatosTarjetaCompleta(tarjeta.token);
      const datosSeguros = {
        ...datos,
        planPagos: datos?.planPagos || {
          totalPagar: 0,
          enganche: 0,
          enganchePagado: false,
          pagosSemanales: [],
          semanasTotales: 0,
          pagosRealizados: 0,
        },
        tandas: datos?.tandas || [],
        pagosAtrasados: datos?.pagosAtrasados || 0,
        estadoColor: datos?.estadoColor || 'green',
        idCliente: datos?.idCliente || 'MDZ-00000',
        cliente: {
          ...datos?.cliente,
          nombre: datos?.cliente?.nombre || 'Cliente',
          telefono: datos?.cliente?.telefono || 'No disponible',
          foto: datos?.cliente?.foto || null,
          direccion: datos?.cliente?.direccion || 'Sin dirección registrada',
        },
      };
      setTarjetaData(datosSeguros);

      const pagosData = await pb.collection('payments').getFullList({
        filter: `userId = "${userId}"`,
        sort: '-fechaVencimiento',
        expand: 'orderId',
      });
      setPagos(pagosData || []);

      const tandasData = await pb.collection('tanda_members').getFullList({
        filter: `userId = "${userId}" && estadoPago = "al_corriente"`,
        expand: 'tandaId',
      });
      setTandas(tandasData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setTarjetaData({
        idCliente: 'MDZ-00000',
        token: 'error',
        estado: 'activo',
        estadoColor: 'yellow',
        pagosAtrasados: 0,
        planPagos: {
          totalPagar: 0,
          enganche: 0,
          enganchePagado: false,
          pagosSemanales: [],
          semanasTotales: 0,
          pagosRealizados: 0,
        },
        tandas: [],
        cliente: {
          id: userId,
          nombre: 'Cliente',
          telefono: 'No disponible',
          foto: null,
          direccion: 'Sin dirección registrada',
        },
      });
      setPagos([]);
      setTandas([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Reportar pérdida · SIN CAMBIOS ─────────────────────
  const reportarPerdida = async () => {
    setReportando(true);
    try {
      await reportarPerdidaTarjeta(tarjetaData.id);
      await cargarDatos(user.id);
      setShowReportarPerdida(false);
      alert(
        '✅ Reporte registrado. Puedes imprimir una nueva copia de tu tarjeta con el mismo código QR.'
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Error al reportar pérdida');
    } finally {
      setReportando(false);
    }
  };

  // ─── Derivados · SIN CAMBIOS ────────────────────────────
  const getPagosAtrasados = () =>
    pagos.filter(
      (p) => p.estado === 'pendiente' && new Date(p.fechaVencimiento) < new Date()
    );
  const getPagosFuturos = () =>
    pagos.filter(
      (p) =>
        p.estado === 'pendiente' &&
        new Date(p.fechaVencimiento) >= new Date()
    );
  const getPagosRealizados = () => pagos.filter((p) => p.estado === 'pagado');

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Head><title>Cargando | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span
                className="font-serif text-[32px] block mb-5 select-none"
                style={{ color: T.inkGhost }}
              >
                ʃƪʃƪ
              </span>
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Cargando tarjeta
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Estado info · SIN CAMBIOS (shape → style objects) ──
  const estadoInfo = {
    green: {
      label: 'Al corriente',
      fg: T.green,
      bg: 'rgba(26, 127, 75, 0.08)',
    },
    yellow: {
      label: 'En riesgo',
      fg: '#B8820E',
      bg: 'rgba(184, 130, 14, 0.08)',
    },
    red: {
      label: 'Atrasado',
      fg: T.red,
      bg: 'rgba(197, 48, 48, 0.08)',
    },
  }[tarjetaData?.estadoColor || 'green'];

  // ─── Render principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>Mi Tarjeta Virtual | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/perfil" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[840px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero editorial ─────────────────────────── */}
          <section className="mb-10">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Perfil · Tarjeta virtual
            </p>

            <h1
              className="text-[40px] md:text-[56px] leading-[1.02] tracking-[-0.035em] max-w-2xl mb-6"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Tu tarjeta
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                MarketDesliz.
              </span>
            </h1>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentDeep)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
              >
                <Printer size={14} strokeWidth={1.75} /> Imprimir
              </button>

              <button
                onClick={() => setShowReportarPerdida(true)}
                className="inline-flex items-center gap-2 h-11 px-5 text-[13px] transition-colors"
                style={{
                  background: 'transparent',
                  border: `1px solid rgba(197, 48, 48, 0.22)`,
                  borderRadius: '6px',
                  color: T.red,
                  fontWeight: 500,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(197, 48, 48, 0.04)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <AlertTriangle size={14} strokeWidth={1.75} /> Reportar pérdida
              </button>
            </div>
          </section>

          {/* ─── Selector frente/reverso ─────────────────── */}
          <section className="mb-8">
            <div className="flex gap-1.5">
              {['frente', 'reverso'].map((l) => {
                const isActive = lado === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLado(l)}
                    className="h-9 px-5 text-[12px] capitalize transition-colors"
                    style={{
                      background: isActive ? T.ink : 'transparent',
                      color: isActive ? T.bg : T.inkMid,
                      border: `1px solid ${isActive ? T.ink : T.line}`,
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── Tarjeta visual ──────────────────────────── */}
          <section className="mb-10 flex justify-center">
            {tarjetaData && (
              <TarjetaCliente datos={tarjetaData} tipo={lado} />
            )}
          </section>

          {/* ─── Info de la tarjeta ──────────────────────── */}
          {tarjetaData && (
            <section className="mb-10">
              <SectionLabel>Información de la tarjeta</SectionLabel>
              <div
                className="grid grid-cols-2 md:grid-cols-4"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <InfoCell
                  label="ID Tarjeta"
                  value={tarjetaData.idCliente}
                  border={false}
                  mono
                />
                <div
                  className="p-4"
                  style={{ borderLeft: `1px solid ${T.line}` }}
                >
                  <p
                    className="text-[9.5px] uppercase tracking-[0.16em] mb-2"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Estado
                  </p>
                  <EstadoBadge
                    label={
                      tarjetaData.estado === 'activo'
                        ? 'Activa'
                        : tarjetaData.estado === 'inactivo'
                        ? 'Inactiva'
                        : 'Suspendida'
                    }
                    fg={
                      tarjetaData.estado === 'activo'
                        ? T.green
                        : tarjetaData.estado === 'inactivo'
                        ? T.red
                        : '#B8820E'
                    }
                    bg={
                      tarjetaData.estado === 'activo'
                        ? 'rgba(26, 127, 75, 0.08)'
                        : tarjetaData.estado === 'inactivo'
                        ? 'rgba(197, 48, 48, 0.08)'
                        : 'rgba(184, 130, 14, 0.08)'
                    }
                  />
                </div>
                <div
                  className="p-4"
                  style={{ borderLeft: `1px solid ${T.line}` }}
                >
                  <p
                    className="text-[9.5px] uppercase tracking-[0.16em] mb-2"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Pagos
                  </p>
                  <EstadoBadge
                    label={estadoInfo.label}
                    fg={estadoInfo.fg}
                    bg={estadoInfo.bg}
                  />
                </div>
                <InfoCell
                  label="Atrasos"
                  value={`${tarjetaData.pagosAtrasados} pagos`}
                />
              </div>
            </section>
          )}

          {/* ─── Resumen financiero ──────────────────────── */}
          <section className="mb-10">
            <SectionLabel>Resumen financiero</SectionLabel>
            <div
              className="grid grid-cols-1 sm:grid-cols-3"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <SummaryTile
                label="Total pagado"
                value={formatMoney(
                  getPagosRealizados().reduce(
                    (s, p) => s + (p.montoPagado || p.montoProgramado || 0),
                    0
                  )
                )}
                color={T.green}
                border={false}
              />
              <SummaryTile
                label="Próximo pago"
                value={
                  getPagosFuturos().length > 0
                    ? formatMoney(
                        getPagosFuturos()[0]?.montoProgramado ||
                          getPagosFuturos()[0]?.monto ||
                          0
                      )
                    : '$0'
                }
                sub={
                  getPagosFuturos().length > 0
                    ? `Vence: ${formatDate(
                        getPagosFuturos()[0]?.fechaVencimiento
                      )}`
                    : null
                }
                color="#B8820E"
              />
              <SummaryTile
                label="Deuda total"
                value={formatMoney(
                  pagos
                    .filter(
                      (p) =>
                        p.estado === 'pendiente' || p.estado === 'atrasado'
                    )
                    .reduce(
                      (s, p) => s + (p.montoProgramado || p.monto || 0),
                      0
                    )
                )}
                color={T.red}
              />
            </div>
          </section>

          {/* ─── Historial de pagos ──────────────────────── */}
          <section className="mb-10">
            <SectionLabel>Historial de pagos</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Realizados */}
              <div
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-4"
                  style={{ borderBottom: `1px solid ${T.line}` }}
                >
                  <CheckCircle
                    size={13}
                    strokeWidth={1.75}
                    style={{ color: T.green }}
                  />
                  <h2
                    className="text-[12px] uppercase tracking-[0.18em]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    Pagos realizados
                  </h2>
                </div>
                {getPagosRealizados().length === 0 ? (
                  <div className="py-12 text-center">
                    <p
                      className="text-[12.5px]"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Sin pagos registrados
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {getPagosRealizados()
                      .slice(0, 10)
                      .map((pago, idx) => (
                        <div
                          key={pago.id}
                          style={{
                            borderTop: idx === 0 ? 'none' : `1px solid ${T.line}`,
                          }}
                        >
                          <PaymentRow pago={pago} variant="pagado" />
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Pendientes */}
              <div
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-4"
                  style={{ borderBottom: `1px solid ${T.line}` }}
                >
                  <Clock
                    size={13}
                    strokeWidth={1.75}
                    style={{ color: '#B8820E' }}
                  />
                  <h2
                    className="text-[12px] uppercase tracking-[0.18em]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    Pagos pendientes
                  </h2>
                </div>
                {getPagosFuturos().length === 0 &&
                getPagosAtrasados().length === 0 ? (
                  <div className="py-12 text-center">
                    <p
                      className="text-[12.5px]"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Sin pagos pendientes
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {getPagosAtrasados().length > 0 && (
                      <div className="p-4">
                        <div
                          className="p-3.5"
                          style={{
                            background: 'rgba(197, 48, 48, 0.04)',
                            border: `1px solid rgba(197, 48, 48, 0.15)`,
                            borderLeft: `2px solid ${T.red}`,
                            borderRadius: '6px',
                          }}
                        >
                          <p
                            className="text-[10px] uppercase tracking-[0.18em] mb-2.5 flex items-center gap-1.5"
                            style={{ color: T.red, fontWeight: 500 }}
                          >
                            <AlertCircle size={11} strokeWidth={2.25} />
                            Pagos atrasados
                          </p>
                          {getPagosAtrasados().map((pago, idx) => (
                            <div
                              key={pago.id}
                              className="flex justify-between items-center py-2"
                              style={{
                                borderTop:
                                  idx === 0 ? 'none' : `1px solid rgba(197, 48, 48, 0.12)`,
                              }}
                            >
                              <div>
                                <p
                                  className="text-[13px] tabular-nums"
                                  style={{
                                    color: T.ink,
                                    fontWeight: 500,
                                    fontFeatureSettings: '"tnum"',
                                  }}
                                >
                                  {formatMoney(
                                    pago.montoProgramado || pago.monto || 0
                                  )}
                                </p>
                                <p
                                  className="text-[11px] mt-0.5 tabular-nums"
                                  style={{
                                    color: T.red,
                                    fontWeight: 450,
                                    fontFeatureSettings: '"tnum"',
                                  }}
                                >
                                  Vencía: {formatDate(pago.fechaVencimiento)}
                                </p>
                              </div>
                              <EstadoBadge
                                label="Atrasado"
                                fg={T.red}
                                bg="rgba(197, 48, 48, 0.12)"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {getPagosFuturos().map((pago, idx) => (
                      <div
                        key={pago.id}
                        style={{
                          borderTop:
                            idx === 0 && getPagosAtrasados().length === 0
                              ? 'none'
                              : `1px solid ${T.line}`,
                        }}
                      >
                        <PaymentRow pago={pago} variant="pendiente" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ─── Tandas activas ──────────────────────────── */}
          {tandas.length > 0 && (
            <section className="mb-10">
              <SectionLabel>Tandas activas</SectionLabel>
              <div
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {tandas.map((tanda, idx) => (
                  <div
                    key={tanda.id}
                    className="p-5"
                    style={{
                      borderTop:
                        idx === 0 || (idx === 1 && tandas.length > 1)
                          ? 'none'
                          : `1px solid ${T.line}`,
                      borderLeft:
                        idx % 2 === 1 ? `1px solid ${T.line}` : 'none',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[14px] truncate tracking-[-0.005em]"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {tanda.expand?.tandaId?.nombre || 'Tanda'}
                        </p>
                        <p
                          className="text-[11px] mt-1 tabular-nums"
                          style={{
                            color: T.inkFaint,
                            fontWeight: 450,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          Posición #{tanda.posicion}
                        </p>
                        <p
                          className="text-[13px] mt-2 tabular-nums tracking-[-0.005em]"
                          style={{
                            color: T.accent,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {formatMoney(tanda.expand?.tandaId?.monto)}
                        </p>
                      </div>
                      <EstadoBadge
                        label={
                          tanda.estadoPago === 'al_corriente'
                            ? 'Activa'
                            : 'Pendiente'
                        }
                        fg={
                          tanda.estadoPago === 'al_corriente'
                            ? T.green
                            : '#B8820E'
                        }
                        bg={
                          tanda.estadoPago === 'al_corriente'
                            ? 'rgba(26, 127, 75, 0.08)'
                            : 'rgba(184, 130, 14, 0.08)'
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Instrucciones ───────────────────────────── */}
          <section>
            <div
              className="p-6"
              style={{
                background: 'rgba(79, 46, 232, 0.04)',
                border: `1px solid rgba(79, 46, 232, 0.12)`,
                borderRadius: '8px',
              }}
            >
              <SectionLabel accent>¿Cómo usar tu tarjeta?</SectionLabel>
              <ul className="flex flex-col gap-2.5">
                {[
                  'Presenta esta tarjeta al cobrador (física o digital)',
                  'El cobrador escaneará el código QR',
                  'Podrá ver tus pagos pendientes y tandas activas',
                  'Si pierdes tu tarjeta, repórtala inmediatamente',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[13px] leading-[1.55]"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    <CheckCircle
                      size={13}
                      strokeWidth={2}
                      style={{ color: T.accent, flexShrink: 0, marginTop: 2 }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        <Footer variant="minimal" />
      </div>

      {/* ─── Modal reportar pérdida ──────────────────────── */}
      {showReportarPerdida && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => !reportando && setShowReportarPerdida(false)}
        >
          <div
            className="p-6 max-w-md w-full"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={18}
                  strokeWidth={1.75}
                  style={{ color: T.red, flexShrink: 0 }}
                />
                <h3
                  className="text-[16px] leading-tight tracking-[-0.01em]"
                  style={{ color: T.ink, fontWeight: 500 }}
                >
                  Reportar pérdida
                </h3>
              </div>
              <button
                onClick={() => !reportando && setShowReportarPerdida(false)}
                disabled={reportando}
                className="flex items-center justify-center shrink-0 disabled:opacity-50"
                style={{
                  width: '28px',
                  height: '28px',
                  background: 'rgba(15,15,15,0.03)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  cursor: reportando ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Cerrar"
              >
                <X size={12} strokeWidth={1.75} />
              </button>
            </div>

            <p
              className="text-[13px] leading-[1.6] mb-6"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Al reportar la pérdida, se registrará el incidente. Puedes
              imprimir una nueva copia de tu tarjeta con el mismo código QR.
              Los pagos y tandas no se verán afectados.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowReportarPerdida(false)}
                disabled={reportando}
                className="flex-1 h-11 text-[13px] transition-colors disabled:opacity-50"
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontWeight: 500,
                  cursor: reportando ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!reportando)
                    e.currentTarget.style.background = 'rgba(15,15,15,0.03)';
                }}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Cancelar
              </button>
              <button
                onClick={reportarPerdida}
                disabled={reportando}
                className="flex-1 h-11 text-white text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: T.red,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: reportando ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!reportando) e.currentTarget.style.background = '#A02424';
                }}
                onMouseLeave={(e) => {
                  if (!reportando) e.currentTarget.style.background = T.red;
                }}
              >
                {reportando ? 'Procesando…' : 'Reportar pérdida'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display',
            'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family:
            ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino',
            Georgia, 'Times New Roman', serif;
        }
        ::selection {
          background: rgba(79, 46, 232, 0.12);
          color: #0F0F0F;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
      `}</style>
    </>
  );
}