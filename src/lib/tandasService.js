// src/lib/tandasService.js
import pb from './pocketbase';
import { getClientKYC } from './kycService';

async function getClientData(userId) {
  try {
    return await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
  } catch (error) {
    console.log('No se encontró registro en clients');
    return null;
  }
}

// ============================
// OBTENER TODAS LAS TANDAS (ADMIN)
// ============================
export async function getTandas() {
  try {
    if (!pb.authStore.isValid) return [];
    const tandas = await pb.collection('tandas').getFullList({
      sort: '-created',
      expand: 'userId'
    });
    return tandas;
  } catch (error) {
    console.error('Error obteniendo tandas:', error);
    return [];
  }
}

// ============================
// OBTENER TANDAS DISPONIBLES
// ============================
export async function getTandasDisponibles() {
  try {
    const tandas = await pb.collection('tandas').getFullList({
      filter: 'estado = "abierta"',
      sort: '-created'
    });

    const tandasConConteo = await Promise.all(
      tandas.map(async (tanda) => {
        const miembros = await getMiembrosTanda(tanda.id);
        return {
          ...tanda,
          miembrosActuales: miembros.length,
          disponibles: (tanda.cupoMaximo || tanda.totalMembers || 0) - miembros.length,
          miembros: miembros
        };
      })
    );

    return tandasConConteo;
  } catch (error) {
    console.error('Error obteniendo tandas disponibles:', error);
    return [];
  }
}

// ============================
// OBTENER TANDA POR ID
// ============================
export async function getTandaById(id) {
  try {
    return await pb.collection('tandas').getOne(id);
  } catch (error) {
    if (error.status === 404) return null;
    console.error('Error obteniendo tanda:', error);
    return null;
  }
}

// ============================
// OBTENER MIEMBROS DE TANDA
// ============================
export async function getMiembrosTanda(tandaId) {
  try {
    return await pb.collection('tanda_members').getFullList({
      filter: `tandaId = "${tandaId}"`,
      expand: 'userId',
      sort: 'posicion'
    });
  } catch (error) {
    console.error('Error obteniendo miembros:', error);
    return [];
  }
}

// ============================
// OBTENER MIEMBRO POR ID
// ============================
export async function getMiembroById(id) {
  try {
    return await pb.collection('tanda_members').getOne(id, { expand: 'userId,tandaId' });
  } catch (error) {
    if (error.status === 404) return null;
    console.error('Error obteniendo miembro:', error);
    return null;
  }
}

// ============================
// OBTENER TANDAS DE UN CLIENTE
// ============================
export async function getClientTandas(clientId) {
  try {
    const miembros = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${clientId}"`,
      expand: 'tandaId',
      sort: '-joinedAt'
    });

    const result = await Promise.all(miembros.map(async (m) => {
      const tanda = m.expand?.tandaId;

      // ✅ Calcular pagos realizados desde tanda_pagos
      let pagosRealizados = 0;
      try {
        const pagos = await pb.collection('tanda_pagos').getFullList({
          filter: `tandaMemberId = "${m.id}" && estado = "pagado"`
        });
        pagosRealizados = pagos.length;
      } catch (e) {
        console.log('Error obteniendo pagos:', e);
      }

      const totalRounds = tanda?.totalRounds || tanda?.cupoMaximo || 12;
      const pagoSemanal = tanda?.montoCuota || (tanda?.montoTotal / totalRounds) || 0;

      return {
        id: m.id,
        tandaId: m.tandaId,
        tandaNombre: tanda?.nombre || 'Tanda',
        posicion: m.posicion,
        gasFeePaid: m.gasFeePaid,
        estadoPago: m.estadoPago,
        fechaPagoTurno: m.fechaPagoTurno,
        joinedAt: m.joinedAt,
        montoTotal: tanda?.montoTotal || 0,
        monto: tanda?.montoCuota || tanda?.montoTotal || 0,
        frecuencia: tanda?.frecuencia || 'semanal',
        estado: tanda?.estado,
        semanasTotales: totalRounds,
        pagosRealizados: pagosRealizados,
        pagoSemanal: pagoSemanal,
        fechaInicio: tanda?.fechaInicio,
        proximoPago: m.fechaPagoTurno,
        entregaEstimada: null,
        // ✅ NUEVOS CAMPOS para pagos en dos partes
        pagoPrimeraParte: m.pagoPrimeraParte || false,
        pagoSegundaParte: m.pagoSegundaParte || false,
        fechaPagoPrimera: m.fechaPagoPrimera,
        fechaPagoSegunda: m.fechaPagoSegunda,
        pagoEnDosPartes: tanda?.pagoEnDosPartes || true
      };
    }));

    return result;
  } catch (error) {
    console.error('Error obteniendo tandas del cliente:', error);
    return [];
  }
}

