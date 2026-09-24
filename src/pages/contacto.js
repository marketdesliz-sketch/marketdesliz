// src/pages/contacto.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Phone, MessageCircle, Mail, Clock, CheckCircle, AlertTriangle,
  Send, MapPin
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import HeaderSimple from '../components/Header';
import pb from '../lib/pocketbase';

// ─── Sub-componentes ───────────────────────────────────
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
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all bg-white ${className}`}
      {...props}
    />
  );
}

// ─── Página ────────────────────────────────────────────
export default function ContactoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const navigateTo = (path) => router.push(path);

  // Notificaciones (mínimas, requeridas por HeaderSimple)
  const notifications = [];
  const unreadCount = notifications.filter(n => !n.read).length;

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
    } catch (err) {
      console.error('Error:', err);
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
    { icon: Phone,         titulo: 'Teléfono', valor: '(+52) 282-141-4939',      sub: 'Lun–Vie 9am–6pm',     href: 'tel:+522821414939' },
    { icon: MessageCircle, titulo: 'WhatsApp', valor: '(+52) 282-141-4939',      sub: 'Respuesta rápida',    href: 'https://wa.me/522821414939', external: true },
    { icon: Mail,          titulo: 'Email',    valor: 'marketdesliz@gmail.com',  sub: 'Respuesta en 24h',    href: 'mailto:marketdesliz@gmail.com' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Head>
        <title>Contacto | MarketDesliz</title>
        <meta name="description" content="Contáctanos para resolver tus dudas sobre compras a crédito y tandas" />
      </Head>

      <HeaderSimple
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        unreadCount={unreadCount}
        navigateTo={navigateTo}
        notifications={notifications}
      />

      <div className="max-w-[1400px] mx-auto w-full px-2 py-6 flex-1">
        <main className="flex flex-col gap-6">

          {/* ─── Contenido central ───────────────────── */}
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-10">

            {/* Header */}
            <div className="text-center mb-9">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={26} className="text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contáctanos</h1>
              <p className="text-muted-foreground mt-2 text-sm">¿Tienes dudas? Estamos aquí para ayudarte</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

              {/* ─── Info de contacto ─────────────────── */}
              <div className="space-y-4">
                {infoCards.map(({ icon: Icon, titulo, valor, sub, href, external }) => (
                  <a
                    key={titulo}
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{titulo}</p>
                        <p className="text-sm font-semibold text-gray-900">{valor}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                      </div>
                    </div>
                  </a>
                ))}

                {/* Horario */}
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-3">
                  <Clock size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary">Horario de atención</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Lunes a Viernes, 9am – 6pm</p>
                  </div>
                </div>
              </div>

              {/* ─── Formulario ────────────────────────── */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-5">Envíanos un mensaje</h2>

                  {enviado && (
                    <div className="flex items-center gap-3 mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl">
                      <CheckCircle size={18} className="shrink-0" />
                      <p className="text-sm font-medium">Mensaje enviado correctamente. Te responderemos pronto.</p>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-3 mb-5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl">
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
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all bg-white"
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
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-3 rounded-2xl font-bold text-sm transition-colors"
                    >
                      <Send size={15} />
                      {loading ? 'Enviando...' : 'Enviar mensaje'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Footer unificado (4 columnas) ─────────── */}
          <footer className="bg-white border-t mt-8">
            <div className="max-w-[1400px] mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      <span className="text-gray-800">Market</span>
                      <span className="text-primary">Desliz</span>
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 tracking-[0.2em] font-medium ml-1">
                    DESLIZA • DESCUBRE • CONECTA
                  </span>
                  <p className="text-sm text-muted-foreground mt-4">
                    Desliza, descubre y conecta con los mejores productos para tu hogar. Compra fácil y rápido.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Enlaces rápidos</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/')}>Inicio</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/productos')}>Productos</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/categorias')}>Categorías</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/como-funciona')}>Cómo funciona</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Soporte</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/ayuda')}>Centro de ayuda</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/preguntas-frecuentes')}>Preguntas frecuentes</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/terminos')}>Términos y condiciones</a></li>
                    <li><a href="#" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigateTo('/privacidad')}>Política de privacidad</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Contacto</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">28 2141 4939</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">marketdesliz@gmail.com</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">Ciudad de México, México</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-8 pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MarketDesliz. Todos los derechos reservados.</p>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-muted-foreground">Desliza • Descubre • Conecta</span>
                    <Badge variant="outline" className="text-[10px] border-primary text-primary">v1.0.0</Badge>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}