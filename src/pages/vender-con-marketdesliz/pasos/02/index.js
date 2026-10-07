// src/pages/vender-con-marketdesliz/pasos/02/index.js
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Calendar, Clock, Info, Check, Lock, AlertCircle,
  ClipboardList, CalendarDays, Users, CircleCheck, FileText,
  GraduationCap, UserCog, UserPlus, Send, Sparkles, PartyPopper, SquarePen
} from 'lucide-react';
import HeaderSimple from '../../../../components/Header';
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

// ─── CONFIGURACIÓN POR PUESTO ───────────────────────────
const CONFIG_PUESTO = {
  'Vendedor de Campo': {
    titulo: '¿Cuándo puedes trabajar?',
    destacado: 'trabajar',
    subtitulo:
      'Cuéntanos los días y horarios en los que puedes vender. Necesitas elegir mínimo 5 días a la semana.',
    info: 'Tu disponibilidad nos ayuda a asignarte zonas, productos y acompañamiento para que tengas éxito.',
    minDias: 5,
    ctaLabel: 'Continuar a la entrevista',
    ctaEsWizard: true,
  },
  'Desarrollador Web': {
    titulo: 'Cuéntanos tu perfil técnico',
    destacado: 'perfil técnico',
    subtitulo:
      'Completa tu disponibilidad y comparte tu stack, portafolio y modalidad de trabajo preferida.',
    info: 'Cuanta más información compartas, mejor podremos evaluar tu candidatura.',
    minDias: 1,
    ctaLabel: 'Enviar solicitud',
    ctaEsWizard: false,
  },
  'Atención al Cliente': {
    titulo: 'Cuéntanos sobre ti',
    destacado: 'ti',
    subtitulo:
      'Completa tu disponibilidad y dinos tu turno preferido e idiomas que dominas.',
    info: 'Nos ayuda a ubicarte en el mejor horario y canal para tus habilidades.',
    minDias: 1,
    ctaLabel: 'Enviar solicitud',
    ctaEsWizard: false,
  },
  'Marketing Digital': {
    titulo: 'Cuéntanos tu experiencia',
    destacado: 'experiencia',
    subtitulo:
      'Completa tu disponibilidad y comparte las áreas en las que te especializas.',
    info: 'Buscamos perfiles que dominen al menos un área del marketing digital.',
    minDias: 1,
    ctaLabel: 'Enviar solicitud',
    ctaEsWizard: false,
  },
  'Diseñador UI/UX': {
    titulo: 'Cuéntanos tu perfil creativo',
    destacado: 'perfil creativo',
    subtitulo:
      'Completa tu disponibilidad y comparte tus herramientas y portafolio.',
    info: 'El portafolio es lo más importante en este proceso.',
    minDias: 1,
    ctaLabel: 'Enviar solicitud',
    ctaEsWizard: false,
  },
  Otro: {
    titulo: 'Cuéntanos qué buscas',
    destacado: 'qué buscas',
    subtitulo:
      'Completa tu disponibilidad y describe el tipo de trabajo o colaboración que te interesa.',
    info: 'Revisaremos tu propuesta y te contactaremos si hay match.',
    minDias: 1,
    ctaLabel: 'Enviar solicitud',
    ctaEsWizard: false,
  },
};

