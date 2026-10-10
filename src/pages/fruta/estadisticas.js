// src/pages/fruta/estadisticas.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Apple, Eye, MessageSquare, Star, FileText, TrendingUp, Clock,
  Bell, Pencil, Download, AlertCircle, FileSpreadsheet, ThumbsUp,
  ThumbsDown, MessageCircle, Phone, BarChart3, Package, Sprout, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// SectionLabel
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

// ─────────────────────────────────────────────────────────────────────────
// MetricCard
// ─────────────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, valueColor = T.ink, sub = null, extras = null }) {
  return (
    <div
      className="p-5 flex flex-col gap-4"
      style={{
        background: T.bg,
        border: `1px solid ${T.line}`,
        borderRadius: '8px',
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            background: 'rgba(79, 46, 232, 0.06)',
            borderRadius: '8px',
          }}
        >
          <Icon size={16} strokeWidth={1.75} style={{ color: T.accent }} />
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {label}
        </span>
      </div>

      <div>
        <p
          className="text-[32px] leading-none tabular-nums tracking-[-0.02em]"
          style={{
            color: valueColor,
            fontWeight: 400,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[12.5px] mt-2" style={{ color: T.inkSoft, fontWeight: 450 }}>
            {sub}
          </p>
        )}
      </div>

      {extras && <div className="flex flex-wrap gap-3 text-[11px]">{extras}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// QuickAction
// ─────────────────────────────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, title, subtitle }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col gap-4 p-5 transition-all duration-300"
      style={{
        background: T.bg,
        border: `1px solid ${hover ? 'rgba(15,15,15,0.14)' : T.line}`,
        borderRadius: '8px',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 1px 2px rgba(15,15,15,0.04), 0 8px 24px rgba(15,15,15,0.06)'
          : 'none',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(79, 46, 232, 0.06)',
          borderRadius: '8px',
        }}
      >
        <Icon size={18} strokeWidth={1.75} style={{ color: T.accent }} />
      </div>

      <div>
        <p className="text-[14.5px] mb-1" style={{ color: T.ink, fontWeight: 500 }}>
          {title}
        </p>
        <p className="text-[12.5px]" style={{ color: T.inkSoft, fontWeight: 450 }}>
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TopFrutaRow · ranking de producto
// ─────────────────────────────────────────────────────────────────────────
function TopFrutaRow({ fruta, index }) {
  const [hover, setHover] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-4 px-2 py-3 transition-colors"
      style={{
        background: hover ? 'rgba(15,15,15,0.015)' : 'transparent',
        borderRadius: '6px',
        transitionTimingFunction: T.ease,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 tabular-nums"
        style={{
          width: '32px',
          height: '32px',
          background: 'rgba(79, 46, 232, 0.06)',
          borderRadius: '6px',
          color: T.accent,
          fontSize: '12px',
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      <div
        className="flex items-center justify-center shrink-0 overflow-hidden"
        style={{
          width: '48px',
          height: '48px',
          background: 'rgba(15, 15, 15, 0.03)',
          border: `1px solid ${T.line}`,
          borderRadius: '6px',
        }}
      >
        {fruta.imagen && !imageError ? (
          <img
            src={pb.files.getURL(fruta, fruta.imagen)}
            alt={fruta.nombre}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Apple size={20} strokeWidth={1.5} style={{ color: T.inkGhost }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] truncate"
          style={{ color: T.ink, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {fruta.nombre}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* ✅ categoriaNombre desde expand (en vez de categoria) */}
          {fruta.expand?.categoriaId?.nombre && (
            <span
              className="text-[10px] uppercase tracking-[0.15em] truncate"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              {fruta.expand.categoriaId.nombre}
            </span>
          )}
          {fruta.temporada && (
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em]"
              style={{ color: '#1A7F4B', fontWeight: 500 }}
            >
              <Sprout size={9} strokeWidth={2} /> Temporada
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p
          className="text-[15px] tabular-nums leading-none"
          style={{ color: T.ink, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
        >
          {fruta.visitas || 0}
        </p>
        <p
          className="text-[9.5px] uppercase tracking-[0.15em] mt-1"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          visitas
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function EstadisticasFrutaPage() {
  const router = useRouter();
  const { periodo = 'semana' } = router.query;

  const { user, isAuthenticated, loading: authLoading, openLogin } = useAuth();

  const [frutas, setFrutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(periodo);
  const [estadisticas, setEstadisticas] = useState({
    visitas: { total: 0, hoy: 0, semana: 0, mes: 0 },
    contactos: { total: 0, whatsapp: 0, llamadas: 0 },
    comentarios: { total: 0, positivos: 0, negativos: 0 },
    calificacionPromedio: 0,
    tendencias: [],
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [mostrarExportar, setMostrarExportar] = useState(false);
  const [exportando, setExportando] = useState(false);

  // ─── Cargar datos ─────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // ✅ expand con categoriaId
      const frutasUsuario = await pb.collection('frutas').getFullList({
        filter: `usuarioId = "${user.id}"`,
        sort: '-created',
        expand: 'categoriaId,municipioId,localidadId',
      });

      if (frutasUsuario.length === 0) {
        setFrutas([]);
        setLoading(false);
        return;
      }

      setFrutas(frutasUsuario);

      const stats = await calcularEstadisticas(frutasUsuario, periodoSeleccionado);
      const actividad = await cargarActividadReciente(frutasUsuario, 10);

      setEstadisticas(stats);
      setActividadReciente(actividad);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar las estadísticas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user, periodoSeleccionado]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      openLogin();
      return;
    }

    cargarDatos();
  }, [authLoading, user, cargarDatos, openLogin]);

  // ─── Calcular estadísticas ────────────────────────────
  const calcularEstadisticas = async (frutasUsuario, periodo) => {
    try {
      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(inicioSemana.getDate() - 7);
      const inicioMes = new Date(ahora);
      inicioMes.setMonth(inicioMes.getMonth() - 1);

      const visitasTotal = frutasUsuario.reduce((sum, f) => sum + (f.visitas || 0), 0);

      let visitasHoy = 0;
      let visitasSemana = 0;
      let visitasMes = 0;

      try {
        const frutaIds = frutasUsuario.map((f) => f.id);
        const idFilter = frutaIds.map((id) => `frutaId = "${id}"`).join(' || ');

        const visitasRecords = await pb
          .collection('visitas_frutas')
          .getFullList({
            filter: `(${idFilter})`,
            fields: 'created',
          })
          .catch(() => []);

        visitasRecords.forEach((v) => {
          const fecha = new Date(v.created);
          if (fecha >= inicioHoy) visitasHoy++;
          if (fecha >= inicioSemana) visitasSemana++;
          if (fecha >= inicioMes) visitasMes++;
        });
      } catch (e) {
        visitasHoy = Math.round(visitasTotal * 0.05);
        visitasSemana = Math.round(visitasTotal * 0.3);
        visitasMes = visitasTotal;
      }

      let contactosTotal = 0;
      let contactosWhatsapp = 0;
      let contactosLlamadas = 0;

      try {
        const frutaIds = frutasUsuario.map((f) => f.id);
        const idFilter = frutaIds.map((id) => `frutaId = "${id}"`).join(' || ');

        const contactosRecords = await pb
          .collection('contactos_frutas')
          .getFullList({
            filter: `(${idFilter})`,
            fields: 'created,tipo',
          })
          .catch(() => []);

        contactosTotal = contactosRecords.length;
        contactosWhatsapp = contactosRecords.filter((c) => c.tipo === 'whatsapp').length;
        contactosLlamadas = contactosRecords.filter((c) => c.tipo === 'telefono').length;
      } catch (e) {
        contactosTotal = 0;
      }

      let comentariosData = [];
      try {
        const frutaIds = frutasUsuario.map((f) => f.id);
        const idFilter = frutaIds.map((id) => `frutaId = "${id}"`).join(' || ');

        comentariosData = await pb.collection('reviews_frutas').getFullList({
          filter: `(${idFilter}) && activo = true`,
          sort: '-created',
          fields: 'id,calificacion,comentario,created',
          expand: 'userId',
        });
      } catch (e) {
        comentariosData = [];
      }

      const comentariosTotal = comentariosData.length;
      const comentariosPositivos = comentariosData.filter((c) => (c.calificacion || 0) >= 4).length;
      const comentariosNegativos = comentariosData.filter((c) => (c.calificacion || 0) <= 2).length;

      const calificacionPromedio =
        comentariosTotal > 0
          ? Math.round(
              (comentariosData.reduce((sum, c) => sum + (c.calificacion || 0), 0) /
                comentariosTotal) *
                10
            ) / 10
          : 0;

      const dias = periodo === 'mes' ? 30 : 7;
      const tendencias = [];

      const frutaIds = frutasUsuario.map((f) => f.id);
      const idFilter = frutaIds.map((id) => `frutaId = "${id}"`).join(' || ');

      for (let i = dias - 1; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        const finDia = new Date(inicioDia);
        finDia.setDate(finDia.getDate() + 1);

        const visitasDia = await pb
          .collection('visitas_frutas')
          .getList(1, 1, {
            filter: `(${idFilter}) && created >= "${inicioDia.toISOString()}" && created < "${finDia.toISOString()}"`,
            fields: 'id',
          })
          .then((r) => r.totalItems)
          .catch(() => 0);

        const contactosDia = await pb
          .collection('contactos_frutas')
          .getList(1, 1, {
            filter: `(${idFilter}) && created >= "${inicioDia.toISOString()}" && created < "${finDia.toISOString()}"`,
            fields: 'id',
          })
          .then((r) => r.totalItems)
          .catch(() => 0);

        tendencias.push({
          fecha: fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
          visitas: visitasDia,
          contactos: contactosDia,
        });
      }

      return {
        visitas: { total: visitasTotal, hoy: visitasHoy, semana: visitasSemana, mes: visitasMes },
        contactos: {
          total: contactosTotal,
          whatsapp: contactosWhatsapp,
          llamadas: contactosLlamadas,
        },
        comentarios: {
          total: comentariosTotal,
          positivos: comentariosPositivos,
          negativos: comentariosNegativos,
        },
        calificacionPromedio,
        tendencias,
      };
    } catch (err) {
      console.error('Error calculando estadísticas:', err);
      return {
        visitas: { total: 0, hoy: 0, semana: 0, mes: 0 },
        contactos: { total: 0, whatsapp: 0, llamadas: 0 },
        comentarios: { total: 0, positivos: 0, negativos: 0 },
        calificacionPromedio: 0,
        tendencias: [],
      };
    }
  };

  // ─── Actividad reciente ───────────────────────────────
  const cargarActividadReciente = async (frutasUsuario, limit = 10) => {
    try {
      const actividades = [];
      const frutaIds = frutasUsuario.map((f) => f.id);
      const idFilter = frutaIds.map((id) => `frutaId = "${id}"`).join(' || ');

      try {
        const reviews = await pb.collection('reviews_frutas').getFullList({
          filter: `(${idFilter})`,
          sort: '-created',
          limit: 5,
          fields: 'id,calificacion,comentario,created,frutaId',
          expand: 'userId',
        });

        reviews.forEach((r) => {
          const fruta = frutasUsuario.find((f) => f.id === r.frutaId);
          actividades.push({
            id: `review_${r.id}`,
            tipo: 'comentario',
            titulo: 'Nueva opinión recibida',
            mensaje: `${r.expand?.userId?.name || 'Un usuario'} calificó "${fruta?.nombre || 'tu producto'}" con ${r.calificacion} estrellas`,
            fecha: r.created,
            leida: false,
          });
        });
      } catch (e) {}

      try {
        const contactos = await pb.collection('contactos_frutas').getFullList({
          filter: `(${idFilter})`,
          sort: '-created',
          limit: 5,
          fields: 'id,tipo,created,frutaId',
        });

        contactos.forEach((c) => {
          const fruta = frutasUsuario.find((f) => f.id === c.frutaId);
          actividades.push({
            id: `contacto_${c.id}`,
            tipo: c.tipo === 'whatsapp' ? 'contacto_whatsapp' : 'contacto_telefono',
            titulo: c.tipo === 'whatsapp' ? 'Contacto por WhatsApp' : 'Llamada recibida',
            mensaje: `Interés en "${fruta?.nombre || 'tu producto'}"`,
            fecha: c.created,
            leida: false,
          });
        });
      } catch (e) {}

      actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      return actividades.slice(0, limit);
    } catch (err) {
      console.error('Error cargando actividad:', err);
      return [];
    }
  };

  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodoSeleccionado(nuevoPeriodo);
    router.push(
      { pathname: '/fruta/estadisticas', query: { periodo: nuevoPeriodo } },
      undefined,
      { shallow: true }
    );
  };

  // ─── Exportaciones (placeholder) ──────────────────────
  const handleExportarExcel = async () => {
    if (frutas.length === 0) return;
    setExportando(true);
    try {
      alert('Función de exportación a Excel próximamente');
    } finally {
      setExportando(false);
      setMostrarExportar(false);
    }
  };

  const handleExportarPDF = async () => {
    if (frutas.length === 0) return;
    setExportando(true);
    try {
      alert('Función de exportación a PDF próximamente');
    } finally {
      setExportando(false);
      setMostrarExportar(false);
    }
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      'comentario': MessageCircle,
      'calificacion': Star,
      'contacto_whatsapp': MessageCircle,
      'contacto_telefono': Phone,
      'visita': Eye,
    };
    return iconos[tipo] || Bell;
  };

  const formatFechaRelativa = (fecha) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-MX');
  };

  const notifications = [
    { id: 1, title: '¡Fruta fresca de temporada!', description: 'Descubre lo nuevo esta semana', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Loading ──────────────────────────────────────────
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
                Cargando
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Head><title>Error | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/fruta" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <AlertCircle
                size={32}
                strokeWidth={1.5}
                style={{ color: T.red, margin: '0 auto 16px' }}
              />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Error al cargar estadísticas
              </h1>
              <p
                className="text-[13.5px] mb-8 max-w-md mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error}
              </p>
              <button
                onClick={cargarDatos}
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
                Reintentar
              </button>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Sin autenticación ────────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <>
        <Head><title>Inicia sesión | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/fruta" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
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
                  para continuar.
                </span>
              </h1>

              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas iniciar sesión para ver tus estadísticas.
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

  // ─── Sin productos ────────────────────────────────────
  if (frutas.length === 0) {
    return (
      <>
        <Head><title>Sin productos | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/fruta" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
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
                <Apple size={28} strokeWidth={1.5} style={{ color: T.accent }} />
              </div>

              <h1
                className="text-[28px] md:text-[36px] leading-tight tracking-[-0.025em] mb-3"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Sin productos
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  registrados aún.
                </span>
              </h1>

              <p
                className="text-[14.5px] leading-[1.6] mb-8 max-w-md mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Para ver estadísticas, primero debes registrar tus productos.
              </p>

              <Link
                href="/fruta/registro"
                className="inline-flex items-center h-11 px-6 text-white text-[13.5px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Registrar mi producto
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Top 5 productos por visitas ──────────────────────
  const topFrutas = [...frutas]
    .sort((a, b) => (b.visitas || 0) - (a.visitas || 0))
    .slice(0, 5);

  // ─── Render principal ─────────────────────────────────
  return (
    <>
      <Head>
        <title>Estadísticas | Mis Productos</title>
        <meta
          name="description"
          content="Estadísticas y métricas de tus productos en MarketDesliz"
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/fruta/mis-frutas" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Header editorial ─────────────────────────── */}
          <section className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-4"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Estadísticas · Fruta de temporada
                </p>

                <h1
                  className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em] mb-2"
                  style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                >
                  {frutas.length}{' '}
                  {frutas.length === 1 ? 'producto' : 'productos'}
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}en el catálogo.
                  </span>
                </h1>

                <p className="text-[14px]" style={{ color: T.inkSoft, fontWeight: 450 }}>
                  Mide el rendimiento de tus productos en MarketDesliz.
                </p>
              </div>

              {/* Export dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setMostrarExportar(!mostrarExportar)}
                  disabled={exportando}
                  className="flex items-center gap-2 h-10 px-4 text-white text-[13px] transition-colors disabled:opacity-50"
                  style={{
                    background: '#1A7F4B',
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: exportando ? 'wait' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!exportando) e.currentTarget.style.background = '#15803D';
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1A7F4B')}
                >
                  {exportando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Exportando…
                    </>
                  ) : (
                    <>
                      <Download size={14} strokeWidth={1.75} />
                      Exportar reporte
                    </>
                  )}
                </button>

                {mostrarExportar && !exportando && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMostrarExportar(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-[200px] overflow-hidden z-50"
                      style={{
                        background: T.bg,
                        border: `1px solid ${T.line}`,
                        borderRadius: '8px',
                        boxShadow:
                          '0 1px 2px rgba(15,15,15,0.04), 0 12px 40px rgba(15,15,15,0.10)',
                      }}
                    >
                      <button
                        onClick={handleExportarExcel}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-[13px] transition-colors hover:bg-black/[0.02]"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${T.line}`,
                          color: T.inkMid,
                          fontWeight: 450,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <FileSpreadsheet size={14} strokeWidth={1.75} style={{ color: '#1A7F4B' }} />
                        Exportar a Excel
                      </button>
                      <button
                        onClick={handleExportarPDF}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-[13px] transition-colors hover:bg-black/[0.02]"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: T.inkMid,
                          fontWeight: 450,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <FileText size={14} strokeWidth={1.75} style={{ color: T.red }} />
                        Exportar a PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ─── Métricas principales ─────────────────────── */}
          <section className="mb-12">
            <SectionLabel>Métricas principales</SectionLabel>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Eye}
                label="Total"
                value={estadisticas.visitas.total}
                sub="Visitas a productos"
                extras={
                  <>
                    <span
                      className="flex items-center gap-1 tabular-nums"
                      style={{ color: '#1A7F4B', fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                    >
                      <TrendingUp size={11} strokeWidth={2} /> Hoy: {estadisticas.visitas.hoy}
                    </span>
                    <span
                      className="flex items-center gap-1 tabular-nums"
                      style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                    >
                      <BarChart3 size={11} strokeWidth={2} /> Sem: {estadisticas.visitas.semana}
                    </span>
                  </>
                }
              />

              <MetricCard
                icon={MessageSquare}
                label="Total"
                value={estadisticas.contactos.total}
                sub="Contactos recibidos"
                extras={
                  <>
                    <span
                      className="flex items-center gap-1 tabular-nums"
                      style={{ color: '#1A7F4B', fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                    >
                      <MessageCircle size={11} strokeWidth={2} /> WA: {estadisticas.contactos.whatsapp}
                    </span>
                    <span
                      className="flex items-center gap-1 tabular-nums"
                      style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                    >
                      <Phone size={11} strokeWidth={2} /> Llam: {estadisticas.contactos.llamadas}
                    </span>
                  </>
                }
              />

              <MetricCard
                icon={Star}
                label="Promedio"
                value={estadisticas.calificacionPromedio.toFixed(1)}
                valueColor="#B8820E"
                sub="Calificación promedio"
                extras={
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        strokeWidth={1.5}
                        style={{
                          fill:
                            star <= Math.round(estadisticas.calificacionPromedio)
                              ? '#F5B400'
                              : 'transparent',
                          color:
                            star <= Math.round(estadisticas.calificacionPromedio)
                              ? '#F5B400'
                              : T.inkGhost,
                        }}
                      />
                    ))}
                  </div>
                }
              />

              <MetricCard
                icon={FileText}
                label="Total"
                value={estadisticas.comentarios.total}
                sub="Opiniones recibidas"
                extras={
                  <>
                    <span
                      className="flex items-center gap-1 tabular-nums"
                      style={{ color: '#1A7F4B', fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                    >
                      <ThumbsUp size={11} strokeWidth={2} /> +{estadisticas.comentarios.positivos}
                    </span>
                    <span
                      className="flex items-center gap-1 tabular-nums"
                      style={{ color: T.red, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                    >
                      <ThumbsDown size={11} strokeWidth={2} /> −{estadisticas.comentarios.negativos}
                    </span>
                  </>
                }
              />
            </div>
          </section>

          {/* ─── Tendencias ───────────────────────────────── */}
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-4">
              <SectionLabel accent>Tendencias</SectionLabel>

              <div
                className="flex gap-1 p-1"
                style={{
                  background: 'rgba(15,15,15,0.03)',
                  borderRadius: '6px',
                }}
              >
                {['semana', 'mes'].map((p) => {
                  const active = periodoSeleccionado === p;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePeriodoChange(p)}
                      className="px-3 h-7 text-[11.5px] uppercase tracking-[0.15em] transition-all"
                      style={{
                        background: active ? T.bg : 'transparent',
                        color: active ? T.ink : T.inkSoft,
                        borderRadius: '4px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: active ? '0 1px 2px rgba(15,15,15,0.04)' : 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {p === 'semana' ? 'Semana' : 'Mes'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="p-6"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              {estadisticas.tendencias.length === 0 ? (
                <p
                  className="text-center py-10 text-[13px]"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  No hay datos suficientes para mostrar tendencias.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {estadisticas.tendencias.slice(-7).map((dia, idx) => {
                    const maxVisitas = Math.max(
                      ...estadisticas.tendencias.map((d) => d.visitas),
                      1
                    );
                    const maxContactos = Math.max(
                      ...estadisticas.tendencias.map((d) => d.contactos),
                      1
                    );
                    return (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline text-[12px] mb-2 flex-wrap gap-2">
                          <span style={{ color: T.inkMid, fontWeight: 500 }}>{dia.fecha}</span>
                          <span
                            className="tabular-nums"
                            style={{
                              color: T.inkFaint,
                              fontWeight: 450,
                              fontFeatureSettings: '"tnum"',
                            }}
                          >
                            {dia.visitas} visitas · {dia.contactos} contactos
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <div
                            className="flex-1 overflow-hidden"
                            style={{
                              height: '6px',
                              background: 'rgba(15,15,15,0.04)',
                              borderRadius: '3px',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${(dia.visitas / maxVisitas) * 100}%`,
                                background: T.accent,
                                borderRadius: '3px',
                                transition: `width 0.6s ${T.ease}`,
                              }}
                            />
                          </div>
                          <div
                            className="flex-1 overflow-hidden"
                            style={{
                              height: '6px',
                              background: 'rgba(15,15,15,0.04)',
                              borderRadius: '3px',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${(dia.contactos / maxContactos) * 100}%`,
                                background: '#1A7F4B',
                                borderRadius: '3px',
                                transition: `width 0.6s ${T.ease}`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className="flex gap-5 mt-3 pt-4 text-[11px] uppercase tracking-[0.15em]"
                    style={{
                      borderTop: `1px solid ${T.line}`,
                      color: T.inkFaint,
                      fontWeight: 500,
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          background: T.accent,
                          borderRadius: '2px',
                        }}
                      />
                      Visitas
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          background: '#1A7F4B',
                          borderRadius: '2px',
                        }}
                      />
                      Contactos
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ─── Top productos ────────────────────────────── */}
          <section className="mb-12">
            <SectionLabel>Productos con más visitas</SectionLabel>

            <div
              className="p-3 md:p-4"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <div className="flex flex-col">
                {topFrutas.map((fruta, idx) => (
                  <TopFrutaRow key={fruta.id} fruta={fruta} index={idx} />
                ))}
              </div>
            </div>
          </section>

          {/* ─── Actividad reciente ───────────────────────── */}
          <section className="mb-12">
            <SectionLabel>Actividad reciente</SectionLabel>

            <div
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {actividadReciente.length === 0 ? (
                <p
                  className="text-center py-12 text-[13px]"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  No hay actividad reciente.
                </p>
              ) : (
                <div>
                  {actividadReciente.map((act, idx) => {
                    const IconoActividad = getIconoTipo(act.tipo);
                    return (
                      <div
                        key={act.id}
                        className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-black/[0.015]"
                        style={{
                          borderTop: idx > 0 ? `1px solid ${T.line}` : 'none',
                        }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: '34px',
                            height: '34px',
                            background: 'rgba(79, 46, 232, 0.06)',
                            borderRadius: '8px',
                          }}
                        >
                          <IconoActividad
                            size={14}
                            strokeWidth={1.75}
                            style={{ color: T.accent }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13.5px] leading-snug mb-0.5"
                            style={{ color: T.ink, fontWeight: 500 }}
                          >
                            {act.titulo}
                          </p>
                          <p
                            className="text-[12.5px] leading-[1.55]"
                            style={{ color: T.inkSoft, fontWeight: 450 }}
                          >
                            {act.mensaje}
                          </p>
                          <p
                            className="text-[10.5px] uppercase tracking-[0.18em] mt-2"
                            style={{ color: T.inkFaint, fontWeight: 500 }}
                          >
                            {formatFechaRelativa(act.fecha)}
                          </p>
                        </div>

                        {!act.leida && (
                          <span
                            className="shrink-0 mt-2"
                            style={{
                              width: '6px',
                              height: '6px',
                              background: T.accent,
                              borderRadius: '50%',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ─── Acciones rápidas ─────────────────────────── */}
          <section>
            <SectionLabel>Acciones rápidas</SectionLabel>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickAction
                href="/fruta/mis-frutas"
                icon={Package}
                title="Mis productos"
                subtitle="Gestiona todos tus productos"
              />
              <QuickAction
                href="/fruta"
                icon={Apple}
                title="Ver catálogo"
                subtitle="Cómo ven tus productos"
              />
              <QuickAction
                href="/fruta/registro"
                icon={Pencil}
                title="Nuevo producto"
                subtitle="Registra más productos"
              />
            </div>
          </section>
        </main>

        <Footer variant="minimal" />
      </div>

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