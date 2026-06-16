// src/layouts/MainLayout.jsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MainLayout({ children }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
      const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
      setCartCount(total);
    };
    
    updateCartCount();
    window.addEventListener('carritoActualizado', updateCartCount);
    return () => window.removeEventListener('carritoActualizado', updateCartCount);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?busqueda=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">  {/* ✅ container-market → max-w-7xl */}
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="text-3xl font-bold text-[#6C3BFF] hover:text-purple-700 transition">
              MarketDesliz
            </Link>
            
            {/* Búsqueda */}
            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full px-5 py-2 pr-10 border border-gray-200 rounded-full focus:outline-none focus:border-[#6C3BFF] focus:ring-1 focus:ring-[#6C3BFF]"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-[#6C3BFF]">
                  🔍
                </button>
              </div>
            </form>

            {/* Iconos de usuario y carrito */}
            <div className="flex items-center gap-6">
              <Link href="/perfil" className="text-gray-600 hover:text-[#6C3BFF] transition flex items-center gap-1">
                <span className="text-xl">👤</span>
                <span className="hidden sm:inline">Mi Cuenta</span>
              </Link>
              
              <Link href="/carrito" className="relative text-gray-600 hover:text-[#6C3BFF] transition flex items-center gap-1">
                <span className="text-xl">🛒</span>
                <span className="hidden sm:inline">Carrito</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">  {/* ✅ container-market → max-w-7xl */}
        {children}
      </main>
    </div>
  );
}