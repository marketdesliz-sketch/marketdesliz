// src/pages/seguridad.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function SeguridadPage() {
  const caracteristicas = [
    { icono: '🔐', titulo: 'Cifrado de datos', descripcion: 'Todos tus datos están protegidos con cifrado de última generación' },
    { icono: '🛡️', titulo: 'Protección contra fraudes', descripcion: 'Sistema de detección de fraudes en tiempo real' },
    { icono: '🔑', titulo: 'Autenticación segura', descripcion: 'Verificación por SMS para mayor seguridad' },
    { icono: '📱', titulo: 'QR único', descripcion: 'Cada cliente tiene un QR único e intransferible' },
    { icono: '👁️', titulo: 'Privacidad de datos', descripcion: 'Tus datos solo son visibles para ti y el administrador' },
    { icono: '📋', titulo: 'Auditoría de pagos', descripcion: 'Registro completo de todos tus pagos y transacciones' }
  ];

  return (
    <>
      <Head>
        <title>Seguridad | MarketDesliz</title>
        <meta name="description" content="Tu seguridad es nuestra prioridad - Conoce cómo protegemos tus datos" />
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
              <span className="text-4xl">🛡️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Seguridad en MarketDesliz</h1>
            <p className="text-gray-600 mt-2">Tu confianza es nuestra prioridad</p>
          </div>

          {/* Certificados */}
          <div className="bg-green-50 rounded-xl p-6 mb-8 border border-green-200">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="text-center"><div className="text-3xl">🔒</div><p className="text-sm font-medium mt-1">SSL Secure</p></div>
              <div className="text-center"><div className="text-3xl">✓</div><p className="text-sm font-medium mt-1">Datos cifrados</p></div>
              <div className="text-center"><div className="text-3xl">🛡️</div><p className="text-sm font-medium mt-1">Anti-fraude</p></div>
            </div>
          </div>

          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {caracteristicas.map((c, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <div className="text-3xl mb-3">{c.icono}</div>
                <h3 className="font-bold text-gray-900 mb-2">{c.titulo}</h3>
                <p className="text-gray-500 text-sm">{c.descripcion}</p>
              </div>
            ))}
          </div>

          {/* Recomendaciones */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-3">🔐 Recomendaciones de seguridad</h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>✓ No compartas tu código QR con nadie más que el cobrador</li>
              <li>✓ Verifica que el cobrador tenga identificación oficial</li>
              <li>✓ Conserva tus comprobantes de pago</li>
              <li>✓ Reporta cualquier actividad sospechosa a nuestro soporte</li>
            </ul>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}