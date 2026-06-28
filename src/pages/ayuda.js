// src/pages/ayuda.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { HelpCircle, ChevronDown, Mail, MessageCircle } from 'lucide-react';
import StoreLayout from '../layouts/StoreLayout';

const preguntasFrecuentes = [
  {
    categoria: 'Compras',
    preguntas: [
      { pregunta: '¿Cómo comprar un producto?', respuesta: 'Selecciona el producto que te interesa, elige tu plan de pago (contado o crédito), completa tus datos y confirma tu solicitud.' },
      { pregunta: '¿Qué métodos de pago aceptan?', respuesta: 'Aceptamos pagos en efectivo con el cobrador, transferencia bancaria BBVA y pago con QR.' },
      { pregunta: '¿Puedo apartar un producto?', respuesta: 'Sí, puedes apartar tu producto con un pago inicial (enganche) y pagar el resto en cómodas cuotas semanales.' }
    ]
  },
  {
    categoria: 'Crédito',
    preguntas: [
      { pregunta: '¿Cómo funciona el crédito?', respuesta: 'Eliges un producto, pagas un enganche (desde 15% del valor) y el resto lo pagas en cuotas semanales sin intereses.' },
      { pregunta: '¿Cuánto puedo pagar por semana?', respuesta: 'Puedes elegir pagar desde $50 hasta $500 por semana, según tu presupuesto.' },
      { pregunta: '¿Qué pasa si me atraso en un pago?', respuesta: 'Te contactaremos para recordarte tu pago. Los atrasos pueden afectar tu historial crediticio dentro de la plataforma.' }
    ]
  },
  {
    categoria: 'Tandas',
    preguntas: [
      { pregunta: '¿Qué es una tanda?', respuesta: 'Una tanda es un grupo de personas que aportan dinero semanalmente y cada semana uno de los miembros recibe el total reunido.' },
      { pregunta: '¿Cómo me uno a una tanda?', respuesta: 'Completa tu verificación KYC, elige la tanda disponible, paga la cuota de gasolina ($25) y selecciona tu posición.' },
      { pregunta: '¿La posición #1 es para mí?', respuesta: 'La posición #1 es para MarketDesliz como administrador de la tanda.' }
    ]
  },
  {
    categoria: 'Negocios Aliados',
    preguntas: [
      { pregunta: '¿Cómo me registro como negocio aliado?', respuesta: 'Contáctanos por WhatsApp, acepta colocar una lona de MarketDesliz en tu local y te daremos un código de invitación para registrarte.' },
      { pregunta: '¿Qué beneficios tengo como aliado?', respuesta: 'Aparecerás en nuestra plataforma, tendrás mayor visibilidad y recibirás notificaciones cuando los clientes te contacten.' }
    ]
  },
  {
    categoria: 'Verificación KYC',
    preguntas: [
      { pregunta: '¿Qué es KYC?', respuesta: 'KYC (Know Your Customer) es el proceso de verificación de identidad que realizamos para garantizar la seguridad de las tandas.' },
      { pregunta: '¿Qué documentos necesito?', respuesta: 'Necesitas subir tu INE (frontal y trasera) y una selfie sosteniendo tu INE.' },
      { pregunta: '¿Cuánto tiempo tarda la verificación?', respuesta: 'La verificación puede tomar de 24 a 48 horas. Te notificaremos cuando sea aprobada.' }
    ]
  }
];

function AccordionItem({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className={`text-sm font-semibold leading-snug transition-colors ${open ? 'text-[#6C3BFF]' : 'text-gray-800 group-hover:text-[#6C3BFF]'}`}>
          {pregunta}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180 text-[#6C3BFF]' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4 pr-8">{respuesta}</p>
      )}
    </div>
  );
}

export default function AyudaPage() {
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);

  return (
    <>
      <Head>
        <title>Centro de Ayuda | MarketDesliz</title>
        <meta name="description" content="Preguntas frecuentes y guías sobre compras a crédito y tandas en MarketDesliz" />
      </Head>

      <StoreLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-36 pb-10">

          {/* Header */}
          <div className="text-center mb-9">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
            <p className="text-gray-500 mt-2 text-sm">Encuentra respuestas a las preguntas más frecuentes</p>
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link
              href="/contacto"
              className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md hover:border-[#6C3BFF]/20 transition-all group"
            >
              <div className="w-10 h-10 bg-[#6C3BFF]/8 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#6C3BFF]/15 transition-colors">
                <Mail size={18} className="text-[#6C3BFF]" />
              </div>
              <p className="text-sm font-bold text-gray-800">¿No encuentras lo que buscas?</p>
              <p className="text-xs text-gray-400 mt-1 group-hover:text-[#6C3BFF] transition-colors">Contáctanos →</p>
            </Link>
            <a
              href="https://wa.me/522821414939"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md hover:border-[#10b981]/30 transition-all group"
            >
              <div className="w-10 h-10 bg-[#10b981]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#10b981]/20 transition-colors">
                <MessageCircle size={18} className="text-[#10b981]" />
              </div>
              <p className="text-sm font-bold text-gray-800">Soporte por WhatsApp</p>
              <p className="text-xs text-gray-400 mt-1 group-hover:text-[#10b981] transition-colors">Atención personalizada →</p>
            </a>
          </div>

          {/* Acordeón por categoría */}
          <div className="space-y-3">
            {preguntasFrecuentes.map((cat, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setCategoriaAbierta(categoriaAbierta === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-sm font-bold text-gray-900">{cat.categoria}</h2>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${categoriaAbierta === idx ? 'rotate-180 text-[#6C3BFF]' : ''}`}
                  />
                </button>

                {categoriaAbierta === idx && (
                  <div className="px-6 pb-2 border-t border-gray-50">
                    {cat.preguntas.map((item, qIdx) => (
                      <AccordionItem key={qIdx} pregunta={item.pregunta} respuesta={item.respuesta} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/contacto" className="text-sm text-[#6C3BFF] font-medium hover:underline">
              ¿Aún tienes dudas? Contáctanos →
            </Link>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}