// src/pages/preguntas-frecuentes.js
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

// ─── DATA · Preguntas frecuentes ────────────────────────────────────────
const PREGUNTAS_FRECUENTES = [
  {
    categoria: 'Cuenta y registro',
    preguntas: [
      {
        pregunta: '¿Cómo creo una cuenta en MarketDesliz?',
        respuesta:
          'Puedes registrarte con tu número de teléfono (recibirás un código de verificación) o con tu cuenta de Google. Solo necesitas un número de 10 dígitos o un correo electrónico válido.',
      },
      {
        pregunta: '¿Puedo cambiar mi número de teléfono después?',
        respuesta:
          'Sí. Ingresa a tu perfil, en la sección "Agregar número de teléfono" o "Editar información personal" podrás actualizar tu teléfono. Verificaremos que el nuevo número no esté en uso por otra cuenta.',
      },
      {
        pregunta: '¿Qué hago si olvidé mi contraseña?',
        respuesta:
          'Desde el login, selecciona "¿Olvidaste tu contraseña?" e ingresa tu correo. Te enviaremos un enlace para restablecerla.',
      },
      {
        pregunta: '¿Cómo vinculo mi cuenta de Google?',
        respuesta:
          'Ve a tu perfil y busca la sección "Vincular cuenta". Presiona "Continuar con Google" y autoriza el acceso. Podrás iniciar sesión con Google en el futuro.',
      },
    ],
  },
  {
    categoria: 'Productos y compras',
    preguntas: [
      {
        pregunta: '¿Cómo compro un producto?',
        respuesta:
          'Elige el producto, toca "Apartar producto", selecciona tu modalidad (contado, crédito, visita o entrega), completa tus datos y confirma. Un vendedor verificará tu solicitud y te contactará.',
      },
      {
        pregunta: '¿Cuál es la diferencia entre contado y crédito?',
        respuesta:
          'Contado: pagas el total con un descuento del 10% aproximadamente. Crédito: pagas un enganche (15%, 20% o 25%) más pagos semanales desde $50 hasta $500 sin intereses.',
      },
      {
        pregunta: '¿Puedo apartar varios productos a la vez?',
        respuesta:
          'Sí, puedes tener hasta 3 productos en curso simultáneamente. Al completar cada producto, subes de nivel y se desbloquean más beneficios.',
      },
      {
        pregunta: '¿Cómo funcionan las visitas y entregas?',
        respuesta:
          'Si eliges visita, un vendedor de tu zona va a tu domicilio a validar la compra. Si eliges entrega, te llevamos el producto a tu casa. En ambos casos te contactamos primero para coordinar.',
      },
      {
        pregunta: '¿Qué métodos de pago aceptan?',
        respuesta:
          'Pago en efectivo con el cobrador, transferencia bancaria BBVA y pago con QR a través del vendedor.',
      },
    ],
  },
  {
    categoria: 'Crédito y pagos',
    preguntas: [
      {
        pregunta: '¿Cuánto puedo pagar por semana?',
        respuesta:
          'Tú eliges: desde $50 hasta $500 por semana. El sistema ajusta automáticamente el número de semanas según el monto que quieras pagar.',
      },
      {
        pregunta: '¿Cobran intereses?',
        respuesta:
          'No. MarketDesliz no cobra intereses. Lo que acuerdas al firmar es lo que pagas.',
      },
      {
        pregunta: '¿Qué pasa si me atraso con un pago?',
        respuesta:
          'Te contactaremos para recordarte el pago pendiente. Los atrasos pueden afectar tu nivel dentro de la plataforma y limitar tu acceso a nuevas compras o tandas.',
      },
      {
        pregunta: '¿Puedo adelantar pagos?',
        respuesta:
          'Sí, puedes pagar más por semana de lo acordado o adelantar semanas completas. Esto reduce el tiempo total y te permite recibir tu producto más rápido.',
      },
      {
        pregunta: '¿Dónde veo mi historial de pagos?',
        respuesta:
          'En tu perfil, sección "Mis pagos". Ahí verás cada pago con su fecha, monto, estado y la orden a la que pertenece.',
      },
    ],
  },
  {
    categoria: 'Tandas',
    preguntas: [
      {
        pregunta: '¿Qué es una tanda?',
        respuesta:
          'Es un grupo de personas que aportan dinero periódicamente y cada semana (o quincena) un miembro recibe el total reunido. La posición #1 es siempre de MarketDesliz como administrador.',
      },
      {
        pregunta: '¿Cómo me uno a una tanda?',
        respuesta:
          'Completa primero tu verificación KYC. Después, desde la sección Tandas, elige una de tu nivel disponible, paga la cuota de gasolina ($25) y selecciona tu posición.',
      },
      {
        pregunta: '¿Qué es la cuota de gasolina?',
        respuesta:
          'Es un pago único de $25 que cubre gastos administrativos y de gestión de tu tanda. No es reembolsable.',
      },
      {
        pregunta: '¿Qué significa "pago en dos partes"?',
        respuesta:
          'Algunas tandas te permiten pagar el 50% de tu turno al recibirlo y el otro 50% al finalizar la tanda. Recibirás recordatorios para la segunda parte.',
      },
      {
        pregunta: '¿Puedo cambiar mi posición?',
        respuesta:
          'No. Las posiciones se asignan al momento de unirte y no se pueden intercambiar. La #1 siempre pertenece al administrador.',
      },
      {
        pregunta: '¿Qué pasa si abandono la tanda?',
        respuesta:
          'Una vez recibido tu turno, no puedes abandonar hasta completar tus pagos. Abandonar puede resultar en bloqueo de tu cuenta.',
      },
    ],
  },
  {
    categoria: 'Negocios aliados',
    preguntas: [
      {
        pregunta: '¿Cómo registro mi negocio?',
        respuesta:
          'Necesitas un código de invitación. Contáctanos por WhatsApp, acepta colocar una lona oficial de MarketDesliz en tu local y te enviaremos el código para registrarte.',
      },
      {
        pregunta: '¿Cuánto cuesta ser negocio aliado?',
        respuesta:
          'Es gratuito. Solo necesitas colocar la lona oficial de MarketDesliz en tu local para activar tu cuenta.',
      },
      {
        pregunta: '¿Cómo aparezco en la lista de negocios?',
        respuesta:
          'Al registrarte, tu negocio queda en estado "pendiente de activación". Se activa automáticamente cuando realices tu primera compra en MarketDesliz o cuando un administrador lo verifique.',
      },
      {
        pregunta: '¿Puedo editar mi información después?',
        respuesta:
          'Sí, desde tu panel de negocio puedes editar el nombre, categoría, horarios, contacto, redes sociales, imágenes y ubicación.',
      },
    ],
  },
  {
    categoria: 'Servicios',
    preguntas: [
      {
        pregunta: '¿Cómo publico un servicio?',
        respuesta:
          'Ve a la sección Servicios y selecciona "Publicar servicio". Completa la información del servicio (título, descripción, categoría, contacto) y quedará pendiente de aprobación.',
      },
      {
        pregunta: '¿Cómo contacto a un prestador de servicio?',
        respuesta:
          'En la página del servicio verás los botones para llamar, enviar WhatsApp o correo directamente al prestador.',
      },
      {
        pregunta: '¿Los servicios están verificados?',
        respuesta:
          'Todos los servicios publicados pasan por revisión de un administrador antes de aparecer públicamente. Puedes ver la calificación y opiniones de otros clientes.',
      },
    ],
  },
  {
    categoria: 'Fruta y ganado',
    preguntas: [
      {
        pregunta: '¿Cómo compro fruta de temporada?',
        respuesta:
          'Explora la sección Fruta, elige los productos que te interesan y contacta al productor por WhatsApp para coordinar tu pedido y entrega.',
      },
      {
        pregunta: '¿Cómo funciona la compra de ganado?',
        respuesta:
          'En la sección Ganado puedes ver los animales disponibles con raza, edad y peso. Contacta directamente al productor para acordar la compra y el traslado.',
      },
      {
        pregunta: '¿Puedo publicar mi propio ganado?',
        respuesta:
          'Sí, pero requiere que un administrador apruebe tu publicación. Regístrate, publica desde el panel y espera la revisión.',
      },
    ],
  },
  {
    categoria: 'Bolsa de trabajo',
    preguntas: [
      {
        pregunta: '¿Cómo publico una oferta?',
        respuesta:
          'Ve a Bolsa de trabajo, presiona "Publicar oferta" y completa el formulario. Tu publicación quedará pendiente de aprobación por el administrador.',
      },
      {
        pregunta: '¿Puedo editar mi publicación después?',
        respuesta:
          'Sí. Desde "Mis publicaciones" puedes editar o eliminar tus ofertas. Si editas una oferta ya aprobada, volverá a estado pendiente para revisión.',
      },
      {
        pregunta: '¿Cómo contacto a quien publica?',
        respuesta:
          'En el detalle de cada oferta verás el teléfono y correo para contactar directo al publicante por llamada, WhatsApp o correo.',
      },
    ],
  },
  {
    categoria: 'Verificación KYC',
    preguntas: [
      {
        pregunta: '¿Qué es KYC y por qué lo necesito?',
        respuesta:
          'KYC (Know Your Customer) es un proceso de verificación de identidad. Es obligatorio para unirte a tandas, ya que garantiza la seguridad del grupo.',
      },
      {
        pregunta: '¿Qué documentos necesito?',
        respuesta:
          'INE (frontal y trasera), una selfie sosteniendo tu INE y un comprobante de domicilio reciente.',
      },
      {
        pregunta: '¿Cuánto tarda la verificación?',
        respuesta:
          'Entre 24 y 48 horas. Te notificaremos cuando tu verificación sea aprobada o si necesita correcciones.',
      },
      {
        pregunta: '¿Puedo reintentar si me rechazan?',
        respuesta:
          'Sí. Verás el motivo del rechazo en tu perfil y podrás volver a subir tus documentos corregidos.',
      },
    ],
  },
  {
    categoria: 'Cuenta y seguridad',
    preguntas: [
      {
        pregunta: '¿Cómo cambio mi contraseña?',
        respuesta:
          'En tu perfil, sección "Acceso a tu cuenta". También puedes usar la opción "¿Olvidaste tu contraseña?" al iniciar sesión.',
      },
      {
        pregunta: '¿Cómo actualizo mi dirección?',
        respuesta:
          'Ve a tu perfil, presiona "Editar" y actualiza los campos de dirección: calle, número, colonia/sector, municipio, localidad, estado y código postal.',
      },
      {
        pregunta: '¿Qué métodos de acceso tengo?',
        respuesta:
          'Puedes iniciar sesión con tu teléfono (por código SMS), con tu cuenta de Google o con tu correo y contraseña. Puedes vincular varios métodos a la misma cuenta.',
      },
      {
        pregunta: '¿Cómo cierro sesión?',
        respuesta:
          'En tu perfil, presiona el botón "Salir" en la esquina superior de la tarjeta de perfil.',
      },
      {
        pregunta: '¿Dónde veo mis notificaciones?',
        respuesta:
          'En la barra superior, presiona el ícono de campana. Ahí verás todas tus notificaciones recientes.',
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

function AccordionItem({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: `1px solid ${T.line}` }}>
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

function CategoriaSection({ categoria, preguntas }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderTop: `1px solid ${T.line}` }}>
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
export default function PreguntasFrecuentesPage() {
  const router = useRouter();
  const goTo = (path) => router.push(path);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Head>
        <title>Preguntas Frecuentes | MarketDesliz</title>
        <meta
          name="description"
          content="Respuestas a las preguntas más frecuentes sobre MarketDesliz: compras, crédito, tandas, negocios aliados, KYC y más."
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
              Preguntas frecuentes · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Todo lo que<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                preguntan.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Respuestas rápidas a las dudas más comunes sobre la plataforma,
              tus compras, tus tandas y tu cuenta.
            </p>
          </section>

          {/* ═══ ACCESOS RÁPIDOS ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">

              {/* Contacto */}
              <Link
                href="/contacto"
                className="flex items-start justify-between gap-6 pt-6 group"
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
                    className="text-[18px] md:text-[20px] leading-tight tracking-[-0.015em] mb-2"
                    style={{
                      color: T.ink,
                      fontWeight: 400,
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    ¿No encuentras tu respuesta?
                  </h3>
                  <p
                    className="text-[13.5px] leading-[1.55]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Escríbenos y te respondemos a la brevedad.
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  strokeWidth={1.75}
                  style={{
                    color: T.inkFaint,
                    flexShrink: 0,
                    marginTop: '32px',
                  }}
                />
              </Link>

              {/* WhatsApp */}
              <a
                href="https://wa.me/522821414939"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-6 pt-6 group"
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
                  }}
                />
              </a>
            </div>
          </section>

          {/* ═══ PREGUNTAS POR CATEGORÍA ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Categorías</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Explora por
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}tema.
              </span>
            </h2>

            <div className="max-w-3xl flex flex-col">
              {PREGUNTAS_FRECUENTES.map((cat, idx) => (
                <CategoriaSection
                  key={idx}
                  categoria={cat.categoria}
                  preguntas={cat.preguntas}
                />
              ))}
              <div style={{ borderTop: `1px solid ${T.line}` }} />
            </div>
          </section>

          {/* ═══ CTA FINAL ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Aún con dudas</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-6"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Estamos para
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}ayudarte.
              </span>
            </h2>

            <p
              className="text-[14.5px] md:text-[15.5px] leading-[1.7] max-w-xl mb-8"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Si tu pregunta no está en esta lista, contáctanos por WhatsApp y
              te responderemos directamente.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://wa.me/522821414939"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
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
                <MessageCircle size={14} strokeWidth={1.75} /> WhatsApp
              </a>

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
                Centro de ayuda <ArrowRight size={14} strokeWidth={1.75} />
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