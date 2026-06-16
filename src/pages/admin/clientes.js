// src/pages/admin/clientes.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Eye, 
  CreditCard, 
  DollarSign,
  ShoppingBag,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Mail,
  TrendingUp,
  ShieldCheck,
  Printer,
  Copy,
  ChevronLeft,
  ChevronRight,
  FileText,
  Star,
  Trash2,
  MoreVertical,
  Download,
  Send
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';
import { getOrCreateTarjeta, getDatosTarjeta } from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showTarjetaModal, setShowTarjetaModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [registrandoNoPago, setRegistrandoNoPago] = useState(false);
  const [tarjetaData, setTarjetaData] = useState(null);
  const [generandoTarjeta, setGenerandoTarjeta] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);

      const records = await pb.collection('users').getFullList({
        sort: '-created'
      });

      const clientesConStats = await Promise.all(
        records.map(async (cliente) => {
          const hoy = new Date();
          const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
          const finHoy = new Date(hoy.setHours(23, 59, 59, 999));

          let kyc = null;
          let orders = [];
          let payments = [];
          let pagosHoy = [];
          let pagosAtrasados = [];
          let tandas = [];

          try {
            const kycResult = await pb.collection('kyc_verifications').getFullList({
              filter: `userId = "${cliente.id}"`,
              sort: '-submittedAt',
              limit: 1
            });
            kyc = kycResult[0] || null;
          } catch (e) {}

          try {
            orders = await pb.collection('orders').getFullList({
              filter: `userId = "${cliente.id}"`,
              expand: 'productId'
            });
          } catch (e) {}

          try {
            payments = await pb.collection('payments').getFullList({
              filter: `userId = "${cliente.id}"`,
              expand: 'orderId'
            });
          } catch (e) {}

          try {
            pagosHoy = await pb.collection('payments').getFullList({
              filter: `userId = "${cliente.id}" && fechaVencimiento >= "${inicioHoy.toISOString()}" && fechaVencimiento <= "${finHoy.toISOString()}" && estado = "pendiente"`
            });
          } catch (e) {}

          try {
            pagosAtrasados = await pb.collection('payments').getFullList({
              filter: `userId = "${cliente.id}" && estado = "pendiente" && fechaVencimiento < "${new Date().toISOString()}"`
            });
          } catch (e) {}

          try {
            tandas = await pb.collection('tanda_members').getFullList({
              filter: `userId = "${cliente.id}" && estado = "activo"`,
              expand: 'tandaId'
            });
          } catch (e) {}

          const totalVentas = orders.reduce((sum, o) => sum + (o.totalPagar || 0), 0);
          const totalPagado = payments.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
          const deudaTotal = payments.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado').reduce((sum, p) => sum + (p.montoProgramado || 0), 0);

          let tieneTarjeta = false;
          let tarjetaId = null;
          try {
            const clientRecord = await pb.collection('clients').getFirstListItem(`userId = "${cliente.id}"`);
            tieneTarjeta = !!clientRecord?.tarjetaId;
            tarjetaId = clientRecord?.id || null;
          } catch (e) {
            tieneTarjeta = false;
          }

          return {
            ...cliente,
            kyc,
            orders,
            payments,
            totalOrders: orders.length,
            totalPayments: payments.length,
            pendingPayments: payments.filter(p => p.estado === 'pendiente').length,
            pagosHoy,
            pagosAtrasados,
            totalVentas,
            totalPagado,
            deudaTotal,
            tandas,
            tieneTarjeta,
            tarjetaId
          };
        })
      );

      setClientes(clientesConStats);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCobrarPago = async (pago) => {
    try {
      await pb.collection('payments').update(pago.id, {
        estado: 'pagado',
        fechaPago: new Date().toISOString(),
        montoPagado: pago.montoProgramado || pago.monto || 0
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

      await cargarClientes();
      setShowPagoModal(false);
    } catch (error) {
      console.error('Error al cobrar:', error);
      alert('Error al procesar el pago');
    }
  };

  const handleRegistrarNoPago = async (pago, motivo) => {
    if (!motivo) {
      motivo = prompt('Motivo del no pago:', 'No se presentó / No tenía dinero');
      if (!motivo) return;
    }

    setRegistrandoNoPago(true);
    try {
      await pb.collection('payments').update(pago.id, {
        estado: 'atrasado',
        notas: motivo
      });

      await cargarClientes();
      setShowPagoModal(false);
    } catch (error) {
      console.error('Error registrando no pago:', error);
      alert('Error al registrar');
    } finally {
      setRegistrandoNoPago(false);
    }
  };

  const handleBlockClient = async (clientId) => {
    if (!confirm('¿Bloquear este cliente? Esto impedirá que realice nuevas compras.')) return;

    try {
      await pb.collection('users').update(clientId, {
        activo: false
      });
      cargarClientes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUnblockClient = async (clientId) => {
    try {
      await pb.collection('users').update(clientId, {
        activo: true
      });
      cargarClientes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generarTarjeta = async (cliente) => {
    setGenerandoTarjeta(true);
    setSelectedCliente(cliente);
    try {
      const tarjeta = await getOrCreateTarjeta(cliente.id);
      const datos = await getDatosTarjeta(tarjeta.token);
      setTarjetaData(datos);
      setShowTarjetaModal(true);
      await cargarClientes();
    } catch (error) {
      console.error('Error generando tarjeta:', error);
      alert('Error al generar la tarjeta');
    } finally {
      setGenerandoTarjeta(false);
    }
  };

  const imprimirTarjeta = () => {
    window.print();
  };

  const getPagosDelDia = (cliente, fecha) => {
    if (!cliente.payments) return [];
    return cliente.payments.filter(pago => {
      const pagoDate = new Date(pago.fechaVencimiento);
      return pagoDate.toDateString() === fecha.toDateString();
    });
  };

  const getDiasDelMes = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const lastDay = new Date(year, month + 1, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status, type = 'user') => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Activo' },
      blocked: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Bloqueado' },
      pagado: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Pagado' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pendiente' },
      atrasado: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle, label: 'Atrasado' },
      aprobado: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Aprobado' },
      rechazado: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rechazado' }
    };
    const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: FileText, label: status };
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon size={10} /> {c.label}
      </span>
    );
  };

  const getKycBadge = (kyc) => {
    if (!kyc) return getStatusBadge('pendiente');
    if (kyc.estado === 'aprobado') return getStatusBadge('aprobado');
    if (kyc.estado === 'rechazado') return getStatusBadge('rechazado');
    return getStatusBadge('pendiente');
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = searchTerm === '' ||
      cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono?.includes(searchTerm) ||
      cliente.id?.includes(searchTerm);

    if (filterStatus === 'todos') return matchesSearch;
    if (filterStatus === 'activos') return matchesSearch && cliente.activo === true;
    if (filterStatus === 'bloqueados') return matchesSearch && cliente.activo === false;
    if (filterStatus === 'morosos') return matchesSearch && cliente.deudaTotal > 0;
    if (filterStatus === 'pagos_hoy') return matchesSearch && cliente.pagosHoy?.length > 0;
    if (filterStatus === 'kyc_pendiente') return matchesSearch && (!cliente.kyc || cliente.kyc.estado === 'pendiente');
    if (filterStatus === 'kyc_aprobado') return matchesSearch && cliente.kyc?.estado === 'aprobado';
    return matchesSearch;
  });

  const estadisticas = {
    total: clientes.length,
    activos: clientes.filter(c => c.activo === true).length,
    conDeuda: clientes.filter(c => c.deudaTotal > 0).length,
    pagosHoy: clientes.reduce((sum, c) => sum + (c.pagosHoy?.length || 0), 0),
    conTarjeta: clientes.filter(c => c.tieneTarjeta).length,
    deudaTotal: clientes.reduce((sum, c) => sum + c.deudaTotal, 0)
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
        <title>Gestión de Clientes | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
                  <p className="text-sm text-gray-500">Administra todos los clientes registrados</p>
                </div>
              </div>
              <Link
                href="/admin/clientes/nuevo"
                className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition shadow-sm"
              >
                <UserPlus size={16} /> Nuevo cliente
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Users size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total clientes</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.activos}</span>
              </div>
              <p className="text-xs text-gray-500">Activos</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <AlertCircle size={18} className="text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.conDeuda}</span>
              </div>
              <p className="text-xs text-gray-500">Con deuda</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Calendar size={18} className="text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.pagosHoy}</span>
              </div>
              <p className="text-xs text-gray-500">Pagos hoy</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CreditCard size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.conTarjeta}</span>
              </div>
              <p className="text-xs text-gray-500">Con tarjeta</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <DollarSign size={18} className="text-red-500" />
                <span className="text-xl font-bold text-gray-900">${estadisticas.deudaTotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500">Deuda total</p>
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
                  placeholder="Buscar por nombre, teléfono o ID..."
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
                  <option value="todos">Todos los clientes</option>
                  <option value="activos">Activos</option>
                  <option value="bloqueados">Bloqueados</option>
                  <option value="morosos">Con deuda</option>
                  <option value="pagos_hoy">Pagos pendientes hoy</option>
                  <option value="kyc_pendiente">KYC Pendiente</option>
                  <option value="kyc_aprobado">KYC Aprobado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Client List */}
          {filteredClientes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No se encontraron clientes</h3>
              <p className="text-sm text-gray-400">Intenta con otros filtros de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClientes.map(cliente => (
                <div key={cliente.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{cliente.nombre || 'Sin nombre'}</h3>
                          {getKycBadge(cliente.kyc)}
                          {cliente.tieneTarjeta && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              <CreditCard size={10} /> Tarjeta
                            </span>
                          )}
                          {getStatusBadge(cliente.activo === true ? 'active' : 'blocked')}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Phone size={12} /> {cliente.telefono || 'No registrado'}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(cliente.created).toLocaleDateString()}</span>
                          {cliente.email && <span className="flex items-center gap-1"><Mail size={12} /> {cliente.email}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Stats */}
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-xl font-bold text-gray-900">{cliente.totalOrders}</p>
                        <p className="text-xs text-gray-500">Compras</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-xl font-bold text-gray-900">${cliente.totalVentas.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Gastado</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-xl font-bold text-green-600">${cliente.totalPagado.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Pagado</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className={`text-xl font-bold ${cliente.deudaTotal > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          ${cliente.deudaTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Deuda</p>
                      </div>
                    </div>

                    {/* Payment Alerts */}
                    {cliente.pagosHoy && cliente.pagosHoy.length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                        <p className="text-sm font-medium text-yellow-800 flex items-center gap-1 mb-2">
                          <Clock size={14} /> Pagos pendientes hoy ({cliente.pagosHoy.length})
                        </p>
                        <div className="space-y-2">
                          {cliente.pagosHoy.map(pago => (
                            <div key={pago.id} className="flex justify-between items-center py-1 border-b border-yellow-100 last:border-0">
                              <span className="text-sm">${pago.montoProgramado || pago.monto || 0} - {pago.numeroSemana ? `Semana ${pago.numeroSemana}` : 'Pago regular'}</span>
                              <button
                                onClick={() => {
                                  setSelectedPago(pago);
                                  setSelectedCliente(cliente);
                                  setShowPagoModal(true);
                                }}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition"
                              >
                                Cobrar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cliente.pagosAtrasados && cliente.pagosAtrasados.length > 0 && (
                      <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-sm font-medium text-red-800 flex items-center gap-1">
                          <AlertCircle size={14} /> Pagos atrasados ({cliente.pagosAtrasados.length})
                        </p>
                        <p className="text-xs text-red-600 mt-1">Total adeudo: ${cliente.deudaTotal.toLocaleString()}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
                      >
                        <Eye size={14} /> Ver detalles
                      </button>
                      <button
                        onClick={() => generarTarjeta(cliente)}
                        disabled={generandoTarjeta}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-600 transition disabled:opacity-50"
                      >
                        <CreditCard size={14} /> {cliente.tieneTarjeta ? 'Ver tarjeta' : 'Generar tarjeta'}
                      </button>
                      {cliente.activo === true ? (
                        <button
                          onClick={() => handleBlockClient(cliente.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition"
                        >
                          <XCircle size={14} /> Bloquear
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblockClient(cliente.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition"
                        >
                          <CheckCircle size={14} /> Activar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de detalles con calendario */}
        {showModal && selectedCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-[#6C3BFF]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Detalles del Cliente</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>
              
              <div className="p-6">
                {/* Información básica */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 mb-6 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Nombre completo</p>
                      <p className="font-semibold text-gray-900">{selectedCliente.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estado</p>
                      {getStatusBadge(selectedCliente.activo === true ? 'active' : 'blocked')}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="text-gray-900">{selectedCliente.telefono || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Correo electrónico</p>
                      <p className="text-gray-900">{selectedCliente.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deuda total</p>
                      <p className="text-xl font-bold text-red-600">${selectedCliente.deudaTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total gastado</p>
                      <p className="text-xl font-bold text-green-600">${selectedCliente.totalVentas.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Calendario de pagos */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Calendar size={16} /> Calendario de Pagos</h3>
                  <div className="flex justify-between items-center mb-3">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"><ChevronLeft size={16} /></button>
                    <span className="font-medium text-gray-700">{currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"><ChevronRight size={16} /></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
                    ))}
                    {getDiasDelMes(currentMonth).map((dia, index) => {
                      const pagosDelDia = getPagosDelDia(selectedCliente, dia);
                      const esHoy = dia.toDateString() === new Date().toDateString();
                      return (
                        <div key={index} className={`border rounded-xl p-1 min-h-[65px] ${esHoy ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}>
                          <div className={`text-xs font-medium text-center p-1 ${esHoy ? 'text-blue-600' : 'text-gray-600'}`}>{dia.getDate()}</div>
                          {pagosDelDia.map(pago => (
                            <div key={pago.id} onClick={() => { setSelectedPago(pago); setShowPagoModal(true); }} className={`text-xs p-1 mt-1 rounded-lg text-center cursor-pointer transition ${pago.estado === 'pagado' ? 'bg-green-100 text-green-700' : pago.estado === 'atrasado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700 hover:opacity-80'}`}>
                              ${pago.montoProgramado || pago.monto || 0}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Historial de pagos */}
                {selectedCliente.payments && selectedCliente.payments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><DollarSign size={16} /> Historial de Pagos</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedCliente.payments.sort((a, b) => new Date(b.fechaVencimiento) - new Date(a.fechaVencimiento)).map(pago => (
                        <div key={pago.id} className="border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <p className="font-bold text-gray-900">${pago.montoProgramado || pago.monto || 0}</p>
                              <p className="text-xs text-gray-500">Vence: {formatFecha(pago.fechaVencimiento)}</p>
                              {pago.fechaPago && <p className="text-xs text-green-600">Pagado: {formatFecha(pago.fechaPago)}</p>}
                              {pago.notas && <p className="text-xs text-gray-500 mt-1">Nota: {pago.notas}</p>}
                            </div>
                            {getStatusBadge(pago.estado)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tandas activas */}
                {selectedCliente.tandas && selectedCliente.tandas.length > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Star size={16} /> Tandas Activas</h3>
                    <div className="space-y-2">
                      {selectedCliente.tandas.map(tanda => (
                        <div key={tanda.id} className="border border-gray-100 rounded-xl p-3">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                              <p className="font-bold text-gray-900">{tanda.expand?.tandaId?.nombre || 'Tanda'}</p>
                              <p className="text-xs text-gray-500">Posición: {tanda.posicion}</p>
                              <p className="text-xs text-gray-500">Monto: ${tanda.expand?.tandaId?.monto?.toLocaleString()}</p>
                            </div>
                            {getStatusBadge(tanda.estado)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
                <button onClick={() => setShowModal(false)} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de cobro */}
        {showPagoModal && selectedPago && selectedCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPagoModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Registrar pago</h3>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-semibold text-gray-900 mb-3">{selectedCliente.nombre}</p>
                  <p className="text-xs text-gray-500">Monto</p>
                  <p className="text-2xl font-bold text-[#6C3BFF] mb-3">${selectedPago.montoProgramado || selectedPago.monto || 0}</p>
                  <p className="text-xs text-gray-500">Vencimiento</p>
                  <p className="text-gray-900">{formatFecha(selectedPago.fechaVencimiento)}</p>
                  {selectedPago.numeroSemana !== undefined && (
                    <><p className="text-xs text-gray-500 mt-2">Semana</p><p>Semana {selectedPago.numeroSemana}</p></>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button onClick={() => handleCobrarPago(selectedPago)} disabled={registrandoNoPago} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50">Sí, pagó</button>
                  <button onClick={() => handleRegistrarNoPago(selectedPago)} disabled={registrandoNoPago} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50">No pagó</button>
                </div>
                <button onClick={() => setShowPagoModal(false)} className="w-full mt-3 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de tarjeta */}
        {showTarjetaModal && tarjetaData && selectedCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTarjetaModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><CreditCard size={18} className="text-[#6C3BFF]" /> Tarjeta de {selectedCliente.nombre}</h3>
                  <p className="text-xs text-gray-500">ID: {tarjetaData.idCliente}</p>
                </div>
                <button onClick={() => setShowTarjetaModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>
              <div className="p-6 space-y-6">
                <TarjetaCliente datos={tarjetaData} tipo="frente" />
                <TarjetaCliente datos={tarjetaData} tipo="reverso" />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={imprimirTarjeta} className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition"><Printer size={16} /> Imprimir</button>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/cliente/${tarjetaData.token}`); alert('✅ Enlace copiado'); }} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"><Copy size={16} /> Copiar enlace</button>
                  <button onClick={() => { window.open(`${window.location.origin}/cliente/${tarjetaData.token}`, '_blank'); }} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition"><Send size={16} /> Compartir</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}