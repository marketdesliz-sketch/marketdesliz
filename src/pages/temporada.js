// src/pages/temporada.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Sun, 
  Flower2, 
  Leaf, 
  Snowflake, 
  Tag, 
  Sparkles, 
  Star, 
  ShoppingBag,
  ChevronRight,
  Mail
} from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';

export default function TemporadaPage() {
  const router = useRouter();
  const { tipo } = router.query;
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [temporadaActual, setTemporadaActual] = useState('verano');

  const temporadas = [
    { id: 'primavera', nombre: 'Primavera', icono: Flower2, color: 'from-pink-500 to-rose-500', meses: [2, 3, 4] },
    { id: 'verano', nombre: 'Verano', icono: Sun, color: 'from-yellow-500 to-orange-500', meses: [5, 6, 7] },
    { id: 'otono', nombre: 'Otoño', icono: Leaf, color: 'from-orange-600 to-amber-600', meses: [8, 9, 10] },
    { id: 'invierno', nombre: 'Invierno', icono: Snowflake, color: 'from-blue-500 to-cyan-500', meses: [11, 0, 1] },
    { id: 'rebajas', nombre: 'Rebajas', icono: Tag, color: 'from-red-500 to-pink-500' },
    { id: 'nuevo', nombre: 'Nuevos Productos', icono: Sparkles, color: 'from-purple-500 to-indigo-500' },
    { id: 'mas-vendidos', nombre: 'Más Vendidos', icono: Star, color: 'from-yellow-500 to-orange-500' }
  ];

  const categorias = [
    'todos', 'Electrodomésticos', 'Electrónica', 'Ropa', 'Calzado', 
    'Hogar', 'Deportes', 'Juguetes', 'Belleza', 'Mascotas'
  ];

  useEffect(() => {
    determinarTemporada();
  }, [tipo]);

  useEffect(() => {
    cargarProductos();
  }, [temporadaActual, categoriaSeleccionada]);

  const determinarTemporada = () => {
    if (tipo && temporadas.find(t => t.id === tipo)) {
      setTemporadaActual(tipo);
      return;
    }
    
    const mesActual = new Date().getMonth();
    const temporadaClimatica = temporadas.find(t => t.meses && t.meses.includes(mesActual));
    if (temporadaClimatica) {
      setTemporadaActual(temporadaClimatica.id);
    }
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      
      let filter = 'activo = true';
      
      if (categoriaSeleccionada !== 'todos') {
        filter += ` && categoria = "${categoriaSeleccionada}"`;
      }
      
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      
      switch (temporadaActual) {
        case 'nuevo':
          filter += ` && created >= "${hace30Dias.toISOString()}"`;
          break;
        case 'mas-vendidos':
          break;
        case 'rebajas':
          break;
        default:
          break;
      }
      
      let productosData = await pb.collection('products').getFullList({
        filter: filter,
        sort: temporadaActual === 'nuevo' ? '-created' : '-created'
      });
      
      if (temporadaActual === 'mas-vendidos') {
        productosData = productosData.slice(0, 12);
      }
      
      setProductos(productosData);
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const getTemporadaInfo = () => {
    return temporadas.find(t => t.id === temporadaActual) || temporadas[1];
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getImageUrl = (producto) => {
    if (!producto.imagen) return null;
    try {
      return pb.files.getURL(producto, producto.imagen);
    } catch (e) {
      return null;
    }
  };

  const temporadaInfo = getTemporadaInfo();
  const TemporadaIcon = temporadaInfo.icono;

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{temporadaInfo.nombre} | MarketDesliz</title>
        <meta name="description" content={`Descubre las mejores ofertas de ${temporadaInfo.nombre} en MarketDesliz`} />
      </Head>

      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-40 pb-10">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Temporada {temporadaInfo.nombre}</h1>
            <p className="text-gray-500 mt-2 text-sm">
              {temporadaActual === 'nuevo' && 'Los productos más recientes de nuestro catálogo'}
              {temporadaActual === 'mas-vendidos' && 'Los favoritos de nuestros clientes'}
              {temporadaActual === 'rebajas' && 'Descuentos increíbles por tiempo limitado'}
              {!['nuevo', 'mas-vendidos', 'rebajas'].includes(temporadaActual) && 'Los mejores precios de la temporada'}
            </p>
          </div>

          {/* ── Selector de temporadas ─────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 overflow-x-auto shadow-sm">
            <div className="flex gap-2 min-w-max">
              {temporadas.map(temp => {
                const TempIcon = temp.icono;
                return (
                  <button
                    key={temp.id}
                    onClick={() => {
                      setTemporadaActual(temp.id);
                      router.push(`/temporada?tipo=${temp.id}`, undefined, { shallow: true });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      temporadaActual === temp.id
                        ? 'bg-[#6C3BFF] text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <TempIcon size={14} /> {temp.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Banner de temporada ─────────────────────────────── */}
          <div className={`bg-gradient-to-r ${temporadaInfo.color} rounded-2xl p-6 mb-8 text-white`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <TemporadaIcon size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{temporadaInfo.nombre}</h2>
                <p className="text-white/90 mt-0.5 text-sm">
                  {temporadaActual === 'nuevo' && 'Productos recién llegados'}
                  {temporadaActual === 'mas-vendidos' && 'Lo más popular ahora'}
                  {temporadaActual === 'rebajas' && 'Ofertas imperdibles'}
                  {!['nuevo', 'mas-vendidos', 'rebajas'].includes(temporadaActual) && `Colección ${temporadaInfo.nombre}`}
                </p>
              </div>
            </div>
          </div>

          {/* ── Filtros por categoría ────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    categoriaSeleccionada === cat
                      ? 'bg-[#6C3BFF] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat === 'todos' ? '📋 Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Resultados ──────────────────────────────────────── */}
          <div className="mb-4 text-sm text-gray-500">
            {productos.length} {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </div>

          {/* ── Lista de productos ───────────────────────────────── */}
          {productos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay productos en esta temporada</h3>
              <p className="text-sm text-gray-400">Pronto tendremos nuevas ofertas para ti</p>
              <Link href="/catalogos" className="inline-flex items-center gap-1 mt-4 text-[#6C3BFF] hover:underline text-sm">
                Ver todos los productos <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {productos.map((producto) => {
                const esNuevo = temporadaActual === 'nuevo';
                const esMasVendido = temporadaActual === 'mas-vendidos';
                
                return (
                  <div
                    key={producto.id}
                    onClick={() => router.push(`/productos/${producto.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative"
                  >
                    {/* Badge de temporada */}
                    {(esNuevo || esMasVendido) && (
                      <div className="absolute top-3 left-3 z-10">
                        {esNuevo && (
                          <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                            <Sparkles size={10} /> Nuevo
                          </span>
                        )}
                        {esMasVendido && (
                          <span className="inline-flex items-center gap-1 bg-yellow-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                            <Star size={10} /> Más vendido
                          </span>
                        )}
                      </div>
                    )}

                    {/* Imagen */}
                    <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                      {producto.imagen ? (
                        <img
                          src={getImageUrl(producto)}
                          alt={producto.nombre || 'Producto'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <TemporadaIcon size={48} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Información */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-1">
                        {producto.nombre || 'Sin nombre'}
                      </h3>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        {producto.categoria || 'Producto'}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                        {producto.descripcion || ''}
                      </p>
                      
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-xl font-bold text-[#6C3BFF]">
                          {formatMoney(producto.precio)}
                        </span>
                      </div>

                      <button className="w-full bg-gray-50 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                        Ver detalles →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Newsletter ──────────────────────────────────────── */}
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 text-center border border-purple-100">
            <div className="w-12 h-12 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Mail size={20} className="text-[#6C3BFF]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">¿Quieres recibir ofertas de temporada?</h3>
            <p className="text-gray-500 text-sm mb-4">Suscríbete para recibir promociones exclusivas</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
              />
              <button className="bg-[#6C3BFF] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#5b2ee6] transition-colors text-sm">
                Suscribirme
              </button>
            </div>
          </div>
        </div>
      </StoreLayout>

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}