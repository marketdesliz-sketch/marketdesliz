// src/pages/acerca-de-nosotros.js
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Check, Phone } from 'lucide-react';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ─── DATA · SIN CAMBIOS ─────────────────────────────────────────────────
const VALORES = [
  {
    titulo: 'Compra segura',
    descripcion:
      'Vendedores verificados y sistema de pagos transparente con historial completo.',
  },
  {
    titulo: 'Pagos flexibles',
    descripcion:
      'Desde $50 hasta $500 por semana. Tú eliges el plan que mejor se adapte a ti.',
  },
  {
    titulo: 'Sube de nivel',
    descripcion:
      'Cada producto que pagas te acerca a mejores beneficios y tandas exclusivas.',
  },
  {
    titulo: 'Casa por casa',
    descripcion:
      'Compra sin tarjeta de crédito, sin trámites bancarios, directo con tu vendedor.',
  },
  {
    titulo: 'Cerca de ti',
    descripcion:
      'Vendedores y negocios aliados en tu colonia, atención personalizada.',
  },
  {
    titulo: 'Sin intereses',
    descripcion:
      'Compra a crédito sin intereses ocultos. Lo que ves es lo que pagas.',
  },
];

const PASOS = [
  {
    numero: '01',
    titulo: 'Elige tu producto',
    descripcion:
      'Navega el catálogo, elige tu producto y decide si quieres comprar de contado o a crédito con pagos semanales.',
  },
  {
    numero: '02',
    titulo: 'Valida con tu vendedor',
    descripcion:
      'Un vendedor verificado valida tu solicitud, recibe tu enganche y te entrega tu producto en tu domicilio.',
  },
  {
    numero: '03',
    titulo: 'Paga y sube de nivel',
    descripcion:
      'Paga semanalmente, completa tus productos y sube de nivel para acceder a tandas y mejores beneficios.',
  },
];

const ACTORES = [
  {
    titulo: 'Cliente',
    subtitulo: 'Compra fácil y sin tarjeta',
    beneficios: [
      'Compra a crédito sin tarjeta bancaria',
      'Hasta 3 productos en curso a la vez',
      'Deuda máxima de $5,000',
      'Sube de nivel al completar pagos',
      'Acceso a tandas exclusivas',
      'Tarjeta virtual con QR',
    ],
  },
  {
    titulo: 'Vendedor',
    subtitulo: 'Gana comisiones por cada venta',
    beneficios: [
      '18% de comisión cada venta realizada',
      'Pago de comisiones diarias o semanalmente',
      'Trabajo flexible, sin horarios',
      'Panel con estadísticas en vivo',
      'QR personal para validar ventas',
      'Soporte del equipo MarketDesliz',
    ],
  },
  {
    titulo: 'Negocio Aliado',
    subtitulo: 'Llega a más clientes cerca de ti',
    beneficios: [
      'Aparece en la plataforma',
      'Mayor visibilidad en tu zona',
      'Notificaciones de clientes',
      'Lona oficial de MarketDesliz',
      'Registro con código de invitación',
    ],
  },
];

const NIVELES = [
  { nivel: 0, nombre: 'Básico',   productos: 0,  tanda: '$0' },
  { nivel: 1, nombre: 'Bronce',   productos: 3,  tanda: '$1,000' },
  { nivel: 2, nombre: 'Plata',    productos: 5,  tanda: '$5,000' },
  { nivel: 3, nombre: 'Oro',      productos: 10, tanda: '$10,000' },
  { nivel: 4, nombre: 'Platino',  productos: 20, tanda: '$20,000' },
  { nivel: 5, nombre: 'Diamante', productos: 30, tanda: '$30,000' },
  { nivel: 6, nombre: 'Zafiro',   productos: 40, tanda: '$40,000' },
  { nivel: 7, nombre: 'Rubí',     productos: 50, tanda: '$50,000' },
];

