// src/pages/registro.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import pb from '../lib/pocketbase';

export default function RegistroPage() {
    const router = useRouter();
    const { producto, opcion } = router.query;

    const [productoData, setProductoData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: ''
    });

    useEffect(() => {
        if (producto) {
            cargarProducto();
        }
    }, [producto]);

    const cargarProducto = async () => {
        try {
            const record = await pb.collection('products').getOne(producto);
            setProductoData(record);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const getTitulo = () => {
        switch (opcion) {
            case 'visita': return 'Solicitar visita';
            case 'entrega': return 'Agendar entrega';
            default: return 'Completa tus datos';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const telefonoLimpio = formData.telefono.replace(/\D/g, '');
            
            // Validar que el teléfono tenga 10 dígitos
            if (telefonoLimpio.length !== 10) {
                alert('El teléfono debe tener 10 dígitos');
                setLoading(false);
                return;
            }

            // Buscar usuario existente por teléfono
            let cliente;
            try {
                const existentes = await pb.collection('users').getList(1, 1, {
                    filter: `telefono = "${telefonoLimpio}"`
                });

                if (existentes.items.length > 0) {
                    cliente = existentes.items[0];
                    console.log('✅ Usuario existente encontrado:', cliente.id);
                }
            } catch (searchError) {
                console.log('Usuario no encontrado, se creará uno nuevo');
            }

            // Si no existe, crear nuevo usuario
            if (!cliente) {
                const tempEmail = `user_${telefonoLimpio}@marketdesliz.com`;
                
                // ✅ Crear usuario con TODOS los campos requeridos
                cliente = await pb.collection('users').create({
                    nombre: formData.nombre,
                    telefono: telefonoLimpio,
                    email: tempEmail,
                    emailVisibility: false,      // ✅ Campo requerido
                    verified: false,              // ✅ Campo requerido
                    password: 'MarketDesliz2024!',
                    passwordConfirm: 'MarketDesliz2024!',
                    role: 'cliente',
                    activo: true
                });

                console.log('✅ Usuario creado:', cliente.id);

                // Crear registro en clients
                try {
                    await pb.collection('clients').create({
                        userId: cliente.id,
                        telefono: telefonoLimpio,           // ✅ Agregado
                        nombre: formData.nombre,             // ✅ Agregado
                        direccionCalle: formData.direccion || '',
                        diaPago: 'lunes',
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
                        datosCompletos: true,
                        aceptaTerminos: false,
                        documentosCompletos: false,
                        telefonoAlternativo: ''
                    });
                    console.log('✅ Registro en clients creado');
                } catch (clientError) {
                    console.warn('⚠️ Error creando registro en clients:', clientError.message);
                    // No detenemos el flujo si falla clients
                }
            }

            // Guardar en localStorage
            localStorage.setItem('clienteId', cliente.id);
            localStorage.setItem('clienteNombre', formData.nombre);

            // Redirigir según la opción
            if (producto && opcion) {
                router.push(`/opciones/${opcion}?producto=${producto}&cliente=${cliente.id}`);
            } else {
                router.push('/perfil');
            }

        } catch (error) {
            console.error('❌ Error detallado:', error);
            
            // Mostrar mensaje de error específico
            let mensajeError = 'Error al procesar la solicitud';
            
            if (error.data?.data) {
                // Error de campos específicos de PocketBase
                const camposError = Object.entries(error.data.data)
                    .map(([campo, info]) => `${campo}: ${info.message}`)
                    .join(', ');
                mensajeError = `Error en campos: ${camposError}`;
            } else if (error.message?.includes('unique')) {
                mensajeError = 'El teléfono o email ya está registrado';
            } else if (error.message) {
                mensajeError = error.message;
            }
            
            alert(mensajeError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>{getTitulo()} | MarketDesliz</title>
                <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; font-family: Arial, sans-serif; }
          .header { background: white; padding: 15px 0; }
          .header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 28px; font-weight: bold; color: #6C3BFF; cursor: pointer; }
          .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
          .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          h1 { font-size: 28px; margin-bottom: 10px; color: #333; }
          .subtitle { color: #666; margin-bottom: 30px; }
          .form-group { margin-bottom: 20px; }
          .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #333; }
          .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; }
          .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #6C3BFF; }
          .btn-primary { width: 100%; background: #6C3BFF; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
          .btn-primary:hover { background: #5A2FE0; }
          .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
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
                    <p className="subtitle">Completa tus datos para continuar</p>

                    {productoData && (
                        <div style={{ background: '#F3F0FF', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <p><strong>Producto:</strong> {productoData.nombre}</p>
                            <p><strong>Precio:</strong> ${productoData.precio?.toLocaleString()}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nombre completo *</label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="form-group">
                            <label>Teléfono (10 dígitos) *</label>
                            <input
                                type="tel"
                                required
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                placeholder="Ej: 5512345678"
                            />
                            <small style={{ color: '#666', fontSize: '12px' }}>10 dígitos, sin espacios ni guiones</small>
                        </div>

                        <div className="form-group">
                            <label>Dirección *</label>
                            <textarea
                                required
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                placeholder="Calle, número, colonia, ciudad"
                                rows="3"
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Procesando...' : 'Continuar'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}