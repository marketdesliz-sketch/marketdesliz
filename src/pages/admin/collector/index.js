// src/pages/admin/collector/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Html5QrcodeScanner } from 'html5-qrcode';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import { withAuth } from '../../../lib/withAuth';

function CollectorPage() {
  const router = useRouter();
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState('');

  const iniciarEscaneo = () => {
    setEscaneando(true);

    const scanner = new Html5QrcodeScanner('lector-qr', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(
      (decodedText) => {
        console.log('QR escaneado:', decodedText);
        setResultado(decodedText);
        scanner.clear();

        const match = decodedText.match(/MDZ-CLIENT-(.+)/);
        if (match && match[1]) {
          router.push(`/admin/collector/client/${match[1]}`);
        } else {
          alert('QR no válido');
          setEscaneando(false);
        }
      },
      (error) => {
        console.warn('Error escaneando:', error);
      }
    );
  };

  return (
    <>
      <Head>
        <title>Cobranza en Campo | Admin</title>
        <style>{`
          #lector-qr { width: 100%; margin: 20px 0; }
        `}</style>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] text-white p-6 rounded-lg mb-6">
            <h1 className="text-2xl font-bold mb-2">📱 Cobranza en Campo</h1>
            <p className="opacity-90">Escanea el QR del cliente para registrar pagos</p>
          </div>

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
        </div>
      </AdminLayoutMinimal>
    </>
  );
}

export default withAuth(CollectorPage, 'admin');