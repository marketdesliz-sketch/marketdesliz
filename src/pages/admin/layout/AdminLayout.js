// src/layouts/AdminLayout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  Target, 
  ShieldCheck, 
  Briefcase, 
  Bike, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Crown
} from 'lucide-react';
import pb from '../lib/pocketbase';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    verificarAcceso();
  }, []);

  const verificarAcceso = async () => {
    try {
      if (!pb.authStore.isValid) {
        router.replace('/admin/login');
        return;
      }

      const currentUser = pb.authStore.model;
      if (currentUser?.role !== 'admin') {
        console.log('❌ No es administrador');
        pb.authStore.clear();
        router.replace('/admin/login');
        return;
      }

      setAdminUser(currentUser);
      setIsAdmin(true);
    } catch (error) {
      console.error('Error verificando acceso:', error);
      router.replace('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/admin/login');
  };

  const isActive = (path) => {
    if (path === '/admin/dashboard') return router.pathname === '/admin/dashboard';
    return router.pathname.startsWith(path);
  };

  const menuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/clientes', icon: Users, label: 'Clientes' },
    { href: '/admin/vendedores', icon: Store, label: 'Vendedores' },
    { href: '/admin/productos', icon: Package, label: 'Productos' },
    { href: '/admin/ordenes', icon: ShoppingBag, label: 'Órdenes' },
    { href: '/admin/pagos', icon: DollarSign, label: 'Pagos' },
    { href: '/admin/tandas', icon: Target, label: 'Tandas' },
    { href: '/admin/kyc', icon: ShieldCheck, label: 'KYC' },
    { href: '/admin/negocios', icon: Store, label: 'Negocios' },
    { href: '/admin/bolsa-trabajo', icon: Briefcase, label: 'Bolsa de Trabajo' },
    { href: '/admin/cobradores', icon: Bike, label: 'Cobradores' },
    { href: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
    { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  ];

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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menú"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                <Crown size={18} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#6C3BFF]">
                  MarketDesliz <span className="text-gray-900">Admin</span>
                </h1>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-6 h-6 bg-[#6C3BFF]/10 rounded-full flex items-center justify-center">
                <Crown size={12} className="text-[#6C3BFF]" />
              </div>
              <span className="text-xs font-medium text-gray-700">
                {adminUser?.nombre || adminUser?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 transition-transform duration-200 ease-in-out
          w-64 bg-white border-r border-gray-200 shadow-lg z-20 h-screen overflow-y-auto
        `}>
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all
                    ${active
                      ? 'bg-[#6C3BFF] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-gray-400'} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Footer del sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Crown size={12} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400">MarketDesliz v1.0</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}