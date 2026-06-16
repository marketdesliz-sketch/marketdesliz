// src/pages/catalogos.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpen, ChevronRight, Package, Inbox } from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

// Catálogos sin emojis duplicados — ícono solo en la card, nombre limpio en el label
const listaCatalogos = [
  { id: 'todos',           nombre: 'Todos',            color: 'bg-gray-700',        descripcion: 'Explora todo nuestro catálogo' },
  { id: 'electrodomesticos',nombre: 'Electrodomésticos',color: 'bg-sky-600',         descripcion: 'Lavadoras, refrigeradores, estufas y más' },
  { id: 'electronica',     nombre: 'Electrónica',       color: 'bg-[#6C3BFF]',       descripcion: 'Celulares, tablets, laptops, audífonos' },
  { id: 'hogar',           nombre: 'Hogar',             color: 'bg-emerald-600',     descripcion: 'Muebles, decoración, organización' },
  { id: 'moda',            nombre: 'Moda',              color: 'bg-pink-600',        descripcion: 'Ropa, calzado, accesorios' },
  { id: 'deportes',        nombre: 'Deportes',          color: 'bg-orange-500',      descripcion: 'Equipo deportivo, ropa, accesorios' },
  { id: 'belleza',         nombre: 'Belleza',           color: 'bg-rose-500',        descripcion: 'Cosméticos, cuidado personal' },
  { id: 'juguetes',        nombre: 'Juguetes',          color: 'bg-yellow-500',      descripcion: 'Juguetes, videojuegos, consolas' },
  { id: 'mascotas',        nombre: 'Mascotas',          color: 'bg-green-700',       descripcion: 'Alimento, accesorios, juguetes' },
  { id: 'herramientas',    nombre: 'Herramientas',      color: 'bg-gray-800',        descripcion: 'Ferretería, herramientas eléctricas' },
  { id: 'ofertas',         nombre: 'Ofertas',           color: 'bg-red-500',         descripcion: 'Productos con descuento' },
  { id: 'nuevos',          nombre: 'Nuevos',            color: 'bg-indigo-600',      descripcion: 'Lanzamientos recientes' },
];

export default function CatalogosPage() {
  const router = useRouter();
  const { categoria } = router.query;
  const [loading, setLoading] = useState(true);
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState(categoria || 'todos');
  const [productos, setProductos] = useState([]);

  useEffect(() => { cargarProductos(); }, [catalogoSeleccionado]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      let filter = 'activo = true';

      const catMap = {
        electrodomesticos: ' && categoria = "Electrodomésticos"',
        electronica: ' && categoria = "Electrónica"',
        hogar: ' && categoria = "Hogar"',
        moda: ' && (categoria = "Ropa" || categoria = "Calzado")',
        deportes: ' && categoria = "Deportes"',
        belleza: ' && categoria = "Belleza"',
        juguetes: ' && categoria = "Juguetes"',
        mascotas: ' && categoria = "Mascotas"',
        herramientas: ' && categoria = "Herramientas"',
      };

      if (catMap[catalogoSeleccionado]) filter += catMap[catalogoSeleccionado];

      if (catalogoSeleccionado === 'nuevos') {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);
        filter += ` && created >= "${fechaLimite.toISOString()}"`;
      }

      const productosData = await pb.collection('products').getFullList({ filter, sort: '-created' });
      setProductos(productosData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCatalogo = (id) => {
    setCatalogoSeleccionado(id);
    router.push(`/catalogos?categoria=${id}`, undefined, { shallow: true });
  };

  const catalogoActual = listaCatalogos.find(c => c.id === catalogoSeleccionado) || listaCatalogos[0];

  const getImageUrl = (producto) => {
    if (!producto.imagen) return null;
    try { return pb.files.getURL(producto, producto.imagen); } catch { return null; }
  };

  return (
    <>
      <Head><title>Catálogos | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Catálogos MarketDesliz</h1>
            <p className="text-gray-500 mt-2 text-sm">Explora nuestros catálogos por categoría</p>
          </div>

          {/* Grid de catálogos */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
            {listaCatalogos.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCatalogo(cat.id)}
                className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                  catalogoSeleccionado === cat.id
                    ? 'ring-2 ring-[#6C3BFF] ring-offset-2 shadow-md scale-[1.02]'
                    : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className={`${cat.color} py-4 px-2 text-white text-center`}>
                  <p className="font-semibold text-xs leading-tight">{cat.nombre}</p>
                </div>
                {catalogoSeleccionado === cat.id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#6C3BFF] rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Banner del catálogo activo */}
          <div className={`${catalogoActual.color} rounded-2xl px-6 py-5 mb-7 flex items-center gap-4`}>
            <div>
              <h2 className="text-lg font-bold text-white">{catalogoActual.nombre}</h2>
              <p className="text-white/80 text-sm mt-0.5">{catalogoActual.descripcion}</p>
            </div>
          </div>

          {/* Contador */}
          <p className="text-xs text-gray-400 mb-5">
            {loading ? 'Cargando...' : `${productos.length} ${productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}`}
          </p>

          {/* Spinner */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : productos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <Inbox size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay productos en este catálogo</h3>
              <p className="text-sm text-gray-400 mb-4">Pronto tendremos más productos para ti</p>
              <button
                onClick={() => handleSelectCatalogo('todos')}
                className="text-sm text-[#6C3BFF] font-medium hover:underline"
              >
                Ver todos los productos →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  onClick={() => router.push(`/productos/${producto.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                >
                  {/* Imagen */}
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    {producto.imagen ? (
                      <img
                        src={getImageUrl(producto)}
                        alt={producto.nombre || 'Producto'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={36} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <span className="text-[10px] font-semibold text-[#6C3BFF] bg-[#6C3BFF]/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {producto.categoria || catalogoActual.nombre}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm mt-2 mb-1 line-clamp-1">
                      {producto.nombre || 'Sin nombre'}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                      {producto.descripcion || ''}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#6C3BFF]">
                        {formatMoney(producto.precio)}
                      </span>
                      <ChevronRight size={15} className="text-gray-300 group-hover:text-[#6C3BFF] transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </StoreLayout>
    </>
  );
}