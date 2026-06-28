// src/components/ModalCompletarDatos.jsx
import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';
import { User } from 'lucide-react';

export default function ModalCompletarDatos({ isOpen, onClose, userId, onDatosCompletados }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Estado del formulario ──
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefonoAlternativo: '',
    direccionCalle: '',
    direccionNumero: '',
    direccionInterior: '',
    direccionEstado: '',
    direccionMunicipio: '',
    direccionLocalidad: '',
    direccionSector: '',
    direccionCp: '',
    direccionReferencias: '',
    diaPago: 'lunes',
  });

  // ── Estado para la foto ──
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoActual, setFotoActual] = useState(null);

  // ── Cargar datos existentes del usuario y cliente ──
  useEffect(() => {
    if (isOpen && userId) {
      cargarDatosExistentes();
    }
  }, [isOpen, userId]);

  const cargarDatosExistentes = async () => {
    try {
      // Obtener datos del usuario
      const user = await pb.collection('users').getOne(userId);
      setFormData(prev => ({
        ...prev,
        nombre: user.nombre || '',
        email: user.email || '',
      }));
      if (user.foto) {
        const fotoUrl = pb.files.getURL(user, user.foto);
        setFotoActual(fotoUrl);
      }

      // Obtener datos del cliente
      try {
        const client = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
        setFormData(prev => ({
          ...prev,
          telefonoAlternativo: client.telefonoAlternativo || '',
          direccionCalle: client.direccionCalle || '',
          direccionNumero: client.direccionNumero || '',
          direccionInterior: client.direccionInterior || '',
          direccionEstado: client.direccionEstado || '',
          direccionMunicipio: client.direccionMunicipio || '',
          direccionLocalidad: client.direccionLocalidad || '',
          direccionSector: client.direccionSector || '',
          direccionCp: client.direccionCp || '',
          direccionReferencias: client.direccionReferencias || '',
          diaPago: client.diaPago || 'lunes',
        }));
      } catch (e) {
        // No tiene datos en clients, usamos valores por defecto
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // ── Manejar cambio de foto ──
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('La foto no debe exceder los 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ── Envío del formulario ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validaciones (sin cambios)
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      setLoading(false);
      return;
    }
    if (!formData.direccionCalle.trim()) {
      setError('La calle es requerida');
      setLoading(false);
      return;
    }
    if (!formData.direccionEstado.trim()) {
      setError('El estado es requerido');
      setLoading(false);
      return;
    }
    if (!formData.direccionMunicipio.trim()) {
      setError('El municipio es requerido');
      setLoading(false);
      return;
    }
    if (!formData.direccionLocalidad.trim()) {
      setError('La localidad/pueblo es requerida');
      setLoading(false);
      return;
    }
    if (!formData.direccionSector.trim()) {
      setError('El sector/colonia es requerido');
      setLoading(false);
      return;
    }
    if (!formData.direccionCp.trim()) {
      setError('El código postal es requerido');
      setLoading(false);
      return;
    }

    try {
      // 1. Actualizar usuario
      const userUpdateData = {
        nombre: formData.nombre,
        email: formData.email,
      };

      if (fotoFile) {
        const fd = new FormData();
        fd.append('foto', fotoFile);
        await pb.collection('users').update(userId, fd);
        await pb.collection('users').update(userId, userUpdateData);
      } else {
        await pb.collection('users').update(userId, userUpdateData);
      }

      // ✅ ACTUALIZAR AUTHSTORE CON LOS DATOS NUEVOS
      const updatedUser = await pb.collection('users').getOne(userId);
      pb.authStore.save(pb.authStore.token, updatedUser);

      // 2. Actualizar/crear clients
      let clientData = null;
      try {
        clientData = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
      } catch (e) {
        // No existe, se creará
      }

      const clientUpdateData = {
        telefonoAlternativo: formData.telefonoAlternativo,
        direccionCalle: formData.direccionCalle,
        direccionNumero: formData.direccionNumero,
        direccionInterior: formData.direccionInterior,
        direccionEstado: formData.direccionEstado,
        direccionMunicipio: formData.direccionMunicipio,
        direccionLocalidad: formData.direccionLocalidad,
        direccionSector: formData.direccionSector,
        direccionCp: formData.direccionCp,
        direccionReferencias: formData.direccionReferencias,
        diaPago: formData.diaPago,
        datosCompletos: true,
      };

      if (clientData) {
        await pb.collection('clients').update(clientData.id, clientUpdateData);
      } else {
        await pb.collection('clients').create({
          userId: userId,
          ...clientUpdateData,
          nivel: 0,
          productosComprados: 0,
          productosPagados: 0,
          productosEnCurso: 0,
          deudaActual: 0,
          limiteDeuda: 5000,
          estadoKyc: 'pendiente',
          trustScore: 0,
          totalGastado: 0,
          fechaUltimaCompra: null,
          aceptaTerminos: false,
          documentosCompletos: false,
        });
      }

      setSuccess(true);

      setTimeout(() => {
        localStorage.removeItem('primerIngreso');
        localStorage.removeItem('userIdCompletarDatos');
        if (onDatosCompletados) {
          onDatosCompletados();
        }
        onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Error al guardar datos:', err);
      setError(err.message || 'Error al guardar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('primerIngreso');
    localStorage.removeItem('userIdCompletarDatos');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              ¡Bienvenido a MarketDesliz!
            </h2>
            <p className="text-sm text-gray-500 mt-1">Completa tus datos para una mejor experiencia</p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-800">¡Datos guardados correctamente!</p>
                  <p className="text-sm text-green-600">Redirigiendo a tu perfil...</p>
                </div>
              </div>
            </div>
          )}

          {error && !success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">❌</span>
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Banner motivacional */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              💡 <strong>¿Por qué necesitamos estos datos?</strong> Tu información nos ayuda a:
            </p>
            <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4">
              <li>✓ Coordinar entregas de productos</li>
              <li>✓ Asignar un cobrador en tu zona</li>
              <li>✓ Ofrecerte promociones locales</li>
            </ul>
          </div>

          {/* ── Foto de perfil ── */}
          <div className="border-b border-gray-100 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto de perfil</label>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : fotoActual ? (
                  <img src={fotoActual} alt="Foto actual" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#6C3BFF]/8 file:text-[#6C3BFF] hover:file:bg-[#6C3BFF]/15 cursor-pointer"
                />
                <p className="text-[10px] text-gray-400 mt-1">JPG, PNG — máx. 2MB</p>
              </div>
            </div>
          </div>

          {/* ── Campos del formulario ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dirección</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['Calle *', 'direccionCalle', 'Av. Independencia'],
                ['Número exterior *', 'direccionNumero', '123'],
                ['Número interior', 'direccionInterior', 'B'],
                ['Estado *', 'direccionEstado', 'Veracruz'],
                ['Municipio *', 'direccionMunicipio', 'Perote'],
                ['Localidad/Pueblo *', 'direccionLocalidad', 'Azteca'],
                ['Sector / Colonia *', 'direccionSector', 'Centro'],
                ['Código Postal', 'direccionCp', '91270'],
              ].map(([label, field, placeholder]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                    placeholder={placeholder}
                    required={label.includes('*')}
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencias de ubicación
                </label>
                <textarea
                  value={formData.direccionReferencias}
                  onChange={(e) => setFormData({ ...formData, direccionReferencias: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition resize-none"
                  placeholder="Casa azul, junto a la tienda..."
                />
              </div>
            </div>
          </div>

          {/* Otros campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono alternativo
              </label>
              <input
                type="tel"
                value={formData.telefonoAlternativo}
                onChange={(e) => setFormData({ ...formData, telefonoAlternativo: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="55 1234 5678"
              />
              <p className="text-xs text-gray-400 mt-1">Opcional, para contacto de respaldo</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Día de pago preferido
              </label>
              <select
                value={formData.diaPago}
                onChange={(e) => setFormData({ ...formData, diaPago: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">El día que prefieres hacer tus pagos</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Omitir por ahora
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </>
              ) : success ? (
                '¡Guardado! ✅'
              ) : (
                'Guardar mis datos'
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 pt-2">
            Tus datos están seguros. No compartiremos tu información con terceros sin tu consentimiento.
          </p>
        </form>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal { animation: modalFadeIn 0.2s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}