// src/pages/blog.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FileText, Inbox, ChevronRight } from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarPosts(); }, []);

  const cargarPosts = async () => {
    try {
      setLoading(true);
      const postsData = await pb.collection('blog').getFullList({ sort: '-created', filter: 'activo = true' });
      setPosts(postsData);
    } catch (error) {
      console.error('Error cargando posts:', error);
      setPosts([
        { id: '1', titulo: 'Cómo funciona MarketDesliz', extracto: 'Descubre cómo comprar a crédito fácil y rápido con MarketDesliz.', imagen: null, created: new Date().toISOString(), autor: 'MarketDesliz' },
        { id: '2', titulo: 'Beneficios de las tandas digitales', extracto: 'Las tandas digitales son una excelente forma de ahorrar e invertir.', imagen: null, created: new Date().toISOString(), autor: 'MarketDesliz' }
      ]);
    } finally { setLoading(false); }
  };

  const getImageUrl = (post) => {
    if (!post.imagen) return null;
    try { return pb.files.getURL(post, post.imagen); } catch { return null; }
  };

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
        <title>Blog | MarketDesliz</title>
        <meta name="description" content="Noticias, consejos y novedades sobre MarketDesliz" />
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-36 pb-10">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Blog MarketDesliz</h1>
            <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
              Noticias, consejos y novedades sobre compras a crédito y tandas
            </p>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <Inbox size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">Próximamente</h3>
              <p className="text-sm text-gray-400">Estamos preparando contenido interesante para ti</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer h-full flex flex-col">

                    {/* Imagen */}
                    <div className="aspect-video bg-gray-50 overflow-hidden">
                      {post.imagen ? (
                        <img
                          src={getImageUrl(post)}
                          alt={post.titulo || 'Blog post'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#6C3BFF]/5">
                          <FileText size={36} className="text-[#6C3BFF]/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-xs text-gray-400 mb-2">{formatDate(post.created)}</p>
                      <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-snug">
                        {post.titulo || post.title || 'Sin título'}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed flex-1">
                        {post.extracto || post.excerpt || post.descripcion || ''}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {post.autor || post.author || 'MarketDesliz'}
                        </span>
                        <span className="flex items-center gap-1 text-[#6C3BFF] text-xs font-medium group-hover:gap-2 transition-all">
                          Leer más <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </StoreLayout>
    </>
  );
}