// src/pages/admin/deslizmoto/index.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Bike, Search, Filter, RefreshCw, Plus, Edit, Trash2, Eye,
  CheckCircle, XCircle, AlertCircle, Star, MapPin, Phone,
  MessageCircle, Mail, Award, BadgeCheck, ShieldCheck, TrendingUp,
  Users, Zap, Clock, Save, X, ChevronLeft, ChevronRight,
  FileSpreadsheet, User, Lock, Percent, DollarSign, Ban,
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import pb from '../../../lib/pocketbase';
import { formatMoney } from '../../../lib/utils';

const ITEMS_PER_PAGE = 12;
const TIPO = 'moto';

// ─── Estados posibles ────────────────────────────────────────────────────
const ESTADOS = [
  { value: 'disponible', label: 'Disponible', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'ocupado', label: 'Ocupado', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'desconectado', label: 'Desconectado', color: 'bg-gray-100 text-gray-600', icon: XCircle },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

// ─── Componente principal ────────────────────────────────────────────────
export default function AdminDeslizmotoPage() {
  const router = useRouter();

  // ─── Estados ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroDestacados, setFiltroDestacados] = useState(false);
  const [ordenar, setOrdenar] = useState('-rating');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modales
  const [showVerModal, setShowVerModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form de edición
  const [editForm, setEditForm] = useState({
    nombre: '',
    vehiculo: '',
    placa: '',
    rating: 5,
    servicios: 0,
    experiencia: '',
    satisfaccion: 100,
    estado: 'disponible',
    zona: '',
    comision: 5,
    activo: true,
  });

  // ─── Cargar conductores ─────────────────────────────────────────────
  const cargarDrivers = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Filtro base
      const filters = [`tipo = "${TIPO}"`];
      if (searchTerm.trim()) {
        const s = searchTerm.replace(/"/g, '\\"');
        filters.push(`(nombre ~ "${s}" || vehiculo ~ "${s}" || zona ~ "${s}" || placa ~ "${s}")`);
      }
      if (filtroEstado !== 'todos') {
        filters.push(`estado = "${filtroEstado}"`);
      }
      if (filtroDestacados) {
        filters.push('destacado = true');
      }
      const filter = filters.join(' && ');

      const result = await pb.collection('deslizmoto').getList(currentPage, ITEMS_PER_PAGE, {
        filter,
        sort: ordenar,
        expand: 'userId',
      });

      setDrivers(result.items);
      setTotalItems(result.totalItems);
    } catch (err) {
      console.error('Error cargando conductores:', err);
      setError('No se pudieron cargar los conductores. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, filtroEstado, filtroDestacados, ordenar, currentPage]);

  // Cargar al montar y cuando cambian filtros
  useEffect(() => {
    const verificarAdmin = () => {
      if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
        router.push('/admin/login');
        return false;
      }
      return true;
    };

    if (verificarAdmin()) {
      cargarDrivers();
    }
  }, [cargarDrivers, router]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroEstado, filtroDestacados, ordenar]);

  // Auto-clear mensajes
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ─── Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = totalItems;
    const activos = drivers.filter((d) => d.activo !== false).length;
    const disponibles = drivers.filter((d) => d.estado === 'disponible').length;
    const ratingPromedio =
      drivers.length > 0
        ? (drivers.reduce((sum, d) => sum + (Number(d.rating) || 0), 0) / drivers.length).toFixed(2)
        : '0.00';
    return { total, activos, disponibles, ratingPromedio };
  }, [drivers, totalItems]);

  // ─── Abrir modales ──────────────────────────────────────────────────
  const abrirVer = (driver) => {
    setSelectedDriver(driver);
    setShowVerModal(true);
  };

  const abrirEditar = (driver) => {
    setSelectedDriver(driver);
    setEditForm({
      nombre: driver.nombre || '',
      vehiculo: driver.vehiculo || '',
      placa: driver.placa || '',
      rating: Number(driver.rating) || 5,
      servicios: Number(driver.servicios) || 0,
      experiencia: driver.experiencia || '',
      satisfaccion: Number(driver.satisfaccion) || 100,
      estado: driver.estado || 'disponible',
      zona: driver.zona || '',
      comision: Number(driver.comision) ?? 5,
      activo: driver.activo !== false,
    });
    setShowEditarModal(true);
  };

  const abrirEliminar = (driver) => {
    setSelectedDriver(driver);
    setShowEliminarModal(true);
  };

  // ─── Guardar cambios ────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!selectedDriver) return;
    if (!editForm.nombre.trim() || !editForm.vehiculo.trim()) {
      setError('Nombre y vehículo son obligatorios');
      return;
    }
    if (editForm.rating < 0 || editForm.rating > 5) {
      setError('El rating debe estar entre 0 y 5');
      return;
    }
    if (editForm.satisfaccion < 0 || editForm.satisfaccion > 100) {
      setError('La satisfacción debe estar entre 0 y 100');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await pb.collection('deslizmoto').update(selectedDriver.id, {
        nombre: editForm.nombre.trim(),
        vehiculo: editForm.vehiculo.trim(),
        placa: editForm.placa.trim(),
        rating: Number(editForm.rating),
        servicios: Number(editForm.servicios),
        experiencia: editForm.experiencia.trim(),
        satisfaccion: Number(editForm.satisfaccion),
        estado: editForm.estado,
        zona: editForm.zona.trim(),
        comision: Number(editForm.comision),
        activo: editForm.activo,
      });

      setSuccess(`✅ Conductor "${editForm.nombre}" actualizado`);
      setShowEditarModal(false);
      await cargarDrivers(true);
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle activo desde la card ────────────────────────────────────
  const handleToggleActivo = async (driver) => {
    try {
      const nuevo = !(driver.activo !== false);
      await pb.collection('deslizmoto').update(driver.id, { activo: nuevo });
      setSuccess(`Conductor ${nuevo ? 'activado' : 'desactivado'}`);
      await cargarDrivers(true);
    } catch (err) {
      console.error('Error toggling activo:', err);
      setError('Error al cambiar el estado');
    }
  };

  // ─── Eliminar ───────────────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!selectedDriver) return;
    setSaving(true);
    try {
      await pb.collection('deslizmoto').delete(selectedDriver.id);
      setSuccess(`✅ Conductor "${selectedDriver.nombre}" eliminado`);
      setShowEliminarModal(false);
      await cargarDrivers(true);
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar el conductor');
    } finally {
      setSaving(false);
    }
  };

  // ─── Exportar a Excel (CSV) ─────────────────────────────────────────
  const handleExportar = () => {
    const headers = ['Nombre', 'Vehículo', 'Placa', 'Zona', 'Rating', 'Servicios', 'Satisfacción', 'Estado', 'Comisión', 'Activo'];
    const rows = drivers.map((d) => [
      d.nombre || '',
      d.vehiculo || '',
      d.placa || '',
      d.zona || '',
      d.rating || '',
      d.servicios || '',
      `${d.satisfaccion || 0}%`,
      d.estado || '',
      `${d.comision || 0}%`,
      d.activo !== false ? 'Sí' : 'No',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deslizmoto_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Paginación ─────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
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
        <title>Deslizmoto Express | Admin MarketDesliz</title>
        <meta name="description" content="Gestión de conductores de Deslizmoto Express" />
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ═══════════════════════════════════════════════════════════
              HEADER
          ═══════════════════════════════════════════════════════════ */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Bike size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Deslizmoto Express
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                    <ShieldCheck size={9} /> Oficial
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de conductores de moto
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => cargarDrivers(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={handleExportar}
                disabled={drivers.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                Exportar
              </button>
              <button
                onClick={() => router.push('/admin/deslizmoto/nuevo')}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20"
              >
                <Plus size={16} />
                Nuevo conductor
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              ALERTAS
          ═══════════════════════════════════════════════════════════ */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
                <X size={16} />
              </button>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STATS
          ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <Users size={20} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">Conductores registrados</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-50 p-2.5 rounded-xl">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <span className="text-xs text-muted-foreground">Activos</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.activos}</div>
              <div className="text-xs text-muted-foreground mt-1">Con acceso a la app</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                  <Zap size={20} className="text-blue-600" />
                </div>
                <span className="text-xs text-muted-foreground">Disponibles</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{stats.disponibles}</div>
              <div className="text-xs text-muted-foreground mt-1">Listos para trabajar</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-yellow-50 p-2.5 rounded-xl">
                  <Star size={20} className="text-yellow-500" />
                </div>
                <span className="text-xs text-muted-foreground">Rating</span>
              </div>
              <div className="text-3xl font-bold text-yellow-500">{stats.ratingPromedio}</div>
              <div className="text-xs text-muted-foreground mt-1">Promedio general</div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              FILTROS
          ═══════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, vehículo, placa o zona..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  />
                </div>
              </div>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>

              <select
                value={ordenar}
                onChange={(e) => setOrdenar(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="-rating">Mejor rating</option>
                <option value="-servicios">Más servicios</option>
                <option value="-created">Más recientes</option>
                <option value="nombre">Nombre (A-Z)</option>
              </select>

              <button
                type="button"
                onClick={() => setFiltroDestacados(!filtroDestacados)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  filtroDestacados
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Award size={16} />
                Destacados
              </button>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'conductor' : 'conductores'}
              {filtroEstado !== 'todos' && ` · ${ESTADOS.find((e) => e.value === filtroEstado)?.label}`}
              {filtroDestacados && ' · Solo destacados'}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              GRID DE CONDUCTORES
          ═══════════════════════════════════════════════════════════ */}
          {drivers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bike size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {searchTerm || filtroEstado !== 'todos' || filtroDestacados
                  ? 'No se encontraron conductores'
                  : 'No hay conductores registrados'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filtroEstado !== 'todos' || filtroDestacados
                  ? 'Prueba con otros filtros o búsqueda'
                  : 'Los conductores aparecerán aquí cuando se registren'}
              </p>
              {!searchTerm && filtroEstado === 'todos' && !filtroDestacados && (
                <button
                  onClick={() => router.push('/admin/deslizmoto/nuevo')}
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition"
                >
                  <Plus size={16} /> Registrar primer conductor
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {drivers.map((driver) => {
                  const estadoInfo = ESTADOS.find((e) => e.value === driver.estado) || ESTADOS[2];
                  const EstadoIcon = estadoInfo.icon;
                  const avatarUrl = driver.fotoPerfil
                    ? pb.files.getURL(driver, driver.fotoPerfil, { thumb: '300x300' })
                    : null;
                  const activo = driver.activo !== false;

                  return (
                    <div
                      key={driver.id}
                      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group ${
                        !activo ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Imagen */}
                      <div className="relative aspect-square bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={driver.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={64} className="text-primary/30" />
                          </div>
                        )}

                        {/* Badges superiores */}
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${estadoInfo.color}`}>
                            <EstadoIcon size={10} />
                            {estadoInfo.label}
                          </span>
                        </div>

                        {/* Toggle activo */}
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => handleToggleActivo(driver)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition ${
                              activo
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                            title={activo ? 'Desactivar' : 'Activar'}
                          >
                            {activo ? <CheckCircle size={16} /> : <Ban size={16} />}
                          </button>
                        </div>

                        {/* Badges inferiores */}
                        {driver.destacado && (
                          <div className="absolute bottom-3 left-3 bg-yellow-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <Award size={10} /> Destacado
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                            {driver.nombre || 'Sin nombre'}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-yellow-500 text-xs font-bold shrink-0">
                            <Star size={12} className="fill-current" />
                            {Number(driver.rating || 0).toFixed(1)}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                          {driver.vehiculo || 'Sin vehículo'}
                          {driver.placa && ` · ${driver.placa}`}
                        </p>

                        {/* Mini stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Servicios</p>
                            <p className="text-sm font-bold text-gray-900">{driver.servicios || 0}</p>
                          </div>
                          <div className="text-center border-l border-r border-gray-100">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Registro</p>
                            <p className="text-sm font-bold text-gray-900">{driver.experiencia || '—'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Satisf.</p>
                            <p className="text-sm font-bold text-gray-900">{driver.satisfaccion || 100}%</p>
                          </div>
                        </div>

                        {driver.zona && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <MapPin size={11} />
                            <span className="truncate">{driver.zona}</span>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirVer(driver)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
                            title="Ver detalle"
                          >
                            <Eye size={13} /> Ver
                          </button>
                          <button
                            onClick={() => abrirEditar(driver)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition"
                            title="Editar"
                          >
                            <Edit size={13} /> Editar
                          </button>
                          <button
                            onClick={() => abrirEliminar(driver)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ═══════════════════════════════════════════════════════
                  PAGINACIÓN
              ═══════════════════════════════════════════════════════ */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-primary hover:text-primary transition"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-primary hover:text-primary transition"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayoutMinimal>

      {/* ═══════════════════════════════════════════════════════════
          MODAL VER
      ═══════════════════════════════════════════════════════════ */}
      {showVerModal && selectedDriver && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVerModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
              {selectedDriver.fotoPerfil ? (
                <img
                  src={pb.files.getURL(selectedDriver, selectedDriver.fotoPerfil, { thumb: '600x600' })}
                  alt={selectedDriver.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={80} className="text-primary/30" />
                </div>
              )}
              <button
                onClick={() => setShowVerModal(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:bg-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedDriver.nombre}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedDriver.vehiculo} {selectedDriver.placa && `· ${selectedDriver.placa}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold shrink-0">
                  <Star size={16} className="fill-current" />
                  {Number(selectedDriver.rating || 0).toFixed(1)}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <ShieldCheck size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{selectedDriver.servicios || 0}</p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Servicios</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Clock size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-900">{selectedDriver.experiencia || '—'}</p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Registro</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <TrendingUp size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{selectedDriver.satisfaccion || 100}%</p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">Satisfacción</p>
                </div>
              </div>

              {/* Info list */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                {selectedDriver.zona && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-primary shrink-0" />
                    <span className="text-gray-700">{selectedDriver.zona}</span>
                  </div>
                )}
                {selectedDriver.expand?.userId?.telefono && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-primary shrink-0" />
                    <span className="text-gray-700">{formatPhone(selectedDriver.expand.userId.telefono)}</span>
                  </div>
                )}
                {selectedDriver.expand?.userId?.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-primary shrink-0" />
                    <span className="text-gray-700">{selectedDriver.expand.userId.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Percent size={16} className="text-primary shrink-0" />
                  <span className="text-gray-700">Comisión: {selectedDriver.comision ?? 5}%</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <BadgeCheck size={16} className="text-primary shrink-0" />
                  <span className="text-gray-700">
                    Estado: {ESTADOS.find((e) => e.value === selectedDriver.estado)?.label || 'Desconocido'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowVerModal(false);
                    abrirEditar(selectedDriver);
                  }}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  onClick={() => setShowVerModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL EDITAR
      ═══════════════════════════════════════════════════════════ */}
      {showEditarModal && selectedDriver && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditarModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Edit size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Editar conductor</h2>
              </div>
              <button
                onClick={() => setShowEditarModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Vehículo *
                  </label>
                  <input
                    type="text"
                    value={editForm.vehiculo}
                    onChange={(e) => setEditForm({ ...editForm, vehiculo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={editForm.placa}
                    onChange={(e) => setEditForm({ ...editForm, placa: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Zona
                  </label>
                  <input
                    type="text"
                    value={editForm.zona}
                    onChange={(e) => setEditForm({ ...editForm, zona: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Rating (0-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Servicios
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.servicios}
                    onChange={(e) => setEditForm({ ...editForm, servicios: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Experiencia
                  </label>
                  <input
                    type="text"
                    value={editForm.experiencia}
                    onChange={(e) => setEditForm({ ...editForm, experiencia: e.target.value })}
                    placeholder="Ej: 2 meses"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Satisfacción (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.satisfaccion}
                    onChange={(e) => setEditForm({ ...editForm, satisfaccion: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Estado
                  </label>
                  <select
                    value={editForm.estado}
                    onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.comision}
                    onChange={(e) => setEditForm({ ...editForm, comision: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Toggle activo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">Conductor activo</p>
                  <p className="text-xs text-muted-foreground">
                    Si está inactivo no aparecerá en la app pública
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editForm.activo}
                  onClick={() => setEditForm({ ...editForm, activo: !editForm.activo })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                    editForm.activo ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      editForm.activo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} /> Guardar cambios
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEditarModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL ELIMINAR
      ═══════════════════════════════════════════════════════════ */}
      {showEliminarModal && selectedDriver && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEliminarModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar conductor?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Vas a eliminar a <strong className="text-gray-900">{selectedDriver.nombre}</strong>.
                Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleEliminar}
                  disabled={saving}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={16} /> Eliminar
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEliminarModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}