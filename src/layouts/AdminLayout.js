// src/layouts/AdminLayout.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import pb from '../lib/pocketbase';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      if (!pb.authStore.isValid) {
        console.log('No hay sesión activa');
        router.push('/admin/login');
        return;
      }

      const user = pb.authStore.model;
      console.log('Usuario autenticado:', user?.email, 'Rol:', user?.role);

      if (!user || user.role !== 'admin') {
        console.log('No es administrador');
        pb.authStore.clear();
        router.push('/admin/login');
        return;
      }

      setAdminUser(user);

      // Autenticar como admin de PocketBase para tener permisos totales
      try {
        const adminEmail = process.env.NEXT_PUBLIC_PB_ADMIN_EMAIL || 'admin@marketdesliz.com';
        const adminPassword = process.env.NEXT_PUBLIC_PB_ADMIN_PASSWORD || '';
        
        if (adminPassword) {
          await pb.admins.authWithPassword(adminEmail, adminPassword);
          console.log('✅ Autenticado como admin de PocketBase');
        }
      } catch (adminError) {
        console.warn('No se pudo autenticar como admin de PocketBase:', adminError.message);
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error en verificación:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { name: 'KYC Pendientes', icon: '🔐', path: '/admin/kyc' },
    { name: 'Tandas', icon: '🎯', path: '/admin/tandas' },
    { name: 'Clientes', icon: '👥', path: '/admin/clientes' },
    { name: 'Tarjetas', icon: '💳', path: '/admin/tarjetas' },
    { name: 'Productos', icon: '📦', path: '/admin/productos' },
    { name: 'Negocios Aliados', icon: '🏪', path: '/admin/negocios' },
    { name: 'Órdenes', icon: '🛒', path: '/admin/ordenes' },
    { name: 'Pagos', icon: '💰', path: '/admin/pagos' },
    { name: 'Vendedores', icon: '👔', path: '/admin/vendedores' },
    { name: 'Cobradores', icon: '🏍️', path: '/admin/cobradores' },
    { name: 'Reportes', icon: '📈', path: '/admin/reportes' },
    { name: 'Configuración', icon: '⚙️', path: '/admin/configuracion' },
  ];

  const isActive = (path) => router.pathname === path || router.pathname.startsWith(path + '/');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6C3BFF] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden mr-4 text-gray-500 hover:text-[#6C3BFF] transition"
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/admin/dashboard" className="text-2xl font-bold text-[#6C3BFF]">
                Admin <span className="text-gray-900">MarketDesliz</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                👑 {adminUser?.nombre || adminUser?.email || 'Admin'}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium transition"
              >
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-64 bg-white shadow-sm min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? 'bg-[#6C3BFF] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#F3F0FF] hover:text-[#6C3BFF]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
                {isActive(item.path) && (
                  <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Sidebar móvil */}
        {menuOpen && (
          <aside className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setMenuOpen(false)}
            ></div>
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl animate-slide-right">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-[#6C3BFF] text-lg">Menú Admin</h3>
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.path)
                        ? 'bg-[#6C3BFF] text-white'
                        : 'text-gray-700 hover:bg-[#F3F0FF]'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
            
            <style>{`
              @keyframes slide-right {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
              .animate-slide-right {
                animation: slide-right 0.3s ease-out;
              }
            `}</style>
          </aside>
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}