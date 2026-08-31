// src/pages/productos.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronRight, Home, Grid2X2, Heart, Package, Star,
  PlayCircle, ArrowRight, Sofa, CookingPot, Waves,
  Phone, Mail, MapPin
} from 'lucide-react';
import pb from '../lib/pocketbase';
import { formatMoney } from '../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import HeaderSimple from '../components/HeaderSimple';

export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar favoritos desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Cargar productos desde PocketBase
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        const products = await pb.collection('products').getFullList({
          filter: 'activo = true',
          sort: '-created'
        });

        const productosData = products.map((p) => {
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
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  // Guardar favoritos en localStorage
  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  // Navegación
  const navigateTo = (path) => {
    router.push(path);
  };

  // Notificaciones dummy
  const notifications = [
    { id: 1, title: '¡Nueva colección!', description: 'Descubre la línea Otoño 2026', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Filtrar productos por búsqueda
  const filteredProducts = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>Productos | MarketDesliz</title>
        <meta name="description" content="Explora nuestros productos a crédito con pagos semanales." />
      </Head>

      {/* HEADER SIMPLE (compartido) */}
      <HeaderSimple
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        unreadCount={unreadCount}
        navigateTo={navigateTo}
        notifications={notifications}
        showLoginDropdown={showLoginDropdown}
        setShowLoginDropdown={setShowLoginDropdown}
        onLoginSuccess={() => {
          // Opcional: actualizar estado de autenticación si lo necesitas
          const user = pb.authStore.model;
          // Si necesitas que se refresque algo, hazlo aquí
        }}
      />

      {/* ─── CONTENIDO PRINCIPAL ──────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto w-full px-2 py-6 flex-1">
        <main className="flex flex-col gap-6">
          {/* Hero Banner */}
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm relative min-h-[300px] flex items-center">
            <div className="absolute inset-0 z-0">
              <img
                className="w-full h-full object-cover"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_efe8d04031_5cc148b6b3b612c1.png"
                alt="hero"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
            </div>
            <div className="relative z-10 px-12 max-w-lg">
              <h1 className="text-4xl font-extrabold text-gray-900 leading-[1.1] mb-2">
                Todo lo que necesitas, <br />
                <span className="text-primary">a tu alcance.</span>
              </h1>
              <p className="text-muted-foreground mb-8 text-lg">Compra productos de calidad a crédito y al contado.</p>
              <div className="flex items-center gap-6">
                <Button className="rounded-2xl h-12 px-8 font-bold text-base bg-primary hover:bg-primary/90">
                  Ver productos <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary font-semibold transition-colors">
                  <PlayCircle className="w-6 h-6" /> Cómo funciona
                </button>
              </div>
            </div>
          </div>

          {/* Categorías populares (estáticas) */}
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-extrabold text-gray-800">Categorías populares</h2>
              <Button variant="link" className="text-primary font-bold p-0" onClick={() => navigateTo('/categorias')}>
                Ver todas
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Muebles', icon: Sofa },
                { name: 'Electrodomésticos', icon: Waves },
                { name: 'Línea Blanca', icon: Waves },
                { name: 'Cocina', icon: CookingPot },
                { name: 'Hogar', icon: Home },
                { name: 'Más categorías', icon: Grid2X2 },
              ].map((cat, i) => (
                <Card
                  key={i}
                  className="border-none shadow-sm rounded-2xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:bg-secondary/30 transition-colors group"
                  onClick={() => navigateTo(`/categoria/${cat.name.toLowerCase()}`)}
                >
                  <div className="bg-secondary p-3 rounded-2xl group-hover:bg-primary transition-colors">
                    <cat.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-bold text-gray-600 text-center">{cat.name}</span>
                </Card>
              ))}
            </div>
          </section>

          {/* ─── GRID DE PRODUCTOS (enganche al 25%) ──────── */}
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-extrabold text-gray-800">Productos destacados</h2>
              <Button variant="link" className="text-primary font-bold p-0" onClick={() => navigateTo('/explorar')}>
                Ver todos
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.slice(0, 8).map((producto) => (
                  <Card
                    key={producto.id}
                    className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                    onClick={() => navigateTo(`/productos/${producto.id}`)}
                  >
                    <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden">
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(producto.id);
                          }}
                          className="w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Heart
                            className={`w-4 h-4 ${favorites.includes(producto.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                          />
                        </button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{producto.nombre}</h3>
                      <p className="text-base font-black text-gray-900 mt-1">
                        {formatMoney(producto.paga)} / semana
                      </p>
                      {producto.precio > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          Enganche{' '}
                          <span className="font-semibold text-[#6C3BFF]">
                            {formatMoney(Math.round(producto.precio * 0.25))}
                          </span>
                          <span className="text-gray-400"> (25%)</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Banner de visita */}
          <Card className="border-none shadow-sm rounded-[2rem] p-6 flex items-center justify-between bg-white mt-2">
            <div className="flex items-center gap-5">
              <div className="bg-secondary rounded-[1.25rem] p-4">
                <Star className="w-6 h-6 text-primary fill-primary" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-800">¿Quieres que un vendedor te visite?</h3>
                <p className="text-sm text-muted-foreground mt-1">Solicita una visita a tu domicilio sin compromiso.</p>
              </div>
            </div>
            <Button className="rounded-2xl h-12 px-8 font-bold bg-primary hover:bg-primary/90" onClick={() => navigateTo('/solicitar-visita')}>
              Solicitar visita <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Card>

          {/* Footer */}
          <footer className="bg-white border-t mt-8">
            <div className="max-w-[1400px] mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      <span className="text-gray-800">Market</span>
                      <span className="text-primary">Desliz</span>
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 tracking-[0.2em] font-medium ml-1">DESLIZA • DESCUBRE • CONECTA</span>
                  <p className="text-sm text-muted-foreground mt-4">
                    Desliza, descubre y conecta con los mejores productos para tu hogar. Compra fácil y rápido.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Enlaces rápidos</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/')}>Inicio</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/productos')}>Productos</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/categorias')}>Categorías</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/como-funciona')}>Cómo funciona</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Soporte</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/ayuda')}>Centro de ayuda</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/preguntas-frecuentes')}>Preguntas frecuentes</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/terminos')}>Términos y condiciones</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/privacidad')}>Política de privacidad</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Contacto</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">55 1234 5678</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">contacto@marketdesliz.com</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">Ciudad de México, México</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 mt-8 pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MarketDesliz. Todos los derechos reservados.</p>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-muted-foreground">Desliza • Descubre • Conecta</span>
                    <Badge variant="outline" className="text-[10px] border-primary text-primary">v1.0.0</Badge>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}