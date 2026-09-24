// src/pages/admin/ganado/index.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Beef, Search, Filter, Eye, Edit, Trash2, RefreshCw,
  ChevronLeft, ChevronRight, Plus, FileSpreadsheet, Printer,
  CheckCircle, XCircle, AlertCircle, Star, Award, Sparkles,
  Package, TrendingUp, Scale, Calendar, BadgeCheck, Syringe,
  PiggyBank, Bird, Rabbit
} from 'lucide-react';
import AdminLayoutMinimal from '../../../layouts/AdminLayoutMinimal';
import pb from '../../../lib/pocketbase';
import { getGanado, getGanadoById, formatEdad } from '../../../lib/ganadoService';
import { formatMoney, formatDate } from '../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';

const ITEMS_PER_PAGE = 12;

export default function AdminGanadoPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const {
    page = 1,
    search = '',
    categoria = 'todas',
    sexo = '',
    destacados = '',
    soloNuevos = '',
    sort = '-created'
  } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados ──────────────────────────────────────────────────────────
  const [animales, setAnimales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros locales
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [filterCategoria, setFilterCategoria] = useState(categoria || 'todas');
  const [filterSexo, setFilterSexo] = useState(sexo || '');
  const [filterDestacados, setFilterDestacados] = useState(destacados === 'true');
  const [filterNuevos, setFilterNuevos] = useState(soloNuevos === 'true');
  const [sortBy, setSortBy] = useState(sort || '-created');

  // ─── Stats ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    destacados: 0,
    nuevos: 0,
    certificados: 0,
    vacunados: 0,
    agotados: 0,
    visitasTotal: 0
  });

  // ─── Modales ──────────────────────────────────────────────────────────
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Categorías y sexos
  const CATEGORIAS = [
    'Bovinos', 'Porcinos', 'Ovinos', 'Caprinos', 'Aves',
    'Equinos', 'Conejos', 'Otro'
  ];

  const SEXOS = ['Macho', 'Hembra', 'Mixto'];

  // ─── Cargar datos ─────────────────────────────────────────────────────
  const cargarDatos = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setSuccess('');

      const result = await getGanado({
        page: currentPage,
        perPage: ITEMS_PER_PAGE,
        search: searchTerm,
        categoria: filterCategoria,
        sexo: filterSexo,
        soloDestacados: filterDestacados,
        soloNuevos: filterNuevos,
        sort: sortBy,
      });

      setAnimales(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);

      if (!showRefreshing) {
        await cargarStats();
      }

    } catch (err) {
      console.error('Error cargando ganado:', err);
      setError('No se pudieron cargar los animales. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchTerm, filterCategoria, filterSexo, filterDestacados, filterNuevos, sortBy]);

  // ─── Cargar stats ─────────────────────────────────────────────────────
  const cargarStats = async () => {
    try {
      const [all, activos, destacados, nuevos, certificados, vacunados, agotados] = await Promise.all([
        pb.collection('ganado').getList(1, 1, { fields: 'id' }),
        pb.collection('ganado').getList(1, 1, { filter: 'activo = true', fields: 'id' }),
        pb.collection('ganado').getList(1, 1, { filter: 'destacado = true', fields: 'id' }),
        pb.collection('ganado').getList(1, 1, { filter: 'nuevo = true', fields: 'id' }),
        pb.collection('ganado').getList(1, 1, { filter: 'certificado = true', fields: 'id' }),
        pb.collection('ganado').getList(1, 1, { filter: 'vacunado = true', fields: 'id' }),
        pb.collection('ganado').getList(1, 1, { filter: 'cantidad = 0', fields: 'id' }),
      ]);

      let visitas = 0;
      try {
        const records = await pb.collection('ganado').getFullList({ fields: 'visitas' });
        visitas = records.reduce((sum, r) => sum + (r.visitas || 0), 0);
      } catch (e) { /* silencioso */ }

      setStats({
        total: all.totalItems,
        activos: activos.totalItems,
        destacados: destacados.totalItems,
        nuevos: nuevos.totalItems,
        certificados: certificados.totalItems,
        vacunados: vacunados.totalItems,
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
      categoria: filterCategoria !== 'todas' ? filterCategoria : undefined,
      sexo: filterSexo || undefined,
      destacados: filterDestacados ? 'true' : undefined,
      soloNuevos: filterNuevos ? 'true' : undefined,
      sort: sortBy !== '-created' ? sortBy : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/ganado', query }, undefined, { shallow: true });
  }, [currentPage, searchTerm, filterCategoria, filterSexo, filterDestacados, filterNuevos, sortBy, router]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    setSearchTerm(term);
    actualizarURL({ search: term, page: 1 });
  };

  const handleCategoriaChange = (val) => {
    setFilterCategoria(val);
    actualizarURL({ categoria: val, page: 1 });
  };

  const handleSexoChange = (val) => {
    setFilterSexo(val);
    actualizarURL({ sexo: val, page: 1 });
  };

  const handleDestacadosToggle = () => {
    const nuevo = !filterDestacados;
    setFilterDestacados(nuevo);
    actualizarURL({ destacados: nuevo ? 'true' : undefined, page: 1 });
  };

  const handleNuevosToggle = () => {
    const nuevo = !filterNuevos;
    setFilterNuevos(nuevo);
    actualizarURL({ soloNuevos: nuevo ? 'true' : undefined, page: 1 });
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
    setFilterCategoria('todas');
    setFilterSexo('');
    setFilterDestacados(false);
    setFilterNuevos(false);
    setSortBy('-created');
    router.push('/admin/ganado', undefined, { shallow: true });
  };

  // ─── Acciones ─────────────────────────────────────────────────────────
  const verDetalle = async (animal) => {
    try {
      const completo = await getGanadoById(animal.id);
      setSelectedAnimal(completo || animal);
      setShowDetailModal(true);
    } catch (err) {
      setSelectedAnimal(animal);
      setShowDetailModal(true);
    }
  };

  const toggleActivo = async (animal) => {
    try {
      await pb.collection('ganado').update(animal.id, { activo: !animal.activo });
      setSuccess(animal.activo ? 'Animal desactivado' : 'Animal activado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar estado');
    }
  };

  const toggleDestacado = async (animal) => {
    try {
      await pb.collection('ganado').update(animal.id, { destacado: !animal.destacado });
      setSuccess(animal.destacado ? 'Removido de destacados' : 'Marcado como destacado');
      await cargarDatos(true);
    } catch (err) {
      setError('Error al cambiar destacado');
    }
  };

  const eliminarAnimalConfirm = async () => {
    try {
      if (!selectedAnimal) return;
      await pb.collection('ganado').delete(selectedAnimal.id);
      setSuccess('Animal eliminado');
      setShowDeleteModal(false);
      await cargarDatos(true);
    } catch (err) {
      console.error('Error eliminando:', err);
      setError('Error al eliminar el animal');
    }
  };

  // ─── Exportar Excel ───────────────────────────────────────────────────
  const exportarExcel = () => {
    const data = animales.map(a => ({
      'ID': a.id,
      'Nombre': a.nombre,
      'Categoría': a.categoria,
      'Raza': a.raza,
      'Sexo': a.sexo,
      'Edad': formatEdad(a.edadMeses),
      'Peso (kg)': a.pesoKg,
      'Precio': a.precio,
      'Unidad': a.unidad,
      'Cantidad': a.cantidad,
      'Vacunado': a.vacunado ? 'Sí' : 'No',
      'Certificado': a.certificado ? 'Sí' : 'No',
      'Activo': a.activo ? 'Sí' : 'No',
      'Destacado': a.destacado ? 'Sí' : 'No',
      'Nuevo': a.nuevo ? 'Sí' : 'No',
      'Visitas': a.visitas,
      'Fecha creación': new Date(a.creado).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ganado');
    XLSX.writeFile(workbook, `ganado_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <title>Ganado | Admin</title>
      </Head>

      <AdminLayoutMinimal>
        <div className="max-w-[1400px] mx-auto w-full">

          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Beef size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ganado</h1>
                <p className="text-sm text-muted-foreground">Gestiona los animales publicados</p>
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
              <Link href="/admin/ganado/nuevo">
                <Button className="rounded-2xl h-10 bg-primary hover:bg-primary/90 font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo animal
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
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
                <BadgeCheck size={18} className="text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-600">{stats.certificados}</div>
                <div className="text-xs text-muted-foreground mt-1">Certificados</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <Syringe size={18} className="text-blue-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-blue-600">{stats.vacunados}</div>
                <div className="text-xs text-muted-foreground mt-1">Vacunados</div>
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
                    placeholder="Buscar por nombre, raza o categoría..."
                  />
                </form>

                <select
                  value={filterCategoria}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="todas">Todas las categorías</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={filterSexo}
                  onChange={(e) => handleSexoChange(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos los sexos</option>
                  {SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

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

                <Button
                  variant="outline"
                  onClick={handleNuevosToggle}
                  className={`rounded-2xl h-10 ${
                    filterNuevos
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nuevos
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
              {(searchTerm || filterCategoria !== 'todas' || filterSexo || filterDestacados || filterNuevos) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span>Filtros activos:</span>
                  {searchTerm && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{searchTerm}</span>}
                  {filterCategoria !== 'todas' && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{filterCategoria}</span>}
                  {filterSexo && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">{filterSexo}</span>}
                  {filterDestacados && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Destacados</span>}
                  {filterNuevos && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Nuevos</span>}
                  <button onClick={limpiarFiltros} className="ml-2 text-primary hover:underline font-medium">
                    Limpiar
                  </button>
                </div>
              )}

              <div className="mt-3 text-sm text-muted-foreground">
                {animales.length} {animales.length === 1 ? 'animal' : 'animales'} mostrados
              </div>
            </CardContent>
          </Card>

          {/* ─── Grid de animales ──────────────────────────────── */}
          {animales.length === 0 ? (
            <Card className="border-none shadow-sm rounded-2xl p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Beef size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                No se encontraron animales
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterCategoria !== 'todas'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Registra el primer animal de ganado'}
              </p>
              <Link href="/admin/ganado/nuevo">
                <Button className="rounded-2xl h-11 bg-primary hover:bg-primary/90 font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> Nuevo animal
                </Button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {animales.map((animal) => (
                  <Card
                    key={animal.id}
                    className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Imagen */}
                    <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden">
                      {animal.imagen ? (
                        <img
                          src={animal.imagen}
                          alt={animal.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                          <Beef className="w-12 h-12 text-primary/40" />
                        </div>
                      )}

                      {/* Badges flotantes */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {animal.nuevo && (
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Nuevo
                          </span>
                        )}
                        {animal.destacado && (
                          <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Award size={10} /> Destacado
                          </span>
                        )}
                        {animal.certificado && (
                          <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <BadgeCheck size={10} /> Certificado
                          </span>
                        )}
                        {!animal.activo && (
                          <span className="bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>

                      {/* Destacado toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDestacado(animal);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                        title={animal.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            animal.destacado ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
                          }`}
                        />
                      </button>

                      {/* Agotado */}
                      {animal.cantidad === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-red-500/90 text-white text-[10px] font-bold py-1 text-center">
                          AGOTADO
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-gray-800 line-clamp-1">
                            {animal.nombre}
                          </h3>
                        </div>
                      </div>

                      {/* Categoría + Raza + Sexo */}
                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        {animal.categoria && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {animal.categoria}
                          </span>
                        )}
                        {animal.raza && (
                          <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                            {animal.raza}
                          </span>
                        )}
                        {animal.sexo && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {animal.sexo}
                          </span>
                        )}
                      </div>

                      {/* Precio y cantidad */}
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-base font-black text-gray-900">
                            {formatMoney(animal.precio)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            por {animal.unidad}
                          </p>
                          {animal.precioAnterior > animal.precio && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatMoney(animal.precioAnterior)}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          animal.cantidad > 0 ? 'text-gray-500' : 'text-red-500'
                        }`}>
                          {animal.cantidad} {animal.unidad}
                        </span>
                      </div>

                      {/* Peso y edad */}
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap mb-2">
                        {animal.pesoKg > 0 && (
                          <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3" /> {animal.pesoKg} kg
                          </span>
                        )}
                        {animal.edadMeses > 0 && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatEdad(animal.edadMeses)}
                          </span>
                        )}
                        {animal.vacunado && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Syringe className="w-3 h-3" /> Vacunado
                          </span>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Button
                          onClick={() => verDetalle(animal)}
                          variant="outline"
                          className="flex-1 rounded-xl h-9 border-gray-200 text-gray-600 hover:border-primary hover:text-primary text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                        <Link href={`/admin/ganado/editar?id=${animal.id}`} className="flex-1">
                          <Button className="w-full rounded-xl h-9 bg-primary hover:bg-primary/90 text-xs font-semibold">
                            <Edit className="w-3 h-3 mr-1" /> Editar
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            setSelectedAnimal(animal);
                            setShowDeleteModal(true);
                          }}
                          variant="outline"
                          className="rounded-xl h-9 w-9 border-red-200 text-red-500 hover:bg-red-50 p-0"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Toggle activo */}
                      <button
                        onClick={() => toggleActivo(animal)}
                        className={`w-full mt-2 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition ${
                          animal.activo
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {animal.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-gray-100">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} · {totalItems} animales
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
      {showDetailModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Beef size={16} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Detalle del animal</h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Imagen */}
                <div className="aspect-square bg-muted/30 rounded-2xl overflow-hidden">
                  {selectedAnimal.imagen ? (
                    <img src={selectedAnimal.imagen} alt={selectedAnimal.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                      <Beef className="w-16 h-16 text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedAnimal.nombre}</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedAnimal.categoria && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{selectedAnimal.categoria}</span>
                    )}
                    {selectedAnimal.raza && (
                      <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full">{selectedAnimal.raza}</span>
                    )}
                    {selectedAnimal.sexo && (
                      <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{selectedAnimal.sexo}</span>
                    )}
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Precio al contado</p>
                    <p className="text-2xl font-black text-primary">{formatMoney(selectedAnimal.precio)}</p>
                    {selectedAnimal.precioAnterior > selectedAnimal.precio && (
                      <p className="text-sm text-muted-foreground line-through mt-1">
                        {formatMoney(selectedAnimal.precioAnterior)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">por {selectedAnimal.unidad}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Cantidad</p>
                      <p className="font-bold text-gray-900">{selectedAnimal.cantidad} {selectedAnimal.unidad}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-muted-foreground">Visitas</p>
                      <p className="font-bold text-gray-900">{selectedAnimal.visitas || 0}</p>
                    </div>
                    {selectedAnimal.pesoKg > 0 && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Peso</p>
                        <p className="font-bold text-gray-900">{selectedAnimal.pesoKg} kg</p>
                      </div>
                    )}
                    {selectedAnimal.edadMeses > 0 && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-muted-foreground">Edad</p>
                        <p className="font-bold text-gray-900">{formatEdad(selectedAnimal.edadMeses)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedAnimal.nuevo && (
                      <span className="text-xs bg-primary text-white px-2.5 py-1 rounded-full">Nuevo</span>
                    )}
                    {selectedAnimal.destacado && (
                      <span className="text-xs bg-yellow-500 text-white px-2.5 py-1 rounded-full">Destacado</span>
                    )}
                    {selectedAnimal.certificado && (
                      <span className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                        <BadgeCheck size={12} /> Certificado
                      </span>
                    )}
                    {selectedAnimal.vacunado && (
                      <span className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Syringe size={12} /> Vacunado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedAnimal.descripcion && (
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedAnimal.descripcion}</p>
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
              <Link href={`/admin/ganado/editar?id=${selectedAnimal.id}`} className="flex-1">
                <Button className="w-full rounded-2xl h-11 bg-primary hover:bg-primary/90 font-semibold">
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal eliminar ──────────────────────────────────── */}
      {showDeleteModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trash2 size={18} className="text-red-500" /> Eliminar animal
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                ¿Estás seguro de eliminar <strong>{selectedAnimal.nombre}</strong>? Esta acción no se puede deshacer.
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
                onClick={eliminarAnimalConfirm}
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