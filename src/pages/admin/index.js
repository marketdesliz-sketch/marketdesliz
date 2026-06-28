// src/pages/admin/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import pb from '../../lib/pocketbase';

export default function AdminIndex() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (pb.authStore.isValid) {
        const user = pb.authStore.model;
        if (user?.role === 'admin') {
          router.replace('/admin/dashboard');
          setChecking(false);
          return;
        }
        // Si está autenticado pero no es admin, limpiar sesión
        pb.authStore.clear();
        router.replace('/admin/login');
      } else {
        router.replace('/admin/login');
      }
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6C3BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return null;
}