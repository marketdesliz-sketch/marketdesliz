// src/pages/negocios/editar.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import {
  getEstados,
  getMunicipios,
  getLocalidades,
  getSectores
} from '../../lib/negociosService';

export default function EditarNegocioPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [negocio, setNegocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Campos básicos + nuevos
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    ubicacion: '',
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
    servicios: '',
    atencionWhatsapp: true,
    citasPrevias: false,
    domicilio: false
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesAEliminar, setImagenesAEliminar] = useState([]);

  // Listas para selects geográficos
  const [estadosList, setEstadosList] = useState([]);
  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);
  const [sectoresList, setSectoresList] = useState([]);

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

  useEffect(() => {
    if (id) {
      cargarNegocio();
      cargarDatosGeograficos();
    } else {
      verificarNegocioUsuario();
    }
  }, [id]);

  const cargarDatosGeograficos = async () => {
    try {
      const estados = await getEstados();
      setEstadosList(estados);
      // Si el negocio ya tiene estadoId, cargar sus municipios
      // (se hará en el useEffect que vigila estadoId)
    } catch (err) {
      console.error('Error cargando datos geográficos:', err);
    }
  };

  // Carga dinámica de municipios/localidades/sectores
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

  const verificarNegocioUsuario = async () => {
    try {
      const user = pb.authStore.model;
      if (!user) {
        router.push('/solicitar?redirect=/negocios/editar');
        return;
      }
      
      const negocios = await pb.collection('negocios').getFullList({
        filter: `usuarioId = "${user.id}"`
      });
      
      if (negocios.length > 0) {
        router.push(`/negocios/editar?id=${negocios[0].id}`);
      } else {
        setError('No tienes un negocio registrado. Contacta a MarketDesliz para obtener tu código de invitación.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al verificar tu negocio');
      setLoading(false);
    }
  };

  const cargarNegocio = async () => {
    try {
      setLoading(true);
      const negocioData = await pb.collection('negocios').getOne(id);
      setNegocio(negocioData);
      
      setFormData({
        nombre: negocioData.nombre || '',
        categoria: negocioData.categoria || '',
        descripcion: negocioData.descripcion || '',
        direccion: negocioData.direccion || '',
        telefono: negocioData.telefono || '',
        whatsapp: negocioData.whatsapp || '',
        horario: negocioData.horario || '',
        ubicacion: negocioData.ubicacion || '',
        estadoId: negocioData.estadoId || '',
        municipioId: negocioData.municipioId || '',
        localidadId: negocioData.localidadId || '',
        sectorId: negocioData.sectorId || '',
        codigoPostal: negocioData.codigoPostal || '',
        latitud: negocioData.latitud || '',
        longitud: negocioData.longitud || '',
        email: negocioData.email || '',
        sitioWeb: negocioData.sitioWeb || '',
        facebook: negocioData.facebook || '',
        instagram: negocioData.instagram || '',
        tiktok: negocioData.tiktok || '',
        servicios: negocioData.servicios || '',
        atencionWhatsapp: negocioData.atencionWhatsapp !== false,
        citasPrevias: negocioData.citasPrevias === true,
        domicilio: negocioData.domicilio === true
      });
      
      if (negocioData.logo) {
        setLogoPreview(pb.files.getURL(negocioData, negocioData.logo));
      }
      
      if (negocioData.imagenes) {
        const imagenes = Array.isArray(negocioData.imagenes) 
          ? negocioData.imagenes 
          : [negocioData.imagenes];
        setImagenesExistentes(imagenes.filter(img => img));
      }
      
    } catch (error) {
      console.error('Error cargando negocio:', error);
      setError('Error al cargar la información del negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
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
          if (previews.length === files.length) setImagenesPreviews(previews);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const eliminarImagenExistente = (imagen) => {
    setImagenesAEliminar([...imagenesAEliminar, imagen]);
    setImagenesExistentes(imagenesExistentes.filter(img => img !== imagen));
  };

  const guardarCambios = async () => {
    if (!formData.nombre || !formData.categoria || !formData.direccion) {
      setError('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'logo' && key !== 'imagenes') {
          // Convertir valores booleanos a string para FormData
          const value = formData[key];
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value ? 'true' : 'false');
          } else if (value !== null && value !== undefined && value !== '') {
            formDataToSend.append(key, value);
          }
        }
      });
      
      if (logoFile) formDataToSend.append('logo', logoFile);
      
      imagenesFiles.forEach(file => formDataToSend.append('imagenes', file));
      
      if (imagenesAEliminar.length > 0) {
        formDataToSend.append('imagenesEliminar', JSON.stringify(imagenesAEliminar));
      }

      await pb.collection('negocios').update(id, formDataToSend);
      setSuccess('✅ Perfil actualizado correctamente');
      
      setTimeout(() => {
        cargarNegocio();
        setImagenesFiles([]);
        setImagenesPreviews([]);
        setImagenesAEliminar([]);
      }, 1000);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Editar mi negocio | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 pt-24">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏪</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Editar mi negocio</h1>
                  <p className="text-purple-100 text-sm">Actualiza la información de tu negocio</p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-8">
                {/* ── Información básica ─────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Información básica</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: Ferretería El Martillo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Selecciona una categoría</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                      placeholder="Calle, número, colonia, ciudad"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="55 1234 5678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="521234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horario de atención</label>
                    <input
                      type="text"
                      name="horario"
                      value={formData.horario}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Breve descripción de tu negocio..."
                    />
                  </div>
                </div>

                {/* ── Ubicación geográfica ─────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Ubicación (opcional)</h3>
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

                {/* ── Presencia en línea ─────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Presencia en línea</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="correo@negocio.com" />
                  </div>
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

                {/* ── Horario y servicios ─────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Horario y servicios</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horario (texto libre)</label>
                    <input
                      type="text"
                      name="horario"
                      value={formData.horario}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm"
                    />
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
                    <input
                      type="text"
                      name="servicios"
                      value={formData.servicios}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Estacionamiento, Wi-Fi, Pagos con tarjeta"
                    />
                  </div>
                </div>

                {/* ── Imágenes ────────────────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Imágenes</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo / Foto principal</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                    {logoPreview && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Logo actual:</p>
                        <img src={logoPreview} alt="Logo" className="w-24 h-24 object-cover rounded-lg mt-1" />
                      </div>
                    )}
                  </div>

                  {imagenesExistentes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fotos de tu local</label>
                      <div className="flex gap-2 flex-wrap">
                        {imagenesExistentes.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={pb.files.getURL(negocio, img)}
                              alt={`Foto ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => eliminarImagenExistente(img)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agregar nuevas fotos</label>
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
                          <img key={idx} src={preview} alt={`Nueva ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Puedes subir varias fotos de tu negocio</p>
                  </div>
                </div>

                {/* ─── Botones ────────────────────────────── */}
                <div className="flex gap-3 pt-4">
                  <Link
                    href={`/negocios/${id}`}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-center hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </Link>
                  <button
                    onClick={guardarCambios}
                    disabled={saving}
                    className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>

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