// src/pages/tandas/mis-tandas.js
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Target,
  ArrowLeft,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
  Eye,
  FileText,
  ChevronRight,
  Award,
  Crown,
  Star,
  CalendarDays,
  CreditCard,
  Percent,
  History,
  Zap,
  Filter,
  RefreshCw,
  Bell
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import {
  getClientTandas,
  getTandaPayments,
  getMiembroById
} from '../../lib/tandasService';
import {
  enviarRecordatorioManual,
  getEstadoPagoMiembro
} from '../../lib/tandaPagosService';

export default function MisTandasPage() {
  const router = useRouter();
  const { estado = 'todas', page = 1 } = router.query;

  const [tandas, setTandas] = useState([]);
  const [filteredTandas, setFilteredTandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTanda, setSelectedTanda] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [showPagosModal, setShowPagosModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState(estado);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    totalInvertido: 0,
    totalRecibido: 0,
    tandasActivas: 0,
    tandasCompletadas: 0,
    tandasPendientes: 0
  });
  const itemsPerPage = 10;

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const cargarMisTandas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const user = pb.authStore.model;
      if (!user) {
        router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
        return;
      }

      const misTandas = await getClientTandas(user.id);

      // Calcular estadísticas reales
      let totalInvertido = 0;
      let totalRecibido = 0;
      let activas = 0;
      let completadas = 0;
      let pendientes = 0;

      // Para cada tanda, obtener los pagos reales y calcular montos
      const tandasConPagos = await Promise.all(
        misTandas.map(async (tanda) => {
          try {
            const pagosData = await getTandaPayments(tanda.id);
            const pagosRealizados = pagosData.filter(p => p.estado === 'pagado');
            const totalPagado = pagosRealizados.reduce((sum, p) => sum + (p.monto || 0), 0);

            // Obtener estado de pago en dos partes
            const estadoPago = await getEstadoPagoMiembro(tanda.id);

            return {
              ...tanda,
              pagos: pagosData,
              totalPagado,
              pagosRealizadosCount: pagosRealizados.length,
              estadoPagoCompleto: estadoPago,
              montoTotalTanda: tanda.monto || 0
            };
          } catch (e) {
            console.warn('Error obteniendo pagos para tanda', tanda.id, e);
            return {
              ...tanda,
              pagos: [],
              totalPagado: 0,
              pagosRealizadosCount: 0,
              estadoPagoCompleto: { estadoCompleto: false },
              montoTotalTanda: tanda.monto || 0
            };
          }
        })
      );

      setTandas(tandasConPagos);

      // Calcular estadísticas
      tandasConPagos.forEach(t => {
        const estado = t.estadoPago || 'pendiente';
        if (estado === 'pagado' || t.estadoPagoCompleto?.estadoCompleto) {
          completadas++;
          totalRecibido += t.montoTotalTanda || 0;
        } else if (estado === 'al_corriente' || estado === 'pendiente') {
          if (t.pagoPrimeraParte && !t.pagoSegundaParte) {
            pendientes++;
          } else {
            activas++;
          }
          totalInvertido += t.totalPagado || 0;
        } else {
          pendientes++;
        }
      });

      setStats({
        totalInvertido,
        totalRecibido,
        tandasActivas: activas,
        tandasCompletadas: completadas,
        tandasPendientes: pendientes
      });

    } catch (err) {
      console.error('Error cargando mis tandas:', err);
      setError('No pudimos cargar tus tandas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ─── Aplicar filtro y paginación ──────────────────────────────────────
  const tandasFiltradas = useMemo(() => {
    let result = tandas;
    if (filtroEstado !== 'todas') {
      result = result.filter(t => {
        const estado = t.estadoPago || 'pendiente';
        if (filtroEstado === 'activas') {
          return estado === 'al_corriente' || estado === 'pendiente';
        }
        if (filtroEstado === 'completadas') {
          return estado === 'pagado' || t.estadoPagoCompleto?.estadoCompleto;
        }
        if (filtroEstado === 'pendientes') {
          return estado === 'pendiente' || (t.pagoPrimeraParte && !t.pagoSegundaParte);
        }
        return true;
      });
    }
    // Ordenar: primero activas, luego pendientes, luego completadas
    result.sort((a, b) => {
      const order = { 'al_corriente': 0, 'pendiente': 1, 'pagado': 2 };
      const aOrder = order[a.estadoPago] ?? 1;
      const bOrder = order[b.estadoPago] ?? 1;
      return aOrder - bOrder;
    });
    return result;
  }, [tandas, filtroEstado]);

  // Paginación
  const totalPages = Math.ceil(tandasFiltradas.length / itemsPerPage);
  const paginatedTandas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tandasFiltradas.slice(start, start + itemsPerPage);
  }, [tandasFiltradas, currentPage]);

  // ─── Cargar datos al montar ──────────────────────────────────────────
  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    cargarMisTandas();
  }, []);

  // ─── Sincronizar filtro y página con URL ─────────────────────────────
  useEffect(() => {
    const query = {
      estado: filtroEstado !== 'todas' ? filtroEstado : undefined,
      page: currentPage > 1 ? currentPage : undefined
    };
    Object.keys(query).forEach(k => {
      if (query[k] === undefined) delete query[k];
    });
    router.push({ pathname: '/tandas/mis-tandas', query }, undefined, { shallow: true });
  }, [filtroEstado, currentPage, router]);

  // ─── Funciones de acción ──────────────────────────────────────────────
  const enviarRecordatorio = async (tandaMemberId) => {
    try {
      const result = await enviarRecordatorioManual(tandaMemberId);
      if (result.success) {
        setToast({ message: '✅ Recordatorio enviado correctamente', type: 'success' });
      } else {
        setToast({ message: 'No se pudo enviar el recordatorio', type: 'error' });
      }
    } catch (err) {
      console.error('Error enviando recordatorio:', err);
      setToast({ message: 'Error al enviar el recordatorio', type: 'error' });
    }
  };

  const verDetallesPagos = async (tanda) => {
    try {
      // Ya tenemos los pagos en la tanda, usarlos
      setPagos(tanda.pagos || []);
      setSelectedTanda(tanda);
      setShowPagosModal(true);
    } catch (error) {
      console.error('Error mostrando pagos:', error);
      setToast({ message: 'Error al cargar los pagos', type: 'error' });
    }
  };

  // ─── Formateadores ──────────────────────────────────────────────────────
  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusInfo = (estado, posicion, pagoCompleto) => {
    const statusMap = {
      'pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'al_corriente': { label: 'Al corriente', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'pagado': { label: 'Completada', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      'atrasado': { label: 'Atrasada', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    };

    if (posicion === 1) {
      return { label: 'Administrador', color: 'bg-purple-100 text-purple-700', icon: Crown };
    }

    // Si el pago está completo (dos partes), mostrar como completada
    if (pagoCompleto?.estadoCompleto) {
      return { label: 'Completada', color: 'bg-blue-100 text-blue-700', icon: CheckCircle };
    }

    // Si tiene primera parte pero no segunda, mostrar "Pendiente segunda parte"
    if (estado === 'al_corriente' && pagoCompleto?.tienePrimeraParte && !pagoCompleto?.tieneSegundaParte) {
      return { label: 'Pendiente 2ª parte', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle };
    }

    return statusMap[estado] || { label: estado, color: 'bg-gray-100 text-gray-600', icon: FileText };
  };

  const getProgresoPagos = (tanda) => {
    const semanasTotales = tanda.semanasTotales || tanda.totalWeeks || 0;
    if (!semanasTotales) return 0;
    const pagosRealizados = tanda.pagosRealizadosCount || 0;
    return Math.min(100, (pagosRealizados / semanasTotales) * 100);
  };

  const getDiasRestantes = (fechaProximoPago) => {
    if (!fechaProximoPago) return null;
    const hoy = new Date();
    const proximo = new Date(fechaProximoPago);
    const diff = Math.ceil((proximo - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getSemanasRestantes = (tanda) => {
    const semanasTotales = tanda.semanasTotales || tanda.totalWeeks || 0;
    const pagosRealizados = tanda.pagosRealizadosCount || 0;
    return Math.max(0, semanasTotales - pagosRealizados);
  };

  // ─── Estados de carga y error ─────────────────────────────────────────
  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  if (error) {
    return (
      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-40 pb-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Error al cargar tus tandas</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={cargarMisTandas}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C3BFF] text-white rounded-xl font-medium hover:bg-[#5a2ee6] transition"
            >
              <RefreshCw size={16} /> Reintentar
            </button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  // ─── Renderizado principal ────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Mis Tandas | MarketDesliz</title>
        <meta name="description" content="Gestiona tus tandas activas y revisa el progreso de tus pagos." />
      </Head>

      <StoreLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-40 pb-10">

          {/* Header */}
          <div className="mb-8">
            <Link href="/perfil" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition mb-4">
              <ArrowLeft size={14} /> Volver a mi perfil
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <Target size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Tandas</h1>
                <p className="text-sm text-gray-500">Gestiona tus tandas activas y revisa tu progreso</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Target size={18} className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.tandasActivas}</p>
              <p className="text-xs text-gray-500">Tandas activas</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={18} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.tandasCompletadas}</p>
              <p className="text-xs text-gray-500">Tandas completadas</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock size={18} className="text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.tandasPendientes}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <DollarSign size={18} className="text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-600">{formatMoney(stats.totalRecibido)}</p>
              <p className="text-xs text-gray-500">Total recibido</p>
            </div>
          </div>

          {/* ── Filtros ────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {['todas', 'activas', 'pendientes', 'completadas'].map((opcion) => (
                  <button
                    key={opcion}
                    onClick={() => setFiltroEstado(opcion)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      filtroEstado === opcion
                        ? 'bg-white text-[#6C3BFF] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {tandasFiltradas.length} {tandasFiltradas.length === 1 ? 'tanda' : 'tandas'}
            </div>
          </div>

          {/* ── Lista de tandas ──────────────────────────────────────── */}
          {tandasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {filtroEstado !== 'todas' ? `No tienes tandas ${filtroEstado}` : 'No estás en ninguna tanda'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {filtroEstado !== 'todas'
                  ? 'Cambia el filtro para ver otras tandas'
                  : 'Únete a una tanda y comienza a ahorrar'}
              </p>
              {filtroEstado === 'todas' && (
                <Link href="/tandas" className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition">
                  <Target size={16} /> Explorar tandas
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedTandas.map((tanda) => {
                  const status = getStatusInfo(
                    tanda.estadoPago || tanda.estado,
                    tanda.posicion,
                    tanda.estadoPagoCompleto
                  );
                  const StatusIcon = status.icon;
                  const progreso = getProgresoPagos(tanda);
                  const semanasRestantes = getSemanasRestantes(tanda);
                  const esAdmin = tanda.posicion === 1;
                  const pagoSemanal = tanda.pagoSemanal || (tanda.monto / (tanda.semanasTotales || 12));
                  const diasRestantes = getDiasRestantes(tanda.proximoPago);
                  const tienePendienteSegundaParte = tanda.estadoPagoCompleto?.tienePrimeraParte && !tanda.estadoPagoCompleto?.tieneSegundaParte;

                  return (
                    <div key={tanda.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-900 text-lg">{tanda.tandaNombre}</h3>
                              {esAdmin && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  <Crown size={10} /> Administrador
                                </span>
                              )}
                              {tanda.posicion <= 5 && !esAdmin && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <Star size={10} /> Posición preferente
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span>Posición #{tanda.posicion}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>{formatMoney(tanda.monto)}</span>
                              {diasRestantes !== null && diasRestantes >= 0 && (
                                <>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span className={`text-xs ${diasRestantes <= 2 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                    {diasRestantes === 0 ? 'Hoy' : `${diasRestantes} días`}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon size={10} /> {status.label}
                          </span>
                        </div>

                        {/* Progreso */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progreso de pagos</span>
                            <span className="font-medium text-gray-700">{Math.round(progreso)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6C3BFF] rounded-full transition-all duration-300"
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{tanda.pagosRealizadosCount || 0} pagos realizados</span>
                            <span>{semanasRestantes} semanas restantes</span>
                          </div>
                        </div>

                        {/* Estado de pago en dos partes */}
                        {tienePendienteSegundaParte && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-600">💰</span>
                                <span className="text-sm text-yellow-700">
                                  Pago pendiente: Segunda parte (50%)
                                </span>
                              </div>
                              <button
                                onClick={() => enviarRecordatorio(tanda.id)}
                                className="flex items-center gap-1 text-xs bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition"
                              >
                                <Bell size={12} /> Recordarme
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Grid de información */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                          <div className="bg-gray-50 rounded-xl p-2 text-center">
                            <CalendarDays size={14} className="text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Fecha de ingreso</p>
                            <p className="text-xs font-medium text-gray-700">{formatDate(tanda.joinedAt)}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2 text-center">
                            <DollarSign size={14} className="text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Pago semanal</p>
                            <p className="text-xs font-bold text-purple-600">{formatMoney(pagoSemanal)}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2 text-center">
                            <Calendar size={14} className="text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Próximo pago</p>
                            <p className="text-xs font-medium text-gray-700">
                              {tanda.proximoPago ? formatDate(tanda.proximoPago) : 'Por definir'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2 text-center">
                            <TrophyIcon size={14} className="text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Entrega estimada</p>
                            <p className="text-xs font-medium text-gray-700">{tanda.entregaEstimada || `Semana ${tanda.posicion}`}</p>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => verDetallesPagos(tanda)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                          >
                            <History size={14} /> Ver pagos
                          </button>
                          <Link
                            href={`/tandas/${tanda.tandaId}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
                          >
                            <Eye size={14} /> Ver detalles
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-500">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}

          {/* Botón para explorar más tandas */}
          {tandas.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                href="/tandas"
                className="inline-flex items-center gap-2 text-sm text-[#6C3BFF] hover:underline transition"
              >
                <Target size={14} /> Explorar más tandas <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </StoreLayout>

      {/* ── Modal de pagos ──────────────────────────────────────────────── */}
      {showPagosModal && selectedTanda && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPagosModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-[#6C3BFF]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Historial de pagos</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedTanda.tandaNombre} - Posición #{selectedTanda.posicion}</p>
              </div>
              <button onClick={() => setShowPagosModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
            </div>

            <div className="p-6">
              {/* Resumen de pagos */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <CheckCircle size={18} className="text-green-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-green-600">
                    {pagos.filter(p => p.estado === 'pagado').length}
                  </div>
                  <div className="text-xs text-gray-500">Pagos realizados</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-xl">
                  <Clock size={18} className="text-yellow-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-yellow-600">
                    {pagos.filter(p => p.estado === 'pendiente').length}
                  </div>
                  <div className="text-xs text-gray-500">Pendientes</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <DollarSign size={18} className="text-purple-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-purple-600">
                    {formatMoney(pagos.reduce((sum, p) => sum + (p.monto || 0), 0))}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>

              {/* Tabla de pagos */}
              {pagos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={40} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay pagos registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Semana</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha límite</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha pago</th>
                        <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pagos.map((pago) => {
                        const isPaid = pago.estado === 'pagado';
                        const isLate = pago.estado === 'atrasado';

                        return (
                          <tr key={pago.id} className="hover:bg-gray-50 transition">
                            <td className="px-3 py-3 font-mono text-sm font-medium text-gray-900">#{pago.semana || pago.roundNumber || 'N/A'}</td>
                            <td className="px-3 py-3 font-semibold text-gray-900">{formatMoney(pago.monto)}</td>
                            <td className="px-3 py-3 text-sm text-gray-500">{formatDate(pago.fechaVencimiento || pago.dueDate)}</td>
                            <td className="px-3 py-3 text-sm text-gray-500">{pago.fechaPago ? formatDate(pago.fechaPago) : '—'}</td>
                            <td className="px-3 py-3">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle size={10} /> Pagado
                                </span>
                              ) : isLate ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <AlertCircle size={10} /> Atrasado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <Clock size={10} /> Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTanda.estadoPagoCompleto?.tienePrimeraParte && !selectedTanda.estadoPagoCompleto?.tieneSegundaParte && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-700 flex items-center gap-2">
                    <AlertCircle size={16} /> Pendiente: segunda parte del pago (50% restante)
                  </p>
                  <button
                    onClick={() => {
                      enviarRecordatorio(selectedTanda.id);
                      setShowPagosModal(false);
                    }}
                    className="mt-2 text-xs bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition"
                  >
                    <Bell size={12} className="inline mr-1" /> Recordar segunda parte
                  </button>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPagosModal(false)}
                  className="text-sm text-gray-500 hover:text-[#6C3BFF] transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

// ─── Componente TrophyIcon ──────────────────────────────────────────────
function TrophyIcon({ size = 14, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

// ─── Componente Toast ────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl border shadow-lg max-w-sm ${colors[type] || colors.info}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
}