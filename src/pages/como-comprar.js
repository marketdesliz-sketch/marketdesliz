// src/pages/como-comprar.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function ComoComprarPage() {
  const pasos = [
    { num: 1, titulo: 'Explora el catálogo', descripcion: 'Encuentra el producto que deseas' },
    { num: 2, titulo: 'Elige tu plan', descripcion: 'Contado o crédito con enganche desde 15%' },
    { num: 3, titulo: 'Regístrate', descripcion: 'Completa tus datos y verifica tu teléfono' },
    { num: 4, titulo: 'Recibe tu producto', descripcion: 'Te contactamos para coordinar la entrega' },
    { num: 5, titulo: 'Paga semanalmente', descripcion: 'El cobrador te visita cada semana' }
  ];

  return (
    <>
      <Head><title>Cómo Comprar | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🛒 ¿Cómo comprar en MarketDesliz?</h1>
          <div className="space-y-4">
            {pasos.map(p => (
              <div key={p.num} className="flex gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-10 h-10 bg-[#6C3BFF] text-white rounded-full flex items-center justify-center font-bold">{p.num}</div>
                <div><h3 className="font-bold">{p.titulo}</h3><p className="text-gray-500 text-sm">{p.descripcion}</p></div>
              </div>
            ))}
          </div>
        </div>
      </StoreLayout>
    </>
  );
}