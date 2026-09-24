// src/pages/perfil/ordenes.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Package, ChevronRight, Clock, CheckCircle, XCircle,
  AlertCircle, CreditCard, DollarSign, Calendar,
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
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'Fecha no definida';
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
      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1"
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

function TipoBadge({ tipo }) {
  const esCredito = tipo === 'credito';
  const Icon = esCredito ? CreditCard : DollarSign;
  const fg = esCredito ? T.accent : T.green;
  const bg = esCredito
    ? 'rgba(79, 46, 232, 0.08)'
    : 'rgba(26, 127, 75, 0.08)';

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
      {esCredito ? 'Crédito' : 'Contado'}
    </span>
  );
}

function InfoCell({ label, value, accent = false, border = true, sub }) {
  return (
    <div
      className="p-3.5"
      style={{
        borderLeft: border ? `1px solid ${T.line}` : 'none',
        borderTop: `1px solid ${T.line}`,
      }}
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

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function MisOrdenesPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const user = pb.authStore.model;

      const ordenesData = await pb.collection('orders').getFullList({
        filter: `userId = "${user.id}"`,
        sort: '-created',
        expand: 'productId',
      });

      setOrdenes(ordenesData);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (estado, tipoSolicitud) => {
    const statusMap = {
      pendiente_pago: {
        label: 'Pendiente',
        fg: '#B8820E',
        bg: 'rgba(184, 130, 14, 0.08)',
        icon: Clock,
      },
      activa: {
        label: 'Activa',
        fg: T.accent,
        bg: 'rgba(79, 46, 232, 0.08)',
        icon: CheckCircle,
      },
      completada: {
        label: 'Completada',
        fg: T.green,
        bg: 'rgba(26, 127, 75, 0.08)',
        icon: CheckCircle,
      },
      cancelada: {
        label: 'Cancelada',
        fg: T.red,
        bg: 'rgba(197, 48, 48, 0.08)',
        icon: XCircle,
      },
    };
    return (
      statusMap[estado] || {
        label: estado,
        fg: T.inkSoft,
        bg: 'rgba(15, 15, 15, 0.05)',
        icon: AlertCircle,
      }
    );
  };

  const getFilteredOrders = () => {
    if (filter === 'activas') {
      return ordenes.filter(
        (o) => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago'
      );
    }
    if (filter === 'completadas') {
      return ordenes.filter((o) => o.estadoPago === 'completada');
    }
    return ordenes;
  };

  const filteredOrdenes = getFilteredOrders();

  const filters = [
    { id: 'todas', label: 'Todas' },
    { id: 'activas', label: 'Activas' },
    { id: 'completadas', label: 'Completadas' },
  ];

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
                Cargando órdenes
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
        <title>Mis Órdenes | MarketDesliz</title>
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
              Perfil · Órdenes
            </p>

            <h1
              className="text-[40px] md:text-[56px] leading-[1.02] tracking-[-0.035em] max-w-2xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Mis órdenes
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                e historial.
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-5 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Historial completo de tus compras en MarketDesliz.
            </p>
          </section>

          {/* ─── Filtros ─────────────────────────────────── */}
          <section className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {filters.map((f) => {
                  const isActive = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className="h-8 px-3 text-[12px] transition-colors"
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
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <span
                className="text-[11px] tabular-nums"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {filteredOrdenes.length}{' '}
                {filteredOrdenes.length === 1 ? 'orden' : 'órdenes'}
              </span>
            </div>
          </section>

          {/* ─── Lista ───────────────────────────────────── */}
          {filteredOrdenes.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <Package
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                No tienes órdenes
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Aún no has realizado ninguna compra.
              </p>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  textDecoration: 'none',
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
                Ver productos <ChevronRight size={14} strokeWidth={1.75} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredOrdenes.map((orden) => {
                const status = getStatusInfo(orden.estadoPago);
                const StatusIcon = status.icon;
                const esCredito = orden.tipo === 'credito';
                const total = esCredito
                  ? (orden.enganche || 0) +
                    (orden.pagoSemanal || 0) * (orden.semanasTotales || 0)
                  : orden.totalPagar;

                return (
                  <div
                    key={orden.id}
                    className="flex flex-col"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="p-5 md:p-6">
                      {/* Header card */}
                      <div className="flex justify-between items-start gap-3 mb-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-[15.5px] leading-snug tracking-[-0.005em] truncate"
                            style={{ color: T.ink, fontWeight: 500 }}
                          >
                            {orden.expand?.productId?.nombre ||
                              orden.productName ||
                              'Producto'}
                          </h3>
                          <div className="mt-2">
                            <TipoBadge tipo={orden.tipo} />
                          </div>
                        </div>
                        <StatusBadge
                          icon={StatusIcon}
                          label={status.label}
                          fg={status.fg}
                          bg={status.bg}
                        />
                      </div>

                      {/* Info grid */}
                      <div
                        className="grid grid-cols-2 sm:grid-cols-4"
                        style={{
                          border: `1px solid ${T.line}`,
                          borderRadius: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        <InfoCell
                          label="Fecha"
                          value={formatDate(orden.created)}
                          border={false}
                        />
                        <InfoCell
                          label="Total"
                          value={formatMoney(total)}
                          accent
                        />
                        {esCredito && (
                          <>
                            <InfoCell
                              label="Enganche"
                              value={formatMoney(orden.enganche)}
                            />
                            <InfoCell
                              label="Pago semanal"
                              value={formatMoney(orden.pagoSemanal)}
                              sub={`× ${orden.semanasTotales} sem`}
                            />
                          </>
                        )}
                      </div>

                      {/* Acciones */}
                      <div
                        className="flex flex-wrap gap-5 mt-5 pt-4"
                        style={{ borderTop: `1px solid ${T.line}` }}
                      >
                        <Link
                          href={`/perfil/ordenes/${orden.id}`}
                          className="inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
                          style={{
                            color: T.accent,
                            fontWeight: 500,
                            textDecoration: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            transitionTimingFunction: T.ease,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.gap = '10px')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.gap = '6px')
                          }
                        >
                          Ver detalles <ChevronRight size={13} strokeWidth={1.75} />
                        </Link>

                        {orden.estadoPago === 'activa' && (
                          <Link
                            href={`/perfil/pagos?orden=${orden.id}`}
                            className="inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
                            style={{
                              color: T.green,
                              fontWeight: 500,
                              textDecoration: 'none',
                              WebkitTapHighlightColor: 'transparent',
                              transitionTimingFunction: T.ease,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.gap = '10px')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.gap = '6px')
                            }
                          >
                            Ver pagos <ChevronRight size={13} strokeWidth={1.75} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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