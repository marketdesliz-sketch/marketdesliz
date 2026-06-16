// src/pages/kyc/estado.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import StoreLayout from '../../layouts/StoreLayout';
import { getClientKYC } from '../../lib/kycService';
import pb from '../../lib/pocketbase';

export default function KYCStatusPage() {
  const router = useRouter();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    const currentUser = pb.authStore.model;
    setUser(currentUser);
    cargarKYC(currentUser.id);
  }, []);

  const cargarKYC = async (userId) => {
    try {
      const data = await getClientKYC(userId);
      setKyc(data);
    } catch (error) {
      console.error('Error cargando KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!kyc) {
      return {
        icon: '📤',
        title: 'Verificación pendiente',
        message: 'Aún no has enviado tus documentos de verificación.',
        color: 'gray',
        action: 'Enviar documentos',
        link: '/kyc'
      };
    }

    switch (kyc.estado) {
      case 'pendiente':
        return {
          icon: '⏳',
          title: 'Documentos en revisión',
          message: 'Tus documentos están siendo revisados por nuestro equipo. Te notificaremos cuando estén listos.',
          color: 'yellow',
          action: null,
          link: null
        };
      case 'aprobado':
        return {
          icon: '✅',
          title: '¡Verificación aprobada!',
          message: 'Tu identidad ha sido verificada. Ya puedes unirte a las tandas y disfrutar de todos los beneficios.',
          color: 'green',
          action: 'Ver tandas disponibles',
          link: '/tandas'
        };
      case 'rechazado':
        const motivo = kyc.motivoRechazo || kyc.notas || 'Tus documentos no fueron aprobados.';
        return {
          icon: '❌',
          title: 'Documentos rechazados',
          message: motivo,
          color: 'red',
          action: 'Reintentar verificación',
          link: '/kyc'
        };
      default:
        return {
          icon: '⚠️',
          title: 'Estado desconocido',
          message: 'Contacta a soporte para más información.',
          color: 'gray',
          action: 'Contactar soporte',
          link: '/soporte'
        };
    }
  };

  const info = getStatusInfo();

  const getFechaEnvio = () => {
    if (kyc?.fechaEnvio) return new Date(kyc.fechaEnvio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    if (kyc?.fechaSolicitud) return new Date(kyc.fechaSolicitud).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    if (kyc?.created) return new Date(kyc.created).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    return 'No disponible';
  };

  const getFechaRevision = () => {
    if (kyc?.fechaActualizacion) return new Date(kyc.fechaActualizacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    if (kyc?.fechaRevision) return new Date(kyc.fechaRevision).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    return null;
  };

  const getColorClasses = (color) => {
    const classes = {
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-500' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500' }
    };
    return classes[color] || classes.gray;
  };

  const colors = getColorClasses(info.color);

  return (
    <>
      <Head>
        <title>Estado KYC | MarketDesliz</title>
        <style>{`
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
          .icon { font-size: 64px; margin-bottom: 20px; }
          .title { font-size: 24px; margin-bottom: 10px; }
          .message { color: #666; margin-bottom: 30px; line-height: 1.6; }
          .info-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; }
          .info-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-item:last-child { border-bottom: none; }
          .info-label { color: #666; }
          .info-value { font-weight: 500; }
          .btn { background: #6C3BFF; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
          .btn:hover { background: #5A2FE0; }
          .btn-outline { background: white; color: #6C3BFF; border: 2px solid #6C3BFF; padding: 15px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
          .btn-outline:hover { background: #6C3BFF; color: white; }
          .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #6C3BFF; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </Head>

      <StoreLayout>
        <div className="container">
          <div className="card">
            {loading ? (
              <>
                <div className="spinner"></div>
                <p style={{ color: '#666' }}>Cargando información de verificación...</p>
              </>
            ) : (
              <>
                <div className="icon">{info.icon}</div>
                <h1 className="title" style={{ color: '#1a1a1a' }}>{info.title}</h1>
                <p className="message">{info.message}</p>

                {kyc && (
                  <div className="info-box">
                    <div className="info-item">
                      <span className="info-label">📅 Fecha de envío:</span>
                      <span className="info-value">{getFechaEnvio()}</span>
                    </div>
                    {getFechaRevision() && (
                      <div className="info-item">
                        <span className="info-label">🔍 Fecha de revisión:</span>
                        <span className="info-value">{getFechaRevision()}</span>
                      </div>
                    )}
                    {kyc.termsAccepted && (
                      <div className="info-item">
                        <span className="info-label">📋 Términos aceptados:</span>
                        <span className="info-value" style={{ color: '#10b981' }}>✅ Sí</span>
                      </div>
                    )}
                    {kyc.estado === 'rechazado' && kyc.motivoRechazo && (
                      <div className="info-item" style={{ flexDirection: 'column' }}>
                        <span className="info-label" style={{ marginBottom: '8px' }}>❌ Motivo del rechazo:</span>
                        <span className="info-value" style={{ color: '#dc2626', fontWeight: 'normal' }}>{kyc.motivoRechazo}</span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                  {info.link && (
                    <button className="btn" onClick={() => router.push(info.link)}>
                      {info.action}
                    </button>
                  )}

                  {!kyc && (
                    <button className="btn" onClick={() => router.push('/kyc')}>
                      Iniciar verificación
                    </button>
                  )}

                  <button className="btn-outline" onClick={() => router.push('/perfil')}>
                    ← Volver a mi perfil
                  </button>
                </div>

                {kyc?.estado === 'pendiente' && (
                  <p style={{ color: '#999', fontSize: '12px', marginTop: '16px' }}>
                    ⏳ El proceso de verificación puede tomar hasta 24 horas.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </StoreLayout>
    </>
  );
}