// ============================
// OBTENER NIVEL DE TANDA PERMITIDO (PROGRESIVO)
// ============================
export async function getNivelTandaPermitido(userId) {
  try {
    // Obtener todas las tandas en las que ha participado
    const participaciones = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${userId}"`,
      expand: 'tandaId',
      sort: 'joinedAt'
    });

    // Encontrar el nivel máximo alcanzado
    let nivelMaximoParticipado = 0;
    for (const p of participaciones) {
      const nivelTanda = p.expand?.tandaId?.nivelRequerido || 0;
      if (nivelTanda > nivelMaximoParticipado) {
        nivelMaximoParticipado = nivelTanda;
      }
    }

    // El usuario puede unirse al siguiente nivel (actual + 1)
    const nivelPermitido = nivelMaximoParticipado + 1;

    return {
      nivelPermitido,
      haParticipado: participaciones.length > 0,
      nivelMaximoParticipado,
      puedeUnirseANivel: (nivel) => nivel <= nivelPermitido
    };
  } catch (error) {
    console.error('Error obteniendo nivel permitido:', error);
    return {
      nivelPermitido: 1,
      haParticipado: false,
      nivelMaximoParticipado: 0,
      puedeUnirseANivel: () => true
    };
  }
}

// ============================
// OBTENER PROGRESO DE TANDAS DEL CLIENTE
// ============================
export async function getProgresoTandasCliente(userId) {
  try {
    // Obtener todas las tandas del cliente
    const participaciones = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${userId}"`,
      expand: 'tandaId',
      sort: 'joinedAt'
    });

    // Agrupar por nivel
    const nivelesParticipados = new Map();
    for (const p of participaciones) {
      const nivel = p.expand?.tandaId?.nivelRequerido || 1;
      if (!nivelesParticipados.has(nivel)) {
        nivelesParticipados.set(nivel, []);
      }
      nivelesParticipados.get(nivel).push(p);
    }

    // Determinar siguiente nivel disponible
    const nivelesConfig = await pb.collection('config_niveles').getFullList({
      sort: 'nivel'
    });

    let siguienteNivel = 1;
    for (const nivel of nivelesConfig) {
      if (!nivelesParticipados.has(nivel.nivel)) {
        siguienteNivel = nivel.nivel;
        break;
      }
    }

    return {
      nivelesCompletados: Array.from(nivelesParticipados.keys()),
      siguienteNivel,
      totalTandasCompletadas: participaciones.filter(p => p.estadoPago === 'pagado').length,
      tandasEnCurso: participaciones.filter(p => p.estadoPago === 'al_corriente').length
    };
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    return {
      nivelesCompletados: [],
      siguienteNivel: 1,
      totalTandasCompletadas: 0,
      tandasEnCurso: 0
    };
  }
}


// ============================
// VERIFICAR SI PUEDE UNIRSE (CON VALIDACIÓN PROGRESIVA)
// ============================
export async function canJoinTanda(clientId, tandaId) {
  try {
    // ✅ 1. Verificar KYC
    const kyc = await getClientKYC(clientId);
    const kycAprobado = kyc?.estado === 'aprobado';

    if (!kycAprobado) {
      return { allowed: false, reason: 'KYC_NO_APROBADO' };
    }

    // ✅ 2. Verificar si ya es miembro de esta tanda
    const existing = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${clientId}" && tandaId = "${tandaId}"`
    });
    if (existing.length > 0) {
      return { allowed: false, reason: 'YA_ES_MIEMBRO' };
    }

    // ✅ 3. Obtener datos de la tanda
    const tanda = await getTandaById(tandaId);
    if (!tanda) return { allowed: false, reason: 'TANDA_NO_EXISTE' };

    // ✅ 4. VERIFICAR NIVEL PROGRESIVO (NUEVO)
    const { nivelPermitido, haParticipado } = await getNivelTandaPermitido(clientId);

    // Si nunca ha participado, solo puede unirse a nivel 1
    if (!haParticipado && tanda.nivelRequerido > 1) {
      return {
        allowed: false,
        reason: 'DEBES_COMENZAR_DESDE_NIVEL_BASICO',
        nivelRequerido: tanda.nivelRequerido,
        nivelPermitido: 1,
        mensajeUsuario: 'Debes comenzar desde el nivel básico de tandas'
      };
    }

    // Si ya participó, verificar que no salte niveles
    if (haParticipado && tanda.nivelRequerido > nivelPermitido) {
      return {
        allowed: false,
        reason: 'NIVEL_NO_DESBLOQUEADO',
        nivelRequerido: tanda.nivelRequerido,
        nivelPermitido,
        mensajeUsuario: `Completa primero las tandas de nivel ${nivelPermitido - 1}`
      };
    }

    // ✅ 5. Verificar nivel por productos (desde clients)
    const clientData = await getClientData(clientId);
    const nivelProductos = clientData?.nivel || 0;

    if (nivelProductos < tanda.nivelRequerido) {
      return {
        allowed: false,
        reason: 'NIVEL_PRODUCTOS_INSUFICIENTE',
        nivelProductos,
        nivelRequerido: tanda.nivelRequerido,
        mensajeUsuario: `Necesitas nivel ${tanda.nivelRequerido} de productos (tienes nivel ${nivelProductos})`
      };
    }

    // ✅ 6. Verificar cupo
    const miembros = await getMiembrosTanda(tandaId);
    const cupoMaximo = tanda.cupoMaximo || tanda.totalMembers || 0;
    if (miembros.length >= cupoMaximo) {
      return { allowed: false, reason: 'TANDA_LLENA', mensajeUsuario: 'No hay cupos disponibles' };
    }

    // ✅ 7. Verificar estado de la tanda
    if (tanda.estado !== 'abierta') {
      return { allowed: false, reason: 'TANDA_NO_DISPONIBLE', mensajeUsuario: 'Esta tanda no está disponible' };
    }

    return { allowed: true, tanda };
  } catch (error) {
    console.error('Error verificando:', error);
    return { allowed: false, reason: 'ERROR', mensajeUsuario: 'Error al verificar disponibilidad' };
  }
}

