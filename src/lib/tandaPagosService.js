// src/lib/tandaPagosService.js
import pb from './pocketbase';

// ============================================================
// CONSTANTES
// ============================================================
const COLLECTIONS = {
  TANDA_PAGOS: 'tanda_pagos',
  TANDA_MEMBERS: 'tanda_members',
  TANDAS: 'tandas',
  NOTIFICACIONES: 'notificaciones',
  RECORDATORIOS_PAGOS: 'recordatorios_pagos'
};

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Obtener el miembro de tanda por ID
 */
async function getTandaMemberById(memberId) {
  try {
    return await pb.collection(COLLECTIONS.TANDA_MEMBERS).getOne(memberId, {
      expand: 'tandaId,userId'
    });
  } catch (error) {
    console.error('Error obteniendo miembro:', error);
    return null;
  }
}

/**
 * Obtener la tanda por ID
 */
async function getTandaById(tandaId) {
  try {
    return await pb.collection(COLLECTIONS.TANDAS).getOne(tandaId);
  } catch (error) {
    console.error('Error obteniendo tanda:', error);
    return null;
  }
}

// ============================================================
// REGISTRAR PRIMERA PARTE DEL PAGO (50%)
// ============================================================

/**
 * Registra la primera parte del pago de una tanda (50%)
 * @param {string} tandaMemberId - ID del miembro en la tanda
 * @param {number} monto - Monto a pagar (opcional, se calcula automáticamente)
 * @param {string|null} cobradorId - ID del cobrador (opcional)
 * @returns {Promise<Object>} - Registro del pago creado
 */
export async function registrarPrimeraParte(tandaMemberId, monto = null, cobradorId = null) {
  try {
    const member = await getTandaMemberById(tandaMemberId);
    if (!member) throw new Error('Miembro no encontrado');

    const tanda = await getTandaById(member.tandaId);
    if (!tanda) throw new Error('Tanda no encontrada');

    // Verificar si ya pagó la primera parte
    if (member.pagoPrimeraParte) {
      throw new Error('Ya has registrado la primera parte de este pago');
    }

    // Calcular monto si no se proporciona (50% del monto de cuota)
    const montoPrimeraParte = monto || (tanda.montoCuota / 2);

    // Crear registro de pago
    const pago = await pb.collection(COLLECTIONS.TANDA_PAGOS).create({
      tandaMemberId: tandaMemberId,
      cobradorId: cobradorId,
      semana: member.posicion,
      monto: montoPrimeraParte,
      fechaPago: new Date().toISOString(),
      estado: 'pagado',
      tipoPago: 'primera_parte'
    });

    // Actualizar el miembro
    await pb.collection(COLLECTIONS.TANDA_MEMBERS).update(tandaMemberId, {
      pagoPrimeraParte: true,
      fechaPagoPrimera: new Date().toISOString()
    });

    // Crear notificación de confirmación
    await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
      usuarioId: member.userId,
      tipoUsuario: 'cliente',
      tipo: 'sistema',
      titulo: '💰 Primera parte de tanda registrada',
      mensaje: `Has registrado el 50% del pago de tu tanda "${tanda.nombre}". Recuerda que la segunda parte se pagará al finalizar.`,
      entidadId: tandaMemberId,
      entidadTipo: 'tanda_pago',
      datos: { tipo: 'primera_parte', monto: montoPrimeraParte }
    });

    // Crear recordatorio para la segunda parte (para dentro de 7 días)
    const fechaRecordatorio = new Date();
    fechaRecordatorio.setDate(fechaRecordatorio.getDate() + 7);

    await pb.collection(COLLECTIONS.RECORDATORIOS_PAGOS).create({
      tandaMemberId: tandaMemberId,
      usuarioId: member.userId,
      tipo: 'segunda_parte',
      fechaRecordatorio: fechaRecordatorio.toISOString(),
      enviado: false,
      creadoEn: new Date().toISOString()
    });

    console.log(`✅ Primera parte registrada para miembro ${tandaMemberId}`);
    return pago;
  } catch (error) {
    console.error('Error registrando primera parte:', error);
    throw error;
  }
}

// ============================================================
// REGISTRAR SEGUNDA PARTE DEL PAGO (50% restante)
// ============================================================

/**
 * Registra la segunda parte del pago de una tanda (50% restante)
 * @param {string} tandaMemberId - ID del miembro en la tanda
 * @param {number} monto - Monto a pagar (opcional, se calcula automáticamente)
 * @param {string|null} cobradorId - ID del cobrador (opcional)
 * @returns {Promise<Object>} - Registro del pago creado
 */
