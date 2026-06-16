// src/pages/metodos-de-pago.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function MetodosPagoPage() {
  return (
    <>
      <Head><title>Métodos de Pago | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">💳 Métodos de Pago</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center"><div className="text-4xl mb-3">📱</div><h3 className="font-bold">QR con vendedor</h3><p className="text-gray-500 text-sm mt-2">Escanea el código QR con tu app bancaria</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center"><div className="text-4xl mb-3">🏦</div><h3 className="font-bold">Transferencia BBVA</h3><p className="text-gray-500 text-sm mt-2">Realiza una transferencia a nuestra cuenta</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center"><div className="text-4xl mb-3">💵</div><h3 className="font-bold">Efectivo</h3><p className="text-gray-500 text-sm mt-2">Paga directamente al cobrador</p></div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}