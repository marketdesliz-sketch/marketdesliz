// src/pages/servicios/index.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Grid2X2, Heart, Package, Search, Filter, Phone, MapPin,
  Wrench, Droplet, Zap, Hammer, Paintbrush, Sofa,
  TreePine, Sparkles, Wind, Refrigerator, Key, Laptop,
  Scissors, Camera, Music, PartyPopper, Cake,
  Utensils, Truck, Car, Dog, Flower, Bike, ShieldCheck,
  BadgeCheck, Megaphone, Crown, Rocket, ChevronRight, ChevronDown, Tag,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { formatMoney } from '../../lib/utils';
import {
  getServicios,
  getServiciosMarketDesliz,
  getMunicipios,
  getLocalidades,
  getEstados,
} from '../../lib/serviciosService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL DEL HERO · LOCAL
// Guárdala en: /public/images/servicios-hero.jpg
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/servicios-hero.jpg';

// ─────────────────────────────────────────────────────────────────────────
// SERVICIOS OFICIALES MARKETDESLIZ · SIN CAMBIOS (datos)
// ─────────────────────────────────────────────────────────────────────────
const SERVICIOS_MARKETDESLIZ = [
  {
    key: 'deslizmoto',
    nombre: 'Deslizmoto Express',
    descripcion: 'Entregas rápidas en moto',
    icon: Bike,
    categoria: 'Entrega en moto',
  },
  {
    key: 'deslizfood',
    nombre: 'DeslizFood',
    descripcion: 'Comida a domicilio',
    icon: Utensils,
    categoria: 'Catering',
  },
  {
    key: 'encargos-vip',
    nombre: 'Encargos VIP',
    descripcion: 'Mandados y encargos personalizados',
    icon: Crown,
    categoria: 'Mandados',
  },
  {
    key: 'publicidad',
    nombre: 'Publicidad',
    descripcion: 'Promociona tu negocio',
    icon: Megaphone,
    categoria: 'Publicidad',
  },
  {
    key: 'invitaciones',
    nombre: 'Invitaciones Digitales',
    descripcion: 'Tarjetas e invitaciones personalizadas',
    icon: Sparkles,
    categoria: 'Invitaciones',
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Mapa de íconos por categoría · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const iconMap = {
  'todos': Wrench,
  'plomería': Droplet,
  'plomeria': Droplet,
  'electricidad': Zap,
  'albañilería': Hammer,
  'albanileria': Hammer,
  'pintura': Paintbrush,
  'carpintería': Sofa,
  'carpinteria': Sofa,
  'herrería': Hammer,
  'herreria': Hammer,
  'jardinería': TreePine,
  'jardineria': TreePine,
  'limpieza': Sparkles,
  'aire acondicionado': Wind,
  'refrigeración': Refrigerator,
  'refrigeracion': Refrigerator,
  'cerrajería': Key,
  'cerrajeria': Key,
  'computación': Laptop,
  'computacion': Laptop,
  'celulares': Package,
  'belleza': Scissors,
  'estética': Sparkles,
  'estetica': Sparkles,
  'fotografía': Camera,
  'fotografia': Camera,
  'música': Music,
  'musica': Music,
  'eventos': PartyPopper,
  'pastelería': Cake,
  'pasteleria': Cake,
  'catering': Utensils,
  'mudanzas': Truck,
  'mecánica': Car,
  'mecanica': Car,
  'veterinaria': Dog,
  'florería': Flower,
  'floreria': Flower,
  'entrega en moto': Bike,
  'viajes en moto': Bike,
  'mandados': Truck,
  'invitaciones': PartyPopper,
  'publicidad': Megaphone,
  'tarjetas de 15 años': Cake,
  'eventos especiales': PartyPopper,
  'más categorías': Grid2X2,
};

const getIcon = (nombre) => {
  const lower = nombre?.toLowerCase().trim() || '';
  if (iconMap[lower]) return iconMap[lower];
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lower.includes(key) || key.includes(lower)) return icon;
  }
  return Tag;
};

