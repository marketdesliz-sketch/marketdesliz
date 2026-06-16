// src/pages/admin/pagos.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Calendar,
  Phone,
  User,
  Package,
  TrendingUp,
  Wallet,
  FileText,
  Eye,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Printer
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';
import * as XLSX from 'xlsx';

export default function AdminPagosPage() {
  const router = useRouter();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [selectedPago, setSelectedPago] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/admin/login');
      return;
    }
    const user = pb.authStore.model;
    if (user?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    try {
      setLoading(true);
      const pagosData = await pb.collection('payments').getFullList({
        sort: '-fechaVencimiento',
        expand: 'userId,orderId'
      });

      const pagosConInfo = pagosData.map(pago => ({
        ...pago,
        clienteNombre: pago.expand?.userId?.nombre || 'Cliente',
        clienteTelefono: pago.expand?.userId?.telefono || 'N/A',
        productoNombre: pago.expand?.orderId?.expand?.productId?.nombre || pago.expand?.orderId?.productName || 'Producto'
      }));

      setPagos(pagosConInfo);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarPago = async (pago) => {
    if (!confirm(`¿Confirmar pago de $${(pago.montoProgramado || pago.monto || 0).toLocaleString()} para ${pago.clienteNombre}?`)) return;

    setRegistrando(true);
    try {
      await pb.collection('payments').update(pago.id, {
        estado: 'pagado',
        montoPagado: pago.montoProgramado || pago.monto || 0,
        fechaPago: new Date().toISOString()
      });

      if (pago.orderId) {
        const orden = await pb.collection('orders').getOne(pago.orderId);
        const nuevoSaldo = (orden.saldoRestante || 0) - (pago.montoProgramado || pago.monto || 0);
        
        await pb.collection('orders').update(pago.orderId, {
          saldoRestante: nuevoSaldo > 0 ? nuevoSaldo : 0,
          pagosRealizados: (orden.pagosRealizados || 0) + 1,
          estadoPago: nuevoSaldo <= 0 ? 'completada' : orden.estadoPago
        });
      }

      await cargarPagos();
      setShowModal(false);
      setSelectedPago(null);
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('Error al procesar el pago');
    } finally {
      setRegistrando(false);
    }
  };

  const handleRegistrarNoPago = async (pago, motivo) => {
    if (!motivo) {
      motivo = prompt('Motivo del no pago:', 'No se presentó / No tenía dinero');
      if (!motivo) return;
    }

    setRegistrando(true);
    try {
      await pb.collection('payments').update(pago.id, {
        estado: 'atrasado',
        notasAdmin: motivo
      });

      await cargarPagos();
      setShowModal(false);
      setSelectedPago(null);
    } catch (error) {
      console.error('Error registrando no pago:', error);
      alert('Error al registrar');
    } finally {
      setRegistrando(false);
    }
  };

  const exportarExcel = () => {
    const data = pagosFiltrados.map(p => ({
      'Cliente': p.clienteNombre,
      'Teléfono': p.clienteTelefono,
      'Producto': p.productoNombre,
      'Monto': `$${(p.montoProgramado || p.monto || 0).toLocaleString()}`,
      'Semana': p.numeroSemana !== undefined ? `Semana ${p.numeroSemana}` : 'Pago único',
      'Vencimiento': new Date(p.fechaVencimiento).toLocaleDateString(),
      'Fecha Pago': p.fechaPago ? new Date(p.fechaPago).toLocaleDateString() : 'Pendiente',
      'Estado': p.estado === 'pagado' ? 'Pagado' : p.estado === 'pendiente' ? 'Pendiente' : 'Atrasado',
      'Método': p.metodoPago || 'QR'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');
    XLSX.writeFile(workbook, `pagos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getEstadoConfig = (estado) => {
    const config = {
      pagado: { icono: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', label: 'Pagado' },
      pendiente: { icono: Clock, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      atrasado: { icono: AlertCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Atrasado' }
    };
    return config[estado] || config.pendiente;
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const pagosFiltrados = pagos.filter(p => {
    const matchesSearch = searchTerm === '' ||
      p.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clienteTelefono?.includes(searchTerm);
    
    if (filterStatus === 'todos') return matchesSearch;
    return matchesSearch && p.estado === filterStatus;
  });

  const stats = {
    total: pagos.length,
    pagados: pagos.filter(p => p.estado === 'pagado').length,
    pendientes: pagos.filter(p => p.estado === 'pendiente').length,
    atrasados: pagos.filter(p => p.estado === 'atrasado').length,
    montoTotal: pagos.reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0),
    montoPagado: pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0),
    montoPendiente: pagos.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado').reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0)
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

  return (
    <>
      <Head>
        <title>Gestión de Pagos | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
                  <p className="text-sm text-gray-500">Administra los pagos de los clientes</p>
                </div>
              </div>
              <button
                onClick={exportarExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition shadow-sm"
              >
                <Download size={16} /> Exportar Excel
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Wallet size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total pagos</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">{stats.pagados}</span>
              </div>
              <p className="text-xs text-gray-500">Pagados</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Clock size={18} className="text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">{stats.pendientes}</span>
              </div>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <AlertCircle size={18} className="text-red-500" />
                <span className="text-2xl font-bold text-red-600">{stats.atrasados}</span>
              </div>
              <p className="text-xs text-gray-500">Atrasados</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp size={18} className="text-blue-500" />
                <span className="text-lg font-bold text-gray-900">{formatMoney(stats.montoTotal)}</span>
              </div>
              <p className="text-xs text-gray-500">Monto total</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <DollarSign size={18} className="text-orange-500" />
                <span className="text-lg font-bold text-orange-600">{formatMoney(stats.montoPendiente)}</span>
              </div>
              <p className="text-xs text-gray-500">Por cobrar</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                  placeholder="Buscar por cliente o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-[#6C3BFF]"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="pagado">Pagados</option>
                  <option value="atrasado">Atrasados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de pagos */}
          {pagosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay pagos registrados</h3>
              <p className="text-sm text-gray-400">Los pagos aparecerán aquí cuando los clientes realicen compras</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Semana</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagosFiltrados.map((pago, index) => {
                      const estadoConfig = getEstadoConfig(pago.estado);
                      const EstadoIcono = estadoConfig.icono;
                      const isPendiente = pago.estado === 'pendiente';
                      
                      return (
                        <tr key={pago.id} className={`hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-5 py-3">
                            <span className="font-medium text-gray-900 flex items-center gap-1">
                              <User size={12} className="text-gray-400" /> {pago.clienteNombre}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone size={12} /> {pago.clienteTelefono}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Package size={12} /> {pago.productoNombre}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-bold text-[#6C3BFF]">{formatMoney(pago.montoProgramado || pago.monto || 0)}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500">
                              {pago.numeroSemana !== undefined ? `Semana ${pago.numeroSemana}` : 'Pago único'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar size={12} /> {formatFecha(pago.fechaVencimiento)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                              <EstadoIcono size={10} /> {estadoConfig.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {isPendiente ? (
                              <button
                                onClick={() => {
                                  setSelectedPago(pago);
                                  setShowModal(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition"
                              >
                                <DollarSign size={12} /> Cobrar
                              </button>
                            ) : pago.estado === 'pagado' ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle size={10} /> {pago.fechaPago ? formatFecha(pago.fechaPago) : '-'}
                              </span>
                            ) : (
                              <span className="text-xs text-red-600 flex items-center gap-1">
                                <XCircle size={10} /> Pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumen de pagos pendientes */}
          {stats.pendientes > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">Pagos pendientes</p>
                  <p className="text-sm text-yellow-600">
                    Tienes <strong>{stats.pendientes}</strong> pagos pendientes por cobrar por un monto total de <strong>{formatMoney(stats.montoPendiente)}</strong>.
                    {stats.atrasados > 0 && ` De estos, ${stats.atrasados} están atrasados.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>

      {/* Modal de cobro */}
      {showModal && selectedPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Registrar pago</h3>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="font-medium text-gray-900">{selectedPago.clienteNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monto:</span>
                    <span className="text-2xl font-bold text-[#6C3BFF]">{formatMoney(selectedPago.montoProgramado || selectedPago.monto || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vencimiento:</span>
                    <span>{formatFecha(selectedPago.fechaVencimiento)}</span>
                  </div>
                  {selectedPago.numeroSemana !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Semana:</span>
                      <span>Semana {selectedPago.numeroSemana}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRegistrarPago(selectedPago)}
                  disabled={registrando}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Sí, pagó
                </button>
                <button
                  onClick={() => handleRegistrarNoPago(selectedPago)}
                  disabled={registrando}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50"
                >
                  <XCircle size={16} /> No pagó
                </button>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-3 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}