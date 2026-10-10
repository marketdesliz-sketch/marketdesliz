// src/pages/fruta/registro.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Apple, CheckCircle, PartyPopper, Bell, MessageCircle,
  AlertCircle, Zap, Package, Sprout, Lock,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { getFrutaCategorias } from '../../lib/frutasService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes de formulario (idénticos a negocios/servicios)
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
  autoFocus = false, multiline = false, rows = 3, hint = null, step = null,
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
          step={step || (type === 'number' ? 'any' : undefined)}
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

function CheckboxField({ name, checked, onChange, label, icon: Icon = null }) {
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
      <span
        className="text-[13.5px] flex items-center gap-1.5"
        style={{ color: T.inkMid, fontWeight: 450 }}
      >
        {Icon && <Icon size={13} strokeWidth={1.75} style={{ color: '#1A7F4B' }} />}
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
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function RegistroFrutaPage() {
  const router = useRouter();

  const { user, loading: authLoading, openLogin } = useAuth();

  const [step, setStep] = useState('datos');
  const [error, setError] = useState('');
  const [frutaData, setFrutaData] = useState({
    nombre: '',
    // ✅ Cambio: categoriaId (relation) en vez de categoria (text)
    categoriaId: '',
    descripcion: '',
    precio: '',
    precioAnterior: '',
    unidad: 'kg',
    stock: '',
    municipioId: '',
    localidadId: '',
    telefono: '',
    whatsapp: '',
    email: '',
    temporada: false,
    destacado: false,
    nuevo: true,
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  // ✅ Nuevo estado: categorías dinámicas desde PocketBase
  const [categoriasList, setCategoriasList] = useState([]);

  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user && step !== 'completado') {
      openLogin();
    }
  }, [authLoading, user, step, openLogin]);

  // ✅ Cargar categorías del vertical "frutas" (padres + hijos)
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const cats = await getFrutaCategorias();
        setCategoriasList(cats);
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };
    cargarCategorias();
  }, []);

  // Cargar municipios de Veracruz
  useEffect(() => {
    const cargarMunicipios = async () => {
      try {
        const estados = await pb.collection('estados').getFullList({
          filter: 'nombre = "Veracruz"',
          limit: 1,
        });
        if (estados.length > 0) {
          const municipios = await pb.collection('municipios').getFullList({
            filter: `estadoId = "${estados[0].id}"`,
            sort: 'nombre',
          });
          setMunicipiosList(municipios);
        }
      } catch (err) {
        console.error('Error cargando municipios:', err);
      }
    };
    cargarMunicipios();
  }, []);

  // Cascada localidad
  useEffect(() => {
    if (frutaData.municipioId) {
      pb.collection('localidades')
        .getFullList({
          filter: `municipioId = "${frutaData.municipioId}"`,
          sort: 'nombre',
        })
        .then(setLocalidadesList)
        .catch(() => setLocalidadesList([]));
    } else {
      setLocalidadesList([]);
    }
  }, [frutaData.municipioId]);

  const unidades = ['kg', 'pieza', 'manojo', 'caja', 'docena', 'litro', 'gramo'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFrutaData({ ...frutaData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagenFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagenPreview(reader.result);
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

  const guardarFruta = async () => {
    if (!user) {
      openLogin();
      return;
    }
    // ✅ Cambio: validar categoriaId en vez de categoria
    if (!frutaData.nombre || !frutaData.categoriaId || !frutaData.precio || !frutaData.unidad) {
      setError('Completa los campos obligatorios (nombre, categoría, precio, unidad)');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();

      Object.keys(frutaData).forEach((key) => {
        if (key !== 'imagen' && key !== 'imagenes') {
          const value = frutaData[key];
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
      formData.append('usuarioId', user.id);

      if (imagenFile) formData.append('imagen', imagenFile);
      imagenesFiles.forEach((file) => formData.append('imagenes', file));

      const nuevaFruta = await pb.collection('frutas').create(formData);
      console.log('✅ Fruta creada:', nuevaFruta.id);

      setStep('completado');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al registrar el producto. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

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
        <Head><title>Registrar producto | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <BackButton fallback="/fruta" />
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
                  para continuar.
                </span>
              </h1>

              <p
                className="text-[15px] leading-[1.6] mb-8 max-w-sm mx-auto"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                Necesitas iniciar sesión para registrar tu producto.
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

  return (
    <>
      <Head>
        <title>Registrar producto | MarketDesliz</title>
        <meta
          name="description"
          content="Registra tu fruta o verdura y llega a más clientes en tu comunidad."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/fruta" />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1">

          {/* ─── PASO 1: Datos ───────────────────────────── */}
          {step === 'datos' && (
            <section className="max-w-[720px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-24 w-full">
              {/* Header editorial */}
              <div className="mb-12">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] mb-6"
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Registro · Fruta de temporada
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
                    <Apple size={22} strokeWidth={1.75} style={{ color: T.accent }} />
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <h1
                      className="text-[32px] md:text-[44px] leading-[1.02] tracking-[-0.03em]"
                      style={{ color: T.ink, fontWeight: 400, fontFeatureSettings: '"ss01"' }}
                    >
                      Registra
                      <span className="font-serif italic" style={{ color: T.inkMid }}>
                        {' '}tu producto.
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
                    <FieldLabel required>Nombre del producto</FieldLabel>
                    <TextField
                      name="nombre"
                      value={frutaData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: Mango Ataulfo"
                      required
                    />
                  </div>

                  <div>
                    <FieldLabel required>Categoría</FieldLabel>
                    {/* ✅ SelectField dinámico desde PocketBase */}
                    <SelectField
                      name="categoriaId"
                      value={frutaData.categoriaId}
                      onChange={handleInputChange}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categoriasList.map((cat) => (
                        <option
                          key={cat.id}
                          value={cat.id}
                          disabled={cat.esPadre && cat.tieneHijos}
                        >
                          {cat.depth === 1 ? '└─ ' : ''}
                          {cat.nombre}
                          {cat.esPadre && cat.tieneHijos ? ' (agrupador)' : ''}
                        </option>
                      ))}
                    </SelectField>

                    {/* Aviso si aún no hay categorías */}
                    {categoriasList.length === 0 && (
                      <p
                        className="text-[11.5px] mt-2"
                        style={{ color: T.inkFaint, fontWeight: 450 }}
                      >
                        Aún no hay categorías disponibles. Pide al administrador que las cree.
                      </p>
                    )}
                  </div>

                  <div>
                    <FieldLabel>Descripción</FieldLabel>
                    <TextField
                      name="descripcion"
                      value={frutaData.descripcion}
                      onChange={handleInputChange}
                      placeholder="Describe tu producto (frescura, origen, sabor…)"
                      multiline
                      rows={3}
                    />
                  </div>
                </FormSection>

                {/* Precio y stock */}
                <FormSection title="Precio y stock">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Precio</FieldLabel>
                      <TextField
                        name="precio"
                        type="number"
                        step="0.01"
                        value={frutaData.precio}
                        onChange={handleInputChange}
                        placeholder="Ej: 45.00"
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel required>Unidad</FieldLabel>
                      <SelectField
                        name="unidad"
                        value={frutaData.unidad}
                        onChange={handleInputChange}
                      >
                        {unidades.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </SelectField>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Precio anterior (opcional)</FieldLabel>
                      <TextField
                        name="precioAnterior"
                        type="number"
                        step="0.01"
                        value={frutaData.precioAnterior}
                        onChange={handleInputChange}
                        placeholder="Para mostrar descuento"
                      />
                    </div>
                    <div>
                      <FieldLabel>Stock disponible</FieldLabel>
                      <TextField
                        name="stock"
                        type="number"
                        value={frutaData.stock}
                        onChange={handleInputChange}
                        placeholder="Ej: 50"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Ubicación */}
                <FormSection title="Ubicación geográfica (opcional)">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Municipio</FieldLabel>
                      <SelectField
                        name="municipioId"
                        value={frutaData.municipioId}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccionar municipio</option>
                        {municipiosList.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                      </SelectField>
                    </div>
                    <div>
                      <FieldLabel>Localidad</FieldLabel>
                      <SelectField
                        name="localidadId"
                        value={frutaData.localidadId}
                        onChange={handleInputChange}
                        disabled={!frutaData.municipioId}
                      >
                        <option value="">Seleccionar localidad</option>
                        {localidadesList.map((l) => (
                          <option key={l.id} value={l.id}>{l.nombre}</option>
                        ))}
                      </SelectField>
                    </div>
                  </div>
                </FormSection>

                {/* Contacto */}
                <FormSection title="Contacto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Teléfono</FieldLabel>
                      <TextField
                        name="telefono"
                        type="tel"
                        value={frutaData.telefono}
                        onChange={handleInputChange}
                        placeholder="55 1234 5678"
                      />
                    </div>
                    <div>
                      <FieldLabel>WhatsApp</FieldLabel>
                      <TextField
                        name="whatsapp"
                        type="tel"
                        value={frutaData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="521234567890"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Etiquetas */}
                <FormSection title="Etiquetas">
                  <div className="flex flex-wrap gap-5">
                    <CheckboxField
                      name="temporada"
                      checked={frutaData.temporada}
                      onChange={handleInputChange}
                      label="De temporada"
                      icon={Sprout}
                    />
                    <CheckboxField
                      name="destacado"
                      checked={frutaData.destacado}
                      onChange={handleInputChange}
                      label="Producto destacado"
                    />
                    <CheckboxField
                      name="nuevo"
                      checked={frutaData.nuevo}
                      onChange={handleInputChange}
                      label="Marcar como nuevo"
                    />
                  </div>
                </FormSection>

                {/* Imágenes */}
                <FormSection title="Imágenes">
                  <div>
                    <FieldLabel required>Imagen principal</FieldLabel>
                    <FileInput onChange={handleImagenChange} />
                    {imagenPreview && (
                      <div className="mt-3">
                        <img
                          src={imagenPreview}
                          alt="Preview"
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
                      Recomendado: 800×800px, formato JPG o PNG.
                    </p>
                  </div>

                  <div>
                    <FieldLabel>Imágenes adicionales</FieldLabel>
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
                    <p
                      className="text-[11.5px] mt-2"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Puedes subir varias imágenes del producto.
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
                    href="/fruta"
                    className="flex items-center justify-center h-11 text-[13.5px] transition-colors"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Cancelar
                  </Link>
                  <div className="md:col-span-2">
                    <PrimaryButton onClick={guardarFruta} loading={saving} disabled={saving}>
                      {saving ? 'Registrando…' : 'Registrar producto'}
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
                  style={{
                    color: T.inkFaint,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
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
                  Tu producto ya está registrado en MarketDesliz.
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
                  <Apple
                    size={14}
                    strokeWidth={1.75}
                    style={{ color: T.accent, flexShrink: 0, marginTop: 3 }}
                  />
                  <div>
                    <p
                      className="text-[13px] leading-[1.6]"
                      style={{ color: T.inkMid, fontWeight: 450 }}
                    >
                      Tu producto aparecerá en la categoría
                    </p>
                    {/* ✅ Lookup del nombre por ID */}
                    <p
                      className="text-[15px] mt-1"
                      style={{ color: T.accent, fontWeight: 500 }}
                    >
                      {categoriasList.find((c) => c.id === frutaData.categoriaId)?.nombre ||
                        'tu categoría'}
                    </p>
                    <p
                      className="text-[12px] mt-2"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      Los clientes podrán encontrarlo y contactarte directamente.
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
                      Aparecerá en el catálogo{' '}
                      <strong style={{ color: T.accent, fontWeight: 500 }}>
                        inmediatamente
                      </strong>
                      .
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
                      Recibirás notificaciones cuando los clientes interactúen con tu
                      producto.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/fruta"
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
                  <Apple size={15} strokeWidth={1.75} />
                  Ver catálogo
                </Link>

                <Link
                  href="/fruta/mis-frutas"
                  className="flex items-center justify-center gap-2.5 h-11 text-[13.5px] transition-colors"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.line}`,
                    borderRadius: '6px',
                    color: T.inkMid,
                    fontWeight: 500,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Package size={15} strokeWidth={1.75} />
                  Mis productos
                </Link>

                <a
                  href={`https://wa.me/522821414939?text=Hola,%20ya%20registr%C3%A9%20mi%20producto%20${encodeURIComponent(frutaData.nombre)}`}
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