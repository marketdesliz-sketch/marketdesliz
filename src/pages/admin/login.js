// pages/admin/login.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Eye, EyeOff, AlertCircle, Rocket, Shield, LogIn } from 'lucide-react';
import pb from '../../lib/pocketbase';
import { loginAdmin } from '../../lib/pocketbase';

// ─── LogoMark (estilo cristal) ──────────────────────────────────────
const LogoMark = () => (
  <div className="flex items-center gap-3">
    <span className="font-logo font-bold text-4xl text-primary tracking-tight">
      ʃƪʃƪ
    </span>
    <div className="flex flex-col">
      <span className="font-bold text-xl text-textMain tracking-tight leading-none">
        Market<span className="text-primary">Desliz</span>
      </span>
      <span className="text-[10px] text-textMuted tracking-[0.2em] uppercase font-medium">
        Desliza • Descubre • Conecta
      </span>
    </div>
  </div>
);

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

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.role === 'admin') {
      router.replace(redirect || '/admin/dashboard');
    }
  }, [router, redirect]);

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
      const target = redirect || '/admin/dashboard';
      router.push(target);

    } catch (err) {
      console.error('Error en login admin:', err);
      setError(err.status === 400 ? 'Correo o contraseña incorrectos' : 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Acceso Administrador | MarketDesliz</title>
        <meta name="description" content="Panel de administración de MarketDesliz" />
      </Head>

      <div className="min-h-screen bg-[#ECEAF5] font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* ─── CABECERA ──────────────────────────────────────────── */}
          <div className="flex justify-center mb-8">
            <LogoMark />
          </div>

          {/* ─── TARJETA PRINCIPAL (efecto cristal) ──────────────── */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* ─── LADO IZQUIERDO: Información ──────────────────── */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                    <Rocket size={20} className="text-[#6C3BFF]" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Panel de Administración</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-textMain leading-tight">
                  Acceso restringido
                </h1>
                <p className="text-textMuted text-sm leading-relaxed">
                  Ingresa tus credenciales para gestionar clientes, vendedores, productos y todas las operaciones de MarketDesliz desde un solo lugar.
                </p>

                <div className="flex items-center gap-3 pt-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Shield size={16} className="text-green-600" />
                  </div>
                  <span className="text-xs text-gray-500">Conexión segura · SSL</span>
                </div>
              </div>

              {/* ─── LADO DERECHO: Formulario ─────────────────────── */}
              <div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@marketdesliz.com"
                      required
                      disabled={loading || isBlocked()}
                      autoFocus
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all disabled:bg-gray-50 disabled:text-gray-400 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading || isBlocked()}
                        className="w-full px-4 py-3 pr-11 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all disabled:bg-gray-50 backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                        tabIndex={-1}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2.5 bg-red-50/80 border border-red-100/80 text-red-600 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                      {isBlocked() && (
                        <span className="ml-auto text-xs font-medium text-red-400">
                          {getBlockedTimeRemaining()}s
                        </span>
                      )}
                    </div>
                  )}

                  {attempts > 0 && !isBlocked() && (
                    <p className="text-xs text-gray-400 text-center">
                      {attempts} intento{attempts > 1 ? 's' : ''} fallido{attempts > 1 ? 's' : ''}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || isBlocked()}
                    className="w-full flex items-center justify-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-[#6C3BFF]/20"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        Ingresar
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-300 text-center mt-2">
                    Acceso exclusivo para administradores
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* ─── PIE DE PÁGINA ────────────────────────────────────── */}
          <div className="text-center mt-8 text-xs text-gray-400">
            © {new Date().getFullYear()} MarketDesliz · Todos los derechos reservados
          </div>
        </div>
      </div>

      <style jsx global>{`
        .font-logo {
          font-family: 'Georgia', serif;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}