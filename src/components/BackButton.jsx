// src/components/BackButton.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { T } from '../lib/tokens';

// ─────────────────────────────────────────────────────────────────────────
// BackButton · botón flotante de retroceso
// · Position fixed, arriba-izquierda con safe areas
// · Estilo dark circular (compatible con tema claro)
// · Touch-friendly
// ─────────────────────────────────────────────────────────────────────────
export default function BackButton({
  fallback = '/',
  topOffset = 100, // distancia desde el safe area top, en px
  size = 48,
}) {
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      aria-label="Volver"
      style={{
        position: 'fixed',
        top: `calc(env(safe-area-inset-top) + ${topOffset}px)`,
        left: 'calc(env(safe-area-inset-left) + 20px)',
        zIndex: 20,
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: pressed ? '#000000' : hover ? '#1F1F1F' : '#2E2E2E',
        borderRadius: '50%',
        border: 'none',
        boxShadow: hover
          ? '0 6px 20px rgba(15,15,15,0.20)'
          : '0 2px 10px rgba(15,15,15,0.12)',
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: `all 0.2s ${T.ease}`,
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      <ChevronLeft
        size={20}
        strokeWidth={2.25}
        style={{ color: '#FAFAF9', marginLeft: '-2px' }}
      />
    </button>
  );
}