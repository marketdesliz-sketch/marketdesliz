// src/lib/kycService.js
import pb from './pocketbase';

async function getClientData(userId) {
  try {
    const clientRecord = await pb.collection('clients').getFirstListItem(
      `userId = "${userId}"`
    );
    return clientRecord;
  } catch (error) {
    console.log('No se encontró registro en clients');
    return null;
  }
}

export async function getClientKYC(clientId) {
  try {
    if (!clientId) return null;
    if (!pb.authStore.isValid) return null;

    const records = await pb.collection('kyc_verifications').getFullList({
      filter: `userId = "${clientId}"`,
      sort: '-fechaEnvio',
      limit: 1
    });

    return records[0] || null;
  } catch (error) {
    if (error.status === 400 || error.status === 404) return null;
    console.error('Error obteniendo KYC:', error);
    return null;
  }
}

export async function hasCompleteProfile(clientId) {
  try {
    if (!clientId) return false;

    const user = await pb.collection('users').getOne(clientId);
    if (!user.nombre || user.nombre.trim() === '') return false;

    const clientData = await getClientData(clientId);
    if (!clientData) return false;

    if (!clientData.telefonoAlternativo || clientData.telefonoAlternativo.length < 10) return false;
    if (!clientData.direccionCalle || clientData.direccionCalle.trim() === '') return false;
    if (!clientData.direccionNumero || clientData.direccionNumero.trim() === '') return false;
    if (!clientData.direccionColonia || clientData.direccionColonia.trim() === '') return false;
    if (!clientData.direccionCiudad || clientData.direccionCiudad.trim() === '') return false;
    if (!clientData.direccionEstado || clientData.direccionEstado.trim() === '') return false;
    if (!clientData.direccionCp || clientData.direccionCp.trim() === '') return false;
    if (!clientData.diaPago || !['lunes', 'martes'].includes(clientData.diaPago)) return false;
    if (!clientData.datosCompletos) return false;

    return true;
  } catch (error) {
    console.error('Error verificando perfil:', error);
    return false;
  }
}

