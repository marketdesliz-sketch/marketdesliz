// src/pages/tandas/unirse/[id].js
import { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Target, ArrowLeft, CheckCircle, XCircle, Fuel, ShieldCheck,
  FileText, Users, Calendar, DollarSign, Clock, Award, Crown, Star,
  AlertCircle, CreditCard, ListChecks, Hash, TrendingUp, Zap, Gift,
  HeartHandshake, RefreshCw, ChevronLeft,
} from 'lucide-react';
import pb from '../../../lib/pocketbase';
import {
  getTandaById,
  getMiembrosTanda,
  joinTanda,
  pagarGasolina,
  getAvailablePositions,
  selectPosition,
  getMemberByClientAndTanda,
  canJoinTandaProgresivo,
  getNivelTandaPermitido,
  getTandaWithDetails,
} from '../../../lib/tandasService';
import { getClientKYC } from '../../../lib/kycService';
import { useAuth } from '../../../contexts/AuthContext';
import { T } from '../../../lib/tokens';
import TerminalBar from '../../../components/TerminalBar';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BackButton from '../../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Toast simple — restyleado con tokens
// ─────────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { fg: T.green, bg: 'rgba(26, 127, 75, 0.06)' },
    error: { fg: T.red, bg: 'rgba(197, 48, 48, 0.06)' },
    warning: { fg: '#B8820E', bg: 'rgba(184, 130, 14, 0.06)' },
    info: { fg: T.accent, bg: 'rgba(79, 46, 232, 0.06)' },
  };

  const c = colors[type] || colors.info;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 px-4 py-3 max-w-sm"
      style={{
        background: T.bg,
        border: `1px solid ${T.line}`,
        borderLeft: `2px solid ${c.fg}`,
        borderRadius: '6px',
        boxShadow: '0 4px 20px rgba(15,15,15,0.08)',
      }}
    >
      <p
        className="text-[12.5px] leading-[1.5]"
        style={{ color: c.fg, fontWeight: 500 }}
      >
        {message}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-4"
      style={{
        color: accent ? T.accent : T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
    </p>
  );
}

