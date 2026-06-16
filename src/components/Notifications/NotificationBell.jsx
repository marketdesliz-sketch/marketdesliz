// src/components/Notifications/NotificationBell.jsx
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import pb from '../../lib/pocketbase';

export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      cargarNotificaciones();
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const todasNotificaciones = [];

      // ✅ Verificar autenticación primero
      if (!pb.authStore.isValid || !pb.authStore.model) {
        setNotificaciones([]);
        setNoLeidas(0);
        return;
      }

      const userId = pb.authStore.model.id;
      const userRole = pb.authStore.model.role;

      // Si es admin, buscar notificaciones del sistema
      if (userRole === 'admin') {
        // Notificaciones de la colección unificada para admin
        try {
          const notifsAdmin = await pb.collection('notificaciones').getFullList({
            filter: `tipoUsuario = "admin" && leida = false`,
            sort: '-created',
            limit: 20
          });

          for (const notif of notifsAdmin) {
            todasNotificaciones.push({
              id: notif.id,
              tipo: notif.tipo || 'sistema',
              mensaje: notif.titulo || notif.mensaje,
              link: notif.entidadTipo === 'solicitud' ? '/admin/solicitudes' :
                notif.entidadTipo === 'orden' ? '/admin/ordenes' : '/admin/dashboard',
              fecha: new Date(notif.created),
              leida: notif.leida
            });
          }
        } catch (e) {
          console.warn('Error cargando notificaciones admin:', e.message);
        }

        // KYC pendientes
        try {
          const kycPendientes = await pb.collection('kyc_verifications').getList(1, 1, {
            filter: 'estado = "pendiente"'
          });
          if (kycPendientes.totalItems > 0) {
            todasNotificaciones.push({
              id: 'kyc-pendientes',
              tipo: 'kyc',
              mensaje: `${kycPendientes.totalItems} solicitudes KYC por revisar`,
              link: '/admin/kyc',
              fecha: new Date(),
              leida: false
            });
          }
        } catch (e) { }

        // Pagos atrasados
        try {
          const pagosAtrasados = await pb.collection('payments').getList(1, 1, {
            filter: `(estado = "pendiente" || estado = "atrasado") && fechaVencimiento < "${new Date().toISOString().split('T')[0]}"`
          });
          if (pagosAtrasados.totalItems > 0) {
            todasNotificaciones.push({
              id: 'pagos-atrasados',
              tipo: 'pago',
              mensaje: `${pagosAtrasados.totalItems} pagos atrasados por cobrar`,
              link: '/admin/pagos',
              fecha: new Date(),
              leida: false
            });
          }
        } catch (e) { }
      }

      // Si es cliente, buscar sus notificaciones
      if (userId && (userRole === 'cliente' || !userRole)) {
        try {
          const notifsCliente = await pb.collection('notificaciones').getFullList({
            filter: `usuarioId = "${userId}" && leida = false`,
            sort: '-created',
            limit: 20
          });

          for (const notif of notifsCliente) {
            todasNotificaciones.push({
              id: notif.id,
              tipo: notif.tipo || 'sistema',
              mensaje: notif.titulo || notif.mensaje,
              link: notif.tipo === 'nivel_up' ? '/perfil' :
                notif.entidadTipo === 'orden' ? '/perfil/ordenes' : '/perfil',
              fecha: new Date(notif.created),
              leida: notif.leida
            });
          }
        } catch (e) {
          console.warn('Error cargando notificaciones cliente:', e.message);
        }
      }

      // Si es vendedor
      if (userId && userRole === 'vendedor') {
        try {
          const notifsVendedor = await pb.collection('notificaciones').getFullList({
            filter: `usuarioId = "${userId}" && leida = false`,
            sort: '-created',
            limit: 20
          });

          for (const notif of notifsVendedor) {
            todasNotificaciones.push({
              id: notif.id,
              tipo: notif.tipo || 'sistema',
              mensaje: notif.titulo || notif.mensaje,
              link: notif.entidadTipo === 'solicitud' ? '/vendedor/solicitudes' : '/vendedor',
              fecha: new Date(notif.created),
              leida: notif.leida
            });
          }
        } catch (e) {
          console.warn('Error cargando notificaciones vendedor:', e.message);
        }
      }

      setNotificaciones(todasNotificaciones);
      setNoLeidas(todasNotificaciones.filter(n => !n.leida).length);

    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const marcarComoLeidas = async () => {
    try {
      for (const notif of notificaciones) {
        if (!notif.leida && notif.id && !notif.id.includes('-')) {
          await pb.collection('notificaciones').update(notif.id, {
            leida: true,
            leidaEn: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('Error marcando como leídas:', e.message);
    }
    setNoLeidas(0);
    setShowDropdown(false);
  };

  const getIcon = (tipo) => {
    const icons = {
      kyc: '🔐',
      pago: '💰',
      nivel_up: '🎉',
      tanda_disponible: '🎯',
      limite_alcanzado: '⚠️',
      nueva_solicitud: '📋',
      recordatorio: '⏰',
      sistema: '📢',
      comentario: '💬',
      calificacion: '⭐',
      contacto: '📞',
      visita: '🏠'
    };
    return icons[tipo] || '📌';
  };

  const getTimeAgo = (fecha) => {
    const ahora = new Date();
    const diff = ahora - fecha;
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
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-[#6C3BFF] transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px]">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-200 animate-slide-down">
          <div className="p-4 bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] text-white flex justify-between items-center">
            <span className="font-semibold">
              🔔 Notificaciones
              {noLeidas > 0 && <span className="ml-2 text-sm opacity-80">({noLeidas})</span>}
            </span>
            {noLeidas > 0 && (
              <button
                onClick={marcarComoLeidas}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-6 text-center">
                <span className="text-3xl">📭</span>
                <p className="text-gray-500 mt-2">No hay notificaciones</p>
              </div>
            ) : (
              notificaciones.map((notif, index) => (
                <Link href={notif.link} key={notif.id || index}>
                  <div
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 ${!notif.leida ? 'bg-purple-50/50' : ''
                      }`}
                    onClick={() => setShowDropdown(false)}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {getIcon(notif.tipo)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.leida ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {notif.mensaje}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getTimeAgo(notif.fecha)}
                      </p>
                    </div>
                    {!notif.leida && (
                      <span className="w-2 h-2 bg-[#6C3BFF] rounded-full flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/perfil"
            className="block p-3 text-center text-sm text-[#6C3BFF] hover:bg-gray-50 font-medium border-t border-gray-100"
            onClick={() => setShowDropdown(false)}
          >
            Ver todas las notificaciones →
          </Link>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}