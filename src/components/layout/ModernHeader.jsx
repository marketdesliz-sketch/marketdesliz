// src/components/layout/ModernHeader.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Search, ShoppingCart, User, ChevronDown, Menu, X,
  LayoutDashboard, ClipboardList, History, QrCode,
  Package, Users, ShoppingBag, CreditCard, Heart,
  LogOut, Rocket, Settings, Crown, Bell, Zap
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import LoginDropdown from '../LoginDropdown';
import { getMenuItems, generarSlug } from '../../config/categorias';

export default function ModernHeader({ subtitle, showAuth = true }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userBalance, setUserBalance] = useState('$0.00');
  const [userLevel, setUserLevel] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');
  const [notificationsCount, setNotificationsCount] = useState(0);
  const timeoutRef = useRef(null);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  // ============================================================
  // 1. MENÚ ESTÁTICO (optimizado con useMemo)
  // ============================================================
  const navigationItems = useMemo(() => getMenuItems(), []);

  // ============================================================
  // 2. SCROLL Y CIERRE DE MENÚES AL HACER CLICK FUERA
  // ============================================================
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cerrar menú de usuario
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      // Cerrar menú de navegación (mega menús)
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setActiveCategory('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // 3. AUTENTICACIÓN Y DATOS DEL USUARIO
  // ============================================================
  useEffect(() => {
    const checkAuth = async () => {
      // ✅ Limpiar sesión de admin
      if (pb.authStore.isValid && pb.authStore.role === 'admin') {
        console.warn('🚨 Sesión de admin en ModernHeader. Limpiando...');
        pb.authStore.clearAll();
        setIsAuthenticated(false);
        setUser(null);
        setUserBalance('$0');
        setUserLevel(0);
        return;
      }

      const isAuth = pb.authStore.isValid;
      setIsAuthenticated(isAuth);
      if (isAuth) {
        const currentUser = pb.authStore.model;
        setUser(currentUser);
        try {
          // Obtener datos del cliente
          const clientRecord = await pb.collection('clients').getFirstListItem(`userId = "${currentUser.id}"`);
          const deuda = clientRecord.deudaActual || 0;
          setUserBalance(`Deuda: $${deuda.toLocaleString()}`);
          setUserLevel(clientRecord.nivel || 0);

          // Obtener notificaciones no leídas (ejemplo)
          const notificaciones = await pb.collection('notificaciones').getList(1, 1, {
            filter: `usuarioId = "${currentUser.id}" && leida = false`
          });
          setNotificationsCount(notificaciones.totalItems);
        } catch (error) {
          console.debug('Error al cargar datos del cliente:', error);
          setUserBalance('$0');
          setUserLevel(0);
        }
      } else {
        setUser(null);
        setUserBalance('$0');
        setUserLevel(0);
        setNotificationsCount(0);
      }
    };
    checkAuth();
    const unsubscribe = pb.authStore.onChange(() => checkAuth());
    return () => unsubscribe();
  }, []);

  // ============================================================
  // 4. CARRITO
  // ============================================================
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

  // ============================================================
  // 5. FUNCIONES DE UTILIDAD
  // ============================================================
  const handleLogout = () => {
    pb.authStore.clearAll();
    router.push('/');
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => setShowLoginDropdown(true);
  const handleLogoutClick = (e) => { e.preventDefault(); handleLogout(); };

  // Búsqueda funcional (Enter)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const generateHref = (mainCategory, subCategory, item) => {
    if (mainCategory === "Negocios") {
      const slug = generarSlug(item);
      return `/negocios?categoria=${encodeURIComponent(slug)}`;
    }

    const categoryItem = navigationItems.find(cat => cat.nombre === mainCategory);
    if (!categoryItem || !categoryItem.sections) return "#";

    for (const section of categoryItem.sections) {
      for (const cat of section.categories) {
        if (cat.name === subCategory && cat.items.includes(item)) {
          const itemSlug = generarSlug(item);
          return `/${cat.baseSlug}/${itemSlug}`;
        }
      }
    }
    return "#";
  };

  const handleMouseEnter = (index) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(index);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setActiveCategory('');
    }, 300);
  };

  const handleItemHover = (categoryName, itemName) => setActiveCategory(`${categoryName}-${itemName}`);

  // ============================================================
  // 6. MENÚ DE USUARIO SEGÚN ROL
  // ============================================================
  const menuVendedor = [
    { icon: LayoutDashboard, label: "Panel de Vendedor", href: "/vendedor" },
    { icon: ClipboardList, label: "Solicitudes pendientes", href: "/vendedor/solicitudes" },
    { icon: History, label: "Historial", href: "/vendedor/historial" },
    { icon: User, label: "Mi perfil", href: "/vendedor/perfil" },
    { icon: QrCode, label: "Mi código QR", href: "/vendedor/qr" },
  ];
  const menuAdmin = [
    { icon: Crown, label: "Panel de Admin", href: "/admin/dashboard" },
    { icon: Users, label: "Clientes", href: "/admin/clientes" },
    { icon: User, label: "Vendedores", href: "/admin/vendedores" },
    { icon: Package, label: "Productos", href: "/admin/productos" },
    { icon: ShoppingBag, label: "Órdenes", href: "/admin/ordenes" },
  ];
  const menuCliente = [
    { icon: User, label: "Mi perfil", href: "/perfil" },
    { icon: Package, label: "Mis órdenes", href: "/perfil/ordenes" },
    { icon: CreditCard, label: "Mis pagos", href: "/perfil/pagos" },
    { icon: ShoppingBag, label: "Mi tarjeta virtual", href: "/perfil/tarjeta" },
    { icon: Heart, label: "Favoritos", href: "/perfil/favoritos" },
  ];

  const getMenuItemsByRole = () => {
    if (!user) return menuCliente;
    if (user.role === 'vendedor') return menuVendedor;
    if (user.role === 'admin') return menuAdmin;
    return menuCliente;
  };

  // ============================================================
  // 7. RENDERIZADO PRINCIPAL
  // ============================================================
  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md border-b border-gray-100' : 'bg-white border-b border-gray-100'
        }`}
    >
      {/* ── BARRA ANUNCIO ───────────────────────────────────── */}
      <div className="bg-[#6C3BFF] text-white py-1.5 px-4">
        <p className="text-center text-xs font-medium tracking-wide">
          <span className="font-bold">MARKETDESLIZ</span>
          <span className="mx-2 opacity-50">·</span>
          <span className="opacity-90">"Compra Fácil, Compra Desliz"</span>
        </p>
      </div>

      {/* ── HEADER PRINCIPAL ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-[#6C3BFF] rounded-lg flex items-center justify-center">
              <Rocket size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight hidden sm:block">
              <span className="text-gray-900">MARKET</span>
              <span className="text-[#6C3BFF]">DESLIZ</span>
            </span>
          </Link>

          {/* Búsqueda con funcionalidad Enter */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos, servicios..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] focus:bg-white transition-all placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                aria-label="Buscar"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            {/* Notificaciones */}
            {isAuthenticated && (
              <Link href="/notificaciones" className="relative p-1 text-gray-500 hover:text-[#6C3BFF] transition-colors">
                <Bell size={22} />
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </span>
                )}
              </Link>
            )}

            {/* Carrito */}
            <Link href="/carrito" className="relative p-1 text-gray-500 hover:text-[#6C3BFF] transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#6C3BFF] text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Usuario autenticado */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#6C3BFF] transition-colors"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  aria-controls="user-menu"
                >
                  <div className="w-8 h-8 rounded-full bg-[#6C3BFF]/10 flex items-center justify-center">
                    <User size={16} className="text-[#6C3BFF]" />
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="font-semibold text-gray-800 text-sm">
                      {user.nombre?.split(' ')[0] || user.email?.split('@')[0] || 'Mi Cuenta'}
                    </p>
                    <p className="text-[#10b981] text-xs font-medium">{userBalance}</p>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div
                    id="user-menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50"
                  >
                    {/* Información extra del usuario */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">
                        Nivel: <span className="font-medium text-gray-700">{userLevel}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Saldo disponible: <span className="font-medium text-green-600">$0.00</span>
                      </p>
                    </div>

                    {getMenuItemsByRole().map(({ icon: Icon, label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#6C3BFF] transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon size={15} className="shrink-0" />
                        {label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} className="shrink-0" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Usuario no autenticado */
              <div className="relative">
  <button
    onClick={handleLoginClick}
    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#6C3BFF] transition-colors"
    aria-label="Iniciar sesión"
  >
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <User size={16} className="text-gray-500" />
    </div>
    <div className="hidden sm:block text-left leading-tight">
      <p className="font-semibold text-sm">Iniciar sesión</p>
      <p className="text-[#10b981] text-xs font-medium">$0.00</p>
    </div>
  </button>
  {showLoginDropdown && (
    <LoginDropdown
      onClose={() => setShowLoginDropdown(false)}
      onSuccess={() => {
        // El estado de autenticación se actualizará automáticamente
        // en el useEffect de autenticación.
        setShowLoginDropdown(false);
      }}
    />
  )}
</div>
            )}

            {/* Hamburguesa mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-[#6C3BFF] transition-colors"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── NAVEGACIÓN ──────────────────────────────────────── */}
        <nav
          ref={menuRef}
          className="hidden lg:flex items-center gap-1 border-t border-gray-100 h-10"
          role="navigation"
          aria-label="Menú principal"
        >
          {navigationItems.map((item, index) => (
            <div
              key={item.name || item.slug}
              className="relative h-full flex items-center"
              onMouseEnter={() => !item.simple && handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              {item.simple ? (
                <Link
                  href={item.href || '/'}
                  className={`px-3 h-full flex items-center text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${router.pathname === item.href
                      ? 'text-[#6C3BFF] border-[#6C3BFF]'
                      : 'text-gray-600 hover:text-[#6C3BFF] border-transparent'
                    }`}
                  aria-current={router.pathname === item.href ? 'page' : undefined}
                >
                  {item.nombre}
                </Link>
              ) : item.megaMenu && item.sections ? (
                <>
                  <button
                    className={`px-3 h-full flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${activeDropdown === index
                        ? 'text-[#6C3BFF] border-[#6C3BFF]'
                        : 'text-gray-600 hover:text-[#6C3BFF] border-transparent'
                      }`}
                    aria-expanded={activeDropdown === index}
                    aria-haspopup="true"
                  >
                    {item.nombre}
                    <ChevronDown size={13} className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === index && (
                    <div
                      className="absolute top-full left-0 w-[900px] bg-white border border-gray-100 rounded-xl shadow-2xl mt-0 py-6 z-50"
                      onMouseEnter={() => handleMouseEnter(index)}
                      onMouseLeave={handleMouseLeave}
                      role="menu"
                    >
                      <div className="px-6 grid grid-cols-4 gap-6">
                        {item.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="space-y-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {section.title}
                            </p>
                            {section.categories.map((category, categoryIndex) => (
                              <div key={categoryIndex} className="space-y-1.5">
                                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                                  {category.name}
                                </p>
                                <ul className="space-y-1">
                                  {category.items.map((subItem, itemIndex) => {
                                    const itemKey = `${category.name}-${subItem}`;
                                    const itemHref = generateHref(item.nombre, category.name, subItem);
                                    return (
                                      <li key={itemIndex}>
                                        <Link
                                          href={itemHref}
                                          className={`block py-0.5 text-sm transition-colors ${activeCategory === itemKey
                                              ? 'text-[#6C3BFF] font-medium'
                                              : 'text-gray-500 hover:text-[#6C3BFF]'
                                            }`}
                                          onMouseEnter={() => handleItemHover(category.name, subItem)}
                                          onMouseLeave={() => setActiveCategory('')}
                                          onClick={() => { setActiveDropdown(null); setActiveCategory(''); }}
                                          role="menuitem"
                                        >
                                          {subItem}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="mx-6 mt-5 pt-4 border-t border-gray-100">
                        <Link
                          href={item.href || '#'}
                          className="text-xs text-[#6C3BFF] font-medium hover:underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Ver todo en {item.nombre} →
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Submenú simple (Ver Más) */
                item.submenu && (
                  <>
                    <button
                      className="px-3 h-full flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-[#6C3BFF] transition-colors whitespace-nowrap border-b-2 border-transparent"
                      onMouseEnter={() => handleMouseEnter(index)}
                      aria-expanded={activeDropdown === index}
                      aria-haspopup="true"
                    >
                      {item.nombre}
                      <ChevronDown size={13} className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`} />
                    </button>

                    {activeDropdown === index && (
                      <div
                        className="absolute top-full right-0 mt-0 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-[999]"
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                        role="menu"
                      >
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subItem.href}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#6C3BFF] transition-colors"
                            onClick={() => setActiveDropdown(null)}
                            role="menuitem"
                          >
                            {subItem.nombre || subItem.name || subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* ── MENÚ MOBILE ─────────────────────────────────────── */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-0.5">
            {navigationItems.map((item) => (
              <div key={item.name || item.slug}>
                {item.simple ? (
                  <Link
                    href={item.href || '/'}
                    className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#6C3BFF] rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.nombre}
                  </Link>
                ) : (
                  <div className="py-2.5 px-3 text-sm font-medium text-gray-400">
                    {item.nombre}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-2 border-t border-gray-100 mt-2 space-y-0.5">
              {isAuthenticated && user ? (
                <>
                  {getMenuItemsByRole().map(({ icon: Icon, label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#6C3BFF] rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center gap-2.5 w-full py-2.5 px-3 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { handleLoginClick(); setIsMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full py-2.5 px-3 text-sm font-medium text-[#6C3BFF] hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <User size={15} />
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}