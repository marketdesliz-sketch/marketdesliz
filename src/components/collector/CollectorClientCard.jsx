// src/components/collector/CollectorClientCard.jsx
import { useState, useEffect } from 'react';
import pb from '../../lib/pocketbase';

export default function CollectorClientCard({ client }) {
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [clientAddress, setClientAddress] = useState('');
  const [clientData, setClientData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (client?.id) {
      cargarDatosCliente(client.id);
    } else {
      setLoadingData(false);
    }
  }, [client?.id]);

  const cargarDatosCliente = async (userId) => {
    setLoadingData(true);
    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `userId = "${userId}"`
      );
      setClientData(clientRecord);
      
      const direccionCompleta = [
        clientRecord.direccionCalle,
        clientRecord.direccionNumero ? `#${clientRecord.direccionNumero}` : '',
        clientRecord.direccionInterior ? `Int. ${clientRecord.direccionInterior}` : '',
        clientRecord.direccionColonia,
        clientRecord.direccionMunicipio,
        clientRecord.direccionCiudad,
        clientRecord.direccionEstado,
        clientRecord.direccionCp ? `CP ${clientRecord.direccionCp}` : ''
      ].filter(Boolean).join(', ');
      
      setClientAddress(direccionCompleta || 'Sin dirección registrada');
    } catch (error) {
      console.log('No se encontró dirección para este cliente');
      setClientAddress('Sin dirección registrada');
      setClientData(null);
    } finally {
      setLoadingData(false);
    }
  };

  if (!client) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return 'No registrado';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
  };

  const truncateAddress = (address, maxLength = 50) => {
    if (!address) return 'Sin dirección';
    if (address.length <= maxLength || showFullAddress) return address;
    return address.substring(0, maxLength) + '...';
  };

  const getStatusInfo = () => {
    if (client.activo === true) {
      return { text: 'ACTIVO', color: 'bg-green-500' };
    }
    return { text: 'INACTIVO', color: 'bg-red-500' };
  };

  const getNivelInfo = () => {
    if (!clientData) return null;
    const nivel = clientData.nivel || 0;
    const niveles = {
      0: { nombre: 'Sin nivel', color: '#999' },
      1: { nombre: 'Básico', color: '#6C3BFF' },
      3: { nombre: 'Bronce', color: '#CD7F32' },
      5: { nombre: 'Plata', color: '#C0C0C0' },
      10: { nombre: 'Oro', color: '#FFD700' },
      20: { nombre: 'Platino', color: '#E5E4E2' },
      30: { nombre: 'Diamante', color: '#B9F2FF' },
      40: { nombre: 'Zafiro', color: '#0F52BA' },
      50: { nombre: 'Rubí', color: '#E0115F' }
    };
    return niveles[nivel] || niveles[0];
  };

  const getKycStatus = () => {
    if (!clientData) return null;
    const estados = {
      pendiente: { text: 'KYC Pendiente', color: 'bg-yellow-500' },
      aprobado: { text: 'KYC Aprobado', color: 'bg-green-500' },
      rechazado: { text: 'KYC Rechazado', color: 'bg-red-500' }
    };
    return estados[clientData.estadoKyc] || null;
  };

  const statusInfo = getStatusInfo();
  const nivelInfo = getNivelInfo();
  const kycInfo = getKycStatus();

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-6 hover:shadow-xl transition-shadow">
      {/* Cabecera con gradiente */}
      <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white">
              {client.nombre ? client.nombre.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{client.nombre || 'Cliente'}</h2>
              <p className="text-white/80 text-sm mt-1">
                {loadingData ? 'Cargando...' : `Cliente desde ${formatDate(client.created)}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.color} text-white text-center`}>
              {statusInfo.text}
            </div>
            {kycInfo && (
              <div className={`px-4 py-1 rounded-full text-xs font-semibold ${kycInfo.color} text-white text-center`}>
                {kycInfo.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Teléfono */}
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-[#F3F0FF] transition-colors">
            <div className="w-10 h-10 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Teléfono</p>
              <p className="font-semibold text-gray-800">{formatPhone(client.telefono)}</p>
              {client.telefono && (
                <a 
                  href={`https://wa.me/52${client.telefono.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 mt-1 inline-flex items-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-[#F3F0FF] transition-colors">
            <div className="w-10 h-10 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Dirección</p>
              <p className="font-semibold text-gray-800 text-sm break-words">
                {loadingData ? 'Cargando...' : truncateAddress(clientAddress)}
              </p>
              {clientAddress && clientAddress.length > 50 && (
                <button
                  onClick={() => setShowFullAddress(!showFullAddress)}
                  className="text-xs text-[#6C3BFF] hover:text-[#5A2FE0] mt-1"
                >
                  {showFullAddress ? 'Ver menos' : 'Ver dirección completa'}
                </button>
              )}
            </div>
          </div>

          {/* Email */}
          {client.email && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-[#F3F0FF] transition-colors">
              <div className="w-10 h-10 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="font-semibold text-gray-800 text-sm truncate">{client.email}</p>
              </div>
            </div>
          )}

          {/* Nivel y Deuda */}
          {clientData && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-[#F3F0FF] transition-colors">
              <div className="w-10 h-10 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                <span style={{ color: nivelInfo?.color, fontWeight: 'bold', fontSize: '14px' }}>
                  {clientData.nivel || 0}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Nivel · Deuda</p>
                <p className="font-semibold text-gray-800 text-sm" style={{ color: nivelInfo?.color }}>
                  {nivelInfo?.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  Deuda: ${(clientData.deudaActual || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Teléfono alternativo */}
          {clientData?.telefonoAlternativo && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-[#F3F0FF] transition-colors">
              <div className="w-10 h-10 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Tel. Alternativo</p>
                <p className="font-semibold text-gray-800">{formatPhone(clientData.telefonoAlternativo)}</p>
              </div>
            </div>
          )}

          {/* Día de pago */}
          {clientData?.diaPago && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-[#F3F0FF] transition-colors">
              <div className="w-10 h-10 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Día de pago</p>
                <p className="font-semibold text-gray-800 capitalize">{clientData.diaPago}</p>
              </div>
            </div>
          )}
        </div>

        {/* Referencias */}
        {clientData?.direccionReferencias && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xs text-yellow-700 mb-1">📝 Referencias</p>
            <p className="text-sm text-gray-700">{clientData.direccionReferencias}</p>
          </div>
        )}

        {/* Estadísticas rápidas */}
        {clientData && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Compras</p>
              <p className="font-bold text-[#6C3BFF]">{clientData.productosComprados || 0}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Pagados</p>
              <p className="font-bold text-green-600">{clientData.productosPagados || 0}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">En curso</p>
              <p className="font-bold text-orange-500">{clientData.productosEnCurso || 0}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Confianza</p>
              <p className="font-bold text-blue-500">{clientData.trustScore || 0}%</p>
            </div>
          </div>
        )}

        {/* Botones de acción rápida */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clientAddress)}`, '_blank')}
            className="flex-1 text-sm bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Mapa
          </button>
          {client.telefono && (
            <a
              href={`tel:${client.telefono.replace(/\D/g, '')}`}
              className="flex-1 text-sm bg-[#6C3BFF] text-white py-2 rounded-lg hover:bg-[#5A2FE0] transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Llamar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}