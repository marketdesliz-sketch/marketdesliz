// src/pages/mapa-sitio.js
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../layouts/StoreLayout';

export default function MapaSitioPage() {
  const secciones = [
    {
      titulo: '🛍️ Tienda',
      enlaces: [
        { nombre: 'Inicio', url: '/' },
        { nombre: 'Productos', url: '/productos' },
        { nombre: 'Catálogos', url: '/catalogos' },
        { nombre: 'Temporada', url: '/temporada' },
        { nombre: 'Ofertas', url: '/temporada?tipo=ofertas-relampago' }
      ]
    },
    {
      titulo: '🎯 Tandas',
      enlaces: [
        { nombre: 'Tandas disponibles', url: '/tandas' },
        { nombre: 'Mis tandas', url: '/tandas/mis-tandas' },
        { nombre: 'Cómo funcionan', url: '/ayuda#tandas' }
      ]
    },
    {
      titulo: '🏪 Negocios y Servicios',
      enlaces: [
        { nombre: 'Negocios locales', url: '/negocios' },
        { nombre: 'Servicios profesionales', url: '/negocios?tipo=servicios' },
        { nombre: 'Registrar mi negocio', url: '/negocios/registro' }
      ]
    },
    {
      titulo: '👤 Mi cuenta',
      enlaces: [
        { nombre: 'Mi perfil', url: '/perfil' },
        { nombre: 'Mis órdenes', url: '/perfil/ordenes' },
        { nombre: 'Mis pagos', url: '/perfil/pagos' },
        { nombre: 'Mis favoritos', url: '/perfil/favoritos' },
        { nombre: 'Mi código QR', url: '/perfil/qr' }
      ]
    },
    {
      titulo: 'ℹ️ Información',
      enlaces: [
        { nombre: 'Sobre nosotros', url: '/nosotros' },
        { nombre: 'Blog', url: '/blog' },
        { nombre: 'Contacto', url: '/contacto' },
        { nombre: 'Ayuda', url: '/ayuda' }
      ]
    },
    {
      titulo: '📋 Legal',
      enlaces: [
        { nombre: 'Términos y condiciones', url: '/condiciones' },
        { nombre: 'Aviso de privacidad', url: '/privacidad' },
        { nombre: 'Política de cookies', url: '/cookies' },
        { nombre: 'Contratos de adhesión', url: '/contratos' },
        { nombre: 'Protección de datos', url: '/proteccion-datos' }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>Mapa del Sitio | MarketDesliz</title>
        <meta name="description" content="Mapa del sitio de MarketDesliz - Encuentra todas las secciones de nuestra plataforma" />
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
              <span className="text-4xl">🗺️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Mapa del Sitio</h1>
            <p className="text-gray-600 mt-2">Encuentra todas las secciones de MarketDesliz</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secciones.map((seccion, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-bold text-[#6C3BFF] mb-3 pb-2 border-b border-gray-100">
                  {seccion.titulo}
                </h2>
                <ul className="space-y-2">
                  {seccion.enlaces.map((enlace, i) => (
                    <li key={i}>
                      <Link href={enlace.url} className="text-gray-600 hover:text-[#6C3BFF] transition text-sm flex items-center gap-2">
                        <span>→</span> {enlace.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Buscador rápido */}
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-2">🔍 ¿No encuentras lo que buscas?</h3>
            <p className="text-gray-600 text-sm mb-4">Utiliza nuestro buscador o contáctanos directamente</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input
                type="text"
                placeholder="Buscar en el sitio..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <button className="bg-[#6C3BFF] text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition">
                Buscar
              </button>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}