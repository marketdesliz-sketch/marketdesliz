// src/pages/kyc/estado.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Clock, CheckCircle, XCircle, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { getClientKYC } from '../../lib/kycService';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

export default function KYCStatusPage() {
  const router = useRouter();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/');
      return;
    }
    cargarKYC(pb.authStore.model.id);
  }, [router]);

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
        Icon: AlertCircle, color: T.inkMid, bg: 'rgba(15, 15, 15, 0.04)',
        title: 'Verificación pendiente',
        message: 'Aún no has enviado tus documentos de verificación.',
        action: 'Enviar documentos', link: '/kyc'
      };
    }

    switch (kyc.estado) {
      case 'pendiente':
        return {
          Icon: Clock, color: '#B8820E', bg: 'rgba(184, 130, 14, 0.08)',
          title: 'Documentos en revisión',
          message: 'Nuestro equipo está revisando tu información. Te notificaremos cuando esté listo.',
          action: null, link: null
        };
      case 'aprobado':
        return {
          Icon: CheckCircle, color: T.green, bg: 'rgba(26, 127, 75, 0.08)',
          title: '¡Identidad verificada!',
          message: 'Ya puedes unirte a tandas y disfrutar de todos los beneficios.',
          action: 'Ver tandas', link: '/tandas'
        };
      case 'rechazado':
        return {
          Icon: XCircle, color: T.red, bg: 'rgba(197, 48, 48, 0.08)',
          title: 'Documentos rechazados',
          message: kyc.motivoRechazo || kyc.notas || 'Tus documentos no fueron aprobados.',
          action: 'Reintentar', link: '/kyc'
        };
      default:
        return {
          Icon: AlertCircle, color: T.inkMid, bg: 'rgba(15, 15, 15, 0.04)',
          title: 'Estado desconocido',
          message: 'Contacta a soporte para más información.',
          action: 'Soporte', link: '/soporte'
        };
    }
  };

  const info = getStatusInfo();
  const StatusIcon = info.Icon;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No disponible';
    return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: T.line, borderTopColor: T.accent }} />
      </div>
    );
  }

  return (
    <>
      <Head><title>Estado KYC | MarketDesliz</title></Head>
      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/perfil" />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">
          
          <section className="mb-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.28em] mb-4" style={{ color: T.inkFaint, fontWeight: 500 }}>
              Verificación KYC
            </p>
            <h1 className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em]" style={{ color: T.ink, fontWeight: 400 }}>
              Tu estado
              <span className="font-serif italic" style={{ color: T.inkMid }}> actual.</span>
            </h1>
          </section>

          <div className="p-8 md:p-10 text-center" style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: '12px' }}>
            
            <div 
              className="inline-flex items-center justify-center mx-auto mb-6"
              style={{ width: '64px', height: '64px', background: info.bg, borderRadius: '50%' }}
            >
              <StatusIcon size={32} style={{ color: info.color }} />
            </div>

            <h2 className="text-[20px] md:text-[24px] mb-2" style={{ color: T.ink, fontWeight: 500 }}>
              {info.title}
            </h2>
            <p className="text-[14px] leading-[1.6] max-w-sm mx-auto mb-8" style={{ color: T.inkSoft }}>
              {info.message}
            </p>

            {kyc && (
              <div className="text-left mb-8" style={{ background: 'rgba(15,15,15,0.02)', border: `1px solid ${T.line}`, borderRadius: '8px', padding: '20px' }}>
                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: T.line }}>
                  <span className="text-[12px] uppercase tracking-[0.1em]" style={{ color: T.inkFaint }}>Fecha de envío</span>
                  <span className="text-[13px] font-medium" style={{ color: T.ink }}>{formatDate(kyc.fechaEnvio || kyc.fechaSolicitud || kyc.created)}</span>
                </div>
                {kyc.fechaRevision && (
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: T.line }}>
                    <span className="text-[12px] uppercase tracking-[0.1em]" style={{ color: T.inkFaint }}>Fecha de revisión</span>
                    <span className="text-[13px] font-medium" style={{ color: T.ink }}>{formatDate(kyc.fechaRevision)}</span>
                  </div>
                )}
                {kyc.estado === 'rechazado' && kyc.motivoRechazo && (
                  <div className="pt-3 mt-1">
                    <span className="block text-[12px] uppercase tracking-[0.1em] mb-1" style={{ color: T.red }}>Motivo del rechazo</span>
                    <span className="block text-[13px] leading-relaxed" style={{ color: T.red }}>{kyc.motivoRechazo}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {info.link && (
                <button 
                  onClick={() => router.push(info.link)}
                  className="w-full h-12 flex items-center justify-center gap-2 text-[13px] text-white transition-colors"
                  style={{ background: T.accent, borderRadius: '6px', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = T.accentDeep}
                  onMouseLeave={e => e.currentTarget.style.background = T.accent}
                >
                  {info.action} <ChevronRight size={16} />
                </button>
              )}
              
              <button 
                onClick={() => router.push('/perfil')}
                className="w-full h-12 flex items-center justify-center text-[13px] transition-colors"
                style={{ background: 'transparent', border: `1px solid ${T.line}`, color: T.inkMid, borderRadius: '6px', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,15,15,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Volver a mi perfil
              </button>
            </div>

          </div>
        </main>
        <Footer variant="minimal" />
      </div>
    </>
  );
}