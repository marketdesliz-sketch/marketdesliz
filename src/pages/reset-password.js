// src/pages/reset-password.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import pb from '../lib/pocketbase';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');

    setLoading(true);
    setError('');

    try {
      await pb.collection('users').confirmPasswordReset(token, password, confirmPassword);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('El enlace es inválido o ha expirado. Solicita uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: T.bg }}>
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: T.red }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: T.ink }}>Enlace inválido</h2>
          <p className="text-sm mb-4" style={{ color: T.inkSoft }}>Falta el token de seguridad en la URL.</p>
          <Link href="/recuperar-password" style={{ color: T.accent }}>Solicitar un nuevo enlace</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Nueva Contraseña | MarketDesliz</title></Head>
      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <TerminalBar mode="rotating" />
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md p-8" style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: '12px' }}>
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: T.ink }}>¡Contraseña actualizada!</h2>
                <p className="text-sm mb-6" style={{ color: T.inkSoft }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <Link href="/" className="w-full block py-3 text-white text-sm font-medium text-center" style={{ background: T.accent, borderRadius: '6px' }}>
                  Ir a Iniciar Sesión
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-6" style={{ color: T.ink }}>Crea tu nueva contraseña</h1>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Nueva contraseña</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                        style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Confirmar contraseña</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                        style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                        placeholder="Repite la contraseña"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 text-white text-sm font-medium disabled:opacity-50"
                    style={{ background: T.accent, borderRadius: '6px' }}
                  >
                    {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}