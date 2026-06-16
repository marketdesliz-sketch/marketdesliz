// src/pages/devoluciones.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function DevolucionesPage() {
  return (
    <>
      <Head><title>Devoluciones | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔄 Devoluciones</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
            <p>Tienes 7 días naturales después de recibir tu producto para solicitar una devolución.</p>
            <p><strong>Requisitos:</strong> Producto en empaque original, sin uso, con factura</p>
            <p><strong>Proceso:</strong> Contacta a nuestro equipo de soporte por WhatsApp</p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}