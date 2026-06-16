// src/pages/opciones/[tipo].js - VERSIÓN CORREGIDA
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import pb from '../../lib/pocketbase';
import QRCode from 'qrcode';

export default function OpcionPage() {
    const router = useRouter();
    const { tipo, producto, cliente, detalles } = router.query;

    const [productoData, setProductoData] = useState(null);
    const [clienteData, setClienteData] = useState(null);
    const [clientAddress, setClientAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [confirmacion, setConfirmacion] = useState(false);
    const [tareaCreada, setTareaCreada] = useState(null);

    // Redirigir si alguien intenta acceder a /opciones/compra
    useEffect(() => {
        if (tipo === 'compra') {
            router.push('/');
            return;
        }
    }, [tipo, router]);

    // ✅ Función para obtener datos del cliente
    const obtenerClienteCompleto = async (clienteId) => {
        const user = await pb.collection('users').getOne(clienteId);
        let clientData = null;
        let direccion = '';

        try {
            clientData = await pb.collection('clients').getFirstListItem(
                `userId = "${clienteId}"`
            );
            const partes = [
                clientData.direccionCalle,
                clientData.direccionNumero,
                clientData.direccionColonia,
                clientData.direccionCiudad
            ].filter(Boolean);
            direccion = partes.length > 0 ? partes.join(', ') : 'Sin dirección registrada';
        } catch (e) {
            direccion = 'Sin dirección registrada';
        }

        return { user, clientData, direccion };
    };

    useEffect(() => {
        if ((tipo === 'visita' || tipo === 'entrega') && producto && cliente) {
            cargarDatos();
        } else if ((tipo === 'visita' || tipo === 'entrega') && cliente && !producto) {
            cargarCliente();
        }
    }, [tipo, producto, cliente]);

    const cargarDatos = async () => {
        try {
            const [prod, { user, direccion }] = await Promise.all([
                pb.collection('products').getOne(producto),
                obtenerClienteCompleto(cliente)
            ]);
            setProductoData(prod);
            setClienteData(user);
            setClientAddress(direccion);

            await generarQR(user);

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarCliente = async () => {
        try {
            const { user, direccion } = await obtenerClienteCompleto(cliente);
            setClienteData(user);
            setClientAddress(direccion);
            await generarQR(user);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generarQR = async (cliente) => {
        try {
            const qrText = `MDZ-CLIENT-${cliente.id}`;
            const qrDataURL = await QRCode.toDataURL(qrText);
            setQrCode(qrDataURL);
            console.log('✅ QR generado');
        } catch (error) {
            console.error('Error generando QR:', error);
        }
    };

    const procesarVisita = async () => {
        try {
            setProcesando(true);

            const tarea = await pb.collection('cobros').create({
                userId: cliente,
                productId: producto || null,
                tipo: 'visita',
                fecha: fecha,
                hora: hora,
                direccion: clientAddress,
                detalles: detalles || '',
                estado: 'pendiente'
            });

            setTareaCreada(tarea);
            setConfirmacion(true);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al agendar la visita');
        } finally {
            setProcesando(false);
        }
    };

    const procesarEntrega = async () => {
        try {
            setProcesando(true);

            const orden = await pb.collection('orders').create({
                userId: cliente,
                productId: producto,
                totalPagar: productoData.precio,
                enganche: productoData.enganche || 0,
                pagoSemanal: productoData.pagoSemanal || 0,
                semanasTotales: productoData.semanas || 12,
                saldoRestante: productoData.precio - (productoData.enganche || 0),
                estadoPago: 'pendiente_pago',
                tipo: 'entrega'
            });

            const tarea = await pb.collection('cobros').create({
                userId: cliente,
                orderId: orden.id,
                productId: producto,
                tipo: 'entrega',
                fecha: fecha,
                hora: hora,
                direccion: clientAddress,
                detalles: detalles || '',
                estado: 'pendiente'
            });

            setTareaCreada(tarea);
            setConfirmacion(true);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al agendar la entrega');
        } finally {
            setProcesando(false);
        }
    };

    const getTitulo = () => {
        switch (tipo) {
            case 'visita': return 'Agendar visita';
            case 'entrega': return 'Programar entrega';
            default: return 'Opción no válida';
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div className="spinner" />
                <p>Cargando...</p>
            </div>
        );
    }

    if (confirmacion) {
        return (
            <>
                <Head>
                    <title>Confirmación | MarketDesliz</title>
                </Head>
                <div className="header">
                    <div className="header-content">
                        <div className="logo" onClick={() => router.push('/')}>MarketDesliz</div>
                    </div>
                </div>
                <div className="container" style={{ maxWidth: '500px' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                        <h1>
                            {tipo === 'visita' && '¡Visita agendada!'}
                            {tipo === 'entrega' && '¡Entrega programada!'}
                        </h1>

                        <div style={{ margin: '20px auto', width: '200px', height: '200px' }}>
                            <img src={qrCode} alt="QR" style={{ width: '100%', height: '100%' }} />
                        </div>

                        <p><strong>ID Cliente:</strong> {cliente}</p>

                        {tipo === 'visita' && (
                            <p><strong>Visita:</strong> {fecha} a las {hora}</p>
                        )}

                        {tipo === 'entrega' && (
                            <p><strong>Entrega:</strong> {fecha} a las {hora}</p>
                        )}

                        <p style={{ marginTop: '20px', color: '#666' }}>
                            Presenta este QR al vendedor para agilizar el proceso
                        </p>

                        <button
                            onClick={() => router.push('/')}
                            className="btn-primary"
                            style={{ marginTop: '20px' }}
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>{getTitulo()} | MarketDesliz</title>
                <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; font-family: Arial; }
          .header { background: white; padding: 15px 0; }
          .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 28px; font-weight: bold; color: #6C3BFF; cursor: pointer; }
          .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
          .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          h1 { font-size: 28px; margin-bottom: 10px; color: #333; }
          .subtitle { color: #666; margin-bottom: 30px; }
          .info-box { background: #F3F0FF; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .form-group { margin-bottom: 20px; }
          .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #333; }
          .form-group input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; }
          .form-group input:focus { outline: none; border-color: #6C3BFF; }
          .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .btn-primary { width: 100%; background: #6C3BFF; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
          .btn-primary:hover { background: #5A2FE0; }
          .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
          .qr-preview { text-align: center; margin: 20px 0; }
          .qr-preview img { width: 150px; height: 150px; border: 2px solid #6C3BFF; padding: 10px; border-radius: 8px; }
        `}</style>
            </Head>

            <div className="header">
                <div className="header-content">
                    <div className="logo" onClick={() => router.push('/')}>MarketDesliz</div>
                    <Link href="/perfil" style={{ color: '#666', textDecoration: 'none' }}>Mi Cuenta</Link>
                </div>
            </div>

            <div className="container">
                <div className="card">
                    <h1>{getTitulo()}</h1>

                    {qrCode && (
                        <div className="qr-preview">
                            <img src={qrCode} alt="QR" />
                            <p style={{ fontSize: '12px', color: '#666' }}>Tu QR único (siempre disponible)</p>
                        </div>
                    )}

                    <div className="info-box">
                        <p><strong>Cliente:</strong> {clienteData?.nombre}</p>
                        <p><strong>Teléfono:</strong> {clienteData?.telefono}</p>
                        <p><strong>Dirección:</strong> {clientAddress}</p>
                        {productoData && <p><strong>Producto:</strong> {productoData.nombre}</p>}
                        {detalles && <p><strong>Detalles:</strong> {decodeURIComponent(detalles)}</p>}
                    </div>

                    {(tipo === 'visita' || tipo === 'entrega') && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Hora</label>
                                    <input
                                        type="time"
                                        value={hora}
                                        onChange={(e) => setHora(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={tipo === 'visita' ? procesarVisita : procesarEntrega}
                                disabled={procesando || !fecha || !hora}
                            >
                                {procesando ? 'Procesando...' : `Confirmar ${tipo === 'visita' ? 'visita' : 'entrega'}`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}