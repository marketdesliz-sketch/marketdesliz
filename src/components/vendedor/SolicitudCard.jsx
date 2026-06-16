// src/components/vendedor/SolicitudCard.jsx
import { useState, useEffect } from 'react';
import { validarSolicitud, marcarEngancheRecibido } from '../../lib/vendedorService';
import pb from '../../lib/pocketbase';

export default function SolicitudCard({ solicitud, onValidada, onEngancheRecibido }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEnganche, setMostrarModalEnganche] = useState(false);
  const [notas, setNotas] = useState('');
  const [montoEnganche, setMontoEnganche] = useState(solicitud?.enganche || 0);
  const [metodoPago, setMetodoPago] = useState('qr');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [clienteData, setClienteData] = useState(null);

  const cliente = solicitud.expand?.clienteId;
  const producto = solicitud.expand?.productoId;

  useEffect(() => {
    const cargarDatosCliente = async () => {
      if (cliente?.id) {
        try {
          const clientRecord = await pb.collection('clients').getFirstListItem(
            `userId = "${cliente.id}"`
          );
          setClienteData(clientRecord);
        } catch (error) {
          console.log('No se encontró registro en clients');
          setClienteData(null);
        }
      }
    };
    cargarDatosCliente();
  }, [cliente?.id]);

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleValidar = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await validarSolicitud(solicitud.id, notas);
      setMostrarModal(false);
      setMensaje({ tipo: 'success', texto: '✅ Solicitud validada. El admin recibirá la notificación.' });
      if (onValidada) onValidada(solicitud.id);
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al validar la solicitud' });
    } finally {
      setLoading(false);
    }
  };

  const handleEngancheRecibido = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await marcarEngancheRecibido(solicitud.id, montoEnganche, metodoPago);
      setMostrarModalEnganche(false);
      setMensaje({ tipo: 'success', texto: `✅ Enganche de ${formatMoney(montoEnganche)} registrado` });
      if (onEngancheRecibido) onEngancheRecibido(solicitud.id);
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al registrar el enganche' });
    } finally {
      setLoading(false);
    }
  };

  const getDireccion = () => {
    if (!clienteData) return 'Sin dirección';
    return [
      clienteData.direccionCalle,
      clienteData.direccionNumero ? `#${clienteData.direccionNumero}` : '',
      clienteData.direccionColonia
    ].filter(Boolean).join(', ') || 'Sin dirección completa';
  };

  const getColonia = () => clienteData?.direccionColonia || 'Sin colonia';

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente_vendedor': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'vendedor_validado': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Validada' },
      'admin_validado': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobada' },
      'completada': { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completada' },
      'cancelada': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
    };
    return badges[estado] || { bg: 'bg-gray-100', text: 'text-gray-800', label: estado };
  };

  const estadoBadge = getEstadoBadge(solicitud.estado);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
        {/* Header con estado */}
        <div className={`px-4 py-3 flex justify-between items-center ${
          solicitud.estado === 'pendiente_vendedor' ? 'bg-yellow-50 border-b border-yellow-200' :
          solicitud.estado === 'vendedor_validado' ? 'bg-blue-50 border-b border-blue-200' :
          'bg-green-50 border-b border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{solicitud.tipo === 'contado' ? '💰' : '📦'}</span>
            <div>
              <p className="font-medium text-gray-900">
                {solicitud.tipo === 'contado' ? 'Compra de contado' : 'Compra a crédito'}
              </p>
              <p className="text-xs text-gray-500">
                #{solicitud.id.slice(-6)} • {formatDate(solicitud.fechaSolicitud || solicitud.created)}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoBadge.bg} ${estadoBadge.text}`}>
            {estadoBadge.label}
          </span>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Cliente */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">👤</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{cliente?.nombre || 'Cliente'}</p>
              <p className="text-sm text-gray-500">📞 {cliente?.telefono || 'No disponible'}</p>
              <p className="text-sm text-gray-500">📍 {getColonia()}</p>
              {clienteData && <p className="text-xs text-gray-400 mt-1 truncate">{getDireccion()}</p>}
            </div>
          </div>

          {/* Producto */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{producto?.nombre || solicitud.productoNombre}</p>
                <p className="text-sm text-gray-500">Precio: {formatMoney(solicitud.productoPrecio)}</p>
              </div>
            </div>
            
            {solicitud.tipo === 'credito' && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Enganche:</span><span className="font-medium ml-1">{formatMoney(solicitud.enganche)}</span></div>
                  <div><span className="text-gray-500">Pago semanal:</span><span className="font-medium ml-1">{formatMoney(solicitud.pagoSemanal)}</span></div>
                  <div><span className="text-gray-500">Semanas:</span><span className="font-medium ml-1">{solicitud.semanasTotales}</span></div>
                  <div><span className="text-gray-500">Total:</span><span className="font-medium ml-1">{formatMoney(solicitud.totalPagar)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Tanda */}
          {solicitud.incluyeTanda && (
            <div className="bg-green-50 rounded-lg p-3 mb-3">
              <p className="font-medium text-green-800">🎯 Tanda: {solicitud.tandaNombre}</p>
              <p className="text-xs text-green-600">Posición #{solicitud.tandaPosicion} • Cuota {formatMoney(solicitud.tandaCuota)}/sem</p>
            </div>
          )}

          {/* Enganche */}
          <div className={`rounded-lg p-2 mb-3 text-sm ${solicitud.enganchePagado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {solicitud.enganchePagado 
              ? `✅ Enganche recibido el ${formatDate(solicitud.engancheRecibidoFecha)}`
              : '⏳ Enganche pendiente'}
          </div>

          {/* Mensaje de feedback */}
          {mensaje && (
            <div className={`rounded-lg p-2 mb-3 text-sm ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {mensaje.texto}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 mt-3">
            {solicitud.estado === 'pendiente_vendedor' && (
              <>
                <button onClick={() => setMostrarModal(true)} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                  ✅ Validar
                </button>
                {!solicitud.enganchePagado && (
                  <button onClick={() => setMostrarModalEnganche(true)} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                    💰 Registrar enganche
                  </button>
                )}
              </>
            )}
            {solicitud.estado === 'vendedor_validado' && (
              <div className="w-full text-center text-sm text-blue-600 py-2">⏳ Esperando admin</div>
            )}
            {solicitud.estado === 'admin_validado' && (
              <div className="w-full text-center text-sm text-green-600 py-2">✅ Aprobada</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Validar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">✅ Validar solicitud</h3>
            <p className="text-gray-600 mb-4">¿Confirmas que los datos son correctos?</p>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows="3" className="w-full border rounded-lg p-3 mb-4" placeholder="Notas opcionales..." />
            <div className="flex gap-3">
              <button onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancelar</button>
              <button onClick={handleValidar} disabled={loading} className="flex-1 bg-purple-600 text-white py-2 rounded-lg disabled:opacity-50">
                {loading ? 'Validando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enganche */}
      {mostrarModalEnganche && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">💰 Registrar enganche</h3>
            <label className="block text-sm font-medium mb-1">Monto recibido</label>
            <input type="number" value={montoEnganche} onChange={(e) => setMontoEnganche(Number(e.target.value))} className="w-full border rounded-lg px-4 py-2 mb-4" />
            <label className="block text-sm font-medium mb-1">Método de pago</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full border rounded-lg px-4 py-2 mb-4">
              <option value="qr">📱 QR</option>
              <option value="transferencia">🏦 Transferencia</option>
            </select>
            <div className="bg-yellow-50 rounded-lg p-3 mb-4 text-sm text-yellow-800">
              ⚠️ El cliente quedará registrado y el admin será notificado.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMostrarModalEnganche(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancelar</button>
              <button onClick={handleEngancheRecibido} disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg disabled:opacity-50">
                {loading ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}