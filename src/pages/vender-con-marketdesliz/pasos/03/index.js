// src/pages/vender-con-marketdesliz/pasos/03/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ClipboardCheck, Lock, Check, AlertCircle, Target, User, MapPin,
  Calendar, MessageSquare, Briefcase, Car, Users, ArrowRight,
  ClipboardList, CalendarDays, CircleCheck, FileText, GraduationCap,
  UserCog, UserPlus
} from 'lucide-react';
import HeaderSimple from '../../../../components/Header';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

export default function Paso03Entrevista() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    edad: '',
    ciudad: '',
    experiencia: '',
    motivacion: '',
    tipoTransporte: '',
  });

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

      // Verificaciones de paso previo
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

      // Si ya avanzó más allá del paso 3, redirigir al actual
      if (sol.pasoActual > 3) {
        router.replace(`/vender-con-marketdesliz/pasos/${String(sol.pasoActual).padStart(2, '0')}`);
        return;
      }

      // Restaurar datos previos
      setFormData({
        nombre: sol.nombre || currentUser.nombre || '',
        telefono: sol.telefono || currentUser.telefono || '',
        edad: sol.edad || '',
        ciudad: sol.ciudad || '',
        experiencia: sol.experiencia || '',
        motivacion: sol.motivacion || '',
        tipoTransporte: sol.tipoTransporte || '',
      });

      setLoading(false);
    };

    checkUser();

    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [router]);

  // ─── Cambios en inputs ─────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleTransporte = (value) => {
    setFormData((prev) => ({ ...prev, tipoTransporte: value }));
    if (error) setError('');
  };

  // ─── Validación ────────────────────────────────────────
  const camposCompletos =
    formData.nombre.trim() &&
    formData.telefono.trim() &&
    formData.edad &&
    formData.ciudad.trim() &&
    formData.experiencia.trim() &&
    formData.motivacion.trim() &&
    formData.tipoTransporte;

  const totalCompletados = [
    formData.nombre,
    formData.telefono,
    formData.edad,
    formData.ciudad,
    formData.experiencia,
    formData.motivacion,
    formData.tipoTransporte,
  ].filter(Boolean).length;

  // ─── Continuar ─────────────────────────────────────────
  const continuar = async () => {
    if (!user) {
      setShowLoginDropdown(true);
      return;
    }

    if (!camposCompletos) {
      setError('Completa todos los campos para continuar');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      await guardarProgreso({
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        edad: parseInt(formData.edad) || 0,
        ciudad: formData.ciudad.trim(),
        experiencia: formData.experiencia.trim(),
        motivacion: formData.motivacion.trim(),
        tipoTransporte: formData.tipoTransporte,
        entrevistaCompletada: true,
        pasoActual: 4,
      });

      router.push('/vender-con-marketdesliz/pasos/04');
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
        <title>Paso 03: Entrevista — Vender con MarketDesliz</title>
        <meta name="description" content="Cuéntanos sobre ti para conocerte mejor." />
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

            <ProgressSteps stepActual={3} />

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="max-w-2xl">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  Entrevista
                </span>
                <h1 className="text-4xl md:text-5xl font-black leading-tight text-gray-900 mb-4 tracking-tight">
                  Queremos <span className="text-primary">conocerte.</span>
                </h1>
                <p className="text-gray-500 text-lg font-medium max-w-xl">
                  Cuéntanos un poco sobre ti, qué buscas y por qué te interesa formar
                  parte de MarketDesliz.
                </p>
              </div>

              <div className="relative shrink-0 hidden md:block">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center border border-gray-100 relative z-10">
                  <div className="w-12 h-12 text-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 18c0-2.209 1.791-4 4-4s4 1.791 4 4" />
                      <path d="M12 18c0-2.209 1.791-4 4-4s4 1.791 4 4" />
                      <circle cx="8" cy="8" r="3" />
                      <circle cx="16" cy="8" r="3" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
              </div>
            </header>

            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* FORMULARIO */}
              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-primary" />
                  Información personal
                </h3>

                <div className="space-y-4">
                  {/* Nombre + Teléfono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Nombre completo *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          placeholder="Ej: Juan Pérez"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="Ej: 55 1234 5678"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                      />
                    </div>
                  </div>

                  {/* Edad + Ciudad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Edad *
                      </label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="edad"
                          value={formData.edad}
                          onChange={handleChange}
                          placeholder="Ej: 25"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Ciudad donde vives *
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="ciudad"
                          value={formData.ciudad}
                          onChange={handleChange}
                          placeholder="Ej: Veracruz, Ver."
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Experiencia */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      ¿Tienes experiencia en ventas? *
                    </label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        name="experiencia"
                        value={formData.experiencia}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Cuéntanos sobre trabajos anteriores o si es tu primera vez vendiendo..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Motivación */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      ¿Por qué te interesa trabajar con nosotros? *
                    </label>
                    <div className="relative">
                      <MessageSquare size={16} className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        name="motivacion"
                        value={formData.motivacion}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Cuéntanos tu motivación..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Transporte */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      ¿Cuentas con vehículo o transporte propio? *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Sí', 'No', 'A veces'].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => handleTransporte(op)}
                          className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                            formData.tipoTransporte === op
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SIDEBAR RESUMEN */}
              <div className="space-y-4">

                {/* ¿Qué buscamos? */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary mb-3">
                    <Target size={18} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">¿Qué buscamos?</h3>
                  <ul className="text-xs text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <Check size={12} className="text-primary mt-0.5 shrink-0" />
                      Personas comprometidas con su trabajo
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={12} className="text-primary mt-0.5 shrink-0" />
                      Buena comunicación y trato con clientes
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={12} className="text-primary mt-0.5 shrink-0" />
                      Disponibilidad para trabajar 5 días mínimo
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={12} className="text-primary mt-0.5 shrink-0" />
                      Ganas de aprender y crecer
                    </li>
                  </ul>
                </div>

                {/* Progreso del formulario */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Progreso</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Campos completados</span>
                      <span className="font-bold text-primary">{totalCompletados}/7</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(totalCompletados / 7) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Info protegida */}
                <div className="flex items-center gap-3 text-gray-400 p-3">
                  <Lock size={14} />
                  <p className="text-[10px] font-medium">
                    Tu información está protegida. La usamos solo para el proceso de selección.
                  </p>
                </div>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* FOOTER DE ACCIÓN */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-lg font-black text-gray-900">Entrevista</h3>
                    <span className={`text-lg font-black ${camposCompletos ? 'text-primary' : 'text-gray-400'}`}>
                      {totalCompletados}/7
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-xs font-bold ${totalCompletados >= 7 ? 'text-primary' : 'text-gray-400'}`}>
                      {totalCompletados >= 7 ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>Información completa</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Check className="w-3 h-3" />
                      <span>Disponibilidad registrada</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={continuar}
                  disabled={guardando || !camposCompletos}
                  className={`h-14 px-8 md:px-10 font-bold text-base rounded-2xl flex items-center gap-3 transition-all shrink-0 ${
                    guardando || !camposCompletos
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
                      Enviar entrevista
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                {!camposCompletos && (
                  <p className="text-xs text-red-500 font-medium">
                    Completa los {7 - totalCompletados} campos restantes
                  </p>
                )}
              </div>
            </div>

            {/* FOOTER FINAL */}
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

function ProgressSteps({ stepActual = 3 }) {
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