// src/pages/admin/invitaciones/index.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Sparkles, Search, RefreshCw, Plus, Edit, Trash2, Eye,
  CheckCircle, XCircle, AlertCircle, Star, Phone, Mail,
  Award, ShieldCheck, TrendingUp, Users, Clock, Save, X, ChevronLeft,
  ChevronRight, FileSpreadsheet, User, DollarSign, Ban, Calendar,
  MessageCircle, PartyPopper, Heart, Cake, Crown, Gift, Palette,
  Wand2, Download, ExternalLink, Send
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import pb from '../../../lib/pocketbase';
import { formatMoney } from '../../../lib/utils';

const ITEMS_PER_PAGE = 12;

// ─── Estados ─────────────────────────────────────────────────────────────
const ESTADOS = [
  { value: 'pendiente',   label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700',   icon: Clock },
  { value: 'contactado',  label: 'Contactado',  color: 'bg-blue-100 text-blue-700',       icon: Send },
  { value: 'en_diseno',   label: 'En diseño',   color: 'bg-purple-100 text-purple-700',   icon: Palette },
  { value: 'aprobado',    label: 'Aprobado',    color: 'bg-indigo-100 text-indigo-700',   icon: CheckCircle },
  { value: 'entregado',   label: 'Entregado',   color: 'bg-green-100 text-green-700',     icon: Award },
  { value: 'cancelado',   label: 'Cancelado',   color: 'bg-red-100 text-red-700',         icon: XCircle },
];

// ─── Tipos de evento ─────────────────────────────────────────────────────
const TIPOS = [
  { value: 'boda',    label: 'Bodas',       icon: Heart,       color: 'bg-pink-100 text-pink-700' },
  { value: 'xv',      label: 'XV Años',     icon: Crown,       color: 'bg-purple-100 text-purple-700' },
  { value: 'cumple',  label: 'Cumpleaños',  icon: Cake,        color: 'bg-orange-100 text-orange-700' },
  { value: 'bautizo', label: 'Bautizos',    icon: Gift,        color: 'bg-blue-100 text-blue-700' },
  { value: 'otro',    label: 'Otro evento', icon: PartyPopper, color: 'bg-green-100 text-green-700' },
];

// ─── Estilos ─────────────────────────────────────────────────────────────
const ESTILOS = [
  { value: 'clasico',     label: 'Clásico' },
  { value: 'moderno',     label: 'Moderno' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'floral',      label: 'Floral' },
  { value: 'elegante',    label: 'Elegante' },
  { value: 'divertido',   label: 'Divertido' },
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

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateLong = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ═════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════
export default function AdminInvitacionesPage() {
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
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstilo, setFiltroEstilo] = useState('todos');
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
    precioFinal: 0,
    notasAdmin: '',
    fechaContacto: '',
    fechaEntrega: '',
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
        filters.push(`(nombre ~ "${s}" || nombreEvento ~ "${s}" || email ~ "${s}" || telefono ~ "${s}")`);
      }
      if (filtroEstado !== 'todos') {
        filters.push(`estado = "${filtroEstado}"`);
      }
      if (filtroTipo !== 'todos') {
        filters.push(`tipo = "${filtroTipo}"`);
      }
      if (filtroEstilo !== 'todos') {
        filters.push(`estilo = "${filtroEstilo}"`);
      }
      if (filtroPendientes) {
        filters.push('estado = "pendiente"');
      }
      const filter = filters.length > 0 ? filters.join(' && ') : '';

      const result = await pb.collection('solicitudes_invitaciones').getList(currentPage, ITEMS_PER_PAGE, {
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
  }, [searchTerm, filtroEstado, filtroTipo, filtroEstilo, filtroPendientes, ordenar, currentPage]);

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
  }, [searchTerm, filtroEstado, filtroTipo, filtroEstilo, filtroPendientes, ordenar]);

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
    const enDiseno = solicitudes.filter((s) => s.estado === 'en_diseno').length;
    const ingresos = solicitudes
      .filter((s) => ['aprobado', 'entregado'].includes(s.estado))
      .reduce((sum, s) => sum + (Number(s.precioFinal) || 0), 0);
    return { total, pendientes, enDiseno, ingresos };
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
      precioFinal: Number(sol.precioFinal) || 0,
      notasAdmin: sol.notasAdmin || '',
      fechaContacto: sol.fechaContacto ? sol.fechaContacto.slice(0, 10) : '',
      fechaEntrega: sol.fechaEntrega ? sol.fechaEntrega.slice(0, 10) : '',
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
      await pb.collection('solicitudes_invitaciones').update(selectedSolicitud.id, {
        estado: editForm.estado,
        precioFinal: Number(editForm.precioFinal),
        notasAdmin: editForm.notasAdmin.trim(),
        fechaContacto: editForm.fechaContacto || null,
        fechaEntrega: editForm.fechaEntrega || null,
        activo: editForm.activo,
      });

      setSuccess(`Solicitud de "${selectedSolicitud.nombreEvento}" actualizada`);
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
      await pb.collection('solicitudes_invitaciones').update(sol.id, { estado: nuevoEstado });
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
      await pb.collection('solicitudes_invitaciones').update(sol.id, { activo: nuevo });
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
      await pb.collection('solicitudes_invitaciones').delete(selectedSolicitud.id);
      setSuccess(`Solicitud de "${selectedSolicitud.nombreEvento}" eliminada`);
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
      'Evento', 'Cliente', 'Teléfono', 'Email', 'Tipo', 'Estilo',
      'Fecha evento', 'Estado', 'Precio final', 'Fecha contacto',
      'Fecha entrega', 'Notas admin', 'Activo', 'Creado'
    ];
    const rows = solicitudes.map((s) => [
      s.nombreEvento || '',
      s.nombre || '',
      s.telefono || '',
      s.email || '',
      TIPOS.find((t) => t.value === s.tipo)?.label || s.tipo || '',
      ESTILOS.find((e) => e.value === s.estilo)?.label || s.estilo || '',
      s.fechaEvento ? new Date(s.fechaEvento).toLocaleDateString('es-MX') : '',
      ESTADOS.find((e) => e.value === s.estado)?.label || s.estado || '',
      s.precioFinal || 0,
      s.fechaContacto ? new Date(s.fechaContacto).toLocaleDateString('es-MX') : '',
      s.fechaEntrega ? new Date(s.fechaEntrega).toLocaleDateString('es-MX') : '',
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
    a.download = `invitaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── WhatsApp contacto rápido ───────────────────────────────────────
  const handleWhatsApp = (sol) => {
    if (!sol.telefono) return;
    let num = sol.telefono.replace(/\D/g, '');
    if (!num.startsWith('52') && num.length === 10) num = '52' + num;
    const msg = encodeURIComponent(
      `Hola ${sol.nombre}, te contactamos de MarketDesliz sobre tu invitación digital para "${sol.nombreEvento}".`
    );
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  // ─── Paginación ─────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayoutMinimal>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayoutMinimal>
    );
  }

  return (
    <>
      <Head>
        <title>Invitaciones | Admin MarketDesliz</title>
        <meta name="description" content="Gestión de solicitudes de Invitaciones Digitales" />
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ═══════════════════════════════════════════════════════ */}
          {/* HEADER                                                   */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <Sparkles size={22} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Invitaciones Digitales
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[9px] font-black uppercase tracking-widest">
                    <ShieldCheck size={9} /> Oficial
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de solicitudes de invitaciones
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
                onClick={() => router.push('/admin/invitaciones/nuevo')}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition shadow-lg shadow-green-200"
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
                <div className="bg-green-500/10 p-2.5 rounded-xl">
                  <Sparkles size={20} className="text-green-600" />
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
                <div className="bg-purple-50 p-2.5 rounded-xl">
                  <Palette size={20} className="text-purple-600" />
                </div>
                <span className="text-xs text-muted-foreground">En diseño</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">{stats.enDiseno}</div>
              <div className="text-xs text-muted-foreground mt-1">En proceso</div>
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
              <div className="text-xs text-muted-foreground mt-1">De aprobadas + entregadas</div>
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
                    placeholder="Buscar por evento, cliente, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="todos">Todos los tipos</option>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <select
                value={filtroEstilo}
                onChange={(e) => setFiltroEstilo(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="todos">Todos los estilos</option>
                {ESTILOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>

              <select
                value={ordenar}
                onChange={(e) => setOrdenar(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="-created">Más recientes</option>
                <option value="created">Más antiguas</option>
                <option value="fechaEvento">Fecha del evento</option>
                <option value="nombreEvento">Nombre (A-Z)</option>
              </select>

              <button
                type="button"
                onClick={() => setFiltroPendientes(!filtroPendientes)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  filtroPendientes
                    ? 'bg-green-500 text-white shadow-md shadow-green-200'
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
              {filtroTipo !== 'todos' && ` · ${TIPOS.find((t) => t.value === filtroTipo)?.label}`}
              {filtroEstilo !== 'todos' && ` · Estilo ${ESTILOS.find((e) => e.value === filtroEstilo)?.label}`}
              {filtroPendientes && ' · Solo pendientes'}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* GRID                                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          {solicitudes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {searchTerm || filtroEstado !== 'todos' || filtroTipo !== 'todos' || filtroEstilo !== 'todos' || filtroPendientes
                  ? 'No se encontraron solicitudes'
                  : 'No hay solicitudes de invitaciones'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filtroEstado !== 'todos' || filtroTipo !== 'todos' || filtroEstilo !== 'todos' || filtroPendientes
                  ? 'Prueba con otros filtros o búsqueda'
                  : 'Las solicitudes aparecerán aquí cuando los clientes las envíen'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {solicitudes.map((sol) => {
                  const estadoInfo = ESTADOS.find((e) => e.value === sol.estado) || ESTADOS[0];
                  const tipoInfo = TIPOS.find((t) => t.value === sol.tipo) || TIPOS[4];
                  const estiloLabel = ESTILOS.find((e) => e.value === sol.estilo)?.label || sol.estilo || '—';
                  const EstadoIcon = estadoInfo.icon;
                  const TipoIcon = tipoInfo.icon;
                  const activo = sol.activo !== false;

                  return (
                    <div
                      key={sol.id}
                      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group ${
                        !activo ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Header card con gradient por tipo */}
                      <div className={`relative p-5 bg-gradient-to-br ${tipoInfo.color.replace('text-', 'from-').replace('700', '50')} to-white`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tipoInfo.color}`}>
                            <TipoIcon size={20} />
                          </div>

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

                        {/* Estado badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${estadoInfo.color}`}>
                          <EstadoIcon size={10} />
                          {estadoInfo.label}
                        </span>

                        {/* Tipo + precio */}
                        <div className="mt-4 flex items-baseline justify-between">
                          <span className="text-xl font-black text-gray-900 leading-none">
                            {sol.precioFinal ? formatMoney(sol.precioFinal) : 'Sin cotizar'}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider font-bold ${tipoInfo.color.replace('bg-', 'text-').replace('100', '600')}`}>
                            {tipoInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 space-y-3">
                        {/* Nombre del evento */}
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                            <Sparkles size={10} />
                            Evento
                          </div>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">
                            {sol.nombreEvento || 'Sin nombre'}
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

                        {/* Estilo */}
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                            <Palette size={10} />
                            Estilo
                          </div>
                          <p className="text-xs text-gray-700 line-clamp-1">{estiloLabel}</p>
                        </div>

                        {/* Fecha del evento + creado */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={11} />
                          <span>{formatDate(sol.fechaEvento)}</span>
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
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition"
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
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-green-500 hover:text-green-500 transition"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-green-500 hover:text-green-500 transition"
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
            {/* Header gradient por tipo */}
            {(() => {
              const tipoInfo = TIPOS.find((t) => t.value === selectedSolicitud.tipo) || TIPOS[4];
              const TipoIcon = tipoInfo.icon;
              return (
                <div className={`relative p-6 bg-gradient-to-br ${tipoInfo.color.replace('text-', 'from-').replace('700', '50')} to-white`}>
                  <button
                    onClick={() => setShowVerModal(false)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:bg-white transition"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tipoInfo.color}`}>
                      <TipoIcon size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                        {tipoInfo.label}
                      </p>
                      <p className="text-2xl font-black text-gray-900">
                        {selectedSolicitud.precioFinal ? formatMoney(selectedSolicitud.precioFinal) : 'Sin cotizar'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="p-6">
              {/* Evento */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedSolicitud.nombreEvento}
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
                  <User size={16} className="text-green-500 shrink-0" />
                  <span className="text-gray-700">{selectedSolicitud.nombre}</span>
                </div>
                {selectedSolicitud.telefono && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-green-500 shrink-0" />
                    <span className="text-gray-700">{formatPhone(selectedSolicitud.telefono)}</span>
                  </div>
                )}
                {selectedSolicitud.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-green-500 shrink-0" />
                    <span className="text-gray-700">{selectedSolicitud.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Palette size={16} className="text-green-500 shrink-0" />
                  <span className="text-gray-700">
                    Estilo: {ESTILOS.find((e) => e.value === selectedSolicitud.estilo)?.label || 'Sin especificar'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-green-500 shrink-0" />
                  <span className="text-gray-700">
                    Evento: {formatDateLong(selectedSolicitud.fechaEvento)}
                  </span>
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

              {/* Archivo diseño */}
              {selectedSolicitud.archivoDiseno && (
                <div className="mt-4 p-4 bg-green-50 border border-green-500/20 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-green-600 mb-2">
                    Archivo de diseño
                  </p>
                  <a
                    href={pb.files.getURL(selectedSolicitud, selectedSolicitud.archivoDiseno)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700"
                  >
                    <Download size={14} /> Descargar diseño
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Notas admin */}
              {selectedSolicitud.notasAdmin && (
                <div className="mt-4 p-4 bg-green-50 border border-green-500/20 rounded-2xl">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-green-600 mb-2">
                    Notas internas
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedSolicitud.notasAdmin}
                  </p>
                </div>
              )}

              {/* Fechas */}
              {(selectedSolicitud.fechaContacto || selectedSolicitud.fechaEntrega) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {selectedSolicitud.fechaContacto && (
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        Contacto
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(selectedSolicitud.fechaContacto)}
                      </p>
                    </div>
                  )}
                  {selectedSolicitud.fechaEntrega && (
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        Entrega
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDate(selectedSolicitud.fechaEntrega)}
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
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600 transition"
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
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Edit size={16} className="text-green-600" />
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
              {/* Info del cliente */}
              <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                  Evento
                </p>
                <p className="text-sm font-bold text-gray-900">{selectedSolicitud.nombreEvento}</p>
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {ESTADOS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>

              {/* Precio final */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Precio final (MXN)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={editForm.precioFinal}
                    onChange={(e) => setEditForm({ ...editForm, precioFinal: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Fecha entrega
                  </label>
                  <input
                    type="date"
                    value={editForm.fechaEntrega}
                    onChange={(e) => setEditForm({ ...editForm, fechaEntrega: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
                    editForm.activo ? 'bg-green-500' : 'bg-gray-200'
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
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
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
                Vas a eliminar la solicitud de <strong className="text-gray-900">{selectedSolicitud.nombreEvento}</strong>.
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