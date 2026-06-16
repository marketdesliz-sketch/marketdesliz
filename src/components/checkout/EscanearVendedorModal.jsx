// src/components/checkout/EscanearVendedorModal.jsx
import { useState } from 'react';
import pb from '../../lib/pocketbase';

export default function EscanearVendedorModal({ onClose, onVendedorValidado }) {
  const [scanned, setScanned] = useState(false);
  const [vendedor, setVendedor] = useState(null);
  const [vendedorNombre, setVendedorNombre] = useState('');
  const [vendedorUser, setVendedorUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');

  /**
   * Busca un vendedor por su código QR (qrToken)
   * Busca en la colección 'vendedores' usando el qrToken
   */
  const buscarVendedorPorToken = async (token) => {
    try {
      // Buscar en la colección vendedores por qrToken
      const result = await pb.collection('vendedores').getFullList({
        filter: `qrToken = "${token}"`,
        expand: 'userId'
      });

      if (result.length === 0) {
        return null;
      }

      const vendedorData = result[0];

      // Verificar que el vendedor esté activo
      if (!vendedorData.activo) {
        throw new Error('Este vendedor ya no está activo en el sistema.');
      }

      // Obtener datos del usuario asociado
      let userData = null;
      let nombreVendedor = 'Vendedor';
      
      if (vendedorData.userId) {
        try {
          userData = await pb.collection('users').getOne(vendedorData.userId);
          nombreVendedor = userData.nombre || 'Vendedor';
        } catch (userError) {
          console.warn('No se pudo obtener datos del usuario:', userError.message);
        }
      }

      return {
        ...vendedorData,
        nombre: nombreVendedor,
        userData: userData
      };
    } catch (err) {
      console.error('Error buscando vendedor:', err);
      throw err;
    }
  };

  /**
   * Verifica y valida al vendedor escaneado
   */
  const verificarVendedor = async (token) => {
    setLoading(true);
    setError('');
    
    try {
      // Validar que el token no esté vacío
      if (!token || token.trim().length < 3) {
        setError('❌ Código QR inválido. El código debe tener al menos 3 caracteres.');
        setLoading(false);
        return;
      }

      const vendedorData = await buscarVendedorPorToken(token.trim());
      
      if (!vendedorData) {
        setError('❌ Código QR no reconocido. Asegúrate de escanear el código de un vendedor autorizado.');
        setLoading(false);
        return;
      }

      // Vendedor encontrado y activo
      setVendedor(vendedorData);
      setVendedorNombre(vendedorData.nombre);
      setVendedorUser(vendedorData.userData);
      setScanned(true);
      
      // Guardar referencia en sessionStorage (más seguro que localStorage)
      // Solo guardamos el ID, no datos sensibles
      sessionStorage.setItem('vendedorAsignadoId', vendedorData.id);
      sessionStorage.setItem('vendedorAsignadoNombre', vendedorData.nombre);
      
    } catch (err) {
      console.error('Error verificando vendedor:', err);
      setError('❌ Error al verificar el código. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Simula el escaneo de un código QR
   * En producción, esto usaría la API de cámara del navegador
   */
  const handleEscanearQR = () => {
    // En producción: usar navigator.mediaDevices.getUserMedia() + librería QR
    // Por ahora, mostramos el modo manual directamente
    setModoManual(true);
  };

  /**
   * Procesa el código ingresado manualmente
   */
  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (codigoManual.trim()) {
      await verificarVendedor(codigoManual.trim());
    } else {
      setError('Por favor ingresa un código válido.');
    }
  };

  /**
   * Continúa con el vendedor validado
   */
  const handleContinuar = () => {
    if (vendedor) {
      onVendedorValidado(vendedor);
    }
  };

  /**
   * Reinicia el escaneo
   */
  const handleReescanear = () => {
    setScanned(false);
    setVendedor(null);
    setVendedorNombre('');
    setVendedorUser(null);
    setCodigoManual('');
    setError('');
    sessionStorage.removeItem('vendedorAsignadoId');
    sessionStorage.removeItem('vendedorAsignadoNombre');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-gray-900">
            {scanned ? '✅ Vendedor validado' : '📷 Escanear vendedor'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl transition"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {!scanned ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">📱</span>
                </div>
                <p className="text-gray-600">
                  Escanea el código QR del gafete del vendedor para validar tu compra
                </p>
              </div>

              {/* Botón de escaneo */}
              <button
                onClick={handleEscanearQR}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition mb-4 flex items-center justify-center gap-2"
              >
                <span>📷</span> Escanear código QR
              </button>

              {/* Separador */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o ingresa el código manualmente</span>
                </div>
              </div>

              {/* Modo manual */}
              <button
                onClick={() => setModoManual(!modoManual)}
                className={`w-full text-sm mb-4 transition ${
                  modoManual 
                    ? 'text-gray-400 hover:text-gray-600' 
                    : 'text-purple-600 hover:text-purple-800 font-medium'
                }`}
              >
                {modoManual ? '▲ Ocultar ingreso manual' : '▼ Ingresar código manualmente'}
              </button>
              
              {modoManual && (
                <form onSubmit={handleSubmitManual} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codigoManual}
                      onChange={(e) => setCodigoManual(e.target.value.toUpperCase().trim())}
                      placeholder="Ej: MDZ-V-001"
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-center font-mono text-lg tracking-wider focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                      autoFocus
                      maxLength={20}
                    />
                    <button
                      type="submit"
                      disabled={loading || !codigoManual.trim()}
                      className={`px-6 rounded-xl font-bold transition ${
                        loading || !codigoManual.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {loading ? '...' : 'Validar'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    El código se encuentra en el gafete del vendedor
                  </p>
                </form>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-start gap-2">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 mt-2">Verificando vendedor...</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Vendedor validado */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">¡Vendedor verificado!</h2>
                <p className="text-sm text-green-600 mt-1">Código QR válido y vendedor activo</p>
              </div>

              {/* Datos del vendedor */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-200">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span>👤</span> Información del vendedor
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-semibold">{vendedorNombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Código:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-sm">{vendedor.codigo}</span>
                  </div>
                  {vendedor.zona && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zona:</span>
                      <span>{vendedor.zona}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estado:</span>
                    <span className="text-green-600 font-medium">● Activo</span>
                  </div>
                </div>
              </div>

              {/* Nota importante */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
                <p className="font-semibold mb-1">📌 Importante:</p>
                <p>
                  Este vendedor recibirá una comisión del <strong>50% del enganche</strong> que pagues. 
                  El administrador entregará tu tarjeta y cobrará los pagos semanales.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={handleReescanear}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  ← Escanear otro
                </button>
                <button
                  onClick={handleContinuar}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition"
                >
                  Continuar con {vendedorNombre.split(' ')[0]} →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}