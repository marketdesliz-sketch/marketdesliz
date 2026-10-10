// src/pages/admin/fruta/index.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Apple, Search, Eye, Edit, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, Plus, FileSpreadsheet,
  CheckCircle, XCircle, AlertCircle, Star, Sparkles,
  Package, TrendingUp, Scale, Sprout, X, Save, Upload,
  Tag, DollarSign, Box, Phone, MessageCircle, MapPin, Layers,
  ExternalLink,
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import pb from '../../../lib/pocketbase';
import {
  getFrutas,
  getFrutaById,
  getFrutaCategorias,
  createFruta,
  updateFruta,
  createCategoria,
  createMunicipio,
  createLocalidad,
} from '../../../lib/frutasService';
import { formatMoney } from '../../../lib/utils';

const ITEMS_PER_PAGE = 12;

const UNIDADES = ['kg', 'pieza', 'manojo', 'caja', 'docena', 'litro', 'gramo'];

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  categoriaId: '',
  precio: '',
  precioAnterior: '',
  unidad: 'kg',
  stock: '',
  municipioId: '',
  localidadId: '',
  telefono: '',
  whatsapp: '',
  activo: true,
  nuevo: false,
  destacado: false,
  temporada: false,
  imagen: null,
  imagenes: [],
};

export default function AdminFrutaPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const {
    page = 1,
    search = '',
    categoriaId = 'todas',
    destacados = '',
    temporada = '',
    sort = '-created',
  } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados principales ──────────────────────────────────────────────
  const [frutas, setFrutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Filtros ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [filterCategoriaId, setFilterCategoriaId] = useState(categoriaId || 'todas');
  const [filterDestacados, setFilterDestacados] = useState(destacados === 'true');
  const [filterTemporada, setFilterTemporada] = useState(temporada === 'true');
  const [sortBy, setSortBy] = useState(sort || '-created');

  // ─── Categorías dinámicas ─────────────────────────────────────────────
  const [categoriasList, setCategoriasList] = useState([]);

  // ─── Stats ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    destacados: 0,
    nuevos: 0,
    enTemporada: 0,
    agotados: 0,
    visitasTotal: 0,
    stockTotal: 0,
  });

  // ─── Modales ──────────────────────────────────────────────────────────
  const [selectedFruta, setSelectedFruta] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ─── Modal crear/editar ───────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingFruta, setEditingFruta] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);
  const [loadingGeografico, setLoadingGeografico] = useState(false);
  const [veracruzId, setVeracruzId] = useState('');

  // ─── Inline: crear categoría ──────────────────────────────────────────
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // ─── Inline: crear municipio ──────────────────────────────────────────
  const [showNewMunicipio, setShowNewMunicipio] = useState(false);
  const [newMunicipioName, setNewMunicipioName] = useState('');
  const [creatingMunicipio, setCreatingMunicipio] = useState(false);

  // ─── Inline: crear localidad ──────────────────────────────────────────
  const [showNewLocalidad, setShowNewLocalidad] = useState(false);
  const [newLocalidadName, setNewLocalidadName] = useState('');
  const [creatingLocalidad, setCreatingLocalidad] = useState(false);

  // ─── Cargar categorías con conteo ─────────────────────────────────────
  const cargarCategoriasConCounts = useCallback(async () => {
    try {
      const cats = await getFrutaCategorias();

      let counts = {};
      try {
        const records = await pb
          .collection('frutas')
          .getFullList({ fields: 'categoriaId' });
        records.forEach((r) => {
          if (r.categoriaId) counts[r.categoriaId] = (counts[r.categoriaId] || 0) + 1;
        });
      } catch (e) {
        // silencioso
      }

      setCategoriasList(cats.map((c) => ({ ...c, count: counts[c.id] || 0 })));
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }, []);

  useEffect(() => {
    cargarCategoriasConCounts();
  }, [cargarCategoriasConCounts]);

  // ─── Cargar datos ─────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess('');

      const result = await getFrutas({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        categoriaId: filterCategoriaId,
        soloDestacadas: filterDestacados,
        soloTemporada: filterTemporada,
        sort: sortBy,
      });

      setFrutas(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

      if (!showRefreshing) await cargarStats();
    } catch (err) {
      console.error('Error cargando frutas:', err);
      setError('No se pudieron cargar los productos. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filterCategoriaId, filterDestacados, filterTemporada, sortBy]);

  // ─── Cargar stats ─────────────────────────────────────────────────────
  const cargarStats = async () => {
    try {
      const [all, activos, destacados, nuevos, temporada, agotados] = await Promise.all([
        pb.collection('frutas').getList(1, 1, { fields: 'id' }),
        pb.collection('frutas').getList(1, 1, { filter: 'activo = true', fields: 'id' }),
        pb.collection('frutas').getList(1, 1, { filter: 'destacado = true', fields: 'id' }),
        pb.collection('frutas').getList(1, 1, { filter: 'nuevo = true', fields: 'id' }),
        pb.collection('frutas').getList(1, 1, { filter: 'temporada = true', fields: 'id' }),
        pb.collection('frutas').getList(1, 1, { filter: 'stock = 0', fields: 'id' }),
      ]);

      let visitas = 0;
      let stockTotal = 0;
      try {
        const records = await pb.collection('frutas').getFullList({
          fields: 'visitas,stock',
        });
        visitas = records.reduce((sum, r) => sum + (r.visitas || 0), 0);
        stockTotal = records.reduce((sum, r) => sum + (r.stock || 0), 0);
      } catch (e) {
        /* silencioso */
      }

      setStats({
        total: all.totalItems,
        activos: activos.totalItems,
        destacados: destacados.totalItems,
        nuevos: nuevos.totalItems,
        enTemporada: temporada.totalItems,
        agotados: agotados.totalItems,
        visitasTotal: visitas,
        stockTotal,
      });
    } catch (err) {
      console.error('Error cargando stats:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Atajos de teclado en el modal ────────────────────────────────────
  useEffect(() => {
    if (!showModal) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        // Si hay un input inline activo, NO cerrar el modal
        if (showNewCategory || showNewMunicipio || showNewLocalidad) return;
        e.preventDefault();
        cerrarModal();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, showNewCategory, showNewMunicipio, showNewLocalidad]);

  // ─── Actualizar URL ───────────────────────────────────────────────────
  const actualizarURL = useCallback(
    (params) => {
      const query = {
        page: currentPage > 1 ? currentPage : undefined,
        search: searchTerm || undefined,
        categoriaId: filterCategoriaId !== 'todas' ? filterCategoriaId : undefined,
        destacados: filterDestacados ? 'true' : undefined,
        temporada: filterTemporada ? 'true' : undefined,
        sort: sortBy !== '-created' ? sortBy : undefined,
        ...params,
      };
      Object.keys(query).forEach((key) => {
        if (query[key] === undefined || query[key] === '') delete query[key];
      });
      router.push({ pathname: '/admin/fruta', query }, undefined, { shallow: true });
    },
    [currentPage, searchTerm, filterCategoriaId, filterDestacados, filterTemporada, sortBy, router]
  );

  // ─── Handlers de filtros ──────────────────────────────────────────────
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

  const handleDestacadosToggle = () => {
    const nuevo = !filterDestacados;
    setFilterDestacados(nuevo);
    actualizarURL({ destacados: nuevo ? 'true' : undefined, page: 1 });
  };

  const handleTemporadaToggle = () => {
    const nuevo = !filterTemporada;
    setFilterTemporada(nuevo);
    actualizarURL({ temporada: nuevo ? 'true' : undefined, page: 1 });
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
    setFilterDestacados(false);
    setFilterTemporada(false);
    setSortBy('-created');
    router.push('/admin/fruta', undefined, { shallow: true });
  };

  // ─── Acciones sobre frutas ────────────────────────────────────────────
  const verDetalle = async (fruta) => {
    try {
      const completo = await getFrutaById(fruta.id);
      setSelectedFruta(completo || fruta);
      setShowDetailModal(true);
    } catch (err) {
      setSelectedFruta(fruta);
      setShowDetailModal(true);
    }
  };

  const verEnTienda = (fruta) => {
    window.open(`/fruta/${fruta.id}`, '_blank', 'noopener,noreferrer');
  };

  const toggleActivo = async (fruta) => {
    try {
      await pb.collection('frutas').update(fruta.id, { activo: !fruta.activo });
      setSuccess(fruta.activo ? 'Producto desactivado' : 'Producto activado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar estado');
    }
  };

  const toggleDestacado = async (fruta) => {
    try {
      await pb.collection('frutas').update(fruta.id, { destacado: !fruta.destacado });
      setSuccess(fruta.destacado ? 'Removido de destacados' : 'Marcado como destacado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar destacado');
    }
  };

  const eliminarFrutaConfirm = async () => {
    try {
      if (!selectedFruta) return;
      await pb.collection('frutas').delete(selectedFruta.id);
      setSuccess('Producto eliminado');
      setShowDeleteModal(false);
      await cargarDatos(true);
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar el producto');
    }
  };

  // ─── Modal: helpers ───────────────────────────────────────────────────
  const cargarMunicipios = useCallback(async () => {
    try {
      const estados = await pb.collection('estados').getFullList({
        filter: 'nombre = "Veracruz"',
        limit: 1,
      });
      if (estados.length > 0) {
        setVeracruzId(estados[0].id);
        const municipios = await pb.collection('municipios').getFullList({
          filter: `estadoId = "${estados[0].id}"`,
          sort: 'nombre',
        });
        setMunicipiosList(municipios);
      }
    } catch (err) {
      console.error('Error cargando municipios:', err);
    }
  }, []);

  useEffect(() => {
    if (!formData.municipioId) {
      setLocalidadesList([]);
      return;
    }
    setLoadingGeografico(true);
    pb.collection('localidades')
      .getFullList({
        filter: `municipioId = "${formData.municipioId}"`,
        sort: 'nombre',
      })
      .then(setLocalidadesList)
      .catch(() => setLocalidadesList([]))
      .finally(() => setLoadingGeografico(false));
  }, [formData.municipioId]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setImagePreview(null);
    setImagePreviews([]);
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
    setEditingFruta(null);
    resetForm();
  };

  const handleCreateNew = async () => {
    setEditingFruta(null);
    resetForm();
    setShowModal(true);
    if (municipiosList.length === 0) {
      await cargarMunicipios();
    }
  };

  const handleEdit = async (fruta) => {
    try {
      const completo = await getFrutaById(fruta.id);
      const base = completo || fruta;

      setEditingFruta(base);
      setFormData({
        nombre: base.nombre || '',
        descripcion: base.descripcion || '',
        categoriaId: base.categoriaId || '',
        precio: base.precio ?? '',
        precioAnterior: base.precioAnterior ?? '',
        unidad: base.unidad || 'kg',
        stock: base.stock ?? '',
        municipioId: base.municipioId || '',
        localidadId: base.localidadId || '',
        telefono: base.telefono || '',
        whatsapp: base.whatsapp || '',
        activo: base.activo !== false,
        nuevo: base.nuevo === true,
        destacado: base.destacado === true,
        temporada: base.temporada === true,
        imagen: null,
        imagenes: [],
      });

      setImagePreview(base.imagen || null);
      setImagePreviews([]);
      setFormError('');
      setShowNewCategory(false);
      setNewCategoryName('');
      setShowNewMunicipio(false);
      setNewMunicipioName('');
      setShowNewLocalidad(false);
      setNewLocalidadName('');
      setShowModal(true);

      if (municipiosList.length === 0) {
        await cargarMunicipios();
      }
    } catch (err) {
      console.error('Error abriendo editor:', err);
      setError('Error al abrir el editor');
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === 'imagen') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, imagen: file || null }));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      }
      return;
    }

    if (name === 'imagenes') {
      const fileList = Array.from(files);
      setFormData((prev) => ({ ...prev, imagenes: fileList }));
      const previews = [];
      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === fileList.length) setImagePreviews(previews);
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

  // ─── Crear categoría inline ───────────────────────────────────────────
  const handleCreateCategory = async () => {
    const nombre = newCategoryName.trim();
    if (!nombre) {
      setFormError('El nombre de la categoría es obligatorio');
      return;
    }

    setCreatingCategory(true);
    setFormError('');

    try {
      const nueva = await createCategoria(nombre, 'frutas');
      await cargarCategoriasConCounts();
      setFormData((prev) => ({ ...prev, categoriaId: nueva.id }));
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (err) {
      console.error('Error creando categoría:', err);
      setFormError(err?.message || 'No se pudo crear la categoría. Intenta de nuevo.');
    } finally {
      setCreatingCategory(false);
    }
  };

  // ─── Crear municipio inline ───────────────────────────────────────────
  const handleCreateMunicipio = async () => {
    const nombre = newMunicipioName.trim();
    if (!nombre) {
      setFormError('El nombre del municipio es obligatorio');
      return;
    }
    if (!veracruzId) {
      setFormError('No se encontró el estado Veracruz. Contacta al administrador.');
      return;
    }

    setCreatingMunicipio(true);
    setFormError('');

    try {
      const nuevo = await createMunicipio(nombre, veracruzId);
      await cargarMunicipios();
      setFormData((prev) => ({ ...prev, municipioId: nuevo.id, localidadId: '' }));
      setNewMunicipioName('');
      setShowNewMunicipio(false);
      setShowNewLocalidad(false);
      setNewLocalidadName('');
    } catch (err) {
      console.error('Error creando municipio:', err);
      setFormError(err?.message || 'No se pudo crear el municipio. Intenta de nuevo.');
    } finally {
      setCreatingMunicipio(false);
    }
  };

  // ─── Crear localidad inline ───────────────────────────────────────────
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

      // Recargar lista de localidades del municipio actual
      const locs = await pb.collection('localidades').getFullList({
        filter: `municipioId = "${formData.municipioId}"`,
        sort: 'nombre',
      });
      setLocalidadesList(locs);

      setFormData((prev) => ({ ...prev, localidadId: nueva.id }));
      setNewLocalidadName('');
      setShowNewLocalidad(false);
    } catch (err) {
      console.error('Error creando localidad:', err);
      setFormError(err?.message || 'No se pudo crear la localidad. Intenta de nuevo.');
    } finally {
      setCreatingLocalidad(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.nombre.trim()) return setFormError('El nombre es obligatorio');
    if (!formData.categoriaId) return setFormError('Selecciona una categoría');
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      return setFormError('El precio debe ser mayor a 0');
    }
    if (!formData.unidad) return setFormError('Selecciona una unidad');

    setSaving(true);
    setFormError('');

    try {
      if (editingFruta) {
        await updateFruta(editingFruta.id, formData);
        setSuccess('Producto actualizado');
      } else {
        await createFruta(formData);
        setSuccess('Producto creado');
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

  // ─── Exportar Excel ───────────────────────────────────────────────────
  const exportarExcel = () => {
    const data = frutas.map((f) => ({
      ID: f.id,
      Nombre: f.nombre,
      Categoría: f.categoriaNombre,
      Precio: f.precio,
      Unidad: f.unidad,
      Stock: f.stock,
      'En temporada': f.temporada ? 'Sí' : 'No',
      Activo: f.activo ? 'Sí' : 'No',
      Destacado: f.destacado ? 'Sí' : 'No',
      Nuevo: f.nuevo ? 'Sí' : 'No',
      Visitas: f.visitas,
      'Fecha creación': new Date(f.creado).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Frutas');
    XLSX.writeFile(workbook, `frutas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const categoriaActivaNombre =
    filterCategoriaId !== 'todas'
      ? categoriasList.find((c) => c.id === filterCategoriaId)?.nombre || filterCategoriaId
      : null;

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
        <title>Fruta | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Apple size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fruta</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona los productos frescos publicados
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
                className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                <FileSpreadsheet size={16} /> Exportar Excel
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition"
              >
                <Plus size={16} /> Nuevo producto
              </button>
            </div>
          </div>

          {/* ─── Mensajes ──────────────────────────────────────── */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-2 text-green-700">
              <CheckCircle size={18} className="shrink-0" />
              <span className="text-sm">{success}</span>
              <button
                onClick={() => setSuccess('')}
                className="ml-auto text-sm font-medium hover:underline"
              >
                Descartar
              </button>
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

          {/* ─── Stats ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {[
              { icon: Package, label: 'Total', value: stats.total, color: 'text-primary' },
              { icon: CheckCircle, label: 'Activos', value: stats.activos, color: 'text-green-500' },
              { icon: Star, label: 'Destacados', value: stats.destacados, color: 'text-yellow-500' },
              { icon: Sparkles, label: 'Nuevos', value: stats.nuevos, color: 'text-primary' },
              { icon: Sprout, label: 'Temporada', value: stats.enTemporada, color: 'text-green-600' },
              { icon: XCircle, label: 'Agotados', value: stats.agotados, color: 'text-red-500' },
              { icon: Scale, label: 'Stock total', value: stats.stockTotal, color: 'text-primary' },
              { icon: TrendingUp, label: 'Visitas', value: stats.visitasTotal, color: 'text-primary' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm"
              >
                <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ─── Filtros ───────────────────────────────────────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 flex-wrap">
              <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                  placeholder="Buscar por nombre o categoría..."
                />
              </form>

              <select
                value={filterCategoriaId}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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

              <button
                onClick={handleDestacadosToggle}
                className={`flex items-center gap-2 px-4 h-10 rounded-2xl border text-sm font-medium transition ${filterDestacados
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Star
                  className={`w-4 h-4 ${filterDestacados ? 'fill-yellow-500 text-yellow-500' : ''
                    }`}
                />
                Destacados
              </button>

              <button
                onClick={handleTemporadaToggle}
                className={`flex items-center gap-2 px-4 h-10 rounded-2xl border text-sm font-medium transition ${filterTemporada
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Sprout className="w-4 h-4" />
                Temporada
              </button>

              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="-created">Más recientes</option>
                <option value="created">Más antiguos</option>
                <option value="nombre">Por nombre</option>
                <option value="precio">Menor precio</option>
                <option value="-precio">Mayor precio</option>
                <option value="-visitas">Más visitados</option>
              </select>
            </div>

            {(searchTerm || filterCategoriaId !== 'todas' || filterDestacados || filterTemporada) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span>Filtros activos:</span>
                {searchTerm && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {searchTerm}
                  </span>
                )}
                {categoriaActivaNombre && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {categoriaActivaNombre}
                  </span>
                )}
                {filterDestacados && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                    Destacados
                  </span>
                )}
                {filterTemporada && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Temporada
                  </span>
                )}
                <button
                  onClick={limpiarFiltros}
                  className="ml-2 text-primary hover:underline font-medium"
                >
                  Limpiar
                </button>
              </div>
            )}

            <div className="mt-3 text-sm text-muted-foreground">
              {frutas.length} {frutas.length === 1 ? 'producto' : 'productos'} mostrados
            </div>
          </div>

          {/* ─── Grid de frutas ────────────────────────────────── */}
          {frutas.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Apple size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                No se encontraron productos
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterCategoriaId !== 'todas'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Registra el primer producto de fruta'}
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition"
              >
                <Plus size={16} /> Nuevo producto
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {frutas.map((fruta) => (
                  <div
                    key={fruta.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {fruta.imagen ? (
                        <img
                          src={fruta.imagen}
                          alt={fruta.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                          <Apple className="w-12 h-12 text-primary/40" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {fruta.nuevo && (
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Nuevo
                          </span>
                        )}
                        {fruta.temporada && (
                          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sprout size={10} /> Temporada
                          </span>
                        )}
                        {!fruta.activo && (
                          <span className="bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDestacado(fruta);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                        title={fruta.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
                      >
                        <Star
                          className={`w-4 h-4 ${fruta.destacado
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-400'
                            }`}
                        />
                      </button>

                      {fruta.stock === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-red-500/90 text-white text-[10px] font-bold py-1 text-center">
                          AGOTADO
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-1 mb-1">
                        {fruta.nombre}
                      </h3>

                      {fruta.categoriaNombre && (
                        <span className="inline-block self-start text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mb-2">
                          {fruta.categoriaNombre}
                        </span>
                      )}

                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-base font-black text-gray-900">
                            {formatMoney(fruta.precio)}
                            <span className="text-xs font-medium text-muted-foreground">
                              {' '}
                              / {fruta.unidad}
                            </span>
                          </p>
                          {fruta.precioAnterior > fruta.precio && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatMoney(fruta.precioAnterior)}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${fruta.stock > 0 ? 'text-gray-500' : 'text-red-500'
                            }`}
                        >
                          {fruta.stock}
                        </span>
                      </div>

                      <button
                        onClick={() => verEnTienda(fruta)}
                        className="self-start inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-primary hover:underline mb-3"
                        title="Abrir la página pública en una nueva pestaña"
                      >
                        <ExternalLink size={10} /> Ver en tienda
                      </button>

                      <div className="mt-auto">
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => verDetalle(fruta)}
                            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl border border-gray-200 text-gray-600 hover:border-primary hover:text-primary text-xs font-medium transition"
                          >
                            <Eye className="w-3 h-3" /> Ver
                          </button>
                          <button
                            onClick={() => handleEdit(fruta)}
                            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition"
                          >
                            <Edit className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFruta(fruta);
                              setShowDeleteModal(true);
                            }}
                            className="flex items-center justify-center w-9 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 p-0 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleActivo(fruta)}
                          className={`w-full mt-2 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition ${fruta.activo
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                          {fruta.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} · {totalItems} productos
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
      {/* MODAL CREAR / EDITAR — layout flexbox (header + body + footer) */}
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
            {/* ─── Header fijo ──────────────────────────────── */}
            <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Apple size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingFruta ? 'Editar producto' : 'Nuevo producto'}
                </h2>
              </div>
              <button
                onClick={cerrarModal}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* ─── Body scrolleable ──────────────────────────── */}
            <form
              id="fruta-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nombre + Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                    placeholder="Ej: Mango Ataulfo"
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
                      <Plus size={12} /> Nueva categoría
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
                            Aún no hay categorías de frutas.
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
                        placeholder="Ej: Cítricos, Tropicales, Hojas verdes..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowNewCategory(false);
                            setNewCategoryName('');
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
                              <Save size={12} /> Crear categoría
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategory(false);
                            setNewCategoryName('');
                          }}
                          className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Se creará con{' '}
                        <code className="bg-white px-1 rounded">vertical: "frutas"</code> y
                        slug automático.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                  placeholder="Describe tu producto (frescura, origen, sabor…)"
                />
              </div>

              {/* Precio + Precio anterior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <DollarSign size={12} className="text-gray-400" /> Precio *
                  </label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio anterior (opcional)
                  </label>
                  <input
                    type="number"
                    name="precioAnterior"
                    value={formData.precioAnterior}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="Para mostrar descuento"
                  />
                </div>
              </div>

              {/* Unidad + Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Scale size={12} className="text-gray-400" /> Unidad *
                  </label>
                  <select
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Box size={12} className="text-gray-400" /> Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleFormChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Municipio (con inline) + Localidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" /> Municipio
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewMunicipio((v) => !v);
                        setShowNewCategory(false);
                        setShowNewLocalidad(false);
                      }}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Nuevo municipio
                    </button>
                  </div>
                  <select
                    name="municipioId"
                    value={formData.municipioId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  >
                    <option value="">Seleccionar municipio</option>
                    {municipiosList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>

                  {showNewMunicipio && (
                    <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                      <input
                        type="text"
                        value={newMunicipioName}
                        onChange={(e) => setNewMunicipioName(e.target.value)}
                        placeholder="Ej: Martínez de la Torre, Tlapacoyan..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateMunicipio();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowNewMunicipio(false);
                            setNewMunicipioName('');
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreateMunicipio}
                          disabled={creatingMunicipio || !newMunicipioName.trim()}
                          className="flex-1 px-3 py-1.5 bg-primary text-black rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition flex items-center justify-center gap-1"
                        >
                          {creatingMunicipio ? (
                            <>
                              <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
                          onClick={() => {
                            setShowNewMunicipio(false);
                            setNewMunicipioName('');
                          }}
                          className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Se creará en el estado <strong>Veracruz</strong>.
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Layers size={12} className="text-gray-400" /> Localidad
                    </label>
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
                        <Plus size={12} /> Nueva localidad
                      </button>
                    )}
                  </div>
                  <select
                    name="localidadId"
                    value={formData.localidadId}
                    onChange={handleFormChange}
                    disabled={!formData.municipioId || loadingGeografico}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                  >
                    <option value="">
                      {formData.municipioId ? 'Seleccionar localidad' : 'Primero elige un municipio'}
                    </option>
                    {localidadesList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>

                  {/* Aviso: aún sin localidades para ese municipio */}
                  {formData.municipioId &&
                    localidadesList.length === 0 &&
                    !loadingGeografico &&
                    !showNewLocalidad && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-amber-800">
                              Este municipio no tiene localidades aún.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowNewLocalidad(true)}
                              className="text-xs font-bold text-amber-900 hover:underline mt-1"
                            >
                              Crear la primera localidad →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Input inline para crear localidad */}
                  {showNewLocalidad && (
                    <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                      <input
                        type="text"
                        value={newLocalidadName}
                        onChange={(e) => setNewLocalidadName(e.target.value)}
                        placeholder="Ej: Centro, La Colonia, Barrio Norte..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateLocalidad();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowNewLocalidad(false);
                            setNewLocalidadName('');
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreateLocalidad}
                          disabled={creatingLocalidad || !newLocalidadName.trim()}
                          className="flex-1 px-3 py-1.5 bg-primary text-black rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-primary/90 transition flex items-center justify-center gap-1"
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
                          onClick={() => {
                            setShowNewLocalidad(false);
                            setNewLocalidadName('');
                          }}
                          className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Se creará en el municipio seleccionado actualmente.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Teléfono + WhatsApp */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Phone size={12} className="text-gray-400" /> Teléfono
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MessageCircle size={12} className="text-gray-400" /> WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="521234567890"
                  />
                </div>
              </div>

              {/* Etiquetas */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Etiquetas
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'activo', label: 'Activo' },
                    { name: 'nuevo', label: 'Nuevo' },
                    { name: 'destacado', label: 'Destacado' },
                    { name: 'temporada', label: 'Temporada' },
                  ].map((opt) => (
                    <label
                      key={opt.name}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name={opt.name}
                        checked={formData[opt.name]}
                        onChange={handleFormChange}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Imagen principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen principal
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary/40 transition">
                  <input
                    type="file"
                    name="imagen"
                    accept="image/*"
                    onChange={handleFormChange}
                    className="hidden"
                    id="imagenFrutaInput"
                  />
                  <label htmlFor="imagenFrutaInput" className="cursor-pointer block">
                    <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Haz clic para {imagePreview ? 'reemplazar' : 'subir'} la imagen principal
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">
                      {editingFruta ? 'Imagen actual:' : 'Vista previa:'}
                    </p>
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-24 h-24 object-cover rounded-lg mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Imágenes adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imágenes adicionales
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary/40 transition">
                  <input
                    type="file"
                    name="imagenes"
                    accept="image/*"
                    multiple
                    onChange={handleFormChange}
                    className="hidden"
                    id="imagenesFrutaInput"
                  />
                  <label htmlFor="imagenesFrutaInput" className="cursor-pointer block">
                    <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Selecciona varias imágenes</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Se añadirán a las existentes
                    </p>
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {imagePreviews.map((preview, idx) => (
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
            </form>

            {/* ─── Footer fijo ──────────────────────────────── */}
            <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl bg-white">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-black text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingFruta ? 'Guardar cambios' : 'Crear producto'}
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
      {showDetailModal && selectedFruta && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Apple size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Detalle del producto</h2>
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
                  {selectedFruta.imagen ? (
                    <img
                      src={selectedFruta.imagen}
                      alt={selectedFruta.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                      <Apple className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedFruta.nombre}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {selectedFruta.categoriaNombre && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {selectedFruta.categoriaNombre}
                      </span>
                    )}
                    {selectedFruta.temporada && (
                      <span className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sprout size={12} /> Temporada
                      </span>
                    )}
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Precio</p>
                    <p className="text-2xl font-black text-primary">
                      {formatMoney(selectedFruta.precio)}
                      <span className="text-sm font-medium text-muted-foreground ml-1">
                        / {selectedFruta.unidad}
                      </span>
                    </p>
                    {selectedFruta.precioAnterior > selectedFruta.precio && (
                      <p className="text-sm text-muted-foreground line-through mt-1">
                        {formatMoney(selectedFruta.precioAnterior)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="font-bold text-gray-900">
                        {selectedFruta.stock} {selectedFruta.unidad}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Visitas</p>
                      <p className="font-bold text-gray-900">
                        {selectedFruta.visitas || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedFruta.nuevo && (
                      <span className="text-xs bg-primary text-white px-2.5 py-1 rounded-full">
                        Nuevo
                      </span>
                    )}
                    {selectedFruta.destacado && (
                      <span className="text-xs bg-yellow-500 text-white px-2.5 py-1 rounded-full">
                        Destacado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedFruta.descripcion && (
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedFruta.descripcion}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
              <button
                onClick={() => verEnTienda(selectedFruta)}
                className="flex-1 h-11 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} /> Ver en tienda
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedFruta);
                }}
                className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <Edit size={16} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL ELIMINAR                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showDeleteModal && selectedFruta && (
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
                <Trash2 size={18} className="text-red-500" /> Eliminar producto
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro de eliminar <strong>{selectedFruta.nombre}</strong>? Esta
                acción no se puede deshacer.
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
                onClick={eliminarFrutaConfirm}
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