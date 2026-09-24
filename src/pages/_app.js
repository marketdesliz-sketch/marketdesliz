// src/pages/_app.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import pb from '../lib/pocketbase';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

// ✅ Tu Client ID del archivo .env.local
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '654764535161-vl0k2th79l9iv43hq82rt81mahl5eu3c.apps.googleusercontent.com';

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // ============================================================
  // 1. INTERCEPTOR DE RUTAS · SEGURIDAD
  //    Usa router.replace (no window.location.href)
  //    para no romper la WebView en Capacitor.
  // ============================================================
  useEffect(() => {
    // Guard para no crear loops de redirect
    const safeReplace = (target) => {
      if (typeof window === 'undefined') return;
      if (window.location.pathname === target) return;
      router.replace(target);
    };

    const handleRouteChange = (url) => {
      const isAdminRoute = url.startsWith('/admin') && !url.startsWith('/admin/login');

      // Admin en ruta de cliente → limpiar sesión
      if (pb.authStore.isValid && pb.authStore.role === 'admin' && !isAdminRoute) {
        console.warn('⚠️ Sesión de admin en ruta de cliente. Limpiando...');
        pb.authStore.clearAll();
        safeReplace('/');
        return;
      }

      // Usuario normal en ruta de admin → limpiar sesión
      if (pb.authStore.isValid && pb.authStore.role !== 'admin' && isAdminRoute) {
        console.warn(`⚠️ Sesión de usuario (${pb.authStore.role}) en ruta de admin. Limpiando...`);
        pb.authStore.clearAll();
        safeReplace('/admin/login');
        return;
      }

      // Admin ya autenticado en /admin/login → dashboard
      if (pb.authStore.isValid && pb.authStore.role === 'admin' && url === '/admin/login') {
        console.log('🔄 Admin ya autenticado, redirigiendo a dashboard');
        safeReplace('/admin/dashboard');
        return;
      }

      // Usuario ya autenticado en /solicitar → perfil
      if (pb.authStore.isValid && pb.authStore.role !== 'admin' && url === '/solicitar') {
        console.log('🔄 Usuario ya autenticado, redirigiendo a perfil');
        safeReplace('/perfil');
        return;
      }
    };

    // ✅ Solo escuchamos routeChangeComplete (evita duplicar checks)
    router.events.on('routeChangeComplete', handleRouteChange);

    // Chequeo inicial al montar (con delay para evitar racing)
    const initialCheck = setTimeout(() => {
      handleRouteChange(router.pathname);
    }, 100);

    return () => {
      clearTimeout(initialCheck);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // ============================================================
  // 2. MONTAJE CLIENTE (evita hidratación)
  // ============================================================
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const userStored = localStorage.getItem('pb_user_auth');
      const adminStored = localStorage.getItem('pb_admin_auth');

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
      <AuthProvider>
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
              iconTheme: { primary: '#10b981', secondary: '#fff' },
              style: { background: '#10b981', color: '#fff' },
            },
            error: {
              duration: 4000,
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: { background: '#ef4444', color: '#fff' },
            },
            loading: {
              duration: Infinity,
              style: { background: '#6C3BFF', color: '#fff' },
            },
          }}
        />
        <Component {...pageProps} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;