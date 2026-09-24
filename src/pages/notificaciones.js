// src/pages/notificaciones.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Lock, XCircle, RefreshCw, Inbox, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '../lib/notificaciones';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Mapeo de tipo → ruta destino (cuando el usuario abre la notificación)
// ─────────────────────────────────────────────────────────────────────────
const getRutaDestino = (notif) => {
  const { entidadTipo, entidadId, tipo } = notif;

  if (entidadTipo === 'orden' && entidadId) return `/perfil/ordenes/${entidadId}`;
  if (entidadTipo === 'solicitud' && entidadId) return `/vendedor/solicitudes/${entidadId}`;
  if (entidadTipo === 'tanda' && entidadId) return `/tandas/unirse/${entidadId}`;
  if (entidadTipo === 'negocio' && entidadId) return `/negocios/${entidadId}`;
  if (entidadTipo === 'producto' && entidadId) return `/productos/${entidadId}`;
  if (entidadTipo === 'kyc') return `/kyc/estado`;

  if (tipo === 'tanda_disponible') return '/tandas';
  if (tipo === 'nivel_up') return '/perfil';
  if (tipo === 'recordatorio') return '/perfil/pagos';
  if (tipo === 'contacto') return '/contacto';

  return null;
};

// ─────────────────────────────────────────────────────────────────────────
// Formato de fecha relativa
// ─────────────────────────────────────────────────────────────────────────
function formatRelative(date) {
  if (!date) return '';
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'AHORA';
  if (diff < 3600) return `HACE ${Math.floor(diff / 60)} MIN`;

  const hours = Math.floor(diff / 3600);
  if (hours < 24) return `HACE ${hours} H`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `HACE ${days} D`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `HACE ${weeks} SEM`;

  return new Date(date)
    .toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();
}

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