export async function canJoinTanda(clientId) {
  try {
    if (!pb.authStore.isValid) {
      return { allowed: false, reason: 'NO_AUTENTICADO' };
    }

    let user;
    try {
      user = await pb.collection('users').getOne(clientId);
    } catch (e) {
      return { allowed: false, reason: 'CLIENTE_NO_EXISTE' };
    }

    const profileComplete = await hasCompleteProfile(clientId);
    if (!profileComplete) {
      return {
        allowed: false,
        reason: 'PERFIL_INCOMPLETO',
        missingFields: await getMissingFields(clientId)
      };
    }

    const kyc = await getClientKYC(clientId);
    if (!kyc) {
      return { allowed: false, reason: 'KYC_NO_ENVIADO' };
    }

    if (kyc.estado === 'pendiente') {
      return { allowed: false, reason: 'KYC_PENDIENTE' };
    }

    if (kyc.estado === 'rechazado') {
      return {
        allowed: false,
        reason: 'KYC_RECHAZADO',
        notes: kyc.motivoRechazo || 'Documentos no válidos'
      };
    }

    if (kyc.estado !== 'aprobado') {
      return { allowed: false, reason: 'KYC_NO_APROBADO' };
    }

    if (!kyc.termsAccepted) {
      return { allowed: false, reason: 'TERMINOS_NO_ACEPTADOS' };
    }

    // Verificar carta compromiso
    if (!kyc.cartaCompromiso) {
      return { allowed: false, reason: 'CARTA_COMPROMISO_FALTANTE' };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error verificando:', error);
    return { allowed: false, reason: 'ERROR' };
  }
}

async function getMissingFields(clientId) {
  const missing = [];
  
  try {
    const user = await pb.collection('users').getOne(clientId);
    if (!user.nombre || user.nombre.trim() === '') missing.push('nombre');
  } catch (e) {
    missing.push('usuario_no_existe');
  }

  const clientData = await getClientData(clientId);
  if (!clientData) {
    missing.push('cliente_no_registrado');
    return missing;
  }

  if (!clientData.telefonoAlternativo || clientData.telefonoAlternativo.length < 10) missing.push('telefonoAlternativo');
  if (!clientData.direccionCalle || clientData.direccionCalle.trim() === '') missing.push('direccionCalle');
  if (!clientData.direccionNumero || clientData.direccionNumero.trim() === '') missing.push('direccionNumero');
  if (!clientData.direccionColonia || clientData.direccionColonia.trim() === '') missing.push('direccionColonia');
  if (!clientData.direccionCiudad || clientData.direccionCiudad.trim() === '') missing.push('direccionCiudad');
  if (!clientData.direccionEstado || clientData.direccionEstado.trim() === '') missing.push('direccionEstado');
  if (!clientData.direccionCp || clientData.direccionCp.trim() === '') missing.push('direccionCp');
  if (!clientData.diaPago || !['lunes', 'martes'].includes(clientData.diaPago)) missing.push('diaPago');
  if (!clientData.aceptaTerminos) missing.push('aceptaTerminos');

  return missing;
}

export async function updateCompleteProfile(clientId, profileData) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const userUpdateData = { nombre: profileData.nombre };
    if (profileData.email && profileData.email.trim() !== '') {
      userUpdateData.email = profileData.email;
    }
    await pb.collection('users').update(clientId, userUpdateData);

    let clientRecord = await getClientData(clientId);
    
    const clientUpdateData = {
      telefonoAlternativo: profileData.telefonoAlternativo,
      diaPago: profileData.diaPago,
      direccionCalle: profileData.calle,
      direccionNumero: profileData.numeroExterior,
      direccionInterior: profileData.numeroInterior || '',
      direccionColonia: profileData.colonia,
      direccionMunicipio: profileData.municipio,
      direccionCiudad: profileData.ciudad,
      direccionEstado: profileData.estado,
      direccionCp: profileData.codigoPostal,
      direccionReferencias: profileData.referenciasDomicilio || '',
      datosCompletos: true
    };

    if (clientRecord) {
      await pb.collection('clients').update(clientRecord.id, clientUpdateData);
    } else {
      await pb.collection('clients').create({
        userId: clientId,
        ...clientUpdateData,
        nivel: 0,
        productosComprados: 0,
        productosPagados: 0,
        productosEnCurso: 0,
        deudaActual: 0,
        limiteDeuda: 5000,
        estadoKyc: 'pendiente',
        trustScore: 0,
        totalGastado: 0,
        fechaUltimaCompra: null,
        fechaPrimerCompra: null,
        aceptaTerminos: false,
        documentosCompletos: false
      });
    }

    return true;
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    throw error;
  }
}

export async function submitKYC(clientId, files, acceptedTerms, additionalData = {}) {
  try {
    if (!clientId) throw new Error('ID de cliente no válido');
    if (!acceptedTerms) throw new Error('Debes aceptar los términos');
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const formData = new FormData();
    formData.append('userId', clientId);
    formData.append('estado', 'pendiente');
    formData.append('termsAccepted', acceptedTerms);
    formData.append('termsAcceptedAt', new Date().toISOString());
    formData.append('fechaEnvio', new Date().toISOString());
    formData.append('fechaSolicitud', new Date().toISOString());

    if (additionalData.fechaNacimiento) {
      formData.append('fechaNacimiento', additionalData.fechaNacimiento);
    }
    if (additionalData.curp) {
      formData.append('curp', additionalData.curp);
    }

    if (files.idFront) formData.append('idFront', files.idFront);
    if (files.idBack) formData.append('idBack', files.idBack);
    if (files.selfie) formData.append('selfie', files.selfie);
    if (files.comprobanteDomicilio) formData.append('comprobanteDomicilio', files.comprobanteDomicilio);
    if (files.cartaCompromiso) formData.append('cartaCompromiso', files.cartaCompromiso);

    const kyc = await pb.collection('kyc_verifications').create(formData);
    return kyc;
  } catch (error) {
    console.error('Error enviando KYC:', error);
    throw error;
  }
}

