// src/pages/servicios/registro.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  CheckCircle, Wrench, PartyPopper, Bell, MessageCircle,
  AlertCircle, MapPin, Zap, Store, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import {
  getEstados,
  getMunicipios,
  getLocalidades,
  getSectores,
} from '../../lib/serviciosService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes de formulario (idénticos a negocios/registro.js)
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
          step={type === 'number' ? 'any' : undefined}
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
        style={{ width: '16px', height: '16px', accentColor: T.accent, cursor: 'pointer' }}
      />
      <span className="text-[13.5px]" style={{ color: T.inkMid, fontWeight: 450 }}>
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

function FileInput({ onChange, multiple = false, accept = 'image/*' }) {
  return (
    <input
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={onChange}
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
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function RegistroServicioPage() {
  const router = useRouter();

  const { user, loading: authLoading, openLogin } = useAuth();

  const [step, setStep] = useState('datos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servicioData, setServicioData] = useState({
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
    precioBase: '',
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
    if (servicioData.estadoId) {
      getMunicipios(servicioData.estadoId).then(setMunicipiosList).catch(() => setMunicipiosList([]));
    } else {
      setMunicipiosList([]);
    }
  }, [servicioData.estadoId]);

  useEffect(() => {
    if (servicioData.municipioId) {
      getLocalidades(servicioData.municipioId).then(setLocalidadesList).catch(() => setLocalidadesList([]));
    } else {
      setLocalidadesList([]);
    }
  }, [servicioData.municipioId]);

  useEffect(() => {
    if (servicioData.localidadId) {
      getSectores(servicioData.localidadId).then(setSectoresList).catch(() => setSectoresList([]));
    } else {
      setSectoresList([]);
    }
  }, [servicioData.localidadId]);

  const categorias = [
    'Plomería', 'Electricidad', 'Albañilería', 'Pintura', 'Carpintería',
    'Herrería', 'Jardinería', 'Limpieza', 'Aire acondicionado',
    'Refrigeración', 'Cerrajería', 'Computación', 'Celulares',
    'Belleza', 'Fotografía', 'Música', 'Eventos', 'Pastelería',
    'Catering', 'Mudanzas', 'Mecánica', 'Veterinaria', 'Florería',
    'Otro',
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServicioData({ ...servicioData, [name]: type === 'checkbox' ? checked : value });
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

  const guardarServicio = async () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!servicioData.nombre || !servicioData.categoria || !servicioData.direccion) {
      setError('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();

      Object.keys(servicioData).forEach((key) => {
        if (key !== 'logo' && key !== 'imagenes') {
          const value = servicioData[key];
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
      formData.append('esMarketDesliz', false);
      formData.append('estadoActivacion', 'pendiente_activacion');
      formData.append('usuarioId', user.id);

      if (logoFile) formData.append('logo', logoFile);
      imagenesFiles.forEach((file) => formData.append('imagenes', file));

      const nuevoServicio = await pb.collection('servicios').create(formData);
      console.log('✅ Servicio creado:', nuevoServicio.id);

      setStep('completado');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al registrar el servicio. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const notifications = [
    { id: 1, title: '¡Nuevos servicios!', description: 'Descubre lo nuevo esta semana', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Loading ─────────────────────────────────────────────
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

  // ─── Sin sesión ──────────────────────────────────────────
  if (!user && step !== 'completado') {
    return (
      <>
        <Head><title>Registrar mi servicio | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/servicios" />
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
                Necesitas iniciar sesión para registrar tu servicio como proveedor.
              </p>

              <button
                onClick={openLogin}
                className="h-11 px-6 text-white text-[13.5px] inline-flex items-center gap-2"
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

  return (
    <>
      <Head>
        <title>Registrar mi servicio | MarketDesliz</title>
        <meta
          name="description"
          content="Registra tu servicio y llega a más clientes en tu comunidad."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/servicios" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">

          {/* ─── PASO 1: Datos ───────────────────────────── */}
          {step === 'datos' && (
            <section className="max-w-[720px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-24 w-full">
              {/* Header */}
              <div className="mb-12">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-6"
                  style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                >
                  Registro · Proveedor de servicios
                </p>

                <div className="flex items-start gap-4 flex-wrap">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(79, 46, 232, 0.06)',
                      borderRadius: '8px',
                    }}
                  >
                    <Wrench size={22} strokeWidth={1.75} style={{ color: T.accent }} />
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <h1
                      className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em]"
                      style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                    >
                      Registra
                      <span className="font-serif italic" style={{ color: T.inkMid }}>
                        {' '}tu servicio.
                      </span>
                    </h1>
                    {user && (
                      <p
                        className="text-[13px] mt-3"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        Registrando como{' '}
                        <strong style={{ color: T.inkMid }}>
                          {user.nombre || user.email}
                        </strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-10">
                {/* Información básica */}
                <FormSection title="Información básica">
                  <div>
                    <FieldLabel required>Nombre del servicio</FieldLabel>
                    <TextField
                      name="nombre"
                      value={servicioData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: Plomería Los Hermanos"
                      required
                    />
                  </div>

                  <div>
                    <FieldLabel required>Categoría</FieldLabel>
                    <SelectField
                      name="categoria"
                      value={servicioData.categoria}
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
                      value={servicioData.direccion}
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
                        value={servicioData.telefono}
                        onChange={handleInputChange}
                        placeholder="55 1234 5678"
                      />
                    </div>
                    <div>
                      <FieldLabel>WhatsApp</FieldLabel>
                      <TextField
                        name="whatsapp"
                        type="tel"
                        value={servicioData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="521234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Horario de atención</FieldLabel>
                    <TextField
                      name="horario"
                      value={servicioData.horario}
                      onChange={handleInputChange}
                      placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm"
                    />
                  </div>

                  <div>
                    <FieldLabel>Descripción</FieldLabel>
                    <TextField
                      name="descripcion"
                      value={servicioData.descripcion}
                      onChange={handleInputChange}
                      placeholder="Describe tu servicio y experiencia…"
                      multiline
                      rows={3}
                    />
                  </div>

                  <div>
                    <FieldLabel>Precio base (opcional)</FieldLabel>
                    <TextField
                      name="precioBase"
                      type="number"
                      value={servicioData.precioBase}
                      onChange={handleInputChange}
                      placeholder="Ej: 200"
                      hint="Precio de referencia. Puede variar según el trabajo."
                    />
                  </div>
                </FormSection>

                {/* Ubicación */}
                <FormSection title="Ubicación geográfica (opcional)">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Estado</FieldLabel>
                      <SelectField name="estadoId" value={servicioData.estadoId} onChange={handleInputChange}>
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
                        value={servicioData.municipioId}
                        onChange={handleInputChange}
                        disabled={!servicioData.estadoId}
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
                        value={servicioData.localidadId}
                        onChange={handleInputChange}
                        disabled={!servicioData.municipioId}
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
                        value={servicioData.sectorId}
                        onChange={handleInputChange}
                        disabled={!servicioData.localidadId}
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
                        value={servicioData.codigoPostal}
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
                        value={servicioData.latitud}
                        onChange={handleInputChange}
                        placeholder="19.4326"
                      />
                    </div>
                    <div>
                      <FieldLabel>Longitud</FieldLabel>
                      <TextField
                        name="longitud"
                        type="number"
                        value={servicioData.longitud}
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
                      value={servicioData.email}
                      onChange={handleInputChange}
                      placeholder="correo@servicio.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Sitio web</FieldLabel>
                      <TextField
                        name="sitioWeb"
                        type="url"
                        value={servicioData.sitioWeb}
                        onChange={handleInputChange}
                        placeholder="https://misitio.com"
                      />
                    </div>
                    <div>
                      <FieldLabel>Facebook</FieldLabel>
                      <TextField
                        name="facebook"
                        value={servicioData.facebook}
                        onChange={handleInputChange}
                        placeholder="URL de Facebook"
                      />
                    </div>
                    <div>
                      <FieldLabel>Instagram</FieldLabel>
                      <TextField
                        name="instagram"
                        value={servicioData.instagram}
                        onChange={handleInputChange}
                        placeholder="URL de Instagram"
                      />
                    </div>
                    <div>
                      <FieldLabel>TikTok</FieldLabel>
                      <TextField
                        name="tiktok"
                        value={servicioData.tiktok}
                        onChange={handleInputChange}
                        placeholder="URL de TikTok"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Servicios adicionales */}
                <FormSection title="Servicios adicionales">
                  <div className="flex flex-wrap gap-5">
                    <CheckboxField
                      name="atencionWhatsapp"
                      checked={servicioData.atencionWhatsapp}
                      onChange={handleInputChange}
                      label="Atención por WhatsApp"
                    />
                    <CheckboxField
                      name="citasPrevias"
                      checked={servicioData.citasPrevias}
                      onChange={handleInputChange}
                      label="Requiere cita previa"
                    />
                    <CheckboxField
                      name="domicilio"
                      checked={servicioData.domicilio}
                      onChange={handleInputChange}
                      label="Servicio a domicilio"
                    />
                  </div>

                  <div>
                    <FieldLabel>Otros servicios</FieldLabel>
                    <TextField
                      name="servicios"
                      value={servicioData.servicios}
                      onChange={handleInputChange}
                      placeholder="Instalaciones, reparaciones, mantenimiento"
                      hint="Separa múltiples servicios por coma."
                    />
                  </div>
                </FormSection>

                {/* Imágenes */}
                <FormSection title="Imágenes">
                  <div>
                    <FieldLabel required>Logo / Foto principal</FieldLabel>
                    <FileInput onChange={handleLogoChange} />
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
                    <p className="text-[11.5px] mt-2" style={{ color: T.inkFaint, fontWeight: 450 }}>
                      Recomendado: 500×500px, formato JPG o PNG.
                    </p>
                  </div>

                  <div>
                    <FieldLabel>Fotos de tus trabajos</FieldLabel>
                    <FileInput onChange={handleImagenesChange} multiple />
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
                    <p className="text-[11.5px] mt-2" style={{ color: T.inkFaint, fontWeight: 450 }}>
                      Puedes subir varias fotos de tu trabajo.
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
                      className="text-[12.5px] leading-relaxed flex-1"
                      style={{ color: T.red, fontWeight: 450 }}
                    >
                      {error}
                    </p>
                  </div>
                )}

                {/* Acciones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Link
                    href="/servicios"
                    className="flex items-center justify-center h-11 text-[13.5px] transition-colors"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Cancelar
                  </Link>
                  <div className="md:col-span-2">
                    <PrimaryButton onClick={guardarServicio} loading={saving} disabled={saving}>
                      {saving ? 'Registrando…' : 'Registrar servicio'}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── PASO 2: Completado ───────────────────────── */}
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
                  Registro completado
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
                  Tu servicio ya está registrado en MarketDesliz.
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
                  <Wrench
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: T.accent, flexShrink: 0, marginTop: 3 }}
                  />
                  <div>
                    <p
                      className="text-[13px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      Tu servicio aparecerá en la categoría
                    </p>
                    <p
                      className="text-[15px] mt-1"
                      style={{ color: T.accent, fontWeight: 500 }}
                    >
                      {servicioData.categoria}
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
                      Tu servicio aparecerá en la lista <strong>después de ser aprobado</strong>.
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
                      Recibirás notificaciones cuando los clientes interactúen con tu servicio.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/servicios"
                  className="flex items-center justify-center gap-2.5 h-11 text-white text-[13.5px]"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    WebkitTapHighlightColor: 'transparent',
                    transitionTimingFunction: T.ease,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                >
                  <Store size={15} strokeWidth={1.75} />
                  Ver servicios
                </Link>

                <a
                  href={`https://wa.me/522821414939?text=Hola,%20ya%20registr%C3%A9%20mi%20servicio%20${encodeURIComponent(servicioData.nombre)}`}
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