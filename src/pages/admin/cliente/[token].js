// src/pages/cliente/[token].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../../layouts/StoreLayout';
import { getDatosTarjeta } from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';

export default function ClientePage() {
  const router = useRouter();
  const { token } = router.query;
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarFrente, setMostrarFrente] = useState(true);

  useEffect(() => {
    if (token) {
      cargarDatos();
    }
  }, [token]);

  const cargarDatos = async () => {
    try {
      const data = await getDatosTarjeta(token);
      if (!data) {
        router.push('/404');
        return;
      }
      setDatos(data);
    } catch (error) {
      console.error('Error:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Cliente | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Tarjeta MarketDesliz</h1>
            <p className="text-gray-500">Presenta esta tarjeta al cobrador</p>
          </div>

          {/* Tarjeta */}
          <div className="flex justify-center mb-6">
            <TarjetaCliente datos={datos} tipo={mostrarFrente ? 'frente' : 'reverso'} />
          </div>

          {/* Botones para voltear */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setMostrarFrente(true)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                mostrarFrente ? 'bg-[#6C3BFF] text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Frente
            </button>
            <button
              onClick={() => setMostrarFrente(false)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                !mostrarFrente ? 'bg-[#6C3BFF] text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Reverso
            </button>
          </div>

          {/* Información del cliente - CORREGIDO */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Información del cliente</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">ID:</span>
                <span className="font-mono">{datos.idCliente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre:</span>
                <span>{datos.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Teléfono:</span>
                <span>{datos.telefono}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className={`font-medium ${
                  datos.estadoColor === 'green' ? 'text-green-600' : 
                  datos.estadoColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {datos.pagosAtrasados > 0 ? `${datos.pagosAtrasados} pago(s) atrasado(s)` : 'Al corriente'}
                </span>
              </div>
            </div>
          </div>

          {/* Botón para descargar */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => window.print()}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              🖨️ Imprimir tarjeta
            </button>
          </div>
        </div>
      </StoreLayout>

      <style jsx>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #6C3BFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}