// ============================
// VERIFICAR SI PUEDE UNIRSE A TANDA (VERSIÓN PROGRESIVA)
// ============================
export async function canJoinTandaProgresivo(clientId, tandaId) {
  try {
    // ✅ 1. Verificar KYC
    const kyc = await getClientKYC(clientId);
    const kycAprobado = kyc?.estado === 'aprobado';

    if (!kycAprobado) {
      return {
        allowed: false,
        reason: 'KYC_NO_APROBADO',
        mensajeUsuario: 'Debes completar la verificación KYC para unirte a una tanda'
      };
    }

    // ✅ 2. Verificar si ya es miembro de esta tanda
    const existing = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${clientId}" && tandaId = "${tandaId}"`
    });
    if (existing.length > 0) {
      return {
        allowed: false,
        reason: 'YA_ES_MIEMBRO',
        mensajeUsuario: 'Ya eres miembro de esta tanda'
      };
    }

    // ✅ 3. Obtener datos de la tanda
    const tanda = await getTandaById(tandaId);
    if (!tanda) {
      return {
        allowed: false,
        reason: 'TANDA_NO_EXISTE',
        mensajeUsuario: 'La tanda no existe'
      };
    }

    // ✅ 4. VERIFICAR NIVEL PROGRESIVO
    const { nivelPermitido, haParticipado, nivelMaximoParticipado } = await getNivelTandaPermitido(clientId);

    // Si nunca ha participado, solo puede unirse a nivel 1
    if (!haParticipado && tanda.nivelRequerido > 1) {
      return {
        allowed: false,
        reason: 'DEBES_COMENZAR_DESDE_NIVEL_BASICO',
        nivelRequerido: tanda.nivelRequerido,
        nivelPermitido: 1,
        nivelActual: nivelMaximoParticipado,
        mensajeUsuario: `Debes comenzar desde el nivel básico de tandas. Esta tanda requiere nivel ${tanda.nivelRequerido}.`
      };
    }

    // Si ya participó, verificar que no salte niveles
    if (haParticipado && tanda.nivelRequerido > nivelPermitido) {
      return {
        allowed: false,
        reason: 'NIVEL_NO_DESBLOQUEADO',
        nivelRequerido: tanda.nivelRequerido,
        nivelPermitido,
        nivelActual: nivelMaximoParticipado,
        mensajeUsuario: `Completa primero las tandas de nivel ${nivelPermitido - 1} antes de unirte a esta.`
      };
    }

    // ✅ 5. Verificar nivel por productos (desde clients)
    const clientData = await getClientData(clientId);
    const nivelProductos = clientData?.nivel || 0;

    if (nivelProductos < tanda.nivelRequerido) {
      return {
        allowed: false,
        reason: 'NIVEL_PRODUCTOS_INSUFICIENTE',
        nivelProductos,
        nivelRequerido: tanda.nivelRequerido,
        mensajeUsuario: `Necesitas nivel ${tanda.nivelRequerido} de productos (tienes nivel ${nivelProductos})`
      };
    }

    // ✅ 6. Verificar cupo
    const miembros = await getMiembrosTanda(tandaId);
    const cupoMaximo = tanda.cupoMaximo || tanda.totalMembers || 0;
    if (miembros.length >= cupoMaximo) {
      return {
        allowed: false,
        reason: 'TANDA_LLENA',
        mensajeUsuario: 'No hay cupos disponibles en esta tanda'
      };
    }

    // ✅ 7. Verificar estado de la tanda
    if (tanda.estado !== 'abierta') {
      return {
        allowed: false,
        reason: 'TANDA_NO_DISPONIBLE',
        mensajeUsuario: 'Esta tanda no está disponible para unirse'
      };
    }

    // ✅ 8. Todo correcto
    return {
      allowed: true,
      tanda,
      nivelActual: nivelMaximoParticipado,
      siguienteNivel: nivelPermitido
    };

  } catch (error) {
    console.error('Error verificando:', error);
    return {
      allowed: false,
      reason: 'ERROR',
      mensajeUsuario: 'Error al verificar disponibilidad. Intenta de nuevo.'
    };
  }
}

