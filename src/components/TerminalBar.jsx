// src/components/TerminalBar.jsx
import { useState, useEffect } from 'react';
import { T } from '../lib/tokens';

// ─────────────────────────────────────────────────────────────────────────
// Mensajes por defecto · se pueden sobreescribir con prop
// ─────────────────────────────────────────────────────────────────────────
const DEFAULT_MESSAGES = [
  'Conectando compradores y vendedores',
  'Verificando negocios aliados',
  'Actualizando catálogo de temporada',
  'Procesando pagos semanales',
  'Añadiendo productos frescos del día',
  'Revisando tandas disponibles',
  'Buscando las mejores ofertas',
  'Preparando recomendaciones para ti',
];

export default function TerminalBar({
  // Modo: 'rotating' | 'static' | 'auto'
  mode = 'auto',
  // Si statusLine tiene valor y mode='auto', se comporta como static
  statusLine = '',
  // Array de mensajes para modo rotating
  messages = DEFAULT_MESSAGES,
  // Reloj opcional (ej: "14:32") que aparece a la derecha
  clock = '',
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const isDynamic = mode === 'auto' ? statusLine !== '' : mode === 'static';
  const isRotating = !isDynamic;

  useEffect(() => {
    if (!isRotating) return;

    let interval = null;

    const start = () => {
      interval = setInterval(() => {
        setVisible(false);
        setTimeout(() => {
          setIndex((i) => (i + 1) % messages.length);
          setVisible(true);
        }, 420);
      }, 3400);
    };

    const stop = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    const handleVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden) stop();
      else { stop(); start(); }
    };

    start();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [isRotating, messages.length]);

  const text = isDynamic ? statusLine : messages[index];

  return (
    <div
      className="w-full"
      style={{
        background: T.ink,
        color: '#FAFAF9',
        paddingTop: 'env(safe-area-inset-top)',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-14 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="font-mono text-[11px] leading-none shrink-0"
            style={{ color: T.accent }}
          >
            &gt;
          </span>
          <span
            className="font-mono text-[11px] leading-none tracking-[0.02em] truncate transition-opacity duration-300"
            style={{
              opacity: visible ? 1 : 0,
              transitionTimingFunction: T.ease,
            }}
          >
            {text}...
          </span>
          <span
            className="inline-block w-[6px] h-[11px] animate-blink shrink-0"
            style={{ background: '#FAFAF9' }}
          />
        </div>

        {clock && (
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <span
              className="font-mono text-[11px] tabular-nums leading-none"
              style={{
                color: 'rgba(250, 250, 249, 0.4)',
                fontFeatureSettings: '"tnum"',
              }}
            >
              {clock}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}