// src/pages/cobrador/ruta.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Users,
  CheckCircle,
  Wallet
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function CobradorRutaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ruta, setRuta] = useState([]);
  const [fecha, setFecha] = useState(new Date());

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    cargarRuta();
  }, []);

  const getClientAddress = async (userId) => {
    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `userId = "${userId}"`
      );
      const partes = [
        clientRecord.direccionCalle,
        clientRecord.direccionNumero,
        clientRecord.direccionColonia,
        clientRecord.direccionCiudad
      ].filter(Boolean);
      return partes.length > 0 ? partes.join(', ') : 'Dirección no registrada';
    } catch (error) {
      return 'Dirección no registrada';
    }
  };

  const cargarRuta = async () => {
    try {
      setLoading(true);

      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const pagosHoy = await pb.collection('payments').getFullList({
        filter: `fechaVencimiento >= "${inicioHoy.toISOString()}" && fechaVencimiento < "${finHoy.toISOString()}" && (estado = "pendiente" || estado = "atrasado")`,
        expand: 'userId,orderId'
      });

      const clientesMap = new Map();

      for (const pago of pagosHoy) {
        const clientId = pago.expand?.userId?.id;
        if (!clientId) continue;

        if (!clientesMap.has(clientId)) {
          const direccion = await getClientAddress(clientId);
          clientesMap.set(clientId, {
            cliente: pago.expand?.userId,
            pagos: [],
            total: 0,
            direccion
          });
        }

        const item = clientesMap.get(clientId);
        item.pagos.push(pago);
        item.total += pago.montoProgramado || pago.monto || 0;
      }

      const rutaArray = Array.from(clientesMap.values())
        .map(item => ({
          id: item.cliente?.id,
          nombre: item.cliente?.nombre || 'Cliente',
          telefono: item.cliente?.telefono,
          direccion: item.direccion,
          total: item.total,
          pagos: item.pagos.length
        }))
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

      setRuta(rutaArray);

    } catch (error) {
      console.error('Error cargando ruta:', error);
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

  const formatFecha = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
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
        <title>Mi Ruta | Cobrador</title>
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-24">

          <div className="mb-6">
            <Link href="/cobrador" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition">
              <ArrowLeft size={14} /> Volver al panel
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] px-6 py-7 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <MapPin size={22} /> Mi ruta de cobranza
                  </h1>
                  <p className="text-white/70 text-sm mt-1 capitalize">{formatFecha(fecha)}</p>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-3xl font-bold">{ruta.length}</div>
                  <p className="text-xs text-white/70">Clientes programados</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {ruta.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <MapPin size={28} className="text-gray-300" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-700 mb-1">No hay cobros programados para hoy</h3>
                  <p className="text-sm text-gray-400">Descansa, mañana será un nuevo día</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ruta.map((cliente, index) => (
                    <div key={cliente.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-[#6C3BFF]">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{cliente.nombre}</p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin size={11} className="shrink-0" /> {cliente.direccion}
                              </p>
                              {cliente.telefono && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <Phone size={11} className="shrink-0" /> {cliente.telefono}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-[#6C3BFF]">{formatMoney(cliente.total)}</p>
                              <p className="text-xs text-gray-400">{cliente.pagos} {cliente.pagos === 1 ? 'pago' : 'pagos'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link
                              href={`/cobrador/scan?client=${cliente.id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-2 rounded-xl text-sm font-semibold text-center transition-colors"
                            >
                              <Wallet size={14} /> Cobrar ahora
                            </Link>
                            <a
                              href={`tel:${cliente.telefono}`}
                              className="flex items-center justify-center px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium transition-colors"
                            >
                              <Phone size={14} />
                            </a>
                          </div>
                        </div>
                      </div>
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