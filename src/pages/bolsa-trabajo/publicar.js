// src/pages/bolsa-trabajo/publicar.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Briefcase, CheckCircle, ChevronLeft, AlertTriangle } from 'lucide-react';
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

export default function PublicarOfertaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descripcion || !formData.categoria || !formData.telefono) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await pb.collection('bolsa_trabajo').create({
        userId: user.id,
        tipo: formData.tipo,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        salario: formData.salario,
        horario: formData.horario,
        ubicacion: formData.ubicacion,
        telefono: formData.telefono,
        email: formData.email,
        estado: 'pendiente',
        activo: true
      });
      setEnviado(true);
      setTimeout(() => router.push('/bolsa-trabajo'), 2000);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const categorias = [
    'ventas', 'atencion_cliente', 'administracion', 'tecnologia',
    'oficios', 'construccion', 'limpieza', 'cocina',
    'chofer', 'repartidor', 'informal', 'otro'
  ];

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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

            {/* Aviso */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Tu publicación será revisada por el administrador antes de aparecer en la lista.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

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
                  placeholder="Ej: Se solicita ayudante de cocina" required
                />
              </div>

              {/* Categoría */}
              <div>
                <FieldLabel required>Categoría</FieldLabel>
                <Select name="categoria" value={formData.categoria} onChange={handleChange} required>
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Descripción */}
              <div>
                <FieldLabel required>Descripción</FieldLabel>
                <textarea
                  name="descripcion" value={formData.descripcion} onChange={handleChange} rows="4"
                  placeholder="Describe el puesto, requisitos, responsabilidades..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Salario</FieldLabel>
                  <Input type="text" name="salario" value={formData.salario} onChange={handleChange} placeholder="Ej: $8,000 mensual" />
                </div>
                <div>
                  <FieldLabel>Horario</FieldLabel>
                  <Input type="text" name="horario" value={formData.horario} onChange={handleChange} placeholder="Ej: L-V 9am-6pm" />
                </div>
              </div>

              <div>
                <FieldLabel>Ubicación</FieldLabel>
                <Input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ej: Col. Centro, CDMX" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Teléfono de contacto</FieldLabel>
                  <Input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required />
                </div>
                <div>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                  <AlertTriangle size={15} className="shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <Briefcase size={16} />
                {loading ? 'Enviando...' : 'Publicar oferta'}
              </button>
            </form>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}