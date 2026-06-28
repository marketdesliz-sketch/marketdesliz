// src/pages/cliente/[token].js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Printer,
  Copy,
  Share2,
  Download,
  User,
  Phone,
  MapPin,
  Award,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import StoreLayout from '../../../layouts/StoreLayout';
import { getDatosTarjeta } from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';
import { formatDate } from '../../lib/utils';

// ─── Validación de token ──────────────────────────────────────────────
const TOKEN_REGEX = /^MDZ-[A-Z]{3}-\d{4}$/;

export default function ClientePage() {
  const router = useRouter();
  const { token } = router.query;

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFrente, setMostrarFrente] = useState(true);
  const [copiado, setCopiado] = useState(false);

  // ─── Cargar preferencia de vista desde localStorage ─────────────────
  useEffect(() => {
    const saved = localStorage.getItem('tarjeta_vista');
    if (saved === 'reverso') {
      setMostrarFrente(false);
    }
  }, []);

  // ─── Persistir preferencia de vista ──────────────────────────────────
  const toggleVista = (frente) => {
    setMostrarFrente(frente);
    localStorage.setItem('tarjeta_vista', frente ? 'frente' : 'reverso');
  };

  // ─── Cargar datos ─────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    // Validar token antes de hacer la consulta
    if (!token || typeof token !== 'string') {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    if (!TOKEN_REGEX.test(token)) {
      setError('Formato de token incorrecto');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ Podríamos pasar fields para optimizar si la función lo soporta
      const data = await getDatosTarjeta(token);

      if (!data) {
        setError('Tarjeta no encontrada');
        return;
      }

      setDatos(data);

      // Registrar visita (opcional)
      try {
        const pb = (await import('../../lib/pocketbase')).default;
        await pb.collection('log_actividad').create({
          entidad: 'tarjeta',
          entidadId: data.idCliente,
          accion: 'view',
          datos: { token, timestamp: new Date().toISOString() }
        });
      } catch (logError) {
        console.warn('No se pudo registrar visita:', logError.message);
      }

    } catch (err) {
      console.error('Error cargando tarjeta:', err);
      setError('Error al cargar la tarjeta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      cargarDatos();
    }
  }, [token, cargarDatos]);

  // ─── Utilidades ──────────────────────────────────────────────────────
  const copiarEnlace = () => {
    const url = `${window.location.origin}/cliente/${token}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartir = async () => {
    const url = `${window.location.origin}/cliente/${token}`;
    const titulo = `Tarjeta de ${datos?.nombre || 'Cliente'}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, text: 'Mi tarjeta MarketDesliz', url });
      } else {
        copiarEnlace();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        copiarEnlace();
      }
    }
  };

  const descargarTarjeta = async () => {
    // Usar html2canvas para capturar la tarjeta
    try {
      const html2canvas = (await import('html2canvas')).default;
      const elemento = document.querySelector('.tarjeta-container');
      if (!elemento) return;
      const canvas = await html2canvas(elemento, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });
      const link = document.createElement('a');
      link.download = `tarjeta_${datos?.idCliente || 'cliente'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error descargando tarjeta:', err);
      alert('No se pudo descargar la tarjeta. Usa la impresión.');
    }
  };

  // ─── Memorizar datos derivados ───────────────────────────────────────
  const estadoInfo = useMemo(() => {
    if (!datos) return { texto: 'Sin información', color: 'text-gray-600' };
    if (datos.pagosAtrasados > 0) {
      return {
        texto: `${datos.pagosAtrasados} pago(s) atrasado(s)`,
        color: datos.pagosAtrasados > 2 ? 'text-red-600' : 'text-yellow-600'
      };
    }
    return { texto: 'Al corriente', color: 'text-green-600' };
  }, [datos]);

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#6C3BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Cargando tarjeta...</p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (error) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 pt-24 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {error === 'Formato de token incorrecto' ? 'Token inválido' : 'Tarjeta no encontrada'}
          </h1>
          <p className="text-gray-500 mb-6">
            {error === 'Formato de token incorrecto'
              ? 'El enlace que has usado no tiene un formato válido.'
              : 'No pudimos encontrar la tarjeta correspondiente a este enlace.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={cargarDatos}
              className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#5a2ee6] transition"
            >
              <RefreshCw size={16} /> Reintentar
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!datos) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 pt-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cliente no encontrado</h1>
          <Link href="/" className="text-[#6C3BFF] hover:underline text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Tarjeta de {datos.nombre || 'Cliente'} | MarketDesliz</title>
        <meta name="description" content={`Tarjeta digital de ${datos.nombre || 'cliente'} en MarketDesliz. ID: ${datos.idCliente}`} />
        <meta property="og:title" content={`Tarjeta de ${datos.nombre || 'Cliente'}`} />
        <meta property="og:description" content="Tarjeta digital MarketDesliz" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 pt-24">

          {/* ─── Breadcrumb ───────────────────────────────────────────── */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
            <Link href="/" className="hover:text-[#6C3BFF] transition-colors">Inicio</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 font-medium">Tarjeta</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 truncate max-w-[150px]">{datos.idCliente}</span>
          </nav>

          {/* ─── Header ────────────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Tarjeta MarketDesliz</h1>
            <p className="text-gray-500 text-sm">Presenta esta tarjeta al cobrador</p>
          </div>

          {/* ─── Tarjeta ───────────────────────────────────────────────── */}
          <div className="flex justify-center mb-6 tarjeta-container">
            <TarjetaCliente datos={datos} tipo={mostrarFrente ? 'frente' : 'reverso'} />
          </div>

          {/* ─── Botones de vista ────────────────────────────────────── */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => toggleVista(true)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                mostrarFrente ? 'bg-[#6C3BFF] text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label="Mostrar frente de la tarjeta"
            >
              Frente
            </button>
            <button
              onClick={() => toggleVista(false)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                !mostrarFrente ? 'bg-[#6C3BFF] text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label="Mostrar reverso de la tarjeta"
            >
              Reverso
            </button>
          </div>

          {/* ─── Información del cliente ────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={16} className="text-[#6C3BFF]" />
              Información del cliente
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">ID:</span>
                <span className="font-mono font-medium">{datos.idCliente}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Nombre:</span>
                <span className="font-medium">{datos.nombre || 'No registrado'}</span>
              </div>
              {datos.telefono && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-1"><Phone size={14} /> Teléfono:</span>
                  <span>{datos.telefono}</span>
                </div>
              )}
              {datos.cliente?.direccion && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-1"><MapPin size={14} /> Dirección:</span>
                  <span className="text-right max-w-[200px] truncate">{datos.cliente.direccion}</span>
                </div>
              )}
              {datos.nivel !== undefined && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-1"><Award size={14} /> Nivel:</span>
                  <span className="font-medium text-purple-600">Nivel {datos.nivel}</span>
                </div>
              )}
              {datos.createdAt && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> Registro:</span>
                  <span>{formatDate(datos.createdAt)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 flex items-center gap-1">Estado de pagos:</span>
                <span className={`font-medium ${estadoInfo.color}`}>
                  {estadoInfo.texto}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Acciones ────────────────────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => window.print()}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700"
            >
              <Printer size={18} />
              <span className="text-xs">Imprimir</span>
            </button>

            <button
              onClick={copiarEnlace}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700"
            >
              <Copy size={18} />
              <span className="text-xs">{copiado ? '¡Copiado!' : 'Copiar enlace'}</span>
            </button>

            <button
              onClick={compartir}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700"
            >
              <Share2 size={18} />
              <span className="text-xs">Compartir</span>
            </button>

            <button
              onClick={descargarTarjeta}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition text-purple-700"
            >
              <Download size={18} />
              <span className="text-xs">Descargar</span>
            </button>
          </div>

          {/* ─── Aviso de privacidad ──────────────────────────────────── */}
          <div className="mt-8 text-center text-xs text-gray-400">
            <p>Esta tarjeta contiene información personal. No compartas este enlace con personas no autorizadas.</p>
            <p className="mt-1">ID de la tarjeta: <span className="font-mono">{datos.idCliente}</span></p>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}