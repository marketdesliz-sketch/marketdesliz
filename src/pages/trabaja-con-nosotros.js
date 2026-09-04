// pages/trabaja-con-nosotros.js
import { useState } from 'react';
import Head from 'next/head';
import pb from '../lib/pocketbase';
import HeaderSimple from '../components/HeaderSimple';
import { Briefcase, Users, TrendingUp, Shield, Zap, Coffee } from 'lucide-react';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  const puestos = [
    'Desarrollador Web',
    'Vendedor de Campo',
    'Atención al Cliente',
    'Marketing Digital',
    'Diseñador UI/UX',
    'Otro'
  ];

  const notifications = [
    { id: 1, title: '¡Nueva colección!', description: 'Descubre la línea Otoño 2026', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  const navigateTo = (path) => {
    window.location.href = path;
  };

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
        <meta name="description" content="Únete al equipo de MarketDesliz. Envía tu solicitud y forma parte de nuestra familia." />
      </Head>

      <div className="min-h-screen bg-[#ECEAF5] font-sans flex flex-col">
        {/* HEADER UNIFICADO */}
        <HeaderSimple
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          unreadCount={unreadCount}
          navigateTo={navigateTo}
          notifications={notifications}
          showLoginDropdown={showLoginDropdown}
          setShowLoginDropdown={setShowLoginDropdown}
          onLoginSuccess={() => {}}
        />

        {/* CONTENIDO PRINCIPAL - Estilo cristal flotante */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 pt-8">
          
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#6C3BFF]/10 px-4 py-2 rounded-full text-[#6C3BFF] text-sm font-medium mb-4">
              <Briefcase size={16} />
              <span>Únete a nuestro equipo</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-textMain leading-tight tracking-tight">
              Trabaja con <span className="text-[#6C3BFF]">Nosotros</span>
            </h1>
            <p className="text-lg text-textMuted mt-3 max-w-xl mx-auto">
              Forma parte de un equipo innovador que está transformando la forma de comprar y vender.
            </p>
          </div>

          
          {/* Sección de vacantes y formulario */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Vacantes - Izquierda */}
            <div className="lg:col-span-2">
              <div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-card"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(248,245,255,0.60) 100%)",
                  boxShadow: "0 4px 24px rgba(108, 59, 255, 0.06), inset 0 1px 1px rgba(255,255,255,0.8)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={20} className="text-[#6C3BFF]" />
                  <h2 className="text-lg font-bold text-gray-800">Vacantes actuales</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Desarrollador Web', type: 'Tiempo completo • Remoto' },
                    { title: 'Vendedor de Campo', type: 'Tiempo completo • Zona Metropolitana' },
                    { title: 'Atención al Cliente', type: 'Tiempo completo • Híbrido' },
                    { title: 'Marketing Digital', type: 'Tiempo completo • Remoto' },
                  ].map((vacante, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100/80 hover:border-[#6C3BFF]/20 transition-colors cursor-pointer"
                    >
                      <h3 className="font-bold text-gray-800 text-sm">{vacante.title}</h3>
                      <p className="text-xs text-textMuted mt-0.5">{vacante.type}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-textMuted mt-4 text-center">
                  📌 Envía tu solicitud y nos pondremos en contacto contigo.
                </p>
              </div>
            </div>

            {/* Formulario - Derecha */}
            <div className="lg:col-span-3">
              <div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-card"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(248,245,255,0.60) 100%)",
                  boxShadow: "0 4px 24px rgba(108, 59, 255, 0.06), inset 0 1px 1px rgba(255,255,255,0.8)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Envía tu solicitud</h2>
                </div>

                {enviado && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                    <span>✅</span> Solicitud enviada correctamente
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre completo *"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] outline-none transition bg-white/70 backdrop-blur-sm"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Correo electrónico *"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] outline-none transition bg-white/70 backdrop-blur-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="Teléfono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] outline-none transition bg-white/70 backdrop-blur-sm"
                    />
                    <select
                      name="puesto"
                      value={formData.puesto}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] outline-none transition bg-white/70 backdrop-blur-sm appearance-none"
                    >
                      <option value="">Selecciona el puesto</option>
                      {puestos.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <textarea
                    name="experiencia"
                    placeholder="Cuéntanos sobre tu experiencia"
                    rows="3"
                    value={formData.experiencia}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] outline-none transition bg-white/70 backdrop-blur-sm resize-none"
                  />
                  <textarea
                    name="mensaje"
                    placeholder="Mensaje adicional (opcional)"
                    rows="2"
                    value={formData.mensaje}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#6C3BFF]/30 focus:border-[#6C3BFF] outline-none transition bg-white/70 backdrop-blur-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-[#6C3BFF]/20"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar solicitud'
                    )}
                  </button>
                </form>

                <p className="text-xs text-textMuted mt-4 text-center">
                  Al enviar, aceptas nuestros <a href="/terminos" className="text-[#6C3BFF] hover:underline">Términos y Condiciones</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Footer simple */}
          <footer className="mt-12 pt-6 border-t border-gray-200/50 text-center text-sm text-textMuted">
            <p>© {new Date().getFullYear()} MarketDesliz. Todos los derechos reservados.</p>
          </footer>
        </div>
      </div>
    </>
  );
}