// ============================
// UNIRSE A TANDA
// ============================
export async function joinTanda(clientId, tandaId) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const check = await canJoinTanda(clientId, tandaId);
    if (!check.allowed) throw new Error(`No puede unirse: ${check.reason}`);

    const miembros = await getMiembrosTanda(tandaId);
    const nuevaPosicion = miembros.length + 1;

    const nuevoMiembro = await pb.collection('tanda_members').create({
      userId: clientId,
      tandaId: tandaId,
      posicion: nuevaPosicion,
      gasFeePaid: false,
      estadoPago: 'al_corriente'
    });

    await pb.collection('tandas').update(tandaId, {
      miembrosActuales: miembros.length + 1
    });

    return nuevoMiembro;
  } catch (error) {
    console.error('Error uniendo a tanda:', error);
    throw error;
  }
}

// ============================
// PAGAR GASOLINA
// ============================
export async function pagarGasolina(memberId) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const miembro = await getMiembroById(memberId);
    if (!miembro) throw new Error('Miembro no encontrado');

    await pb.collection('tanda_pagos').create({
      tandaMemberId: memberId,
      semana: 0,
      monto: 25,
      fechaPago: new Date().toISOString(),
      estado: 'pagado'
    });

    const updated = await pb.collection('tanda_members').update(memberId, {
      gasFeePaid: true
    });

    return updated;
  } catch (error) {
    console.error('Error pagando gasolina:', error);
    throw error;
  }
}

// ============================
// OBTENER PAGOS DE TANDA
// ============================
export async function getTandaPayments(memberId) {
  try {
    return await pb.collection('tanda_pagos').getFullList({
      filter: `tandaMemberId = "${memberId}"`,
      sort: 'semana'
    });
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return [];
  }
}

// ============================
// REGISTRAR PAGO DE TANDA
// ============================
export async function registerTandaPayment(memberId, semana, monto, cobradorId) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const existing = await pb.collection('tanda_pagos').getFullList({
      filter: `tandaMemberId = "${memberId}" && semana = ${semana}`
    });

    if (existing.length > 0) {
      return await pb.collection('tanda_pagos').update(existing[0].id, {
        estado: 'pagado',
        monto: monto,
        fechaPago: new Date().toISOString(),
        cobradorId: cobradorId
      });
    } else {
      return await pb.collection('tanda_pagos').create({
        tandaMemberId: memberId,
        semana: semana,
        monto: monto,
        fechaPago: new Date().toISOString(),
        estado: 'pagado',
        cobradorId: cobradorId
      });
    }
  } catch (error) {
    console.error('Error registrando pago:', error);
    throw error;
  }
}

// ============================
// CREAR TANDA (ADMIN)
// ============================
export async function createTanda(data, adminId) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const tanda = await pb.collection('tandas').create({
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      montoTotal: parseFloat(data.montoTotal || data.monto || 0),
      montoCuota: parseFloat(data.montoCuota || 0),
      cupoMaximo: parseInt(data.cupoMaximo || data.totalMembers || 20),
      frecuencia: data.frecuencia || 'semanal',
      diaPago: data.diaPago || data.collectionDay || 'lunes',
      gasFee: 25,
      estado: 'abierta',
      nivelRequerido: data.nivelRequerido || 1,
      productosRequeridos: data.productosRequeridos || 1,
      userId: adminId,
      createdBy: adminId,
      fechaInicio: data.fechaInicio || new Date().toISOString()
    });

    await pb.collection('tanda_members').create({
      userId: adminId,
      tandaId: tanda.id,
      posicion: 1,
      gasFeePaid: true,
      estadoPago: 'pagado'
    });

    await pb.collection('tandas').update(tanda.id, {
      miembrosActuales: 1
    });

    return tanda;
  } catch (error) {
    console.error('Error creando tanda:', error);
    throw error;
  }
}

