// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Bell as BellIcon, X, User, ChevronDown, Search } from 'lucide-react';
import Logo from './Logo';
import LoginDropdown from './LoginDropdown';
import { useAuth } from '../contexts/AuthContext';
import { T } from '../lib/tokens';

// ─────────────────────────────────────────────────────────────────────────
// HeaderLink · link de texto con touch
// ─────────────────────────────────────────────────────────────────────────
function HeaderLink({ href, label, onClick }) {
  const [hover, setHover] = useState(false);

  const style = {
    color: hover ? T.ink : T.inkSoft,
    fontSize: '12.5px',
    fontWeight: 450,
    letterSpacing: '-0.005em',
    transition: `color 0.2s ${T.ease}`,
    WebkitTapHighlightColor: 'transparent',
    padding: '6px 2px',
  };

  const handlers = {
    onTouchStart: () => setHover(true),
    onTouchEnd: () => setTimeout(() => setHover(false), 120),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  if (href) return <Link href={href} style={style} {...handlers}>{label}</Link>;
  return <button onClick={onClick} style={style} {...handlers}>{label}</button>;
}

// ─────────────────────────────────────────────────────────────────────────
// Header · compartido entre todas las páginas
// ─────────────────────────────────────────────────────────────────────────
export default function Header({
  // Datos
  notifications = [],
  unreadCount = 0,
  navLinks = null, // si no se pasa, usa los del home

  // Buscador (opt-in)
  showSearch = false,
  searchPlaceholder = 'Buscar productos, categorías...',
  onSearch = null, // si no se pasa, redirige a /buscar?q=...

  // Compatibilidad con HeaderSimple · no se usan pero los aceptamos
  showNotifications: _externalShowNotifications,
  setShowNotifications: _externalSetShowNotifications,
  navigateTo: _externalNavigateTo,
  showLoginDropdown: _unused1,
  setShowLoginDropdown: _unused2,
  onLoginSuccess = null,
}) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { user, showLogin, openLogin, closeLogin } = useAuth();

  const goTo = (path) => router.push(path);

  const links = navLinks || [
    { href: '/como-funciona', label: 'Cómo funciona' },
    { href: '/acerca-de-nosotros', label: 'Nosotros' },
    { href: '/vender-con-marketdesliz/pasos/01', label: 'Trabaja con nosotros' },
    { href: '/eshe-parallel', label: 'Éshé Parallel' },
  ];

  // Escucha evento global para abrir login desde cualquier lado
  useEffect(() => {
    const handleOpenLogin = () => openLogin();
    if (typeof window !== 'undefined') {
      window.addEventListener('open-login-dropdown', handleOpenLogin);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-login-dropdown', handleOpenLogin);
      }
    };
  }, [openLogin]);

  const handleLoginSuccess = () => {
    closeLogin();
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (!q) return;
      if (onSearch) {
        onSearch(q);
      } else {
        goTo(`/buscar?q=${encodeURIComponent(q)}`);
      }
    }
  };

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'rgba(250, 250, 249, 0.85)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: `1px solid ${T.line}`,
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-14 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <button
          onClick={() => goTo('/')}
          className="shrink-0"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Logo />
        </button>

        {/* Buscador · si showSearch está activo */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{
                background: 'rgba(15, 15, 15, 0.03)',
                border: `1px solid ${T.line}`,
                borderRadius: '6px',
              }}
            >
              <Search size={14} strokeWidth={1.75} style={{ color: T.inkFaint }} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearch}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-[13px] tracking-[-0.005em]"
                style={{
                  color: T.ink,
                  fontWeight: 450,
                }}
              />
            </div>
          </div>
        )}

        {/* Nav desktop · solo si no hay buscador activo */}
        {!showSearch && (
          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <HeaderLink key={l.href} href={l.href} label={l.label} />
            ))}
          </nav>
        )}

        {/* Acciones derecha */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Notificaciones */}
          <div className="relative">
            <button
              className="relative flex items-center p-2"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificaciones"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <BellIcon size={16} strokeWidth={1.75} style={{ color: T.inkSoft }} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: T.accent }}
                />
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-[300px] md:w-[340px] overflow-hidden z-50"
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.line}`,
                    borderRadius: '10px',
                    boxShadow:
                      '0 1px 2px rgba(15,15,15,0.04), 0 12px 40px rgba(15,15,15,0.10)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: `1px solid ${T.line}` }}
                  >
                    <span
                      className="text-[10px] uppercase tracking-[0.22em]"
                      style={{ color: T.inkFaint, fontWeight: 500 }}
                    >
                      Notificaciones
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      style={{ color: T.inkFaint }}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-[12px]" style={{ color: T.inkFaint }}>
                          Sin notificaciones nuevas
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif, i) => (
                        <button
                          key={notif.id}
                          onClick={() => {
                            setShowNotifications(false);
                            goTo('/notificaciones');
                          }}
                          className="w-full text-left px-4 py-3.5 transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]"
                          style={{
                            borderTop: i > 0 ? `1px solid ${T.line}` : 'none',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className="w-1 h-1 rounded-full mt-2 shrink-0"
                              style={{
                                background: !notif.read ? T.accent : T.inkGhost,
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-[13px] tracking-[-0.005em] leading-snug"
                                style={{
                                  color: T.ink,
                                  fontWeight: !notif.read ? 500 : 450,
                                }}
                              >
                                {notif.title}
                              </p>
                              <p
                                className="text-[11.5px] mt-1 leading-relaxed"
                                style={{ color: T.inkSoft }}
                              >
                                {notif.description}
                              </p>
                              <p
                                className="text-[10px] uppercase tracking-[0.18em] mt-2"
                                style={{ color: T.inkFaint }}
                              >
                                {notif.time}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      goTo('/notificaciones');
                    }}
                    className="w-full text-center text-[10px] uppercase tracking-[0.22em] py-3"
                    style={{
                      color: T.accent,
                      fontWeight: 500,
                      borderTop: `1px solid ${T.line}`,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Ver todas
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Cuenta */}
          <div className="relative">
            <button
              className="flex items-center gap-2"
              onClick={openLogin}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <User size={15} strokeWidth={1.75} style={{ color: T.inkSoft }} />
              <span
                className="text-[12.5px] tracking-[-0.005em] hidden sm:inline"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {user ? (user.nombre?.split(' ')[0] || 'Mi cuenta') : 'Mi cuenta'}
              </span>
              <ChevronDown size={12} strokeWidth={1.75} style={{ color: T.inkFaint }} />
            </button>
            {showLogin && (
              <LoginDropdown
                onClose={closeLogin}
                onSuccess={handleLoginSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}