// src/pages/servicios/publicidad/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Megaphone, Check, Star, Zap, Crown,
  TrendingUp, Users, Target, MessageCircle,
  Send, Info, AlertCircle, Lock, Sparkles, ChevronRight,
  CheckCircle, LogIn,
} from 'lucide-react';
import pb from '../../../lib/pocketbase';
import { useAuth } from '../../../contexts/AuthContext';
import { T } from '../../../lib/tokens';
import TerminalBar from '../../../components/TerminalBar';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BackButton from '../../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// COLORES · acento rosa (Publicidad)
// ─────────────────────────────────────────────────────────────────────────
const PINK = {
  hex: '#DB2777',
  hexDeep: '#BE185D',
  soft: 'rgba(219, 39, 119, 0.06)',
  softStrong: 'rgba(219, 39, 119, 0.12)',
};

// ─────────────────────────────────────────────────────────────────────────
// PLANES · fallback si no hay config_sistema
// ─────────────────────────────────────────────────────────────────────────
const PLANES_FALLBACK = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: 300,
    duracion: '7 días',
    icon: Megaphone,
    destacado: false,
    features: [
      '1 post en redes sociales',
      'Historia en Instagram',
      'Enlace a tu WhatsApp',
      'Duración: 7 días',
    ],
  },
  {
    id: 'estandar',
    nombre: 'Estándar',
    precio: 700,
    duracion: '15 días',
    icon: Zap,
    destacado: true,
    features: [
      '3 posts en redes sociales',
      '5 historias en Instagram',
      'Historia destacada por 15 días',
      'Banner en la app',
      'Duración: 15 días',
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: 1500,
    duracion: '30 días',
    icon: Crown,
    destacado: false,
    features: [
      '7 posts en redes sociales',
      'Historias ilimitadas por 30 días',
      'Banner en portada',
      'Sección destacada en la app',
      'Video promocional',
      'Duración: 30 días',
    ],
  },
];

const OBJETIVOS = [
  { id: 'ventas', label: 'Aumentar ventas' },
  { id: 'clientes', label: 'Conseguir más clientes' },
  { id: 'marca', label: 'Dar a conocer mi marca' },
  { id: 'evento', label: 'Promocionar un evento' },
  { id: 'otro', label: 'Otro' },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = PINK.hex }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="text-[10px] uppercase tracking-[0.22em] whitespace-nowrap"
        style={{
          color: accent,
          fontWeight: 500,
          fontFeatureSettings: '"ss01"',
        }}
      >
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: T.line }} />
    </div>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label
      className="block text-[10px] uppercase tracking-[0.22em] mb-2"
      style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
    >
      {children}
      {required && <span style={{ color: PINK.hex, marginLeft: 4 }}>*</span>}
    </label>
  );
}

function TextField({
  name, value, onChange, placeholder, type = 'text',
  multiline = false, rows = 3,
}) {
  const [focus, setFocus] = useState(false);

  const baseStyle = {
    width: '100%',
    background: 'transparent',
    border: `1px solid ${focus ? PINK.hex : T.line}`,
    borderRadius: '6px',
    color: T.ink,
    fontSize: '14px',
    fontWeight: 450,
    letterSpacing: '-0.005em',
    padding: multiline ? '12px 14px' : '0 14px',
    height: multiline ? 'auto' : '42px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: `border-color 0.2s ${T.ease}`,
    resize: multiline ? 'none' : undefined,
  };

  return multiline ? (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={baseStyle}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  ) : (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={baseStyle}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    />
  );
}