export async function updateKYC(kycId, files, acceptedTerms, additionalData = {}) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const formData = new FormData();
    formData.append('estado', 'pendiente');
    formData.append('fechaActualizacion', new Date().toISOString());

    if (acceptedTerms !== undefined) {
      formData.append('termsAccepted', acceptedTerms);
      formData.append('termsAcceptedAt', new Date().toISOString());
    }

    if (additionalData.fechaNacimiento) formData.append('fechaNacimiento', additionalData.fechaNacimiento);
    if (additionalData.curp) formData.append('curp', additionalData.curp);

    if (files?.idFront) formData.append('idFront', files.idFront);
    if (files?.idBack) formData.append('idBack', files.idBack);
    if (files?.selfie) formData.append('selfie', files.selfie);
    if (files?.comprobanteDomicilio) formData.append('comprobanteDomicilio', files.comprobanteDomicilio);
    if (files?.cartaCompromiso) formData.append('cartaCompromiso', files.cartaCompromiso);

    const kyc = await pb.collection('kyc_verifications').update(kycId, formData);
    return kyc;
  } catch (error) {
    console.error('Error actualizando KYC:', error);
    throw error;
  }
}

export function getKYCMessage(status, notes = null) {
  const messages = {
    'NO_AUTENTICADO': {
      title: '🔐 Inicia sesión',
      message: 'Para participar en tandas, primero debes iniciar sesión',
      action: 'Iniciar sesión',
      link: '/auth/login'
    },
    'CLIENTE_NO_EXISTE': {
      title: '📱 Registro necesario',
      message: 'Primero debes registrarte con tu teléfono',
      action: 'Registrarse',
      link: '/solicitar'
    },
    'PERFIL_INCOMPLETO': {
      title: '📋 Completa tu perfil',
      message: 'Faltan datos importantes en tu perfil.',
      action: 'Completar perfil',
      link: '/perfil'
    },
    'KYC_NO_ENVIADO': {
      title: '🔐 Verificación pendiente',
      message: 'Para unirte a tandas, necesitas verificar tu identidad',
      action: 'Iniciar verificación',
      link: '/kyc'
    },
    'KYC_PENDIENTE': {
      title: '⏳ Verificación en proceso',
      message: 'Tus documentos están siendo revisados.',
      action: 'Ver estado',
      link: '/kyc/estado'
    },
    'KYC_RECHAZADO': {
      title: '❌ Documentos rechazados',
      message: notes || 'Tus documentos no fueron aprobados.',
      action: 'Reintentar',
      link: '/kyc'
    },
    'KYC_NO_APROBADO': {
      title: '❌ Verificación incompleta',
      message: 'Tu verificación no ha sido aprobada.',
      action: 'Contactar soporte',
      link: '/soporte'
    },
    'TERMINOS_NO_ACEPTADOS': {
      title: '📜 Términos y condiciones',
      message: 'Debes aceptar los términos para participar',
      action: 'Aceptar términos',
      link: '/terminos'
    },
    'CARTA_COMPROMISO_FALTANTE': {
      title: '📄 Carta compromiso',
      message: 'Debes subir la carta compromiso firmada',
      action: 'Subir carta',
      link: '/kyc'
    },
    'ERROR': {
      title: '⚠️ Error',
      message: 'Ocurrió un error. Intenta de nuevo.',
      action: 'Reintentar',
      link: '#'
    }
  };

  return messages[status] || messages['ERROR'];
}

export async function reviewKYC(kycId, estado, notas) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const adminId = pb.authStore.model?.id;

    const updated = await pb.collection('kyc_verifications').update(kycId, {
      estado: estado,
      notas: notas || '',
      motivoRechazo: estado === 'rechazado' ? notas : null,
      revisadoPor: adminId,
      fechaRevision: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    });

    return updated;
  } catch (error) {
    console.error('Error revisando KYC:', error);
    throw error;
  }
}

export async function getPendingKYC() {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const pendingKYC = await pb.collection('kyc_verifications').getFullList({
      filter: 'estado = "pendiente"',
      sort: '-fechaEnvio',
      expand: 'userId'
    });

    return pendingKYC;
  } catch (error) {
    console.error('Error obteniendo KYC pendientes:', error);
    return [];
  }
}

export async function getAllKYC() {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const allKYC = await pb.collection('kyc_verifications').getFullList({
      sort: '-fechaEnvio',
      expand: 'userId'
    });

    return allKYC;
  } catch (error) {
    console.error('Error obteniendo todos los KYC:', error);
    return [];
  }
}
// src/lib/kycService.js
// ... (todo tu código existente) ...

