// src/pages/vender-con-marketdesliz/pasos/07/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Calendar, Clock, MapPin, User, Navigation, PlusCircle, Briefcase,
  DollarSign, Shirt, BookOpen, Info, Brain, Tag, Activity, Heart,
  Headset, FileText, Shield, CheckCircle, RotateCcw, Trophy, Lock,
  ArrowRight, QrCode, AlertCircle, Check, ClipboardList, CalendarDays,
  CircleCheck, GraduationCap, UserCog, UserPlus
} from 'lucide-react';
import HeaderSimple from '../../../../components/HeaderSimple';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

export default function Paso07Evaluacion() {
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
      if (!sol.capacitacionCompletada) {
        router.replace('/vender-con-marketdesliz/pasos/06');
        return;
      }

      // Si ya avanzó más allá del paso 7, redirigir al actual
      if (sol.pasoActual > 7) {
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
        citaConfirmada: true,
        fechaConfirmacionCita: new Date().toISOString(),
        pasoActual: 8,
      });

      router.push('/vender-con-marketdesliz/pasos/08');
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Datos dinámicos (con fallback a valores del template) ───
  const nombreCompleto = solicitud?.nombre || user?.nombre || 'Sin nombre';
  const gafeteNumero = solicitud?.gafeteNumero || 'MDZ-V-XXX';
  const fechaCita = solicitud?.fechaEvaluacion || 'Por confirmar';
  const horaCita = solicitud?.horaEvaluacion || 'Por confirmar';
  const lugarCita = solicitud?.lugarEvaluacion || 'Centro de capacitación MarketDesliz';
  const direccionCita = solicitud?.direccionEvaluacion || 'Av. Siempre Viva 123, Col. Centro, Cuauhtémoc, Ciudad de México';
  const capacitador = solicitud?.evaluadorNombre || 'Por asignar';

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
        <title>Paso 07: Evaluación — Vender con MarketDesliz</title>
        <meta name="description" content="Detalles de tu cita de evaluación presencial." />
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

            <ProgressSteps stepActual={7} />

            {/* ─── HEADER & ID CARD ────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="text-primary font-black text-xs tracking-[0.2em] uppercase">
                  07 • Evaluación
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight">
                  Es momento de <br /> demostrar lo que <br />{' '}
                  <span className="text-primary">aprendiste.</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-md leading-relaxed font-medium">
                  Tu evaluación es presencial. Te asignamos un lugar, fecha y hora
                  para realizar una venta completa con tu capacitador de
                  MarketDesliz.
                </p>
              </div>

              <div className="relative flex justify-center">
                {/* Anotación manuscrita */}
                <div className="absolute -left-16 top-1/4 transform -rotate-6 hidden lg:block text-primary">
                  <p className="font-semibold text-lg italic leading-tight">
                    Cada venta <br /> es una oportunidad <br /> para crecer.
                  </p>
                  <div className="ml-8 mt-2 w-10 h-10 border-b-2 border-r-2 border-primary rounded-br-2xl"></div>
                </div>

                {/* ID Card */}
                <div className="bg-white rounded-2xl p-7 shadow-lg w-80 border border-gray-100 relative overflow-hidden ring-1 ring-gray-100 group transition-transform hover:-rotate-1">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white">
                        <Activity size={16} />
                      </div>
                      <span className="font-black text-sm tracking-tighter text-gray-900">
                        Market<span className="text-primary">Desliz</span>
                      </span>
                    </div>
                    <div className="w-14 h-1.5 bg-gray-100 rounded-full"></div>
                  </div>

                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden mb-5 border-4 border-primary/10 shadow-inner bg-gray-100 flex items-center justify-center">
                      <User size={48} className="text-gray-300" />
                    </div>
                    <h3 className="font-black text-gray-900 text-lg tracking-tight">
                      {nombreCompleto}
                    </h3>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                      Vendedor MarketDesliz
                    </p>
                    <div className="bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full mt-3 tracking-wider">
                      {gafeteNumero}
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-md"></div>
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                        En proceso
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <QrCode size={32} className="text-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── CITA & REQUISITOS ───────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Cita */}
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-sm shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      Tu cita de evaluación
                    </h2>
                    <span className="inline-block bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full mt-1.5 uppercase tracking-widest">
                      Programada
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <InfoItem icon={<Calendar size={18} />} label="Fecha" value={fechaCita} />
                  <InfoItem icon={<Clock size={18} />} label="Hora" value={horaCita} />
                  <InfoItem
                    icon={<MapPin size={18} />}
                    label="Lugar"
                    value={lugarCita}
                    sub={direccionCita}
                  />
                  <InfoItem
                    icon={<User size={18} />}
                    label="Capacitador"
                    value={capacitador}
                    last
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(lugarCita)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 border-2 border-gray-100 rounded-2xl py-4 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all hover:border-gray-200 group"
                  >
                    <Navigation
                      size={16}
                      className="text-primary group-hover:translate-x-1 transition-transform"
                    />
                    Cómo llegar
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      // Descarga .ics básico — opcional
                      const ics = [
                        'BEGIN:VCALENDAR',
                        'VERSION:2.0',
                        'BEGIN:VEVENT',
                        `SUMMARY:Evaluación MarketDesliz`,
                        `LOCATION:${lugarCita}`,
                        'END:VEVENT',
                        'END:VCALENDAR',
                      ].join('\n');
                      const blob = new Blob([ics], { type: 'text/calendar' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'evaluacion-marketdesliz.ics';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center justify-center gap-3 border-2 border-gray-100 rounded-2xl py-4 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all hover:border-gray-200"
                  >
                    <PlusCircle size={16} className="text-primary" />
                    Agregar a calendario
                  </button>
                </div>
              </div>

              {/* Requisitos */}
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-sm shrink-0">
                    <Briefcase size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Qué debes llevar
                  </h2>
                </div>

                <div className="space-y-10">
                  <RequirementItem
                    icon={<DollarSign size={20} />}
                    title="$100 en efectivo"
                    desc="El pago se realiza presencialmente el día de tu evaluación."
                    color="green"
                  />
                  <RequirementItem
                    icon={<Shirt size={20} />}
                    title="Tu uniforme"
                    desc="Camisa blanca de manga larga con la identidad de MarketDesliz."
                    color="blue"
                  />
                  <RequirementItem
                    icon={<BookOpen size={20} />}
                    title="Tu guion y objeciones"
                    desc="Evaluaremos que puedas desenvolverte sin depender de leerlos."
                    color="purple"
                  />
                </div>

                <div className="mt-6 bg-gray-50 rounded-2xl p-5 flex items-center gap-4 border border-gray-100">
                  <Info size={24} className="text-blue-500 shrink-0" />
                  <p className="text-sm text-muted-foreground font-bold leading-snug">
                    Llega puntual. Tu capacitador te estará esperando.
                  </p>
                </div>
              </div>
            </section>

            {/* ─── PROCESO ─────────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-16 text-center tracking-tight">
                ¿Qué sucederá en tu evaluación?
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-12 gap-x-8">
                <ProcessStep num="01" title="Presentación" desc="Tu capacitador te recibe y confirma tu asistencia." />
                <ProcessStep num="02" title="Guion" desc="Presentación de memoria usando el guion oficial." />
                <ProcessStep num="03" title="Venta simulada" desc="Evaluación con simulaciones de clientes." />
                <ProcessStep num="04" title="Objeciones" desc="Respuestas a retos y dudas de venta comunes." />
                <ProcessStep num="05" title="Proceso" desc="Registro correcto y cierre de la venta." />
                <ProcessStep num="06" title="Retro" desc="Indicaciones sobre tus aciertos y mejoras." />
              </div>
            </section>

            {/* ─── CRITERIOS & RESULTADOS ──────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-10 tracking-tight">
                  Lo que evaluará tu capacitador
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <CriteriaItem icon={<Brain size={18} />} title="Dominio del guion" sub="Lo conoce de memoria." />
                  <CriteriaItem icon={<Tag size={18} />} title="Claridad" sub="Explica correctamente los precios." />
                  <CriteriaItem icon={<Activity size={18} />} title="Naturalidad" sub="No parece que está recitando." />
                  <CriteriaItem icon={<Heart size={18} />} title="Trato al cliente" sub="Respeto y profesionalismo." />
                  <CriteriaItem icon={<Headset size={18} />} title="Escucha" sub="Responde a las dudas reales." />
                  <CriteriaItem icon={<FileText size={18} />} title="Proceso" sub="Registro correcto de venta." />
                  <CriteriaItem icon={<Shield size={18} />} title="Objeciones" sub="Sabe reaccionar al 'No'." />
                  <CriteriaItem icon={<Shirt size={18} />} title="Presentación" sub="Uso correcto del uniforme." />
                </div>
                <div className="mt-12 bg-primary/5 rounded-2xl p-5 flex items-center justify-center gap-4 text-primary font-black text-sm text-center border border-primary/10">
                  <CheckCircle size={20} />
                  Tu evaluación será registrada por tu capacitador.
                </div>
              </div>

              <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-10 tracking-tight">
                  Posibles resultados
                </h2>
                <div className="space-y-6">
                  <ResultCard
                    icon={<CheckCircle size={20} />}
                    title="Listo para comenzar"
                    desc="Activación y ventas al día siguiente."
                    type="success"
                  />
                  <ResultCard
                    icon={<RotateCcw size={20} />}
                    title="Necesitas reforzar"
                    desc="Nueva fecha de evaluación programada."
                    type="warning"
                  />
                  <ResultCard
                    icon={<Clock size={20} />}
                    title="Esperando resultado"
                    desc="Pendiente de registro final."
                    type="neutral"
                  />
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

            {/* ─── CTA FINAL ───────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-10 lg:p-14 shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-10">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                  <Trophy size={48} strokeWidth={1.5} />
                </div>
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                    Prepárate para tu evaluación
                  </h2>
                  <p className="text-muted-foreground font-bold text-lg leading-snug">
                    Último paso antes de convertirte en{' '}
                    <br className="hidden lg:block" /> vendedor activo de
                    MarketDesliz.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center lg:items-end gap-5">
                <button
                  onClick={continuar}
                  disabled={guardando}
                  className={`px-12 py-6 rounded-2xl font-black text-lg flex items-center gap-5 transition-all shrink-0 ${
                    guardando
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Ver detalles de mi cita
                      <ArrowRight size={24} strokeWidth={2.5} />
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2.5 text-gray-400 text-xs font-bold text-center lg:text-right leading-relaxed">
                  <Lock size={14} />
                  <span>
                    No se requiere pago en línea. <br /> El pago es presencial el
                    día de la cita.
                  </span>
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

// ─── SUB-COMPONENTES ────────────────────────────────────────────────────
function InfoItem({ icon, label, value, sub, last }) {
  return (
    <div className="flex items-start gap-5 group">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 mt-1 transition-all group-hover:text-primary group-hover:bg-primary/5 shrink-0">
        {icon}
      </div>
      <div className={`flex-1 ${!last ? 'border-b border-gray-50 pb-5' : ''}`}>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="font-black text-gray-800 leading-tight">{value}</p>
        {sub && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-medium">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function RequirementItem({ icon, title, desc, color }) {
  const styles = {
    green: 'bg-green-50 text-green-500 hover:bg-green-100',
    blue: 'bg-blue-50 text-blue-500 hover:bg-blue-100',
    purple: 'bg-primary/5 text-primary hover:bg-primary/10',
  };
  const titleColors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-primary',
  };
  return (
    <div className="flex items-start gap-6 group">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${styles[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className={`font-black text-lg leading-none ${titleColors[color]}`}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

function ProcessStep({ num, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center space-y-5 group">
      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform cursor-default">
        {num}
      </div>
      <div className="px-2">
        <p className="font-black text-gray-800 text-sm mb-2 tracking-tight">{title}</p>
        <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function CriteriaItem({ icon, title, sub }) {
  return (
    <div className="flex items-center justify-between group cursor-default">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-black text-gray-800 tracking-tight">{title}</p>
          <p className="text-[11px] text-gray-400 font-bold">{sub}</p>
        </div>
      </div>
      <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all shadow-sm shrink-0">
        <CheckCircle size={14} />
      </div>
    </div>
  );
}

function ResultCard({ icon, title, desc, type }) {
  const styles = {
    success: 'bg-green-50 border-green-100 text-green-700',
    warning: 'bg-orange-50 border-orange-100 text-orange-700',
    neutral: 'bg-gray-50 border-gray-100 text-gray-700',
  };
  const iconColors = {
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    neutral: 'bg-gray-400',
  };
  return (
    <div
      className={`${styles[type]} rounded-2xl p-6 border flex items-start gap-5 transition-all hover:scale-[1.02] cursor-default`}
    >
      <div
        className={`w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 shadow-lg ${iconColors[type]}`}
      >
        {icon}
      </div>
      <div>
        <p className="font-black text-sm tracking-tight">{title}</p>
        <p className="text-[11px] opacity-80 mt-1.5 font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
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

function ProgressSteps({ stepActual = 7 }) {
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