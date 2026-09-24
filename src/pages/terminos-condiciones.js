// src/pages/condiciones.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, Check, X, AlertTriangle } from 'lucide-react';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ─── DATA · SIN CAMBIOS ─────────────────────────────────────────────────
const SECCIONES = [
  { id: 'aceptacion',      titulo: 'Aceptación de términos' },
  { id: 'registro',        titulo: 'Registro y cuenta' },
  { id: 'credito',         titulo: 'Crédito y pagos' },
  { id: 'tandas',          titulo: 'Tandas' },
  { id: 'responsabilidad', titulo: 'Responsabilidad del usuario' },
  { id: 'propiedad',       titulo: 'Propiedad intelectual' },
  { id: 'prohibido',       titulo: 'Uso prohibido' },
  { id: 'cambios',         titulo: 'Modificaciones' },
  { id: 'contacto',        titulo: 'Contacto' },
];

const CONTENIDO = {
  aceptacion: {
    parrafos: [
      'Al acceder, registrarte o utilizar cualquier servicio de MarketDesliz, aceptas cumplir con estos términos y condiciones, así como con nuestro Aviso de Privacidad.',
      'Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la plataforma.',
    ],
  },
  registro: {
    parrafos: [
      'Para crear una cuenta debes proporcionar información verídica, completa y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales de acceso.',
      'MarketDesliz se reserva el derecho de suspender o cancelar cuentas que contengan información falsa o que incumplan estos términos.',
    ],
  },
  credito: {
    parrafos: [
      'El crédito está sujeto a verificación de identidad (KYC) y a los límites de deuda y productos en curso que establece la plataforma.',
    ],
    lista: [
      'Enganche mínimo: 15% del valor del producto',
      'Pago semanal: entre $50 y $500, según tu presupuesto',
      'Deuda máxima: $5,000 pesos',
      'Máximo 3 productos en curso simultáneamente',
    ],
  },
  tandas: {
    parrafos: [
      'Las tandas requieren verificación KYC previa y el pago único de gasolina de $25 (no reembolsable). El incumplimiento de pagos puede resultar en la pérdida del turno o la suspensión de la cuenta.',
      'Para los detalles específicos de las tandas, consulta los Términos de Tandas.',
    ],
    link: { href: '/terminos', label: 'Ver Términos de Tandas' },
  },
  responsabilidad: {
    parrafos: [
      'Eres responsable de mantener tu cuenta segura, de toda actividad que ocurra bajo tus credenciales y de notificar de inmediato cualquier uso no autorizado.',
      'MarketDesliz no se hace responsable por daños derivados del uso indebido de la plataforma o del incumplimiento de estos términos por parte del usuario.',
    ],
  },
  propiedad: {
    parrafos: [
      'Todo el contenido de MarketDesliz —incluyendo marca, logotipos, textos, imágenes, código fuente y diseño— es propiedad de MarketDesliz o de sus licenciantes, y está protegido por las leyes de propiedad intelectual aplicables.',
      'Queda prohibida su reproducción, distribución o uso comercial sin autorización previa por escrito.',
    ],
  },
  prohibido: {
    parrafos: [
      'Al usar MarketDesliz te comprometes a no realizar las siguientes acciones:',
    ],
    lista: [
      'Publicar información falsa, fraudulenta o engañosa',
      'Suplantar la identidad de otras personas o empresas',
      'Utilizar la plataforma para actividades ilegales',
      'Interferir con el funcionamiento o la seguridad del sitio',
      'Extraer datos o contenidos de forma automatizada sin permiso',
    ],
  },
  cambios: {
    parrafos: [
      'MarketDesliz puede modificar estos términos en cualquier momento. Los cambios entran en vigor desde su publicación en la plataforma.',
      'Es tu responsabilidad revisar periódicamente estos términos. El uso continuado de la plataforma después de cualquier cambio implica tu aceptación.',
    ],
  },
  contacto: {
    parrafos: [
      'Si tienes dudas sobre estos términos y condiciones, escríbenos por cualquiera de estos canales:',
    ],
  },
};

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