// ============================================================
// NUEVAS FUNCIONES PARA ADMIN (paginación, estadísticas)
// ============================================================

const ITEMS_PER_PAGE = 10;

/**
 * Obtiene solicitudes KYC con paginación, búsqueda y filtros.
 * @param {Object} params
 * @param {number} params.page - Número de página (default: 1)
 * @param {number} params.perPage - Elementos por página (default: 10)
 * @param {string} params.search - Búsqueda por nombre o teléfono
 * @param {string} params.estado - 'pendientes' | 'aprobados' | 'rechazados' | 'todos'
 * @param {string} params.sort - Campo de ordenamiento (ej: '-created')
 * @returns {Promise<Object>} { items, totalItems, totalPages, page, perPage }
 */
export async function getKYCRequests({ page = 1, perPage = ITEMS_PER_PAGE, search = '', estado = 'pendientes', sort = '-created' }) {
    try {
        let filter = '';

        // Mapear estado a valor de PocketBase
        const estadoMap = {
            'pendientes': 'pendiente',
            'aprobados': 'aprobado',
            'rechazados': 'rechazado'
        };
        const estadoValue = estadoMap[estado];
        if (estadoValue) {
            filter += `estado = "${estadoValue}"`;
        } else if (estado === 'todos') {
            // Sin filtro de estado
        } else {
            // Si no coincide, usar 'pendiente' por defecto
            filter += `estado = "pendiente"`;
        }

        if (search.trim()) {
            const term = search.trim();
            // Buscar en nombre o teléfono del usuario expandido
            // Nota: PocketBase no soporta búsqueda en campos expandidos directamente en el filtro,
            // así que haremos la búsqueda en el cliente después de obtener los datos.
            // O podemos obtener los usuarios primero y luego filtrar.
            // Para simplificar, aplicamos filtro de búsqueda después de obtener los datos.
        }

        // Obtener registros con expand de userId
        const result = await pb.collection('kyc_verifications').getList(page, perPage, {
            filter: filter || undefined,
            sort: sort,
            expand: 'userId',
            // fields: 'id,userId,estado,idFront,idBack,foto,fechaEnvio,created,submittedAt,motivoRechazo,fechaActualizacion,fechaRevision,revisadoPor,expand.userId.nombre,expand.userId.telefono'
        });

        // Aplicar búsqueda en cliente (por nombre o teléfono)
        let items = result.items;
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            items = items.filter(item => {
                const nombre = item.expand?.userId?.nombre?.toLowerCase() || '';
                const telefono = item.expand?.userId?.telefono?.toLowerCase() || '';
                return nombre.includes(term) || telefono.includes(term);
            });
        }

        return {
            items,
            totalItems: result.totalItems,
            totalPages: result.totalPages,
            page: result.page,
            perPage: result.perPage
        };
    } catch (error) {
        console.error('Error obteniendo KYC:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas rápidas para el dashboard de KYC.
 * @returns {Promise<Object>} { pendientes, aprobadosHoy, rechazados, total }
 */
export async function getKYCStats() {
    try {
        const pendientesResult = await pb.collection('kyc_verifications').getList(1, 1, {
            filter: 'estado = "pendiente"',
            fields: 'id'
        });

        const hoy = new Date();
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        const aprobadosHoyResult = await pb.collection('kyc_verifications').getList(1, 1, {
            filter: `estado = "aprobado" && fechaActualizacion >= "${inicioHoy.toISOString()}" && fechaActualizacion < "${finHoy.toISOString()}"`,
            fields: 'id'
        });

        const rechazadosResult = await pb.collection('kyc_verifications').getList(1, 1, {
            filter: 'estado = "rechazado"',
            fields: 'id'
        });

        const total = pendientesResult.totalItems + aprobadosHoyResult.totalItems + rechazadosResult.totalItems;

        return {
            pendientes: pendientesResult.totalItems,
            aprobadosHoy: aprobadosHoyResult.totalItems,
            rechazados: rechazadosResult.totalItems,
            total
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas KYC:', error);
        return { pendientes: 0, aprobadosHoy: 0, rechazados: 0, total: 0 };
    }
}