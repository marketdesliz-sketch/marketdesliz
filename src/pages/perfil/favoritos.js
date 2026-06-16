// src/pages/perfil/favoritos.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function MisFavoritosPage() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState([]);
  const [productosFavoritos, setProductosFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    cargarFavoritos();
  }, []);

  // ✅ Cargar favoritos desde PocketBase
  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      const user = pb.authStore.model;
      
      // Obtener favoritos del usuario desde PocketBase
      const favoritosData = await pb.collection('favoritos').getFullList({
        filter: `userId = "${user.id}"`,
        expand: 'productId'
      });
      
      setFavoritos(favoritosData);
      
      if (favoritosData.length > 0) {
        // Extraer los productos de los favoritos (ya vienen expandidos)
        const productos = favoritosData.map(fav => {
          const product = fav.expand?.productId;
          if (!product) return null;
          
          return {
            id: product.id,
            nombre: product.nombre || 'Producto sin nombre',
            descripcion: product.descripcion || 'Sin descripción',
            precio: product.precio || 0,
            enganche: product.enganche || 0,
            paga: product.pagoSemanal || 0,
            categoria: product.categoria || 'General',
            imagen: product.imagen ? pb.files.getURL(product, product.imagen) : null,
            stock: product.stock || 0,
            agotado: product.stock === 0,
            favoritoId: fav.id  // Guardamos el ID del registro de favorito
          };
        }).filter(p => p !== null);
        
        setProductosFavoritos(productos);
      } else {
        setProductosFavoritos([]);
      }
      
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Eliminar favorito desde PocketBase
  const removeFavorite = async (productId, favoritoId) => {
    try {
      // Eliminar de PocketBase
      await pb.collection('favoritos').delete(favoritoId);
      
      // Actualizar estado local
      setFavoritos(favoritos.filter(f => f.id !== favoritoId));
      setProductosFavoritos(productosFavoritos.filter(p => p.id !== productId));
      
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      alert('No se pudo eliminar el favorito');
    }
  };

  // ✅ Eliminar todos los favoritos
  const removeAllFavorites = async () => {
    if (!confirm('¿Eliminar todos los productos de favoritos?')) return;
    
    try {
      // Eliminar todos los favoritos del usuario
      await Promise.all(
        favoritos.map(fav => pb.collection('favoritos').delete(fav.id))
      );
      
      // Actualizar estado local
      setFavoritos([]);
      setProductosFavoritos([]);
      
    } catch (error) {
      console.error('Error eliminando todos los favoritos:', error);
      alert('No se pudieron eliminar todos los favoritos');
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Mis Favoritos | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
          {/* Header */}
          <div className="mb-8">
            <Link href="/perfil" className="text-[#6C3BFF] hover:underline inline-block mb-4">
              ← Volver a mi perfil
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">❤️ Mis favoritos</h1>
            <p className="text-gray-500 mt-1">Productos que has guardado para después</p>
          </div>

          {/* Lista de favoritos */}
          {productosFavoritos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">💔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes productos favoritos</h3>
              <p className="text-gray-500 mb-6">Guarda tus productos favoritos haciendo clic en el corazón ❤️</p>
              <Link href="/productos" className="bg-[#6C3BFF] text-white px-6 py-2 rounded-lg inline-block">
                Ver productos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosFavoritos.map((producto) => (
                <div key={producto.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                  <Link href={`/productos/${producto.id}`}>
                    <div className="cursor-pointer">
                      {/* Imagen */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {producto.imagen ? (
                          <img 
                            src={producto.imagen} 
                            alt={producto.nombre}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                            📦
                          </div>
                        )}
                        {producto.agotado && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            Agotado
                          </span>
                        )}
                      </div>

                      {/* Información */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{producto.nombre}</h3>
                        <p className="text-xs text-gray-500 mb-3">{producto.categoria}</p>
                        
                        <div className="space-y-1 mb-4">
                          <p className="text-sm">
                            <span className="text-gray-500">Desde:</span>{' '}
                            <span className="font-bold text-gray-900">{formatMoney(producto.precio)}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">Enganche:</span>{' '}
                            <span className="font-bold text-[#6C3BFF]">{formatMoney(producto.enganche)}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">Paga:</span>{' '}
                            <span className="font-bold text-green-600">{formatMoney(producto.paga)}/semana</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Botones de acción */}
                  <div className="p-4 pt-0 flex gap-3">
                    <Link 
                      href={`/productos/${producto.id}`}
                      className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg text-center text-sm font-medium hover:bg-purple-700 transition"
                    >
                      Ver producto
                    </Link>
                    <button
                      onClick={() => removeFavorite(producto.id, producto.favoritoId)}
                      className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botón para limpiar todos los favoritos */}
          {productosFavoritos.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={removeAllFavorites}
                className="text-red-500 text-sm hover:text-red-700 transition"
              >
                🗑️ Eliminar todos los favoritos
              </button>
            </div>
          )}
        </div>
      </StoreLayout>

      <style jsx>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #6C3BFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}