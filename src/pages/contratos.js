// src/pages/contratos.js
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../layouts/StoreLayout';

export default function ContratosPage() {
  return (
    <>
      <Head>
        <title>Contratos de Adhesión | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
              <span className="text-4xl">📄</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Contratos de Adhesión</h1>
            <p className="text-gray-600 mt-2">Documentos legales de MarketDesliz</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              {/* Contrato de Crédito */}
              <Link href="/contrato-credito" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📎</span>
                  <div>
                    <h3 className="font-bold text-gray-900">Contrato de Crédito</h3>
                    <p className="text-sm text-gray-500">Para compras a crédito de productos</p>
                  </div>
                </div>
                <span className="text-[#6C3BFF]">Ver contrato →</span>
              </Link>

              {/* Contrato de Tanda */}
              <Link href="/contrato-tanda" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📎</span>
                  <div>
                    <h3 className="font-bold text-gray-900">Contrato de Tanda</h3>
                    <p className="text-sm text-gray-500">Para participación en tandas</p>
                  </div>
                </div>
                <span className="text-[#6C3BFF]">Ver contrato →</span>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ Estos contratos son documentos legales. Al realizar una compra o unirte a una tanda, 
                aceptas automáticamente los términos aquí establecidos.
              </p>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}