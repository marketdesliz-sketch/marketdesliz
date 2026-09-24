// src/pages/negocios/index.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Store, Search, Filter, Phone, MessageCircle, MapPin, Clock,
  Building2, Map, ArrowRight, Grid2X2,
  ShoppingBag, Watch, Plane, Utensils, Scissors, Coffee, Beef,
  Key, Monitor, HeartPulse, Cake, Sparkles, Pill, Wrench, Flower,
  Apple, IceCream, Printer, Gem, Shirt, Sandwich, Pen, Fish,
  Drumstick, Car, ChefHat, Tv, Dog, Footprints, Tag,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';
import {
  getNegocios,
  getMunicipios,
  getLocalidades,
  getEstados,
} from '../../lib/negociosService';

// ═════════════════════════════════════════════════════════════════════════
// IMAGEN EDITORIAL DEL HERO · LOCAL
// Guárdala en: /public/images/negocios-hero.jpg
// ═════════════════════════════════════════════════════════════════════════
const HERO_IMAGE = '/images/negocios-hero.jpg';

// ─────────────────────────────────────────────────────────────────────────
// Mapa de íconos por categoría · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const iconMap = {
  'todos': Store,
  'abarrotes': ShoppingBag,
  'accesorios': Watch,
  'agencia de viajes': Plane,
  'antojitos': Utensils,
  'barbería': Scissors,
  'boutique': ShoppingBag,
  'cafetería': Coffee,
  'carnicería': Beef,
  'cerrajería': Key,
  'ciber': Monitor,
  'consultorio médico': HeartPulse,
  'dulcería': Cake,
  'estética': Sparkles,
  'farmacia': Pill,
  'ferretería': Wrench,
  'florería': Flower,
  'frutería / verdulería': Apple,
  'heladería': IceCream,
  'imprenta': Printer,
  'joyería': Gem,
  'lavandería': Shirt,
  'lonchería': Sandwich,
  'papelería': Pen,
  'panadería': Cake,
  'pastelería': Cake,
  'peluquería': Scissors,
  'pescadería': Fish,
  'pollería': Drumstick,
  'refaccionaria': Car,
  'restaurante': ChefHat,
  'taquería': Utensils,
  'taller mecánico': Wrench,
  'taller de costura': Scissors,
  'tienda de ropa': Shirt,
  'tienda de electrónicos': Tv,
  'tortillería': Utensils,
  'veterinaria': Dog,
  'zapatería': Footprints,
};

const getIcon = (nombre) => {
  const lower = (nombre || '').toLowerCase().trim();
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
  { nombre: 'Abarrotes', icon: ShoppingBag },
  { nombre: 'Restaurante', icon: ChefHat },
  { nombre: 'Farmacia', icon: Pill },
  { nombre: 'Ferretería', icon: Wrench },
  { nombre: 'Estética', icon: Sparkles },
  { nombre: 'Más categorías', icon: Grid2X2, esMasCategorias: true },
];

// ─────────────────────────────────────────────────────────────────────────
// TextLink · link de texto puro
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
// CategoryCard · minimalista (idéntico al de productos)
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
// FieldLabel · label minimalista para inputs
// ─────────────────────────────────────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <span
      className="block text-[10px] uppercase tracking-[0.22em] mb-2"
      style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// NegocioCard · minimalista con acciones WhatsApp / Llamar / Mapa
