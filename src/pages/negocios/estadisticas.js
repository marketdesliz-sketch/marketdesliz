// src/pages/negocios/estadisticas.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import { getNotificacionesNegocio } from '../../lib/notificacionesNegocios';

export default function EstadisticasNegocioPage() {
  const router = useRouter();
  const [negocio, setNegocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [periodo, setPeriodo] = useState('semana'); // semana, mes, año
  const [estadisticas, setEstadisticas] = useState({
    visitas: { total: 0, hoy: 0, semana: 0, mes: 0 },
    contactos: { total: 0, whatsapp: 0, llamadas: 0 },
    comentarios: { total: 0, positivos: 0, negativos: 0, lista: [] },
    calificacionPromedio: 0,
    tendencias: []
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [mostrarExportar, setMostrarExportar] = useState(false);

  useEffect(() => {
    const user = pb.authStore.model;
    if (!user) {
      router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    cargarNegocio(user);
  }, []);

  const cargarNegocio = async (user) => {
    try {
      setLoading(true);

      const negocios = await pb.collection('negocios').getFullList({
        filter: `usuarioId = "${user.id}"`
      });

      if (negocios.length === 0) {
        setLoading(false);
        return;
      }

      const negocioData = negocios[0];
      setNegocio(negocioData);

      await cargarEstadisticas(negocioData.id);
      await cargarActividadReciente(negocioData.id);

    } catch (error) {
      console.error('Error cargando negocio:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async (negocioId) => {
    try {
      const comentarios = await pb.collection('comentarios_negocios').getFullList({
        filter: `negocioId = "${negocioId}"`,
        sort: '-created'
      });

      const notificaciones = await getNotificacionesNegocio(negocioId);

      const visitasNotif = notificaciones.filter(n => n.tipo === 'visita');
      const hoy = new Date().toDateString();
      const semanaInicio = new Date();
      semanaInicio.setDate(semanaInicio.getDate() - 7);
      const mesInicio = new Date();
      mesInicio.setMonth(mesInicio.getMonth() - 1);

      const visitasHoy = visitasNotif.filter(v => new Date(v.fecha).toDateString() === hoy).length;
      const visitasSemana = visitasNotif.filter(v => new Date(v.fecha) >= semanaInicio).length;
      const visitasMes = visitasNotif.filter(v => new Date(v.fecha) >= mesInicio).length;

      const contactosWhatsapp = notificaciones.filter(n => n.tipo === 'contacto_whatsapp').length;
      const contactosLlamadas = notificaciones.filter(n => n.tipo === 'contacto_telefono').length;

      const calificacionPromedio = comentarios.length > 0
        ? comentarios.reduce((sum, c) => sum + (c.calificacion || 5), 0) / comentarios.length
        : 0;

      const comentariosPositivos = comentarios.filter(c => (c.calificacion || 5) >= 4).length;
      const comentariosNegativos = comentarios.filter(c => (c.calificacion || 5) <= 2).length;

      const tendencias = [];
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });

        const visitasDia = visitasNotif.filter(v => new Date(v.fecha).toDateString() === fecha.toDateString()).length;
        const contactosDia = notificaciones.filter(n =>
          (n.tipo === 'contacto_whatsapp' || n.tipo === 'contacto_telefono') &&
          new Date(n.fecha).toDateString() === fecha.toDateString()
        ).length;

        tendencias.push({ fecha: fechaStr, visitas: visitasDia, contactos: contactosDia });
      }

      setEstadisticas({
        visitas: {
          total: negocio.visitas || 0,
          hoy: visitasHoy,
          semana: visitasSemana,
          mes: visitasMes
        },
        contactos: {
          total: contactosWhatsapp + contactosLlamadas,
          whatsapp: contactosWhatsapp,
          llamadas: contactosLlamadas
        },
        comentarios: {
          total: comentarios.length,
          positivos: comentariosPositivos,
          negativos: comentariosNegativos,
          lista: comentarios.map(c => ({
            fecha: c.created,
            usuario: c.usuarioNombre,
            calificacion: c.calificacion || 5,
            comentario: c.comentario
          }))
        },
        calificacionPromedio: Math.round(calificacionPromedio * 10) / 10,
        tendencias
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const cargarActividadReciente = async (negocioId) => {
    try {
      const notificaciones = await getNotificacionesNegocio(negocioId);
      const comentarios = await pb.collection('comentarios_negocios').getFullList({
        filter: `negocioId = "${negocioId}"`,
        sort: '-created',
        limit: 10
      });

      const actividad = [
        ...notificaciones.slice(0, 5).map(n => ({
          id: n.id,
          tipo: n.tipo,
          titulo: n.titulo,
          mensaje: n.mensaje,
          fecha: n.fecha,
          leida: n.leida
        })),
        ...comentarios.slice(0, 5).map(c => ({
          id: c.id,
          tipo: 'comentario',
          titulo: '💬 Nuevo comentario',
          mensaje: `${c.usuarioNombre}: "${c.comentario?.substring(0, 50)}..."`,
          fecha: c.created,
          leida: true
        }))
      ];

      actividad.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setActividadReciente(actividad.slice(0, 10));

    } catch (error) {
      console.error('Error cargando actividad:', error);
    }
  };

  // ============================
  // EXPORTAR A EXCEL
  // ============================
  const exportarExcel = () => {
    setExportando(true);
    try {
      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen general
      const resumenData = [
        ['RESUMEN GENERAL DE ESTADÍSTICAS'],
        [''],
        ['Métrica', 'Valor'],
        ['Nombre del negocio', negocio.nombre],
        ['Categoría', negocio.categoria],
        ['Fecha de registro', new Date(negocio.created).toLocaleDateString()],
        [''],
        ['VISITAS'],
        ['Total de visitas', estadisticas.visitas.total],
        ['Visitas hoy', estadisticas.visitas.hoy],
        ['Visitas esta semana', estadisticas.visitas.semana],
        ['Visitas este mes', estadisticas.visitas.mes],
        [''],
        ['CONTACTOS'],
        ['Total de contactos', estadisticas.contactos.total],
        ['Contactos por WhatsApp', estadisticas.contactos.whatsapp],
        ['Llamadas recibidas', estadisticas.contactos.llamadas],
        [''],
        ['OPINIONES'],
        ['Total de opiniones', estadisticas.comentarios.total],
        ['Opiniones positivas (4-5 estrellas)', estadisticas.comentarios.positivos],
        ['Opiniones negativas (1-2 estrellas)', estadisticas.comentarios.negativos],
        ['Calificación promedio', `${estadisticas.calificacionPromedio} / 5`]
      ];

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

      // Hoja 2: Tendencias diarias
      const tendenciasData = [
        ['TENDENCIAS DIARIAS'],
        [''],
        ['Fecha', 'Visitas', 'Contactos']
      ];
      estadisticas.tendencias.forEach(dia => {
        tendenciasData.push([dia.fecha, dia.visitas, dia.contactos]);
      });

      const wsTendencias = XLSX.utils.aoa_to_sheet(tendenciasData);
      XLSX.utils.book_append_sheet(wb, wsTendencias, 'Tendencias');

      // Hoja 3: Opiniones de clientes
      if (estadisticas.comentarios.lista.length > 0) {
        const comentariosData = [
          ['OPINIONES DE CLIENTES'],
          [''],
          ['Fecha', 'Usuario', 'Calificación', 'Comentario']
        ];
        estadisticas.comentarios.lista.forEach(com => {
          comentariosData.push([
            new Date(com.fecha).toLocaleDateString(),
            com.usuario,
            `${com.calificacion} ★`,
            com.comentario || ''
          ]);
        });

        const wsComentarios = XLSX.utils.aoa_to_sheet(comentariosData);
        XLSX.utils.book_append_sheet(wb, wsComentarios, 'Opiniones');
      }

      // Hoja 4: Actividad reciente
      if (actividadReciente.length > 0) {
        const actividadData = [
          ['ACTIVIDAD RECIENTE'],
          [''],
          ['Fecha', 'Tipo', 'Mensaje']
        ];
        actividadReciente.forEach(act => {
          actividadData.push([
            new Date(act.fecha).toLocaleString(),
            act.titulo,
            act.mensaje
          ]);
        });

        const wsActividad = XLSX.utils.aoa_to_sheet(actividadData);
        XLSX.utils.book_append_sheet(wb, wsActividad, 'Actividad');
      }

      // Exportar archivo
      XLSX.writeFile(wb, `estadisticas_${negocio.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      setExportando(false);
    }
  };

  // ============================
  // EXPORTAR A PDF
  // ============================
  const exportarPDF = () => {
    setExportando(true);
    try {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString();

      // Título
      doc.setFontSize(20);
      doc.setTextColor(108, 59, 255);
      doc.text('MarketDesliz - Estadísticas', 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${negocio.nombre}`, 14, 35);
      doc.setFontSize(10);
      doc.text(`Reporte generado: ${fecha}`, 14, 42);

      // Resumen de métricas
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('📊 Resumen de métricas', 14, 55);

      autoTable(doc, {
        startY: 60,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total visitas', estadisticas.visitas.total],
          ['Visitas hoy', estadisticas.visitas.hoy],
          ['Visitas esta semana', estadisticas.visitas.semana],
          ['Total contactos', estadisticas.contactos.total],
          ['Contactos WhatsApp', estadisticas.contactos.whatsapp],
          ['Llamadas', estadisticas.contactos.llamadas],
          ['Opiniones recibidas', estadisticas.comentarios.total],
          ['Calificación promedio', `${estadisticas.calificacionPromedio} / 5`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [108, 59, 255] }
      });

      let yPos = doc.lastAutoTable.finalY + 10;

      // Tendencias
      doc.text('📈 Tendencias diarias', 14, yPos);
      yPos += 5;

      const tendenciasData = estadisticas.tendencias.map(dia => [dia.fecha, dia.visitas, dia.contactos]);
      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Visitas', 'Contactos']],
        body: tendenciasData,
        theme: 'striped'
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Opiniones recientes
      if (estadisticas.comentarios.lista.length > 0) {
        doc.text('💬 Opiniones de clientes', 14, yPos);
        yPos += 5;

        const opinionesData = estadisticas.comentarios.lista.slice(0, 10).map(com => [
          new Date(com.fecha).toLocaleDateString(),
          com.usuario,
          `${com.calificacion} ★`,
          com.comentario?.substring(0, 60) || ''
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Fecha', 'Usuario', 'Calif.', 'Comentario']],
          body: opinionesData,
          theme: 'striped',
          columnStyles: {
            3: { cellWidth: 70 }
          }
        });
      }

      // Guardar PDF
      doc.save(`estadisticas_${negocio.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error exportando a PDF:', error);
      alert('Error al exportar a PDF');
    } finally {
      setExportando(false);
    }
  };

  const formatFecha = (fecha) => {
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
    return date.toLocaleDateString();
  };

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

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
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
        <meta name="description" content="Estadísticas y métricas de tu negocio en MarketDesliz" />
      </Head>

      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          {/* Header con botones de exportación */}
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
                >
                  📥 Exportar reporte
                </button>
                {mostrarExportar && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={exportarExcel}
                      disabled={exportando}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                    >
                      <span>📊</span> Exportar a Excel
                    </button>
                    <button
                      onClick={exportarPDF}
                      disabled={exportando}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                    >
                      <span>📄</span> Exportar a PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {exportando && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Generando reporte...</p>
              </div>
            </div>
          )}

          {/* Resto del contenido igual que antes... */}
          {/* Tarjetas de métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
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

            <div className="bg-white rounded-xl border border-gray-200 p-5">
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

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">⭐</span>
                <span className="text-xs text-gray-400">Promedio</span>
              </div>
              <div className="text-3xl font-bold text-yellow-500">{estadisticas.calificacionPromedio}</div>
              <div className="text-sm text-gray-500 mt-1">Calificación promedio</div>
              <div className="flex mt-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className="text-lg" style={{ color: star <= estadisticas.calificacionPromedio ? '#FFD700' : '#ddd' }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
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

          {/* Gráfico de tendencias */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">📈 Tendencias (últimos 7 días)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriodo('semana')}
                  className={`px-3 py-1 rounded-lg text-sm ${periodo === 'semana' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setPeriodo('mes')}
                  className={`px-3 py-1 rounded-lg text-sm ${periodo === 'mes' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  Mes
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {estadisticas.tendencias.map((dia, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{dia.fecha}</span>
                    <span className="text-gray-500">{dia.visitas} visitas • {dia.contactos} contactos</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, (dia.visitas / Math.max(...estadisticas.tendencias.map(d => d.visitas), 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, (dia.contactos / Math.max(...estadisticas.tendencias.map(d => d.contactos), 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
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
                      <p className="text-xs text-gray-400 mt-1">{formatFecha(act.fecha)}</p>
                    </div>
                    {!act.leida && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
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

      <style jsx>{`
        .loading-spinner {
          width: 40px;
          height: 40px;
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