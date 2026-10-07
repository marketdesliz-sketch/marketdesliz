// src/pages/vender-con-marketdesliz/pasos/06/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  CheckCircle2, Info, FileText, Lock, MessageCircle, EyeOff, Users,
  Ear, ShieldCheck, BarChart3, Trophy, ArrowRight, Brain, AlertCircle,
  Check, ClipboardList, CalendarDays, CircleCheck, GraduationCap,
  UserCog, UserPlus
} from 'lucide-react';
import HeaderSimple from '../../../../components/Header';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

export default function Paso06Capacitacion() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
      if (!sol.altaCompletada) {
        router.replace('/vender-con-marketdesliz/pasos/05');
        return;
      }

      // Si ya avanzó más allá del paso 6, redirigir al actual
      if (sol.pasoActual > 6) {
        router.replace(`/vender-con-marketdesliz/pasos/${String(sol.pasoActual).padStart(2, '0')}`);
        return;
      }

      setLoading(false);
    };

    checkUser();

    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [router]);

  // ─── Continuar ─────────────────────────────────────────
  const continuar = async () => {
    if (!user) {
      setShowLoginDropdown(true);
      return;
    }

    setGuardando(true);
    setError('');

    try {
      await guardarProgreso({
        capacitacionCompletada: true,
        fechaCapacitacion: new Date().toISOString(),
        pasoActual: 7,
      });

      router.push('/vender-con-marketdesliz/pasos/07');
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
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-700 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Paso 06: Capacitación — Vender con MarketDesliz</title>
        <meta name="description" content="Prepárate para vender: uniforme, guion y objeciones." />
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

            <ProgressSteps stepActual={6} />

            {/* SECTION 1: HEADER & UNIFORME */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <span className="inline-block bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider">
                  06 • Capacitación
                </span>
                <h1 className="text-4xl md:text-5xl font-black leading-tight text-gray-900">
                  Ahora vamos a <span className="text-primary">prepararte.</span>
                </h1>
                <p className="text-lg text-gray-700 font-medium leading-relaxed max-w-sm">
                  Antes de salir a vender debes conocer a fondo el proceso de
                  MarketDesliz y aprender tu guion de ventas.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                <div className="p-0 flex h-full flex-col sm:flex-row">
                  <div className="w-full sm:w-1/2 p-8 flex items-center justify-center bg-white">
                    <img
                      className="w-full h-auto object-contain"
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_8b73008ec9_4d5be40947b5bb34.png"
                      alt="Camisa profesional con logo de MarketDesliz"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 p-8 space-y-6 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white border border-gray-200 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-gray-900 rounded-md flex items-center justify-center">
                          <div className="w-3 h-3 bg-gray-900 rounded-sm"></div>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl text-gray-900 leading-tight">
                        Tu uniforme profesional
                      </h3>
                    </div>

                    <ul className="space-y-4">
                      <li className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gray-900 shrink-0" />
                        <p className="text-sm text-gray-700 font-medium">
                          <span className="font-bold text-gray-900">Tú traes:</span>
                          <br />
                          Camisa blanca de manga larga, limpia y en buenas
                          condiciones.
                        </p>
                      </li>
                      <li className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gray-900 shrink-0" />
                        <p className="text-sm text-gray-700 font-medium">
                          <span className="font-bold text-gray-900">MarketDesliz agrega:</span>
                          <br />
                          Identidad, logo y elementos correspondientes del uniforme.
                        </p>
                      </li>
                    </ul>

                    <div className="flex gap-3 p-4 bg-white border border-gray-200 rounded-2xl items-start">
                      <Info className="w-5 h-5 text-gray-900 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-700 leading-normal font-medium">
                        Una vez preparado, deberás utilizar tu uniforme durante cada
                        jornada de venta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: MATERIALES */}
            <section className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-900 shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    Tus materiales de capacitación
                  </h2>
                  <p className="text-gray-700 font-medium">
                    Recibirás dos archivos que deberás aprender y dominar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card 1: Guion */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200 flex flex-col">
                  <div className="p-8 flex items-start gap-6 border-b border-gray-200">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6 text-gray-900" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 rounded-lg flex items-center justify-center text-[10px] font-bold text-white">
                        01
                      </div>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          Guion oficial de ventas
                        </h4>
                        <p className="text-sm text-gray-700 mt-1 font-medium">
                          Guion completo de MarketDesliz paso a paso, de inicio a cierre.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-full w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[11px] font-bold">Archivo entregado</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-900">
                        <div className="text-[10px] font-black leading-none">PDF</div>
                      </div>
                      <span className="text-[9px] text-gray-600 font-bold uppercase">
                        Guion_MarketDesliz.pdf
                      </span>
                      <a
                        href="/docs/Guion_MarketDesliz.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 rounded-xl border-2 border-gray-200 text-gray-900 font-bold text-xs gap-2 px-4 mt-2 flex items-center hover:border-gray-900 transition"
                      >
                        Abrir guion <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </a>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-100 text-center rounded-b-2xl">
                    <p className="text-xs font-bold text-gray-900">
                      Debes aprenderlo de memoria.
                    </p>
                  </div>
                </div>

                {/* Card 2: Objeciones */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200 flex flex-col">
                  <div className="p-8 flex items-start gap-6 border-b border-gray-200">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6 text-gray-900" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 rounded-lg flex items-center justify-center text-[10px] font-bold text-white">
                        02
                      </div>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          Manual de objeciones
                        </h4>
                        <p className="text-sm text-gray-700 mt-1 font-medium">
                          Todas las objeciones que puedes encontrar y cómo
                          responderlas correctamente.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-full w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[11px] font-bold">Archivo entregado</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-900">
                        <div className="text-[10px] font-black leading-none">PDF</div>
                      </div>
                      <span className="text-[9px] text-gray-600 font-bold uppercase">
                        Objeciones_MarketDesliz.pdf
                      </span>
                      <a
                        href="/docs/Objeciones_MarketDesliz.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 rounded-xl border-2 border-gray-200 text-gray-900 font-bold text-xs gap-2 px-4 mt-2 flex items-center hover:border-gray-900 transition"
                      >
                        Abrir objeciones <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </a>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-100 text-center rounded-b-2xl">
                    <p className="text-xs font-bold text-gray-900">
                      Debes estudiarlo y comprenderlo.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: SKILLS */}
            <section className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm space-y-10">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-900 shrink-0">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    No basta con memorizarlo.
                  </h2>
                  <p className="text-gray-700 font-medium mt-1">
                    Memoriza las palabras. Domina la intención. Hazlo sonar natural.
                  </p>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-6">
                    Durante tu evaluación, el capacitador comprobará que:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
                {[
                  { icon: MessageCircle, label: 'Dominas el guion completo' },
                  { icon: EyeOff, label: 'No dependes de leerlo' },
                  { icon: Users, label: 'Hablas con naturalidad' },
                  { icon: Ear, label: 'Sabes escuchar' },
                  { icon: ShieldCheck, label: 'Puedes responder objeciones' },
                  { icon: BarChart3, label: 'Mantienes el control' },
                  { icon: FileText, label: 'Conoces el proceso de registro de venta' },
                ].map((skill, i) => {
                  const Icon = skill.icon;
                  return (
                    <div
                      key={i}
                      className="bg-white p-6 flex flex-col items-center text-center space-y-4"
                    >
                      <div className="text-gray-700">
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-900 leading-tight px-1">
                        {skill.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ERROR */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            {/* SECTION 4: READY CTA */}
            <section className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center text-white relative overflow-hidden shrink-0">
                  <Brain className="w-10 h-10" />
                  <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    ¿Ya estás preparado?
                  </h2>
                  <p className="text-sm text-gray-700 font-medium mt-2 max-w-sm leading-relaxed">
                    Cuando hayas aprendido el guion y estudiado las objeciones,
                    solicita tu evaluación presencial con un capacitador de
                    MarketDesliz.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={continuar}
                  disabled={guardando}
                  className={`rounded-2xl h-14 px-10 text-base font-bold gap-3 flex items-center transition-all shrink-0 border-2 ${
                    guardando
                      ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800 text-white border-gray-900 shadow-lg shadow-gray-900/20 group active:scale-[0.98]'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Estoy listo para mi evaluación
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <div className="space-y-1 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">
                      No necesitas pagar nada desde esta página.
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium">
                    El pago se realiza el día de tu evaluación presencial.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 5: FOOTER NOTE */}
            <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-900 shadow-sm shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-900 font-bold">
                  Recuerda: tu éxito como vendedor depende de tu preparación.
                  <br />
                  <span className="text-gray-700 font-medium">
                    Mientras mejor domines el guion, más confianza tendrás y mejores
                    resultados obtendrás.
                  </span>
                </p>
              </div>

              <div className="hidden md:flex items-center gap-6 opacity-20 relative z-10">
                <BarChart3 className="w-12 h-12 text-gray-900" />
                <Trophy className="w-12 h-12 text-gray-900" />
              </div>

              <div className="absolute right-0 bottom-0 pointer-events-none">
                <svg width="200" height="80" viewBox="0 0 200 80" fill="none">
                  <path
                    d="M0 80C50 40 150 40 200 80"
                    stroke="currentColor"
                    className="text-gray-400"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                  />
                </svg>
              </div>
            </section>

            {/* FOOTER */}
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

function ProgressSteps({ stepActual = 6 }) {
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