// src/pages/admin/clientes.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Users, UserPlus, Search, Filter, Eye, CreditCard, DollarSign,
  ShoppingBag, Calendar, Clock, AlertCircle, CheckCircle, XCircle,
  Phone, MapPin, Mail, TrendingUp, ShieldCheck, Printer, Copy,
  ChevronLeft, ChevronRight, FileText, Star, Trash2, MoreVertical,
  Download, Send, RefreshCw
} from 'lucide-react';
import AdminLayoutMinimal from '../../layouts/AdminLayoutMinimal';
import pb from '../../lib/pocketbase';
import { getOrCreateTarjeta, getDatosTarjeta } from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';
import { getClients, getClientesEstadisticas, registrarCobro, registrarNoPago } from '../../lib/clientsService';
import { formatMoney } from '../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

const ITEMS_PER_PAGE = 10;

export default function AdminClientesPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const { page = 1, search = '', status = 'todos', sort = '-created' } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activos: 0,
    conDeuda: 0,
    pagosHoy: 0,
    conTarjeta: 0,
    deudaTotal: 0
  });

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showTarjetaModal, setShowTarjetaModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [registrandoNoPago, setRegistrandoNoPago] = useState(false);
  const [tarjetaData, setTarjetaData] = useState(null);
  const [generandoTarjeta, setGenerandoTarjeta] = useState(false);

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      if (!showRefreshing) {
        const stats = await getClientesEstadisticas();
        setEstadisticas(stats);
      }

      const result = await getClients({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: search || '',
        status: status || 'todos',
        sort: sort || '-created'
      });

      setClientes(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError('No se pudieron cargar los clientes. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, search, status, sort]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Actualizar URL ──────────────────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      search: search || undefined,
      status: status !== 'todos' ? status : undefined,
      sort: sort !== '-created' ? sort : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/clientes', query }, undefined, { shallow: true });
  }, [currentPage, search, status, sort, router]);

  // ─── Manejadores ──────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    actualizarURL({ search: term, page: 1 });
  };

  const handleFilterChange = (newStatus) => {
    actualizarURL({ status: newStatus, page: 1 });
  };

  const handleSortChange = (newSort) => {
    actualizarURL({ sort: newSort, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    actualizarURL({ page: newPage });
  };

  // ─── Acciones ─────────────────────────────────────────────────────────
  const handleCobrarPago = async (pago) => {
    const monto = pago.montoProgramado || pago.monto || 0;
    if (!confirm(`¿Confirmar cobro de $${monto.toLocaleString()}?`)) return;
    try {
      await registrarCobro(pago.id, monto, pago.orderId);
      await cargarDatos(true);
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
      await registrarNoPago(pago.id, motivo);
      await cargarDatos(true);
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
      await pb.collection('users').update(clientId, { activo: false });
      cargarDatos(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUnblockClient = async (clientId) => {
    try {
      await pb.collection('users').update(clientId, { activo: true });
      cargarDatos(true);
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
      await cargarDatos(true);
    } catch (error) {
      console.error('Error generando tarjeta:', error);
      alert('Error al generar la tarjeta');
    } finally {
      setGenerandoTarjeta(false);
    }
  };

  const imprimirTarjeta = () => window.print();

  // ─── Utilidades ────────────────────────────────────────────────────────
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

  // ─── Loading ──────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <AdminLayoutMinimal>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayoutMinimal>
    );
  }

  return (
    <>
      <Head>
        <title>Gestión de Clientes | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ─── Header ───────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Users size={22} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
                  <p className="text-sm text-muted-foreground">Administra todos los clientes registrados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => cargarDatos(true)}
                  disabled={refreshing}
                  className="rounded-2xl h-10 border-gray-200 text-gray-600"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Link href="/admin/clientes/nuevo">
                  <Button className="rounded-2xl h-10 bg-primary hover:bg-primary/90 font-semibold">
                    <UserPlus className="w-4 h-4 mr-2" /> Nuevo cliente
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Stats Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Users size={18} className="text-primary" />
                  <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">Total clientes</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle size={18} className="text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">{estadisticas.activos}</span>
                </div>
                <p className="text-xs text-muted-foreground">Activos</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <AlertCircle size={18} className="text-red-500" />
                  <span className="text-2xl font-bold text-gray-900">{estadisticas.conDeuda}</span>
                </div>
                <p className="text-xs text-muted-foreground">Con deuda</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Calendar size={18} className="text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">{estadisticas.pagosHoy}</span>
                </div>
                <p className="text-xs text-muted-foreground">Pagos hoy</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <CreditCard size={18} className="text-primary" />
                  <span className="text-2xl font-bold text-gray-900">{estadisticas.conTarjeta}</span>
                </div>
                <p className="text-xs text-muted-foreground">Con tarjeta</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <DollarSign size={18} className="text-red-500" />
                  <span className="text-xl font-bold text-gray-900">{formatMoney(estadisticas.deudaTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Deuda total</p>
              </CardContent>
            </Card>
          </div>

          {/* ─── Search & Filters ─────────────────────────────────── */}
          <Card className="border-none shadow-sm rounded-2xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                    placeholder="Buscar por nombre, teléfono o ID..."
                  />
                </form>
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={status}
                    onChange={(e) => handleFilterChange(e.target.value)}
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
                <div className="relative">
                  <select
                    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="-created">Más recientes</option>
                    <option value="created">Más antiguos</option>
                    <option value="nombre">Por nombre</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Error ────────────────────────────────────────────── */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => cargarDatos()}
                className="ml-auto text-sm font-medium hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* ─── Lista de clientes ───────────────────────────────── */}
          {clientes.length === 0 && !loading ? (
            <Card className="border-none shadow-sm rounded-2xl p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No se encontraron clientes</h3>
              <p className="text-sm text-muted-foreground">Intenta con otros filtros de búsqueda</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {clientes.map((cliente) => (
                <Card
                  key={cliente.id}
                  className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header card */}
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{cliente.nombre || 'Sin nombre'}</h3>
                          {getKycBadge({ estado: cliente.kycEstado })}
                          {cliente.tieneTarjeta && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              <CreditCard size={10} /> Tarjeta
                            </span>
                          )}
                          {getStatusBadge(cliente.activo === true ? 'active' : 'blocked')}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone size={12} /> {cliente.telefono || 'No registrado'}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(cliente.created).toLocaleDateString()}</span>
                          {cliente.email && <span className="flex items-center gap-1"><Mail size={12} /> {cliente.email}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats por cliente */}
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-2xl">
                        <p className="text-xl font-bold text-gray-900">{cliente.totalOrders}</p>
                        <p className="text-xs text-muted-foreground">Compras</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-2xl">
                        <p className="text-xl font-bold text-gray-900">{formatMoney(cliente.totalVentas)}</p>
                        <p className="text-xs text-muted-foreground">Gastado</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-2xl">
                        <p className="text-xl font-bold text-green-600">{formatMoney(cliente.totalPagado)}</p>
                        <p className="text-xs text-muted-foreground">Pagado</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-2xl">
                        <p className={`text-xl font-bold ${cliente.deudaTotal > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatMoney(cliente.deudaTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">Deuda</p>
                      </div>
                    </div>

                    {/* Alertas de pago */}
                    {cliente.pagosHoy > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <p className="text-sm font-medium text-yellow-800 flex items-center gap-1 mb-2">
                          <Clock size={14} /> Pagos pendientes hoy ({cliente.pagosHoy})
                        </p>
                        <p className="text-xs text-yellow-700">Hay pagos programados para hoy</p>
                      </div>
                    )}

                    {cliente.pagosAtrasados > 0 && (
                      <div className="mb-4 p-3 bg-red-50 rounded-2xl border border-red-100">
                        <p className="text-sm font-medium text-red-800 flex items-center gap-1">
                          <AlertCircle size={14} /> Pagos atrasados ({cliente.pagosAtrasados})
                        </p>
                        <p className="text-xs text-red-600 mt-1">Total adeudo: {formatMoney(cliente.deudaTotal)}</p>
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowModal(true);
                        }}
                        className="flex-1 rounded-2xl h-11 bg-primary hover:bg-primary/90 font-semibold"
                      >
                        <Eye className="w-4 h-4 mr-2" /> Ver detalles
                      </Button>
                      <Button
                        onClick={() => generarTarjeta(cliente)}
                        disabled={generandoTarjeta}
                        className="flex-1 rounded-2xl h-11 bg-purple-500 hover:bg-purple-600 font-semibold"
                      >
                        <CreditCard className="w-4 h-4 mr-2" /> {cliente.tieneTarjeta ? 'Ver tarjeta' : 'Generar tarjeta'}
                      </Button>
                      {cliente.activo === true ? (
                        <Button
                          onClick={() => handleBlockClient(cliente.id)}
                          className="flex-1 rounded-2xl h-11 bg-red-500 hover:bg-red-600 font-semibold"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Bloquear
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUnblockClient(cliente.id)}
                          className="flex-1 rounded-2xl h-11 bg-green-500 hover:bg-green-600 font-semibold"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Activar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ─── Paginación ──────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
              <span className="text-sm text-muted-foreground">
                Mostrando {clientes.length} de {totalItems} clientes
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-2xl h-10 border-gray-200 text-gray-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-2xl h-10 border-gray-200 text-gray-600 disabled:opacity-40"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Modal detalles cliente ──────────────────────────── */}
        {showModal && selectedCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users size={16} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Detalles del Cliente</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 mb-6 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre completo</p>
                      <p className="font-semibold text-gray-900">{selectedCliente.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      {getStatusBadge(selectedCliente.activo === true ? 'active' : 'blocked')}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="text-gray-900">{selectedCliente.telefono || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Correo electrónico</p>
                      <p className="text-gray-900">{selectedCliente.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deuda total</p>
                      <p className="text-xl font-bold text-red-600">{formatMoney(selectedCliente.deudaTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total gastado</p>
                      <p className="text-xl font-bold text-green-600">{formatMoney(selectedCliente.totalVentas)}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-primary" /> Calendario de Pagos
                  </h3>
                  <div className="flex justify-between items-center mb-3">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-medium text-gray-700">
                      {currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                    ))}
                    {getDiasDelMes(currentMonth).map((dia, index) => {
                      const esHoy = dia.toDateString() === new Date().toDateString();
                      return (
                        <div key={index} className={`border rounded-xl p-1 min-h-[65px] ${esHoy ? 'bg-primary/5 border-primary/20' : 'border-gray-100'}`}>
                          <div className={`text-xs font-medium text-center p-1 ${esHoy ? 'text-primary' : 'text-gray-600'}`}>{dia.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-primary" /> Resumen de pagos
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-2xl">
                      <span className="text-sm text-gray-600">Total pagado</span>
                      <span className="font-bold text-green-600">{formatMoney(selectedCliente.totalPagado)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-2xl">
                      <span className="text-sm text-gray-600">Deuda actual</span>
                      <span className="font-bold text-red-600">{formatMoney(selectedCliente.deudaTotal)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-2xl">
                      <span className="text-sm text-gray-600">Pagos pendientes</span>
                      <span className="font-bold text-yellow-600">{selectedCliente.pendingPayments}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-2xl">
                      <span className="text-sm text-gray-600">Pagos atrasados</span>
                      <span className="font-bold text-red-600">{selectedCliente.pagosAtrasados}</span>
                    </div>
                  </div>
                </div>

                {selectedCliente.tandasActivas > 0 && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Star size={16} className="text-primary" /> Tandas activas ({selectedCliente.tandasActivas})
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      El cliente participa en {selectedCliente.tandasActivas} tanda(s) activa(s).
                    </p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-2xl h-11 border-gray-200 text-gray-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Modal cobro ─────────────────────────────────────── */}
        {showPagoModal && selectedPago && selectedCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPagoModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Registrar pago</h3>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-semibold text-gray-900 mb-3">{selectedCliente.nombre}</p>
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="text-2xl font-bold text-primary mb-3">
                    {formatMoney(selectedPago.montoProgramado || selectedPago.monto || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Vencimiento</p>
                  <p className="text-gray-900">{formatFecha(selectedPago.fechaVencimiento)}</p>
                  {selectedPago.numeroSemana !== undefined && (
                    <>
                      <p className="text-xs text-muted-foreground mt-2">Semana</p>
                      <p>Semana {selectedPago.numeroSemana}</p>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleCobrarPago(selectedPago)}
                    disabled={registrandoNoPago}
                    className="flex-1 rounded-2xl h-12 bg-green-500 hover:bg-green-600 font-semibold"
                  >
                    Sí, pagó
                  </Button>
                  <Button
                    onClick={() => handleRegistrarNoPago(selectedPago)}
                    disabled={registrandoNoPago}
                    className="flex-1 rounded-2xl h-12 bg-red-500 hover:bg-red-600 font-semibold"
                  >
                    No pagó
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPagoModal(false)}
                  className="w-full mt-3 rounded-2xl h-11 border-gray-200 text-gray-700"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Modal tarjeta ───────────────────────────────────── */}
        {showTarjetaModal && tarjetaData && selectedCliente && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTarjetaModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard size={18} className="text-primary" /> Tarjeta de {selectedCliente.nombre}
                  </h3>
                  <p className="text-xs text-muted-foreground">ID: {tarjetaData.idCliente}</p>
                </div>
                <button onClick={() => setShowTarjetaModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>
              <div className="p-6 space-y-6">
                <TarjetaCliente datos={tarjetaData} tipo="frente" />
                <TarjetaCliente datos={tarjetaData} tipo="reverso" />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={imprimirTarjeta}
                    className="flex-1 rounded-2xl h-12 bg-primary hover:bg-primary/90 font-bold"
                  >
                    <Printer className="w-4 h-4 mr-2" /> Imprimir
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/cliente/${tarjetaData.token}`);
                      alert('Enlace copiado');
                    }}
                    variant="outline"
                    className="flex-1 rounded-2xl h-12 border-gray-200 text-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copiar enlace
                  </Button>
                  <Button
                    onClick={() => { window.open(`${window.location.origin}/cliente/${tarjetaData.token}`, '_blank'); }}
                    variant="outline"
                    className="flex-1 rounded-2xl h-12 border-gray-200 text-gray-600"
                  >
                    <Send className="w-4 h-4 mr-2" /> Compartir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayoutMinimal>
    </>
  );
}