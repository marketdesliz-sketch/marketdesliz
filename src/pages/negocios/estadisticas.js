// src/pages/negocios/estadisticas.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import { getNegocioById, getEstadisticasNegocio, getActividadRecienteNegocio } from '../../lib/negociosService';
import { exportarEstadisticasExcel, exportarEstadisticasPDF } from '../../lib/exportarEstadisticasService';
import { formatDate, formatDateTime } from '../../lib/utils';

export default function EstadisticasNegocioPage() {
  const router = useRouter();
  const { periodo = 'semana' } = router.query;

  const [negocio, setNegocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(periodo);
  const [estadisticas, setEstadisticas] = useState({
    visitas: { total: 0, hoy: 0, semana: 0, mes: 0 },
    contactos: { total: 0, whatsapp: 0, llamadas: 0 },
    comentarios: { total: 0, positivos: 0, negativos: 0, lista: [] },
    calificacionPromedio: 0,
    tendencias: []
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [mostrarExportar, setMostrarExportar] = useState(false);

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = pb.authStore.model;
      if (!user) {
        router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
        return;
      }

      // Obtener el negocio del usuario
      const negocios = await pb.collection('negocios').getFullList({
        filter: `usuarioId = "${user.id}"`,
        limit: 1
      });

      if (negocios.length === 0) {
        setNegocio(null);
        setLoading(false);
        return;
      }

      const negocioData = negocios[0];
      setNegocio(negocioData);

      // Cargar estadísticas y actividad en paralelo
      const [stats, actividad] = await Promise.all([
        getEstadisticasNegocio(negocioData.id, periodoSeleccionado),
        getActividadRecienteNegocio(negocioData.id, 10)
      ]);

      setEstadisticas(stats);
      setActividadReciente(actividad);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar las estadísticas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [router, periodoSeleccionado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Actualizar URL al cambiar periodo ──────────────────────────────
  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodoSeleccionado(nuevoPeriodo);
    router.push({ pathname: '/negocios/estadisticas', query: { periodo: nuevoPeriodo } }, undefined, { shallow: true });
  };

  // ─── Exportaciones ─────────────────────────────────────────────────────
  const handleExportarExcel = async () => {
    if (!negocio) return;
    setExportando(true);
    try {
      await exportarEstadisticasExcel({
        negocio,
        estadisticas,
        actividadReciente,
        fechaGeneracion: new Date()
      });
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert('Error al exportar a Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    if (!negocio) return;
    setExportando(true);
    try {
      await exportarEstadisticasPDF({
        negocio,
        estadisticas,
        actividadReciente,
        fechaGeneracion: new Date()
      });
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Error al exportar a PDF');
    } finally {
      setExportando(false);
    }
  };

  // ─── Iconos por tipo de actividad ────────────────────────────────────
  const getIconoTipo = (tipo) => {
    const iconos = {
      'comentario': '💬',
      'calificacion': '⭐',
      'contacto_whatsapp': '📱',
      'contacto_telefono': '📞',
      'visita': '👁️',
      'producto_visto': '📦'
    };
    return iconos[tipo] || '📢';
  };

  // ─── Formato de fecha relativa ──────────────────────────────────────
  const formatFechaRelativa = (fecha) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return formatDate(date);
  };

  // ─── Estados de carga y error ────────────────────────────────────────
  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  if (error) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 pt-24 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error al cargar estadísticas</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={cargarDatos}
            className="bg-[#6C3BFF] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5a2ee6] transition"
          >
            Reintentar
          </button>
        </div>
      </StoreLayout>
    );
  }

  if (!negocio) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 pt-24 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No tienes un negocio registrado</h1>
          <p className="text-gray-600 mb-6">
            Para ver estadísticas, primero debes registrar tu negocio como aliado de MarketDesliz.
          </p>
          <Link href="/negocios/registro" className="bg-[#6C3BFF] text-white px-6 py-3 rounded-lg font-medium inline-block">
            Registrar mi negocio
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Estadísticas | {negocio.nombre}</title>
        <meta name="description" content={`Estadísticas y métricas de ${negocio.nombre} en MarketDesliz`} />
      </Head>

      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          {/* ─── Header con exportaciones ─────────────────────────────── */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <Link href={`/negocios/${negocio.id}`} className="text-[#6C3BFF] hover:underline inline-block mb-4">
                  ← Volver a mi negocio
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">📊 Estadísticas de {negocio.nombre}</h1>
                <p className="text-gray-500 mt-1">Mide el rendimiento de tu negocio en MarketDesliz</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMostrarExportar(!mostrarExportar)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                  disabled={exportando}
                >
                  {exportando ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '📥 Exportar reporte'
                  )}
                </button>
                {mostrarExportar && !exportando && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={handleExportarExcel}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                    >
                      <span>📊</span> Exportar a Excel
                    </button>
                    <button
                      onClick={handleExportarPDF}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                    >
                      <span>📄</span> Exportar a PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Tarjetas de métricas principales ─────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">👁️</span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{estadisticas.visitas.total}</div>
              <div className="text-sm text-gray-500 mt-1">Visitas al perfil</div>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="text-green-600">📈 Hoy: {estadisticas.visitas.hoy}</span>
                <span className="text-blue-600">📊 Semana: {estadisticas.visitas.semana}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">💬</span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{estadisticas.contactos.total}</div>
              <div className="text-sm text-gray-500 mt-1">Contactos recibidos</div>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="text-green-600">📱 WhatsApp: {estadisticas.contactos.whatsapp}</span>
                <span className="text-blue-600">📞 Llamadas: {estadisticas.contactos.llamadas}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">⭐</span>
                <span className="text-xs text-gray-400">Promedio</span>
              </div>
              <div className="text-3xl font-bold text-yellow-500">{estadisticas.calificacionPromedio}</div>
              <div className="text-sm text-gray-500 mt-1">Calificación promedio</div>
              <div className="flex mt-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className="text-lg" style={{ color: star <= Math.round(estadisticas.calificacionPromedio) ? '#FFD700' : '#e5e7eb' }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">📝</span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{estadisticas.comentarios.total}</div>
              <div className="text-sm text-gray-500 mt-1">Opiniones recibidas</div>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="text-green-600">👍 Positivas: {estadisticas.comentarios.positivos}</span>
                <span className="text-red-600">👎 Negativas: {estadisticas.comentarios.negativos}</span>
              </div>
            </div>
          </div>

          {/* ─── Gráfico de tendencias ────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">📈 Tendencias (últimos 7 días)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePeriodoChange('semana')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    periodoSeleccionado === 'semana'
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => handlePeriodoChange('mes')}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    periodoSeleccionado === 'mes'
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Mes
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {estadisticas.tendencias.map((dia, idx) => {
                const maxVisitas = Math.max(...estadisticas.tendencias.map(d => d.visitas), 1);
                const maxContactos = Math.max(...estadisticas.tendencias.map(d => d.contactos), 1);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{dia.fecha}</span>
                      <span className="text-gray-500">{dia.visitas} visitas • {dia.contactos} contactos</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${(dia.visitas / maxVisitas) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(dia.contactos / maxContactos) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Actividad reciente ───────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🕐 Actividad reciente</h2>

            {actividadReciente.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay actividad reciente</p>
            ) : (
              <div className="space-y-3">
                {actividadReciente.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="text-2xl">{getIconoTipo(act.tipo)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{act.titulo}</p>
                      <p className="text-sm text-gray-600">{act.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatFechaRelativa(act.fecha)}</p>
                    </div>
                    {!act.leida && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Acciones rápidas ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/negocios/${negocio.id}`}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-5 rounded-xl text-center hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">🏪</div>
              <h3 className="font-bold">Ver mi negocio</h3>
              <p className="text-sm opacity-90">Cómo lo ven los clientes</p>
            </Link>

            <Link
              href="/negocios/notificaciones"
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-5 rounded-xl text-center hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">🔔</div>
              <h3 className="font-bold">Notificaciones</h3>
              <p className="text-sm opacity-90">Revisa tus alertas</p>
            </Link>

            <Link
              href={`/negocios/editar?id=${negocio.id}`}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-5 rounded-xl text-center hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">✏️</div>
              <h3 className="font-bold">Editar perfil</h3>
              <p className="text-sm opacity-90">Actualiza tu información</p>
            </Link>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}