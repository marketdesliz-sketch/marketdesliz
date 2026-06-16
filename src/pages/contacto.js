// src/pages/contacto.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Phone, MessageCircle, Mail, Clock, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';
import pb from '../lib/pocketbase';

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

export default function ContactoPage() {
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await pb.collection('contacto').create({ ...formData, leido: false });
      setEnviado(true);
      setFormData({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
      setTimeout(() => setEnviado(false), 5000);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const asuntos = [
    'Duda sobre productos', 'Problema con mi pedido', 'Información de tandas',
    'Ser vendedor/aliado', 'Sugerencia', 'Otro'
  ];

  const infoCards = [
    { icon: Phone,          titulo: 'Teléfono',   valor: '(+52) 282-141-4939', sub: 'Lun–Vie 9am–6pm', href: 'tel:+522821414939' },
    { icon: MessageCircle,  titulo: 'WhatsApp',   valor: '(+52) 282-141-4939', sub: 'Respuesta rápida', href: 'https://wa.me/522821414939', external: true },
    { icon: Mail,           titulo: 'Email',      valor: 'marketdesliz@gmail.com', sub: 'Respuesta en 24h', href: 'mailto:marketdesliz@gmail.com' },
  ];

  return (
    <>
      <Head>
        <title>Contacto | MarketDesliz</title>
        <meta name="description" content="Contáctanos para resolver tus dudas sobre compras a crédito y tandas" />
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="text-center mb-9">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contáctanos</h1>
            <p className="text-gray-500 mt-2 text-sm">¿Tienes dudas? Estamos aquí para ayudarte</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

            {/* Info de contacto */}
            <div className="space-y-4">
              {infoCards.map(({ icon: Icon, titulo, valor, sub, href, external }) => (
                <a
                  key={titulo}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-[#6C3BFF]/20 transition-all group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#6C3BFF]/8 flex items-center justify-center shrink-0 group-hover:bg-[#6C3BFF]/15 transition-colors">
                      <Icon size={18} className="text-[#6C3BFF]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{titulo}</p>
                      <p className="text-sm font-semibold text-gray-900">{valor}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                  </div>
                </a>
              ))}

              {/* Horario */}
              <div className="bg-[#6C3BFF]/5 border border-[#6C3BFF]/15 rounded-2xl p-4 flex items-center gap-3">
                <Clock size={16} className="text-[#6C3BFF] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#6C3BFF]">Horario de atención</p>
                  <p className="text-xs text-gray-500 mt-0.5">Lunes a Viernes, 9am – 6pm</p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Envíanos un mensaje</h2>

                {enviado && (
                  <div className="flex items-center gap-3 mb-5 p-4 bg-[#10b981]/8 border border-[#10b981]/20 text-[#10b981] rounded-xl">
                    <CheckCircle size={18} className="shrink-0" />
                    <p className="text-sm font-medium">Mensaje enviado correctamente. Te responderemos pronto.</p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 mb-5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl">
                    <AlertTriangle size={16} className="shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Nombre completo</FieldLabel>
                      <Input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Juan Pérez" />
                    </div>
                    <div>
                      <FieldLabel required>Email</FieldLabel>
                      <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="correo@ejemplo.com" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Teléfono</FieldLabel>
                      <Input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="55 1234 5678" />
                    </div>
                    <div>
                      <FieldLabel required>Asunto</FieldLabel>
                      <select
                        name="asunto" value={formData.asunto} onChange={handleChange} required
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white"
                      >
                        <option value="">Selecciona un asunto</option>
                        {asuntos.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <FieldLabel required>Mensaje</FieldLabel>
                    <textarea
                      name="mensaje" value={formData.mensaje} onChange={handleChange} required rows="5"
                      placeholder="Escribe tu mensaje aquí..."
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    <Send size={15} />
                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}