// src/lib/tarjetaService.js
import pb from './pocketbase';
import { getEstadisticasCliente } from './nivelClienteService';

// ============================
// GENERAR CÓDIGO DE COLONIA/LOCALIDAD
// ============================
export function generarCodigoColonia(colonia) {
  if (!colonia || colonia.trim() === '') {
    return 'GEN';
  }

  const coloniaLimpia = colonia.trim().toUpperCase();
  const palabrasIgnorar = ['DE', 'LA', 'LAS', 'LOS', 'DEL', 'EL', 'Y', 'E'];
  const palabras = coloniaLimpia.split(/\s+/);
  const palabrasImportantes = palabras.filter(p => !palabrasIgnorar.includes(p));

  if (palabrasImportantes.length === 0) {
    return palabras[0].substring(0, 3);
  }

  if (palabrasImportantes.length === 1) {
    return palabrasImportantes[0].substring(0, 3);
  } else if (palabrasImportantes.length === 2) {
    return palabrasImportantes[0].charAt(0) + palabrasImportantes[1].charAt(0);
  } else {
    return palabrasImportantes[0].charAt(0) +
      palabrasImportantes[1].charAt(0) +
      palabrasImportantes[2].charAt(0);
  }
}

// ============================
// GENERAR ID CLIENTE MDZ-XXX-XXXX
// ============================
export function generarIdCliente(telefono, colonia) {
  const telefonoLimpio = String(telefono).replace(/[^0-9]/g, '');
  const ultimos4 = telefonoLimpio.slice(-4);
  const digitos = ultimos4.padStart(4, '0');
  const codigoColonia = generarCodigoColonia(colonia);
  return `MDZ-${codigoColonia}-${digitos}`;
}

// ============================
// GENERAR TOKEN SEGURO PARA QR
// ============================
export function generarToken() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 9; i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
}

// ============================
// OBTENER DATOS DEL CLIENTE DESDE 'clients'
// ============================
async function getClientData(userId) {
  try {
    return await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
  } catch (error) {
    console.log('No se encontró registro en clients para este usuario');
    return null;
  }
}

