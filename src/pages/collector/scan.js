// src/pages/collector/scan.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CollectorLayout from '../../layouts/CollectorLayout';
import ScanQRButton from '../../components/collector/ScanQRButton';
import { getTodayRoute } from '../../lib/collectorService';

export default function ScanPage() {
  const router = useRouter();
  const [todayClients, setTodayClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayRoute();
  }, []);

  async function loadTodayRoute() {
    try {
      const clients = await getTodayRoute();
      setTodayClients(clients);
    } catch (error) {
      console.error('Error cargando ruta:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CollectorLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header con color MarketDesliz */}
        <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] text-white p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold mb-2">📱 Cobranza en Campo</h1>
          <p className="opacity-90">Escanea el QR del cliente para registrar pagos</p>
        </div>

        {/* Botón de escáner principal */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <ScanQRButton />
          
          <div className="mt-4 text-center text-sm text-gray-500">
            o ingresa manualmente el ID del cliente
          </div>
          
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="ID del cliente..."
              className="flex-1 p-2 border rounded"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  router.push(`/collector/client/${e.target.value}`);
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input');
                if (input.value) {
                  router.push(`/collector/client/${input.value}`);
                }
              }}
              className="bg-gray-200 px-4 rounded hover:bg-gray-300"
            >
              Ir
            </button>
          </div>
        </div>

        {/* Ruta de hoy (como mencionaste en tu idea) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Ruta de hoy
            <span className="text-sm text-gray-500 ml-2">
              ({todayClients.length} clientes)
            </span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C3BFF]"></div>
            </div>
          ) : todayClients.length > 0 ? (
            <div className="space-y-2">
              {todayClients.map((client, index) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/collector/client/${client.id}`)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#F3F0FF] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-[#6C3BFF] text-white rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#6C3BFF]">
                      ${client.todayAmount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {client.pendingCount} pendientes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No hay cobros programados para hoy
            </p>
          )}
        </div>
      </div>
    </CollectorLayout>
  );
}
