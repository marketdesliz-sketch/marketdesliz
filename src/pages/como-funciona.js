// src/pages/como-funciona.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronRight, ArrowRight, Check, Phone, Mail, MapPin,
} from 'lucide-react';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ─── DATA · SIN CAMBIOS ─────────────────────────────────────────────────
const PASOS = [
  {
    numero: '01',
    titulo: 'Elige tu producto',
    descripcion:
      'Navega por el catálogo, selecciona lo que necesitas y decide entre pagar de contado o a crédito.',
  },
  {
    numero: '02',
    titulo: 'Solicita una visita',
    descripcion:
      'Un vendedor verificado de tu colonia te visita, valida tus datos y recibe tu enganche inicial.',
  },
  {
    numero: '03',
    titulo: 'Paga a tu ritmo',
    descripcion:
      'Paga semanalmente desde $50 hasta $500. Al completar tus pagos, subes de nivel automáticamente.',
  },
];

const APARTADOS = [
  {
    id: 'productos',
    numero: '01',
    titulo: 'Productos',
    subtitulo: 'A crédito o de contado',
    descripcion:
      'Compra lo que necesitas sin tarjeta de crédito. Elige pagar de contado con descuento o a crédito con enganche + pagos semanales flexibles.',
    pasos: [
      'Elige el producto del catálogo',
      'Selecciona tu plan: contado o crédito',
      'Un vendedor verificado te visita',
      'Recibe tu producto y paga semanalmente',
    ],
    ruta: '/productos',
    cta: 'Ver productos',
  },
  {
    id: 'negocios',
    numero: '02',
    titulo: 'Negocios aliados',
    subtitulo: 'Locales verificados cerca de ti',
    descripcion:
      'Descubre negocios de tu colonia verificados por MarketDesliz. Encuentra servicios, productos y promociones con contacto directo.',
    pasos: [
      'Explora negocios por categoría o zona',
      'Filtra por ubicación o tipo de servicio',
      'Contacta por WhatsApp o llámalos',
      'Registra tu propio negocio con invitación',
    ],
    ruta: '/negocios',
    cta: 'Ver negocios',
  },
  {
    id: 'servicios',
    numero: '03',
    titulo: 'Servicios',
    subtitulo: 'Profesionales cerca de ti',
    descripcion:
      'Encuentra profesionales de confianza: plomeros, electricistas, estilistas, y más. Servicios verificados con calificaciones reales.',
    pasos: [
      'Busca el servicio que necesitas',
      'Compara perfiles y calificaciones',
      'Solicita el servicio por WhatsApp',
      'Califica al profesional al terminar',
    ],
    ruta: '/servicios',
    cta: 'Ver servicios',
  },
  {
    id: 'fruta',
    numero: '04',
    titulo: 'Fruta de temporada',
    subtitulo: 'Productos frescos y locales',
    descripcion:
      'Fruta fresca directo del productor local, con precios justos y entrega a domicilio. Apoya a los agricultores de tu región.',
    pasos: [
      'Explora la fruta de la temporada',
      'Consulta precios y disponibilidad',
      'Solicita tu pedido por WhatsApp',
      'Recibe fresca en tu domicilio',
    ],
    ruta: '/fruta',
    cta: 'Ver fruta',
  },
  {
    id: 'ganado',
    numero: '05',
    titulo: 'Ganado',
    subtitulo: 'Compra y venta de ganado',
    descripcion:
      'Conecta directo con productores ganaderos. Compra o vende ganado sin intermediarios, con verificación de origen y sanidad.',
    pasos: [
      'Explora ganado disponible en tu zona',
      'Revisa raza, edad y peso',
      'Contacta al productor directamente',
      'Acuerda la compra y traslado',
    ],
    ruta: '/ganado',
    cta: 'Ver ganado',
  },
  {
    id: 'tandas',
    numero: '06',
    titulo: 'Tandas exclusivas',
    subtitulo: 'Según tu nivel',
    descripcion:
      'Únete a grupos de ahorro donde cada semana un miembro recibe el total reunido. Disponibles según tu nivel de fidelización.',
    pasos: [
      'Revisa tu nivel actual (mínimo nivel 1)',
      'Elige una tanda de tu nivel o inferior',
      'Paga tu cuota de gasolina ($25)',
      'Recibe cuando sea tu turno (según antigüedad)',
    ],
    ruta: '/tandas',
    cta: 'Ver tandas',
  },
  {
    id: 'bolsa-trabajo',
    numero: '07',
    titulo: 'Bolsa de trabajo',
    subtitulo: 'Encuentra oportunidades cerca de ti',
    descripcion:
      'Publica o encuentra ofertas de trabajo en tu comunidad. Conexión directa entre empresas y candidatos sin intermediarios.',
    pasos: [
      'Explora ofertas por categoría',
      'Filtra por ubicación y tipo de trabajo',
      'Contacta directamente a la empresa',
      'O publica tu propia oferta gratis',
    ],
    ruta: '/bolsa-trabajo',
    cta: 'Ver ofertas',
  },
];

