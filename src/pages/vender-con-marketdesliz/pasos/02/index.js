// src/pages/vender-con-marketdesliz/pasos/02/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Calendar, Clock, Info, Check, Lock, AlertCircle,
  ClipboardList, CalendarDays, Users, CircleCheck, FileText,
  GraduationCap, UserCog, UserPlus
} from 'lucide-react';
import HeaderSimple from '../../../../components/HeaderSimple';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

// ─── DÍAS DE LA SEMANA ──────────────────────────────────
const DIAS = [
  { key: 'L', label: 'Lunes' },
  { key: 'M1', label: 'Martes' },
  { key: 'M2', label: 'Miércoles' },
  { key: 'J', label: 'Jueves' },
  { key: 'V', label: 'Viernes' },
  { key: 'S', label: 'Sábado' },
  { key: 'D', label: 'Domingo' },
];

const HORAS_INICIO = ['08:00', '09:00', '10:00', '11:00'];
const HORAS_FIN = ['17:00', '18:00', '19:00', '20:00'];

export default function Paso02Disponibilidad() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [selectedDays, setSelectedDays] = useState(['L', 'M1', 'M2', 'J', 'V']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

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

      // Si no pasó el paso 1, lo devolvemos
      if (!sol) {
        router.replace('/vender-con-marketdesliz/pasos/01');
        return;
      }
      if (!sol.aceptaRequisitos) {
        router.replace('/vender-con-marketdesliz/pasos/01');
        return;
      }

      // Si ya avanzó más allá del paso 2, redirigimos al actual
      if (sol.pasoActual > 2) {
        router.replace(`/vender-con-marketdesliz/pasos/${String(sol.pasoActual).padStart(2, '0')}`);
        return;
      }

      // Restaurar datos si ya los había guardado
      if (sol.diasDisponibles && Array.isArray(sol.diasDisponibles) && sol.diasDisponibles.length > 0) {
        setSelectedDays(sol.diasDisponibles);
      }
      if (sol.horaInicio) setStartTime(sol.horaInicio);
      if (sol.horaFin) setEndTime(sol.horaFin);

      setLoading(false);
    };

    checkUser();

    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [router]);

  // ─── Toggle día ────────────────────────────────────────
  const toggleDay = (key) => {
    setSelectedDays(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
    if (error) setError('');
  };

  // ─── Continuar ─────────────────────────────────────────
  const continuar = async () => {
    if (!user) {
      setShowLoginDropdown(true);
      return;
    }

    if (selectedDays.length < 5) {
      setError('Debes seleccionar al menos 5 días para continuar');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      await guardarProgreso({
        diasDisponibles: selectedDays,
        horaInicio: startTime,
        horaFin: endTime,
        pasoActual: 3,
      });

      router.push('/vender-con-marketdesliz/pasos/03');
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

  const cumpleMinimo = selectedDays.length >= 5;

  return (
    <>
      <Head>
        <title>Paso 02: Disponibilidad — Vender con MarketDesliz</title>
        <meta name="description" content="Elige tus días y horarios de trabajo." />
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

            <ProgressSteps stepActual={2} />

            {/* TÍTULO */}
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  Disponibilidad
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-3">
                  ¿Cuándo puedes <span className="text-primary">trabajar</span>?
                </h1>
                <p className="text-gray-500 text-base">
                  Cuéntanos los días y horarios en los que puedes vender.<br />
                  Necesitas elegir mínimo 5 días a la semana.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex gap-4 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-white border border-primary/10 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-gray-600 font-medium">
                  Tu disponibilidad nos ayuda a asignarte zonas, productos y acompañamiento para que tengas éxito.
                </p>
              </div>
            </div>

            {/* DÍAS */}
            <section>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">1. Elige tus días de trabajo</h3>
                    <p className="text-xs text-gray-400 font-medium">Selecciona mínimo 5 días a la semana.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seleccionados</span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    cumpleMinimo ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-600'
                  }`}>
                    {selectedDays.length} días
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {DIAS.map((day) => {
                  const isSelected = selectedDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      onClick={() => toggleDay(day.key)}
                      type="button"
                      className={`h-28 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="text-center">
                        <span className={`text-xl font-extrabold block ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                          {day.key.charAt(0)}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isSelected ? 'text-primary/70' : 'text-gray-400'
                        }`}>
                          {day.label}
                        </span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* HORARIO */}
            <section>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">2. Establece tu horario</h3>
                  <p className="text-xs text-gray-400 font-medium">Indica el horario en el que podrás trabajar esos días.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M12 2v2"/><path d="M12 20v2"/>
                      <path d="m4.93 4.93 1.41 1.41"/>
                      <path d="m17.66 17.66 1.41 1.41"/>
                      <path d="M2 12h2"/><path d="M20 12h2"/>
                      <path d="m6.34 17.66-1.41 1.41"/>
                      <path d="m19.07 4.93-1.41 1.41"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Hora de inicio</span>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border-none bg-transparent text-2xl font-extrabold text-primary focus:outline-none cursor-pointer"
                    >
                      {HORAS_INICIO.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Hora de término</span>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border-none bg-transparent text-2xl font-extrabold text-primary focus:outline-none cursor-pointer"
                    >
                      {HORAS_FIN.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-gray-500">
                  Puedes ajustar tu horario más adelante si tu situación cambia.
                </p>
              </div>
            </section>

            {/* RESUMEN */}
            <section>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-sm opacity-50"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-sm opacity-50"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">3. Resumen de tu disponibilidad</h3>
                  <p className="text-xs text-gray-400 font-medium">Así quedará tu plan de trabajo semanal.</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-4">
                  {DIAS.map((day) => {
                    const isSelected = selectedDays.includes(day.key);
                    return (
                      <div
                        key={day.key}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl transition ${
                          isSelected ? 'bg-primary/5 border border-primary/10' : 'opacity-40'
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-[11px] font-bold text-gray-900 block">{day.label}</span>
                          <span className="text-[9px] font-bold text-gray-400">
                            {isSelected ? `${startTime} - ${endTime}` : 'No disponible'}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Días seleccionados</span>
                      <p className="text-xl font-extrabold text-primary leading-none">{selectedDays.length} días</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:pl-5 md:border-l border-gray-200">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Horario</span>
                      <p className="text-xl font-extrabold text-primary leading-none">{startTime} - {endTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:pl-5 md:border-l border-gray-200">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                      cumpleMinimo ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <Check className="w-5 h-5 stroke-[3px]" />
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">
                      {cumpleMinimo
                        ? <>Cumples con el mínimo<br />requerido de 5 días.</>
                        : <>Necesitas mínimo<br />5 días para continuar.</>
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ERROR */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* SUCCESS BANNER + CTA */}
            <section className="bg-primary/5 border border-primary/10 rounded-[40px] p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-primary shrink-0 relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">¡Excelente!</h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Tu disponibilidad nos ayuda a asignarte<br />mejores oportunidades.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={continuar}
                  disabled={guardando || !cumpleMinimo}
                  className={`h-14 px-8 md:px-12 font-bold text-base rounded-2xl flex items-center gap-3 transition-all shrink-0 ${
                    guardando || !cumpleMinimo
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Continuar a la entrevista
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/>
                        <path d="m12 5 7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
                {!cumpleMinimo && (
                  <p className="text-xs text-red-500 font-medium">
                    Selecciona al menos 5 días
                  </p>
                )}
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

function ProgressSteps({ stepActual = 2 }) {
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