// ─────────────────────────────────────────────────────────────────────────
function NegocioCard({ negocio }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getImageUrl = () => {
    if (negocio.logo) {
      return pb.files.getURL(negocio, negocio.logo);
    }
    return null;
  };

  const estaAbierto = () => {
    if (!negocio.horario) return null;
    const horaActual = new Date().getHours();
    return horaActual >= 9 && horaActual <= 18;
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (negocio.whatsapp) {
      let whatsappNumber = negocio.whatsapp.replace(/\D/g, '');
      if (!whatsappNumber.startsWith('52') && whatsappNumber.length === 10) {
        whatsappNumber = '52' + whatsappNumber;
      }
      window.open(
        `https://wa.me/${whatsappNumber}?text=Hola,%20vi%20tu%20negocio%20en%20MarketDesliz`,
        '_blank'
      );
    }
  };

  const handleCall = (e) => {
    e.stopPropagation();
    if (negocio.telefono) {
      window.location.href = `tel:${negocio.telefono.replace(/\D/g, '')}`;
    }
  };

  const handleOpenMaps = (e) => {
    e.stopPropagation();
    const query = negocio.ubicacion || negocio.direccion;
    if (query) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const isOpen = estaAbierto();

  return (
    <div
      onClick={() => router.push(`/negocios/${negocio.id}`)}
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
      {/* Imagen / Logo */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: 'rgba(15, 15, 15, 0.03)' }}
      >
        {getImageUrl() ? (
          <img
            src={getImageUrl()}
            alt={negocio.nombre}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transitionTimingFunction: T.ease,
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={40} strokeWidth={1.5} style={{ color: T.inkGhost }} />
          </div>
        )}

        {/* Badge Aliado */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1"
          style={{
            background: T.accent,
            borderRadius: '4px',
          }}
        >
          <Building2 size={10} strokeWidth={2} style={{ color: '#FFFFFF' }} />
          <span
            className="text-[9px] uppercase tracking-[0.15em]"
            style={{ color: '#FFFFFF', fontWeight: 600 }}
          >
            Aliado
          </span>
        </div>

        {/* Indicador abierto / cerrado */}
        {negocio.horario && (
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1"
            style={{
              background: isOpen ? 'rgba(26, 127, 75, 0.92)' : 'rgba(197, 48, 48, 0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '4px',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#FFFFFF' }}
            />
            <span
              className="text-[9px] uppercase tracking-[0.15em]"
              style={{ color: '#FFFFFF', fontWeight: 600 }}
            >
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-4 flex flex-col gap-3 flex-1">
        {/* Nombre + categoría */}
        <div>
          <h3
            className="text-[15px] leading-snug tracking-[-0.005em] truncate"
            style={{ color: T.ink, fontWeight: 500 }}
          >
            {negocio.nombre}
          </h3>
          {negocio.categoria && (
            <p
              className="text-[11px] uppercase tracking-[0.15em] mt-1 truncate"
              style={{ color: T.inkFaint, fontWeight: 500 }}
            >
              {negocio.categoria}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <MapPin size={12} strokeWidth={1.75} style={{ color: T.inkFaint, marginTop: '2px', flexShrink: 0 }} />
            <span
              className="text-[12px] leading-[1.5] line-clamp-2"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              {negocio.direccion || 'Dirección no disponible'}
            </span>
          </div>

          {negocio.telefono && (
            <div className="flex items-center gap-2">
              <Phone size={12} strokeWidth={1.75} style={{ color: T.inkFaint, flexShrink: 0 }} />
              <span
                className="text-[12px] tabular-nums"
                style={{ color: T.inkSoft, fontWeight: 450, fontFeatureSettings: '"tnum"' }}
              >
                {formatPhone(negocio.telefono)}
              </span>
            </div>
          )}

          {negocio.horario && (
            <div className="flex items-center gap-2">
              <Clock size={12} strokeWidth={1.75} style={{ color: T.inkFaint, flexShrink: 0 }} />
              <span
                className="text-[12px] line-clamp-1"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {negocio.horario}
              </span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mt-1">
          {negocio.telefono && (
            <ActionButton
              icon={Phone}
              label="Llamar"
              onClick={handleCall}
              variant="neutral"
            />
          )}
          {negocio.whatsapp && (
            <ActionButton
              icon={MessageCircle}
              label="WhatsApp"
              onClick={handleWhatsApp}
              variant="whatsapp"
            />
          )}
          <ActionButton
            icon={Map}
            label=""
            onClick={handleOpenMaps}
            variant="accent"
            square
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ActionButton · botón de acción de la card
// ─────────────────────────────────────────────────────────────────────────
function ActionButton({ icon: Icon, label, onClick, variant = 'neutral', square = false }) {
  const [hover, setHover] = useState(false);

  const colors = {
    neutral: {
      bg: hover ? 'rgba(15,15,15,0.06)' : 'rgba(15,15,15,0.03)',
      color: hover ? T.ink : T.inkMid,
    },
    whatsapp: {
      bg: hover ? '#15803D' : '#1A7F4B',
      color: '#FFFFFF',
    },
    accent: {
      bg: hover ? T.accentDeep : T.accent,
      color: '#FFFFFF',
    },
  };

  const c = colors[variant];

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`flex items-center justify-center gap-1.5 transition-all duration-200 ${square ? '' : 'flex-1'}`}
      style={{
        height: '34px',
        paddingLeft: square ? 0 : '10px',
        paddingRight: square ? 0 : '10px',
        width: square ? '34px' : 'auto',
        background: c.bg,
        color: c.color,
        borderRadius: '6px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      aria-label={label || 'Acción'}
    >
      <Icon size={13} strokeWidth={2} />
      {label && (
        <span
          className="text-[11.5px]"
          style={{ fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────
export default function NegociosPage() {
  const router = useRouter();

  const {
    search = '',
    categoria = 'todos',
    municipio = '',
    localidad = '',
  } = router.query;

  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [selectedCategoria, setSelectedCategoria] = useState(categoria || 'todos');
  const [selectedMunicipio, setSelectedMunicipio] = useState(municipio || '');
  const [selectedLocalidad, setSelectedLocalidad] = useState(localidad || '');
  const [showFilters, setShowFilters] = useState(false);

  const [municipios, setMunicipios] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  const categorias = [
    'todos',
    'Abarrotes', 'Accesorios', 'Agencia de viajes', 'Antojitos',
    'Barbería', 'Boutique', 'Cafetería', 'Carnicería', 'Cerrajería',
    'Ciber', 'Consultorio médico', 'Dulcería', 'Estética', 'Farmacia',
    'Ferretería', 'Florería', 'Frutería / verdulería', 'Heladería',
    'Imprenta', 'Joyería', 'Lavandería', 'Lonchería', 'Papelería',
    'Panadería', 'Pastelería', 'Peluquería', 'Pescadería', 'Pollería',
    'Refaccionaria', 'Restaurante', 'Taquería', 'Taller mecánico',
    'Taller de costura', 'Tienda de ropa', 'Tienda de electrónicos',
    'Tortillería', 'Veterinaria', 'Zapatería',
  ];

  // Cargar municipios al iniciar · SIN CAMBIOS
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

  // Cargar localidades cuando cambia el municipio · SIN CAMBIOS
  useEffect(() => {
    if (selectedMunicipio) {
      getLocalidades(selectedMunicipio)
        .then(setLocalidades)
        .catch(() => setLocalidades([]));
    } else {
      setLocalidades([]);
    }
  }, [selectedMunicipio]);

  // Cargar negocios · SIN CAMBIOS
  const cargarNegocios = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getNegocios({
        page: 1,
        perPage: 100,
        search: searchTerm,
        categoria: selectedCategoria,
        municipioId: selectedMunicipio,
        localidadId: selectedLocalidad,
        sort: 'orden, nombre',
      });

      setNegocios(result.items);
    } catch (error) {
      console.error('Error cargando negocios:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategoria, selectedMunicipio, selectedLocalidad]);

  useEffect(() => {
    cargarNegocios();
  }, [cargarNegocios]);

  // Sincronizar filtros con URL · SIN CAMBIOS
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
    router.push({ pathname: '/negocios', query: next }, undefined, { shallow: true });
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

  const notifications = [
    { id: 1, title: '¡Nuevos negocios!', description: 'Descubre los locales de tu zona', time: 'Hace 2 horas', read: false },
    { id: 2, title: '¡Bienvenido!', description: 'Completa tu registro para empezar', time: 'Hace 5 horas', read: false },
  ];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const navigateTo = (path) => router.push(path);

  return (
    <>
      <Head>
        <title>Negocios Locales | MarketDesliz</title>
        <meta
          name="description"
          content="Descubre los negocios locales que confían en MarketDesliz. Encuentra tiendas, servicios y más en tu comunidad."
        />
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        {/* ═══ BOTÓN RETROCESO ═══ */}
        <BackButton fallback="/" />

        {/* ═══ BARRA TERMINAL ═══ */}
        <TerminalBar mode="rotating" />

        {/* ═══ HEADER ═══ */}
        <Header notifications={notifications} unreadCount={unreadCount} />

        {/* ═══ MAIN ═══ */}
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
                alt="Negocios locales MarketDesliz"
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
              Negocios · MarketDesliz
            </p>

            <h1
              className="text-[40px] md:text-[72px] leading-[0.98] tracking-[-0.035em] max-w-3xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Negocios locales,<br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                en tu comunidad.
              </span>
            </h1>

            <p
              className="text-[18px] md:text-[24px] leading-[1.4] tracking-[-0.015em] mt-5 md:mt-6 max-w-xl"
              style={{ color: T.inkSoft, fontWeight: 400 }}
            >
              Apoya a los negocios de tu zona. Encuéntralos y contáctalos directo.
            </p>
          </section>

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
                  ? () => navigateTo('/negocios')
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

          {/* ─── FILTROS · Buscador + ubicación ────────────── */}
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
                {loading ? '…' : `${negocios.length} ${negocios.length === 1 ? 'resultado' : 'resultados'}`}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              {/* Buscador */}
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
                    onFocus={(e) => (e.currentTarget.style.borderColor = T.lineStrong || 'rgba(15,15,15,0.2)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                  />
                </div>
              </div>

              {/* Filtros desktop */}
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

              {/* Botón filtros mobile */}
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
                }}
              >
                <Filter size={14} strokeWidth={1.75} />
                Filtros
              </button>
            </div>

            {/* Filtros mobile */}
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
                  <FieldLabel>Municipio</FieldLabel>
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
                  <FieldLabel>Localidad</FieldLabel>
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
                  }}
                >
                  Aplicar filtros
                </button>
              </div>
            )}
          </section>

          {/* ─── LISTA DE NEGOCIOS ─────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            {loading ? (
              <div className="flex justify-center py-20">
                <div
                  className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: T.line,
                    borderTopColor: T.accent,
                  }}
                />
              </div>
            ) : negocios.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
                style={{
                  background: 'rgba(15, 15, 15, 0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <Search size={32} strokeWidth={1.5} style={{ color: T.inkGhost, marginBottom: '16px' }} />
                <h3
                  className="text-[15px] mb-1"
                  style={{ color: T.ink, fontWeight: 500 }}
                >
                  No se encontraron negocios
                </h3>
                <p
                  className="text-[13px] max-w-md"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Intenta con otra búsqueda o cambia la categoría.
                </p>

                <div
                  className="mt-8 p-5 max-w-md w-full text-left"
                  style={{
                    background: 'rgba(79, 46, 232, 0.04)',
                    border: `1px solid rgba(79, 46, 232, 0.12)`,
                    borderRadius: '8px',
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-2"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    ¿Eres dueño de un negocio?
                  </p>
                  <p
                    className="text-[13px] leading-[1.55]"
                    style={{ color: T.inkSoft, fontWeight: 450 }}
                  >
                    Regístralo y actívalo con tu primera compra en MarketDesliz
                    para aparecer aquí.
                  </p>
                  <Link
                    href="/negocios/registro"
                    className="inline-block mt-3 text-[12.5px]"
                    style={{ color: T.accent, fontWeight: 500 }}
                  >
                    Registrar mi negocio →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {negocios.map((negocio) => (
                  <NegocioCard key={negocio.id} negocio={negocio} />
                ))}
              </div>
            )}
          </section>

          {/* ─── BANNER CTA · ¿Eres negocio? ───────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16 md:pb-24">
            <div
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10"
              style={{
                background: 'rgba(79, 46, 232, 0.04)',
                border: `1px solid rgba(79, 46, 232, 0.12)`,
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
                  Red de aliados
                </p>
                <h3
                  className="text-[22px] md:text-[28px] leading-[1.15] tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  ¿Eres dueño de un negocio?
                </h3>
                <p
                  className="text-[13.5px] md:text-[15px] leading-[1.55] mt-2"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Únete a nuestra red de negocios aliados. Aparecerás aquí y en
                  las recomendaciones para clientes de tu zona.
                </p>
              </div>

              <button
                onClick={() => navigateTo('/negocios/registro')}
                className="shrink-0 px-6 h-11 text-white text-[13px] transition-colors duration-200"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Registrar negocio →
              </button>
            </div>
          </section>
        </main>

        {/* ═══ FOOTER público ═══ */}
        <Footer />
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        body {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display',
            'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family:
            ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino',
            Georgia, 'Times New Roman', serif;
        }
        ::selection {
          background: rgba(79, 46, 232, 0.12);
          color: #0F0F0F;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
      `}</style>
    </>
  );
}