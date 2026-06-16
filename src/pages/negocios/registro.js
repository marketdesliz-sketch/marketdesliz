// src/pages/negocios/registro.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function RegistroNegocioPage() {
  const router = useRouter();
  const [step, setStep] = useState('codigo'); // codigo, datos, completado
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codigoValido, setCodigoValido] = useState(null);
  const [negocioData, setNegocioData] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    ubicacion: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Verificar usuario autenticado
  useEffect(() => {
    const checkUser = () => {
      const currentUser = pb.authStore.model;
      setUser(currentUser);
      if (!currentUser) {
        router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
      }
    };
    checkUser();
    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [router]);

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

  // Verificar código de invitación
  const verificarCodigo = async () => {
    if (!codigo.trim()) {
      setError('Ingresa el código de invitación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buscar si el código existe en la colección de invitaciones
      const invitacion = await pb.collection('invitaciones_negocios').getFirstListItem(
        `codigo = "${codigo.toUpperCase()}" && usado = false`
      );

      setCodigoValido(invitacion);
      setStep('datos');
      
    } catch (err) {
      console.error('Error:', err);
      setError('Código de invitación inválido o ya fue utilizado');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNegocioData({ ...negocioData, [name]: value });
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

  const guardarNegocio = async () => {
    if (!negocioData.nombre || !negocioData.categoria || !negocioData.direccion) {
      setError('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      
      // Campos de texto
      Object.keys(negocioData).forEach(key => {
        if (negocioData[key]) formData.append(key, negocioData[key]);
      });
      
      formData.append('activo', true);
      formData.append('orden', 0);
      formData.append('visitas', 0);
      // ✅ ESTADO DE ACTIVACIÓN - pendiente hasta primera compra
      formData.append('estadoActivacion', 'pendiente_activacion');
      
      // ✅ AGREGAR usuarioId del dueño del negocio
      if (user) {
        formData.append('usuarioId', user.id);
        console.log('✅ Asignando negocio al usuario:', user.id);
      }
      
      // Logo
      if (logoFile) formData.append('logo', logoFile);
      
      // Imágenes adicionales
      imagenesFiles.forEach(file => formData.append('imagenes', file));

      // Crear negocio
      const nuevoNegocio = await pb.collection('negocios').create(formData);
      console.log('✅ Negocio creado:', nuevoNegocio.id);

      // Marcar código como usado
      await pb.collection('invitaciones_negocios').update(codigoValido.id, {
        usado: true,
        negocioId: nuevoNegocio.id,
        negocioNombre: negocioData.nombre,
        usuarioId: user.id,
        fechaRegistro: new Date().toISOString()
      });

      setStep('completado');
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al registrar el negocio. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // Si no hay usuario autenticado, mostrar mensaje de carga
  if (!user && step !== 'completado') {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
          <p className="ml-3 text-gray-500">Verificando autenticación...</p>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Registrar mi negocio | MarketDesliz</title>
        <meta name="description" content="Registra tu negocio como aliado de MarketDesliz y llega a más clientes en tu comunidad." />
      </Head>

      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 pt-24">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            
            {step === 'codigo' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
                    <span className="text-4xl">🔑</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Registra tu negocio</h1>
                  <p className="text-gray-500 mt-2">
                    Ingresa el código de invitación que te proporcionó MarketDesliz
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de invitación
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: MD-ABC123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-center uppercase text-lg tracking-wider"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El código fue enviado cuando aceptaste colocar la lona de MarketDesliz
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={verificarCodigo}
                  disabled={loading}
                  className="w-full bg-[#6C3BFF] text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Validar código'}
                </button>

                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>¿No tienes código? </p>
                  <a href="https://wa.me/522821414939?text=Hola,%20quiero%20ser%20negocio%20aliado%20de%20MarketDesliz" target="_blank" rel="noopener noreferrer" className="text-[#6C3BFF] hover:underline">
                    Contáctanos para ser aliado →
                  </a>
                </div>
              </>
            )}

            {step === 'datos' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                    <span className="text-4xl">✅</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Completa tu perfil</h1>
                  <p className="text-gray-500 mt-2">
                    Cuéntanos más sobre tu negocio
                  </p>
                  {user && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-3 py-1 rounded-full">
                      Registrando como: {user.nombre || user.email}
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del negocio *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={negocioData.nombre}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: Ferretería El Martillo"
                      required
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      name="categoria"
                      value={negocioData.categoria}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={negocioData.direccion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                      placeholder="Calle, número, colonia, ciudad"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Esta dirección aparecerá en Google Maps</p>
                  </div>

                  {/* Teléfono y WhatsApp */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={negocioData.telefono}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="55 1234 5678"
                      />
                      <p className="text-xs text-gray-500 mt-1">Los clientes podrán llamarte</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={negocioData.whatsapp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="521234567890"
                      />
                      <p className="text-xs text-gray-500 mt-1">Formato: 521234567890</p>
                    </div>
                  </div>

                  {/* Horario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horario de atención
                    </label>
                    <input
                      type="text"
                      name="horario"
                      value={negocioData.horario}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Los clientes sabrán cuándo encontrarte</p>
                  </div>

                  {/* Ubicación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación (Google Maps)
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={negocioData.ubicacion}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Coordenadas o enlace de Google Maps"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ej: 19.4326077,-99.133208</p>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={negocioData.descripcion}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Breve descripción de tu negocio..."
                    />
                  </div>

                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo / Foto principal *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      required
                    />
                    {logoPreview && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Vista previa:</p>
                        <img src={logoPreview} alt="Logo" className="w-24 h-24 object-cover rounded-lg mt-1" />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Recomendado: 500x500px, formato JPG o PNG</p>
                  </div>

                  {/* Imágenes adicionales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fotos de tu local
                    </label>
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
                          <img key={idx} src={preview} alt={`Foto ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Puedes subir varias fotos de tu negocio</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('codigo')}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={guardarNegocio}
                      disabled={saving}
                      className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {saving ? 'Registrando...' : 'Registrar negocio'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 'completado' && (
              <>
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Registro completado!
                  </h1>
                  <p className="text-gray-500 mb-6">
                    Tu negocio ya está registrado en MarketDesliz. 
                    Aparecerás en la lista de negocios aliados.
                  </p>
                  <div className="bg-purple-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-purple-700">
                      📍 Tu negocio aparecerá en la categoría: <strong>{negocioData.categoria}</strong>
                    </p>
                    <p className="text-xs text-purple-600 mt-2">
                      Los clientes podrán encontrarte y contactarte directamente
                    </p>
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="text-xs text-purple-600 flex items-center gap-1">
                        <span>⚡</span> Tu negocio aparecerá en la lista <strong>después de tu primera compra</strong> en MarketDesliz
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="text-xs text-purple-600">
                        🔔 Recibirás notificaciones cuando los clientes interactúen con tu negocio
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/negocios"
                      className="bg-[#6C3BFF] text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                    >
                      Ver negocios aliados
                    </Link>
                    <Link
                      href="/negocios/notificaciones"
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                    >
                      🔔 Configurar notificaciones
                    </Link>
                    <a
                      href={`https://wa.me/522821414939?text=Hola,%20ya%20registr%C3%A9%20mi%20negocio%20${encodeURIComponent(negocioData.nombre)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition"
                    >
                      📱 Contactar a MarketDesliz
                    </a>
                  </div>
                </div>
              </>
            )}
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