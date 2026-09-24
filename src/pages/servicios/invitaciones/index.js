// src/pages/servicios/invitaciones/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Sparkles, Check, Heart, Cake, Crown, Gift, Star,
  Palette, Send, Info, AlertCircle, Lock, Calendar, User,
  MessageCircle, PartyPopper, Wand2, ChevronRight,
  CheckCircle, LogIn, Clock,
} from 'lucide-react';
import pb from '../../../lib/pocketbase';
import { useAuth } from '../../../contexts/AuthContext';
import { T } from '../../../lib/tokens';
import TerminalBar from '../../../components/TerminalBar';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BackButton from '../../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// COLORES · acento verde (Invitaciones)
// ─────────────────────────────────────────────────────────────────────────
const GREEN = {
  hex: '#16A34A',
  hexDeep: '#15803D',
  soft: 'rgba(22, 163, 74, 0.06)',
  softStrong: 'rgba(22, 163, 74, 0.12)',
};

// ─────────────────────────────────────────────────────────────────────────
// TIPOS DE INVITACIÓN · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const TIPOS = [
  { id: 'boda', nombre: 'Bodas', icon: Heart, colorHex: '#DB2777' },
  { id: 'xv', nombre: 'XV Años', icon: Crown, colorHex: '#9333EA' },
  { id: 'cumple', nombre: 'Cumpleaños', icon: Cake, colorHex: '#EA580C' },
  { id: 'bautizo', nombre: 'Bautizos', icon: Gift, colorHex: '#2563EB' },
  { id: 'otro', nombre: 'Otro evento', icon: PartyPopper, colorHex: GREEN.hex },
];

// ─────────────────────────────────────────────────────────────────────────
// ESTILOS DISPONIBLES · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const ESTILOS = [
  { id: 'clasico', label: 'Clásico' },
  { id: 'moderno', label: 'Moderno' },
  { id: 'minimalista', label: 'Minimalista' },
  { id: 'floral', label: 'Floral' },
  { id: 'elegante', label: 'Elegante' },
  { id: 'divertido', label: 'Divertido' },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = GREEN.hex }) {
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
      {required && <span style={{ color: GREEN.hex, marginLeft: 4 }}>*</span>}
    </label>
  );
}

function TextField({
  name, value, onChange, placeholder, type = 'text',
  multiline = false, rows = 3, icon: Icon = null,
}) {
  const [focus, setFocus] = useState(false);

  const baseStyle = {
    width: '100%',
    background: 'transparent',
    border: `1px solid ${focus ? GREEN.hex : T.line}`,
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

  // Con icono
  if (Icon && !multiline) {
    return (
      <div className="relative">
        <Icon
          size={14}
          strokeWidth={1.75}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: T.inkFaint,
            pointerEvents: 'none',
          }}
        />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ ...baseStyle, paddingLeft: '38px' }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      </div>
    );
  }

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

