// src/layouts/MainLayout.jsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, User, ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import pb, { isAdmin } from '../lib/pocketbase';

export default function MainLayout({ children }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // ============================================================
  // 1. VERIFICAR SESIÓN Y SEGURIDAD
  // ============================================================
  useEffect(() => {
    // Si hay sesión de admin en el layout de cliente → limpiar
    if (pb.authStore.isValid && pb.authStore.role === 'admin') {
      console.warn('🚨 Sesión de admin detectada en MainLayout. Limpiando...');
      pb.authStore.clearAll();
      if (router.pathname !== '/') {
        router.push('/');
      }
    }

    // Obtener usuario actual (si es cliente/vendedor)
    if (pb.authStore.isValid && pb.authStore.role !== 'admin') {
      setUser(pb.authStore.model);
    } else {
      setUser(null);
    }
  }, [router.pathname]);

  // ============================================================
  // 2. CARRITO
  // ============================================================
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
        const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
        setCartCount(total);
      } catch (e) {
        setCartCount(0);
      }
    };
    
    updateCartCount();
    window.addEventListener('carritoActualizado', updateCartCount);
    window.addEventListener('storage', (e) => {
      if (e.key === 'carrito') updateCartCount();
    });
    
    return () => {
      window.removeEventListener('carritoActualizado', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  // ============================================================
  // 3. BÚSQUEDA
  // ============================================================
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?busqueda=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // ============================================================
  // 4. CIERRE DE SESIÓN
  // ============================================================
  const handleLogout = () => {
    pb.authStore.clearAll();
    setUser(null);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                <span className="text-[#6C3BFF] font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-[#6C3BFF] hidden sm:block">
                MarketDesliz
              </span>
            </Link>

            {/* Búsqueda - desktop */}
            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl mx-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos, servicios..."
                  className="w-full px-5 py-2.5 pl-12 border border-gray-200 rounded-full focus:outline-none focus:border-[#6C3BFF] focus:ring-2 focus:ring-[#6C3BFF]/20 transition-all text-sm"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1 bg-[#6C3BFF] text-white text-sm rounded-full hover:bg-[#5b2ee6] transition">
                  Buscar
                </button>
              </div>
            </form>

            {/* Acciones */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Usuario / Login */}
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/perfil"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#6C3BFF] transition"
                  >
                    <User size={18} />
                    <span className="hidden sm:inline">{user.nombre?.split(' ')[0] || 'Cuenta'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-red-500 transition hidden sm:block"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/solicitar"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#6C3BFF] transition"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Link>
              )}

              {/* Carrito */}
              <Link href="/carrito" className="relative text-gray-600 hover:text-[#6C3BFF] transition">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-500 hover:text-gray-700 transition"
                aria-label="Menú"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Búsqueda - mobile */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-full focus:outline-none focus:border-[#6C3BFF] focus:ring-2 focus:ring-[#6C3BFF]/20 text-sm"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </form>
          </div>
        </div>
      </header>

      {/* ── CONTENIDO ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* ── FOOTER (opcional) ────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} MarketDesliz. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/terminos" className="hover:text-[#6C3BFF] transition">Términos</Link>
              <Link href="/privacidad" className="hover:text-[#6C3BFF] transition">Privacidad</Link>
              <Link href="/soporte" className="hover:text-[#6C3BFF] transition">Soporte</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}