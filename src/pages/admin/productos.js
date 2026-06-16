// src/pages/admin/productos.js
import { useEffect, useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';

export default function AdminProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('todos');
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    enganche: '',
    pagoSemanal: '',
    semanas: '12',
    categoria: '',
    imagen: null,
    activo: true
  });

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('products').getFullList({
        sort: '-created'
      });

      setProductos(records);
      const uniqueCategories = [...new Set(records.map(p => p.categoria).filter(Boolean))];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;
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
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
      imagen: null,
      activo: producto.activo === true
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await pb.collection('products').delete(id);
      cargarProductos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();

      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('precio', parseFloat(formData.precio));
      formDataToSend.append('enganche', parseFloat(formData.enganche));
      formDataToSend.append('pagoSemanal', parseFloat(formData.pagoSemanal));
      formDataToSend.append('semanas', parseInt(formData.semanas));
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('activo', formData.activo);

      if (formData.imagen) {
        formDataToSend.append('imagen', formData.imagen);
      }

      if (editingProduct) {
        await pb.collection('products').update(editingProduct.id, formDataToSend);
      } else {
        await pb.collection('products').create(formDataToSend);
      }

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      cargarProductos();

    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto');
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
      imagen: null,
      activo: true
    });
    setImagePreview(null);
  };

  const filteredProductos = productos.filter(p => {
    const matchesSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterCategory === 'todos') return matchesSearch;
    return matchesSearch && p.categoria === filterCategory;
  });

  const getImageUrl = (producto) => {
    if (!producto.imagen) return null;
    return pb.files.getURL(producto, producto.imagen);
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const estadisticas = {
    total: productos.length,
    activos: productos.filter(p => p.activo === true).length,
    inactivos: productos.filter(p => p.activo === false).length,
    categorias: categories.length
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
        <title>Gestión de Productos | Admin</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">

          {/* Header */}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Package size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.total}</span>
              </div>
              <p className="text-xs text-gray-500">Total productos</p>
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
                <AlertCircle size={18} className="text-gray-400" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.inactivos}</span>
              </div>
              <p className="text-xs text-gray-500">Inactivos</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Grid3x3 size={18} className="text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{estadisticas.categorias}</span>
              </div>
              <p className="text-xs text-gray-500">Categorías</p>
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
                  placeholder="Buscar productos por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-[#6C3BFF]"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="todos">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProductos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No se encontraron productos</h3>
              <p className="text-sm text-gray-400">Intenta con otros filtros de búsqueda o crea un nuevo producto</p>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 mt-4 text-[#6C3BFF] hover:underline text-sm"
              >
                <Plus size={14} /> Crear nuevo producto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProductos.map(producto => (
                <div key={producto.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                  {/* Imagen */}
                  <div className="relative h-40 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                    {producto.imagen ? (
                      <img
                        src={getImageUrl(producto)}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={48} className="text-purple-300" />
                      </div>
                    )}
                    {/* Badge de estado */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${producto.activo === true ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {producto.activo === true ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>

                  {/* Información */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base line-clamp-1">{producto.nombre}</h3>
                    </div>
                    {producto.categoria && (
                      <p className="text-xs text-purple-600 font-medium mb-2">{producto.categoria}</p>
                    )}
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{producto.descripcion}</p>

                    {/* Precios */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Precio:</span>
                        <span className="font-bold text-gray-900">{formatMoney(producto.precio)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Enganche:</span>
                        <span className="font-bold text-purple-600">{formatMoney(producto.enganche)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pago semanal:</span>
                        <span className="font-bold text-green-600">{formatMoney(producto.pagoSemanal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Semanas:</span>
                        <span className="text-gray-700">{producto.semanas} semanas</span>
                      </div>
                    </div>

                    {/* Acciones */}
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
          )}
        </div>

        {/* Modal de creación/edición */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
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
                <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      placeholder="Ej: Lavadora Samsung"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent resize-none"
                      placeholder="Descripción detallada del producto..."
                    />
                  </div>

                  {/* Precios */}
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
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
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
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                          placeholder="0"
                        />
                      </div>
                    </div>
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
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                          placeholder="12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categoría y Estado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <div className="relative">
                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          name="categoria"
                          value={formData.categoria}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent appearance-none cursor-pointer"
                        >
                          <option value="">Selecciona una categoría</option>
                          <option value="electronica">📱 Electrónica</option>
                          <option value="hogar">🏠 Hogar</option>
                          <option value="ropa">👕 Ropa</option>
                          <option value="instrumentos">🎸 Instrumentos</option>
                          <option value="ganado">🐄 Ganado</option>
                          <option value="servicios">⚙️ Servicios</option>
                          <option value="cortinas">🪟 Cortinas</option>
                          <option value="sabanas">🛏️ Sábanas</option>
                          <option value="almohadas">🛌 Almohadas</option>
                          <option value="cubre-salas">🛋️ Cubre Salas</option>
                          <option value="botes">🗑️ Botes</option>
                          <option value="sillas">🪑 Sillas</option>
                          <option value="bancos-plastico">🪑 Bancos de Plástico</option>
                          <option value="baterias-peltre">🍳 Baterías de Peltre</option>
                          <option value="acero-inoxidable">🔪 Acero Inoxidable</option>
                          <option value="vapoderas">🍲 Vapoderas</option>
                          <option value="sartenes">🍳 Sartenes</option>
                          <option value="colchones">🛏️ Colchones</option>
                          <option value="bases-cama">🛏️ Bases de Cama</option>
                          <option value="cajoneras">🗄️ Cajoneras</option>
                          <option value="licuadoras">🥤 Licuadoras</option>
                          <option value="bocinas">🔊 Bocinas</option>
                          <option value="mesas">🪑 Mesas</option>
                          <option value="batidoras">🥣 Batidoras</option>
                          <option value="planchas">👕 Planchas</option>
                          <option value="ventiladores">💨 Ventiladores</option>
                          <option value="anaqueles">📚 Anaqueles</option>
                        </select>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Selecciona la categoría donde aparecerá el producto
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select
                        name="activo"
                        value={formData.activo}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      >
                        <option value={true}>✅ Activo (visible en tienda)</option>
                        <option value={false}>❌ Inactivo (oculto)</option>
                      </select>
                    </div>
                  </div>

                  {/* Imagen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del producto</label>
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
                          src={imagePreview || (editingProduct && getImageUrl(editingProduct))}
                          alt="Vista previa"
                          className="w-24 h-24 object-cover rounded-lg mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition"
                  >
                    <Save size={16} /> {editingProduct ? 'Actualizar producto' : 'Crear producto'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
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