// src/layouts/CollectorLayout.jsx
import { useEffect, useState } from 'react';
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  MapPin, QrCode, DollarSign, History, LogOut,
  ChevronRight, User, ShieldCheck
} from 'lucide-react';
import pb, { isAdmin, isVendedor, getCurrentUser } from '../lib/pocketbase';

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
      // ✅ Usar isAuthenticated() o verificar directamente
      if (!pb.authStore.isValid) {
        console.warn('🚨 No hay sesión activa, redirigiendo a login');
        router.push('/solicitar');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.warn('🚨 No se pudo obtener el usuario actual');
        pb.authStore.clearAll();
        router.push('/solicitar');
        return;
      }

      setUser(currentUser);

      // ✅ Verificar rol usando funciones centralizadas
      const esAdmin = isAdmin();
      const esVendedor = isVendedor();

      if (!esAdmin && !esVendedor) {
        console.warn(`🚨 Acceso denegado: rol ${currentUser.role} no permitido para cobrador`);
        router.push('/');
        return;
      }

      // ✅ Si es admin, NO autenticar como admin de PocketBase desde el cliente
      // (eso es inseguro y no necesario para el layout)
      // Simplemente dejamos que la sesión de admin funcione con sus permisos

      console.log(`✅ Acceso concedido: ${currentUser.role} (${currentUser.email})`);
      setIsAuthorized(true);
    } catch (error) {
      console.error('❌ Error verificando autorización:', error);
      pb.authStore.clearAll();
      router.push('/solicitar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clearAll();
    router.push('/');
  };

  const menuItems = [
    { name: "Ruta de hoy", href: "/cobrador/ruta", icon: MapPin },
    { name: "Escáner QR", href: "/cobrador/scan", icon: QrCode },
    { name: "Pagos pendientes", href: "/cobrador/pagos", icon: DollarSign },
    { name: "Historial", href: "/cobrador/historial", icon: History },
  ];

  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6C3BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#6C3BFF] to-[#5a2ee6] text-white shadow-lg flex flex-col flex-shrink-0 fixed h-full overflow-y-auto z-30">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <h2 className="text-xl font-bold">Cobrador</h2>
          </div>
          <p className="text-sm text-purple-200">MarketDesliz</p>
          
          {user && (
            <div className="mt-4 pt-4 border-t border-purple-500/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.nombre || user.email || 'Usuario'}
                  </p>
                  <p className="text-[10px] text-purple-200 truncate">
                    {user.role === 'admin' ? '👑 Administrador' : 
                     user.role === 'vendedor' ? '🛒 Vendedor' : 
                     user.role || 'Usuario'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1 px-4 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-white/20 text-white shadow-md"
                    : "text-purple-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} className={active ? "text-white" : "text-purple-200"} />
                <span className="font-medium text-sm">{item.name}</span>
                {active && (
                  <ChevronRight size={14} className="ml-auto text-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-purple-500/30 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-200 hover:bg-red-500/20 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Salir</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="ml-64 flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}