function StepIndicator({ steps, paso }) {
  return (
    <div className="flex items-start justify-between gap-2 mb-10">
      {steps.map((step) => {
        const StepIcon = step.icon;
        const isActive = paso >= step.num;
        const isCompleted = paso > step.num;

        return (
          <div key={step.num} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="flex items-center justify-center transition-all"
              style={{
                width: '32px',
                height: '32px',
                background: isCompleted
                  ? T.green
                  : isActive
                  ? T.accent
                  : 'rgba(15,15,15,0.04)',
                color: isActive ? '#FFFFFF' : T.inkFaint,
                borderRadius: '8px',
                transitionTimingFunction: T.ease,
              }}
            >
              {isCompleted ? (
                <CheckCircle size={15} strokeWidth={2} />
              ) : (
                <StepIcon size={15} strokeWidth={1.75} />
              )}
            </div>
            <span
              className="text-[10px] uppercase tracking-[0.14em] text-center"
              style={{
                color: isActive ? T.ink : T.inkFaint,
                fontWeight: 500,
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCell({ icon: Icon, label, value, accent = false, border = true }) {
  return (
    <div
      className="p-4 text-center"
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
    >
      <Icon
        size={15}
        strokeWidth={1.75}
        style={{ color: accent ? T.accent : T.inkFaint, margin: '0 auto 8px' }}
      />
      <p
        className="text-[9.5px] uppercase tracking-[0.16em] mb-1.5"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className="text-[15px] tabular-nums tracking-[-0.005em]"
        style={{
          color: accent ? T.accent : T.ink,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ icon: Icon, label, color, bg }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
      style={{
        background: bg,
        color,
        borderRadius: '4px',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {Icon && <Icon size={10} strokeWidth={2.25} />}
      {label}
    </span>
  );
}

function Callout({ variant = 'info', icon: Icon, children }) {
  const variants = {
    info: { fg: T.accent, bg: 'rgba(79, 46, 232, 0.06)', border: 'rgba(79, 46, 232, 0.12)' },
    warning: { fg: '#B8820E', bg: 'rgba(184, 130, 14, 0.06)', border: 'rgba(184, 130, 14, 0.15)' },
    success: { fg: T.green, bg: 'rgba(26, 127, 75, 0.06)', border: 'rgba(26, 127, 75, 0.15)' },
    error: { fg: T.red, bg: 'rgba(197, 48, 48, 0.06)', border: 'rgba(197, 48, 48, 0.15)' },
  };
  const c = variants[variant] || variants.info;

  return (
    <div
      className="flex items-start gap-2.5 px-4 py-3"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '6px',
      }}
    >
      {Icon && (
        <Icon
          size={14}
          strokeWidth={1.75}
          style={{ color: c.fg, flexShrink: 0, marginTop: 2 }}
        />
      )}
      <div
        className="text-[12.5px] leading-[1.55] flex-1"
        style={{ color: c.fg, fontWeight: 450 }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página — lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function UnirseTandaPage() {
  const router = useRouter();
  const { id } = router.query;

  // ─── Auth desde el contexto ────────────────────────────
  const { user, loading: authLoading, openLogin } = useAuth();

  const [tanda, setTanda] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState(null);
  const [posicionesDisponibles, setPosicionesDisponibles] = useState([]);
  const [posicionSeleccionada, setPosicionSeleccionada] = useState(null);
  const [posicionFinal, setPosicionFinal] = useState(null);
  const [mostrarContrato, setMostrarContrato] = useState(false);
  const [contratoAceptado, setContratoAceptado] = useState(false);
  const [nivelPermitido, setNivelPermitido] = useState(null);
  const [nivelMaximoParticipado, setNivelMaximoParticipado] = useState(0);
  const [haParticipado, setHaParticipado] = useState(false);
  const [toast, setToast] = useState(null);
  const [cargandoVerificacion, setCargandoVerificacion] = useState(false);

  // ─── Persistencia del paso en localStorage ─────────────────
  useEffect(() => {
    if (id && paso > 1 && paso < 5) {
      localStorage.setItem(`tanda_unirse_paso_${id}`, paso.toString());
    }
    if (paso === 5) {
      localStorage.removeItem(`tanda_unirse_paso_${id}`);
    }
  }, [paso, id]);

  // ─── Autenticación y carga inicial ─────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Sin sesión → abrir el dropdown de login
      setLoading(false);
      openLogin();
      return;
    }

    if (id) {
      cargarDatos(user.id);
    }
  }, [id, user, authLoading, openLogin]);

  const cargarDatos = async (clientId) => {
    try {
      setLoading(true);
      setError('');

      const [tandaData, miembrosData] = await Promise.all([
        getTandaById(id),
        getMiembrosTanda(id),
      ]);

      if (!tandaData) {
        setError('La tanda no existe o no está disponible');
        setLoading(false);
        return;
      }

      setTanda(tandaData);
      setMiembros(miembrosData);

      const kyc = await getClientKYC(clientId);
      if (kyc?.estado !== 'aprobado') {
        setError('Debes completar la verificación KYC para unirte a una tanda');
        router.push('/kyc?redirect=' + encodeURIComponent(router.asPath));
        return;
      }

      const verificacion = await canJoinTandaProgresivo(clientId, id);

      if (!verificacion.allowed) {
        setError(verificacion.mensajeUsuario || 'No puedes unirte a esta tanda');
        setNivelPermitido(verificacion.nivelPermitido || 1);
        setNivelMaximoParticipado(verificacion.nivelActual || 0);
        setHaParticipado(verificacion.nivelActual > 0);
        setLoading(false);
        return;
      }

      setNivelPermitido(verificacion.siguienteNivel || 1);
      setNivelMaximoParticipado(verificacion.nivelActual || 0);
      setHaParticipado(verificacion.nivelActual > 0);

      const miembroExistente = miembrosData.find((m) => m.userId === clientId);
      if (miembroExistente) {
        setMemberId(miembroExistente.id);

        const savedPaso = localStorage.getItem(`tanda_unirse_paso_${id}`);
        if (savedPaso && parseInt(savedPaso) > 1) {
          const savedPasoNum = parseInt(savedPaso);
          if (savedPasoNum === 5 && miembroExistente.posicion > 1) {
            setPosicionFinal(miembroExistente.posicion);
            setPaso(5);
          } else if (savedPasoNum === 4 && miembroExistente.gasFeePaid) {
            const disponibles = await getAvailablePositions(id);
            setPosicionesDisponibles(disponibles);
            setPaso(4);
          } else if (savedPasoNum === 3 && !miembroExistente.gasFeePaid) {
            setPaso(3);
          } else if (savedPasoNum === 2) {
            setPaso(2);
          } else {
            determinarPaso(miembroExistente, miembrosData);
          }
        } else {
          determinarPaso(miembroExistente, miembrosData);
        }
      } else {
        setPaso(1);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar la información de la tanda. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const determinarPaso = (miembro, miembrosData) => {
    if (miembro.gasFeePaid && miembro.posicion > 1) {
      setPosicionFinal(miembro.posicion);
      setPaso(5);
    } else if (miembro.gasFeePaid) {
      getAvailablePositions(id).then((disponibles) => {
        setPosicionesDisponibles(disponibles);
        setPaso(4);
      });
    } else {
      setPaso(3);
    }
  };

  // ─── Funciones de acción ──────────────────────────────────
  const handleUnirse = async () => {
    if (!user) {
      openLogin();
      return;
    }
    try {
      setProcesando(true);
      setError('');

      const miembro = await joinTanda(user.id, id);
      setMemberId(miembro.id);
      setPaso(2);
      setToast({
        message: 'Registro exitoso, ahora revisa los términos',
        type: 'success',
      });
    } catch (error) {
      console.error('Error al unirse:', error);
      setError(error.message || 'Error al unirse a la tanda');
    } finally {
      setProcesando(false);
    }
  };

  const handlePagarGasolina = async () => {
    try {
      setProcesando(true);
      setError('');

      let currentMemberId = memberId;
      if (!currentMemberId) {
        const miembrosActualizados = await getMiembrosTanda(id);
        const miMiembro = miembrosActualizados.find(
          (m) => m.userId === user?.id
        );
        if (!miMiembro) {
          throw new Error('No se encontró tu membresía');
        }
        currentMemberId = miMiembro.id;
        setMemberId(currentMemberId);
      }

      await pagarGasolina(currentMemberId);

      const disponibles = await getAvailablePositions(id);
      setPosicionesDisponibles(disponibles);
      setPaso(4);
      setToast({
        message: 'Pago de gasolina registrado, elige tu posición',
        type: 'success',
      });
    } catch (error) {
      console.error('Error pagando gasolina:', error);
      setError(error.message || 'Error al procesar el pago de gasolina');
    } finally {
      setProcesando(false);
    }
  };

  const handleSeleccionarPosicion = async () => {
    if (!posicionSeleccionada) {
      setError('Selecciona un número disponible');
      return;
    }

    try {
      setProcesando(true);
      setError('');

      await selectPosition(memberId, posicionSeleccionada);
      setPosicionFinal(posicionSeleccionada);
      setPaso(5);
      localStorage.removeItem(`tanda_unirse_paso_${id}`);
      setToast({
        message: `Posición #${posicionSeleccionada} confirmada!`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error seleccionando posición:', error);
      setError(error.message || 'Error al seleccionar tu posición');
    } finally {
      setProcesando(false);
    }
  };

  const handleAceptarContrato = () => {
    setContratoAceptado(true);
    setMostrarContrato(false);
    setPaso(3);
    setToast({
      message: 'Contrato aceptado, ahora paga la gasolina',
      type: 'success',
    });
  };

  const handleReintentar = () => {
    if (user?.id) {
      cargarDatos(user.id);
    } else {
      router.push('/tandas');
    }
  };

  // ─── Formateadores ────────────────────────────────────────
  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Por determinar';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFechaEntrega = () => {
    if (!posicionFinal || !tanda) return 'Por determinar';

    const fechaInicio = new Date(
      tanda.fechaInicio || tanda.startDate || new Date()
    );
    const semanasEspera = posicionFinal - 1;

    const freq = tanda.frecuencia || tanda.frequency;
    if (freq === 'semanal' || freq === 'weekly') {
      fechaInicio.setDate(fechaInicio.getDate() + semanasEspera * 7);
    } else if (freq === 'quincenal' || freq === 'biweekly') {
      fechaInicio.setDate(fechaInicio.getDate() + semanasEspera * 14);
    } else {
      fechaInicio.setMonth(fechaInicio.getMonth() + semanasEspera);
    }

    return formatDate(fechaInicio);
  };

  const getPosicionTexto = () => {
    if (!posicionFinal) return '';
    if (posicionFinal === 1) return 'Administrador';
    if (posicionFinal <= 5) return 'Posición preferente';
    return `Posición ${posicionFinal}`;
  };

  const getPosicionIcono = () => {
    if (!posicionFinal) return null;
    if (posicionFinal === 1) return Crown;
    if (posicionFinal <= 5) return Star;
    return Hash;
  };

  const PosicionIcono = useMemo(() => getPosicionIcono(), [posicionFinal]);

  const steps = useMemo(
    () => [
      { num: 1, label: 'Información', icon: Target },
      { num: 2, label: 'Términos', icon: FileText },
      { num: 3, label: 'Gasolina', icon: Fuel },
      { num: 4, label: 'Elegir #', icon: Hash },
      { num: 5, label: 'Confirmar', icon: CheckCircle },
    ],
    []
  );

  // Notificaciones dummy
  const notifications = [
    { id: 1, title: '¡Nueva colección!', description: 'Descubre la línea Otoño 2026', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Estados de carga y error ─────────────────────────────
  if (loading || authLoading) {
    return (
      <>
        <Head><title>Cargando | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span
                className="font-serif text-[32px] block mb-5 select-none"
                style={{ color: T.inkGhost }}
              >
                ʃƪʃƪ
              </span>
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Cargando información
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Sin sesión ───────────────────────────────────────────
  if (!user) {
    return (
      <>
        <Head><title>Inicia sesión | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/tandas" />
          <TerminalBar mode="rotating" />
          <Header />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center mb-6"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(79, 46, 232, 0.06)',
                  borderRadius: '12px',
                }}
              >
                <AlertCircle size={28} strokeWidth={1.5} style={{ color: T.accent }} />
              </div>
              <h1
                className="text-[32px] md:text-[40px] leading-tight tracking-[-0.03em] mb-3"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Inicia sesión
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  para continuar.
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas una cuenta para unirte a esta tanda.
              </p>
              <button
                onClick={openLogin}
                className="h-11 px-6 text-white text-[13.5px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Iniciar sesión
              </button>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Error inicial ────────────────────────────────────────
  if (error && paso === 1 && !tanda) {
    return (
      <>
        <Head><title>Error | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/tandas" />
          <TerminalBar mode="rotating" />
          <Header />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <XCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Error
              </h1>
              <p
                className="text-[13.5px] mb-8"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReintentar}
                  className="inline-flex items-center gap-2 h-11 px-6 text-white text-[13.5px]"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                >
                  <RefreshCw size={14} strokeWidth={1.75} /> Reintentar
                </button>
                <Link
                  href="/tandas"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 text-[13.5px]"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontWeight: 500,
                    textDecoration: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ChevronLeft size={14} strokeWidth={1.75} /> Volver a tandas
                </Link>
              </div>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Renderizado principal ────────────────────────────────
  return (
    <>
      <Head>
        <title>
          {tanda ? `Unirse a ${tanda.nombre}` : 'Unirse a Tanda'} | MarketDesliz
        </title>
        <meta
          name="description"
          content={`Únete a la tanda "${tanda?.nombre}" y comienza a ahorrar con MarketDesliz.`}
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/tandas" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[900px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero editorial ──────────────────────────── */}
          <section className="mb-10">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Unirse a tanda · MarketDesliz
            </p>

            <h1
              className="text-[36px] md:text-[52px] leading-[1.02] tracking-[-0.035em] max-w-3xl mb-5"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              {tanda?.nombre || 'Tanda'}
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}— únete.
              </span>
            </h1>

            {tanda?.descripcion && (
              <p
                className="text-[15px] md:text-[17px] leading-[1.5] max-w-xl mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {tanda.descripcion}
              </p>
            )}

            {/* Meta de la tanda */}
            <div
              className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 mt-2"
              style={{ borderTop: `1px solid ${T.line}` }}
            >
              <MetaItem
                icon={DollarSign}
                label="Por turno"
                value={formatMoney(tanda?.montoTotal || tanda?.monto)}
              />
              <MetaItem
                icon={Calendar}
                label="Frecuencia"
                value={
                  (tanda?.frecuencia || tanda?.frequency) === 'semanal' ||
                  (tanda?.frecuencia || tanda?.frequency) === 'weekly'
                    ? 'Semanal'
                    : (tanda?.frecuencia || tanda?.frequency) === 'quincenal' ||
                      (tanda?.frecuencia || tanda?.frequency) === 'biweekly'
                    ? 'Quincenal'
                    : 'Mensual'
                }
              />
              <MetaItem
                icon={Users}
                label="Participantes"
                value={`${miembros.length} / ${tanda?.cupoMaximo || tanda?.totalMembers || 0}`}
              />
              <MetaItem
                icon={Hash}
                label="Nivel"
                value={`Nivel ${tanda?.nivelRequerido || 1}`}
              />
            </div>
          </section>

          {/* ─── Steps ───────────────────────────────────── */}
          <section className="mb-10">
            <StepIndicator steps={steps} paso={paso} />
          </section>

          {/* ─── Errores / advertencias ─────────────────── */}
          {error && paso !== 1 && (
            <div className="mb-6">
              <Callout variant="error" icon={AlertCircle}>
                {error}
              </Callout>
            </div>
          )}

          {nivelPermitido && tanda?.nivelRequerido > nivelPermitido && (
            <div className="mb-6">
              <Callout variant="warning" icon={AlertCircle}>
                <p
                  className="mb-1"
                  style={{ fontWeight: 500, letterSpacing: '-0.005em' }}
                >
                  Nivel no disponible
                </p>
                <p>
                  Completa primero las tandas de nivel {nivelPermitido - 1} para
                  desbloquear este nivel. Tu progreso actual: nivel máximo
                  participado {nivelMaximoParticipado}.
                </p>
              </Callout>
            </div>
          )}

          {/* ═══════════ PASO 1 · Información ═══════════ */}
          {paso === 1 && (
            <section className="flex flex-col gap-6">
              {/* Progreso */}
              <div
                className="p-5"
                style={{
                  background: 'rgba(79, 46, 232, 0.04)',
                  border: `1px solid rgba(79, 46, 232, 0.12)`,
                  borderRadius: '8px',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={13} strokeWidth={1.75} style={{ color: T.accent }} />
                  <p
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    Tu progreso en tandas
                  </p>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <span
                    className="text-[12px]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Nivel máximo alcanzado
                  </span>
                  <span
                    className="text-[15px] tabular-nums"
                    style={{
                      color: T.accent,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    Nivel {nivelMaximoParticipado || 1}
                  </span>
                </div>
                <div
                  className="w-full overflow-hidden mb-3"
                  style={{
                    height: '5px',
                    background: 'rgba(15,15,15,0.06)',
                    borderRadius: '3px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(
                        100,
                        ((nivelMaximoParticipado || 0) / 10) * 100
                      )}%`,
                      background: T.accent,
                      borderRadius: '3px',
                      transition: `width 0.6s ${T.ease}`,
                    }}
                  />
                </div>
                <p
                  className="text-[12px] leading-[1.55]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {nivelMaximoParticipado === 0
                    ? 'Esta será tu primera tanda (Nivel 1)'
                    : `Puedes unirte a tandas hasta nivel ${
                        nivelPermitido || nivelMaximoParticipado + 1
                      }`}
                </p>
              </div>

              {/* Stats grid */}
              <div
                className="grid grid-cols-2 md:grid-cols-4"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <StatCell
                  icon={Users}
                  label="Participantes"
                  value={`${miembros.length} / ${
                    tanda?.cupoMaximo || tanda?.totalMembers || 0
                  }`}
                  border={false}
                />
                <StatCell
                  icon={TrendingUp}
                  label="Disponibles"
                  value={
                    (tanda?.cupoMaximo || tanda?.totalMembers || 0) -
                    miembros.length
                  }
                  accent
                />
                <StatCell icon={Fuel} label="Gasolina" value="$25" />
                <StatCell icon={Hash} label="Tu posición" value="A elegir" />
              </div>

              {/* Miembros */}
              <div>
                <SectionLabel>Miembros actuales</SectionLabel>
                <div
                  className="flex flex-col max-h-72 overflow-y-auto"
                  style={{
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {miembros.map((m, idx) => (
                    <div
                      key={m.id}
                      className="flex justify-between items-center px-4 py-3"
                      style={{
                        borderTop: idx === 0 ? 'none' : `1px solid ${T.line}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: '30px',
                            height: '30px',
                            background:
                              m.posicion === 1
                                ? T.accent
                                : 'rgba(15,15,15,0.05)',
                            color: m.posicion === 1 ? '#FFFFFF' : T.inkMid,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {m.posicion}
                        </div>
                        <span
                          className="text-[13px] flex items-center gap-1.5"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {m.posicion === 1
                            ? 'MarketDesliz (Admin)'
                            : `Participante ${m.posicion}`}
                          {m.posicion <= 5 && m.posicion > 1 && (
                            <Star
                              size={11}
                              strokeWidth={2}
                              style={{ color: '#B8820E' }}
                            />
                          )}
                        </span>
                      </div>
                      <StatusBadge
                        icon={CheckCircle}
                        label="Activo"
                        color={T.green}
                        bg="rgba(26, 127, 75, 0.08)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <PrimaryButton
                onClick={handleUnirse}
                disabled={
                  procesando ||
                  miembros.length >=
                    (tanda?.cupoMaximo || tanda?.totalMembers || 0) ||
                  tanda?.nivelRequerido >
                    (nivelPermitido || nivelMaximoParticipado + 1)
                }
                loading={procesando}
                icon={Target}
              >
                {procesando
                  ? 'Procesando...'
                  : miembros.length >=
                    (tanda?.cupoMaximo || tanda?.totalMembers || 0)
                  ? 'Tanda completa'
                  : 'Continuar'}
              </PrimaryButton>

              <BackLink href="/tandas" label="Volver a tandas" />
            </section>
          )}

          {/* ═══════════ PASO 2 · Términos ═══════════ */}
          {paso === 2 && (
            <section className="flex flex-col gap-6">
              <div>
                <SectionLabel>Términos y responsabilidades</SectionLabel>

                <div
                  className="p-5 max-h-80 overflow-y-auto"
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                  }}
                >
                  <p
                    className="text-[12.5px] mb-4"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    Al unirte a esta tanda, aceptas:
                  </p>
                  <ul className="flex flex-col gap-3">
                    {[
                      'Realizar los pagos semanales de forma puntual',
                      'La posición 1 es del administrador (MarketDesliz)',
                      'No abandonar la tanda después de recibir el dinero',
                      'Pagar la gasolina de $25 (único pago)',
                      'Respetar el orden de turnos establecido',
                      'Los pagos atrasados afectan a todo el grupo',
                      'La posición se elige después del pago de gasolina',
                      'No puedes elegir la posición #1',
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-[12.5px] leading-[1.55]"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        <CheckCircle
                          size={13}
                          strokeWidth={2}
                          style={{ color: T.green, flexShrink: 0, marginTop: 2 }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-0.5"
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: T.accent,
                    cursor: 'pointer',
                  }}
                />
                <span
                  className="text-[13px] leading-[1.55]"
                  style={{ color: T.inkMid, fontWeight: 450 }}
                >
                  He leído y acepto los términos y condiciones, y acepto las
                  responsabilidades como participante.
                </span>
              </label>

              <PrimaryButton
                onClick={() => setMostrarContrato(true)}
                disabled={!aceptaTerminos}
                icon={FileText}
              >
                Ver contrato digital
              </PrimaryButton>

              <BackLink onClick={() => setPaso(1)} label="Volver" />
            </section>
          )}

          {/* ═══════════ PASO 3 · Gasolina ═══════════ */}
          {paso === 3 && (
            <section className="flex flex-col gap-6">
              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center mb-4"
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'rgba(184, 130, 14, 0.08)',
                    borderRadius: '12px',
                  }}
                >
                  <Fuel size={26} strokeWidth={1.5} style={{ color: '#B8820E' }} />
                </div>
                <h2
                  className="text-[24px] md:text-[28px] leading-tight tracking-[-0.025em] mb-2"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  Pago único
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}de inscripción.
                  </span>
                </h2>
                <p
                  className="text-[13.5px] leading-[1.55] max-w-md mx-auto"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Este pago cubre los gastos de administración de la tanda.
                </p>
              </div>

              <div
                className="flex items-center justify-center gap-2 py-5"
                style={{
                  background: 'rgba(26, 127, 75, 0.05)',
                  border: `1px solid rgba(26, 127, 75, 0.15)`,
                  borderRadius: '8px',
                }}
              >
                <DollarSign size={18} strokeWidth={1.75} style={{ color: T.green }} />
                <span
                  className="text-[20px] tabular-nums tracking-[-0.02em]"
                  style={{
                    color: T.green,
                    fontWeight: 500,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  $25
                </span>
              </div>

              <Callout variant="info" icon={AlertCircle}>
                Después del pago podrás elegir tu número de posición.
              </Callout>

              <PrimaryButton
                onClick={handlePagarGasolina}
                disabled={procesando}
                loading={procesando}
                icon={Fuel}
              >
                {procesando ? 'Procesando pago...' : 'Pagar $25 y continuar'}
              </PrimaryButton>

              <BackLink onClick={() => setPaso(2)} label="Volver" />
            </section>
          )}

          {/* ═══════════ PASO 4 · Elegir número ═══════════ */}
          {paso === 4 && (
            <section className="flex flex-col gap-6">
              <div className="text-center">
                <h2
                  className="text-[24px] md:text-[28px] leading-tight tracking-[-0.025em] mb-2"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  Elige tu
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}número.
                  </span>
                </h2>
                <p
                  className="text-[13.5px] leading-[1.55]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Selecciona la posición que deseas en la tanda.
                </p>
              </div>

              <Callout variant="warning" icon={AlertCircle}>
                <strong style={{ fontWeight: 500 }}>Importante:</strong> La
                posición #1 es del administrador (MarketDesliz) y no está
                disponible. Elige entre los números disponibles.
              </Callout>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                {Array.from(
                  {
                    length:
                      tanda?.cupoMaximo || tanda?.totalMembers || 0,
                  },
                  (_, i) => i + 1
                ).map((num) => {
                  const isAvailable = posicionesDisponibles.includes(num);
                  const isSelected = posicionSeleccionada === num;
                  const isAdmin = num === 1;

                  return (
                    <button
                      key={num}
                      onClick={() => {
                        if (isAvailable) {
                          setPosicionSeleccionada(num);
                          setError('');
                        } else if (isAdmin) {
                          setError('La posición #1 es del administrador');
                        } else {
                          setError('Esta posición ya está ocupada');
                        }
                      }}
                      disabled={!isAvailable && !isSelected}
                      className="flex flex-col items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
                      style={{
                        padding: '14px 8px',
                        background: isSelected
                          ? T.accent
                          : isAvailable
                          ? 'rgba(26, 127, 75, 0.06)'
                          : 'rgba(15,15,15,0.03)',
                        border: `1px solid ${
                          isSelected
                            ? T.accent
                            : isAvailable
                            ? 'rgba(26, 127, 75, 0.2)'
                            : T.line
                        }`,
                        borderRadius: '6px',
                        color: isSelected
                          ? '#FFFFFF'
                          : isAvailable
                          ? T.green
                          : T.inkFaint,
                        cursor:
                          isAvailable || isSelected ? 'pointer' : 'not-allowed',
                        WebkitTapHighlightColor: 'transparent',
                        transitionTimingFunction: T.ease,
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (isAvailable && !isSelected) {
                          e.currentTarget.style.background =
                            'rgba(26, 127, 75, 0.12)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isAvailable && !isSelected) {
                          e.currentTarget.style.background =
                            'rgba(26, 127, 75, 0.06)';
                        }
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: '18px',
                          fontWeight: 500,
                          fontFeatureSettings: '"tnum"',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {num}
                      </span>
                      <span
                        className="uppercase"
                        style={{
                          fontSize: '8.5px',
                          letterSpacing: '0.14em',
                          marginTop: '4px',
                          fontWeight: 600,
                          opacity: 0.85,
                        }}
                      >
                        {isAdmin
                          ? 'Admin'
                          : isAvailable
                          ? 'Libre'
                          : 'Ocupado'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <PrimaryButton
                onClick={handleSeleccionarPosicion}
                disabled={!posicionSeleccionada || procesando}
                loading={procesando}
                icon={Hash}
              >
                {procesando
                  ? 'Guardando...'
                  : `Confirmar posición #${posicionSeleccionada || '?'}`}
              </PrimaryButton>

              <BackLink onClick={() => setPaso(3)} label="Volver" />
            </section>
          )}

          {/* ═══════════ PASO 5 · Confirmación ═══════════ */}
          {paso === 5 && (
            <section className="flex flex-col gap-6">
              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center mb-4"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: 'rgba(26, 127, 75, 0.08)',
                    borderRadius: '14px',
                  }}
                >
                  <CheckCircle
                    size={32}
                    strokeWidth={1.5}
                    style={{ color: T.green }}
                  />
                </div>
                <h2
                  className="text-[28px] md:text-[36px] leading-[1.05] tracking-[-0.03em] mb-3"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  Te has unido
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}exitosamente.
                  </span>
                </h2>
                <p
                  className="text-[13.5px] leading-[1.55]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Ya eres parte de la tanda {tanda?.nombre}.
                </p>
              </div>

              <div
                className="grid grid-cols-2"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <StatCell
                  icon={PosicionIcono || Hash}
                  label="Tu posición"
                  value={getPosicionTexto()}
                  accent
                  border={false}
                />
                <StatCell
                  icon={Calendar}
                  label="Entrega estimada"
                  value={getFechaEntrega()}
                />
              </div>

              <div
                className="p-5"
                style={{
                  background: 'rgba(79, 46, 232, 0.04)',
                  border: `1px solid rgba(79, 46, 232, 0.12)`,
                  borderRadius: '8px',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks size={13} strokeWidth={1.75} style={{ color: T.accent }} />
                  <p
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    Próximos pasos
                  </p>
                </div>
                <ul className="flex flex-col gap-2">
                  {[
                    'Pago de gasolina completado',
                    `Posición #${posicionFinal} confirmada`,
                    'Espera a que comience la tanda',
                    'Realiza tus pagos semanales puntualmente',
                    `Recibirás tu dinero en la semana ${posicionFinal}`,
                    'El cobrador te visitará en la fecha acordada',
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-[12.5px] leading-[1.5]"
                      style={{ color: T.accent, fontWeight: 450 }}
                    >
                      <CheckCircle size={12} strokeWidth={2.25} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/tandas/mis-tandas"
                className="flex items-center justify-center gap-2 h-11 text-white text-[13.5px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                <Target size={14} strokeWidth={1.75} /> Ver mis tandas
              </Link>

              <BackLink href="/" label="Volver al inicio" />
            </section>
          )}

          {/* ─── Info pago en dos partes ─────────────────── */}
          {tanda?.pagoEnDosPartes && (
            <section className="mt-10">
              <Callout variant="info" icon={CreditCard}>
                <p className="mb-2" style={{ fontWeight: 500 }}>
                  Pago en dos partes
                </p>
                <ul className="flex flex-col gap-1.5">
                  <li>· Primera parte (50%): Al recibir tu turno</li>
                  <li>· Segunda parte (50% restante): Al finalizar la tanda</li>
                  <li>· Recibirás un recordatorio para la segunda parte</li>
                </ul>
              </Callout>
            </section>
          )}
        </main>

        <Footer variant="minimal" />
      </div>

      {/* ─── Modal de contrato ────────────────────────────── */}
      {mostrarContrato && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setMostrarContrato(false)}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto flex flex-col"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="sticky top-0 px-6 py-5"
              style={{
                background: T.bg,
                borderBottom: `1px solid ${T.line}`,
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.28em] mb-2"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Contrato
              </p>
              <h2
                className="text-[22px] leading-tight tracking-[-0.025em]"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Contrato
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  {' '}de participación.
                </span>
              </h2>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-6">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.18em] mb-3"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  Responsabilidades del participante
                </p>
                <ul className="flex flex-col gap-2">
                  {[
                    'Realizar los pagos semanales de forma puntual en la fecha acordada.',
                    'Mantener comunicación con el administrador ante cualquier eventualidad.',
                    'Los pagos atrasados afectan a todo el grupo y pueden resultar en la pérdida de tu turno.',
                    'Aceptar que la posición #1 es del administrador (MarketDesliz).',
                    'El pago de gasolina de $25 es único y no reembolsable.',
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[12.5px] leading-[1.55]"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      <span
                        style={{
                          color: T.inkFaint,
                          flexShrink: 0,
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        →
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.18em] mb-3"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  Condiciones generales
                </p>
                <ul className="flex flex-col gap-2">
                  {[
                    'El orden de turnos se define por antigüedad y selección del participante.',
                    'Cualquier incumplimiento puede resultar en la exclusión de futuras tandas.',
                    'La información de los participantes es visible solo para miembros de la tanda.',
                    'MarketDesliz actúa como administrador y facilitador del grupo.',
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[12.5px] leading-[1.55]"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      <span
                        style={{
                          color: T.inkFaint,
                          flexShrink: 0,
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        →
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p
                className="text-[11.5px] leading-[1.55] pt-2"
                style={{
                  color: T.inkFaint,
                  fontWeight: 450,
                  borderTop: `1px solid ${T.line}`,
                  paddingTop: '16px',
                }}
              >
                Al aceptar, confirmas que has leído y comprendes todos los
                términos y condiciones.
              </p>
            </div>

            {/* Footer */}
            <div
              className="sticky bottom-0 px-6 py-4 flex gap-2.5"
              style={{
                background: T.bg,
                borderTop: `1px solid ${T.line}`,
              }}
            >
              <button
                onClick={() => setMostrarContrato(false)}
                className="flex-1 h-11 text-[13px] transition-colors"
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontWeight: 500,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptarContrato}
                className="flex-1 h-11 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Aceptar y continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family: ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino', Georgia, 'Times New Roman', serif;
        }
        ::selection { background: rgba(79, 46, 232, 0.12); color: #0F0F0F; }
        * { -webkit-tap-highlight-color: transparent; font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1; }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MetaItem — dato de la barra meta del hero
// ─────────────────────────────────────────────────────────────────────────
function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} strokeWidth={1.75} style={{ color: T.inkFaint }} />
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {label}
        </span>
        <span
          className="text-[13px] tabular-nums tracking-[-0.005em]"
          style={{
            color: T.ink,
            fontWeight: 500,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PrimaryButton — botón principal del wizard
// ─────────────────────────────────────────────────────────────────────────
function PrimaryButton({
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  children,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 h-11 text-white text-[13.5px]"
      style={{
        background: disabled ? 'rgba(15,15,15,0.15)' : T.accent,
        borderRadius: '6px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = T.accentDeep;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = T.accent;
      }}
    >
      {loading ? (
        <div
          className="border-2 border-white/40 border-t-white rounded-full animate-spin"
          style={{ width: '14px', height: '14px' }}
        />
      ) : (
        Icon && <Icon size={14} strokeWidth={1.75} />
      )}
      <span>{children}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BackLink — enlace secundario de "volver"
// ─────────────────────────────────────────────────────────────────────────
function BackLink({ href, label, onClick }) {
  const [hover, setHover] = useState(false);

  const commonProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    className:
      'flex items-center justify-center gap-1.5 w-full py-2 text-[12px] uppercase tracking-[0.16em]',
    style: {
      color: hover ? T.accent : T.inkFaint,
      fontWeight: 500,
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
      WebkitTapHighlightColor: 'transparent',
      transition: `color 0.2s ${T.ease}`,
    },
  };

  if (href) {
    return (
      <Link href={href} {...commonProps}>
        <ChevronLeft size={12} strokeWidth={1.75} /> {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} {...commonProps}>
      <ChevronLeft size={12} strokeWidth={1.75} /> {label}
    </button>
  );
}