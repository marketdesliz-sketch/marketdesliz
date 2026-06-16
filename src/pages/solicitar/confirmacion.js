// src/pages/solicitar/confirmacion.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import { notificarAdmin, formatMoney, generarFolio } from '../../lib/notificaciones';

export default function ConfirmacionPage() {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [producto, setProducto] = useState(null);
  const [clienteExistente, setClienteExistente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (!pendingOrder) {
      router.push('/productos');
      return;
    }

    const orderData = JSON.parse(pendingOrder);
    setOrder(orderData);
    cargarProducto(orderData.product);
    buscarOCrearCliente(orderData.clienteData);
  }, []);

  const cargarProducto = async (productId) => {
    try {
      const record = await pb.collection('products').getOne(productId);
      setProducto({
        id: record.id,
        nombre: record.nombre,
        precio: record.precio
      });
    } catch (error) {
      console.error('Error cargando producto:', error);
    }
  };

  const buscarOCrearCliente = async (clienteData) => {
    try {
      const existing = await pb.collection('users').getFirstListItem(
        `telefono = "${clienteData.telefono}"`
      );
      setClienteExistente(existing);
      setLoading(false);
      return existing;
    } catch (error) {
      try {
        // ✅ Crear usuario
        const newClient = await pb.collection('users').create({
          nombre: clienteData.nombre,
          telefono: clienteData.telefono,
          email: clienteData.email || '',
          role: 'cliente',
          activo: true
        });

        // ✅ Crear registro en clients
        await pb.collection('clients').create({
          userId: newClient.id,
          direccionCalle: clienteData.direccion || '',
          direccionColonia: clienteData.colonia || '',
          direccionMunicipio: clienteData.municipio || '',
          direccionCiudad: clienteData.ciudad || '',
          direccionEstado: clienteData.estado || '',
          direccionCp: clienteData.cp || '',
          direccionReferencias: clienteData.referencias || '',
          telefonoAlternativo: clienteData.telefonoAlternativo || '',
          diaPago: clienteData.diaPago || 'lunes',
          estadoKyc: 'pendiente',

          nivel: 0,
          productosComprados: 0,
          productosPagados: 0,
          productosEnCurso: 0,
          deudaActual: 0,
          limiteDeuda: 5000,
          trustScore: 0,
          datosCompletos: false
        });

        setClienteExistente(newClient);
        setLoading(false);
        return newClient;
      } catch (createError) {
        console.error('Error creando cliente:', createError);
        setErrorMsg('Error al crear el cliente');
        setLoading(false);
        return null;
      }
    }
  };

  const guardarOrdenEnPocketBase = async (orderData, clienteId) => {
    try {
      setSaving(true);
      setErrorMsg('');

      // ✅ CORREGIDO: Campos correctos según tu colección orders
      const orderToSave = {
        userId: clienteId,
        productId: orderData.product,
        totalPagar: orderData.totalPrice,
        tipo: orderData.tipo || orderData.tipoSolicitud,
        estadoPago: 'pendiente',

        // Campos por defecto
        enganche: 0,
        pagoSemanal: 0,
        semanasTotales: 0,
        saldoRestante: 0
      };

      // ✅ ELIMINADO: clienteData no existe en orders
      // if (orderData.clienteData) {
      //   orderToSave.clienteData = JSON.stringify(orderData.clienteData);
      // }

      if ((orderData.tipo || orderData.tipoSolicitud) === 'contado') {
        orderToSave.metodoPago = orderData.paymentMethod || 'qr_vendedor';
        // ✅ ELIMINADO: amountToPay no existe
      }

      if ((orderData.tipo || orderData.tipoSolicitud) === 'credito') {
        orderToSave.enganche = orderData.downPayment || 0;
        orderToSave.pagoSemanal = orderData.weeklyAmount || 0;
        orderToSave.semanasTotales = orderData.totalWeeks || 0;
        orderToSave.saldoRestante = orderData.remainingBalance || 0;
        orderToSave.metodoPago = orderData.paymentMethod || 'qr_vendedor';
      }

      console.log('📦 Datos a guardar:', orderToSave);

      const createdOrder = await pb.collection('orders').create(orderToSave);
      console.log('✅ Orden guardada:', createdOrder);

      localStorage.setItem('lastOrderId', createdOrder.id);
      localStorage.removeItem('pendingOrder');
      setSaved(true);

      if (orderData.paymentMethod === 'transferencia') {
        const folio = generarFolio(createdOrder.id);
        await notificarAdmin(
          `<b>🆕 NUEVA ORDEN - TRANSFERENCIA PENDIENTE</b>\n\n` +
          `👤 Cliente: ${orderData.clienteData?.nombre}\n` +
          `📞 Teléfono: ${orderData.clienteData?.telefono}\n` +
          `💰 Total: ${formatMoney(orderData.totalPrice)}\n` +
          `🆔 Folio: ${folio}\n\n` +
          `💳 Método: Transferencia pendiente de validación`,
          'pago'
        );
      }

    } catch (error) {
      console.error('❌ Error guardando orden:', error);

      if (error.data?.data) {
        const errores = Object.entries(error.data.data)
          .map(([campo, info]) => `${campo}: ${info.message}`)
          .join(', ');
        setErrorMsg(`Error en campos: ${errores}`);
      } else {
        setErrorMsg(error.message || 'Error al guardar la solicitud');
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (order && clienteExistente && !saved && !errorMsg && !saving) {
      guardarOrdenEnPocketBase(order, clienteExistente.id);
    }
  }, [order, clienteExistente]);

  const getTipoTexto = () => {
    const tipos = {
      contado: 'Compra de Contado',
      credito: 'Compra a Crédito',
      visita: 'Solicitud de Visita',
      entrega: 'Solicitud de Entrega'
    };
    return tipos[order?.tipo || order?.tipoSolicitud] || 'Solicitud';
  };

  if (loading || !order || !producto) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="loading-spinner"></div>
        </div>
      </StoreLayout>
    );
  }

  // ✅ CORREGIDO: Usar campos correctos
  const montoPagar = (order.tipo || order.tipoSolicitud) === 'contado'
    ? order.totalPrice  // ✅ Solo totalPrice, no amountToPay
    : order.downPayment;

  return (
    <>
      <Head>
        <title>Confirmación | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-3xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">¡Solicitud Registrada!</h1>
            <p className="text-gray-600 mt-2">Tu solicitud ha sido recibida correctamente</p>
            {saved && (
              <p className="text-green-600 text-sm mt-2">✓ Guardada en nuestro sistema</p>
            )}
            {errorMsg && (
              <p className="text-red-600 text-sm mt-2">❌ {errorMsg}</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Detalles de tu solicitud</h2>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tipo de solicitud:</span>
                <span className="font-medium text-[#6C3BFF]">{getTipoTexto()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Producto:</span>
                <span className="font-medium">{producto.nombre}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Cliente:</span>
                <span className="font-medium">{order.clienteData?.nombre}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Teléfono:</span>
                <span className="font-medium">{order.clienteData?.telefono}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Dirección:</span>
                <span className="font-medium text-right">{order.clienteData?.direccion}</span>
              </div>
            </div>
          </div>

          {((order.tipo || order.tipoSolicitud) === 'contado' || (order.tipo || order.tipoSolicitud) === 'credito') && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">💰 Información de pago</h2>

              {(order.tipo || order.tipoSolicitud) === 'contado' && (
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total a pagar:</span>
                    <span className="text-2xl font-bold text-green-600">{formatMoney(montoPagar)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium">{order.paymentMethod === 'qr' ? '📱 QR con vendedor' : '🏦 Transferencia BBVA'}</span>
                  </div>
                </div>
              )}

              {(order.tipo || order.tipoSolicitud) === 'credito' && (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Enganche inicial:</span>
                    <span className="font-bold text-[#6C3BFF]">{formatMoney(order.downPayment)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Pagos semanales:</span>
                    <span className="font-bold">{formatMoney(order.weeklyAmount)} x {order.totalWeeks} semanas</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total a pagar:</span>
                    <span className="text-xl font-bold text-green-600">{formatMoney(order.downPayment + (order.weeklyAmount * order.totalWeeks))}</span>
                  </div>
                </div>
              )}

              {order.paymentMethod === 'transferencia' && saved && (
                <Link
                  href={`/solicitar/subir-comprobante?orderId=${localStorage.getItem('lastOrderId')}`}
                  className="block text-center mt-4 py-3 bg-[#6C3BFF] text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Subir comprobante de pago →
                </Link>
              )}
            </div>
          )}

          {((order.tipo || order.tipoSolicitud) === 'visita' || (order.tipo || order.tipoSolicitud) === 'entrega') && (
            <div className="bg-yellow-50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📞 Próximos pasos</h2>
              <p className="text-gray-700 mb-3">
                Un asesor se pondrá en contacto contigo en las próximas 24 horas para coordinar
                {(order.tipo || order.tipoSolicitud) === 'visita' ? ' la visita a domicilio.' : ' la entrega del producto.'}
              </p>
              <div className="bg-white rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-500">¿Necesitas ayuda? Contáctanos:</p>
                <p className="text-[#6C3BFF] font-medium mt-1">📞 (123) 456-7890</p>
                <p className="text-[#6C3BFF] font-medium">💬 WhatsApp: 55 1234 5678</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 bg-gray-200 text-gray-700 text-center py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Volver al inicio
            </Link>
            <Link
              href={`/productos/${producto.id}`}
              className="flex-1 bg-[#6C3BFF] text-white text-center py-3 rounded-lg font-bold hover:bg-purple-700 transition"
            >
              Ver más productos
            </Link>
          </div>

          {saving && (
            <div className="text-center mt-6">
              <p className="text-gray-500 text-sm">Guardando tu solicitud...</p>
            </div>
          )}
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