// ============================
// OBTENER POSICIONES DISPONIBLES
// ============================
export async function getAvailablePositions(tandaId) {
  try {
    const miembros = await getMiembrosTanda(tandaId);
    const tanda = await getTandaById(tandaId);
    const cupoMaximo = tanda?.cupoMaximo || tanda?.totalMembers || 0;
    const posicionesOcupadas = miembros.map(m => m.posicion);

    const disponibles = [];
    for (let i = 2; i <= cupoMaximo; i++) {
      if (!posicionesOcupadas.includes(i)) {
        disponibles.push(i);
      }
    }
    return disponibles;
  } catch (error) {
    console.error('Error obteniendo posiciones:', error);
    return [];
  }
}

// ============================
// SELECCIONAR POSICIÓN
// ============================
export async function selectPosition(memberId, selectedPosition) {
  try {
    if (!pb.authStore.isValid) throw new Error('Debes iniciar sesión');

    const miembro = await getMiembroById(memberId);
    if (!miembro) throw new Error('Miembro no encontrado');

    const disponibles = await getAvailablePositions(miembro.tandaId);
    if (!disponibles.includes(selectedPosition)) {
      throw new Error('Posición no disponible');
    }
    if (!miembro.gasFeePaid) {
      throw new Error('Debes pagar la gasolina primero');
    }

    return await pb.collection('tanda_members').update(memberId, {
      posicion: selectedPosition,
      estadoPago: 'al_corriente'
    });
  } catch (error) {
    console.error('Error seleccionando posición:', error);
    throw error;
  }
}

// ============================
// OBTENER MIEMBRO POR CLIENTE Y TANDA
// ============================
export async function getMemberByClientAndTanda(clientId, tandaId) {
  try {
    const miembros = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${clientId}" && tandaId = "${tandaId}"`,
      limit: 1
    });
    return miembros[0] || null;
  } catch (error) {
    console.error('Error obteniendo miembro:', error);
    return null;
  }
}

// ============================
// OBTENER PLAN DE PAGOS DEL CLIENTE
// ============================
export async function getPlanPagos(clienteId) {
  try {
    const ordenes = await pb.collection('orders').getFullList({
      filter: `userId = "${clienteId}" && estadoPago = "activa"`,
      expand: 'productId'
    });

    if (ordenes.length === 0) return null;

    const orden = ordenes[0];
    const plan = {
      totalPagar: orden.totalPagar,
      enganche: orden.enganche,
      enganchePagado: orden.enganchePagado || false,
      pagosSemanales: [],
      semanasTotales: orden.semanasTotales,
      pagosRealizados: orden.pagosRealizados || 0,
      pagoSemanal: orden.pagoSemanal,
      saldoRestante: orden.saldoRestante
    };

    return plan;
  } catch (error) {
    console.error('Error obteniendo plan de pagos:', error);
    return null;
  }
}

// ============================
// OBTENER DATOS COMPLETOS PARA TARJETA
// ============================
export async function getDatosTarjetaCompletos(userId) {
  try {
    const user = await pb.collection('users').getOne(userId);
    if (!user) throw new Error('Cliente no encontrado');

    const clientData = await getClientData(userId);
    const planPagos = await getPlanPagos(userId);

    const tandas = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${userId}" && estadoPago = "al_corriente"`,
      expand: 'tandaId'
    });

    const hoy = new Date().toISOString().split('T')[0];
    const pagosAtrasados = await pb.collection('payments').getFullList({
      filter: `userId = "${userId}" && (estado = "pendiente" || estado = "atrasado") && fechaVencimiento < "${hoy}"`
    });

    let estadoColor = 'green';
    if (pagosAtrasados.length > 0) {
      estadoColor = pagosAtrasados.length > 2 ? 'red' : 'yellow';
    }

    let fotoUrl = null;
    if (user.foto) {
      fotoUrl = pb.files.getURL(user, user.foto);
    }

    const direccionCompleta = clientData ? [
      clientData.direccionCalle,
      clientData.direccionNumero ? `#${clientData.direccionNumero}` : '',
      clientData.direccionColonia
    ].filter(Boolean).join(', ') : 'Sin dirección';

    return {
      userId: user.id,
      nombre: user.nombre || 'Cliente',
      telefono: user.telefono,
      foto: fotoUrl,
      direccion: direccionCompleta,
      tarjetaId: clientData?.tarjetaId,
      numeroTarjeta: clientData?.numeroTarjeta,
      nivel: clientData?.nivel || 0,
      estadoColor,
      planPagos,
      tandas: tandas.map(t => ({
        id: t.id,
        nombre: t.expand?.tandaId?.nombre || 'Tanda',
        posicion: t.posicion,
        monto: t.expand?.tandaId?.montoTotal || 0,
        estado: t.estadoPago
      })),
      pagosAtrasados: pagosAtrasados.length
    };
  } catch (error) {
    console.error('Error obteniendo datos de tarjeta:', error);
    return null;
  }
}

