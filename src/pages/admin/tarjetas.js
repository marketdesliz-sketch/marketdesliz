// src/pages/admin/tarjetas.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  CreditCard, Search, Filter, Eye, Edit, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, UserPlus, Download, Printer, Copy,
  Send, CheckCircle, XCircle, AlertCircle, Clock, Users, DollarSign,
  Package, FileSpreadsheet
} from 'lucide-react';
import AdminLayoutMinimal from '../../layouts/AdminLayoutMinimal';
import pb from '../../lib/pocketbase';
import {
  getOrCreateTarjeta,
  getDatosTarjeta,
  getTarjetasPaginated,
  getTarjetasStats,
  eliminarTarjeta
} from '../../lib/tarjetaService';
import TarjetaCliente from '../../components/TarjetaCliente';
import { formatDate } from '../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

const ITEMS_PER_PAGE = 10;

export default function AdminTarjetasPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const { page = 1, search = '', estado = 'todos', sort = '-created' } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [tarjetas, setTarjetas] = useState([]);
  const [clientesSinTarjeta, setClientesSinTarjeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Filtros ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [filterEstado, setFilterEstado] = useState(estado || 'todos');
  const [sortBy, setSortBy] = useState(sort || '-created');

  // ─── Estadísticas ─────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    activas: 0,
    inactivas: 0,
    suspendidas: 0,
    sinTarjeta: 0
  });

  // ─── Modales ──────────────────────────────────────────────────────────
  const [selectedTarjeta, setSelectedTarjeta] = useState(null);
  const [tarjetaData, setTarjetaData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGenerarMasivaModal, setShowGenerarMasivaModal] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [editForm, setEditForm] = useState({ idCliente: '', estado: 'activo' });
  const [selectedClientesMasivos, setSelectedClientesMasivos] = useState([]);

  const actualizarEstadoTarjeta = async (clienteId, nuevoEstado) => {
    try {
      await pb.collection('clients').update(clienteId, {
        tarjetaEstado: nuevoEstado
      });
    } catch (error) {
      console.error('Error actualizando estado de tarjeta:', error);
      throw error;
    }
  };

  // ─── Cargar datos ─────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess('');

      if (!showRefreshing) {
        const statsData = await getTarjetasStats();
        setStats(statsData);
      }

      const result = await getTarjetasPaginated({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        estado: filterEstado,
        sort: sortBy
      });

      setTarjetas(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

      if (!showRefreshing) {
        await cargarClientesSinTarjeta();
      }

    } catch (err) {
      console.error('Error cargando tarjetas:', err);
      setError('No se pudieron cargar las tarjetas. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filterEstado, sortBy]);

  const cargarClientesSinTarjeta = async () => {
    try {
      const todosClientes = await pb.collection('users').getList(1, 50, {
        filter: 'role = "cliente"',
        sort: 'nombre',
        fields: 'id,nombre,telefono'
      });

      const conTarjeta = await pb.collection('clients').getFullList({
        filter: 'tarjetaId != null && tarjetaId != ""',
        fields: 'userId'
      });
      const conTarjetaIds = new Set(conTarjeta.map(c => c.userId));

      const sinTarjeta = todosClientes.items.filter(c => !conTarjetaIds.has(c.id));
      setClientesSinTarjeta(sinTarjeta);
    } catch (error) {
      console.error('Error cargando clientes sin tarjeta:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Actualizar URL ──────────────────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      search: searchTerm || undefined,
      estado: filterEstado !== 'todos' ? filterEstado : undefined,
      sort: sortBy !== '-created' ? sortBy : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/tarjetas', query }, undefined, { shallow: true });
  }, [currentPage, searchTerm, filterEstado, sortBy, router]);

  // ─── Manejadores ──────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    setSearchTerm(term);
    actualizarURL({ search: term, page: 1 });
  };

  const handleEstadoChange = (value) => {
    setFilterEstado(value);
    actualizarURL({ estado: value, page: 1 });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    actualizarURL({ sort: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    actualizarURL({ page: newPage });
  };

  // ─── Acciones ─────────────────────────────────────────────────────────
  const generarTarjeta = async (clienteId) => {
    setGenerando(true);
    try {
      await getOrCreateTarjeta(clienteId);
      setSuccess('Tarjeta generada correctamente');
      await cargarDatos(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al generar la tarjeta');
    } finally {
      setGenerando(false);
    }
  };

  const generarTarjetasMasivas = async () => {
    if (selectedClientesMasivos.length === 0) {
      setError('Selecciona al menos un cliente');
      return;
    }

    setGenerando(true);
    let generadas = 0;
    let errores = 0;

    for (const clienteId of selectedClientesMasivos) {
      try {
        await getOrCreateTarjeta(clienteId);
        generadas++;
      } catch (error) {
        errores++;
        console.error(`Error generando tarjeta para ${clienteId}:`, error);
      }
    }

    setSuccess(`${generadas} tarjetas generadas, ${errores} errores`);
    setShowGenerarMasivaModal(false);
    setSelectedClientesMasivos([]);
    await cargarDatos(true);
    setGenerando(false);
  };

  const verTarjeta = async (tarjeta) => {
    try {
      const datos = await getDatosTarjeta(tarjeta.token || tarjeta.idCliente);
      setTarjetaData(datos);
      setSelectedTarjeta(tarjeta);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar la tarjeta');
    }
  };

  const editarTarjeta = async () => {
    try {
      if (!selectedTarjeta) return;
      await actualizarEstadoTarjeta(selectedTarjeta.id, editForm.estado);
      setSuccess('Tarjeta actualizada');
      setShowEditModal(false);
      await cargarDatos(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar la tarjeta');
    }
  };

  const eliminarTarjetaConfirm = async () => {
    try {
      if (!selectedTarjeta) return;
      await eliminarTarjeta(selectedTarjeta.id);
      setSuccess('Tarjeta eliminada');
      setShowDeleteModal(false);
      await cargarDatos(true);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar la tarjeta');
    }
  };

  const imprimirTarjeta = () => window.print();

  const exportarExcel = () => {
    const data = tarjetas.map(t => ({
      'ID Cliente': t.idCliente,
      'Cliente': t.clienteNombre,
      'Teléfono': t.clienteTelefono,
      'Estado': t.estado || 'activo',
      'Fecha creación': new Date(t.created).toLocaleDateString(),
      'Token': t.token
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarjetas');
    XLSX.writeFile(workbook, `tarjetas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getEstadoBadge = (estado) => {
    const config = {
      activo: { color: 'bg-green-100 text-green-800', label: 'Activo' },
      inactivo: { color: 'bg-red-100 text-red-800', label: 'Inactivo' },
      suspendido: { color: 'bg-yellow-100 text-yellow-800', label: 'Suspendido' }
    };
    const info = config[estado] || config.activo;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
  };

  // ─── Loading ──────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <AdminLayoutMinimal>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayoutMinimal>
    );
  }

  return (
    <>
      <Head>
        <title>Gestión de Tarjetas | Admin</title>
        <style>{`
          @media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; top: 0; left: 0; width: 100%; } }
        `}</style>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                <CreditCard size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Tarjetas</h1>
                <p className="text-sm text-muted-foreground">Administra las tarjetas de clientes</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => cargarDatos(true)}
                disabled={refreshing}
                className="rounded-2xl h-10 border-gray-200 text-gray-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button
                onClick={() => setShowGenerarMasivaModal(true)}
                className="rounded-2xl h-10 bg-green-600 hover:bg-green-700 font-semibold"
              >
                <Package className="w-4 h-4 mr-2" /> Generación masiva
              </Button>
              <Button
                onClick={exportarExcel}
                className="rounded-2xl h-10 bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
              </Button>
            </div>
          </div>

          {/* ─── Mensajes ──────────────────────────────────────── */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-2 text-green-700">
              <CheckCircle size={18} className="shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-sm font-medium hover:underline"
              >
                Descartar
              </button>
            </div>
          )}

          {/* ─── Estadísticas ──────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-muted-foreground mt-1">Total tarjetas</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.activas}</div>
                <div className="text-xs text-muted-foreground mt-1">Activas</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.inactivas}</div>
                <div className="text-xs text-muted-foreground mt-1">Inactivas</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.suspendidas}</div>
                <div className="text-xs text-muted-foreground mt-1">Suspendidas</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.sinTarjeta}</div>
                <div className="text-xs text-muted-foreground mt-1">Sin tarjeta</div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Búsqueda y filtros ────────────────────────────── */}
          <Card className="border-none shadow-sm rounded-2xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchTerm}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                    placeholder="Buscar por cliente, ID o teléfono..."
                  />
                </form>
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filterEstado}
                    onChange={(e) => handleEstadoChange(e.target.value)}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activas</option>
                    <option value="inactivo">Inactivas</option>
                    <option value="suspendido">Suspendidas</option>
                  </select>
                </div>
                <div className="relative">
                  <select
                    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="-created">Más recientes</option>
                    <option value="created">Más antiguas</option>
                    <option value="clienteNombre">Por cliente</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Tabla ─────────────────────────────────────────── */}
          {tarjetas.length === 0 ? (
            <Card className="border-none shadow-sm rounded-2xl p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {searchTerm || filterEstado !== 'todos' ? 'No se encontraron tarjetas' : 'No hay tarjetas registradas'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterEstado !== 'todos'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Genera tarjetas desde la sección de clientes'}
              </p>
            </Card>
          ) : (
            <>
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Cliente</th>
                        <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                        <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teléfono</th>
                        <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                        <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                        <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tarjetas.map((tarjeta) => (
                        <tr key={tarjeta.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-mono text-sm">{tarjeta.idCliente || 'N/A'}</td>
                          <td className="p-4 font-medium">{tarjeta.clienteNombre}</td>
                          <td className="p-4 text-muted-foreground">{tarjeta.clienteTelefono || 'N/A'}</td>
                          <td className="p-4">{getEstadoBadge(tarjeta.estado || 'activo')}</td>
                          <td className="p-4 text-sm text-muted-foreground">{formatDate(tarjeta.created)}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => verTarjeta(tarjeta)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-xl transition"
                                title="Ver tarjeta"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTarjeta(tarjeta);
                                  setEditForm({ idCliente: tarjeta.idCliente, estado: tarjeta.estado || 'activo' });
                                  setShowEditModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTarjeta(tarjeta);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* ─── Paginación ──────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {tarjetas.length} de {totalItems} tarjetas
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
            </>
          )}
        </div>
      </AdminLayoutMinimal>

      {/* ─── Modal ver tarjeta ──────────────────────────────── */}
      {showModal && tarjetaData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-area" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Tarjeta de {tarjetaData.cliente?.nombre || 'Cliente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
            </div>
            <div className="p-6 space-y-6">
              <TarjetaCliente datos={tarjetaData} tipo="frente" />
              <TarjetaCliente datos={tarjetaData} tipo="reverso" />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button
                onClick={imprimirTarjeta}
                className="flex-1 rounded-2xl h-12 bg-primary hover:bg-primary/90 font-bold"
              >
                <Printer className="w-4 h-4 mr-2" /> Imprimir
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/cliente/${tarjetaData.token}`);
                  alert('Enlace copiado');
                }}
                className="flex-1 rounded-2xl h-12 border-gray-200 text-gray-700"
              >
                <Copy className="w-4 h-4 mr-2" /> Copiar enlace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal edición ──────────────────────────────────── */}
      {showEditModal && selectedTarjeta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit size={18} className="text-primary" /> Editar tarjeta
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Cliente</label>
                <input
                  type="text"
                  value={editForm.idCliente}
                  disabled
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-2xl h-11 border-gray-200 text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={editarTarjeta}
                className="flex-1 rounded-2xl h-11 bg-primary hover:bg-primary/90 font-bold"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal eliminar ─────────────────────────────────── */}
      {showDeleteModal && selectedTarjeta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trash2 size={18} className="text-red-500" /> Eliminar tarjeta
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro de eliminar la tarjeta de <strong>{selectedTarjeta.clienteNombre}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-2xl h-11 border-gray-200 text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={eliminarTarjetaConfirm}
                className="flex-1 rounded-2xl h-11 bg-red-600 hover:bg-red-700 font-bold"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal generación masiva ────────────────────────── */}
      {showGenerarMasivaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGenerarMasivaModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package size={18} className="text-primary" /> Generación masiva de tarjetas
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Selecciona los clientes para generar sus tarjetas:</p>
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-2xl mb-4">
                {clientesSinTarjeta.length === 0 ? (
                  <p className="p-4 text-muted-foreground text-sm text-center">No hay clientes sin tarjeta</p>
                ) : (
                  clientesSinTarjeta.map(cliente => (
                    <label key={cliente.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer">
                      <input
                        type="checkbox"
                        value={cliente.id}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClientesMasivos([...selectedClientesMasivos, cliente.id]);
                          } else {
                            setSelectedClientesMasivos(selectedClientesMasivos.filter(id => id !== cliente.id));
                          }
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <div>
                        <p className="font-medium text-sm">{cliente.nombre || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">{cliente.telefono}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowGenerarMasivaModal(false)}
                className="flex-1 rounded-2xl h-11 border-gray-200 text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={generarTarjetasMasivas}
                disabled={generando || selectedClientesMasivos.length === 0}
                className="flex-1 rounded-2xl h-11 bg-green-600 hover:bg-green-700 font-bold"
              >
                Generar {selectedClientesMasivos.length} tarjeta(s)
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}