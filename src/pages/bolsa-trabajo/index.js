// src/pages/bolsa-trabajo/index.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Briefcase, Plus, LogIn, LayoutGrid, Building2,
  Search, DollarSign, MapPin, Clock, Phone, Mail,
  Inbox, ChevronRight
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function BolsaTrabajoPage() {
  const router = useRouter();
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(pb.authStore.model);
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('bolsa_trabajo').getFullList({
        filter: 'estado = "aprobado" && activo = true',
        sort: '-created',
        expand: 'userId'
      });
      setOfertas(records);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOfertasFiltradas = () => {
    if (filtro === 'todos') return ofertas;
    return ofertas.filter(o => o.tipo === filtro);
  };

  const filtros = [
    { id: 'todos', label: 'Todos', icon: LayoutGrid, count: ofertas.length },
    { id: 'ofrezco_trabajo', label: 'Ofrezco trabajo', icon: Building2, count: ofertas.filter(o => o.tipo === 'ofrezco_trabajo').length },
    { id: 'busco_trabajo', label: 'Busco trabajo', icon: Search, count: ofertas.filter(o => o.tipo === 'busco_trabajo').length },
  ];

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  const ofertasFiltradas = getOfertasFiltradas();

  return (
    <>
      <Head>
        <title>Bolsa de Trabajo | MarketDesliz</title>
        <meta name="description" content="Encuentra trabajo u ofrece empleo en tu comunidad" />
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-40 pb-10">

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#6C3BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase size={26} className="text-[#6C3BFF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bolsa de Trabajo</h1>
            <p className="text-gray-500 mt-2 text-sm">Encuentra trabajo u ofrece empleo en tu comunidad</p>
          </div>

          {/* ── Acciones ───────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Link
              href="/bolsa-trabajo/publicar"
              className="flex items-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              <Plus size={16} /> Publicar oferta
            </Link>
            {!user && (
              <Link
                href="/solicitar?redirect=/bolsa-trabajo"
                className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:border-[#6C3BFF] hover:text-[#6C3BFF] px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <LogIn size={16} /> Iniciar sesión para publicar
              </Link>
            )}
          </div>

          {/* ── Filtros ────────────────────────────────────────── */}
          <div className="flex gap-2 mb-7 flex-wrap justify-center">
            {filtros.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filtro === id
                  ? 'bg-[#6C3BFF] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6C3BFF] hover:text-[#6C3BFF]'
                  }`}
              >
                <Icon size={14} /> {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filtro === id ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── Lista ──────────────────────────────────────────── */}
          {ofertasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <Inbox size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay ofertas disponibles</h3>
              <p className="text-sm text-gray-400">Sé el primero en publicar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ofertasFiltradas.map((oferta) => {
                const esOferta = oferta.tipo === 'ofrezco_trabajo';
                return (
                  <div
                    key={oferta.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Tira de color */}
                    <div className={`h-1.5 w-full ${esOferta ? 'bg-[#6C3BFF]' : 'bg-[#10b981]'}`} />

                    <div className="p-5">
                      {/* Badge + fecha */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${esOferta ? 'bg-[#6C3BFF]/8 text-[#6C3BFF]' : 'bg-[#10b981]/10 text-[#10b981]'
                          }`}>
                          {esOferta ? <Building2 size={11} /> : <Search size={11} />}
                          {esOferta ? 'Ofrezco trabajo' : 'Busco trabajo'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(oferta.created)}</span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{oferta.titulo}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">{oferta.categoria}</p>
                      <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed">{oferta.descripcion}</p>

                      {/* Detalles */}
                      <div className="space-y-1.5 mb-4">
                        {oferta.salario && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign size={13} className="text-[#10b981] shrink-0" />
                            <span className="font-semibold text-[#10b981]">{oferta.salario}</span>
                          </div>
                        )}
                        {oferta.ubicacion && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            {oferta.ubicacion}
                          </div>
                        )}
                        {oferta.horario && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={13} className="text-gray-400 shrink-0" />
                            {oferta.horario}
                          </div>
                        )}
                      </div>

                      {/* Contacto */}
                      <div className="pt-4 border-t border-gray-50 space-y-1.5">
                        {oferta.telefono && (
                          <a
                            href={`tel:${oferta.telefono}`}
                            className="flex items-center gap-2 text-sm text-[#6C3BFF] hover:underline"
                          >
                            <Phone size={13} /> {oferta.telefono}
                          </a>
                        )}
                        {oferta.email && (
                          <a
                            href={`mailto:${oferta.email}`}
                            className="flex items-center gap-2 text-sm text-[#6C3BFF] hover:underline"
                          >
                            <Mail size={13} /> {oferta.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </StoreLayout>
    </>
  );
}