// src/pages/trabaja-con-nosotros.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';

export default function TrabajaConNosotrosPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    puesto: '',
    experiencia: '',
    mensaje: ''
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const puestos = [
    'Desarrollador Web',
    'Vendedor de Campo',
    'Atención al Cliente',
    'Marketing Digital',
    'Diseñador UI/UX',
    'Otro'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await pb.collection('vacantes').create({
        ...formData,
        created: new Date().toISOString(),
        leido: false
      });
      setEnviado(true);
      setTimeout(() => setEnviado(false), 5000);
      setFormData({ nombre: '', email: '', telefono: '', puesto: '', experiencia: '', mensaje: '' });
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
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">💼 Trabaja con Nosotros</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-4">¿Por qué trabajar en MarketDesliz?</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">✅ Ambiente laboral positivo</li>
                <li className="flex items-center gap-2">✅ Crecimiento profesional</li>
                <li className="flex items-center gap-2">✅ Prestaciones superiores</li>
                <li className="flex items-center gap-2">✅ Trabajo remoto/híbrido</li>
                <li className="flex items-center gap-2">✅ Equipo joven y dinámico</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-[#6C3BFF] mb-4">📋 Vacantes actuales</h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-bold">Desarrollador Web</h3>
                  <p className="text-sm text-gray-500">Tiempo completo • Remoto</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-bold">Vendedor de Campo</h3>
                  <p className="text-sm text-gray-500">Tiempo completo • Zona Metropolitana</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
            <h2 className="text-xl font-bold text-[#6C3BFF] mb-4">📝 Envíanos tu CV</h2>
            
            {enviado && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                ✅ Solicitud enviada correctamente
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="nombre" placeholder="Nombre completo *" value={formData.nombre} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-2" />
                <input type="email" name="email" placeholder="Correo electrónico *" value={formData.email} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="tel" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2" />
                <select name="puesto" value={formData.puesto} onChange={handleChange} required className="border border-gray-300 rounded-lg px-4 py-2">
                  <option value="">Selecciona el puesto</option>
                  {puestos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <textarea name="experiencia" placeholder="Cuéntanos sobre tu experiencia" rows="3" value={formData.experiencia} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2" />
              <textarea name="mensaje" placeholder="Mensaje adicional" rows="2" value={formData.mensaje} onChange={handleChange} className="border border-gray-300 rounded-lg px-4 py-2" />
              <button type="submit" disabled={loading} className="w-full bg-[#6C3BFF] text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50">Enviar solicitud</button>
            </form>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}