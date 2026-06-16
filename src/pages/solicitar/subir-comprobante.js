// src/pages/solicitar/subir-comprobante.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import { notificarAdmin, formatMoney, generarFolio } from '../../lib/notificaciones';

export default function SubirComprobantePage() {
    const router = useRouter();
    const { orderId } = router.query;

    const [order, setOrder] = useState(null);
    const [producto, setProducto] = useState(null);
    const [clienteData, setClienteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [comprobante, setComprobante] = useState(null);
    const [comprobantePreview, setComprobantePreview] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (orderId) {
            cargarOrden();
        } else {
            const pendingOrder = localStorage.getItem('pendingOrder');
            if (pendingOrder) {
                const orderData = JSON.parse(pendingOrder);
                cargarOrdenPorId(orderData.id);
            } else {
                router.push('/productos');
            }
        }
    }, [orderId]);

    const cargarDatosCliente = async (userId) => {
        try {
            const user = await pb.collection('users').getOne(userId);
            let clientExtended = null;

            try {
                clientExtended = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
            } catch (e) {
                // No tiene datos extendidos
            }

            setClienteData({
                nombre: user.nombre || 'Sin nombre',
                telefono: user.telefono || 'No registrado',
                colonia: clientExtended?.direccionColonia || 'No especificada',
                direccion: clientExtended?.direccionCalle || 'No registrada'
            });
        } catch (error) {
            console.error('Error cargando cliente:', error);
            setClienteData({
                nombre: 'Sin nombre',
                telefono: 'No registrado',
                colonia: 'No especificada'
            });
        }
    };

    const cargarOrden = async () => {
        try {
            const record = await pb.collection('orders').getOne(orderId, {
                expand: 'userId,productId'
            });
            setOrder(record);

            if (record.expand?.userId) {
                await cargarDatosCliente(record.userId);
            } else if (record.userId) {
                await cargarDatosCliente(record.userId);
            }

            if (record.expand?.productId) {
                setProducto(record.expand.productId);
            } else if (record.productId) {
                const productRecord = await pb.collection('products').getOne(record.productId);
                setProducto(productRecord);
            }
        } catch (error) {
            console.error('Error cargando orden:', error);
            setError('No se encontró la orden');
        } finally {
            setLoading(false);
        }
    };

    const cargarOrdenPorId = async (id) => {
        try {
            const records = await pb.collection('orders').getFullList({
                filter: `id = "${id}"`,
                expand: 'userId,productId'
            });
            if (records.length > 0) {
                const record = records[0];
                setOrder(record);

                if (record.expand?.userId) {
                    await cargarDatosCliente(record.userId);
                } else if (record.userId) {
                    await cargarDatosCliente(record.userId);
                }

                if (record.expand?.productId) {
                    setProducto(record.expand.productId);
                } else if (record.productId) {
                    const productRecord = await pb.collection('products').getOne(record.productId);
                    setProducto(productRecord);
                }
            }
        } catch (error) {
            console.error('Error cargando orden:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComprobanteChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo no debe exceder los 5MB');
                return;
            }
            setComprobante(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setComprobantePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comprobante) {
            alert('Por favor selecciona el comprobante de pago');
            return;
        }

        // ✅ Validar que no tenga ya un comprobante
        if (order.comprobanteId) {
            setError('Esta orden ya tiene un comprobante asociado');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('comprobante', comprobante);
            formData.append('mensaje', mensaje);
            formData.append('estado', 'pendiente_validacion');

            const comprobanteRecord = await pb.collection('comprobantes').create(formData);

            // ✅ ACTUALIZADO: Usar estado_pago y fechaComprobante
            await pb.collection('orders').update(order.id, {
                comprobanteId: comprobanteRecord.id,
                estadoPago: 'pendiente_pago',
                estadoValidacion: 'pendiente',
                fechaComprobante: new Date().toISOString()
            });


            const monto = order.tipo === 'contado'
                ? formatMoney(order.totalPagar)
                : formatMoney(order.enganche || 0);

            const folio = generarFolio(order.id);

            await notificarAdmin(
                `<b>🆕 NUEVO PAGO PENDIENTE DE VALIDACIÓN</b>\n\n` +
                `👤 Cliente: ${clienteData?.nombre || 'Sin nombre'}\n` +
                `📞 Teléfono: ${clienteData?.telefono || 'No registrado'}\n` +
                `🏘️ Colonia: ${clienteData?.colonia || 'No especificada'}\n` +
                `💰 Monto: ${monto}\n` +
                `📦 Producto: ${producto?.nombre || 'No especificado'}\n` +
                `🆔 Folio: ${folio}\n` +
                `📎 Comprobante ID: ${comprobanteRecord.id}\n\n` +
                `🔍 Validar en: /admin/ordenes`,
                'pago'
            );

            setEnviado(true);
            localStorage.removeItem('pendingOrder');

        } catch (error) {
            console.error('Error subiendo comprobante:', error);
            setError('Error al subir el comprobante. Por favor intenta nuevamente.');
        } finally {
            setUploading(false);
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

    if (error && !order) {
        return (
            <StoreLayout>
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="inline-block bg-[#6C3BFF] text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700">
                        Volver al inicio
                    </Link>
                </div>
            </StoreLayout>
        );
    }

    if (enviado) {
        return (
            <StoreLayout>
                <div className="max-w-2xl mx-auto px-4 py-12 pt-24 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Comprobante enviado!</h1>
                    <p className="text-gray-600 mb-6">
                        Hemos recibido tu comprobante. En las próximas 24 horas validaremos tu pago
                        y te notificaremos por WhatsApp.
                    </p>
                    <div className="bg-yellow-50 rounded-xl p-5 mb-6">
                        <p className="text-sm text-yellow-800">
                            📌 Guarda este número de folio para cualquier consulta:
                            <br />
                            <strong className="font-mono text-lg">{generarFolio(order?.id)}</strong>
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-block bg-[#6C3BFF] text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </StoreLayout>
        );
    }

    const montoPagar = order?.tipo === 'contado'
        ? order.totalPagar
        : order?.enganche || 0;

    const folio = generarFolio(order?.id);

    return (
        <>
            <Head>
                <title>Subir Comprobante | MarketDesliz</title>
            </Head>

            <StoreLayout>
                <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">📎</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Subir comprobante de pago</h1>
                        <p className="text-gray-600 mt-2">Adjunta el comprobante de tu transferencia</p>
                        <p className="text-sm text-gray-500 mt-1">Folio: <span className="font-mono">{folio}</span></p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">📋 Información de tu orden</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Producto:</span>
                                <span className="font-medium">{producto?.nombre || order?.productId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Monto a pagar:</span>
                                <span className="font-bold text-[#6C3BFF]">{formatMoney(montoPagar)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tipo:</span>
                                <span className="capitalize">{order?.tipo === 'contado' ? 'Compra de contado' : 'Enganche'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">🏦 Cuenta para transferencia</h3>
                        <div className="space-y-2 text-sm">
                            <div><span className="text-gray-500">Banco:</span> BBVA México</div>
                            <div><span className="text-gray-500">Beneficiario:</span> MarketDesliz S.A. de C.V.</div>
                            <div><span className="text-gray-500">CLABE:</span> <span className="font-mono">0123 4567 8901 2345 67</span></div>
                            <div><span className="text-gray-500">Referencia:</span> <span className="font-mono">{folio}</span></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📸 Comprobante de pago *
                            </label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleComprobanteChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#6C3BFF]"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, PDF (máx 5MB)</p>

                            {comprobantePreview && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                                    {comprobantePreview.startsWith('data:image') ? (
                                        <img src={comprobantePreview} alt="Comprobante" className="max-h-48 rounded-lg border mx-auto" />
                                    ) : (
                                        <p className="text-sm text-gray-600">📄 Archivo PDF seleccionado</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                💬 Mensaje adicional (opcional)
                            </label>
                            <textarea
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#6C3BFF]"
                                placeholder="Ej: Transferencia realizada el 25/03/2026, referencia: 123456"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full bg-[#6C3BFF] text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {uploading ? 'Enviando...' : 'Enviar comprobante'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <Link href="/" className="text-sm text-gray-500 hover:text-[#6C3BFF]">
                            ← Volver al inicio
                        </Link>
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