// ============================
// ACTUALIZAR TANDA (ADMIN)
// ============================
export async function updateTanda(tandaId, data) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const updateData = {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      montoTotal: parseFloat(data.montoTotal),
      cupoMaximo: parseInt(data.cupoMaximo),
      frecuencia: data.frecuencia,
      diaPago: data.diaPago,
      estado: data.estado
    };

    if (data.fechaInicio) {
      updateData.fechaInicio = data.fechaInicio;
    }

    const tanda = await pb.collection('tandas').update(tandaId, updateData);
    return tanda;
  } catch (error) {
    console.error('Error actualizando tanda:', error);
    throw error;
  }
}

// ============================
// ELIMINAR TANDA (ADMIN)
// ============================
export async function deleteTanda(tandaId) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const miembros = await getMiembrosTanda(tandaId);

    for (const miembro of miembros) {
      try {
        const pagos = await pb.collection('tanda_pagos').getFullList({
          filter: `tandaMemberId = "${miembro.id}"`
        });
        for (const pago of pagos) {
          await pb.collection('tanda_pagos').delete(pago.id);
        }
      } catch (e) {
        console.log(`No hay pagos para el miembro ${miembro.id}`);
      }

      await pb.collection('tanda_members').delete(miembro.id);
    }

    await pb.collection('tandas').delete(tandaId);
    return true;
  } catch (error) {
    console.error('Error eliminando tanda:', error);
    throw error;
  }
}

// ============================
// OBTENER TANDA CON DETALLES COMPLETOS (ADMIN)
// ============================
export async function getTandaWithDetails(tandaId) {
  try {
    const tanda = await getTandaById(tandaId);
    if (!tanda) return null;

    const miembros = await getMiembrosTanda(tandaId);

    const miembrosConPagos = await Promise.all(
      miembros.map(async (miembro) => {
        const pagos = await getTandaPayments(miembro.id);
        return {
          ...miembro,
          pagos
        };
      })
    );

    return {
      ...tanda,
      miembros: miembrosConPagos,
      miembrosActivos: miembros.length,
      disponibles: (tanda.cupoMaximo || 0) - miembros.length
    };
  } catch (error) {
    console.error('Error obteniendo tanda con detalles:', error);
    return null;
  }
}

// ============================
// CAMBIAR ESTADO DE TANDA
// ============================
export async function updateTandaStatus(tandaId, nuevoEstado) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const estadosValidos = ['abierta', 'en_curso', 'completada', 'cancelada'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado no válido');
    }

    const tanda = await pb.collection('tandas').update(tandaId, {
      estado: nuevoEstado
    });
    return tanda;
  } catch (error) {
    console.error('Error actualizando estado:', error);
    throw error;
  }
}

// ============================
// AGREGAR MIEMBRO MANUALMENTE (ADMIN)
// ============================
export async function addMemberToTanda(tandaId, userId, posicion) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const existing = await pb.collection('tanda_members').getFullList({
      filter: `userId = "${userId}" && tandaId = "${tandaId}"`
    });
    if (existing.length > 0) {
      throw new Error('El usuario ya es miembro de esta tanda');
    }

    const nuevoMiembro = await pb.collection('tanda_members').create({
      userId: userId,
      tandaId: tandaId,
      posicion: posicion,
      gasFeePaid: false,
      estadoPago: 'al_corriente'
    });

    const miembros = await getMiembrosTanda(tandaId);
    await pb.collection('tandas').update(tandaId, {
      miembrosActuales: miembros.length + 1
    });

    return nuevoMiembro;
  } catch (error) {
    console.error('Error agregando miembro:', error);
    throw error;
  }
}

// ============================
// ELIMINAR MIEMBRO DE TANDA (ADMIN)
// ============================
export async function removeMemberFromTanda(memberId) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const miembro = await getMiembroById(memberId);
    if (!miembro) throw new Error('Miembro no encontrado');

    const tandaId = miembro.tandaId;

    const pagos = await pb.collection('tanda_pagos').getFullList({
      filter: `tandaMemberId = "${memberId}"`
    });
    for (const pago of pagos) {
      await pb.collection('tanda_pagos').delete(pago.id);
    }

    await pb.collection('tanda_members').delete(memberId);

    const miembros = await getMiembrosTanda(tandaId);
    await pb.collection('tandas').update(tandaId, {
      miembrosActuales: miembros.length
    });

    return true;
  } catch (error) {
    console.error('Error eliminando miembro:', error);
    throw error;
  }
}