function TipoEventoCard({ tipo, isActive, onClick }) {
  const [hover, setHover] = useState(false);
  const Icon = tipo.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative text-center p-5 transition-all duration-300 flex flex-col items-center"
      style={{
        background: T.bg,
        border: `2px solid ${
          isActive ? tipo.colorHex : hover ? 'rgba(15,15,15,0.14)' : T.line
        }`,
        borderRadius: '8px',
        transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isActive
          ? `0 1px 2px rgba(15,15,15,0.04), 0 8px 24px ${tipo.colorHex}20`
          : 'none',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      <div
        className="flex items-center justify-center mb-3"
        style={{
          width: '48px',
          height: '48px',
          background: `${tipo.colorHex}10`,
          borderRadius: '10px',
        }}
      >
        <Icon size={22} strokeWidth={1.75} style={{ color: tipo.colorHex }} />
      </div>

      <p
        className="text-[13.5px] mb-2"
        style={{ color: T.ink, fontWeight: 500 }}
      >
        {tipo.nombre}
      </p>

      {isActive ? (
        <div
          className="inline-flex items-center gap-1"
          style={{ color: tipo.colorHex }}
        >
          <Check size={11} strokeWidth={2.5} />
          <span
            className="text-[9px] uppercase tracking-[0.15em]"
            style={{ fontWeight: 600 }}
          >
            Seleccionado
          </span>
        </div>
      ) : (
        <div
          className="text-[9px] uppercase tracking-[0.15em]"
          style={{ color: T.inkGhost, fontWeight: 500 }}
        >
          Elegir
        </div>
      )}
    </button>
  );
}

function EstiloChip({ label, active, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="px-3.5 h-9 text-[12px] uppercase tracking-[0.12em] transition-all"
      style={{
        background: active ? GREEN.hex : hover ? 'rgba(15,15,15,0.04)' : 'transparent',
        color: active ? '#FFFFFF' : T.inkMid,
        border: active ? `1px solid ${GREEN.hex}` : `1px solid ${T.line}`,
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

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function InvitacionesPage() {
  const router = useRouter();
  const { user, loading: authLoading, openLogin } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipo: '',
    estilo: '',
    nombreEvento: '',
    fecha: '',
    detalles: '',
  });
  const [precioMin, setPrecioMin] = useState(200);
  const [precioMax, setPrecioMax] = useState(500);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const navigateTo = (path) => router.push(path);

  const notifications = [
    {
      id: 1,
      title: '¡Servicio Oficial!',
      description: 'Invitaciones Digitales',
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
          if (configs[0].precioInvitacionMin) setPrecioMin(Number(configs[0].precioInvitacionMin));
          if (configs[0].precioInvitacionMax) setPrecioMax(Number(configs[0].precioInvitacionMax));
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

  const handleSelectTipo = (id) => {
    setFormData((prev) => ({ ...prev, tipo: id }));
    if (error) setError('');
  };

  const handleSelectEstilo = (id) => {
    setFormData((prev) => ({ ...prev, estilo: id }));
    if (error) setError('');
  };

  // ─── Solicitar · SIN CAMBIOS ─────────────────────────
  const handleSolicitar = async () => {
    if (!user) {
      openLogin();
      return;
    }

    if (
      !formData.tipo ||
      !formData.estilo ||
      !formData.nombre.trim() ||
      !formData.nombreEvento.trim() ||
      !formData.fecha
    ) {
      setError('Completa todos los campos obligatorios');
      return;
    }

    setEnviando(true);
    setError('');

    const tipoLabel = TIPOS.find((t) => t.id === formData.tipo)?.nombre || formData.tipo;
    const estiloLabel = ESTILOS.find((e) => e.id === formData.estilo)?.label || formData.estilo;
    const fechaFormateada = new Date(formData.fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    try {
      await pb.collection('solicitudes_invitaciones').create({
        userId: user.id,
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        tipo: formData.tipo,
        tipoLabel,
        estilo: formData.estilo,
        estiloLabel,
        nombreEvento: formData.nombreEvento.trim(),
        fechaEvento: formData.fecha,
        detalles: formData.detalles.trim(),
        estado: 'pendiente',
        activo: true,
      });

      const mensaje = encodeURIComponent(
        `Hola, quiero solicitar una invitación digital de MarketDesliz.\n\n` +
          `🎉 *Evento:* ${tipoLabel}\n` +
          `🎨 *Estilo:* ${estiloLabel}\n` +
          `👤 *Nombre:* ${formData.nombre}\n` +
          `🎊 *Nombre del evento:* ${formData.nombreEvento}\n` +
          `📅 *Fecha:* ${fechaFormateada}\n` +
          (formData.telefono ? `📞 *Teléfono:* ${formData.telefono}\n` : '') +
          (formData.email ? `✉️ *Email:* ${formData.email}\n` : '') +
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
      tipo: '',
      estilo: '',
      nombreEvento: '',
      fecha: '',
      detalles: '',
    });
  };

  const stats = [
    { valor: '24h', label: 'Tiempo de entrega', icon: Clock },
    { valor: '5', label: 'Tipos de evento', icon: Sparkles },
    { valor: '100%', label: 'Personalizadas', icon: Palette },
    {
      valor: `$${precioMin}-${precioMax}`,
      label: 'Rango de precio',
      icon: Star,
    },
  ];

  const tipoInfo = TIPOS.find((t) => t.id === formData.tipo);

  return (
    <>
      <Head>
        <title>Invitaciones Digitales | MarketDesliz</title>
        <meta
          name="description"
          content="Diseña invitaciones digitales personalizadas para bodas, XV años, cumpleaños y más. Hecho a tu medida."
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
                color: GREEN.hex,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Invitaciones Digitales · Servicio oficial
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Invitaciones digitales
              <br />
              <span className="font-serif italic" style={{ color: GREEN.hex }}>
                para momentos únicos.
              </span>
            </h1>

            <p
              className="text-[20px] md:text-[26px] leading-[1.35] tracking-[-0.015em] mt-5 md:mt-6 max-w-2xl font-serif italic"
              style={{ color: T.inkMid, fontWeight: 400 }}
            >
              Diseños a medida, listos para compartir.
            </p>

            <p
              className="text-[15px] md:text-[17px] leading-[1.55] mt-4 max-w-lg"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Bodas, XV años, cumpleaños y más. Elegantes, únicas y personalizadas.
              Desde{' '}
              <strong style={{ color: GREEN.hex, fontWeight: 500 }}>
                ${precioMin} MXN
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
                          background: GREEN.soft,
                          borderRadius: '6px',
                        }}
                      >
                        <Icon size={14} strokeWidth={1.75} style={{ color: GREEN.hex }} />
                      </div>
                      <p
                        className="text-[10px] uppercase tracking-[0.18em] truncate"
                        style={{ color: T.inkFaint, fontWeight: 500 }}
                      >
                        {stat.label}
                      </p>
                    </div>
                    <p
                      className="text-[24px] md:text-[28px] leading-none tabular-nums tracking-[-0.02em]"
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

          {/* ═══ 01 · TIPO DE EVENTO ════════════════════════ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-12">
            <SectionLabel>01 · ¿Qué evento vas a celebrar?</SectionLabel>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {TIPOS.map((t) => (
                <TipoEventoCard
                  key={t.id}
                  tipo={t}
                  isActive={formData.tipo === t.id}
                  onClick={() => handleSelectTipo(t.id)}
                />
              ))}
            </div>
          </section>

          {/* ═══ 02 · ESTILO ════════════════════════════════ */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-12">
            <SectionLabel>02 · Elige el estilo</SectionLabel>

            <div className="flex flex-wrap gap-2">
              {ESTILOS.map((e) => (
                <EstiloChip
                  key={e.id}
                  label={e.label}
                  active={formData.estilo === e.id}
                  onClick={() => handleSelectEstilo(e.id)}
                />
              ))}
            </div>
          </section>

          {/* ═══ 03 · FORMULARIO / ÉXITO ════════════════════ */}
          <section className="max-w-[900px] mx-auto px-6 md:px-14 pb-16">
            {!enviado ? (
              <>
                <SectionLabel>03 · Cuéntanos sobre tu evento</SectionLabel>

                {/* Aviso sin sesión */}
                {!authLoading && !user && (
                  <div
                    className="mb-6 flex items-start gap-2.5 px-4 py-3"
                    style={{
                      background: GREEN.soft,
                      border: `1px solid ${GREEN.softStrong}`,
                      borderRadius: '6px',
                    }}
                  >
                    <LogIn
                      size={14}
                      strokeWidth={1.75}
                      style={{ color: GREEN.hex, flexShrink: 0, marginTop: 2 }}
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
                          color: GREEN.hex,
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

                  {/* Nombre + Nombre del evento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Tu nombre</FieldLabel>
                      <TextField
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: María López"
                        icon={User}
                      />
                    </div>
                    <div>
                      <FieldLabel required>Nombre del evento</FieldLabel>
                      <TextField
                        name="nombreEvento"
                        value={formData.nombreEvento}
                        onChange={handleChange}
                        placeholder="Ej: XV Años de Sofía"
                        icon={Star}
                      />
                    </div>
                  </div>

                  {/* Teléfono + Fecha */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Teléfono</FieldLabel>
                      <TextField
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="55 1234 5678"
                        icon={MessageCircle}
                      />
                    </div>
                    <div>
                      <FieldLabel required>Fecha del evento</FieldLabel>
                      <TextField
                        name="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={handleChange}
                        icon={Calendar}
                      />
                    </div>
                  </div>

                  {/* Detalles */}
                  <div>
                    <FieldLabel>Detalles adicionales (opcional)</FieldLabel>
                    <TextField
                      name="detalles"
                      value={formData.detalles}
                      onChange={handleChange}
                      placeholder="Ej: Colores rosa y dorado, incluir código QR para confirmar asistencia..."
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

                  {/* Info precio */}
                  <div
                    className="flex items-start gap-2.5 px-4 py-3"
                    style={{
                      background: GREEN.soft,
                      border: `1px solid ${GREEN.softStrong}`,
                      borderRadius: '6px',
                    }}
                  >
                    <Info
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: GREEN.hex, flexShrink: 0, marginTop: 3 }}
                    />
                    <p
                      className="text-[12.5px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      <strong style={{ color: T.ink, fontWeight: 500 }}>
                        Precio según diseño.
                      </strong>{' '}
                      Te cotizamos según la complejidad. Rango habitual:{' '}
                      <strong style={{ color: GREEN.hex, fontWeight: 500 }}>
                        ${precioMin} - ${precioMax} MXN
                      </strong>
                      . El pago se realiza al confirmar el diseño.
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={handleSolicitar}
                    disabled={enviando || authLoading}
                    className="w-full flex items-center justify-center gap-2.5 h-12 text-white text-[13.5px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: GREEN.hex,
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
                        e.currentTarget.style.background = GREEN.hexDeep;
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = GREEN.hex)}
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
                        Solicitar mi invitación por WhatsApp
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
                      Tu información está protegida. Solo la usamos para tu diseño.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* ═══ ÉXITO ═══════════════════════════════════ */
              <>
                <SectionLabel>03 · Solicitud enviada</SectionLabel>

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
                    horas con una propuesta de diseño y cotización.
                  </p>

                  {/* Resumen */}
                  <div
                    className="max-w-md mx-auto p-5 text-left mb-8"
                    style={{
                      background: GREEN.soft,
                      border: `1px solid ${GREEN.softStrong}`,
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-[0.22em] mb-4"
                      style={{
                        color: GREEN.hex,
                        fontWeight: 500,
                        fontFeatureSettings: '"ss01"',
                      }}
                    >
                      Resumen de tu solicitud
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between text-[13px] gap-3">
                        <span style={{ color: T.inkSoft, fontWeight: 450 }}>Evento:</span>
                        <span
                          className="truncate"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {tipoInfo?.nombre || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] gap-3">
                        <span style={{ color: T.inkSoft, fontWeight: 450 }}>Estilo:</span>
                        <span
                          className="truncate"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {ESTILOS.find((e) => e.id === formData.estilo)?.label || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] gap-3">
                        <span style={{ color: T.inkSoft, fontWeight: 450 }}>Nombre:</span>
                        <span
                          className="truncate"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {formData.nombreEvento || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] gap-3">
                        <span style={{ color: T.inkSoft, fontWeight: 450 }}>Fecha:</span>
                        <span
                          className="truncate"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          {formData.fecha
                            ? new Date(formData.fecha).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '—'}
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
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      Nueva solicitud
                    </button>
                    <Link
                      href="/servicios"
                      className="inline-flex items-center gap-2 h-11 px-5 text-white text-[13px]"
                      style={{
                        background: GREEN.hex,
                        borderRadius: '6px',
                        fontWeight: 500,
                        WebkitTapHighlightColor: 'transparent',
                        transitionTimingFunction: T.ease,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = GREEN.hexDeep)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = GREEN.hex)}
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
                background: GREEN.soft,
                border: `1px solid ${GREEN.softStrong}`,
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
                    border: `1px solid ${GREEN.softStrong}`,
                    borderRadius: '8px',
                  }}
                >
                  <Wand2 size={20} strokeWidth={1.75} style={{ color: GREEN.hex }} />
                </div>
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-2"
                    style={{
                      color: GREEN.hex,
                      fontWeight: 500,
                      fontFeatureSettings: '"ss01"',
                    }}
                  >
                    ¿Tienes una idea?
                  </p>
                  <h3
                    className="text-[20px] md:text-[24px] leading-[1.15] tracking-[-0.02em] mb-1.5"
                    style={{ color: T.ink, fontWeight: 400 }}
                  >
                    Mándanos tu referencia y la hacemos realidad
                  </h3>
                  <p
                    className="text-[13px]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Diseño 100% personalizado. Te cotizamos en minutos.
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/522821414939?text=Hola,%20tengo%20una%20idea%20para%20mi%20invitaci%C3%B3n%20digital%20y%20quiero%20cotizarla"
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
        ::selection { background: rgba(22, 163, 74, 0.12); color: #0F0F0F; }
        * { -webkit-tap-highlight-color: transparent; font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1; }
      `}</style>
    </>
  );
}