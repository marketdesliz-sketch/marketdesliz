// src/pages/solicitar.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { Phone, Lock, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';
import {
  loginWithGoogle,
  completeGoogleRegistration,
  parseJwt,
  addProviderToUser,
  generarPasswordTemporal
} from '../lib/authService';

export default function SolicitarPage() {
  const router = useRouter();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirectTo, setRedirectTo] = useState('/perfil');

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGooglePhoneModal, setShowGooglePhoneModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [googlePhone, setGooglePhone] = useState('');

  const [linkCode, setLinkCode] = useState('');
  const [linkGeneratedCode, setLinkGeneratedCode] = useState('');
  const [linkData, setLinkData] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    if (router.query.redirect) setRedirectTo(router.query.redirect);
  }, [router.query]);

  useEffect(() => {
    const rememberedPhone = localStorage.getItem('rememberPhone');
    if (rememberedPhone) {
      setPhone(rememberedPhone);
    }
  }, []);

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.role !== 'admin') router.push(redirectTo);
  }, [router, redirectTo]);

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return value;
  };

  const sendSMSCode = async (phoneNumber, codeToSend) => {
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: phoneNumber, codigo: codeToSend })
      });
      if (!response.ok) throw new Error('Error al enviar SMS');
      return response.json();
    } catch (err) {
      console.warn('Modo demo:', err.message);
      return { success: true, demo: true };
    }
  };

  const generarTokenKey = () => 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Ingresa un número válido de 10 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);
      await sendSMSCode(cleanPhone, newCode);
      console.log(`📱 Código: ${newCode}`);
      setStep('code');
      setResendCooldown(50);
      const interval = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err) {
      setError('Error al enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) { setError(`Espera ${resendCooldown}s`); return; }
    setLoading(true);
    setError('');
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);
      await sendSMSCode(cleanPhone, newCode);
      setResendCooldown(50);
      const interval = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } catch (err) {
      setError('Error al reenviar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    if (code !== generatedCode) { setError('Código incorrecto'); return; }

    setStep('loading');
    setError('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const tempEmail = `user_${cleanPhone}@marketdesliz.com`;

      // 1. Verificar si el usuario ya existe (por teléfono, que es el único identificador aquí)
      let existingUser = null;
      try {
        const phoneRes = await fetch('/api/get-user-by-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefono: cleanPhone })
        });
        const phoneData = await phoneRes.json();
        if (phoneData.exists) existingUser = phoneData.user;
      } catch (e) { /* no existe */ }

      // 2. Usuario existente: actualizar contraseña y autenticar
      if (existingUser) {
        console.log('✅ Usuario existente encontrado:', existingUser.id);
        const tempPassword = generarPasswordTemporal();

        const updatePassRes = await fetch('/api/update-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: existingUser.id, newPassword: tempPassword })
        });
        if (!updatePassRes.ok) {
          const errorData = await updatePassRes.json();
          throw new Error(errorData.error || 'No se pudo actualizar la contraseña');
        }

        await pb.collection('users').authWithPassword(existingUser.email, tempPassword);

        // Asegurar que tenga el teléfono (por si acaso)
        if (!existingUser.telefono) {
          await fetch('/api/update-user-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: existingUser.id, phone: cleanPhone })
          });
        }

        setStep('success');
        setTimeout(() => router.push(redirectTo), 1500);
        return;
      }

      // 3. Usuario no existe → crear nuevo
      console.log('🆕 Usuario no existe, creando nuevo...');
      const tempPassword = generarPasswordTemporal();

      const newUser = await pb.collection('users').create({
        email: tempEmail,
        password: tempPassword,
        passwordConfirm: tempPassword,
        emailVisibility: false,
        verified: false,
        role: 'cliente',
        nombre: `Usuario ${cleanPhone.slice(-4)}`,
        activo: true,
        telefono: cleanPhone,
        tokenKey: generarTokenKey()
      });
      console.log('✅ Usuario creado:', newUser.id);

      await pb.collection('users').authWithPassword(tempEmail, tempPassword);

      await pb.collection('clients').create({
        userId: newUser.id,
        telefono: cleanPhone,
        nombre: newUser.nombre,
        nivel: 0,
        productosComprados: 0,
        productosPagados: 0,
        productosEnCurso: 0,
        deudaActual: 0,
        limiteDeuda: 5000,
        estadoKyc: 'pendiente',
        trustScore: 0,
        datosCompletos: false,
        totalGastado: 0,
        diaPago: 'lunes',
        telefonoAlternativo: ''
      });

      await pb.collection('user_providers').create({
        userId: newUser.id,
        provider: 'phone',
        telefono: cleanPhone
      });

      localStorage.setItem('primerIngreso', 'true');
      localStorage.setItem('userIdCompletarDatos', newUser.id);

      setStep('success');
      setTimeout(() => router.push(redirectTo), 1500);

    } catch (err) {
      console.error('❌ ERROR FATAL:', err);
      if (err.message?.includes('validation_not_unique')) {
        setError('Ya tienes una cuenta con este número. Intenta iniciar sesión.');
      } else {
        setError(err.message || 'Error al procesar tu cuenta. Intenta de nuevo.');
      }
      setStep('code');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle(credentialResponse);
      if (result.success) {
        router.push('/');
      } else if (result.needsPhone) {
        setPendingGoogleUser({
          userId: result.userId,
          email: result.email,
          nombre: result.nombre,
          tempPassword: result.tempPassword,
          googleId: credentialResponse.credential ? parseJwt(credentialResponse.credential).sub : null
        });
        setShowGooglePhoneModal(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCompleteGooglePhone = async () => {
    const cleanPhone = googlePhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Teléfono inválido');
      return;
    }

    setGoogleLoading(true);
    try {
      if (!pendingGoogleUser || !pendingGoogleUser.userId) {
        throw new Error('Error: No se pudo identificar al usuario');
      }

      const result = await completeGoogleRegistration(
        pendingGoogleUser.userId,
        cleanPhone,
        pendingGoogleUser.nombre,
        pendingGoogleUser.tempPassword
      );

      if (result.success) {
        setPendingGoogleUser(null);
        setLinkData(null);
        setGooglePhone('');
        router.push('/');
      } else if (result.conflict) {
        setShowGooglePhoneModal(false);
        setConfirmData({
          phone: result.phone,
          existingEmail: result.existingEmail,
          existingUserId: result.existingUserId,
          existingNombre: result.existingNombre,
          cleanPhone: cleanPhone
        });
        setShowConfirmModal(true);
      } else {
        setError(result.message || 'Error al completar registro');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleConfirmLink = async () => {
    setShowConfirmModal(false);

    setLinkData({
      newUserId: pendingGoogleUser.userId,
      existingUserId: confirmData.existingUserId,
      phone: confirmData.cleanPhone,
      nombre: pendingGoogleUser.nombre,
      email: pendingGoogleUser.email,
      googleId: pendingGoogleUser.googleId
    });

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setLinkGeneratedCode(newCode);
    await sendSMSCode(confirmData.cleanPhone, newCode);
    console.log(`📱 Código de verificación para vincular: ${newCode}`);

    setStep('verifyLinkCode');
    setError('');
  };

  const handleVerifyLinkCode = async (e) => {
    e.preventDefault();
    if (linkCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }
    if (linkCode !== linkGeneratedCode) {
      setError('Código incorrecto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { newUserId, existingUserId, phone, email, googleId } = linkData;

      if (!googleId) {
        throw new Error('No se encontró información de Google para vincular');
      }

      // 1. Vincular provider Google a la cuenta existente
      await addProviderToUser(existingUserId, {
        provider: 'google',
        providerId: googleId,
        email: email
      });

      // 2. Obtener datos del usuario existente (para tener su email actual)
      const responseUser = await fetch('/api/get-user-by-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: existingUserId })
      });
      const userData = await responseUser.json();
      if (!userData.exists) throw new Error('Usuario existente no encontrado');
      const existingUser = userData.user;

      // 3. Eliminar usuario temporal ANTES de actualizar el email (para liberar el email de Google)
      try {
        const deleteRes = await fetch('/api/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: newUserId })
        });
        if (!deleteRes.ok) {
          console.warn('No se pudo eliminar usuario temporal:', await deleteRes.json());
        } else {
          console.log('🗑️ Usuario temporal eliminado');
        }
      } catch (err) {
        console.warn('Error eliminando usuario temporal:', err);
      }

      // 4. Si el email del usuario existente es temporal, actualizarlo al real de Google
      // (ahora el email de Google ya no está en uso porque el temporal fue eliminado)
      let authEmail = existingUser.email;
      if (existingUser.email && existingUser.email.startsWith('user_') && existingUser.email.includes('@marketdesliz.com')) {
        const updateEmailRes = await fetch('/api/update-user-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: existingUserId, email })
        });
        if (!updateEmailRes.ok) {
          const errorData = await updateEmailRes.json();
          throw new Error(errorData.error || 'No se pudo actualizar el email');
        }
        authEmail = email;
        console.log('📧 Email actualizado de temporal a:', email);
      }

      // 5. Asegurar que tenga el teléfono (si no lo tiene)
      if (!existingUser.telefono) {
        const updatePhoneRes = await fetch('/api/update-user-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: existingUserId, phone })
        });
        if (!updatePhoneRes.ok) {
          const errorData = await updatePhoneRes.json();
          throw new Error(errorData.error || 'No se pudo actualizar el teléfono');
        }
      }

      // 6. Generar nueva contraseña temporal y actualizar
      const tempPassword = generarPasswordTemporal();
      const updatePassRes = await fetch('/api/update-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: existingUserId, newPassword: tempPassword })
      });
      if (!updatePassRes.ok) {
        const errorData = await updatePassRes.json();
        throw new Error(errorData.error || 'No se pudo actualizar la contraseña');
      }

      // 7. Autenticar al usuario con la nueva contraseña
      await pb.collection('users').authWithPassword(authEmail, tempPassword);

      // 8. Limpiar estados y redirigir
      setPendingGoogleUser(null);
      setLinkData(null);
      setLinkCode('');
      setLinkGeneratedCode('');
      setGooglePhone('');

      setStep('success');
      setTimeout(() => router.push('/'), 1500);

    } catch (err) {
      console.error('Error al vincular cuentas:', err);
      setError(err.message || 'Error al vincular. Intenta de nuevo.');
      setStep('phone');
      setLinkData(null);
      setLinkCode('');
      setLinkGeneratedCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar sesión | MarketDesliz</title>
        <meta name="description" content="Inicia sesión en MarketDesliz con tu número de teléfono" />
      </Head>

      <StoreLayout>
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-40 pb-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {step === 'phone' && <Phone size={26} className="text-[#6C3BFF]" />}
              {step === 'code' && <Lock size={26} className="text-[#6C3BFF]" />}
              {step === 'loading' && <div className="w-6 h-6 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />}
              {step === 'success' && <CheckCircle size={26} className="text-green-500" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {step === 'phone' && 'Bienvenido'}
              {step === 'code' && 'Verifica tu número'}
              {step === 'loading' && 'Preparando...'}
              {step === 'success' && '¡Listo!'}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {step === 'phone' && 'Ingresa tu número para iniciar sesión o crear una cuenta'}
              {step === 'code' && `Código enviado a ${formatPhone(phone)}`}
              {step === 'loading' && 'Estamos configurando tu cuenta'}
              {step === 'success' && 'Redirigiendo...'}
            </p>
          </div>

          {step === 'phone' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <form onSubmit={handlePhoneSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de teléfono</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="55 1234 5678"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-center text-lg"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Continuar <ChevronRight size={18} /></>}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O</span></div>
              </div>

              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log('Google Login Failed')} theme="outline" size="large" text="continue_with" shape="rectangular" width={400} />
              {googleLoading && <p className="text-center text-gray-500 text-sm mt-2">Procesando...</p>}

              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => {
                      setPhone('');
                      setCode('');
                      setError('');
                      setStep('phone');
                    }}
                    className="text-[#6C3BFF] font-medium hover:underline"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>

              <div className="text-center mt-2">
                <button
                  onClick={() => alert('Función en desarrollo. Contacta a soporte.')}
                  className="text-xs text-gray-400 hover:text-[#6C3BFF] transition"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#6C3BFF] focus:ring-[#6C3BFF]"
                    onChange={(e) => {
                      if (e.target.checked) {
                        localStorage.setItem('rememberPhone', phone);
                      } else {
                        localStorage.removeItem('rememberPhone');
                      }
                    }}
                  />
                  <span className="text-sm text-gray-600">Recordarme</span>
                </label>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Al continuar, aceptas nuestros <Link href="/terminos" className="text-[#6C3BFF] hover:underline">Términos</Link> y <Link href="/privacidad" className="text-[#6C3BFF] hover:underline">Privacidad</Link></p>
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <form onSubmit={handleCodeSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Código de verificación</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] text-center text-2xl tracking-widest font-mono" autoFocus />
                </div>
                {error && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl"><p className="text-red-600 text-sm text-center">{error}</p></div>)}
                <button type="submit" disabled={loading} className="w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50">{loading ? 'Verificando...' : 'Confirmar'}</button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={handleResendCode} disabled={resendCooldown > 0} className={`text-sm ${resendCooldown > 0 ? 'text-gray-400' : 'text-[#6C3BFF] hover:underline'}`}>{resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}</button>
              </div>
              <button onClick={() => setStep('phone')} className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"><ArrowLeft size={14} /> Cambiar número</button>
            </div>
          )}

          {step === 'loading' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
              <div className="w-12 h-12 border-3 border-gray-200 border-t-[#6C3BFF] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Configurando tu cuenta...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale"><CheckCircle size={32} className="text-white" /></div>
              <p className="text-gray-500 text-sm">¡Bienvenido a MarketDesliz!</p>
            </div>
          )}

          {step === 'verifyLinkCode' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <form onSubmit={handleVerifyLinkCode}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Código de verificación enviado a {formatPhone(linkData?.phone || '')}
                  </label>
                  <input
                    type="text"
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold">
                  {loading ? 'Verificando...' : 'Verificar y vincular'}
                </button>
              </form>
              <button
                onClick={() => {
                  setStep('phone');
                  setShowGooglePhoneModal(false);
                  setLinkData(null);
                  setLinkCode('');
                  setLinkGeneratedCode('');
                }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={14} /> Cancelar
              </button>
            </div>
          )}

          {showGooglePhoneModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-center mb-2">Completa tu registro</h3>
                <p className="text-sm text-gray-500 text-center mb-4">{pendingGoogleUser?.nombre}, ingresa tu número de teléfono</p>
                <input type="tel" value={googlePhone} onChange={(e) => setGooglePhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="55 1234 5678" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg mb-4" autoFocus />
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                <button onClick={handleCompleteGooglePhone} disabled={googleLoading} className="w-full bg-[#6C3BFF] text-white py-3 rounded-lg font-semibold disabled:opacity-50">{googleLoading ? 'Procesando...' : 'Continuar'}</button>
                <button onClick={() => setShowGooglePhoneModal(false)} className="w-full mt-2 text-gray-500 text-sm py-2">Cancelar</button>
              </div>
            </div>
          )}

          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Vincular cuentas</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    El número <span className="font-medium text-gray-900">{formatPhone(confirmData?.phone)}</span> ya está registrado con la cuenta:
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{confirmData?.existingEmail}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-700 text-center">
                    ⚠️ Se enviará un código de verificación al número para confirmar que eres el dueño.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmData(null);
                      setShowGooglePhoneModal(true);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmLink}
                    className="flex-1 px-4 py-2 bg-[#6C3BFF] text-white rounded-lg font-medium hover:bg-[#5b2ee6] transition"
                  >
                    Sí, vincular
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </StoreLayout>

      <style jsx>{`
        @keyframes scale {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale { animation: scale 0.3s ease-out; }
      `}</style>
    </>
  );
}