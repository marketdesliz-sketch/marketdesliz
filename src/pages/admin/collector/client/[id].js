// src/pages/admin/collector/client/[id].js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayoutMinimal from '../../../../layouts/AdminLayoutMinimal';
import { withAuth } from '../../../../lib/withAuth';
import pb from '../../../../lib/pocketbase';
import { formatMoney } from '../../../../lib/utils';

function ClientView() {
  const router = useRouter();
  const { id } = router.query;

  const [client, setClient] = useState(null);
  const [productos, setProductos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [tandas, setTandas] = useState([]);
  const [pagosTanda, setPagosTanda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  // ─── Cargar datos ──────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      console.log('📱 Cargando datos del cliente:', id);

      // 1. DATOS BÁSICOS DEL CLIENTE (users + clients)
      const clientData = await pb.collection('clients').getOne(id);
      const user = await pb.collection('users').getOne(clientData.userId);
      const userData = {
        ...clientData,
        nombre: user.nombre || 'Cliente',
        telefono: user.telefono || 'No registrado',
        email: user.email || '',
        activo: user.activo
      };
      setClient(userData);

      // 2. ÓRDENES ACTIVAS (productos)
      const orders = await pb.collection('orders').getFullList({
        filter: `userId = "${clientData.userId}" && estadoPago != "completada"`,
        expand: 'productId',
        sort: '-created'
      });

      // Formatear órdenes para la UI
      const ordersFormatted = orders.map(order => ({
        id: order.id,
        totalPrice: order.totalPagar || 0,
        downPayment: order.enganche || 0,
        weeklyAmount: order.pagoSemanal || 0,
        remainingBalance: order.saldoRestante || 0,
        status: order.estadoPago === 'activa' ? 'active' : 'pendiente',
        productoNombre: order.expand?.productId?.nombre || 'Producto',
        semanasTotales: order.semanasTotales || 0,
        pagosRealizados: order.pagosRealizados || 0,
        frecuenciaPago: order.frecuenciaPago || 'semanal'
      }));
      setProductos(ordersFormatted);
      console.log(`📦 Productos: ${ordersFormatted.length}`);

      // 3. TAREAS (cobros pendientes)
      const tareasPendientes = await pb.collection('cobros').getFullList({
        filter: `userId = "${clientData.userId}" && estado = "pendiente"`,
        expand: 'productId,orderId',
        sort: 'fechaProgramada'
      });
      setTareas(tareasPendientes);
      console.log(`📋 Tareas: ${tareasPendientes.length}`);

      // 4. TANDAS (participación activa)
      const miembrosTanda = await pb.collection('tanda_members').getFullList({
        filter: `userId = "${clientData.userId}" && estadoPago = "al_corriente"`,
        expand: 'tandaId'
      });
      setTandas(miembrosTanda);
      console.log(`🎯 Tandas: ${miembrosTanda.length}`);

      // 5. PAGOS DE TANDA
      if (miembrosTanda.length > 0) {
        const memberIds = miembrosTanda.map(m => m.id);
        const pagos = await pb.collection('tanda_pagos').getFullList({
          filter: memberIds.map(id => `tandaMemberId = "${id}"`).join(' || '),
          sort: '-semana'
        });
        setPagosTanda(pagos);
        console.log(`💰 Pagos de tanda: ${pagos.length}`);
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('Error al cargar los datos del cliente');
      mostrarMensaje('Error al cargar datos del cliente', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id, loadAllData]);

  // ─── Cobrar pago de producto ──────────────────────────────────────────
  const handleCobrarProducto = async (orderId, monto, semanaActual = 1) => {
    try {
      setProcesando(true);
      setError('');

      // Crear pago en la colección payments
      await pb.collection('payments').create({
        orderId: orderId,
        userId: client?.userId,
        numeroSemana: semanaActual,
        montoProgramado: monto,
        montoPagado: monto,
        fechaVencimiento: new Date().toISOString().split('T')[0],
        fechaPago: new Date().toISOString(),
        estado: 'pagado',
        metodoPago: 'efectivo'
      });

      // Actualizar saldo de la orden
      const order = await pb.collection('orders').getOne(orderId);
      const nuevoSaldo = Math.max(0, (order.saldoRestante || 0) - monto);

      const updateData = {
        saldoRestante: nuevoSaldo,
        pagosRealizados: (order.pagosRealizados || 0) + 1
      };

      if (nuevoSaldo <= 0) {
        updateData.estadoPago = 'completada';
        updateData.fechaCompletada = new Date().toISOString();
      } else if (order.estadoPago === 'pendiente_pago') {
        updateData.estadoPago = 'activa';
      }

      await pb.collection('orders').update(orderId, updateData);

      mostrarMensaje('✅ Pago registrado exitosamente');
      await loadAllData();
    } catch (error) {
      console.error('❌ Error al cobrar:', error);
      setError('Error al registrar el pago');
      mostrarMensaje('Error al registrar el pago', 'error');
    } finally {
      setProcesando(false);
    }
  };

  // ─── Cobrar pago de tanda ─────────────────────────────────────────────
  const handleCobrarTanda = async (memberId, roundNumber, monto) => {
    try {
      setProcesando(true);
      setError('');

      await pb.collection('tanda_pagos').create({
        tandaMemberId: memberId,
        semana: roundNumber,
        monto: monto,
        fechaPago: new Date().toISOString(),
        estado: 'pagado'
      });

      // Actualizar estado del miembro
      await pb.collection('tanda_members').update(memberId, {
        estadoPago: 'al_corriente',
        fechaPagoTurno: new Date().toISOString()
      });

      mostrarMensaje('✅ Pago de tanda registrado');
      await loadAllData();
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Error al registrar pago de tanda');
      mostrarMensaje('Error al registrar pago de tanda', 'error');
    } finally {
      setProcesando(false);
    }
  };

  // ─── Completar tarea ──────────────────────────────────────────────────
  const handleCompletarTarea = async (tareaId) => {
    try {
      setProcesando(true);
      setError('');

      await pb.collection('cobros').update(tareaId, {
        estado: 'completada',
        fechaCompletado: new Date().toISOString()
      });

      mostrarMensaje('✅ Tarea completada');
      await loadAllData();
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Error al completar la tarea');
      mostrarMensaje('Error al completar la tarea', 'error');
    } finally {
      setProcesando(false);
    }
  };

  // ─── Calcular progreso de pago ────────────────────────────────────────
  const calcularProgreso = (order) => {
    const total = order.totalPrice || 1;
    const pagado = total - order.remainingBalance;
    return Math.min(100, Math.round((pagado / total) * 100));
  };

  // ─── Formatear fecha ──────────────────────────────────────────────────
  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // ─── Formatear hora ──────────────────────────────────────────────────
  const formatHora = (hora) => {
    if (!hora) return 'N/A';
    return hora.substring(0, 5);
  };

  if (loading) {
    return (
      <AdminLayoutMinimal>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#6C3BFF] border-t-transparent mb-4" />
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </AdminLayoutMinimal>
    );
  }

  return (
    <AdminLayoutMinimal>
      <Head>
        <title>Cliente: {client?.nombre || 'Sin nombre'} | Admin</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Mensaje de éxito/error flotante */}
        {mensajeExito && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in ${
            mensajeExito.includes('Error') ? 'bg-red-500' : 'bg-green-500'
          } text-white`}>
            {mensajeExito}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Botón volver */}
        <button
          onClick={() => router.push('/admin/collector')}
          className="flex items-center text-gray-600 hover:text-[#6C3BFF] mb-4 transition-colors group"
        >
          <svg className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al escáner
        </button>

        {/* Tarjeta del cliente */}
        <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] text-white rounded-lg p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {client?.nombre?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{client?.nombre || 'Sin nombre'}</h2>
              <p className="opacity-90">📞 {client?.telefono || 'No registrado'}</p>
              {client?.direccion && (
                <p className="opacity-90 text-sm mt-1">📍 {client.direccion}</p>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm opacity-80 flex flex-wrap gap-4">
            <span>🆔 ID: {client?.id}</span>
            <span>📅 Registro: {client?.created ? new Date(client.created).toLocaleDateString() : 'N/A'}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${client?.activo !== false ? 'bg-green-500' : 'bg-red-500'}`}>
              {client?.activo !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b overflow-x-auto pb-1">
          {['resumen', 'productos', 'tareas', 'tandas'].map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 whitespace-nowrap font-medium transition-all ${
                activeTab === tab
                  ? 'border-b-2 border-[#6C3BFF] text-[#6C3BFF]'
                  : 'text-gray-600 hover:text-[#6C3BFF]'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'resumen' && '📊 Resumen'}
              {tab === 'productos' && `📦 Productos (${productos.length})`}
              {tab === 'tareas' && `📋 Tareas (${tareas.length})`}
              {tab === 'tandas' && `🎯 Tandas (${tandas.length})`}
            </button>
          ))}
        </div>

        {/* ─── TAB: Resumen ──────────────────────────────────────────────── */}
        {activeTab === 'resumen' && (
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <span className="w-1 h-6 bg-[#6C3BFF] rounded-full mr-3"></span>
              📊 Resumen del cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#F3F0FF] p-4 rounded-lg hover:shadow-md transition">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-2xl font-bold text-[#6C3BFF]">{productos.length}</div>
                <div className="text-sm text-gray-600">Productos activos</div>
                {productos.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {formatMoney(productos.reduce((sum, p) => sum + p.remainingBalance, 0))} por cobrar
                  </div>
                )}
              </div>
              <div className="bg-[#F3F0FF] p-4 rounded-lg hover:shadow-md transition">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-2xl font-bold text-[#6C3BFF]">{tareas.length}</div>
                <div className="text-sm text-gray-600">Tareas pendientes</div>
              </div>
              <div className="bg-[#F3F0FF] p-4 rounded-lg hover:shadow-md transition">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-[#6C3BFF]">{tandas.length}</div>
                <div className="text-sm text-gray-600">Tandas activas</div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Productos ────────────────────────────────────────────── */}
        {activeTab === 'productos' && (
          <div className="space-y-3">
            {productos.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500">No tiene productos activos</p>
              </div>
            ) : (
              productos.map(order => {
                const progreso = calcularProgreso(order);
                return (
                  <div key={order.id} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition border-l-4 border-[#6C3BFF]">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{order.productoNombre}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'active' ? 'Activo' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso</span>
                        <span>{progreso}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#6C3BFF] rounded-full transition-all duration-500"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div><span className="text-gray-500">Total:</span> <span className="font-medium">{formatMoney(order.totalPrice)}</span></div>
                      <div><span className="text-gray-500">Enganche:</span> <span className="font-medium">{formatMoney(order.downPayment)}</span></div>
                      <div><span className="text-gray-500">Semanal:</span> <span className="font-medium">{formatMoney(order.weeklyAmount)}</span></div>
                      <div><span className="text-gray-500">Saldo:</span> <span className="font-medium">{formatMoney(order.remainingBalance)}</span></div>
                    </div>
                    <button
                      onClick={() => handleCobrarProducto(order.id, order.weeklyAmount)}
                      disabled={procesando || order.remainingBalance <= 0}
                      className="mt-3 w-full bg-[#6C3BFF] text-white py-2 rounded-lg hover:bg-[#5A2FE0] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {order.remainingBalance <= 0 ? '✓ Pagado' : 'Cobrar pago semanal'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── TAB: Tareas ────────────────────────────────────────────────── */}
        {activeTab === 'tareas' && (
          <div className="space-y-3">
            {tareas.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500">No hay tareas pendientes</p>
              </div>
            ) : (
              tareas.map(tarea => (
                <div key={tarea.id} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition border-l-4 border-[#6C3BFF]">
                  <h3 className="font-bold flex items-center gap-2">
                    {tarea.tipo === 'visita' ? '👋 Visita programada' :
                     tarea.tipo === 'entrega' ? '📦 Entrega programada' :
                     '💰 Cobro programado'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div><span className="text-gray-500">Fecha:</span> {formatFecha(tarea.fechaProgramada)}</div>
                    <div><span className="text-gray-500">Hora:</span> {formatHora(tarea.hora)}</div>
                  </div>
                  {tarea.detalles && (
                    <div className="mt-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-500 block mb-1">📝 Detalles:</span>
                      {tarea.detalles}
                    </div>
                  )}
                  {tarea.montoCobrado > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Monto:</span>{' '}
                      <span className="font-bold text-[#6C3BFF]">{formatMoney(tarea.montoCobrado)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleCompletarTarea(tarea.id)}
                    disabled={procesando}
                    className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Marcar como completada
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB: Tandas ────────────────────────────────────────────────── */}
        {activeTab === 'tandas' && (
          <div className="space-y-3">
            {tandas.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-500">No participa en tandas</p>
              </div>
            ) : (
              tandas.map(miembro => {
                const pagosDeTanda = pagosTanda.filter(p => p.tandaMemberId === miembro.id);
                const ultimoPago = pagosDeTanda.sort((a, b) => b.semana - a.semana)[0];
                const siguienteRonda = (ultimoPago?.semana || 0) + 1;
                const tandaData = miembro.expand?.tandaId || {};

                return (
                  <div key={miembro.id} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition border-l-4 border-purple-600">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span>🎯</span> {tandaData.nombre || 'Tanda'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div><span className="text-gray-500">Posición:</span> #{miembro.posicion}</div>
                      <div>
                        <span className="text-gray-500">Estado:</span>{' '}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          miembro.estadoPago === 'al_corriente' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {miembro.estadoPago === 'al_corriente' ? 'Al corriente' : 'Pendiente'}
                        </span>
                      </div>
                      <div><span className="text-gray-500">Gasolina:</span> {miembro.gasFeePaid ? '✅ Pagada' : '❌ Pendiente'}</div>
                      <div><span className="text-gray-500">Monto:</span> {formatMoney(tandaData.montoTotal || tandaData.montoCuota || 0)}</div>
                    </div>

                    {pagosDeTanda.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-sm">Pagos realizados:</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {pagosDeTanda.map(p => (
                            <span key={p.id} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                              Ronda {p.semana}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleCobrarTanda(
                        miembro.id,
                        siguienteRonda,
                        tandaData.montoCuota || tandaData.montoTotal || 0
                      )}
                      disabled={procesando || !miembro.gasFeePaid || miembro.estadoPago !== 'al_corriente'}
                      className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {!miembro.gasFeePaid ? '⛽ Pendiente gasolina' : `Cobrar ronda ${siguienteRonda}`}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AdminLayoutMinimal>
  );
}

export default withAuth(ClientView, 'admin');