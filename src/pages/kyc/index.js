// src/pages/kyc/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ShieldCheck, Upload, FileText, Camera, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function KYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState({
    idFront: null,
    idBack: null,
    foto: null
  });

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    const currentUser = pb.authStore.model;
    setUser(currentUser);
  }, [router]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe exceder los 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes (JPG, PNG)');
        return;
      }
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Debes iniciar sesión');
      router.push('/solicitar');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('estado', 'pendiente');
      formData.append('fechaEnvio', new Date().toISOString());
      formData.append('fechaSolicitud', new Date().toISOString());
      
      if (files.idFront) formData.append('idFront', files.idFront);
      if (files.idBack) formData.append('idBack', files.idBack);
      if (files.foto) formData.append('foto', files.foto);

      await pb.collection('kyc_verifications').create(formData);
      
      alert('✅ Documentos enviados correctamente. Revisaremos tu información.');
      router.push('/kyc/estado');
      
    } catch (error) {
      console.error('Error:', error);
      if (error.data?.data) {
        const errores = Object.entries(error.data.data)
          .map(([campo, info]) => `${campo}: ${info.message}`)
          .join(', ');
        alert(`Error: ${errores}`);
      } else {
        alert('Error al enviar documentos. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Verificación KYC | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-32 pb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Verificación de identidad</h1>
                <p className="text-sm text-gray-400">Necesitamos verificar tu identidad para que puedas unirte a tandas</p>
              </div>
            </div>

            {/* Steps */}
            <div className="flex justify-between mb-8">
              {[
                { num: 1, label: "INE", icon: FileText },
                { num: 2, label: "Selfie", icon: Camera },
                { num: 3, label: "Confirmar", icon: CheckCircle }
              ].map(({ num, label, icon: Icon }) => (
                <div key={num} className="flex-1 text-center">
                  <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all ${
                    step >= num 
                      ? 'bg-[#6C3BFF] text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <p className={`text-xs font-semibold mt-2 ${
                    step >= num ? 'text-[#6C3BFF]' : 'text-gray-400'
                  }`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Step 1 - INE */}
            {step === 1 && (
              <>
                <div className="flex items-start gap-3 p-4 bg-[#6C3BFF]/5 border border-[#6C3BFF]/15 rounded-xl mb-6">
                  <FileText size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">Sube fotos claras de tu INE (credencial de elector) por ambos lados.</p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${
                    files.idFront 
                      ? 'border-[#10b981] bg-[#10b981]/5' 
                      : 'border-gray-200 hover:border-[#6C3BFF] hover:bg-[#6C3BFF]/5'
                  }`}
                  onClick={() => document.getElementById('idFront').click()}
                >
                  <input type="file" id="idFront" accept="image/*" onChange={(e) => handleFileChange(e, 'idFront')} className="hidden" />
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">INE - Frente</p>
                  <p className="text-xs text-gray-400 mt-1">Click para seleccionar</p>
                  {files.idFront && <p className="text-xs text-[#10b981] mt-2">✅ {files.idFront.name}</p>}
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-6 ${
                    files.idBack 
                      ? 'border-[#10b981] bg-[#10b981]/5' 
                      : 'border-gray-200 hover:border-[#6C3BFF] hover:bg-[#6C3BFF]/5'
                  }`}
                  onClick={() => document.getElementById('idBack').click()}
                >
                  <input type="file" id="idBack" accept="image/*" onChange={(e) => handleFileChange(e, 'idBack')} className="hidden" />
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">INE - Reverso</p>
                  <p className="text-xs text-gray-400 mt-1">Click para seleccionar</p>
                  {files.idBack && <p className="text-xs text-[#10b981] mt-2">✅ {files.idBack.name}</p>}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!files.idFront || !files.idBack}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Continuar <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Step 2 - Selfie */}
            {step === 2 && (
              <>
                <div className="flex items-start gap-3 p-4 bg-[#6C3BFF]/5 border border-[#6C3BFF]/15 rounded-xl mb-6">
                  <Camera size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">Toma una selfie sosteniendo tu INE frente a tu cara.</p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-6 ${
                    files.foto 
                      ? 'border-[#10b981] bg-[#10b981]/5' 
                      : 'border-gray-200 hover:border-[#6C3BFF] hover:bg-[#6C3BFF]/5'
                  }`}
                  onClick={() => document.getElementById('foto').click()}
                >
                  <input type="file" id="foto" accept="image/*" onChange={(e) => handleFileChange(e, 'foto')} className="hidden" />
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">Selfie con INE</p>
                  <p className="text-xs text-gray-400 mt-1">Click para seleccionar</p>
                  {files.foto && <p className="text-xs text-[#10b981] mt-2">✅ {files.foto.name}</p>}
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!files.foto}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors mb-3"
                >
                  Continuar <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Volver
                </button>
              </>
            )}

            {/* Step 3 - Confirmar */}
            {step === 3 && (
              <>
                <div className="flex items-start gap-3 p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl mb-6">
                  <CheckCircle size={16} className="text-[#10b981] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#166534]">Revisa que los documentos sean legibles antes de enviar.</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                      <FileText size={12} /> INE Frontal:
                    </span>
                    <span className="text-xs font-medium text-gray-900">{files.idFront?.name || 'No seleccionado'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                      <FileText size={12} /> INE Reverso:
                    </span>
                    <span className="text-xs font-medium text-gray-900">{files.idBack?.name || 'No seleccionado'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                      <Camera size={12} /> Selfie:
                    </span>
                    <span className="text-xs font-medium text-gray-900">{files.foto?.name || 'No seleccionado'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Asegúrate que las fotos sean claras. Documentos ilegibles serán rechazados.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-colors mb-3"
                >
                  {loading ? '⏳ Enviando documentos...' : '📤 Enviar documentos'}
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Volver
                </button>
              </>
            )}
          </div>
        </div>
      </StoreLayout>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}