// src/pages/cobrador/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle,
  Wallet,
  MapPin,
  ScanLine,
  Map as MapIcon,
  ChevronRight,
  Phone
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function CobradorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    cobrosPendientes: 0,
    cobrosHoy: 0,
    montoPendiente: 0
  });
  const [rutas, setRutas] = useState([]);
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    const user = pb.authStore.model;
    if (user.role !== 'admin' && user.role !== 'vendedor') {
      router.push('/');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const clientes = await pb.collection('users').getFullList({
        filter: 'role = "cliente"'
      });

      const ordenesActivas = await pb.collection('orders').getFullList({
        filter: 'estadoPago = "activa"',
        expand: 'userId'
      });

      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const pagosHoy = await pb.collection('payments').getFullList({
        filter: `fechaVencimiento >= "${inicioHoy.toISOString()}" && fechaVencimiento < "${finHoy.toISOString()}" && (estado = "pendiente" || estado = "atrasado")`
      });

      setStats({
        totalClientes: clientes.length,
        cobrosPendientes: ordenesActivas.length,
        cobrosHoy: pagosHoy.length,
        montoPendiente: ordenesActivas.reduce((sum, o) => sum + (o.pagoSemanal || 0), 0)
      });

      // Obtener pagos de hoy con datos del cliente
      const pagosHoyConCliente = await Promise.all(
        pagosHoy.map(async (pago) => {
          let clienteNombre = 'Cliente';
          let direccion = 'Por confirmar';

          if (pago.userId) {
            try {
              const user = await pb.collection('users').getOne(pago.userId);
              clienteNombre = user.nombre || 'Cliente';

              try {
                const clientRecord = await pb.collection('clients').getFirstListItem(`userId = "${pago.userId}"`);
                const partes = [
                  clientRecord.direccionCalle,
                  clientRecord.direccionNumero,
                  clientRecord.direccionColonia,
                  clientRecord.direccionCiudad
                ].filter(Boolean);
                direccion = partes.length > 0 ? partes.join(', ') : 'Dirección no registrada';
              } catch (e) { }
            } catch (e) { }
          }

          return {
            id: pago.id,
            cliente: clienteNombre,
            direccion: direccion,
            monto: pago.montoProgramado || pago.monto || 0,
            hora: pago.fechaVencimiento ? new Date(pago.fechaVencimiento).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '--:--'
          };
        })
      );

      setRutas(pagosHoyConCliente);

      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);

      const pagosRecientes = await pb.collection('payments').getFullList({
        filter: `fechaPago >= "${hace7Dias.toISOString()}" && estado = "pagado"`,
        sort: '-fechaPago',
        limit: 10,
        expand: 'userId'
      });

      const recientesFormateados = pagosRecientes.map(pago => ({
        id: pago.id,
        cliente: pago.expand?.userId?.nombre || 'Cliente',
        monto: pago.montoPagado || pago.montoProgramado || 0,
        fecha: pago.fechaPago,
        estado: pago.estado
      }));

      setRecientes(recientesFormateados);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
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
        <title>Panel del Cobrador | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-24">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Panel del Cobrador</h1>
            <p className="text-gray-500 mt-1 text-sm">Gestiona tus cobros y rutas del día</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Users size={18} className="text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalClientes}</span>
              </div>
              <p className="text-xs text-gray-500">Clientes activos</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Clock size={18} className="text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">{stats.cobrosPendientes}</span>
              </div>
              <p className="text-xs text-gray-500">Cobros pendientes</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle size={18} className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">{stats.cobrosHoy}</span>
              </div>
              <p className="text-xs text-gray-500">Cobros hoy</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <Wallet size={18} className="text-[#6C3BFF]" />
                <span className="text-lg font-bold text-[#6C3BFF]">{formatMoney(stats.montoPendiente)}</span>
              </div>
              <p className="text-xs text-gray-500">Monto pendiente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Ruta de hoy */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} className="text-[#6C3BFF]" /> Ruta de hoy
                </h2>
                <Link href="/cobrador/ruta" className="flex items-center gap-1 text-sm text-[#6C3BFF] font-medium hover:gap-2 transition-all">
                  Ver completa <ChevronRight size={14} />
                </Link>
              </div>

              <div className="p-4">
                {rutas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                      <MapPin size={22} className="text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No hay cobros programados para hoy</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rutas.map((ruta) => (
                      <div key={ruta.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#6C3BFF]/10 rounded-full flex items-center justify-center shrink-0">
                            <MapPin size={15} className="text-[#6C3BFF]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{ruta.cliente}</p>
                            <p className="text-xs text-gray-500">{ruta.direccion}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#6C3BFF]">{formatMoney(ruta.monto)}</p>
                          <p className="text-xs text-gray-400">{ruta.hora}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ScanLine size={16} className="text-[#6C3BFF]" /> Acciones rápidas
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <Link
                  href="/cobrador/scan"
                  className="flex items-center justify-center gap-2 w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white text-center py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  <ScanLine size={16} /> Escanear QR de cliente
                </Link>
                <Link
                  href="/cobrador/ruta"
                  className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  <MapIcon size={16} /> Ver mi ruta de hoy
                </Link>
              </div>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-[#6C3BFF]" /> Actividad reciente
              </h2>
            </div>

            <div className="p-4">
              {recientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Clock size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">No hay actividad reciente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recientes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle size={14} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.cliente}</p>
                          <p className="text-xs text-gray-500">Pago registrado de {formatMoney(item.monto)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">
                        {item.fecha ? new Date(item.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}