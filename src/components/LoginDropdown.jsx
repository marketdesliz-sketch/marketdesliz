// src/components/LoginDropdown.jsx
import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Phone, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import pb from '../lib/pocketbase';
import {
  loginWithGoogle,
  parseJwt,
  generarPasswordTemporal
} from '../lib/authService';

const formatPhone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return value;
};

export default function LoginDropdown({ onClose, onSuccess }) {
  const [step, setStep] = useState('login'); // login | code | loading | success
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: cleanPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al enviar el código');
        return;
      }

      setStep('code');
      setShowPhoneInput(false);
      setResendCooldown(50);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Error al enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      setError(`Espera ${resendCooldown}s`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: cleanPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al reenviar');
        return;
      }

      setResendCooldown(50);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Error al reenviar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }

    setStep('loading');
    setError('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const tempPassword = generarPasswordTemporal();

      // 1. Verificar OTP en el servidor
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: cleanPhone,
          code,
          newPassword: tempPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMap = {
          no_code: 'No hay código activo. Solicita uno nuevo.',
          expired: 'El código expiró. Solicita uno nuevo.',
          max_attempts: 'Demasiados intentos. Solicita uno nuevo.',
          invalid: 'Código incorrecto.',
        };
        setError(errorMap[data.error] || data.error || 'Error al verificar');
        setStep('code');
        return;
      }

      // 2. Autenticar con la contraseña temporal
      await pb.collection('users').authWithPassword(data.email, tempPassword);

      // 3. Si es usuario nuevo, marcar primer ingreso
      if (data.isNewUser) {
        localStorage.setItem('primerIngreso', 'true');
        localStorage.setItem('userIdCompletarDatos', data.userId);
      }

      setStep('success');
      if (onSuccess) onSuccess();
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al procesar tu cuenta');
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

  // ─── Renderizado ──────────────────────────────────────────────

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
          Código enviado a {formatPhone(phone)}
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
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
            className={`text-xs ${resendCooldown > 0 ? 'text-gray-400' : 'text-[#6C3BFF] hover:underline'}`}
          >
            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
          </button>
        </div>
      </div>
    );
  }

  // ─── VISTA INICIAL (login) ──────────────────────────────────
  return (
    <div className="absolute right-0 top-full mt-1 w-80 bg-white shadow-xl border border-gray-200 rounded-sm z-[100]">
      <div className="p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">LOG IN WITH AN ACCOUNT</p>

        {/* Botón Teléfono */}
        <button
          onClick={() => setShowPhoneInput(!showPhoneInput)}
          className="w-full bg-white text-gray-700 border border-gray-300 flex items-center gap-3 px-4 py-2.5 rounded-xl mb-2 font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          <Phone size={18} className="text-gray-500" />
          Teléfono
        </button>

        {/* Campo de número (se despliega) */}
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

        {/* Google */}
        <div className="mb-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={(error) => console.error('Google Login error completo:', error)}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="320"
          />
        </div>

        <div className="text-center text-gray-400 text-sm mb-4">O inicia sesión con</div>

        {/* Formulario email/password */}
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
          <p className="text-[#6C3BF5] text-sm cursor-pointer hover:underline">¿Olvidaste tu contraseña?</p>
          <p className="text-[#6C3BF5] text-sm cursor-pointer hover:underline">¿No tienes cuenta? Crea una aquí</p>
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