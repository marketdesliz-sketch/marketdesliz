// src/layouts/CollectorLayout.jsx
import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/router";
import pb from '../lib/pocketbase';

export default function CollectorLayout({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!pb.authStore.isValid) {
        router.push('/solicitar');
        return;
      }

      const currentUser = pb.authStore.model;
      setUser(currentUser);

      // Verificar rol (vendedor o admin pueden acceder como cobrador)
      if (currentUser?.role !== 'vendedor' && currentUser?.role !== 'admin') {
        console.log('Acceso denegado: no es vendedor ni admin');
        router.push('/');
        return;
      }

      // Si es admin, autenticar en PocketBase para permisos totales
      if (currentUser?.role === 'admin') {
        try {
          await pb.admins.authWithPassword(
            process.env.NEXT_PUBLIC_PB_ADMIN_EMAIL || 'admin@marketdesliz.com',
            process.env.NEXT_PUBLIC_PB_ADMIN_PASSWORD || ''
          );
        } catch (e) {
          console.warn('No se pudo autenticar como admin:', e.message);
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Error verificando autorización:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/');
  };

  const menuItems = [
    { name: "Ruta de hoy", href: "/cobrador/ruta", icon: "🗺️" },
    { name: "Escáner QR", href: "/cobrador/scan", icon: "📷" },
    { name: "Pagos pendientes", href: "/cobrador/pagos", icon: "💰" },
    { name: "Historial", href: "/cobrador/historial", icon: "📜" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-700 to-blue-800 text-white shadow-lg flex flex-col flex-shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">Cobrador</h2>
          <p className="text-sm text-blue-200">MarketDesliz</p>
          {user && (
            <div className="mt-3 pt-3 border-t border-blue-600">
              <p className="text-xs text-blue-200 truncate">
                {user.nombre || user.email}
              </p>
              <p className="text-[10px] text-blue-300 mt-0.5 capitalize">
                {user.role === 'admin' ? '👑 Administrador' : '🛒 Vendedor'}
              </p>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1 px-4 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-blue-100 hover:bg-blue-600 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
              {router.pathname === item.href && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-200 hover:bg-red-500/20 hover:text-white transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}