// src/pages/envios.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function EnviosPage() {
  return (
    <>
      <Head><title>Envíos y Entregas | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🚚 Envíos y Entregas</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
            <p><strong>📦 Zonas de cobertura:</strong> Zona metropolitana y áreas cercanas</p>
            <p><strong>⏱️ Tiempo de entrega:</strong> 24-48 horas después de confirmar tu solicitud</p>
            <p><strong>💰 Costo de envío:</strong> Gratis en compras mayores a $1000</p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}