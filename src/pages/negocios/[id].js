// src/pages/negocios/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Store, MapPin, Phone, MessageCircle, Clock, Star, Share2,
  CheckCircle, Building2, Calendar, Eye, ThumbsUp, Flag,
  ChevronLeft, ChevronRight, X, QrCode, Navigation, Award,
  Shield, Heart, Copy, AlertCircle, ExternalLink,
  Mail, Globe, MessageSquare,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { getNegocioById, registrarVisita } from '../../lib/negociosService';
import { useAuth } from '../../contexts/AuthContext';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-4"
      style={{
        color: accent ? T.accent : T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
    </p>
  );
}

function ActionPill({ icon: Icon, label, onClick, variant = 'neutral', square = false }) {
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
    dark: {
      bg: hover ? '#000000' : '#1A1A1A',
      color: '#FFFFFF',
    },
  };

  const c = colors[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setTimeout(() => setHover(false), 120)}
      className={`flex items-center justify-center gap-2 transition-all duration-200 ${square ? '' : 'flex-1'}`}
      style={{
        height: square ? '40px' : '42px',
        width: square ? '40px' : 'auto',
        padding: square ? 0 : '0 16px',
        background: c.bg,
        color: c.color,
        borderRadius: '6px',
        transitionTimingFunction: T.ease,
        WebkitTapHighlightColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '-0.005em',
      }}
      aria-label={label || 'Acción'}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label && <span>{label}</span>}
    </button>
  );
}