// ============================
// REGISTRAR PAGO DE CUOTA DE TANDA (ADMIN)
// ============================
export async function registerCuotaPayment(memberId, semana, monto, cobradorId = null) {
  try {
    if (!pb.authStore.isValid) throw new Error('No autorizado');

    const miembro = await getMiembroById(memberId);
    if (!miembro) throw new Error('Miembro no encontrado');

    const existingPayments = await pb.collection('tanda_pagos').getFullList({
      filter: `tandaMemberId = "${memberId}" && semana = ${semana}`
    });

    let payment;
    if (existingPayments.length > 0) {
      payment = await pb.collection('tanda_pagos').update(existingPayments[0].id, {
        estado: 'pagado',
        monto: monto,
        fechaPago: new Date().toISOString(),
        cobradorId: cobradorId || pb.authStore.model?.id
      });
    } else {
      payment = await pb.collection('tanda_pagos').create({
        tandaMemberId: memberId,
        semana: semana,
        monto: monto,
        fechaPago: new Date().toISOString(),
        estado: 'pagado',
        cobradorId: cobradorId || pb.authStore.model?.id
      });
    }

    await pb.collection('tanda_members').update(memberId, {
      estadoPago: 'al_corriente',
      fechaPagoTurno: new Date().toISOString()
    });

    return payment;
  } catch (error) {
    console.error('Error registrando pago de cuota:', error);
    throw error;
  }
}

// ============================
// OBTENER NIVEL DEL CLIENTE (DESDE clients)
// ============================
async function getNivelCliente(clienteId) {
  try {
    const clientData = await getClientData(clienteId);
    return clientData?.nivel || 0;
  } catch (error) {
    console.log('Cliente sin nivel asignado:', error);
    return 0;
  }
}

// ============================
// OBTENER TANDAS DISPONIBLES POR NIVEL DEL CLIENTE (NUEVA)
// ============================
export async function getTandasDisponiblesPorNivel(nivelCliente) {
  try {
    const tandas = await pb.collection('tandas').getFullList({
      filter: `nivelRequerido <= ${nivelCliente} && activa = true && estado = "abierta"`,
      sort: 'nivelRequerido, nombre'
    });

    // Agregar información de miembros a cada tanda
    const tandasConConteo = await Promise.all(
      tandas.map(async (tanda) => {
        const miembros = await getMiembrosTanda(tanda.id);
        return {
          ...tanda,
          miembrosActuales: miembros.length,
          cupoDisponible: (tanda.cupoMaximo || 0) - miembros.length
        };
      })
    );

    return tandasConConteo;
  } catch (error) {
    console.error('Error obteniendo tandas por nivel:', error);
    return [];
  }
}

// ============================
// OBTENER TANDA POR CÓDIGO DE INVITACIÓN (NUEVA)
// ============================
export async function getTandaPorCodigo(codigo) {
  try {
    const tanda = await pb.collection('tandas').getFirstListItem(
      `codigoInvitacion = "${codigo}" && activa = true && estado = "abierta"`
    );
    return tanda;
  } catch (error) {
    console.log('Código inválido o tanda no disponible:', error);
    return null;
  }
}

// ============================
// VERIFICAR SI CLIENTE PUEDE UNIRSE A TANDA POR CÓDIGO (NUEVA)
// ============================
export async function puedeUnirseATandaConCodigo(codigo, clienteId) {
  try {
    // 1. Verificar código
    const tanda = await getTandaPorCodigo(codigo);
    if (!tanda) {
      return { allowed: false, reason: 'Código inválido' };
    }

    // 2. Verificar nivel del cliente
    const nivelCliente = await getNivelCliente(clienteId);
    if (tanda.nivelRequerido > nivelCliente) {
      return {
        allowed: false,
        reason: 'Nivel insuficiente',
        nivelRequerido: tanda.nivelRequerido,
        nivelActual: nivelCliente
      };
    }

    // 3. Verificar cupo
    const miembros = await getMiembrosTanda(tanda.id);
    const cupoMaximo = tanda.cupoMaximo || 20;
    if (miembros.length >= cupoMaximo) {
      return { allowed: false, reason: 'Tanda completa' };
    }

    // 4. Verificar si ya está inscrito
    const yaInscrito = await pb.collection('tanda_members').getFirstListItem(
      `tandaId = "${tanda.id}" && userId = "${clienteId}"`
    ).catch(() => null);

    if (yaInscrito) {
      return { allowed: false, reason: 'Ya estás inscrito en esta tanda' };
    }

    return { allowed: true, tanda };
  } catch (error) {
    console.error('Error verificando acceso a tanda:', error);
    return { allowed: false, reason: 'Error al verificar' };
  }
}