const NIVELES = [
  { nivel: 0, nombre: 'Básico', productos: 0, tanda: '$0' },
  { nivel: 1, nombre: 'Bronce', productos: 3, tanda: '$1,000' },
  { nivel: 2, nombre: 'Plata', productos: 5, tanda: '$5,000' },
  { nivel: 3, nombre: 'Oro', productos: 10, tanda: '$10,000' },
  { nivel: 4, nombre: 'Platino', productos: 20, tanda: '$20,000' },
  { nivel: 5, nombre: 'Diamante', productos: 30, tanda: '$30,000' },
  { nivel: 6, nombre: 'Zafiro', productos: 40, tanda: '$40,000' },
  { nivel: 7, nombre: 'Rubí', productos: 50, tanda: '$50,000' },
];

const BENEFICIOS = [
  {
    titulo: '100% seguro',
    descripcion: 'Vendedores verificados y sistema de pagos transparente.',
  },
  {
    titulo: 'Sin intereses',
    descripcion: 'Compra a crédito sin intereses ocultos ni cargos extra.',
  },
  {
    titulo: 'Sube de nivel',
    descripcion: 'Cada producto completado te acerca a mejores beneficios.',
  },
  {
    titulo: 'Sin tarjeta',
    descripcion: 'No necesitas tarjeta bancaria ni historial crediticio.',
  },
  {
    titulo: 'Cerca de ti',
    descripcion: 'Vendedores y negocios aliados en tu propia colonia.',
  },
  {
    titulo: 'Pagos flexibles',
    descripcion: 'Tú eliges cuánto pagar por semana, desde $50.',
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
export default function ComoFuncionaPage() {
  const router = useRouter();
  const goTo = (path) => router.push(path);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Head>
        <title>Cómo funciona | MarketDesliz</title>
        <meta
          name="description"
          content="Descubre cómo funciona MarketDesliz: compra a crédito con pagos semanales, tandas exclusivas, negocios aliados, servicios, fruta, ganado y bolsa de trabajo."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">

          {/* ═══ HERO EDITORIAL ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-8 md:pt-14 pb-12 md:pb-20">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Cómo funciona · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Todo en un mismo lugar,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                a tu alcance.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Desde productos a crédito hasta tandas, negocios, servicios,
              fruta, ganado y bolsa de trabajo.
            </p>
          </section>

          {/* ═══ 3 PASOS · COMPRA A CRÉDITO ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Compra a crédito</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Comprar es así{' '}
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                de fácil.
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

          {/* ═══ 7 APARTADOS ═══ */}
          <section
            id="apartados"
            className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24 scroll-mt-24"
          >
            <SectionLabel>Apartados del sistema</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Todo lo que puedes{' '}
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                hacer.
              </span>
            </h2>

            <div className="flex flex-col">
              {APARTADOS.map((apartado, idx) => (
                <div
                  key={apartado.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 py-10 md:py-14"
                  style={{
                    borderTop: `1px solid ${T.line}`,
                    borderBottom:
                      idx === APARTADOS.length - 1
                        ? `1px solid ${T.line}`
                        : 'none',
                  }}
                >
                  {/* Izquierda: número + título + subtítulo */}
                  <div className="md:col-span-4">
                    <span
                      className="text-[11px] tabular-nums tracking-[0.22em] block mb-4"
                      style={{
                        color: T.accent,
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {apartado.numero}
                    </span>
                    <h3
                      className="text-[22px] md:text-[26px] leading-tight tracking-[-0.02em] mb-2"
                      style={{
                        color: T.ink,
                        fontWeight: 400,
                        fontFeatureSettings: '"ss01"',
                      }}
                    >
                      {apartado.titulo}
                    </h3>
                    <p
                      className="text-[12px] uppercase tracking-[0.18em]"
                      style={{ color: T.inkFaint, fontWeight: 500 }}
                    >
                      {apartado.subtitulo}
                    </p>
                  </div>

                  {/* Derecha: descripción + pasos + CTA */}
                  <div className="md:col-span-8">
                    <p
                      className="text-[14.5px] md:text-[15.5px] leading-[1.65] mb-6 max-w-2xl"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      {apartado.descripcion}
                    </p>

                    <ul className="flex flex-col gap-2.5 mb-6">
                      {apartado.pasos.map((paso, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-3 text-[13.5px] leading-[1.6]"
                          style={{ color: T.inkMid, fontWeight: 450 }}
                        >
                          <span
                            className="tabular-nums shrink-0 pt-0.5"
                            style={{
                              color: T.inkFaint,
                              fontWeight: 500,
                              fontSize: '12px',
                              minWidth: '18px',
                              fontFeatureSettings: '"tnum"',
                            }}
                          >
                            {String(j + 1).padStart(2, '0')}
                          </span>
                          <span>{paso}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={apartado.ruta}
                      className="inline-flex items-center gap-1.5 text-[12.5px] uppercase tracking-[0.18em] transition-colors"
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
                      {apartado.cta}
                      <ArrowRight size={13} strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ EJEMPLO DE CRÉDITO ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Ejemplo real</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              ¿Cómo se calculan{' '}
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                tus pagos?
              </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
              <div>
                <p
                  className="text-[14.5px] md:text-[15.5px] leading-[1.7] mb-8 max-w-xl"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  El enganche es un pago inicial (15%, 20% o 25% según el
                  producto). El saldo restante lo divides en pagos semanales
                  que tú eliges, desde $50 hasta $500.
                </p>

                <ul className="flex flex-col gap-4">
                  {[
                    {
                      strong: 'Sin intereses ocultos.',
                      text: ' Lo que ves es lo que pagas.',
                    },
                    {
                      strong: 'Tú eliges el ritmo.',
                      text: ' Pagas más o menos por semana según tu presupuesto.',
                    },
                    {
                      strong: 'Subes de nivel.',
                      text: ' Al terminar de pagar, avanzas automáticamente.',
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        size={14}
                        strokeWidth={2}
                        style={{
                          color: T.accent,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      <p
                        className="text-[13.5px] leading-[1.65]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        <strong style={{ color: T.ink, fontWeight: 500 }}>
                          {item.strong}
                        </strong>
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tabla limpia de valores */}
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-5"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  Ejemplo de compra
                </p>

                <div className="flex flex-col">
                  {[
                    { label: 'Precio total', value: '$11,500' },
                    { label: 'Enganche (25%)', value: '$2,875' },
                    { label: 'Saldo restante', value: '$8,625' },
                    { label: 'Pago semanal', value: '$100' },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between gap-4 py-4"
                      style={{ borderTop: `1px solid ${T.line}` }}
                    >
                      <span
                        className="text-[13px]"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        {row.label}
                      </span>
                      <span
                        className="text-[15px] tabular-nums tracking-[-0.01em]"
                        style={{
                          color: T.ink,
                          fontWeight: 500,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}

                  <div
                    className="flex items-baseline justify-between gap-4 py-6"
                    style={{
                      borderTop: `1px solid ${T.line}`,
                      borderBottom: `1px solid ${T.line}`,
                    }}
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: T.ink, fontWeight: 500 }}
                    >
                      Total de semanas
                    </span>
                    <span
                      className="text-[40px] md:text-[52px] tabular-nums tracking-[-0.03em] leading-none"
                      style={{
                        color: T.accent,
                        fontWeight: 400,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      87
                    </span>
                  </div>
                </div>

                <p
                  className="text-[12px] leading-[1.6] mt-5 max-w-md"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  El último pago puede ser de menor cantidad ($25) para ajustar
                  el total. Sin cargos ocultos, sin intereses.
                </p>
              </div>
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
              8 niveles{' '}
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                de beneficios.
              </span>
            </h2>

            <p
              className="text-[14px] md:text-[15px] leading-[1.6] max-w-xl mb-10 md:mb-14"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Mientras más productos completas, más subes de nivel y mejores
              tandas desbloqueas.
            </p>

            {/* Desktop: tabla */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
                    {['Nivel', 'Nombre', 'Productos pagados', 'Tanda disponible'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`py-4 text-[10px] uppercase tracking-[0.22em] ${i === 3 ? 'text-right' : 'text-left'
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
                      style={{
                        borderBottom: `1px solid ${T.line}`,
                      }}
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

          {/* ═══ BENEFICIOS ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <SectionLabel>Beneficios</SectionLabel>

            <h2
              className="text-[28px] md:text-[40px] leading-[1.05] tracking-[-0.03em] max-w-2xl mb-10 md:mb-14"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Por qué elegir{' '}
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                MarketDesliz.
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
              {BENEFICIOS.map((ben, i) => (
                <div
                  key={i}
                  className="pt-5"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <h3
                    className="text-[16px] md:text-[17px] mb-2.5 tracking-[-0.01em]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {ben.titulo}
                  </h3>
                  <p
                    className="text-[13.5px] leading-[1.6]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    {ben.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ CONTACTO + CTA FINAL ═══ */}
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
              ¿Listo para{' '}
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                empezar?
              </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              <div>
                <p
                  className="text-[15px] md:text-[16px] leading-[1.65] mb-8 max-w-md"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Explora nuestros productos, únete a una tanda o encuentra
                  oportunidades cerca de ti. Todo desde una sola plataforma.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/productos"
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
                    Explorar productos <ArrowRight size={14} strokeWidth={1.75} />
                  </Link>

                  <a
                    href="https://wa.me/522821414939"
                    target="_blank"
                    rel="noopener noreferrer"
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
                    <Phone size={14} strokeWidth={1.75} /> WhatsApp
                  </a>
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