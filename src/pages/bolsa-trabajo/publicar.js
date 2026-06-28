// src/pages/bolsa-trabajo/publicar.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Briefcase, CheckCircle, ChevronLeft, AlertTriangle,
  Eye, X
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all resize-none bg-white ${className}`}
      {...props}
    />
  );
}

function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

const CATEGORIAS_BOLSA = [
  'ventas', 'atencion_cliente', 'administracion', 'tecnologia',
  'oficios', 'construccion', 'limpieza', 'cocina',
  'chofer', 'repartidor', 'informal', 'otro'
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
    otro: 'Otro'
  };
  return map[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function PublicarOfertaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    tipo: 'busco_trabajo',
    titulo: '',
    descripcion: '',
    categoria: '',
    salario: '',
    horario: '',
    ubicacion: '',
    telefono: '',
    email: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar?redirect=/bolsa-trabajo/publicar');
      return;
    }
    const currentUser = pb.authStore.model;
    setUser(currentUser);
    setFormData(prev => ({
      ...prev,
      telefono: currentUser.telefono || '',
      email: currentUser.email || ''
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};
    if (!formData.titulo.trim()) newErrors.titulo = 'El título es obligatorio';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';
    if (!formData.categoria) newErrors.categoria = 'Selecciona una categoría';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es obligatorio';
    if (formData.telefono.trim() && !/^\d{10,15}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'Ingresa un número de teléfono válido (10-15 dígitos)';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    if (formData.salario && !/^\$?\s*\d+(\.\d{2})?$/.test(formData.salario.replace(/,/g, ''))) {
      newErrors.salario = 'Ingresa un monto válido (ej: $8,000)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) {
      // Scroll al primer error
      const firstError = document.querySelector('.border-red-300');
      if (firstError) firstError.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await pb.collection('bolsa_trabajo').create({
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
        activo: true
      });
      setEnviado(true);
      setTimeout(() => router.push('/bolsa-trabajo'), 3000);
    } catch (err) {
      console.error('Error al publicar:', err);
      setError('Ocurrió un error al publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setShowPreview(true);
  };

  if (enviado) {
    return (
      <StoreLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#10b981]/25">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">¡Oferta enviada a revisión!</h1>
          <p className="text-sm text-gray-500">El administrador la revisará y la publicará pronto.</p>
          <p className="text-xs text-gray-400 mt-3">Redirigiendo...</p>
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head><title>Publicar en Bolsa de Trabajo | MarketDesliz</title></Head>
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <Link href="/bolsa-trabajo" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-[#6C3BFF] hover:border-[#6C3BFF] transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Publicar oferta</h1>
              <p className="text-xs text-gray-400 mt-0.5">Bolsa de Trabajo · MarketDesliz</p>
            </div>
          </div>

          {/* ── Modal de vista previa ────────────────────────────── */}
          {showPreview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Eye size={16} className="text-[#6C3BFF]" /> Vista previa
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      formData.tipo === 'ofrezco_trabajo'
                        ? 'bg-[#6C3BFF]/8 text-[#6C3BFF]'
                        : 'bg-[#10b981]/10 text-[#10b981]'
                    }`}>
                      {formData.tipo === 'ofrezco_trabajo' ? 'Ofrezco trabajo' : 'Busco trabajo'}
                    </span>
                    <span className="text-xs text-gray-400">· {getNombreCategoria(formData.categoria) || 'Sin categoría'}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{formData.titulo || 'Título'}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {formData.descripcion || 'Descripción'}
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {formData.salario && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#10b981]">{formData.salario}</span>
                      </div>
                    )}
                    {formData.ubicacion && (
                      <div className="text-gray-500">📍 {formData.ubicacion}</div>
                    )}
                    {formData.horario && (
                      <div className="text-gray-500">🕐 {formData.horario}</div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-100 space-y-1.5">
                    <div className="text-sm text-gray-500">📞 {formData.telefono || 'Sin teléfono'}</div>
                    {formData.email && <div className="text-sm text-gray-500">📧 {formData.email}</div>}
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                    ⚠️ Esta es una vista previa. Revisa que todos los datos sean correctos antes de publicar.
                  </div>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-[#6C3BFF] text-white rounded-xl font-semibold text-sm hover:bg-[#5b2ee6] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* Aviso */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Tu publicación será revisada por el administrador antes de aparecer en la lista.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Tipo */}
              <div>
                <FieldLabel required>Tipo de publicación</FieldLabel>
                <Select name="tipo" value={formData.tipo} onChange={handleChange}>
                  <option value="busco_trabajo">Busco trabajo</option>
                  <option value="ofrezco_trabajo">Ofrezco trabajo</option>
                </Select>
              </div>

              {/* Título */}
              <div>
                <FieldLabel required>Título</FieldLabel>
                <Input
                  type="text" name="titulo" value={formData.titulo} onChange={handleChange}
                  placeholder="Ej: Se solicita ayudante de cocina"
                  maxLength="100"
                  className={errors.titulo ? 'border-red-300 focus:ring-red-200' : ''}
                />
                {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>}
                <p className="text-xs text-gray-400 mt-1">{formData.titulo.length}/100</p>
              </div>

              {/* Categoría */}
              <div>
                <FieldLabel required>Categoría</FieldLabel>
                <Select name="categoria" value={formData.categoria} onChange={handleChange} className={errors.categoria ? 'border-red-300' : ''}>
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS_BOLSA.map(cat => (
                    <option key={cat} value={cat}>
                      {getNombreCategoria(cat)}
                    </option>
                  ))}
                </Select>
                {errors.categoria && <p className="text-xs text-red-500 mt-1">{errors.categoria}</p>}
              </div>

              {/* Descripción */}
              <div>
                <FieldLabel required>Descripción</FieldLabel>
                <Textarea
                  name="descripcion" value={formData.descripcion} onChange={handleChange}
                  rows="4"
                  placeholder="Describe el puesto, requisitos, responsabilidades..."
                  maxLength="1000"
                  className={errors.descripcion ? 'border-red-300' : ''}
                />
                {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1">{formData.descripcion.length}/1000</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Salario</FieldLabel>
                  <Input
                    type="text" name="salario" value={formData.salario} onChange={handleChange}
                    placeholder="Ej: $8,000 mensual"
                    className={errors.salario ? 'border-red-300' : ''}
                  />
                  {errors.salario && <p className="text-xs text-red-500 mt-1">{errors.salario}</p>}
                </div>
                <div>
                  <FieldLabel>Horario</FieldLabel>
                  <Input
                    type="text" name="horario" value={formData.horario} onChange={handleChange}
                    placeholder="Ej: L-V 9am-6pm"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Ubicación</FieldLabel>
                <Input
                  type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange}
                  placeholder="Ej: Col. Centro, CDMX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Teléfono de contacto</FieldLabel>
                  <Input
                    type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                    placeholder="5512345678"
                    className={errors.telefono ? 'border-red-300' : ''}
                  />
                  {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
                </div>
                <div>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <Input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    className={errors.email ? 'border-red-300' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                  <AlertTriangle size={15} className="shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  <Eye size={16} /> Vista previa
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  <Briefcase size={16} />
                  {loading ? 'Enviando...' : 'Publicar oferta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}