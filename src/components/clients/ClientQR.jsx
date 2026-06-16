// src/components/clients/ClientQR.jsx
import { useState, useEffect } from 'react';
import { QrCode, Download, Copy, CheckCircle, User, Phone } from 'lucide-react';
import QRCode from 'qrcode';

export default function ClientQR({ clientId, clientName }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (clientId) {
      generarQR();
    }
  }, [clientId]);

  const generarQR = async () => {
    try {
      const qrData = JSON.stringify({
        type: 'cliente',
        id: clientId,
        nombre: clientName || 'Cliente',
        timestamp: Date.now()
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#6C3BFF',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      setQrCode(qrCodeUrl);
    } catch (error) {
      console.error('Error generando QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = () => {
    if (!clientId) return;
    const link = `${window.location.origin}/cliente/${clientId}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const descargarQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.download = `qr-${clientId}.png`;
    link.href = qrCode;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-6 h-6 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      {qrCode ? (
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <img
            src={qrCode}
            alt="Código QR del cliente"
            className="w-48 h-48"
          />
        </div>
      ) : (
        <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
          <QrCode size={48} className="text-gray-300" />
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={descargarQR}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6C3BFF] text-white text-xs rounded-lg hover:bg-[#5b2ee6] transition"
        >
          <Download size={14} /> Descargar
        </button>
        <button
          onClick={copiarLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition"
        >
          {copiado ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
          {copiado ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>

      <div className="mt-3 w-full text-left bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-400">ID del cliente</p>
        <p className="font-mono text-xs text-gray-900 truncate">{clientId}</p>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><User size={12} /> {clientName || 'Sin nombre'}</span>
          <span className="flex items-center gap-1"><Phone size={12} /> Presenta este QR al cobrador</span>
        </div>
      </div>
    </div>
  );
}"// Updated $(date)" 
