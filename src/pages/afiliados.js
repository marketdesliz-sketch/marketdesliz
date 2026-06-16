// src/pages/afiliados.js
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../layouts/StoreLayout';

export default function AfiliadosPage() {
  return (
    <>
      <Head><title>Programa de Afiliados | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🤝 Programa de Afiliados</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
            <p className="text-gray-600">Gana dinero recomendando MarketDesliz. Cada persona que se registre y realice una compra, recibirás una comisión.</p>
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="font-bold text-[#6C3BFF] mb-3">Beneficios:</h3>
              <ul className="space-y-2">
                <li>✓ Comisión del 10% por cada compra</li>
                <li>✓ Pagos semanales por transferencia</li>
                <li>✓ Material promocional incluido</li>
                <li>✓ Soporte personalizado</li>
              </ul>
            </div>
            <Link href="/contacto" className="inline-block bg-[#6C3BFF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">Quiero ser afiliado →</Link>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}