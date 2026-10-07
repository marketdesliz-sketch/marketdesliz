// src/pages/vender-con-marketdesliz/pasos/04/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Check, ShieldCheck, ChevronRight, MessageSquare, Rocket, Info,
  FileText, GraduationCap, ClipboardCheck, UserCheck, Lock, AlertCircle,
  ClipboardList, CalendarDays, Users, CircleCheck, UserCog, UserPlus
} from 'lucide-react';
import HeaderSimple from '../../../../components/Header';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

export default function Paso04Aceptacion() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ─── Auth, validaciones y auto-aceptación ──────────────
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

      // Validaciones de pasos previos
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

      // Si ya avanzó más allá del paso 4, redirigir al actual
      if (sol.pasoActual > 4) {
        router.replace(`/vender-con-marketdesliz/pasos/${String(sol.pasoActual).padStart(2, '0')}`);
        return;
      }

      // ─── Auto-aceptación (idempotente) ─────────────────
      // Solo se ejecuta si aún no está marcado como aceptado.
      // Si el usuario recarga la página, no se repite el update.
      if (!sol.aceptado) {
        try {
          await guardarProgreso({
            aceptado: true,
            fechaAceptacion: new Date().toISOString(),
            pasoActual: 5,
          });
          // Refrescar solicitud en memoria
          const solActualizada = await getMiSolicitud();
          setSolicitud(solActualizada);
        } catch (err) {
          console.error('Error aceptando solicitud:', err);
          setError('Error al procesar tu aceptación. Intenta de nuevo.');
        }
      }

      setLoading(false);
    };

    checkUser();

    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [router]);

  // ─── Ir al paso 05 ─────────────────────────────────────
  const irAlPaso05 = () => {
    router.push('/vender-con-marketdesliz/pasos/05');
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
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-700 text-sm font-medium">Procesando tu aceptación...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Paso 04: Aceptación — Vender con MarketDesliz</title>
        <meta name="description" content="Tu solicitud fue aceptada. Continúa con tu alta." />
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

            <ProgressSteps stepActual={4} />

            {/* ─── HERO ─────────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-4">

              {/* Columna izquierda */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Aceptación
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight text-gray-900">
                    Tu solicitud <br />
                    <span className="text-primary">puede continuar.</span>
                  </h1>
                  <p className="max-w-md text-lg text-gray-700 font-medium">
                    Queremos que formes parte del proceso de vendedores de MarketDesliz.
                  </p>
                </div>

                {/* Card checklist */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 space-y-4">
                    {[
                      'Entrevista revisada',
                      'Disponibilidad compatible',
                      'Aceptado para continuar',
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-900">
                            <Check className="h-4 w-4 stroke-[3px]" />
                          </div>
                          <span className="font-semibold text-gray-800">{item}</span>
                        </div>
                        <Check className="h-5 w-5 text-gray-900 stroke-[3px]" />
                      </div>
                    ))}

                    {/* Info box */}
                    <div className="mt-6 flex items-start gap-4 rounded-2xl bg-gray-900 p-5 text-white">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        Aún falta completar tu alta y capacitación antes de comenzar a vender.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Imagen */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center p-8">
                  <img
                    className="w-full h-full object-contain drop-shadow-2xl"
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_b89c2d5a85_5126aa9dd91f77e3.png"
                    alt="Gafete MarketDesliz"
                  />
                </div>
              </div>
            </section>

            {/* ─── ERROR ─────────────────────────────────── */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            {/* ─── LO QUE SIGUE ──────────────────────────── */}
            <section className="mt-12 space-y-6">
              <h2 className="text-2xl font-black text-gray-900">Lo que sigue</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    step: '05',
                    title: 'Alta',
                    desc: 'Entrega tus documentos y realiza la cuota de alta de $100.',
                    icon: FileText,
                  },
                  {
                    step: '06',
                    title: 'Capacitación',
                    desc: 'Recibe tu uniforme y guion. Aprende el proceso de venta.',
                    icon: GraduationCap,
                  },
                  {
                    step: '07',
                    title: 'Evaluación',
                    desc: 'Practica con un capacitador para confirmar que estás listo para vender.',
                    icon: ClipboardCheck,
                  },
                  {
                    step: '08',
                    title: 'Activación',
                    desc: 'Recibe tu gafete y acceso como vendedor activo de MarketDesliz.',
                    icon: UserCheck,
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="relative rounded-2xl bg-white border border-gray-200 p-6 text-center shadow-sm transition-all hover:shadow-md hover:border-gray-900 hover:-translate-y-1"
                    >
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 relative">
                        <Icon className="h-7 w-7" />
                        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-black text-gray-900 shadow-sm border border-gray-200">
                          {item.step}
                        </span>
                      </div>
                      <h3 className="mb-2 text-base font-bold text-gray-900">{item.title}</h3>
                      <p className="text-xs leading-relaxed text-gray-700 font-medium">
                        {item.desc.includes('$100') ? (
                          <>
                            {item.desc.split('$100')[0]}
                            <span className="font-bold text-gray-900">$100</span>
                            {item.desc.split('$100')[1]}
                          </>
                        ) : (
                          item.desc
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── CTA BANNER ───────────────────────────── */}
            <section className="mt-8 bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-900">
                    <Rocket className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-gray-900">
                      Estás a un paso de comenzar.
                    </h3>
                    <p className="text-sm font-medium text-gray-700">
                      Completa tu alta para seguir avanzando en el proceso.
                    </p>
                  </div>
                </div>
                <button
                  onClick={irAlPaso05}
                  className="h-14 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white px-8 text-base font-bold flex items-center gap-2 border-2 border-gray-900 shadow-lg shadow-gray-900/20 transition-all active:scale-[0.98] shrink-0"
                >
                  Comenzar mi alta
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </section>

            {/* ─── SOPORTE ──────────────────────────────── */}
            <section className="mt-2 flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 text-center md:text-left">
                  <h4 className="font-bold text-gray-900">¿Tienes dudas?</h4>
                  <p className="text-xs text-gray-600 font-medium">
                    Puedes contactarnos en cualquier momento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/contacto')}
                className="h-12 rounded-xl border-2 border-gray-200 px-6 font-bold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Contactar soporte
              </button>
            </section>

            {/* ─── FOOTER ───────────────────────────────── */}
            <footer className="py-8 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Lock size={16} />
                <div className="text-[11px] font-medium">
                  <p className="font-bold text-gray-800">Tu información está protegida.</p>
                  <p className="text-gray-700">Usamos tus datos solo para el proceso de selección.</p>
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-gray-900">
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

function ProgressSteps({ stepActual = 4 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm overflow-x-auto">
      <div className="flex items-center justify-between gap-2 min-w-[720px]">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === stepActual;
          const isCompleted = step.id < stepActual;
          return (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900 ring-4 ring-gray-900/15 shadow-lg shadow-gray-900/20 scale-110'
                      : isCompleted
                      ? 'bg-white text-gray-900 border-gray-900'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                >
                  {isCompleted ? <Check size={20} className="stroke-[3px]" /> : <Icon size={20} />}
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? 'text-gray-900'
                      : isCompleted
                      ? 'text-gray-800'
                      : 'text-gray-500'
                  }`}>
                    Paso {step.id}
                  </p>
                  <p className={`text-[10px] font-semibold pb-1 ${
                    isActive
                      ? 'text-gray-900 underline underline-offset-4 decoration-2 decoration-gray-900'
                      : isCompleted
                      ? 'text-gray-700'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-shrink-0 w-6 rounded-full ${
                  step.id < stepActual ? 'bg-gray-900' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}