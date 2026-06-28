// src/pages/admin/negocios.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Star,
  MapPin,
  Globe,
  Mail,
  Clock,
  Phone,
  MessageCircle
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getNegocios,
  getCategoriasConConteo,
  deleteNegocio,
  updateNegocio,
  createNegocio as createNegocioService,
  getCategoriasNegocios,
  getEstados,
  getMunicipios,
  getLocalidades,
  getSectores,
  verificarNegocio as serviceVerificarNegocio,
  toggleDestacado,
  getOrCreateCategoriaNegocio // ← NUEVA IMPORTACIÓN
} from '../../lib/negociosService';

export default function AdminNegociosPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const { page = 1, search = '', categoria = 'todos', sort = 'orden, nombre' } = router.query;
  const currentPage = parseInt(page) || 1;

  // ─── Estados de paginación ──────────────────────────────────────────────
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ─── Filtros (sincronizados con URL) ──────────────────────────────────
  const [filtroCategoria, setFiltroCategoria] = useState(categoria || 'todos');
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [sortBy, setSortBy] = useState(sort || 'orden, nombre');

  // ─── Datos ──────────────────────────────────────────────────────────────
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [editingNegocio, setEditingNegocio] = useState(null);
  const [formData, setFormData] = useState({
    // Campos básicos (legacy)
    nombre: '',
    categoria: '',
    categoriaOtra: '', // ← NUEVO CAMPO
    descripcion: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    ubicacion: '',
    orden: 0,
    activo: true,
    // Nuevos campos geográficos
    estadoId: '',
    municipioId: '',
    localidadId: '',
    sectorId: '',
    codigoPostal: '',
    latitud: '',
    longitud: '',
    // Contacto y web
    email: '',
    sitioWeb: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    // Horario y servicios
    horarioJSON: '{}',
    servicios: '',
    atencionWhatsapp: true,
    citasPrevias: false,
    domicilio: false,
    // Categoría de negocio (relacional)
    categoriaNegocioId: '',
    // Configuración avanzada
    destacado: false,
    estadoActivacion: 'pendiente_activacion',
    motivoRechazo: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Estados para códigos de invitación
  const [showCodigosModal, setShowCodigosModal] = useState(false);
  const [codigosGenerados, setCodigosGenerados] = useState([]);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState('');

  // Estados para métricas
  const [metricas, setMetricas] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    conLogo: 0,
    verificados: 0,
    destacados: 0,
    categorias: {}
  });

  // Listas para selects geográficos
  const [estadosList, setEstadosList] = useState([]);
  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);
  const [sectoresList, setSectoresList] = useState([]);
  const [categoriasNegociosList, setCategoriasNegociosList] = useState([]);

  // Categorías disponibles (legacy)
  const categorias = [
    'Abarrotes', 'Accesorios (bisutería, celulares, etc.)', 'Agencia de viajes',
    'Antojitos / comida corrida', 'Barbería', 'Boutique (ropa)', 'Cafetería',
    'Carnicería', 'Cerrajería', 'Ciber (internet)', 'Consultorio médico',
    'Dulcería', 'Estética / salón de belleza', 'Farmacia', 'Ferretería',
    'Florería', 'Frutería / verdulería', 'Heladería / paletería', 'Imprenta',
    'Joyería', 'Lavandería / tintorería', 'Lonchería', 'Papelería',
    'Panadería', 'Pastelería', 'Peluquería', 'Pescadería', 'Pollería',
    'Refaccionaria (auto partes)', 'Restaurante', 'Taquería', 'Taller mecánico',
    'Taller de costura', 'Tienda de ropa', 'Tienda de electrónicos',
    'Tortillería', 'Veterinaria', 'Zapatería'
  ];

  // ─── Verificar autenticación ──────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      if (!pb.authStore.isValid) {
        router.push('/admin/login');
        return;
      }
      const user = pb.authStore.model;
      if (user?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      cargarNegocios();
      cargarCodigos();
      cargarDatosIniciales();
    };
    checkAuth();
  }, []);

  // ─── Efecto para filtros/paginación ──────────────────────────────────
  useEffect(() => {
    cargarNegocios();
  }, [currentPage, filtroCategoria, searchTerm, sortBy]);

  // ─── Cargar listas geográficas y categorías (solo una vez) ──────────
  const cargarDatosIniciales = async () => {
    try {
      const [categoriasNeg, estados] = await Promise.all([
        getCategoriasNegocios(),
        getEstados()
      ]);
      setCategoriasNegociosList(categoriasNeg);
      setEstadosList(estados);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  };

  // ─── Cargar negocios ──────────────────────────────────────────────────
  const cargarNegocios = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError('');

      const result = await getNegocios({
        page: currentPage,
        perPage: 10,
        search: searchTerm,
        categoria: filtroCategoria,
        sort: sortBy,
      });

      setNegocios(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
      calcularMetricas(result.items);

    } catch (error) {
      console.error('Error cargando negocios:', error);
      setError('No se pudieron cargar los negocios. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─── Cargar códigos de invitación ─────────────────────────────────────
  const cargarCodigos = async () => {
    try {
      const codigos = await pb.collection('invitaciones_negocios').getFullList({
        sort: '-created'
      });
      setCodigosGenerados(codigos);
    } catch (error) {
      console.error('Error cargando códigos:', error);
    }
  };

  // ─── Actualizar URL con filtros ──────────────────────────────────────
  const actualizarURL = (params) => {
    const query = {
      page: currentPage > 1 ? currentPage : undefined,
      search: searchTerm || undefined,
      categoria: filtroCategoria !== 'todos' ? filtroCategoria : undefined,
      sort: sortBy !== 'orden, nombre' ? sortBy : undefined,
      ...params
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/admin/negocios', query }, undefined, { shallow: true });
  };

  // ─── Manejadores de filtros ──────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = new FormData(e.target).get('search') || '';
    setSearchTerm(term);
    actualizarURL({ search: term, page: 1 });
  };

  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    setFiltroCategoria(value);
    actualizarURL({ categoria: value !== 'todos' ? value : undefined, page: 1 });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    actualizarURL({ sort: value !== 'orden, nombre' ? value : undefined, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    actualizarURL({ page: newPage });
  };

  // ─── Calcular métricas ────────────────────────────────────────────────
  const calcularMetricas = (negociosList = negocios) => {
    const total = negociosList.length;
    const activos = negociosList.filter(n => n.activo !== false).length;
    const inactivos = total - activos;
    const conLogo = negociosList.filter(n => n.logo).length;
    const verificados = negociosList.filter(n => n.verificado).length;
    const destacados = negociosList.filter(n => n.destacado).length;

    const categoriasCount = {};
    negociosList.forEach(n => {
      if (n.categoria) {
        categoriasCount[n.categoria] = (categoriasCount[n.categoria] || 0) + 1;
      }
    });

    setMetricas({ total, activos, inactivos, conLogo, verificados, destacados, categorias: categoriasCount });
  };

  // ─── Estadísticas del negocio (ahora reales) ─────────────────────────
  const verEstadisticas = async (negocio) => {
    setSelectedNegocio(negocio);
    setShowStatsModal(true);
    try {
      // Importamos dinámicamente para no cargar al inicio
      const { getEstadisticasNegocio } = await import('../../lib/negociosService');
      const stats = await getEstadisticasNegocio(negocio.id);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setEstadisticas({
        visitas: { total: negocio.visitas || 0 },
        contactos: { total: 0 },
        calificacionPromedio: 0
      });
    }
  };

  // ─── Generar código de invitación ─────────────────────────────────────
  const generarCodigoInvitacion = async () => {
    setGenerandoCodigo(true);
    try {
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let codigo = 'MD-';
      for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }

      const existente = codigosGenerados.find(c => c.codigo === codigo);
      if (existente) {
        return generarCodigoInvitacion();
      }

      await pb.collection('invitaciones_negocios').create({
        codigo: codigo,
        usado: false
      });

      setNuevoCodigo(codigo);
      await cargarCodigos();
      setTimeout(() => setNuevoCodigo(''), 5000);

    } catch (error) {
      console.error('Error generando código:', error);
      setError('Error al generar código');
    } finally {
      setGenerandoCodigo(false);
    }
  };

  // ─── Handlers del formulario ──────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagenesChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImagenesFiles(files);

      const previews = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === files.length) {
            setImagenesPreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // ─── Carga dinámica de municipios/localidades/sectores ──────────────
  useEffect(() => {
    if (formData.estadoId) {
      getMunicipios(formData.estadoId).then(setMunicipiosList).catch(() => setMunicipiosList([]));
    } else {
      setMunicipiosList([]);
    }
  }, [formData.estadoId]);

  useEffect(() => {
    if (formData.municipioId) {
      getLocalidades(formData.municipioId).then(setLocalidadesList).catch(() => setLocalidadesList([]));
    } else {
      setLocalidadesList([]);
    }
  }, [formData.municipioId]);

  useEffect(() => {
    if (formData.localidadId) {
      getSectores(formData.localidadId).then(setSectoresList).catch(() => setSectoresList([]));
    } else {
      setSectoresList([]);
    }
  }, [formData.localidadId]);

  const openCreateModal = () => {
    setEditingNegocio(null);
    setFormData({
      nombre: '',
      categoria: '',
      categoriaOtra: '', // ← NUEVO
      descripcion: '',
      direccion: '',
      telefono: '',
      whatsapp: '',
      horario: '',
      ubicacion: '',
      orden: negocios.length + 1,
      activo: true,
      estadoId: '',
      municipioId: '',
      localidadId: '',
      sectorId: '',
      codigoPostal: '',
      latitud: '',
      longitud: '',
      email: '',
      sitioWeb: '',
      facebook: '',
      instagram: '',
      tiktok: '',
      horarioJSON: '{}',
      servicios: '',
      atencionWhatsapp: true,
      citasPrevias: false,
      domicilio: false,
      categoriaNegocioId: '',
      destacado: false,
      estadoActivacion: 'pendiente_activacion',
      motivoRechazo: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setImagenesFiles([]);
    setImagenesPreviews([]);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (negocio) => {
    setEditingNegocio(negocio);
    setFormData({
      nombre: negocio.nombre || '',
      categoria: negocio.categoria || '',
      categoriaOtra: '', // ← NUEVO (se podría inicializar si se quisiera)
      descripcion: negocio.descripcion || '',
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      whatsapp: negocio.whatsapp || '',
      horario: negocio.horario || '',
      ubicacion: negocio.ubicacion || '',
      orden: negocio.orden || 0,
      activo: negocio.activo !== false,
      estadoId: negocio.estadoId || '',
      municipioId: negocio.municipioId || '',
      localidadId: negocio.localidadId || '',
      sectorId: negocio.sectorId || '',
      codigoPostal: negocio.codigoPostal || '',
      latitud: negocio.latitud || '',
      longitud: negocio.longitud || '',
      email: negocio.email || '',
      sitioWeb: negocio.sitioWeb || '',
      facebook: negocio.facebook || '',
      instagram: negocio.instagram || '',
      tiktok: negocio.tiktok || '',
      horarioJSON: negocio.horarioJSON || '{}',
      servicios: negocio.servicios || '',
      atencionWhatsapp: negocio.atencionWhatsapp !== false,
      citasPrevias: negocio.citasPrevias === true,
      domicilio: negocio.domicilio === true,
      categoriaNegocioId: negocio.categoriaNegocioId || '',
      destacado: negocio.destacado === true,
      estadoActivacion: negocio.estadoActivacion || 'pendiente_activacion',
      motivoRechazo: negocio.motivoRechazo || ''
    });
    setLogoFile(null);
    setLogoPreview(negocio.logo ? pb.files.getURL(negocio, negocio.logo) : null);
    setImagenesFiles([]);
    setImagenesPreviews([]);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  // ─── Guardar negocio (crear o editar) ────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();

      // ─── Procesar categoría "otro" antes de copiar el resto ─────────
      if (formData.categoria === 'otro' && formData.categoriaOtra.trim()) {
        const nuevaCat = formData.categoriaOtra.trim();
        formDataToSend.append('categoria', nuevaCat); // actualiza el campo legacy

        // Crear o encontrar la categoría de negocio automáticamente
        try {
          const catNegocioId = await getOrCreateCategoriaNegocio(nuevaCat);
          formDataToSend.append('categoriaNegocioId', catNegocioId);
        } catch (err) {
          console.warn('No se pudo crear/obtener la categoría de negocio:', err.message);
        }
      }

      // Copiar todos los campos del formData (excepto los que ya procesamos o los archivos)
      Object.keys(formData).forEach(key => {
        if (key === 'logo' || key === 'imagenes' || key === 'horarioJSON' || key === 'categoriaOtra') return;
        // No sobrescribir 'categoria' si ya la pusimos manualmente
        if (key === 'categoria' && formData.categoria === 'otro') return;
        formDataToSend.append(key, formData[key]);
      });

      // Horario como JSON
      if (formData.horarioJSON) {
        formDataToSend.append('horarioJSON', formData.horarioJSON);
      }

      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      if (imagenesFiles.length > 0) {
        imagenesFiles.forEach(file => {
          formDataToSend.append('imagenes', file);
        });
      }

      if (editingNegocio) {
        await updateNegocio(editingNegocio.id, formDataToSend);
        setSuccess('✅ Negocio actualizado correctamente');
      } else {
        await createNegocioService(formDataToSend, pb.authStore.model?.id);
        setSuccess('✅ Negocio creado correctamente');
      }

      setTimeout(() => {
        setShowModal(false);
        cargarNegocios();
      }, 1500);

    } catch (error) {
      console.error('Error guardando negocio:', error);
      setError(error.message || 'Error al guardar el negocio');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar negocio ──────────────────────────────────────────────────
  const handleDelete = async (negocio) => {
    if (!confirm(`¿Eliminar el negocio "${negocio.nombre}"?`)) return;

    try {
      await deleteNegocio(negocio.id);
      setSuccess('✅ Negocio eliminado correctamente');
      cargarNegocios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error eliminando negocio:', error);
      setError('Error al eliminar el negocio');
      setTimeout(() => setError(''), 3000);
    }
  };

  // ─── Activar/Desactivar negocio ──────────────────────────────────────
  const handleToggleActive = async (negocio) => {
    try {
      await updateNegocio(negocio.id, {
        activo: !negocio.activo
      });
      cargarNegocios();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  // ─── Verificar negocio ────────────────────────────────────────────────
  const handleVerificar = async (negocio) => {
    try {
      await serviceVerificarNegocio(negocio.id);
      cargarNegocios();
      setSuccess('✅ Negocio verificado');
    } catch (error) {
      setError(error.message);
    }
  };

  // ─── Destacar negocio ──────────────────────────────────────────────────
  const handleDestacar = async (negocio) => {
    try {
      await toggleDestacado(negocio.id, !negocio.destacado);
      cargarNegocios();
    } catch (error) {
      setError(error.message);
    }
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Gestión de Negocios Aliados | Admin MarketDesliz</title>
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header con métricas */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🏪 Negocios Aliados</h1>
                <p className="text-gray-500 mt-1">Gestiona los negocios que tienen lona de MarketDesliz</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => cargarNegocios(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#6C3BFF] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  onClick={() => setShowCodigosModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                >
                  <span>🔑</span> Códigos de invitación
                </button>
                <button
                  onClick={openCreateModal}
                  className="bg-[#6C3BFF] text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <span>➕</span> Nuevo negocio
                </button>
              </div>
            </div>

            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{metricas.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{metricas.activos}</div>
                <div className="text-sm text-gray-500">Activos</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{metricas.inactivos}</div>
                <div className="text-sm text-gray-500">Inactivos</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{metricas.conLogo}</div>
                <div className="text-sm text-gray-500">Con logo</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{metricas.verificados}</div>
                <div className="text-sm text-gray-500">Verificados</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{metricas.destacados}</div>
                <div className="text-sm text-gray-500">Destacados</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{Object.keys(metricas.categorias).length}</div>
                <div className="text-sm text-gray-500">Categorías</div>
              </div>
            </div>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Barra de búsqueda y filtros */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchTerm}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] text-sm"
                  placeholder="Buscar por nombre o descripción..."
                />
              </form>
              <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={filtroCategoria}
                  onChange={handleCategoriaChange}
                >
                  <option value="todos">Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <select
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="orden, nombre">Orden por defecto</option>
                  <option value="-created">Más recientes</option>
                  <option value="nombre">Por nombre</option>
                  <option value="-visitas">Más visitados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de negocios */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Orden</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Negocio</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Categoría</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Municipio</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Teléfono</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Estado</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Verif.</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Dest.</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Visitas</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {negocios.map((negocio) => (
                    <tr key={negocio.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-600">{negocio.orden || '-'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {negocio.logo ? (
                            <img
                              src={pb.files.getURL(negocio, negocio.logo)}
                              alt={negocio.nombre}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                              🏪
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{negocio.nombre}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">{negocio.direccion}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {negocio.categoria || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {negocio.expand?.municipioId?.nombre || '-'}
                      </td>
                      <td className="p-4 text-gray-600">{negocio.telefono || '-'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(negocio)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            negocio.activo !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {negocio.activo !== false ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleVerificar(negocio)} className="text-blue-600 hover:text-blue-800">
                          {negocio.verificado ? <CheckCircle size={16} className="text-green-500" /> : 'Verificar'}
                        </button>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDestacar(negocio)} className="text-yellow-600 hover:text-yellow-800">
                          {negocio.destacado ? <Star size={16} className="fill-yellow-400 text-yellow-400" /> : 'Destacar'}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => verEstadisticas(negocio)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver stats
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(negocio)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(negocio)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Mostrando {negocios.length} de {totalItems} negocios
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF]"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-500">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF]"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {negocios.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay negocios aliados</h3>
              <p className="text-gray-500 mb-6">Comienza agregando tu primer negocio aliado</p>
              <button
                onClick={openCreateModal}
                className="bg-[#6C3BFF] text-white px-6 py-2 rounded-lg font-medium"
              >
                Agregar negocio
              </button>
            </div>
          )}
        </div>
      </AdminLayout>

      {/* Modal de estadísticas */}
      {showStatsModal && selectedNegocio && estadisticas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">📊 Estadísticas</h3>
                <button onClick={() => setShowStatsModal(false)} className="text-white/80 hover:text-white text-2xl">×</button>
              </div>
              <p className="text-purple-100 text-sm mt-1">{selectedNegocio.nombre}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{estadisticas.visitas?.total || 0}</div>
                  <div className="text-xs text-gray-500">Visitas totales</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{estadisticas.contactos?.total || 0}</div>
                  <div className="text-xs text-gray-500">Contactos</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{estadisticas.comentarios?.total || 0}</div>
                  <div className="text-xs text-gray-500">Comentarios</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{estadisticas.calificacionPromedio || 0}</div>
                  <div className="text-xs text-gray-500">Calificación</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de códigos de invitación (sin cambios) */}
      {showCodigosModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">🔑 Códigos de invitación</h3>
              <button onClick={() => setShowCodigosModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6">
              <button
                onClick={generarCodigoInvitacion}
                disabled={generandoCodigo}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 mb-6"
              >
                {generandoCodigo ? 'Generando...' : '➕ Generar nuevo código'}
              </button>

              {nuevoCodigo && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-sm text-green-700 mb-2">¡Código generado!</p>
                  <code className="text-2xl font-mono font-bold text-green-800">{nuevoCodigo}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(nuevoCodigo)}
                    className="mt-2 text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full hover:bg-green-300"
                  >
                    📋 Copiar
                  </button>
                </div>
              )}

              <h4 className="font-medium text-gray-900 mb-3">Códigos existentes</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {codigosGenerados.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay códigos generados</p>
                ) : (
                  codigosGenerados.map((inv) => (
                    <div key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <code className="font-mono text-purple-600 font-medium">{inv.codigo}</code>
                      <span className={`text-xs px-2 py-1 rounded-full ${inv.usado ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {inv.usado ? 'Usado' : 'Disponible'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de creación/edición EXTENDIDO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingNegocio ? '✏️ Editar negocio' : '➕ Nuevo negocio aliado'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-8">
              {/* ── Sección 1: Información básica ─────────────────── */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Información básica</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" placeholder="Ej: Ferretería El Martillo" />
                </div>

                {/* ─── Categoría con opción "Otro" ────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="otro">Otro (especificar)</option>
                    </select>
                  </div>
                  {formData.categoria === 'otro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Otra categoría *</label>
                      <input
                        type="text"
                        name="categoriaOtra"
                        value={formData.categoriaOtra}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                        placeholder="Escribe el nombre de la categoría"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="3" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" placeholder="Breve descripción del negocio..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" placeholder="Calle, número, colonia, ciudad" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="55 1234 5678" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="521234567890" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="correo@negocio.com" />
                  </div>
                </div>
              </div>

              {/* ── Sección 2: Ubicación geográfica ─────────────────── */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Ubicación geográfica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select name="estadoId" value={formData.estadoId} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option value="">Seleccionar estado</option>
                      {estadosList.map(est => <option key={est.id} value={est.id}>{est.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                    <select name="municipioId" value={formData.municipioId} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option value="">Seleccionar municipio</option>
                      {municipiosList.map(mun => <option key={mun.id} value={mun.id}>{mun.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                    <select name="localidadId" value={formData.localidadId} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option value="">Seleccionar localidad</option>
                      {localidadesList.map(loc => <option key={loc.id} value={loc.id}>{loc.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sector/Colonia</label>
                    <select name="sectorId" value={formData.sectorId} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option value="">Seleccionar sector</option>
                      {sectoresList.map(sec => <option key={sec.id} value={sec.id}>{sec.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                    <input type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="91000" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                      <input type="number" step="any" name="latitud" value={formData.latitud} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="19.4326" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                      <input type="number" step="any" name="longitud" value={formData.longitud} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="-99.1332" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Sección 3: Redes sociales y web ─────────────────── */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Presencia en línea</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                    <input type="url" name="sitioWeb" value={formData.sitioWeb} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="https://www.minegocio.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                    <input type="text" name="facebook" value={formData.facebook} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="URL de Facebook" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input type="text" name="instagram" value={formData.instagram} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="URL de Instagram" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                    <input type="text" name="tiktok" value={formData.tiktok} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="URL de TikTok" />
                  </div>
                </div>
              </div>

              {/* ── Sección 4: Horario y servicios ──────────────────── */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Horario y servicios</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horario (texto libre)</label>
                  <input type="text" name="horario" value={formData.horario} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="atencionWhatsapp" checked={formData.atencionWhatsapp} onChange={handleInputChange} className="w-4 h-4" />
                    <span className="text-sm">Atención por WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="citasPrevias" checked={formData.citasPrevias} onChange={handleInputChange} className="w-4 h-4" />
                    <span className="text-sm">Requiere cita previa</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="domicilio" checked={formData.domicilio} onChange={handleInputChange} className="w-4 h-4" />
                    <span className="text-sm">Servicio a domicilio</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Otros servicios (separados por coma)</label>
                  <input type="text" name="servicios" value={formData.servicios} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="Estacionamiento, Wi-Fi, Pagos con tarjeta" />
                </div>
              </div>

              {/* ── Sección 5: Imágenes ────────────────────────────── */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Imágenes y logo</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo/Foto principal</label>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                  {logoPreview && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Vista previa:</p>
                      <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-cover rounded-lg mt-1" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes adicionales</label>
                  <input type="file" accept="image/*" multiple onChange={handleImagenesChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                  {imagenesPreviews.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {imagenesPreviews.map((preview, idx) => (
                        <img key={idx} src={preview} alt={`Preview ${idx}`} className="w-16 h-16 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Puedes seleccionar varias imágenes</p>
                </div>
              </div>

              {/* ── Sección 6: Configuración avanzada ──────────────── */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Configuración avanzada</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden de aparición</label>
                    <input type="number" name="orden" value={formData.orden} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="0 = primero" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de activación</label>
                    <select name="estadoActivacion" value={formData.estadoActivacion} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option value="pendiente_activacion">Pendiente de activación</option>
                      <option value="activo">Activo</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleInputChange} className="w-4 h-4 text-purple-600" />
                    <label htmlFor="activo" className="text-sm text-gray-700">Activo (visible en la página de servicios)</label>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" name="destacado" checked={formData.destacado} onChange={handleInputChange} className="w-4 h-4 text-yellow-600" />
                    <label className="text-sm text-gray-700">Destacado</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50">
                  {saving ? 'Guardando...' : editingNegocio ? 'Actualizar' : 'Crear negocio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #6C3BFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}