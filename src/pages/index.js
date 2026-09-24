// src/pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import TerminalBar from "../components/TerminalBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { T } from "../lib/tokens";

// ═════════════════════════════════════════════════════════════════════════
// IMÁGENES · LOCAL  (/public/images/)
// ═════════════════════════════════════════════════════════════════════════
const COMENZAR_IMAGE = '/images/comenzar.jpg';

// ─────────────────────────────────────────────────────────────────────────
// TextLink · link de lista con touch
// ─────────────────────────────────────────────────────────────────────────
function TextLink({ label, onClick, size = 'md' }) {
  const [hover, setHover] = useState(false);
  const fontSize = size === 'lg' ? '16px' : '14.5px';

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="block text-left w-full py-2 transition-all duration-200"
      style={{
        color: hover ? T.accent : T.inkMid,
        fontSize,
        fontWeight: 450,
        letterSpacing: '-0.005em',
        paddingLeft: hover ? '8px' : '0px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ComenzarButton · botón metálico (imita el de la imagen)
// ─────────────────────────────────────────────────────────────────────────
function ComenzarButton({ onClick }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onTouchStart={() => { setHover(true); setPress(true); }}
      onTouchEnd={() => { setHover(false); setPress(false); }}
      className="relative select-none transition-transform duration-150"
      style={{
        padding: '14px 46px',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: '#1A1A1A',
        borderRadius: '4px',
        border: '1px solid #8E8E8E',
        background: hover
          ? 'linear-gradient(180deg, #F2F2F2 0%, #D6D6D6 45%, #B8B8B8 55%, #A0A0A0 100%)'
          : 'linear-gradient(180deg, #EDEDED 0%, #CFCFCF 45%, #ADADAD 55%, #969696 100%)',
        boxShadow: press
          ? 'inset 0 2px 6px rgba(0,0,0,0.35), 0 0 0 rgba(0,0,0,0)'
          : hover
            ? 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.18)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.12)',
        transform: press ? 'translateY(1px)' : 'translateY(0)',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      Comenzar
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const goTo = (path) => router.push(path);

  const notifications = [
    { id: 1, title: '¡Nueva colección Éshé Parallel!', description: 'Descubre la línea Otoño 2026', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido a MarketDesliz!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
    { id: 3, title: 'Productos disponibles', description: 'Descubre lo que tenemos para ti', time: 'Hace 1 día', read: true },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const columnaIzq = [
    { title: 'Productos', path: '/productos' },
    { title: 'Negocios', path: '/negocios' },
    { title: 'Servicios', path: '/servicios' },
    { title: 'Fruta de temporada', path: '/fruta' },
  ];

  const columnaDer = [
    { title: 'Ganado', path: '/ganado' },
    { title: 'Tandas exclusivas', path: '/tandas' },
    { title: 'Bolsa de trabajo', path: '/bolsa-trabajo' },
  ];

  return (
    <>
      <Head>
        <title>MarketDesliz — Desliza · Descubre · Conecta</title>
        <meta
          name="description"
          content="MarketDesliz: compra a crédito con pagos semanales, tandas digitales y vendedores verificados."
        />
        <meta name="theme-color" content="#0F0F0F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        {/* ═══ BARRA TERMINAL ═══ */}
        <TerminalBar mode="rotating" />

        {/* ═══ HEADER · compartido, SIN buscador ═══ */}
        <Header notifications={notifications} unreadCount={unreadCount} />

        {/* ═══ MAIN ═══ */}
        <main className="flex-1">
          {/* Editorial header */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-4 md:pt-8 pb-12 md:pb-20">

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Hola,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                Bienvenido.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              ¿Qué quieres hacer hoy?
            </p>
          </section>

          {/* Navegación · 2 columnas + 1 vacía */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-10 md:pb-14">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 md:gap-x-20 gap-y-8 md:gap-y-16">
              <div>
                {columnaIzq.map((item) => (
                  <TextLink
                    key={item.path}
                    label={item.title}
                    onClick={() => goTo(item.path)}
                  />
                ))}
              </div>

              <div>
                {columnaDer.map((item) => (
                  <TextLink
                    key={item.path}
                    label={item.title}
                    onClick={() => goTo(item.path)}
                  />
                ))}
              </div>

              <div className="hidden md:block" />
            </div>
          </section>

          {/* ═══ Imagen editorial + CTA (botón montado encima) ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="relative flex flex-col items-center">
              <img
                src={COMENZAR_IMAGE}
                alt=""
                draggable={false}
                className="w-full max-w-2xl md:max-w-3xl h-auto select-none"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />

              <div className="absolute left-1/2 -translate-x-1/2 bottom-[2%] md:bottom-[4%]">
                <ComenzarButton onClick={() => goTo('/productos')} />
              </div>
            </div>
          </section>
        </main>

        {/* ═══ FOOTER público ═══ */}
        <Footer />
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        body {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display',
            'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
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