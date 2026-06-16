// src/components/LoginModal.jsx


import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { X, Mail, Phone } from 'lucide-react';

export default function LoginModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openLoginModal', handleOpen);
    return () => window.removeEventListener('openLoginModal', handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleClienteClick = () => {
    router.push('/solicitar');
    setIsOpen(false);
  };

  const handleVendedorClick = () => {
    router.push('/vendedor/login');
    setIsOpen(false);
  };

  const handleClose = () => setIsOpen(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md relative animate-fadeIn">
        
        <div className="flex items-center justify-between pt-6 pb-4 px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Bienvenido</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Cliente - Teléfono */}
          <button
            onClick={handleClienteClick}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition shrink-0">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-gray-900">Soy Cliente</h3>
              <p className="text-sm text-gray-500">Inicia sesión con tu número de teléfono</p>
            </div>
            <span className="text-purple-600 opacity-0 group-hover:opacity-100 transition">→</span>
          </button>

          {/* Vendedor/Admin - Email */}
          <button
            onClick={handleVendedorClick}
            className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition shrink-0">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-gray-900">Soy Vendedor</h3>
              <p className="text-sm text-gray-500">Inicia sesión con tu correo electrónico</p>
            </div>
            <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition">→</span>
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-b-2xl text-center">
          <p className="text-xs text-gray-500">
            ¿Problemas para acceder?{' '}
            <button className="text-purple-600 hover:underline">Contacta a soporte</button>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