// ============================
// UNIRSE A TANDA CON CÓDIGO DE INVITACIÓN (NUEVA)
// ============================
export async function unirseATandaConCodigo(codigo, clienteId) {
  try {
    // 1. Verificar todo
    const verificacion = await puedeUnirseATandaConCodigo(codigo, clienteId);
    if (!verificacion.allowed) {
      throw new Error(verificacion.reason);
    }

    const tanda = verificacion.tanda;

    // 2. Obtener miembros actuales
    const miembros = await getMiembrosTanda(tanda.id);
    const nuevaPosicion = miembros.length + 1;

    // 3. Crear miembro
    const member = await pb.collection('tanda_members').create({
      tandaId: tanda.id,
      userId: clienteId,
      posicion: nuevaPosicion,
      estadoPago: 'al_corriente',
      gasFeePaid: false,
      codigoUsado: codigo  // ✅ NUEVO CAMPO
    });

    // 4. Actualizar tanda
    await pb.collection('tandas').update(tanda.id, {
      miembrosActuales: nuevaPosicion,
      cupoDisponible: (tanda.cupoMaximo || 0) - nuevaPosicion
    });

    return { success: true, member, tanda };
  } catch (error) {
    console.error('Error uniéndose a tanda con código:', error);
    throw error;
  }
}

// ============================
// GENERAR CÓDIGO DE INVITACIÓN PARA TANDA (ADMIN)
// ============================
export async function generarCodigoInvitacionTanda(tandaId) {
  try {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 8; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    const tanda = await pb.collection('tandas').update(tandaId, {
      codigoInvitacion: codigo
    });

    return codigo;
  } catch (error) {
    console.error('Error generando código:', error);
    throw error;
  }
}

// ============================================================
// FUNCIONES PARA ADMIN (PAGINACIÓN Y ESTADÍSTICAS)
// ============================================================

/**
 * Obtener tandas con paginación, filtros y conteo de miembros
 */
export async function getTandasPaginated({ page = 1, perPage = 10, search = '', estado = 'todas', sort = '-created' } = {}) {
  try {
    let filter = '';
    if (estado !== 'todas') {
      filter = `estado = "${estado}"`;
    }
    if (search.trim()) {
      const term = search.trim();
      const searchFilter = `(nombre ~ "${term}" || descripcion ~ "${term}")`;
      filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
    }

    const result = await pb.collection('tandas').getList(page, perPage, {
      filter: filter || undefined,
      sort: sort,
      // No expandimos para no cargar datos innecesarios
    });

    // Obtener conteo de miembros por tanda (optimizado)
    const tandaIds = result.items.map(t => t.id);
    let membersCount = {};
    if (tandaIds.length > 0) {
      const filterMembers = tandaIds.map(id => `tandaId = "${id}"`).join(' || ');
      const members = await pb.collection('tanda_members').getFullList({
        filter: filterMembers,
        fields: 'tandaId'
      });
      membersCount = members.reduce((acc, m) => {
        acc[m.tandaId] = (acc[m.tandaId] || 0) + 1;
        return acc;
      }, {});
    }

    const items = result.items.map(tanda => ({
      ...tanda,
      miembrosActivos: membersCount[tanda.id] || 0,
      // Miembros solo se cargarán cuando se abra el modal de detalles
      miembros: []
    }));

    return {
      items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error('Error obteniendo tandas paginadas:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de tandas (totales, en curso, etc.)
 */
export async function getTandasStats() {
  try {
    const totalResult = await pb.collection('tandas').getList(1, 1, { fields: 'id' });
    
    const estados = ['abierta', 'en_curso', 'completada', 'cancelada'];
    const counts = {};
    for (const est of estados) {
      const result = await pb.collection('tandas').getList(1, 1, {
        filter: `estado = "${est}"`,
        fields: 'id'
      });
      counts[est] = result.totalItems;
    }

    // Total participantes (suma de miembros de todas las tandas)
    const members = await pb.collection('tanda_members').getFullList({
      fields: 'tandaId'
    });
    const totalParticipantes = members.length;

    // Total recaudado (suma de montoTotal de tandas abiertas/en_curso)
    const tandas = await pb.collection('tandas').getFullList({
      filter: 'estado = "abierta" || estado = "en_curso"',
      fields: 'montoTotal'
    });
    const totalRecaudado = tandas.reduce((sum, t) => sum + (t.montoTotal || 0), 0);

    return {
      total: totalResult.totalItems,
      enCurso: counts['en_curso'] || 0,
      abiertas: counts['abierta'] || 0,
      completadas: counts['completada'] || 0,
      canceladas: counts['cancelada'] || 0,
      totalParticipantes,
      totalRecaudado,
      promedio: totalResult.totalItems > 0 ? Math.round(totalRecaudado / totalResult.totalItems) : 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de tandas:', error);
    return {
      total: 0,
      enCurso: 0,
      abiertas: 0,
      completadas: 0,
      canceladas: 0,
      totalParticipantes: 0,
      totalRecaudado: 0,
      promedio: 0
    };
  }
}