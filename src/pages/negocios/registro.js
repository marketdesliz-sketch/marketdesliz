// src/pages/negocios/registro.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Key, CheckCircle, Store, PartyPopper, Bell, MessageCircle,
  AlertCircle, MapPin, Zap,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import {
  getEstados,
  getMunicipios,
  getLocalidades,
  getSectores,
} from '../../lib/negociosService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes de formulario
// ─────────────────────────────────────────────────────────────────────────
function FieldLabel({ children, required = false }) {
  return (
    <label
      className="block text-[10px] uppercase tracking-[0.22em] mb-2"
      style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
    >
      {children}
      {required && <span style={{ color: T.accent, marginLeft: 4 }}>*</span>}
    </label>
  );
}

function TextField({
  name, value, onChange, placeholder, type = 'text', required = false,
  autoFocus = false, multiline = false, rows = 3, hint = null,
}) {
  const [focus, setFocus] = useState(false);

  const baseStyle = {
    width: '100%',
    background: 'transparent',
    border: `1px solid ${focus ? T.accent : T.line}`,
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

  return (
    <div>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
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
          required={required}
          autoFocus={autoFocus}
          style={baseStyle}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      )}
      {hint && (
        <p className="text-[11px] mt-1.5" style={{ color: T.inkFaint, fontWeight: 450 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SelectField({ name, value, onChange, children, disabled = false }) {
  const [focus, setFocus] = useState(false);

  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full appearance-none outline-none disabled:opacity-40"
      style={{
        height: '42px',
        padding: '0 14px',
        background: 'transparent',
        border: `1px solid ${focus ? T.accent : T.line}`,
        borderRadius: '6px',
        color: value ? T.ink : T.inkFaint,
        fontSize: '14px',
        fontWeight: 450,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `border-color 0.2s ${T.ease}`,
      }}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
    >
      {children}
    </select>
  );
}

function FormSection({ title, children }) {
  return (
    <div>
      <div
        className="flex items-center gap-3 mb-5 pb-3"
        style={{ borderBottom: `1px solid ${T.line}` }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
        >
          {title}
        </span>
        <div className="flex-1" />
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function CheckboxField({ name, checked, onChange, label }) {
  return (
    <label
      className="flex items-center gap-3 cursor-pointer"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        style={{
          width: '16px',
          height: '16px',
          accentColor: T.accent,
          cursor: 'pointer',
        }}
      />
      <span
        className="text-[13.5px]"
        style={{ color: T.inkMid, fontWeight: 450 }}
      >
        {label}
      </span>
    </label>
  );
}

function PrimaryButton({ children, onClick, disabled, type = 'button', loading = false }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center justify-center gap-2.5 text-white transition-all duration-200 disabled:cursor-not-allowed"
      style={{
        height: '44px',
        background: hover && !disabled ? T.accentDeep : T.accent,
        borderRadius: '6px',
        fontSize: '13.5px',
        fontWeight: 500,
        letterSpacing: '0.01em',
        opacity: disabled ? 0.4 : 1,
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading && (
        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, disabled }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center justify-center gap-2 text-[13.5px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        height: '44px',
        background: hover ? 'rgba(15,15,15,0.05)' : 'transparent',
        border: `1px solid ${T.line}`,
        borderRadius: '6px',
        color: T.inkMid,
        fontWeight: 500,
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function RegistroNegocioPage() {
  const router = useRouter();

  const { user, loading: authLoading, openLogin } = useAuth();

  const [step, setStep] = useState('codigo');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codigoValido, setCodigoValido] = useState(null);
  const [negocioData, setNegocioData] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    ubicacion: '',
    estadoId: '',
    municipioId: '',
    localidadId: '',
    sectorId: '',
    codigoPostal: '',
    latitud: '',
    longitud: '',
    email: '',
    sitioWeb: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    servicios: '',
    atencionWhatsapp: true,
    citasPrevias: false,
    domicilio: false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  const [estadosList, setEstadosList] = useState([]);
  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);
  const [sectoresList, setSectoresList] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user && step !== 'completado') {
      openLogin();
    }
  }, [authLoading, user, step, openLogin]);

  useEffect(() => {
    getEstados().then(setEstadosList).catch(() => {});
  }, []);

  useEffect(() => {
    if (negocioData.estadoId) {
      getMunicipios(negocioData.estadoId).then(setMunicipiosList).catch(() => setMunicipiosList([]));
    } else {
      setMunicipiosList([]);
    }
  }, [negocioData.estadoId]);

  useEffect(() => {
    if (negocioData.municipioId) {
      getLocalidades(negocioData.municipioId).then(setLocalidadesList).catch(() => setLocalidadesList([]));
    } else {
      setLocalidadesList([]);
    }
  }, [negocioData.municipioId]);

  useEffect(() => {
    if (negocioData.localidadId) {
      getSectores(negocioData.localidadId).then(setSectoresList).catch(() => setSectoresList([]));
    } else {
      setSectoresList([]);
    }
  }, [negocioData.localidadId]);

  const categorias = [
    'Abarrotes', 'Accesorios (bisutería, celulares, etc.)', 'Agencia de viajes',
    'Antojitos / comida corrida', 'Barbería', 'Boutique (ropa)', 'Cafetería',
    'Carnicería', 'Cerrajería', 'Ciber (internet)', 'Consultorio médico',
    'Dulcería', 'Estética / salón de belleza', 'Farmacia', 'Ferretería',
    'Florería', 'Frutería / verdulería', 'Heladería / paletería', 'Imprenta',
    'Joyería', 'Lavandería / tintorería', 'Lonchería', 'Papelería',
    'Panadería', 'Pastelería', 'Peluquería', 'Pescadería', 'Pollería',
    'Refaccionaria (auto partes)', 'Restaurante', 'Taquería', 'Taller mecánico',
    'Taller de costura', 'Tienda de ropa', 'Tienda de electrónicos',
    'Tortillería', 'Veterinaria', 'Zapatería',
  ];

  const verificarCodigo = async () => {
    if (!codigo.trim()) {
      setError('Ingresa el código de invitación');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const invitacion = await pb.collection('invitaciones_negocios').getFirstListItem(
        `codigo = "${codigo.toUpperCase()}" && usado = false`
      );

      setCodigoValido(invitacion);
      setStep('datos');
    } catch (err) {
      console.error('Error:', err);
      setError('Código de invitación inválido o ya fue utilizado');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNegocioData({ ...negocioData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImagenesChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImagenesFiles(files);

      const previews = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result);
          if (previews.length === files.length) setImagenesPreviews(previews);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const guardarNegocio = async () => {
    if (!negocioData.nombre || !negocioData.categoria || !negocioData.direccion) {
      setError('Completa los campos obligatorios');
      return;
    }

    if (!user) {
      openLogin();
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();

      Object.keys(negocioData).forEach((key) => {
        if (key !== 'logo' && key !== 'imagenes') {
          const value = negocioData[key];
          if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else if (value !== null && value !== undefined && value !== '') {
            formData.append(key, value);
          }
        }
      });

      formData.append('activo', true);
      formData.append('orden', 0);
      formData.append('visitas', 0);
      formData.append('estadoActivacion', 'pendiente_activacion');
      formData.append('usuarioId', user.id);

      if (logoFile) formData.append('logo', logoFile);

      imagenesFiles.forEach((file) => formData.append('imagenes', file));

      const nuevoNegocio = await pb.collection('negocios').create(formData);
      console.log('✅ Negocio creado:', nuevoNegocio.id);

      await pb.collection('invitaciones_negocios').update(codigoValido.id, {
        usado: true,
        negocioId: nuevoNegocio.id,
        negocioNombre: negocioData.nombre,
        usuarioId: user.id,
        fechaRegistro: new Date().toISOString(),
      });

      setStep('completado');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al registrar el negocio. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
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
                Verificando sesión
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Sin sesión ────────────────────────────────────────────
  if (!user && step !== 'completado') {
    return (
      <>
        <Head><title>Registrar mi negocio | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/negocios" />
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
                <Key size={28} strokeWidth={1.5} style={{ color: T.accent }} />
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
                Necesitas una cuenta en MarketDesliz para registrar tu negocio como aliado.
              </p>

              <PrimaryButton onClick={openLogin}>
                Iniciar sesión
              </PrimaryButton>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Registrar mi negocio | MarketDesliz</title>
        <meta
          name="description"
          content="Registra tu negocio como aliado de MarketDesliz y llega a más clientes en tu comunidad."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/negocios" />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1">
          {/* ─── PASO 1: Código ───────────────────────────── */}
          {step === 'codigo' && (
            <section className="max-w-[560px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-20 w-full">
              <div className="text-center mb-10">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-6"
                  style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                >
                  Paso 01 · Verificación
                </p>

                <h1
                  className="text-[36px] md:text-[48px] leading-[1.02] tracking-[-0.035em] mb-4"
                  style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                >
                  Registra
                  <br />
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    tu negocio.
                  </span>
                </h1>

                <p
                  className="text-[15px] leading-[1.6] max-w-md mx-auto"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Ingresa el código de invitación que te proporcionó MarketDesliz.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <FieldLabel required>Código de invitación</FieldLabel>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="MD-ABC123"
                    autoFocus
                    className="w-full text-center uppercase tracking-[0.15em]"
                    style={{
                      height: '52px',
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.ink,
                      fontSize: '18px',
                      fontWeight: 500,
                      letterSpacing: '0.15em',
                      outline: 'none',
                      transition: `border-color 0.2s ${T.ease}`,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                  />
                  <p
                    className="text-[11.5px] leading-[1.5] mt-2.5 text-center"
                    style={{ color: T.inkFaint, fontWeight: 450 }}
                  >
                    El código fue enviado cuando aceptaste colocar la lona de MarketDesliz.
                  </p>
                </div>

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
                      className="text-[12.5px] leading-relaxed"
                      style={{ color: T.red, fontWeight: 450 }}
                    >
                      {error}
                    </p>
                  </div>
                )}

                <PrimaryButton onClick={verificarCodigo} loading={loading} disabled={loading}>
                  {loading ? 'Verificando…' : 'Validar código'}
                </PrimaryButton>

                <div
                  className="text-center mt-4 pt-6"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <p
                    className="text-[12.5px] mb-2"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    ¿No tienes código?
                  </p>
                  <a
                    href="https://wa.me/522821414939?text=Hola,%20quiero%20ser%20negocio%20aliado%20de%20MarketDesliz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12.5px]"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    Contáctanos para ser aliado →
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* ─── PASO 2: Datos ────────────────────────────── */}
          {step === 'datos' && (
            <section className="max-w-[720px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-24 w-full">
              {/* Header */}
              <div className="mb-12">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-6"
                  style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                >
                  Paso 02 · Perfil
                </p>

                <div className="flex items-start gap-4 flex-wrap">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(26, 127, 75, 0.08)',
                      borderRadius: '8px',
                    }}
                  >
                    <CheckCircle size={22} strokeWidth={1.75} style={{ color: T.green }} />
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <h1
                      className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em]"
                      style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                    >
                      Completa
                      <span className="font-serif italic" style={{ color: T.inkMid }}>
                        {' '}tu perfil.
                      </span>
                    </h1>
                    {user && (
                      <p
                        className="text-[13px] mt-3"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        Registrando como <strong style={{ color: T.inkMid }}>{user.nombre || user.email}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-10">
                {/* Información básica */}
                <FormSection title="Información básica">
                  <div>
                    <FieldLabel required>Nombre del negocio</FieldLabel>
                    <TextField
                      name="nombre"
                      value={negocioData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: Ferretería El Martillo"
                      required
                    />
                  </div>

                  <div>
                    <FieldLabel required>Categoría</FieldLabel>
                    <SelectField
                      name="categoria"
                      value={negocioData.categoria}
                      onChange={handleInputChange}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categorias.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </SelectField>
                  </div>

                  <div>
                    <FieldLabel required>Dirección</FieldLabel>
                    <TextField
                      name="direccion"
                      value={negocioData.direccion}
                      onChange={handleInputChange}
                      placeholder="Calle, número, colonia, ciudad"
                      required
                      hint="Esta dirección aparecerá en Google Maps."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Teléfono</FieldLabel>
                      <TextField
                        name="telefono"
                        type="tel"
                        value={negocioData.telefono}
                        onChange={handleInputChange}
                        placeholder="55 1234 5678"
                      />
                    </div>
                    <div>
                      <FieldLabel>WhatsApp</FieldLabel>
                      <TextField
                        name="whatsapp"
                        type="tel"
                        value={negocioData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="521234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Horario de atención</FieldLabel>
                    <TextField
                      name="horario"
                      value={negocioData.horario}
                      onChange={handleInputChange}
                      placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm"
                    />
                  </div>

                  <div>
                    <FieldLabel>Descripción</FieldLabel>
                    <TextField
                      name="descripcion"
                      value={negocioData.descripcion}
                      onChange={handleInputChange}
                      placeholder="Breve descripción de tu negocio…"
                      multiline
                      rows={3}
                    />
                  </div>
                </FormSection>

                {/* Ubicación */}
                <FormSection title="Ubicación geográfica (opcional)">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Estado</FieldLabel>
                      <SelectField name="estadoId" value={negocioData.estadoId} onChange={handleInputChange}>
                        <option value="">Seleccionar estado</option>
                        {estadosList.map((est) => (
                          <option key={est.id} value={est.id}>{est.nombre}</option>
                        ))}
                      </SelectField>
                    </div>
                    <div>
                      <FieldLabel>Municipio</FieldLabel>
                      <SelectField
                        name="municipioId"
                        value={negocioData.municipioId}
                        onChange={handleInputChange}
                        disabled={!negocioData.estadoId}
                      >
                        <option value="">Seleccionar municipio</option>
                        {municipiosList.map((mun) => (
                          <option key={mun.id} value={mun.id}>{mun.nombre}</option>
                        ))}
                      </SelectField>
                    </div>
                    <div>
                      <FieldLabel>Localidad</FieldLabel>
                      <SelectField
                        name="localidadId"
                        value={negocioData.localidadId}
                        onChange={handleInputChange}
                        disabled={!negocioData.municipioId}
                      >
                        <option value="">Seleccionar localidad</option>
                        {localidadesList.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.nombre}</option>
                        ))}
                      </SelectField>
                    </div>
                    <div>
                      <FieldLabel>Sector / Colonia</FieldLabel>
                      <SelectField
                        name="sectorId"
                        value={negocioData.sectorId}
                        onChange={handleInputChange}
                        disabled={!negocioData.localidadId}
                      >
                        <option value="">Seleccionar sector</option>
                        {sectoresList.map((sec) => (
                          <option key={sec.id} value={sec.id}>{sec.nombre}</option>
                        ))}
                      </SelectField>
                    </div>
                    <div>
                      <FieldLabel>Código Postal</FieldLabel>
                      <TextField
                        name="codigoPostal"
                        value={negocioData.codigoPostal}
                        onChange={handleInputChange}
                        placeholder="91000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Latitud</FieldLabel>
                      <TextField
                        name="latitud"
                        type="number"
                        value={negocioData.latitud}
                        onChange={handleInputChange}
                        placeholder="19.4326"
                      />
                    </div>
                    <div>
                      <FieldLabel>Longitud</FieldLabel>
                      <TextField
                        name="longitud"
                        type="number"
                        value={negocioData.longitud}
                        onChange={handleInputChange}
                        placeholder="-99.1332"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Presencia en línea */}
                <FormSection title="Presencia en línea">
                  <div>
                    <FieldLabel>Correo electrónico</FieldLabel>
                    <TextField
                      name="email"
                      type="email"
                      value={negocioData.email}
                      onChange={handleInputChange}
                      placeholder="correo@negocio.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Sitio web</FieldLabel>
                      <TextField
                        name="sitioWeb"
                        type="url"
                        value={negocioData.sitioWeb}
                        onChange={handleInputChange}
                        placeholder="https://www.minegocio.com"
                      />
                    </div>
                    <div>
                      <FieldLabel>Facebook</FieldLabel>
                      <TextField
                        name="facebook"
                        value={negocioData.facebook}
                        onChange={handleInputChange}
                        placeholder="URL de Facebook"
                      />
                    </div>
                    <div>
                      <FieldLabel>Instagram</FieldLabel>
                      <TextField
                        name="instagram"
                        value={negocioData.instagram}
                        onChange={handleInputChange}
                        placeholder="URL de Instagram"
                      />
                    </div>
                    <div>
                      <FieldLabel>TikTok</FieldLabel>
                      <TextField
                        name="tiktok"
                        value={negocioData.tiktok}
                        onChange={handleInputChange}
                        placeholder="URL de TikTok"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Servicios */}
                <FormSection title="Servicios">
                  <div className="flex flex-wrap gap-5">
                    <CheckboxField
                      name="atencionWhatsapp"
                      checked={negocioData.atencionWhatsapp}
                      onChange={handleInputChange}
                      label="Atención por WhatsApp"
                    />
                    <CheckboxField
                      name="citasPrevias"
                      checked={negocioData.citasPrevias}
                      onChange={handleInputChange}
                      label="Requiere cita previa"
                    />
                    <CheckboxField
                      name="domicilio"
                      checked={negocioData.domicilio}
                      onChange={handleInputChange}
                      label="Servicio a domicilio"
                    />
                  </div>

                  <div>
                    <FieldLabel>Otros servicios</FieldLabel>
                    <TextField
                      name="servicios"
                      value={negocioData.servicios}
                      onChange={handleInputChange}
                      placeholder="Estacionamiento, Wi-Fi, Pagos con tarjeta"
                      hint="Separa múltiples servicios por coma."
                    />
                  </div>
                </FormSection>

                {/* Logo e imágenes */}
                <FormSection title="Logo e imágenes">
                  <div>
                    <FieldLabel required>Logo / Foto principal</FieldLabel>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      required
                      className="w-full outline-none"
                      style={{
                        padding: '10px 14px',
                        background: 'transparent',
                        border: `1px solid ${T.line}`,
                        borderRadius: '6px',
                        color: T.inkMid,
                        fontSize: '13px',
                        fontWeight: 450,
                        cursor: 'pointer',
                      }}
                    />
                    {logoPreview && (
                      <div className="mt-3">
                        <img
                          src={logoPreview}
                          alt="Logo"
                          style={{
                            width: '88px',
                            height: '88px',
                            objectFit: 'cover',
                            border: `1px solid ${T.line}`,
                            borderRadius: '8px',
                          }}
                        />
                      </div>
                    )}
                    <p
                      className="text-[11.5px] mt-2"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Recomendado: 500×500px, formato JPG o PNG.
                    </p>
                  </div>

                  <div>
                    <FieldLabel>Fotos de tu local</FieldLabel>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagenesChange}
                      className="w-full outline-none"
                      style={{
                        padding: '10px 14px',
                        background: 'transparent',
                        border: `1px solid ${T.line}`,
                        borderRadius: '6px',
                        color: T.inkMid,
                        fontSize: '13px',
                        fontWeight: 450,
                        cursor: 'pointer',
                      }}
                    />
                    {imagenesPreviews.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {imagenesPreviews.map((preview, idx) => (
                          <img
                            key={idx}
                            src={preview}
                            alt={`Foto ${idx + 1}`}
                            style={{
                              width: '64px',
                              height: '64px',
                              objectFit: 'cover',
                              border: `1px solid ${T.line}`,
                              borderRadius: '6px',
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <p
                      className="text-[11.5px] mt-2"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Puedes subir varias fotos de tu negocio.
                    </p>
                  </div>
                </FormSection>

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
                      className="text-[12.5px] leading-relaxed"
                      style={{ color: T.red, fontWeight: 450 }}
                    >
                      {error}
                    </p>
                  </div>
                )}

                {/* Acciones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <SecondaryButton onClick={() => setStep('codigo')}>
                    Atrás
                  </SecondaryButton>
                  <div className="md:col-span-2">
                    <PrimaryButton onClick={guardarNegocio} loading={saving} disabled={saving}>
                      {saving ? 'Registrando…' : 'Registrar negocio'}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── PASO 3: Completado ───────────────────────── */}
          {step === 'completado' && (
            <section className="max-w-[640px] mx-auto px-6 md:px-14 pt-20 md:pt-28 pb-24 w-full">
              <div className="text-center mb-12">
                <div
                  className="inline-flex items-center justify-center mb-8"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: 'rgba(26, 127, 75, 0.08)',
                    borderRadius: '14px',
                  }}
                >
                  <PartyPopper size={32} strokeWidth={1.5} style={{ color: T.green }} />
                </div>

                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-5"
                  style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                >
                  Paso 03 · Completado
                </p>

                <h1
                  className="text-[36px] md:text-[52px] leading-[1.02] tracking-[-0.035em] mb-4"
                  style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                >
                  Registro
                  <br />
                  <span className="font-serif italic" style={{ color: T.green }}>
                    completado.
                  </span>
                </h1>

                <p
                  className="text-[15px] md:text-[16px] leading-[1.6] max-w-md mx-auto"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Tu negocio ya está registrado en MarketDesliz. Aparecerás en la lista de negocios aliados.
                </p>
              </div>

              {/* Card informativa */}
              <div
                className="p-6 md:p-8 mb-8"
                style={{
                  background: 'rgba(79, 46, 232, 0.03)',
                  border: '1px solid rgba(79, 46, 232, 0.12)',
                  borderRadius: '8px',
                }}
              >
                <div className="flex items-start gap-3 mb-5">
                  <MapPin
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: T.accent, flexShrink: 0, marginTop: 3 }}
                  />
                  <div>
                    <p
                      className="text-[13px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      Tu negocio aparecerá en la categoría
                    </p>
                    <p
                      className="text-[15px] mt-1"
                      style={{ color: T.accent, fontWeight: 500 }}
                    >
                      {negocioData.categoria}
                    </p>
                    <p
                      className="text-[12px] mt-2"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Los clientes podrán encontrarte y contactarte directamente.
                    </p>
                  </div>
                </div>

                <div
                  className="pt-5 mt-5 flex flex-col gap-4"
                  style={{ borderTop: `1px solid rgba(79, 46, 232, 0.12)` }}
                >
                  <div className="flex items-start gap-3">
                    <Zap
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: T.accent, flexShrink: 0, marginTop: 3 }}
                    />
                    <p
                      className="text-[12.5px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      Tu negocio aparecerá en la lista <strong>después de tu primera compra</strong> en MarketDesliz.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Bell
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: T.accent, flexShrink: 0, marginTop: 3 }}
                    />
                    <p
                      className="text-[12.5px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      Recibirás notificaciones cuando los clientes interactúen con tu negocio.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/negocios"
                  className="flex items-center justify-center gap-2.5 h-11 text-white text-[13.5px]"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    WebkitTapHighlightColor: 'transparent',
                    transition: `background 0.2s ${T.ease}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                >
                  <Store size={15} strokeWidth={1.75} />
                  Ver negocios aliados
                </Link>

                <Link
                  href="/negocios/notificaciones"
                  className="flex items-center justify-center gap-2.5 h-11 text-[13.5px]"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontWeight: 500,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Bell size={15} strokeWidth={1.75} />
                  Configurar notificaciones
                </Link>

                <a
                  href={`https://wa.me/522821414939?text=Hola,%20ya%20registr%C3%A9%20mi%20negocio%20${encodeURIComponent(negocioData.nombre)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 h-11 text-white text-[13.5px]"
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
                  <MessageCircle size={15} strokeWidth={1.75} />
                  Contactar a MarketDesliz
                </a>
              </div>
            </section>
          )}
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