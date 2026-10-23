// src/pages/kyc/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ShieldCheck, Upload, FileText, Camera, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

export default function KYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [files, setFiles] = useState({
    idFront: null,
    idBack: null,
    foto: null
  });

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/');
      return;
    }
    setUser(pb.authStore.model);
  }, [router]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe exceder los 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG)');
      return;
    }
    
    setError('');
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('estado', 'pendiente');
      formData.append('fechaEnvio', new Date().toISOString());
      formData.append('fechaSolicitud', new Date().toISOString());
      
      if (files.idFront) formData.append('idFront', files.idFront);
      if (files.idBack) formData.append('idBack', files.idBack);
      if (files.foto) formData.append('foto', files.foto);

      await pb.collection('kyc_verifications').create(formData);
      
      router.push('/kyc/estado');
      
    } catch (err) {
      console.error('Error:', err);
      if (err.data?.data) {
        const errores = Object.entries(err.data.data)
          .map(([campo, info]) => `${campo}: ${info.message}`)
          .join(', ');
        setError(`Error: ${errores}`);
      } else {
        setError('Error al enviar documentos. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: T.line, borderTopColor: T.accent }} />
      </div>
    );
  }

  return (
    <>
      <Head><title>Verificación KYC | MarketDesliz</title></Head>
      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/perfil" />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1 max-w-[800px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">
          
          {/* Hero Editorial */}
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center shrink-0" style={{ width: '48px', height: '48px', background: 'rgba(79, 46, 232, 0.06)', borderRadius: '8px' }}>
                <ShieldCheck size={22} style={{ color: T.accent }} />
              </div>
              <div>
                <h1 className="text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.025em]" style={{ color: T.ink, fontWeight: 400 }}>
                  Verificación de identidad
                </h1>
                <p className="text-[14px] mt-1" style={{ color: T.inkSoft }}>
                  Necesitamos verificar tu identidad para unirte a tandas.
                </p>
              </div>
            </div>
          </section>

          {/* Pasos */}
          <div className="flex justify-between items-center mb-10 px-4">
            {[
              { num: 1, label: "INE", icon: FileText },
              { num: 2, label: "Selfie", icon: Camera },
              { num: 3, label: "Confirmar", icon: CheckCircle }
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex-1 flex flex-col items-center relative">
                {/* Línea conectora */}
                {num < 3 && (
                  <div className="absolute top-[18px] left-[50%] w-full h-[1px]" style={{ background: step > num ? T.accent : T.line }} />
                )}
                
                <div 
                  className="relative z-10 flex items-center justify-center transition-colors"
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: step >= num ? T.accent : T.bg,
                    border: `1px solid ${step >= num ? T.accent : T.line}`
                  }}
                >
                  <Icon size={16} style={{ color: step >= num ? '#FFF' : T.inkFaint }} />
                </div>
                <p className="text-[11px] uppercase tracking-[0.15em] mt-3" style={{ color: step >= num ? T.ink : T.inkFaint, fontWeight: 500 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Tarjeta Principal */}
          <div className="p-6 md:p-10" style={{ background: T.bg, border: `1px solid ${T.line}`, borderRadius: '12px' }}>
            
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4" style={{ background: 'rgba(197, 48, 48, 0.05)', borderRadius: '8px' }}>
                <AlertCircle size={16} style={{ color: T.red, flexShrink: 0, marginTop: 2 }} />
                <p className="text-[13px]" style={{ color: T.red }}>{error}</p>
              </div>
            )}

            {/* PASO 1: INE */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: T.inkFaint }}>Paso 1 de 3</p>
                  <h2 className="text-[20px]" style={{ color: T.ink, fontWeight: 500 }}>Sube tu INE</h2>
                  <p className="text-[13.5px] mt-1" style={{ color: T.inkSoft }}>Asegúrate de que las fotos sean claras y legibles.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {['idFront', 'idBack'].map((type) => (
                    <div 
                      key={type}
                      onClick={() => document.getElementById(type).click()}
                      className="cursor-pointer transition-colors flex flex-col items-center justify-center p-8"
                      style={{ 
                        border: `1px dashed ${files[type] ? T.green : T.line}`, 
                        background: files[type] ? 'rgba(26, 127, 75, 0.02)' : 'transparent',
                        borderRadius: '8px'
                      }}
                    >
                      <input type="file" id={type} accept="image/*" onChange={(e) => handleFileChange(e, type)} className="hidden" />
                      {files[type] ? <CheckCircle size={24} style={{ color: T.green, marginBottom: 12 }} /> : <Upload size={24} style={{ color: T.inkFaint, marginBottom: 12 }} />}
                      <p className="text-[13.5px]" style={{ color: files[type] ? T.green : T.ink, fontWeight: 500 }}>
                        INE {type === 'idFront' ? 'Frente' : 'Reverso'}
                      </p>
                      <p className="text-[11px] mt-1 text-center line-clamp-1" style={{ color: T.inkFaint }}>
                        {files[type] ? files[type].name : 'Haz clic para subir'}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!files.idFront || !files.idBack}
                  className="w-full h-12 flex items-center justify-center gap-2 text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: T.accent, color: '#FFF', borderRadius: '6px', fontWeight: 500 }}
                >
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* PASO 2: Selfie */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: T.inkFaint }}>Paso 2 de 3</p>
                  <h2 className="text-[20px]" style={{ color: T.ink, fontWeight: 500 }}>Tómate una selfie</h2>
                  <p className="text-[13.5px] mt-1" style={{ color: T.inkSoft }}>Sostén tu INE junto a tu rostro. Asegúrate de tener buena iluminación.</p>
                </div>

                <div 
                  onClick={() => document.getElementById('foto').click()}
                  className="cursor-pointer transition-colors flex flex-col items-center justify-center p-10 mb-8"
                  style={{ 
                    border: `1px dashed ${files.foto ? T.green : T.line}`, 
                    background: files.foto ? 'rgba(26, 127, 75, 0.02)' : 'transparent',
                    borderRadius: '8px'
                  }}
                >
                  <input type="file" id="foto" accept="image/*" onChange={(e) => handleFileChange(e, 'foto')} className="hidden" />
                  {files.foto ? <CheckCircle size={32} style={{ color: T.green, marginBottom: 16 }} /> : <Camera size={32} style={{ color: T.inkFaint, marginBottom: 16 }} />}
                  <p className="text-[14px]" style={{ color: files.foto ? T.green : T.ink, fontWeight: 500 }}>
                    Selfie con INE
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: T.inkFaint }}>
                    {files.foto ? files.foto.name : 'Haz clic para subir'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 flex items-center justify-center gap-2 text-[13px]"
                    style={{ background: 'transparent', border: `1px solid ${T.line}`, color: T.inkMid, borderRadius: '6px', fontWeight: 500 }}
                  >
                    <ChevronLeft size={16} /> Volver
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!files.foto}
                    className="flex-1 h-12 flex items-center justify-center gap-2 text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: T.accent, color: '#FFF', borderRadius: '6px', fontWeight: 500 }}
                  >
                    Continuar <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Confirmar */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: T.inkFaint }}>Paso 3 de 3</p>
                  <h2 className="text-[20px]" style={{ color: T.ink, fontWeight: 500 }}>Confirma tus documentos</h2>
                  <p className="text-[13.5px] mt-1" style={{ color: T.inkSoft }}>Revisa que hayas subido los archivos correctos antes de enviar.</p>
                </div>

                <div className="space-y-2 mb-8">
                  {[
                    { label: 'INE Frontal', file: files.idFront },
                    { label: 'INE Reverso', file: files.idBack },
                    { label: 'Selfie con INE', file: files.foto }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4" style={{ background: 'rgba(15,15,15,0.02)', borderRadius: '6px' }}>
                      <span className="text-[13px]" style={{ color: T.inkSoft }}>{item.label}</span>
                      <span className="text-[12px] font-medium truncate max-w-[200px]" style={{ color: T.ink }}>{item.file?.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 h-12 flex items-center justify-center gap-2 text-[13px]"
                    style={{ background: 'transparent', border: `1px solid ${T.line}`, color: T.inkMid, borderRadius: '6px', fontWeight: 500 }}
                  >
                    <ChevronLeft size={16} /> Volver
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 h-12 flex items-center justify-center gap-2 text-[13px] transition-colors disabled:opacity-50"
                    style={{ background: T.accent, color: '#FFF', borderRadius: '6px', fontWeight: 500 }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : 'Enviar documentos'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer variant="minimal" />
      </div>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </>
  );
}