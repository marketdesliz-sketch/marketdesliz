// src/pages/bolsa-trabajo/mis-publicaciones.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Briefcase, Plus, Search, Building2, MapPin, Clock,
  DollarSign, Eye, AlertCircle, CheckCircle, XCircle,
  Inbox, RefreshCw, Lock, X, Calendar, Mail, Phone,
  Pencil, Trash2, Save, AlertTriangle,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getNombreCategoria = (cat) => {
  const map = {
    ventas: 'Ventas',
    atencion_cliente: 'Atención al cliente',
    administracion: 'Administración',
    tecnologia: 'Tecnología',
    oficios: 'Oficios',
    construccion: 'Construcción',
    limpieza: 'Limpieza',
    cocina: 'Cocina',
    chofer: 'Chofer',
    repartidor: 'Repartidor',
    informal: 'Informal',
    otro: 'Otro',
  };
  return (
    map[cat] || cat?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || ''
  );
};

const CATEGORIAS_BOLSA = [
  'ventas', 'atencion_cliente', 'administracion', 'tecnologia',
  'oficios', 'construccion', 'limpieza', 'cocina',
  'chofer', 'repartidor', 'informal', 'otro',
];

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
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
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

function EstadoBadge({ estado }) {
  const map = {
    pendiente: {
      label: 'Pendiente',
      icon: Clock,
      color: '#B8820E',
      bg: 'rgba(184, 130, 14, 0.08)',
    },
    aprobado: {
      label: 'Aprobada',
      icon: CheckCircle,
      color: T.green,
      bg: 'rgba(26, 127, 75, 0.08)',
    },
    rechazado: {
      label: 'Rechazada',
      icon: XCircle,
      color: T.red,
      bg: 'rgba(197, 48, 48, 0.08)',
    },
  };
  const c = map[estado] || map.pendiente;
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: '4px',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      <Icon size={10} strokeWidth={2.25} />
      {c.label}
    </span>
  );
}

