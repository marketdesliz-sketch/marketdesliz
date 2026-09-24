// src/pages/trabaja-con-nosotros.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChevronRight, Check, Phone, Mail, MapPin, LogIn, AlertCircle,
} from 'lucide-react';
import pb from '../lib/pocketbase';
import { useAuth } from '../contexts/AuthContext';
import { T } from '../lib/tokens';
import TerminalBar from '../components/TerminalBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

// ─── DATA · SIN CAMBIOS ─────────────────────────────────────────────────
const PUESTOS = [
  'Desarrollador Web',
  'Vendedor de Campo',
  'Atención al Cliente',
  'Marketing Digital',
  'Diseñador UI/UX',
  'Otro',
];

const VACANTES = [
  {
    title: 'Desarrollador Web',
    type: 'Tiempo completo • Remoto',
    path: null,
  },
  {
    title: 'Vendedor de Campo',
    type: 'Tiempo completo',
    path: '/vender-con-marketdesliz/pasos/01',
  },
  {
    title: 'Atención al Cliente',
    type: 'Tiempo completo • Híbrido',
    path: null,
  },
  {
    title: 'Marketing Digital',
    type: 'Tiempo completo • Remoto',
    path: null,
  },
];

const BENEFICIOS = [
  {
    titulo: 'Crecimiento profesional',
    descripcion: 'Oportunidades reales de desarrollo.',
  },
  {
    titulo: 'Equipo colaborativo',
    descripcion: 'Ambiente de apoyo y aprendizaje.',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
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

function FieldLabel({ children, required = false }) {
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

function FieldInput({ className = '', ...props }) {
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
        border: `1px solid ${focus ? 'rgba(15,15,15,0.24)' : T.line}`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    />
  );
}

function FieldTextarea({ className = '', ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      {...props}
      className={`w-full outline-none resize-none transition-colors ${className}`}
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
        border: `1px solid ${focus ? 'rgba(15,15,15,0.24)' : T.line}`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        lineHeight: 1.55,
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    />
  );
}

function FieldSelect({ className = '', children, ...props }) {
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
        border: `1px solid ${focus ? 'rgba(15,15,15,0.24)' : T.line}`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        cursor: 'pointer',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function TrabajaConNosotrosPage() {
  const router = useRouter();
  const { user, loading: authLoading, openLogin } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    puesto: '',
    experiencia: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const navigateTo = (path) => router.push(path);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      openLogin();
      return;
    }

    setLoading(true);
    try {
      await pb.collection('vacantes').create({
        ...formData,
        userId: user.id,
        created: new Date().toISOString(),
        leido: false,
      });
      setEnviado(true);
      setTimeout(() => setEnviado(false), 5000);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        puesto: '',
        experiencia: '',
        mensaje: '',
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Trabaja con Nosotros | MarketDesliz</title>
        <meta
          name="description"
          content="Únete al equipo de MarketDesliz. Envía tu solicitud y forma parte de nuestra familia."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">

          {/* ═══ HERO EDITORIAL ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-8 md:pt-14 pb-16 md:pb-24">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Trabaja con nosotros · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Únete al equipo,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                transforma la compra.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Forma parte de un equipo que está reinventando la forma de
              comprar y vender en tu comunidad.
            </p>
          </section>

          {/* ═══ VACANTES + FORMULARIO ═══ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">

              {/* Vacantes + beneficios */}
              <div className="lg:col-span-2">
                <SectionLabel>Vacantes actuales</SectionLabel>

                <div className="flex flex-col">
                  {VACANTES.map((vacante, index) => {
                    const clickable = !!vacante.path;
                    return (
                      <div
                        key={index}
                        onClick={() =>
                          clickable && navigateTo(vacante.path)
                        }
                        className="py-5 transition-colors"
                        style={{
                          borderTop: `1px solid ${T.line}`,
                          cursor: clickable ? 'pointer' : 'default',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-[15px] leading-snug tracking-[-0.005em] mb-1.5"
                              style={{ color: T.ink, fontWeight: 500 }}
                            >
                              {vacante.title}
                            </h3>
                            <p
                              className="text-[11px] uppercase tracking-[0.16em]"
                              style={{
                                color: T.inkFaint,
                                fontWeight: 500,
                              }}
                            >
                              {vacante.type}
                            </p>

                            {clickable && (
                              <span
                                className="inline-flex items-center gap-1.5 mt-3 text-[11px] uppercase tracking-[0.18em]"
                                style={{
                                  color: T.accent,
                                  fontWeight: 500,
                                }}
                              >
                                Iniciar proceso
                                <ChevronRight size={11} strokeWidth={1.75} />
                              </span>
                            )}
                          </div>

                          {clickable && (
                            <ChevronRight
                              size={16}
                              strokeWidth={1.75}
                              style={{
                                color: T.accent,
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: `1px solid ${T.line}` }} />
                </div>

                <p
                  className="text-[12px] leading-[1.55] mt-6 max-w-sm"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  Envía tu solicitud y nos pondremos en contacto contigo.
                </p>

                {/* Por qué trabajar con nosotros */}
                <div className="mt-16">
                  <SectionLabel>Por qué trabajar con nosotros</SectionLabel>

                  <div className="flex flex-col">
                    {BENEFICIOS.map((b, i) => (
                      <div
                        key={i}
                        className="py-5"
                        style={{ borderTop: `1px solid ${T.line}` }}
                      >
                        <h3
                          className="text-[15px] leading-snug tracking-[-0.005em] mb-1.5"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {b.titulo}
                        </h3>
                        <p
                          className="text-[13px] leading-[1.6]"
                          style={{ color: T.inkSoft, fontWeight: 450 }}
                        >
                          {b.descripcion}
                        </p>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${T.line}` }} />
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="lg:col-span-3">
                <SectionLabel>Envía tu solicitud</SectionLabel>

                {/* Aviso sin sesión */}
                {!authLoading && !user && (
                  <div
                    className="flex items-start gap-3 px-4 py-3.5 mb-6"
                    style={{
                      background: 'rgba(79, 46, 232, 0.03)',
                      border: `1px solid rgba(79, 46, 232, 0.15)`,
                      borderLeft: `2px solid ${T.accent}`,
                      borderRadius: '6px',
                    }}
                  >
                    <AlertCircle
                      size={14}
                      strokeWidth={1.75}
                      style={{
                        color: T.accent,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[12.5px] leading-[1.55] mb-2"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        <strong style={{ color: T.ink, fontWeight: 500 }}>
                          Necesitas iniciar sesión
                        </strong>{' '}
                        para enviar tu solicitud. Así podremos contactarte y
                        dar seguimiento.
                      </p>
                      <button
                        onClick={openLogin}
                        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors"
                        style={{
                          color: T.accent,
                          fontWeight: 500,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = '0.7')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = '1')
                        }
                      >
                        <LogIn size={12} strokeWidth={1.75} /> Iniciar sesión
                        ahora
                      </button>
                    </div>
                  </div>
                )}

                {/* Éxito */}
                {enviado && (
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 mb-6"
                    style={{
                      background: 'rgba(26, 127, 75, 0.05)',
                      border: `1px solid rgba(26, 127, 75, 0.18)`,
                      borderLeft: `2px solid ${T.green}`,
                      borderRadius: '6px',
                    }}
                  >
                    <Check
                      size={14}
                      strokeWidth={2}
                      style={{ color: T.green, flexShrink: 0 }}
                    />
                    <p
                      className="text-[12.5px]"
                      style={{ color: T.green, fontWeight: 450 }}
                    >
                      Solicitud enviada correctamente
                    </p>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <FieldLabel required>Nombre completo</FieldLabel>
                      <FieldInput
                        type="text"
                        name="nombre"
                        placeholder="Juan Pérez"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel required>Correo electrónico</FieldLabel>
                      <FieldInput
                        type="email"
                        name="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <FieldLabel>Teléfono</FieldLabel>
                      <FieldInput
                        type="tel"
                        name="telefono"
                        placeholder="55 1234 5678"
                        value={formData.telefono}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <FieldLabel required>Puesto</FieldLabel>
                      <FieldSelect
                        name="puesto"
                        value={formData.puesto}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona el puesto</option>
                        {PUESTOS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </FieldSelect>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Experiencia</FieldLabel>
                    <FieldTextarea
                      name="experiencia"
                      placeholder="Cuéntanos sobre tu experiencia"
                      rows="3"
                      value={formData.experiencia}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <FieldLabel>Mensaje adicional</FieldLabel>
                    <FieldTextarea
                      name="mensaje"
                      placeholder="Opcional"
                      rows="2"
                      value={formData.mensaje}
                      onChange={handleChange}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 text-white text-[13px] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    style={{
                      background: T.accent,
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: 'none',
                      cursor:
                        loading || authLoading ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && !authLoading)
                        e.currentTarget.style.background = T.accentDeep;
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && !authLoading)
                        e.currentTarget.style.background = T.accent;
                    }}
                  >
                    {loading ? (
                      <>
                        <span
                          className="border-2 border-white/40 border-t-white rounded-full animate-spin"
                          style={{ width: '14px', height: '14px' }}
                        />
                        Enviando…
                      </>
                    ) : !user ? (
                      <>
                        <LogIn size={14} strokeWidth={1.75} /> Iniciar sesión
                        para enviar
                      </>
                    ) : (
                      'Enviar solicitud'
                    )}
                  </button>
                </form>

                <p
                  className="text-[12px] leading-[1.55] mt-5"
                  style={{ color: T.inkFaint, fontWeight: 450 }}
                >
                  Al enviar, aceptas nuestros{' '}
                  <Link
                    href="/terminos"
                    className="transition-colors"
                    style={{
                      color: T.accent,
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                      textDecorationThickness: '1px',
                    }}
                  >
                    Términos y Condiciones
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

        </main>

        <Footer />
      </div>

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