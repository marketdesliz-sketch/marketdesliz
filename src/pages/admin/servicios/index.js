// src/pages/admin/servicios/index.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Wrench, Search, Eye, Edit, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, Plus, FileSpreadsheet,
  CheckCircle, XCircle, AlertCircle, Star, BadgeCheck, ShieldCheck,
  Package, TrendingUp, MapPin, Phone, MessageCircle, Mail,
  Globe, Clock, Calendar, X, Save, Upload, Tag, DollarSign,
  Box, Layers, ExternalLink, Ban, Send, Crown, Heart, Gift,
  Palette, FileText, Image as ImageIcon, Building2, User,
  // iconMap
  Droplet, Zap, Hammer, Paintbrush, Sofa, TreePine, Key, Laptop,
  Scissors, Wind, Bike, Truck, Cake, PartyPopper, Sparkles,
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import pb from '../../../lib/pocketbase';
import {
  getServicios,
  getServicioById,
  getServicioCategorias,
  createServicio,
  updateServicio,
  getEstados,
  getMunicipios,
  getLocalidades,
  getSectores,
  createCategoria,
  createMunicipio,
  createLocalidad,
  getFavoritosCount,
  getTotalFavoritos,
} from '../../../lib/serviciosService';
import { formatMoney } from '../../../lib/utils';

const ITEMS_PER_PAGE = 12;

// ═════════════════════════════════════════════════════════════════════════
// ESTADOS DE ACTIVACIÓN (schema: estadoActivacion select)
// ═════════════════════════════════════════════════════════════════════════
const ESTADOS_ACTIVACION = [
  { value: 'activo', label: 'Activo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'pendiente_activacion', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'inactivo', label: 'Inactivo', color: 'bg-gray-100 text-gray-600', icon: XCircle },
];

// ═════════════════════════════════════════════════════════════════════════
// ICONOS POR CATEGORÍA
// ═════════════════════════════════════════════════════════════════════════
const iconMap = {
  'plomería': Droplet, 'plomeria': Droplet,
  'electricidad': Zap,
  'albañilería': Hammer, 'albanileria': Hammer,
  'pintura': Paintbrush,
  'carpintería': Sofa, 'carpinteria': Sofa,
  'herrería': Hammer, 'herreria': Hammer,
  'jardinería': TreePine, 'jardineria': TreePine,
  'limpieza': Sparkles,
  'aire acondicionado': Wind,
  'cerrajería': Key, 'cerrajeria': Key,
  'computación': Laptop, 'computacion': Laptop,
  'belleza': Scissors,
  'entrega en moto': Bike,
  'viajes en moto': Bike,
  'mandados': Truck,
  'invitaciones': PartyPopper,
  'tarjetas de 15 años': Cake,
  'eventos especiales': PartyPopper,
};

const getIcon = (nombre) => {
  const lower = (nombre || '').toLowerCase().trim();
  if (iconMap[lower]) return iconMap[lower];
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key) || key.includes(lower)) return icon;
  }
  return Wrench;
};

// ═════════════════════════════════════════════════════════════════════════
// FORM VACÍO (solo campos escalares; los files se manejan aparte)
// ═════════════════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  nombre: '',
  categoriaId: '',
  descripcion: '',
  servicios: '',
  precioBase: '',
  esMarketDesliz: false,
  estadoActivacion: 'pendiente_activacion',
  orden: '',
  activo: true,
  destacado: false,
  verificado: false,
  telefono: '',
  whatsapp: '',
  email: '',
  horario: '',
  atencionWhatsapp: true,
  citasPrevias: false,
  domicilio: false,
  direccion: '',
  estadoId: '',
  municipioId: '',
  localidadId: '',
  sectorId: '',
  codigoPostal: '',
  latitud: '',
  longitud: '',
  ubicacion: '',
  sitioWeb: '',
  facebook: '',
  instagram: '',
  tiktok: '',
};

