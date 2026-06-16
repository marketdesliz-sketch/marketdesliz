// src/pages/vendedor/solicitudes/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import VendedorLayout from '../../../layouts/VendedorLayout';
import pb from '../../../lib/pocketbase';
import { validarSolicitud, marcarEngancheRecibido } from '../../../lib/vendedorService';
import SolicitudCard from '../../../components/vendedor/SolicitudCard';

export default function VendedorSolicitudDetallePage() {
  const router = useRouter();
  const { id } = router.query;
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarSolicitud();
    }
  }, [id]);

  const cargarSolicitud = async () => {
    try {
      // ✅ CORREGIDO: expand con los campos correctos según tu colección
      const solicitudData = await pb.collection('solicitudes').getOne(id, {
        expand: 'clienteId,productoId,vendedorId'
      });
      setSolicitud(solicitudData);
    } catch (error) {
      console.error('Error cargando solicitud:', error);
      if (error.status === 404) {
        router.push('/vendedor/solicitudes');
      } else {
        console.error('Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleValidada = () => {
    // Recargar la solicitud para mostrar el nuevo estado
    cargarSolicitud();
    // Redirigir después de un breve momento
    setTimeout(() => {
      router.push('/vendedor/solicitudes');
    }, 1500);
  };

  const handleEngancheRecibido = () => {
    cargarSolicitud();
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </VendedorLayout>
    );
  }

  if (!solicitud) {
    return (
      <VendedorLayout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500">Solicitud no encontrada</p>
          <Link href="/vendedor/solicitudes" className="text-purple-600 mt-2 inline-block hover:underline">
            ← Volver a solicitudes
          </Link>
        </div>
      </VendedorLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Detalle de Solicitud | MarketDesliz Vendedor</title>
      </Head>

      <VendedorLayout>
        <div className="mb-4">
          <Link href="/vendedor/solicitudes" className="text-purple-600 hover:underline inline-flex items-center gap-1">
            <span>←</span> Volver a solicitudes
          </Link>
        </div>
        
        <SolicitudCard
          solicitud={solicitud}
          onValidada={handleValidada}
          onEngancheRecibido={handleEngancheRecibido}
        />
      </VendedorLayout>

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