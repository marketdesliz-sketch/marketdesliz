// src/components/layout/ModernHeader.jsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Search, ShoppingCart, User, ChevronDown, Menu, X,
  LayoutDashboard, ClipboardList, History, QrCode,
  Package, Users, ShoppingBag, CreditCard, Heart,
  LogOut, Rocket, Settings, Crown
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import LoginModal from '../LoginModal';

export default function ModernHeader({ subtitle, showAuth = true }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userBalance, setUserBalance] = useState('$0.00');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = pb.authStore.isValid;
      setIsAuthenticated(isAuth);
      if (isAuth) {
        const currentUser = pb.authStore.model;
        setUser(currentUser);
        try {
          const clientRecord = await pb.collection('clients').getFirstListItem(`userId = "${currentUser.id}"`);
          const deuda = clientRecord.deudaActual || 0;
          setUserBalance(`Deuda: $${deuda.toLocaleString()}`);
        } catch (error) {
          setUserBalance('$0');
        }
      } else {
        setUser(null);
        setUserBalance('$0');
      }
    };
    checkAuth();
    const unsubscribe = pb.authStore.onChange(() => checkAuth());
    return () => unsubscribe();
  }, []);

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

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/');
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => window.dispatchEvent(new CustomEvent('openLoginModal'));
  const handleLogoutClick = (e) => { e.preventDefault(); handleLogout(); };

  const navigationItems = [
    { name: "Inicio", href: "/", simple: true },
    {
      name: "Productos", href: "/productos", megaMenu: true,
      sections: [
        {
          title: "ELECTRODOMÉSTICOS",
          categories: [
            { name: "LÍNEA BLANCA", items: ["Refrigeradores", "Lavadoras", "Secadoras", "Microondas", "Estufas", "Hornos"], baseSlug: "productos/categoria" },
            { name: "FERRETERÍA", items: ["Herramientas", "Iluminación", "Lonas", "Organización Y Almacenamiento", "Tornillería Y Fijaciones", "Seguridad Y Protección"], baseSlug: "productos/categoria" }
          ]
        },
        {
          title: "HOGAR",
          categories: [
            { name: "MASCOTAS", items: ["Casas De Plástico", "Higiene Y Cuidado", "Juguetes Y Accesorios", "Ropa"], baseSlug: "productos/categoria" },
            { name: "PATIO Y JARDÍN", items: ["Macetas", "Riego", "Sombrillas Y Paraguas"], baseSlug: "productos/categoria" },
            { name: "OFICINA Y PAPELERÍA", items: ["Material Escolar", "Suministros De Oficina", "Mobiliario"], baseSlug: "productos/categoria" }
          ]
        },
        {
          title: "CUIDADO PERSONAL",
          categories: [
            { name: "LIMPIEZA", items: ["Botes Y Cestos", "Cubetas", "Escobas, Trapeadores, Pinzas Y Más", "Insumos De Limpieza"], baseSlug: "productos/categoria" },
            { name: "BELLEZA Y CUIDADO PERSONAL", items: ["Cuidado De La Piel", "Maquillaje", "Cuidado Capilar", "Fragancias"], baseSlug: "productos/categoria" },
            { name: "BEBÉS Y NIÑOS", items: ["Cuidado Del Bebé", "Juguetes Infantiles", "Ropa Para Bebés"], baseSlug: "productos/categoria" }
          ]
        },
        {
          title: "COCINA",
          categories: [
            { name: "MUEBLES Y DECORACIÓN", items: ["Organización Para El Hogar", "Estantes", "Mesas Y Sillas"], baseSlug: "productos/categoria" },
            { name: "ELECTRODOMÉSTICOS DE COCINA", items: ["Exprimidores Y Extractores", "Freidoras", "Hornos Y Tostadores", "Licuadoras Y Batidoras", "Planchas", "Procesadores De Alimentos"], baseSlug: "productos/categoria" }
          ]
        }
      ]
    },
    {
      name: "Negocios", href: "/negocios", megaMenu: true,
      sections: [
        {
          title: "TIENDAS Y NEGOCIOS",
          categories: [
            { name: "ALIMENTACIÓN", items: ["Abarrotes", "Carnicería", "Dulcería", "Frutería / verdulería", "Panadería", "Tortillería", "Pescadería", "Pollería"], baseSlug: "negocios/categoria" },
            { name: "HOGAR Y CONSTRUCCIÓN", items: ["Ferretería", "Papelería", "Lavandería / tintorería", "Refaccionaria (auto partes)", "Taller mecánico", "Taller de costura"], baseSlug: "negocios/categoria" }
          ]
        },
        {
          title: "TIENDAS Y NEGOCIOS",
          categories: [
            { name: "SALUD Y BELLEZA", items: ["Farmacia", "Estética / salón de belleza", "Barbería / peluquería", "Consultorio médico", "Veterinaria"], baseSlug: "negocios/categoria" },
            { name: "MODA Y ACCESORIOS", items: ["Tienda de ropa", "Zapatería", "Joyería", "Boutique (ropa)", "Accesorios (bisutería, celulares, etc.)"], baseSlug: "negocios/categoria" },
            { name: "OTROS NEGOCIOS", items: ["Agencia de viajes", "Cafetería", "Restaurante", "Taquería", "Lonchería", "Antojitos / comida corrida", "Heladería / paletería", "Pastelería", "Florería", "Imprenta", "Ciber (internet)", "Cerrajería"], baseSlug: "negocios/categoria" }
          ]
        },
        {
          title: "SERVICIOS PROFESIONALES",
          categories: [
            { name: "REPARACIONES", items: ["Plomería", "Electricidad", "Carpintería", "Albañilería", "Pintura", "Jardinería"], baseSlug: "negocios/categoria" },
            { name: "TECNOLOGÍA", items: ["Reparación de PCs", "Reparación de Celulares", "Diseño Gráfico", "Programación", "Marketing Digital"], baseSlug: "negocios/categoria" }
          ]
        },
        {
          title: "SERVICIOS PROFESIONALES",
          categories: [
            { name: "EDUCACIÓN", items: ["Clases Particulares", "Tutorías", "Cursos Online", "Idiomas", "Música", "Artes"], baseSlug: "negocios/categoria" },
            { name: "MANTENIMIENTO DEL HOGAR", items: ["Limpieza Profesional", "Mudanzas", "Fumigaciones", "Jardinería", "Piscinas"], baseSlug: "negocios/categoria" }
          ]
        }
      ]
    },
    {
      name: "Uso Personal", href: "/uso-personal", megaMenu: true,
      sections: [
        { title: "ROPA", categories: [{ name: "MUJER", items: ["Vestidos", "Blusas", "Pantalones", "Faldas", "Ropa Interior"], baseSlug: "uso-personal/categoria" }, { name: "HOMBRE", items: ["Camisas", "Pantalones", "Trajes", "Ropa Deportiva"], baseSlug: "uso-personal/categoria" }] },
        { title: "CALZADO", categories: [{ name: "TIPOS", items: ["Tenis", "Zapatos Formales", "Botas", "Sandalias", "Pantunflas"], baseSlug: "uso-personal/categoria" }] },
        { title: "ACCESORIOS", categories: [{ name: "COMPLEMENTOS", items: ["Relojes", "Lentes", "Cinturones", "Carteras", "Joyas"], baseSlug: "uso-personal/categoria" }] },
        { title: "DEPORTES", categories: [{ name: "EQUIPAMIENTO", items: ["Ropa Deportiva", "Calzado Deportivo", "Accesorios Gym", "Suplementos"], baseSlug: "uso-personal/categoria" }] }
      ]
    },
    {
      name: "Ganado", href: "/ganado", megaMenu: true,
      sections: [
        { title: "ALIMENTACIÓN", categories: [{ name: "CONCENTRADOS", items: ["Para Bovinos", "Para Porcinos", "Para Aves", "Suplementos"], baseSlug: "ganado/categoria" }] },
        { title: "SALUD ANIMAL", categories: [{ name: "MEDICAMENTOS", items: ["Vacunas", "Antiparasitarios", "Vitaminas", "Equipo Veterinario"], baseSlug: "ganado/categoria" }] },
        { title: "EQUIPO", categories: [{ name: "HERRAMIENTAS", items: ["Bebederos", "Comederos", "Cercas", "Equipo de Ordeño"], baseSlug: "ganado/categoria" }] }
      ]
    },
    {
      name: "Instrumentos", href: "/instrumentos", megaMenu: true,
      sections: [
        { title: "MUSICALES", categories: [{ name: "CUERDAS", items: ["Guitarras", "Violines", "Bajos", "Ukeleles"], baseSlug: "instrumentos/categoria" }, { name: "PERCUSIÓN", items: ["Baterías", "Tambores", "Cajones"], baseSlug: "instrumentos/categoria" }] },
        { title: "VIENTO", categories: [{ name: "METALES", items: ["Trompetas", "Saxofones", "Clarinetes", "Flautas"], baseSlug: "instrumentos/categoria" }] },
        { title: "EQUIPO", categories: [{ name: "ACCESORIOS", items: ["Amplificadores", "Cables", "Fundas", "Afinadores"], baseSlug: "instrumentos/categoria" }] }
      ]
    },
    {
      name: "Tandas", href: "/tandas", megaMenu: true,
      sections: [
        { title: "TANDAS ACTIVAS", categories: [{ name: "POR MONTO", items: ["Tandas de $500", "Tandas de $1000", "Tandas de $2000", "Tandas Personalizadas"], baseSlug: "tandas/categoria" }] },
        { title: "REGLAS", categories: [{ name: "INFORMACIÓN", items: ["Cómo Funcionan", "Requisitos", "Beneficios", "Preguntas Frecuentes"], baseSlug: "tandas/categoria" }] },
        { title: "MIS TANDAS", categories: [{ name: "SEGUIMIENTO", items: ["Mis Inscripciones", "Historial", "Próximos Pagos", "Posiciones"], baseSlug: "tandas/categoria" }] }
      ]
    },
    { name: "Bolsa de Trabajo", href: "/bolsa-trabajo", simple: true },
    { name: "Catálogos", href: "/catalogos", simple: true },
    { name: "Temporada", href: "/temporada", simple: true },
    {
      name: "Ver Más", href: "#",
      submenu: [
        { name: "Blog", href: "/blog" },
        { name: "Contacto", href: "/contacto" },
        { name: "Ayuda", href: "/ayuda" }
      ]
    }
  ];

  const generateHref = (mainCategory, subCategory, item) => {
    const slug = item.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (mainCategory === "Negocios") return `/negocios?categoria=${encodeURIComponent(slug)}`;
    const categoryItem = navigationItems.find(cat => cat.name === mainCategory);
    if (!categoryItem || !categoryItem.sections) return "#";
    for (const section of categoryItem.sections) {
      for (const cat of section.categories) {
        if (cat.name === subCategory && cat.items.includes(item)) {
          return `/${cat.baseSlug}/${slug}`;
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

  // ── Menú de usuario según rol ──────────────────────────────
  const menuVendedor = [
    { icon: LayoutDashboard, label: "Panel de Vendedor", href: "/vendedor" },
    { icon: ClipboardList,   label: "Solicitudes pendientes", href: "/vendedor/solicitudes" },
    { icon: History,         label: "Historial", href: "/vendedor/historial" },
    { icon: User,            label: "Mi perfil", href: "/vendedor/perfil" },
    { icon: QrCode,          label: "Mi código QR", href: "/vendedor/qr" },
  ];
  const menuAdmin = [
    { icon: Crown,           label: "Panel de Admin", href: "/admin/dashboard" },
    { icon: Users,           label: "Clientes", href: "/admin/clientes" },
    { icon: User,            label: "Vendedores", href: "/admin/vendedores" },
    { icon: Package,         label: "Productos", href: "/admin/productos" },
    { icon: ShoppingBag,     label: "Órdenes", href: "/admin/ordenes" },
  ];
  const menuCliente = [
    { icon: User,            label: "Mi perfil", href: "/perfil" },
    { icon: Package,         label: "Mis órdenes", href: "/perfil/ordenes" },
    { icon: CreditCard,      label: "Mis pagos", href: "/perfil/pagos" },
    { icon: ShoppingBag,     label: "Mi tarjeta virtual", href: "/perfil/tarjeta" },
    { icon: Heart,           label: "Favoritos", href: "/perfil/favoritos" },
  ];

  const getMenuItems = () => {
    if (!user) return menuCliente;
    if (user.role === 'vendedor') return menuVendedor;
    if (user.role === 'admin') return menuAdmin;
    return menuCliente;
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md border-b border-gray-100' : 'bg-white border-b border-gray-100'
    }`}>

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

          {/* Búsqueda */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos, servicios..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] focus:bg-white transition-all placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-4 shrink-0 ml-auto">

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
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#6C3BFF] transition-colors"
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
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    {getMenuItems().map(({ icon: Icon, label, href }) => (
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
              <button
                onClick={handleLoginClick}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#6C3BFF] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={16} className="text-gray-500" />
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="font-semibold text-sm">Iniciar sesión</p>
                  <p className="text-[#10b981] text-xs font-medium">$0.00</p>
                </div>
              </button>
            )}

            {/* Hamburguesa mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-[#6C3BFF] transition-colors"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── NAVEGACIÓN ──────────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-1 border-t border-gray-100 h-10">
          {navigationItems.map((item, index) => (
            <div
              key={item.name}
              className="relative h-full flex items-center"
              onMouseEnter={() => !item.simple && handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              {item.simple ? (
                <Link
                  href={item.href}
                  className={`px-3 h-full flex items-center text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    router.pathname === item.href
                      ? 'text-[#6C3BFF] border-[#6C3BFF]'
                      : 'text-gray-600 hover:text-[#6C3BFF] border-transparent'
                  }`}
                >
                  {item.name}
                </Link>
              ) : item.megaMenu ? (
                <>
                  <button className={`px-3 h-full flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeDropdown === index
                      ? 'text-[#6C3BFF] border-[#6C3BFF]'
                      : 'text-gray-600 hover:text-[#6C3BFF] border-transparent'
                  }`}>
                    {item.name}
                    <ChevronDown size={13} className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === index && (
                    <div
                      className="absolute top-full left-0 w-[900px] bg-white border border-gray-100 rounded-xl shadow-2xl mt-0 py-6 z-50"
                      onMouseEnter={() => handleMouseEnter(index)}
                      onMouseLeave={handleMouseLeave}
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
                                    const itemHref = generateHref(item.name, category.name, subItem);
                                    return (
                                      <li key={itemIndex}>
                                        <Link
                                          href={itemHref}
                                          className={`block py-0.5 text-sm transition-colors ${
                                            activeCategory === itemKey
                                              ? 'text-[#6C3BFF] font-medium'
                                              : 'text-gray-500 hover:text-[#6C3BFF]'
                                          }`}
                                          onMouseEnter={() => handleItemHover(category.name, subItem)}
                                          onMouseLeave={() => setActiveCategory('')}
                                          onClick={() => { setActiveDropdown(null); setActiveCategory(''); }}
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
                          href={item.href}
                          className="text-xs text-[#6C3BFF] font-medium hover:underline"
                          onClick={() => setActiveDropdown(null)}
                        >
                          Ver todo en {item.name} →
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Submenú simple (Ver Más) */
                <>
                  <button
                    className="px-3 h-full flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-[#6C3BFF] transition-colors whitespace-nowrap border-b-2 border-transparent"
                    onMouseEnter={() => handleMouseEnter(index)}
                  >
                    {item.name}
                    <ChevronDown size={13} className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === index && (
                    <div
                      className="absolute top-full right-0 mt-0 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50"
                      onMouseEnter={() => handleMouseEnter(index)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#6C3BFF] transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
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
              <div key={item.name}>
                {item.simple ? (
                  <Link
                    href={item.href}
                    className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#6C3BFF] rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <div className="py-2.5 px-3 text-sm font-medium text-gray-400">
                    {item.name}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-2 border-t border-gray-100 mt-2 space-y-0.5">
              {isAuthenticated && user ? (
                <>
                  {getMenuItems().map(({ icon: Icon, label, href }) => (
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

      <LoginModal />
    </header>
  );
}
