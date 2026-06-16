import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  CreditCard, Calendar, QrCode, ShieldCheck,
  Headphones, Star, Heart, ChevronRight,
  Globe, Camera, MessageCircle,
  Phone, Mail, Clock, Send,
  Package, Smartphone, Home as HomeIcon, Shirt, Guitar
} from 'lucide-react';
import pb from '../lib/pocketbase';
import StoreLayout from '../layouts/StoreLayout';
import CategorySection from '../components/store/CategorySection';

// ─── Formateador de dinero ─────────────────────────────────────────────────
const formatMoney = (amount) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);

// ─── Por qué elegirnos ────────────────────────────────────────────────────
function WhyChooseUs() {
  const features = [
    { icon: ShieldCheck, title: "Vendedores Verificados", description: "Todos nuestros vendedores pasan por un proceso de verificación para garantizar que ofrecen productos reales." },
    { icon: CreditCard, title: "Flexibilidad de Pagos", description: "Opciones de pago adaptadas a tus necesidades, con pagos semanales que se ajustan a tu presupuesto." },
    { icon: Star, title: "Sistema de Tandas", description: "Únete a tandas digitales seguras, conoce a los otros miembros y construye tu historial de confianza." },
    { icon: QrCode, title: "Cobro con QR", description: "Nuestro cobrador escanea tu código QR. Todo digital, todo seguro, sin efectivo perdido." },
    { icon: Headphones, title: "Atención Personalizada", description: "Nuestro equipo de soporte te acompaña en cada paso de tu experiencia de compra." },
    { icon: ShieldCheck, title: "Confianza y Respaldo", description: "Plataforma con respaldo digital y reputación basada en tu historial de pagos." },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            ¿Por qué elegir <span className="text-[#6C3BFF]">MarketDesliz</span>?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Creamos un espacio confiable donde puedes comprar a crédito y participar en tandas
            con <span className="text-[#6C3BFF] font-medium">total tranquilidad y seguridad</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#6C3BFF]/30 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6C3BFF]/8 flex items-center justify-center mb-4 group-hover:bg-[#6C3BFF]/15 transition-colors">
                  <Icon size={20} className="text-[#6C3BFF]" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="bg-[#6C3BFF] py-16">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          ¿Listo para comenzar?
        </h2>
        <p className="text-white/75 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Únete a miles de usuarios que ya confían en MarketDesliz para sus compras a crédito y tandas.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/productos"
            className="bg-white text-[#6C3BFF] px-7 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
          >
            Ver Productos
          </Link>
          <Link
            href="/tandas"
            className="border border-white/40 text-white px-7 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
          >
            Explorar Tandas
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 className="text-white font-bold text-lg mb-3">
              <span className="text-white">Market</span>
              <span className="text-[#9A7BFF]">Desliz</span>
            </h2>
            <p className="text-sm leading-relaxed mb-5 text-gray-500">
              Tu plataforma de confianza para compras a crédito y tandas digitales con pagos semanales y respaldo QR.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#1877F2] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="text-gray-400 hover:text-white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#E4405F] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="text-gray-400 hover:text-white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#1DA1F2] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="text-gray-400 hover:text-white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#FF0000] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="text-gray-400 hover:text-white">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#25D366] flex items-center justify-center transition-colors">
                <MessageCircle size={15} className="text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>

          {/* Compañía */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Compañía</h3>
            <ul className="space-y-2.5">
              {[
                ["Sobre Nosotros", "/nosotros"],
                ["Trabaja con Nosotros", "/trabaja-con-nosotros"],
                ["Sala de Prensa", "/prensa"],
                ["Blog", "/blog"],
                ["Programa de Afiliados", "/afiliados"],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Ayuda</h3>
            <ul className="space-y-2.5">
              {[
                ["Preguntas Frecuentes", "/preguntas-frecuentes"],
                ["Cómo Comprar", "/como-comprar"],
                ["Métodos de Pago", "/metodos-de-pago"],
                ["Envíos y Entregas", "/envios"],
                ["Devoluciones", "/devoluciones"],
                ["Contacto", "/contacto"],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {[
                ["Términos y Condiciones", "/condiciones"],
                ["Aviso de Privacidad", "/privacidad"],
                ["Política de Cookies", "/cookies"],
                ["Contratos de Adhesión", "/contratos"],
                ["Protección de Datos", "/proteccion-datos"],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto + Newsletter */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Contáctanos</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={14} className="text-[#6C3BFF] shrink-0" />
                (+52) 282-141-4939
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <Mail size={14} className="text-[#6C3BFF] shrink-0" />
                marketdesliz@gmail.com
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} className="text-[#6C3BFF] shrink-0" />
                Lun–Vie: 9am – 6pm
              </li>
            </ul>

            <p className="text-white text-xs font-semibold mb-2">Newsletter</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Tu email"
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6C3BFF] transition-colors"
              />
              <button className="bg-[#6C3BFF] hover:bg-[#5b2ee6] px-3 py-2 rounded-lg transition-colors shrink-0">
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Market Desliz. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-5">
            {[["Mapa del Sitio", "/mapa-sitio"], ["Accesibilidad", "/accesibilidad"], ["Seguridad", "/seguridad"]].map(([label, href]) => (
              <a key={href} href={href} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [carrusel, setCarrusel] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [favorites, setFavorites] = useState([]);
  // Estados para secciones por categoría
  const [productosPorCategoria, setProductosPorCategoria] = useState({});
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  // Categorías a mostrar en secciones horizontales
  const categoriasSecciones = [
    { nombre: 'Electrónicos', icono: Smartphone, slug: 'electronica' },
    { nombre: 'Hogar', icono: HomeIcon, slug: 'hogar' },
    { nombre: 'Ropa', icono: Shirt, slug: 'ropa' },
    { nombre: 'Instrumentos', icono: Guitar, slug: 'instrumentos' },
    { nombre: 'Cortinas', icono: HomeIcon, slug: 'cortinas' },
    { nombre: 'Sábanas', icono: HomeIcon, slug: 'sabanas' },
    { nombre: 'Almohadas', icono: HomeIcon, slug: 'almohadas' },
    { nombre: 'Cubre Salas', icono: HomeIcon, slug: 'cubre-salas' },
    { nombre: 'Cocina', icono: HomeIcon, slug: 'cocina' },
    { nombre: 'Colchones', icono: HomeIcon, slug: 'colchones' },
    { nombre: 'Electrodomésticos', icono: Smartphone, slug: 'electrodomesticos' },
  ];

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (carrusel.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carrusel.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [carrusel.length]);

  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar productos activos
      const products = await pb.collection('products').getFullList({
        filter: 'activo = true',
        sort: '-created'
      });

      const productosData = products.map(p => {
        let imagenUrl = null;
        if (p.imagen && Array.isArray(p.imagen) && p.imagen.length > 0) {
          imagenUrl = pb.files.getURL(p, p.imagen[0]);
        } else if (p.imagen && typeof p.imagen === 'string') {
          imagenUrl = pb.files.getURL(p, p.imagen);
        }

        return {
          id: p.id,
          nombre: p.nombre || 'Producto sin nombre',
          descripcion: p.descripcion || 'Sin descripción',
          precio: p.precio || 0,
          enganche: p.enganche || 0,
          paga: p.pagoSemanal || 0,
          categoria: p.categoria || 'General',
          imagen: imagenUrl,
          semanas: p.semanas || 12,
          stock: p.stock || 0,
          nuevo: p.nuevo || false
        };
      });

      setProductos(productosData);

      // Productos destacados (nuevos o los primeros 8)
      const destacados = productosData.filter(p => p.nuevo === true).slice(0, 8);
      setProductosDestacados(destacados.length > 0 ? destacados : productosData.slice(0, 8));

      // Cargar productos por categoría
      await cargarProductosPorCategoria();

      // Cargar carrusel
      const carruselData = await pb.collection('carrusel').getFullList({
        filter: 'activo = true',
        sort: 'orden'
      });

      setCarrusel(carruselData.map(c => {
        let posicion = c.boton_posicion;
        if (typeof posicion === 'string') {
          try { posicion = JSON.parse(posicion); }
          catch (e) { posicion = null; }
        }
        return {
          id: c.id,
          imagen: c.imagen ? pb.files.getURL(c, c.imagen) : null,
          boton_enlace: c.boton_enlace || null,
          boton_posicion: posicion || null
        };
      }));

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos agrupados por categoría
  const cargarProductosPorCategoria = async () => {
    try {
      setCargandoCategorias(true);
      const productosPorCat = {};

      for (const cat of categoriasSecciones) {
        // ✅ IMPORTANTE: Eliminamos "&& stock > 0" para que los productos nuevos sin stock inicial también aparezcan
        const products = await pb.collection('products').getFullList({
          filter: `categoria = "${cat.slug}" && activo = true`,
          sort: '-created',
          limit: 5
        });

        const productosData = products.map(p => {
          let imagenUrl = null;
          if (p.imagen && Array.isArray(p.imagen) && p.imagen.length > 0) {
            imagenUrl = pb.files.getURL(p, p.imagen[0]);
          } else if (p.imagen && typeof p.imagen === 'string') {
            imagenUrl = pb.files.getURL(p, p.imagen);
          }

          return {
            id: p.id,
            nombre: p.nombre || 'Producto sin nombre',
            precio: p.precio || 0,
            enganche: p.enganche || 0,
            pagoSemanal: p.pagoSemanal || 0,
            imagen: imagenUrl,
            stock: p.stock || 0
          };
        });

        productosPorCat[cat.slug] = productosData;
      }

      setProductosPorCategoria(productosPorCat);
    } catch (error) {
      console.error('Error cargando productos por categoría:', error);
    } finally {
      setCargandoCategorias(false);
    }
  };

  return (
    <>
      <Head>
        <title>MarketDesliz — Compra a crédito con pagos semanales</title>
        <meta name="description" content="Compra productos a crédito con pagos semanales. Únete a tandas digitales seguras. Todo con respaldo QR." />
      </Head>

      <StoreLayout>
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── CARRUSEL ──────────────────────────────────────── */}
            <section className="relative w-full overflow-hidden bg-gray-100" style={{ height: '480px' }}>
              {carrusel.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                  {slide.imagen ? (
                    <>
                      <img
                        src={slide.imagen}
                        alt="Oferta"
                        className="w-full h-full object-cover"
                      />
                      {slide.boton_enlace && slide.boton_posicion && (
                        <Link
                          href={slide.boton_enlace}
                          style={{
                            position: 'absolute',
                            bottom: slide.boton_posicion.bottom,
                            left: slide.boton_posicion.left,
                            right: slide.boton_posicion.right,
                            top: slide.boton_posicion.top,
                            transform: slide.boton_posicion.transform,
                            width: slide.boton_posicion.width,
                            height: slide.boton_posicion.height,
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            zIndex: 20
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF]" />
                  )}
                </div>
              ))}

              {/* Indicadores */}
              {carrusel.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                  {carrusel.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                        }`}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ── PRODUCTOS DESTACADOS ──────────────────────────── */}
            <section className="py-12 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* Encabezado de sección */}
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Productos <span className="text-[#6C3BFF]">Destacados</span>
                    </h2>
                    <div className="w-10 h-0.5 bg-[#6C3BFF] mt-1.5 rounded-full" />
                  </div>
                  <Link
                    href="/productos"
                    className="flex items-center gap-1 text-sm text-[#6C3BFF] font-medium hover:gap-2 transition-all"
                  >
                    Ver todos <ChevronRight size={15} />
                  </Link>
                </div>

                {/* Grid de productos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productosDestacados.map((producto) => (
                    <div
                      key={producto.id}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      {/* Imagen */}
                      <div className="relative">
                        <Link href={`/productos/${producto.id}`}>
                          <div className="aspect-square bg-gray-50 overflow-hidden">
                            {producto.imagen ? (
                              <img
                                src={producto.imagen}
                                alt={producto.nombre}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={40} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Botón favorito */}
                        <button
                          onClick={() => toggleFavorite(producto.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Heart
                            size={15}
                            className={favorites.includes(producto.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                          />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        {/* Badge categoría */}
                        <span className="inline-block text-[10px] font-semibold text-[#6C3BFF] bg-[#6C3BFF]/8 px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                          {producto.categoria}
                        </span>

                        <Link href={`/productos/${producto.id}`}>
                          <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2 hover:text-[#6C3BFF] transition-colors">
                            {producto.nombre}
                          </h3>
                        </Link>

                        {/* Precios — diferenciador clave de MarketDesliz */}
                        <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Paga</span>
                            <span className="text-sm font-bold text-[#6C3BFF]">{formatMoney(producto.paga)}/sem</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Enganche</span>
                            <span className="text-sm font-semibold text-[#10b981]">{formatMoney(producto.enganche)}</span>
                          </div>
                        </div>


                        {/* CTA */}
                        <Link
                          href={`/productos/${producto.id}`}
                          className="mt-4 flex items-center justify-center gap-1.5 w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                        >
                          Ver producto <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── SECCIONES POR CATEGORÍA ─────────────────────── */}
            {!cargandoCategorias && categoriasSecciones.map((cat) => {
              const productosCat = productosPorCategoria[cat.slug] || [];
              if (productosCat.length === 0) return null;

              return (
                <CategorySection
                  key={cat.slug}
                  title={cat.nombre}
                  icon={cat.icono}
                  categoria={cat.slug}
                  productos={productosCat}
                  seeAllLink={`/productos/categoria/${cat.slug}`}
                />
              );
            })}

            {/* ── BENEFICIOS ────────────────────────────────────── */}
            <section className="py-12 bg-white border-y border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {[
                    { icon: CreditCard, title: "Crédito Fácil", desc: "Compra ahora y paga a tu ritmo. Sin requisitos complicados ni largas esperas." },
                    { icon: Calendar, title: "Pagos Semanales", desc: "Cuotas que se ajustan a tu economía. Paga en plazos cómodos y flexibles." },
                    { icon: QrCode, title: "Cobro con QR", desc: "Nuestro cobrador escanea tu código QR. Todo digital, todo seguro." },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex flex-col items-center text-center px-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#6C3BFF]/8 flex items-center justify-center mb-4">
                        <Icon size={26} className="text-[#6C3BFF]" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── BANNER TANDA ──────────────────────────────────── */}
            <section className="py-14 bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF]">
              <div className="max-w-2xl mx-auto px-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  ¿Listo para una tanda?
                </h2>
                <p className="text-white/75 text-sm mb-7 leading-relaxed">
                  Únete a una tanda digital, paga tu cuota de gasolina y recibe tu turno.
                  Todo transparente, todo seguro.
                </p>
                <Link
                  href="/tandas"
                  className="inline-block bg-white text-[#6C3BFF] px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Ver tandas activas
                </Link>
              </div>
            </section>

            {/* ── ¿POR QUÉ ELEGIRNOS? ───────────────────────────── */}
            <WhyChooseUs />

            {/* ── CÓMO FUNCIONA ─────────────────────────────────── */}
            <section className="py-14 bg-gray-50">
              <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Así de <span className="text-[#6C3BFF]">fácil</span> es
                  </h2>
                  <div className="w-10 h-0.5 bg-[#6C3BFF] mt-2 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {[
                    { n: "1", title: "Elige", desc: "Selecciona el producto que más te guste" },
                    { n: "2", title: "Solicita", desc: "Regístrate con tu teléfono y elige tu plan" },
                    { n: "3", title: "Recibe", desc: "Te contactamos para coordinar la entrega" },
                    { n: "4", title: "Paga", desc: "El cobrador escanea tu QR y listo" },
                  ].map(({ n, title, desc }) => (
                    <div key={n} className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-[#6C3BFF] flex items-center justify-center mb-4 shadow-md shadow-[#6C3BFF]/25">
                        <span className="text-white font-bold text-lg">{n}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── CTA FINAL ─────────────────────────────────────── */}
            <CTASection />

            {/* ── FOOTER ────────────────────────────────────────── */}
            <Footer />
          </>
        )}
      </StoreLayout>
    </>
  );
}