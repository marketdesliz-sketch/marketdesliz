// src/pages/solicitar/subir-comprobante.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Upload, FileText, Building2, MessageCircle, CheckCircle,
  AlertCircle, AlertTriangle, Image as ImageIcon, Home,
  Hash, DollarSign, Package,
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

function DetailRow({ label, value, accent = false, mono = false, border = true }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-3.5"
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
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label
      className="block text-[10px] uppercase tracking-[0.22em] mb-2"
      style={{
        color: T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
      {required && <span style={{ color: T.red, marginLeft: '3px' }}>*</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function SubirComprobantePage() {
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState(null);
  const [producto, setProducto] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Init: cargar orden ─────────────────────────────────
  useEffect(() => {
    if (orderId) {
      cargarOrden();
    } else {
      const pendingOrder = localStorage.getItem('pendingOrder');
      if (pendingOrder) {
        const orderData = JSON.parse(pendingOrder);
        cargarOrdenPorId(orderData.id);
      } else {
        router.push('/productos');
      }
    }
  }, [orderId]);

  // ─── Cargar datos del cliente · SIN CAMBIOS ─────────────
  const cargarDatosCliente = async (userId) => {
    try {
      const user = await pb.collection('users').getOne(userId);
      let clientExtended = null;

      try {
        clientExtended = await pb
          .collection('clients')
          .getFirstListItem(`userId = "${userId}"`);
      } catch (e) {
        // No tiene datos extendidos
      }

      setClienteData({
        nombre: user.nombre || 'Sin nombre',
        telefono: user.telefono || 'No registrado',
        colonia: clientExtended?.direccionColonia || 'No especificada',
        direccion: clientExtended?.direccionCalle || 'No registrada',
      });
    } catch (error) {
      console.error('Error cargando cliente:', error);
      setClienteData({
        nombre: 'Sin nombre',
        telefono: 'No registrado',
        colonia: 'No especificada',
      });
    }
  };

  // ─── Cargar orden por orderId · SIN CAMBIOS ─────────────
  const cargarOrden = async () => {
    try {
      const record = await pb.collection('orders').getOne(orderId, {
        expand: 'userId,productId',
      });
      setOrder(record);

      if (record.expand?.userId) {
        await cargarDatosCliente(record.userId);
      } else if (record.userId) {
        await cargarDatosCliente(record.userId);
      }

      if (record.expand?.productId) {
        setProducto(record.expand.productId);
      } else if (record.productId) {
        const productRecord = await pb
          .collection('products')
          .getOne(record.productId);
        setProducto(productRecord);
      }
    } catch (error) {
      console.error('Error cargando orden:', error);
      setError('No se encontró la orden');
    } finally {
      setLoading(false);
    }
  };

  // ─── Cargar orden por pendingOrder · SIN CAMBIOS ────────
  const cargarOrdenPorId = async (id) => {
    try {
      const records = await pb.collection('orders').getFullList({
        filter: `id = "${id}"`,
        expand: 'userId,productId',
      });
      if (records.length > 0) {
        const record = records[0];
        setOrder(record);

        if (record.expand?.userId) {
          await cargarDatosCliente(record.userId);
        } else if (record.userId) {
          await cargarDatosCliente(record.userId);
        }

        if (record.expand?.productId) {
          setProducto(record.expand.productId);
        } else if (record.productId) {
          const productRecord = await pb
            .collection('products')
            .getOne(record.productId);
          setProducto(productRecord);
        }
      }
    } catch (error) {
      console.error('Error cargando orden:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Cambio de archivo · SIN CAMBIOS ────────────────────
  const handleComprobanteChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe exceder los 5MB');
        return;
      }
      setComprobante(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── Submit · SIN CAMBIOS ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comprobante) {
      alert('Por favor selecciona el comprobante de pago');
      return;
    }

    // Validar que no tenga ya un comprobante
    if (order.comprobanteId) {
      setError('Esta orden ya tiene un comprobante asociado');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('comprobante', comprobante);
      formData.append('mensaje', mensaje);
      formData.append('estado', 'pendiente_validacion');

      const comprobanteRecord = await pb
        .collection('comprobantes')
        .create(formData);

      await pb.collection('orders').update(order.id, {
        comprobanteId: comprobanteRecord.id,
        estadoPago: 'pendiente_pago',
        estadoValidacion: 'pendiente',
        fechaComprobante: new Date().toISOString(),
      });

      const monto =
        order.tipo === 'contado'
          ? formatMoney(order.totalPagar)
          : formatMoney(order.enganche || 0);

      const folio = generarFolio(order.id);

      await notificarAdmin(
        `<b>🆕 NUEVO PAGO PENDIENTE DE VALIDACIÓN</b>\n\n` +
          `👤 Cliente: ${clienteData?.nombre || 'Sin nombre'}\n` +
          `📞 Teléfono: ${clienteData?.telefono || 'No registrado'}\n` +
          `🏘️ Colonia: ${clienteData?.colonia || 'No especificada'}\n` +
          `💰 Monto: ${monto}\n` +
          `📦 Producto: ${producto?.nombre || 'No especificado'}\n` +
          `🆔 Folio: ${folio}\n` +
          `📎 Comprobante ID: ${comprobanteRecord.id}\n\n` +
          `🔍 Validar en: /admin/ordenes`,
        'pago'
      );

      setEnviado(true);
      localStorage.removeItem('pendingOrder');
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
      setError(
        'Error al subir el comprobante. Por favor intenta nuevamente.'
      );
    } finally {
      setUploading(false);
    }
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
                Cargando orden
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error sin order ────────────────────────────────────
  if (error && !order) {
    return (
      <>
        <Head><title>Error | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/productos" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <AlertTriangle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Error
              </h1>
              <p
                className="text-[13.5px] mb-8"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 h-11 px-6 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Home size={14} strokeWidth={1.75} /> Volver al inicio
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Pantalla éxito ─────────────────────────────────────
  if (enviado) {
    return (
      <>
        <Head>
          <title>Comprobante enviado | MarketDesliz</title>
          <meta name="theme-color" content="#0F0F0F" />
        </Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
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
                Comprobante enviado
              </p>

              <h1
                className="text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.03em] mb-4"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                En validación
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  por el equipo.
                </span>
              </h1>

              <p
                className="text-[14.5px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Hemos recibido tu comprobante. En las próximas 24 horas
                validaremos tu pago y te notificaremos por WhatsApp.
              </p>

              <div
                className="p-5 mb-8 max-w-md mx-auto"
                style={{
                  background: 'rgba(184, 130, 14, 0.06)',
                  border: `1px solid rgba(184, 130, 14, 0.18)`,
                  borderLeft: '2px solid #B8820E',
                  borderRadius: '6px',
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-[0.18em] mb-2"
                  style={{ color: '#8A6109', fontWeight: 500 }}
                >
                  Guarda este folio
                </p>
                <p
                  className="text-[18px] tabular-nums tracking-[-0.01em]"
                  style={{
                    color: '#8A6109',
                    fontWeight: 500,
                    fontFeatureSettings: '"tnum"',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {generarFolio(order?.id)}
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 h-11 px-6 text-white text-[13px]"
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
                <Home size={14} strokeWidth={1.75} /> Volver al inicio
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Cálculos ───────────────────────────────────────────
  const montoPagar =
    order?.tipo === 'contado' ? order.totalPagar : order?.enganche || 0;
  const folio = generarFolio(order?.id);

  // ─── Formulario ─────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Subir Comprobante | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
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
              Solicitar · Subir comprobante
            </p>

            <h1
              className="text-[36px] md:text-[52px] leading-[1.02] tracking-[-0.035em] max-w-2xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Sube tu comprobante
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                de pago.
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-5 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Adjunta el comprobante de tu transferencia para que podamos
              validar tu pago.
            </p>

            <div className="flex items-center gap-2 mt-5">
              <span
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Folio
              </span>
              <span
                className="text-[12.5px] tabular-nums"
                style={{
                  color: T.ink,
                  fontWeight: 500,
                  fontFeatureSettings: '"tnum"',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {folio}
              </span>
            </div>
          </section>

          {/* ─── Info de la orden ────────────────────────── */}
          <section className="mb-6">
            <SectionLabel>Información de tu orden</SectionLabel>
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
                value={producto?.nombre || order?.productId}
                border={false}
              />
              <DetailRow
                label="Monto a pagar"
                value={formatMoney(montoPagar)}
                accent
              />
              <DetailRow
                label="Tipo"
                value={order?.tipo === 'contado' ? 'Compra de contado' : 'Enganche'}
              />
            </div>
          </section>

          {/* ─── Cuenta destino ──────────────────────────── */}
          <section className="mb-6">
            <SectionLabel>Cuenta para transferencia</SectionLabel>
            <div
              className="px-5 md:px-6"
              style={{
                background: 'rgba(79, 46, 232, 0.03)',
                border: `1px solid rgba(79, 46, 232, 0.12)`,
                borderRadius: '8px',
              }}
            >
              <DetailRow label="Banco" value="BBVA México" border={false} />
              <DetailRow
                label="Beneficiario"
                value="MarketDesliz S.A. de C.V."
              />
              <DetailRow
                label="CLABE"
                value="0123 4567 8901 2345 67"
                mono
              />
              <DetailRow label="Referencia" value={folio} mono />
            </div>
          </section>

          {/* ─── Formulario ──────────────────────────────── */}
          <section className="mb-8">
            <SectionLabel>Adjuntar comprobante</SectionLabel>
            <form
              onSubmit={handleSubmit}
              className="p-6 md:p-8 flex flex-col gap-6"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              {/* Archivo */}
              <div>
                <FieldLabel required>Comprobante de pago</FieldLabel>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleComprobanteChange}
                  required
                  className="w-full outline-none transition-colors file:mr-3 file:py-2 file:px-4 file:border-0 file:cursor-pointer"
                  style={{
                    padding: '12px',
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkSoft,
                    fontSize: '12.5px',
                    fontWeight: 450,
                    WebkitTapHighlightColor: 'transparent',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                />
                <p
                  className="text-[10.5px] mt-2"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  Formatos aceptados: JPG, PNG, PDF — máx 5MB
                </p>

                {comprobantePreview && (
                  <div
                    className="mt-4 p-4"
                    style={{
                      background: 'rgba(15,15,15,0.02)',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {comprobantePreview.startsWith('data:image') ? (
                        <ImageIcon
                          size={12}
                          strokeWidth={1.75}
                          style={{ color: T.inkFaint }}
                        />
                      ) : (
                        <FileText
                          size={12}
                          strokeWidth={1.75}
                          style={{ color: T.inkFaint }}
                        />
                      )}
                      <span
                        className="text-[10px] uppercase tracking-[0.18em]"
                        style={{ color: T.inkFaint, fontWeight: 500 }}
                      >
                        Vista previa
                      </span>
                    </div>
                    {comprobantePreview.startsWith('data:image') ? (
                      <img
                        src={comprobantePreview}
                        alt="Comprobante"
                        className="mx-auto"
                        style={{
                          maxHeight: '192px',
                          border: `1px solid ${T.line}`,
                          borderRadius: '6px',
                        }}
                      />
                    ) : (
                      <p
                        className="text-[12.5px]"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        Archivo PDF seleccionado
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Mensaje */}
              <div>
                <FieldLabel>Mensaje adicional</FieldLabel>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows="3"
                  placeholder="Ej: Transferencia realizada el 25/03/2026, referencia: 123456"
                  className="w-full outline-none resize-none transition-colors"
                  style={{
                    padding: '12px 14px',
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.ink,
                    fontSize: '13.5px',
                    fontWeight: 450,
                    lineHeight: 1.55,
                    fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3"
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
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full inline-flex items-center justify-center gap-2 h-11 text-white text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!uploading)
                    e.currentTarget.style.background = T.accentDeep;
                }}
                onMouseLeave={(e) => {
                  if (!uploading)
                    e.currentTarget.style.background = T.accent;
                }}
              >
                {uploading ? (
                  <>
                    <span
                      className="border-2 border-white/40 border-t-white rounded-full animate-spin"
                      style={{ width: '14px', height: '14px' }}
                    />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Upload size={14} strokeWidth={1.75} /> Enviar comprobante
                  </>
                )}
              </button>
            </form>
          </section>

          {/* ─── Volver ──────────────────────────────────── */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.inkFaint)}
            >
              <Home size={12} strokeWidth={1.75} /> Volver al inicio
            </Link>
          </div>
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