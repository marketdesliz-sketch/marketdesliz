// src/pages/accesibilidad.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function AccesibilidadPage() {
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Aplicar configuración de accesibilidad
    document.documentElement.style.fontSize = fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px';
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [fontSize, highContrast]);

  return (
    <>
      <Head>
        <title>Accesibilidad | MarketDesliz</title>
        <meta name="description" content="Comprometidos con la accesibilidad para todos los usuarios" />
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
              <span className="text-4xl">♿</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Accesibilidad</h1>
            <p className="text-gray-600 mt-2">MarketDesliz para todos</p>
          </div>

          {/* Herramientas de accesibilidad */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#6C3BFF] mb-4">🛠️ Herramientas de accesibilidad</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Tamaño de texto:</p>
                <div className="flex gap-3">
                  <button onClick={() => setFontSize('normal')} className={`px-4 py-2 rounded-lg ${fontSize === 'normal' ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100'}`}>Normal</button>
                  <button onClick={() => setFontSize('large')} className={`px-4 py-2 rounded-lg ${fontSize === 'large' ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100'}`}>Grande</button>
                  <button onClick={() => setFontSize('xlarge')} className={`px-4 py-2 rounded-lg ${fontSize === 'xlarge' ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100'}`}>Muy grande</button>
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Contraste:</p>
                <button onClick={() => setHighContrast(!highContrast)} className={`px-4 py-2 rounded-lg ${highContrast ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100'}`}>
                  {highContrast ? '✓ Alto contraste activado' : 'Activar alto contraste'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-3">♿ Nuestro compromiso</h2>
              <p className="text-gray-600">En MarketDesliz estamos comprometidos con hacer nuestra plataforma accesible para todas las personas, incluyendo aquellas con discapacidades visuales, auditivas, motoras y cognitivas.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-3">✅ Características implementadas</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Navegación por teclado</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Texto alternativo en imágenes</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Contraste ajustable</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Tamaño de texto variable</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Compatible con lectores de pantalla</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Etiquetas ARIA</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-3">📞 ¿Necesitas ayuda?</h2>
              <p className="text-gray-600">Si tienes alguna dificultad para usar nuestra plataforma, contáctanos:</p>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p>📞 Teléfono: (+52) 282-141-4939</p>
                <p>💬 WhatsApp: 282-141-4939</p>
                <p>✉️ Email: marketdesliz@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>

      <style jsx>{`
        :global(.high-contrast) {
          filter: contrast(1.5) brightness(1.1);
        }
      `}</style>
    </>
  );
}