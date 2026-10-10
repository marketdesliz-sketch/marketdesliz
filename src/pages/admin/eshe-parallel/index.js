// src/pages/admin/eshe-parallel/index.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Shirt, Search, Filter, Eye, Edit, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, Plus, FileSpreadsheet, Printer,
  CheckCircle, XCircle, AlertCircle, Star, Award, Sparkles,
  Package, TrendingUp, DollarSign
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import pb from '../../../lib/pocketbase';
import {
  getEsheParallel,
  getEsheParallelById,
  getColecciones,
  getEsheCategorias,       // ✅ NUEVO
} from '../../../lib/esheParallelService';
import { formatMoney, formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

const ITEMS_PER_PAGE = 12;

export default function AdminEsheParallelPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const {
    page = 1,
    search = '',
    categoriaId = 'todas',    // ✅ Renombrado
    coleccion = '',
    genero = '',
    destacados = '',
    sort = '-created'
  } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros locales
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [filterCategoriaId, setFilterCategoriaId] = useState(categoriaId || 'todas');  // ✅
  const [filterColeccion, setFilterColeccion] = useState(coleccion || '');
  const [filterGenero, setFilterGenero] = useState(genero || '');
  const [filterDestacados, setFilterDestacados] = useState(destacados === 'true');
  const [sortBy, setSortBy] = useState(sort || '-created');

  // Listas dinámicas
  const [coleccionesDisponibles, setColeccionesDisponibles] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);  // ✅ NUEVO

  // ─── Stats ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    destacados: 0,
    nuevos: 0,
    edicionLimitada: 0,
    agotados: 0,
    visitasTotal: 0
  });

  // ─── Modales ──────────────────────────────────────────────────────────
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const GENEROS = ['Mujer', 'Hombre', 'Unisex', 'Niños', 'Bebés'];

  // ─── Cargar datos ─────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess('');

      const result = await getEsheParallel({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        categoriaId: filterCategoriaId,   // ✅ Cambio
        genero: filterGenero,
        coleccion: filterColeccion,
        soloDestacados: filterDestacados,
        sort: sortBy,
      });

      setProductos(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

      if (!showRefreshing) {
        await cargarStats();
        const cols = await getColecciones();
        setColeccionesDisponibles(cols);

        const cats = await getEsheCategorias();   // ✅ NUEVO
        setCategoriasDisponibles(cats);
      }

    } catch (err) {
      console.error('Error cargando productos Éshé:', err);
      setError('No se pudieron cargar los productos. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filterCategoriaId, filterColeccion, filterGenero, filterDestacados, sortBy]);

  // ─── Cargar stats ─────────────────────────────────────────────────────
  const cargarStats = async () => {
    try {
      const [all, activos, destacados, nuevos, limitada, agotados] = await Promise.all([
        pb.collection('eshe_parallel').getList(1, 1, { fields: 'id' }),
        pb.collection('eshe_parallel').getList(1, 1, { filter: 'activo = true', fields: 'id' }),
        pb.collection('eshe_parallel').getList(1, 1, { filter: 'destacado = true', fields: 'id' }),
        pb.collection('eshe_parallel').getList(1, 1, { filter: 'nuevo = true', fields: 'id' }),
        pb.collection('eshe_parallel').getList(1, 1, { filter: 'edicionLimitada = true', fields: 'id' }),
        pb.collection('eshe_parallel').getList(1, 1, { filter: 'stock = 0', fields: 'id' }),
      ]);

      let visitas = 0;
      try {
        const records = await pb.collection('eshe_parallel').getFullList({
          fields: 'visitas',
        });
        visitas = records.reduce((sum, r) => sum + (r.visitas || 0), 0);
      } catch (e) { /* silencioso */ }

      setStats({
        total: all.totalItems,
        activos: activos.totalItems,
        destacados: destacados.totalItems,
        nuevos: nuevos.totalItems,
        edicionLimitada: limitada.totalItems,
        agotados: agotados.totalItems,
        visitasTotal: visitas,
      });
    } catch (err) {
      console.error('Error cargando stats:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── URL ──────────────────────────────────────────────────────────────
  const actualizarURL = useCallback((params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      search: searchTerm || undefined,
      categoriaId: filterCategoriaId !== 'todas' ? filterCategoriaId : undefined,  // ✅
      coleccion: filterColeccion || undefined,
      genero: filterGenero || undefined,
      destacados: filterDestacados ? 'true' : undefined,
      sort: sortBy !== '-created' ? sortBy : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/eshe-parallel', query }, undefined, { shallow: true });
  }, [currentPage, searchTerm, filterCategoriaId, filterColeccion, filterGenero, filterDestacados, sortBy, router]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    setSearchTerm(term);
    actualizarURL({ search: term, page: 1 });
  };

  const handleCategoriaChange = (val) => {
    setFilterCategoriaId(val);   // ✅
    actualizarURL({ categoriaId: val, page: 1 });
  };

  const handleColeccionChange = (val) => {
    setFilterColeccion(val);
    actualizarURL({ coleccion: val, page: 1 });
  };

  const handleGeneroChange = (val) => {
    setFilterGenero(val);
    actualizarURL({ genero: val, page: 1 });
  };

  const handleDestacadosToggle = () => {
    const nuevo = !filterDestacados;
    setFilterDestacados(nuevo);
    actualizarURL({ destacados: nuevo ? 'true' : undefined, page: 1 });
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
    setFilterCategoriaId('todas');   // ✅
    setFilterColeccion('');
    setFilterGenero('');
    setFilterDestacados(false);
    setSortBy('-created');
    router.push('/admin/eshe-parallel', undefined, { shallow: true });
  };

  // ─── Acciones ─────────────────────────────────────────────────────────
  const verDetalle = async (producto) => {
    try {
      const completo = await getEsheParallelById(producto.id);
      setSelectedProducto(completo || producto);
      setShowDetailModal(true);
    } catch (err) {
      setSelectedProducto(producto);
      setShowDetailModal(true);
    }
  };

  const toggleActivo = async (producto) => {
    try {
      await pb.collection('eshe_parallel').update(producto.id, {
        activo: !producto.activo,
      });
      setSuccess(producto.activo ? 'Producto desactivado' : 'Producto activado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar estado');
    }
  };

  const toggleDestacado = async (producto) => {
    try {
      await pb.collection('eshe_parallel').update(producto.id, {
        destacado: !producto.destacado,
      });
      setSuccess(producto.destacado ? 'Removido de destacados' : 'Marcado como destacado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar destacado');
    }
  };

  const eliminarProductoConfirm = async () => {
    try {
      if (!selectedProducto) return;
      await pb.collection('eshe_parallel').delete(selectedProducto.id);
      setSuccess('Producto eliminado');
      setShowDeleteModal(false);
      await cargarDatos(true);
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar el producto');
    }
  };

  // ─── Exportar Excel ───────────────────────────────────────────────────
  const exportarExcel = () => {
    const data = productos.map(p => ({
      'ID': p.id,
      'Nombre': p.nombre,
      'Categoría': p.categoriaNombre || '',   // ✅
      'Subcategoría': p.subcategoria,
      'Colección': p.coleccion,
      'Género': p.genero,
      'Color': p.color,
      'Material': p.material,
      'Tallas': (p.talla || []).join(', '),
      'Precio': p.precio,
      'Stock': p.stock,
      'SKU': p.sku,
      'Activo': p.activo ? 'Sí' : 'No',
      'Destacado': p.destacado ? 'Sí' : 'No',
      'Nuevo': p.nuevo ? 'Sí' : 'No',
      'Edición Limitada': p.edicionLimitada ? 'Sí' : 'No',
      'Visitas': p.visitas,
      'Fecha creación': new Date(p.creado).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Eshé Parallel');
    XLSX.writeFile(workbook, `eshe-parallel_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <title>Éshé Parallel | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Shirt size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Éshé Parallel</h1>
                <p className="text-sm text-muted-foreground">Gestiona la colección de moda exclusiva</p>
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
                onClick={exportarExcel}
                className="rounded-2xl h-10 bg-blue-600 hover:bg-blue-700 font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
              </Button>
              <Link href="/admin/eshe-parallel/nuevo">
                <Button className="rounded-2xl h-10 bg-primary hover:bg-primary/90 font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo producto
                </Button>
              </Link>
            </div>
          </div>

          {/* ─── Mensajes ──────────────────────────────────────── */}
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

          {/* ─── Stats ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <Package size={18} className="text-primary mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-muted-foreground mt-1">Total</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <CheckCircle size={18} className="text-green-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
                <div className="text-xs text-muted-foreground mt-1">Activos</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <Star size={18} className="text-yellow-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-yellow-600">{stats.destacados}</div>
                <div className="text-xs text-muted-foreground mt-1">Destacados</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <Sparkles size={18} className="text-primary mx-auto mb-1" />
                <div className="text-2xl font-bold text-primary">{stats.nuevos}</div>
                <div className="text-xs text-muted-foreground mt-1">Nuevos</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <Award size={18} className="text-purple-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-purple-600">{stats.edicionLimitada}</div>
                <div className="text-xs text-muted-foreground mt-1">Ed. Limitada</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <XCircle size={18} className="text-red-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-600">{stats.agotados}</div>
                <div className="text-xs text-muted-foreground mt-1">Agotados</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <TrendingUp size={18} className="text-primary mx-auto mb-1" />
                <div className="text-xl font-bold text-primary">{stats.visitasTotal}</div>
                <div className="text-xs text-muted-foreground mt-1">Visitas</div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Filtros ───────────────────────────────────────── */}
          <Card className="border-none shadow-sm rounded-2xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchTerm}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                    placeholder="Buscar por nombre, color, material..."
                  />
                </form>

                {/* ✅ Categorías dinámicas desde PocketBase */}
                <select
                  value={filterCategoriaId}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="todas">Todas las categorías</option>
                  {categoriasDisponibles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.categoriaPadreId ? `  └─ ${c.nombre}` : c.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={filterGenero}
                  onChange={(e) => handleGeneroChange(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos los géneros</option>
                  {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                {coleccionesDisponibles.length > 0 && (
                  <select
                    value={filterColeccion}
                    onChange={(e) => handleColeccionChange(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Todas las colecciones</option>
                    {coleccionesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}

                <Button
                  variant="outline"
                  onClick={handleDestacadosToggle}
                  className={`rounded-2xl h-10 ${
                    filterDestacados
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Star className={`w-4 h-4 mr-2 ${filterDestacados ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  Destacados
                </Button>

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

              {/* Filtros activos */}
              {(searchTerm || filterCategoriaId !== 'todas' || filterGenero || filterColeccion || filterDestacados) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span>Filtros activos:</span>
                  {searchTerm && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{searchTerm}</span>}
                  {filterCategoriaId !== 'todas' && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {categoriasDisponibles.find(c => c.id === filterCategoriaId)?.nombre || filterCategoriaId}
                    </span>
                  )}
                  {filterGenero && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{filterGenero}</span>}
                  {filterColeccion && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{filterColeccion}</span>}
                  {filterDestacados && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Destacados</span>}
                  <button onClick={limpiarFiltros} className="ml-2 text-primary hover:underline font-medium">
                    Limpiar
                  </button>
                </div>
              )}

              <div className="mt-3 text-sm text-muted-foreground">
                {productos.length} {productos.length === 1 ? 'producto' : 'productos'} mostrados
              </div>
            </CardContent>
          </Card>

          {/* ─── Grid de productos ─────────────────────────────── */}
          {productos.length === 0 ? (
            <Card className="border-none shadow-sm rounded-2xl p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shirt size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                No se encontraron productos
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterCategoriaId !== 'todas'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Registra el primer producto de Éshé Parallel'}
              </p>
              <Link href="/admin/eshe-parallel/nuevo">
                <Button className="rounded-2xl h-11 bg-primary hover:bg-primary/90 font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo producto
                </Button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productos.map((producto) => (
                  <Card
                    key={producto.id}
                    className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-[3/4] bg-muted/30 relative overflow-hidden">
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                          <Shirt className="w-12 h-12 text-primary/40" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {producto.nuevo && (
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Nuevo
                          </span>
                        )}
                        {producto.edicionLimitada && (
                          <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Award size={10} /> Ed. Limitada
                          </span>
                        )}
                        {!producto.activo && (
                          <span className="bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDestacado(producto);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                        title={producto.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            producto.destacado ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
                          }`}
                        />
                      </button>

                      {producto.stock === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-red-500/90 text-white text-[10px] font-bold py-1 text-center">
                          AGOTADO
                        </div>
                      )}
                    </div>

                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          {producto.sku && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {producto.sku}
                            </span>
                          )}
                          <h3 className="font-bold text-sm text-gray-800 line-clamp-1">
                            {producto.nombre}
                          </h3>
                        </div>
                      </div>

                      {/* ✅ categoriaNombre en lugar de categoria */}
                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        {producto.categoriaNombre && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {producto.categoriaNombre}
                          </span>
                        )}
                        {producto.genero && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {producto.genero}
                          </span>
                        )}
                      </div>

                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-base font-black text-gray-900">
                            {formatMoney(producto.precio)}
                          </p>
                          {producto.precioAnterior > producto.precio && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatMoney(producto.precioAnterior)}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          producto.stock > 0 ? 'text-gray-500' : 'text-red-500'
                        }`}>
                          {producto.stock} pzs
                        </span>
                      </div>

                      {producto.talla && producto.talla.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {producto.talla.slice(0, 5).map(t => (
                            <span key={t} className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Button
                          onClick={() => verDetalle(producto)}
                          variant="outline"
                          className="flex-1 rounded-xl h-9 border-gray-200 text-gray-600 hover:border-primary hover:text-primary text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                        <Link href={`/admin/eshe-parallel/editar?id=${producto.id}`} className="flex-1">
                          <Button className="w-full rounded-xl h-9 bg-primary hover:bg-primary/90 text-xs font-semibold">
                            <Edit className="w-3 h-3 mr-1" /> Editar
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            setSelectedProducto(producto);
                            setShowDeleteModal(true);
                          }}
                          variant="outline"
                          className="rounded-xl h-9 w-9 border-red-200 text-red-500 hover:bg-red-50 p-0"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      <button
                        onClick={() => toggleActivo(producto)}
                        className={`w-full mt-2 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition ${
                          producto.activo
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} · {totalItems} productos
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

      {/* ─── Modal detalle ───────────────────────────────────── */}
      {showDetailModal && selectedProducto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shirt size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Detalle del producto</h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="aspect-[3/4] bg-muted/30 rounded-2xl overflow-hidden">
                  {selectedProducto.imagen ? (
                    <img src={selectedProducto.imagen} alt={selectedProducto.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                      <Shirt className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    {selectedProducto.sku && (
                      <span className="text-xs text-muted-foreground font-mono">{selectedProducto.sku}</span>
                    )}
                    <h3 className="text-xl font-bold text-gray-900">{selectedProducto.nombre}</h3>
                  </div>

                  {/* ✅ categoriaNombre */}
                  <div className="flex flex-wrap gap-2">
                    {selectedProducto.categoriaNombre && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{selectedProducto.categoriaNombre}</span>
                    )}
                    {selectedProducto.subcategoria && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{selectedProducto.subcategoria}</span>
                    )}
                    {selectedProducto.genero && (
                      <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{selectedProducto.genero}</span>
                    )}
                    {selectedProducto.coleccion && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">{selectedProducto.coleccion}</span>
                    )}
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Precio</p>
                    <p className="text-2xl font-black text-primary">{formatMoney(selectedProducto.precio)}</p>
                    {selectedProducto.precioAnterior > selectedProducto.precio && (
                      <p className="text-sm text-muted-foreground line-through mt-1">
                        {formatMoney(selectedProducto.precioAnterior)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="font-bold text-gray-900">{selectedProducto.stock} pzs</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Visitas</p>
                      <p className="font-bold text-gray-900">{selectedProducto.visitas || 0}</p>
                    </div>
                    {selectedProducto.color && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Color</p>
                        <p className="font-bold text-gray-900">{selectedProducto.color}</p>
                      </div>
                    )}
                    {selectedProducto.material && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Material</p>
                        <p className="font-bold text-gray-900">{selectedProducto.material}</p>
                      </div>
                    )}
                  </div>

                  {selectedProducto.talla && selectedProducto.talla.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Tallas disponibles</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProducto.talla.map(t => (
                          <span key={t} className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedProducto.nuevo && (
                      <span className="text-xs bg-primary text-white px-2.5 py-1 rounded-full">Nuevo</span>
                    )}
                    {selectedProducto.destacado && (
                      <span className="text-xs bg-yellow-500 text-white px-2.5 py-1 rounded-full">Destacado</span>
                    )}
                    {selectedProducto.edicionLimitada && (
                      <span className="text-xs bg-purple-600 text-white px-2.5 py-1 rounded-full">Ed. Limitada</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedProducto.descripcion && (
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProducto.descripcion}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
                className="flex-1 rounded-2xl h-11 border-gray-200 text-gray-700"
              >
                Cerrar
              </Button>
              <Link href={`/admin/eshe-parallel/editar?id=${selectedProducto.id}`} className="flex-1">
                <Button className="w-full rounded-2xl h-11 bg-primary hover:bg-primary/90 font-semibold">
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal eliminar ──────────────────────────────────── */}
      {showDeleteModal && selectedProducto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trash2 size={18} className="text-red-500" /> Eliminar producto
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro de eliminar <strong>{selectedProducto.nombre}</strong>? Esta acción no se puede deshacer.
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
                onClick={eliminarProductoConfirm}
                className="flex-1 rounded-2xl h-11 bg-red-600 hover:bg-red-700 font-bold"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}