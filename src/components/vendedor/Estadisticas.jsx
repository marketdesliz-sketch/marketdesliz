// src/components/vendedor/Estadisticas.jsx
import { useState, useEffect } from 'react';
import { getEstadisticasVendedor } from '../../lib/vendedorService';
import pb from '../../lib/pocketbase';

export default function Estadisticas({ vendedorId, refreshTrigger }) {
  const [estadisticas, setEstadisticas] = useState({
    totalSolicitudes: 0,
    completadas: 0,
    pendientes: 0,
    enganchesRecibidos: 0,
    comisionEstimada: 0,
    tasaExito: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendedorId) {
      cargarEstadisticas();
    }
  }, [vendedorId, refreshTrigger]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const stats = await getEstadisticasVendedor(vendedorId);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded-full mb-2"></div>
            <div className="h-6 w-16 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const tarjetas = [
    {
      titulo: 'Total solicitudes',
      valor: estadisticas.totalSolicitudes,
      icono: '📋',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      titulo: 'Completadas',
      valor: estadisticas.completadas,
      icono: '✅',
      color: 'bg-green-100 text-green-800'
    },
    {
      titulo: 'Pendientes',
      valor: estadisticas.pendientes,
      icono: '⏳',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      titulo: 'Enganches recibidos',
      valor: formatMoney(estadisticas.enganchesRecibidos),
      icono: '💰',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      titulo: 'Comisión estimada',
      valor: formatMoney(estadisticas.comisionEstimada),
      icono: '🎯',
      color: 'bg-indigo-100 text-indigo-800'
    },
    {
      titulo: 'Tasa de éxito',
      valor: `${Math.round(estadisticas.tasaExito)}%`,
      icono: '📈',
      color: 'bg-teal-100 text-teal-800'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {tarjetas.map((tarjeta, idx) => (
        <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className={`w-10 h-10 rounded-full ${tarjeta.color} flex items-center justify-center mb-3`}>
            <span className="text-xl">{tarjeta.icono}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tarjeta.valor}</p>
          <p className="text-xs text-gray-500 mt-1">{tarjeta.titulo}</p>
        </div>
      ))}
    </div>
  );
}
