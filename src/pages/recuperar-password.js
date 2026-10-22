// src/pages/recuperar-password.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import pb from '../lib/pocketbase';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await pb.collection('users').requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      // Por seguridad, siempre decimos que se envió (para no revelar si el correo existe)
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Recuperar Contraseña | MarketDesliz</title></Head>
      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <TerminalBar mode="rotating" />
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 text-[13px] mb-8" style={{ color: T.inkSoft }}>
              <ArrowLeft size={14} /> Volver al inicio
            </Link>

            <div className="p-8" style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: '12px' }}>
              {success ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: T.ink }}>Revisa tu correo</h2>
                  <p className="text-sm mb-6" style={{ color: T.inkSoft }}>
                    Si <strong>{email}</strong> está registrado, te enviamos un enlace para restablecer tu contraseña.
                  </p>
                  <Link href="/" className="text-sm font-medium" style={{ color: T.accent }}>Volver al inicio</Link>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: T.ink }}>Recuperar contraseña</h1>
                  <p className="text-sm mb-6" style={{ color: T.inkSoft }}>
                    Ingresa tu correo electrónico y te enviaremos un enlace mágico para crear una nueva.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Correo electrónico</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                          style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                          placeholder="tu@correo.com"
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
                      {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}