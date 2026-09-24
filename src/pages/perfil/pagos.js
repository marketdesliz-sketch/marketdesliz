// src/pages/perfil/pagos.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  DollarSign, CreditCard, Calendar, CheckCircle, Clock,
  AlertCircle, ChevronRight, TrendingUp, Package,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Helpers · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'No definida';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

function StatusBadge({ icon: Icon, label, fg, bg }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1"
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
      <Icon size={10} strokeWidth={2.25} />
      {label}
    </span>
  );
}

function InfoCell({ label, value, accent = false, sub, border = true }) {
  return (
    <div
      className="p-3.5"
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
    >
      <p
        className="text-[9.5px] uppercase tracking-[0.16em] mb-1.5"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className="text-[13px] tabular-nums tracking-[-0.005em]"
        style={{
          color: accent ? T.accent : T.ink,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
        {sub && (
          <span
            className="text-[10.5px] ml-1.5"
            style={{ color: T.inkFaint, fontWeight: 450 }}
          >
            {sub}
          </span>
        )}
      </p>
    </div>
  );
}

function SummaryCell({ label, value, color, border = true }) {
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
        className="text-[20px] md:text-[22px] tabular-nums tracking-[-0.02em] leading-none"
        style={{
          color,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      className="text-left py-3.5 pr-3 text-[9.5px] uppercase tracking-[0.18em]"
      style={{ color: T.inkFaint, fontWeight: 500 }}
    >
      {children}
    </th>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function MisPagosPage() {
  const router = useRouter();
  const { orden: ordenId } = router.query;
  const [pagos, setPagos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (ordenId && ordenes.length > 0) {
      const order = ordenes.find((o) => o.id === ordenId);
      setSelectedOrder(order);
      cargarPagosPorOrden(ordenId);
    }
  }, [ordenId, ordenes]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const user = pb.authStore.model;

      const ordenesData = await pb.collection('orders').getFullList({
        filter: `userId = "${user.id}"`,
        sort: '-created',
        expand: 'productId',
      });
      setOrdenes(ordenesData);

      if (!ordenId) {
        await cargarTodosLosPagos(user.id);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTodosLosPagos = async (userId) => {
    try {
      const pagosData = await pb.collection('payments').getFullList({
        filter: `userId = "${userId}"`,
        sort: '-fechaVencimiento',
        expand: 'orderId',
      });
      setPagos(pagosData);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    }
  };

  const cargarPagosPorOrden = async (orderId) => {
    try {
      const pagosData = await pb.collection('payments').getFullList({
        filter: `orderId = "${orderId}"`,
        sort: 'numeroSemana',
      });
      setPagos(pagosData);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    }
  };

  const getPaymentStatus = (payment) => {
    if (payment.estado === 'pagado') {
      return {
        label: 'Pagado',
        fg: T.green,
        bg: 'rgba(26, 127, 75, 0.08)',
        icon: CheckCircle,
      };
    }
    if (payment.estado === 'atrasado') {
      return {
        label: 'Atrasado',
        fg: T.red,
        bg: 'rgba(197, 48, 48, 0.08)',
        icon: AlertCircle,
      };
    }
    if (payment.estado === 'parcial') {
      return {
        label: 'Parcial',
        fg: T.accent,
        bg: 'rgba(79, 46, 232, 0.08)',
        icon: Clock,
      };
    }
    const dueDate = new Date(payment.fechaVencimiento);
    const today = new Date();
    if (dueDate < today) {
      return {
        label: 'Atrasado',
        fg: T.red,
        bg: 'rgba(197, 48, 48, 0.08)',
        icon: AlertCircle,
      };
    }
    return {
      label: 'Pendiente',
      fg: '#B8820E',
      bg: 'rgba(184, 130, 14, 0.08)',
      icon: Clock,
    };
  };

  const calcularTotalOrden = (orden) => {
    if (orden.tipo === 'contado') {
      return orden.totalPagar || 0;
    } else if (orden.tipo === 'credito') {
      return (
        (orden.enganche || 0) +
        (orden.pagoSemanal || 0) * (orden.semanasTotales || 0)
      );
    }
    return orden.totalPagar || 0;
  };

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
                Cargando pagos
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Render principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>Mis Pagos | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/perfil" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1080px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

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
              Perfil · Pagos
            </p>

            <h1
              className="text-[40px] md:text-[56px] leading-[1.02] tracking-[-0.035em] max-w-2xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Mis pagos
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                y vencimientos.
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-5 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Historial de todos tus pagos realizados.
            </p>
          </section>

          {/* ─── Selector de orden ───────────────────────── */}
          {!ordenId && ordenes.length > 1 && (
            <section className="mb-6">
              <div
                className="p-5"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <SectionLabel>Filtrar por orden</SectionLabel>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      router.push(`/perfil/pagos?orden=${e.target.value}`);
                    } else {
                      router.push('/perfil/pagos');
                    }
                  }}
                  className="w-full outline-none appearance-none transition-colors"
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.ink,
                    fontSize: '13.5px',
                    fontWeight: 450,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transitionTimingFunction: T.ease,
                  }}
                >
                  <option value="">Todas las órdenes</option>
                  {ordenes.map((orden) => (
                    <option key={orden.id} value={orden.id}>
                      {orden.expand?.productId?.nombre || 'Producto'} -{' '}
                      {formatDate(orden.created)}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* ─── Orden seleccionada ──────────────────────── */}
          {selectedOrder && (
            <section className="mb-6">
              <div
                className="overflow-hidden"
                style={{
                  background: 'rgba(79, 46, 232, 0.03)',
                  border: `1px solid rgba(79, 46, 232, 0.15)`,
                  borderRadius: '8px',
                }}
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Package
                      size={14}
                      strokeWidth={1.75}
                      style={{ color: T.accent }}
                    />
                    <h3
                      className="text-[15.5px] leading-snug tracking-[-0.005em]"
                      style={{ color: T.ink, fontWeight: 500 }}
                    >
                      {selectedOrder.expand?.productId?.nombre || 'Producto'}
                    </h3>
                  </div>

                  <div
                    className="grid grid-cols-2 sm:grid-cols-4"
                    style={{
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: T.bg,
                    }}
                  >
                    <InfoCell
                      label="Total"
                      value={formatMoney(calcularTotalOrden(selectedOrder))}
                      accent
                      border={false}
                    />
                    <InfoCell
                      label="Tipo"
                      value={
                        selectedOrder.tipo === 'contado' ? 'Contado' : 'Crédito'
                      }
                    />
                    <InfoCell
                      label="Estado"
                      value={selectedOrder.estadoPago || 'N/A'}
                    />
                    {selectedOrder.tipo === 'credito' ? (
                      <>
                        <InfoCell
                          label="Enganche"
                          value={formatMoney(selectedOrder.enganche || 0)}
                        />
                      </>
                    ) : (
                      <InfoCell label="—" value="—" />
                    )}
                  </div>

                  {selectedOrder.tipo === 'credito' && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        className="flex items-baseline justify-between gap-2 px-4 py-3"
                        style={{
                          background: T.bg,
                          border: `1px solid ${T.line}`,
                          borderRadius: '6px',
                        }}
                      >
                        <span
                          className="text-[10px] uppercase tracking-[0.16em]"
                          style={{ color: T.inkFaint, fontWeight: 500 }}
                        >
                          Pago semanal
                        </span>
                        <span
                          className="text-[13px] tabular-nums"
                          style={{
                            color: T.ink,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {formatMoney(selectedOrder.pagoSemanal || 0)}
                        </span>
                      </div>
                      <div
                        className="flex items-baseline justify-between gap-2 px-4 py-3"
                        style={{
                          background: T.bg,
                          border: `1px solid ${T.line}`,
                          borderRadius: '6px',
                        }}
                      >
                        <span
                          className="text-[10px] uppercase tracking-[0.16em]"
                          style={{ color: T.inkFaint, fontWeight: 500 }}
                        >
                          Semanas
                        </span>
                        <span
                          className="text-[13px] tabular-nums"
                          style={{
                            color: T.ink,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {selectedOrder.semanasTotales || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ─── Lista de pagos ──────────────────────────── */}
          {pagos.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <DollarSign
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                No hay pagos registrados
              </h3>
              <p
                className="text-[13px] max-w-md"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Aún no has realizado ningún pago.
              </p>
            </div>
          ) : (
            <section className="mb-6">
              <div
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                        <Th>#</Th>
                        <Th>Monto</Th>
                        <Th>Fecha límite</Th>
                        <Th>Fecha de pago</Th>
                        <Th>Estado</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => {
                        const status = getPaymentStatus(pago);
                        const StatusIcon = status.icon;
                        return (
                          <tr
                            key={pago.id}
                            style={{ borderBottom: `1px solid ${T.line}` }}
                          >
                            <td
                              className="py-3.5 pr-3 text-[13px] tabular-nums"
                              style={{
                                color: T.ink,
                                fontWeight: 500,
                                fontFeatureSettings: '"tnum"',
                              }}
                            >
                              {pago.numeroSemana === 0
                                ? 'Enganche'
                                : `Semana ${
                                    pago.numeroSemana || pago.semana || 'N/A'
                                  }`}
                            </td>
                            <td
                              className="py-3.5 pr-3 text-[13px] tabular-nums"
                              style={{
                                color: T.ink,
                                fontWeight: 500,
                                fontFeatureSettings: '"tnum"',
                              }}
                            >
                              {formatMoney(
                                pago.estado === 'pagado'
                                  ? pago.montoPagado ||
                                      pago.montoProgramado ||
                                      0
                                  : pago.montoProgramado || pago.monto || 0
                              )}
                            </td>
                            <td
                              className="py-3.5 pr-3 text-[12.5px]"
                              style={{ color: T.inkSoft, fontWeight: 450 }}
                            >
                              {formatDate(pago.fechaVencimiento)}
                            </td>
                            <td
                              className="py-3.5 pr-3 text-[12.5px]"
                              style={{ color: T.inkSoft, fontWeight: 450 }}
                            >
                              {pago.fechaPago ? formatDate(pago.fechaPago) : '—'}
                            </td>
                            <td className="py-3.5">
                              <StatusBadge
                                icon={StatusIcon}
                                label={status.label}
                                fg={status.fg}
                                bg={status.bg}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ─── Resumen ─────────────────────────────────── */}
          {pagos.length > 0 && (
            <section>
              <SectionLabel>Resumen</SectionLabel>
              <div
                className="grid grid-cols-2 sm:grid-cols-4"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <SummaryCell
                  label="Total pagado"
                  value={formatMoney(
                    pagos
                      .filter((p) => p.estado === 'pagado')
                      .reduce(
                        (sum, p) =>
                          sum + (p.montoPagado || p.montoProgramado || 0),
                        0
                      )
                  )}
                  color={T.green}
                  border={false}
                />
                <SummaryCell
                  label="Pendiente"
                  value={formatMoney(
                    pagos
                      .filter((p) => p.estado === 'pendiente')
                      .reduce(
                        (sum, p) => sum + (p.montoProgramado || p.monto || 0),
                        0
                      )
                  )}
                  color="#B8820E"
                />
                <SummaryCell
                  label="Atrasados"
                  value={formatMoney(
                    pagos
                      .filter((p) => {
                        if (p.estado === 'pagado') return false;
                        return new Date(p.fechaVencimiento) < new Date();
                      })
                      .reduce(
                        (sum, p) => sum + (p.montoProgramado || p.monto || 0),
                        0
                      )
                  )}
                  color={T.red}
                />
                <SummaryCell
                  label="Realizados"
                  value={
                    <span>
                      {pagos.filter((p) => p.estado === 'pagado').length}
                      <span
                        style={{
                          color: T.inkFaint,
                          fontWeight: 450,
                          fontSize: '0.65em',
                          marginLeft: '4px',
                        }}
                      >
                        / {pagos.length}
                      </span>
                    </span>
                  }
                  color={T.accent}
                />
              </div>
            </section>
          )}
        </main>

        <Footer variant="minimal" />
      </div>

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