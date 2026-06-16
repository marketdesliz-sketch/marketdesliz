// src/components/clients/ClientCard.jsx
import Link from 'next/link';
import { User, Phone, Mail, MapPin, Award, ChevronRight, CreditCard, ShieldCheck, Package, DollarSign } from 'lucide-react';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function ClientCard({ client }) {
  if (!client) return null;

  const getStatusColor = (estadoKyc) => {
    const colors = {
      'pendiente': 'bg-amber-50 text-amber-700',
      'aprobado': 'bg-[#10b981]/10 text-[#10b981]',
      'rechazado': 'bg-red-50 text-red-700'
    };
    return colors[estadoKyc] || 'bg-gray-50 text-gray-600';
  };

  const getStatusLabel = (estadoKyc) => {
    const labels = {
      'pendiente': 'Pendiente',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado'
    };
    return labels[estadoKyc] || 'Desconocido';
  };

  const hasGoogleAuth = client.providers?.some(p => p.provider === 'google');
  const hasPhoneAuth = client.providers?.some(p => p.provider === 'phone');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header con nombre y nivel */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
              <User size={16} className="text-[#6C3BFF]" />
              {client.nombre || 'Cliente sin nombre'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              ID: <span className="font-mono">{client.id?.slice(0, 8) || 'N/A'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {client.nivel !== undefined && (
              <span className="flex items-center gap-1 px-2 py-1 bg-[#6C3BFF]/10 text-[#6C3BFF] rounded-lg text-xs font-bold">
                <Award size={12} /> Nivel {client.nivel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="p-4 space-y-2">
        {client.telefono && (
          <div className="flex items-center gap-2 text-sm">
            <Phone size={14} className="text-gray-400" />
            <span className="text-gray-700">
              {client.telefono.replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3')}
            </span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail size={14} className="text-gray-400" />
            <span className="text-gray-700 truncate">{client.email}</span>
          </div>
        )}
        {client.clientData?.direccionCalle && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={14} className="text-gray-400 mt-0.5" />
            <span className="text-gray-700 text-sm truncate">
              {[client.clientData.direccionCalle, client.clientData.direccionColonia]
                .filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-1 px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400">Compras</p>
          <p className="font-bold text-gray-900">{client.productosComprados || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">En curso</p>
          <p className="font-bold text-orange-500">{client.productosEnCurso || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Deuda</p>
          <p className="font-bold text-red-500">{formatMoney(client.deudaActual || 0)}</p>
        </div>
      </div>

      {/* Métodos de autenticación y KYC */}
      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {hasGoogleAuth && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-medium">
              <CreditCard size={10} /> Google
            </span>
          )}
          {hasPhoneAuth && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] rounded-full text-[10px] font-medium">
              <Phone size={10} /> SMS
            </span>
          )}
          {!hasGoogleAuth && !hasPhoneAuth && (
            <span className="text-[10px] text-gray-400">Sin métodos de autenticación</span>
          )}
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(client.estadoKyc)}`}>
          <ShieldCheck size={10} /> {getStatusLabel(client.estadoKyc)}
        </span>
      </div>

      {/* Botón para ver detalles */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <Link
          href={`/admin/clientes/${client.id}`}
          className="flex items-center justify-center gap-1 w-full text-sm font-medium text-[#6C3BFF] hover:gap-2 transition-all"
        >
          Ver detalles <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}