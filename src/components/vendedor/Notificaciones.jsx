// src/components/vendedor/Notificaciones.jsx
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getNotificacionesVendedor, marcarNotificacionLeida } from '../../lib/vendedorService';
import pb from '../../lib/pocketbase';

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [vendedorId, setVendedorId] = useState(null);
  const dropdownRef = useRef(null);
  const currentUser = pb.authStore.model;

  useEffect(() => {
    const obtenerVendedorId = async () => {
      if (!currentUser?.id) return;
      
      try {
        const vendedorRecord = await pb.collection('vendedores').getFirstListItem(
          `userId = "${currentUser.id}"`
        );
        setVendedorId(vendedorRecord.id);
      } catch (error) {
        console.error('Error obteniendo registro de vendedor:', error);
      }
    };
    
    obtenerVendedorId();
  }, [currentUser?.id]);

  useEffect(() => {
    if (vendedorId) {
      cargarNotificaciones();
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [vendedorId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarNotificaciones = async () => {
    if (!vendedorId) return;
    
    try {
      const notis = await getNotificacionesVendedor(vendedorId);
      setNotificaciones(notis);
      setNoLeidas(notis.filter(n => !n.leida).length);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const handleMarcarLeida = async (notificacionId) => {
    await marcarNotificacionLeida(notificacionId);
    setNotificaciones(prev => 
      prev.map(n => n.id === notificacionId ? { ...n, leida: true, leidaEn: new Date().toISOString() } : n)
    );
    setNoLeidas(prev => Math.max(0, prev - 1));
  };

  const handleMarcarTodasLeidas = async () => {
    for (const noti of notificaciones.filter(n => !n.leida)) {
      await marcarNotificacionLeida(noti.id);
    }
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true, leidaEn: new Date().toISOString() })));
    setNoLeidas(0);
  };

  const getIcono = (tipo) => {
    switch (tipo) {
      case 'nueva_solicitud': return '📋';
      case 'recordatorio': return '⏰';
      case 'sistema': return '⚙️';
      default: return '🔔';
    }
  };

  const getColor = (tipo) => {
    switch (tipo) {
      case 'nueva_solicitud': return 'bg-purple-100 text-purple-800';
      case 'recordatorio': return 'bg-yellow-100 text-yellow-800';
      case 'sistema': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (fecha) => {
    if (!fecha) return '';
    const ahora = new Date();
    const diff = ahora - new Date(fecha);
    const minutos = Math.floor(diff / 60000);
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 text-gray-600 hover:text-purple-600 transition"
        aria-label="Notificaciones"
      >
        <span className="text-2xl">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-slide-down">
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">
              Notificaciones
              {noLeidas > 0 && <span className="ml-2 text-xs text-red-500">({noLeidas})</span>}
            </h3>
            {noLeidas > 0 && (
              <button
                onClick={handleMarcarTodasLeidas}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-3xl mb-2 block">📭</span>
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              notificaciones.map((noti) => (
                <div
                  key={noti.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                    !noti.leida ? 'bg-purple-50/50' : ''
                  }`}
                  onClick={() => !noti.leida && handleMarcarLeida(noti.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(noti.tipo)}`}>
                      <span className="text-sm">{getIcono(noti.tipo)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!noti.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {noti.titulo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{noti.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getTimeAgo(noti.created)}
                      </p>
                    </div>
                    {!noti.leida && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Link 
            href="/vendedor/notificaciones" 
            className="block p-3 text-center text-xs text-purple-600 hover:bg-gray-50 font-medium border-t border-gray-200"
            onClick={() => setAbierto(false)}
          >
            Ver todas las notificaciones →
          </Link>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}