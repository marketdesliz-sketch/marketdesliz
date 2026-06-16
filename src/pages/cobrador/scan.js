// src/pages/cobrador/scan.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  ScanLine,
  Search,
  Package,
  Target,
  CheckCircle,
  XCircle,
  Wallet
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import CollectorClientCard from '../../components/collector/CollectorClientCard';
import CollectorPaymentModal from '../../components/collector/CollectorPaymentModal';
import ScanQRButton from '../../components/collector/ScanQRButton';

export default function CobradorScanPage() {
  const router = useRouter();
  const { client } = router.query;
  const [cliente, setCliente] = useState(null);
  const [productos, setProductos] = useState([]);
  const [tandas, setTandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [inputManual, setInputManual] = useState('');

  useEffect(() => {
    if (client) {
      cargarCliente(client);
    } else {
      setLoading(false);
    }
  }, [client]);

  const cargarCliente = async (clientId) => {
    try {
      setLoading(true);
      const clienteData = await pb.collection('users').getOne(clientId);
      setCliente(clienteData);

      const ordenesActivas = await pb.collection('orders').getFullList({
        filter: `userId = "${clientId}" && estadoPago = "activa"`,
        expand: 'productId'
      });
      setProductos(ordenesActivas);

      const tandasData = await pb.collection('tanda_members').getFullList({
        filter: `userId = "${clientId}" && estadoPago = "al_corriente"`,
        expand: 'tandaId'
      });
      setTandas(tandasData);
    } catch (error) {
      console.error('Error cargando cliente:', error);
      setMensaje('Cliente no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const buscarManual = () => {
    if (inputManual.trim()) {
      router.push(`/cobrador/scan?client=${inputManual.trim()}`);
    }
  };

  const abrirModalPago = (item) => {
    setSelectedPayment(item);
    setShowPaymentModal(true);
  };

  const formatMoney = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const registrarPago = async (paymentData) => {
    setRegistrando(true);
    try {
      if (paymentData.type === 'producto') {
        const orden = await pb.collection('orders').getOne(paymentData.id);

        await pb.collection('payments').create({
          orderId: paymentData.id,
          userId: cliente.id,
          numeroSemana: (orden.pagosRealizados || 0) + 1,
          montoProgramado: paymentData.amount,
          montoPagado: paymentData.amount,
          fechaVencimiento: new Date().toISOString().split('T')[0],
          fechaPago: new Date().toISOString(),
          estado: 'pagado',
          metodoPago: 'efectivo'
        });

        const nuevoSaldo = (orden.saldoRestante || 0) - paymentData.amount;
        const updateData = {
          saldoRestante: Math.max(0, nuevoSaldo),
          pagosRealizados: (orden.pagosRealizados || 0) + 1
        };
        if (nuevoSaldo <= 0) {
          updateData.estadoPago = 'completada';
          updateData.fechaCompletada = new Date().toISOString();
        }
        await pb.collection('orders').update(paymentData.id, updateData);

      } else if (paymentData.type === 'tanda') {
        const tandaMember = await pb.collection('tanda_members').getOne(paymentData.id);

        await pb.collection('tanda_pagos').create({
          tandaMemberId: paymentData.id,
          semana: (tandaMember.pagosRealizados || 0) + 1,
          monto: paymentData.amount,
          fechaPago: new Date().toISOString(),
          estado: 'pagado'
        });

        if (tandaMember.pagosRealizados !== undefined) {
          await pb.collection('tanda_members').update(paymentData.id, {
            pagosRealizados: (tandaMember.pagosRealizados || 0) + 1
          });
        }
      }

      setMensaje('success:' + formatMoney(paymentData.amount));
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setTimeout(() => {
        setMensaje('');
        cargarCliente(cliente.id);
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
    } finally {
      setRegistrando(false);
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Escanear QR | Cobrador</title>
      </Head>
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-24">

          <div className="mb-6">
            <Link href="/cobrador" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition">
              <ArrowLeft size={14} /> Volver al panel
            </Link>
          </div>

          {!client ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#6C3BFF]/10 flex items-center justify-center mx-auto mb-4">
                <ScanLine size={28} className="text-[#6C3BFF]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Escanear QR de cliente</h1>
              <p className="text-gray-500 text-sm mb-6">Escanea el código QR del cliente o ingresa su ID manualmente</p>

              <ScanQRButton />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400">O ingresa manualmente</span></div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputManual}
                  onChange={(e) => setInputManual(e.target.value)}
                  placeholder="ID del cliente"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all"
                />
                <button
                  onClick={buscarManual}
                  className="flex items-center gap-2 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  <Search size={15} /> Buscar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <CollectorClientCard client={cliente} />

              {mensaje && (
                <div className={`flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-medium ${
                  mensaje.startsWith('success')
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {mensaje.startsWith('success') ? (
                    <><CheckCircle size={16} /> Pago de {mensaje.split(':')[1]} registrado</>
                  ) : (
                    <><XCircle size={16} /> Error al registrar el pago</>
                  )}
                </div>
              )}

              {/* Productos a crédito */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package size={16} className="text-[#6C3BFF]" /> Productos a crédito
                  </h2>
                </div>
                <div className="p-4">
                  {productos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                        <Package size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500">No tiene productos a crédito</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {productos.map((producto) => {
                        const saldoRestante = producto.saldoRestante || producto.totalPagar || 0;
                        const montoCobro = producto.pagoSemanal || Math.round(saldoRestante / (producto.semanasTotales || 1));
                        return (
                          <div key={producto.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{producto.expand?.productId?.nombre || 'Producto'}</p>
                                <p className="text-sm text-[#10b981] font-semibold mt-1">Pago semanal: {formatMoney(montoCobro)}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Saldo restante: {formatMoney(saldoRestante)}</p>
                              </div>
                              <button
                                onClick={() => abrirModalPago({ id: producto.id, nombre: producto.expand?.productId?.nombre || 'Producto', amount: montoCobro, type: 'producto' })}
                                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
                              >
                                <Wallet size={14} /> Cobrar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Tandas activas */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Target size={16} className="text-[#6C3BFF]" /> Tandas activas
                  </h2>
                </div>
                <div className="p-4">
                  {tandas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                        <Target size={22} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500">No está en ninguna tanda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tandas.map((tanda) => {
                        const tandaInfo = tanda.expand?.tandaId;
                        const pagoSemanal = tandaInfo?.montoCuota || (tandaInfo?.montoTotal && tandaInfo?.cupoMaximo ? Math.round(tandaInfo.montoTotal / tandaInfo.cupoMaximo) : 0);
                        return (
                          <div key={tanda.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{tandaInfo?.nombre || 'Tanda'}</p>
                                <p className="text-xs text-gray-500 mt-1">Posición #{tanda.posicion}</p>
                                <p className="text-sm text-[#10b981] font-semibold mt-1">Pago semanal: {formatMoney(pagoSemanal)}</p>
                              </div>
                              <button
                                onClick={() => abrirModalPago({ id: tanda.id, nombre: tandaInfo?.nombre || 'Tanda', amount: pagoSemanal, type: 'tanda' })}
                                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
                              >
                                <Wallet size={14} /> Cobrar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </StoreLayout>

      {showPaymentModal && selectedPayment && (
        <CollectorPaymentModal
          payment={selectedPayment}
          clientName={cliente?.nombre || 'Cliente'}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={registrarPago}
          processing={registrando}
        />
      )}
    </>
  );
}