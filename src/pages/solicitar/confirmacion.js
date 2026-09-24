// src/pages/solicitar/confirmacion.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  CheckCircle, FileText, DollarSign, CreditCard, Phone,
  MessageCircle, AlertCircle, ChevronLeft, Package,
  Wallet, Calendar, AlertTriangle, Home,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { notificarAdmin, formatMoney, generarFolio } from '../../lib/notificaciones';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

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

function DetailRow({ label, value, accent = false, sub, border = true }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-4"
      style={{ borderTop: border ? `1px solid ${T.line}` : 'none' }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.18em] shrink-0 pt-1"
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
        {sub && (
          <span
            className="text-[11px] ml-1.5"
            style={{ color: T.inkFaint, fontWeight: 450 }}
          >
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

function PaymentRow({ label, value, accent = false, big = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <span
        className="text-[11px] uppercase tracking-[0.16em]"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </span>
      <span
        className={`tabular-nums tracking-[-0.01em] ${
          big ? 'text-[22px] md:text-[26px]' : 'text-[14px]'
        }`}
        style={{
          color: accent ? T.green : T.ink,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
          lineHeight: 1,
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
export default function ConfirmacionPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [producto, setProducto] = useState(null);
  const [clienteExistente, setClienteExistente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    buscarOCrearCliente(orderData.clienteData);
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
    }
  };

  // ─── Buscar o crear cliente · SIN CAMBIOS ───────────────
  const buscarOCrearCliente = async (clienteData) => {
    try {
      const existing = await pb
        .collection('users')
        .getFirstListItem(`telefono = "${clienteData.telefono}"`);
      setClienteExistente(existing);
      setLoading(false);
      return existing;
    } catch (error) {
      try {
        const newClient = await pb.collection('users').create({
          nombre: clienteData.nombre,
          telefono: clienteData.telefono,
          email: clienteData.email || '',
          role: 'cliente',
          activo: true,
        });

        await pb.collection('clients').create({
          userId: newClient.id,
          direccionCalle: clienteData.direccion || '',
          direccionColonia: clienteData.colonia || '',
          direccionMunicipio: clienteData.municipio || '',
          direccionCiudad: clienteData.ciudad || '',
          direccionEstado: clienteData.estado || '',
          direccionCp: clienteData.cp || '',
          direccionReferencias: clienteData.referencias || '',
          telefonoAlternativo: clienteData.telefonoAlternativo || '',
          diaPago: clienteData.diaPago || 'lunes',
          estadoKyc: 'pendiente',

          nivel: 0,
          productosComprados: 0,
          productosPagados: 0,
          productosEnCurso: 0,
          deudaActual: 0,
          limiteDeuda: 5000,
          trustScore: 0,
          datosCompletos: false,
        });

        setClienteExistente(newClient);
        setLoading(false);
        return newClient;
      } catch (createError) {
        console.error('Error creando cliente:', createError);
        setErrorMsg('Error al crear el cliente');
        setLoading(false);
        return null;
      }
    }
  };

  // ─── Guardar orden · SIN CAMBIOS ────────────────────────
  const guardarOrdenEnPocketBase = async (orderData, clienteId) => {
    try {
      setSaving(true);
      setErrorMsg('');

      const orderToSave = {
        userId: clienteId,
        productId: orderData.product,
        totalPagar: orderData.totalPrice,
        tipo: orderData.tipo || orderData.tipoSolicitud,
        estadoPago: 'pendiente',

        enganche: 0,
        pagoSemanal: 0,
        semanasTotales: 0,
        saldoRestante: 0,
      };

      if ((orderData.tipo || orderData.tipoSolicitud) === 'contado') {
        orderToSave.metodoPago = orderData.paymentMethod || 'qr_vendedor';
      }

      if ((orderData.tipo || orderData.tipoSolicitud) === 'credito') {
        orderToSave.enganche = orderData.downPayment || 0;
        orderToSave.pagoSemanal = orderData.weeklyAmount || 0;
        orderToSave.semanasTotales = orderData.totalWeeks || 0;
        orderToSave.saldoRestante = orderData.remainingBalance || 0;
        orderToSave.metodoPago = orderData.paymentMethod || 'qr_vendedor';
      }

      console.log('📦 Datos a guardar:', orderToSave);

      const createdOrder = await pb.collection('orders').create(orderToSave);
      console.log('✅ Orden guardada:', createdOrder);

      localStorage.setItem('lastOrderId', createdOrder.id);
      localStorage.removeItem('pendingOrder');
      setSaved(true);

      if (orderData.paymentMethod === 'transferencia') {
        const folio = generarFolio(createdOrder.id);
        await notificarAdmin(
          `<b>🆕 NUEVA ORDEN - TRANSFERENCIA PENDIENTE</b>\n\n` +
            `👤 Cliente: ${orderData.clienteData?.nombre}\n` +
            `📞 Teléfono: ${orderData.clienteData?.telefono}\n` +
            `💰 Total: ${formatMoney(orderData.totalPrice)}\n` +
            `🆔 Folio: ${folio}\n\n` +
            `💳 Método: Transferencia pendiente de validación`,
          'pago'
        );
      }
    } catch (error) {
      console.error('❌ Error guardando orden:', error);

      if (error.data?.data) {
        const errores = Object.entries(error.data.data)
          .map(([campo, info]) => `${campo}: ${info.message}`)
          .join(', ');
        setErrorMsg(`Error en campos: ${errores}`);
      } else {
        setErrorMsg(error.message || 'Error al guardar la solicitud');
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Auto-save cuando order + cliente listos ────────────
  useEffect(() => {
    if (order && clienteExistente && !saved && !errorMsg && !saving) {
      guardarOrdenEnPocketBase(order, clienteExistente.id);
    }
  }, [order, clienteExistente]);

  // ─── Helpers ────────────────────────────────────────────
  const getTipoTexto = () => {
    const tipos = {
      contado: 'Compra de Contado',
      credito: 'Compra a Crédito',
      visita: 'Solicitud de Visita',
      entrega: 'Solicitud de Entrega',
    };
    return tipos[order?.tipo || order?.tipoSolicitud] || 'Solicitud';
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
                Procesando solicitud
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Cálculos ───────────────────────────────────────────
  const tipo = order.tipo || order.tipoSolicitud;
  const esPago = tipo === 'contado' || tipo === 'credito';
  const esContacto = tipo === 'visita' || tipo === 'entrega';

  const montoPagar =
    tipo === 'contado' ? order.totalPrice : order.downPayment;

  // ─── Render principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>Confirmación | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/productos" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[840px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero editorial ─────────────────────────── */}
          <section className="mb-10 text-center">
            <div
              className="inline-flex items-center justify-center mb-6"
              style={{
                width: '72px',
                height: '72px',
                background: 'rgba(26, 127, 75, 0.08)',
                borderRadius: '14px',
              }}
            >
              <CheckCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.green }}
              />
            </div>

            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-4"
              style={{
                color: T.green,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Solicitud recibida
            </p>

            <h1
              className="text-[32px] md:text-[48px] leading-[1.05] tracking-[-0.035em] mb-4 max-w-2xl mx-auto"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              ¡Solicitud
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}registrada!
              </span>
            </h1>

            <p
              className="text-[15px] leading-[1.55] max-w-md mx-auto"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Tu solicitud ha sido recibida correctamente.
            </p>

            {saved && (
              <p
                className="text-[11.5px] uppercase tracking-[0.18em] mt-4"
                style={{ color: T.green, fontWeight: 500 }}
              >
                ✓ Guardada en nuestro sistema
              </p>
            )}

            {errorMsg && (
              <div
                className="mt-6 max-w-md mx-auto flex items-start gap-2.5 px-4 py-3 text-left"
                style={{
                  background: 'rgba(197, 48, 48, 0.06)',
                  border: `1px solid rgba(197, 48, 48, 0.15)`,
                  borderLeft: `2px solid ${T.red}`,
                  borderRadius: '6px',
                }}
              >
                <AlertCircle
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: T.red, flexShrink: 0, marginTop: 2 }}
                />
                <p
                  className="text-[12.5px] leading-[1.55]"
                  style={{ color: T.red, fontWeight: 450 }}
                >
                  {errorMsg}
                </p>
              </div>
            )}
          </section>

          {/* ─── Detalles de la solicitud ────────────────── */}
          <section className="mb-8">
            <SectionLabel>Detalles de tu solicitud</SectionLabel>
            <div
              className="px-5 md:px-6"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <DetailRow
                label="Tipo de solicitud"
                value={getTipoTexto()}
                accent
                border={false}
              />
              <DetailRow label="Producto" value={producto.nombre} />
              <DetailRow
                label="Cliente"
                value={order.clienteData?.nombre || '—'}
              />
              <DetailRow
                label="Teléfono"
                value={order.clienteData?.telefono || '—'}
              />
              <DetailRow
                label="Dirección"
                value={order.clienteData?.direccion || '—'}
              />
            </div>
          </section>

          {/* ─── Pago (contado / crédito) ────────────────── */}
          {esPago && (
            <section className="mb-8">
              <SectionLabel>Información de pago</SectionLabel>
              <div
                className="px-5 md:px-6 py-4"
                style={{
                  background: 'rgba(79, 46, 232, 0.03)',
                  border: `1px solid rgba(79, 46, 232, 0.12)`,
                  borderRadius: '8px',
                }}
              >
                {tipo === 'contado' && (
                  <div>
                    <PaymentRow
                      label="Total a pagar"
                      value={formatMoney(montoPagar)}
                      accent
                      big
                    />
                    <div
                      className="pt-4 mt-2"
                      style={{ borderTop: `1px solid ${T.line}` }}
                    >
                      <div className="flex items-center gap-2.5">
                        {order.paymentMethod === 'qr' ? (
                          <CreditCard
                            size={13}
                            strokeWidth={1.75}
                            style={{ color: T.inkFaint }}
                          />
                        ) : (
                          <Wallet
                            size={13}
                            strokeWidth={1.75}
                            style={{ color: T.inkFaint }}
                          />
                        )}
                        <span
                          className="text-[12.5px]"
                          style={{ color: T.inkMid, fontWeight: 450 }}
                        >
                          {order.paymentMethod === 'qr'
                            ? 'QR con vendedor'
                            : 'Transferencia BBVA'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {tipo === 'credito' && (
                  <div>
                    <PaymentRow
                      label="Enganche inicial"
                      value={formatMoney(order.downPayment)}
                      accent
                    />
                    <PaymentRow
                      label="Pagos semanales"
                      value={formatMoney(order.weeklyAmount)}
                      sub={`× ${order.totalWeeks} semanas`}
                    />
                    <div
                      className="pt-4 mt-2"
                      style={{ borderTop: `1px solid ${T.line}` }}
                    >
                      <PaymentRow
                        label="Total a pagar"
                        value={formatMoney(
                          order.downPayment +
                            order.weeklyAmount * order.totalWeeks
                        )}
                        accent
                        big
                      />
                    </div>
                  </div>
                )}

                {order.paymentMethod === 'transferencia' && saved && (
                  <Link
                    href={`/solicitar/subir-comprobante?orderId=${localStorage.getItem('lastOrderId')}`}
                    className="flex items-center justify-center gap-2 h-11 mt-5 text-white text-[13px]"
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
                    Subir comprobante de pago →
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* ─── Próximos pasos (visita / entrega) ───────── */}
          {esContacto && (
            <section className="mb-8">
              <SectionLabel>Próximos pasos</SectionLabel>
              <div
                className="p-5 md:p-6"
                style={{
                  background: 'rgba(184, 130, 14, 0.05)',
                  border: `1px solid rgba(184, 130, 14, 0.18)`,
                  borderLeft: '2px solid #B8820E',
                  borderRadius: '8px',
                }}
              >
                <p
                  className="text-[13.5px] leading-[1.6] mb-5"
                  style={{ color: '#8A6109', fontWeight: 450 }}
                >
                  Un asesor se pondrá en contacto contigo en las próximas 24
                  horas para coordinar{' '}
                  {tipo === 'visita'
                    ? 'la visita a domicilio.'
                    : 'la entrega del producto.'}
                </p>

                <div
                  className="p-4"
                  style={{
                    background: T.bg,
                    border: `1px solid rgba(184, 130, 14, 0.15)`,
                    borderRadius: '6px',
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] mb-3"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    ¿Necesitas ayuda?
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <Phone
                        size={13}
                        strokeWidth={1.75}
                        style={{ color: T.accent, flexShrink: 0 }}
                      />
                      <span
                        className="text-[13px] tabular-nums"
                        style={{
                          color: T.ink,
                          fontWeight: 500,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        (123) 456-7890
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MessageCircle
                        size={13}
                        strokeWidth={1.75}
                        style={{ color: T.green, flexShrink: 0 }}
                      />
                      <span
                        className="text-[13px] tabular-nums"
                        style={{
                          color: T.ink,
                          fontWeight: 500,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        55 1234 5678
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── Acciones finales ────────────────────────── */}
          <section className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 text-[13px] transition-colors"
              style={{
                background: 'transparent',
                border: `1px solid ${T.line}`,
                borderRadius: '6px',
                color: T.inkMid,
                fontWeight: 500,
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
                transitionTimingFunction: T.ease,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <Home size={14} strokeWidth={1.75} /> Volver al inicio
            </Link>

            <Link
              href={`/productos/${producto.id}`}
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
              <Package size={14} strokeWidth={1.75} /> Ver más productos
            </Link>
          </section>

          {/* ─── Guardando ───────────────────────────────── */}
          {saving && (
            <p
              className="text-center text-[11px] uppercase tracking-[0.24em] mt-8"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              Guardando tu solicitud…
            </p>
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