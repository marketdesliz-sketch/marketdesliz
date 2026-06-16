// src/pages/clients/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import ClientQR from "../../components/clients/ClientQR";
import pb from "../../lib/pocketbase";

export default function ClientPage() {
  const router = useRouter();
  const { id } = router.query;
  const [cliente, setCliente] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      cargarCliente();
    }
  }, [id]);

  const cargarCliente = async () => {
    try {
      const user = await pb.collection('users').getOne(id);
      
      let clientData = null;
      try {
        clientData = await pb.collection('clients').getFirstListItem(
          `userId = "${id}"`
        );
      } catch (e) {
        console.log('No hay datos extendidos para este cliente');
      }
      
      setCliente(user);
      setClienteData(clientData);
    } catch (error) {
      console.error('Error cargando cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDireccion = () => {
    if (!clienteData) return 'No especificada';
    const partes = [
      clienteData.direccionCalle,
      clienteData.direccionNumero ? `#${clienteData.direccionNumero}` : '',
      clienteData.direccionInterior ? `Int. ${clienteData.direccionInterior}` : '',
      clienteData.direccionColonia,
      clienteData.direccionMunicipio,
      clienteData.direccionCiudad,
      clienteData.direccionEstado,
      clienteData.direccionCp ? `CP ${clienteData.direccionCp}` : ''
    ].filter(Boolean);
    return partes.length > 0 ? partes.join(', ') : 'No especificada';
  };

  const formatPhone = (phone) => {
    if (!phone) return 'No registrado';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 10)}`;
    }
    return phone;
  };

  if (!id) return null;

  return (
    <>
      <Head>
        <title>Mi Perfil | MarketDesliz</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }

          .header {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 15px 0;
          }

          .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #6C3BFF;
            cursor: pointer;
          }

          .container {
            max-width: 1000px;
            margin: 40px auto;
            padding: 0 20px;
          }

          .card {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }

          .titulo {
            font-size: 32px;
            color: #333;
            margin-bottom: 10px;
          }

          .subtitulo {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }

          .info-section {
            background: #F9F9F9;
            border-radius: 12px;
            padding: 25px;
          }

          .info-section h3 {
            color: #6C3BFF;
            font-size: 18px;
            margin-bottom: 20px;
            border-bottom: 2px solid #6C3BFF;
            padding-bottom: 10px;
          }

          .info-item {
            display: flex;
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .info-label {
            width: 100px;
            color: #666;
            font-weight: 500;
            flex-shrink: 0;
          }

          .info-value {
            flex: 1;
            color: #333;
            font-weight: 600;
          }

          .badge {
            background: #F3F0FF;
            color: #6C3BFF;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
          }

          .loading {
            text-align: center;
            padding: 50px;
          }

          .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #6C3BFF;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .btn-volver {
            display: inline-block;
            background: white;
            color: #6C3BFF;
            border: 2px solid #6C3BFF;
            padding: 12px 30px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            margin-top: 30px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-volver:hover {
            background: #6C3BFF;
            color: white;
          }

          @media (max-width: 768px) {
            .grid-2 {
              grid-template-columns: 1fr;
            }
          }
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
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Cargando información del cliente...</p>
            </div>
          ) : (
            <>
              <h1 className="titulo">¡Bienvenido, {cliente?.nombre || 'Cliente'}!</h1>
              <p className="subtitulo">Este es tu perfil y código QR único</p>

              <div className="grid-2">
                <div className="info-section">
                  <h3>📋 Información personal</h3>
                  
                  <div className="info-item">
                    <span className="info-label">Nombre:</span>
                    <span className="info-value">{cliente?.nombre || 'No registrado'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Teléfono:</span>
                    <span className="info-value">{formatPhone(cliente?.telefono)}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Dirección:</span>
                    <span className="info-value">{getDireccion()}</span>
                  </div>

                  {clienteData?.telefonoAlternativo && (
                    <div className="info-item">
                      <span className="info-label">Tel. Alt:</span>
                      <span className="info-value">{formatPhone(clienteData.telefonoAlternativo)}</span>
                    </div>
                  )}

                  {clienteData?.diaPago && (
                    <div className="info-item">
                      <span className="info-label">Día pago:</span>
                      <span className="info-value capitalize">{clienteData.diaPago}</span>
                    </div>
                  )}
                  
                  <div className="info-item">
                    <span className="info-label">ID Cliente:</span>
                    <span className="info-value">
                      <span className="badge">{clienteData?.tarjetaId || cliente?.id?.slice(-8) || 'N/A'}</span>
                    </span>
                  </div>

                  {clienteData?.nivel !== undefined && (
                    <div className="info-item">
                      <span className="info-label">Nivel:</span>
                      <span className="info-value">
                        <span className="badge">⭐ Nivel {clienteData.nivel}</span>
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: '20px' }}>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      📅 Registrado: {new Date(cliente?.created).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="info-section">
                  <h3>📱 Código QR</h3>
                  <ClientQR 
                    clientId={id} 
                    clientName={cliente?.nombre || 'cliente'} 
                  />
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '15px' }}>
                    Presenta este código al cobrador
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button 
                  className="btn-volver"
                  onClick={() => router.push('/')}
                >
                  ← Volver a la tienda
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}