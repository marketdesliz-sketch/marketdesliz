// src/components/collector/ScanQRButton.jsx
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanQRButton() {
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const router = useRouter();

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error al detener el escáner:', err);
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = async () => {
    setShowScanner(true);
    setScanning(true);
    setError('');

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            await stopScanner();
            setShowScanner(false);
            setScanning(false);
            
            if (decodedText && decodedText.trim()) {
              router.push(`/cobrador/cliente/${decodedText.trim()}`);
            }
          },
          (errorMessage) => {
            console.debug('Escaneando...');
          }
        );
      } catch (err) {
        console.error('Error al iniciar el escáner:', err);
        setError('Error al acceder a la cámara. Verifica los permisos del navegador.');
        setScanning(false);
      }
    }, 200);
  };

  const cancelScanner = async () => {
    await stopScanner();
    setShowScanner(false);
    setScanning(false);
    setError('');
  };

  const handleManualInput = () => {
    cancelScanner();
    router.push('/cobrador/buscar');
  };

  return (
    <div className="w-full">
      {!showScanner ? (
        <button
          onClick={startScanner}
          className="w-full bg-[#6C3BFF] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#5A2FE0] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
            <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2h1V8a1 1 0 011-1z" />
          </svg>
          Escanear QR de Cliente
        </button>
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📷</span> Escanear código QR
              </h3>
              <button
                onClick={cancelScanner}
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                aria-label="Cerrar escáner"
              >
                ×
              </button>
            </div>

            <div 
              id="qr-reader" 
              className="w-full rounded-xl overflow-hidden border-2 border-gray-200"
              style={{ minHeight: '300px' }}
            />

            {scanning && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin"></div>
                <span>Buscando código QR...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4 text-center">
              Coloca el código QR del cliente frente a la cámara
            </p>

            <button
              onClick={handleManualInput}
              className="w-full mt-3 text-sm text-[#6C3BFF] hover:text-[#5A2FE0] font-medium transition-colors"
            >
              Buscar cliente manualmente
            </button>
          </div>

          <style>{`
            @keyframes slide-up {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-slide-up {
              animation: slide-up 0.3s ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}