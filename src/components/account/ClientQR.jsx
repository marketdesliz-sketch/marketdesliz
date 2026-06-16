// src/components/account/ClientQR.jsx
import { useState, useEffect } from 'react';
import { QrCode, Download, Copy, CheckCircle, User, Phone } from 'lucide-react';
import QRCode from 'qrcode';

export default function ClientQR({ client }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (client?.id) {
      generarQR();
    }
  }, [client]);

  const generarQR = async () => {
    try {
      const qrData = JSON.stringify({
        type: 'cliente',
        id: client.id,
        nombre: client.nombre || '',
        telefono: client.telefono || '',
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
    if (!client) return;
    const link = `${window.location.origin}/cliente/${client.id}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const descargarQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.download = `qr-${client.id}.png`;
    link.href = qrCode;
    link.click();
  };

  if (loading || !client) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-6 h-6 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <QrCode size={18} className="text-[#6C3BFF]" />
        <h3 className="font-bold text-gray-900">Código QR</h3>
      </div>

      <div className="p-6 text-center">
        {qrCode ? (
          <div className="inline-block p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <img
              src={qrCode}
              alt="Código QR del cliente"
              className="w-48 h-48"
            />
          </div>
        ) : (
          <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
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

        <div className="mt-4 text-left bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400">ID del cliente</p>
          <p className="font-mono text-sm text-gray-900">{client.id}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><User size={12} /> {client.nombre || 'Sin nombre'}</span>
            <span className="flex items-center gap-1"><Phone size={12} /> {client.telefono || 'Sin teléfono'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}"// Updated $(date)" 