// ============================
// OBTENER O CREAR TARJETA PARA UN CLIENTE (CORREGIDO)
// ============================
export async function getOrCreateTarjeta(clienteId) {
  try {
    let clientData = await getClientData(clienteId);

    // ✅ Si no existe en clients, crearlo automáticamente
    if (!clientData) {
      console.log('Cliente sin registro en clients, creando...');
      const cliente = await pb.collection('users').getOne(clienteId);

      clientData = await pb.collection('clients').create({
        userId: clienteId,
        direccionCalle: '',
        direccionNumero: '',
        direccionInterior: '',
        direccionColonia: '',
        direccionMunicipio: '',
        direccionCiudad: '',
        direccionEstado: '',
        direccionCp: '',
        direccionReferencias: '',
        diaPago: 'lunes',
        telefonoAlternativo: '',
        nivel: 0,
        productosComprados: 0,
        productosPagados: 0,
        productosEnCurso: 0,
        deudaActual: 0,
        limiteDeuda: 5000,
        estadoKyc: 'pendiente',
        trustScore: 0,
        fechaPrimerProducto: null,
        fechaUltimoProducto: null,
        datosCompletos: false,
        totalGastado: 0,
        ultimaCompra: null
      });
      console.log('✅ Registro en clients creado:', clientData.id);
    }

    // Si ya tiene tarjetaId, retornar datos existentes
    if (clientData.tarjetaId) {
      return {
        id: clientData.id,
        userId: clienteId,
        token: clientData.tarjetaId,
        idCliente: clientData.tarjetaId,
        numeroTarjeta: clientData.numeroTarjeta || 1,
        estado: 'activo',
        created: clientData.created
      };
    }

    // Crear nueva tarjeta
    const cliente = await pb.collection('users').getOne(clienteId);
    const telefono = cliente.telefono || '00000000';
    const colonia = clientData.direccionColonia || '';
    const idCliente = generarIdCliente(telefono, colonia);

    await pb.collection('clients').update(clientData.id, {
      tarjetaId: idCliente,
      numeroTarjeta: (clientData.numeroTarjeta || 0) + 1,
      codigoColonia: colonia ? colonia.substring(0, 3).toUpperCase() : 'GEN'
    });

    console.log(`✅ Tarjeta registrada en clients: ${idCliente}`);

    return {
      id: clientData.id,
      userId: clienteId,
      token: idCliente,
      idCliente: idCliente,
      numeroTarjeta: (clientData.numeroTarjeta || 0) + 1,
      estado: 'activo',
      created: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error obteniendo/creando tarjeta:', error);
    throw error;
  }
}

// ============================
// OBTENER DATOS COMPLETOS DE LA TARJETA (VERSIÓN BASE)
// ============================
export async function getDatosTarjeta(token) {
  try {
    const clientRecord = await pb.collection('clients').getFirstListItem(`tarjetaId = "${token}"`);
    let cliente = await pb.collection('users').getOne(clientRecord.userId);  // ✅ let en lugar de const

    if (!cliente) throw new Error('Cliente no encontrado');

    // Refrescar datos del usuario
    try {
      const usuarioActualizado = await pb.collection('users').getOne(cliente.id);
      cliente = {  // ✅ Ahora se puede reasignar
        ...cliente,
        nombre: usuarioActualizado.nombre || cliente.nombre,
        telefono: usuarioActualizado.telefono || cliente.telefono,
        email: usuarioActualizado.email || cliente.email,
        foto: usuarioActualizado.foto || cliente.foto
      };
      console.log('✅ Datos actualizados del usuario:', cliente.nombre);
    } catch (refreshError) {
      console.warn('No se pudo refrescar datos del usuario:', refreshError);
    }

    // Dirección desde clients
    const direccionCompleta = [
      clientRecord.direccionCalle,
      clientRecord.direccionNumero ? `#${clientRecord.direccionNumero}` : '',
      clientRecord.direccionColonia,
      clientRecord.direccionMunicipio,
      clientRecord.direccionEstado
    ].filter(Boolean).join(', ') || 'Sin dirección registrada';

    // Pagos atrasados
    const hoy = new Date().toISOString().split('T')[0];
    const pagosAtrasados = await pb.collection('payments').getFullList({
      filter: `userId = "${cliente.id}" && (estado = "pendiente" || estado = "atrasado") && fechaVencimiento < "${hoy}"`
    });

    let estadoColor = 'green';
    if (pagosAtrasados.length > 0) {
      estadoColor = pagosAtrasados.length > 2 ? 'red' : 'yellow';
    }

    // Foto del cliente
    let fotoUrl = null;
    if (cliente.foto) {
      fotoUrl = pb.files.getURL(cliente, cliente.foto);
    }

    return {
      id: clientRecord.id,
      token: token,
      idCliente: clientRecord.tarjetaId,
      numeroTarjeta: clientRecord.numeroTarjeta,
      estado: 'activo',
      estadoColor,
      createdAt: clientRecord.created || new Date().toISOString(),
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre || 'Cliente',
        telefono: cliente.telefono,
        foto: fotoUrl,
        colonia: clientRecord.direccionColonia || '',
        calle: clientRecord.direccionCalle || '',
        numero: clientRecord.direccionNumero || '',
        municipio: clientRecord.direccionMunicipio || '',
        estado: clientRecord.direccionEstado || '',
        cp: clientRecord.direccionCp || '',
        direccion: direccionCompleta,
        email: cliente.email,
        diaPago: clientRecord.diaPago || 'lunes',
        telefonoAlternativo: clientRecord.telefonoAlternativo || ''
      },
      pagosAtrasados: pagosAtrasados.length
    };

  } catch (error) {
    console.error('Error obteniendo datos de tarjeta:', error);
    return null;
  }
}

