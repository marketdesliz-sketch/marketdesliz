// src/pages/empleos/publicar.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Briefcase, CheckCircle, ChevronLeft, AlertTriangle,
  Eye, X, MapPin, Clock, Phone, Mail, LogIn,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes de formulario
// ─────────────────────────────────────────────────────────────────────────
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
      {required && (
        <span style={{ color: T.red, marginLeft: '3px' }}>*</span>
      )}
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
    <p
      className="text-[11.5px] mt-1.5"
      style={{ color: T.red, fontWeight: 450 }}
    >
      {children}
    </p>
  );
}

function CounterText({ children }) {
  return (
    <p
      className="text-[10.5px] mt-1.5 tabular-nums"
      style={{
        color: T.inkFaint,
        fontWeight: 450,
        fontFeatureSettings: '"tnum"',
      }}
    >
      {children}
    </p>
  );
}

// ─── Categorías · SIN CAMBIOS ────────────────────────────────────────────
const CATEGORIAS_BOLSA = [
  'ventas', 'atencion_cliente', 'administracion', 'tecnologia',
  'oficios', 'construccion', 'limpieza', 'cocina',
  'chofer', 'repartidor', 'informal', 'otro',
];

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
    map[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Página — lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function PublicarOfertaPage() {
  const router = useRouter();

  // Auth desde el contexto
  const { user, loading: authLoading, openLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'busco_empleo',
    titulo: '',
    descripcion: '',
    categoria: '',
    salario: '',
    horario: '',
    ubicacion: '',
    telefono: '',
    email: '',
  });

  const [errors, setErrors] = useState({});

  // Ref para limpiar el timeout de redirección
  const redirectTimeoutRef = useRef(null);

  // Notificaciones (vacías, requeridas por Header)
  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Cleanup: evitar redirect fantasma al desmontar ─────
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // ─── Verificar auth y pre-llenar datos ──────────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      openLogin();
      return;
    }

    // Pre-llenar teléfono y email desde el perfil
    setFormData((prev) => ({
      ...prev,
      telefono: user.telefono || '',
      email: user.email || '',
    }));
  }, [authLoading, user, openLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};
    if (!formData.titulo.trim()) newErrors.titulo = 'El título es obligatorio';
    if (!formData.descripcion.trim())
      newErrors.descripcion = 'La descripción es obligatoria';
    if (!formData.categoria)
      newErrors.categoria = 'Selecciona una categoría';
    if (!formData.telefono.trim())
      newErrors.telefono = 'El teléfono es obligatorio';
    if (
      formData.telefono.trim() &&
      !/^\d{10,15}$/.test(formData.telefono.replace(/\D/g, ''))
    ) {
      newErrors.telefono =
        'Ingresa un número de teléfono válido (10-15 dígitos)';
    }
    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    if (
      formData.salario &&
      !/^\$?\s*\d+(\.\d{2})?$/.test(formData.salario.replace(/,/g, ''))
    ) {
      newErrors.salario = 'Ingresa un monto válido (ej: $8,000)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      openLogin();
      return;
    }

    if (!validarFormulario()) {
      const firstError = document.querySelector('.border-red-300');
      if (firstError) firstError.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await pb.collection('empleos').create({
        userId: user.id,
        tipo: formData.tipo,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria,
        salario: formData.salario.trim(),
        horario: formData.horario.trim(),
        ubicacion: formData.ubicacion.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        estado: 'pendiente',
        activo: true,
      });
      setEnviado(true);
      // Guardamos el ID para poder limpiarlo si el componente se desmonta
      redirectTimeoutRef.current = setTimeout(
        () => router.push('/empleos'),
        3000
      );
    } catch (err) {
      console.error('Error al publicar:', err);
      setError('Ocurrió un error al publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (!user) {
      openLogin();
      return;
    }
    if (!validarFormulario()) return;
    setShowPreview(true);
  };

  // ─── Pantalla: cargando auth ────────────────────────────
  if (authLoading) {
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

  // ─── Pantalla: éxito ────────────────────────────────────
  if (enviado) {
    return (
      <>
        <Head>
          <title>Publicar en Empleos | MarketDesliz</title>
          <meta name="theme-color" content="#0F0F0F" />
        </Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/empleos" />
          <TerminalBar mode="rotating" />
          <Header notifications={notifications} unreadCount={unreadCount} />
          <main className="flex-1 max-w-[600px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center mb-6"
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
              <p
                className="text-[10px] uppercase tracking-[0.28em] mb-4"
                style={{
                  color: T.green,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Oferta enviada
              </p>
              <h1
                className="text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.03em] mb-4"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                En revisión
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  por el administrador.
                </span>
              </h1>
              <p
                className="text-[14.5px] leading-[1.6] mb-3 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                El administrador la revisará y la publicará pronto.
              </p>
              <p
                className="text-[11px] uppercase tracking-[0.24em] mt-8"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Redirigiendo…
              </p>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  // ─── Pantalla: sin sesión ───────────────────────────────
  if (!user) {
    return (
      <>
        <Head>
          <title>Publicar en Empleos | MarketDesliz</title>
          <meta name="theme-color" content="#0F0F0F" />
        </Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/empleos" />
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
                <LogIn
                  size={28}
                  strokeWidth={1.5}
                  style={{ color: T.accent }}
                />
              </div>
              <h1
                className="text-[32px] md:text-[40px] leading-tight tracking-[-0.03em] mb-3"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Inicia sesión
                <br />
                <span className="font-serif italic" style={{ color: T.inkMid }}>
                  para publicar.
                </span>
              </h1>
              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas iniciar sesión para publicar una oferta en Empleos.
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentDeep)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
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

  // ─── Pantalla: formulario ───────────────────────────────
  return (
    <>
      <Head>
        <title>Publicar en Empleos | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/empleos" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[760px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

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
              Empleos · Publicar
            </p>

            <h1
              className="text-[36px] md:text-[52px] leading-[1.02] tracking-[-0.035em] max-w-2xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Publica una oferta,
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                en tu comunidad.
              </span>
            </h1>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-5 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Completa el formulario. Tu publicación será revisada antes de
              aparecer en la lista.
            </p>
          </section>

          {/* ─── Formulario ──────────────────────────────── */}
          <section
            className="p-6 md:p-8"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '8px',
            }}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
              noValidate
            >
              {/* Tipo */}
              <div>
                <FieldLabel required>Tipo de publicación</FieldLabel>
                <FieldSelect
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                >
                  <option value="busco_empleo">Busco empleo</option>
                  <option value="ofrezco_empleo">Ofrezco empleo</option>
                </FieldSelect>
              </div>

              {/* Título */}
              <div>
                <FieldLabel required>Título</FieldLabel>
                <FieldInput
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Se solicita ayudante de cocina"
                  maxLength="100"
                  error={!!errors.titulo}
                  className={errors.titulo ? 'border-red-300' : ''}
                />
                {errors.titulo && <ErrorText>{errors.titulo}</ErrorText>}
                <CounterText>{formData.titulo.length}/100</CounterText>
              </div>

              {/* Categoría */}
              <div>
                <FieldLabel required>Categoría</FieldLabel>
                <FieldSelect
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  error={!!errors.categoria}
                  className={errors.categoria ? 'border-red-300' : ''}
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS_BOLSA.map((cat) => (
                    <option key={cat} value={cat}>
                      {getNombreCategoria(cat)}
                    </option>
                  ))}
                </FieldSelect>
                {errors.categoria && <ErrorText>{errors.categoria}</ErrorText>}
              </div>

              {/* Descripción */}
              <div>
                <FieldLabel required>Descripción</FieldLabel>
                <FieldTextarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe el puesto, requisitos, responsabilidades..."
                  maxLength="1000"
                  error={!!errors.descripcion}
                  className={errors.descripcion ? 'border-red-300' : ''}
                />
                {errors.descripcion && (
                  <ErrorText>{errors.descripcion}</ErrorText>
                )}
                <CounterText>{formData.descripcion.length}/1000</CounterText>
              </div>

              {/* Salario + Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Salario</FieldLabel>
                  <FieldInput
                    type="text"
                    name="salario"
                    value={formData.salario}
                    onChange={handleChange}
                    placeholder="Ej: $8,000 mensual"
                    error={!!errors.salario}
                    className={errors.salario ? 'border-red-300' : ''}
                  />
                  {errors.salario && <ErrorText>{errors.salario}</ErrorText>}
                </div>
                <div>
                  <FieldLabel>Horario</FieldLabel>
                  <FieldInput
                    type="text"
                    name="horario"
                    value={formData.horario}
                    onChange={handleChange}
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
                  value={formData.ubicacion}
                  onChange={handleChange}
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
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="5512345678"
                    error={!!errors.telefono}
                    className={errors.telefono ? 'border-red-300' : ''}
                  />
                  {errors.telefono && <ErrorText>{errors.telefono}</ErrorText>}
                </div>
                <div>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <FieldInput
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    error={!!errors.email}
                    className={errors.email ? 'border-red-300' : ''}
                  />
                  {errors.email && <ErrorText>{errors.email}</ErrorText>}
                </div>
              </div>

              {/* Error general */}
              {error && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3"
                  style={{
                    background: 'rgba(197, 48, 48, 0.06)',
                    border: `1px solid rgba(197, 48, 48, 0.15)`,
                    borderLeft: `2px solid ${T.red}`,
                    borderRadius: '6px',
                  }}
                >
                  <AlertTriangle
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: T.red, flexShrink: 0, marginTop: 2 }}
                  />
                  <p
                    className="text-[12.5px] leading-[1.55]"
                    style={{ color: T.red, fontWeight: 450 }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="flex-1 flex items-center justify-center gap-2 h-11 text-[13px] transition-colors"
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <Eye size={14} strokeWidth={1.75} /> Vista previa
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 h-11 text-white text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transitionTimingFunction: T.ease,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = T.accentDeep;
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = T.accent;
                  }}
                >
                  <Briefcase size={14} strokeWidth={1.75} />
                  {loading ? 'Enviando...' : 'Publicar oferta'}
                </button>
              </div>
            </form>
          </section>
        </main>

        <Footer variant="minimal" />
      </div>

      {/* ─── Modal de vista previa ─────────────────────── */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
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
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Vista previa
                </p>
                <h3
                  className="text-[20px] leading-tight tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  Así se verá
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}tu oferta.
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
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

            {/* Body modal */}
            <div className="p-6 flex flex-col gap-5">
              {/* Tipo + categoría */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1"
                  style={{
                    background:
                      formData.tipo === 'ofrezco_empleo'
                        ? 'rgba(79, 46, 232, 0.08)'
                        : 'rgba(26, 127, 75, 0.08)',
                    color:
                      formData.tipo === 'ofrezco_empleo' ? T.accent : T.green,
                    borderRadius: '4px',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 600,
                  }}
                >
                  {formData.tipo === 'ofrezco_empleo'
                    ? 'Ofrezco empleo'
                    : 'Busco empleo'}
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: T.inkFaint, fontWeight: 500 }}
                >
                  · {getNombreCategoria(formData.categoria) || 'Sin categoría'}
                </span>
              </div>

              {/* Título */}
              <h2
                className="text-[22px] leading-tight tracking-[-0.02em]"
                style={{ color: T.ink, fontWeight: 500 }}
              >
                {formData.titulo || 'Título'}
              </h2>

              {/* Descripción */}
              <p
                className="text-[13px] leading-[1.6] whitespace-pre-wrap"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {formData.descripcion || 'Descripción'}
              </p>

              {/* Meta */}
              {(formData.salario ||
                formData.ubicacion ||
                formData.horario) && (
                <div className="flex flex-col gap-1.5">
                  {formData.salario && (
                    <span
                      className="text-[13px] tabular-nums"
                      style={{
                        color: T.green,
                        fontWeight: 500,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {formData.salario}
                    </span>
                  )}
                  {formData.ubicacion && (
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={12}
                        strokeWidth={1.75}
                        style={{ color: T.inkFaint, flexShrink: 0 }}
                      />
                      <span
                        className="text-[12.5px]"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        {formData.ubicacion}
                      </span>
                    </div>
                  )}
                  {formData.horario && (
                    <div className="flex items-center gap-2">
                      <Clock
                        size={12}
                        strokeWidth={1.75}
                        style={{ color: T.inkFaint, flexShrink: 0 }}
                      />
                      <span
                        className="text-[12.5px]"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        {formData.horario}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Contacto */}
              <div
                className="pt-4 flex flex-col gap-1.5"
                style={{ borderTop: `1px solid ${T.line}` }}
              >
                <div className="flex items-center gap-2">
                  <Phone
                    size={12}
                    strokeWidth={1.75}
                    style={{ color: T.inkFaint, flexShrink: 0 }}
                  />
                  <span
                    className="text-[12.5px] tabular-nums"
                    style={{
                      color: T.inkSoft,
                      fontWeight: 450,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {formData.telefono || 'Sin teléfono'}
                  </span>
                </div>
                {formData.email && (
                  <div className="flex items-center gap-2">
                    <Mail
                      size={12}
                      strokeWidth={1.75}
                      style={{ color: T.inkFaint, flexShrink: 0 }}
                    />
                    <span
                      className="text-[12.5px]"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      {formData.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Aviso */}
              <div
                className="flex items-start gap-2.5 px-3.5 py-3"
                style={{
                  background: 'rgba(184, 130, 14, 0.06)',
                  border: `1px solid rgba(184, 130, 14, 0.15)`,
                  borderRadius: '6px',
                }}
              >
                <AlertTriangle
                  size={13}
                  strokeWidth={1.75}
                  style={{ color: '#B8820E', flexShrink: 0, marginTop: 2 }}
                />
                <span
                  className="text-[11.5px] leading-[1.5]"
                  style={{ color: '#8A6109', fontWeight: 450 }}
                >
                  Esta es una vista previa. Revisa que todos los datos sean
                  correctos antes de publicar.
                </span>
              </div>
            </div>

            {/* Footer modal */}
            <div
              className="sticky bottom-0 flex gap-2.5 px-6 py-4"
              style={{
                background: T.bg,
                borderTop: `1px solid ${T.line}`,
              }}
            >
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 h-11 text-[13px] transition-colors"
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Editar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-11 text-white text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = T.accentDeep;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = T.accent;
                }}
              >
                {loading ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
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