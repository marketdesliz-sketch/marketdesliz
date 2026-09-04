// src/pages/admin/sincronizar-categorias.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayoutMinimal from '../../layouts/AdminLayoutMinimal';
import { sincronizarTodasCategorias } from '../../lib/categorias';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function SincronizarCategoriasPage() {
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('ultimaSincronizacionCategorias');
    if (saved) {
      setUltimaSincronizacion(new Date(parseInt(saved)));
    }
  }, []);

  const handleSincronizar = async () => {
    setSincronizando(true);
    setResultado(null);

    try {
      const exito = await sincronizarTodasCategorias();
      const ahora = Date.now();
      if (exito) {
        localStorage.setItem('ultimaSincronizacionCategorias', ahora.toString());
        setUltimaSincronizacion(new Date(ahora));
      }
      setResultado({
        exito,
        mensaje: exito
          ? '✅ Categorías sincronizadas correctamente con PocketBase'
          : '❌ Error al sincronizar categorías'
      });
    } catch (error) {
      setResultado({
        exito: false,
        mensaje: `❌ Error: ${error.message || 'Error desconocido'}`
      });
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sincronizar Categorías | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Sincronizar Categorías
            </h1>
            <p className="text-gray-500 text-sm mb-4">
              Este proceso copia todas las categorías de tu archivo <code className="bg-gray-100 px-1 rounded">categorias.js</code>
              a PocketBase para que sean dinámicas.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-700">
              ⚠️ Esta acción sobrescribirá las categorías en PocketBase con la estructura definida en <code className="bg-yellow-100 px-1 rounded">categorias.js</code>.
              Los cambios manuales en PocketBase se perderán.
            </div>

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

            {ultimaSincronizacion && !sincronizando && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <Clock size={14} />
                Última sincronización: {ultimaSincronizacion.toLocaleString()}
              </div>
            )}

            {resultado && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                  resultado.exito ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {resultado.exito ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="text-sm">{resultado.mensaje}</span>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link
                href="/admin/configuracion?tab=categorias"
                className="text-sm text-[#6C3BFF] hover:underline inline-flex items-center gap-1"
              >
                Volver a configuración →
              </Link>
            </div>
          </div>
        </div>
      </AdminLayoutMinimal>
    </>
  );
}