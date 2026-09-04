// src/layouts/AdminLayoutMinimal.jsx
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Target,
  Users,
  CreditCard,
  Package,
  Store,
  ShoppingBag,
  DollarSign,
  Briefcase,
  Bike,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  Crown,
  HelpCircle
} from 'lucide-react';
import pb from '../lib/pocketbase';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { name: 'KYC Pendientes', icon: ShieldCheck, path: '/admin/kyc' },
  { name: 'Tandas', icon: Target, path: '/admin/tandas' },
  { name: 'Clientes', icon: Users, path: '/admin/clientes' },
  { name: 'Tarjetas', icon: CreditCard, path: '/admin/tarjetas' },
  { name: 'Productos', icon: Package, path: '/admin/productos' },
  { name: 'Negocios Aliados', icon: Store, path: '/admin/negocios' },
  { name: 'Órdenes', icon: ShoppingBag, path: '/admin/ordenes' },
  { name: 'Pagos', icon: DollarSign, path: '/admin/pagos' },
  { name: 'Vendedores', icon: Briefcase, path: '/admin/vendedores' },
  { name: 'Cobradores', icon: Bike, path: '/admin/cobradores' },
  { name: 'Cobranza en campo', icon: QrCode, path: '/admin/collector' },
  { name: 'Reportes', icon: BarChart3, path: '/admin/reportes' },
  { name: 'Configuración', icon: Settings, path: '/admin/configuracion' },
];

export default function AdminLayoutMinimal({ children, showActions = true }) {
  const router = useRouter();
  const [user] = useState(() => pb.authStore.model);

  const navigateTo = (path) => {
    router.push(path);
  };

  const handleLogout = () => {
    pb.authStore.clearAll();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F7FC] flex flex-col">
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-logo font-bold text-3xl text-primary tracking-tight">
              ʃƪʃƪ
            </span>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Market<span className="text-primary">Desliz</span>
              </h1>
              <p className="text-[9px] text-gray-400 tracking-[0.2em] uppercase font-medium">
                Desliza • Descubre • Conecta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-gray-600 hidden sm:block">
                Hola, <span className="font-semibold">{user.nombre || 'Administrador'}</span>
              </div>
            )}
            <button
              onClick={() => navigateTo('/admin/normas')}
              className="p-2 text-gray-400 hover:text-[#6C3BFF] transition rounded-full hover:bg-[#6C3BFF]/5"
              title="Reglamento y normas"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── CONTENIDO ──────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}