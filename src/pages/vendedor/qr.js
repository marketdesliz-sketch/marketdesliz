// src/pages/vendedor/qr.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronRight, QrCode, Printer, Copy, CheckCircle,
  DollarSign, MapPin, User, Code, ShieldCheck
} from 'lucide-react';
import VendedorLayout from '../../layouts/VendedorLayout';
import pb from '../../lib/pocketbase';
import { QRCodeCanvas } from 'qrcode.react';

export default function VendedorQRPage() {
  const router = useRouter();
  const [vendedor, setVendedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/vendedor/login');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const user = pb.authStore.model;
      const vendedorData = await pb.collection('vendedores').getFirstListItem(
        `userId = "${user.id}"`
      );
      setVendedor(vendedorData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/validar-vendedor/${vendedor?.qrToken}`;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </VendedorLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Mi QR | MarketDesliz Vendedor</title>
      </Head>

      <VendedorLayout>
        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Mi código QR</h1>
          <p className="text-sm text-gray-400 mt-0.5">Los clientes escanearán este código para validar que eres un vendedor autorizado</p>
        </div>

        {/* ── QR Code ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-6">
          <div className="bg-gradient-to-r from-[#6C3BFF]/5 to-[#6C3BFF]/10 rounded-2xl p-8">
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-sm border border-gray-100">
              {vendedor?.qrToken && (
                <QRCodeCanvas value={qrUrl} size={200} level="H" />
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <Printer size={16} />
              Imprimir QR
            </button>
            <button
              onClick={copiarEnlace}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
            >
              {copiado ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copiado ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </div>
        </div>

        {/* ── Información del vendedor ───────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <User size={14} className="text-[#6C3BFF]" /> Información del vendedor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Nombre</p>
              <p className="text-sm font-semibold text-gray-900">{pb.authStore.model?.nombre || 'Vendedor'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Código</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{vendedor?.codigo}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Zona</p>
              <p className="text-sm font-semibold text-gray-900">{vendedor?.zona || 'No asignada'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Comisión</p>
              <p className="text-sm font-bold text-[#10b981]">{vendedor?.comisionPorcentaje || 50}% del enganche</p>
            </div>
          </div>
        </div>

        {/* ── Alertas informativas ───────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong className="font-semibold">⚠️ Este código es personal e intransferible.</strong> No lo compartas con nadie.
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#10b981]/8 border border-[#10b981]/20 rounded-xl">
            <DollarSign size={16} className="text-[#10b981] shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              💰 Ganas el <strong className="text-[#10b981]">{vendedor?.comisionPorcentaje || 50}% del enganche</strong> que elija el cliente.
              Tus comisiones se pagan todos los <strong className="text-gray-800">miércoles</strong>.
            </p>
          </div>
        </div>
      </VendedorLayout>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}