// src/components/AuthModal.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Phone, Lock, ChevronRight, CheckCircle, ArrowLeft, X } from 'lucide-react';
import pb from '../lib/pocketbase';
import { generarPasswordTemporal } from '../lib/authService';

const formatPhone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return value;
};

export default function AuthModal({ isOpen, onClose, onSuccess, redirectTo = '/perfil' }) {
  const router = useRouter();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhone('');
      setCode('');
      setError('');
      setGeneratedCode('');
      setResendCooldown(0);
    }
  }, [isOpen]);

  // Si ya está autenticado, cerrar y redirigir
  useEffect(() => {
    if (isOpen && pb.authStore.isValid && pb.authStore.role !== 'admin') {
      onClose();
      if (onSuccess) onSuccess();
      router.push(redirectTo);
    }
  }, [isOpen, redirectTo, router, onSuccess]);

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

      // 1. Verificar si el usuario ya existe (por teléfono)
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
        if (!existingUser.telefono) {
          await fetch('/api/update-user-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: existingUser.id, phone: cleanPhone })
          });
        }
        setStep('success');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          router.push(redirectTo);
        }, 1500);
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
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        router.push(redirectTo);
      }, 1500);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading || step === 'loading' || step === 'success'}
        >
          <X size={24} />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {step === 'phone' && <Phone size={26} className="text-[#6C3BFF]" />}
              {step === 'code' && <Lock size={26} className="text-[#6C3BFF]" />}
              {step === 'loading' && <div className="w-6 h-6 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />}
              {step === 'success' && <CheckCircle size={26} className="text-green-500" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'phone' && 'Bienvenido'}
              {step === 'code' && 'Verifica tu número'}
              {step === 'loading' && 'Preparando...'}
              {step === 'success' && '¡Listo!'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              {step === 'phone' && 'Ingresa tu número para iniciar sesión o crear una cuenta'}
              {step === 'code' && `Código enviado a ${formatPhone(phone)}`}
              {step === 'loading' && 'Estamos configurando tu cuenta'}
              {step === 'success' && 'Redirigiendo...'}
            </p>
          </div>

          {step === 'phone' && (
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
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Continuar <ChevronRight size={18} /></>}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Código de verificación</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Confirmar'}
              </button>
              <div className="mt-4 text-center">
                <button
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className={`text-sm ${resendCooldown > 0 ? 'text-gray-400' : 'text-[#6C3BFF] hover:underline'}`}
                >
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
              <button
                onClick={() => setStep('phone')}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={14} /> Cambiar número
              </button>
            </form>
          )}

          {step === 'loading' && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 border-3 border-gray-200 border-t-[#6C3BFF] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Configurando tu cuenta...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale">
                <CheckCircle size={32} className="text-white" />
              </div>
              <p className="text-gray-500 text-sm">¡Bienvenido a MarketDesliz!</p>
            </div>
          )}
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