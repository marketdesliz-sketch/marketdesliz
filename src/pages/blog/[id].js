// src/pages/blog/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function BlogDetallePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [postsRecientes, setPostsRecientes] = useState([]);

  useEffect(() => {
    if (id) {
      cargarPost();
      cargarPostsRecientes();
    }
  }, [id]);

  const cargarPost = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const postData = await pb.collection('blog').getOne(id);
      
      // ✅ Normalizar datos
      setPost({
        id: postData.id,
        titulo: postData.titulo || postData.title || 'Sin título',
        contenido: postData.contenido || postData.content || '',
        extracto: postData.extracto || postData.excerpt || '',
        imagen: postData.imagen || postData.image || null,
        autor: postData.autor || postData.author || 'MarketDesliz',
        created: postData.created,
        vistas: (postData.vistas || 0) + 1
      });
      
      // Registrar vista
      await pb.collection('blog').update(id, {
        vistas: (postData.vistas || 0) + 1
      });
      
    } catch (error) {
      console.error('Error cargando post:', error);
      // Datos de ejemplo si no existe en PocketBase
      if (id === '1') {
        setPost({
          id: '1',
          titulo: 'Cómo funciona MarketDesliz',
          contenido: `
            <h2>¿Qué es MarketDesliz?</h2>
            <p>MarketDesliz es una plataforma que te permite comprar productos a crédito de manera fácil y rápida, sin necesidad de tarjeta de crédito ni historial en buró.</p>
            
            <h2>¿Cómo funciona?</h2>
            <p>El proceso es muy sencillo:</p>
            <ul>
              <li><strong>1. Elige tu producto:</strong> Navega por nuestro catálogo y selecciona lo que deseas comprar.</li>
              <li><strong>2. Elige tu plan de pago:</strong> Puedes pagar de contado o a crédito con enganche desde el 15%.</li>
              <li><strong>3. Completa tus datos:</strong> Registra tu información de contacto y dirección.</li>
              <li><strong>4. Recibe tu producto:</strong> Coordinamos la entrega a domicilio.</li>
              <li><strong>5. Paga semanalmente:</strong> El cobrador te visitará cada semana para recibir tu pago.</li>
            </ul>
            
            <h2>Ventajas de comprar con MarketDesliz</h2>
            <ul>
              <li>✓ Sin tarjeta de crédito</li>
              <li>✓ Sin buró de crédito</li>
              <li>✓ Pagos semanales flexibles</li>
              <li>✓ Sin intereses</li>
              <li>✓ Entrega a domicilio</li>
            </ul>
          `,
          imagen: null,
          created: new Date().toISOString(),
          autor: 'MarketDesliz',
          vistas: 150
        });
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarPostsRecientes = async () => {
    try {
      const posts = await pb.collection('blog').getFullList({
        sort: '-created',
        limit: 3,
        filter: `id != "${id}"`
      });
      setPostsRecientes(posts);
    } catch (error) {
      setPostsRecientes([
        {
          id: '2',
          titulo: 'Beneficios de las tandas digitales',
          created: new Date().toISOString()
        }
      ]);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getImageUrl = (post) => {
    if (!post.imagen) return null;
    try {
      return pb.files.getURL(post, post.imagen);
    } catch (e) {
      return null;
    }
  };

  const compartirEnRedes = () => {
    const url = window.location.href;
    const title = encodeURIComponent(post?.titulo || '');
    
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${title}%20${encodeURIComponent(url)}`
    };
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

  if (error || !post) {
    return (
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Artículo no encontrado</h1>
          <p className="text-gray-500 mb-6">El artículo que buscas no existe o ha sido eliminado.</p>
          <Link href="/blog" className="bg-[#6C3BFF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition inline-block">
            ← Volver al blog
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const shares = compartirEnRedes();

  return (
    <>
      <Head>
        <title>{post.titulo} | MarketDesliz</title>
        <meta name="description" content={post.extracto || post.contenido?.substring(0, 150).replace(/<[^>]*>/g, '')} />
        <meta property="og:title" content={post.titulo} />
        <meta property="og:description" content={post.extracto || post.contenido?.substring(0, 150).replace(/<[^>]*>/g, '')} />
        {post.imagen && <meta property="og:image" content={getImageUrl(post)} />}
      </Head>

      <StoreLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/blog" className="text-[#6C3BFF] hover:underline">
              ← Volver al blog
            </Link>
          </div>

          {/* Header del artículo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
              <span>📅 {formatDate(post.created)}</span>
              <span>👁️ {post.vistas || 0} vistas</span>
              <span>✍️ Por {post.autor || 'MarketDesliz'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.titulo}</h1>
            {post.extracto && (
              <p className="text-xl text-gray-600 border-l-4 border-[#6C3BFF] pl-4">{post.extracto}</p>
            )}
          </div>

          {/* Imagen destacada */}
          {post.imagen && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              <img
                src={getImageUrl(post)}
                alt={post.titulo}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Contenido del artículo */}
          <div className="prose prose-lg max-w-none mb-8">
            {post.contenido ? (
              <div dangerouslySetInnerHTML={{ __html: post.contenido }} />
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-500">Contenido en desarrollo. Pronto más información.</p>
              </div>
            )}
          </div>

          {/* Botones de compartir */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Compartir este artículo:</h3>
            <div className="flex gap-3">
              <a
                href={shares.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1877F2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-2"
              >
                📘 Facebook
              </a>
              <a
                href={shares.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1DA1F2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-2"
              >
                🐦 Twitter
              </a>
              <a
                href={shares.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-2"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Posts recientes */}
          {postsRecientes.length > 0 && (
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📖 Artículos recientes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {postsRecientes.map((reciente) => (
                  <Link key={reciente.id} href={`/blog/${reciente.id}`}>
                    <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{reciente.titulo || reciente.title}</h3>
                      <p className="text-xs text-gray-400">{formatDate(reciente.created)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="mt-8 text-center">
            <Link href="/blog" className="text-[#6C3BFF] hover:underline">
              ← Ver todos los artículos
            </Link>
          </div>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .prose {
          max-width: none;
        }
        .prose h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }
        .prose h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #1f2937;
        }
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.6;
          color: #4b5563;
        }
        .prose ul {
          list-style: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }
      `}</style>
    </>
  );
}