export async function registrarSegundaParte(tandaMemberId, monto = null, cobradorId = null) {
  try {
    const member = await getTandaMemberById(tandaMemberId);
    if (!member) throw new Error('Miembro no encontrado');

    const tanda = await getTandaById(member.tandaId);
    if (!tanda) throw new Error('Tanda no encontrada');

    // Verificar si ya pagó la primera parte
    if (!member.pagoPrimeraParte) {
      throw new Error('Debes registrar primero la primera parte del pago');
    }

    // Verificar si ya pagó la segunda parte
    if (member.pagoSegundaParte) {
      throw new Error('La segunda parte ya fue registrada');
    }

    // Calcular monto si no se proporciona (50% del monto de cuota)
    const montoSegundaParte = monto || (tanda.montoCuota / 2);

    // Crear registro de pago
    const pago = await pb.collection(COLLECTIONS.TANDA_PAGOS).create({
      tandaMemberId: tandaMemberId,
      cobradorId: cobradorId,
      semana: member.posicion,
      monto: montoSegundaParte,
      fechaPago: new Date().toISOString(),
      estado: 'pagado',
      tipoPago: 'segunda_parte'
    });

    // Actualizar el miembro
    await pb.collection(COLLECTIONS.TANDA_MEMBERS).update(tandaMemberId, {
      pagoSegundaParte: true,
      fechaPagoSegunda: new Date().toISOString(),
      estadoPago: 'pagado'  // Marcar como completamente pagado
    });

    // Marcar recordatorio como enviado
    try {
      const recordatorios = await pb.collection(COLLECTIONS.RECORDATORIOS_PAGOS).getFullList({
        filter: `tandaMemberId = "${tandaMemberId}" && tipo = "segunda_parte" && enviado = false`
      });
      for (const recordatorio of recordatorios) {
        await pb.collection(COLLECTIONS.RECORDATORIOS_PAGOS).update(recordatorio.id, {
          enviado: true,
          fechaEnvio: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Error actualizando recordatorios:', e.message);
    }

    // Crear notificación de finalización
    await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
      usuarioId: member.userId,
      tipoUsuario: 'cliente',
      tipo: 'sistema',
      titulo: '🎉 Pago de tanda completado',
      mensaje: `¡Felicidades! Has completado el pago de tu tanda "${tanda.nombre}".`,
      entidadId: tandaMemberId,
      entidadTipo: 'tanda_pago',
      datos: { tipo: 'segunda_parte', monto: montoSegundaParte }
    });

    console.log(`✅ Segunda parte registrada para miembro ${tandaMemberId}`);
    return pago;
  } catch (error) {
    console.error('Error registrando segunda parte:', error);
    throw error;
  }
}

// ============================================================
// CREAR RECORDATORIO PARA SEGUNDA PARTE
// ============================================================

/**
 * Crea un recordatorio para la segunda parte del pago
 * @param {string} tandaMemberId - ID del miembro en la tanda
 * @param {Date} fechaRecordatorio - Fecha para el recordatorio
 * @returns {Promise<Object>} - Recordatorio creado
 */
export async function crearRecordatorioSegundaParte(tandaMemberId, fechaRecordatorio = null) {
  try {
    const member = await getTandaMemberById(tandaMemberId);
    if (!member) throw new Error('Miembro no encontrado');

    // Si no se proporciona fecha, usar 7 días después de la primera parte
    let fecha = fechaRecordatorio;
    if (!fecha && member.fechaPagoPrimera) {
      fecha = new Date(member.fechaPagoPrimera);
      fecha.setDate(fecha.getDate() + 7);
    } else if (!fecha) {
      fecha = new Date();
      fecha.setDate(fecha.getDate() + 7);
    }

    // Verificar si ya existe un recordatorio
    const existing = await pb.collection(COLLECTIONS.RECORDATORIOS_PAGOS).getFullList({
      filter: `tandaMemberId = "${tandaMemberId}" && tipo = "segunda_parte"`
    }).catch(() => []);

    if (existing.length > 0) {
      return existing[0];
    }

    const recordatorio = await pb.collection(COLLECTIONS.RECORDATORIOS_PAGOS).create({
      tandaMemberId: tandaMemberId,
      usuarioId: member.userId,
      tipo: 'segunda_parte',
      fechaRecordatorio: fecha.toISOString(),
      enviado: false,
      creadoEn: new Date().toISOString()
    });

    console.log(`✅ Recordatorio creado para miembro ${tandaMemberId}`);
    return recordatorio;
  } catch (error) {
    console.error('Error creando recordatorio:', error);
    throw error;
  }
}

// ============================================================
// ENVIAR RECORDATORIO MANUALMENTE
// ============================================================

/**
 * Envía un recordatorio manual al usuario sobre la segunda parte
 * @param {string} tandaMemberId - ID del miembro en la tanda
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function enviarRecordatorioManual(tandaMemberId) {
  try {
    const member = await getTandaMemberById(tandaMemberId);
    if (!member) throw new Error('Miembro no encontrado');

    const tanda = await getTandaById(member.tandaId);
    if (!tanda) throw new Error('Tanda no encontrada');

    // Verificar si ya pagó la segunda parte
    if (member.pagoSegundaParte) {
      throw new Error('El usuario ya pagó la segunda parte');
    }

    // Verificar si ya pagó la primera parte
    if (!member.pagoPrimeraParte) {
      throw new Error('El usuario no ha pagado la primera parte');
    }

    // Crear notificación
    const notificacion = await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
      usuarioId: member.userId,
      tipoUsuario: 'cliente',
      tipo: 'recordatorio',
      titulo: '📢 Recordatorio de pago',
      mensaje: `Recuerda que debes completar el pago de la segunda parte de tu tanda "${tanda.nombre}" (50% restante).`,
      entidadId: tandaMemberId,
      entidadTipo: 'tanda_pago',
      datos: { tipo: 'recordatorio_manual' }
    });

    // Marcar recordatorio como enviado
    await pb.collection(COLLECTIONS.RECORDATORIOS_PAGOS).create({
      tandaMemberId: tandaMemberId,
      usuarioId: member.userId,
      tipo: 'segunda_parte',
      fechaRecordatorio: new Date().toISOString(),
      enviado: true,
      fechaEnvio: new Date().toISOString(),
      creadoEn: new Date().toISOString()
    });

    console.log(`✅ Recordatorio manual enviado a ${member.userId}`);
    return { success: true, notificacion };
  } catch (error) {
    console.error('Error enviando recordatorio manual:', error);
    throw error;
  }
}

// ============================================================
// OBTENER PAGOS DE UN MIEMBRO
// ============================================================

/**
 * Obtiene todos los pagos de un miembro
 * @param {string} tandaMemberId - ID del miembro en la tanda
 * @returns {Promise<Array>} - Lista de pagos
 */
export async function getPagosByMember(tandaMemberId) {
  try {
    const pagos = await pb.collection(COLLECTIONS.TANDA_PAGOS).getFullList({
      filter: `tandaMemberId = "${tandaMemberId}"`,
      sort: 'fechaPago'
    });
    return pagos;
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return [];
  }
}

// ============================================================
// OBTENER PENDIENTES DE SEGUNDA PARTE
// ============================================================

/**
 * Obtiene todos los miembros que tienen pendiente la segunda parte
 * @returns {Promise<Array>} - Lista de miembros pendientes
 */
export async function getPendientesSegundaParte() {
  try {
    const miembros = await pb.collection(COLLECTIONS.TANDA_MEMBERS).getFullList({
      filter: 'pagoPrimeraParte = true && pagoSegundaParte = false',
      expand: 'tandaId,userId'
    });

    // Filtrar tandas que ya terminaron (estado = completada)
    const pendientes = miembros.filter(m => {
      const tanda = m.expand?.tandaId;
      return tanda && tanda.estado === 'completada';
    });

    return pendientes;
  } catch (error) {
    console.error('Error obteniendo pendientes de segunda parte:', error);
    return [];
  }
}

// ============================================================
// VERIFICAR ESTADO DE PAGO DE UN MIEMBRO
// ============================================================

/**
 * Verifica el estado de pago de un miembro
 * @param {string} tandaMemberId - ID del miembro en la tanda
 * @returns {Promise<Object>} - Estado de pago
 */
export async function getEstadoPagoMiembro(tandaMemberId) {
  try {
    const member = await getTandaMemberById(tandaMemberId);
    if (!member) throw new Error('Miembro no encontrado');

    const pagos = await getPagosByMember(tandaMemberId);
    const pagosPrimeraParte = pagos.filter(p => p.tipoPago === 'primera_parte');
    const pagosSegundaParte = pagos.filter(p => p.tipoPago === 'segunda_parte');

    return {
      tienePrimeraParte: member.pagoPrimeraParte || pagosPrimeraParte.length > 0,
      tieneSegundaParte: member.pagoSegundaParte || pagosSegundaParte.length > 0,
      fechaPrimeraParte: member.fechaPagoPrimera,
      fechaSegundaParte: member.fechaPagoSegunda,
      montoPrimeraParte: pagosPrimeraParte[0]?.monto || null,
      montoSegundaParte: pagosSegundaParte[0]?.monto || null,
      estadoCompleto: (member.pagoPrimeraParte && member.pagoSegundaParte) || 
                      (pagosPrimeraParte.length > 0 && pagosSegundaParte.length > 0)
    };
  } catch (error) {
    console.error('Error verificando estado de pago:', error);
    return {
      tienePrimeraParte: false,
      tieneSegundaParte: false,
      fechaPrimeraParte: null,
      fechaSegundaParte: null,
      montoPrimeraParte: null,
      montoSegundaParte: null,
      estadoCompleto: false
    };
  }
}

// ============================================================
// OBTENER PAGOS DE TANDA POR TANDA ID
// ============================================================

/**
 * Obtiene todos los pagos de una tanda específica
 * @param {string} tandaId - ID de la tanda
 * @returns {Promise<Array>} - Lista de pagos
 */
export async function getPagosByTanda(tandaId) {
  try {
    // Obtener todos los miembros de la tanda
    const miembros = await pb.collection(COLLECTIONS.TANDA_MEMBERS).getFullList({
      filter: `tandaId = "${tandaId}"`
    });

    // Obtener pagos de cada miembro
    const todosLosPagos = [];
    for (const miembro of miembros) {
      const pagos = await getPagosByMember(miembro.id);
      todosLosPagos.push(...pagos.map(p => ({
        ...p,
        posicion: miembro.posicion,
        usuarioId: miembro.userId
      })));
    }

    return todosLosPagos;
  } catch (error) {
    console.error('Error obteniendo pagos por tanda:', error);
    return [];
  }
}