const STATS = [
  { valor: '3', label: 'Actores del sistema' },
  { valor: '8', label: 'Niveles de fidelización' },
  { valor: '$50–$500', label: 'Pago semanal flexible' },
  { valor: '15–25%', label: 'Enganche desde' },
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
export default function AcercaDeNosotrosPage() {
  const router = useRouter();
  const goTo = (path) => router.push(path);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Head>
        <title>Acerca de nosotros | MarketDesliz</title>
        <meta
          name="description"
          content="MarketDesliz es la plataforma de compras a crédito con pagos semanales, tandas exclusivas y vendedores verificados en tu colonia."
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
              Acerca de nosotros · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Compra fácil,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                paga a tu ritmo.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              MarketDesliz conecta a las familias mexicanas con los productos que
              necesitan, sin tarjeta de crédito y con la confianza de un vendedor
              verificado de tu colonia.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                onClick={() => goTo('/productos')}
                className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
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
                Ver productos <ArrowRight size={14} strokeWidth={1.75} />
              </button>

              <button
                onClick={() => goTo('/como-funciona')}
                className="inline-flex items-center gap-2 h-11 px-5 text-[13px] transition-colors"
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
                Cómo funciona
              </button>
            </div>
          </section>

          {/* ═══ STATS ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className="py-6 md:py-8"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    borderLeft:
                      i === 0 || (i === 2 && true) ? 'none' : `1px solid ${T.line}`,
                    paddingLeft: i % 2 === 1 || (i === 2) ? '24px' : '0',
                  }}
                >
                  <p
                    className="text-[28px] md:text-[36px] tabular-nums tracking-[-0.03em] leading-none mb-2"
                    style={{
                      color: T.ink,
                      fontWeight: 400,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {stat.valor}
                  </p>
                  <p
                    className="text-[11px] md:text-[12px] uppercase tracking-[0.18em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ MISIÓN / VISIÓN ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
              <div className="pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-4"
                  style={{ color: T.accent, fontWeight: 500 }}
                >
                  Misión
                </p>
                <h2
                  className="text-[26px] md:text-[34px] leading-[1.1] tracking-[-0.025em] mb-5"
                  style={{
                    color: T.ink,
                    fontWeight: 400,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Acceso sin
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}barreras.
                  </span>
                </h2>
                <p
                  className="text-[14.5px] md:text-[15.5px] leading-[1.7]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Llevar productos de calidad a cada hogar, ofreciendo planes de
                  pago accesibles y un modelo de confianza donde el cliente decide
                  cómo y cuándo pagar. Creemos que todos merecen acceso a lo que
                  necesitan, sin barreras bancarias.
                </p>
              </div>

              <div className="pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-4"
                  style={{ color: T.accent, fontWeight: 500 }}
                >
                  Visión
                </p>
                <h2
                  className="text-[26px] md:text-[34px] leading-[1.1] tracking-[-0.025em] mb-5"
                  style={{
                    color: T.ink,
                    fontWeight: 400,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  La red más
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}confiable.
                  </span>
                </h2>
                <p
                  className="text-[14.5px] md:text-[15.5px] leading-[1.7]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Ser la red de comercio más confiable de México, donde cada
                  colonia tenga acceso a productos de calidad, vendedores
                  honestos y oportunidades de crecimiento para clientes,
                  vendedores y negocios aliados.
                </p>
              </div>
            </div>
          </section>

          {/* ═══ VALORES ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>¿Por qué elegirnos?</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Lo que nos hace
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}diferentes.
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
              {VALORES.map((valor, i) => (
                <div
                  key={i}
                  className="pt-5"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <h3
                    className="text-[16px] md:text-[17px] mb-2.5 tracking-[-0.01em]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {valor.titulo}
                  </h3>
                  <p
                    className="text-[13.5px] leading-[1.6]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    {valor.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ CÓMO FUNCIONA · 3 PASOS ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Cómo funciona</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Comprar es así
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}de fácil.
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {PASOS.map((paso) => (
                <div
                  key={paso.numero}
                  className="flex flex-col pt-5"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <span
                    className="text-[13px] tabular-nums tracking-[0.14em] mb-4"
                    style={{
                      color: T.accent,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {paso.numero}
                  </span>
                  <h3
                    className="text-[18px] md:text-[20px] leading-snug tracking-[-0.01em] mb-3"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {paso.titulo}
                  </h3>
                  <p
                    className="text-[14px] leading-[1.65]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    {paso.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ ACTORES ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Nuestro ecosistema</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-3xl mb-4"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Tres actores,
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}un mismo objetivo.
              </span>
            </h2>

            <p
              className="text-[14px] md:text-[15px] leading-[1.6] max-w-xl mb-10 md:mb-14"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              MarketDesliz conecta a clientes, vendedores y negocios en un solo
              ecosistema.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
              {ACTORES.map((actor, i) => (
                <div
                  key={i}
                  className="pt-6"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-3"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </p>

                  <h3
                    className="text-[20px] md:text-[22px] leading-tight tracking-[-0.015em] mb-1.5"
                    style={{
                      color: T.ink,
                      fontWeight: 400,
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    {actor.titulo}
                  </h3>

                  <p
                    className="text-[12px] uppercase tracking-[0.16em] mb-6"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    {actor.subtitulo}
                  </p>

                  <ul className="flex flex-col gap-2.5">
                    {actor.beneficios.map((b, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-[13.5px] leading-[1.6]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
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
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ NIVELES ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Fidelización</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-4"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Mientras más pagas,
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}más subes.
              </span>
            </h2>

            <p
              className="text-[14px] md:text-[15px] leading-[1.6] max-w-xl mb-10 md:mb-14"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Cada producto que completas te acerca a mejores tandas y
              beneficios.
            </p>

            {/* Desktop: tabla hairline */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      borderTop: `1px solid ${T.line}`,
                      borderBottom: `1px solid ${T.line}`,
                    }}
                  >
                    {['Nivel', 'Nombre', 'Productos pagados', 'Tanda disponible'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`py-4 text-[10px] uppercase tracking-[0.22em] ${
                            i === 3 ? 'text-right' : 'text-left'
                          }`}
                          style={{ color: T.inkFaint, fontWeight: 500 }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {NIVELES.map((n, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: `1px solid ${T.line}` }}
                    >
                      <td
                        className="py-4 text-[13px] tabular-nums"
                        style={{
                          color: T.inkSoft,
                          fontWeight: 450,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        {String(n.nivel).padStart(2, '0')}
                      </td>
                      <td
                        className="py-4 text-[14px]"
                        style={{ color: T.ink, fontWeight: 500 }}
                      >
                        {n.nombre}
                      </td>
                      <td
                        className="py-4 text-[13.5px] tabular-nums"
                        style={{
                          color: T.inkSoft,
                          fontWeight: 450,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        {n.productos}
                      </td>
                      <td
                        className="py-4 text-right text-[14px] tabular-nums tracking-[-0.01em]"
                        style={{
                          color: T.accent,
                          fontWeight: 500,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        {n.tanda}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: lista vertical */}
            <div className="md:hidden flex flex-col">
              {NIVELES.map((n, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-4 py-4"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className="text-[11px] tabular-nums"
                      style={{
                        color: T.inkFaint,
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {String(n.nivel).padStart(2, '0')}
                    </span>
                    <div>
                      <p
                        className="text-[14px]"
                        style={{ color: T.ink, fontWeight: 500 }}
                      >
                        {n.nombre}
                      </p>
                      <p
                        className="text-[11px] mt-0.5 tabular-nums"
                        style={{
                          color: T.inkFaint,
                          fontWeight: 450,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        {n.productos} productos
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[13px] tabular-nums"
                    style={{
                      color: T.accent,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {n.tanda}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.line}` }} />
            </div>
          </section>

          {/* ═══ CONTACTO + CTA ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Empieza hoy</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              ¿Listo para
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}empezar?
              </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              <div>
                <p
                  className="text-[15px] md:text-[16px] leading-[1.65] mb-8 max-w-md"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Contáctanos por WhatsApp o síguenos en nuestras redes. Te
                  ayudamos a encontrar el plan que mejor se adapte a ti.
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
                    <Phone size={14} strokeWidth={1.75} /> WhatsApp
                  </a>

                  <Link
                    href="/productos"
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
                    Ver productos <ArrowRight size={14} strokeWidth={1.75} />
                  </Link>
                </div>
              </div>

              {/* Contacto como filas hairline */}
              <div className="flex flex-col">
                {[
                  { label: 'Teléfono', valor: '28 2141 4939' },
                  { label: 'Email', valor: 'marketdesliz@gmail.com' },
                  { label: 'Ubicación', valor: 'Ciudad de México, México' },
                ].map((info, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-4 py-4"
                    style={{ borderTop: `1px solid ${T.line}` }}
                  >
                    <span
                      className="text-[10px] uppercase tracking-[0.22em]"
                      style={{ color: T.inkFaint, fontWeight: 500 }}
                    >
                      {info.label}
                    </span>
                    <span
                      className="text-[13.5px] tabular-nums"
                      style={{
                        color: T.ink,
                        fontWeight: 450,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {info.valor}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${T.line}` }} />
              </div>
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