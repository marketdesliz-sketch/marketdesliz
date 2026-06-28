// src/pages/_app.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import pb from '../lib/pocketbase';
import '../styles/globals.css';

// ✅ Tu Client ID del archivo .env.local
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
  '654764535161-vl0k2th79l9iv43hq82rt81mahl5eu3c.apps.googleusercontent.com';

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // ============================================================
  // 1. INTERCEPTOR DE RUTAS - SEGURIDAD (CORREGIDO)
  // ============================================================
  useEffect(() => {
    const handleRouteChange = (url) => {
      // Determinar si la ruta es del panel de admin (excluir login)
      const isAdminRoute = url.startsWith('/admin') && !url.startsWith('/admin/login');
      
      // Si hay sesión de admin y NO estamos en ruta de admin → limpiar
      if (pb.authStore.isValid && pb.authStore.role === 'admin' && !isAdminRoute) {
        console.warn('⚠️ Sesión de admin en ruta de cliente. Limpiando...');
        // ✅ Usar clearAll() para eliminar todas las sesiones
        pb.authStore.clearAll();
        // Forzar recarga para evitar estados corruptos
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        return;
      }
      
      // ✅ Si hay sesión de usuario y estamos en ruta de admin → limpiar
      if (pb.authStore.isValid && pb.authStore.role !== 'admin' && isAdminRoute) {
        console.warn(`⚠️ Sesión de usuario (${pb.authStore.role}) en ruta de admin. Limpiando...`);
        pb.authStore.clearAll();
        // Redirigir a login de admin
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        return;
      }

      // ✅ Si hay sesión de admin y estamos en admin/login → redirigir a dashboard
      if (pb.authStore.isValid && pb.authStore.role === 'admin' && url === '/admin/login') {
        console.log('🔄 Admin ya autenticado, redirigiendo a dashboard');
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/dashboard';
        }
        return;
      }

      // ✅ Si hay sesión de usuario y estamos en solicitar → redirigir a perfil
      if (pb.authStore.isValid && pb.authStore.role !== 'admin' && url === '/solicitar') {
        console.log('🔄 Usuario ya autenticado, redirigiendo a perfil');
        if (typeof window !== 'undefined') {
          window.location.href = '/perfil';
        }
        return;
      }
    };

    // Suscribirse a eventos de navegación
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChange);

    // Verificar al cargar la página
    handleRouteChange(router.pathname);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // ============================================================
  // 2. MONTAJE CLIENTE (evita hidratación)
  // ============================================================
  useEffect(() => {
    setMounted(true);

    // ✅ Verificar consistencia de sesión al montar
    if (typeof window !== 'undefined') {
      const userStored = localStorage.getItem('pb_user_auth');
      const adminStored = localStorage.getItem('pb_admin_auth');
      
      // Si ambas sesiones existen, es un error - limpiar ambas
      if (userStored && adminStored) {
        console.warn('⚠️ Sesiones conflictivas detectadas (usuario y admin). Limpiando...');
        pb.authStore.clearAll();
      }
    }
  }, []);

  // ============================================================
  // 3. RENDERIZADO PRINCIPAL
  // ============================================================
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* Toaster para notificaciones globales */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: '#6C3BFF',
              color: '#fff',
            },
          },
        }}
      />
      <Component {...pageProps} />
    </GoogleOAuthProvider>
  );
}

export default MyApp;