export default function Paso02Disponibilidad() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  const [selectedDays, setSelectedDays] = useState(['L', 'M1', 'M2', 'J', 'V']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [datosExtra, setDatosExtra] = useState({});

  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingContinuar, setPendingContinuar] = useState(false);

  const puesto = solicitud?.puesto || '';
  const config = CONFIG_PUESTO[puesto] || CONFIG_PUESTO['Vendedor de Campo'];
  const esWizard = config.ctaEsWizard;

  // ─── checkUser (reutilizable) ─────────────────────────
  const checkUser = useCallback(async () => {
    const currentUser = pb.authStore.model;
    setUser(currentUser);

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const sol = await getMiSolicitud();
    setSolicitud(sol);

    if (!sol) {
      router.replace('/vender-con-marketdesliz/pasos/01');
      return;
    }
    if (!sol.aceptaRequisitos || !sol.puesto) {
      router.replace('/vender-con-marketdesliz/pasos/01');
      return;
    }
    if (sol.pasoActual > 2) {
      router.replace(
        `/vender-con-marketdesliz/pasos/${String(sol.pasoActual).padStart(2, '0')}`
      );
      return;
    }

    if (
      sol.diasDisponibles &&
      Array.isArray(sol.diasDisponibles) &&
      sol.diasDisponibles.length > 0
    ) {
      setSelectedDays(sol.diasDisponibles);
    }
    if (sol.horaInicio) setStartTime(sol.horaInicio);
    if (sol.horaFin) setEndTime(sol.horaFin);

    // Restaurar datos extra si existían
    if (sol.datosPuesto && typeof sol.datosPuesto === 'object') {
      const { completado, fechaEnvio, ...resto } = sol.datosPuesto;
      setDatosExtra(resto);
      if (completado) setSolicitudEnviada(true);
    }

    setLoading(false);
  }, [router]);

  // ─── Carga inicial ─────────────────────────────────────
  useEffect(() => {
    checkUser();
    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [checkUser]);

  // ─── Auto-continuar tras login ─────────────────────────
  useEffect(() => {
    if (pendingContinuar && user && !loading) {
      setPendingContinuar(false);
      continuar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingContinuar, user, loading]);

  // ─── Helpers ───────────────────────────────────────────
  const toggleDay = (key) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
    if (error) setError('');
  };

  const setCampo = (key, value) => {
    setDatosExtra((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const cumpleMinimo = selectedDays.length >= config.minDias;

  // ─── Validaciones por puesto ───────────────────────────
  const validarExtra = () => {
    if (puesto === 'Desarrollador Web') {
      if (!datosExtra.stack?.trim()) return 'Ingresa tu stack o tecnologías';
      if (!datosExtra.modalidad) return 'Selecciona una modalidad';
    }
    if (puesto === 'Atención al Cliente') {
      if (!datosExtra.turno) return 'Selecciona un turno preferido';
    }
    if (puesto === 'Marketing Digital') {
      if (!datosExtra.areas || datosExtra.areas.length === 0)
        return 'Selecciona al menos un área';
    }
    if (puesto === 'Diseñador UI/UX') {
      if (!datosExtra.herramientas?.trim()) return 'Ingresa tus herramientas';
      if (!datosExtra.modalidad) return 'Selecciona una modalidad';
    }
    if (puesto === 'Otro') {
      if (!datosExtra.descripcion?.trim())
        return 'Cuéntanos qué tipo de trabajo buscas';
    }
    return null;
  };

  // ─── Continuar / Enviar ────────────────────────────────
  const continuar = async () => {
    if (!user) {
      setPendingContinuar(true);
      setShowLoginDropdown(true);
      return;
    }

    if (!cumpleMinimo) {
      setError(`Debes seleccionar al menos ${config.minDias} día${config.minDias > 1 ? 's' : ''} para continuar`);
      return;
    }

    const errorExtra = validarExtra();
    if (errorExtra) {
      setError(errorExtra);
      return;
    }

    setGuardando(true);
    setError('');

    try {
      if (esWizard) {
        // Vendedor de Campo → sigue el wizard
        await guardarProgreso({
          diasDisponibles: selectedDays,
          horaInicio: startTime,
          horaFin: endTime,
          pasoActual: 3,
        });
        router.push('/vender-con-marketdesliz/pasos/03');
      } else {
        // Otros puestos → termina aquí
        await guardarProgreso({
          diasDisponibles: selectedDays,
          horaInicio: startTime,
          horaFin: endTime,
          datosPuesto: {
            ...datosExtra,
            completado: true,
            fechaEnvio: new Date().toISOString(),
          },
        });
        setSolicitudEnviada(true);
      }
    } catch (err) {
      console.error('Error guardando:', err);
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // ─── Editar solicitud (resetear y volver al paso 01) ──
  const editarSolicitud = async () => {
    setGuardando(true);
    setError('');
    try {
      await guardarProgreso({
        puesto: '',
        datosPuesto: null,
        pasoActual: 1,
      });
      router.push('/vender-con-marketdesliz/pasos/01');
    } catch (err) {
      console.error('Error al editar solicitud:', err);
      setError('No se pudo editar la solicitud. Intenta de nuevo.');
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
          onLoginSuccess={() => checkUser()}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-700 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // ─── Vista de éxito (solo no-vendedores) ───────────────
  if (solicitudEnviada) {
    return (
      <>
        <Head>
          <title>Solicitud enviada — MarketDesliz</title>
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
          <div className="max-w-2xl mx-auto w-full px-4 py-16 flex-1 flex items-center">
            <div className="w-full bg-white border-2 border-gray-200 rounded-[40px] p-10 text-center shadow-lg shadow-gray-900/5">
              <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-6">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">
                ¡Solicitud enviada!
              </h1>
              <p className="text-gray-700 font-medium text-base mb-8 max-w-md mx-auto">
                Hemos recibido tu información para el puesto de{' '}
                <span className="font-bold text-gray-900">{puesto}</span>. Nuestro
                equipo la revisará y te contactaremos pronto.
              </p>

              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700 font-medium leading-relaxed">
                    <p className="font-bold text-gray-900 mb-1">
                      ¿Qué sigue?
                    </p>
                    <p>
                      Revisaremos tu perfil. Si hay match con alguna de nuestras
                      vacantes activas, recibirás un correo o mensaje para agendar
                      una entrevista.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-red-700 text-sm font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={editarSolicitud}
                  disabled={guardando}
                  className={`font-bold px-6 py-3.5 rounded-2xl inline-flex items-center gap-2 transition-all border-2 ${
                    guardando
                      ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 hover:border-gray-900'
                  }`}
                >
                  <SquarePen size={16} />
                  Editar mi solicitud
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl inline-flex items-center gap-3 transition-all shadow-lg shadow-gray-900/20"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Vista principal ───────────────────────────────────
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
          onLoginSuccess={() => checkUser()}
        />

        <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
          <main className="flex flex-col gap-6">

            {/* ProgressSteps solo para el wizard (Vendedor de Campo) */}
            {esWizard && <ProgressSteps stepActual={2} />}

            {/* TÍTULO */}
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  {esWizard ? 'Disponibilidad' : `Postulación · ${puesto}`}
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-3">
                  {renderTitulo(config.titulo, config.destacado)}
                </h1>
                <p className="text-gray-700 text-base font-medium">
                  {config.subtitulo}
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex gap-4 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-white border border-primary/15 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-gray-700 font-medium">
                  {config.info}
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
                    <h3 className="text-base font-bold text-gray-900">
                      1. Elige tus días disponibles
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">
                      {esWizard
                        ? 'Selecciona mínimo 5 días a la semana.'
                        : 'Marca los días en los que podrías trabajar.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    Seleccionados
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-bold border ${
                      cumpleMinimo
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-red-600 border-red-300'
                    }`}
                  >
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
                          ? 'bg-gray-900/5 border-gray-900 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-gray-400 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="text-center">
                        <span
                          className={`text-xl font-extrabold block ${
                            isSelected ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {day.key.charAt(0)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected ? 'text-gray-700' : 'text-gray-500'
                          }`}
                        >
                          {day.label}
                        </span>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-gray-900' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-3.5 h-3.5 rounded-full bg-gray-900" />
                        )}
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
                  <h3 className="text-base font-bold text-gray-900">
                    2. Establece tu horario
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Indica el horario en el que podrás trabajar esos días.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-400 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" /><path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" /><path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">
                      Hora de inicio
                    </span>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border-none bg-transparent text-2xl font-extrabold text-gray-900 focus:outline-none cursor-pointer"
                    >
                      {HORAS_INICIO.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-400 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">
                      Hora de término
                    </span>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border-none bg-transparent text-2xl font-extrabold text-gray-900 focus:outline-none cursor-pointer"
                    >
                      {HORAS_FIN.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-primary/5 border border-primary/15 rounded-2xl flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-gray-700">
                  Puedes ajustar tu horario más adelante si tu situación cambia.
                </p>
              </div>
            </section>

            {/* CAMPOS ESPECÍFICOS POR PUESTO */}
            <CamposEspecificos
              puesto={puesto}
              datos={datosExtra}
              setCampo={setCampo}
            />

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
                  <h3 className="text-base font-bold text-gray-900">
                    3. Resumen de tu disponibilidad
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Así quedará tu plan de trabajo semanal.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-4">
                  {DIAS.map((day) => {
                    const isSelected = selectedDays.includes(day.key);
                    return (
                      <div
                        key={day.key}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl transition ${
                          isSelected
                            ? 'bg-gray-900/5 border-2 border-gray-900'
                            : 'border-2 border-transparent opacity-60'
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-[11px] font-bold text-gray-900 block">
                            {day.label}
                          </span>
                          <span
                            className={`text-[9px] font-bold ${
                              isSelected ? 'text-gray-700' : 'text-gray-500'
                            }`}
                          >
                            {isSelected ? `${startTime} - ${endTime}` : 'No disponible'}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-gray-900' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-0.5">
                        Días seleccionados
                      </span>
                      <p className="text-xl font-extrabold text-gray-900 leading-none">
                        {selectedDays.length} días
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:pl-5 md:border-l border-gray-200">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-0.5">
                        Horario
                      </span>
                      <p className="text-xl font-extrabold text-gray-900 leading-none">
                        {startTime} - {endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:pl-5 md:border-l border-gray-200">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                        cumpleMinimo ? 'bg-gray-900' : 'bg-red-500'
                      }`}
                    >
                      {cumpleMinimo ? (
                        <Check className="w-5 h-5 stroke-[3px]" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-800 leading-tight">
                      {cumpleMinimo ? (
                        <>
                          Cumples con el mínimo
                          <br />
                          requerido de {config.minDias} día
                          {config.minDias > 1 ? 's' : ''}.
                        </>
                      ) : (
                        <>
                          Necesitas mínimo
                          <br />
                          {config.minDias} día{config.minDias > 1 ? 's' : ''} para
                          continuar.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ERROR */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            {/* SUCCESS BANNER + CTA */}
            <section className="bg-primary/5 border border-primary/15 rounded-[40px] p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-900 shrink-0 relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {esWizard ? (
                      <Check className="w-6 h-6 stroke-[3px]" />
                    ) : (
                      <Sparkles className="w-6 h-6" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
                    {esWizard ? '¡Excelente!' : '¡Todo listo!'}
                  </h2>
                  <p className="text-sm text-gray-700 font-medium">
                    {esWizard ? (
                      <>
                        Tu disponibilidad nos ayuda a asignarte
                        <br />
                        mejores oportunidades.
                      </>
                    ) : (
                      <>
                        Revisa todo antes de enviar
                        <br />
                        tu solicitud.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={continuar}
                  disabled={guardando || !cumpleMinimo}
                  className={`h-14 px-8 md:px-12 font-bold text-base rounded-2xl flex items-center gap-3 transition-all shrink-0 border-2 ${
                    guardando || !cumpleMinimo
                      ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800 text-white border-gray-900 shadow-lg shadow-gray-900/20'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {esWizard ? 'Guardando...' : 'Enviando...'}
                    </>
                  ) : (
                    <>
                      {config.ctaLabel}
                      {esWizard ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </>
                  )}
                </button>
                {!cumpleMinimo && (
                  <p className="text-xs text-red-600 font-bold">
                    Selecciona al menos {config.minDias} día
                    {config.minDias > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </section>

            {/* FOOTER */}
            <footer className="py-8 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Lock size={16} />
                <div className="text-[11px] font-medium">
                  <p className="font-bold text-gray-800">
                    Tu información está protegida.
                  </p>
                  <p className="text-gray-700">
                    Usamos tus datos solo para el proceso de selección.
                  </p>
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

// ─── Render del título con destacado ─────────────────────
function renderTitulo(titulo, destacado) {
  if (!destacado || !titulo.includes(destacado)) return titulo;
  const [antes, despues] = titulo.split(destacado);
  return (
    <>
      {antes}
      <span className="text-primary">{destacado}</span>
      {despues}
    </>
  );
}

// ─── Campos específicos por puesto ───────────────────────
function CamposEspecificos({ puesto, datos, setCampo }) {
  if (puesto === 'Vendedor de Campo') return null;

  return (
    <section>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">
            3. Cuéntanos más sobre ti
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Estos datos nos ayudan a evaluar mejor tu candidatura.
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 space-y-6">
        {puesto === 'Desarrollador Web' && (
          <>
            <CampoTexto
              label="Stack / Tecnologías"
              placeholder="React, Node.js, PostgreSQL..."
              value={datos.stack}
              onChange={(v) => setCampo('stack', v)}
              required
            />
            <CampoTexto
              label="Portafolio o GitHub (URL)"
              placeholder="https://github.com/tu-usuario"
              value={datos.portafolio}
              onChange={(v) => setCampo('portafolio', v)}
              type="url"
            />
            <CampoRadio
              label="Modalidad preferida"
              value={datos.modalidad}
              onChange={(v) => setCampo('modalidad', v)}
              opciones={['Remoto', 'Híbrido', 'Presencial']}
              required
            />
          </>
        )}

        {puesto === 'Atención al Cliente' && (
          <>
            <CampoRadio
              label="Turno preferido"
              value={datos.turno}
              onChange={(v) => setCampo('turno', v)}
              opciones={['Mañana', 'Tarde', 'Noche']}
              required
            />
            <CampoCheckboxes
              label="Idiomas que dominas"
              values={datos.idiomas || []}
              onChange={(v) => setCampo('idiomas', v)}
              opciones={['Español', 'Inglés', 'Otro']}
            />
          </>
        )}

        {puesto === 'Marketing Digital' && (
          <>
            <CampoCheckboxes
              label="Áreas de interés"
              values={datos.areas || []}
              onChange={(v) => setCampo('areas', v)}
              opciones={['SEO', 'Redes sociales', 'Contenido', 'Publicidad', 'Email']}
              required
            />
            <CampoTexto
              label="Portafolio o caso de éxito (URL)"
              placeholder="https://..."
              value={datos.portafolio}
              onChange={(v) => setCampo('portafolio', v)}
              type="url"
            />
          </>
        )}

        {puesto === 'Diseñador UI/UX' && (
          <>
            <CampoTexto
              label="Herramientas que dominas"
              placeholder="Figma, Sketch, Adobe XD..."
              value={datos.herramientas}
              onChange={(v) => setCampo('herramientas', v)}
              required
            />
            <CampoTexto
              label="Portafolio (URL)"
              placeholder="https://behance.net/tu-usuario"
              value={datos.portafolio}
              onChange={(v) => setCampo('portafolio', v)}
              type="url"
            />
            <CampoRadio
              label="Modalidad preferida"
              value={datos.modalidad}
              onChange={(v) => setCampo('modalidad', v)}
              opciones={['Remoto', 'Híbrido', 'Presencial']}
              required
            />
          </>
        )}

        {puesto === 'Otro' && (
          <CampoTextarea
            label="Cuéntanos qué tipo de trabajo o colaboración buscas"
            placeholder="Describe brevemente qué puesto, área o tipo de colaboración te interesa..."
            value={datos.descripcion}
            onChange={(v) => setCampo('descripcion', v)}
            required
          />
        )}
      </div>
    </section>
  );
}

// ─── Componentes de campo ────────────────────────────────
function CampoTexto({ label, placeholder, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
      />
    </div>
  );
}

function CampoTextarea({ label, placeholder, value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}

function CampoRadio({ label, value, onChange, opciones, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="grid grid-cols-3 gap-3">
        {opciones.map((op) => {
          const selected = value === op;
          return (
            <button
              key={op}
              type="button"
              onClick={() => onChange(op)}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl border-2 transition-all ${
                selected
                  ? 'bg-gray-900/5 border-gray-900'
                  : 'bg-white border-gray-200 hover:border-gray-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected ? 'border-gray-900' : 'border-gray-300'
                }`}
              >
                {selected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                )}
              </div>
              <span
                className={`text-sm font-bold truncate ${
                  selected ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {op}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CampoCheckboxes({ label, values, onChange, opciones, required }) {
  const toggle = (op) => {
    const arr = values || [];
    onChange(arr.includes(op) ? arr.filter((v) => v !== op) : [...arr, op]);
  };
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {opciones.map((op) => {
          const selected = (values || []).includes(op);
          return (
            <button
              key={op}
              type="button"
              onClick={() => toggle(op)}
              className={`px-4 py-2.5 rounded-full border-2 text-sm font-bold transition-all ${
                selected
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {op}
            </button>
          );
        })}
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

function ProgressSteps({ stepActual = 2 }) {
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
                  {isCompleted ? (
                    <Check size={20} className="stroke-[3px]" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'text-gray-900'
                        : isCompleted
                        ? 'text-gray-800'
                        : 'text-gray-500'
                    }`}
                  >
                    Paso {step.id}
                  </p>
                  <p
                    className={`text-[10px] font-semibold pb-1 ${
                      isActive
                        ? 'text-gray-900 underline underline-offset-4 decoration-2 decoration-gray-900'
                        : isCompleted
                        ? 'text-gray-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-shrink-0 w-6 rounded-full ${
                    step.id < stepActual ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}