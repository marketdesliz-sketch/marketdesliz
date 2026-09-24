// src/pages/negocios/editar.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Store, CheckCircle, AlertCircle, X,
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
// Sub-componentes de formulario (idénticos a registro.js)
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

// ─────────────────────────────────────────────────────────────────────────
// File input reutilizable
// ─────────────────────────────────────────────────────────────────────────
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
export default function EditarNegocioPage() {
  const router = useRouter();
  const { id } = router.query;

  const { user, loading: authLoading, openLogin } = useAuth();

  const [negocio, setNegocio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
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
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesAEliminar, setImagenesAEliminar] = useState([]);

  const [estadosList, setEstadosList] = useState([]);
  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);
  const [sectoresList, setSectoresList] = useState([]);

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

  // Carga inicial con id
  useEffect(() => {
    if (authLoading || !id) return;
    cargarNegocio();
    cargarDatosGeograficos();
  }, [id, authLoading]);

  // Sin id → verificar negocio del usuario
  useEffect(() => {
    if (authLoading || id) return;

    if (!user) {
      openLogin();
      return;
    }

    verificarNegocioUsuario();
  }, [authLoading, id, user]);

  const cargarDatosGeograficos = async () => {
    try {
      const estados = await getEstados();
      setEstadosList(estados);
    } catch (err) {
      console.error('Error cargando datos geográficos:', err);
    }
  };

  // Cargas dinámicas de la cascada geográfica
  useEffect(() => {
    if (formData.estadoId) {
      getMunicipios(formData.estadoId).then(setMunicipiosList).catch(() => setMunicipiosList([]));
    } else {
      setMunicipiosList([]);
    }
  }, [formData.estadoId]);

  useEffect(() => {
    if (formData.municipioId) {
      getLocalidades(formData.municipioId).then(setLocalidadesList).catch(() => setLocalidadesList([]));
    } else {
      setLocalidadesList([]);
    }
  }, [formData.municipioId]);

  useEffect(() => {
    if (formData.localidadId) {
      getSectores(formData.localidadId).then(setSectoresList).catch(() => setSectoresList([]));
    } else {
      setSectoresList([]);
    }
  }, [formData.localidadId]);

  const verificarNegocioUsuario = async () => {
    try {
      const negocios = await pb.collection('negocios').getFullList({
        filter: `usuarioId = "${user.id}"`,
      });

      if (negocios.length > 0) {
        router.push(`/negocios/editar?id=${negocios[0].id}`);
      } else {
        setError('No tienes un negocio registrado. Contacta a MarketDesliz para obtener tu código de invitación.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al verificar tu negocio');
      setLoading(false);
    }
  };

  const cargarNegocio = async () => {
    try {
      setLoading(true);
      const negocioData = await pb.collection('negocios').getOne(id);
      setNegocio(negocioData);

      setFormData({
        nombre: negocioData.nombre || '',
        categoria: negocioData.categoria || '',
        descripcion: negocioData.descripcion || '',
        direccion: negocioData.direccion || '',
        telefono: negocioData.telefono || '',
        whatsapp: negocioData.whatsapp || '',
        horario: negocioData.horario || '',
        ubicacion: negocioData.ubicacion || '',
        estadoId: negocioData.estadoId || '',
        municipioId: negocioData.municipioId || '',
        localidadId: negocioData.localidadId || '',
        sectorId: negocioData.sectorId || '',
        codigoPostal: negocioData.codigoPostal || '',
        latitud: negocioData.latitud || '',
        longitud: negocioData.longitud || '',
        email: negocioData.email || '',
        sitioWeb: negocioData.sitioWeb || '',
        facebook: negocioData.facebook || '',
        instagram: negocioData.instagram || '',
        tiktok: negocioData.tiktok || '',
        servicios: negocioData.servicios || '',
        atencionWhatsapp: negocioData.atencionWhatsapp !== false,
        citasPrevias: negocioData.citasPrevias === true,
        domicilio: negocioData.domicilio === true,
      });

      if (negocioData.logo) {
        setLogoPreview(pb.files.getURL(negocioData, negocioData.logo));
      }

      if (negocioData.imagenes) {
        const imagenes = Array.isArray(negocioData.imagenes)
          ? negocioData.imagenes
          : [negocioData.imagenes];
        setImagenesExistentes(imagenes.filter((img) => img));
      }
    } catch (error) {
      console.error('Error cargando negocio:', error);
      setError('Error al cargar la información del negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
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

  const eliminarImagenExistente = (imagen) => {
    setImagenesAEliminar([...imagenesAEliminar, imagen]);
    setImagenesExistentes(imagenesExistentes.filter((img) => img !== imagen));
  };

  const guardarCambios = async () => {
    if (!formData.nombre || !formData.categoria || !formData.direccion) {
      setError('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key !== 'logo' && key !== 'imagenes') {
          const value = formData[key];
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value ? 'true' : 'false');
          } else if (value !== null && value !== undefined && value !== '') {
            formDataToSend.append(key, value);
          }
        }
      });

      if (logoFile) formDataToSend.append('logo', logoFile);

      imagenesFiles.forEach((file) => formDataToSend.append('imagenes', file));

      if (imagenesAEliminar.length > 0) {
        formDataToSend.append('imagenesEliminar', JSON.stringify(imagenesAEliminar));
      }

      await pb.collection('negocios').update(id, formDataToSend);
      setSuccess('Perfil actualizado correctamente');

      setTimeout(() => {
        cargarNegocio();
        setImagenesFiles([]);
        setImagenesPreviews([]);
        setImagenesAEliminar([]);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
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

  return (
    <>
      <Head>
        <title>Editar mi negocio | MarketDesliz</title>
        <meta name="description" content="Actualiza la información de tu negocio en MarketDesliz." />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback={id ? `/negocios/${id}` : '/negocios'} />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1">
          {/* ─── HEADER EDITORIAL ────────────────────────── */}
          <section className="max-w-[820px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-10">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
            >
              Editor de perfil · Negocio aliado
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
                <Store size={22} strokeWidth={1.75} style={{ color: T.accent }} />
              </div>

              <div className="flex-1 min-w-[220px]">
                <h1
                  className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em]"
                  style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                >
                  Editar
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}mi negocio.
                  </span>
                </h1>
                {negocio && (
                  <p
                    className="text-[14px] mt-3 truncate"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    {negocio.nombre}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ─── MENSAJES ────────────────────────────────── */}
          {(error || success) && (
            <section className="max-w-[820px] mx-auto px-6 md:px-14 pb-4">
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

              {success && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3"
                  style={{
                    background: 'rgba(26, 127, 75, 0.06)',
                    borderLeft: `2px solid ${T.green}`,
                    borderRadius: '6px',
                  }}
                >
                  <CheckCircle
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: T.green, flexShrink: 0, marginTop: 2 }}
                  />
                  <p
                    className="text-[12.5px] leading-relaxed flex-1"
                    style={{ color: T.green, fontWeight: 450 }}
                  >
                    {success}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ─── FORMULARIO ───────────────────────────────── */}
          <section className="max-w-[820px] mx-auto px-6 md:px-14 pb-24">
            <div className="flex flex-col gap-10">

              {/* Información básica */}
              <FormSection title="Información básica">
                <div>
                  <FieldLabel required>Nombre del negocio</FieldLabel>
                  <TextField
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Ferretería El Martillo"
                  />
                </div>

                <div>
                  <FieldLabel required>Categoría</FieldLabel>
                  <SelectField
                    name="categoria"
                    value={formData.categoria}
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
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Teléfono</FieldLabel>
                    <TextField
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="55 1234 5678"
                    />
                  </div>
                  <div>
                    <FieldLabel>WhatsApp</FieldLabel>
                    <TextField
                      name="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="521234567890"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Descripción</FieldLabel>
                  <TextField
                    name="descripcion"
                    value={formData.descripcion}
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
                    <SelectField name="estadoId" value={formData.estadoId} onChange={handleInputChange}>
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
                      value={formData.municipioId}
                      onChange={handleInputChange}
                      disabled={!formData.estadoId}
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
                      value={formData.localidadId}
                      onChange={handleInputChange}
                      disabled={!formData.municipioId}
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
                      value={formData.sectorId}
                      onChange={handleInputChange}
                      disabled={!formData.localidadId}
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
                      value={formData.codigoPostal}
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
                      value={formData.latitud}
                      onChange={handleInputChange}
                      placeholder="19.4326"
                    />
                  </div>
                  <div>
                    <FieldLabel>Longitud</FieldLabel>
                    <TextField
                      name="longitud"
                      type="number"
                      value={formData.longitud}
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
                    value={formData.email}
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
                      value={formData.sitioWeb}
                      onChange={handleInputChange}
                      placeholder="https://www.minegocio.com"
                    />
                  </div>
                  <div>
                    <FieldLabel>Facebook</FieldLabel>
                    <TextField
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleInputChange}
                      placeholder="URL de Facebook"
                    />
                  </div>
                  <div>
                    <FieldLabel>Instagram</FieldLabel>
                    <TextField
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      placeholder="URL de Instagram"
                    />
                  </div>
                  <div>
                    <FieldLabel>TikTok</FieldLabel>
                    <TextField
                      name="tiktok"
                      value={formData.tiktok}
                      onChange={handleInputChange}
                      placeholder="URL de TikTok"
                    />
                  </div>
                </div>
              </FormSection>

              {/* Horario y servicios */}
              <FormSection title="Horario y servicios">
                <div>
                  <FieldLabel>Horario de atención</FieldLabel>
                  <TextField
                    name="horario"
                    value={formData.horario}
                    onChange={handleInputChange}
                    placeholder="Lun-Vie 9am-6pm, Sáb 9am-2pm"
                  />
                </div>

                <div className="flex flex-wrap gap-5">
                  <CheckboxField
                    name="atencionWhatsapp"
                    checked={formData.atencionWhatsapp}
                    onChange={handleInputChange}
                    label="Atención por WhatsApp"
                  />
                  <CheckboxField
                    name="citasPrevias"
                    checked={formData.citasPrevias}
                    onChange={handleInputChange}
                    label="Requiere cita previa"
                  />
                  <CheckboxField
                    name="domicilio"
                    checked={formData.domicilio}
                    onChange={handleInputChange}
                    label="Servicio a domicilio"
                  />
                </div>

                <div>
                  <FieldLabel>Otros servicios</FieldLabel>
                  <TextField
                    name="servicios"
                    value={formData.servicios}
                    onChange={handleInputChange}
                    placeholder="Estacionamiento, Wi-Fi, Pagos con tarjeta"
                    hint="Separa múltiples servicios por coma."
                  />
                </div>
              </FormSection>

              {/* Imágenes */}
              <FormSection title="Imágenes">
                <div>
                  <FieldLabel>Logo / Foto principal</FieldLabel>
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
                  <p
                    className="text-[11.5px] mt-2"
                    style={{ color: T.inkFaint, fontWeight: 450 }}
                  >
                    Recomendado: 500×500px, formato JPG o PNG.
                  </p>
                </div>

                {imagenesExistentes.length > 0 && (
                  <div>
                    <FieldLabel>Fotos actuales de tu local</FieldLabel>
                    <div className="flex gap-3 flex-wrap mt-2">
                      {imagenesExistentes.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={pb.files.getURL(negocio, img)}
                            alt={`Foto ${idx + 1}`}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              border: `1px solid ${T.line}`,
                              borderRadius: '6px',
                            }}
                          />
                          <button
                            onClick={() => eliminarImagenExistente(img)}
                            type="button"
                            aria-label="Eliminar imagen"
                            className="absolute flex items-center justify-center"
                            style={{
                              top: '-6px',
                              right: '-6px',
                              width: '22px',
                              height: '22px',
                              background: T.red,
                              borderRadius: '50%',
                              color: '#FFFFFF',
                              border: '2px solid #FAFAF9',
                              cursor: 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <X size={10} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p
                      className="text-[11.5px] mt-2"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Haz click en <strong style={{ color: T.red }}>×</strong> para eliminar una foto al guardar.
                    </p>
                  </div>
                )}

                <div>
                  <FieldLabel>Agregar nuevas fotos</FieldLabel>
                  <FileInput onChange={handleImagenesChange} multiple />
                  {imagenesPreviews.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {imagenesPreviews.map((preview, idx) => (
                        <img
                          key={idx}
                          src={preview}
                          alt={`Nueva ${idx + 1}`}
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

              {/* Acciones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                <Link
                  href={id ? `/negocios/${id}` : '/negocios'}
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
                  <PrimaryButton onClick={guardarCambios} loading={saving} disabled={saving}>
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </PrimaryButton>
                </div>
              </div>
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