function TipoBadge({ tipo }) {
  const esOferta = tipo === 'ofrezco_trabajo';
  const Icon = esOferta ? Building2 : Search;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 shrink-0"
      style={{
        background: esOferta
          ? 'rgba(79, 46, 232, 0.08)'
          : 'rgba(26, 127, 75, 0.08)',
        color: esOferta ? T.accent : T.green,
        borderRadius: '4px',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      <Icon size={10} strokeWidth={2.25} />
      {esOferta ? 'Ofrezco' : 'Busco'}
    </span>
  );
}

function InfoCell({
  icon: Icon,
  label,
  value,
  accent = false,
  mono = false,
  border = true,
}) {
  return (
    <div
      className="p-3.5"
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} strokeWidth={1.75} style={{ color: T.inkFaint }} />
        <p
          className="text-[9.5px] uppercase tracking-[0.16em]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {label}
        </p>
      </div>
      <p
        className={`text-[12.5px] tracking-[-0.005em] ${mono ? 'tabular-nums' : ''}`}
        style={{
          color: accent ? T.green : T.ink,
          fontWeight: 500,
          fontFeatureSettings: mono ? '"tnum"' : undefined,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Form fields (mismo patrón que publicar.js) ─────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label
      className="block text-[10px] uppercase tracking-[0.22em] mb-2"
      style={{
        color: T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
      {required && <span style={{ color: T.red, marginLeft: '3px' }}>*</span>}
    </label>
  );
}

function FieldInput({ error = false, className = '', ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      className={`w-full outline-none transition-colors ${className}`}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{
        height: '42px',
        padding: '0 14px',
        background: 'transparent',
        border: `1px solid ${
          error ? T.red : focus ? 'rgba(15,15,15,0.24)' : T.line
        }`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        letterSpacing: '-0.005em',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
        fontFamily: 'inherit',
      }}
    />
  );
}

function FieldTextarea({ error = false, className = '', ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      {...props}
      className={`w-full outline-none transition-colors resize-none ${className}`}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{
        padding: '12px 14px',
        background: 'transparent',
        border: `1px solid ${
          error ? T.red : focus ? 'rgba(15,15,15,0.24)' : T.line
        }`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        letterSpacing: '-0.005em',
        lineHeight: 1.55,
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
        fontFamily: 'inherit',
      }}
    />
  );
}

function FieldSelect({ error = false, className = '', children, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
      {...props}
      className={`w-full outline-none appearance-none transition-colors ${className}`}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{
        height: '42px',
        padding: '0 14px',
        background: 'transparent',
        border: `1px solid ${
          error ? T.red : focus ? 'rgba(15,15,15,0.24)' : T.line
        }`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        letterSpacing: '-0.005em',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </select>
  );
}

function ErrorText({ children }) {
  return (
    <p className="text-[11.5px] mt-1.5" style={{ color: T.red, fontWeight: 450 }}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function MisPublicacionesPage() {
  const router = useRouter();
  const { estado = 'todas' } = router.query;

  const { user, loading: authLoading, openLogin } = useAuth();

  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(estado);

  // Edición
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState(null);
  const [errorsEdit, setErrorsEdit] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Eliminación
  const [eliminando, setEliminando] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Cargar publicaciones ───────────────────────────────
  const cargarPublicaciones = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await pb.collection('bolsa_trabajo').getFullList({
        filter: `userId = "${user.id}"`,
        sort: '-created',
      });

      setPublicaciones(data);
    } catch (err) {
      console.error('Error cargando publicaciones:', err);
      setError('No pudimos cargar tus publicaciones. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      openLogin();
      return;
    }
    cargarPublicaciones();
  }, [authLoading, user, cargarPublicaciones, openLogin]);

  // ─── Sync filtro con URL ────────────────────────────────
  useEffect(() => {
    const query = {
      estado: filtroEstado !== 'todas' ? filtroEstado : undefined,
    };
    if (query.estado === undefined) delete query.estado;
    router.push(
      { pathname: '/bolsa-trabajo/mis-publicaciones', query },
      undefined,
      { shallow: true }
    );
  }, [filtroEstado, router]);

  // ─── Auto-cerrar toast ──────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Derivados ──────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: publicaciones.length,
      pendientes: publicaciones.filter((p) => p.estado === 'pendiente').length,
      aprobadas: publicaciones.filter((p) => p.estado === 'aprobado').length,
      rechazadas: publicaciones.filter((p) => p.estado === 'rechazado').length,
    }),
    [publicaciones]
  );

  const filtradas = useMemo(() => {
    if (filtroEstado === 'todas') return publicaciones;
    return publicaciones.filter((p) => p.estado === filtroEstado);
  }, [publicaciones, filtroEstado]);

  // ─── Handlers de edición ────────────────────────────────
  const abrirEditar = (pub) => {
    setEditando(pub);
    setFormEdit({
      tipo: pub.tipo || 'busco_trabajo',
      titulo: pub.titulo || '',
      descripcion: pub.descripcion || '',
      categoria: pub.categoria || '',
      salario: pub.salario || '',
      horario: pub.horario || '',
      ubicacion: pub.ubicacion || '',
      telefono: pub.telefono || '',
      email: pub.email || '',
    });
    setErrorsEdit({});
  };

  const cerrarEditar = () => {
    setEditando(null);
    setFormEdit(null);
    setErrorsEdit({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormEdit((prev) => ({ ...prev, [name]: value }));
    if (errorsEdit[name]) {
      setErrorsEdit((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validarEdit = () => {
    const newErrors = {};
    if (!formEdit.titulo.trim()) newErrors.titulo = 'El título es obligatorio';
    if (!formEdit.descripcion.trim())
      newErrors.descripcion = 'La descripción es obligatoria';
    if (!formEdit.categoria) newErrors.categoria = 'Selecciona una categoría';
    if (!formEdit.telefono.trim())
      newErrors.telefono = 'El teléfono es obligatorio';
    if (
      formEdit.telefono.trim() &&
      !/^\d{10,15}$/.test(formEdit.telefono.replace(/\D/g, ''))
    ) {
      newErrors.telefono = 'Ingresa un número de teléfono válido (10-15 dígitos)';
    }
    if (
      formEdit.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEdit.email)
    ) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    if (
      formEdit.salario &&
      !/^\$?\s*\d+(\.\d{2})?$/.test(formEdit.salario.replace(/,/g, ''))
    ) {
      newErrors.salario = 'Ingresa un monto válido (ej: $8,000)';
    }
    setErrorsEdit(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const guardarEdit = async (e) => {
    e.preventDefault();
    if (!validarEdit()) return;

    setSavingEdit(true);
    try {
      await pb.collection('bolsa_trabajo').update(editando.id, {
        tipo: formEdit.tipo,
        titulo: formEdit.titulo.trim(),
        descripcion: formEdit.descripcion.trim(),
        categoria: formEdit.categoria,
        salario: formEdit.salario.trim(),
        horario: formEdit.horario.trim(),
        ubicacion: formEdit.ubicacion.trim(),
        telefono: formEdit.telefono.trim(),
        email: formEdit.email.trim(),
        estado: 'pendiente',
      });
      cerrarEditar();
      await cargarPublicaciones();
      setToast({
        message: 'Publicación actualizada. En revisión nuevamente.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error actualizando:', err);
      setToast({
        message: 'No se pudo actualizar. Intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Handlers de eliminación ────────────────────────────
  const confirmarEliminar = async () => {
    if (!eliminando) return;
    setDeleting(true);
    try {
      await pb.collection('bolsa_trabajo').delete(eliminando.id);
      setEliminando(null);
      await cargarPublicaciones();
      setToast({ message: 'Publicación eliminada.', type: 'success' });
    } catch (err) {
      console.error('Error eliminando:', err);
      setToast({ message: 'No se pudo eliminar. Intenta de nuevo.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────
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
                Cargando publicaciones
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Sin sesión ─────────────────────────────────────────
  if (!user) {
    return (
      <>
        <Head><title>Inicia sesión | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/bolsa-trabajo" />
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
                  para ver tus publicaciones.
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas una cuenta para acceder a tus ofertas publicadas.
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

  // ─── Error ──────────────────────────────────────────────
  if (error) {
    return (
      <>
        <Head><title>Error | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/bolsa-trabajo" />
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
                onClick={cargarPublicaciones}
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

  // ─── Render principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>Mis Publicaciones | MarketDesliz</title>
        <meta
          name="description"
          content="Gestiona tus ofertas publicadas en la Bolsa de Trabajo de MarketDesliz."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/bolsa-trabajo" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero ────────────────────────────────────── */}
          <section className="mb-12">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Bolsa de trabajo · Mis publicaciones
            </p>

            <h1
              className="text-[40px] md:text-[64px] leading-[1] tracking-[-0.035em] max-w-3xl mb-6"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Tus ofertas
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}publicadas.
              </span>
            </h1>

            <p
              className="text-[16px] md:text-[20px] leading-[1.5] max-w-xl mb-8"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Revisa el estado, edita o elimina cada una de tus publicaciones.
            </p>

            <Link
              href="/bolsa-trabajo/publicar"
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
              <Plus size={14} strokeWidth={1.75} /> Publicar nueva oferta
            </Link>
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
                icon={Briefcase}
                label="Total"
                value={stats.total}
                border={false}
              />
              <StatBlock
                icon={Clock}
                label="Pendientes"
                value={stats.pendientes}
              />
              <StatBlock
                icon={CheckCircle}
                label="Aprobadas"
                value={stats.aprobadas}
              />
              <StatBlock
                icon={XCircle}
                label="Rechazadas"
                value={stats.rechazadas}
              />
            </div>
          </section>

          {/* ─── Filtros ─────────────────────────────────── */}
          <section className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {['todas', 'pendiente', 'aprobado', 'rechazado'].map((op) => {
                  const isActive = filtroEstado === op;
                  const labels = {
                    todas: 'Todas',
                    pendiente: 'Pendientes',
                    aprobado: 'Aprobadas',
                    rechazado: 'Rechazadas',
                  };
                  return (
                    <button
                      key={op}
                      onClick={() => setFiltroEstado(op)}
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
                      {labels[op]}
                    </button>
                  );
                })}
              </div>

              <span
                className="text-[11px] tabular-nums"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {filtradas.length}{' '}
                {filtradas.length === 1 ? 'publicación' : 'publicaciones'}
              </span>
            </div>
          </section>

          {/* ─── Lista ───────────────────────────────────── */}
          {filtradas.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
              style={{
                background: 'rgba(15, 15, 15, 0.02)',
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <Inbox
                size={32}
                strokeWidth={1.5}
                style={{ color: T.inkGhost, marginBottom: '16px' }}
              />
              <h3
                className="text-[15px] mb-1"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {filtroEstado !== 'todas'
                  ? `No tienes publicaciones en este estado`
                  : 'No tienes publicaciones aún'}
              </h3>
              <p
                className="text-[13px] max-w-md mb-6"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {filtroEstado !== 'todas'
                  ? 'Cambia el filtro para ver otras publicaciones.'
                  : 'Publica tu primera oferta y llega a más personas en tu comunidad.'}
              </p>
              {filtroEstado === 'todas' && (
                <Link
                  href="/bolsa-trabajo/publicar"
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
                  <Plus size={14} strokeWidth={1.75} /> Publicar oferta
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtradas.map((pub) => {
                const esRechazada = pub.estado === 'rechazado';
                const esPendiente = pub.estado === 'pendiente';
                const esAprobada = pub.estado === 'aprobado';
                const tieneMotivo =
                  esRechazada && pub.motivoRechazo && pub.motivoRechazo.trim();

                return (
                  <div
                    key={pub.id}
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
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TipoBadge tipo={pub.tipo} />
                          <EstadoBadge estado={pub.estado} />
                        </div>
                        <span
                          className="text-[11px] tabular-nums flex items-center gap-1.5"
                          style={{
                            color: T.inkFaint,
                            fontWeight: 450,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          <Calendar size={11} strokeWidth={1.75} />
                          {formatDate(pub.created)}
                        </span>
                      </div>

                      {/* Título */}
                      <h3
                        className="text-[16px] md:text-[18px] leading-snug tracking-[-0.01em] mb-2"
                        style={{ color: T.ink, fontWeight: 500 }}
                      >
                        {pub.titulo}
                      </h3>

                      {/* Categoría */}
                      <p
                        className="text-[10px] uppercase tracking-[0.15em] mb-4"
                        style={{ color: T.inkFaint, fontWeight: 500 }}
                      >
                        {getNombreCategoria(pub.categoria)}
                      </p>

                      {/* Descripción truncada */}
                      {pub.descripcion && (
                        <p
                          className="text-[12.5px] leading-[1.55] line-clamp-2 mb-4"
                          style={{ color: T.inkSoft, fontWeight: 450 }}
                        >
                          {pub.descripcion}
                        </p>
                      )}

                      {/* Meta grid */}
                      <div
                        className="grid grid-cols-2 md:grid-cols-4"
                        style={{
                          border: `1px solid ${T.line}`,
                          borderRadius: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        <InfoCell
                          icon={DollarSign}
                          label="Salario"
                          value={pub.salario || '—'}
                          border={false}
                          accent={!!pub.salario}
                        />
                        <InfoCell
                          icon={MapPin}
                          label="Ubicación"
                          value={pub.ubicacion || '—'}
                        />
                        <InfoCell
                          icon={Clock}
                          label="Horario"
                          value={pub.horario || '—'}
                        />
                        <InfoCell
                          icon={Phone}
                          label="Teléfono"
                          value={pub.telefono || '—'}
                          mono
                        />
                      </div>
                    </div>

                    {/* Aviso: pendiente */}
                    {esPendiente && (
                      <div
                        className="flex items-start gap-2.5 px-5 md:px-6 py-4"
                        style={{
                          background: 'rgba(184, 130, 14, 0.05)',
                          borderTop: `1px solid ${T.line}`,
                          borderLeft: '2px solid #B8820E',
                        }}
                      >
                        <Clock
                          size={13}
                          strokeWidth={1.75}
                          style={{ color: '#B8820E', flexShrink: 0, marginTop: 2 }}
                        />
                        <p
                          className="text-[12px] leading-[1.55]"
                          style={{ color: '#8A6109', fontWeight: 450 }}
                        >
                          En revisión por el administrador. Se publicará cuando sea
                          aprobada.
                        </p>
                      </div>
                    )}

                    {/* Aviso: rechazada con motivo */}
                    {tieneMotivo && (
                      <div
                        className="flex items-start gap-2.5 px-5 md:px-6 py-4"
                        style={{
                          background: 'rgba(197, 48, 48, 0.05)',
                          borderTop: `1px solid ${T.line}`,
                          borderLeft: `2px solid ${T.red}`,
                        }}
                      >
                        <AlertCircle
                          size={13}
                          strokeWidth={1.75}
                          style={{ color: T.red, flexShrink: 0, marginTop: 2 }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] uppercase tracking-[0.18em] mb-1"
                            style={{ color: T.red, fontWeight: 500 }}
                          >
                            Motivo del rechazo
                          </p>
                          <p
                            className="text-[12.5px] leading-[1.55]"
                            style={{ color: T.red, fontWeight: 450 }}
                          >
                            {pub.motivoRechazo}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer: acciones */}
                    <div
                      className="flex flex-wrap items-center gap-2 px-5 md:px-6 py-4"
                      style={{ borderTop: `1px solid ${T.line}` }}
                    >
                      {esAprobada && (
                        <Link
                          href={`/bolsa-trabajo/${pub.id}`}
                          className="inline-flex items-center gap-2 h-9 px-4 text-white text-[12.5px]"
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
                          <Eye size={13} strokeWidth={1.75} /> Ver publicación
                        </Link>
                      )}

                      <button
                        onClick={() => abrirEditar(pub)}
                        className="inline-flex items-center gap-2 h-9 px-4 text-[12.5px] transition-colors"
                        style={{
                          background: 'transparent',
                          border: `1px solid ${T.line}`,
                          borderRadius: '6px',
                          color: T.inkMid,
                          fontWeight: 500,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                          transitionTimingFunction: T.ease,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = T.accent;
                          e.currentTarget.style.color = T.accent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = T.line;
                          e.currentTarget.style.color = T.inkMid;
                        }}
                      >
                        <Pencil size={13} strokeWidth={1.75} /> Editar
                      </button>

                      <button
                        onClick={() => setEliminando(pub)}
                        className="inline-flex items-center gap-2 h-9 px-4 text-[12.5px] transition-colors"
                        style={{
                          background: 'transparent',
                          border: `1px solid ${T.line}`,
                          borderRadius: '6px',
                          color: T.inkMid,
                          fontWeight: 500,
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent',
                          transitionTimingFunction: T.ease,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = T.red;
                          e.currentTarget.style.color = T.red;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = T.line;
                          e.currentTarget.style.color = T.inkMid;
                        }}
                      >
                        <Trash2 size={13} strokeWidth={1.75} /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <Footer variant="minimal" />
      </div>

      {/* ─── Modal Editar ─────────────────────────────────── */}
      {editando && formEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={cerrarEditar}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="sticky top-0 flex justify-between items-start gap-4 px-6 py-5"
              style={{
                background: T.bg,
                borderBottom: `1px solid ${T.line}`,
                zIndex: 2,
              }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-2"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Editar
                </p>
                <h3
                  className="text-[20px] leading-tight tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  Actualiza
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}tu publicación.
                  </span>
                </h3>
                <p
                  className="text-[11.5px] mt-2"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Al guardar, la publicación volverá a estado{' '}
                  <strong style={{ color: '#B8820E' }}>pendiente</strong> para
                  revisión del administrador.
                </p>
              </div>
              <button
                onClick={cerrarEditar}
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
                }}
                aria-label="Cerrar"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>

            {/* Body */}
            <form
              id="edit-form"
              onSubmit={guardarEdit}
              className="p-6 flex flex-col gap-6"
              noValidate
            >
              {/* Tipo */}
              <div>
                <FieldLabel required>Tipo de publicación</FieldLabel>
                <FieldSelect
                  name="tipo"
                  value={formEdit.tipo}
                  onChange={handleEditChange}
                >
                  <option value="busco_trabajo">Busco trabajo</option>
                  <option value="ofrezco_trabajo">Ofrezco trabajo</option>
                </FieldSelect>
              </div>

              {/* Título */}
              <div>
                <FieldLabel required>Título</FieldLabel>
                <FieldInput
                  type="text"
                  name="titulo"
                  value={formEdit.titulo}
                  onChange={handleEditChange}
                  placeholder="Ej: Se solicita ayudante de cocina"
                  maxLength="100"
                  error={!!errorsEdit.titulo}
                />
                {errorsEdit.titulo && <ErrorText>{errorsEdit.titulo}</ErrorText>}
              </div>

              {/* Categoría */}
              <div>
                <FieldLabel required>Categoría</FieldLabel>
                <FieldSelect
                  name="categoria"
                  value={formEdit.categoria}
                  onChange={handleEditChange}
                  error={!!errorsEdit.categoria}
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS_BOLSA.map((cat) => (
                    <option key={cat} value={cat}>
                      {getNombreCategoria(cat)}
                    </option>
                  ))}
                </FieldSelect>
                {errorsEdit.categoria && (
                  <ErrorText>{errorsEdit.categoria}</ErrorText>
                )}
              </div>

              {/* Descripción */}
              <div>
                <FieldLabel required>Descripción</FieldLabel>
                <FieldTextarea
                  name="descripcion"
                  value={formEdit.descripcion}
                  onChange={handleEditChange}
                  rows="4"
                  placeholder="Describe el puesto, requisitos, responsabilidades..."
                  maxLength="1000"
                  error={!!errorsEdit.descripcion}
                />
                {errorsEdit.descripcion && (
                  <ErrorText>{errorsEdit.descripcion}</ErrorText>
                )}
              </div>

              {/* Salario + Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Salario</FieldLabel>
                  <FieldInput
                    type="text"
                    name="salario"
                    value={formEdit.salario}
                    onChange={handleEditChange}
                    placeholder="Ej: $8,000 mensual"
                    error={!!errorsEdit.salario}
                  />
                  {errorsEdit.salario && (
                    <ErrorText>{errorsEdit.salario}</ErrorText>
                  )}
                </div>
                <div>
                  <FieldLabel>Horario</FieldLabel>
                  <FieldInput
                    type="text"
                    name="horario"
                    value={formEdit.horario}
                    onChange={handleEditChange}
                    placeholder="Ej: L-V 9am-6pm"
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <FieldLabel>Ubicación</FieldLabel>
                <FieldInput
                  type="text"
                  name="ubicacion"
                  value={formEdit.ubicacion}
                  onChange={handleEditChange}
                  placeholder="Ej: Col. Centro, CDMX"
                />
              </div>

              {/* Teléfono + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel required>Teléfono de contacto</FieldLabel>
                  <FieldInput
                    type="tel"
                    name="telefono"
                    value={formEdit.telefono}
                    onChange={handleEditChange}
                    placeholder="5512345678"
                    error={!!errorsEdit.telefono}
                  />
                  {errorsEdit.telefono && (
                    <ErrorText>{errorsEdit.telefono}</ErrorText>
                  )}
                </div>
                <div>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <FieldInput
                    type="email"
                    name="email"
                    value={formEdit.email}
                    onChange={handleEditChange}
                    placeholder="correo@ejemplo.com"
                    error={!!errorsEdit.email}
                  />
                  {errorsEdit.email && <ErrorText>{errorsEdit.email}</ErrorText>}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div
              className="sticky bottom-0 flex gap-2.5 px-6 py-4"
              style={{
                background: T.bg,
                borderTop: `1px solid ${T.line}`,
              }}
            >
              <button
                type="button"
                onClick={cerrarEditar}
                disabled={savingEdit}
                className="flex-1 h-11 text-[13px] transition-colors disabled:opacity-50"
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontWeight: 500,
                  cursor: savingEdit ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!savingEdit)
                    e.currentTarget.style.background = 'rgba(15,15,15,0.03)';
                }}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="edit-form"
                disabled={savingEdit}
                className="flex-1 h-11 text-white text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: savingEdit ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!savingEdit) e.currentTarget.style.background = T.accentDeep;
                }}
                onMouseLeave={(e) => {
                  if (!savingEdit) e.currentTarget.style.background = T.accent;
                }}
              >
                {savingEdit ? (
                  <>
                    <div
                      className="border-2 border-white/40 border-t-white rounded-full animate-spin"
                      style={{ width: '14px', height: '14px' }}
                    />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save size={14} strokeWidth={1.75} /> Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Confirmar Eliminar ─────────────────────── */}
      {eliminando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => !deleting && setEliminando(null)}
        >
          <div
            className="w-full max-w-md p-6"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="inline-flex items-center justify-center mb-5"
              style={{
                width: '52px',
                height: '52px',
                background: 'rgba(197, 48, 48, 0.06)',
                borderRadius: '12px',
              }}
            >
              <AlertTriangle
                size={24}
                strokeWidth={1.5}
                style={{ color: T.red }}
              />
            </div>

            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-3"
              style={{
                color: T.red,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Eliminar
            </p>

            <h3
              className="text-[22px] md:text-[26px] leading-tight tracking-[-0.025em] mb-3"
              style={{ color: T.ink, fontWeight: 400 }}
            >
              ¿Eliminar
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}esta publicación?
              </span>
            </h3>

            <p
              className="text-[13px] leading-[1.55] mb-6"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              <strong style={{ color: T.ink, fontWeight: 500 }}>
                {eliminando.titulo}
              </strong>{' '}
              se eliminará permanentemente. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setEliminando(null)}
                disabled={deleting}
                className="flex-1 h-11 text-[13px] transition-colors disabled:opacity-50"
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontWeight: 500,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!deleting)
                    e.currentTarget.style.background = 'rgba(15,15,15,0.03)';
                }}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={deleting}
                className="flex-1 h-11 text-white text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: T.red,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!deleting) e.currentTarget.style.background = '#A02424';
                }}
                onMouseLeave={(e) => {
                  if (!deleting) e.currentTarget.style.background = T.red;
                }}
              >
                {deleting ? (
                  <>
                    <div
                      className="border-2 border-white/40 border-t-white rounded-full animate-spin"
                      style={{ width: '14px', height: '14px' }}
                    />
                    Eliminando…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} strokeWidth={1.75} /> Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-4 right-4 z-50 px-4 py-3 max-w-sm"
          style={{
            background: T.bg,
            border: `1px solid ${T.line}`,
            borderLeft: `2px solid ${
              toast.type === 'success' ? T.green : T.red
            }`,
            borderRadius: '6px',
            boxShadow: '0 4px 20px rgba(15,15,15,0.08)',
          }}
        >
          <p
            className="text-[12.5px] leading-[1.5]"
            style={{
              color: toast.type === 'success' ? T.green : T.red,
              fontWeight: 500,
            }}
          >
            {toast.message}
          </p>
        </div>
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display',
            'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family:
            ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino',
            Georgia, 'Times New Roman', serif;
        }
        ::selection {
          background: rgba(79, 46, 232, 0.12);
          color: #0F0F0F;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
      `}</style>
    </>
  );
}