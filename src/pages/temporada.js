// src/pages/temporada.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Sun, Snowflake, Sparkles, Star, ChevronRight, ChevronLeft,
  Mail, Phone, MapPin, Archive, Crown, ArrowRight
} from 'lucide-react';
import pb from '../lib/pocketbase';

// ─── DATA: Temporadas ÉSHÉ ────────────────────────────────
const TEMPORADAS = [
  {
    id: 'ss26',
    nombre: 'SS 26',
    fullName: 'Primavera · Verano 2026',
    descripcion: 'Ligereza, luz y siluetas fluidas',
    icono: Sun,
    value: 'Primavera-Verano',
  },
  {
    id: 'fw26',
    nombre: 'FW 26',
    fullName: 'Otoño · Invierno 2026',
    descripcion: 'Capas profundas, texturas y estructura',
    icono: Snowflake,
    value: 'Otoño-Invierno',
  },
  {
    id: 'todo-ano',
    nombre: 'Atemporal',
    fullName: 'Piezas permanentes',
    descripcion: 'Atemporales, siempre vigentes',
    icono: Archive,
    value: 'Todo el año',
  },
  {
    id: 'nuevo',
    nombre: 'Nuevas',
    fullName: 'Recién llegadas',
    descripcion: 'Lo último en llegar a la maison',
    icono: Sparkles,
  },
  {
    id: 'ediciones',
    nombre: 'Ediciones',
    fullName: 'Ediciones Limitadas',
    descripcion: 'Pocas piezas, numeradas',
    icono: Crown,
  },
  {
    id: 'mas-vendidos',
    nombre: 'Icónicas',
    fullName: 'Las más queridas',
    descripcion: 'Favoritas de la maison',
    icono: Star,
  },
];

// ─── DATA: Categorías de moda ─────────────────────────────
const CATEGORIAS = [
  'todos',
  'Vestidos',
  'Faldas',
  'Blazers',
  'Camisas',
  'Pantalones',
  'Chamarras',
  'Abrigos',
  'Suéteres',
  'Accesorios',
  'Calzado',
  'Bolsos',
];

