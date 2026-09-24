// src/pages/vender-con-marketdesliz/pasos/08/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  CheckCircle2, MapPin, Clock, Calendar, User, ArrowRight, Box,
  ShoppingBag, ClipboardCheck, ChevronRight, Info, QrCode, FileText,
  GraduationCap, Hammer, CreditCard, Shirt, UserCheck, Star, Rocket,
  Lock, AlertCircle, Check, ClipboardList, CalendarDays, Users,
  CircleCheck, UserCog, UserPlus
} from 'lucide-react';
import HeaderSimple from '../../../../components/Header';
import pb from '../../../../lib/pocketbase';
import { getMiSolicitud, guardarProgreso } from '../../../../lib/vendedoresService';

export default function Paso08Activacion() {
  const router = useRouter();

  // ─── Estados ────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [solicitud, setSolicitud] = useState(null);
  const [vendedor, setVendedor] = useState(null);
  const [gafeteNumero, setGafeteNumero] = useState('MDZ-V-XXX');
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState('');
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ─── Generar número de gafete ──────────────────────────
  const generarGafete = async () => {
    try {
      const res = await pb.collection('vendedores').getList(1, 1, {
        sort: '-created',
      });
      const siguiente = (res.totalItems || 0) + 1;
      return `MDZ-V-${String(siguiente).padStart(3, '0')}`;
    } catch {
      return `MDZ-V-${String(Date.now()).slice(-3)}`;
    }
  };

  // ─── Activar vendedor (crea registro en vendedores) ────
  const activarVendedor = async (sol) => {
    // Si ya está activado, no crear de nuevo
    if (sol.activado && sol.vendedorId) {
      try {
        const v = await pb.collection('vendedores').getOne(sol.vendedorId);
        setVendedor(v);
        setGafeteNumero(v.gafeteNumero || sol.gafeteNumero || 'MDZ-V-XXX');
      } catch {
        setGafeteNumero(sol.gafeteNumero || 'MDZ-V-XXX');
      }
      return;
    }

    setActivando(true);
    try {
      const numero = await generarGafete();

      // 1) Crear registro en vendedores
      const nuevoVendedor = await pb.collection('vendedores').create({
        userId: user.id,
        nombre: sol.nombre || user.nombre || '',
        telefono: sol.telefono || '',
        email: user.email || '',
        ciudad: sol.ciudad || '',
        gafeteNumero: numero,
        zona: 'Por asignar',
        comision: 10,
        diasDisponibles: sol.diasDisponibles || [],
        horaInicio: sol.horaInicio || '',
        horaFin: sol.horaFin || '',
        activo: true,
        fechaActivacion: new Date().toISOString(),
        vacanteId: sol.id,
      });

      setVendedor(nuevoVendedor);
      setGafeteNumero(numero);

      // 2) Actualizar vacante con vendedorId + activado
      await guardarProgreso({
        vendedorId: nuevoVendedor.id,
        activado: true,
        fechaActivacion: new Date().toISOString(),
        gafeteNumero: numero,
        estado: 'activado',
        pasoActual: 8,
      });
    } catch (err) {
      console.error('Error activando vendedor:', err);
      setError('Error al activar tu cuenta. Intenta de nuevo.');
    } finally {
      setActivando(false);
    }
  };

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
      if (!sol.citaConfirmada) {
        router.replace('/vender-con-marketdesliz/pasos/07');
        return;
      }

      // Activar vendedor automáticamente al llegar
      await activarVendedor(sol);

      setLoading(false);
    };

    checkUser();

    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, [router]);

  // ─── Ir al dashboard de vendedor ───────────────────────
  const irAlDashboard = () => {
    router.push('/vendedor/dashboard');
  };

  // ─── Datos dinámicos ───────────────────────────────────
  const nombreCompleto = solicitud?.nombre || user?.nombre || 'Vendedor';
  const primerNombre = nombreCompleto.split(' ')[0];
  const telefono = solicitud?.telefono || '55 0000 0000';
  const dias = solicitud?.diasDisponibles || ['L', 'M1', 'M2', 'J', 'V'];
  const horaInicio = solicitud?.horaInicio || '09:00';
  const horaFin = solicitud?.horaFin || '18:00';
  const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
          <p className="mt-4 text-muted-foreground text-sm">
            Activando tu cuenta...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Paso 08: Activación — Vender con MarketDesliz</title>
        <meta name="description" content="¡Ya eres vendedor de MarketDesliz! Todo está listo para tu primera jornada." />
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

            <ProgressSteps stepActual={8} />

            {/* ─── HEADER ───────────────────────────────────── */}
            <section className="flex flex-col md:flex-row justify-between items-start gap-12 pt-4">
              <div className="flex-1 space-y-4">
                <span className="inline-block bg-primary/10 text-primary font-bold uppercase tracking-wider px-3 py-1 text-[10px] rounded-full">
                  08 · Activación
                </span>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tu evaluación fue aprobada 🎉
                  </h2>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                    Ya eres vendedor
                    <br />
                    de <span className="text-primary italic">MarketDesliz.</span>
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-[450px] leading-relaxed">
                  Terminaste tu preparación. Ahora vamos a activar tu identidad y
                  dejar todo listo para tu primera jornada.
                </p>
              </div>

              {/* Gafete flotante */}
              <div className="relative group w-full md:w-[320px] shrink-0">
                <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
                <div className="relative bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-all duration-500">
                  <div className="h-10 bg-primary/5 flex items-center justify-center border-b border-dashed border-gray-200">
                    <div className="w-16 h-2 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="p-6 text-center space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold leading-none">M</span>
                        </div>
                        <span className="text-sm font-bold tracking-tight text-gray-900">
                          MarketDesliz
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-4 h-0.5 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>

                    <div className="relative mx-auto w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/10 p-1 bg-gray-100 flex items-center justify-center">
                      <User size={48} className="text-gray-300" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-gray-900">{nombreCompleto}</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Vendedor MarketDesliz
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="bg-primary/5 text-primary border border-primary/20 font-bold px-2 py-0.5 text-[10px] rounded-full">
                        {gafeteNumero}
                      </span>
                      <QrCode className="w-10 h-10 text-gray-900" strokeWidth={1.5} />
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        ACTIVO
                      </span>
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                      </div>
                    </div>
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

            {/* ─── CHECKLIST & GAFETE PREVIEW ──────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Checklist */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Todo está listo</h3>
                  <div className="space-y-4">
                    {[
                      { icon: FileText, label: 'Expediente', status: 'Completo' },
                      { icon: GraduationCap, label: 'Capacitación', status: 'Completada' },
                      { icon: Hammer, label: 'Evaluación práctica', status: 'Aprobada' },
                      { icon: CreditCard, label: 'Pago presencial', status: '$100 recibido' },
                      { icon: Shirt, label: 'Uniforme', status: 'Preparado' },
                      { icon: UserCheck, label: 'Perfil', status: 'Activado' },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex items-center justify-between py-2 group cursor-default">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <Icon size={20} />
                            </div>
                            <span className="font-semibold text-gray-700">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">{item.status}</span>
                            <CheckCircle2 size={18} className="text-green-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preview del gafete */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 flex-1 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Recibe tu gafete</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Tu gafete te identifica frente a los clientes como vendedor
                      autorizado de MarketDesliz.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Frente */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">
                        Frente
                      </span>
                      <div className="aspect-[3/4] bg-white border border-gray-100 rounded-xl shadow-sm p-3 space-y-2 flex flex-col items-center">
                        <div className="w-full flex items-center gap-1 mb-1">
                          <div className="w-3 h-3 bg-primary rounded-[2px] shrink-0"></div>
                          <span className="text-[8px] font-bold text-gray-900">MarketDesliz</span>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <User size={24} className="text-gray-300" />
                        </div>
                        <div className="space-y-0.5 text-center">
                          <div className="text-[8px] font-bold text-gray-900">{nombreCompleto}</div>
                          <div className="text-[6px] text-gray-400">Vendedor MarketDesliz</div>
                        </div>
                        <div className="w-full flex items-center justify-between mt-auto">
                          <div className="bg-primary/5 text-primary text-[6px] px-1 rounded border border-primary/10 font-bold">
                            {gafeteNumero}
                          </div>
                          <QrCode size={14} className="text-gray-800" />
                        </div>
                      </div>
                    </div>

                    {/* Reverso */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">
                        Reverso
                      </span>
                      <div className="aspect-[3/4] bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold text-xs italic leading-none">M</span>
                        </div>
                        <p className="text-[7px] font-medium text-gray-600 leading-tight px-1">
                          Vendedor autorizado para ofrecer productos y servicios de
                          MarketDesliz.
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-secondary rounded-full flex items-center justify-center text-primary">
                            <Clock size={6} />
                          </div>
                          <span className="text-[8px] font-bold text-gray-900">{telefono}</span>
                        </div>
                        <div className="w-full bg-primary py-1.5 rounded-md mt-auto">
                          <span className="text-[7px] text-white font-medium">
                            marketdesliz.com
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary p-4 rounded-2xl flex gap-3 items-start">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600 leading-normal">
                      Deberás portar tu gafete junto con tu camisa blanca de manga
                      larga con la identidad de MarketDesliz todos los días.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── HORARIO & PRIMERA JORNADA ───────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Horario */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                      <Calendar size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Tu horario registrado</h3>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    {dias.slice(0, 5).map((key, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            i === 0 ? 'bg-primary text-white' : 'bg-secondary text-primary'
                          }`}
                        >
                          {key.charAt(0)}
                        </div>
                        <span className="text-[10px] font-medium text-gray-400">
                          {diasNombres[i]}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-secondary/50 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <Clock className="text-primary" size={20} />
                      <span className="text-2xl font-black text-gray-900">
                        {horaInicio} - {horaFin}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <span className="bg-white text-green-600 border border-green-200 px-3 py-1 font-bold flex items-center gap-2 rounded-full text-xs">
                        {dias.length} días semanales <CheckCircle2 size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primera jornada */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="p-8 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                      <Rocket size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Tu primera jornada</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-5">
                      {[
                        { icon: Calendar, label: 'Fecha', value: 'Por confirmar' },
                        { icon: Clock, label: 'Hora de llegada', value: horaInicio },
                        {
                          icon: MapPin,
                          label: 'Punto de salida',
                          value: 'MarketDesliz · Zona Centro',
                          sub: 'Av. Siempre Viva 123, Col. Centro, Cuauhtémoc, Ciudad de México',
                        },
                        { icon: User, label: 'Responsable', value: 'Por asignar' },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="flex gap-4">
                            <Icon size={18} className="text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {item.label}
                              </p>
                              <p className="font-bold text-gray-800 leading-tight">{item.value}</p>
                              {item.sub && (
                                <p className="text-[10px] text-muted-foreground max-w-[200px] leading-normal">
                                  {item.sub}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex-1 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        &quot;Preséntate con tu uniforme y gafete. Ahí se registrarán los
                        productos que llevarás durante tu primera jornada.&quot;
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            'https://maps.google.com/?q=Centro+de+capacitaci%C3%B3n+MarketDesliz',
                            '_blank'
                          )
                        }
                        className="w-full bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 font-bold h-12 rounded-xl group flex items-center justify-center transition"
                      >
                        <MapPin size={18} className="mr-2 text-primary" />
                        Cómo llegar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── JOURNEY MAP ─────────────────────────────── */}
            <section className="space-y-6 pt-4">
              <h3 className="text-xl font-bold px-2 text-gray-900">
                Así comenzará cada jornada
              </h3>
              <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-4 p-2">
                {[
                  { icon: User, label: 'Llegas al punto asignado' },
                  { icon: Box, label: 'Recibes los productos' },
                  { icon: FileText, label: 'Se registran a tu cuenta' },
                  { icon: ShoppingBag, label: 'Sales a vender' },
                  { icon: ClipboardCheck, label: 'Registras cada compra' },
                  { icon: ArrowRight, label: 'Regresas lo no vendido', rotate: true },
                  { icon: CheckCircle2, label: 'Cierras tu jornada' },
                ].map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-start">
                      <div className="flex flex-col items-center gap-3 text-center w-[12%] min-w-[100px]">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                            i === 6
                              ? 'bg-primary text-white shadow-lg'
                              : 'bg-white shadow-sm border border-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon size={24} className={step.rotate ? 'rotate-180' : ''} />
                        </div>
                        <p
                          className={`text-[10px] font-bold leading-tight px-1 ${
                            i === 6 ? 'text-primary' : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      {i < 6 && (
                        <div className="hidden md:flex items-center pt-7">
                          <ChevronRight size={16} className="text-gray-200" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── ESPACIO DE VENDEDOR PREVIEW ─────────────── */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-0 flex flex-col md:flex-row items-center">

                {/* Mockup teléfono */}
                <div className="w-full md:w-[320px] p-8 pb-0 md:pb-8 flex justify-center">
                  <div className="relative w-full max-w-[240px] aspect-[1/2] bg-gray-900 rounded-2xl border-[6px] border-gray-900 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-20"></div>
                    <div className="absolute inset-0 bg-primary p-4 pt-8 space-y-6">
                      <div className="flex justify-between items-center text-white">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-medium opacity-80">011</p>
                          <p className="text-xs font-bold">Hola, {primerNombre} 🤟</p>
                          <p className="text-[7px] opacity-80 italic">
                            ¡Que tengas muy buenas ventas!
                          </p>
                        </div>
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-[10px] text-white">🔍</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-white">
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            Hoy
                          </span>
                          <span className="text-[7px] font-medium opacity-80">Ver más</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white rounded-lg p-2 space-y-1">
                            <p className="text-[6px] text-gray-400 font-bold uppercase">Productos</p>
                            <p className="text-xs font-black text-gray-800">0</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 space-y-1">
                            <p className="text-[6px] text-gray-400 font-bold uppercase">Ventas</p>
                            <p className="text-xs font-black text-gray-800">0</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 space-y-1">
                          <p className="text-[6px] text-gray-400 font-bold uppercase">
                            Comisión de hoy
                          </p>
                          <p className="text-xs font-black text-gray-800">$0</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex-1 p-8 md:p-12 space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">
                      Tu espacio de vendedor está activo
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                      { icon: Box, label: 'Mis productos' },
                      { icon: GraduationCap, label: 'Registrar venta' },
                      { icon: ShoppingBag, label: 'Mis ventas' },
                      { icon: ClipboardCheck, label: 'Mis comisiones' },
                      { icon: Calendar, label: 'Mis jornadas' },
                      { icon: QrCode, label: 'Mi QR' },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-3 text-center group cursor-default"
                        >
                          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                            <Icon size={22} />
                          </div>
                          <p className="text-[9px] font-bold text-gray-500 group-hover:text-primary leading-tight">
                            {item.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={irAlDashboard}
                    disabled={activando || !vendedor}
                    className={`w-full font-black py-6 text-base rounded-2xl flex items-center justify-center gap-3 transition-all ${
                      activando || !vendedor
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 active:scale-[0.98]'
                    }`}
                  >
                    {activando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Activando...
                      </>
                    ) : (
                      <>
                        Entrar a mi espacio de vendedor
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ─── BIENVENIDA ──────────────────────────────── */}
            <div className="bg-secondary rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary relative shrink-0">
                  <Star size={24} fill="currentColor" className="opacity-20" />
                  <Star size={24} className="absolute" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    Bienvenido a MarketDesliz, {primerNombre}.
                  </h4>
                  <p className="text-sm text-muted-foreground font-medium">
                    Todo está listo. Tu siguiente paso es tu primera jornada.
                  </p>
                </div>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500"
                  >
                    <User size={14} />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                  +
                </div>
              </div>
            </div>

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

function ProgressSteps({ stepActual = 8 }) {
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