// src/lib/exportarReportesService.js
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney, formatDate } from './utils';

/**
 * Exporta datos a Excel
 */
export function exportToExcel(data, tipo, startDate, endDate) {
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        const colWidths = [];
        if (data.length > 0) {
            Object.keys(data[0]).forEach(key => {
                colWidths.push({ wch: Math.max(key.length, 15) });
            });
        }
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, tipo);

        const fileName = `reporte_${tipo}_${startDate}_${endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
        return true;
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        throw error;
    }
}

/**
 * Exporta datos a PDF
 */
export function exportToPDF(data, tipo, startDate, endDate, summary) {
    try {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const fechaInicio = formatDate(startDate);
        const fechaFin = formatDate(endDate);

        doc.setFontSize(18);
        doc.setTextColor(108, 59, 255);
        doc.text(`Reporte de ${tipo}`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Período: ${fechaInicio} al ${fechaFin}`, 14, 32);

        doc.setFontSize(10);
        doc.text(`Total registros: ${data.length}`, 14, 42);

        if (tipo === 'ventas' && summary) {
            doc.text(`Monto total: ${formatMoney(summary.totalVentas)}`, 14, 48);
            doc.text(`Promedio: ${formatMoney(summary.promedioVenta)}`, 14, 54);
        } else if (tipo === 'pagos' && summary) {
            doc.text(`Monto total: ${formatMoney(summary.totalCobrado)}`, 14, 48);
            doc.text(`Promedio: ${formatMoney(summary.pagoPromedio)}`, 14, 54);
        }

        const headers = Object.keys(data[0] || {});
        const rows = data.map(row => Object.values(row));

        autoTable(doc, {
            startY: 60,
            head: [headers],
            body: rows,
            theme: 'striped',
            headStyles: {
                fillColor: [108, 59, 255],
                textColor: [255, 255, 255],
                fontSize: 9,
                halign: 'center'
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                'Precio Total': { halign: 'right' },
                'Monto': { halign: 'right' },
                'Enganche': { halign: 'right' },
                'Semanal': { halign: 'right' }
            }
        });

        const fileName = `reporte_${tipo}_${startDate}.pdf`;
        doc.save(fileName);
        return true;
    } catch (error) {
        console.error('Error exportando a PDF:', error);
        throw error;
    }
}