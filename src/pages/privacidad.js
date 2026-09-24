// src/pages/privacidad.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ─── DATA · SIN CAMBIOS ─────────────────────────────────────────────────
const SECCIONES = [
  { id: 'responsable', titulo: 'Responsable del tratamiento' },
  { id: 'datos', titulo: 'Datos que recabamos' },
  { id: 'finalidades', titulo: 'Finalidades del uso' },
  { id: 'transferencias', titulo: 'Transferencias de datos' },
  { id: 'derechos', titulo: 'Tus derechos ARCO' },
  { id: 'cookies', titulo: 'Uso de cookies' },
  { id: 'seguridad', titulo: 'Medidas de seguridad' },
  { id: 'cambios', titulo: 'Cambios al aviso' },
  { id: 'contacto', titulo: 'Contacto' },
];

const DATOS_RECABADOS = [
  {
    categoria: 'Identificación',
    ejemplo: 'Nombre completo, fecha de nacimiento',
    uso: 'Crear tu cuenta y verificar identidad',
  },
  {
    categoria: 'Contacto',
    ejemplo: 'Teléfono, correo electrónico, dirección',
    uso: 'Comunicación, entregas y cobranza',
  },
  {
    categoria: 'Verificación (KYC)',
    ejemplo: 'INE, selfie, comprobante de domicilio',
    uso: 'Cumplir con la regulación de tandas',
  },
  {
    categoria: 'Financieros',
    ejemplo: 'Historial de pagos, deuda, nivel',
    uso: 'Gestionar tu crédito y tus tandas',
  },
  {
    categoria: 'Navegación',
    ejemplo: 'IP, dispositivo, páginas visitadas',
    uso: 'Mejorar la plataforma y seguridad',
  },
];

const FINALIDADES_PRIMARIAS = [
  'Crear y administrar tu cuenta de cliente, vendedor o negocio aliado.',
  'Verificar tu identidad mediante INE, selfie y comprobante de domicilio.',
  'Procesar pedidos, entregas y cobranza de pagos semanales.',
  'Gestionar tu participación en tandas y tu nivel de fidelización.',
  'Contactarte por WhatsApp, teléfono o correo sobre tu cuenta.',
];

const FINALIDADES_SECUNDARIAS = [
  'Enviarte promociones, descuentos y novedades de MarketDesliz.',
  'Realizar encuestas de satisfacción y mejora del servicio.',
  'Elaborar estadísticas internas anonimizadas.',
];

const TRANSFERENCIAS = [
  'Proveedores de verificación de identidad (KYC).',
  'Procesadores de pagos y servicios financieros.',
  'Autoridades competentes cuando la ley lo requiera.',
  'Vendedores asignados a tu cuenta, para coordinar entregas y cobranza.',
];

const DERECHOS_ARCO = [
  { letra: 'A', titulo: 'Acceso', desc: 'Saber qué datos tenemos sobre ti.' },
  {
    letra: 'R',
    titulo: 'Rectificación',
    desc: 'Corregir datos inexactos o incompletos.',
  },
  {
    letra: 'C',
    titulo: 'Cancelación',
    desc: 'Eliminar tus datos cuando ya no sean necesarios.',
  },
  {
    letra: 'O',
    titulo: 'Oposición',
    desc: 'Oponerte al uso de tus datos para ciertos fines.',
  },
];

const COOKIES = [
  'Mantener tu sesión iniciada en la plataforma.',
  'Recordar tus preferencias (favoritos, filtros, idioma).',
  'Analizar el uso del sitio y mejorar la experiencia.',
];