export default function NegocioDetallePage() {
  const router = useRouter();
  const { id } = router.query;

  const { user, openLogin } = useAuth();

  const [negocio, setNegocio] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesList, setImagesList] = useState([]);
  const [showLightbox, setShowLightbox] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);

  const [calificacionUsuario, setCalificacionUsuario] = useState(5);
  const [comentario, setComentario] = useState('');
  const [comentarios, setComentarios] = useState([]);
  const [mostrarComentarios, setMostrarComentarios] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [calificacionPromedio, setCalificacionPromedio] = useState(0);
  const [totalComentarios, setTotalComentarios] = useState(0);

  const [estaAbierto, setEstaAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [mostrarCompartir, setMostrarCompartir] = useState(false);
  const [likedComments, setLikedComments] = useState({});

  // Cargar datos
  useEffect(() => {
    if (id) {
      cargarNegocio();
      cargarComentarios();
    }
  }, [id]);

  useEffect(() => {
    if (id && user) {
      verificarFavorito();
    } else {
      setIsFavorite(false);
    }
  }, [id, user]);

  const verificarFavorito = async () => {
    if (!user) return;
    try {
      const favorito = await pb
        .collection('favoritos_negocios')
        .getFirstListItem(`usuarioId = "${user.id}" && negocioId = "${id}"`);
      setIsFavorite(!!favorito);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorito = async () => {
    if (!user) {
      openLogin();
      return;
    }
    try {
      if (isFavorite) {
        const favorito = await pb
          .collection('favoritos_negocios')
          .getFirstListItem(`usuarioId = "${user.id}" && negocioId = "${id}"`);
        await pb.collection('favoritos_negocios').delete(favorito.id);
        setIsFavorite(false);
      } else {
        await pb.collection('favoritos_negocios').create({
          usuarioId: user.id,
          negocioId: id,
          createdAt: new Date().toISOString(),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorito:', error);
    }
  };

  const cargarNegocio = async () => {
    try {
      setLoading(true);
      const negocioData = await getNegocioById(id);
      if (!negocioData) throw new Error('Negocio no encontrado');
      setNegocio(negocioData);

      if (negocioData.horario) {
        verificarHorario(negocioData.horario);
      }

      await registrarVisita(id);

      const imagenes = [];
      if (negocioData.logo) {
        imagenes.push(pb.files.getURL(negocioData, negocioData.logo));
      }
      if (negocioData.imagenes) {
        const imagenesArray = Array.isArray(negocioData.imagenes)
          ? negocioData.imagenes
          : [negocioData.imagenes];
        imagenesArray.forEach((img) => {
          if (img) imagenes.push(pb.files.getURL(negocioData, img));
        });
      }
      setImagesList(imagenes);

      try {
        const productosData = await pb.collection('products').getFullList({
          filter: `negocioId = "${id}" && activo = true`,
          sort: '-created',
        });
        setProductos(productosData);
      } catch (e) {
        console.log('No hay productos/servicios registrados');
      }

      if (negocioData.calificacion !== undefined && negocioData.calificacion !== null) {
        setCalificacionPromedio(negocioData.calificacion);
        setTotalComentarios(negocioData.totalComentarios || 0);
      }
    } catch (error) {
      console.error('Error cargando negocio:', error);
      setError('No se pudo cargar el negocio');
      setTimeout(() => router.push('/negocios'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const verificarHorario = (horario) => {
    const horaActual = new Date().getHours();
    const estaAbiertoHoy =
      horario.toLowerCase().includes('lun') ||
      horario.toLowerCase().includes('mar') ||
      horario.toLowerCase().includes('mié') ||
      horario.toLowerCase().includes('jue') ||
      horario.toLowerCase().includes('vie');
    const estaEnHorario = horaActual >= 9 && horaActual <= 20;
    setEstaAbierto(estaAbiertoHoy && estaEnHorario);
  };

  const cargarComentarios = async () => {
    try {
      const comentariosData = await pb.collection('comentarios_negocios').getFullList({
        filter: `negocioId = "${id}"`,
        sort: '-created',
        expand: 'usuarioId',
      });
      setComentarios(comentariosData);
      setTotalComentarios(comentariosData.length);

      if (comentariosData.length > 0) {
        const promedio =
          comentariosData.reduce((sum, c) => sum + (c.calificacion || 5), 0) /
          comentariosData.length;
        setCalificacionPromedio(Math.round(promedio * 10) / 10);
      }
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  };

  const enviarComentario = async () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!comentario.trim()) return;

    setEnviando(true);
    try {
      await pb.collection('comentarios_negocios').create({
        negocioId: id,
        usuarioId: user.id,
        usuarioNombre: user.nombre || 'Usuario',
        calificacion: calificacionUsuario,
        comentario: comentario,
      });
      setComentario('');
      setCalificacionUsuario(5);
      await cargarComentarios();
      alert('✅ Comentario enviado exitosamente');
    } catch (error) {
      console.error('Error enviando comentario:', error);
      alert('Error al enviar comentario');
    } finally {
      setEnviando(false);
    }
  };

  const darLike = (comentarioId) => {
    setLikedComments((prev) => ({
      ...prev,
      [comentarioId]: !prev[comentarioId],
    }));
  };

  const handleWhatsApp = () => {
    if (negocio.whatsapp) {
      let whatsappNumber = negocio.whatsapp.replace(/\D/g, '');
      if (!whatsappNumber.startsWith('52') && whatsappNumber.length === 10) {
        whatsappNumber = '52' + whatsappNumber;
      }
      window.open(
        `https://wa.me/${whatsappNumber}?text=Hola,%20vi%20tu%20negocio%20en%20MarketDesliz%20y%20estoy%20interesado`,
        '_blank'
      );
    }
  };

  const handleCall = () => {
    if (negocio.telefono) {
      window.location.href = `tel:${negocio.telefono.replace(/\D/g, '')}`;
    }
  };

  const abrirUbicacion = () => {
    if (negocio.ubicacion) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(negocio.ubicacion)}`, '_blank');
    } else if (negocio.direccion) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(negocio.direccion)}`, '_blank');
    }
  };

  const compartirNegocio = (plataforma) => {
    const url = window.location.href;
    const titulo = encodeURIComponent(`${negocio.nombre} - MarketDesliz`);
    const texto = encodeURIComponent(`Te recomiendo visitar ${negocio.nombre} en MarketDesliz`);
    const plataformas = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${texto}&url=${url}`,
      whatsapp: `https://wa.me/?text=${texto}%20${url}`,
      email: `mailto:?subject=${titulo}&body=${texto}%20${url}`,
    };
    window.open(plataformas[plataforma], '_blank', 'width=600,height=400');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);

  const renderEstrellas = (puntuacion, interactive = false) => {
    return [1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        onClick={() => interactive && setCalificacionUsuario(i)}
        type="button"
        className="transition"
        style={{
          WebkitTapHighlightColor: 'transparent',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: interactive ? 'pointer' : 'default',
          transform: interactive && i <= calificacionUsuario ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <Star
          size={interactive ? 22 : 14}
          strokeWidth={1.5}
          style={{
            fill: i <= puntuacion ? '#F5B400' : 'transparent',
            color: i <= puntuacion ? '#F5B400' : T.inkGhost,
          }}
        />
      </button>
    ));
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Head><title>Cargando... | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span
                className="font-serif text-[32px] block mb-5 select-none"
                style={{ color: T.inkGhost }}
              >
                ʃƪʃƪ
              </span>
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Cargando
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error || !negocio) {
    return (
      <>
        <Head><title>Negocio no encontrado | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <Header />
          <main className="flex-1 max-w-[1280px] mx-auto px-6 md:px-14 py-20 w-full">
            <div className="text-center max-w-md mx-auto">
              <AlertCircle size={32} strokeWidth={1.5} style={{ color: T.red, marginBottom: '16px' }} className="mx-auto" />
              <h1
                className="text-[24px] mb-2"
                style={{ color: T.ink, fontWeight: 400 }}
              >
                Negocio no encontrado
              </h1>
              <p
                className="text-[13.5px] mb-8"
                style={{ color: T.inkSoft, fontWeight: 450 }}
              >
                {error || 'El negocio que buscas no existe o fue eliminado.'}
              </p>
              <Link
                href="/negocios"
                className="inline-flex items-center gap-2 px-5 h-10 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                }}
              >
                <ChevronLeft size={14} /> Volver a negocios
              </Link>
            </div>
          </main>
          <Footer variant="minimal" />
        </div>
      </>
    );
  }

  const municipio = negocio.expand?.municipioId?.nombre;
  const localidad = negocio.expand?.localidadId?.nombre;
  const sector = negocio.expand?.sectorId?.nombre;

  return (
    <>
      <Head>
        <title>{negocio.nombre} | Negocio Aliado MarketDesliz</title>
        <meta
          name="description"
          content={negocio.descripcion || `Visita ${negocio.nombre} en ${negocio.direccion || 'tu localidad'}.`}
        />
        <meta property="og:title" content={`${negocio.nombre} | MarketDesliz`} />
        <meta
          property="og:description"
          content={negocio.descripcion || `Negocio aliado en ${negocio.categoria || 'varias categorías'}`}
        />
        <meta property="og:type" content="business.business" />
        {imagesList[0] && <meta property="og:image" content={imagesList[0]} />}
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/negocios" />
        <TerminalBar mode="rotating" />
        <Header />

        <main className="flex-1">
          {/* ─── Breadcrumb ──────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pt-8 pb-4">
            <div className="flex items-center gap-2 text-[12px] flex-wrap">
              <Link href="/" className="transition-colors" style={{ color: T.inkSoft }}>
                Inicio
              </Link>
              <span style={{ color: T.inkGhost }}>/</span>
              <Link href="/negocios" className="transition-colors" style={{ color: T.inkSoft }}>
                Negocios
              </Link>
              {negocio.categoria && (
                <>
                  <span style={{ color: T.inkGhost }}>/</span>
                  <Link
                    href={`/negocios?categoria=${encodeURIComponent(negocio.categoria)}`}
                    className="capitalize transition-colors"
                    style={{ color: T.inkSoft }}
                  >
                    {negocio.categoria}
                  </Link>
                </>
              )}
              <span style={{ color: T.inkGhost }}>/</span>
              <span
                className="truncate max-w-[200px]"
                style={{ color: T.inkMid, fontWeight: 500 }}
              >
                {negocio.nombre}
              </span>
            </div>
          </section>

          {/* ─── Acciones superiores ─────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-6">
            <div className="flex justify-end gap-2">
              <ActionPill
                icon={Heart}
                onClick={toggleFavorito}
                variant={isFavorite ? 'accent' : 'neutral'}
                square
                label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              />
              <ActionPill
                icon={QrCode}
                onClick={() => setMostrarQR(true)}
                variant="neutral"
                square
                label="Ver código QR"
              />
              <ActionPill
                icon={Share2}
                onClick={() => setMostrarCompartir(!mostrarCompartir)}
                variant="neutral"
                square
                label="Compartir"
              />
            </div>

            {mostrarCompartir && (
              <div
                className="mt-4 p-5 flex flex-col gap-3"
                style={{
                  background: 'rgba(15,15,15,0.02)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Compartir este negocio
                  </span>
                  <button
                    onClick={() => setMostrarCompartir(false)}
                    style={{ color: T.inkFaint }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ShareButton label="Facebook" color="#1877F2" onClick={() => compartirNegocio('facebook')} />
                  <ShareButton label="Twitter" color="#1DA1F2" onClick={() => compartirNegocio('twitter')} />
                  <ShareButton label="WhatsApp" color="#25D366" onClick={() => compartirNegocio('whatsapp')} />
                  <ShareButton label="Email" color={T.inkMid} onClick={() => compartirNegocio('email')} />
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 px-3 h-8 text-[12px]"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Copy size={12} strokeWidth={1.75} />
                    {copiado ? 'Copiado' : 'Copiar enlace'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ─── CARD PRINCIPAL DEL NEGOCIO ──────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-12">
            <div
              className="overflow-hidden"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <div className="md:flex">
                {/* Galería */}
                <div
                  className="md:w-2/5 relative"
                  style={{ aspectRatio: '4 / 3', background: 'rgba(15,15,15,0.03)' }}
                >
                  {imagesList.length > 0 ? (
                    <>
                      <img
                        src={imagesList[currentImageIndex]}
                        alt={negocio.nombre}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setShowLightbox(true)}
                      />
                      {imagesList.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{
                              width: '32px',
                              height: '32px',
                              background: 'rgba(250,250,249,0.9)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              borderRadius: '50%',
                              color: T.ink,
                              border: 'none',
                              cursor: 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={{
                              width: '32px',
                              height: '32px',
                              background: 'rgba(250,250,249,0.9)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              borderRadius: '50%',
                              color: T.ink,
                              border: 'none',
                              cursor: 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {imagesList.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                style={{
                                  width: idx === currentImageIndex ? '16px' : '6px',
                                  height: '6px',
                                  background: idx === currentImageIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                                  borderRadius: '3px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s',
                                  WebkitTapHighlightColor: 'transparent',
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex gap-1.5 flex-wrap justify-end">
                        {negocio.verificado && (
                          <Badge variant="verified" icon={CheckCircle} label="Verificado" />
                        )}
                        {negocio.destacado && (
                          <Badge variant="featured" icon={Star} label="Destacado" />
                        )}
                        <Badge variant="accent" icon={Building2} label="Aliado" />
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <Badge
                          variant={estaAbierto ? 'open' : 'closed'}
                          label={estaAbierto ? 'Abierto' : 'Cerrado'}
                          dot
                        />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store size={64} strokeWidth={1.25} style={{ color: T.inkGhost }} />
                    </div>
                  )}
                </div>

                {/* Info principal */}
                <div className="md:w-3/5 p-6 md:p-8">
                  {/* Nombre + categoría */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <h1
                        className="text-[24px] md:text-[32px] leading-tight tracking-[-0.02em]"
                        style={{ color: T.ink, fontWeight: 500 }}
                      >
                        {negocio.nombre}
                      </h1>
                      {negocio.categoria && (
                        <span
                          className="text-[10px] uppercase tracking-[0.18em] px-2 py-1"
                          style={{
                            color: T.accent,
                            background: 'rgba(79, 46, 232, 0.06)',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          {negocio.categoria}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="flex">{renderEstrellas(calificacionPromedio)}</div>
                        <span
                          className="text-[12px] tabular-nums"
                          style={{ color: T.inkSoft, fontWeight: 450, fontFeatureSettings: '"tnum"' }}
                        >
                          {calificacionPromedio.toFixed(1)} ({totalComentarios})
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-[12px]"
                        style={{ color: T.inkFaint, fontWeight: 450 }}
                      >
                        <Eye size={12} strokeWidth={1.75} /> {negocio.visitas || 0} visitas
                      </div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="flex flex-col gap-3 mt-6 mb-6">
                    {negocio.direccion && (
                      <InfoLine icon={MapPin} text={negocio.direccion} />
                    )}
                    {(municipio || localidad || sector) && (
                      <InfoLine
                        icon={MapPin}
                        text={[municipio, localidad, sector].filter(Boolean).join(' › ')}
                      />
                    )}
                    {negocio.telefono && (
                      <InfoLine icon={Phone} text={formatPhone(negocio.telefono)} mono />
                    )}
                    {negocio.whatsapp && (
                      <InfoLine icon={MessageCircle} text={formatPhone(negocio.whatsapp)} mono />
                    )}
                    {negocio.horario && <InfoLine icon={Clock} text={negocio.horario} />}
                    {negocio.email && (
                      <InfoLine
                        icon={Mail}
                        text={negocio.email}
                        href={`mailto:${negocio.email}`}
                      />
                    )}
                    {negocio.sitioWeb && (
                      <InfoLine
                        icon={Globe}
                        text="Sitio web"
                        href={negocio.sitioWeb}
                        external
                      />
                    )}
                  </div>

                  {/* Redes sociales */}
                  {(negocio.facebook || negocio.instagram || negocio.tiktok) && (
                    <div className="flex gap-3 mb-6">
                      {negocio.facebook && (
                        <SocialIcon href={negocio.facebook} label="Facebook">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </SocialIcon>
                      )}
                      {negocio.instagram && (
                        <SocialIcon href={negocio.instagram} label="Instagram">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </SocialIcon>
                      )}
                      {negocio.tiktok && (
                        <SocialIcon href={negocio.tiktok} label="TikTok">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                          </svg>
                        </SocialIcon>
                      )}
                    </div>
                  )}

                  {/* Descripción */}
                  {negocio.descripcion && (
                    <div
                      className="mb-6 p-4"
                      style={{
                        background: 'rgba(15,15,15,0.02)',
                        borderLeft: `2px solid ${T.accent}`,
                        borderRadius: '6px',
                      }}
                    >
                      <p
                        className="text-[13.5px] leading-[1.65]"
                        style={{ color: T.inkMid, fontWeight: 450 }}
                      >
                        {negocio.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Servicios badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {negocio.atencionWhatsapp && <ServiceBadge icon={MessageCircle} label="WhatsApp" />}
                    {negocio.citasPrevias && <ServiceBadge icon={Calendar} label="Cita previa" />}
                    {negocio.domicilio && <ServiceBadge icon={Navigation} label="A domicilio" />}
                    {negocio.servicios && <ServiceBadge icon={Award} label={negocio.servicios} />}
                  </div>

                  {/* Botones acción */}
                  <div className="flex flex-wrap gap-2">
                    {negocio.telefono && (
                      <ActionPill icon={Phone} label="Llamar" onClick={handleCall} variant="dark" />
                    )}
                    {negocio.whatsapp && (
                      <ActionPill icon={MessageCircle} label="WhatsApp" onClick={handleWhatsApp} variant="whatsapp" />
                    )}
                    <ActionPill icon={Navigation} label="Llegar" onClick={abrirUbicacion} variant="accent" />
                  </div>

                  {/* Metadata */}
                  <div
                    className="flex flex-wrap gap-4 mt-6 pt-4 text-[11px]"
                    style={{ borderTop: `1px solid ${T.line}`, color: T.inkFaint }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} strokeWidth={1.75} />
                      Registrado: {new Date(negocio.created).toLocaleDateString()}
                    </span>
                    {negocio.verificado && (
                      <span className="flex items-center gap-1.5">
                        <Shield size={11} strokeWidth={1.75} />
                        Negocio verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Mensaje de activación pendiente ─────────── */}
          {negocio.estadoActivacion === 'pendiente_activacion' && user && user.id === negocio.usuarioId && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-8">
              <div
                className="p-5"
                style={{
                  background: 'rgba(245, 180, 0, 0.06)',
                  border: '1px solid rgba(245, 180, 0, 0.25)',
                  borderRadius: '8px',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} strokeWidth={1.75} style={{ color: '#B8820E', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <h3
                      className="text-[13.5px] mb-1"
                      style={{ color: '#8A6109', fontWeight: 500 }}
                    >
                      Tu negocio está pendiente de activación
                    </h3>
                    <p
                      className="text-[12.5px] leading-[1.6]"
                      style={{ color: '#8A6109' }}
                    >
                      Para que <strong>{negocio.nombre}</strong> aparezca en la lista de negocios aliados y los
                      clientes puedan encontrarte, <strong>realiza tu primera compra en MarketDesliz</strong>.
                    </p>
                    <Link
                      href="/productos"
                      className="inline-flex items-center gap-1 mt-2 text-[12px] underline"
                      style={{ color: '#8A6109', fontWeight: 500 }}
                    >
                      Ver productos disponibles →
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── Lightbox ─────────────────────────────────── */}
          {showLightbox && imagesList.length > 0 && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: 'rgba(15,15,15,0.94)' }}
              onClick={() => setShowLightbox(false)}
            >
              <button
                className="absolute top-6 right-6"
                style={{ color: '#FAFAF9', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowLightbox(false)}
              >
                <X size={24} strokeWidth={1.75} />
              </button>
              {imagesList.length > 1 && (
                <>
                  <button
                    className="absolute left-6 top-1/2 -translate-y-1/2"
                    style={{ color: '#FAFAF9', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  >
                    <ChevronLeft size={32} strokeWidth={1.5} />
                  </button>
                  <button
                    className="absolute right-6 top-1/2 -translate-y-1/2"
                    style={{ color: '#FAFAF9', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  >
                    <ChevronRight size={32} strokeWidth={1.5} />
                  </button>
                </>
              )}
              <img
                src={imagesList[currentImageIndex]}
                alt={negocio.nombre}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <div
                className="absolute bottom-6 left-0 right-0 text-center text-[12px] tabular-nums"
                style={{ color: 'rgba(250,250,249,0.7)', fontFeatureSettings: '"tnum"' }}
              >
                {currentImageIndex + 1} / {imagesList.length}
              </div>
            </div>
          )}

          {/* ─── QR Modal ─────────────────────────────────── */}
          {mostrarQR && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(15,15,15,0.7)' }}
              onClick={() => setMostrarQR(false)}
            >
              <div
                className="p-6 max-w-sm w-full text-center"
                style={{
                  background: T.bg,
                  borderRadius: '10px',
                  border: `1px solid ${T.line}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <QrCode size={64} strokeWidth={1.25} style={{ color: T.accent, margin: '0 auto 16px' }} />
                <p
                  className="text-[13px] mb-5"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Escanea para ver este negocio en MarketDesliz
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMostrarQR(false)}
                    className="flex-1 h-10 text-[13px]"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => { copyLink(); setMostrarQR(false); }}
                    className="flex-1 h-10 text-white text-[13px]"
                    style={{
                      background: T.accent,
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Copiar enlace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Mapa ─────────────────────────────────────── */}
          {negocio.direccion && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-12">
              <SectionLabel>Ubicación</SectionLabel>
              <div
                className="overflow-hidden"
                style={{
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                  height: '260px',
                }}
              >
                <iframe
                  title="mapa"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(negocio.direccion)}&output=embed`}
                  allowFullScreen
                />
              </div>
              <button
                onClick={abrirUbicacion}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px]"
                style={{
                  color: T.accent,
                  fontWeight: 500,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Abrir en Google Maps <ExternalLink size={12} strokeWidth={1.75} />
              </button>
            </section>
          )}

          {/* ─── Productos y servicios ───────────────────── */}
          {productos.length > 0 && (
            <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-12">
              <div className="flex items-baseline justify-between mb-4">
                <SectionLabel>Productos y servicios</SectionLabel>
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: T.inkFaint, fontWeight: 500, fontFeatureSettings: '"tnum"' }}
                >
                  {productos.length} {productos.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="p-4"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    {producto.nuevo && (
                      <span
                        className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]"
                        style={{
                          background: 'rgba(245, 180, 0, 0.1)',
                          color: '#B8820E',
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}
                      >
                        <Star size={9} strokeWidth={2} /> Destacado
                      </span>
                    )}
                    <h3
                      className="text-[14.5px] mb-1.5"
                      style={{ color: T.ink, fontWeight: 500 }}
                    >
                      {producto.nombre}
                    </h3>
                    {producto.descripcion && (
                      <p
                        className="text-[12.5px] leading-[1.55] line-clamp-2 mb-2"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        {producto.descripcion}
                      </p>
                    )}
                    {producto.precio && (
                      <p
                        className="text-[16px] tabular-nums"
                        style={{
                          color: T.accent,
                          fontWeight: 500,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        ${producto.precio.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Opiniones ────────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16">
            <button
              onClick={() => setMostrarComentarios(!mostrarComentarios)}
              className="w-full text-left flex justify-between items-center pb-4 mb-6"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${T.line}`,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.22em] mb-1"
                  style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                >
                  Opiniones
                </p>
                <h2
                  className="text-[22px] md:text-[28px] leading-tight tracking-[-0.02em]"
                  style={{ color: T.ink, fontWeight: 400 }}
                >
                  {totalComentarios} {totalComentarios === 1 ? 'opinión' : 'opiniones'}
                  {calificacionPromedio > 0 && (
                    <span
                      className="text-[14px] ml-2"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      · {calificacionPromedio.toFixed(1)} de 5
                    </span>
                  )}
                </h2>
              </div>
              <span style={{ color: T.inkFaint, fontSize: '14px' }}>
                {mostrarComentarios ? '▲' : '▼'}
              </span>
            </button>

            {mostrarComentarios && (
              <>
                {/* Formulario */}
                {user ? (
                  <div
                    className="mb-8 p-5"
                    style={{
                      background: 'rgba(79, 46, 232, 0.03)',
                      border: '1px solid rgba(79, 46, 232, 0.12)',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-[0.22em] mb-4"
                      style={{ color: T.accent, fontWeight: 500, fontFeatureSettings: '"ss01"' }}
                    >
                      Deja tu opinión
                    </p>

                    <div className="mb-4">
                      <span
                        className="block text-[11px] uppercase tracking-[0.18em] mb-2"
                        style={{ color: T.inkFaint, fontWeight: 500 }}
                      >
                        Tu calificación
                      </span>
                      <div className="flex gap-1">{renderEstrellas(calificacionUsuario, true)}</div>
                    </div>

                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-3 outline-none transition-colors resize-none"
                      placeholder="¿Qué te pareció este negocio?"
                      style={{
                        background: T.bg,
                        border: `1px solid ${T.line}`,
                        borderRadius: '6px',
                        color: T.ink,
                        fontSize: '13.5px',
                        fontWeight: 450,
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
                    />

                    <button
                      onClick={enviarComentario}
                      disabled={enviando}
                      className="mt-3 h-10 px-5 text-white text-[13px] flex items-center gap-2 disabled:opacity-50"
                      style={{
                        background: T.accent,
                        borderRadius: '6px',
                        fontWeight: 500,
                        cursor: enviando ? 'not-allowed' : 'pointer',
                        border: 'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onMouseEnter={(e) => { if (!enviando) e.currentTarget.style.background = T.accentDeep; }}
                      onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                    >
                      {enviando ? (
                        <>
                          <div
                            className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"
                          />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <MessageCircle size={14} strokeWidth={1.75} /> Publicar
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div
                    className="mb-8 p-5 text-center"
                    style={{
                      background: 'rgba(15,15,15,0.02)',
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      className="text-[13px] mb-3"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      Inicia sesión para dejar tu opinión
                    </p>
                    <button
                      onClick={openLogin}
                      className="inline-flex items-center gap-2 h-10 px-5 text-white text-[13px]"
                      style={{
                        background: T.accent,
                        borderRadius: '6px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      Iniciar sesión
                    </button>
                  </div>
                )}

                {/* Lista */}
                {comentarios.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare
                      size={32}
                      strokeWidth={1.5}
                      style={{ color: T.inkGhost, margin: '0 auto 12px' }}
                    />
                    <p
                      className="text-[13px]"
                      style={{ color: T.inkFaint, fontWeight: 450 }}
                    >
                      No hay comentarios aún. ¡Sé el primero en opinar!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
                    {comentarios.map((com) => (
                      <div
                        key={com.id}
                        className="p-4"
                        style={{
                          background: 'rgba(15,15,15,0.02)',
                          border: `1px solid ${T.line}`,
                          borderRadius: '8px',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: '36px',
                                height: '36px',
                                background: 'rgba(79, 46, 232, 0.08)',
                                borderRadius: '50%',
                              }}
                            >
                              <span
                                className="text-[13px]"
                                style={{ color: T.accent, fontWeight: 500 }}
                              >
                                {com.usuarioNombre?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p
                                className="text-[13.5px]"
                                style={{ color: T.ink, fontWeight: 500 }}
                              >
                                {com.usuarioNombre || 'Usuario'}
                              </p>
                              <div className="flex gap-0.5 mt-1">
                                {renderEstrellas(com.calificacion || 5)}
                              </div>
                            </div>
                          </div>
                          <span
                            className="text-[11px]"
                            style={{ color: T.inkFaint, fontWeight: 450 }}
                          >
                            {new Date(com.created).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <p
                          className="text-[13px] leading-[1.6] ml-12 mb-2"
                          style={{ color: T.inkMid, fontWeight: 450 }}
                        >
                          {com.comentario}
                        </p>

                        <div className="flex gap-4 ml-12">
                          <button
                            onClick={() => darLike(com.id)}
                            className="flex items-center gap-1 text-[11px] transition-colors"
                            style={{
                              color: likedComments[com.id] ? T.accent : T.inkFaint,
                              fontWeight: 500,
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <ThumbsUp size={11} strokeWidth={1.75} /> Útil
                          </button>
                          <button
                            className="flex items-center gap-1 text-[11px]"
                            style={{
                              color: T.inkFaint,
                              fontWeight: 500,
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <Flag size={11} strokeWidth={1.75} /> Reportar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {/* ─── WhatsApp flotante ────────────────────────── */}
        {negocio.whatsapp && (
          <button
            onClick={handleWhatsApp}
            className="fixed flex items-center justify-center transition-transform"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
              right: 'calc(env(safe-area-inset-right) + 24px)',
              width: '52px',
              height: '52px',
              background: '#1A7F4B',
              borderRadius: '50%',
              boxShadow: '0 4px 16px rgba(26, 127, 75, 0.35)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              zIndex: 40,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="Contactar por WhatsApp"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <MessageCircle size={22} strokeWidth={1.75} />
          </button>
        )}

        <Footer variant="minimal" />
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

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────
function Badge({ variant, icon: Icon, label, dot = false }) {
  const variants = {
    verified:  { bg: 'rgba(26, 127, 75, 0.92)', color: '#FFFFFF' },
    featured:  { bg: 'rgba(245, 180, 0, 0.92)', color: '#0F0F0F' },
    accent:    { bg: 'rgba(79, 46, 232, 0.92)', color: '#FFFFFF' },
    open:      { bg: 'rgba(26, 127, 75, 0.92)', color: '#FFFFFF' },
    closed:    { bg: 'rgba(197, 48, 48, 0.92)', color: '#FFFFFF' },
  };
  const c = variants[variant] || variants.accent;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1"
      style={{
        background: c.bg,
        color: c.color,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '4px',
        fontSize: '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontWeight: 600,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, background: '#FFFFFF', borderRadius: '50%' }} />}
      {Icon && <Icon size={10} strokeWidth={2} />}
      {label}
    </span>
  );
}

function InfoLine({ icon: Icon, text, href, external, mono = false }) {
  const content = (
    <>
      <Icon size={13} strokeWidth={1.75} style={{ color: T.inkFaint, marginTop: 3, flexShrink: 0 }} />
      <span
        className={`text-[13px] leading-[1.55] ${mono ? 'tabular-nums' : ''}`}
        style={{
          color: href ? T.accent : T.inkMid,
          fontWeight: 450,
          fontFeatureSettings: mono ? '"tnum"' : undefined,
          textDecoration: href ? 'underline' : 'none',
          textDecorationThickness: '1px',
          textUnderlineOffset: '3px',
        }}
      >
        {text}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="flex items-start gap-3 transition-opacity hover:opacity-80"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-start gap-3">{content}</div>;
}

function ServiceBadge({ icon: Icon, label }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1"
      style={{
        background: 'rgba(15,15,15,0.03)',
        border: `1px solid ${T.line}`,
        borderRadius: '4px',
        color: T.inkMid,
        fontSize: '11px',
        fontWeight: 500,
      }}
    >
      <Icon size={11} strokeWidth={1.75} />
      {label}
    </span>
  );
}

function ShareButton({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 h-8 text-[12px] text-white"
      style={{
        background: color,
        borderRadius: '6px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center justify-center transition-colors"
      style={{
        width: '32px',
        height: '32px',
        border: `1px solid ${T.line}`,
        borderRadius: '50%',
        color: T.inkMid,
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = T.accent;
        e.currentTarget.style.borderColor = T.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = T.inkMid;
        e.currentTarget.style.borderColor = T.line;
      }}
    >
      {children}
    </a>
  );
}