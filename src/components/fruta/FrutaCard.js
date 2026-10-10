// src/components/fruta/FrutaCard.js
// Card de fruta · compartida entre /fruta y /fruta/categoria/...
// Mismo visual que la card original de fruta/index.js
import { useState } from 'react';
import { Heart, Package, Sprout } from 'lucide-react';
import { formatMoney } from '../../lib/utils';
import { T } from '../../lib/tokens';

export default function FrutaCard({
  producto,
  isFavorite = false,
  onToggleFavorite = null,
  onClick = null,
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="cursor-pointer flex flex-col transition-all duration-300"
      style={{
        background: T.bg,
        border: `1px solid ${hover ? 'rgba(15,15,15,0.14)' : T.line}`,
        borderRadius: '8px',
        overflow: 'hidden',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 1px 2px rgba(15,15,15,0.04), 0 8px 24px rgba(15,15,15,0.06)'
          : 'none',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Imagen */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'rgba(15, 15, 15, 0.03)' }}
      >
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transitionTimingFunction: T.ease,
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        {/* Favorito (opcional) */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            className="absolute top-3 right-3 flex items-center justify-center"
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(250, 250, 249, 0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '50%',
              WebkitTapHighlightColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Heart
              size={14}
              strokeWidth={1.75}
              style={{
                color: isFavorite ? '#C53030' : T.inkMid,
                fill: isFavorite ? '#C53030' : 'transparent',
              }}
            />
          </button>
        )}

        {/* Badge Nuevo */}
        {producto.nuevo && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5"
              style={{
                background: 'rgba(79, 46, 232, 0.92)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                borderRadius: '4px',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              Nuevo
            </span>
          </div>
        )}

        {/* Badge Temporada */}
        {producto.temporada && !producto.nuevo && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5"
              style={{
                background: 'rgba(26, 127, 75, 0.92)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                borderRadius: '4px',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              <Sprout size={9} strokeWidth={2.5} /> Temporada
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3.5 flex flex-col gap-1.5 flex-1">
        <h3
          className="text-[13.5px] leading-snug tracking-[-0.005em] truncate"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          {producto.nombre}
        </h3>

        {producto.categoriaNombre && (
          <p
            className="text-[11px] uppercase tracking-[0.15em] truncate"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            {producto.categoriaNombre}
          </p>
        )}

        <p
          className="text-[15px] tabular-nums tracking-[-0.01em] mt-0.5"
          style={{
            color: T.ink,
            fontWeight: 500,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {formatMoney(producto.precio)}
          {producto.unidad && (
            <span
              className="text-[11px] ml-1"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              / {producto.unidad}
            </span>
          )}
        </p>

        {producto.precioAnterior > 0 && producto.precioAnterior > producto.precio && (
          <p
            className="text-[11.5px] line-through tabular-nums"
            style={{ color: T.inkFaint, fontWeight: 450, fontFeatureSettings: '"tnum"' }}
          >
            {formatMoney(producto.precioAnterior)}
          </p>
        )}
      </div>
    </div>
  );
}