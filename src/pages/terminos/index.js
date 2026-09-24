// src/pages/terminos/index.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChevronRight, ArrowRight, Check, X, AlertTriangle, LogIn,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─── DATA · SIN CAMBIOS ─────────────────────────────────────────────────
const RESPONSABILIDADES = [
  'Realizar los pagos semanales de forma puntual',
  'Mantener comunicación con el administrador',
  'No abandonar la tanda después de recibir el dinero',
  'Respetar el orden de turnos establecido',
  'Notificar cualquier cambio en tus datos de contacto',
];

const SECCIONES = [
  {
    numero: 1,
    titulo: 'Aceptación de términos',
    contenido:
      'Al participar en una tanda de MarketDesliz, aceptas cumplir con todas las reglas establecidas. Las tandas son un compromiso grupal donde la confianza y puntualidad son fundamentales.',
  },
  {
    numero: 2,
    titulo: 'Pagos y gasolina',
    contenido:
      'El pago de gasolina ($25) es único y no reembolsable. Los pagos semanales deben realizarse en la fecha acordada. El retraso en los pagos puede resultar en la pérdida del turno o penalizaciones.',
  },
  {
    numero: 3,
    titulo: 'Turnos y entregas',
    contenido:
      'Los turnos se asignan en orden de registro, con la posición 1 reservada para MarketDesliz (administrador). No se pueden intercambiar posiciones sin autorización.',
  },
  {
    numero: 4,
    titulo: 'Penalizaciones',
    contenido: 'El incumplimiento de pagos puede resultar en:',
    lista: [
      'Pérdida del turno actual',
      'Suspensión temporal de la cuenta',
      'Imposibilidad de unirse a futuras tandas',
    ],
  },
  {
    numero: 5,
    titulo: 'Privacidad',
    contenido:
      'Tu información personal (nombre, teléfono, dirección) será visible solo para otros miembros de la tanda para facilitar la comunicación y confianza grupal. Tus documentos oficiales son privados y solo visibles para el administrador.',
  },
  {
    numero: 6,
    titulo: 'Cancelación',
    contenido:
      'Una vez que recibes tu turno, no puedes cancelar tu participación hasta completar todos los pagos. Si abandonas la tanda sin completar los pagos, tu cuenta será bloqueada.',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
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

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function TerminosPage() {
  const router = useRouter();
  const { user, loading: authLoading, openLogin } = useAuth();

  const [aceptado, setAceptado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Handler: aceptar términos · SIN CAMBIOS ─────────────
  const handleAccept = async () => {
    if (!aceptado) return;

    if (authLoading) return;
    if (!user) {
      openLogin();
      return;
    }

    try {
      setLoading(true);

      try {
        const kyc = await pb.collection('kyc_verifications').getFullList({
          filter: `userId = "${user.id}"`,
          sort: '-created',
          limit: 1,
        });

        if (kyc.length > 0) {
          await pb.collection('kyc_verifications').update(kyc[0].id, {
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString(),
          });
        }
      } catch (kycErr) {
        console.log('Sin KYC registrado para actualizar:', kycErr);
      }

      router.push('/tandas');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aceptar términos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Términos y Condiciones | MarketDesliz</title>
        <meta
          name="description"
          content="Términos y condiciones para participar en las tandas de MarketDesliz."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/tandas" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">

          {/* ═══ HERO EDITORIAL ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-8 md:pt-14 pb-16 md:pb-24">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Documento legal · Tandas
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Términos y<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                condiciones.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Reglas para participar en las tandas de MarketDesliz. Léelas con
              atención antes de aceptar.
            </p>
          </section>

          {/* ═══ RESPONSABILIDADES ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Responsabilidades del participante</SectionLabel>

            <ul className="flex flex-col max-w-3xl">
              {RESPONSABILIDADES.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 py-4"
                  style={{
                    borderTop:
                      i === 0 ? `1px solid ${T.line}` : `1px solid ${T.line}`,
                  }}
                >
                  <Check
                    size={14}
                    strokeWidth={2}
                    style={{
                      color: T.accent,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <span
                    className="text-[14px] leading-[1.6]"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    {item}
                  </span>
                </li>
              ))}
              <div style={{ borderTop: `1px solid ${T.line}` }} />
            </ul>
          </section>

          {/* ═══ REGLAMENTO ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Reglamento</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Todo lo que
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}debes saber.
              </span>
            </h2>

            <div className="max-w-3xl flex flex-col">
              {SECCIONES.map((sec, idx) => (
                <div
                  key={sec.numero}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10 py-8 md:py-10"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    borderBottom:
                      idx === SECCIONES.length - 1
                        ? `1px solid ${T.line}`
                        : 'none',
                  }}
                >
                  <div className="md:col-span-2">
                    <span
                      className="text-[12px] tabular-nums tracking-[0.22em]"
                      style={{
                        color: T.accent,
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {String(sec.numero).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="md:col-span-10">
                    <h3
                      className="text-[18px] md:text-[20px] leading-tight tracking-[-0.015em] mb-3"
                      style={{
                        color: T.ink,
                        fontWeight: 400,
                        fontFeatureSettings: '"ss01"',
                      }}
                    >
                      {sec.titulo}
                    </h3>

                    <p
                      className="text-[14px] leading-[1.7]"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      {sec.contenido}
                    </p>

                    {sec.lista && (
                      <ul className="flex flex-col gap-2 mt-4">
                        {sec.lista.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-[13.5px] leading-[1.6]"
                            style={{ color: T.inkMid, fontWeight: 450 }}
                          >
                            <X
                              size={13}
                              strokeWidth={2}
                              style={{
                                color: T.red,
                                flexShrink: 0,
                                marginTop: 4,
                              }}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!showFull && (
              <div className="max-w-3xl mt-8">
                <button
                  onClick={() => setShowFull(true)}
                  className="inline-flex items-center gap-2 h-10 px-5 text-[12px] uppercase tracking-[0.18em] transition-colors"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
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
                  Leer términos completos
                  <ChevronRight size={13} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </section>

          {/* ═══ ADVERTENCIA ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div
              className="flex items-start gap-3 p-5 max-w-3xl"
              style={{
                background: 'rgba(184, 130, 14, 0.05)',
                border: `1px solid rgba(184, 130, 14, 0.18)`,
                borderLeft: '2px solid #B8820E',
                borderRadius: '6px',
              }}
            >
              <AlertTriangle
                size={15}
                strokeWidth={1.75}
                style={{
                  color: '#B8820E',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <p
                className="text-[13.5px] leading-[1.6]"
                style={{ color: '#8A6109', fontWeight: 450 }}
              >
                <strong style={{ fontWeight: 500 }}>Recuerda:</strong> Las
                tandas son un compromiso serio. Los pagos atrasados afectan a
                todo el grupo.
              </p>
            </div>
          </section>

          {/* ═══ ACEPTAR ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Aceptación</SectionLabel>

            <div className="max-w-3xl">
              <label
                className="flex items-start gap-3 cursor-pointer select-none mb-8"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <input
                  type="checkbox"
                  id="acepto"
                  checked={aceptado}
                  onChange={(e) => setAceptado(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    flexShrink: 0,
                    accentColor: T.accent,
                    cursor: 'pointer',
                  }}
                />
                <span
                  className="text-[13.5px] leading-[1.6]"
                  style={{ color: T.inkMid, fontWeight: 450 }}
                >
                  He leído y acepto los términos y condiciones, y acepto las
                  responsabilidades como participante de la tanda.
                </span>
              </label>

              <button
                onClick={handleAccept}
                disabled={!aceptado || loading || authLoading}
                className="w-full inline-flex items-center justify-center gap-2 h-12 text-white text-[13.5px] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor:
                    !aceptado || loading || authLoading
                      ? 'not-allowed'
                      : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (aceptado && !loading && !authLoading)
                    e.currentTarget.style.background = T.accentDeep;
                }}
                onMouseLeave={(e) => {
                  if (aceptado && !loading && !authLoading)
                    e.currentTarget.style.background = T.accent;
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="border-2 border-white/40 border-t-white rounded-full animate-spin"
                      style={{ width: '14px', height: '14px' }}
                    />
                    Procesando…
                  </>
                ) : !user ? (
                  <>
                    <LogIn size={14} strokeWidth={1.75} /> Iniciar sesión y
                    aceptar
                  </>
                ) : (
                  <>
                    <Check size={14} strokeWidth={2} /> Aceptar y continuar
                  </>
                )}
              </button>

              <p
                className="text-[12px] leading-[1.6] mt-5"
                style={{ color: T.inkFaint, fontWeight: 450 }}
              >
                Al aceptar, confirmas tu compromiso con el grupo. Consulta
                también nuestro{' '}
                <Link
                  href="/privacidad"
                  className="transition-colors"
                  style={{
                    color: T.accent,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    textDecorationThickness: '1px',
                  }}
                >
                  Aviso de Privacidad
                </Link>
                .
              </p>
            </div>
          </section>

          {/* ═══ NAVEGACIÓN SECUNDARIA ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tandas"
                className="inline-flex items-center gap-2 h-11 px-5 text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  color: '#FFFFFF',
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
                Ver tandas <ArrowRight size={14} strokeWidth={1.75} />
              </Link>

              <Link
                href="/ayuda"
                className="inline-flex items-center gap-2 h-11 px-5 text-[13px] transition-colors"
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
                Centro de ayuda
              </Link>
            </div>
          </section>

        </main>

        <Footer />
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