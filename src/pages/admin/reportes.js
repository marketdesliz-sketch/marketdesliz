// src/pages/admin/reportes.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  Calendar, 
  Download, 
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  PieChart,
  LineChart,
  Activity,
  Clock,
  Wallet,
  ShoppingBag,
  CreditCard,
  UserCheck,
  Loader2
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminReportesPage() {
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [tipoReporte, setTipoReporte] = useState('ventas');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    ventas: [],
    pagos: [],
    clientesNuevos: [],
    tandas: []
  });
  const [filteredData, setFilteredData] = useState([]);
  const [summary, setSummary] = useState({
    totalVentas: 0,
    totalCobrado: 0,
    clientesNuevos: 0,
    tandasActivas: 0,
    promedioVenta: 0,
    pagoPromedio: 0
  });

  useEffect(() => {
    cargarReportes();
  }, [dateRange]);

  const getClientData = async (userId) => {
    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
      return clientRecord;
    } catch (e) {
      return null;
    }
  };

  const cargarReportes = async () => {
    try {
      setLoading(true);

      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      const ventas = await pb.collection('orders').getFullList({
        filter: `created >= "${startDate.toISOString()}" && created <= "${endDate.toISOString()}"`,
        expand: 'userId,productId',
        sort: '-created'
      });

      const pagos = await pb.collection('payments').getFullList({
        filter: `fechaPago >= "${startDate.toISOString()}" && fechaPago <= "${endDate.toISOString()}" && estado = "pagado"`,
        expand: 'userId,orderId',
        sort: '-fechaPago'
      });

      const clientes = await pb.collection('users').getFullList({
        filter: `created >= "${startDate.toISOString()}" && created <= "${endDate.toISOString()}" && role = "cliente"`,
        sort: '-created'
      });

      const tandas = await pb.collection('tandas').getFullList({
        filter: 'estado = "abierta" || estado = "en_curso"'
      });

      const totalVentas = ventas.reduce((sum, v) => sum + (v.totalPagar || 0), 0);
      const totalCobrado = pagos.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);

      setReportData({
        ventas,
        pagos,
        clientesNuevos: clientes,
        tandas
      });

      setSummary({
        totalVentas,
        totalCobrado,
        clientesNuevos: clientes.length,
        tandasActivas: tandas.length,
        promedioVenta: ventas.length > 0 ? totalVentas / ventas.length : 0,
        pagoPromedio: pagos.length > 0 ? totalCobrado / pagos.length : 0
      });

      filtrarDatos('ventas', ventas, pagos, clientes);

    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarDatos = (tipo, ventas, pagos, clientes) => {
    if (tipo === 'ventas') {
      setFilteredData(ventas.map(v => ({
        Fecha: new Date(v.created).toLocaleDateString(),
        Cliente: v.expand?.userId?.nombre || 'N/A',
        Producto: v.expand?.productId?.nombre || 'Producto',
        'Precio Total': `$${v.totalPagar?.toLocaleString()}`,
        Enganche: `$${v.enganche?.toLocaleString() || 0}`,
        Semanal: `$${v.pagoSemanal?.toLocaleString() || 0}`,
        Estado: v.estadoPago || 'pendiente_pago',
        'ID Venta': v.id.slice(-8)
      })));
    } else if (tipo === 'pagos') {
      setFilteredData(pagos.map(p => ({
        Fecha: new Date(p.fechaPago).toLocaleDateString(),
        Cliente: p.expand?.userId?.nombre || 'N/A',
        Monto: `$${(p.montoPagado || p.montoProgramado || 0).toLocaleString()}`,
        Semana: p.numeroSemana !== undefined ? `Semana ${p.numeroSemana}` : 'Pago único',
        Método: p.metodoPago || 'QR',
        'ID Pago': p.id.slice(-8)
      })));
    } else if (tipo === 'clientes') {
      Promise.all(clientes.map(async (c) => {
        let direccion = 'No especificada';
        try {
          const clientData = await getClientData(c.id);
          if (clientData) {
            direccion = `${clientData.direccionCalle || ''} ${clientData.direccionNumero || ''}, ${clientData.direccionColonia || ''}`;
            if (direccion.trim() === '') direccion = 'No especificada';
          }
        } catch (e) { }

        return {
          Fecha: new Date(c.created).toLocaleDateString(),
          Nombre: c.nombre || 'Sin nombre',
          Teléfono: c.telefono || 'No registrado',
          Dirección: direccion,
          Estado: c.activo === true ? 'Activo' : 'Inactivo',
          'ID Cliente': c.id.slice(-8)
        };
      })).then(result => {
        setFilteredData(result);
      });
    }
  };

  const handleTipoChange = (e) => {
    const nuevoTipo = e.target.value;
    setTipoReporte(nuevoTipo);
    filtrarDatos(nuevoTipo, reportData.ventas, reportData.pagos, reportData.clientesNuevos);
  };

  const exportToExcel = () => {
    try {
      setExportando(true);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(filteredData);

      const colWidths = [];
      if (filteredData.length > 0) {
        Object.keys(filteredData[0]).forEach(key => {
          colWidths.push({ wch: Math.max(key.length, 15) });
        });
      }
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, tipoReporte);

      const fileName = `reporte_${tipoReporte}_${dateRange.start}_${dateRange.end}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      setExportando(false);
    }
  };

  const exportToPDF = () => {
    try {
      setExportando(true);

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFontSize(18);
      doc.setTextColor(108, 59, 255);
      doc.text(`Reporte de ${tipoReporte}`, 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Período: ${new Date(dateRange.start).toLocaleDateString()} al ${new Date(dateRange.end).toLocaleDateString()}`, 14, 32);

      doc.setFontSize(10);
      doc.text(`Total registros: ${filteredData.length}`, 14, 42);

      if (tipoReporte === 'ventas') {
        doc.text(`Monto total: $${summary.totalVentas.toLocaleString()}`, 14, 48);
        doc.text(`Promedio: $${summary.promedioVenta.toFixed(2)}`, 14, 54);
      } else if (tipoReporte === 'pagos') {
        doc.text(`Monto total: $${summary.totalCobrado.toLocaleString()}`, 14, 48);
        doc.text(`Promedio: $${summary.pagoPromedio.toFixed(2)}`, 14, 54);
      }

      const headers = Object.keys(filteredData[0] || {});
      const rows = filteredData.map(row => Object.values(row));

      doc.autoTable({
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

      const fileName = `reporte_${tipoReporte}_${dateRange.start}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error exportando a PDF:', error);
      alert('Error al exportar a PDF');
    } finally {
      setExportando(false);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  const tipoReportes = [
    { id: 'ventas', label: 'Ventas', icon: ShoppingBag, color: 'purple' },
    { id: 'pagos', label: 'Pagos', icon: CreditCard, color: 'green' },
    { id: 'clientes', label: 'Clientes nuevos', icon: UserCheck, color: 'blue' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const TipoIcono = tipoReportes.find(t => t.id === tipoReporte)?.icon || BarChart3;

  return (
    <>
      <Head>
        <title>Reportes | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
                <p className="text-sm text-gray-500">Visualiza, analiza y exporta el rendimiento de tu negocio</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de reporte</label>
                <div className="relative">
                  <TipoIcono size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent bg-white appearance-none"
                    value={tipoReporte}
                    onChange={handleTipoChange}
                  >
                    {tipoReportes.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={cargarReportes}
                  className="w-full flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-2.5 rounded-xl font-medium hover:bg-[#5a2ee6] transition"
                >
                  <RefreshCw size={16} /> Actualizar
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <DollarSign size={18} className="text-green-500" />
                <span className="text-xl font-bold text-gray-900">{formatMoney(summary.totalVentas)}</span>
              </div>
              <p className="text-xs text-gray-500">Ventas totales</p>
              <p className="text-xs text-gray-400 mt-1">{reportData.ventas.length} ventas</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Wallet size={18} className="text-blue-500" />
                <span className="text-xl font-bold text-gray-900">{formatMoney(summary.totalCobrado)}</span>
              </div>
              <p className="text-xs text-gray-500">Total cobrado</p>
              <p className="text-xs text-gray-400 mt-1">{reportData.pagos.length} pagos</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Users size={18} className="text-purple-500" />
                <span className="text-xl font-bold text-gray-900">{summary.clientesNuevos}</span>
              </div>
              <p className="text-xs text-gray-500">Clientes nuevos</p>
              <p className="text-xs text-gray-400 mt-1">En el período</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Target size={18} className="text-orange-500" />
                <span className="text-xl font-bold text-gray-900">{summary.tandasActivas}</span>
              </div>
              <p className="text-xs text-gray-500">Tandas activas</p>
              <p className="text-xs text-gray-400 mt-1">En curso</p>
            </div>
          </div>

          {/* Promedios */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Promedio por venta</p>
                  <p className="text-xl font-bold text-gray-900">{formatMoney(summary.promedioVenta)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Promedio por pago</p>
                  <p className="text-xl font-bold text-gray-900">{formatMoney(summary.pagoPromedio)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de exportación */}
          {filteredData.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={exportToExcel}
                disabled={exportando}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {exportando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exportando ? 'Exportando...' : 'Exportar a Excel'}
              </button>
              <button
                onClick={exportToPDF}
                disabled={exportando}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {exportando ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                {exportando ? 'Exportando...' : 'Exportar a PDF'}
              </button>
            </div>
          )}

          {/* Tabla de datos */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <TipoIcono size={16} className="text-[#6C3BFF]" />
                {tipoReporte === 'ventas' && 'Listado de Ventas'}
                {tipoReporte === 'pagos' && 'Listado de Pagos'}
                {tipoReporte === 'clientes' && 'Clientes Nuevos'}
                <span className="text-sm text-gray-400 font-normal ml-2">
                  ({filteredData.length} registros encontrados)
                </span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={32} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">No hay datos para el período seleccionado</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {Object.keys(filteredData[0] || {}).map(key => (
                        <th key={key} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredData.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        {Object.entries(row).map(([key, val], i) => {
                          if (key === 'Estado' && tipoReporte === 'ventas') {
                            const status = String(val).toLowerCase();
                            let badgeClass = '';
                            if (status.includes('completada')) badgeClass = 'bg-green-100 text-green-700';
                            else if (status.includes('activa')) badgeClass = 'bg-blue-100 text-blue-700';
                            else badgeClass = 'bg-yellow-100 text-yellow-700';
                            return (
                              <td key={i} className="px-5 py-3 text-sm">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                                  {val}
                                </span>
                              </td>
                            );
                          }
                          return <td key={i} className="px-5 py-3 text-sm text-gray-600">{val}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}