// src/pages/tandas/mis-tandas.js
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Target, DollarSign, Calendar, Clock, CheckCircle, XCircle,
  AlertCircle, Eye, FileText, ChevronLeft, ChevronRight,
  Award, Crown, Star, CalendarDays, History, Filter, RefreshCw,
  Bell, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import {
  getClientTandas,
  getTandaPayments,
  getMiembroById,
} from '../../lib/tandasService';
import {
  enviarRecordatorioManual,
  getEstadoPagoMiembro,
} from '../../lib/tandaPagosService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

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

function StatBlock({ icon: Icon, label, value, accent = false, border = true }) {
  return (
    <div
      className="p-5 md:p-6"
      style={{
        borderLeft: border ? `1px solid ${T.line}` : 'none',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          size={13}
          strokeWidth={1.75}
          style={{ color: accent ? T.accent : T.inkFaint }}
        />
        <p
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-[24px] md:text-[28px] tabular-nums tracking-[-0.02em] leading-none"
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
      <Icon size={10} strokeWidth={2.25} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página — lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function MisTandasPage() {
  const router = useRouter();
  const { estado = 'todas', page = 1 } = router.query;

  // ─── Auth desde el contexto ────────────────────────────
  const { user, loading: authLoading, openLogin } = useAuth();

  const [tandas, setTandas] = useState([]);
  const [filteredTandas, setFilteredTandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTanda, setSelectedTanda] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [showPagosModal, setShowPagosModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState(estado);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalInvertido: 0,
    totalRecibido: 0,
    tandasActivas: 0,
    tandasCompletadas: 0,
    tandasPendientes: 0,
  });
  const itemsPerPage = 10;

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarMisTandas = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const misTandas = await getClientTandas(user.id);

      let totalInvertido = 0;
      let totalRecibido = 0;
      let activas = 0;
      let completadas = 0;
      let pendientes = 0;

      const tandasConPagos = await Promise.all(
        misTandas.map(async (tanda) => {
          try {
            const pagosData = await getTandaPayments(tanda.id);
            const pagosRealizados = pagosData.filter((p) => p.estado === 'pagado');
            const totalPagado = pagosRealizados.reduce(
              (sum, p) => sum + (p.monto || 0),
              0
            );
            const estadoPago = await getEstadoPagoMiembro(tanda.id);

            return {
              ...tanda,
              pagos: pagosData,
              totalPagado,
              pagosRealizadosCount: pagosRealizados.length,
              estadoPagoCompleto: estadoPago,
              montoTotalTanda: tanda.monto || 0,
            };
          } catch (e) {
            console.warn('Error obteniendo pagos para tanda', tanda.id, e);
            return {
              ...tanda,
              pagos: [],
              totalPagado: 0,
              pagosRealizadosCount: 0,
              estadoPagoCompleto: { estadoCompleto: false },
              montoTotalTanda: tanda.monto || 0,
            };
          }
        })
      );

      setTandas(tandasConPagos);

      tandasConPagos.forEach((t) => {
        const estado = t.estadoPago || 'pendiente';
        if (estado === 'pagado' || t.estadoPagoCompleto?.estadoCompleto) {
          completadas++;
          totalRecibido += t.montoTotalTanda || 0;
        } else if (estado === 'al_corriente' || estado === 'pendiente') {
          if (t.pagoPrimeraParte && !t.pagoSegundaParte) {
            pendientes++;
          } else {
            activas++;
          }
          totalInvertido += t.totalPagado || 0;
        } else {
          pendientes++;
        }
      });

      setStats({
        totalInvertido,
        totalRecibido,
        tandasActivas: activas,
        tandasCompletadas: completadas,
        tandasPendientes: pendientes,
      });
    } catch (err) {
      console.error('Error cargando mis tandas:', err);
      setError('No pudimos cargar tus tandas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Aplicar filtro y paginación ──────────────────────────────────────
  const tandasFiltradas = useMemo(() => {
    let result = tandas;
    if (filtroEstado !== 'todas') {
      result = result.filter((t) => {
        const estado = t.estadoPago || 'pendiente';
        if (filtroEstado === 'activas') {
          return estado === 'al_corriente' || estado === 'pendiente';
        }
        if (filtroEstado === 'completadas') {
          return estado === 'pagado' || t.estadoPagoCompleto?.estadoCompleto;
        }
        if (filtroEstado === 'pendientes') {
          return (
            estado === 'pendiente' ||
            (t.pagoPrimeraParte && !t.pagoSegundaParte)
          );
        }
        return true;
      });
    }
    result.sort((a, b) => {
      const order = { al_corriente: 0, pendiente: 1, pagado: 2 };
      const aOrder = order[a.estadoPago] ?? 1;
      const bOrder = order[b.estadoPago] ?? 1;
      return aOrder - bOrder;
    });
    return result;
  }, [tandas, filtroEstado]);

  const totalPages = Math.ceil(tandasFiltradas.length / itemsPerPage);
  const paginatedTandas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tandasFiltradas.slice(start, start + itemsPerPage);
  }, [tandasFiltradas, currentPage]);

  // ─── Cargar datos cuando auth esté listo y haya usuario ──────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Sin sesión → abrir el dropdown de login
      setLoading(false);
      openLogin();
      return;
    }

    cargarMisTandas();
  }, [authLoading, user, cargarMisTandas, openLogin]);

  // ─── Sincronizar filtro y página con URL ─────────────────────────────
  useEffect(() => {
    const query = {
      estado: filtroEstado !== 'todas' ? filtroEstado : undefined,
      page: currentPage > 1 ? currentPage : undefined,
    };
    Object.keys(query).forEach((k) => {
      if (query[k] === undefined) delete query[k];
    });
    router.push(
      { pathname: '/tandas/mis-tandas', query },
      undefined,
      { shallow: true }
    );
  }, [filtroEstado, currentPage, router]);

  // ─── Funciones de acción ──────────────────────────────────────────────
  const enviarRecordatorio = async (tandaMemberId) => {
    try {
      const result = await enviarRecordatorioManual(tandaMemberId);
      if (result.success) {
        setToast({ message: 'Recordatorio enviado correctamente', type: 'success' });
      } else {
        setToast({ message: 'No se pudo enviar el recordatorio', type: 'error' });
      }
    } catch (err) {
      console.error('Error enviando recordatorio:', err);
      setToast({ message: 'Error al enviar el recordatorio', type: 'error' });
    }
  };

  const verDetallesPagos = async (tanda) => {
    try {
      setPagos(tanda.pagos || []);
      setSelectedTanda(tanda);
      setShowPagosModal(true);
    } catch (error) {
      console.error('Error mostrando pagos:', error);
      setToast({ message: 'Error al cargar los pagos', type: 'error' });
    }
  };

  // ─── Formateadores ──────────────────────────────────────────────────────
  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusInfo = (estado, posicion, pagoCompleto) => {
    const statusMap = {
      pendiente: {
        label: 'Pendiente',
        color: '#B8820E',
        bg: 'rgba(184, 130, 14, 0.08)',
        icon: Clock,
      },
      al_corriente: {
        label: 'Al corriente',
        color: T.green,
        bg: 'rgba(26, 127, 75, 0.08)',
        icon: CheckCircle,
      },
      pagado: {
        label: 'Completada',
        color: T.accent,
        bg: 'rgba(79, 46, 232, 0.08)',
        icon: CheckCircle,
      },
      atrasado: {
        label: 'Atrasada',
        color: T.red,
        bg: 'rgba(197, 48, 48, 0.08)',
        icon: AlertCircle,
      },
    };

    if (posicion === 1) {
      return {
        label: 'Administrador',
        color: T.accent,
        bg: 'rgba(79, 46, 232, 0.08)',
        icon: Crown,
      };
    }

    if (pagoCompleto?.estadoCompleto) {
      return {
        label: 'Completada',
        color: T.accent,
        bg: 'rgba(79, 46, 232, 0.08)',
        icon: CheckCircle,
      };
    }

    if (
      estado === 'al_corriente' &&
      pagoCompleto?.tienePrimeraParte &&
      !pagoCompleto?.tieneSegundaParte
    ) {
      return {
        label: 'Pendiente 2ª parte',
        color: '#B8820E',
        bg: 'rgba(184, 130, 14, 0.08)',
        icon: AlertCircle,
      };
    }

    return (
      statusMap[estado] || {
        label: estado,
        color: T.inkSoft,
        bg: 'rgba(15, 15, 15, 0.05)',
        icon: FileText,
      }
    );
  };

  const getProgresoPagos = (tanda) => {
    const semanasTotales = tanda.semanasTotales || tanda.totalWeeks || 0;
    if (!semanasTotales) return 0;
    const pagosRealizados = tanda.pagosRealizadosCount || 0;
    return Math.min(100, (pagosRealizados / semanasTotales) * 100);
  };

  const getDiasRestantes = (fechaProximoPago) => {
    if (!fechaProximoPago) return null;
    const hoy = new Date();
    const proximo = new Date(fechaProximoPago);
    const diff = Math.ceil((proximo - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getSemanasRestantes = (tanda) => {
    const semanasTotales = tanda.semanasTotales || tanda.totalWeeks || 0;
    const pagosRealizados = tanda.pagosRealizadosCount || 0;
    return Math.max(0, semanasTotales - pagosRealizados);
  };

  // Notificaciones dummy
  const notifications = [
    { id: 1, title: '¡Nueva colección!', description: 'Descubre la línea Otoño 2026', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Estados de carga y error ─────────────────────────────────────────
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
                Cargando tus tandas
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Sin sesión ────────────────────────────────────────────────────────
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
                <Lock size={28} strokeWidth={1.5} style={{ color: T.accent }} />
              </div>
              <h1
                className="text-[32px] md:text-[40px] leading-tight tracking-[-0.03em] mb-3"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Inicia sesión
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  para ver tus tandas.
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas una cuenta para acceder a tu historial de tandas.
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

  // ─── Error ─────────────────────────────────────────────────────────────
  if (error) {
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
                Error al cargar
              </h1>
              <p
                className="text-[13.5px] mb-8"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <button
                onClick={cargarMisTandas}
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
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Renderizado principal ────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Mis Tandas | MarketDesliz</title>
        <meta
          name="description"
          content="Gestiona tus tandas activas y revisa el progreso de tus pagos."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/tandas" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero editorial ──────────────────────────── */}
          <section className="mb-12">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Mis tandas · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[64px] leading-[1] tracking-[-0.035em] max-w-3xl mb-6"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Tus tandas
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}en curso.
              </span>
            </h1>

            <p
              className="text-[16px] md:text-[20px] leading-[1.5] max-w-xl mb-8"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Revisa el progreso de tus pagos y el estado de cada grupo.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/tandas"
                className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                <Target size={14} strokeWidth={1.75} /> Explorar tandas
              </Link>
            </div>
          </section>

          {/* ─── Stats ───────────────────────────────────── */}
          <section className="mb-12">
            <SectionLabel>Resumen</SectionLabel>
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <StatBlock
                icon={Target}
                label="Tandas activas"
                value={stats.tandasActivas}
                border={false}
              />
              <StatBlock
                icon={CheckCircle}
                label="Completadas"
                value={stats.tandasCompletadas}
              />
              <StatBlock
                icon={Clock}
                label="Pendientes"
                value={stats.tandasPendientes}
              />
              <StatBlock
                icon={DollarSign}
                label="Total recibido"
                value={formatMoney(stats.totalRecibido)}
                accent
              />
            </div>
          </section>

          {/* ─── Filtros ─────────────────────────────────── */}
          <section className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  <Filter size={11} strokeWidth={1.75} />
                  Filtrar
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['todas', 'activas', 'pendientes', 'completadas'].map((opcion) => {
                    const isActive = filtroEstado === opcion;
                    return (
                      <button
                        key={opcion}
                        onClick={() => setFiltroEstado(opcion)}
                        className="h-8 px-3 text-[12px] transition-colors"
                        style={{
                          background: isActive ? T.ink : 'transparent',
                          color: isActive ? T.bg : T.inkMid,
                          border: `1px solid ${isActive ? T.ink : T.line}`,
                          borderRadius: '6px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                          transitionTimingFunction: T.ease,
                        }}
                      >
                        {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span
                className="text-[11px] tabular-nums"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {tandasFiltradas.length}{' '}
                {tandasFiltradas.length === 1 ? 'tanda' : 'tandas'}
              </span>
            </div>
          </section>

          {/* ─── Lista de tandas ─────────────────────────── */}
          {tandasFiltradas.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <Target
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {filtroEstado !== 'todas'
                  ? `No tienes tandas ${filtroEstado}`
                  : 'No estás en ninguna tanda'}
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {filtroEstado !== 'todas'
                  ? 'Cambia el filtro para ver otras tandas.'
                  : 'Únete a una tanda y comienza a ahorrar.'}
              </p>
              {filtroEstado === 'todas' && (
                <Link
                  href="/tandas"
                  className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                >
                  <Target size={14} strokeWidth={1.75} /> Explorar tandas
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 md:gap-5">
                {paginatedTandas.map((tanda) => {
                  const status = getStatusInfo(
                    tanda.estadoPago || tanda.estado,
                    tanda.posicion,
                    tanda.estadoPagoCompleto
                  );
                  const StatusIcon = status.icon;
                  const progreso = getProgresoPagos(tanda);
                  const semanasRestantes = getSemanasRestantes(tanda);
                  const esAdmin = tanda.posicion === 1;
                  const pagoSemanal =
                    tanda.pagoSemanal ||
                    tanda.monto / (tanda.semanasTotales || 12);
                  const diasRestantes = getDiasRestantes(tanda.proximoPago);
                  const tienePendienteSegundaParte =
                    tanda.estadoPagoCompleto?.tienePrimeraParte &&
                    !tanda.estadoPagoCompleto?.tieneSegundaParte;

                  return (
                    <div
                      key={tanda.id}
                      className="flex flex-col"
                      style={{
                        background: T.bg,
                        border: `1px solid ${T.line}`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div className="p-5 md:p-6">
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3
                                className="text-[15.5px] leading-snug tracking-[-0.005em]"
                                style={{ color: T.ink, fontWeight: 500 }}
                              >
                                {tanda.tandaNombre}
                              </h3>
                              {esAdmin && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5"
                                  style={{
                                    background: 'rgba(79, 46, 232, 0.08)',
                                    color: T.accent,
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    fontWeight: 600,
                                  }}
                                >
                                  <Crown size={9} strokeWidth={2.25} /> Admin
                                </span>
                              )}
                              {tanda.posicion <= 5 && !esAdmin && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5"
                                  style={{
                                    background: 'rgba(184, 130, 14, 0.08)',
                                    color: '#B8820E',
                                    borderRadius: '3px',
                                    fontSize: '9px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    fontWeight: 600,
                                  }}
                                >
                                  <Star size={9} strokeWidth={2.25} /> Preferente
                                </span>
                              )}
                            </div>
                            <p
                              className="text-[12px] flex items-center gap-2 flex-wrap tabular-nums"
                              style={{
                                color: T.inkSoft,
                                fontWeight: 450,
                                fontFeatureSettings: '"tnum"',
                              }}
                            >
                              <span>Posición #{tanda.posicion}</span>
                              <span
                                style={{
                                  width: '3px',
                                  height: '3px',
                                  background: T.inkGhost,
                                  borderRadius: '50%',
                                }}
                              />
                              <span>{formatMoney(tanda.monto)}</span>
                              {diasRestantes !== null && diasRestantes >= 0 && (
                                <>
                                  <span
                                    style={{
                                      width: '3px',
                                      height: '3px',
                                      background: T.inkGhost,
                                      borderRadius: '50%',
                                    }}
                                  />
                                  <span
                                    style={{
                                      color:
                                        diasRestantes <= 2 ? T.red : T.inkFaint,
                                      fontWeight: diasRestantes <= 2 ? 500 : 450,
                                    }}
                                  >
                                    {diasRestantes === 0
                                      ? 'Hoy'
                                      : `${diasRestantes} días`}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <StatusBadge
                            icon={StatusIcon}
                            label={status.label}
                            color={status.color}
                            bg={status.bg}
                          />
                        </div>

                        {/* Progreso */}
                        <div className="mb-5">
                          <div className="flex justify-between items-baseline mb-2">
                            <span
                              className="text-[10px] uppercase tracking-[0.18em]"
                              style={{ color: T.inkFaint, fontWeight: 500 }}
                            >
                              Progreso de pagos
                            </span>
                            <span
                              className="text-[12px] tabular-nums"
                              style={{
                                color: T.ink,
                                fontWeight: 500,
                                fontFeatureSettings: '"tnum"',
                              }}
                            >
                              {Math.round(progreso)}%
                            </span>
                          </div>
                          <div
                            className="w-full overflow-hidden"
                            style={{
                              height: '5px',
                              background: 'rgba(15,15,15,0.04)',
                              borderRadius: '3px',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${progreso}%`,
                                background: T.accent,
                                borderRadius: '3px',
                                transition: `width 0.6s ${T.ease}`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] mt-2 tabular-nums" style={{ color: T.inkFaint, fontWeight: 450, fontFeatureSettings: '"tnum"' }}>
                            <span>{tanda.pagosRealizadosCount || 0} pagos realizados</span>
                            <span>{semanasRestantes} semanas restantes</span>
                          </div>
                        </div>

                        {/* Aviso 2ª parte */}
                        {tienePendienteSegundaParte && (
                          <div
                            className="flex items-center justify-between gap-3 px-3 py-2.5 mb-5"
                            style={{
                              background: 'rgba(184, 130, 14, 0.06)',
                              borderLeft: '2px solid #B8820E',
                              borderRadius: '4px',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <AlertCircle
                                size={13}
                                strokeWidth={1.75}
                                style={{ color: '#B8820E', flexShrink: 0 }}
                              />
                              <span
                                className="text-[11.5px] leading-[1.5]"
                                style={{ color: '#8A6109', fontWeight: 450 }}
                              >
                                Pago pendiente: segunda parte (50%)
                              </span>
                            </div>
                            <button
                              onClick={() => enviarRecordatorio(tanda.id)}
                              className="flex items-center gap-1.5 h-8 px-3 text-[11.5px] shrink-0"
                              style={{
                                background: '#B8820E',
                                color: '#FFFFFF',
                                borderRadius: '4px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                              }}
                            >
                              <Bell size={11} strokeWidth={2} /> Recordarme
                            </button>
                          </div>
                        )}

                        {/* Grid info */}
                        <div
                          className="grid grid-cols-2 md:grid-cols-4 mb-5"
                          style={{
                            border: `1px solid ${T.line}`,
                            borderRadius: '6px',
                            overflow: 'hidden',
                          }}
                        >
                          <InfoCell
                            label="Fecha de ingreso"
                            value={formatDate(tanda.joinedAt)}
                            border={false}
                          />
                          <InfoCell
                            label="Pago semanal"
                            value={formatMoney(pagoSemanal)}
                            accent
                          />
                          <InfoCell
                            label="Próximo pago"
                            value={
                              tanda.proximoPago
                                ? formatDate(tanda.proximoPago)
                                : 'Por definir'
                            }
                          />
                          <InfoCell
                            label="Entrega estimada"
                            value={
                              tanda.entregaEstimada || `Semana ${tanda.posicion}`
                            }
                          />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => verDetallesPagos(tanda)}
                            className="flex-1 flex items-center justify-center gap-2 h-11 text-[13px] transition-colors"
                            style={{
                              background: 'rgba(15,15,15,0.03)',
                              color: T.inkMid,
                              border: `1px solid ${T.line}`,
                              borderRadius: '6px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                              transitionTimingFunction: T.ease,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'rgba(15,15,15,0.06)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                            }
                          >
                            <History size={14} strokeWidth={1.75} /> Ver pagos
                          </button>
                          <Link
                            href={`/tandas/${tanda.tandaId}`}
                            className="flex-1 flex items-center justify-center gap-2 h-11 text-white text-[13px]"
                            style={{
                              background: T.accent,
                              borderRadius: '6px',
                              fontWeight: 500,
                              textDecoration: 'none',
                              WebkitTapHighlightColor: 'transparent',
                              transitionTimingFunction: T.ease,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = T.accentDeep)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = T.accent)
                            }
                          >
                            <Eye size={14} strokeWidth={1.75} /> Ver detalles
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage > 1) {
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.color = T.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.line;
                      e.currentTarget.style.color = T.inkMid;
                    }}
                  >
                    <ChevronLeft size={13} strokeWidth={1.75} /> Anterior
                  </button>

                  <span
                    className="px-3 text-[12px] tabular-nums"
                    style={{
                      color: T.inkFaint,
                      fontWeight: 500,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 h-9 px-4 text-[12.5px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor:
                        currentPage === totalPages ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage < totalPages) {
                        e.currentTarget.style.borderColor = T.accent;
                        e.currentTarget.style.color = T.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = T.line;
                      e.currentTarget.style.color = T.inkMid;
                    }}
                  >
                    Siguiente <ChevronRight size={13} strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      {/* ─── Modal de pagos ──────────────────────────────── */}
      {showPagosModal && selectedTanda && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setShowPagosModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div
              className="sticky top-0 flex justify-between items-start gap-4 px-6 py-5"
              style={{
                background: T.bg,
                borderBottom: `1px solid ${T.line}`,
              }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-2"
                  style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                >
                  Historial
                </p>
                <h3
                  className="text-[20px] leading-tight tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  Pagos
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}de la tanda.
                  </span>
                </h3>
                <p
                  className="text-[12px] mt-1.5"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  {selectedTanda.tandaNombre} · Posición #{selectedTanda.posicion}
                </p>
              </div>
              <button
                onClick={() => setShowPagosModal(false)}
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(15,15,15,0.03)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  fontSize: '16px',
                }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Resumen */}
              <div
                className="grid grid-cols-3 mb-6"
                style={{
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <MiniStat
                  icon={CheckCircle}
                  color={T.green}
                  value={pagos.filter((p) => p.estado === 'pagado').length}
                  label="Pagados"
                  border={false}
                />
                <MiniStat
                  icon={Clock}
                  color="#B8820E"
                  value={pagos.filter((p) => p.estado === 'pendiente').length}
                  label="Pendientes"
                />
                <MiniStat
                  icon={DollarSign}
                  color={T.accent}
                  value={formatMoney(
                    pagos.reduce((sum, p) => sum + (p.monto || 0), 0)
                  )}
                  label="Total"
                />
              </div>

              {pagos.length === 0 ? (
                <div className="text-center py-10">
                  <FileText
                    size={32}
                    strokeWidth={1.5}
                    style={{ color: T.inkGhost, margin: '0 auto 12px' }}
                  />
                  <p
                    className="text-[13px]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    No hay pagos registrados
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.line}` }}>
                        <Th>Semana</Th>
                        <Th>Monto</Th>
                        <Th>Vencimiento</Th>
                        <Th>Fecha pago</Th>
                        <Th>Estado</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => {
                        const isPaid = pago.estado === 'pagado';
                        const isLate = pago.estado === 'atrasado';

                        return (
                          <tr
                            key={pago.id}
                            style={{ borderBottom: `1px solid ${T.line}` }}
                          >
                            <td
                              className="py-3 pr-3 text-[13px] tabular-nums"
                              style={{
                                color: T.ink,
                                fontWeight: 500,
                                fontFamily: 'ui-monospace, monospace',
                                fontFeatureSettings: '"tnum"',
                              }}
                            >
                              #{pago.semana || pago.roundNumber || 'N/A'}
                            </td>
                            <td
                              className="py-3 pr-3 text-[13px] tabular-nums"
                              style={{
                                color: T.ink,
                                fontWeight: 500,
                                fontFeatureSettings: '"tnum"',
                              }}
                            >
                              {formatMoney(pago.monto)}
                            </td>
                            <td
                              className="py-3 pr-3 text-[12.5px]"
                              style={{ color: T.inkSoft, fontWeight: 450 }}
                            >
                              {formatDate(pago.fechaVencimiento || pago.dueDate)}
                            </td>
                            <td
                              className="py-3 pr-3 text-[12.5px]"
                              style={{ color: T.inkSoft, fontWeight: 450 }}
                            >
                              {pago.fechaPago ? formatDate(pago.fechaPago) : '—'}
                            </td>
                            <td className="py-3">
                              {isPaid ? (
                                <StatusBadge
                                  icon={CheckCircle}
                                  label="Pagado"
                                  color={T.green}
                                  bg="rgba(26, 127, 75, 0.08)"
                                />
                              ) : isLate ? (
                                <StatusBadge
                                  icon={AlertCircle}
                                  label="Atrasado"
                                  color={T.red}
                                  bg="rgba(197, 48, 48, 0.08)"
                                />
                              ) : (
                                <StatusBadge
                                  icon={Clock}
                                  label="Pendiente"
                                  color="#B8820E"
                                  bg="rgba(184, 130, 14, 0.08)"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTanda.estadoPagoCompleto?.tienePrimeraParte &&
                !selectedTanda.estadoPagoCompleto?.tieneSegundaParte && (
                  <div
                    className="mt-5 px-3 py-3"
                    style={{
                      background: 'rgba(184, 130, 14, 0.06)',
                      borderLeft: '2px solid #B8820E',
                      borderRadius: '4px',
                    }}
                  >
                    <p
                      className="text-[12px] leading-[1.55] flex items-center gap-2 mb-2"
                      style={{ color: '#8A6109', fontWeight: 450 }}
                    >
                      <AlertCircle size={13} strokeWidth={1.75} />
                      Pendiente: segunda parte del pago (50% restante)
                    </p>
                    <button
                      onClick={() => {
                        enviarRecordatorio(selectedTanda.id);
                        setShowPagosModal(false);
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px]"
                      style={{
                        background: '#B8820E',
                        color: '#FFFFFF',
                        borderRadius: '4px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Bell size={11} strokeWidth={2} /> Recordar segunda parte
                    </button>
                  </div>
                )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPagosModal(false)}
                  className="text-[12px] uppercase tracking-[0.18em]"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = T.inkFaint)}
                >
                  Cerrar
                </button>
              </div>
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
// InfoCell — celda del grid de datos
// ─────────────────────────────────────────────────────────────────────────
function InfoCell({ label, value, accent = false, border = true }) {
  return (
    <div
      className="p-3.5"
      style={{
        borderLeft: border ? `1px solid ${T.line}` : 'none',
        borderTop: '1px solid transparent',
      }}
    >
      <p
        className="text-[9.5px] uppercase tracking-[0.16em] mb-1.5"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        className="text-[12.5px] tabular-nums tracking-[-0.005em]"
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

// ─────────────────────────────────────────────────────────────────────────
// MiniStat — stat pequeño del modal
// ─────────────────────────────────────────────────────────────────────────
function MiniStat({ icon: Icon, color, value, label, border = true }) {
  return (
    <div
      className="p-4 text-center"
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
    >
      <Icon
        size={14}
        strokeWidth={1.75}
        style={{ color, margin: '0 auto 6px' }}
      />
      <p
        className="text-[18px] tabular-nums leading-none mb-1.5"
        style={{
          color,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </p>
      <p
        className="text-[9.5px] uppercase tracking-[0.16em]"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Th — header de tabla
// ─────────────────────────────────────────────────────────────────────────
function Th({ children }) {
  return (
    <th
      className="text-left py-3 pr-3 text-[9.5px] uppercase tracking-[0.18em]"
      style={{ color: T.inkFaint, fontWeight: 500 }}
    >
      {children}
    </th>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Toast — restyleado con tokens
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