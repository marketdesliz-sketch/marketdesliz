// src/pages/privacidad.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function PrivacidadPage() {
  return (
    <>
      <Head><title>Aviso de Privacidad | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔒 Aviso de Privacidad</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
            <p>MarketDesliz se compromete a proteger tus datos personales conforme a la ley.</p>
            <p><strong>Datos recabados:</strong> Nombre, teléfono, dirección, INE, selfie.</p>
            <p><strong>Uso de datos:</strong> Verificación de identidad, procesamiento de pagos, comunicación.</p>
            <p><strong>Derechos ARCO:</strong> Acceso, rectificación, cancelación, oposición.</p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}