// src/pages/nosotros.js
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../layouts/StoreLayout';

export default function NosotrosPage() {
  return (
    <>
      <Head>
        <title>Sobre Nosotros | MarketDesliz</title>
        <meta name="description" content="Conoce más sobre MarketDesliz, nuestra misión, visión y valores" />
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📖 Sobre Nosotros</h1>
          
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-3">¿Quiénes somos?</h2>
              <p className="text-gray-600 leading-relaxed">
                MarketDesliz es una plataforma mexicana que nace con el propósito de facilitar el acceso a productos de calidad mediante créditos accesibles y sin complicaciones. Creemos en la inclusión financiera y en ofrecer oportunidades reales para todos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-3">🎯 Misión</h2>
              <p className="text-gray-600 leading-relaxed">
                Democratizar el acceso a productos y servicios mediante soluciones de crédito flexibles, transparentes y justas, impulsando el bienestar de las familias mexicanas.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-3">👁️ Visión</h2>
              <p className="text-gray-600 leading-relaxed">
                Ser la plataforma líder en crédito digital en México, reconocida por nuestra confiabilidad, innovación y compromiso con la comunidad.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-3">💎 Valores</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-center gap-2"><span className="text-[#6C3BFF]">✓</span> Confianza y transparencia</li>
                <li className="flex items-center gap-2"><span className="text-[#6C3BFF]">✓</span> Compromiso con el cliente</li>
                <li className="flex items-center gap-2"><span className="text-[#6C3BFF]">✓</span> Innovación constante</li>
                <li className="flex items-center gap-2"><span className="text-[#6C3BFF]">✓</span> Responsabilidad social</li>
              </ul>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}