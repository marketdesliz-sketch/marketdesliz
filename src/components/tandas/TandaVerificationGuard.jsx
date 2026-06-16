// src/components/tandas/TandaVerificationGuard.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import pb from '../../lib/pocketbase';

export default function TandaVerificationGuard({ clientId, children, tandaId }) {
  const router = useRouter();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (clientId) {
      checkVerification();
    } else {
      setLoading(false);
    }
  }, [clientId, tandaId]);

  const checkVerification = async () => {
    try {
      setLoading(true);

      // 1. Verificar si ya está en la tanda
      if (tandaId) {
        try {
          const existingMembers = await pb.collection('tanda_members').getFullList({
            filter: `tandaId = "${tandaId}" && userId = "${clientId}"`
          });

          if (existingMembers.length > 0) {
            setVerification({ allowed: false, reason: 'YA_EN_TANDA' });
            setMessage({
              title: '⚠️ Ya estás registrado',
              message: 'Ya formas parte de esta tanda. No puedes unirte nuevamente.',
              action: 'Ver mis tandas',
              link: '/tandas'
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          // No existe, continuar
        }
      }

      // 2. Verificar pagos atrasados
      try {
        const hoy = new Date().toISOString().split('T')[0];
        const pagosAtrasados = await pb.collection('payments').getList(1, 1, {
          filter: `userId = "${clientId}" && (estado = "pendiente" || estado = "atrasado") && fechaVencimiento < "${hoy}"`
        });

        if (pagosAtrasados.totalItems > 0) {
          setVerification({ allowed: false, reason: 'PAGOS_ATRASADOS' });
          setMessage({
            title: '💰 Pagos pendientes',
            message: 'Tienes pagos atrasados. Regulariza tu situación para unirte a una tanda.',
            action: 'Ver mis pagos',
            link: '/perfil/pagos'
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Error verificando pagos:', e.message);
      }

      // 3. Verificar KYC
      try {
        const kycRecord = await pb.collection('kyc_verifications').getFirstListItem(
          `userId = "${clientId}"`
        );

        if (kycRecord.estado === 'pendiente') {
          setVerification({ allowed: false, reason: 'KYC_PENDIENTE' });
          setMessage({
            title: '🔐 Verificación pendiente',
            message: 'Tu verificación KYC está en revisión. Debe ser aprobada para unirte a tandas.',
            action: 'Ver estado KYC',
            link: '/perfil/kyc'
          });
          setLoading(false);
          return;
        }

        if (kycRecord.estado === 'rechazado') {
          setVerification({
            allowed: false,
            reason: 'KYC_RECHAZADO',
            notes: kycRecord.motivoRechazo || 'No especificado'
          });
          setMessage({
            title: '❌ Verificación rechazada',
            message: 'Tu verificación KYC fue rechazada. Corrige los documentos e intenta de nuevo.',
            action: 'Reenviar documentos',
            link: '/perfil/kyc'
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        // No tiene KYC, debe completarlo
        setVerification({ allowed: false, reason: 'KYC_REQUERIDO' });
        setMessage({
          title: '🔐 KYC requerido',
          message: 'Necesitas completar tu verificación de identidad para unirte a tandas.',
          action: 'Verificar identidad',
          link: '/kyc'
        });
        setLoading(false);
        return;
      }

      // 4. Verificar perfil completo
      try {
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `userId = "${clientId}"`
        );

        if (!clientRecord.datosCompletos) {
          const missingFields = [];
          if (!clientRecord.direccionCalle) missingFields.push('direccionCalle');
          if (!clientRecord.direccionNumero) missingFields.push('direccionNumero');
          if (!clientRecord.direccionColonia) missingFields.push('direccionColonia');
          if (!clientRecord.direccionMunicipio) missingFields.push('direccionMunicipio');
          if (!clientRecord.telefonoAlternativo) missingFields.push('telefonoAlternativo');

          if (missingFields.length > 0) {
            setVerification({
              allowed: false,
              reason: 'PERFIL_INCOMPLETO',
              missingFields
            });
            setMessage({
              title: '📝 Perfil incompleto',
              message: 'Completa tu información de perfil para acceder a las tandas.',
              action: 'Completar perfil',
              link: '/perfil/editar'
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Error verificando perfil:', e.message);
      }

      // 5. Verificar términos aceptados
      try {
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `userId = "${clientId}"`
        );

        if (!clientRecord.aceptaTerminos) {
          setVerification({ allowed: false, reason: 'TERMINOS_NO_ACEPTADOS' });
          setMessage({
            title: '📋 Términos y condiciones',
            message: 'Debes aceptar los términos y condiciones para participar en tandas.',
            action: 'Aceptar términos',
            link: '/perfil/terminos'
          });
          setLoading(false);
          return;
        }
      } catch (e) { }

      // 6. Verificar nivel de tanda progresivo (NUEVO)
      if (tandaId) {
        try {
          // Obtener la tanda para saber su nivel requerido
          const tanda = await pb.collection('tandas').getOne(tandaId);
          const nivelRequerido = tanda.nivelRequerido || 1;

          // Obtener progreso del cliente en tandas
          const participaciones = await pb.collection('tanda_members').getFullList({
            filter: `userId = "${clientId}"`,
            expand: 'tandaId'
          });

          // Encontrar el nivel máximo alcanzado
          let nivelMaximoParticipado = 0;
          for (const p of participaciones) {
            const nivelTanda = p.expand?.tandaId?.nivelRequerido || 0;
            if (nivelTanda > nivelMaximoParticipado) {
              nivelMaximoParticipado = nivelTanda;
            }
          }

          const haParticipado = participaciones.length > 0;
          const nivelPermitido = nivelMaximoParticipado + 1;

          // Validar nivel progresivo
          if (!haParticipado && nivelRequerido > 1) {
            setVerification({ allowed: false, reason: 'DEBES_COMENZAR_DESDE_NIVEL_BASICO' });
            setMessage({
              title: '🔒 Nivel no disponible',
              message: `Debes comenzar desde el nivel básico de tandas. Esta tanda requiere nivel ${nivelRequerido}.`,
              action: 'Ver tandas disponibles',
              link: '/tandas'
            });
            setLoading(false);
            return;
          }

          if (haParticipado && nivelRequerido > nivelPermitido) {
            setVerification({ allowed: false, reason: 'NIVEL_NO_DESBLOQUEADO' });
            setMessage({
              title: '🔒 Nivel bloqueado',
              message: `Completa primero las tandas de nivel ${nivelPermitido - 1} antes de unirte a esta tanda de nivel ${nivelRequerido}.`,
              action: 'Ver mi progreso',
              link: '/tandas/mis-tandas'
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Error verificando nivel progresivo:', e.message);
        }
      }

      // Todo bien
      setVerification({ allowed: true });

    } catch (error) {
      console.error('Error en verificación:', error);
      setMessage({
        title: 'Error',
        message: 'Hubo un problema al verificar tu acceso. Intenta de nuevo.',
        action: 'Reintentar',
        link: window.location.pathname
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6C3BFF] border-t-transparent"></div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow">
        <span className="text-5xl mb-4 block">🔐</span>
        <h3 className="text-xl font-bold mb-4">Inicia sesión</h3>
        <p className="text-gray-600 mb-6">Para ver las tandas, primero debes registrarte</p>
        <button
          onClick={() => router.push('/solicitar')}
          className="bg-[#6C3BFF] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5A2FE0] transition"
        >
          Registrarse ahora
        </button>
      </div>
    );
  }

  if (!verification?.allowed && message) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow max-w-md mx-auto">
        <span className="text-5xl mb-4 block">
          {verification.reason === 'KYC_PENDIENTE' ? '⏳' :
            verification.reason === 'KYC_RECHAZADO' ? '❌' :
              verification.reason === 'PAGOS_ATRASADOS' ? '💰' :
                verification.reason === 'PERFIL_INCOMPLETO' ? '📝' :
                  verification.reason === 'YA_EN_TANDA' ? '⚠️' :
                    verification.reason === 'DEBES_COMENZAR_DESDE_NIVEL_BASICO' ? '🔒' :
                      verification.reason === 'NIVEL_NO_DESBLOQUEADO' ? '🔒' : '🔐'}
        </span>
        <h3 className="text-xl font-bold mb-4">{message.title}</h3>
        <p className="text-gray-600 mb-6">{message.message}</p>

        {verification?.reason === 'KYC_RECHAZADO' && verification.notes && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-left">
            <strong>Motivo del rechazo:</strong>
            <p className="mt-1">{verification.notes}</p>
          </div>
        )}

        {verification?.reason === 'PERFIL_INCOMPLETO' && verification.missingFields && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl mb-6 text-left">
            <strong>Campos faltantes:</strong>
            <ul className="mt-2 list-disc list-inside">
              {verification.missingFields.map(field => (
                <li key={field}>{formatFieldName(field)}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => router.push(message.link)}
          className="bg-[#6C3BFF] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5A2FE0] transition"
        >
          {message.action}
        </button>
      </div>
    );
  }

  return children;
}

function formatFieldName(field) {
  const names = {
    'nombre': 'Nombre completo',
    'telefonoAlternativo': 'Teléfono alternativo',
    'direccionCalle': 'Calle',
    'direccionNumero': 'Número exterior',
    'direccionInterior': 'Número interior',
    'direccionColonia': 'Colonia',
    'direccionMunicipio': 'Municipio',
    'direccionCiudad': 'Ciudad',
    'direccionEstado': 'Estado',
    'direccionCp': 'Código postal',
    'diaPago': 'Día de pago',
    'aceptaTerminos': 'Términos y condiciones'
  };
  return names[field] || field;
}