function StatBlock({ value, label, accent = false, border = true }) {
  return (
    <div
      className="p-5 md:p-6"
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
    >
      <p
        className="text-[24px] md:text-[28px] tabular-nums tracking-[-0.02em] leading-none mb-2"
        style={{
          color: accent ? T.accent : T.ink,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </p>
      <p
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function NotificacionesPage() {
  const router = useRouter();
  const { user, loading: authLoading, openLogin } = useAuth();

  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // todas | no_leidas
  const [markingAll, setMarkingAll] = useState(false);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Cargar notificaciones ─────────────────────────────
  const cargar = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getNotificaciones(user.id, 100);
      setNotificaciones(data || []);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError('No pudimos cargar tus notificaciones. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ─── Init / auth ───────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      openLogin();
      return;
    }

    cargar();
  }, [authLoading, user, cargar, openLogin]);

  // ─── Derivados ─────────────────────────────────────────
  const stats = useMemo(() => {
    const total = notificaciones.length;
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    return { total, noLeidas, leidas: total - noLeidas };
  }, [notificaciones]);

  const filtradas = useMemo(() => {
    if (filtro === 'no_leidas') return notificaciones.filter((n) => !n.leida);
    return notificaciones;
  }, [notificaciones, filtro]);

  // ─── Handlers ──────────────────────────────────────────
  const handleClick = async (notif) => {
    // Marca como leída (fire & forget)
    if (!notif.leida) {
      marcarNotificacionLeida(notif.id).then(() => {
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id === notif.id
              ? { ...n, leida: true, leidaEn: new Date().toISOString() }
              : n
          )
        );
      });
    }

    const ruta = getRutaDestino(notif);
    if (ruta) router.push(ruta);
  };

  const handleMarcarTodas = async () => {
    if (!user?.id || stats.noLeidas === 0) return;
    setMarkingAll(true);
    try {
      await marcarTodasLeidas(user.id);
      setNotificaciones((prev) =>
        prev.map((n) => ({
          ...n,
          leida: true,
          leidaEn: n.leidaEn || new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error('Error marcando todas:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────
  if (loading || authLoading) {
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
                Cargando notificaciones
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Sin sesión ────────────────────────────────────────
  if (!user) {
    return (
      <>
        <Head><title>Inicia sesión | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/" />
          <TerminalBar mode="rotating" />
          <Header />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center mb-6"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(79, 46, 232, 0.06)',
                  borderRadius: '12px',
                }}
              >
                <Lock size={28} strokeWidth={1.5} style={{ color: T.accent }} />
              </div>
              <h1
                className="text-[32px] md:text-[40px] leading-tight tracking-[-0.03em] mb-3"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Inicia sesión
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  para ver tus notificaciones.
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas una cuenta para acceder a tu historial de
                notificaciones.
              </p>
              <button
                onClick={openLogin}
                className="h-11 px-6 text-white text-[13.5px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentDeep)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
              >
                Iniciar sesión
              </button>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Head><title>Error | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/" />
          <TerminalBar mode="rotating" />
          <Header />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <XCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Error al cargar
              </h1>
              <p
                className="text-[13.5px] mb-8"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <button
                onClick={cargar}
                className="inline-flex items-center gap-2 h-11 px-6 text-white text-[13.5px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentDeep)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
              >
                <RefreshCw size={14} strokeWidth={1.75} /> Reintentar
              </button>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Render principal ──────────────────────────────────
  return (
    <>
      <Head>
        <title>Notificaciones | MarketDesliz</title>
        <meta
          name="description"
          content="Historial de notificaciones de tu cuenta en MarketDesliz."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[900px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

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
              Mi cuenta · Notificaciones
            </p>

            <h1
              className="text-[40px] md:text-[56px] leading-[1] tracking-[-0.035em] max-w-2xl mb-4"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Tus avisos
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}recientes.
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Pedidos, pagos, tandas y mensajes de tu cuenta, todo en un mismo
              lugar.
            </p>
          </section>

          {/* ─── Stats ──────────────────────────────────── */}
          <section className="mb-10">
            <SectionLabel>Resumen</SectionLabel>
            <div
              className="grid grid-cols-3"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <StatBlock value={stats.total} label="Total" border={false} />
              <StatBlock
                value={stats.noLeidas}
                label="No leídas"
                accent={stats.noLeidas > 0}
              />
              <StatBlock value={stats.leidas} label="Leídas" />
            </div>
          </section>

          {/* ─── Filtros + acción ───────────────────────── */}
          <section className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'todas', label: 'Todas' },
                  { id: 'no_leidas', label: 'No leídas' },
                ].map((op) => {
                  const isActive = filtro === op.id;
                  return (
                    <button
                      key={op.id}
                      onClick={() => setFiltro(op.id)}
                      className="h-8 px-3 text-[12px] transition-colors"
                      style={{
                        background: isActive ? T.ink : 'transparent',
                        color: isActive ? T.bg : T.inkMid,
                        border: `1px solid ${isActive ? T.ink : T.line}`,
                        borderRadius: '6px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transitionTimingFunction: T.ease,
                      }}
                    >
                      {op.label}
                    </button>
                  );
                })}
              </div>

              {stats.noLeidas > 0 && (
                <button
                  onClick={handleMarcarTodas}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors disabled:opacity-50"
                  style={{
                    color: T.inkSoft,
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    cursor: markingAll ? 'not-allowed' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!markingAll) e.currentTarget.style.color = T.accent;
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = T.inkSoft)
                  }
                >
                  <Check size={12} strokeWidth={2} />{' '}
                  {markingAll ? 'Marcando…' : 'Marcar todas como leídas'}
                </button>
              )}
            </div>
          </section>

          {/* ─── Lista ──────────────────────────────────── */}
          {filtradas.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <Inbox
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {filtro === 'no_leidas'
                  ? 'No tienes notificaciones sin leer'
                  : 'No tienes notificaciones'}
              </h3>
              <p
                className="text-[13px] max-w-md"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {filtro === 'no_leidas'
                  ? 'Estás al día. Las nuevas notificaciones aparecerán aquí.'
                  : 'Cuando haya novedades sobre tu cuenta las verás aquí.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {filtradas.map((notif, idx) => {
                const ruta = getRutaDestino(notif);
                const clickable = !!ruta;

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    disabled={!clickable}
                    className="w-full text-left transition-colors"
                    style={{
                      display: 'block',
                      padding: '20px 24px',
                      borderTop: idx === 0 ? 'none' : `1px solid ${T.line}`,
                      background: 'transparent',
                      cursor: clickable ? 'pointer' : 'default',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (clickable)
                        e.currentTarget.style.background =
                          'rgba(15,15,15,0.02)';
                    }}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <div className="flex items-start gap-3">
                      {/* Dot de no leída */}
                      <span
                        className="shrink-0 rounded-full"
                        style={{
                          width: '6px',
                          height: '6px',
                          marginTop: '8px',
                          background: !notif.leida ? T.accent : T.inkGhost,
                          transition: `background 0.2s ${T.ease}`,
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[14px] leading-[1.5] tracking-[-0.005em] mb-1"
                          style={{
                            color: T.ink,
                            fontWeight: !notif.leida ? 500 : 450,
                          }}
                        >
                          {notif.titulo}
                        </p>
                        <p
                          className="text-[12.5px] leading-[1.55] mb-2"
                          style={{ color: T.inkSoft, fontWeight: 450 }}
                        >
                          {notif.mensaje}
                        </p>
                        <p
                          className="text-[10px] uppercase tracking-[0.18em] tabular-nums"
                          style={{
                            color: T.inkFaint,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {formatRelative(notif.created)}
                        </p>
                      </div>

                      {clickable && (
                        <span
                          className="shrink-0 text-[10px] uppercase tracking-[0.18em]"
                          style={{
                            color: T.inkFaint,
                            fontWeight: 500,
                            marginTop: '4px',
                          }}
                        >
                          →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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