function ObjetivoChip({ label, active, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="px-3.5 h-9 text-[12px] transition-all"
      style={{
        background: active ? PINK.hex : hover ? 'rgba(15,15,15,0.04)' : 'transparent',
        color: active ? '#FFFFFF' : T.inkMid,
        border: active ? `1px solid ${PINK.hex}` : `1px solid ${T.line}`,
        borderRadius: '6px',
        fontWeight: 500,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      {label}
    </button>
  );
}

function PlanCard({ plan, isActive, onClick }) {
  const [hover, setHover] = useState(false);
  const Icon = plan.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative text-left p-5 flex flex-col transition-all duration-300"
      style={{
        background: T.bg,
        border: `2px solid ${isActive ? PINK.hex : hover ? 'rgba(15,15,15,0.14)' : T.line}`,
        borderRadius: '8px',
        transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isActive
          ? '0 1px 2px rgba(15,15,15,0.04), 0 8px 24px rgba(219,39,119,0.12)'
          : 'none',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      {plan.destacado && (
        <span
          className="absolute -top-2.5 left-5 px-2.5 py-1"
          style={{
            background: PINK.hex,
            color: '#FFFFFF',
            borderRadius: '4px',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 600,
          }}
        >
          Más popular
        </span>
      )}

      {/* Top: icono + check */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center"
          style={{
            width: '40px',
            height: '40px',
            background: PINK.soft,
            borderRadius: '8px',
          }}
        >
          <Icon size={18} strokeWidth={1.75} style={{ color: PINK.hex }} />
        </div>
        {isActive && (
          <div
            className="flex items-center justify-center"
            style={{
              width: '20px',
              height: '20px',
              background: PINK.hex,
              borderRadius: '50%',
            }}
          >
            <Check size={11} strokeWidth={3} style={{ color: '#FFFFFF' }} />
          </div>
        )}
      </div>

      {/* Precio */}
      <div className="flex items-baseline gap-1 mb-1">
        <span
          className="tabular-nums tracking-[-0.02em]"
          style={{
            color: T.ink,
            fontSize: '28px',
            fontWeight: 400,
            fontFeatureSettings: '"tnum"',
          }}
        >
          ${plan.precio}
        </span>
        <span
          className="text-[11px]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          MXN
        </span>
      </div>
      <p
        className="text-[10px] uppercase tracking-[0.18em] mb-4"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {plan.duracion}
      </p>

      <p
        className="text-[14.5px] mb-4"
        style={{ color: T.ink, fontWeight: 500 }}
      >
        Plan {plan.nombre}
      </p>

      <ul className="flex flex-col gap-2">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check
              size={12}
              strokeWidth={2.25}
              style={{ color: PINK.hex, marginTop: 3, flexShrink: 0 }}
            />
            <span
              className="text-[12.5px] leading-[1.5]"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function PublicidadPage() {
  const router = useRouter();
  const { user, loading: authLoading, openLogin } = useAuth();

  const [planes, setPlanes] = useState(PLANES_FALLBACK);
  const [selectedPlan, setSelectedPlan] = useState('estandar');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    negocio: '',
    objetivo: '',
    detalles: '',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const navigateTo = (path) => router.push(path);

  const notifications = [
    {
      id: 1,
      title: '¡Servicio Oficial!',
      description: 'Publicidad MarketDesliz',
      time: 'Ahora',
      read: false,
    },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Leer config_sistema · SIN CAMBIOS ────────────────
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const configs = await pb.collection('config_sistema').getFullList({ limit: 1 });
        if (configs[0]) {
          const c = configs[0];
          setPlanes((prev) =>
            prev.map((p) => {
              if (p.id === 'basico' && c.precioPublicidadBasico) {
                return { ...p, precio: Number(c.precioPublicidadBasico) };
              }
              if (p.id === 'estandar' && c.precioPublicidadEstandar) {
                return { ...p, precio: Number(c.precioPublicidadEstandar) };
              }
              if (p.id === 'premium' && c.precioPublicidadPremium) {
                return { ...p, precio: Number(c.precioPublicidadPremium) };
              }
              return p;
            })
          );
        }
      } catch (e) {
        console.log('Sin config_sistema, usando precios por defecto');
      }
    };
    cargarConfig();
  }, []);

  // ─── Pre-rellenar si hay sesión · SIN CAMBIOS ────────
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nombre: prev.nombre || user.nombre || '',
        email: prev.email || user.email || '',
        telefono: prev.telefono || user.telefono || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // ─── Solicitar · SIN CAMBIOS ─────────────────────────
  const handleSolicitar = async () => {
    if (!user) {
      openLogin();
      return;
    }

    if (!formData.nombre.trim() || !formData.negocio.trim() || !formData.objetivo) {
      setError('Completa los campos obligatorios para continuar');
      return;
    }

    setEnviando(true);
    setError('');

    const planSeleccionado = planes.find((p) => p.id === selectedPlan);

    try {
      await pb.collection('solicitudes_publicidad').create({
        userId: user.id,
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        negocio: formData.negocio.trim(),
        plan: selectedPlan,
        planNombre: planSeleccionado.nombre,
        precio: planSeleccionado.precio,
        duracion: planSeleccionado.duracion,
        objetivo: formData.objetivo,
        detalles: formData.detalles.trim(),
        estado: 'pendiente',
        activo: true,
      });

      const mensaje = encodeURIComponent(
        `Hola, quiero contratar el servicio de Publicidad de MarketDesliz.\n\n` +
          `📋 *Plan:* ${planSeleccionado.nombre} ($${planSeleccionado.precio} MXN · ${planSeleccionado.duracion})\n` +
          `👤 *Nombre:* ${formData.nombre}\n` +
          `🏪 *Negocio/Marca:* ${formData.negocio}\n` +
          (formData.telefono ? `📞 *Teléfono:* ${formData.telefono}\n` : '') +
          (formData.email ? `✉️ *Email:* ${formData.email}\n` : '') +
          `🎯 *Objetivo:* ${OBJETIVOS.find((o) => o.id === formData.objetivo)?.label}\n` +
          (formData.detalles.trim() ? `📝 *Detalles:* ${formData.detalles}` : '')
      );

      window.open(`https://wa.me/522821414939?text=${mensaje}`, '_blank');

      setEnviado(true);
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      setError('No pudimos enviar tu solicitud. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setEnviado(false);
    setFormData({
      nombre: user?.nombre || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      negocio: '',
      objetivo: '',
      detalles: '',
    });
    setSelectedPlan('estandar');
  };

  const stats = [
    { valor: '+10K', label: 'Usuarios en la app', icon: Users },
    { valor: '3', label: 'Planes disponibles', icon: Megaphone },
    { valor: '100%', label: 'Alcance local', icon: Target },
    { valor: '24h', label: 'Respuesta promedio', icon: TrendingUp },
  ];

  const planSeleccionado = planes.find((p) => p.id === selectedPlan);

  return (
    <>
      <Head>
        <title>Publicidad | MarketDesliz</title>
        <meta
          name="description"
          content="Promociona tu negocio, marca o evento en MarketDesliz. Planes desde $300 MXN."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/servicios" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">

          {/* ═══ HERO EDITORIAL ══════════════════════════════ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-12 md:pb-16">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: PINK.hex,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Publicidad · Servicio oficial
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Promociona tu negocio
              <br />
              <span
                className="font-serif italic"
                style={{ color: PINK.hex }}
              >
                al siguiente nivel.
              </span>
            </h1>

            <p
              className="text-[20px] md:text-[26px] leading-[1.35] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl font-serif italic"
              style={{ color: T.inkMid, fontWeight: 400 }}
            >
              Alcanza a miles de usuarios locales.
            </p>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-4 max-w-lg"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Post en redes sociales, banners en la app y sección destacada.
              Planes desde{' '}
              <strong style={{ color: PINK.hex, fontWeight: 500 }}>
                ${planes[0]?.precio || 300} MXN
              </strong>
              .
            </p>
          </section>

          {/* ═══ STATS ══════════════════════════════════════ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-10">
            <SectionLabel>Resumen</SectionLabel>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="p-5 flex flex-col gap-3"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: '32px',
                          height: '32px',
                          background: PINK.soft,
                          borderRadius: '6px',
                        }}
                      >
                        <Icon size={14} strokeWidth={1.75} style={{ color: PINK.hex }} />
                      </div>
                      <p
                        className="text-[10px] uppercase tracking-[0.18em] truncate"
                        style={{ color: T.inkFaint, fontWeight: 500 }}
                      >
                        {stat.label}
                      </p>
                    </div>
                    <p
                      className="text-[28px] leading-none tabular-nums tracking-[-0.02em]"
                      style={{
                        color: T.ink,
                        fontWeight: 400,
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {stat.valor}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══ PLANES ═════════════════════════════════════ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16">
            <SectionLabel>01 · Elige tu plan</SectionLabel>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {planes.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isActive={selectedPlan === plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                />
              ))}
            </div>
          </section>

          {/* ═══ FORMULARIO / ÉXITO ═════════════════════════ */}
          <section className="max-w-[900px] mx-auto px-6 md:px-14 pb-16">
            {!enviado ? (
              <>
                <SectionLabel>02 · Cuéntanos sobre tu negocio</SectionLabel>

                {/* Aviso sin sesión */}
                {!authLoading && !user && (
                  <div
                    className="mb-6 flex items-start gap-2.5 px-4 py-3"
                    style={{
                      background: PINK.soft,
                      border: `1px solid ${PINK.softStrong}`,
                      borderRadius: '6px',
                    }}
                  >
                    <LogIn
                      size={14}
                      strokeWidth={1.75}
                      style={{ color: PINK.hex, flexShrink: 0, marginTop: 2 }}
                    />
                    <div className="flex-1">
                      <p
                        className="text-[12.5px] leading-[1.55]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        <strong style={{ color: T.ink, fontWeight: 500 }}>
                          Necesitas iniciar sesión
                        </strong>{' '}
                        para enviar tu solicitud.
                      </p>
                      <button
                        onClick={openLogin}
                        className="mt-1.5 text-[10.5px] uppercase tracking-[0.18em]"
                        style={{
                          color: PINK.hex,
                          fontWeight: 500,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        Iniciar sesión →
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-6">

                  {/* Nombre + Negocio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Tu nombre</FieldLabel>
                      <TextField
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Negocio o marca</FieldLabel>
                      <TextField
                        name="negocio"
                        value={formData.negocio}
                        onChange={handleChange}
                        placeholder="Ej: Taquería El Rey"
                      />
                    </div>
                  </div>

                  {/* Teléfono + Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Teléfono</FieldLabel>
                      <TextField
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="55 1234 5678"
                      />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <TextField
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  {/* Objetivo */}
                  <div>
                    <FieldLabel required>¿Cuál es tu objetivo?</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {OBJETIVOS.map((obj) => {
                        const isActive = formData.objetivo === obj.id;
                        return (
                          <ObjetivoChip
                            key={obj.id}
                            label={obj.label}
                            active={isActive}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, objetivo: obj.id }));
                              if (error) setError('');
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Detalles */}
                  <div>
                    <FieldLabel>Detalles adicionales (opcional)</FieldLabel>
                    <TextField
                      name="detalles"
                      value={formData.detalles}
                      onChange={handleChange}
                      placeholder="Ej: Quiero promocionar mis tacos al pastor los fines de semana"
                      multiline
                      rows={3}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="flex items-start gap-2.5 px-4 py-3"
                      style={{
                        background: 'rgba(197, 48, 48, 0.06)',
                        borderLeft: `2px solid ${T.red}`,
                        borderRadius: '6px',
                      }}
                    >
                      <AlertCircle
                        size={14}
                        strokeWidth={1.75}
                        style={{ color: T.red, flexShrink: 0, marginTop: 2 }}
                      />
                      <p
                        className="text-[12.5px] leading-relaxed flex-1"
                        style={{ color: T.red, fontWeight: 450 }}
                      >
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Info comisión */}
                  <div
                    className="flex items-start gap-2.5 px-4 py-3"
                    style={{
                      background: PINK.soft,
                      border: `1px solid ${PINK.softStrong}`,
                      borderRadius: '6px',
                    }}
                  >
                    <Info
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: PINK.hex, flexShrink: 0, marginTop: 3 }}
                    />
                    <p
                      className="text-[12.5px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      <strong style={{ color: T.ink, fontWeight: 500 }}>
                        Sin costos ocultos.
                      </strong>{' '}
                      El precio del plan es lo único que pagas. El pago se realiza al
                      confirmar tu campaña por WhatsApp.
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleSolicitar}
                    disabled={enviando || authLoading}
                    className="w-full flex items-center justify-center gap-2.5 h-12 text-white text-[13.5px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: PINK.hex,
                      borderRadius: '6px',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      transitionTimingFunction: T.ease,
                      WebkitTapHighlightColor: 'transparent',
                      border: 'none',
                      cursor: enviando || authLoading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!enviando && !authLoading)
                        e.currentTarget.style.background = PINK.hexDeep;
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = PINK.hex)}
                  >
                    {enviando ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Enviando…
                      </>
                    ) : !user ? (
                      <>
                        <LogIn size={15} strokeWidth={1.75} /> Iniciar sesión para enviar
                      </>
                    ) : (
                      <>
                        <Send size={15} strokeWidth={1.75} />
                        Enviar solicitud por WhatsApp
                      </>
                    )}
                  </button>

                  {/* Footer seguridad */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Lock size={11} strokeWidth={1.75} style={{ color: T.inkFaint }} />
                    <p
                      className="text-[10.5px]"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Tu información está protegida. Solo la usamos para tu campaña.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* ═══ ÉXITO ═══════════════════════════════════ */
              <>
                <SectionLabel>02 · Solicitud enviada</SectionLabel>

                <div
                  className="p-8 md:p-12 text-center"
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center mb-8"
                    style={{
                      width: '72px',
                      height: '72px',
                      background: 'rgba(26, 127, 75, 0.08)',
                      borderRadius: '14px',
                    }}
                  >
                    <CheckCircle size={32} strokeWidth={1.5} style={{ color: T.green }} />
                  </div>

                  <h2
                    className="text-[28px] md:text-[36px] leading-[1.05] tracking-[-0.03em] mb-4"
                    style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                  >
                    ¡Solicitud
                    <br />
                    <span className="font-serif italic" style={{ color: T.green }}>
                      enviada!
                    </span>
                  </h2>

                  <p
                    className="text-[14.5px] leading-[1.6] max-w-md mx-auto mb-8"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Nos pondremos en contacto contigo por WhatsApp en las próximas
                    horas para confirmar los detalles de tu campaña.
                  </p>

                  {/* Resumen */}
                  <div
                    className="max-w-md mx-auto p-5 text-left mb-8"
                    style={{
                      background: PINK.soft,
                      border: `1px solid ${PINK.softStrong}`,
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-[0.22em] mb-4"
                      style={{ color: PINK.hex, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                    >
                      Resumen de tu solicitud
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: T.inkSoft, fontWeight: 450 }}>Plan:</span>
                        <span style={{ color: T.ink, fontWeight: 500 }}>
                          {planSeleccionado?.nombre}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: T.inkSoft, fontWeight: 450 }}>Precio:</span>
                        <span
                          className="tabular-nums"
                          style={{
                            color: T.ink,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          ${planSeleccionado?.precio} MXN
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: T.inkSoft, fontWeight: 450 }}>Duración:</span>
                        <span style={{ color: T.ink, fontWeight: 500 }}>
                          {planSeleccionado?.duracion}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 h-11 px-5 text-[13px] transition-colors"
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
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      Nueva solicitud
                    </button>
                    <Link
                      href="/servicios"
                      className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                      style={{
                        background: PINK.hex,
                        borderRadius: '6px',
                        fontWeight: 500,
                        WebkitTapHighlightColor: 'transparent',
                        transitionTimingFunction: T.ease,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = PINK.hexDeep)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = PINK.hex)}
                    >
                      Ver más servicios <ChevronRight size={14} strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* ═══ CTA SECUNDARIO · dudas ═════════════════════ */}
          <section className="max-w-[900px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div
              className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10"
              style={{
                background: PINK.soft,
                border: `1px solid ${PINK.softStrong}`,
                borderRadius: '8px',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '44px',
                    height: '44px',
                    background: T.bg,
                    border: `1px solid ${PINK.softStrong}`,
                    borderRadius: '8px',
                  }}
                >
                  <MessageCircle
                    size={20}
                    strokeWidth={1.75}
                    style={{ color: PINK.hex }}
                  />
                </div>
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-2"
                    style={{ color: PINK.hex, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                  >
                    ¿Dudas?
                  </p>
                  <h3
                    className="text-[20px] md:text-[24px] leading-[1.15] tracking-[-0.02em] mb-1.5"
                    style={{ color: T.ink, fontWeight: 400 }}
                  >
                    Te ayudamos a elegir el plan ideal
                  </h3>
                  <p
                    className="text-[13px]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Contáctanos por WhatsApp y resolvemos tus dudas.
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/522821414939?text=Hola,%20tengo%20dudas%20sobre%20los%20planes%20de%20Publicidad%20de%20MarketDesliz"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 text-white text-[13px]"
                style={{
                  background: '#1A7F4B',
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#15803D')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1A7F4B')}
              >
                <MessageCircle size={14} strokeWidth={1.75} />
                Contactar
              </a>
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
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family: ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino', Georgia, 'Times New Roman', serif;
        }
        ::selection { background: rgba(219, 39, 119, 0.12); color: #0F0F0F; }
        * { -webkit-tap-highlight-color: transparent; font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1; }
      `}</style>
    </>
  );
}