function SectionTitle({ numero, children }) {
  return (
    <div className="flex items-baseline gap-4 mb-5">
      <span
        className="text-[12px] tabular-nums tracking-[0.22em] shrink-0"
        style={{
          color: T.accent,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {String(numero).padStart(2, '0')}
      </span>
      <h2
        className="text-[22px] md:text-[26px] leading-tight tracking-[-0.02em]"
        style={{
          color: T.ink,
          fontWeight: 400,
          fontFeatureSettings: '"ss01"',
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function CheckList({ items, variant = 'check' }) {
  const Icon = variant === 'x' ? X : Check;
  const color = variant === 'x' ? T.red : T.accent;

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-[13.5px] leading-[1.65]"
          style={{ color: T.inkMid, fontWeight: 450 }}
        >
          <Icon
            size={13}
            strokeWidth={2}
            style={{ color, flexShrink: 0, marginTop: 4 }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function CondicionesPage() {
  const router = useRouter();
  const goTo = (path) => router.push(path);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Smooth scroll
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Head>
        <title>Términos y Condiciones | MarketDesliz</title>
        <meta
          name="description"
          content="Términos y condiciones generales de uso de la plataforma MarketDesliz."
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
              Documento legal · MarketDesliz
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
              Reglas generales de uso de la plataforma MarketDesliz. Al usar
              nuestros servicios, aceptas estos términos.
            </p>

            <p
              className="text-[11px] uppercase tracking-[0.18em] mt-6"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              Última actualización:{' '}
              {new Date().toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </section>

          {/* ═══ CONTENIDO + ÍNDICE ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-16">

              {/* ─── Índice lateral sticky ──────────────── */}
              <aside className="lg:col-span-1 order-2 lg:order-1">
                <div
                  className="lg:sticky lg:top-24"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '20px',
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-5"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Contenido
                  </p>
                  <nav className="flex flex-col">
                    {SECCIONES.map((sec, i) => (
                      <button
                        key={sec.id}
                        onClick={() => scrollTo(sec.id)}
                        className="flex items-baseline gap-3 py-2.5 text-left transition-colors"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          const span =
                            e.currentTarget.querySelector('.indice-label');
                          if (span) span.style.color = T.accent;
                        }}
                        onMouseLeave={(e) => {
                          const span =
                            e.currentTarget.querySelector('.indice-label');
                          if (span) span.style.color = T.inkMid;
                        }}
                      >
                        <span
                          className="text-[10px] tabular-nums shrink-0"
                          style={{
                            color: T.inkFaint,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                            minWidth: '18px',
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="indice-label text-[13px] leading-snug transition-colors"
                          style={{ color: T.inkMid, fontWeight: 450 }}
                        >
                          {sec.titulo}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* ─── Documento ──────────────────────────── */}
              <div className="lg:col-span-3 order-1 lg:order-2">

                {/* 1. Aceptación */}
                <div
                  id="aceptacion"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={1}>
                    Aceptación de términos
                  </SectionTitle>
                  <div className="flex flex-col gap-4">
                    {CONTENIDO.aceptacion.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                {/* 2. Registro */}
                <div
                  id="registro"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={2}>Registro y cuenta</SectionTitle>
                  <div className="flex flex-col gap-4">
                    {CONTENIDO.registro.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                {/* 3. Crédito */}
                <div
                  id="credito"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={3}>Crédito y pagos</SectionTitle>
                  <div className="flex flex-col gap-4 mb-5">
                    {CONTENIDO.credito.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                  <CheckList items={CONTENIDO.credito.lista} />
                </div>

                {/* 4. Tandas */}
                <div
                  id="tandas"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={4}>Tandas</SectionTitle>
                  <div className="flex flex-col gap-4">
                    {CONTENIDO.tandas.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                  {CONTENIDO.tandas.link && (
                    <Link
                      href={CONTENIDO.tandas.link.href}
                      className="inline-flex items-center gap-2 mt-5 text-[12.5px] uppercase tracking-[0.18em] transition-colors"
                      style={{
                        color: T.accent,
                        fontWeight: 500,
                        textDecoration: 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = '0.7')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = '1')
                      }
                    >
                      {CONTENIDO.tandas.link.label}
                      <ArrowRight size={13} strokeWidth={1.75} />
                    </Link>
                  )}
                </div>

                {/* 5. Responsabilidad */}
                <div
                  id="responsabilidad"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={5}>
                    Responsabilidad del usuario
                  </SectionTitle>
                  <div className="flex flex-col gap-4">
                    {CONTENIDO.responsabilidad.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                {/* 6. Propiedad */}
                <div
                  id="propiedad"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={6}>
                    Propiedad intelectual
                  </SectionTitle>
                  <div className="flex flex-col gap-4">
                    {CONTENIDO.propiedad.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                {/* 7. Uso prohibido */}
                <div
                  id="prohibido"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={7}>Uso prohibido</SectionTitle>
                  <div className="flex flex-col gap-4 mb-5">
                    {CONTENIDO.prohibido.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                  <CheckList items={CONTENIDO.prohibido.lista} variant="x" />
                </div>

                {/* 8. Modificaciones */}
                <div
                  id="cambios"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={8}>Modificaciones</SectionTitle>
                  <div className="flex flex-col gap-4">
                    {CONTENIDO.cambios.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                {/* 9. Contacto */}
                <div
                  id="contacto"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    paddingTop: '28px',
                  }}
                >
                  <SectionTitle numero={9}>Contacto</SectionTitle>
                  <div className="flex flex-col gap-4 mb-6">
                    {CONTENIDO.contacto.parrafos.map((p, i) => (
                      <p
                        key={i}
                        className="text-[14px] leading-[1.7]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>

                  <div className="flex flex-col">
                    {[
                      {
                        label: 'Email',
                        valor: 'marketdesliz@gmail.com',
                        href: 'mailto:marketdesliz@gmail.com',
                      },
                      {
                        label: 'WhatsApp',
                        valor: '28 2141 4939',
                        href: 'https://wa.me/522821414939',
                        external: true,
                      },
                      {
                        label: 'Ubicación',
                        valor: 'Ciudad de México',
                        href: null,
                      },
                    ].map((info, i) => {
                      const content = (
                        <div
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
                            className="text-[13.5px] tabular-nums transition-colors"
                            style={{
                              color: info.href ? T.accent : T.ink,
                              fontWeight: 450,
                              fontFeatureSettings: '"tnum"',
                            }}
                          >
                            {info.valor}
                          </span>
                        </div>
                      );

                      if (info.href) {
                        return (
                          <a
                            key={i}
                            href={info.href}
                            target={info.external ? '_blank' : undefined}
                            rel={
                              info.external
                                ? 'noopener noreferrer'
                                : undefined
                            }
                            style={{
                              textDecoration: 'none',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            {content}
                          </a>
                        );
                      }

                      return <div key={i}>{content}</div>;
                    })}
                    <div style={{ borderTop: `1px solid ${T.line}` }} />
                  </div>
                </div>

                {/* ─── Aviso legal ─────────────────────── */}
                <div
                  className="flex items-start gap-3 p-5"
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
                    className="text-[13px] leading-[1.6]"
                    style={{ color: '#8A6109', fontWeight: 450 }}
                  >
                    <strong style={{ fontWeight: 500 }}>Importante:</strong> Si
                    tienes dudas sobre estos términos,{' '}
                    <Link
                      href="/contacto"
                      style={{
                        color: '#8A6109',
                        fontWeight: 500,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        textDecorationThickness: '1px',
                      }}
                    >
                      contáctanos
                    </Link>{' '}
                    antes de utilizar la plataforma.
                  </p>
                </div>

                {/* ─── CTA final ──────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3 mt-10">
                  <button
                    onClick={() => goTo('/privacidad')}
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
                    Ver Aviso de Privacidad
                    <ArrowRight size={14} strokeWidth={1.75} />
                  </button>

                  <button
                    onClick={() => goTo('/ayuda')}
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
                    Centro de ayuda
                  </button>
                </div>

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