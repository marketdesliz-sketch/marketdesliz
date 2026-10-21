// src/components/ganado/GanadoCard.js
// Card de ganado · compartida entre /ganado y /ganado/categoria/...
import { useState } from 'react';
import { Heart, Beef, Award, BadgeCheck, Scale, Calendar } from 'lucide-react';
import { formatMoney } from '../../lib/utils';
import { formatEdad } from '../../lib/ganadoService';
import { T } from '../../lib/tokens';

export default function GanadoCard({
  animal,
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
        {animal.imagen ? (
          <img
            src={animal.imagen}
            alt={animal.nombre}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transitionTimingFunction: T.ease,
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Beef size={32} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        {/* Favorito */}
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

        {/* Badge Nuevo / Destacado */}
        {animal.nuevo && (
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
        {animal.destacado && !animal.nuevo && (
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5"
              style={{
                background: 'rgba(184, 130, 14, 0.92)',
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
              <Award size={9} strokeWidth={2.5} /> Destacado
            </span>
          </div>
        )}

        {/* Badge Certificado (bottom) */}
        {animal.certificado && (
          <div className="absolute bottom-3 left-3">
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
              <BadgeCheck size={9} strokeWidth={2.5} /> Certificado
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
          {animal.nombre}
        </h3>

        {/* ✅ categoriaNombre desde el service */}
        {animal.categoriaNombre && (
          <p
            className="text-[11px] uppercase tracking-[0.15em] truncate"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            {animal.categoriaNombre}
            {animal.raza && ` · ${animal.raza}`}
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
          {formatMoney(animal.precio)}
          {animal.unidad && (
            <span
              className="text-[11px] ml-1"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              / {animal.unidad}
            </span>
          )}
        </p>

        {animal.precioAnterior > 0 && animal.precioAnterior > animal.precio && (
          <p
            className="text-[11.5px] line-through tabular-nums"
            style={{ color: T.inkFaint, fontWeight: 450, fontFeatureSettings: '"tnum"' }}
          >
            {formatMoney(animal.precioAnterior)}
          </p>
        )}

        {/* Peso + edad */}
        {(animal.pesoKg > 0 || animal.edadMeses > 0) && (
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {animal.pesoKg > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[11px] tabular-nums"
                style={{
                  color: T.inkSoft,
                  fontWeight: 450,
                  fontFeatureSettings: '"tnum"',
                }}
              >
                <Scale size={10} strokeWidth={1.75} /> {animal.pesoKg} kg
              </span>
            )}
            {animal.edadMeses > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                <Calendar size={10} strokeWidth={1.75} /> {formatEdad(animal.edadMeses)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}