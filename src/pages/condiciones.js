// src/pages/condiciones.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function TerminosPage() {
  return (
    <>
      <Head><title>Términos y Condiciones | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📜 Términos y Condiciones</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
            <p><strong>1. Aceptación de términos</strong><br />Al utilizar MarketDesliz, aceptas estos términos.</p>
            <p><strong>2. Registro</strong><br />Debes proporcionar información verídica y actualizada.</p>
            <p><strong>3. Crédito y pagos</strong><br />Los pagos son semanales, el enganche mínimo es del 15%.</p>
            <p><strong>4. Tandas</strong><br />Las tandas requieren verificación KYC y pago de gasolina de $25.</p>
            <p><strong>5. Responsabilidad del usuario</strong><br />Eres responsable de mantener tu cuenta segura.</p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}