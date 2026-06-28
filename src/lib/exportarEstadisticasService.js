// src/lib/exportarEstadisticasService.js
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './utils';

/**
 * Exporta estadísticas a Excel
 */
export function exportarEstadisticasExcel({ negocio, estadisticas, actividadReciente, fechaGeneracion }) {
  if (!negocio || !estadisticas) {
    throw new Error('Faltan datos para exportar');
  }

  const wb = XLSX.utils.book_new();
  const fecha = formatDate(fechaGeneracion);

  // Hoja 1: Resumen
  const resumenData = [
    ['RESUMEN GENERAL DE ESTADÍSTICAS'],
    [''],
    ['Métrica', 'Valor'],
    ['Nombre del negocio', negocio.nombre],
    ['Categoría', negocio.categoria || 'No especificada'],
    ['Fecha de registro', formatDate(negocio.created)],
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
    ['Opiniones positivas (4-5★)', estadisticas.comentarios.positivos],
    ['Opiniones negativas (1-2★)', estadisticas.comentarios.negativos],
    ['Calificación promedio', `${estadisticas.calificacionPromedio} / 5`]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

  // Hoja 2: Tendencias
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

  // Hoja 3: Opiniones
  if (estadisticas.comentarios.lista.length > 0) {
    const comentariosData = [
      ['OPINIONES DE CLIENTES'],
      [''],
      ['Fecha', 'Usuario', 'Calificación', 'Comentario']
    ];
    estadisticas.comentarios.lista.forEach(com => {
      comentariosData.push([
        formatDate(com.fecha),
        com.usuario,
        `${com.calificacion} ★`,
        com.comentario || ''
      ]);
    });
    const wsComentarios = XLSX.utils.aoa_to_sheet(comentariosData);
    XLSX.utils.book_append_sheet(wb, wsComentarios, 'Opiniones');
  }

  // Hoja 4: Actividad reciente
  if (actividadReciente && actividadReciente.length > 0) {
    const actividadData = [
      ['ACTIVIDAD RECIENTE'],
      [''],
      ['Fecha', 'Tipo', 'Mensaje']
    ];
    actividadReciente.forEach(act => {
      actividadData.push([
        formatDate(act.fecha),
        act.titulo,
        act.mensaje
      ]);
    });
    const wsActividad = XLSX.utils.aoa_to_sheet(actividadData);
    XLSX.utils.book_append_sheet(wb, wsActividad, 'Actividad');
  }

  const nombreArchivo = `estadisticas_${negocio.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
}

/**
 * Exporta estadísticas a PDF
 */
export function exportarEstadisticasPDF({ negocio, estadisticas, actividadReciente, fechaGeneracion }) {
  if (!negocio || !estadisticas) {
    throw new Error('Faltan datos para exportar');
  }

  const doc = new jsPDF();
  const fecha = formatDate(fechaGeneracion);

  // Título
  doc.setFontSize(20);
  doc.setTextColor(108, 59, 255);
  doc.text('MarketDesliz - Estadísticas', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`${negocio.nombre}`, 14, 35);
  doc.setFontSize(10);
  doc.text(`Reporte generado: ${fecha}`, 14, 42);

  // Resumen
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
      formatDate(com.fecha),
      com.usuario,
      `${com.calificacion} ★`,
      (com.comentario || '').substring(0, 60)
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

  const nombreArchivo = `estadisticas_${negocio.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
}