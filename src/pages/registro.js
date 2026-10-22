// src/pages/registro.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { User, Mail, Lock, Phone, ArrowLeft } from 'lucide-react';
import pb from '../lib/pocketbase';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) return setError('Las contraseñas no coinciden');
    if (formData.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (!acceptTerms) return setError('Debes aceptar los términos y condiciones');
    
    // Validar teléfono opcional
    let cleanPhone = formData.telefono.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) return setError('El teléfono debe tener 10 dígitos');

    setLoading(true);

    try {
      // 1. Verificar si el email ya existe
      try {
        await pb.collection('users').getFirstListItem(`email = "${formData.email}"`);
        throw new Error('Este correo ya está registrado. Intenta iniciar sesión.');
      } catch (err) {
        if (err.status !== 404) throw err; // Si el error no es "No encontrado", lo lanzamos
      }

      // 2. Crear el usuario en PocketBase
      const newUser = await pb.collection('users').create({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        nombre: formData.nombre,
        telefono: cleanPhone || '',
        role: 'cliente',
        activo: true,
      });

      // 3. Iniciar sesión automáticamente
      await pb.collection('users').authWithPassword(formData.email, formData.password);

      // 4. Crear registro en clients con términos aceptados
      await pb.collection('clients').create({
        userId: newUser.id,
        nombre: formData.nombre,
        telefono: cleanPhone || '',
        nivel: 0,
        estadoKyc: 'pendiente',
        aceptaTerminos: true,
        fechaAceptaTerminos: new Date().toISOString()
      });

      // 5. Redirigir al perfil
      router.push('/perfil');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al crear la cuenta. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Crear Cuenta | MarketDesliz</title></Head>
      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <TerminalBar mode="rotating" />
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 text-[13px] mb-8" style={{ color: T.inkSoft }}>
              <ArrowLeft size={14} /> Volver al inicio
            </Link>

            <div className="p-8" style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: '12px' }}>
              <h1 className="text-2xl font-bold mb-2" style={{ color: T.ink }}>Crea tu cuenta</h1>
              <p className="text-sm mb-6" style={{ color: T.inkSoft }}>Únete a MarketDesliz y empieza a comprar.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Nombre completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                    <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                      style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                      placeholder="Ej: Juan Pérez" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Correo electrónico</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                    <input type="email" name="email" required value={formData.email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                      style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                      placeholder="tu@correo.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Teléfono (Opcional)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                    <input type="tel" name="telefono" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0,10)})}
                      className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                      style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                      placeholder="10 dígitos" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                    <input type="password" name="password" required value={formData.password} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                      style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                      placeholder="Mínimo 8 caracteres" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: T.inkFaint }}>Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.inkFaint }} />
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 outline-none text-sm"
                      style={{ border: `1px solid ${T.line}`, borderRadius: '6px', background: 'transparent', color: T.ink }}
                      placeholder="Repite la contraseña" />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1" />
                  <label htmlFor="terms" className="text-[11px] leading-tight" style={{ color: T.inkSoft }}>
                    Acepto los <a href="/terminos-condiciones" target="_blank" className="underline" style={{ color: T.accent }}>Términos y Condiciones</a> y el <a href="/privacidad" target="_blank" className="underline" style={{ color: T.accent }}>Aviso de Privacidad</a>.
                  </label>
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full py-3 text-white text-sm font-medium disabled:opacity-50 mt-4"
                  style={{ background: T.accent, borderRadius: '6px' }}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-[12px]" style={{ color: T.inkSoft }}>
                  ¿Ya tienes una cuenta? <Link href="/" className="font-medium" style={{ color: T.accent }}>Inicia sesión</Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}