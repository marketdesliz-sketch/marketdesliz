// src/layouts/VendedorLayout.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard, ClipboardList, History,
  QrCode, User, LogOut, Menu, X, Rocket, ChevronRight,
  Smartphone, CreditCard, ShieldCheck, Home
} from 'lucide-react';
import pb, { isAdmin, isVendedor, getCurrentUser, logout } from '../lib/pocketbase';

export default function VendedorLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendedor, setVendedor] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        // ✅ Verificar sesión
        if (!pb.authStore.isValid) {
          router.replace('/vendedor/login');
          return;
        }

        // ✅ Verificar rol usando función centralizada
        const esVendedor = isVendedor();
        const esAdmin = isAdmin();

        if (!esVendedor && !esAdmin) {
          console.warn('🚨 Acceso denegado: no es vendedor ni admin');
          pb.authStore.clearAll();
          router.replace('/vendedor/login');
          return;
        }

        const u = getCurrentUser();
        if (!u) {
          pb.authStore.clearAll();
          router.replace('/vendedor/login');
          return;
        }

        setUser(u);

        // Si es admin, permitir acceso pero mostrar que es admin
        if (esAdmin) {
          setVendedor(null);
          setLoading(false);
          return;
        }

        // Obtener datos del vendedor
        try {
          const v = await pb.collection('vendedores').getFirstListItem(
            `userId = "${u.id}" && activo = true`
          );
          setVendedor(v);
        } catch (error) {
          console.warn('⚠️ Vendedor no encontrado o inactivo');
          // Podría redirigir a registro de vendedor
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Error cargando vendedor:', error);
        pb.authStore.clearAll();
        router.replace('/vendedor/login');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/vendedor/login');
  };

  const menuItems = [
    { href: '/vendedor', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/vendedor/solicitudes', icon: ClipboardList, label: 'Solicitudes' },
    { href: '/vendedor/historial', icon: History, label: 'Historial' },
    { href: '/vendedor/qr', icon: QrCode, label: 'Mi QR' },
    { href: '/vendedor/tarjeta', icon: Smartphone, label: 'Mi Tarjeta' },
    { href: '/vendedor/perfil', icon: User, label: 'Mi Perfil' },
  ];

  const isActive = (href) =>
    href === '/vendedor'
      ? router.pathname === '/vendedor'
      : router.pathname.startsWith(href);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-[#6C3BFF] hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/vendedor" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                <Rocket size={14} className="text-[#6C3BFF]" />
              </div>
              <span className="font-bold text-sm tracking-tight hidden sm:block">
                <span className="text-gray-900">MARKET</span>
                <span className="text-[#6C3BFF]">DESLIZ</span>
                <span className="text-gray-400 font-normal ml-1.5 text-xs">Vendedor</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <div className="w-5 h-5 bg-[#6C3BFF]/15 rounded-full flex items-center justify-center">
                  <User size={11} className="text-[#6C3BFF]" />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {user.nombre?.split(' ')[0] || 'Vendedor'}
                </span>
                {vendedor?.codigo && (
                  <span className="text-[10px] text-gray-400 font-mono">{vendedor.codigo}</span>
                )}
                {isAdmin() && (
                  <span className="text-[10px] font-bold text-[#6C3BFF] bg-[#6C3BFF]/10 px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className={`
          fixed lg:sticky top-14 left-0 h-[calc(100vh-56px)] w-56 bg-white border-r border-gray-100
          transform transition-transform duration-200 z-10 overflow-y-auto
          ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-3 space-y-0.5">
            {menuItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#6C3BFF] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={17} className={active ? 'text-white' : 'text-gray-400'} />
                  {label}
                  {active && <ChevronRight size={13} className="ml-auto text-white/60" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer del sidebar */}
          <div className="mx-3 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <Home size={14} className="text-gray-400" />
              <Link href="/" className="text-xs text-gray-500 hover:text-[#6C3BFF] transition">
                Ir a la tienda
              </Link>
            </div>
          </div>

          {/* Comisión info en sidebar (solo si es vendedor) */}
          {vendedor && (
            <div className="mx-3 mt-2 p-3 bg-[#6C3BFF]/5 border border-[#6C3BFF]/10 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Tu comisión</p>
              <p className="text-lg font-bold text-[#6C3BFF]">{vendedor.comisionPorcentaje}%</p>
              <p className="text-[10px] text-gray-400">del enganche del cliente</p>
            </div>
          )}

          {/* Admin indicator */}
          {isAdmin() && (
            <div className="mx-3 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs font-medium text-amber-700 flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Modo administrador
              </p>
            </div>
          )}
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[9] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Contenido ────────────────────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}