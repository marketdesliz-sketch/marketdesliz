// src/pages/fruta/editar.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Apple, CheckCircle, AlertCircle, Sprout, X,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
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
// Página · lógica SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
export default function EditarFrutaPage() {
  const router = useRouter();
  const { id } = router.query;

  const { user, loading: authLoading, openLogin } = useAuth();

  const [fruta, setFruta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
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
    nuevo: false,
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenesFiles, setImagenesFiles] = useState([]);
  const [imagenesPreviews, setImagenesPreviews] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesAEliminar, setImagenesAEliminar] = useState([]);

  const [municipiosList, setMunicipiosList] = useState([]);
  const [localidadesList, setLocalidadesList] = useState([]);

  const categorias = [
    'Frutas',
    'Verduras',
    'Cítricos',
    'Tropicales',
    'Frutos rojos',
    'Frutos secos',
    'Tubérculos',
    'Hojas verdes',
    'Hierbas',
    'Otro',
  ];

  const unidades = ['kg', 'pieza', 'manojo', 'caja', 'docena', 'litro', 'gramo'];

  // Carga inicial con id
  useEffect(() => {
    if (authLoading || !id) return;
    cargarFruta();
    cargarDatosGeograficos();
  }, [id, authLoading]);

  // Sin id → verificar fruta del usuario
  useEffect(() => {
    if (authLoading || id) return;

    if (!user) {
      openLogin();
      return;
    }

    verificarFrutaUsuario();
  }, [authLoading, id, user, openLogin]);

  const cargarDatosGeograficos = async () => {
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
      console.error('Error cargando datos geográficos:', err);
    }
  };

  // Cascada localidad
  useEffect(() => {
    if (formData.municipioId) {
      pb.collection('localidades')
        .getFullList({
          filter: `municipioId = "${formData.municipioId}"`,
          sort: 'nombre',
        })
        .then(setLocalidadesList)
        .catch(() => setLocalidadesList([]));
    } else {
      setLocalidadesList([]);
    }
  }, [formData.municipioId]);

  const verificarFrutaUsuario = async () => {
    try {
      const frutas = await pb.collection('frutas').getFullList({
        filter: `usuarioId = "${user.id}"`,
      });

      if (frutas.length > 0) {
        router.push(`/fruta/editar?id=${frutas[0].id}`);
      } else {
        setError(
          'No tienes un producto registrado. Regístralo primero para poder editarlo.'
        );
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al verificar tu producto');
      setLoading(false);
    }
  };

  const cargarFruta = async () => {
    try {
      setLoading(true);
      const frutaData = await pb.collection('frutas').getOne(id);
      setFruta(frutaData);

      setFormData({
        nombre: frutaData.nombre || '',
        categoria: frutaData.categoria || '',
        descripcion: frutaData.descripcion || '',
        precio: frutaData.precio || '',
        precioAnterior: frutaData.precioAnterior || '',
        unidad: frutaData.unidad || 'kg',
        stock: frutaData.stock || '',
        municipioId: frutaData.municipioId || '',
        localidadId: frutaData.localidadId || '',
        telefono: frutaData.telefono || '',
        whatsapp: frutaData.whatsapp || '',
        email: frutaData.email || '',
        temporada: frutaData.temporada === true,
        destacado: frutaData.destacado === true,
        nuevo: frutaData.nuevo === true,
      });

      if (frutaData.imagen) {
        setImagenPreview(pb.files.getURL(frutaData, frutaData.imagen));
      }

      if (frutaData.imagenes) {
        const imagenes = Array.isArray(frutaData.imagenes)
          ? frutaData.imagenes
          : [frutaData.imagenes];
        setImagenesExistentes(imagenes.filter((img) => img));
      }
    } catch (error) {
      console.error('Error cargando fruta:', error);
      setError('Error al cargar la información del producto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
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

  const eliminarImagenExistente = (imagen) => {
    setImagenesAEliminar([...imagenesAEliminar, imagen]);
    setImagenesExistentes(imagenesExistentes.filter((img) => img !== imagen));
  };

  const guardarCambios = async () => {
    if (!formData.nombre || !formData.categoria || !formData.precio || !formData.unidad) {
      setError('Completa los campos obligatorios (nombre, categoría, precio, unidad)');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key !== 'imagen' && key !== 'imagenes') {
          const value = formData[key];
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value ? 'true' : 'false');
          } else if (value !== null && value !== undefined && value !== '') {
            formDataToSend.append(key, value);
          }
        }
      });

      if (imagenFile) formDataToSend.append('imagen', imagenFile);

      imagenesFiles.forEach((file) => formDataToSend.append('imagenes', file));

      if (imagenesAEliminar.length > 0) {
        formDataToSend.append('imagenesEliminar', JSON.stringify(imagenesAEliminar));
      }

      await pb.collection('frutas').update(id, formDataToSend);
      setSuccess('Producto actualizado correctamente');

      setTimeout(() => {
        cargarFruta();
        setImagenesFiles([]);
        setImagenesPreviews([]);
        setImagenesAEliminar([]);
        setImagenFile(null);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────
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
        <title>Editar producto | MarketDesliz</title>
        <meta name="description" content="Actualiza la información de tu producto en MarketDesliz." />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback={id ? `/fruta/${id}` : '/fruta'} />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1">
          {/* ─── HEADER EDITORIAL ────────────────────────── */}
          <section className="max-w-[820px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-10">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
            >
              Editor de producto · Fruta de temporada
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
                  Editar
                  <span className="font-serif italic" style={{ color: T.inkMid }}>
                    {' '}mi producto.
                  </span>
                </h1>
                {fruta && (
                  <p
                    className="text-[14px] mt-3 truncate"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    {fruta.nombre}
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
                  className="flex items-start gap-2.5 px-4 py-3 mb-3"
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
                  <FieldLabel required>Nombre del producto</FieldLabel>
                  <TextField
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Mango Ataulfo"
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
                  <FieldLabel>Descripción</FieldLabel>
                  <TextField
                    name="descripcion"
                    value={formData.descripcion}
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
                      value={formData.precio}
                      onChange={handleInputChange}
                      placeholder="Ej: 45.00"
                    />
                  </div>
                  <div>
                    <FieldLabel required>Unidad</FieldLabel>
                    <SelectField
                      name="unidad"
                      value={formData.unidad}
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
                      value={formData.precioAnterior}
                      onChange={handleInputChange}
                      placeholder="Para mostrar descuento"
                    />
                  </div>
                  <div>
                    <FieldLabel>Stock disponible</FieldLabel>
                    <TextField
                      name="stock"
                      type="number"
                      value={formData.stock}
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
                      value={formData.municipioId}
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
                      value={formData.localidadId}
                      onChange={handleInputChange}
                      disabled={!formData.municipioId}
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
                <div>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <TextField
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
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
              </FormSection>

              {/* Etiquetas */}
              <FormSection title="Etiquetas">
                <div className="flex flex-wrap gap-5">
                  <CheckboxField
                    name="temporada"
                    checked={formData.temporada}
                    onChange={handleInputChange}
                    label="De temporada"
                    icon={Sprout}
                  />
                  <CheckboxField
                    name="destacado"
                    checked={formData.destacado}
                    onChange={handleInputChange}
                    label="Producto destacado"
                  />
                  <CheckboxField
                    name="nuevo"
                    checked={formData.nuevo}
                    onChange={handleInputChange}
                    label="Marcar como nuevo"
                  />
                </div>
              </FormSection>

              {/* Imágenes */}
              <FormSection title="Imágenes">
                <div>
                  <FieldLabel>Imagen principal</FieldLabel>
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

                {imagenesExistentes.length > 0 && (
                  <div>
                    <FieldLabel>Imágenes adicionales actuales</FieldLabel>
                    <div className="flex gap-3 flex-wrap mt-2">
                      {imagenesExistentes.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={pb.files.getURL(fruta, img)}
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
                      Haz click en <strong style={{ color: T.red }}>×</strong> para
                      eliminar una imagen al guardar.
                    </p>
                  </div>
                )}

                <div>
                  <FieldLabel>Agregar nuevas imágenes</FieldLabel>
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
                    Puedes subir varias imágenes del producto.
                  </p>
                </div>
              </FormSection>

              {/* Acciones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                <Link
                  href={id ? `/fruta/${id}` : '/fruta'}
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