// src/components/checkout/PhoneModal.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Smartphone, Lock, CheckCircle, Loader } from 'lucide-react';
import pb from '../../lib/pocketbase';
import { generarPasswordTemporal } from '../../lib/authService'; // ✅ Importar la función

const formatPhone = (value) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 10) {
    const m = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (m) return `${m[1]} ${m[2]} ${m[3]}`;
  }
  return value;
};

export default function PhoneModal({ product, onClose, onSuccess }) {
  const router = useRouter(); // ✅ Obtener router
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
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
      console.warn('Error enviando SMS, usando modo demo:', err.message);
      return { success: true, demo: true };
    }
  };

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
      console.log(`Código enviado a ${formatPhone(cleanPhone)}: ${newCode}`);
      setStep('code');
      startCooldown();
    } catch (err) {
      setError('Error al enviar el código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);
      await sendSMSCode(cleanPhone, newCode);
      startCooldown();
    } catch (err) {
      setError('Error al reenviar el código.');
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

      // 1. Verificar si el usuario ya existe (por email o teléfono)
      let existingUser = null;
      try {
        const emailRes = await fetch('/api/get-user-by-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: tempEmail })
        });
        const emailData = await emailRes.json();
        if (emailData.exists) existingUser = emailData.user;
      } catch (e) { /* no existe */ }

      if (!existingUser) {
        try {
          const phoneRes = await fetch('/api/get-user-by-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono: cleanPhone })
          });
          const phoneData = await phoneRes.json();
          if (phoneData.exists) existingUser = phoneData.user;
        } catch (e) { /* no existe */ }
      }

      // 2. Usuario existente: actualizar contraseña y autenticar
      if (existingUser) {
        const tempPassword = generarPasswordTemporal();
        const updateRes = await fetch('/api/update-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: existingUser.id, newPassword: tempPassword })
        });
        if (!updateRes.ok) throw new Error('No se pudo actualizar la contraseña');

        await pb.collection('users').authWithPassword(existingUser.email, tempPassword);
        setStep('success');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          router.push('/perfil'); // o donde corresponda
        }, 1500);
        return;
      }

      // 3. Usuario nuevo: crear
      const tempPassword = generarPasswordTemporal();
      const generarTokenKey = () => 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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

      await pb.collection('users').authWithPassword(tempEmail, tempPassword);
      localStorage.setItem('primerIngreso', 'true');
      localStorage.setItem('userIdCompletarDatos', newUser.id);

      setStep('success');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        router.push('/perfil');
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
      if (err.message?.includes('validation_not_unique')) {
        setError('Ya tienes una cuenta con este número. Intenta iniciar sesión.');
      } else {
        setError(err.message || 'Error al procesar tu cuenta. Intenta de nuevo.');
      }
      setStep('code');
    }
  };

  // ... JSX (igual al que ya tenías, sin cambios)
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      {/* El mismo JSX que usaste, no hay cambios visuales */}
      {/* ... */}
    </div>
  );
}