// ============================
// OBTENER DATOS COMPLETOS DE TARJETA (CON NIVEL Y ESTADÍSTICAS)
// ============================
export async function getDatosTarjetaCompleta(token) {
  try {
    const datosBase = await getDatosTarjeta(token);
    if (!datosBase) return null;

    const estadisticasNivel = await getEstadisticasCliente(datosBase.cliente.id);
    const niveles = await pb.collection('config_niveles').getFullList({ sort: 'nivel' });

    const obtenerNombreNivel = (nivel) => {
      const nivelConfig = niveles.find(n => n.nivel === nivel);
      return nivelConfig?.nombre || 'Básico';
    };

    const nivelActual = estadisticasNivel?.nivelActual || 0;
    const productosPagados = estadisticasNivel?.productosPagados || 0;

    let siguienteNivel = null;
    let productosFaltantes = 0;
    let nombreSiguienteNivel = 'Máximo';

    const proxNivel = niveles.find(n => n.nivel > nivelActual);
    if (proxNivel) {
      siguienteNivel = proxNivel.nivel;
      nombreSiguienteNivel = proxNivel.nombre;
      productosFaltantes = Math.max(0, proxNivel.productosRequeridos - productosPagados);
    }

    const fechaTarjeta = datosBase.createdAt;
    const fechaCreacion = new Date(fechaTarjeta);
    const hoy = new Date();
    const mesesAntiguedad = (hoy.getFullYear() - fechaCreacion.getFullYear()) * 12 +
      (hoy.getMonth() - fechaCreacion.getMonth());

    // Obtener tandas activas del cliente
    let tandasActivas = [];
    try {
      const miembrosTanda = await pb.collection('tanda_members').getFullList({
        filter: `userId = "${datosBase.cliente.id}" && estadoPago = "al_corriente"`,
        expand: 'tandaId',
        sort: '-joinedAt'
      });
      tandasActivas = miembrosTanda.map(m => ({
        id: m.id,
        nombre: m.expand?.tandaId?.nombre || 'Tanda',
        posicion: m.posicion,
        monto: m.expand?.tandaId?.montoTotal || 0,
        pagosRealizados: 0,
        totalRounds: m.expand?.tandaId?.cupoMaximo || 20,
        estado: m.estadoPago
      }));
    } catch (e) {
      console.warn('Error obteniendo tandas:', e.message);
    }

    return {
      ...datosBase,
      // Nivel
      nivel: nivelActual,
      nivelNombre: obtenerNombreNivel(nivelActual),
      tandaDisponible: estadisticasNivel?.tandaDisponible || 0,
      productosPagados,
      productosComprados: estadisticasNivel?.productosComprados || 0,
      productosEnCurso: estadisticasNivel?.productosEnCurso || 0,
      deudaActual: estadisticasNivel?.deudaActual || 0,
      limiteDeuda: estadisticasNivel?.limiteDeuda || 5000,
      trustScore: estadisticasNivel?.trustScore || 0,
      totalGastado: estadisticasNivel?.totalGastado || 0,
      // Siguiente nivel
      siguienteNivel,
      nombreSiguienteNivel,
      productosFaltantes,
      // Fechas
      fechaTarjeta,
      antiguedadMeses: mesesAntiguedad,
      fechaFormateada: new Date(fechaTarjeta).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      fechaPrimerProducto: estadisticasNivel?.fechaPrimerProducto,
      fechaUltimoPago: estadisticasNivel?.fechaUltimoPago,
      // Tandas
      tandas: tandasActivas
    };

  } catch (error) {
    console.error('Error obteniendo datos completos de tarjeta:', error);
    return null;
  }
}

// ============================
// OBTENER TARJETA POR CLIENTE (desde clients)
// ============================
export async function getTarjetaByCliente(clienteId) {
  try {
    const clientData = await getClientData(clienteId);
    if (!clientData || !clientData.tarjetaId) return null;

    return {
      id: clientData.id,
      userId: clienteId,
      token: clientData.tarjetaId,
      idCliente: clientData.tarjetaId,
      numeroTarjeta: clientData.numeroTarjeta || 1,
      estado: 'activo',
      created: clientData.created
    };
  } catch (error) {
    console.error('Error obteniendo tarjeta por cliente:', error);
    return null;
  }
}

// ============================
// OBTENER TODAS LAS TARJETAS (ADMIN) - desde clients
// ============================
export async function getAllTarjetas() {
  try {
    const clients = await pb.collection('clients').getFullList({
      filter: 'tarjetaId != null && tarjetaId != ""',
      sort: '-created',
      expand: 'userId'
    });

    return clients.map(c => ({
      id: c.id,
      userId: c.userId,
      token: c.tarjetaId,
      idCliente: c.tarjetaId,
      numeroTarjeta: c.numeroTarjeta || 0,
      estado: 'activo',
      created: c.created,
      expand: c.expand
    }));
  } catch (error) {
    console.error('Error obteniendo tarjetas:', error);
    return [];
  }
}

