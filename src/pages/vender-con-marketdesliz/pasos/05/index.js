// src/pages/vender-con-marketdesliz/pasos/05/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Info, User, Phone, Mail, MapPin, SquarePen, IdCard, Check, Home,
  ArrowRight, GraduationCap, ChevronRight, Lock, AlertCircle,
  ClipboardList, CalendarDays, Users, CircleCheck, FileText,
  UserCog, UserPlus
} from 'lucide-react';
import HeaderSimple from '../../../../components/Header';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

const MAX_SIZE_MB = 5;
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'];

// ─── Sub-componentes ───────────────────────────────────────────────────
function DataRow({ icon, text, isBold = false }) {
  return (
    <div
      className={`flex items-center gap-3 text-sm ${
        isBold ? 'font-semibold text-gray-700' : 'text-muted-foreground font-medium'
      }`}
    >
      <span className="text-primary shrink-0">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function UploadCard({ label, listo, onUpload }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-primary/60 shrink-0">
        <IdCard size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{label}</p>
        {listo ? (
          <p className="text-xs font-bold text-green-600 flex items-center gap-1">
            <Check size={12} className="stroke-[3px]" /> Recibido
          </p>
        ) : (
          <>
            <label className="text-xs font-bold text-primary cursor-pointer hover:underline">
              Subir archivo
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
            <p className="text-[9px] text-gray-400">JPG, PNG o PDF • Máx. {MAX_SIZE_MB} MB</p>
          </>
        )}
      </div>
    </div>
  );
}

function StatusCard({ title, desc }) {
  return (
    <div className="bg-green-50 rounded-2xl p-5 border border-green-100 flex items-start gap-4">
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-green-200 text-green-500 shadow-sm mt-1 shrink-0">
        <Check size={14} className="stroke-[3px]" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-green-700">{title}</p>
        <p className="text-[10px] text-green-600 leading-tight mt-1">{desc}</p>
      </div>
    </div>
  );
}

function CheckRow({ icon, text, status, ok }) {
  return (
    <div className="flex items-center justify-between text-xs font-bold">
      <div className="flex items-center gap-3 text-gray-600">
        <span className="text-primary">{icon}</span> {text}
      </div>
      <span className={`${ok ? 'text-green-600' : 'text-gray-400'} font-medium text-[10px]`}>
        {ok ? `✓ ${status}` : status}
      </span>
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────
export default function Paso05Alta() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Archivos nuevos seleccionados
  const [frenteFile, setFrenteFile] = useState(null);
  const [reversoFile, setReversoFile] = useState(null);
  const [comprobanteFile, setComprobanteFile] = useState(null);

  // Estado "listo" (archivo nuevo o ya subido previamente)
  const [frenteListo, setFrenteListo] = useState(false);
  const [reversoListo, setReversoListo] = useState(false);
  const [comprobanteListo, setComprobanteListo] = useState(false);

  // ─── Auth & carga inicial ─────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = pb.authStore.model;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const sol = await getMiSolicitud();
      setSolicitud(sol);

      // Verificaciones de pasos previos
      if (!sol) {
        router.replace('/vender-con-marketdesliz/pasos/01');
        return;
      }
      if (!sol.aceptaRequisitos) {
        router.replace('/vender-con-marketdesliz/pasos/01');
        return;
      }
      if (!sol.diasDisponibles || sol.diasDisponibles.length < 5) {
        router.replace('/vender-con-marketdesliz/pasos/02');
        return;
      }
      if (!sol.entrevistaCompletada) {
        router.replace('/vender-con-marketdesliz/pasos/03');
        return;
      }
      if (!sol.aceptado) {
        router.replace('/vender-con-marketdesliz/pasos/04');
        return;
      }

      // Si ya avanzó más allá del paso 5, redirigir al actual
      if (sol.pasoActual > 5) {
        router.replace(`/vender-con-marketdesliz/pasos/${String(sol.pasoActual).padStart(2, '0')}`);
        return;
      }

      // Restaurar estados de archivos ya subidos
      if (sol.ineFrontal) setFrenteListo(true);
      if (sol.ineTrasero) setReversoListo(true);
      if (sol.comprobanteDomicilio) setComprobanteListo(true);

      setLoading(false);
    };

    checkUser();

    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [router]);

  // ─── Manejo de archivos ────────────────────────────────
  const handleFile = (tipo, file) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo no debe superar ${MAX_SIZE_MB} MB`);
      return;
    }
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }

    if (tipo === 'frente') { setFrenteFile(file); setFrenteListo(true); }
    if (tipo === 'reverso') { setReversoFile(file); setReversoListo(true); }
    if (tipo === 'comprobante') { setComprobanteFile(file); setComprobanteListo(true); }

    if (error) setError('');
  };

  // ─── Progreso ──────────────────────────────────────────
  const totalCompletos = [true, frenteListo, reversoListo, comprobanteListo].filter(Boolean).length;
  const expedienteCompleto = totalCompletos === 4;

  // ─── Continuar ─────────────────────────────────────────
  const continuar = async () => {
    if (!user) {
      setShowLoginDropdown(true);
      return;
    }

    if (!expedienteCompleto) {
      setError('Sube todos los documentos para continuar');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const fd = new FormData();
      if (frenteFile) fd.append('ineFrontal', frenteFile);
      if (reversoFile) fd.append('ineTrasero', reversoFile);
      if (comprobanteFile) fd.append('comprobanteDomicilio', comprobanteFile);
      fd.append('altaCompletada', 'true');
      fd.append('pasoActual', '6');

      await guardarProgreso(fd);

      router.push('/vender-con-marketdesliz/pasos/06');
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeaderSimple
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          unreadCount={0}
          navigateTo={(p) => router.push(p)}
          notifications={[]}
          showLoginDropdown={showLoginDropdown}
          setShowLoginDropdown={setShowLoginDropdown}
          onLoginSuccess={() => {
            const u = pb.authStore.model;
            setUser(u);
          }}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Paso 05: Alta — Vender con MarketDesliz</title>
        <meta name="description" content="Completa tu alta con tu documentación para continuar el proceso." />
      </Head>

      <div className="min-h-screen bg-background flex flex-col">
        <HeaderSimple
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          unreadCount={0}
          navigateTo={(p) => router.push(p)}
          notifications={[]}
          showLoginDropdown={showLoginDropdown}
          setShowLoginDropdown={setShowLoginDropdown}
          onLoginSuccess={() => {
            const u = pb.authStore.model;
            setUser(u);
          }}
        />

        <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
          <main className="flex flex-col gap-6">

            <ProgressSteps stepActual={5} />

            {/* HEADER */}
            <section className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-4">
              <div className="flex-1 space-y-4">
                <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  05 • Alta
                </span>
                <h1 className="text-4xl font-black text-gray-900 leading-tight">
                  Vamos a completar <br />
                  <span className="text-primary">tu alta.</span>
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                  Confirma tus datos y entrega la documentación necesaria para
                  preparar tu registro en MarketDesliz.
                </p>
                <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-2xl border border-primary/10">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Info size={14} className="text-white" />
                  </div>
                  <p className="text-[11px] text-primary font-medium">
                    Esta etapa no requiere ningún pago.
                  </p>
                </div>
              </div>
            </section>

            {/* 1. CONFIRMA TUS DATOS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-6">
                1. Confirma tus datos
              </h2>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/10 shadow-inner flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  <User size={40} className="text-gray-300" />
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  <DataRow
                    icon={<User size={16} />}
                    text={solicitud?.nombre || user?.nombre || 'Sin nombre'}
                    isBold
                  />
                  <DataRow
                    icon={<Phone size={16} />}
                    text={solicitud?.telefono || 'Sin teléfono'}
                  />
                  <DataRow
                    icon={<Mail size={16} />}
                    text={user?.email || 'Sin correo'}
                  />
                  <DataRow
                    icon={<MapPin size={16} />}
                    text={solicitud?.ciudad || 'Sin ciudad'}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/vender-con-marketdesliz/pasos/03')}
                  className="flex items-center gap-2 border border-primary/20 text-primary font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-primary/5 transition shrink-0"
                >
                  <SquarePen size={14} /> Editar información
                </button>
              </div>
            </div>

            {/* 2. IDENTIFICACIÓN OFICIAL */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                2. Identificación oficial
              </h2>
              <p className="text-xs text-gray-400 mb-6 font-medium">
                Copia de tu credencial (INE, pasaporte o cédula).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UploadCard
                  label="Frente"
                  listo={frenteListo}
                  onUpload={(file) => handleFile('frente', file)}
                />
                <UploadCard
                  label="Reverso"
                  listo={reversoListo}
                  onUpload={(file) => handleFile('reverso', file)}
                />
                {frenteListo && reversoListo ? (
                  <StatusCard
                    title="Identificación recibida"
                    desc="Frente y reverso completados correctamente."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200 flex items-center justify-center text-center">
                    <p className="text-[10px] text-gray-400 font-medium">
                      Sube ambos lados para continuar
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. COMPROBANTE DE DOMICILIO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                3. Comprobante de domicilio
              </h2>
              <p className="text-xs text-gray-400 mb-6 font-medium">
                Sube una copia legible de tu comprobante (no mayor a 3 meses).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-dashed border-primary/30 flex items-center justify-center gap-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                    {comprobanteListo ? <Check size={24} className="stroke-[3px]" /> : <Home size={24} />}
                  </div>
                  <div className="min-w-0">
                    {comprobanteListo ? (
                      <>
                        <p className="text-xs font-extrabold text-green-600">
                          Comprobante cargado
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Listo para revisión
                        </p>
                      </>
                    ) : (
                      <>
                        <label className="text-xs font-extrabold text-primary cursor-pointer hover:underline">
                          Subir comprobante
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFile('comprobante', file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          JPG, PNG o PDF • Máx. {MAX_SIZE_MB} MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {comprobanteListo ? (
                  <StatusCard
                    title="Comprobante recibido"
                    desc="Tu comprobante ha sido cargado correctamente."
                  />
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200 flex items-center justify-center text-center">
                    <p className="text-[10px] text-gray-400 font-medium">
                      Pendiente de subir
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. REVISIÓN DEL EXPEDIENTE */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
                <div className="flex-1 space-y-4 w-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">
                    4. Revisión del expediente
                  </h2>
                  <p className="text-xs text-gray-400 mb-6 font-medium">
                    Verificamos que toda tu información esté completa.
                  </p>
                  <div className="space-y-3">
                    <CheckRow
                      icon={<User size={16} />}
                      text="Datos personales"
                      status="Confirmados"
                      ok
                    />
                    <CheckRow
                      icon={<IdCard size={16} />}
                      text="Identificación frente"
                      status={frenteListo ? 'Recibida' : 'Pendiente'}
                      ok={frenteListo}
                    />
                    <CheckRow
                      icon={<IdCard size={16} />}
                      text="Identificación reverso"
                      status={reversoListo ? 'Recibida' : 'Pendiente'}
                      ok={reversoListo}
                    />
                    <CheckRow
                      icon={<Home size={16} />}
                      text="Comprobante de domicilio"
                      status={comprobanteListo ? 'Recibido' : 'Pendiente'}
                      ok={comprobanteListo}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center border border-gray-100 min-w-[200px]">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 transition-colors ${
                      expedienteCompleto ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <Check size={32} className="stroke-[3px]" />
                  </div>
                  <p className="text-2xl font-black text-primary">
                    {totalCompletos} de 4
                  </p>
                  <p className="text-[10px] font-extrabold text-primary/70 uppercase tracking-widest">
                    completos
                  </p>
                </div>
              </div>
              <div className="mt-8 bg-primary/5 p-3 rounded-2xl flex items-center gap-3 text-[10px] text-primary/70 font-medium">
                <Info size={14} className="shrink-0" />
                <p>
                  Tu información será utilizada para tu registro como vendedor
                  dentro de MarketDesliz.
                </p>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* FOOTER CTA */}
            <section className="bg-primary/5 border border-primary/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative shrink-0">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-primary">
                    <GraduationCap size={28} />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Tu expediente está{' '}
                    <span className="text-primary">
                      {expedienteCompleto ? 'completo.' : 'casi listo.'}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {expedienteCompleto
                      ? 'El siguiente paso es prepararte para vender.'
                      : 'Completa los documentos pendientes para continuar.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <button
                  onClick={continuar}
                  disabled={guardando || !expedienteCompleto}
                  className={`font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-4 transition shadow-xl ${
                    guardando || !expedienteCompleto
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Comenzar capacitación <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between group cursor-default">
                  <div>
                    <p className="text-[10px] font-black text-gray-800">
                      Lo que sigue •{' '}
                      <span className="text-primary uppercase">
                        06 Capacitación
                      </span>
                    </p>
                    <p className="text-[9px] text-gray-400 leading-tight mt-1 max-w-[180px]">
                      Recibirás tu uniforme y tu guion de ventas...
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-primary/30" />
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="py-8 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 text-gray-400">
                <Lock size={16} />
                <div className="text-[11px] font-medium">
                  <p className="font-bold text-gray-600">Tu información está protegida.</p>
                  <p>Usamos tus datos solo para el proceso de selección.</p>
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight">
                Market<span className="text-primary">Desliz</span>
              </div>
            </footer>

          </main>
        </div>
      </div>
    </>
  );
}

// ─── Progress Steps ──────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Requisitos', icon: ClipboardList },
  { id: 2, title: 'Disponibilidad', icon: CalendarDays },
  { id: 3, title: 'Entrevista', icon: Users },
  { id: 4, title: 'Aceptación', icon: CircleCheck },
  { id: 5, title: 'Alta', icon: FileText },
  { id: 6, title: 'Capacitación', icon: GraduationCap },
  { id: 7, title: 'Evaluación', icon: UserCog },
  { id: 8, title: 'Activación', icon: UserPlus },
];

function ProgressSteps({ stepActual = 5 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm overflow-x-auto">
      <div className="flex items-center justify-between gap-2 min-w-[720px]">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === stepActual;
          const isCompleted = step.id < stepActual;
          return (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-110'
                      : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check size={18} className="stroke-[3px]" /> : <Icon size={18} />}
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    Paso {step.id}
                  </p>
                  <p className={`text-[10px] font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-shrink-0 w-6 rounded-full ${step.id < stepActual ? 'bg-green-300' : 'bg-gray-100'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}