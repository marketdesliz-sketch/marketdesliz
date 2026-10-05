// src/pages/vender-con-marketdesliz/pasos/01/index.js
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Info, ShieldCheck, UserCheck, IdCard, Home, Wallet,
  Calendar, Clock, Shirt, ClipboardList, CalendarDays, Users,
  CircleCheck, FileText, GraduationCap, UserCog, UserPlus,
  ClipboardCheck, Lock, AlertCircle,
  Briefcase, Code, Headphones, Megaphone, Palette, Sparkles
} from 'lucide-react';
import HeaderSimple from '../../../../components/Header';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

export default function Paso01Requisitos() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [aceptaRequisitos, setAceptaRequisitos] = useState(false);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingContinuar, setPendingContinuar] = useState(false);

  // ─── checkUser (reutilizable) ───────────────────────
  const checkUser = useCallback(async () => {
    const currentUser = pb.authStore.model;
    setUser(currentUser);

    if (currentUser) {
      const sol = await getMiSolicitud();
      setSolicitud(sol);

      if (sol?.aceptaRequisitos) setAceptaRequisitos(true);
      if (sol?.puesto) setPuestoSeleccionado(sol.puesto);

      if (sol?.pasoActual > 1) {
        router.replace(
          `/vender-con-marketdesliz/pasos/${String(sol.pasoActual).padStart(2, '0')}`
        );
        return;
      }
    }
    setLoading(false);
  }, [router]);

  // ─── Carga inicial ─────────────────────────────────
  useEffect(() => {
    checkUser();
    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [checkUser]);

  // ─── Auto-continuar tras login ──────────────────────
  useEffect(() => {
    if (pendingContinuar && user && !loading) {
      setPendingContinuar(false);
      continuar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingContinuar, user, loading]);

  // ─── Continuar ─────────────────────────────────────
  const continuar = async () => {
    // Si no hay usuario → abrir login y quedarse pendiente
    if (!user) {
      setPendingContinuar(true);
      setShowLoginDropdown(true);
      return;
    }

    if (!puestoSeleccionado) {
      setError('Debes seleccionar una vacante para continuar');
      return;
    }

    if (!aceptaRequisitos) {
      setError('Debes aceptar los requisitos para continuar');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      await guardarProgreso({
        puesto: puestoSeleccionado,
        aceptaRequisitos: true,
        fechaAceptaRequisitos: new Date().toISOString(),
        pasoActual: 2,
      });

      router.push('/vender-con-marketdesliz/pasos/02');
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Loading ───────────────────────────────────────
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
          onLoginSuccess={() => checkUser()}
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
        <title>Paso 01: Requisitos — Vender con MarketDesliz</title>
        <meta name="description" content="Requisitos para convertirte en vendedor de MarketDesliz." />
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
          onLoginSuccess={() => checkUser()}
        />

        <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
          <main className="flex flex-col gap-6">

            <ProgressSteps stepActual={1} />

            {/* HERO */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Requisitos
                </span>
                <h1 className="text-4xl md:text-5xl font-black mt-6 mb-6 leading-tight text-gray-900">
                  Antes de <span className="text-primary">comenzar</span>
                </h1>
                <p className="text-gray-700 text-lg font-medium leading-relaxed mb-8 max-w-md">
                  Estos son los requisitos y el proceso para convertirte en vendedor de MarketDesliz.
                </p>

                <div className="bg-primary/5 p-5 rounded-2xl flex gap-4 items-start border border-primary/10">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                    <Info size={16} />
                  </div>
                  <p className="text-gray-800 text-sm font-medium leading-relaxed">
                    Primero revisamos tu disponibilidad y capacidades. <br />
                    Si eres aceptado, continúas con tu alta y capacitación.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-[40px] rounded-br-[180px] overflow-hidden h-[420px] bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800"
                    className="w-full h-full object-cover"
                    alt="Vendedor Profesional"
                  />
                </div>

                <div className="absolute bottom-8 right-0 bg-white p-6 rounded-3xl shadow-2xl max-w-[260px] border border-gray-50">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-bold mb-2 text-gray-900">Nuestro objetivo</h3>
                  <p className="text-xs text-gray-700 font-medium leading-relaxed">
                    Formar vendedores que representen a MarketDesliz con profesionalismo, confianza y compromiso.
                  </p>
                </div>
              </div>
            </section>

            {/* REQUISITOS */}
            <section className="py-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <UserCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Necesitarás</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <RequirementCard icon={<IdCard size={20} />} title="Identificación oficial" desc="Copia legible de tu credencial vigente." />
                <RequirementCard icon={<Home size={20} />} title="Comprobante de domicilio" desc="Copia legible (no mayor a 3 meses)." />
                <RequirementCard icon={<Wallet size={20} />} title="Cuota de alta" value="$100" desc="Solo después de ser aceptado." />
                <RequirementCard icon={<Calendar size={20} />} title="Disponibilidad mínima" value="5 días" desc="De trabajo a la semana." />
                <RequirementCard icon={<Clock size={20} />} title="Horario definido" desc="Compromiso con tu jornada." />
                <RequirementCard icon={<Shirt size={20} />} title="Uniforme obligatorio" desc="Uso diario del kit MarketDesliz." />
              </div>
            </section>

            {/* VACANTES */}
            <section className="py-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Vacantes actuales</h2>
                  <p className="text-sm text-gray-700 font-medium mt-0.5">
                    Elige el área en la que deseas participar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VACANTES.map((v) => {
                  const Icon = v.icon;
                  const selected = puestoSeleccionado === v.title;
                  return (
                    <button
                      key={v.title}
                      type="button"
                      onClick={() => {
                        setPuestoSeleccionado(v.title);
                        if (error) setError('');
                      }}
                      className={`relative text-left p-5 rounded-3xl border-2 transition-all flex items-start gap-4 ${
                        selected
                          ? 'bg-primary/5 border-gray-900 shadow-md shadow-gray-900/10'
                          : 'bg-white border-gray-200 hover:border-gray-400 hover:-translate-y-0.5'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          selected ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-bold text-base leading-tight text-gray-900">
                          {v.title}
                        </h3>
                        <p className="text-xs font-medium mt-1 text-gray-700">
                          {v.detalle}
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          selected ? 'border-gray-900' : 'border-gray-400'
                        }`}
                      >
                        {selected && (
                          <div className="w-3.5 h-3.5 rounded-full bg-gray-900" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* CHECKBOX + CTA */}
            <section className="py-8">
              <div className="bg-primary/5 rounded-[40px] p-8 border border-primary/10">

                <div
                  role="checkbox"
                  aria-checked={aceptaRequisitos}
                  tabIndex={0}
                  onClick={() => {
                    setAceptaRequisitos((v) => !v);
                    if (error) setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setAceptaRequisitos((v) => !v);
                      if (error) setError('');
                    }
                  }}
                  className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition select-none ${
                    aceptaRequisitos
                      ? 'bg-white border-2 border-gray-900 shadow-sm'
                      : 'bg-white border-2 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      aceptaRequisitos ? 'border-gray-900' : 'border-gray-400'
                    }`}
                  >
                    {aceptaRequisitos && (
                      <div className="w-3.5 h-3.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">
                      Acepto cumplir con todos los requisitos
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      Confirmo que cuento con la documentación y disponibilidad necesarias para iniciar el proceso.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-sm font-medium">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mt-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-900 shadow-sm shrink-0 border border-gray-200">
                      <ClipboardCheck size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black mb-1 text-gray-900">
                        ¿Cumples con los requisitos?
                      </h2>
                      <p className="text-sm font-medium text-gray-700">
                        {!puestoSeleccionado
                          ? 'Selecciona una vacante para continuar.'
                          : !aceptaRequisitos
                          ? 'Acepta los requisitos para continuar.'
                          : 'El siguiente paso es elegir tu disponibilidad.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={continuar}
                    disabled={guardando}
                    className={`font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shrink-0 border-2 ${
                      guardando
                        ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800 text-white border-gray-900 shadow-lg shadow-gray-900/20'
                    }`}
                  >
                    {guardando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Siguiente'
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="py-8 border-t border-gray-100 flex items-center justify-between">
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

// ─── Vacantes disponibles ────────────────────────────────
const VACANTES = [
  { title: 'Desarrollador Web', detalle: 'Tiempo completo • Remoto', icon: Code },
  { title: 'Vendedor de Campo', detalle: 'Tiempo completo', icon: Briefcase },
  { title: 'Atención al Cliente', detalle: 'Tiempo completo • Híbrido', icon: Headphones },
  { title: 'Marketing Digital', detalle: 'Tiempo completo • Remoto', icon: Megaphone },
  { title: 'Diseñador UI/UX', detalle: 'Tiempo completo • Remoto', icon: Palette },
  { title: 'Otro', detalle: 'Cuéntanos tu propuesta', icon: Sparkles },
];

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

function ProgressSteps({ stepActual = 1 }) {
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
                  {isCompleted ? <CircleCheck size={20} /> : <Icon size={20} />}
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

function RequirementCard({ icon, title, value = null, desc = '' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 flex flex-col items-center text-center transition-all hover:border-gray-900 hover:-translate-y-1">
      <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-gray-700 mb-3 border border-gray-200">
        {icon}
      </div>
      <h4 className="text-[12px] font-bold mb-1 leading-tight text-gray-900">{title}</h4>
      {value && <p className="text-xl font-black text-gray-900 mb-1">{value}</p>}
      <p className="text-[10px] text-gray-600 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}