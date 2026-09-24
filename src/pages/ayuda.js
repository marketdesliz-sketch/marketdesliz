// src/pages/ayuda.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronDown, ArrowRight, MessageCircle } from 'lucide-react';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ─── DATA · SIN CAMBIOS ─────────────────────────────────────────────────
const PREGUNTAS_FRECUENTES = [
  {
    categoria: 'Compras',
    preguntas: [
      {
        pregunta: '¿Cómo comprar un producto?',
        respuesta:
          'Selecciona el producto que te interesa, elige tu plan de pago (contado o crédito), completa tus datos y confirma tu solicitud.',
      },
      {
        pregunta: '¿Qué métodos de pago aceptan?',
        respuesta:
          'Aceptamos pagos en efectivo con el cobrador, transferencia bancaria BBVA y pago con QR.',
      },
      {
        pregunta: '¿Puedo apartar un producto?',
        respuesta:
          'Sí, puedes apartar tu producto con un pago inicial (enganche) y pagar el resto en cómodas cuotas semanales.',
      },
    ],
  },
  {
    categoria: 'Crédito',
    preguntas: [
      {
        pregunta: '¿Cómo funciona el crédito?',
        respuesta:
          'Eliges un producto, pagas un enganche (desde 15% del valor) y el resto lo pagas en cuotas semanales sin intereses.',
      },
      {
        pregunta: '¿Cuánto puedo pagar por semana?',
        respuesta:
          'Puedes elegir pagar desde $50 hasta $500 por semana, según tu presupuesto.',
      },
      {
        pregunta: '¿Qué pasa si me atraso en un pago?',
        respuesta:
          'Te contactaremos para recordarte tu pago. Los atrasos pueden afectar tu historial crediticio dentro de la plataforma.',
      },
    ],
  },
  {
    categoria: 'Tandas',
    preguntas: [
      {
        pregunta: '¿Qué es una tanda?',
        respuesta:
          'Una tanda es un grupo de personas que aportan dinero semanalmente y cada semana uno de los miembros recibe el total reunido.',
      },
      {
        pregunta: '¿Cómo me uno a una tanda?',
        respuesta:
          'Completa tu verificación KYC, elige la tanda disponible, paga la cuota de gasolina ($25) y selecciona tu posición.',
      },
      {
        pregunta: '¿La posición #1 es para mí?',
        respuesta:
          'La posición #1 es para MarketDesliz como administrador de la tanda.',
      },
    ],
  },
  {
    categoria: 'Negocios Aliados',
    preguntas: [
      {
        pregunta: '¿Cómo me registro como negocio aliado?',
        respuesta:
          'Contáctanos por WhatsApp, acepta colocar una lona de MarketDesliz en tu local y te daremos un código de invitación para registrarte.',
      },
      {
        pregunta: '¿Qué beneficios tengo como aliado?',
        respuesta:
          'Aparecerás en nuestra plataforma, tendrás mayor visibilidad y recibirás notificaciones cuando los clientes te contacten.',
      },
    ],
  },
  {
    categoria: 'Verificación KYC',
    preguntas: [
      {
        pregunta: '¿Qué es KYC?',
        respuesta:
          'KYC (Know Your Customer) es el proceso de verificación de identidad que realizamos para garantizar la seguridad de las tandas.',
      },
      {
        pregunta: '¿Qué documentos necesito?',
        respuesta:
          'Necesitas subir tu INE (frontal y trasera) y una selfie sosteniendo tu INE.',
      },
      {
        pregunta: '¿Cuánto tiempo tarda la verificación?',
        respuesta:
          'La verificación puede tomar de 24 a 48 horas. Te notificaremos cuando sea aprobada.',
      },
    ],
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

function AccordionItem({ pregunta, respuesta, border = true }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: border ? `1px solid ${T.line}` : 'none' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left transition-colors"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          className="text-[14px] leading-[1.55] transition-colors flex-1"
          style={{
            color: open ? T.accent : T.ink,
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          {pregunta}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.75}
          style={{
            color: open ? T.accent : T.inkFaint,
            flexShrink: 0,
            marginTop: '3px',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: `transform 0.2s ${T.ease}, color 0.2s ${T.ease}`,
          }}
        />
      </button>

      {open && (
        <p
          className="text-[13px] leading-[1.7] pb-5 pr-6 max-w-2xl"
          style={{ color: T.inkSoft, fontWeight: 450 }}
        >
          {respuesta}
        </p>
      )}
    </div>
  );
}

function CategoriaSection({ categoria, preguntas, border = true }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: border ? `1px solid ${T.line}` : 'none' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left transition-colors"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <h2
          className="text-[18px] md:text-[20px] leading-tight tracking-[-0.015em] transition-colors"
          style={{
            color: open ? T.accent : T.ink,
            fontWeight: 400,
            fontFeatureSettings: '"ss01"',
          }}
        >
          {categoria}
        </h2>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          style={{
            color: open ? T.accent : T.inkFaint,
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: `transform 0.2s ${T.ease}, color 0.2s ${T.ease}`,
          }}
        />
      </button>

      {open && (
        <div className="pl-0 md:pl-8 pb-4">
          {preguntas.map((item, i) => (
            <AccordionItem
              key={i}
              pregunta={item.pregunta}
              respuesta={item.respuesta}
              border={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function AyudaPage() {
  const router = useRouter();
  const goTo = (path) => router.push(path);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Head>
        <title>Centro de Ayuda | MarketDesliz</title>
        <meta
          name="description"
          content="Preguntas frecuentes y guías sobre compras a crédito y tandas en MarketDesliz"
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
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
              Centro de ayuda · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              ¿En qué podemos<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                ayudarte?
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Encuentra respuestas a las preguntas más frecuentes sobre
              compras, crédito, tandas y negocios aliados.
            </p>
          </section>

          {/* ═══ ACCESOS RÁPIDOS ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">

              {/* Contacto */}
              <Link
                href="/contacto"
                className="flex items-start justify-between gap-6 pt-6 group transition-colors"
                style={{
                  borderTop: `1px solid ${T.line}`,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-3"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Contacto
                  </p>
                  <h3
                    className="text-[18px] md:text-[20px] leading-tight tracking-[-0.015em] mb-2 transition-colors"
                    style={{
                      color: T.ink,
                      fontWeight: 400,
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    ¿No encuentras lo que buscas?
                  </h3>
                  <p
                    className="text-[13.5px] leading-[1.55] transition-colors"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Escríbenos y te responderemos a la brevedad.
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  strokeWidth={1.75}
                  style={{
                    color: T.inkFaint,
                    flexShrink: 0,
                    marginTop: '32px',
                    transition: `color 0.2s ${T.ease}, transform 0.2s ${T.ease}`,
                  }}
                  className="group-hover:translate-x-1 group-hover:text-[color:var(--accent)]"
                />
              </Link>

              {/* WhatsApp */}
              <a
                href="https://wa.me/522821414939"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-6 pt-6 group transition-colors"
                style={{
                  borderTop: `1px solid ${T.line}`,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-3"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    WhatsApp
                  </p>
                  <h3
                    className="text-[18px] md:text-[20px] leading-tight tracking-[-0.015em] mb-2"
                    style={{
                      color: T.ink,
                      fontWeight: 400,
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    Soporte personalizado
                  </h3>
                  <p
                    className="text-[13.5px] leading-[1.55]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Atención directa con nuestro equipo.
                  </p>
                </div>
                <MessageCircle
                  size={16}
                  strokeWidth={1.75}
                  style={{
                    color: T.inkFaint,
                    flexShrink: 0,
                    marginTop: '32px',
                    transition: `color 0.2s ${T.ease}`,
                  }}
                />
              </a>
            </div>
          </section>

          {/* ═══ PREGUNTAS FRECUENTES ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Preguntas frecuentes</SectionLabel>

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
                {' '}necesitas saber.
              </span>
            </h2>

            <div className="max-w-3xl flex flex-col">
              {PREGUNTAS_FRECUENTES.map((cat, idx) => (
                <CategoriaSection
                  key={idx}
                  categoria={cat.categoria}
                  preguntas={cat.preguntas}
                  border={true}
                />
              ))}
              <div style={{ borderTop: `1px solid ${T.line}` }} />
            </div>

            <div className="mt-12">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 text-[12.5px] uppercase tracking-[0.18em] transition-colors"
                style={{
                  color: T.inkSoft,
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = T.inkSoft)
                }
              >
                ¿Aún tienes dudas? Contáctanos
                <ArrowRight size={13} strokeWidth={1.75} />
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