// ============================
// MARCAR PAGO COMO REALIZADO
// ============================
export async function marcarPago(pagoId) {
  try {
    const pago = await pb.collection('payments').getOne(pagoId);

    await pb.collection('payments').update(pagoId, {
      estado: 'pagado',
      montoPagado: pago.montoProgramado || pago.monto || 0,
      fechaPago: new Date().toISOString()
    });

    if (pago.orderId) {
      const orden = await pb.collection('orders').getOne(pago.orderId);
      const nuevoSaldo = Math.max(0, (orden.saldoRestante || 0) - (pago.montoProgramado || 0));

      const updateData = {
        pagosRealizados: (orden.pagosRealizados || 0) + 1,
        saldoRestante: nuevoSaldo
      };

      if (nuevoSaldo <= 0) {
        updateData.estadoPago = 'completada';
        updateData.fechaCompletada = new Date().toISOString();
      } else if (orden.estadoPago === 'pendiente_pago') {
        updateData.estadoPago = 'activa';
      }

      await pb.collection('orders').update(pago.orderId, updateData);
    }

    return true;
  } catch (error) {
    console.error('Error marcando pago:', error);
    throw error;
  }
}

// ============================
// REPORTAR PÉRDIDA DE TARJETA
// ============================
export async function reportarPerdidaTarjeta(clientId) {
  try {
    const usuarioId = pb.authStore.isValid ? pb.authStore.model.id : null;

    if (!usuarioId) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('🔒 Reportando pérdida de tarjeta para cliente:', clientId);

    // 1. Verificar que el cliente existe
    let clientData;
    try {
      clientData = await pb.collection('clients').getOne(clientId);
    } catch (error) {
      throw new Error('El registro de cliente no existe');
    }

    // 2. Verificar propiedad
    if (clientData.userId !== usuarioId) {
      throw new Error('No tienes permiso para reportar esta tarjeta');
    }

    // 3. Verificar estado actual
    if (clientData.tarjetaEstado === 'perdida') {
      throw new Error('Esta tarjeta ya fue reportada como perdida');
    }

    if (clientData.tarjetaEstado === 'bloqueada') {
      throw new Error('Esta tarjeta está bloqueada. Contacta a soporte.');
    }

    // 4. Actualizar estado de la tarjeta
    const tarjetaActualizada = await pb.collection('clients').update(clientId, {
      tarjetaEstado: 'perdida'
    });

    console.log('✅ Tarjeta reportada como perdida:', tarjetaActualizada.id);

    // 5. Crear notificación (opcional)
    try {
      const notificacionesExisten = await pb.collection('notificaciones').getList(1, 1).catch(() => null);
      if (notificacionesExisten) {
        await pb.collection('notificaciones').create({
          usuarioId: usuarioId,
          tipo: 'sistema',
          titulo: 'Tarjeta reportada como perdida',
          mensaje: 'Tu tarjeta ha sido reportada como perdida. Puedes imprimir una nueva copia con el mismo código QR.',
          leida: false
        });
      }
    } catch (notifError) {
      console.warn('⚠️ No se pudo crear notificación:', notifError.message);
    }

    return tarjetaActualizada;

  } catch (error) {
    console.error('❌ Error al reportar pérdida de tarjeta:', error);
    throw error;
  }
}

// ============================
// FUNCIÓN ADICIONAL: REACTIVAR TARJETA (SOLO ADMIN)
// ============================
export async function reactivarTarjeta(clientId) {
  try {
    const usuarioActual = pb.authStore.isValid ? pb.authStore.model : null;

    if (!usuarioActual || usuarioActual.role !== 'admin') {
      throw new Error('Solo administradores pueden reactivar tarjetas');
    }

    const tarjetaActualizada = await pb.collection('clients').update(clientId, {
      tarjetaEstado: 'activa'
    });

    console.log('✅ Tarjeta reactivada:', tarjetaActualizada.id);
    return tarjetaActualizada;

  } catch (error) {
    console.error('❌ Error al reactivar tarjeta:', error);
    throw error;
  }
}
"// Updated $(date)" 
