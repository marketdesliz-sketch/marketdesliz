// src/pages/solicitar/transferencia.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Building2, Copy, CheckCircle, AlertTriangle, MessageCircle,
  Wallet, ArrowRight, DollarSign,
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
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

function BankRow({ label, value, copyText, field, copied, onCopy, mono = false, border = true }) {
  const isCopied = copied === field;

  return (
    <div
      className="flex items-center justify-between gap-4 py-3.5"
      style={{ borderTop: border ? `1px solid ${T.line}` : 'none' }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-[9.5px] uppercase tracking-[0.16em] mb-1.5"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {label}
        </p>
        <p
          className={`text-[13.5px] truncate tracking-[-0.005em] ${
            mono ? 'tabular-nums' : ''
          }`}
          style={{
            color: T.ink,
            fontWeight: 500,
            fontFeatureSettings: mono ? '"tnum"' : undefined,
            fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
          }}
        >
          {value}
        </p>
      </div>

      <button
        onClick={() => onCopy(copyText || value, field)}
        className="inline-flex items-center gap-1.5 h-8 px-3 text-[11px] transition-colors shrink-0"
        style={{
          background: 'transparent',
          border: `1px solid ${T.line}`,
          borderRadius: '6px',
          color: isCopied ? T.green : T.inkMid,
          fontWeight: 500,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transitionTimingFunction: T.ease,
        }}
        onMouseEnter={(e) => {
          if (!isCopied) {
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.color = T.accent;
          }
        }}
        onMouseLeave={(e) => {
          if (!isCopied) {
            e.currentTarget.style.borderColor = T.line;
            e.currentTarget.style.color = T.inkMid;
          }
        }}
        aria-label={`Copiar ${label}`}
      >
        {isCopied ? (
          <>
            <CheckCircle size={11} strokeWidth={2} />
            Copiado
          </>
        ) : (
          <>
            <Copy size={11} strokeWidth={1.75} />
            Copiar
          </>
        )}
      </button>
    </div>
  );
}

function DetailRow({ label, value, accent = false, border = true }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-3"
      style={{ borderTop: border ? `1px solid ${T.line}` : 'none' }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.16em] shrink-0 pt-0.5"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </span>
      <span
        className="text-[13.5px] text-right tabular-nums tracking-[-0.005em] flex-1 min-w-0"
        style={{
          color: accent ? T.accent : T.ink,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function TransferenciaPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Init: leer pendingOrder ────────────────────────────
  useEffect(() => {
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (!pendingOrder) {
      router.push('/productos');
      return;
    }

    const orderData = JSON.parse(pendingOrder);
    setOrder(orderData);
    cargarProducto(orderData.product);
  }, []);

  // ─── Cargar producto · SIN CAMBIOS ──────────────────────
  const cargarProducto = async (productId) => {
    try {
      const record = await pb.collection('products').getOne(productId);
      setProducto({
        id: record.id,
        nombre: record.nombre,
        precio: record.precio,
      });
    } catch (error) {
      console.error('Error cargando producto:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Copiar al portapapeles · SIN CAMBIOS ───────────────
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── Referencia · SIN CAMBIOS ───────────────────────────
  const getReferencia = () => {
    if (!order) return '';
    return `MD-${order.product?.substring(0, 6) || 'GEN'}-${Date.now()
      .toString()
      .slice(-6)}`;
  };

  // ─── Loading ────────────────────────────────────────────
  if (loading || !order || !producto) {
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
                Preparando transferencia
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Derivados ──────────────────────────────────────────
  const tipo = order.tipo || order.tipoSolicitud;
  const esContado = tipo === 'contado';

  const montoPagar = esContado ? order.totalPrice : order.downPayment;

  const clienteNombre = order.clienteData?.nombre || 'Cliente';
  const clienteTelefono = order.clienteData?.telefono || '';
  const clienteColonia = order.clienteData?.colonia || 'No especificada';
  const referencia = getReferencia();
  const montoTexto = formatMoney(montoPagar);

  const whatsappMessage =
    `Hola, soy ${clienteNombre}%0A` +
    `Teléfono: ${clienteTelefono}%0A` +
    `Colonia: ${clienteColonia}%0A` +
    `Realicé una transferencia por ${montoTexto}%0A` +
    `Referencia: ${referencia}%0A` +
    `Adjunto mi comprobante de pago.`;

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '521234567890';

  // ─── Render principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>Transferencia | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/productos" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[720px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

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
              Solicitar · Transferencia bancaria
            </p>

            <h1
              className="text-[36px] md:text-[52px] leading-[1.02] tracking-[-0.035em] max-w-2xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Transferencia
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                bancaria.
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-5 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Realiza tu pago y confirma para activar tu cuenta.
            </p>
          </section>

          {/* ─── Monto a pagar ───────────────────────────── */}
          <section className="mb-8">
            <div
              className="p-6 md:p-8 text-center"
              style={{
                background: 'rgba(79, 46, 232, 0.04)',
                border: `1px solid rgba(79, 46, 232, 0.12)`,
                borderRadius: '8px',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.22em] mb-4"
                style={{
                  color: T.accent,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Monto a pagar
              </p>
              <p
                className="text-[40px] md:text-[52px] tabular-nums tracking-[-0.03em] leading-none mb-3"
                style={{
                  color: T.accent,
                  fontWeight: 500,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {formatMoney(montoPagar)}
              </p>
              <p
                className="text-[12px] uppercase tracking-[0.16em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                {esContado ? 'Pago de contado' : 'Enganche inicial'}
              </p>
            </div>
          </section>

          {/* ─── Datos bancarios ─────────────────────────── */}
          <section className="mb-8">
            <SectionLabel>Datos de la cuenta</SectionLabel>
            <div
              className="px-5 md:px-6"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <BankRow
                label="Banco"
                value="BBVA México"
                field="banco"
                copied={copied}
                onCopy={copyToClipboard}
                border={false}
              />
              <BankRow
                label="Beneficiario"
                value="MarketDesliz S.A. de C.V."
                field="beneficiario"
                copied={copied}
                onCopy={copyToClipboard}
              />
              <BankRow
                label="CLABE Interbancaria"
                value="0123 4567 8901 2345 67"
                copyText="012345678901234567"
                field="clabe"
                copied={copied}
                onCopy={copyToClipboard}
                mono
              />
              <BankRow
                label="Número de cuenta"
                value="1234 5678 9012 3456"
                copyText="1234567890123456"
                field="cuenta"
                copied={copied}
                onCopy={copyToClipboard}
                mono
              />
              <BankRow
                label="Referencia"
                value={referencia}
                field="referencia"
                copied={copied}
                onCopy={copyToClipboard}
                mono
              />
            </div>
          </section>

          {/* ─── Resumen de compra ───────────────────────── */}
          <section className="mb-8">
            <SectionLabel>Resumen de tu compra</SectionLabel>
            <div
              className="px-5 md:px-6"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <DetailRow
                label="Producto"
                value={producto.nombre}
                border={false}
              />
              <DetailRow
                label="Cliente"
                value={order.clienteData?.nombre || '—'}
              />
              <DetailRow
                label="Teléfono"
                value={order.clienteData?.telefono || '—'}
              />
              <DetailRow
                label="Colonia"
                value={order.clienteData?.colonia || 'No especificada'}
              />
              <DetailRow
                label="Tipo"
                value={esContado ? 'Compra de contado' : 'Compra a crédito'}
              />
              {tipo === 'credito' && (
                <>
                  <DetailRow
                    label="Pagos semanales"
                    value={`${formatMoney(order.weeklyAmount)} × ${
                      order.totalWeeks
                    } semanas`}
                  />
                  <DetailRow
                    label="Total a pagar"
                    value={formatMoney(
                      order.downPayment +
                        order.weeklyAmount * order.totalWeeks
                    )}
                    accent
                  />
                </>
              )}
            </div>
          </section>

          {/* ─── Instrucciones ───────────────────────────── */}
          <section className="mb-8">
            <div
              className="p-5 md:p-6"
              style={{
                background: 'rgba(184, 130, 14, 0.05)',
                border: `1px solid rgba(184, 130, 14, 0.18)`,
                borderLeft: '2px solid #B8820E',
                borderRadius: '8px',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: '#B8820E' }}
                />
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: '#8A6109', fontWeight: 500 }}
                >
                  Instrucciones importantes
                </p>
              </div>
              <ul className="flex flex-col gap-2.5">
                {[
                  'Realiza la transferencia por el monto exacto',
                  'Usa la referencia proporcionada para identificarte',
                  'Guarda el comprobante de pago',
                  'Envía el comprobante por WhatsApp al 55 1234 5678',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[13px] leading-[1.55]"
                    style={{ color: '#8A6109', fontWeight: 450 }}
                  >
                    <CheckCircle
                      size={12}
                      strokeWidth={2.25}
                      style={{
                        color: '#B8820E',
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ─── Acciones ────────────────────────────────── */}
          <section className="flex flex-col sm:flex-row gap-2.5 mb-6">
            <Link
              href="/solicitar/confirmacion"
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 text-white text-[13px]"
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
              <Wallet size={14} strokeWidth={1.75} /> Ya realicé el pago
            </Link>

            <button
              onClick={() =>
                (window.location.href = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`)
              }
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 text-white text-[13px]"
              style={{
                background: '#1A7F4B',
                borderRadius: '6px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transitionTimingFunction: T.ease,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = '#15803D')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = '#1A7F4B')
              }
            >
              <MessageCircle size={14} strokeWidth={1.75} /> Enviar por WhatsApp
            </button>
          </section>

          {/* ─── Nota final ──────────────────────────────── */}
          <p
            className="text-center text-[11.5px] leading-[1.55]"
            style={{ color: T.inkFaint, fontWeight: 450 }}
          >
            Tu cuenta se activará en un plazo máximo de 24 horas después de
            confirmar tu pago.
          </p>
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