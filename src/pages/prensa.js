// src/pages/prensa.js
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../layouts/StoreLayout';

export default function PrensaPage() {
  const noticias = [
    { fecha: '15 Mar 2026', titulo: 'MarketDesliz alcanza 10,000 usuarios activos', link: '#' },
    { fecha: '10 Feb 2026', titulo: 'MarketDesliz lanza nuevas funcionalidades', link: '#' },
    { fecha: '5 Ene 2026', titulo: 'MarketDesliz cierra ronda de inversión', link: '#' }
  ];

  return (
    <>
      <Head><title>Sala de Prensa | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📰 Sala de Prensa</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {noticias.map((n, i) => (
              <div key={i} className="border-b border-gray-100 py-4 last:border-0">
                <p className="text-sm text-gray-400">{n.fecha}</p>
                <h3 className="font-bold text-gray-900 mt-1">{n.titulo}</h3>
              </div>
            ))}
          </div>
        </div>
      </StoreLayout>
    </>
  );
}