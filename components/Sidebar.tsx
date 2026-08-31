"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Inicio", href: "/dashboard", icon: "🏠" },
  { label: "Productos", href: "/productos", icon: "🏷" },
  { label: "Categorías", href: "/categorias", icon: "⊞" },
  { label: "Mis Compras", href: "/compras", icon: "🛍" },
  { label: "Pagos", href: "/pagos", icon: "💳" },
  { label: "Tandas", href: "/tandas", icon: "👥" },
  { label: "Mi Tarjeta", href: "/tarjeta", icon: "🪪" },
  { label: "Perfil", href: "/perfil", icon: "👤" },
  { label: "Ayuda", href: "/ayuda", icon: "❓" },
  { label: "Cerrar sesión", href: "/", icon: "🚪" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-w-[16rem] bg-white rounded-2xl m-3 mr-0 flex flex-col justify-between shadow-sm overflow-y-auto">
      <div>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-logo font-bold text-2xl text-primary">ʃƪʃƪ</span>
            <span className="font-bold text-gray-800 text-lg">
              Market<span className="text-primary">Desliz</span>
            </span>
          </div>
          <p className="text-[9px] text-gray-400 tracking-widest mt-1 ml-1">
            DESLIZA • DESCUBRE • CONECTA
          </p>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-primaryLight text-primary font-semibold"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-5 pb-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center mb-1">¿Necesitas ayuda?</p>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span>📞</span>
          <span className="font-bold text-primary text-base">55 1234 5678</span>
        </div>
        <p className="text-[10px] text-gray-400 text-center">Lun - Vie 9:00 – 6:00 PM</p>
      </div>
    </aside>
  );
}