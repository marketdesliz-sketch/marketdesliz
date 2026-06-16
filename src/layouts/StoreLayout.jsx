// src/layouts/StoreLayout.jsx
import { useEffect, useState } from 'react';
import ModernHeader from '../components/layout/ModernHeader';

export default function StoreLayout({ children, noPadding = false }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      window.__HYDRATED__ = true;
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <ModernHeader />
      <main className={!noPadding ? "pt-[120px]" : ""}>
        {mounted ? (
          children
        ) : (
          // Skeleton loader específico para MarketDesliz
          <div className="container mx-auto px-4 py-8 space-y-8">
            
            {/* Banner/Hero skeleton (si tienes en home) */}
            <div className="w-full h-[400px] bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />
            
            {/* Grid de productos/tandas skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de niveles/tarjeta cliente skeleton */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32" />
                  <div className="h-6 bg-gray-300 rounded w-48" />
                </div>
              </div>
            </div>

            {/* Grid secundario skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}