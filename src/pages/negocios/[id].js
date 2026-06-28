// src/pages/negocios/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Star,
  Share2,
  CheckCircle,
  Building2,
  Calendar,
  Eye,
  ThumbsUp,
  Flag,
  ChevronLeft,
  ChevronRight,
  X,
  QrCode,
  Navigation,
  Award,
  Shield,
  Users,
  Heart,
  Copy,
  AlertCircle,
  ExternalLink,
  Mail,
  Globe
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import { getNegocioById, registrarVisita } from '../../lib/negociosService';

export default function NegocioDetallePage() {
  const router = useRouter();
  const { id } = router.query;

  const [negocio, setNegocio] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesList, setImagesList] = useState([]);
  const [showLightbox, setShowLightbox] = useState(false);

  const [user, setUser] = useState(null);
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

  useEffect(() => {
    const checkUser = () => setUser(pb.authStore.model);
    checkUser();
    const unsubscribe = pb.authStore.onChange(() => checkUser());
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      cargarNegocio();
      cargarComentarios();
      verificarFavorito();
    }
  }, [id]);

  const verificarFavorito = async () => {
    if (!user) return;
    try {
      const favorito = await pb.collection('favoritos_negocios').getFirstListItem(
        `usuarioId = "${user.id}" && negocioId = "${id}"`
      );
      setIsFavorite(!!favorito);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorito = async () => {
    if (!user) {
      router.push(`/solicitar?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    try {
      if (isFavorite) {
        const favorito = await pb.collection('favoritos_negocios').getFirstListItem(
          `usuarioId = "${user.id}" && negocioId = "${id}"`
        );
        await pb.collection('favoritos_negocios').delete(favorito.id);
        setIsFavorite(false);
      } else {
        await pb.collection('favoritos_negocios').create({
          usuarioId: user.id,
          negocioId: id,
          createdAt: new Date().toISOString()
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

      // Usar el servicio actualizado que trae los expands geográficos
      const negocioData = await getNegocioById(id);
      if (!negocioData) throw new Error('Negocio no encontrado');
      setNegocio(negocioData);

      // Verificar horario (básico)
      if (negocioData.horario) {
        verificarHorario(negocioData.horario);
      }

      // Registrar visita
      await registrarVisita(id);

      // Procesar imágenes
      const imagenes = [];
      if (negocioData.logo) {
        imagenes.push(pb.files.getURL(negocioData, negocioData.logo));
      }
      if (negocioData.imagenes) {
        const imagenesArray = Array.isArray(negocioData.imagenes)
          ? negocioData.imagenes
          : [negocioData.imagenes];
        imagenesArray.forEach(img => {
          if (img) imagenes.push(pb.files.getURL(negocioData, img));
        });
      }
      setImagesList(imagenes);

      // Cargar productos/servicios
      try {
        const productosData = await pb.collection('products').getFullList({
          filter: `negocioId = "${id}" && activo = true`,
          sort: '-created'
        });
        setProductos(productosData);
      } catch (e) {
        console.log('No hay productos/servicios registrados');
      }

      // Usar calificación del campo del negocio (si existe)
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
    const estaAbiertoHoy = horario.toLowerCase().includes('lun') ||
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
        expand: 'usuarioId'
      });
      setComentarios(comentariosData);
      setTotalComentarios(comentariosData.length);

      if (comentariosData.length > 0) {
        const promedio = comentariosData.reduce((sum, c) => sum + (c.calificacion || 5), 0) / comentariosData.length;
        setCalificacionPromedio(Math.round(promedio * 10) / 10);
      }
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    }
  };

  const enviarComentario = async () => {
    if (!user) {
      router.push(`/solicitar?redirect=${encodeURIComponent(router.asPath)}`);
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
        comentario: comentario
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
    setLikedComments(prev => ({
      ...prev,
      [comentarioId]: !prev[comentarioId]
    }));
  };

  const handleWhatsApp = () => {
    if (negocio.whatsapp) {
      let whatsappNumber = negocio.whatsapp.replace(/\D/g, '');
      if (!whatsappNumber.startsWith('52') && whatsappNumber.length === 10) {
        whatsappNumber = '52' + whatsappNumber;
      }
      window.open(`https://wa.me/${whatsappNumber}?text=Hola,%20vi%20tu%20negocio%20en%20MarketDesliz%20y%20estoy%20interesado`, '_blank');
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
      email: `mailto:?subject=${titulo}&body=${texto}%20${url}`
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
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);

  const renderEstrellas = (puntuacion, interactive = false) => {
    return [1, 2, 3, 4, 5].map(i => (
      <button
        key={i}
        onClick={() => interactive && setCalificacionUsuario(i)}
        className={`transition ${interactive ? 'hover:scale-110' : ''} ${interactive && i <= calificacionUsuario ? 'text-yellow-400' : ''}`}
      >
        <Star
          size={interactive ? 24 : 16}
          className={i <= puntuacion ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      </button>
    ));
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  if (error || !negocio) {
    return (
      <StoreLayout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Negocio no encontrado</h1>
          <p className="text-gray-500 mb-6">{error || 'El negocio que buscas no existe o fue eliminado'}</p>
          <Link href="/negocios" className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#5a2ee6] transition">
            ← Volver a negocios
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const municipio = negocio.expand?.municipioId?.nombre;
  const localidad = negocio.expand?.localidadId?.nombre;
  const sector = negocio.expand?.sectorId?.nombre;

  return (
    <>
      <Head>
        <title>{negocio.nombre} | Negocio Aliado MarketDesliz</title>
        <meta name="description" content={negocio.descripcion || `Visita ${negocio.nombre} en ${negocio.direccion || 'tu localidad'}. Productos y servicios de calidad con MarketDesliz.`} />
        <meta property="og:title" content={`${negocio.nombre} | MarketDesliz`} />
        <meta property="og:description" content={negocio.descripcion || `Negocio aliado en ${negocio.categoria || 'varias categorías'}`} />
        <meta property="og:type" content="business.business" />
        {imagesList[0] && <meta property="og:image" content={imagesList[0]} />}
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-28 pb-16">

          {/* Breadcrumb y acciones */}
          <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
            <Link href="/negocios" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition">
              <ChevronLeft size={16} /> Volver a negocios
            </Link>
            <div className="flex gap-2">
              <button
                onClick={toggleFavorito}
                className={`p-2 rounded-lg transition ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => setMostrarQR(true)}
                className="p-2 text-gray-500 hover:text-[#6C3BFF] hover:bg-purple-50 rounded-lg transition"
                title="Ver código QR"
              >
                <QrCode size={18} />
              </button>
              <button
                onClick={() => setMostrarCompartir(!mostrarCompartir)}
                className="p-2 text-gray-500 hover:text-[#6C3BFF] hover:bg-purple-50 rounded-lg transition"
                title="Compartir"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Panel de compartir */}
          {mostrarCompartir && (
            <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-gray-900">Compartir este negocio</span>
                <button onClick={() => setMostrarCompartir(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => compartirNegocio('facebook')} className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm hover:opacity-90 transition">Facebook</button>
                <button onClick={() => compartirNegocio('twitter')} className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg text-sm hover:opacity-90 transition">Twitter</button>
                <button onClick={() => compartirNegocio('whatsapp')} className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm hover:opacity-90 transition">WhatsApp</button>
                <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">
                  <Copy size={14} /> {copiado ? 'Copiado' : 'Copiar enlace'}
                </button>
              </div>
            </div>
          )}

          {/* QR Modal */}
          {mostrarQR && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setMostrarQR(false)}>
              <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <div className="mb-4">
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center">
                      <QrCode size={80} className="text-[#6C3BFF]" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Escanea para ver este negocio en MarketDesliz</p>
                <div className="flex gap-3">
                  <button onClick={() => setMostrarQR(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">Cerrar</button>
                  <button onClick={() => { copyLink(); setMostrarQR(false); }} className="flex-1 bg-[#6C3BFF] text-white py-2 rounded-lg hover:bg-purple-700 transition">Copiar enlace</button>
                </div>
              </div>
            </div>
          )}

          {/* Header principal del negocio */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8 shadow-sm">
            <div className="md:flex">
              {/* Galería de imágenes */}
              <div className="md:w-2/5 h-80 md:h-auto relative bg-gradient-to-br from-gray-50 to-gray-100">
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
                        <button onClick={prevImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition">
                          <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition">
                          <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                          {imagesList.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-purple-100 to-blue-100">
                    🏪
                  </div>
                )}

                {/* Badges flotantes */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {negocio.verificado && (
                    <span className="bg-blue-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm" title="Verificado por MarketDesliz">
                      <CheckCircle size={12} /> Verificado
                    </span>
                  )}
                  {negocio.destacado && (
                    <span className="bg-yellow-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm" title="Destacado">
                      <Star size={12} /> Destacado
                    </span>
                  )}
                  <span className="bg-[#6C3BFF] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Building2 size={12} /> Aliado
                  </span>
                </div>

                {estaAbierto ? (
                  <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full shadow-sm">
                    Abierto ahora
                  </div>
                ) : (
                  <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full shadow-sm">
                    Cerrado
                  </div>
                )}
              </div>

              {/* Información principal */}
              <div className="md:w-3/5 p-6">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{negocio.nombre}</h1>
                      {negocio.categoria && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {negocio.categoria}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        {renderEstrellas(calificacionPromedio)}
                        <span className="text-sm text-gray-500 ml-1">({totalComentarios})</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Eye size={14} /> {negocio.visitas || 0} visitas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de contacto en grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  {negocio.direccion && (
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <MapPin size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                      <span className="text-sm">{negocio.direccion}</span>
                    </div>
                  )}
                  {(municipio || localidad || sector) && (
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <MapPin size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                      <span className="text-sm">
                        {[municipio, localidad, sector].filter(Boolean).join(' › ')}
                      </span>
                    </div>
                  )}
                  {negocio.telefono && (
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <Phone size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                      <span className="text-sm">{formatPhone(negocio.telefono)}</span>
                    </div>
                  )}
                  {negocio.whatsapp && (
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <MessageCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{formatPhone(negocio.whatsapp)}</span>
                    </div>
                  )}
                  {negocio.horario && (
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <Clock size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                      <span className="text-sm">{negocio.horario}</span>
                    </div>
                  )}
                  {negocio.email && (
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <Mail size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                      <a href={`mailto:${negocio.email}`} className="text-sm text-[#6C3BFF] hover:underline">{negocio.email}</a>
                    </div>
                  )}
                  {negocio.sitioWeb && (
                    <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <Globe size={16} className="text-[#6C3BFF] shrink-0 mt-0.5" />
                      <a href={negocio.sitioWeb} target="_blank" rel="noopener noreferrer" className="text-sm text-[#6C3BFF] hover:underline">Sitio web</a>
                    </div>
                  )}
                </div>

                {/* Redes sociales */}
                <div className="flex gap-3 mt-3">
                  {negocio.facebook && (
                    <a href={negocio.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {negocio.instagram && (
                    <a href={negocio.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                  {negocio.tiktok && (
                    <a href={negocio.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                    </a>
                  )}
                </div>

                {/* Descripción */}
                {negocio.descripcion && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-gray-700 text-sm leading-relaxed">{negocio.descripcion}</p>
                  </div>
                )}

                {/* Servicios */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {negocio.atencionWhatsapp && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <MessageCircle size={12} /> WhatsApp
                    </span>
                  )}
                  {negocio.citasPrevias && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <Calendar size={12} /> Cita previa
                    </span>
                  )}
                  {negocio.domicilio && (
                    <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      <Navigation size={12} /> Domicilio
                    </span>
                  )}
                  {negocio.servicios && (
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      <Award size={12} /> {negocio.servicios}
                    </span>
                  )}
                </div>

                {/* Botones de acción principal */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {negocio.telefono && (
                    <button onClick={handleCall} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-xl font-medium hover:bg-gray-900 transition">
                      <Phone size={16} /> Llamar ahora
                    </button>
                  )}
                  {negocio.whatsapp && (
                    <button onClick={handleWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition">
                      <MessageCircle size={16} /> WhatsApp
                    </button>
                  )}
                  <button onClick={abrirUbicacion} className="px-4 bg-blue-500 text-white py-2.5 rounded-xl font-medium hover:bg-blue-600 transition flex items-center justify-center gap-2">
                    <Navigation size={16} /> Llegar
                  </button>
                </div>

                {/* Estadísticas adicionales */}
                <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> Registrado: {new Date(negocio.created).toLocaleDateString()}</span>
                  {negocio.verificado && <span className="flex items-center gap-1"><Shield size={12} /> Negocio verificado</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de activación pendiente */}
          {negocio.estadoActivacion === 'pendiente_activacion' && user && user.id === negocio.usuarioId && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="font-bold text-yellow-800 text-sm">¡Tu negocio está pendiente de activación!</h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    Para que {negocio.nombre} aparezca en la lista de negocios aliados y los clientes puedan encontrarte,
                    <strong> realiza tu primera compra en MarketDesliz</strong>.
                  </p>
                  <Link href="/productos" className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-yellow-800 hover:text-yellow-900 underline">
                    Ver productos disponibles →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Lightbox */}
          {showLightbox && imagesList.length > 0 && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setShowLightbox(false)}>
              <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300" onClick={() => setShowLightbox(false)}>✕</button>
              <button className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300" onClick={prevImage}>‹</button>
              <img src={imagesList[currentImageIndex]} alt={negocio.nombre} className="max-w-[90vw] max-h-[90vh] object-contain" />
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300" onClick={nextImage}>›</button>
              <div className="absolute bottom-4 text-white text-sm">{currentImageIndex + 1} / {imagesList.length}</div>
            </div>
          )}

          {/* Mapa de ubicación */}
          {negocio.direccion && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-[#6C3BFF]" /> Ubicación
              </h2>
              <div className="bg-gray-100 rounded-xl h-64 overflow-hidden">
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
              <button onClick={abrirUbicacion} className="mt-3 text-sm text-[#6C3BFF] hover:underline flex items-center gap-1">
                Abrir en Google Maps <ExternalLink size={12} />
              </button>
            </div>
          )}

          {/* Productos y Servicios */}
          {productos.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Store size={20} className="text-[#6C3BFF]" /> Productos y Servicios
                </h2>
                <span className="text-sm text-gray-400">{productos.length} items</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productos.map((producto) => (
                  <div key={producto.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition group cursor-pointer hover:border-purple-200">
                    {producto.nuevo && (
                      <span className="inline-block mb-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        ⭐ Destacado
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 group-hover:text-[#6C3BFF] transition">{producto.nombre}</h3>
                    {producto.descripcion && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{producto.descripcion}</p>
                    )}
                    {producto.precio && (
                      <p className="text-lg font-bold text-[#6C3BFF] mt-2">
                        ${producto.precio.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sección de comentarios (sin cambios) */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
            <button
              onClick={() => setMostrarComentarios(!mostrarComentarios)}
              className="w-full p-5 text-left flex justify-between items-center hover:bg-gray-50 transition"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users size={20} className="text-[#6C3BFF]" /> Opiniones de clientes
                </h2>
                <p className="text-sm text-gray-500 mt-1">{totalComentarios} {totalComentarios === 1 ? 'opinión' : 'opiniones'}</p>
              </div>
              <span className="text-gray-400">{mostrarComentarios ? '▲' : '▼'}</span>
            </button>

            {mostrarComentarios && (
              <div className="p-6 pt-0 border-t border-gray-100">
                {user ? (
                  <div className="mb-8 p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <MessageCircle size={18} className="text-[#6C3BFF]" /> Deja tu opinión
                    </h3>
                    <div className="mb-3">
                      <label className="block text-sm text-gray-600 mb-2">Tu calificación</label>
                      <div className="flex gap-1">
                        {renderEstrellas(calificacionUsuario, true)}
                      </div>
                    </div>
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows="3"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="¿Qué te pareció este negocio? Recomiéndalo o da tu opinión..."
                    />
                    <button
                      onClick={enviarComentario}
                      disabled={enviando}
                      className="mt-3 bg-[#6C3BFF] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {enviando ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <MessageCircle size={16} /> Publicar comentario
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mb-8 p-5 bg-gray-50 rounded-xl text-center border border-gray-200">
                    <p className="text-gray-600 mb-3">Inicia sesión para dejar tu opinión</p>
                    <Link
                      href={`/solicitar?redirect=${encodeURIComponent(router.asPath)}`}
                      className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2 rounded-xl font-medium hover:bg-purple-700 transition"
                    >
                      Iniciar sesión
                    </Link>
                  </div>
                )}

                {comentarios.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle size={20} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500">No hay comentarios aún. ¡Sé el primero en opinar!</p>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
                    {comentarios.map((com) => (
                      <div key={com.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-[#6C3BFF]">
                                {com.usuarioNombre?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{com.usuarioNombre || 'Usuario'}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {renderEstrellas(com.calificacion || 5)}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(com.created).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm ml-12 mt-2 leading-relaxed">{com.comentario}</p>
                        <div className="flex gap-4 mt-2 ml-12">
                          <button
                            onClick={() => darLike(com.id)}
                            className={`flex items-center gap-1 text-xs transition ${likedComments[com.id] ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                          >
                            <ThumbsUp size={12} /> Útil
                          </button>
                          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-500 transition">
                            <Flag size={12} /> Reportar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón flotante WhatsApp */}
          {negocio.whatsapp && (
            <div className="fixed bottom-6 right-6 z-40">
              <button
                onClick={handleWhatsApp}
                className="w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition transform hover:scale-105"
                title="Contactar por WhatsApp"
              >
                <MessageCircle size={24} />
              </button>
            </div>
          )}

          <div className="text-center mt-6">
            <Link href="/" className="text-gray-400 text-sm hover:text-[#6C3BFF] transition inline-flex items-center gap-1">
              <ChevronLeft size={14} /> Volver al inicio
            </Link>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}