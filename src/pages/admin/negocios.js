// src/pages/admin/negocios.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import pb from '../../lib/pocketbase';
import AdminLayout from '../../layouts/AdminLayout';

export default function AdminNegociosPage() {
  const router = useRouter();
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [editingNegocio, setEditingNegocio] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    ubicacion: '',
    orden: 0,
    activo: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
    categorias: {}
  });

  // Categorías disponibles
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

  // Verificar autenticación y rol de admin
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
      calcularMetricas();
    };
    checkAuth();
  }, [router]);

  const cargarNegocios = async () => {
    try {
      setLoading(true);
      const negociosData = await pb.collection('negocios').getFullList({
        sort: 'orden, nombre',
      });
      setNegocios(negociosData);
      calcularMetricas(negociosData);
    } catch (error) {
      console.error('Error cargando negocios:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const calcularMetricas = (negociosList = negocios) => {
    const total = negociosList.length;
    const activos = negociosList.filter(n => n.activo !== false).length;
    const inactivos = total - activos;
    const conLogo = negociosList.filter(n => n.logo).length;

    const categoriasCount = {};
    negociosList.forEach(n => {
      if (n.categoria) {
        categoriasCount[n.categoria] = (categoriasCount[n.categoria] || 0) + 1;
      }
    });

    setMetricas({ total, activos, inactivos, conLogo, categorias: categoriasCount });
  };

  const verEstadisticas = async (negocio) => {
    setSelectedNegocio(negocio);
    setShowStatsModal(true);

    try {
      // Aquí puedes agregar lógica para obtener estadísticas reales
      // Por ahora son datos simulados
      setEstadisticas({
        visitas: Math.floor(Math.random() * 1000),
        contactos: Math.floor(Math.random() * 100),
        whatsappClicks: Math.floor(Math.random() * 50),
        llamadas: Math.floor(Math.random() * 30),
        ultimaVisita: new Date().toLocaleDateString(),
        registrado: new Date(negocio.created).toLocaleDateString()
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const generarCodigoInvitacion = async () => {
    setGenerandoCodigo(true);
    try {
      // Generar código único: MD- + 6 caracteres aleatorios
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let codigo = 'MD-';
      for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }

      // Verificar que no exista
      const existente = codigosGenerados.find(c => c.codigo === codigo);
      if (existente) {
        return generarCodigoInvitacion(); // Regenerar si ya existe
      }

      const nuevaInvitacion = await pb.collection('invitaciones_negocios').create({
        codigo: codigo,
        usado: false
        // ✅ created es automático
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

  const openCreateModal = () => {
    setEditingNegocio(null);
    setFormData({
      nombre: '',
      categoria: '',
      descripcion: '',
      direccion: '',
      telefono: '',
      whatsapp: '',
      horario: '',
      ubicacion: '',
      orden: negocios.length + 1,
      activo: true
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
      descripcion: negocio.descripcion || '',
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      whatsapp: negocio.whatsapp || '',
      horario: negocio.horario || '',
      ubicacion: negocio.ubicacion || '',
      orden: negocio.orden || 0,
      activo: negocio.activo !== false
    });
    setLogoFile(null);
    setLogoPreview(negocio.logo ? pb.files.getURL(negocio, negocio.logo) : null);
    setImagenesFiles([]);
    setImagenesPreviews([]);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();

      // Agregar campos de texto
      Object.keys(formData).forEach(key => {
        if (key !== 'logo' && key !== 'imagenes') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Agregar logo si hay uno nuevo
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      // Agregar imágenes adicionales
      if (imagenesFiles.length > 0) {
        imagenesFiles.forEach(file => {
          formDataToSend.append('imagenes', file);
        });
      }

      if (editingNegocio) {
        await pb.collection('negocios').update(editingNegocio.id, formDataToSend);
        setSuccess('✅ Negocio actualizado correctamente');
      } else {
        await pb.collection('negocios').create(formDataToSend);
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

  const handleDelete = async (negocio) => {
    if (!confirm(`¿Eliminar el negocio "${negocio.nombre}"?`)) return;

    try {
      await pb.collection('negocios').delete(negocio.id);
      setSuccess('✅ Negocio eliminado correctamente');
      cargarNegocios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error eliminando negocio:', error);
      setError('Error al eliminar el negocio');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleToggleActive = async (negocio) => {
    try {
      await pb.collection('negocios').update(negocio.id, {
        activo: !negocio.activo
      });
      cargarNegocios();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🏪 Negocios Aliados</h1>
                <p className="text-gray-500 mt-1">Gestiona los negocios que tienen lona de MarketDesliz</p>
              </div>
              <div className="flex gap-3">
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{metricas.total}</div>
                <div className="text-sm text-gray-500">Total negocios</div>
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
                <div className="text-2xl font-bold text-blue-600">{Object.keys(metricas.categorias).length}</div>
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

          {/* Tabla de negocios */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Orden</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Negocio</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Categoría</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Teléfono</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Estado</th>
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
                      <td className="p-4 text-gray-600">{formatPhone(negocio.telefono)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(negocio)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${negocio.activo !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                          {negocio.activo !== false ? 'Activo' : 'Inactivo'}
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
      {showStatsModal && selectedNegocio && (
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
                  <div className="text-2xl font-bold text-purple-600">{estadisticas?.visitas || 0}</div>
                  <div className="text-xs text-gray-500">Visitas al perfil</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{estadisticas?.contactos || 0}</div>
                  <div className="text-xs text-gray-500">Contactos totales</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{estadisticas?.whatsappClicks || 0}</div>
                  <div className="text-xs text-gray-500">Clics WhatsApp</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{estadisticas?.llamadas || 0}</div>
                  <div className="text-xs text-gray-500">Llamadas</div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registrado:</span>
                  <span className="font-medium">{estadisticas?.registrado || '-'}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Última visita:</span>
                  <span className="font-medium">{estadisticas?.ultimaVisita || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de códigos de invitación */}
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

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingNegocio ? '✏️ Editar negocio' : '➕ Nuevo negocio aliado'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Ferretería El Martillo"
                />
              </div>

              {/* Categoría */}
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
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="Breve descripción del negocio..."
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="Calle, número, colonia, ciudad"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="55 1234 5678"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    placeholder="521234567890"
                  />
                </div>
              </div>

              {/* Horario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horario de atención</label>
                <input
                  type="text"
                  name="horario"
                  value={formData.horario}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm"
                />
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación (Google Maps)</label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="Coordenadas o enlace de Google Maps"
                />
              </div>

              {/* Orden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden de aparición</label>
                <input
                  type="number"
                  name="orden"
                  value={formData.orden}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="0 = primero"
                />
                <p className="text-xs text-gray-500 mt-1">Números más bajos aparecen primero</p>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo/Foto principal</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Vista previa:</p>
                    <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-cover rounded-lg mt-1" />
                  </div>
                )}
              </div>

              {/* Imágenes adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes adicionales</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagenesChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
                {imagenesPreviews.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {imagenesPreviews.map((preview, idx) => (
                      <img key={idx} src={preview} alt={`Preview ${idx}`} className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Puedes seleccionar varias imágenes</p>
              </div>

              {/* Estado activo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="activo"
                  id="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">Activo (visible en la página de servicios)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
                >
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