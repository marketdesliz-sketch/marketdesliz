// src/pages/tandas/unirse/[id].js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Target,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Fuel,
  ShieldCheck,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Award,
  Crown,
  Star,
  AlertCircle,
  CreditCard,
  ListChecks,
  Hash,
  TrendingUp,
  Zap,
  Gift,
  HeartHandshake
} from 'lucide-react';
import StoreLayout from '../../../layouts/StoreLayout';
import {
  getTandaById,
  getMiembrosTanda,
  joinTanda,
  pagarGasolina,
  getAvailablePositions,
  selectPosition,
  getMemberByClientAndTanda,
  canJoinTandaProgresivo,
  getNivelTandaPermitido
} from '../../../lib/tandasService';
import { getClientKYC } from '../../../lib/kycService';
import pb from '../../../lib/pocketbase';

export default function UnirseTandaPage() {
  const router = useRouter();
  const { id } = router.query;

  const [tanda, setTanda] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [clienteId, setClienteId] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState(null);
  const [posicionesDisponibles, setPosicionesDisponibles] = useState([]);
  const [posicionSeleccionada, setPosicionSeleccionada] = useState(null);
  const [posicionFinal, setPosicionFinal] = useState(null);
  const [mostrarContrato, setMostrarContrato] = useState(false);
  const [contratoAceptado, setContratoAceptado] = useState(false);
  const [nivelPermitido, setNivelPermitido] = useState(null);
  const [nivelMaximoParticipado, setNivelMaximoParticipado] = useState(0);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    const user = pb.authStore.model;
    setClienteId(user.id);
    setCliente(user);

    if (id) {
      cargarDatos(user.id);
    }
  }, [id]);

  const cargarDatos = async (clientId) => {
    try {
      setLoading(true);

      const [tandaData, miembrosData] = await Promise.all([
        getTandaById(id),
        getMiembrosTanda(id)
      ]);

      setTanda(tandaData);

      // Dentro de cargarDatos, después de setTanda(tandaData)
      const { nivelPermitido, nivelMaximoParticipado, haParticipado } = await getNivelTandaPermitido(clientId);
      setNivelPermitido(nivelPermitido);
      setNivelMaximoParticipado(nivelMaximoParticipado);

      // Validar si puede unirse a esta tanda por nivel progresivo
      if (!haParticipado && tandaData.nivelRequerido > 1) {
        setError(`Debes comenzar desde el nivel básico de tandas. Esta tanda requiere nivel ${tandaData.nivelRequerido}.`);
        return;
      }

      if (haParticipado && tandaData.nivelRequerido > nivelPermitido) {
        setError(`Completa primero las tandas de nivel ${nivelPermitido - 1} antes de unirte a esta.`);
        return;
      }

      setMiembros(miembrosData);

      const kyc = await getClientKYC(clientId);
      if (kyc?.estado !== 'aprobado') {
        setError('Debes completar la verificación KYC para unirte a una tanda');
        router.push('/kyc?redirect=' + encodeURIComponent(router.asPath));
        return;
      }

      const miembroExistente = miembrosData.find(m => m.userId === clientId);
      if (miembroExistente) {
        setMemberId(miembroExistente.id);

        if (miembroExistente.gasFeePaid && miembroExistente.posicion > 1) {
          setPosicionFinal(miembroExistente.posicion);
          setPaso(5);
        }
        else if (miembroExistente.gasFeePaid && miembroExistente.posicion === (miembrosData.length)) {
          const disponibles = await getAvailablePositions(id);
          setPosicionesDisponibles(disponibles);
          setPaso(4);
        }
        else if (!miembroExistente.gasFeePaid) {
          setPaso(3);
        }
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar la información de la tanda');
    } finally {
      setLoading(false);
    }
  };

  const handleUnirse = async () => {
    try {
      setProcesando(true);
      setError('');

      const miembro = await joinTanda(clienteId, id);
      setMemberId(miembro.id);
      setPaso(2);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al unirse a la tanda');
    } finally {
      setProcesando(false);
    }
  };

  const handlePagarGasolina = async () => {
    try {
      setProcesando(true);
      setError('');

      if (!memberId) {
        const miembrosActualizados = await getMiembrosTanda(id);
        const miMiembro = miembrosActualizados.find(m => m.userId === clienteId);

        if (!miMiembro) {
          throw new Error('No se encontró tu membresía');
        }
        setMemberId(miMiembro.id);
        await pagarGasolina(miMiembro.id);
      } else {
        await pagarGasolina(memberId);
      }

      const disponibles = await getAvailablePositions(id);
      setPosicionesDisponibles(disponibles);
      setPaso(4);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  const handleSeleccionarPosicion = async () => {
    if (!posicionSeleccionada) {
      setError('Selecciona un número disponible');
      return;
    }

    try {
      setProcesando(true);
      setError('');

      await selectPosition(memberId, posicionSeleccionada);
      setPosicionFinal(posicionSeleccionada);
      setPaso(5);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al seleccionar tu posición');
    } finally {
      setProcesando(false);
    }
  };

  const handleAceptarContrato = () => {
    setContratoAceptado(true);
    setMostrarContrato(false);
    setPaso(3);
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Por determinar';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFechaEntrega = () => {
    if (!posicionFinal || !tanda) return 'Por determinar';

    const fechaInicio = new Date(tanda.fechaInicio || tanda.startDate || new Date());
    const semanasEspera = posicionFinal - 1;

    const freq = tanda.frecuencia || tanda.frequency;
    if (freq === 'semanal' || freq === 'weekly') {
      fechaInicio.setDate(fechaInicio.getDate() + (semanasEspera * 7));
    } else if (freq === 'quincenal' || freq === 'biweekly') {
      fechaInicio.setDate(fechaInicio.getDate() + (semanasEspera * 14));
    } else {
      fechaInicio.setMonth(fechaInicio.getMonth() + semanasEspera);
    }

    return formatDate(fechaInicio);
  };

  const getPosicionTexto = () => {
    if (!posicionFinal) return '';

    if (posicionFinal === 1) return 'Administrador';
    if (posicionFinal <= 5) return 'Posición preferente';
    return `Posición ${posicionFinal}`;
  };

  const getPosicionIcono = () => {
    if (!posicionFinal) return null;
    if (posicionFinal === 1) return Crown;
    if (posicionFinal <= 5) return Star;
    return Hash;
  };

  const steps = [
    { num: 1, label: 'Información', icon: Target },
    { num: 2, label: 'Términos', icon: FileText },
    { num: 3, label: 'Gasolina', icon: Fuel },
    { num: 4, label: 'Elegir #', icon: Hash },
    { num: 5, label: 'Confirmar', icon: CheckCircle }
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

  if (error && paso === 1 && !tanda) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 pt-40 pb-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <Link href="/tandas" className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition">
              <ArrowLeft size={16} /> Volver a tandas
            </Link>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const PosicionIcono = getPosicionIcono();

  return (
    <>
      <Head>
        <title>Unirse a {tanda?.nombre || 'Tanda'} | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-40 pb-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Header de la tanda */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{tanda?.nombre}</h1>
                  {tanda?.descripcion && <p className="text-white/80 text-sm">{tanda?.descripcion}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium">
                  <DollarSign size={12} /> {formatMoney(tanda?.montoTotal || tanda?.monto)} por turno
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium">
                  <Calendar size={12} /> {(tanda?.frecuencia || tanda?.frequency) === 'semanal' || (tanda?.frecuencia || tanda?.frequency) === 'weekly' ? 'Semanal' :
                    (tanda?.frecuencia || tanda?.frequency) === 'quincenal' || (tanda?.frecuencia || tanda?.frequency) === 'biweekly' ? 'Quincenal' : 'Mensual'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium">
                  <Users size={12} /> {miembros.length}/{tanda?.cupoMaximo || tanda?.totalMembers || 0} participantes
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Steps */}
              <div className="flex justify-between mb-8">
                {steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = paso >= step.num;
                  const isCompleted = paso > step.num;

                  return (
                    <div key={step.num} className="flex-1 text-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 transition-all
                        ${isActive ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100 text-gray-400'}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                      `}>
                        {isCompleted ? <CheckCircle size={16} /> : <StepIcon size={16} />}
                      </div>
                      <span className={`text-xs ${isActive ? 'text-[#6C3BFF] font-medium' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Advertencia de nivel progresivo */}
              {nivelPermitido && tanda?.nivelRequerido > nivelPermitido && (
                <div className="m-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">⚠️ Nivel no disponible</p>
                      <p className="text-xs text-yellow-700">
                        Completa primero las tandas de nivel {nivelPermitido - 1} para desbloquear este nivel.
                        Tu progreso actual: nivel máximo participado {nivelMaximoParticipado}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Contrato Digital */}
              {mostrarContrato && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setMostrarContrato(false)}>
                  <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={18} className="text-[#6C3BFF]" /> Contrato de Participación
                      </h2>
                    </div>
                    <div className="p-6 space-y-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Responsabilidades del participante:</p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          <li>Realizar los pagos semanales de forma puntual en la fecha acordada.</li>
                          <li>Mantener comunicación con el administrador ante cualquier eventualidad.</li>
                          <li>Los pagos atrasados afectan a todo el grupo y pueden resultar en la pérdida de tu turno.</li>
                          <li>Aceptar que la posición #1 es del administrador (MarketDesliz).</li>
                          <li>El pago de gasolina de $25 es único y no reembolsable.</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Condiciones generales:</p>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          <li>El orden de turnos se define por antigüedad y selección del participante.</li>
                          <li>Cualquier incumplimiento puede resultar en la exclusión de futuras tandas.</li>
                          <li>La información de los participantes es visible solo para miembros de la tanda.</li>
                          <li>MarketDesliz actúa como administrador y facilitador del grupo.</li>
                        </ul>
                      </div>
                      <p className="text-xs text-gray-400 pt-2">
                        Al aceptar, confirmas que has leído y comprendes todos los términos y condiciones.
                      </p>
                    </div>
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
                      <button onClick={() => setMostrarContrato(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cancelar</button>
                      <button onClick={handleAceptarContrato} className="flex-1 px-4 py-2.5 bg-[#6C3BFF] text-white rounded-xl font-medium hover:bg-[#5a2ee6] transition">Aceptar y continuar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 1: Información */}
              {paso === 1 && (
                <>
                  {/* Progreso de niveles de tandas */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <TrendingUp size={14} className="text-purple-600" /> Tu progreso en tandas
                    </h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">Nivel máximo alcanzado</span>
                      <span className="text-sm font-bold text-purple-600">Nivel {nivelMaximoParticipado || 1}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((nivelMaximoParticipado || 0) / 10) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {nivelMaximoParticipado === 0
                        ? '📌 Esta será tu primera tanda (Nivel 1)'
                        : `🎯 Puedes unirte a tandas hasta nivel ${nivelPermitido || nivelMaximoParticipado + 1}`}
                    </p>
                    {tanda?.nivelRequerido > (nivelPermitido || nivelMaximoParticipado + 1) && (
                      <div className="mt-2 p-2 bg-yellow-100 rounded-lg">
                        <p className="text-xs text-yellow-700 flex items-center gap-1">
                          <AlertCircle size={12} /> Esta tanda requiere nivel {tanda.nivelRequerido}.
                          Completa primero las tandas de nivel {nivelPermitido || nivelMaximoParticipado + 1}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Users size={18} className="text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Participantes</p>
                      <p className="text-xl font-bold text-gray-900">{miembros.length} / {tanda?.cupoMaximo || tanda?.totalMembers || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <TrendingUp size={18} className="text-green-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Disponibles</p>
                      <p className="text-xl font-bold text-green-600">{(tanda?.cupoMaximo || tanda?.totalMembers || 0) - miembros.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Fuel size={18} className="text-orange-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Gasolina</p>
                      <p className="text-xl font-bold text-gray-900">$25</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Hash size={18} className="text-purple-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Tu posición</p>
                      <p className="text-sm font-medium text-gray-700">A elegir después</p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Users size={16} /> Miembros actuales</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                    {miembros.map((m) => (
                      <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#6C3BFF] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {m.posicion}
                          </div>
                          <span className="font-medium text-gray-900">
                            {m.posicion === 1 ? 'MarketDesliz (Admin)' : `Participante ${m.posicion}`}
                            {m.posicion <= 5 && m.posicion > 1 && <Star size={12} className="inline ml-1 text-yellow-500" />}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle size={10} /> Activo
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleUnirse}
                    disabled={procesando || miembros.length >= (tanda?.cupoMaximo || tanda?.totalMembers || 0) || (tanda?.nivelRequerido > (nivelPermitido || nivelMaximoParticipado + 1))}
                    className="w-full bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {procesando ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowLeft size={16} className="rotate-180" />}
                    {procesando ? 'Procesando...' : (miembros.length >= (tanda?.cupoMaximo || tanda?.totalMembers || 0) ? 'Tanda completa' : 'Continuar')}
                  </button>

                  <Link href="/tandas" className="flex items-center justify-center gap-1 w-full mt-3 text-center text-sm text-gray-500 hover:text-[#6C3BFF] transition py-2">
                    <ArrowLeft size={14} /> Volver a tandas
                  </Link>
                </>
              )}

              {/* PASO 2: Términos */}
              {paso === 2 && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-[#6C3BFF]" /> Términos y responsabilidades</h2>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm max-h-64 overflow-y-auto">
                    <p className="font-semibold text-[#6C3BFF]">Al unirte a esta tanda, aceptas:</p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> Realizar los pagos semanales de forma puntual</li>
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> La posición 1 es del administrador (MarketDesliz)</li>
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> No abandonar la tanda después de recibir el dinero</li>
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> Pagar la gasolina de $25 (único pago)</li>
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> Respetar el orden de turnos establecido</li>
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> Los pagos atrasados afectan a todo el grupo</li>
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> La posición se elige después del pago de gasolina</li>
                      <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5" /> No puedes elegir la posición #1</li>
                    </ul>
                  </div>

                  <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aceptaTerminos}
                      onChange={(e) => setAceptaTerminos(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#6C3BFF] focus:ring-[#6C3BFF]"
                    />
                    <span className="text-sm text-gray-600">He leído y acepto los términos y condiciones, y acepto las responsabilidades como participante</span>
                  </label>

                  <button
                    onClick={() => setMostrarContrato(true)}
                    disabled={!aceptaTerminos}
                    className="w-full bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ver contrato digital
                  </button>

                  <button onClick={() => setPaso(1)} className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-gray-500 hover:text-[#6C3BFF] transition py-2">
                    <ArrowLeft size={14} /> Volver
                  </button>
                </>
              )}

              {/* PASO 3: Gasolina */}
              {paso === 3 && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Fuel size={28} className="text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Pago único de inscripción</h2>
                    <p className="text-sm text-gray-500 mt-1">Este pago cubre los gastos de administración de la tanda</p>
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 rounded-full mt-3">
                      <DollarSign size={14} className="text-green-600" />
                      <span className="font-bold text-green-700">GASOLINA: $25</span>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-100">
                    <p className="text-sm text-purple-700 text-center">💡 Después del pago podrás elegir tu número de posición</p>
                  </div>

                  <button
                    onClick={handlePagarGasolina}
                    disabled={procesando}
                    className="w-full bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {procesando ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Fuel size={16} />}
                    {procesando ? 'Procesando pago...' : 'Pagar $25 y continuar'}
                  </button>

                  <button onClick={() => setPaso(2)} className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-gray-500 hover:text-[#6C3BFF] transition py-2">
                    <ArrowLeft size={14} /> Volver
                  </button>
                </>
              )}

              {/* PASO 4: Seleccionar número */}
              {paso === 4 && (
                <>
                  <h2 className="text-lg font-bold text-gray-900 text-center mb-2">🎯 Elige tu número</h2>
                  <p className="text-center text-sm text-gray-500 mb-4">Selecciona la posición que deseas en la tanda</p>

                  <div className="bg-yellow-50 rounded-xl p-3 mb-5 border border-yellow-100">
                    <p className="text-xs text-yellow-700 text-center">
                      ⚠️ <strong>Importante:</strong> La posición #1 es del administrador (MarketDesliz) y no está disponible.
                      Elige entre los números disponibles en verde.
                    </p>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-6">
                    {Array.from({ length: tanda?.cupoMaximo || tanda?.totalMembers || 0 }, (_, i) => i + 1).map(num => {
                      const isAvailable = posicionesDisponibles.includes(num);
                      const isSelected = posicionSeleccionada === num;
                      const isAdmin = num === 1;

                      return (
                        <button
                          key={num}
                          onClick={() => {
                            if (isAvailable) {
                              setPosicionSeleccionada(num);
                              setError('');
                            } else if (isAdmin) {
                              setError('La posición #1 es del administrador');
                            } else {
                              setError('Esta posición ya está ocupada');
                            }
                          }}
                          className={`
                            p-3 rounded-xl text-center transition-all
                            ${isSelected ? 'bg-[#6C3BFF] text-white shadow-md scale-105' : ''}
                            ${isAvailable && !isSelected ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' : ''}
                            ${!isAvailable && !isAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                            ${isAdmin && !isSelected ? 'bg-red-100 text-gray-400 cursor-not-allowed' : ''}
                          `}
                          disabled={!isAvailable && !isSelected}
                        >
                          <div className="text-xl font-bold">{num}</div>
                          <div className="text-xs mt-1">
                            {isAdmin ? 'Admin' : (isAvailable ? 'Disponible' : 'Ocupado')}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSeleccionarPosicion}
                    disabled={!posicionSeleccionada || procesando}
                    className="w-full bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {procesando ? 'Guardando...' : `Confirmar posición #${posicionSeleccionada || '?'}`}
                  </button>

                  <button onClick={() => setPaso(3)} className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-gray-500 hover:text-[#6C3BFF] transition py-2">
                    <ArrowLeft size={14} /> Volver
                  </button>
                </>
              )}

              {/* PASO 5: Confirmación final */}
              {paso === 5 && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">¡Te has unido exitosamente!</h2>
                    <p className="text-sm text-gray-500 mt-1">Ya eres parte de la tanda {tanda?.nombre}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      {PosicionIcono && <PosicionIcono size={18} className="text-purple-500 mx-auto mb-1" />}
                      <p className="text-xs text-gray-500">Tu posición</p>
                      <p className="text-lg font-bold text-purple-600">{getPosicionTexto()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <Calendar size={18} className="text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Fecha estimada de entrega</p>
                      <p className="text-sm font-bold text-gray-900">{getFechaEntrega()}</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-100">
                    <h3 className="font-semibold text-purple-700 mb-2 flex items-center gap-2"><ListChecks size={16} /> Próximos pasos:</h3>
                    <ul className="space-y-1 text-sm text-purple-700">
                      <li className="flex items-center gap-2"><CheckCircle size={12} /> Pago de gasolina completado</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} /> Posición #{posicionFinal} confirmada</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} /> Espera a que comience la tanda</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} /> Realiza tus pagos semanales puntualmente</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} /> Recibirás tu dinero en la semana {posicionFinal}</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} /> El cobrador te visitará en la fecha acordada</li>
                    </ul>
                  </div>

                  <Link href="/tandas/mis-tandas" className="w-full bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition flex items-center justify-center gap-2">
                    <Target size={16} /> Ver mis tandas
                  </Link>

                  <Link href="/" className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-gray-500 hover:text-[#6C3BFF] transition py-2">
                    <ArrowLeft size={14} /> Volver al inicio
                  </Link>
                </>
              )}

              {/* Información de pago en dos partes */}
              {tanda?.pagoEnDosPartes && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <span>💰</span> Pago en dos partes
                  </h4>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Primera parte (50%): Al recibir tu turno</li>
                    <li>• Segunda parte (50% restante): Al finalizar la tanda</li>
                    <li>• Recibirás un recordatorio para la segunda parte</li>
                  </ul>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}