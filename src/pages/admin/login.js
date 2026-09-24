// src/pages/admin/login.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import pb from '../../lib/pocketbase';
import { loginAdmin } from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import Logo from '../../components/Logo';
import TerminalBar from '../../components/TerminalBar';
import Footer from '../../components/Footer';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL · local
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/admin-login-hero.jpg';

// ─────────────────────────────────────────────────────────────────────────
// EditorialField · input con floating label + underline animada
// ─────────────────────────────────────────────────────────────────────────
function EditorialField({
  id, label, type = 'text', value, onChange,
  disabled, autoFocus, rightSlot,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        required
        disabled={disabled}
        autoFocus={autoFocus}
        className="peer w-full pt-7 pb-3 pr-10 pl-0 bg-transparent border-0 border-b text-[15px] tracking-[-0.005em] placeholder-transparent focus:outline-none focus:border-transparent transition-colors disabled:opacity-40"
        style={{
          borderBottomColor: T.line,
          color: T.ink,
          fontWeight: 450,
        }}
      />
      <label
        htmlFor={id}
        className="absolute left-0 top-5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 pointer-events-none
          peer-focus:top-0
          peer-[:not(:placeholder-shown)]:top-0"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </label>
      <span
        className="absolute bottom-0 left-0 h-[1.5px] w-0 transition-all duration-500 peer-focus:w-full"
        style={{ background: T.accent, transitionTimingFunction: T.ease }}
      />
      {rightSlot && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function AdminLogin() {
  const router = useRouter();
  const { redirect } = router.query;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.role === 'admin') {
      router.replace(redirect || '/admin/dashboard');
    }
  }, [router, redirect]);

  useEffect(() => {
    if (!blockedUntil) { setCountdown(0); return; }
    const tick = () => {
      const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
      if (remaining <= 0) { setBlockedUntil(null); setAttempts(0); setError(''); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [blockedUntil]);

  const getBlockedTimeRemaining = () => {
    if (!blockedUntil) return 0;
    const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const isBlocked = () => {
    if (!blockedUntil) return false;
    return Date.now() < blockedUntil;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isBlocked()) {
      const remaining = getBlockedTimeRemaining();
      setError(`Demasiados intentos. Espera ${remaining} segundos antes de intentar de nuevo.`);
      return;
    }

    if (!email || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginAdmin(email, password);

      if (!result.success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setBlockedUntil(Date.now() + 60000);
          setError('Demasiados intentos fallidos. Bloqueado por 60 segundos.');
        } else {
          setError(result.error || 'Credenciales incorrectas');
        }
        setLoading(false);
        return;
      }

      if (pb.authStore.role !== 'admin') {
        setError('No se pudo autenticar como administrador');
        pb.authStore.clear();
        setLoading(false);
        return;
      }

      setAttempts(0);
      setBlockedUntil(null);
      router.push(redirect || '/admin/dashboard');
    } catch (err) {
      console.error('Error en login admin:', err);
      setError(err.status === 400 ? 'Correo o contraseña incorrectos' : 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  // Estado para la barra terminal
  const statusLine = (() => {
    if (loading) return 'Verificando credenciales';
    if (isBlocked()) return `Sistema bloqueado · reintento en ${countdown}s`;
    if (error) return 'Acceso denegado';
    if (attempts > 0) return `Intento ${attempts} de 5 registrado`;
    return '';
  })();

  return (
    <>
      <Head>
        <title>Acceso Admin · MarketDesliz</title>
        <meta name="description" content="Acceso restringido al panel de administración" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        {/* ═══ BARRA TERMINAL · auto (static o rotativa) ═══ */}
        <TerminalBar mode="auto" statusLine={statusLine} clock={clock} />

        {/* ═══ HEADER ═══ */}
        <header
          className="sticky top-0 z-30"
          style={{
            background: 'rgba(250, 250, 249, 0.85)',
            backdropFilter: 'saturate(180%) blur(16px)',
            WebkitBackdropFilter: 'saturate(180%) blur(16px)',
            borderBottom: `1px solid ${T.line}`,
          }}
        >
          <div className="max-w-[1280px] mx-auto px-6 md:px-14 h-14 flex items-center justify-between gap-6">
            <Link href="/" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <Logo badge="Admin" />
            </Link>

            <nav className="flex items-center gap-7">
              <Link
                href="/"
                className="text-[12.5px] tracking-[-0.005em] transition-colors"
                style={{ color: T.inkSoft, fontWeight: 450, WebkitTapHighlightColor: 'transparent' }}
              >
                Volver al inicio
              </Link>
            </nav>
          </div>
        </header>

        {/* ═══ MAIN ═══ */}
        <main className="flex-1">
          {/* Imagen editorial */}
          <section className="w-full">
            <div
              className="relative w-full overflow-hidden"
              style={{ background: T.bg, aspectRatio: '1280 / 480', maxHeight: '520px' }}
            >
              <img
                src={HERO_IMAGE}
                alt="MarketDesliz — Acceso restringido"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: 'grayscale(100%) contrast(1.15) brightness(1.02)',
                  mixBlendMode: 'multiply',
                }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </section>

          {/* Título editorial */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-10 md:pb-16">
            <div className="max-w-2xl">
              <p
                className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
                style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
              >
                Acceso · Nivel 01
              </p>

              <h1
                className="text-[40px] md:text-[64px] leading-[1.0] tracking-[-0.035em]"
                style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
              >
                Acceso<br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  restringido.
                </span>
              </h1>

              <p
                className="text-[16px] md:text-[19px] leading-[1.5] tracking-[-0.01em] mt-5 md:mt-6 max-w-lg"
                style={{ color: T.inkSoft, fontWeight: 400 }}
              >
                Ingresa tus credenciales para continuar. Cada acceso queda registrado.
              </p>
            </div>
          </section>

          {/* Formulario · 2 columnas */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
              {/* Form · 7 cols */}
              <div className="lg:col-span-7">
                <form onSubmit={handleLogin} className="space-y-8 max-w-md">
                  <EditorialField
                    id="admin-email"
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || isBlocked()}
                    autoFocus
                  />

                  <EditorialField
                    id="admin-password"
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || isBlocked()}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="transition-colors"
                        tabIndex={-1}
                        disabled={loading}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        style={{ color: T.inkFaint, WebkitTapHighlightColor: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = T.inkMid)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = T.inkFaint)}
                      >
                        {showPassword ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                      </button>
                    }
                  />

                  {error && (
                    <div
                      className="flex items-start gap-2.5 px-4 py-3"
                      style={{
                        background: 'rgba(197, 48, 48, 0.06)',
                        borderLeft: `2px solid ${T.red}`,
                        borderRadius: '6px',
                      }}
                    >
                      <AlertCircle size={14} strokeWidth={1.75} style={{ color: T.red, flexShrink: 0, marginTop: 2 }} />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12.5px] leading-relaxed tracking-[-0.005em]"
                          style={{ color: T.red, fontWeight: 450 }}
                        >
                          {error}
                        </p>
                        {isBlocked() && (
                          <p className="text-[11px] tabular-nums mt-1" style={{ color: 'rgba(197, 48, 48, 0.6)' }}>
                            Reintento en {countdown}s
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {attempts > 0 && !isBlocked() && (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full transition-colors"
                            style={{ background: i < attempts ? T.red : T.inkGhost }}
                          />
                        ))}
                      </div>
                      <span
                        className="text-[11px] uppercase tracking-[0.18em]"
                        style={{ color: T.inkFaint, fontWeight: 500 }}
                      >
                        {attempts} de 5
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || isBlocked()}
                    className="w-full h-12 flex items-center justify-center gap-2.5 text-white transition-all duration-200 disabled:cursor-not-allowed"
                    style={{
                      background: T.accent,
                      borderRadius: '6px',
                      opacity: (loading || isBlocked()) ? 0.4 : 1,
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      transitionTimingFunction: T.ease,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && !isBlocked()) e.currentTarget.style.background = T.accentDeep;
                    }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = T.accent; }}
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verificando
                      </>
                    ) : (
                      'Ingresar al panel'
                    )}
                  </button>
                </form>
              </div>

              {/* Protocolo · 5 cols con offset */}
              <div className="lg:col-span-5 lg:pt-12">
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-4"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  Protocolo de acceso
                </p>

                <div className="space-y-5 max-w-sm">
                  <p
                    className="text-[14px] leading-[1.65] tracking-[-0.005em]"
                    style={{ color: T.inkMid, fontWeight: 450 }}
                  >
                    Zona exclusiva para administradores verificados. Si no eres parte del equipo, te invitamos a volver a la página principal.
                  </p>

                  <p
                    className="text-[13px] leading-[1.7] tracking-[-0.005em]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Cada intento de acceso queda registrado. Tras cinco intentos fallidos, el sistema bloquea el acceso durante 60 segundos.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ═══ FOOTER minimal ═══ */}
        <Footer variant="minimal" />
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family: ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino', Georgia, 'Times New Roman', serif;
        }
        ::selection { background: rgba(79, 46, 232, 0.12); color: #0F0F0F; }
        * { -webkit-tap-highlight-color: transparent; font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1; }
      `}</style>
    </>
  );
}