// src/pages/perfil/qr.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronRight, Download, Copy, CheckCircle,
  User, Phone, Fingerprint, QrCode as QrIcon, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import QRCode from 'qrcode';
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

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon
        size={13}
        strokeWidth={1.75}
        style={{ color: T.inkFaint, flexShrink: 0 }}
      />
      <span
        className="text-[10px] uppercase tracking-[0.18em] shrink-0"
        style={{ color: T.inkFaint, fontWeight: 500, minWidth: '72px' }}
      >
        {label}
      </span>
      <span
        className={`text-[13px] truncate ${mono ? 'tabular-nums' : ''}`}
        style={{
          color: T.ink,
          fontWeight: 500,
          fontFeatureSettings: mono ? '"tnum"' : undefined,
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
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
export default function PerfilQRPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    const currentUser = pb.authStore.model;

    if (currentUser?.role === 'vendedor') {
      router.push('/vendedor/qr');
      return;
    }

    setUser(currentUser);
    generarQR(currentUser.id);
  }, []);

  // ─── Generar QR · SIN CAMBIOS (color → T.accent) ────────
  const generarQR = async (userId) => {
    try {
      const qrData = JSON.stringify({
        type: 'cliente',
        id: userId,
        nombre: user?.nombre || '',
        telefono: user?.telefono || '',
        timestamp: Date.now(),
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: T.accent,
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrCode(qrCodeUrl);
    } catch (error) {
      console.error('Error generando QR:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Copiar enlace · SIN CAMBIOS ────────────────────────
  const copiarLink = () => {
    const link = `${window.location.origin}/cobrador/scan?client=${user.id}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // ─── Descargar QR · SIN CAMBIOS ─────────────────────────
  const descargarQR = () => {
    if (!qrCode) return;
    setDescargando(true);
    const link = document.createElement('a');
    link.download = `qr-${user.id}.png`;
    link.href = qrCode;
    link.click();
    setTimeout(() => setDescargando(false), 1000);
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
                Generando código
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
        <title>Mi Código QR | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/perfil" />
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
              Perfil · Código QR
            </p>

            <h1
              className="text-[40px] md:text-[56px] leading-[1.02] tracking-[-0.035em] max-w-2xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Tu código QR
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                de cliente.
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-5 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Presenta este código al cobrador para realizar tus pagos.
            </p>
          </section>

          {/* ─── Card QR ─────────────────────────────────── */}
          <section className="mb-6">
            <div
              className="overflow-hidden"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <div className="p-8 md:p-10 text-center">

                {/* QR */}
                {qrCode && (
                  <div className="flex justify-center mb-8">
                    <img
                      src={qrCode}
                      alt="Código QR del cliente"
                      className="bg-white"
                      style={{
                        width: '256px',
                        height: '256px',
                        padding: '12px',
                        border: `1px solid ${T.line}`,
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-2.5 mb-8">
                  <button
                    onClick={descargarQR}
                    disabled={descargando}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 text-white text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: T.accent,
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: descargando ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                    onMouseEnter={(e) => {
                      if (!descargando)
                        e.currentTarget.style.background = T.accentDeep;
                    }}
                    onMouseLeave={(e) => {
                      if (!descargando)
                        e.currentTarget.style.background = T.accent;
                    }}
                  >
                    <Download size={14} strokeWidth={1.75} />
                    {descargando ? 'Descargando…' : 'Descargar QR'}
                  </button>

                  <button
                    onClick={copiarLink}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 text-[13px] transition-colors"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: copiado ? T.green : T.inkMid,
                      fontWeight: 500,
                      cursor: 'pointer',
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
                    {copiado ? (
                      <CheckCircle size={14} strokeWidth={1.75} />
                    ) : (
                      <Copy size={14} strokeWidth={1.75} />
                    )}
                    {copiado ? 'Enlace copiado' : 'Copiar enlace'}
                  </button>
                </div>

                {/* Info del cliente */}
                <div className="text-left">
                  <SectionLabel>Datos del cliente</SectionLabel>
                  <div
                    style={{
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '0 16px',
                        borderBottom: `1px solid ${T.line}`,
                      }}
                    >
                      <InfoRow
                        icon={User}
                        label="Nombre"
                        value={user?.nombre || 'No especificado'}
                      />
                    </div>
                    <div
                      style={{
                        padding: '0 16px',
                        borderBottom: `1px solid ${T.line}`,
                      }}
                    >
                      <InfoRow
                        icon={Phone}
                        label="Teléfono"
                        value={user?.telefono || 'No especificado'}
                        mono
                      />
                    </div>
                    <div style={{ padding: '0 16px' }}>
                      <InfoRow
                        icon={Fingerprint}
                        label="ID"
                        value={user?.id}
                        mono
                      />
                    </div>
                  </div>
                </div>

                {/* Nota */}
                <p
                  className="text-[11.5px] leading-[1.55] mt-8"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  El cobrador puede escanear este código o usar el enlace
                  para ver tus pagos pendientes.
                </p>
              </div>
            </div>
          </section>
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