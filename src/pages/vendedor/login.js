// src/pages/vendedor/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, Rocket, ChevronLeft } from 'lucide-react';
import pb from '../../lib/pocketbase';

export default function VendedorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('1️⃣ Intentando login con email:', email);

      const authData = await pb.collection('users').authWithPassword(email, password);
      const user = authData.record;
      console.log('2️⃣ Usuario autenticado:', { id: user.id, email: user.email, role: user.role });

      if (user.role !== 'vendedor') {
        console.log('3️⃣ Rol incorrecto:', user.role);
        setError(`Tu rol actual es "${user.role || 'ninguno'}". Esta área es exclusiva para vendedores.`);
        setLoading(false);
        return;
      }

      console.log('4️⃣ Buscando vendedor con userId:', user.id);

      try {
        const vendedor = await pb.collection('vendedores').getFirstListItem(
          `userId = "${user.id}" && activo = true`
        );
        console.log('5️⃣ Vendedor encontrado:', { id: vendedor.id, codigo: vendedor.codigo, activo: vendedor.activo });

        localStorage.setItem('vendedorData', JSON.stringify({
          id: vendedor.id,
          codigo: vendedor.codigo,
          nombre: user.nombre,
          email: user.email,
          zona: vendedor.zona,
          comisionPorcentaje: vendedor.comisionPorcentaje,
          activo: vendedor.activo
        }));

        console.log('6️⃣ Redirigiendo a /vendedor');
        router.push('/vendedor');

      } catch (searchError) {
        console.log('❌ Error buscando vendedor - status:', searchError.status);
        console.log('❌ Error detalle:', searchError.message);

        if (searchError.status === 404) {
          setError('No se encontró tu registro como vendedor. Contacta al administrador.');
        } else {
          setError('Error al verificar tu cuenta de vendedor.');
        }
        setLoading(false);
        return;
      }

    } catch (error) {
      console.log('❌ Error de autenticación:', error.status, error.message);
      if (error.status === 400) {
        setError('Correo o contraseña incorrectos');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Error de conexión. Verifica tu conexión a internet.');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Acceso Vendedor | MarketDesliz</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex">

        {/* ── Panel izquierdo — marca ───────────────────────── */}
        <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-[#111827] flex-col justify-between p-12 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Rocket size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-[15px] tracking-tight">
              MARKET<span className="text-white/40">DESLIZ</span>
            </span>
          </div>

          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">
              Portal de vendedores
            </p>
            <h1 className="text-white text-3xl font-bold leading-snug mb-4">
              Tu herramienta para vender más cada día
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Gestiona solicitudes, recibe comisiones y comparte tu código QR con clientes.
            </p>

            {/* Stats decorativos */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { label: 'Comisión por venta', value: '50% del enganche' },
                { label: 'Pago de comisiones', value: 'Miércoles' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-4">
                  <p className="text-white text-lg font-bold">{value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} MarketDesliz
          </p>
        </div>

        {/* ── Panel derecho — formulario ────────────────────── */}
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

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Hola, vendedor</h2>
            <p className="text-sm text-gray-400 mb-8">Accede a tu panel de ventas</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendedor@marketdesliz.com"
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
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm leading-relaxed">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
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

            {/* Footer links */}
            <div className="mt-8 space-y-3">
              <Link
                href="/"
                className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft size={13} /> Volver al inicio
              </Link>
              <p className="text-xs text-gray-300 text-center">
                ¿No tienes cuenta? Contacta al administrador
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
