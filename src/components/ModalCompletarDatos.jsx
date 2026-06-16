// src/components/ModalCompletarDatos.jsx
import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';

export default function ModalCompletarDatos({ isOpen, onClose, userId, onDatosCompletados }) {
  const [formData, setFormData] = useState({
    direccionCalle: '',
    direccionNumero: '',
    direccionInterior: '',
    direccionColonia: '',
    direccionMunicipio: '',
    direccionCiudad: '',
    direccionEstado: '',
    direccionCp: '',
    direccionReferencias: '',
    telefonoAlternativo: '',
    diaPago: 'lunes'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Cargar datos existentes si ya hay algo guardado
  useEffect(() => {
    if (isOpen && userId) {
      cargarDatosExistentes();
    }
  }, [isOpen, userId]);

  const cargarDatosExistentes = async () => {
    try {
      const clientData = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
      if (clientData) {
        setFormData({
          direccionCalle: clientData.direccionCalle || '',
          direccionNumero: clientData.direccionNumero || '',
          direccionInterior: clientData.direccionInterior || '',
          direccionColonia: clientData.direccionColonia || '',
          direccionMunicipio: clientData.direccionMunicipio || '',
          direccionCiudad: clientData.direccionCiudad || '',
          direccionEstado: clientData.direccionEstado || '',
          direccionCp: clientData.direccionCp || '',
          direccionReferencias: clientData.direccionReferencias || '',
          telefonoAlternativo: clientData.telefonoAlternativo || '',
          diaPago: clientData.diaPago || 'lunes'
        });
        console.log('📝 Datos existentes cargados en el modal');
      }
    } catch (e) {
      console.log('No hay datos previos, formulario vacío');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Verificar que campos requeridos estén llenos (solo los más importantes)
      if (!formData.direccionCalle.trim()) {
        throw new Error('La calle es requerida');
      }
      if (!formData.direccionColonia.trim()) {
        throw new Error('La colonia es requerida');
      }
      if (!formData.direccionMunicipio.trim()) {
        throw new Error('El municipio es requerido');
      }
      if (!formData.direccionEstado.trim()) {
        throw new Error('El estado es requerido');
      }
      if (!formData.direccionCp.trim()) {
        throw new Error('El código postal es requerido');
      }

      // Obtener el registro del cliente
      const clientData = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
      
      // Actualizar con los datos del formulario
      await pb.collection('clients').update(clientData.id, {
        direccionCalle: formData.direccionCalle,
        direccionNumero: formData.direccionNumero,
        direccionInterior: formData.direccionInterior,
        direccionColonia: formData.direccionColonia,
        direccionMunicipio: formData.direccionMunicipio,
        direccionCiudad: formData.direccionCiudad,
        direccionEstado: formData.direccionEstado,
        direccionCp: formData.direccionCp,
        direccionReferencias: formData.direccionReferencias,
        telefonoAlternativo: formData.telefonoAlternativo,
        diaPago: formData.diaPago,
        datosCompletos: true,
        fechaCompletado: new Date().toISOString()
      });

      setSuccess(true);
      
      // Esperar un momento para mostrar el éxito antes de cerrar
      setTimeout(() => {
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
    // Limpiar flags incluso si omite
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mensaje de éxito */}
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

          {/* Mensaje de error */}
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

          {/* Banner de bienvenida */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-700">
              💡 <strong>¿Por qué necesitamos estos datos?</strong> Tu dirección nos ayuda a:
            </p>
            <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4">
              <li>✓ Coordinar entregas de productos</li>
              <li>✓ Asignar un cobrador en tu zona</li>
              <li>✓ Ofrecerte promociones locales</li>
            </ul>
          </div>

          {/* Campos del formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.direccionCalle}
                onChange={(e) => setFormData({...formData, direccionCalle: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: Av. Insurgentes"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número exterior
              </label>
              <input
                type="text"
                value={formData.direccionNumero}
                onChange={(e) => setFormData({...formData, direccionNumero: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número interior
              </label>
              <input
                type="text"
                value={formData.direccionInterior}
                onChange={(e) => setFormData({...formData, direccionInterior: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: 2B"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colonia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.direccionColonia}
                onChange={(e) => setFormData({...formData, direccionColonia: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: Roma Norte"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipio/Alcaldía <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.direccionMunicipio}
                onChange={(e) => setFormData({...formData, direccionMunicipio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: Cuauhtémoc"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.direccionCiudad}
                onChange={(e) => setFormData({...formData, direccionCiudad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: Ciudad de México"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.direccionEstado}
                onChange={(e) => setFormData({...formData, direccionEstado: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: CDMX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.direccionCp}
                onChange={(e) => setFormData({...formData, direccionCp: e.target.value.replace(/\D/g, '').slice(0, 5)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: 06700"
                maxLength="5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono alternativo
              </label>
              <input
                type="tel"
                value={formData.telefonoAlternativo}
                onChange={(e) => setFormData({...formData, telefonoAlternativo: e.target.value.replace(/\D/g, '').slice(0, 10)})}
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
                onChange={(e) => setFormData({...formData, diaPago: e.target.value})}
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencias de ubicación
              </label>
              <textarea
                value={formData.direccionReferencias}
                onChange={(e) => setFormData({...formData, direccionReferencias: e.target.value})}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                placeholder="Ej: Casa de color azul, cerca del Oxxo, entre calles..."
              />
              <p className="text-xs text-gray-400 mt-1">Ayuda a localizar tu domicilio más fácilmente</p>
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

          {/* Mensaje de privacidad */}
          <p className="text-center text-xs text-gray-400 pt-2">
            Tus datos están seguros. No compartiremos tu información con terceros sin tu consentimiento.
          </p>
        </form>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-modal {
          animation: modalFadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}