// src/pages/admin/vendedores/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Code,
  DollarSign,
  Percent,
  Edit,
  Copy,
  QrCode,
  RefreshCw,
  AlertCircle,
  User,
  Building2,
  Clock,
  Award,
  TrendingUp,
  Download
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import pb from '../../../lib/pocketbase';

export default function DetalleVendedorPage() {
  const router = useRouter();
  const { id } = router.query;
  const [vendedor, setVendedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generandoQR, setGenerandoQR] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);

  useEffect(() => {
    if (id) {
      cargarVendedor();
    }
  }, [id]);

  const cargarVendedor = async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar autenticación
      if (!pb.authStore.isValid) {
        router.push('/admin/login');
        return;
      }

      const user = pb.authStore.model;
      if (user?.role !== 'admin') {
        pb.authStore.clear();
        router.push('/admin/login');
        return;
      }

      // Obtener datos del vendedor con expand
      const vendedorData = await pb.collection('vendedores').getOne(id, {
        expand: 'userId'
      });

      const vendedorConDatos = {
        ...vendedorData,
        nombre: vendedorData.expand?.userId?.nombre || 'Sin nombre',
        email: vendedorData.expand?.userId?.email || 'Sin email',
        telefono: vendedorData.expand?.userId?.telefono || 'Sin teléfono'
      };

      setVendedor(vendedorConDatos);

      // Generar URL para QR (la página de perfil del vendedor)
      const qrBaseUrl = `${window.location.origin}/vendedor/perfil/${vendedorConDatos.codigo}`;
      setQrUrl(qrBaseUrl);

    } catch (error) {
      console.error('Error cargando vendedor:', error);
      setError('No se pudo cargar la información del vendedor');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(vendedor?.codigo || '');
    alert('✅ Código copiado al portapapeles');
  };

  const copiarQRUrl = () => {
    navigator.clipboard.writeText(qrUrl || '');
    alert('✅ URL del QR copiada al portapapeles');
  };

  const descargarQR = async () => {
    if (!qrUrl) return;
    
    setGenerandoQR(true);
    try {
      // Usar una API de generación de QR (ejemplo con Google Charts API)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
      
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_vendedor_${vendedor.codigo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando QR:', error);
      alert('Error al generar el código QR');
    } finally {
      setGenerandoQR(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !vendedor) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Vendedor no encontrado</h3>
            <p className="text-sm text-gray-400 mb-4">{error || 'El vendedor que buscas no existe'}</p>
            <Link
              href="/admin/vendedores"
              className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
            >
              <ArrowLeft size={16} /> Volver a vendedores
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{vendedor.nombre} | MarketDesliz Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin/vendedores"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition mb-4"
            >
              <ArrowLeft size={14} /> Volver a la lista
            </Link>
            
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{vendedor.nombre}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{vendedor.codigo}</code>
                    <button
                      onClick={copiarCodigo}
                      className="p-1 text-gray-400 hover:text-gray-600 transition"
                      title="Copiar código"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/vendedores/editar/${vendedor.id}`}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition"
                >
                  <Edit size={16} /> Editar
                </Link>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna izquierda - Información personal */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tarjeta de información */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User size={16} className="text-[#6C3BFF]" /> Información personal
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Nombre completo</p>
                      <p className="font-medium text-gray-900">{vendedor.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-5 !00">Correo electrónico</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" /> {vendedor.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <Phone size={14} className="text-gray-400" /> {vendedor.telefono}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Zona de trabajo</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" /> {vendedor.zona || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fecha de registro</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" /> {formatDate(vendedor.created)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estado</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        vendedor.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {vendedor.activo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {vendedor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta de comisiones */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Percent size={16} className="text-[#6C3BFF]" /> Configuración de comisiones
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <Percent size={24} className="text-green-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-700">{vendedor.comisionPorcentaje}%</p>
                      <p className="text-xs text-green-600 mt-1">Comisión por venta</p>
                      <p className="text-xs text-gray-500 mt-2">El vendedor gana este porcentaje del enganche del cliente</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <TrendingUp size={24} className="text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-700">Comisión calculada</p>
                      <p className="text-xs text-gray-500 mt-2">Se aplica automáticamente en cada venta registrada por el vendedor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - QR y acciones */}
            <div className="space-y-6">
              
              {/* Tarjeta QR */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm sticky top-6">
                <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <QrCode size={16} className="text-[#6C3BFF]" /> Código QR
                  </h2>
                </div>
                <div className="p-6 text-center">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    {qrUrl && (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`}
                        alt={`QR para ${vendedor.nombre}`}
                        className="w-36 h-36 mx-auto"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Escanea este QR para acceder al perfil del vendedor
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={descargarQR}
                      disabled={generandoQR}
                      className="flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition disabled:opacity-50"
                    >
                      {generandoQR ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                      {generandoQR ? 'Generando...' : 'Descargar QR'}
                    </button>
                    <button
                      onClick={copiarQRUrl}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                    >
                      <Copy size={14} /> Copiar enlace
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 break-all">
                    <span className="font-medium">URL:</span> {qrUrl}
                  </p>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Award size={16} className="text-[#6C3BFF]" /> Acciones rápidas
                  </h2>
                </div>
                <div className="p-4 space-y-2">
                  <Link
                    href={`/admin/vendedores/editar/${vendedor.id}`}
                    className="flex items-center gap-2 w-full p-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Edit size={14} /> Editar información del vendedor
                  </Link>
                  <Link
                    href={`/admin/vendedores/ventas/${vendedor.id}`}
                    className="flex items-center gap-2 w-full p-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <DollarSign size={14} /> Ver historial de ventas
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(vendedor.codigo);
                      alert('✅ Código copiado');
                    }}
                    className="flex items-center gap-2 w-full p-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition text-left"
                  >
                    <Copy size={14} /> Copiar código del vendedor
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer informativo */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Información del vendedor</p>
                <p className="text-sm text-blue-600">
                  Este vendedor puede iniciar sesión en <strong className="font-mono">/vendedor/login</strong> con su correo y contraseña.
                  El código QR puede ser escaneado por los clientes para registrar sus compras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}