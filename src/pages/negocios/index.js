// src/pages/negocios/index.js
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Store,
  Search,
  Filter,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Building2,
  Map,
  Users
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import {
  getNegocios,
  getMunicipios,
  getLocalidades,
  getEstados
} from '../../lib/negociosService';

export default function NegociosPage() {
  const router = useRouter();

  // ─── Parámetros de URL ────────────────────────────────────────────────
  const {
    search = '',
    categoria = 'todos',
    municipio = '',
    localidad = ''
  } = router.query;

  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [selectedCategoria, setSelectedCategoria] = useState(categoria || 'todos');
  const [selectedMunicipio, setSelectedMunicipio] = useState(municipio || '');
  const [selectedLocalidad, setSelectedLocalidad] = useState(localidad || '');
  const [showFilters, setShowFilters] = useState(false);

  // Datos geográficos
  const [municipios, setMunicipios] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  // Categorías disponibles (EXACTAMENTE las tuyas)
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
    'Tortillería', 'Veterinaria', 'Zapatería'
  ];

  // ─── Cargar municipios al iniciar (asumiendo Veracruz) ──────────────
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const estados = await getEstados();
        const veracruz = estados.find(e => e.nombre === 'Veracruz');
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

  // ─── Cargar localidades cuando cambia el municipio ───────────────────
  useEffect(() => {
    if (selectedMunicipio) {
      getLocalidades(selectedMunicipio)
        .then(setLocalidades)
        .catch(() => setLocalidades([]));
    } else {
      setLocalidades([]);
    }
  }, [selectedMunicipio]);

  // ─── Cargar negocios usando el servicio actualizado ─────────────────
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
        sort: 'orden, nombre'
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

  // ─── Sincronizar filtros con la URL ─────────────────────────────────
  const actualizarURL = () => {
    const query = {
      search: searchTerm || undefined,
      categoria: selectedCategoria !== 'todos' ? selectedCategoria : undefined,
      municipio: selectedMunicipio || undefined,
      localidad: selectedLocalidad || undefined
    };
    Object.keys(query).forEach(key => {
      if (query[key] === undefined || query[key] === '') delete query[key];
    });
    router.push({ pathname: '/negocios', query }, undefined, { shallow: true });
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleCategoriaChange = (value) => {
    setSelectedCategoria(value);
    actualizarURL();
  };

  const handleMunicipioChange = (e) => {
    const value = e.target.value;
    setSelectedMunicipio(value);
    setSelectedLocalidad('');
    actualizarURL();
  };

  const handleLocalidadChange = (e) => {
    const value = e.target.value;
    setSelectedLocalidad(value);
    actualizarURL();
  };

  // ─── Estadísticas (como las tenías originalmente) ──────────────────
  const stats = {
    total: negocios.length,
    verificados: negocios.filter(n => n.estadoActivacion === 'activo').length,
    categorias: categorias.filter(c => c !== 'todos').length
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

  return (
    <>
      <Head>
        <title>Negocios Locales | MarketDesliz</title>
        <meta name="description" content="Descubre los negocios locales que confían en MarketDesliz. Encuentra tiendas, servicios y más en tu comunidad." />
      </Head>

      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-40 pb-10">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Negocios Locales</h1>
            <p className="text-gray-500 mt-2 text-sm max-w-2xl mx-auto">
              Negocios locales que confían en MarketDesliz.
              <span className="text-[#6C3BFF] font-medium"> Encuéntralos y apóyalos</span>
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 text-xs px-3 py-1.5 rounded-full">
              <Building2 size={12} /> Negocios con lona de MarketDesliz
            </div>
          </div>

          {/* ── Estadísticas de negocios activos ─────────── */}
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#6C3BFF]">{stats.total}</div>
              <div className="text-xs text-gray-500">Negocios activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.verificados}</div>
              <div className="text-xs text-gray-500">Verificados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.categorias}</div>
              <div className="text-xs text-gray-500">Categorías</div>
            </div>
          </div>

          {/* ── Búsqueda y filtros ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, categoría o ubicación..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Filtros escritorio */}
              <div className="hidden md:flex gap-2 flex-wrap items-center">
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <select
                    value={selectedCategoria}
                    onChange={(e) => handleCategoriaChange(e.target.value)}
                    className="px-4 py-2.5 pl-10 border border-gray-200 rounded-xl bg-white appearance-none cursor-pointer min-w-[200px]"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'todos' ? '📋 Todas las categorías' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={selectedMunicipio}
                  onChange={handleMunicipioChange}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                >
                  <option value="">Todos los municipios</option>
                  {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>

                <select
                  value={selectedLocalidad}
                  onChange={handleLocalidadChange}
                  disabled={!selectedMunicipio}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                >
                  <option value="">Todas las localidades</option>
                  {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>

              {/* Botón filtros mobile */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <Filter size={16} /> Filtros
              </button>
            </div>

            {/* Filtros mobile desplegables */}
            {showFilters && (
              <div className="md:hidden mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Categoría</span>
                  <select
                    value={selectedCategoria}
                    onChange={(e) => handleCategoriaChange(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                  >
                    {categorias.map(cat => <option key={cat} value={cat}>{cat === 'todos' ? '📋 Todas las categorías' : cat}</option>)}
                  </select>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Municipio</span>
                  <select value={selectedMunicipio} onChange={handleMunicipioChange} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm">
                    <option value="">Todos los municipios</option>
                    {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Localidad</span>
                  <select value={selectedLocalidad} onChange={handleLocalidadChange} disabled={!selectedMunicipio} className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm">
                    <option value="">Todas las localidades</option>
                    {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </div>
                <button onClick={() => setShowFilters(false)} className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm">
                  Aplicar filtros
                </button>
              </div>
            )}

            <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
              <Store size={14} />
              {negocios.length} {negocios.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}
            </div>
          </div>

          {/* ── Lista de negocios ────────────────────────────────── */}
          {negocios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No se encontraron negocios</h3>
              <p className="text-sm text-gray-400">Intenta con otra búsqueda o categoría</p>
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl max-w-md mx-auto">
                <p className="text-sm text-yellow-800 font-medium">¿Eres dueño de un negocio?</p>
                <p className="text-xs text-yellow-700 mt-1">Registra tu negocio y actívalo realizando tu primera compra en MarketDesliz para aparecer aquí.</p>
                <Link href="/negocios/registro" className="inline-block mt-3 text-sm text-[#6C3BFF] font-medium hover:underline">
                  Registrar mi negocio →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {negocios.map((negocio) => (
                <NegocioCard key={negocio.id} negocio={negocio} />
              ))}
            </div>
          )}

          {/* ── Footer - Invitación a nuevos negocios ────────────── */}
          <div className="mt-12">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
              <div className="w-12 h-12 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-[#6C3BFF]" />
              </div>
              <h3 className="font-bold text-gray-900 text-center mb-1">¿Eres dueño de un negocio?</h3>
              <p className="text-gray-500 text-sm text-center mb-4 max-w-md mx-auto">
                Únete a nuestra red de negocios aliados. Coloca una lona de MarketDesliz en tu local
                y aparecerás aquí para que más clientes te encuentren.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/negocios/registro"
                  className="inline-flex items-center justify-center gap-2 bg-[#6C3BFF] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#5b2ee6] transition text-sm"
                >
                  <Building2 size={16} /> Registrar mi negocio
                </Link>
                <a
                  href="https://wa.me/522821414939?text=Hola,%20quiero%20ser%20negocio%20aliado%20de%20MarketDesliz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition text-sm"
                >
                  <MessageCircle size={16} /> Contactar por WhatsApp
                </a>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200 text-center">
                <p className="text-xs text-purple-600">
                  ⚡ Los negocios se activan automáticamente después de tu primera compra en MarketDesliz
                </p>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}

// ── Componente Tarjeta de Negocio (SIN CAMBIOS) ──────────────────────
function NegocioCard({ negocio }) {
  const router = useRouter();

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
    if (negocio.ubicacion) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(negocio.ubicacion)}`, '_blank');
    } else if (negocio.direccion) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(negocio.direccion)}`, '_blank');
    }
  };

  const isOpen = estaAbierto();

  return (
    <div
      onClick={() => router.push(`/negocios/${negocio.id}`)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      {/* Imagen/Logo */}
      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {getImageUrl() ? (
          <img
            src={getImageUrl()}
            alt={negocio.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={48} className="text-gray-300" />
          </div>
        )}

        {/* Badge de aliado */}
        <div className="absolute top-3 right-3 bg-[#6C3BFF] text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Building2 size={10} /> Aliado
        </div>

        {/* Indicador de estado abierto/cerrado */}
        {negocio.horario && (
          <div className={`absolute bottom-3 left-3 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
            {isOpen ? 'Abierto ahora' : 'Cerrado'}
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1">
            {negocio.nombre}
          </h3>
          {negocio.categoria && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
              {negocio.categoria.length > 20 ? negocio.categoria.substring(0, 18) + '…' : negocio.categoria}
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-gray-500">
            <MapPin size={14} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2 text-xs">{negocio.direccion || 'Dirección no disponible'}</span>
          </div>
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

        {/* Botones de acción */}
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
      </div>
    </div>
  );
}