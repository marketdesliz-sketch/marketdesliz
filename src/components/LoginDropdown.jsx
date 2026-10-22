// src/components/LoginDropdown.jsx
import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Phone, ChevronRight, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import pb from '../lib/pocketbase';
import { loginWithGoogle, parseJwt } from '../lib/authService';
import { useAuth } from '../contexts/AuthContext';

export default function LoginDropdown({ onClose, onSuccess }) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState('login'); // login | code | telegram_link | loading | success
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    return () => {
      setStep('login');
      setShowPhoneInput(false);
      setPhone('');
      setCode('');
      setError('');
      setLoading(false);
      setResendCooldown(0);
    };
  }, []);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) return setError('Ingresa un número válido de 10 dígitos');
    if (!acceptTerms) return setError('Debes aceptar los términos y condiciones');

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: cleanPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'TELEGRAM_NOT_LINKED') {
          setStep('telegram_link');
          return;
        }
        setError(data.error || data.message || 'Error al enviar el código');
        return;
      }

      setStep('code');
      setResendCooldown(50);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Error de red al intentar enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return setError('Ingresa el código de 6 dígitos');

    setStep('loading');
    setError('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');

      // 1. Llamamos al endpoint que usa Impersonate
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: cleanPhone, code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Código inválido');
        setStep('code');
        return;
      }

      // 2. Guardamos el token en el authStore de PocketBase
      pb.authStore.save(data.token, data.record);

      // 3. Si es nuevo, guardamos la bandera para que salga el modal de completar datos
      if (data.isNewUser) {
        localStorage.setItem('primerIngreso', 'true');
        localStorage.setItem('userIdCompletarDatos', data.record.id);
      }

      // 4. Mostramos el check verde de éxito
      setStep('success');
      if (onSuccess) onSuccess();

      // 5. ✅ EL TRUCO FINAL: Recargamos la página para que toda la app lea el nuevo token
      setTimeout(() => {
        onClose();
        window.location.href = '/perfil'; // Redirección dura al perfil
      }, 1000);

    } catch (err) {
      console.error('Error en verificación:', err);
      setError('Error de red al intentar verificar el código');
      setStep('code');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      if (authData.record) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle(credentialResponse);
      if (result.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else if (result.needsPhone) {
        sessionStorage.setItem('googlePending', JSON.stringify({
          userId: result.userId,
          email: result.email,
          nombre: result.nombre,
          tempPassword: result.tempPassword,
          googleId: credentialResponse.credential ? parseJwt(credentialResponse.credential).sub : null
        }));
        setShowPhoneInput(true);
        setError('Completa tu registro con tu número de teléfono');
      } else {
        setError(result.message || 'Error con Google');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // VISTA DE VINCULACIÓN DE TELEGRAM
  if (step === 'telegram_link') {
    return (
      <div className="absolute right-0 top-full mt-1 w-80 bg-white shadow-xl border border-gray-200 rounded-sm z-[100] p-6 text-center">
        <div className="w-16 h-16 bg-[#2AABEE]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={28} className="text-[#2AABEE]" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">Vincula tu Telegram</h3>
        <p className="text-xs text-gray-500 mb-6">
          Para enviarte tu código de acceso seguro, primero vincula tu cuenta de Telegram.
        </p>
        <a
          href={`https://t.me/DeslizBot?start=${phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#2AABEE] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#229ED9] transition-colors mb-3"
        >
          Abrir Telegram
        </a>
        <button onClick={() => setStep('login')} className="text-xs text-gray-500 hover:text-gray-700">
          Ya lo vinculé, volver a intentar
        </button>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="absolute right-0 top-full mt-1 w-80 bg-white shadow-xl border border-gray-200 rounded-sm z-[100] p-6 text-center">
        <div className="w-12 h-12 border-3 border-gray-200 border-t-[#6C3BFF] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Procesando...</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="absolute right-0 top-full mt-1 w-80 bg-white shadow-xl border border-gray-200 rounded-sm z-[100] p-6 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale">
          <CheckCircle size={32} className="text-white" />
        </div>
        <p className="text-gray-500 text-sm">¡Bienvenido a MarketDesliz!</p>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="absolute right-0 top-full mt-1 w-80 bg-white shadow-xl border border-gray-200 rounded-sm z-[100] p-6">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setStep('login')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <h3 className="font-semibold text-gray-800">Verifica tu número</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Código enviado a {phone}
        </p>
        <form onSubmit={handleCodeSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-center tracking-widest font-mono mb-3 outline-none focus:border-gray-400 transition-colors"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6C3BF5] text-white font-bold py-3 rounded-xl text-sm tracking-wider hover:bg-[#5A32D4] transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Confirmar'}
          </button>
        </form>
        <div className="mt-3 text-center">
          <button
            onClick={handlePhoneSubmit}
            disabled={resendCooldown > 0}
            className={`text-xs ${resendCooldown > 0 ? 'text-gray-400' : 'text-[#6C3BFF] hover:underline'}`}
          >
            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
          </button>
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL (LOGIN)
  return (
    <div className="absolute right-0 top-full mt-1 w-80 bg-white shadow-xl border border-gray-200 rounded-sm z-[100]">
      <div className="p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">LOG IN WITH AN ACCOUNT</p>

        <button
          onClick={() => setShowPhoneInput(!showPhoneInput)}
          className="w-full bg-white text-gray-700 border border-gray-300 flex items-center gap-3 px-4 py-2.5 rounded-xl mb-2 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          <Phone size={18} className="text-gray-500" />
          Teléfono
        </button>

        {showPhoneInput && (
          <div className="mb-3">
            <form onSubmit={handlePhoneSubmit} className="space-y-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="55 1234 5678"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-center outline-none focus:border-gray-400 transition-colors"
                autoFocus
              />
              <div className="flex items-start gap-2 py-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-[10px] text-gray-500 leading-tight cursor-pointer">
                  Acepto los <a href="/terminos-condiciones" target="_blank" className="text-[#6C3BFF] underline">Términos</a> y la <a href="/privacidad" target="_blank" className="text-[#6C3BFF] underline">Política de Privacidad</a>.
                </label>
              </div>
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6C3BF5] text-white font-bold py-3 rounded-xl text-sm tracking-wider hover:bg-[#5A32D4] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Continuar <ChevronRight size={16} /></>}
              </button>
            </form>
          </div>
        )}

        <div className="mb-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={(error) => console.error('Google Login error:', error)}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="320"
          />
        </div>

        <div className="text-center text-gray-400 text-sm mb-4">O inicia sesión con</div>

        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Ingresa tu correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:border-gray-400 transition-colors"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mb-4 outline-none focus:border-gray-400 transition-colors"
            required
            disabled={loading}
          />
          {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6C3BF5] text-white font-bold py-3 rounded-xl text-sm tracking-wider hover:bg-[#5A32D4] transition-colors mb-4 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'ENTRAR'}
          </button>
        </form>

        <div className="text-center space-y-1">
          <a href="/recuperar-password" className="block text-[#6C3BF5] text-sm hover:underline">¿Olvidaste tu contraseña?</a>
          <a href="/registro" className="block text-[#6C3BF5] text-sm hover:underline">¿No tienes cuenta? Crea una aquí</a>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale { animation: scale 0.3s ease-out; }
      `}</style>
    </div>
  );
}