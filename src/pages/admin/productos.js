// src/pages/admin/productos.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Calendar,
  Tag,
  Image as ImageIcon,
  X,
  Save,
  Clock,
  TrendingUp,
  Box,
  Grid3x3,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getProductsPaginated,
  getProductCategories,
  getProductsStats,
  createProduct,
  updateProduct,
  deleteProduct
} from '../../lib/productsService';
import { formatMoney } from '../../lib/utils';
import pb from '../../lib/pocketbase';

const ITEMS_PER_PAGE = 12;

export default function AdminProductosPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const { page = 1, search = '', categoria = 'todos', estado = 'todos', sort = '-created' } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    categorias: 0
  });

  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  // ─── Estado del formulario ────────────────────────────────────────────
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    enganche: '',
    pagoSemanal: '',
    semanas: '12',
    categoria: '',
    stock: '',
    costo: '',
    diasEntrega: '1',
    sku: '',           // ✅ AGREGADO
    activo: true,
    nuevo: false,
    imagen: null,
    imagenes: []
  });

  // ─── Cargar categorías dinámicas ──────────────────────────────────────
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getProductCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      if (!showRefreshing) {
        const statsData = await getProductsStats();
        setStats(statsData);
      }

      const result = await getProductsPaginated({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: search || '',
        categoria: categoria || 'todos',
        estado: estado || 'todos',
        sort: sort || '-created'
      });

      setProductos(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('No se pudieron cargar los productos. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, search, categoria, estado, sort]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Actualizar URL con filtros ──────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      search: search || undefined,
      categoria: categoria !== 'todos' ? categoria : undefined,
      estado: estado !== 'todos' ? estado : undefined,
      sort: sort !== '-created' ? sort : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/productos', query }, undefined, { shallow: true });
  }, [currentPage, search, categoria, estado, sort, router]);

  // ─── Manejadores de eventos ──────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    actualizarURL({ search: term, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    actualizarURL({ [key]: value, page: 1 });
  };

  const handleSortChange = (newSort) => {
    actualizarURL({ sort: newSort, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    actualizarURL({ page: newPage });
  };

  // ─── Handlers del formulario ─────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'imagen') {
      const file = files[0];
      setFormData({ ...formData, imagen: file });
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else if (name === 'imagenes') {
      const fileList = Array.from(files);
      setFormData({ ...formData, imagenes: fileList });
      const previews = [];
      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === fileList.length) {
            setImagePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      enganche: '',
      pagoSemanal: '',
      semanas: '12',
      categoria: '',
      stock: '',
      costo: '',
      diasEntrega: '1',
      sku: '',           // ✅ AGREGADO
      activo: true,
      nuevo: false,
      imagen: null,
      imagenes: []
    });
    setImagePreview(null);
    setImagePreviews([]);
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || '',
      enganche: producto.enganche || '',
      pagoSemanal: producto.pagoSemanal || '',
      semanas: producto.semanas || '12',
      categoria: producto.categoria || '',
      stock: producto.stock || '',
      costo: producto.costo || '',
      diasEntrega: producto.diasEntrega || '1',
      sku: producto.sku || '',        // ✅ AGREGADO
      activo: producto.activo === true,
      nuevo: producto.nuevo === true,
      imagen: null,
      imagenes: []
    });
    setImagePreview(producto.imagen || null);

    // ✅ Cargar imágenes adicionales si existen
    if (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
      const urls = producto.imagenes.map(img => pb.files.getURL(producto, img));
      setImagePreviews(urls);
    } else {
      setImagePreviews([]);
    }

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validación de campos obligatorios
    if (!formData.nombre.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }
    if (!formData.enganche || parseFloat(formData.enganche) < 0) {
      setError('El enganche debe ser un valor válido (mínimo 0)');
      return;
    }
    if (!formData.pagoSemanal || parseFloat(formData.pagoSemanal) < 0) {
      setError('El pago semanal debe ser un valor válido (mínimo 0)');
      return;
    }
    if (!formData.semanas || parseInt(formData.semanas) < 1) {
      setError('El número de semanas debe ser al menos 1');
      return;
    }
    if (!formData.categoria) {
      setError('Selecciona una categoría');
      return;
    }

    setSaving(true);
    try {
      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        enganche: parseFloat(formData.enganche),
        pagoSemanal: parseFloat(formData.pagoSemanal),
        semanas: parseInt(formData.semanas),
        categoria: formData.categoria,
        stock: parseInt(formData.stock) || 0,
        costo: parseFloat(formData.costo) || 0,
        diasEntrega: parseInt(formData.diasEntrega) || 1,
        sku: formData.sku || '',
        activo: formData.activo,
        nuevo: formData.nuevo,
        imagen: formData.imagen,
        imagenes: formData.imagenes
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      cargarDatos(true);

    } catch (error) {
      console.error('Error guardando producto:', error);
      setError('Error al guardar el producto. Verifica los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      cargarDatos(true);
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setError('Error al eliminar el producto');
    }
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading && !refreshing) {
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
        <title>Gestión de Productos | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
                  <p className="text-sm text-gray-500">Administra el catálogo de productos</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => cargarDatos(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    resetForm();
                    setShowModal(true);
                  }}
                  className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition shadow-sm"
                >
                  <Plus size={16} /> Nuevo producto
                </button>
              </div>
            </div>
          </div>

          {/* ─── Stats Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Package size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total productos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.activos}</span>
              </div>
              <p className="text-xs text-gray-500">Activos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <AlertCircle size={18} className="text-gray-400" />
                <span className="text-2xl font-bold text-gray-900">{stats.inactivos}</span>
              </div>
              <p className="text-xs text-gray-500">Inactivos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Grid3x3 size={18} className="text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.categorias}</span>
              </div>
              <p className="text-xs text-gray-500">Categorías</p>
            </div>
          </div>

          {/* ─── Barra de búsqueda y filtros ──────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                  placeholder="Buscar por nombre, descripción o SKU..."
                />
              </form>
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={categoria}
                  onChange={(e) => handleFilterChange('categoria', e.target.value)}
                >
                  <option value="todos">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <select
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>
              <div className="relative">
                <select
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="-created">Más recientes</option>
                  <option value="created">Más antiguos</option>
                  <option value="nombre">Por nombre</option>
                  <option value="precio">Precio: menor a mayor</option>
                  <option value="-precio">Precio: mayor a menor</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Error ──────────────────────────────────────────────────── */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                onClick={() => { setError(null); cargarDatos(); }}
                className="ml-auto text-sm font-medium hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* ─── Lista de productos ────────────────────────────────────── */}
          {productos.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No se encontraron productos</h3>
              <p className="text-sm text-gray-400">Intenta con otros filtros o crea un nuevo producto</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {productos.map(producto => (
                  <div key={producto.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                    <div className="relative h-40 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={48} className="text-purple-300" />
                        </div>
                      )}
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${producto.activo === true ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {producto.activo === true ? 'Activo' : 'Inactivo'}
                      </div>
                      {producto.stock !== undefined && producto.stock <= 0 && (
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          Sin stock
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{producto.nombre}</h3>
                        {producto.sku && (
                          <span className="text-xs text-gray-400 font-mono">{producto.sku}</span>
                        )}
                      </div>
                      {producto.categoria && (
                        <p className="text-xs text-purple-600 font-medium mb-2">{producto.categoria}</p>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{producto.descripcion}</p>

                      <div className="space-y-1 mb-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Precio:</span>
                          <span className="font-bold text-gray-900">{formatMoney(producto.precio)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Enganche:</span>
                          <span className="font-bold text-purple-600">{formatMoney(producto.enganche)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Semanal:</span>
                          <span className="font-bold text-green-600">{formatMoney(producto.pagoSemanal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stock:</span>
                          <span className={`font-medium ${producto.stock > 0 ? 'text-gray-700' : 'text-red-600'}`}>
                            {producto.stock || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition"
                        >
                          <Edit size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── Paginación ────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Mostrando {productos.length} de {totalItems} productos
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                    >
                      Siguiente <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Modal de creación/edición ────────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setError(null); }}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                    <Package size={16} className="text-[#6C3BFF]" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingProduct ? 'Editar producto' : 'Nuevo producto'}
                  </h2>
                </div>
                <button onClick={() => { setShowModal(false); setError(null); }} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {/* Error dentro del modal */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                        placeholder="Ej: Lavadora Samsung"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                        placeholder="SKU-001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] resize-none"
                      placeholder="Descripción detallada del producto..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio total *</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="precio"
                          value={formData.precio}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo (para el negocio)</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="costo"
                          value={formData.costo}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enganche *</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="enganche"
                          value={formData.enganche}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pago semanal *</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="pagoSemanal"
                          value={formData.pagoSemanal}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semanas *</label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="semanas"
                          value={formData.semanas}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                          placeholder="12"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                      <div className="relative">
                        <Box size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleInputChange}
                          required
                          min="0"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Días de entrega</label>
                      <div className="relative">
                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="diasEntrega"
                          value={formData.diasEntrega}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                          placeholder="1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                      <div className="relative">
                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          name="categoria"
                          value={formData.categoria}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#6C3BFF] appearance-none"
                        >
                          <option value="">Selecciona una categoría</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        name="activo"
                        value={formData.activo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#6C3BFF]"
                      >
                        <option value={true}>✅ Activo (visible)</option>
                        <option value={false}>❌ Inactivo (oculto)</option>
                      </select>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="nuevo"
                          checked={formData.nuevo}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-[#6C3BFF] rounded"
                        />
                        <label className="text-sm text-gray-700">Marcar como nuevo</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen principal</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-purple-300 transition">
                      <input
                        type="file"
                        name="imagen"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                        id="imagenInput"
                      />
                      <label htmlFor="imagenInput" className="cursor-pointer">
                        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Haz clic o arrastra una imagen</p>
                        <p className="text-xs text-gray-400">PNG, JPG, JPEG hasta 5MB</p>
                      </label>
                    </div>
                    {(imagePreview || (editingProduct && editingProduct.imagen)) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                        <img
                          src={imagePreview || editingProduct?.imagen}
                          alt="Vista previa"
                          className="w-24 h-24 object-cover rounded-lg mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes adicionales</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-purple-300 transition">
                      <input
                        type="file"
                        name="imagenes"
                        accept="image/*"
                        multiple
                        onChange={handleInputChange}
                        className="hidden"
                        id="imagenesInput"
                      />
                      <label htmlFor="imagenesInput" className="cursor-pointer">
                        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Selecciona varias imágenes</p>
                        <p className="text-xs text-gray-400">Máximo 5 archivos, 5MB c/u</p>
                      </label>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {imagePreviews.map((preview, idx) => (
                          <img key={idx} src={preview} alt={`Adicional ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={16} />
                        {editingProduct ? 'Actualizar producto' : 'Crear producto'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingProduct(null); resetForm(); setError(null); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    <X size={16} /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