export default function TemporadaEshePage() {
  const router = useRouter();
  const { tipo } = router.query;

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [temporadaActual, setTemporadaActual] = useState('ss26');

  // ─── Efectos ─────────────────────────────────────────────
  useEffect(() => {
    determinarTemporada();
  }, [tipo]);

  useEffect(() => {
    cargarProductos();
  }, [temporadaActual, categoriaSeleccionada]);

  // ─── Determinación de temporada ─────────────────────────
  const determinarTemporada = () => {
    if (tipo && TEMPORADAS.find(t => t.id === tipo)) {
      setTemporadaActual(tipo);
      return;
    }
    const mesActual = new Date().getMonth(); // 0-11
    setTemporadaActual(mesActual >= 3 && mesActual <= 8 ? 'ss26' : 'fw26');
  };

  // ─── Cargar productos desde eshe_parallel ───────────────
  const cargarProductos = async () => {
    try {
      setLoading(true);

      let filter = 'activo = true';

      if (categoriaSeleccionada !== 'todos') {
        filter += ` && categoria = "${categoriaSeleccionada}"`;
      }

      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);

      switch (temporadaActual) {
        case 'ss26':
          filter += ` && (temporada = "Primavera-Verano" || temporada = "Todo el año")`;
          break;
        case 'fw26':
          filter += ` && (temporada = "Otoño-Invierno" || temporada = "Todo el año")`;
          break;
        case 'todo-ano':
          filter += ` && temporada = "Todo el año"`;
          break;
        case 'nuevo':
          filter += ` && created >= "${hace30Dias.toISOString()}"`;
          break;
        case 'ediciones':
          filter += ` && edicionLimitada = true`;
          break;
        case 'mas-vendidos':
          break;
        default:
          break;
      }

      let sortField = '-created';
      if (temporadaActual === 'mas-vendidos') {
        sortField = '-calificacion,-visitas';
      }

      let productosData = await pb.collection('eshe_parallel').getFullList({
        filter,
        sort: sortField,
      });

      if (temporadaActual === 'mas-vendidos') {
        productosData = productosData.slice(0, 12);
      }

      setProductos(productosData);

    } catch (error) {
      console.error('Error cargando piezas:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const getTemporadaInfo = () => {
    return TEMPORADAS.find(t => t.id === temporadaActual) || TEMPORADAS[0];
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getImageUrl = (pieza) => {
    if (!pieza.imagen) return null;
    try {
      const img = Array.isArray(pieza.imagen) ? pieza.imagen[0] : pieza.imagen;
      if (!img) return null;
      return pb.files.getURL(pieza, img);
    } catch (e) {
      return null;
    }
  };

  const temporadaInfo = getTemporadaInfo();
  const TemporadaIcon = temporadaInfo.icono;

  // ─── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Head>
          <title>Cargando | ÉSHÉ PARALLEL</title>
        </Head>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border border-white/20 border-t-gold rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">Cargando piezas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <Head>
        <title>{temporadaInfo.fullName} | ÉSHÉ PARALLEL</title>
        <meta
          name="description"
          content={`${temporadaInfo.fullName}. ${temporadaInfo.descripcion} — ÉSHÉ PARALLEL. Una pieza. Pocas veces.`}
        />
      </Head>

      {/* ═══════════════════════════════════════════════════ */}
      {/* BOTÓN FLOTANTE "VOLVER" (esquina sup. izquierda)     */}
      {/* ═══════════════════════════════════════════════════ */}
      <Link
        href="/eshe-parallel"
        className="fixed top-6 left-6 z-50 p-2.5 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-gold/50 transition-all group"
        aria-label="Volver a ÉSHÉ Parallel"
      >
        <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-gold transition-colors" />
      </Link>

      {/* Marca flotante superior derecha */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2">
        <span className="text-base font-light tracking-[0.1em] text-white">ÉP</span>
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 hidden sm:inline">
          Éshé Parallel
        </span>
      </div>

      <main className="flex-1">

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO EDITORIAL ÉP                                    */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="relative border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_4775d5bbe9_8498d31e5d11f368.png"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 pt-28 sm:pt-32 pb-20 sm:pb-28">
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.4em] text-gold">
                  ÉSHÉ PARALLEL
                </span>
                <div className="h-[1px] w-16 bg-white/20" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                  {temporadaInfo.nombre}
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl font-black uppercase leading-[0.95] tracking-tighter italic text-white">
                {temporadaActual === 'ss26' && <>Spring ·<br />Summer 26</>}
                {temporadaActual === 'fw26' && <>Fall ·<br />Winter 26</>}
                {temporadaActual === 'todo-ano' && <>Piezas<br />Atemporales</>}
                {temporadaActual === 'nuevo' && <>Recién<br />Llegadas</>}
                {temporadaActual === 'ediciones' && <>Ediciones<br />Limitadas</>}
                {temporadaActual === 'mas-vendidos' && <>Las<br />Icónicas</>}
              </h1>

              <p className="text-lg sm:text-xl font-serif italic text-white/70 max-w-xl leading-relaxed">
                {temporadaInfo.descripcion}
              </p>

              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 pt-4">
                {productos.length} {productos.length === 1 ? 'pieza disponible' : 'piezas disponibles'}
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SELECTOR EDITORIAL DE TEMPORADAS                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-b border-white/10 sticky top-0 z-40 bg-black/90 backdrop-blur-md">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-5 overflow-x-auto">
            <div className="flex gap-8 min-w-max">
              {TEMPORADAS.map((temp) => {
                const isActive = temporadaActual === temp.id;
                return (
                  <button
                    key={temp.id}
                    onClick={() => {
                      setTemporadaActual(temp.id);
                      router.push(`/temporada?tipo=${temp.id}`, undefined, { shallow: true });
                    }}
                    className={`text-[10px] uppercase tracking-[0.3em] font-medium transition-all whitespace-nowrap pb-1 border-b ${
                      isActive
                        ? 'text-gold border-gold'
                        : 'text-white/40 border-transparent hover:text-white/80'
                    }`}
                  >
                    {temp.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* BANNER DE TEMPORADA ACTIVA                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-10">
            <div className="flex flex-wrap items-center justify-between gap-6 border border-gold/30 bg-gradient-to-r from-gold/5 to-transparent p-6 sm:p-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 border border-gold/40 flex items-center justify-center shrink-0">
                  <TemporadaIcon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-gold mb-1">
                    Colección Activa
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                    {temporadaInfo.fullName}
                  </h2>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                {productos.length} piezas
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FILTRO DE CATEGORÍAS                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                Filtrar por
              </span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => {
                const isActive = categoriaSeleccionada === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all ${
                      isActive
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                    }`}
                  >
                    {cat === 'todos' ? 'Todas las piezas' : cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* GRID DE PIEZAS                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="bg-black">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16">

            {productos.length === 0 ? (
              <div className="text-center py-24 border border-white/10 bg-[#0a0a0a]">
                <div className="w-16 h-16 border border-white/20 flex items-center justify-center mx-auto mb-6">
                  <Archive className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-3">
                  Archivo
                </p>
                <h3 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
                  Sin piezas disponibles
                </h3>
                <p className="text-sm font-serif italic text-white/50 mb-8 max-w-md mx-auto">
                  Pronto llegarán nuevas piezas a esta colección.
                </p>
                <Link
                  href="/catalogos"
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold hover:text-white transition-colors"
                >
                  Ver todas las colecciones <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-4">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                    {categoriaSeleccionada === 'todos' ? 'Todas las piezas' : categoriaSeleccionada}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                    {productos.length} {productos.length === 1 ? 'pieza' : 'piezas'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                  {productos.map((pieza) => {
                    const esNuevo = temporadaActual === 'nuevo';
                    const esEdicionLimitada = pieza.edicionLimitada || temporadaActual === 'ediciones';
                    const esMasVendido = temporadaActual === 'mas-vendidos';

                    return (
                      <Link
                        key={pieza.id}
                        href={`/eshe-parallel/${pieza.id}`}
                        className="group cursor-pointer space-y-4 block"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#0f0f0f] border border-white/10">
                          {pieza.imagen ? (
                            <img
                              src={getImageUrl(pieza)}
                              alt={pieza.nombre || 'Pieza'}
                              className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <TemporadaIcon className="w-12 h-12 text-white/20" />
                            </div>
                          )}

                          {(esNuevo || esEdicionLimitada || esMasVendido) && (
                            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                              {esNuevo && (
                                <span className="text-[8px] uppercase tracking-[0.2em] bg-gold text-black px-2 py-1 font-bold">
                                  Nuevo
                                </span>
                              )}
                              {esEdicionLimitada && !esNuevo && (
                                <span className="text-[8px] uppercase tracking-[0.2em] bg-black border border-gold text-gold px-2 py-1 font-bold">
                                  Edición Limitada
                                </span>
                              )}
                              {esMasVendido && (
                                <span className="text-[8px] uppercase tracking-[0.2em] bg-white text-black px-2 py-1 font-bold">
                                  Icónica
                                </span>
                              )}
                            </div>
                          )}

                          {pieza.sku && (
                            <span className="absolute top-3 right-3 text-[8px] uppercase tracking-[0.2em] text-white/60">
                              {pieza.sku}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-gold">
                              ÉP
                            </span>
                            <div className="h-[1px] flex-1 bg-white/10" />
                            {pieza.coleccion && (
                              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 truncate">
                                {pieza.coleccion}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold uppercase tracking-wide text-white group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                            {pieza.nombre || 'Sin nombre'}
                          </h3>

                          <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                            {pieza.categoria || 'General'}
                            {pieza.subcategoria && ` · ${pieza.subcategoria}`}
                          </p>

                          <div className="flex items-end justify-between pt-2 border-t border-white/10">
                            <div>
                              <p className="text-base font-black text-white">
                                {formatMoney(pieza.precio)}
                              </p>
                              {pieza.precioAnterior && pieza.precioAnterior > pieza.precio && (
                                <p className="text-[10px] text-white/30 line-through">
                                  {formatMoney(pieza.precioAnterior)}
                                </p>
                              )}
                            </div>
                            {pieza.stock !== undefined && (
                              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                                {pieza.stock} {pieza.stock === 1 ? 'pza' : 'pzas'}
                              </span>
                            )}
                          </div>

                          <button className="text-[9px] uppercase tracking-[0.3em] font-bold flex items-center gap-2 text-white/60 hover:text-gold transition-colors pt-1">
                            Descubrir
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {productos.length > 0 && (
              <div className="flex justify-center pt-16">
                <Link
                  href="/eshe-parallel"
                  className="text-[10px] uppercase tracking-[0.4em] font-bold border-b border-white/40 hover:border-gold pb-2 flex items-center gap-2 text-white/60 hover:text-gold transition-colors"
                >
                  Ver la colección completa <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* NEWSLETTER ÉP                                        */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="border-t border-white/10 bg-[#0a0a0a]">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="h-[1px] w-16 bg-white/20" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-gold">
                  The Parallel List
                </span>
                <div className="h-[1px] w-16 bg-white/20" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic text-white">
                Acceso anticipado
              </h2>

              <p className="text-sm font-serif italic text-white/60 max-w-lg mx-auto">
                Recibe nuestras ediciones limitadas antes que nadie. Piezas numeradas, historias únicas.
              </p>

              <div className="flex max-w-md mx-auto gap-2 mt-8">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  className="flex-1 bg-transparent border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
                />
                <button className="bg-gold text-black px-6 py-3 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white transition-colors">
                  Suscribir
                </button>
              </div>

              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 pt-2">
                Una pieza. Pocas veces.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FOOTER EDITORIAL                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <footer className="border-t border-white/10 bg-black">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="col-span-1 md:col-span-1">
                <div className="space-y-4">
                  <span className="text-4xl font-light tracking-[0.1em] text-white">ÉP</span>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                    ÉSHÉ PARALLEL
                  </p>
                  <p className="text-xs font-serif italic text-white/50 leading-relaxed pt-2">
                    Una pieza. Pocas veces.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white mb-5">
                  Colección
                </h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Temporada actual', href: '/temporada' },
                    { label: 'Todas las piezas', href: '/eshe-parallel' },
                    { label: 'Ediciones limitadas', href: '/temporada?tipo=ediciones' },
                    { label: 'Catálogos', href: '/catalogos' },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs uppercase tracking-[0.15em] text-white/50 hover:text-gold transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white mb-5">
                  Maison
                </h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Ayuda', href: '/ayuda' },
                    { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
                    { label: 'Términos', href: '/terminos' },
                    { label: 'Privacidad', href: '/privacidad' },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs uppercase tracking-[0.15em] text-white/50 hover:text-gold transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white mb-5">
                  Contacto
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Phone className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50">28 2141 4939</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50">marketdesliz@gmail.com</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="w-3 h-3 text-gold mt-0.5 shrink-0" />
                    <span className="text-xs text-white/50">Ciudad de México</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                  © {new Date().getFullYear()} ÉSHÉ PARALLEL · MarketDesliz
                </p>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
                  Desliza · Descubre · Conecta
                </p>
              </div>
            </div>
          </div>
        </footer>

      </main>

      {/* Line-clamp helpers */}
      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}