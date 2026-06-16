// src/pages/tandas/index.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Target,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Fuel,
  ShieldCheck,
  LogIn,
  XCircle,
  ArrowRight,
  Award,
  Star,
  Phone,
  Key,
  Eye,
  Lock
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function TandasPage() {
  const router = useRouter();
  const [tandas, setTandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [nivelCliente, setNivelCliente] = useState(0);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [unirseLoading, setUnirseLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTanda, setSelectedTanda] = useState(null);
  const [tandasBloqueadas, setTandasBloqueadas] = useState([]);
  const [nivelMaximoParticipado, setNivelMaximoParticipado] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      if (pb.authStore.isValid) {
        const currentUser = pb.authStore.model;
        setUser(currentUser);

        // Obtener nivel del cliente desde clients
        try {
          const clientRecord = await pb.collection('clients').getFirstListItem(
            `userId = "${currentUser.id}"`
          );
          setNivelCliente(clientRecord.nivel || 0);
        } catch (e) {
          setNivelCliente(0);
        }
      }
      await cargarTandas();
      setLoading(false);
    };

    checkAuth();
  }, []);

  // ✅ Cargar TODAS las tandas (sin filtrar por nivel)
  const cargarTandas = async () => {
    try {
      setLoading(true);
      const data = await pb.collection('tandas').getFullList({
        filter: 'estado = "abierta" && activa = true',
        sort: 'nivelRequerido, nombre'
      });

      // Obtener progreso de niveles del cliente si está autenticado
      let nivelMaximoParticipado = 0;
      if (user) {
        try {
          const participaciones = await pb.collection('tanda_members').getFullList({
            filter: `userId = "${user.id}"`,
            expand: 'tandaId'
          });

          // Encontrar el nivel máximo alcanzado
          for (const p of participaciones) {
            const nivelTanda = p.expand?.tandaId?.nivelRequerido || 0;
            if (nivelTanda > nivelMaximoParticipado) {
              nivelMaximoParticipado = nivelTanda;
            }
          }
        } catch (e) {
          console.log('Error obteniendo progreso:', e);
        }
      }

      const tandasConInfo = await Promise.all(
        data.map(async (tanda) => {
          const miembros = await pb.collection('tanda_members').getFullList({
            filter: `tandaId = "${tanda.id}"`
          });

          // Determinar si la tanda está bloqueada por nivel progresivo
          let bloqueadaPorProgreso = false;
          let mensajeBloqueo = '';

          if (user) {
            // Si nunca ha participado, solo puede unirse a nivel 1
            if (nivelMaximoParticipado === 0 && tanda.nivelRequerido > 1) {
              bloqueadaPorProgreso = true;
              mensajeBloqueo = `Debes comenzar desde nivel básico`;
            }
            // Si ya participó, solo puede unirse al siguiente nivel
            else if (nivelMaximoParticipado > 0 && tanda.nivelRequerido > nivelMaximoParticipado + 1) {
              bloqueadaPorProgreso = true;
              mensajeBloqueo = `Completa nivel ${nivelMaximoParticipado} primero`;
            }
          }

          return {
            ...tanda,
            miembrosActuales: miembros.length,
            cupoDisponible: (tanda.cupoMaximo || 20) - miembros.length,
            bloqueadaPorProgreso,
            mensajeBloqueo,
            nivelMaximoParticipado
          };
        })
      );

      setTandas(tandasConInfo);
      setNivelMaximoParticipado(nivelMaximoParticipado);
    } catch (error) {
      console.error('Error cargando tandas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnirseConCodigo = async () => {
    if (!user) {
      router.push('/solicitar?redirect=/tandas');
      return;
    }

    if (!codigoInvitacion.trim()) {
      setError('Ingresa un código de invitación');
      return;
    }

    setUnirseLoading(true);
    setError('');

    try {
      // Buscar la tanda por código
      const tanda = await pb.collection('tandas').getFirstListItem(
        `codigoInvitacion = "${codigoInvitacion.toUpperCase()}" && estado = "abierta"`
      );

      if (!tanda) {
        throw new Error('Código de invitación inválido');
      }

      // Verificar nivel
      if (tanda.nivelRequerido > nivelCliente) {
        throw new Error(`Necesitas nivel ${tanda.nivelRequerido} para unirte a esta tanda`);
      }

      // Verificar cupo
      const miembros = await pb.collection('tanda_members').getFullList({
        filter: `tandaId = "${tanda.id}"`
      });

      if (miembros.length >= (tanda.cupoMaximo || 20)) {
        throw new Error('Esta tanda ya está completa');
      }

      // Verificar si ya está inscrito
      const yaInscrito = await pb.collection('tanda_members').getFirstListItem(
        `tandaId = "${tanda.id}" && userId = "${user.id}"`
      ).catch(() => null);

      if (yaInscrito) {
        throw new Error('Ya estás inscrito en esta tanda');
      }

      // Crear miembro
      const nuevaPosicion = miembros.length + 1;
      await pb.collection('tanda_members').create({
        tandaId: tanda.id,
        userId: user.id,
        posicion: nuevaPosicion,
        estadoPago: 'al_corriente',
        gasFeePaid: false,
        codigoUsado: codigoInvitacion.toUpperCase()
      });

      // Actualizar tanda
      await pb.collection('tandas').update(tanda.id, {
        miembrosActuales: nuevaPosicion
      });

      alert(`✅ Te has unido a la tanda "${tanda.nombre}" exitosamente!`);
      setShowCodigoModal(false);
      setCodigoInvitacion('');
      cargarTandas();

    } catch (err) {
      setError(err.message);
    } finally {
      setUnirseLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const puedeUnirseVisualmente = (tanda) => {
    if (!user) return false;
    if (tanda.nivelRequerido > nivelCliente) return false;
    if (tanda.miembrosActuales >= (tanda.cupoMaximo || 20)) return false;
    return true;
  };

  const getRazonBloqueo = (tanda) => {
    if (!user) return 'Regístrate para unirte';
    if (tanda.nivelRequerido > nivelCliente) return `Requiere nivel ${tanda.nivelRequerido}`;
    if (tanda.miembrosActuales >= (tanda.cupoMaximo || 20)) return 'Tanda completa';
    return 'Requiere código de invitación';
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
        <title>Tandas Disponibles | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-40 pb-10">

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 mb-10 text-white shadow-lg">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Target size={32} />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold">Tandas MarketDesliz</h1>
                <p className="text-white/90 mt-1 text-sm">Únete a una tanda y recibe tu dinero en semanas</p>
                {user && (
                  <p className="text-white/80 text-sm mt-2">
                    Tu nivel actual: <span className="font-bold">Nivel {nivelCliente}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowCodigoModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition"
                >
                  <Key size={16} /> Tengo un código
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium">
                  <Fuel size={12} /> Gasolina: $25
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium">
                  <Calendar size={12} /> Pagos semanales
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium">
                  <ShieldCheck size={12} /> KYC requerido
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje motivacional */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center border border-blue-200">
            <p className="text-sm text-blue-700">
              🎯 ¿Ves una tanda que te interesa? Solicita un código de invitación a tu vendedor o administrador.
              ¡Cada tanda tiene su propio código único!
            </p>
          </div>

          {/* Lista de tandas */}
          {tandas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No hay tandas disponibles</h3>
              <p className="text-sm text-gray-400">Pronto abriremos nuevas tandas para ti</p>
              {!user && (
                <button
                  onClick={() => router.push('/solicitar?redirect=/tandas')}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-[#6C3BFF] text-white rounded-xl font-medium hover:bg-[#5a2ee6] transition"
                >
                  <Phone size={16} /> Registrarme ahora
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tandas.map((tanda) => {
                const totalMembers = tanda.cupoMaximo || 20;
                const miembrosActuales = tanda.miembrosActuales || 0;
                const disponibles = totalMembers - miembrosActuales;
                const progreso = (miembrosActuales / totalMembers) * 100;
                const puedeUnirse = puedeUnirseVisualmente(tanda);
                const razonBloqueo = getRazonBloqueo(tanda);

                return (
                  <div key={tanda.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 shadow-sm relative">
                    {/* Badde de requerimiento de código */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        <Key size={10} /> Código requerido
                      </span>
                    </div>

                    {/* Header de la tanda */}
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-5 text-white">
                      <h3 className="font-bold text-xl">{tanda.nombre}</h3>
                      {tanda.descripcion && (
                        <p className="text-white/80 text-sm mt-1 line-clamp-2">{tanda.descripcion}</p>
                      )}
                    </div>

                    {/* Cuerpo de la tanda */}
                    <div className="p-5 space-y-4">
                      {/* Monto */}
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-500 text-sm flex items-center gap-1">
                          <DollarSign size={14} /> Monto total
                        </span>
                        <span className="text-2xl font-bold text-[#6C3BFF]">{formatMoney(tanda.montoTotal || 0)}</span>
                      </div>

                      {/* Grid de información */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-gray-50 rounded-xl">
                          <Users size={14} className="mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Participantes</p>
                          <p className="font-bold text-gray-700">{miembrosActuales}/{totalMembers}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-xl">
                          <Award size={14} className="mx-auto text-purple-400 mb-1" />
                          <p className="text-xs text-gray-500">Nivel requerido</p>
                          <p className="font-bold text-purple-600">{tanda.nivelRequerido || 1}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-xl">
                          <Fuel size={14} className="mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Gasolina</p>
                          <p className="font-bold text-purple-600">$25</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-xl">
                          <Calendar size={14} className="mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Frecuencia</p>
                          <p className="font-bold text-gray-700 capitalize">
                            {tanda.frecuencia === 'semanal' ? 'Semanal' :
                              tanda.frecuencia === 'quincenal' ? 'Quincenal' : 'Mensual'}
                          </p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progreso de llenado</span>
                          <span>{Math.round(progreso)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#6C3BFF] rounded-full transition-all duration-300"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                      </div>

                      {/* Advertencia de nivel progresivo */}
                      {tanda.bloqueadaPorProgreso && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-start gap-2">
                            <Lock size={12} className="text-yellow-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-yellow-700">
                              {tanda.mensajeBloqueo || `Requiere nivel ${tanda.nivelRequerido}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Mostrar nivel requerido si está bloqueada por progreso */}
                      {!tanda.bloqueadaPorProgreso && tanda.nivelRequerido > 1 && (
                        <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-start gap-2">
                            <Award size={12} className="text-purple-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-purple-700">
                              ⚡ Esta tanda requiere nivel {tanda.nivelRequerido}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Badge de participantes */}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {disponibles} lugares disponibles
                        </span>
                        {tanda.codigoInvitacion && (
                          <span className="text-purple-500 text-xs">Código activo</span>
                        )}
                      </div>

                      {/* Botón unirse */}
                      {tanda.bloqueadaPorProgreso ? (
                        <div className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed">
                          <Lock size={16} /> Nivel bloqueado
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!user) {
                              router.push('/solicitar?redirect=/tandas');
                            } else {
                              setSelectedTanda(tanda);
                              setShowCodigoModal(true);
                            }
                          }}
                          className="w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                        >
                          <Key size={18} /> Unirse (requiere código)
                        </button>
                      )}

                      <p className="text-xs text-center text-gray-400">
                        🔐 Se requiere código de invitación para unirse
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Beneficios de tandas */}
          <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
            <h3 className="font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
              <Star size={18} className="text-purple-600" /> Beneficios de las tandas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <DollarSign size={18} className="text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-800">Sin intereses</p>
                <p className="text-xs text-gray-500">Recibe tu dinero sin pagar intereses</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Clock size={18} className="text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-800">Pagos flexibles</p>
                <p className="text-xs text-gray-500">Elige la frecuencia de pago</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck size={18} className="text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-800">100% seguro</p>
                <p className="text-xs text-gray-500">Sistema verificado y transparente</p>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>

      {/* Modal para ingresar código */}
      {showCodigoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCodigoModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key size={28} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ingresa tu código de invitación</h3>
              <p className="text-sm text-gray-500 mb-6">
                {selectedTanda ? `Para unirte a "${selectedTanda.nombre}"` : 'El código te fue proporcionado por un vendedor o administrador'}
              </p>

              <input
                type="text"
                value={codigoInvitacion}
                onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
                placeholder="Ej: A1B2C3D4"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg uppercase font-mono mb-4 focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                maxLength={8}
                autoFocus
              />

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCodigoModal(false);
                    setCodigoInvitacion('');
                    setError('');
                    setSelectedTanda(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUnirseConCodigo}
                  disabled={unirseLoading}
                  className="flex-1 px-4 py-2.5 bg-[#6C3BFF] text-white rounded-xl font-medium hover:bg-[#5a2ee6] transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {unirseLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Key size={16} /> Unirme
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}