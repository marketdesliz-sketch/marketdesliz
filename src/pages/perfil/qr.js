// src/pages/perfil/qr.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronRight, Download, Copy, CheckCircle, User, Phone, Fingerprint, QrCode as QrIcon } from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import QRCode from 'qrcode';

export default function PerfilQRPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    const currentUser = pb.authStore.model;
    
    if (currentUser?.role === 'vendedor') {
      router.push('/vendedor/qr');
      return;
    }
    
    setUser(currentUser);
    generarQR(currentUser.id);
  }, []);

  const generarQR = async (userId) => {
    try {
      const qrData = JSON.stringify({
        type: 'cliente',
        id: userId,
        nombre: user?.nombre || '',
        telefono: user?.telefono || '',
        timestamp: Date.now()
      });
      
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 300,
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
    const link = `${window.location.origin}/cobrador/scan?client=${user.id}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const descargarQR = () => {
    if (!qrCode) return;
    setDescargando(true);
    const link = document.createElement('a');
    link.download = `qr-${user.id}.png`;
    link.href = qrCode;
    link.click();
    setTimeout(() => setDescargando(false), 1000);
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Mi Código QR | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-40 pb-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/perfil" className="inline-flex items-center gap-1 text-sm text-[#6C3BFF] hover:gap-2 transition-all mb-4 group">
              <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" /> Volver a mi perfil
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <QrIcon size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mi código QR</h1>
                <p className="text-sm text-gray-400">Presenta este código al cobrador para realizar tus pagos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 text-center">
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                {qrCode && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#6C3BFF]/20 to-[#6C3BFF]/5 rounded-2xl blur-xl -z-10" />
                    <img
                      src={qrCode}
                      alt="Código QR del cliente"
                      className="w-64 h-64 border-2 border-gray-100 rounded-2xl p-3 bg-white shadow-lg"
                    />
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={descargarQR}
                  disabled={descargando}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <Download size={16} />
                  {descargando ? 'Descargando...' : 'Descargar QR'}
                </button>
                <button
                  onClick={copiarLink}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  {copiado ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copiado ? 'Enlace copiado' : 'Copiar enlace'}
                </button>
              </div>

              {/* Información del cliente */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <User size={14} className="text-[#6C3BFF]" /> Datos del cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-gray-400" />
                    <span className="text-gray-500">Nombre:</span>
                    <span className="text-gray-900 font-medium">{user?.nombre || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-gray-400" />
                    <span className="text-gray-500">Teléfono:</span>
                    <span className="text-gray-900 font-medium">{user?.telefono || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fingerprint size={12} className="text-gray-400" />
                    <span className="text-gray-500">ID:</span>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">{user?.id}</code>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                El cobrador puede escanear este código o usar el enlace para ver tus pagos pendientes
              </p>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}