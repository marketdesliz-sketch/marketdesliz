// src/pages/cookies.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function CookiesPage() {
  return (
    <>
      <Head><title>Política de Cookies | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🍪 Política de Cookies</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <p>Utilizamos cookies para mejorar tu experiencia, recordar tus preferencias y analizar el tráfico.</p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}