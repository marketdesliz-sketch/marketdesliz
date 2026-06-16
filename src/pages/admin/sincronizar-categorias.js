import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../layouts/AdminLayout';
import { sincronizarTodasCategorias } from '../../lib/categoriasService';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function SincronizarCategoriasPage() {
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSincronizar = async () => {
    setSincronizando(true);
    setResultado(null);
    
    const exito = await sincronizarTodasCategorias();
    
    setResultado({
      exito,
      mensaje: exito 
        ? 'Categorías sincronizadas correctamente con PocketBase'
        : 'Error al sincronizar categorías'
    });
    setSincronizando(false);
  };

  return (
    <>
      <Head>
        <title>Sincronizar Categorías | Admin</title>
      </Head>
      
      <AdminLayout>
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Sincronizar Categorías
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Este proceso copia todas las categorías de tu archivo <code className="bg-gray-100 px-1 rounded">categorias.js</code> 
              a PocketBase para que sean dinámicas.
            </p>
            
            <button
              onClick={handleSincronizar}
              disabled={sincronizando}
              className="flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#5a2ee6] transition disabled:opacity-50"
            >
              {sincronizando ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Sincronizar Ahora
                </>
              )}
            </button>
            
            {resultado && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                resultado.exito ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {resultado.exito ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="text-sm">{resultado.mensaje}</span>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}