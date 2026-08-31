// src/components/HeaderSimple.jsx
import { Search, Bell, User, X } from 'lucide-react';
import LoginDropdown from './LoginDropdown'; // 👈 Importar el dropdown

export default function HeaderSimple({
  showNotifications,
  setShowNotifications,
  unreadCount,
  navigateTo,
  notifications,
  showLoginDropdown,
  setShowLoginDropdown,
  onLoginSuccess, // 👈 Para pasar a LoginDropdown
}) {
  return (
    <header className="bg-white border-b sticky top-0 z-50 px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex flex-col items-start min-w-[160px] cursor-pointer"
          onClick={() => navigateTo('/')}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-gray-800">Market</span>
              <span className="text-primary">Desliz</span>
            </span>
          </div>
          <span className="text-[9px] text-gray-400 tracking-[0.2em] font-medium ml-1">
            DESLIZA • DESCUBRE • CONECTA
          </span>
        </div>

        {/* Buscador */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="flex items-center bg-muted/50 border rounded-xl px-4 py-2.5 gap-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              placeholder="Buscar productos, categorías..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target;
                  if (target.value.trim()) {
                    navigateTo(`/buscar?q=${encodeURIComponent(target.value.trim())}`);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Notificaciones + Mi cuenta */}
        <div className="flex items-center gap-6">
          {/* Notificaciones */}
          <div className="relative">
            <div
              className="relative cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-white text-[9px] flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-bold text-gray-800">Notificaciones</h3>
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">No hay notificaciones</div>
                  )}
                </div>
                <div className="p-3 border-t">
                  <button className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80">
                    Ver todas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mi cuenta con dropdown integrado */}
          <div className="relative">
            <button
              onClick={() => setShowLoginDropdown(!showLoginDropdown)}
              className="flex items-center gap-2 text-gray-700 hover:text-[#5B2BE0] transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Mi cuenta</span>
            </button>
            {/* 👇 El dropdown se renderiza dentro del mismo div relativo */}
            {showLoginDropdown && (
              <LoginDropdown
                onClose={() => setShowLoginDropdown(false)}
                onSuccess={onLoginSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}