// src/pages/collector/client/[id].js - VERSIÓN OPTIMIZADA
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import CollectorLayout from '@/layouts/CollectorLayout';
import pb from '../../../lib/pocketbase';

export default function ClientView() {
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

  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id]);

  const mostrarMensaje = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('📱 Cargando datos completos del cliente:', id);
      
      // 1. DATOS BÁSICOS DEL CLIENTE
      const clientData = await pb.collection('clients').getOne(id);
      setClient(clientData);
      console.log('✅ Cliente:', clientData.nombre);

      // 2. PRODUCTOS (órdenes activas)
      const orders = await pb.collection('orders').getFullList({
        filter: `client = "${id}" && status != "completed"`,
        expand: 'product',
        sort: '-created'
      });
      setProductos(orders);
      console.log('📦 Productos:', orders.length);

      // 3. TAREAS (visitas y entregas pendientes)
      const tareasPendientes = await pb.collection('collector_tasks').getFullList({
        filter: `client = "${id}" && status = "pendiente"`,
        sort: 'fecha'
      });
      setTareas(tareasPendientes);
      console.log('📋 Tareas:', tareasPendientes.length);

      // 4. TANDAS (participación)
      const miembrosTanda = await pb.collection('tanda_members').getFullList({
        filter: `client = "${id}"`,
        expand: 'tanda'
      });
      setTandas(miembrosTanda);
      console.log('🎯 Tandas:', miembrosTanda.length);

      // 5. PAGOS DE TANDA (si tiene tandas)
      if (miembrosTanda.length > 0) {
        const memberIds = miembrosTanda.map(m => m.id);
        const pagos = await pb.collection('tanda_payments').getFullList({
          filter: memberIds.map(id => `tandaMember = "${id}"`).join(' || '),
          sort: '-roundNumber'
        });
        setPagosTanda(pagos);
        console.log('💰 Pagos de tanda:', pagos.length);
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      mostrarMensaje('Error al cargar datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCobrarProducto = async (orderId, monto, semanaActual = 1) => {
    try {
      setProcesando(true);
      
      // Registrar pago
      await pb.collection('payments').create({
        order: orderId,
        client: id,
        amount: monto,
        weekNumber: semanaActual,
        status: 'paid',
        paidDate: new Date(),
        paymentMethod: 'efectivo'
      });

      // Actualizar saldo de la orden
      const order = await pb.collection('orders').getOne(orderId);
      const nuevoSaldo = Math.max(0, order.remainingBalance - monto);
      
      await pb.collection('orders').update(orderId, {
        remainingBalance: nuevoSaldo,
        ...(nuevoSaldo === 0 ? { status: 'completed' } : {})
      });

      mostrarMensaje('✅ Pago registrado exitosamente');
      await loadAllData(); // Recargar todo
      
    } catch (error) {
      console.error('❌ Error:', error);
      mostrarMensaje('Error al registrar pago');
    } finally {
      setProcesando(false);
    }
  };

  const handleCobrarTanda = async (memberId, roundNumber, monto) => {
    try {
      setProcesando(true);
      
      await pb.collection('tanda_payments').create({
        tandaMember: memberId,
        roundNumber: roundNumber,
        amount: monto,
        status: 'paid',
        paidDate: new Date(),
        paymentMethod: 'efectivo'
      });

      mostrarMensaje('✅ Pago de tanda registrado');
      await loadAllData();
      
    } catch (error) {
      console.error('❌ Error:', error);
      mostrarMensaje('Error al registrar pago de tanda');
    } finally {
      setProcesando(false);
    }
  };

  const handleCompletarTarea = async (tareaId) => {
    try {
      setProcesando(true);
      
      await pb.collection('collector_tasks').update(tareaId, {
        status: 'completada',
        completedAt: new Date()
      });

      mostrarMensaje('✅ Tarea completada');
      await loadAllData();
      
    } catch (error) {
      console.error('❌ Error:', error);
      mostrarMensaje('Error al completar tarea');
    } finally {
      setProcesando(false);
    }
  };

  const calcularSiguienteSemana = (order) => {
    // Aquí puedes implementar la lógica para calcular la semana actual
    // Por ahora devolvemos 1 como placeholder
    return 1;
  };

  if (loading) {
    return (
      <CollectorLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#6C3BFF] border-t-transparent mb-4"></div>
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </CollectorLayout>
    );
  }

  return (
    <CollectorLayout>
      <Head>
        <title>Cliente: {client?.nombre || 'Sin nombre'} | Colector</title>
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Mensaje de éxito flotante */}
        {mensajeExito && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in">
            {mensajeExito}
          </div>
        )}
        
        {/* Botón volver */}
        <button
          onClick={() => router.push('/collector')}
          className="flex items-center text-gray-600 hover:text-[#6C3BFF] mb-4 transition-colors group"
        >
          <svg className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al escáner
        </button>
        
        {/* TARJETA DEL CLIENTE */}
        <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] text-white rounded-lg p-6 shadow-lg mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {client?.nombre?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{client?.nombre || 'Sin nombre'}</h2>
              <p className="opacity-90">📞 {client?.telefono || 'No registrado'}</p>
              <p className="opacity-90 text-sm mt-1">📍 {client?.direccion || 'Sin dirección'}</p>
            </div>
          </div>
          <div className="mt-4 text-sm opacity-80 flex flex-wrap gap-4">
            <span>🆔 ID: {client?.id}</span>
            <span>📅 Registro: {client?.created ? new Date(client.created).toLocaleDateString() : 'N/A'}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              client?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {client?.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* TABS PRINCIPALES */}
        <div className="flex gap-2 mb-4 border-b overflow-x-auto pb-1 scrollbar-hide">
          <button
            className={`px-4 py-2 whitespace-nowrap font-medium transition-all ${
              activeTab === 'resumen' 
                ? 'border-b-2 border-[#6C3BFF] text-[#6C3BFF]' 
                : 'text-gray-600 hover:text-[#6C3BFF]'
            }`}
            onClick={() => setActiveTab('resumen')}
          >
            📊 Resumen
          </button>
          <button
            className={`px-4 py-2 whitespace-nowrap font-medium transition-all ${
              activeTab === 'productos' 
                ? 'border-b-2 border-[#6C3BFF] text-[#6C3BFF]' 
                : 'text-gray-600 hover:text-[#6C3BFF]'
            }`}
            onClick={() => setActiveTab('productos')}
          >
            📦 Productos <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">{productos.length}</span>
          </button>
          <button
            className={`px-4 py-2 whitespace-nowrap font-medium transition-all ${
              activeTab === 'tareas' 
                ? 'border-b-2 border-[#6C3BFF] text-[#6C3BFF]' 
                : 'text-gray-600 hover:text-[#6C3BFF]'
            }`}
            onClick={() => setActiveTab('tareas')}
          >
            📋 Tareas <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">{tareas.length}</span>
          </button>
          <button
            className={`px-4 py-2 whitespace-nowrap font-medium transition-all ${
              activeTab === 'tandas' 
                ? 'border-b-2 border-[#6C3BFF] text-[#6C3BFF]' 
                : 'text-gray-600 hover:text-[#6C3BFF]'
            }`}
            onClick={() => setActiveTab('tandas')}
          >
            🎯 Tandas <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">{tandas.length}</span>
          </button>
        </div>

        {/* TAB 1: RESUMEN GENERAL */}
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
                    ${productos.reduce((sum, p) => sum + (p.remainingBalance || 0), 0)} por cobrar
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

            {/* Si tiene todo vacío */}
            {productos.length === 0 && tareas.length === 0 && tandas.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500">Este cliente no tiene actividades registradas</p>
                <p className="text-sm text-gray-400 mt-2">Puedes solicitar compra, visita o entrega desde la tienda</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTOS */}
        {activeTab === 'productos' && (
          <div className="space-y-3">
            {productos.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500">No tiene productos activos</p>
              </div>
            ) : (
              productos.map(order => {
                const progreso = ((order.totalPrice - order.remainingBalance) / order.totalPrice * 100).toFixed(0);
                
                return (
                  <div key={order.id} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition border-l-4 border-[#6C3BFF]">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{order.expand?.product?.name || 'Producto'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'active' ? 'Activo' : 'Pendiente'}
                      </span>
                    </div>
                    
                    {/* Barra de progreso */}
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
                      <div><span className="text-gray-500">Total:</span> <span className="font-medium">${order.totalPrice}</span></div>
                      <div><span className="text-gray-500">Enganche:</span> <span className="font-medium">${order.downPayment}</span></div>
                      <div><span className="text-gray-500">Semanal:</span> <span className="font-medium">${order.weeklyAmount}</span></div>
                      <div><span className="text-gray-500">Saldo:</span> <span className="font-medium">${order.remainingBalance}</span></div>
                    </div>
                    
                    <button
                      onClick={() => handleCobrarProducto(
                        order.id, 
                        order.weeklyAmount,
                        calcularSiguienteSemana(order)
                      )}
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

        {/* TAB 3: TAREAS */}
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
                    {tarea.type === 'visita' ? '👋 Visita programada' : '📦 Entrega programada'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div><span className="text-gray-500">Fecha:</span> {tarea.fecha}</div>
                    <div><span className="text-gray-500">Hora:</span> {tarea.hora}</div>
                  </div>
                  {tarea.product && (
                    <p className="mt-2 text-sm"><span className="text-gray-500">Producto:</span> {
                      typeof tarea.product === 'object' ? tarea.product.name : tarea.product
                    }</p>
                  )}
                  {tarea.detalles && (
                    <div className="mt-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-500 block mb-1">📝 Detalles:</span>
                      {tarea.detalles}
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

        {/* TAB 4: TANDAS */}
        {activeTab === 'tandas' && (
          <div className="space-y-3">
            {tandas.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-500">No participa en tandas</p>
              </div>
            ) : (
              tandas.map(miembro => {
                const pagosDeTanda = pagosTanda.filter(p => p.tandaMember === miembro.id);
                const ultimoPago = pagosDeTanda.sort((a, b) => b.roundNumber - a.roundNumber)[0];
                const siguienteRonda = (ultimoPago?.roundNumber || 0) + 1;
                
                return (
                  <div key={miembro.id} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition border-l-4 border-purple-600">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span>🎯</span> {miembro.expand?.tanda?.name}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div><span className="text-gray-500">Posición:</span> #{miembro.position}</div>
                      <div>
                        <span className="text-gray-500">Estado:</span>{' '}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          miembro.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {miembro.status === 'active' ? 'Activo' : 'Pendiente'}
                        </span>
                      </div>
                      <div><span className="text-gray-500">Gasolina:</span> {
                        miembro.gasFeePaid ? '✅ Pagada' : '❌ Pendiente'
                      }</div>
                      <div><span className="text-gray-500">Monto:</span> ${miembro.expand?.tanda?.amountPerTurn}</div>
                    </div>

                    {pagosDeTanda.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-sm">Pagos realizados:</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {pagosDeTanda.map(p => (
                            <span key={p.id} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                              Ronda {p.roundNumber}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleCobrarTanda(
                        miembro.id, 
                        siguienteRonda,
                        miembro.expand?.tanda?.amountPerTurn
                      )}
                      disabled={procesando || !miembro.gasFeePaid || miembro.status !== 'active'}
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
    </CollectorLayout>
  );
}