const SEGURIDAD = [
  'Cifrado de datos en tránsito (HTTPS) y en reposo.',
  'Acceso restringido a la base de datos por roles.',
  'Monitoreo continuo de actividad sospechosa.',
  'Capacitación del personal en protección de datos.',
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

function CheckList({ items, icon: Icon = Check }) {
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
            style={{ color: T.accent, flexShrink: 0, marginTop: 4 }}
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
export default function PrivacidadPage() {
  const router = useRouter();
  const goTo = (path) => router.push(path);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Smooth scroll a sección
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Head>
        <title>Aviso de Privacidad | MarketDesliz</title>
        <meta
          name="description"
          content="Aviso de privacidad de MarketDesliz: conoce cómo protegemos y tratamos tus datos personales conforme a la Ley Federal de Protección de Datos Personales."
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
              Aviso de<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                privacidad.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              En MarketDesliz tu privacidad es prioridad. Este documento explica
              qué datos recabamos, cómo los usamos y cuáles son tus derechos.
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
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '20px' }}
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
                          const span = e.currentTarget.querySelector(
                            '.indice-label'
                          );
                          if (span) span.style.color = T.accent;
                        }}
                        onMouseLeave={(e) => {
                          const span = e.currentTarget.querySelector(
                            '.indice-label'
                          );
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

                {/* 1. Responsable */}
                <div
                  id="responsable"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={1}>
                    Responsable del tratamiento
                  </SectionTitle>
                  <div className="flex flex-col gap-4">
                    <p
                      className="text-[14px] leading-[1.7]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      <strong style={{ color: T.ink, fontWeight: 500 }}>
                        MarketDesliz
                      </strong>{' '}
                      (en adelante "nosotros" o "el responsable") es el
                      responsable del tratamiento de tus datos personales, con
                      domicilio en Ciudad de México, México.
                    </p>
                    <p
                      className="text-[14px] leading-[1.7]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      Nos comprometemos a proteger tu información conforme a la{' '}
                      <strong style={{ color: T.ink, fontWeight: 500 }}>
                        Ley Federal de Protección de Datos Personales en
                        Posesión de los Particulares
                      </strong>{' '}
                      (LFPDPPP), su Reglamento y demás disposiciones aplicables.
                    </p>
                  </div>
                </div>

                {/* 2. Datos */}
                <div
                  id="datos"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={2}>Datos que recabamos</SectionTitle>
                  <p
                    className="text-[14px] leading-[1.7] mb-6"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Para operar nuestra plataforma recabamos las siguientes
                    categorías de datos:
                  </p>

                  {/* Tabla de datos */}
                  <div
                    style={{
                      borderTop: `1px solid ${T.line}`,
                      borderBottom: `1px solid ${T.line}`,
                    }}
                  >
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                          {['Categoría', 'Ejemplos', 'Uso'].map((h, i) => (
                            <th
                              key={h}
                              className={`py-3 text-[9.5px] uppercase tracking-[0.18em] text-left ${
                                i === 2 ? 'hidden md:table-cell' : ''
                              }`}
                              style={{ color: T.inkFaint, fontWeight: 500 }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DATOS_RECABADOS.map((row, i) => (
                          <tr
                            key={i}
                            style={{ borderTop: `1px solid ${T.line}` }}
                          >
                            <td
                              className="py-3.5 pr-4 text-[13px] align-top"
                              style={{
                                color: T.ink,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.categoria}
                            </td>
                            <td
                              className="py-3.5 pr-4 text-[13px] align-top"
                              style={{ color: T.inkMid, fontWeight: 450 }}
                            >
                              {row.ejemplo}
                            </td>
                            <td
                              className="py-3.5 text-[13px] align-top hidden md:table-cell"
                              style={{ color: T.inkSoft, fontWeight: 450 }}
                            >
                              {row.uso}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className="flex items-start gap-3 p-4 mt-6"
                    style={{
                      background: 'rgba(184, 130, 14, 0.05)',
                      border: `1px solid rgba(184, 130, 14, 0.18)`,
                      borderLeft: '2px solid #B8820E',
                      borderRadius: '6px',
                    }}
                  >
                    <AlertTriangle
                      size={14}
                      strokeWidth={1.75}
                      style={{
                        color: '#B8820E',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <p
                      className="text-[12.5px] leading-[1.6]"
                      style={{ color: '#8A6109', fontWeight: 450 }}
                    >
                      Algunos datos como INE y selfie son{' '}
                      <strong style={{ fontWeight: 500 }}>
                        datos personales sensibles
                      </strong>
                      . Su tratamiento requiere tu consentimiento expreso, que
                      otorgas al registrarte.
                    </p>
                  </div>
                </div>

                {/* 3. Finalidades */}
                <div
                  id="finalidades"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={3}>
                    Finalidades del uso
                  </SectionTitle>

                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-4"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Primarias
                  </p>
                  <div className="mb-8">
                    <CheckList items={FINALIDADES_PRIMARIAS} />
                  </div>

                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-4"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Secundarias
                  </p>
                  <CheckList items={FINALIDADES_SECUNDARIAS} />

                  <p
                    className="text-[12.5px] leading-[1.6] mt-6"
                    style={{ color: T.inkFaint, fontWeight: 450 }}
                  >
                    Puedes oponerte a las finalidades secundarias enviándonos un
                    correo a{' '}
                    <a
                      href="mailto:marketdesliz@gmail.com"
                      style={{
                        color: T.accent,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        textDecorationThickness: '1px',
                      }}
                    >
                      marketdesliz@gmail.com
                    </a>
                    .
                  </p>
                </div>

                {/* 4. Transferencias */}
                <div
                  id="transferencias"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={4}>
                    Transferencias de datos
                  </SectionTitle>
                  <p
                    className="text-[14px] leading-[1.7] mb-5"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Podemos compartir tus datos con terceros únicamente en los
                    siguientes casos:
                  </p>
                  <CheckList items={TRANSFERENCIAS} />
                  <p
                    className="text-[14px] leading-[1.7] mt-5"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    En todos los casos exigimos a los terceros que mantengan la
                    confidencialidad de tu información y la usen solo para los
                    fines autorizados.
                  </p>
                </div>

                {/* 5. ARCO */}
                <div
                  id="derechos"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={5}>Tus derechos ARCO</SectionTitle>
                  <p
                    className="text-[14px] leading-[1.7] mb-6"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Tienes derecho a{' '}
                    <strong style={{ color: T.ink, fontWeight: 500 }}>
                      Acceder, Rectificar, Cancelar u Oponerte
                    </strong>{' '}
                    al tratamiento de tus datos personales. Conoce cada uno:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                    {DERECHOS_ARCO.map((arco, i) => (
                      <div
                        key={i}
                        className="pt-5"
                        style={{ borderTop: `1px solid ${T.line}` }}
                      >
                        <div className="flex items-baseline gap-3 mb-2">
                          <span
                            className="text-[22px] leading-none tracking-[-0.02em]"
                            style={{
                              color: T.accent,
                              fontWeight: 400,
                              fontFeatureSettings: '"ss01"',
                            }}
                          >
                            {arco.letra}
                          </span>
                          <p
                            className="text-[14px]"
                            style={{ color: T.ink, fontWeight: 500 }}
                          >
                            {arco.titulo}
                          </p>
                        </div>
                        <p
                          className="text-[13px] leading-[1.6]"
                          style={{ color: T.inkSoft, fontWeight: 450 }}
                        >
                          {arco.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p
                    className="text-[14px] leading-[1.7] mt-8"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Para ejercer cualquiera de estos derechos envía un correo a{' '}
                    <a
                      href="mailto:marketdesliz@gmail.com"
                      style={{
                        color: T.accent,
                        fontWeight: 500,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        textDecorationThickness: '1px',
                      }}
                    >
                      marketdesliz@gmail.com
                    </a>{' '}
                    indicando tu nombre, el derecho que deseas ejercer y los
                    documentos que acrediten tu identidad.
                  </p>
                </div>

                {/* 6. Cookies */}
                <div
                  id="cookies"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={6}>Uso de cookies</SectionTitle>
                  <p
                    className="text-[14px] leading-[1.7] mb-5"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Usamos cookies y tecnologías similares para:
                  </p>
                  <CheckList items={COOKIES} />
                  <p
                    className="text-[14px] leading-[1.7] mt-5"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Puedes deshabilitar las cookies desde la configuración de tu
                    navegador. Ten en cuenta que algunas funciones podrían dejar
                    de funcionar.
                  </p>
                </div>

                {/* 7. Seguridad */}
                <div
                  id="seguridad"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={7}>
                    Medidas de seguridad
                  </SectionTitle>
                  <p
                    className="text-[14px] leading-[1.7] mb-5"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Implementamos medidas técnicas y administrativas para
                    proteger tu información:
                  </p>
                  <CheckList items={SEGURIDAD} />
                </div>

                {/* 8. Cambios */}
                <div
                  id="cambios"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={8}>Cambios al aviso</SectionTitle>
                  <p
                    className="text-[14px] leading-[1.7]"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Nos reservamos el derecho de actualizar este aviso en
                    cualquier momento. Cuando haya cambios significativos te
                    notificaremos por correo o dentro de la plataforma. La fecha
                    de última actualización aparece al inicio del documento.
                  </p>
                </div>

                {/* 9. Contacto */}
                <div
                  id="contacto"
                  className="scroll-mt-24 pb-10 md:pb-12"
                  style={{ borderTop: `1px solid ${T.line}`, paddingTop: '28px' }}
                >
                  <SectionTitle numero={9}>Contacto</SectionTitle>
                  <p
                    className="text-[14px] leading-[1.7] mb-6"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    ¿Tienes dudas sobre el tratamiento de tus datos? Escríbenos
                    por cualquiera de estos canales:
                  </p>

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
                            rel={info.external ? 'noopener noreferrer' : undefined}
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

                {/* CTA final */}
                <div className="flex flex-wrap items-center gap-3 pt-6">
                  <button
                    onClick={() => goTo('/terminos-condiciones')}
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
                    Ver Términos y Condiciones
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