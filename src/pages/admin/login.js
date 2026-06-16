// src/pages/admin/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, AlertCircle, Rocket } from 'lucide-react';
import pb from '../../lib/pocketbase';
import { loginAdmin } from '../../lib/pocketbase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Ingresa tu correo y contraseña'); return; }
    setLoading(true);
    setError('');
    try {
      // Usar la función loginAdmin que separa sesiones
      const result = await loginAdmin(email, password);
      if (!result.success) {
        setError(result.error || 'Credenciales incorrectas');
        setLoading(false);
        return;
      }
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.status === 400 ? 'Correo o contraseña incorrectos' : 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Panel izquierdo — marca ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-[#6C3BFF] flex-col justify-between p-12 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Rocket size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight">
            MARKET<span className="text-white/70">DESLIZ</span>
          </span>
        </div>

        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
            Panel de administración
          </p>
          <h1 className="text-white text-3xl font-bold leading-snug mb-4">
            Gestión centralizada de tu plataforma
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Administra clientes, vendedores, productos, órdenes y pagos desde un solo lugar.
          </p>
        </div>

        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} MarketDesliz
        </p>
      </div>

      {/* ── Panel derecho — formulario ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-[#6C3BFF] rounded-lg flex items-center justify-center">
              <Rocket size={16} className="text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">
              <span className="text-gray-900">MARKET</span>
              <span className="text-[#6C3BFF]">DESLIZ</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
          <p className="text-sm text-gray-400 mb-8">Accede al panel de administración</p>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
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
                disabled={loading}
                autoFocus
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* Password */}
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
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-xs text-gray-300 text-center mt-8">
            Acceso exclusivo para administradores
          </p>
        </div>
      </div>
    </div>
  );
}
