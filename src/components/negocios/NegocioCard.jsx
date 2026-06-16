// src/components/negocios/NegocioCard.jsx
import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Star, 
  Building2,
  Heart,
  Map,
  CheckCircle,
  Eye
} from 'lucide-react';
import pb from '../../lib/pocketbase';

export default function NegocioCard({ 
  negocio, 
  variant = 'grid', // 'grid' o 'list'
  showActions = true,
  onFavoriteToggle,
  isFavorite = false
}) {
  const [imageError, setImageError] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);

  const getImageUrl = () => {
    if (!negocio.logo || imageError) return null;
    try {
      return pb.files.getURL(negocio, negocio.logo);
    } catch (error) {
      return null;
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const estaAbierto = () => {
    if (!negocio.horario) return null;
    const horaActual = new Date().getHours();
    const diaActual = new Date().getDay();
    const horarioStr = negocio.horario.toLowerCase();
    
    // Verificar si está abierto hoy (basado en el texto del horario)
    const diasSemana = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
    const diaNombre = diasSemana[diaActual];
    const abiertoHoy = horarioStr.includes(diaNombre) || 
                       (diaActual >= 1 && diaActual <= 5 && horarioStr.includes('lun')) ||
                       (diaActual === 6 && horarioStr.includes('sáb')) ||
                       (diaActual === 0 && horarioStr.includes('dom'));
    
    return abiertoHoy && horaActual >= 9 && horaActual <= 20;
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (negocio.whatsapp) {
      let whatsappNumber = negocio.whatsapp.replace(/\D/g, '');
      if (!whatsappNumber.startsWith('52') && whatsappNumber.length === 10) {
        whatsappNumber = '52' + whatsappNumber;
      }
      window.open(`https://wa.me/${whatsappNumber}?text=Hola,%20vi%20tu%20negocio%20en%20MarketDesliz`, '_blank');
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
    const direccion = negocio.ubicacion || negocio.direccion;
    if (direccion) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(direccion)}`, '_blank');
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    const newValue = !favorite;
    setFavorite(newValue);
    if (onFavoriteToggle) {
      onFavoriteToggle(negocio.id, newValue);
    }
  };

  const isOpen = estaAbierto();
  const imageUrl = getImageUrl();

  // Vista de lista (horizontal)
  if (variant === 'list') {
    return (
      <Link href={`/negocios/${negocio.id}`}>
        <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row">
          {/* Imagen */}
          <div className="sm:w-48 h-32 sm:h-auto relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={negocio.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={32} className="text-gray-300" />
              </div>
            )}
            {isOpen !== null && (
              <div className={`absolute bottom-2 left-2 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                {isOpen ? 'Abierto' : 'Cerrado'}
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#6C3BFF] transition">
                    {negocio.nombre}
                  </h3>
                  {negocio.categoria && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {negocio.categoria}
                    </span>
                  )}
                </div>
                {negocio.direccion && (
                  <div className="flex items-start gap-1 text-gray-500 text-xs mt-1">
                    <MapPin size={12} className="shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{negocio.direccion}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleFavoriteClick}
                className={`p-1.5 rounded-lg transition ${favorite ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 mt-3">
              {negocio.telefono && (
                <button
                  onClick={handleCall}
                  className="flex-1 bg-gray-50 text-gray-600 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1"
                >
                  <Phone size={12} /> Llamar
                </button>
              )}
              {negocio.whatsapp && (
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition flex items-center justify-center gap-1"
                >
                  <MessageCircle size={12} /> WhatsApp
                </button>
              )}
              <button
                onClick={handleOpenMaps}
                className="px-2 bg-blue-500 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-600 transition flex items-center justify-center"
                title="Ver en mapa"
              >
                <Map size={12} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vista de cuadrícula (default)
  return (
    <Link href={`/negocios/${negocio.id}`}>
      <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        {/* Imagen/Logo */}
        <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={negocio.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 size={48} className="text-gray-300" />
            </div>
          )}
          
          {/* Badge de aliado */}
          <div className="absolute top-3 right-3 bg-[#6C3BFF] text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Building2 size={10} /> Aliado
          </div>
          
          {/* Indicador de estado abierto/cerrado */}
          {isOpen !== null && (
            <div className={`absolute bottom-3 left-3 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
              {isOpen ? 'Abierto ahora' : 'Cerrado'}
            </div>
          )}
        </div>

        {/* Información */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-[#6C3BFF] transition">
              {negocio.nombre}
            </h3>
            {negocio.categoria && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                {negocio.categoria.length > 20 ? negocio.categoria.substring(0, 18) + '…' : negocio.categoria}
              </span>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            {negocio.direccion && (
              <div className="flex items-start gap-2 text-gray-500">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                <span className="line-clamp-2 text-xs">{negocio.direccion}</span>
              </div>
            )}
            {negocio.telefono && (
              <div className="flex items-center gap-2 text-gray-500">
                <Phone size={12} />
                <span className="text-xs">{formatPhone(negocio.telefono)}</span>
              </div>
            )}
            {negocio.horario && (
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Clock size={12} />
                <span className="line-clamp-1">{negocio.horario}</span>
              </div>
            )}
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {negocio.visitas > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={10} /> {negocio.visitas}
              </span>
            )}
            {negocio.activo && (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle size={10} /> Verificado
              </span>
            )}
          </div>

          {/* Botones de acción */}
          {showActions && (
            <div className="flex gap-2 mt-4">
              {negocio.telefono && (
                <button
                  onClick={handleCall}
                  className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1"
                >
                  <Phone size={13} /> Llamar
                </button>
              )}
              {negocio.whatsapp && (
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition flex items-center justify-center gap-1"
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
              )}
              <button
                onClick={handleOpenMaps}
                className="px-3 bg-blue-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center"
                title="Ver en mapa"
              >
                <Map size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}