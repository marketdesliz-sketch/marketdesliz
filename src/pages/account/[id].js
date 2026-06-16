// src/pages/account/[phone].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

import ClientInfo from "../../components/account/ClientInfo";
import ClientOrders from "../../components/account/ClientOrders";
import ClientPayments from "../../components/account/ClientPayments";
import ClientQR from "../../components/account/ClientQR";

import {
  getClientByPhone,
  getOrdersByClient,
  getPaymentsByClient
} from "../../lib/accountService";

export default function AccountPage() {
  const router = useRouter();
  const { phone } = router.query;

  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!phone) return;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const clientData = await getClientByPhone(phone);

        if (!clientData) {
          setError('Cliente no encontrado');
          setLoading(false);
          return;
        }

        const ordersData = await getOrdersByClient(clientData.id);
        const paymentsData = await getPaymentsByClient(clientData.id);

        setClient(clientData);
        setOrders(ordersData);
        setPayments(paymentsData);

      } catch (error) {
        console.error('Error cargando cuenta:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [phone]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6C3BFF] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {error || 'Cliente no encontrado'}
        </h2>
        <p className="text-gray-500 mb-6">
          No se pudo encontrar la información de la cuenta.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#6C3BFF] text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mi Cuenta | MarketDesliz</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mi Cuenta</h1>
                <p className="text-purple-200 text-sm">
                  Información de tu cuenta MarketDesliz
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <ClientInfo client={client} />
            <ClientOrders orders={orders} />
            <ClientPayments payments={payments} />
            <ClientQR client={client} />
          </div>
        </div>
      </div>
    </>
  );
}