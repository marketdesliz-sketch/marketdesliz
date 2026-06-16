// src/pages/proteccion-datos.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function ProteccionDatosPage() {
  return (
    <>
      <Head><title>Protección de Datos | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🛡️ Protección de Datos</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <p>Tus datos están protegidos con cifrado de última generación.</p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}