// ═════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═════════════════════════════════════════════════════════════════════════
function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-3 border-b border-gray-100">
      <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
        <Icon size={13} className="text-primary" />
      </div>
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{children}</h3>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const info = ESTADOS_ACTIVACION.find((e) => e.value === estado) || ESTADOS_ACTIVACION[1];
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${info.color}`}>
      <Icon size={10} />
      {info.label}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// PÁGINA
// ═════════════════════════════════════════════════════════════════════════
export default function AdminServiciosPage() {
  const router = useRouter();

  // ─── URL params ──────────────────────────────────────────────────────
  const {
    page = 1,
    search = '',
    categoriaId = 'todas',
    tipo = 'todos',
    estado = 'todos',
    destacados = '',
    verificados = '',
    sort = '-created',
  } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estado principal ────────────────────────────────────────────────
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Filtros ─────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [filterCategoriaId, setFilterCategoriaId] = useState(categoriaId || 'todas');
  const [filterTipo, setFilterTipo] = useState(tipo || 'todos');
  const [filterEstado, setFilterEstado] = useState(estado || 'todos');
  const [filterDestacados, setFilterDestacados] = useState(destacados === 'true');
  const [filterVerificados, setFilterVerificados] = useState(verificados === 'true');
  const [sortBy, setSortBy] = useState(sort || '-created');

  // ─── Categorías dinámicas ────────────────────────────────────────────
  const [categoriasList, setCategoriasList] = useState([]);

  // ─── Geografía (estados para el select del modal) ────────────────────
  const [estadosList, setEstadosList] = useState([]);
  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);
  const [sectoresList, setSectoresList] = useState([]);
  const [veracruzId, setVeracruzId] = useState('');

  // ─── Stats (8 cards) ─────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    marketdesliz: 0,
    proveedores: 0,
    destacados: 0,
    verificados: 0,
    pendientes: 0,
    visitasTotal: 0,
    favoritosTotal: 0,
  });

  // ─── Modales ─────────────────────────────────────────────────────────
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [selectedServicioFavoritos, setSelectedServicioFavoritos] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ─── Modal crear/editar ──────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── Archivos ────────────────────────────────────────────────────────
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesAEliminar, setImagenesAEliminar] = useState([]);

  // ─── Inline: crear categoría ─────────────────────────────────────────
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // ─── Inline: crear municipio ─────────────────────────────────────────
  const [showNewMunicipio, setShowNewMunicipio] = useState(false);
  const [newMunicipioName, setNewMunicipioName] = useState('');
  const [creatingMunicipio, setCreatingMunicipio] = useState(false);

  // ─── Inline: crear localidad ─────────────────────────────────────────
  const [showNewLocalidad, setShowNewLocalidad] = useState(false);
  const [newLocalidadName, setNewLocalidadName] = useState('');
  const [creatingLocalidad, setCreatingLocalidad] = useState(false);

  // ═════════════════════════════════════════════════════════════════════
  // EFECTOS
  // ═════════════════════════════════════════════════════════════════════

  // Auto-clear success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // Auto-clear error
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Cargar categorías con counts al montar
  useEffect(() => {
    cargarCategoriasConCounts();
  }, []);

  // Cargar estados + veracruz id al montar (para el modal)
  useEffect(() => {
    getEstados().then(setEstadosList).catch(() => { });
    pb.collection('estados')
      .getFullList({ filter: 'nombre = "Veracruz"', limit: 1 })
      .then((list) => { if (list.length > 0) setVeracruzId(list[0].id); })
      .catch(() => { });
  }, []);

  // Cascada geográfica — municipios
  useEffect(() => {
    if (formData.estadoId) {
      getMunicipios(formData.estadoId).then(setMunicipiosList).catch(() => setMunicipiosList([]));
    } else {
      setMunicipiosList([]);
    }
  }, [formData.estadoId]);

  // Cascada — localidades
  useEffect(() => {
    if (formData.municipioId) {
      getLocalidades(formData.municipioId).then(setLocalidadesList).catch(() => setLocalidadesList([]));
    } else {
      setLocalidadesList([]);
    }
  }, [formData.municipioId]);

  // Cascada — sectores
  useEffect(() => {
    if (formData.localidadId) {
      getSectores(formData.localidadId).then(setSectoresList).catch(() => setSectoresList([]));
    } else {
      setSectoresList([]);
    }
  }, [formData.localidadId]);

  // Escape key handler con protección de inline inputs
  useEffect(() => {
    if (!showModal) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showNewCategory || showNewMunicipio || showNewLocalidad) return;
        e.preventDefault();
        cerrarModal();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, showNewCategory, showNewMunicipio, showNewLocalidad]);

  // ═════════════════════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ═════════════════════════════════════════════════════════════════════

  const cargarCategoriasConCounts = useCallback(async () => {
    try {
      const cats = await getServicioCategorias();

      // Counts reales de servicios por categoría
      let counts = {};
      try {
        const records = await pb
          .collection('servicios')
          .getFullList({ fields: 'categoriaId' });
        records.forEach((r) => {
          if (r.categoriaId) counts[r.categoriaId] = (counts[r.categoriaId] || 0) + 1;
        });
      } catch (e) { /* silencioso */ }

      setCategoriasList(cats.map((c) => ({ ...c, count: counts[c.id] || 0 })));
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }, []);

  const cargarDatos = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);
        setSuccess('');

        // Determinar filtro de tipo
        let soloMarketDesliz = null;
        if (filterTipo === 'marketdesliz') soloMarketDesliz = true;
        else if (filterTipo === 'proveedores') soloMarketDesliz = false;

        const result = await getServicios({
          page: currentPage,
          perPage: ITEMS_PER_PAGE,
          search: searchTerm,
          categoriaId: filterCategoriaId,          // ✅ ahora es ID
          soloMarketDesliz,
          destacados: filterDestacados,
          sort: sortBy,
          incluirInactivos: true,                  // ✅ admin ve todo
          estadoActivacion: filterEstado === 'todos' ? null : filterEstado,
          verificado: filterVerificados ? true : null,
        });

        setServicios(result.items);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);

        if (!showRefreshing) await cargarStats();
      } catch (err) {
        console.error('Error cargando servicios:', err);
        setError('No se pudieron cargar los servicios. Intenta de nuevo.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, searchTerm, filterCategoriaId, filterTipo, filterEstado, filterDestacados, filterVerificados, sortBy]
  );

  const cargarStats = async () => {
    try {
      const [all, activos, md, proveedores, destacados, verificados, pendientes, favoritosTotal] = await Promise.all([
        pb.collection('servicios').getList(1, 1, { fields: 'id' }),
        pb.collection('servicios').getList(1, 1, { filter: 'activo = true', fields: 'id' }),
        pb.collection('servicios').getList(1, 1, { filter: 'esMarketDesliz = true', fields: 'id' }),
        pb.collection('servicios').getList(1, 1, { filter: 'esMarketDesliz = false', fields: 'id' }),
        pb.collection('servicios').getList(1, 1, { filter: 'destacado = true', fields: 'id' }),
        pb.collection('servicios').getList(1, 1, { filter: 'verificado = true', fields: 'id' }),
        pb.collection('servicios').getList(1, 1, { filter: 'estadoActivacion = "pendiente_activacion"', fields: 'id' }),
        getTotalFavoritos(),
      ]);

      let visitas = 0;
      try {
        const records = await pb.collection('servicios').getFullList({ fields: 'visitas' });
        visitas = records.reduce((sum, r) => sum + (r.visitas || 0), 0);
      } catch (e) { /* silencioso */ }

      setStats({
        total: all.totalItems,
        activos: activos.totalItems,
        marketdesliz: md.totalItems,
        proveedores: proveedores.totalItems,
        destacados: destacados.totalItems,
        verificados: verificados.totalItems,
        pendientes: pendientes.totalItems,
        visitasTotal: visitas,
        favoritosTotal: typeof favoritosTotal === 'number' ? favoritosTotal : 0,
      });
    } catch (err) {
      console.error('Error cargando stats:', err);
    }
  };

  // Verificar admin + cargar datos
  useEffect(() => {
    const verificarAdmin = () => {
      if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
        router.push('/admin/login');
        return false;
      }
      return true;
    };
    if (verificarAdmin()) cargarDatos();
  }, [cargarDatos, router]);

  // ═════════════════════════════════════════════════════════════════════
  // URL + FILTROS
  // ═════════════════════════════════════════════════════════════════════

  const actualizarURL = useCallback(
    (params) => {
      const query = {
        page: currentPage > 1 ? currentPage : undefined,
        search: searchTerm || undefined,
        categoriaId: filterCategoriaId !== 'todas' ? filterCategoriaId : undefined,
        tipo: filterTipo !== 'todos' ? filterTipo : undefined,
        estado: filterEstado !== 'todos' ? filterEstado : undefined,
        destacados: filterDestacados ? 'true' : undefined,
        verificados: filterVerificados ? 'true' : undefined,
        sort: sortBy !== '-created' ? sortBy : undefined,
        ...params,
      };
      Object.keys(query).forEach((key) => {
        if (query[key] === undefined || query[key] === '') delete query[key];
      });
      router.push({ pathname: '/admin/servicios', query }, undefined, { shallow: true });
    },
    [currentPage, searchTerm, filterCategoriaId, filterTipo, filterEstado, filterDestacados, filterVerificados, sortBy, router]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    setSearchTerm(term);
    actualizarURL({ search: term, page: 1 });
  };

  const handleCategoriaChange = (val) => {
    setFilterCategoriaId(val);
    actualizarURL({ categoriaId: val, page: 1 });
  };

  const handleTipoChange = (val) => {
    setFilterTipo(val);
    actualizarURL({ tipo: val, page: 1 });
  };

  const handleEstadoChange = (val) => {
    setFilterEstado(val);
    actualizarURL({ estado: val, page: 1 });
  };

  const handleDestacadosToggle = () => {
    const nuevo = !filterDestacados;
    setFilterDestacados(nuevo);
    actualizarURL({ destacados: nuevo ? 'true' : undefined, page: 1 });
  };

  const handleVerificadosToggle = () => {
    const nuevo = !filterVerificados;
    setFilterVerificados(nuevo);
    actualizarURL({ verificados: nuevo ? 'true' : undefined, page: 1 });
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    actualizarURL({ sort: val, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    actualizarURL({ page: newPage });
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterCategoriaId('todas');
    setFilterTipo('todos');
    setFilterEstado('todos');
    setFilterDestacados(false);
    setFilterVerificados(false);
    setSortBy('-created');
    router.push('/admin/servicios', undefined, { shallow: true });
  };

  const categoriaActivaNombre =
    filterCategoriaId !== 'todas'
      ? categoriasList.find((c) => c.id === filterCategoriaId)?.nombre || filterCategoriaId
      : null;

  // ═════════════════════════════════════════════════════════════════════
  // ACCIONES RÁPIDAS (desde cards)
  // ═════════════════════════════════════════════════════════════════════

  const toggleActivo = async (servicio) => {
    try {
      await pb.collection('servicios').update(servicio.id, { activo: !servicio.activo });
      setSuccess(servicio.activo ? 'Servicio desactivado' : 'Servicio activado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar estado');
    }
  };

  const toggleDestacado = async (servicio) => {
    try {
      await pb.collection('servicios').update(servicio.id, { destacado: !servicio.destacado });
      setSuccess(servicio.destacado ? 'Removido de destacados' : 'Marcado como destacado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar destacado');
    }
  };

  const toggleVerificado = async (servicio) => {
    try {
      await pb.collection('servicios').update(servicio.id, { verificado: !servicio.verificado });
      setSuccess(servicio.verificado ? 'Verificación removida' : 'Servicio verificado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar verificación');
    }
  };

  const aprobarServicio = async (servicio) => {
    try {
      await pb.collection('servicios').update(servicio.id, {
        estadoActivacion: 'activo',
        activo: true,
      });
      setSuccess('Servicio aprobado y publicado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al aprobar');
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // VER / EDITAR / ELIMINAR
  // ═════════════════════════════════════════════════════════════════════

  const verDetalle = async (servicio) => {
    try {
      const [completo, favCount] = await Promise.all([
        getServicioById(servicio.id),
        getFavoritosCount(servicio.id),
      ]);
      setSelectedServicio(completo || servicio);
      setSelectedServicioFavoritos(favCount);
      setShowDetailModal(true);
    } catch (err) {
      setSelectedServicio(servicio);
      setSelectedServicioFavoritos(0);
      setShowDetailModal(true);
    }
  };

  const verEnTienda = (servicio) => {
    window.open(`/servicios/${servicio.id}`, '_blank', 'noopener,noreferrer');
  };

  const abrirEliminar = (servicio) => {
    setSelectedServicio(servicio);
    setShowDeleteModal(true);
  };

  const eliminarServicioConfirm = async () => {
    if (!selectedServicio) return;
    try {
      await pb.collection('servicios').delete(selectedServicio.id);
      setSuccess('Servicio eliminado');
      setShowDeleteModal(false);
      await cargarDatos(true);
      await cargarCategoriasConCounts();
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar el servicio');
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // MODAL CREAR/EDITAR — Helpers
  // ═════════════════════════════════════════════════════════════════════

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setLogoFile(null);
    setLogoPreview(null);
    setImagenesFiles([]);
    setImagenesPreviews([]);
    setImagenesExistentes([]);
    setImagenesAEliminar([]);
    setFormError('');
    setShowNewCategory(false);
    setNewCategoryName('');
    setShowNewMunicipio(false);
    setNewMunicipioName('');
    setShowNewLocalidad(false);
    setNewLocalidadName('');
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditingServicio(null);
    resetForm();
  };

  const handleCreateNew = () => {
    resetForm();
    setEditingServicio(null);
    setShowModal(true);
  };

  const handleEdit = async (servicio) => {
    try {
      // Cargamos raw para tener acceso a nombres de archivos
      const raw = await pb.collection('servicios').getOne(servicio.id, {
        expand: 'categoriaId,municipioId,localidadId,sectorId,userId',
      });
      const mapped = await getServicioById(servicio.id);
      const base = mapped || servicio;

      setEditingServicio(base);

      setFormData({
        nombre: base.nombre || '',
        categoriaId: base.categoriaId || '',
        descripcion: base.descripcion || '',
        servicios: base.servicios || '',
        precioBase: base.precioBase ?? '',
        esMarketDesliz: base.esMarketDesliz === true,
        estadoActivacion: base.estadoActivacion || 'pendiente_activacion',
        orden: base.orden ?? '',
        activo: base.activo !== false,
        destacado: base.destacado === true,
        verificado: base.verificado === true,
        telefono: base.telefono || '',
        whatsapp: base.whatsapp || '',
        email: base.email || '',
        horario: base.horario || '',
        atencionWhatsapp: base.atencionWhatsapp !== false,
        citasPrevias: base.citasPrevias === true,
        domicilio: base.domicilio === true,
        direccion: base.direccion || '',
        estadoId: base.estadoId || '',
        municipioId: base.municipioId || '',
        localidadId: base.localidadId || '',
        sectorId: base.sectorId || '',
        codigoPostal: base.codigoPostal || '',
        latitud: base.latitud ?? '',
        longitud: base.longitud ?? '',
        ubicacion: base.ubicacion || '',
        sitioWeb: base.sitioWeb || '',
        facebook: base.facebook || '',
        instagram: base.instagram || '',
        tiktok: base.tiktok || '',
      });

      // Imagen principal (preview con URL)
      if (raw.logo) {
        setLogoPreview(pb.files.getURL(raw, raw.logo));
      } else {
        setLogoPreview(null);
      }

      // Imágenes adicionales existentes (guardar los FILENAMES para eventual borrado)
      if (raw.imagenes) {
        const arr = Array.isArray(raw.imagenes) ? raw.imagenes : [raw.imagenes];
        setImagenesExistentes(arr.filter(Boolean));
      } else {
        setImagenesExistentes([]);
      }

      setLogoFile(null);
      setImagenesFiles([]);
      setImagenesPreviews([]);
      setImagenesAEliminar([]);
      setFormError('');
      setShowNewCategory(false);
      setNewCategoryName('');
      setShowNewMunicipio(false);
      setNewMunicipioName('');
      setShowNewLocalidad(false);
      setNewLocalidadName('');

      setShowModal(true);
    } catch (err) {
      console.error('Error abriendo editor:', err);
      setError('Error al abrir el editor');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === 'logo') {
      const file = files[0];
      setLogoFile(file || null);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setLogoPreview(null);
      }
      return;
    }

    if (name === 'imagenes') {
      const fileList = Array.from(files);
      setImagenesFiles(fileList);
      const previews = [];
      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === fileList.length) setImagenesPreviews(previews);
        };
        reader.readAsDataURL(file);
      });
      return;
    }

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const eliminarImagenExistente = (filename) => {
    setImagenesAEliminar((prev) => [...prev, filename]);
    setImagenesExistentes((prev) => prev.filter((f) => f !== filename));
  };

  // ─── Inline: crear categoría ────────────────────────────────────────
  const handleCreateCategory = async () => {
    const nombre = newCategoryName.trim();
    if (!nombre) {
      setFormError('El nombre de la categoría es obligatorio');
      return;
    }
    setCreatingCategory(true);
    setFormError('');
    try {
      const nueva = await createCategoria(nombre, 'servicios');
      await cargarCategoriasConCounts();
      setFormData((prev) => ({ ...prev, categoriaId: nueva.id }));
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (err) {
      console.error('Error creando categoría:', err);
      setFormError(err?.message || 'No se pudo crear la categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  // ─── Inline: crear municipio ────────────────────────────────────────
  const handleCreateMunicipio = async () => {
    const nombre = newMunicipioName.trim();
    if (!nombre) {
      setFormError('El nombre del municipio es obligatorio');
      return;
    }
    if (!veracruzId) {
      setFormError('No se encontró el estado Veracruz');
      return;
    }
    setCreatingMunicipio(true);
    setFormError('');
    try {
      const nuevo = await createMunicipio(nombre, veracruzId);
      const municipios = await getMunicipios(veracruzId);
      setMunicipiosList(municipios);
      // Reasignar a Veracruz si no hay estado seleccionado
      setFormData((prev) => ({
        ...prev,
        estadoId: prev.estadoId || veracruzId,
        municipioId: nuevo.id,
        localidadId: '',
        sectorId: '',
      }));
      setNewMunicipioName('');
      setShowNewMunicipio(false);
      setShowNewLocalidad(false);
      setNewLocalidadName('');
    } catch (err) {
      console.error('Error creando municipio:', err);
      setFormError(err?.message || 'No se pudo crear el municipio');
    } finally {
      setCreatingMunicipio(false);
    }
  };

  // ─── Inline: crear localidad ────────────────────────────────────────
  const handleCreateLocalidad = async () => {
    const nombre = newLocalidadName.trim();
    if (!nombre) {
      setFormError('El nombre de la localidad es obligatorio');
      return;
    }
    if (!formData.municipioId) {
      setFormError('Primero selecciona un municipio');
      return;
    }
    setCreatingLocalidad(true);
    setFormError('');
    try {
      const nueva = await createLocalidad(nombre, formData.municipioId);
      const localidades = await getLocalidades(formData.municipioId);
      setLocalidadesList(localidades);
      setFormData((prev) => ({ ...prev, localidadId: nueva.id, sectorId: '' }));
      setNewLocalidadName('');
      setShowNewLocalidad(false);
    } catch (err) {
      console.error('Error creando localidad:', err);
      setFormError(err?.message || 'No se pudo crear la localidad');
    } finally {
      setCreatingLocalidad(false);
    }
  };

  // ─── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.nombre.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    if (!formData.categoriaId) {
      setFormError('Selecciona una categoría');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const fd = new FormData();

      // Escalares
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value === null || value === undefined || value === '') return;
        if (typeof value === 'boolean') {
          fd.append(key, value ? 'true' : 'false');
        } else {
          fd.append(key, value);
        }
      });

      // Archivos nuevos
      if (logoFile) fd.append('logo', logoFile);
      imagenesFiles.forEach((file) => fd.append('imagenes', file));

      // Imágenes a eliminar (sintaxis PB: `imagenes-` con el filename)
      imagenesAEliminar.forEach((filename) => {
        fd.append('imagenes-', filename);
      });

      if (editingServicio) {
        await updateServicio(editingServicio.id, fd);
        setSuccess('Servicio actualizado');
      } else {
        await createServicio(fd);
        setSuccess('Servicio creado');
      }

      cerrarModal();
      await cargarDatos(true);
      await cargarCategoriasConCounts();
    } catch (err) {
      console.error('Error guardando:', err);
      setFormError(err?.message || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // EXPORT EXCEL
  // ═════════════════════════════════════════════════════════════════════
  const exportarExcel = () => {
    const data = servicios.map((s) => ({
      ID: s.id,
      Nombre: s.nombre,
      Categoría: s.categoriaNombre || '',
      Tipo: s.esMarketDesliz ? 'MarketDesliz' : 'Proveedor',
      Estado: ESTADOS_ACTIVACION.find((e) => e.value === s.estadoActivacion)?.label || s.estadoActivacion,
      'Precio base': s.precioBase || 0,
      Dirección: s.direccion || '',
      Teléfono: s.telefono || '',
      WhatsApp: s.whatsapp || '',
      Verificado: s.verificado ? 'Sí' : 'No',
      Activo: s.activo ? 'Sí' : 'No',
      Destacado: s.destacado ? 'Sí' : 'No',
      Visitas: s.visitas || 0,
      'Fecha creación': s.creado ? new Date(s.creado).toLocaleDateString('es-MX') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Servicios');
    XLSX.writeFile(workbook, `servicios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ═════════════════════════════════════════════════════════════════════
  // STATS DERIVADAS (memo)
  // ═════════════════════════════════════════════════════════════════════
  const hayFiltrosActivos = useMemo(
    () =>
      searchTerm ||
      filterCategoriaId !== 'todas' ||
      filterTipo !== 'todos' ||
      filterEstado !== 'todos' ||
      filterDestacados ||
      filterVerificados,
    [searchTerm, filterCategoriaId, filterTipo, filterEstado, filterDestacados, filterVerificados]
  );

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  // Loading inicial
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
        <title>Servicios | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ═══ HEADER ═══ */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Wrench size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Servicios
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                    <ShieldCheck size={9} /> Admin
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona servicios de proveedores y servicios oficiales
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => cargarDatos(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 h-10 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              <button
                onClick={exportarExcel}
                disabled={servicios.length === 0}
                className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-black text-sm font-semibold transition disabled:opacity-50"
              >
                <FileSpreadsheet size={16} /> Exportar Excel
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition"
              >
                <Plus size={16} /> Nuevo servicio
              </button>
            </div>
          </div>

          {/* ═══ ALERTAS ═══ */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-2 text-green-700">
              <CheckCircle size={18} className="shrink-0" />
              <span className="text-sm">{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto text-sm font-medium hover:underline">
                Descartar
              </button>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-sm font-medium hover:underline">
                Descartar
              </button>
            </div>
          )}

          {/* ═══ STATS (9 cards) ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mb-6">
            {[
              { icon: Package, label: 'Total', value: stats.total, color: 'text-primary' },
              { icon: CheckCircle, label: 'Activos', value: stats.activos, color: 'text-green-500' },
              { icon: BadgeCheck, label: 'MD', value: stats.marketdesliz, color: 'text-primary' },
              { icon: Wrench, label: 'Proveedores', value: stats.proveedores, color: 'text-primary' },
              { icon: Star, label: 'Destacados', value: stats.destacados, color: 'text-yellow-500' },
              { icon: ShieldCheck, label: 'Verificados', value: stats.verificados, color: 'text-green-600' },
              { icon: Clock, label: 'Pendientes', value: stats.pendientes, color: 'text-yellow-600' },
              { icon: TrendingUp, label: 'Visitas', value: stats.visitasTotal, color: 'text-primary' },
              { icon: Heart, label: 'Favoritos', value: stats.favoritosTotal, color: 'text-red-500' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
                <div className="text-2xl font-bold text-gray-900 tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ═══ FILTROS ═══ */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 flex-wrap">
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                  placeholder="Buscar por nombre, categoría o dirección..."
                />
              </form>

              <select
                value={filterCategoriaId}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent max-w-[220px]"
              >
                <option value="todas">Todas las categorías</option>
                {categoriasList.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    disabled={cat.esPadre && cat.tieneHijos}
                  >
                    {cat.depth === 1 ? '  └─ ' : ''}
                    {cat.nombre}
                    {cat.count > 0 ? ` (${cat.count})` : ' (0)'}
                    {cat.esPadre && cat.tieneHijos ? ' · agrupador' : ''}
                  </option>
                ))}
              </select>

              <select
                value={filterTipo}
                onChange={(e) => handleTipoChange(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="todos">Todos los tipos</option>
                <option value="marketdesliz">Solo MarketDesliz</option>
                <option value="proveedores">Solo proveedores</option>
              </select>

              <select
                value={filterEstado}
                onChange={(e) => handleEstadoChange(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                {ESTADOS_ACTIVACION.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>

              <button
                onClick={handleDestacadosToggle}
                className={`flex items-center gap-2 px-4 h-10 rounded-2xl border text-sm font-medium transition ${filterDestacados
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Star className={`w-4 h-4 ${filterDestacados ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                Destacados
              </button>

              <button
                onClick={handleVerificadosToggle}
                className={`flex items-center gap-2 px-4 h-10 rounded-2xl border text-sm font-medium transition ${filterVerificados
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <ShieldCheck className={`w-4 h-4 ${filterVerificados ? 'text-green-600' : ''}`} />
                Verificados
              </button>

              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="-created">Más recientes</option>
                <option value="created">Más antiguos</option>
                <option value="nombre">Por nombre</option>
                <option value="precioBase">Menor precio</option>
                <option value="-precioBase">Mayor precio</option>
                <option value="-visitas">Más visitados</option>
              </select>
            </div>

            {hayFiltrosActivos && (
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span>Filtros activos:</span>
                {searchTerm && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{searchTerm}</span>
                )}
                {categoriaActivaNombre && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{categoriaActivaNombre}</span>
                )}
                {filterTipo !== 'todos' && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">{filterTipo}</span>
                )}
                {filterEstado !== 'todos' && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {ESTADOS_ACTIVACION.find((e) => e.value === filterEstado)?.label}
                  </span>
                )}
                {filterDestacados && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Destacados</span>
                )}
                {filterVerificados && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Verificados</span>
                )}
                <button onClick={limpiarFiltros} className="ml-2 text-primary hover:underline font-medium">
                  Limpiar
                </button>
              </div>
            )}

            <div className="mt-3 text-sm text-muted-foreground">
              {servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'} mostrados
              {totalItems > 0 && ` · ${totalItems} en total`}
            </div>
          </div>

          {/* ═══ GRID ═══ */}
          {servicios.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No se encontraron servicios</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hayFiltrosActivos
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Registra el primer servicio'}
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition"
              >
                <Plus size={16} /> Nuevo servicio
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {servicios.map((servicio) => {
                  const IconComponent = getIcon(servicio.categoriaNombre || servicio.nombre);
                  const activo = servicio.activo !== false;
                  return (
                    <div
                      key={servicio.id}
                      className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col ${!activo ? 'opacity-70' : ''
                        }`}
                    >
                      {/* Imagen */}
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        {servicio.imagen ? (
                          <img
                            src={servicio.imagen}
                            alt={servicio.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                            <IconComponent className="w-12 h-12 text-primary/40" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          {servicio.esMarketDesliz && (
                            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <BadgeCheck size={10} /> Oficial
                            </span>
                          )}
                          {servicio.verificado && !servicio.esMarketDesliz && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck size={10} /> Verificado
                            </span>
                          )}
                          {servicio.estadoActivacion === 'pendiente_activacion' && (
                            <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock size={10} /> Pendiente
                            </span>
                          )}
                          {!activo && (
                            <span className="bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Inactivo
                            </span>
                          )}
                        </div>

                        {/* Toggle destacado */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDestacado(servicio);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                          title={servicio.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
                        >
                          <Star
                            className={`w-4 h-4 ${servicio.destacado ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
                              }`}
                          />
                        </button>
                      </div>

                      {/* Contenido */}
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="font-bold text-sm text-gray-800 line-clamp-1 mb-1">
                          {servicio.nombre}
                        </h3>

                        {servicio.categoriaNombre && (
                          <span className="inline-block self-start text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-2">
                            {servicio.categoriaNombre}
                          </span>
                        )}

                        <div className="mb-2">
                          {servicio.precioBase > 0 ? (
                            <p className="text-base font-black text-gray-900">
                              {formatMoney(servicio.precioBase)}
                              <span className="text-xs font-medium text-muted-foreground"> / desde</span>
                            </p>
                          ) : (
                            <p className="text-sm font-bold text-primary">Consultar precio</p>
                          )}
                        </div>

                        {servicio.direccion && (
                          <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="line-clamp-1">{servicio.direccion}</span>
                          </div>
                        )}

                        <div className="text-[10px] text-muted-foreground mb-3">
                          {servicio.visitas || 0} visitas
                        </div>

                        {/* Acciones principales */}
                        <div className="mt-auto">
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => verDetalle(servicio)}
                              className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl border border-gray-200 text-gray-600 hover:border-primary hover:text-primary text-xs font-medium transition"
                              title="Ver detalle"
                            >
                              <Eye className="w-3 h-3" /> Ver
                            </button>
                            <button
                              onClick={() => handleEdit(servicio)}
                              className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition"
                              title="Editar"
                            >
                              <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => abrirEliminar(servicio)}
                              className="flex items-center justify-center w-9 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Aprobar si pendiente */}
                          {servicio.estadoActivacion === 'pendiente_activacion' && (
                            <button
                              onClick={() => aprobarServicio(servicio)}
                              className="w-full mt-2 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
                            >
                              Aprobar servicio
                            </button>
                          )}

                          {/* Verificar proveedor (no MD, no pendiente) */}
                          {!servicio.esMarketDesliz && servicio.estadoActivacion !== 'pendiente_activacion' && (
                            <button
                              onClick={() => toggleVerificado(servicio)}
                              className={`w-full mt-2 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition ${servicio.verificado
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                              {servicio.verificado ? 'Verificado' : 'Marcar verificado'}
                            </button>
                          )}

                          {/* Toggle activo */}
                          <button
                            onClick={() => toggleActivo(servicio)}
                            className={`w-full mt-2 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition ${servicio.activo
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                          >
                            {servicio.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} · {totalItems} servicios
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 h-10 rounded-2xl border border-gray-200 text-gray-600 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 h-10 rounded-2xl border border-gray-200 text-gray-600 text-sm disabled:opacity-40 hover:border-primary hover:text-primary transition"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayoutMinimal>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL CREAR / EDITAR                                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={cerrarModal}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fijo */}
            <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Wrench size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingServicio ? 'Editar servicio' : 'Nuevo servicio'}
                </h2>
              </div>
              <button
                onClick={cerrarModal}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body scrollable */}
            <form
              id="servicio-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ═══ SECCIÓN 1 · Información básica ═══ */}
              <div>
                <SectionTitle icon={FileText}>Información básica</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Ej: Plomería Los Hermanos"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Tag size={12} className="text-gray-400" /> Categoría *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategory((v) => !v);
                          setShowNewMunicipio(false);
                          setShowNewLocalidad(false);
                        }}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Nueva
                      </button>
                    </div>
                    <select
                      name="categoriaId"
                      value={formData.categoriaId}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm appearance-none"
                    >
                      <option value="">Selecciona una categoría</option>
                      {categoriasList.map((cat) => (
                        <option
                          key={cat.id}
                          value={cat.id}
                          disabled={cat.esPadre && cat.tieneHijos}
                        >
                          {cat.depth === 1 ? '  └─ ' : ''}
                          {cat.nombre}
                          {cat.esPadre && cat.tieneHijos ? ' (agrupador)' : ''}
                        </option>
                      ))}
                    </select>

                    {categoriasList.length === 0 && !showNewCategory && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-amber-800">
                              Aún no hay categorías de servicios.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowNewCategory(true)}
                              className="text-xs font-bold text-amber-900 hover:underline mt-1"
                            >
                              Crear la primera categoría →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showNewCategory && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ej: Plomería, Electricidad..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); }
                            if (e.key === 'Escape') {
                              e.preventDefault(); e.stopPropagation();
                              setShowNewCategory(false); setNewCategoryName('');
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={creatingCategory || !newCategoryName.trim()}
                            className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition flex items-center justify-center gap-1"
                          >
                            {creatingCategory ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creando...
                              </>
                            ) : (
                              <>
                                <Save size={12} /> Crear
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                            className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Se creará con <code className="bg-white px-1 rounded">vertical: "servicios"</code>.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <DollarSign size={12} className="text-gray-400" /> Precio base (opcional)
                    </label>
                    <input
                      type="number"
                      name="precioBase"
                      value={formData.precioBase}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                      placeholder="Describe el servicio, experiencia, especialidades…"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Otros servicios (separados por coma)
                    </label>
                    <input
                      type="text"
                      name="servicios"
                      value={formData.servicios}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Instalaciones, reparaciones, mantenimiento"
                    />
                  </div>
                </div>
              </div>

              {/* ═══ SECCIÓN 2 · Clasificación ═══ */}
              <div>
                <SectionTitle icon={BadgeCheck}>Clasificación y visibilidad</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de servicio
                    </label>
                    <select
                      name="esMarketDesliz"
                      value={formData.esMarketDesliz ? 'true' : 'false'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, esMarketDesliz: e.target.value === 'true' }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    >
                      <option value="false">Proveedor externo</option>
                      <option value="true">Servicio oficial de MarketDesliz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado de activación
                    </label>
                    <select
                      name="estadoActivacion"
                      value={formData.estadoActivacion}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    >
                      {ESTADOS_ACTIVACION.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orden de aparición
                    </label>
                    <input
                      type="number"
                      name="orden"
                      value={formData.orden}
                      onChange={handleFormChange}
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                        Etiquetas
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm text-gray-700">Activo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="destacado"
                            checked={formData.destacado}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm text-gray-700">Destacado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="verificado"
                            checked={formData.verificado}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm text-gray-700">Verificado</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ SECCIÓN 3 · Contacto ═══ */}
              <div>
                <SectionTitle icon={Phone}>Contacto</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="55 1234 5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="521234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="correo@servicio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                    <input
                      type="text"
                      name="horario"
                      value={formData.horario}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Lun-Vie 9am-6pm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                        Modalidades
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="atencionWhatsapp"
                            checked={formData.atencionWhatsapp}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm text-gray-700">Atención por WhatsApp</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="citasPrevias"
                            checked={formData.citasPrevias}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm text-gray-700">Requiere cita previa</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="domicilio"
                            checked={formData.domicilio}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-primary rounded"
                          />
                          <span className="text-sm text-gray-700">A domicilio</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ SECCIÓN 4 · Ubicación ═══ */}
              <div>
                <SectionTitle icon={MapPin}>Ubicación (opcional)</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Calle, número, colonia, ciudad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      name="estadoId"
                      value={formData.estadoId}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    >
                      <option value="">Seleccionar estado</option>
                      {estadosList.map((est) => (
                        <option key={est.id} value={est.id}>{est.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Municipio con inline create */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Municipio</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewMunicipio((v) => !v);
                          setShowNewCategory(false);
                          setShowNewLocalidad(false);
                        }}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Nuevo
                      </button>
                    </div>
                    <select
                      name="municipioId"
                      value={formData.municipioId}
                      onChange={handleFormChange}
                      disabled={!formData.estadoId}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                    >
                      <option value="">{formData.estadoId ? 'Seleccionar municipio' : 'Primero elige estado'}</option>
                      {municipiosList.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>

                    {showNewMunicipio && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                        <input
                          type="text"
                          value={newMunicipioName}
                          onChange={(e) => setNewMunicipioName(e.target.value)}
                          placeholder="Ej: Martínez de la Torre"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleCreateMunicipio(); }
                            if (e.key === 'Escape') {
                              e.preventDefault(); e.stopPropagation();
                              setShowNewMunicipio(false); setNewMunicipioName('');
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateMunicipio}
                            disabled={creatingMunicipio || !newMunicipioName.trim()}
                            className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition flex items-center justify-center gap-1"
                          >
                            {creatingMunicipio ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creando...
                              </>
                            ) : (
                              <>
                                <Save size={12} /> Crear municipio
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewMunicipio(false); setNewMunicipioName(''); }}
                            className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500">Se creará en el estado Veracruz.</p>
                      </div>
                    )}
                  </div>

                  {/* Localidad con inline create */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Localidad</label>
                      {formData.municipioId && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewLocalidad((v) => !v);
                            setShowNewCategory(false);
                            setShowNewMunicipio(false);
                          }}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> Nueva
                        </button>
                      )}
                    </div>
                    <select
                      name="localidadId"
                      value={formData.localidadId}
                      onChange={handleFormChange}
                      disabled={!formData.municipioId}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                    >
                      <option value="">{formData.municipioId ? 'Seleccionar localidad' : 'Primero elige municipio'}</option>
                      {localidadesList.map((l) => (
                        <option key={l.id} value={l.id}>{l.nombre}</option>
                      ))}
                    </select>

                    {showNewLocalidad && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                        <input
                          type="text"
                          value={newLocalidadName}
                          onChange={(e) => setNewLocalidadName(e.target.value)}
                          placeholder="Ej: Centro, La Colonia"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleCreateLocalidad(); }
                            if (e.key === 'Escape') {
                              e.preventDefault(); e.stopPropagation();
                              setShowNewLocalidad(false); setNewLocalidadName('');
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateLocalidad}
                            disabled={creatingLocalidad || !newLocalidadName.trim()}
                            className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition flex items-center justify-center gap-1"
                          >
                            {creatingLocalidad ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creando...
                              </>
                            ) : (
                              <>
                                <Save size={12} /> Crear localidad
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewLocalidad(false); setNewLocalidadName(''); }}
                            className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sector / Colonia</label>
                    <select
                      name="sectorId"
                      value={formData.sectorId}
                      onChange={handleFormChange}
                      disabled={!formData.localidadId}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                    >
                      <option value="">{formData.localidadId ? 'Seleccionar sector' : 'Primero elige localidad'}</option>
                      {sectoresList.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                    <input
                      type="text"
                      name="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="91000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                    <input
                      type="number"
                      name="latitud"
                      value={formData.latitud}
                      onChange={handleFormChange}
                      step="any"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="19.4326"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                    <input
                      type="number"
                      name="longitud"
                      value={formData.longitud}
                      onChange={handleFormChange}
                      step="any"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="-99.1332"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación (texto libre)
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={formData.ubicacion}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="Coordenadas o descripción de la ubicación"
                    />
                  </div>
                </div>
              </div>

              {/* ═══ SECCIÓN 5 · Presencia en línea ═══ */}
              <div>
                <SectionTitle icon={Globe}>Presencia en línea (opcional)</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                    <input
                      type="url"
                      name="sitioWeb"
                      value={formData.sitioWeb}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="https://misitio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                    <input
                      type="url"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input
                      type="url"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                    <input
                      type="url"
                      name="tiktok"
                      value={formData.tiktok}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                </div>
              </div>

              {/* ═══ SECCIÓN 6 · Imágenes ═══ */}
              <div>
                <SectionTitle icon={ImageIcon}>Imágenes</SectionTitle>
                <div className="space-y-4">
                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo / Foto principal
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary/40 transition">
                      <input
                        type="file"
                        name="logo"
                        accept="image/*"
                        onChange={handleFormChange}
                        className="hidden"
                        id="logoInput"
                      />
                      <label htmlFor="logoInput" className="cursor-pointer block">
                        <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Haz clic para {logoPreview ? 'reemplazar' : 'subir'} la imagen principal
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                      </label>
                    </div>
                    {logoPreview && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">
                          {editingServicio ? 'Imagen actual:' : 'Vista previa:'}
                        </p>
                        <img
                          src={logoPreview}
                          alt="Vista previa"
                          className="w-24 h-24 object-cover rounded-lg mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Imágenes existentes */}
                  {imagenesExistentes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fotos actuales
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {imagenesExistentes.map((filename, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={pb.files.getURL(
                                { collectionId: editingServicio?.id ? undefined : undefined, id: editingServicio?.id, collectionName: 'servicios' },
                                filename
                              )}
                              alt={`Foto ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <button
                              type="button"
                              onClick={() => eliminarImagenExistente(filename)}
                              aria-label="Eliminar imagen"
                              className="absolute flex items-center justify-center"
                              style={{
                                top: '-6px',
                                right: '-6px',
                                width: '22px',
                                height: '22px',
                                background: '#DC2626',
                                borderRadius: '50%',
                                color: '#FFFFFF',
                                border: '2px solid #FAFAF9',
                                cursor: 'pointer',
                              }}
                            >
                              <X size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] mt-2 text-gray-500">
                        Haz click en <strong className="text-red-500">×</strong> para eliminar al guardar.
                      </p>
                    </div>
                  )}

                  {/* Imágenes nuevas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agregar nuevas fotos
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary/40 transition">
                      <input
                        type="file"
                        name="imagenes"
                        accept="image/*"
                        multiple
                        onChange={handleFormChange}
                        className="hidden"
                        id="imagenesInput"
                      />
                      <label htmlFor="imagenesInput" className="cursor-pointer block">
                        <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Selecciona varias imágenes</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Se añadirán a las existentes
                        </p>
                      </label>
                    </div>
                    {imagenesPreviews.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {imagenesPreviews.map((preview, idx) => (
                          <img
                            key={idx}
                            src={preview}
                            alt={`Nueva ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Footer fijo */}
            <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl bg-white">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingServicio ? 'Guardar cambios' : 'Crear servicio'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL DETALLE                                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showDetailModal && selectedServicio && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Wrench size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Detalle del servicio</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="aspect-square bg-muted/30 rounded-2xl overflow-hidden">
                  {selectedServicio.imagen ? (
                    <img
                      src={selectedServicio.imagen}
                      alt={selectedServicio.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                      <Wrench className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">{selectedServicio.nombre}</h3>

                  <div className="flex flex-wrap gap-2">
                    {selectedServicio.categoriaNombre && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {selectedServicio.categoriaNombre}
                      </span>
                    )}
                    {selectedServicio.esMarketDesliz && (
                      <span className="text-xs bg-primary text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                        <BadgeCheck size={12} /> Oficial
                      </span>
                    )}
                    {selectedServicio.verificado && (
                      <span className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck size={12} /> Verificado
                      </span>
                    )}
                    <EstadoBadge estado={selectedServicio.estadoActivacion} />
                  </div>

                  {selectedServicio.precioBase > 0 && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Precio base</p>
                      <p className="text-2xl font-black text-primary">
                        {formatMoney(selectedServicio.precioBase)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        El precio final puede variar
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Visitas</p>
                      <p className="font-bold text-gray-900">{selectedServicio.visitas || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Favoritos</p>
                      <p className="font-bold text-red-600">{selectedServicioFavoritos}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-bold text-gray-900">
                        {selectedServicio.esMarketDesliz ? 'MarketDesliz' : 'Proveedor'}
                      </p>
                    </div>
                  </div>

                  {selectedServicio.direccion && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-xl">
                      <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                      <span>{selectedServicio.direccion}</span>
                    </div>
                  )}

                  {selectedServicio.telefono && (
                    <div className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl">
                      <Phone size={14} className="text-primary shrink-0" />
                      <span className="text-gray-700">{selectedServicio.telefono}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedServicio.descripcion && (
                <div className="p-4 bg-gray-50 rounded-2xl mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedServicio.descripcion}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex flex-wrap gap-3">
              <button
                onClick={() => verEnTienda(selectedServicio)}
                className="flex-1 min-w-[140px] h-11 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} /> Ver en tienda
              </button>
              {selectedServicio.whatsapp && (
                <a
                  href={`https://wa.me/${selectedServicio.whatsapp.replace(/\D/g, '').startsWith('52')
                    ? selectedServicio.whatsapp.replace(/\D/g, '')
                    : '52' + selectedServicio.whatsapp.replace(/\D/g, '')
                    }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] h-11 rounded-2xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedServicio);
                }}
                className="flex-1 min-w-[140px] h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <Edit size={16} /> Editar
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 min-w-[100px] h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL ELIMINAR                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showDeleteModal && selectedServicio && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trash2 size={18} className="text-red-500" /> Eliminar servicio
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-2">
                ¿Estás seguro de eliminar{' '}
                <strong className="text-gray-900">{selectedServicio.nombre}</strong>?
              </p>
              <p className="text-xs text-red-600">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-11 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarServicioConfirm}
                className="flex-1 h-11 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}