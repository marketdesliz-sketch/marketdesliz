// src/pages/admin/collector/scan.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Html5QrcodeScanner } from 'html5-qrcode';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import { withAuth } from '../../../lib/withAuth';
import { getTodayRoute } from '../../../lib/collectorService';

function ScanPage() {
  const router = useRouter();
  const [todayClients, setTodayClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [escaneando, setEscaneando] = useState(false);

  useEffect(() => {
    loadTodayRoute();
  }, []);

  async function loadTodayRoute() {
    try {
      const clients = await getTodayRoute();
      setTodayClients(clients.tasks || []);
    } catch (error) {
      console.error('Error cargando ruta:', error);
    } finally {
      setLoading(false);
    }
  }

  const iniciarEscaneo = () => {
    setEscaneando(true);
    const scanner = new Html5QrcodeScanner('lector-qr', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(
      (decodedText) => {
        console.log('QR escaneado:', decodedText);
        scanner.clear();
        const match = decodedText.match(/MDZ-CLIENT-(.+)/);
        if (match && match[1]) {
          router.push(`/admin/collector/client/${match[1]}`);
        } else {
          alert('QR no válido');
          setEscaneando(false);
        }
      },
      (error) => console.warn('Error escaneando:', error)
    );
  };

  return (
    <>
      <Head>
        <title>Cobranza en Campo - Escáner | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] text-white p-6 rounded-lg mb-6">
            <h1 className="text-2xl font-bold mb-2">📱 Cobranza en Campo</h1>
            <p className="opacity-90">Escanea el QR del cliente para registrar pagos</p>
          </div>

          {/* Escáner */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            {!escaneando ? (
              <button
                onClick={iniciarEscaneo}
                className="w-full bg-[#6C3BFF] text-white py-3 rounded-lg font-semibold hover:bg-[#5a2ee6] transition"
              >
                📷 Iniciar escáner
              </button>
            ) : (
              <div>
                <div id="lector-qr" />
                <button
                  onClick={() => setEscaneando(false)}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition mt-4"
                >
                  Cancelar
                </button>
              </div>
            )}

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
                    router.push(`/admin/collector/client/${e.target.value}`);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input');
                  if (input?.value) {
                    router.push(`/admin/collector/client/${input.value}`);
                  }
                }}
                className="bg-gray-200 px-4 rounded hover:bg-gray-300"
              >
                Ir
              </button>
            </div>
          </div>

          {/* Ruta de hoy */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Ruta de hoy
              <span className="text-sm text-gray-500 ml-2">
                ({todayClients.length} clientes)
              </span>
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C3BFF]" />
              </div>
            ) : todayClients.length > 0 ? (
              <div className="space-y-2">
                {todayClients.map((client, index) => (
                  <div
                    key={client.id}
                    onClick={() => router.push(`/admin/collector/client/${client.id}`)}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#F3F0FF] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[#6C3BFF] text-white rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{client.name || 'Cliente'}</p>
                        <p className="text-sm text-gray-500">{client.address || 'Sin dirección'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#6C3BFF]">
                        ${client.todayAmount || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {client.pendingCount || 0} pendientes
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
      </AdminLayout>
    </>
  );
}

export default withAuth(ScanPage, 'admin');
