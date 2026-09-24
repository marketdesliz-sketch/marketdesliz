// src/pages/admin/publicidad/index.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Megaphone, Search, Filter, RefreshCw, Plus, Edit, Trash2, Eye,
  CheckCircle, XCircle, AlertCircle, Star, Phone, Mail, MapPin,
  Award, ShieldCheck, TrendingUp, Users, Clock, Save, X, ChevronLeft,
  ChevronRight, FileSpreadsheet, User, DollarSign, Ban, Building2,
  Zap, Crown, MessageCircle, Calendar, ExternalLink, Sparkles, Send
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import pb from '../../../lib/pocketbase';
import { formatMoney } from '../../../lib/utils';

const ITEMS_PER_PAGE = 12;

// ─── Estados posibles ────────────────────────────────────────────────────
const ESTADOS = [
  { value: 'pendiente',   label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'contactado',  label: 'Contactado',  color: 'bg-blue-100 text-blue-700',     icon: Send },
  { value: 'aprobado',    label: 'Aprobado',    color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  { value: 'activo',      label: 'Activo',      color: 'bg-green-100 text-green-700',   icon: Zap },
  { value: 'completado',  label: 'Completado',  color: 'bg-emerald-100 text-emerald-700', icon: Award },
  { value: 'cancelado',   label: 'Cancelado',   color: 'bg-red-100 text-red-700',       icon: XCircle },
];

// ─── Planes posibles (con colores) ───────────────────────────────────────
const PLANES = [
  { value: 'basico',   label: 'Básico',   color: 'bg-blue-100 text-blue-700',     icon: Megaphone },
  { value: 'estandar', label: 'Estándar', color: 'bg-pink-100 text-pink-700',     icon: Zap },
  { value: 'premium',  label: 'Premium',  color: 'bg-yellow-100 text-yellow-700', icon: Crown },
];

// ─── Objetivos ───────────────────────────────────────────────────────────
const OBJETIVOS = {
  ventas: 'Aumentar ventas',
  clientes: 'Conseguir más clientes',
  marca: 'Dar a conocer mi marca',
  evento: 'Promocionar un evento',
  otro: 'Otro',
};

// ─── Helpers ─────────────────────────────────────────────────────────────
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ═════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════
export default function AdminPublicidadPage() {
  const router = useRouter();

  // ─── Estados ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPlan, setFiltroPlan] = useState('todos');
  const [filtroPendientes, setFiltroPendientes] = useState(false);
  const [ordenar, setOrdenar] = useState('-created');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modales
  const [showVerModal, setShowVerModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form de edición
  const [editForm, setEditForm] = useState({
    estado: 'pendiente',
    notasAdmin: '',
    fechaContacto: '',
    fechaInicio: '',
    fechaFin: '',
    precio: 0,
    activo: true,
  });

  // ─── Cargar solicitudes ──────────────────────────────────────────────
  const cargarSolicitudes = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const filters = [];
      if (searchTerm.trim()) {
        const s = searchTerm.replace(/"/g, '\\"');
        filters.push(`(nombre ~ "${s}" || negocio ~ "${s}" || email ~ "${s}" || telefono ~ "${s}")`);
      }
      if (filtroEstado !== 'todos') {
        filters.push(`estado = "${filtroEstado}"`);
      }
      if (filtroPlan !== 'todos') {
        filters.push(`plan = "${filtroPlan}"`);
      }
      if (filtroPendientes) {
        filters.push('estado = "pendiente"');
      }
      const filter = filters.length > 0 ? filters.join(' && ') : '';

      const result = await pb.collection('solicitudes_publicidad').getList(currentPage, ITEMS_PER_PAGE, {
        filter,
        sort: ordenar,
        expand: 'userId',
      });

      setSolicitudes(result.items);
      setTotalItems(result.totalItems);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
      setError('No se pudieron cargar las solicitudes. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, filtroEstado, filtroPlan, filtroPendientes, ordenar, currentPage]);

  // Verificar admin + cargar
  useEffect(() => {
    const verificarAdmin = () => {
      if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
        router.push('/admin/login');
        return false;
      }
      return true;
    };
    if (verificarAdmin()) {
      cargarSolicitudes();
    }
  }, [cargarSolicitudes, router]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroEstado, filtroPlan, filtroPendientes, ordenar]);

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
    const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
    const activos = solicitudes.filter((s) => s.estado === 'activo' || s.estado === 'aprobado').length;
    const ingresos = solicitudes
      .filter((s) => ['activo', 'completado'].includes(s.estado))
      .reduce((sum, s) => sum + (Number(s.precio) || 0), 0);
    return { total, pendientes, activos, ingresos };
  }, [solicitudes, totalItems]);

  // ─── Abrir modales ──────────────────────────────────────────────────
  const abrirVer = (sol) => {
    setSelectedSolicitud(sol);
    setShowVerModal(true);
  };

  const abrirEditar = (sol) => {
    setSelectedSolicitud(sol);
    setEditForm({
      estado: sol.estado || 'pendiente',
      notasAdmin: sol.notasAdmin || '',
      fechaContacto: sol.fechaContacto ? sol.fechaContacto.slice(0, 10) : '',
      fechaInicio: sol.fechaInicio ? sol.fechaInicio.slice(0, 10) : '',
      fechaFin: sol.fechaFin ? sol.fechaFin.slice(0, 10) : '',
      precio: Number(sol.precio) || 0,
      activo: sol.activo !== false,
    });
    setShowEditarModal(true);
  };

  const abrirEliminar = (sol) => {
    setSelectedSolicitud(sol);
    setShowEliminarModal(true);
  };

  // ─── Guardar cambios ────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!selectedSolicitud) return;

    setSaving(true);
    setError(null);

    try {
      await pb.collection('solicitudes_publicidad').update(selectedSolicitud.id, {
        estado: editForm.estado,
        notasAdmin: editForm.notasAdmin.trim(),
        fechaContacto: editForm.fechaContacto || null,
        fechaInicio: editForm.fechaInicio || null,
        fechaFin: editForm.fechaFin || null,
        precio: Number(editForm.precio),
        activo: editForm.activo,
      });

      setSuccess(`Solicitud de "${selectedSolicitud.negocio}" actualizada`);
      setShowEditarModal(false);
      await cargarSolicitudes(true);
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // ─── Cambio rápido de estado ────────────────────────────────────────
  const handleCambiarEstado = async (sol, nuevoEstado) => {
    try {
      await pb.collection('solicitudes_publicidad').update(sol.id, { estado: nuevoEstado });
      setSuccess(`Estado cambiado a "${ESTADOS.find((e) => e.value === nuevoEstado)?.label}"`);
      await cargarSolicitudes(true);
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError('Error al cambiar el estado');
    }
  };

  // ─── Toggle activo ──────────────────────────────────────────────────
  const handleToggleActivo = async (sol) => {
    try {
      const nuevo = !(sol.activo !== false);
      await pb.collection('solicitudes_publicidad').update(sol.id, { activo: nuevo });
      setSuccess(`Solicitud ${nuevo ? 'activada' : 'desactivada'}`);
      await cargarSolicitudes(true);
    } catch (err) {
      console.error('Error toggling activo:', err);
      setError('Error al cambiar el estado');
    }
  };

  // ─── Eliminar ───────────────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!selectedSolicitud) return;
    setSaving(true);
    try {
      await pb.collection('solicitudes_publicidad').delete(selectedSolicitud.id);
      setSuccess(`Solicitud de "${selectedSolicitud.negocio}" eliminada`);
      setShowEliminarModal(false);
      await cargarSolicitudes(true);
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  // ─── Exportar CSV ───────────────────────────────────────────────────
  const handleExportar = () => {
    const headers = [
      'Negocio', 'Cliente', 'Teléfono', 'Email', 'Plan', 'Precio',
      'Duración', 'Objetivo', 'Estado', 'Fecha contacto', 'Fecha inicio',
      'Fecha fin', 'Notas admin', 'Activo', 'Creado'
    ];
    const rows = solicitudes.map((s) => [
      s.negocio || '',
      s.nombre || '',
      s.telefono || '',
      s.email || '',
      s.planNombre || s.plan || '',
      s.precio || 0,
      s.duracion || '',
      OBJETIVOS[s.objetivo] || s.objetivo || '',
      ESTADOS.find((e) => e.value === s.estado)?.label || s.estado || '',
      s.fechaContacto ? new Date(s.fechaContacto).toLocaleDateString('es-MX') : '',
      s.fechaInicio ? new Date(s.fechaInicio).toLocaleDateString('es-MX') : '',
      s.fechaFin ? new Date(s.fechaFin).toLocaleDateString('es-MX') : '',
      (s.notasAdmin || '').replace(/\n/g, ' '),
      s.activo !== false ? 'Sí' : 'No',
      formatDate(s.created),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publicidad_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── WhatsApp contacto rápido ───────────────────────────────────────
  const handleWhatsApp = (sol) => {
    if (!sol.telefono) return;
    let num = sol.telefono.replace(/\D/g, '');
    if (!num.startsWith('52') && num.length === 10) num = '52' + num;
    const msg = encodeURIComponent(`Hola ${sol.nombre}, te contactamos de MarketDesliz sobre tu solicitud de Publicidad (Plan ${sol.planNombre || sol.plan}).`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  // ─── Paginación ─────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayoutMinimal>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayoutMinimal>
    );
  }

  return (
    <>
      <Head>
        <title>Publicidad | Admin MarketDesliz</title>
        <meta name="description" content="Gestión de solicitudes de Publicidad" />
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ═══════════════════════════════════════════════════════ */}
          {/* HEADER                                                   */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-pink-500/10 rounded-2xl flex items-center justify-center">
                <Megaphone size={22} className="text-pink-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Publicidad
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 text-[9px] font-black uppercase tracking-widest">
                    <ShieldCheck size={9} /> Oficial
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de solicitudes de publicidad
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => cargarSolicitudes(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={handleExportar}
                disabled={solicitudes.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                Exportar
              </button>
              <button
                onClick={() => router.push('/admin/publicidad/nuevo')}
                className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition shadow-lg shadow-pink-200"
              >
                <Plus size={16} />
                Nueva solicitud
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ALERTAS                                                  */}
          {/* ═══════════════════════════════════════════════════════ */}
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

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STATS                                                    */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-pink-500/10 p-2.5 rounded-xl">
                  <Megaphone size={20} className="text-pink-600" />
                </div>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">Solicitudes</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-yellow-50 p-2.5 rounded-xl">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <span className="text-xs text-muted-foreground">Pendientes</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendientes}</div>
              <div className="text-xs text-muted-foreground mt-1">Por contactar</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-50 p-2.5 rounded-xl">
                  <Zap size={20} className="text-green-600" />
                </div>
                <span className="text-xs text-muted-foreground">Activas</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.activos}</div>
              <div className="text-xs text-muted-foreground mt-1">Campañas vigentes</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-emerald-50 p-2.5 rounded-xl">
                  <DollarSign size={20} className="text-emerald-600" />
                </div>
                <span className="text-xs text-muted-foreground">Ingresos</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {formatMoney(stats.ingresos)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">De activas + completadas</div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* FILTROS                                                  */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por negocio, cliente, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>

              <select
                value={filtroPlan}
                onChange={(e) => setFiltroPlan(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="todos">Todos los planes</option>
                {PLANES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>

              <select
                value={ordenar}
                onChange={(e) => setOrdenar(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="-created">Más recientes</option>
                <option value="created">Más antiguas</option>
                <option value="-precio">Mayor precio</option>
                <option value="precio">Menor precio</option>
                <option value="negocio">Negocio (A-Z)</option>
              </select>

              <button
                type="button"
                onClick={() => setFiltroPendientes(!filtroPendientes)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  filtroPendientes
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Clock size={16} />
                Solo pendientes
              </button>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'solicitud' : 'solicitudes'}
              {filtroEstado !== 'todos' && ` · ${ESTADOS.find((e) => e.value === filtroEstado)?.label}`}
              {filtroPlan !== 'todos' && ` · Plan ${PLANES.find((p) => p.value === filtroPlan)?.label}`}
              {filtroPendientes && ' · Solo pendientes'}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* GRID                                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          {solicitudes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Megaphone size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {searchTerm || filtroEstado !== 'todos' || filtroPlan !== 'todos' || filtroPendientes
                  ? 'No se encontraron solicitudes'
                  : 'No hay solicitudes de publicidad'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filtroEstado !== 'todos' || filtroPlan !== 'todos' || filtroPendientes
                  ? 'Prueba con otros filtros o búsqueda'
                  : 'Las solicitudes aparecerán aquí cuando los clientes las envíen'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {solicitudes.map((sol) => {
                  const estadoInfo = ESTADOS.find((e) => e.value === sol.estado) || ESTADOS[0];
                  const planInfo = PLANES.find((p) => p.value === sol.plan) || PLANES[0];
                  const EstadoIcon = estadoInfo.icon;
                  const PlanIcon = planInfo.icon;
                  const activo = sol.activo !== false;

                  return (
                    <div
                      key={sol.id}
                      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group ${
                        !activo ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Header card con plan gradient */}
                      <div className={`relative p-5 bg-gradient-to-br ${planInfo.color.replace('text-', 'from-').replace('700', '50')} to-white`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${planInfo.color}`}>
                            <PlanIcon size={20} />
                          </div>

                          <div className="flex gap-1.5">
                            {/* Toggle activo */}
                            <button
                              onClick={() => handleToggleActivo(sol)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition ${
                                activo
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-gray-400 text-white hover:bg-gray-500'
                              }`}
                              title={activo ? 'Desactivar' : 'Activar'}
                            >
                              {activo ? <CheckCircle size={14} /> : <Ban size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Estado badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${estadoInfo.color}`}>
                          <EstadoIcon size={10} />
                          {estadoInfo.label}
                        </span>

                        {/* Plan + precio */}
                        <div className="mt-4 flex items-baseline justify-between">
                          <span className="text-2xl font-black text-gray-900 leading-none">
                            {formatMoney(sol.precio)}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider font-bold ${planInfo.color.replace('bg-', 'text-').replace('100', '600')}`}>
                            Plan {sol.planNombre || planInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 space-y-3">
                        {/* Negocio */}
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                            <Building2 size={10} />
                            Negocio
                          </div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">
                            {sol.negocio || 'Sin nombre'}
                          </p>
                        </div>

                        {/* Cliente */}
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                            <User size={10} />
                            Cliente
                          </div>
                          <p className="text-xs text-gray-700 line-clamp-1">{sol.nombre}</p>
                        </div>

                        {/* Objetivo */}
                        {sol.objetivo && (
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                              <Sparkles size={10} />
                              Objetivo
                            </div>
                            <p className="text-xs text-gray-700 line-clamp-1">
                              {OBJETIVOS[sol.objetivo] || sol.objetivo}
                            </p>
                          </div>
                        )}

                        {/* Duración */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={11} />
                          <span>{sol.duracion || '—'}</span>
                          <span className="text-gray-300">·</span>
                          <span>{formatDate(sol.created)}</span>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => abrirVer(sol)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
                            title="Ver detalle"
                          >
                            <Eye size={13} /> Ver
                          </button>
                          <button
                            onClick={() => abrirEditar(sol)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition"
                            title="Editar"
                          >
                            <Edit size={13} /> Editar
                          </button>
                          <button
                            onClick={() => abrirEliminar(sol)}
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

              {/* ═══════════════════════════════════════════════════ */}
              {/* PAGINACIÓN                                         */}
              {/* ═══════════════════════════════════════════════════ */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-pink-500 hover:text-pink-500 transition"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-pink-500 hover:text-pink-500 transition"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayoutMinimal>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL VER                                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showVerModal && selectedSolicitud && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVerModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient por plan */}
            <div className={`relative p-6 bg-gradient-to-br ${
              (PLANES.find((p) => p.value === selectedSolicitud.plan) || PLANES[0]).color.replace('text-', 'from-').replace('700', '50')
            } to-white`}>
              <button
                onClick={() => setShowVerModal(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:bg-white transition"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  (PLANES.find((p) => p.value === selectedSolicitud.plan) || PLANES[0]).color
                }`}>
                  {(() => {
                    const Icon = (PLANES.find((p) => p.value === selectedSolicitud.plan) || PLANES[0]).icon;
                    return <Icon size={22} />;
                  })()}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                    Plan {selectedSolicitud.planNombre || selectedSolicitud.plan}
                  </p>
                  <p className="text-2xl font-black text-gray-900">
                    {formatMoney(selectedSolicitud.precio)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Negocio */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedSolicitud.negocio}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Solicitado {formatDate(selectedSolicitud.created)}
              </p>

              {/* Estado */}
              <div className="mb-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  (ESTADOS.find((e) => e.value === selectedSolicitud.estado) || ESTADOS[0]).color
                }`}>
                  {(() => {
                    const Icon = (ESTADOS.find((e) => e.value === selectedSolicitud.estado) || ESTADOS[0]).icon;
                    return <Icon size={12} />;
                  })()}
                  {(ESTADOS.find((e) => e.value === selectedSolicitud.estado) || ESTADOS[0]).label}
                </span>
              </div>

              {/* Info list */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm">
                  <User size={16} className="text-pink-500 shrink-0" />
                  <span className="text-gray-700">{selectedSolicitud.nombre}</span>
                </div>
                {selectedSolicitud.telefono && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-pink-500 shrink-0" />
                    <span className="text-gray-700">{formatPhone(selectedSolicitud.telefono)}</span>
                  </div>
                )}
                {selectedSolicitud.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-pink-500 shrink-0" />
                    <span className="text-gray-700">{selectedSolicitud.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Sparkles size={16} className="text-pink-500 shrink-0" />
                  <span className="text-gray-700">
                    {OBJETIVOS[selectedSolicitud.objetivo] || 'Sin objetivo'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-pink-500 shrink-0" />
                  <span className="text-gray-700">{selectedSolicitud.duracion || '—'}</span>
                </div>
              </div>

              {/* Detalles */}
              {selectedSolicitud.detalles && (
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    Detalles adicionales
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedSolicitud.detalles}
                  </p>
                </div>
              )}

              {/* Notas admin */}
              {selectedSolicitud.notasAdmin && (
                <div className="mt-4 p-4 bg-pink-50 border border-pink-500/20 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-pink-600 mb-2">
                    Notas internas
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedSolicitud.notasAdmin}
                  </p>
                </div>
              )}

              {/* Fechas */}
              {(selectedSolicitud.fechaInicio || selectedSolicitud.fechaFin) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {selectedSolicitud.fechaInicio && (
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        Inicio
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(selectedSolicitud.fechaInicio)}
                      </p>
                    </div>
                  )}
                  {selectedSolicitud.fechaFin && (
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        Fin
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(selectedSolicitud.fechaFin)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedSolicitud.telefono && (
                  <button
                    onClick={() => handleWhatsApp(selectedSolicitud)}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600 transition"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowVerModal(false);
                    abrirEditar(selectedSolicitud);
                  }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-pink-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-pink-600 transition"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  onClick={() => setShowVerModal(false)}
                  className="flex-1 min-w-[120px] bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL EDITAR                                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showEditarModal && selectedSolicitud && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditarModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
                  <Edit size={16} className="text-pink-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Editar solicitud</h2>
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
              {/* Info del cliente (solo lectura) */}
              <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                  Cliente
                </p>
                <p className="text-sm font-bold text-gray-900">{selectedSolicitud.negocio}</p>
                <p className="text-xs text-muted-foreground">{selectedSolicitud.nombre}</p>
                {selectedSolicitud.telefono && (
                  <p className="text-xs text-muted-foreground">{selectedSolicitud.telefono}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Estado
                </label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {ESTADOS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Precio final (MXN)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={editForm.precio}
                    onChange={(e) => setEditForm({ ...editForm, precio: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Fecha contacto
                  </label>
                  <input
                    type="date"
                    value={editForm.fechaContacto}
                    onChange={(e) => setEditForm({ ...editForm, fechaContacto: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={editForm.fechaInicio}
                    onChange={(e) => setEditForm({ ...editForm, fechaInicio: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={editForm.fechaFin}
                  onChange={(e) => setEditForm({ ...editForm, fechaFin: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Notas admin */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Notas internas
                </label>
                <textarea
                  value={editForm.notasAdmin}
                  onChange={(e) => setEditForm({ ...editForm, notasAdmin: e.target.value })}
                  rows={3}
                  placeholder="Notas solo visibles para el equipo..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Toggle activo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">Solicitud activa</p>
                  <p className="text-xs text-muted-foreground">
                    Si está inactiva no aparecerá en el listado principal
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editForm.activo}
                  onClick={() => setEditForm({ ...editForm, activo: !editForm.activo })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                    editForm.activo ? 'bg-pink-500' : 'bg-gray-200'
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
                  className="flex-1 flex items-center justify-center gap-2 bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 transition disabled:opacity-50"
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL ELIMINAR                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showEliminarModal && selectedSolicitud && (
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
                ¿Eliminar solicitud?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Vas a eliminar la solicitud de <strong className="text-gray-900">{selectedSolicitud.negocio}</strong>.
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