// ─────────────────────────────────────────────────────────────────────────
// Categorías básicas · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const CATEGORIAS_BASICAS = [
  { nombre: 'Plomería', icon: Droplet },
  { nombre: 'Electricidad', icon: Zap },
  { nombre: 'Albañilería', icon: Hammer },
  { nombre: 'Pintura', icon: Paintbrush },
  { nombre: 'Carpintería', icon: Sofa },
  { nombre: 'Limpieza', icon: Sparkles },
  { nombre: 'Jardinería', icon: TreePine },
  { nombre: 'Cerrajería', icon: Key },
  { nombre: 'Aire acondicionado', icon: Wind },
  { nombre: 'Computación', icon: Laptop },
  { nombre: 'Belleza', icon: Scissors },
  { nombre: 'Más categorías', icon: Grid2X2, esMasCategorias: true },
];

// ─────────────────────────────────────────────────────────────────────────
// TextLink
// ─────────────────────────────────────────────────────────────────────────
function TextLink({ label, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="transition-colors duration-200"
      style={{
        color: hover ? T.accent : T.inkSoft,
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      {label} →
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CategoryCard · minimal
// ─────────────────────────────────────────────────────────────────────────
function CategoryCard({ cat, isActive, onClick }) {
  const [hover, setHover] = useState(false);
  const IconComponent = cat.icon;
  const highlighted = isActive || hover;

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col items-center justify-center gap-3 py-6 px-3 transition-all duration-300"
      style={{
        background: 'transparent',
        border: `1px solid ${highlighted ? T.line : 'transparent'}`,
        borderRadius: '8px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        className="flex items-center justify-center transition-colors duration-300"
        style={{
          width: '44px',
          height: '44px',
          background: highlighted ? T.accent : 'rgba(15, 15, 15, 0.04)',
          borderRadius: '8px',
          transitionTimingFunction: T.ease,
        }}
      >
        <IconComponent
          size={20}
          strokeWidth={1.75}
          style={{
            color: highlighted ? '#FFFFFF' : T.inkMid,
            transition: `color 0.3s ${T.ease}`,
          }}
        />
      </div>
      <span
        className="text-[12px] text-center transition-colors duration-300"
        style={{
          color: highlighted ? T.ink : T.inkMid,
          fontWeight: 500,
          letterSpacing: '-0.005em',
          transitionTimingFunction: T.ease,
        }}
      >
        {cat.nombre}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ServiciosMDDropdown · dropdown "Servicios MarketDesliz"
// ─────────────────────────────────────────────────────────────────────────
function ServiciosMDDropdown({ onSelect, onVerTodos }) {
  const [open, setOpen] = useState(false);
  const [hoverTrigger, setHoverTrigger] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHoverTrigger(true)}
        onMouseLeave={() => setHoverTrigger(false)}
        className="flex items-center gap-2 h-11 px-5 text-white text-[13px] transition-colors"
        style={{
          background: hoverTrigger || open ? T.accentDeep : T.accent,
          borderRadius: '6px',
          fontWeight: 500,
          letterSpacing: '0.01em',
          border: 'none',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transitionTimingFunction: T.ease,
        }}
      >
        <Rocket size={14} strokeWidth={1.75} />
        Servicios MarketDesliz
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          style={{
            transition: `transform 0.3s ${T.ease}`,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-[300px] md:w-[340px] overflow-hidden z-50"
          style={{
            background: T.bg,
            border: `1px solid ${T.line}`,
            borderRadius: '8px',
            boxShadow:
              '0 1px 2px rgba(15,15,15,0.04), 0 12px 40px rgba(15,15,15,0.10)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid ${T.line}` }}
          >
            <p
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
            >
              Servicios oficiales
            </p>
            <p
              className="text-[11.5px] mt-1"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Ofrecidos directamente por MarketDesliz
            </p>
          </div>

          {/* Lista */}
          <div>
            {SERVICIOS_MARKETDESLIZ.map((servicio, idx) => {
              const Icon = servicio.icon;
              return (
                <ServiceDropdownItem
                  key={servicio.key}
                  servicio={servicio}
                  Icon={Icon}
                  isFirst={idx === 0}
                  onClick={() => {
                    setOpen(false);
                    onSelect(servicio);
                  }}
                />
              );
            })}
          </div>

          {/* Footer */}
          <button
            onClick={() => {
              setOpen(false);
              onVerTodos();
            }}
            className="w-full text-center text-[10.5px] uppercase tracking-[0.22em] py-3"
            style={{
              color: T.accent,
              fontWeight: 500,
              borderTop: `1px solid ${T.line}`,
              background: 'transparent',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Ver todos los servicios →
          </button>
        </div>
      )}
    </div>
  );
}

function ServiceDropdownItem({ servicio, Icon, isFirst, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
      style={{
        background: hover ? 'rgba(15,15,15,0.02)' : 'transparent',
        borderTop: isFirst ? 'none' : `1px solid ${T.line}`,
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      <div
        className="flex items-center justify-center shrink-0 transition-colors"
        style={{
          width: '36px',
          height: '36px',
          background: hover ? T.accent : 'rgba(79, 46, 232, 0.06)',
          borderRadius: '8px',
          transitionTimingFunction: T.ease,
        }}
      >
        <Icon
          size={16}
          strokeWidth={1.75}
          style={{ color: hover ? '#FFFFFF' : T.accent }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] leading-tight truncate"
          style={{ color: T.ink, fontWeight: 500 }}
        >
          {servicio.nombre}
        </p>
        <p
          className="text-[11.5px] truncate mt-0.5"
          style={{ color: T.inkSoft, fontWeight: 450 }}
        >
          {servicio.descripcion}
        </p>
      </div>
      <ChevronRight
        size={14}
        strokeWidth={1.75}
        style={{
          color: hover ? T.accent : T.inkGhost,
          transform: hover ? 'translateX(2px)' : 'translateX(0)',
          transition: `all 0.2s ${T.ease}`,
          flexShrink: 0,
        }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ServicioMDCard · card oficial MarketDesliz (sin gradiente, minimal)
// ─────────────────────────────────────────────────────────────────────────
function ServicioMDCard({ servicio, onClick }) {
  const [hover, setHover] = useState(false);
  const IconComponent = getIcon(servicio.categoria || servicio.nombre);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="cursor-pointer flex flex-col p-5 transition-all duration-300"
      style={{
        background: T.bg,
        border: `1px solid ${hover ? 'rgba(79, 46, 232, 0.3)' : T.line}`,
        borderRadius: '8px',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 1px 2px rgba(15,15,15,0.04), 0 8px 24px rgba(79,46,232,0.08)'
          : 'none',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center transition-colors"
          style={{
            width: '44px',
            height: '44px',
            background: hover ? T.accent : 'rgba(79, 46, 232, 0.06)',
            borderRadius: '8px',
            transitionTimingFunction: T.ease,
          }}
        >
          <IconComponent
            size={20}
            strokeWidth={1.75}
            style={{ color: hover ? '#FFFFFF' : T.accent }}
          />
        </div>

        <span
          className="inline-flex items-center gap-1 px-2 py-0.5"
          style={{
            background: 'rgba(79, 46, 232, 0.06)',
            color: T.accent,
            borderRadius: '4px',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: 600,
          }}
        >
          <BadgeCheck size={9} strokeWidth={2.5} /> Oficial
        </span>
      </div>

      <h3
        className="text-[16px] leading-snug mb-1"
        style={{ color: T.ink, fontWeight: 500 }}
      >
        {servicio.nombre}
      </h3>
      {servicio.descripcion && (
        <p
          className="text-[12.5px] leading-[1.55] line-clamp-2 mb-4 flex-1"
          style={{ color: T.inkSoft, fontWeight: 450 }}
        >
          {servicio.descripcion}
        </p>
      )}

      <div
        className="flex items-end justify-between pt-4 mt-auto"
        style={{ borderTop: `1px solid ${T.line}` }}
      >
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.18em] mb-1"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            Desde
          </p>
          <p
            className="text-[15px] tabular-nums"
            style={{
              color: T.ink,
              fontWeight: 500,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {servicio.precioBase > 0 ? formatMoney(servicio.precioBase) : 'Consultar'}
          </p>
        </div>
        <div
          className="flex items-center justify-center transition-colors"
          style={{
            width: '32px',
            height: '32px',
            background: hover ? T.accent : 'rgba(15, 15, 15, 0.04)',
            borderRadius: '50%',
            transitionTimingFunction: T.ease,
          }}
        >
          <ChevronRight
            size={14}
            strokeWidth={1.75}
            style={{
              color: hover ? '#FFFFFF' : T.inkMid,
              transform: hover ? 'translateX(1px)' : 'translateX(0)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ServicioCard · card de servicio individual
// ─────────────────────────────────────────────────────────────────────────
function ServicioCard({ servicio, isFavorite, onToggleFavorite, onClick }) {
  const [hover, setHover] = useState(false);
  const IconComponent = getIcon(servicio.categoria || servicio.nombre);

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
        {servicio.imagen ? (
          <img
            src={servicio.imagen}
            alt={servicio.nombre}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transitionTimingFunction: T.ease,
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconComponent size={40} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        {/* Favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          className="absolute top-3 right-3 flex items-center justify-center transition-all"
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

        {/* Verificado */}
        {servicio.verificado && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5"
            style={{
              background: 'rgba(79, 46, 232, 0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '4px',
            }}
          >
            <ShieldCheck size={10} strokeWidth={2} style={{ color: '#FFFFFF' }} />
            <span
              className="text-[9px] uppercase tracking-[0.15em]"
              style={{ color: '#FFFFFF', fontWeight: 600 }}
            >
              Verificado
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
          {servicio.nombre}
        </h3>

        {servicio.categoria && (
          <p
            className="text-[11px] uppercase tracking-[0.15em] truncate"
            style={{ color: T.inkFaint, fontWeight: 500 }}
          >
            {servicio.categoria}
          </p>
        )}

        {servicio.precioBase > 0 ? (
          <p
            className="text-[15px] tabular-nums tracking-[-0.01em] mt-0.5"
            style={{
              color: T.ink,
              fontWeight: 500,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {formatMoney(servicio.precioBase)}
            <span
              className="text-[11px] ml-1"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              / desde
            </span>
          </p>
        ) : (
          <p
            className="text-[13px] mt-0.5"
            style={{ color: T.accent, fontWeight: 500 }}
          >
            Consultar precio
          </p>
        )}

        {servicio.direccion && (
          <div className="flex items-start gap-1.5 mt-1">
            <MapPin
              size={11}
              strokeWidth={1.75}
              style={{ color: T.inkFaint, marginTop: 2, flexShrink: 0 }}
            />
            <span
              className="text-[11.5px] leading-[1.4] line-clamp-1"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              {servicio.direccion}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
export default function ServiciosPage() {
  const router = useRouter();

  const { user } = useAuth();

  const {
    search = '',
    categoria = 'todos',
    municipio = '',
    localidad = '',
  } = router.query;

  const [servicios, setServicios] = useState([]);
  const [serviciosMD, setServiciosMD] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [selectedCategoria, setSelectedCategoria] = useState(categoria || 'todos');
  const [selectedMunicipio, setSelectedMunicipio] = useState(municipio || '');
  const [selectedLocalidad, setSelectedLocalidad] = useState(localidad || '');
  const [showFilters, setShowFilters] = useState(false);
  const [municipios, setMunicipios] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  // Favoritos
  useEffect(() => {
    const saved = localStorage.getItem('servicios_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Municipios
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const estados = await getEstados();
        const veracruz = estados.find((e) => e.nombre === 'Veracruz');
        if (veracruz) {
          const municipiosData = await getMunicipios(veracruz.id);
          setMunicipios(municipiosData);
        }
      } catch (err) {
        console.error('Error cargando datos geográficos:', err);
      }
    };
    cargarDatosIniciales();
  }, []);

  // Localidades
  useEffect(() => {
    if (selectedMunicipio) {
      getLocalidades(selectedMunicipio)
        .then(setLocalidades)
        .catch(() => setLocalidades([]));
    } else {
      setLocalidades([]);
    }
  }, [selectedMunicipio]);

  // Cargar servicios
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      const [result, mdResult] = await Promise.all([
        getServicios({
          page: 1,
          perPage: 100,
          search: searchTerm,
          categoria: selectedCategoria,
          municipioId: selectedMunicipio,
          localidadId: selectedLocalidad,
          sort: 'orden, nombre',
          soloMarketDesliz: false,
        }),
        getServiciosMarketDesliz(),
      ]);

      setServicios(result.items);
      setServiciosMD(mdResult);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoria, selectedMunicipio, selectedLocalidad]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const actualizarURL = (overrides = {}) => {
    const next = {
      search: searchTerm,
      categoria: selectedCategoria !== 'todos' ? selectedCategoria : undefined,
      municipio: selectedMunicipio || undefined,
      localidad: selectedLocalidad || undefined,
      ...overrides,
    };
    Object.keys(next).forEach((key) => {
      if (next[key] === undefined || next[key] === '' || next[key] === 'todos') {
        if (key !== 'search') delete next[key];
        if (key === 'search' && !next[key]) delete next[key];
      }
    });
    router.push({ pathname: '/servicios', query: next }, undefined, { shallow: true });
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleCategoriaClick = (cat) => {
    const nueva = cat === selectedCategoria ? 'todos' : cat;
    setSelectedCategoria(nueva);
    actualizarURL({ categoria: nueva !== 'todos' ? nueva : undefined });
  };

  const handleMunicipioChange = (e) => {
    const value = e.target.value;
    setSelectedMunicipio(value);
    setSelectedLocalidad('');
    actualizarURL({ municipio: value || undefined, localidad: undefined });
  };

  const handleLocalidadChange = (e) => {
    const value = e.target.value;
    setSelectedLocalidad(value);
    actualizarURL({ localidad: value || undefined });
  };

  const handleServicioMDClick = (servicioMD) => {
    const rutas = {
      deslizmoto: '/servicios/deslizmoto',
      deslizfood: '/servicios/deslizfood',
      'encargos-vip': '/servicios/encargos-vip',
      publicidad: '/servicios/publicidad',
      invitaciones: '/servicios/invitaciones',
    };

    const ruta = rutas[servicioMD.key];
    if (ruta) {
      navigateTo(ruta);
      return;
    }

    setSelectedCategoria(servicioMD.categoria);
    actualizarURL({ categoria: servicioMD.categoria });
    setTimeout(() => {
      document
        .getElementById('servicios-grid')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleFavorite = (id) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem('servicios_favorites', JSON.stringify(newFavorites));
  };

  const navigateTo = (path) => router.push(path);

  const notifications = [
    { id: 1, title: '¡Nuevos servicios!', description: 'Descubre lo nuevo esta semana', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Head>
        <title>Servicios | MarketDesliz</title>
        <meta
          name="description"
          content="Encuentra profesionales y servicios de confianza en tu comunidad."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1">
          {/* ─── IMAGEN EDITORIAL ─────────────────────────── */}
          <section className="w-full">
            <div
              className="relative w-full overflow-hidden"
              style={{
                background: T.bg,
                aspectRatio: '1280 / 480',
                maxHeight: '520px',
              }}
            >
              <img
                src={HERO_IMAGE}
                alt="Servicios MarketDesliz"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: 'grayscale(100%) contrast(1.15) brightness(1.02)',
                  mixBlendMode: 'multiply',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </section>

          {/* ─── EDITORIAL HEADER ──────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-12 md:pb-16">
            <p
              className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] mb-6 md:mb-8"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Servicios · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Servicios de confianza,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                cerca de ti.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Encuentra profesionales verificados para tu hogar o negocio.
            </p>

            {/* Dropdown Servicios MarketDesliz */}
            <div className="mt-8">
              <ServiciosMDDropdown
                onSelect={handleServicioMDClick}
                onVerTodos={() => navigateTo('/servicios')}
              />
            </div>
          </section>

          {/* ─── SERVICIOS MARKETDESLIZ ────────────────────── */}
          {serviciosMD.length > 0 && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-20">
              <div className="mb-5">
                <p
                  className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-1"
                  style={{
                    color: T.accent,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Servicios MarketDesliz
                </p>
                <p
                  className="text-[13px]"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Servicios oficiales que ofrecemos para ti
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviciosMD.map((servicio) => (
                  <ServicioMDCard
                    key={servicio.id}
                    servicio={servicio}
                    onClick={() => navigateTo(`/servicios/${servicio.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ─── CATEGORÍAS POPULARES ──────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-20">
            <div className="flex items-baseline justify-between mb-5">
              <h2
                className="text-[10px] md:text-[11px] uppercase tracking-[0.22em]"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Categorías populares
              </h2>
              {selectedCategoria !== 'todos' && (
                <TextLink
                  label="Ver todas"
                  onClick={() => handleCategoriaClick('todos')}
                />
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {CATEGORIAS_BASICAS.map((cat) => {
                const isActive = selectedCategoria === cat.nombre;
                const handleClick = cat.esMasCategorias
                  ? () => navigateTo('/servicios')
                  : () => handleCategoriaClick(cat.nombre);
                return (
                  <CategoryCard
                    key={cat.nombre}
                    cat={cat}
                    isActive={isActive}
                    onClick={handleClick}
                  />
                );
              })}
            </div>
          </section>

          {/* ─── FILTROS ───────────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2
                className="text-[10px] md:text-[11px] uppercase tracking-[0.22em]"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                Buscar y filtrar
              </h2>
              <span
                className="text-[11px] tabular-nums"
                style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
              >
                {loading ? '…' : `${servicios.length} ${servicios.length === 1 ? 'resultado' : 'resultados'}`}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search
                    size={14}
                    strokeWidth={1.75}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: T.inkFaint }}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, categoría o ubicación..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => e.key === 'Enter' && actualizarURL()}
                    className="w-full pl-9 pr-4 outline-none transition-colors"
                    style={{
                      height: '42px',
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.ink,
                      fontSize: '13.5px',
                      fontWeight: 450,
                      letterSpacing: '-0.005em',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                  />
                </div>
              </div>

              <div className="hidden md:flex gap-3 items-center">
                <div className="min-w-[180px]">
                  <select
                    value={selectedMunicipio}
                    onChange={handleMunicipioChange}
                    className="w-full px-3 outline-none appearance-none"
                    style={{
                      height: '42px',
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontSize: '13px',
                      fontWeight: 450,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Todos los municipios</option>
                    {municipios.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[180px]">
                  <select
                    value={selectedLocalidad}
                    onChange={handleLocalidadChange}
                    disabled={!selectedMunicipio}
                    className="w-full px-3 outline-none appearance-none disabled:opacity-40"
                    style={{
                      height: '42px',
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontSize: '13px',
                      fontWeight: 450,
                      cursor: selectedMunicipio ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <option value="">Todas las localidades</option>
                    {localidades.map((l) => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center justify-center gap-2"
                style={{
                  height: '42px',
                  padding: '0 16px',
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontSize: '13px',
                  fontWeight: 450,
                  WebkitTapHighlightColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Filter size={14} strokeWidth={1.75} />
                Filtros
              </button>
            </div>

            {showFilters && (
              <div
                className="md:hidden mt-4 p-5 flex flex-col gap-4"
                style={{
                  background: 'rgba(15, 15, 15, 0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <div>
                  <span
                    className="block text-[10px] uppercase tracking-[0.22em] mb-2"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Municipio
                  </span>
                  <select
                    value={selectedMunicipio}
                    onChange={handleMunicipioChange}
                    className="w-full px-3 outline-none"
                    style={{
                      height: '42px',
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.ink,
                      fontSize: '13px',
                    }}
                  >
                    <option value="">Todos los municipios</option>
                    {municipios.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span
                    className="block text-[10px] uppercase tracking-[0.22em] mb-2"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Localidad
                  </span>
                  <select
                    value={selectedLocalidad}
                    onChange={handleLocalidadChange}
                    disabled={!selectedMunicipio}
                    className="w-full px-3 outline-none disabled:opacity-40"
                    style={{
                      height: '42px',
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.ink,
                      fontSize: '13px',
                    }}
                  >
                    <option value="">Todas las localidades</option>
                    {localidades.map((l) => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full text-white text-[13px]"
                  style={{
                    height: '42px',
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    WebkitTapHighlightColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Aplicar filtros
                </button>
              </div>
            )}
          </section>

          {/* ─── SERVICIOS DESTACADOS ──────────────────────── */}
          <section id="servicios-grid" className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div className="flex items-baseline justify-between mb-5">
              <h2
                className="text-[10px] md:text-[11px] uppercase tracking-[0.22em]"
                style={{
                  color: T.inkFaint,
                  fontWeight: 500,
                  fontFeatureSettings: '"ss01"',
                }}
              >
                {selectedCategoria !== 'todos'
                  ? `Servicios · ${selectedCategoria}`
                  : 'Servicios destacados'}
              </h2>
              <TextLink label="Ver todos" onClick={() => navigateTo('/servicios')} />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: T.line, borderTopColor: T.accent }}
                />
              </div>
            ) : servicios.length === 0 ? (
              <p className="text-[13px] py-8" style={{ color: T.inkFaint }}>
                No hay servicios disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {servicios.slice(0, 8).map((servicio) => (
                  <ServicioCard
                    key={servicio.id}
                    servicio={servicio}
                    isFavorite={favorites.includes(servicio.id)}
                    onToggleFavorite={() => toggleFavorite(servicio.id)}
                    onClick={() => navigateTo(`/servicios/${servicio.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ─── BANNER · Ofrecer servicio ─────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10"
              style={{
                background: 'rgba(79, 46, 232, 0.04)',
                border: '1px solid rgba(79, 46, 232, 0.12)',
                borderRadius: '8px',
              }}
            >
              <div className="max-w-xl">
                <p
                  className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-3"
                  style={{
                    color: T.accent,
                    fontWeight: 500,
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  Profesionales
                </p>
                <h3
                  className="text-[22px] md:text-[28px] leading-[1.15] tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  ¿Ofreces algún servicio?
                </h3>
                <p
                  className="text-[13.5px] md:text-[15px] leading-[1.55] mt-2"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Regístralo y llega a más clientes en tu comunidad. Sin comisiones por registro.
                </p>
              </div>

              <button
                onClick={() => navigateTo('/servicios/registro')}
                className="shrink-0 px-6 h-11 text-white text-[13px] transition-colors"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Registrar servicio →
              </button>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family: ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino', Georgia, 'Times New Roman', serif;
        }
        ::selection { background: rgba(79, 46, 232, 0.12); color: #0F0F0F; }
        * { -webkit-tap-highlight-color: transparent; font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1; }
      `}</style>
    </>
  );
}