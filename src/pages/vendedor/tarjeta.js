// src/pages/vendedor/tarjeta.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronLeft, Printer, Smartphone, ShieldCheck, AlertTriangle } from 'lucide-react';
import VendedorLayout from '../../layouts/VendedorLayout';
import pb from '../../lib/pocketbase';
import TarjetaVendedor from '../../components/TarjetaVendedor';
import { getVendedorCompleto } from '../../lib/vendedorService';

export default function TarjetaVendedorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendedorData, setVendedorData] = useState(null);
  const [lado, setLado] = useState('frente');

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/vendedor/login');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const user = pb.authStore.model;
      
      // Obtener vendedor con datos del usuario
      const vendedor = await pb.collection('vendedores').getFirstListItem(
        `userId = "${user.id}" && activo = true`
      );
      
      // Obtener foto del usuario si existe
      let fotoUrl = null;
      if (user.foto) {
        fotoUrl = pb.files.getURL(user, user.foto);
      }
      
      setVendedorData({
        ...vendedor,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        foto: fotoUrl
      });
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    window.print();
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
        <title>Mi Tarjeta | MarketDesliz Vendedor</title>
      </Head>

      <VendedorLayout>
        <div className="max-w-lg mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <Link href="/vendedor/perfil" className="inline-flex items-center gap-1.5 text-sm text-[#6C3BFF] font-medium hover:underline mb-4">
              <ChevronLeft size={15} /> Volver a mi perfil
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone size={20} className="text-[#6C3BFF]" /> Mi Tarjeta Digital
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">Tu identificación como vendedor autorizado</p>
              </div>
              <button
                onClick={handleImprimir}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Printer size={15} /> Imprimir tarjeta
              </button>
            </div>
          </div>

          {/* Selector frente/reverso */}
          <div className="flex gap-2 justify-center mb-6">
            <button
              onClick={() => setLado('frente')}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-colors ${
                lado === 'frente'
                  ? 'bg-[#6C3BFF] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
              }`}
            >
              Frente
            </button>
            <button
              onClick={() => setLado('reverso')}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-colors ${
                lado === 'reverso'
                  ? 'bg-[#6C3BFF] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
              }`}
            >
              Reverso
            </button>
          </div>

          {/* Tarjeta */}
          <div className="flex justify-center mb-6">
            {vendedorData && <TarjetaVendedor datos={vendedorData} tipo={lado} />}
          </div>

          {/* Información adicional */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#6C3BFF]" /> ¿Cómo usar esta tarjeta?
            </h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-[#6C3BFF] font-bold">1.</span>
                Muestra esta tarjeta a tus clientes (física o digital)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6C3BFF] font-bold">2.</span>
                El cliente escanea el código QR para verificar que eres un vendedor autorizado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#6C3BFF] font-bold">3.</span>
                También puede escanearlo para iniciar una solicitud de compra contigo
              </li>
            </ul>
          </div>

          {/* Alerta importante */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong className="font-semibold">⚠️ Importante:</strong> Este código QR es personal e intransferible.
              Si pierdes tu tarjeta o alguien más la está usando, repórtalo inmediatamente al 282-141-4939.
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