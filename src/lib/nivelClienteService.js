// src/lib/nivelClienteService.js
import pb from './pocketbase';

// ============================================================
// CONFIGURACIÓN DE COLECCIONES
// ============================================================
const COLLECTIONS = {
  CLIENTS: 'clients',
  CONFIG_NIVELES: 'config_niveles',
  NOTIFICACIONES: 'notificaciones',
  ORDERS: 'orders',
  PAYMENTS: 'payments'
};

// ============================================================
// CACHÉ DE NIVELES (se carga una vez y se refresca cuando cambia)
// ============================================================
let NIVELES_CACHE = null;
let NIVELES_CACHE_TIMESTAMP = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene los niveles desde config_niveles (con caché)
 */
async function getNivelesConfig() {
  const ahora = Date.now();

  // Usar caché si está vigente
  if (NIVELES_CACHE && (ahora - NIVELES_CACHE_TIMESTAMP) < CACHE_DURATION) {
    return NIVELES_CACHE;
  }

  try {
    const niveles = await pb.collection(COLLECTIONS.CONFIG_NIVELES).getFullList({
      sort: 'nivel'
    });

    NIVELES_CACHE = niveles.map(n => ({
      nivel: n.nivel,
      nombre: n.nombre,
      productosRequeridos: n.productosRequeridos,
      limiteDeuda: n.limiteDeuda,
      tandaDisponible: n.tandaDisponible,
      maxProductosCurso: n.maxProductosCurso || 3,
      colorTarjeta: n.colorTarjeta,
      icono: n.icono
    }));

    NIVELES_CACHE_TIMESTAMP = ahora;
    return NIVELES_CACHE;
  } catch (error) {
    console.error('Error cargando niveles:', error);

    // Fallback a niveles hardcodeados si no hay conexión
    return [
      { nivel: 1, nombre: 'Básico', productosRequeridos: 1, limiteDeuda: 1000, tandaDisponible: 1000, maxProductosCurso: 3 },
      { nivel: 3, nombre: 'Bronce', productosRequeridos: 3, limiteDeuda: 3000, tandaDisponible: 3000, maxProductosCurso: 3 },
      { nivel: 5, nombre: 'Plata', productosRequeridos: 5, limiteDeuda: 5000, tandaDisponible: 5000, maxProductosCurso: 3 },
      { nivel: 10, nombre: 'Oro', productosRequeridos: 10, limiteDeuda: 10000, tandaDisponible: 10000, maxProductosCurso: 3 },
      { nivel: 20, nombre: 'Platino', productosRequeridos: 20, limiteDeuda: 20000, tandaDisponible: 20000, maxProductosCurso: 3 },
      { nivel: 30, nombre: 'Diamante', productosRequeridos: 30, limiteDeuda: 30000, tandaDisponible: 30000, maxProductosCurso: 3 },
      { nivel: 40, nombre: 'Zafiro', productosRequeridos: 40, limiteDeuda: 40000, tandaDisponible: 40000, maxProductosCurso: 3 },
      { nivel: 50, nombre: 'Rubí', productosRequeridos: 50, limiteDeuda: 50000, tandaDisponible: 50000, maxProductosCurso: 3 }
    ];
  }
}

/**
 * Invalida la caché de niveles (usar cuando se modifiquen)
 */
export function invalidateNivelesCache() {
  NIVELES_CACHE = null;
  NIVELES_CACHE_TIMESTAMP = 0;
}

// ============================================================
// OBTENER O CREAR CLIENTE
// ============================================================
export async function getOrCreateClient(clienteId) {
  try {
    const client = await pb.collection(COLLECTIONS.CLIENTS).getFirstListItem(
      `userId = "${clienteId}"`
    );
    return client;
  } catch (error) {
    if (error.status === 404) {
      // Crear nuevo cliente
      const newClient = await pb.collection(COLLECTIONS.CLIENTS).create({
        userId: clienteId,
        nivel: 0,
        productosComprados: 0,
        productosPagados: 0,
        productosEnCurso: 0,
        deudaActual: 0,
        limiteDeuda: 5000,
        trustScore: 0,
        estadoKyc: 'pendiente',
        datosCompletos: false,
        totalGastado: 0
      });
      return newClient;
    }
    throw error;
  }
}

// ============================================================
// CALCULAR NIVEL BASADO EN PRODUCTOS PAGADOS
// ============================================================
export async function calcularNivel(productosPagados) {
  const niveles = await getNivelesConfig();

  let nivelActual = 0;
  let nivelNombre = 'Sin nivel';
  let tandaDisponible = 0;
  let limiteDeuda = 5000;
  let maxProductosCurso = 3;

  for (const nivel of niveles) {
    if (productosPagados >= nivel.productosRequeridos) {
      nivelActual = nivel.nivel;
      nivelNombre = nivel.nombre;
      tandaDisponible = nivel.tandaDisponible;
      limiteDeuda = nivel.limiteDeuda;
      maxProductosCurso = nivel.maxProductosCurso;
    }
  }

  return { nivelActual, nivelNombre, tandaDisponible, limiteDeuda, maxProductosCurso };
}

// ============================================================
// CALCULAR PRODUCTOS FALTANTES PARA SIGUIENTE NIVEL
// ============================================================
export async function calcularProductosFaltantes(productosPagados, nivelActual) {
  const niveles = await getNivelesConfig();

  // Encontrar el siguiente nivel
  const siguienteNivel = niveles.find(n => n.nivel > nivelActual);
  if (!siguienteNivel) return 0;

  return Math.max(0, siguienteNivel.productosRequeridos - productosPagados);
}

// ============================================================
// ACTUALIZAR NIVEL DEL CLIENTE (DESPUÉS DE COMPRA/PAGO)
// ============================================================
export async function actualizarNivelCliente(clienteId) {
  try {
    const client = await getOrCreateClient(clienteId);

    // Calcular nuevo nivel
    const { nivelActual, nivelNombre, tandaDisponible, limiteDeuda, maxProductosCurso } =
      await calcularNivel(client.productosPagados);

    // Calcular productos faltantes
    const productosFaltantes = await calcularProductosFaltantes(client.productosPagados, nivelActual);

    // Verificar si hubo cambio de nivel
    const subioNivel = nivelActual > client.nivel;

    // Actualizar cliente
    const updated = await pb.collection(COLLECTIONS.CLIENTS).update(client.id, {
      nivel: nivelActual,
      limiteDeuda: limiteDeuda
    });

    // Si subió de nivel, crear notificación
    if (subioNivel && nivelActual > 0) {
      await crearNotificacionNivel(clienteId, nivelActual, nivelNombre, tandaDisponible);
    }

    return {
      ...updated,
      productosFaltantes,
      tandaDisponible,
      nivelNombre,
      subioNivel
    };
  } catch (error) {
    console.error('Error actualizando nivel:', error);
    throw error;
  }
}

// ============================================================
// REGISTRAR NUEVA COMPRA
// ============================================================
export async function registrarCompra(clienteId, montoProducto, esCredito = false) {
  try {
    const client = await getOrCreateClient(clienteId);
    const { limiteDeuda, maxProductosCurso } = await calcularNivel(client.productosPagados);

    // Verificar límite de deuda
    const nuevaDeuda = client.deudaActual + montoProducto;
    if (nuevaDeuda > limiteDeuda) {
      throw new Error(
        `No puedes exceder tu límite de deuda de $${limiteDeuda.toLocaleString()}. ` +
        `Deuda actual: $${client.deudaActual.toLocaleString()}`
      );
    }

    // Verificar límite de productos en curso
    if (client.productosEnCurso >= maxProductosCurso) {
      throw new Error(
        `Tienes ${maxProductosCurso} productos en curso. ` +
        `Debes terminar de pagar uno para comprar otro.`
      );
    }

    // Fecha del primer producto
    const fechaPrimerProducto = client.productosComprados === 0
      ? new Date().toISOString()
      : (client.fechaPrimerProducto || client.fechaPrimerCompra || new Date().toISOString());

    // Preparar datos de actualización
    const updateData = {
      productosComprados: client.productosComprados + 1,
      fechaUltimoProducto: new Date().toISOString(),
      fechaUltimaCompra: new Date().toISOString(),
      fechaPrimerProducto: fechaPrimerProducto,
      fechaPrimerCompra: fechaPrimerProducto
    };

    // Si es crédito, aumentar productos en curso y deuda
    if (esCredito) {
      updateData.productosEnCurso = client.productosEnCurso + 1;
      updateData.deudaActual = nuevaDeuda;
    }

    // Actualizar cliente
    const updated = await pb.collection(COLLECTIONS.CLIENTS).update(client.id, updateData);

    return updated;
  } catch (error) {
    console.error('Error registrando compra:', error);
    throw error;
  }
}

// ============================================================
// REGISTRAR PAGO COMPLETO DE UN PRODUCTO
// ============================================================
export async function registrarPagoProducto(clienteId, montoPagado) {
  try {
    const client = await getOrCreateClient(clienteId);

    // Actualizar cliente
    const updated = await pb.collection(COLLECTIONS.CLIENTS).update(client.id, {
      productosPagados: client.productosPagados + 1,
      productosEnCurso: Math.max(0, client.productosEnCurso - 1),
      deudaActual: Math.max(0, client.deudaActual - montoPagado),
      fechaUltimoPago: new Date().toISOString(),
      trustScore: Math.min(100, (client.trustScore || 0) + 2) // Aumentar confianza
    });

    // Recalcular nivel después del pago
    await actualizarNivelCliente(clienteId);

    return updated;
  } catch (error) {
    console.error('Error registrando pago:', error);
    throw error;
  }
}

// ============================================================
// VERIFICAR SI PUEDE UNIRSE A UNA TANDA
// ============================================================
export async function puedeUnirseATanda(clienteId, montoTanda) {
  try {
    const client = await getOrCreateClient(clienteId);
    const { nivelActual, tandaDisponible, nivelNombre } = await calcularNivel(client.productosPagados);

    return {
      puede: tandaDisponible >= montoTanda && client.estadoKyc === 'aprobado',
      nivelActual: nivelActual,
      nivelNombre: nivelNombre,
      tandaDisponible: tandaDisponible,
      productosPagados: client.productosPagados,
      estadoKyc: client.estadoKyc,
      requiereKyc: client.estadoKyc !== 'aprobado'
    };
  } catch (error) {
    console.error('Error verificando tanda:', error);
    return {
      puede: false,
      nivelActual: 0,
      nivelNombre: 'Básico',
      tandaDisponible: 0,
      productosPagados: 0,
      estadoKyc: 'pendiente',
      requiereKyc: true
    };
  }
}

// ============================================================
// CREAR NOTIFICACIÓN DE NIVEL
// ============================================================
async function crearNotificacionNivel(clienteId, nuevoNivel, nivelNombre, tandaDisponible) {
  try {
    await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
      usuarioId: clienteId,
      tipoUsuario: 'cliente',
      tipo: 'nivel_up',
      titulo: `🎉 ¡Subiste a Nivel ${nuevoNivel} - ${nivelNombre}!`,
      mensaje: `Felicidades. Ahora tienes un límite de tanda de $${tandaDisponible.toLocaleString()}.`,
      datos: {
        nivel: nuevoNivel,
        nombreNivel: nivelNombre,
        tandaDisponible: tandaDisponible
      },
      entidadTipo: 'nivel'
    });
  } catch (error) {
    console.error('Error creando notificación:', error);
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DEL CLIENTE
// ============================================================
export async function getEstadisticasCliente(clienteId) {
  try {
    const client = await getOrCreateClient(clienteId);
    const niveles = await getNivelesConfig();

    // Encontrar nivel actual y siguiente
    const nivelActualConfig = niveles.find(n => n.nivel === client.nivel) || niveles[0];
    const siguienteNivel = niveles.find(n => n.nivel > client.nivel);

    const productosFaltantes = siguienteNivel
      ? Math.max(0, siguienteNivel.productosRequeridos - client.productosPagados)
      : 0;

    // Calcular progreso
    const productosEnEsteNivel = client.productosPagados - (nivelActualConfig?.productosRequeridos || 0);
    const productosParaSiguiente = siguienteNivel
      ? siguienteNivel.productosRequeridos - (nivelActualConfig?.productosRequeridos || 0)
      : 1;

    const progreso = siguienteNivel
      ? Math.min(100, Math.round((productosEnEsteNivel / productosParaSiguiente) * 100))
      : 100;

    return {
      nivelActual: client.nivel,
      nivelNombre: nivelActualConfig?.nombre || 'Básico',
      nivelIcono: nivelActualConfig?.icono || '⭐',
      nivelColor: nivelActualConfig?.colorTarjeta || '#FFFFFF',
      productosComprados: client.productosComprados,
      productosPagados: client.productosPagados,
      productosEnCurso: client.productosEnCurso,
      productosFaltantes: productosFaltantes,
      deudaActual: client.deudaActual,
      limiteDeuda: client.limiteDeuda,
      tandaDisponible: nivelActualConfig?.tandaDisponible || 0,
      siguienteNivel: siguienteNivel?.nivel || null,
      nombreSiguienteNivel: siguienteNivel?.nombre || 'Máximo',
      iconoSiguienteNivel: siguienteNivel?.icono || '🏆',
      progreso: progreso,
      trustScore: client.trustScore || 0,
      estadoKyc: client.estadoKyc || 'pendiente',
      fechaPrimerProducto: client.fechaPrimerProducto || client.fechaPrimerCompra,
      fechaUltimoProducto: client.fechaUltimoProducto,
      fechaUltimoPago: client.fechaUltimoPago,
      totalGastado: client.totalGastado || 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      nivelActual: 0,
      nivelNombre: 'Básico',
      nivelIcono: '⭐',
      nivelColor: '#FFFFFF',
      productosComprados: 0,
      productosPagados: 0,
      productosEnCurso: 0,
      productosFaltantes: 3,
      deudaActual: 0,
      limiteDeuda: 5000,
      tandaDisponible: 0,
      siguienteNivel: 1,
      nombreSiguienteNivel: 'Bronce',
      iconoSiguienteNivel: '🥉',
      progreso: 0,
      trustScore: 0,
      estadoKyc: 'pendiente',
      fechaPrimerProducto: null,
      fechaUltimoProducto: null,
      fechaUltimoPago: null,
      totalGastado: 0
    };
  }
}

// ============================================================
// OBTENER PROGRESO AL SIGUIENTE NIVEL
// ============================================================
export async function getProgresoNivel(productosPagados) {
  const niveles = await getNivelesConfig();

  // Encontrar el nivel actual
  let nivelActual = 0;
  let nombreNivelActual = 'Sin nivel';
  let productosRequeridosActual = 0;

  for (const nivel of niveles) {
    if (productosPagados >= nivel.productosRequeridos) {
      nivelActual = nivel.nivel;
      nombreNivelActual = nivel.nombre;
      productosRequeridosActual = nivel.productosRequeridos;
    }
  }


  // Encontrar el siguiente nivel
  const siguienteNivel = niveles.find(n => n.nivel > nivelActual);
  if (!siguienteNivel) {
    // Ya es nivel máximo
    return {
      nivelActual,
      nombreNivelActual,
      productosPagados,
      productosRequeridosActual,
      productosRequeridosSiguiente: productosRequeridosActual,
      productosFaltantes: 0,
      progreso: 100,
      esMaximo: true
    };
  }

  const productosFaltantes = Math.max(0, siguienteNivel.productosRequeridos - productosPagados);
  const productosEnNivel = productosPagados - productosRequeridosActual;
  const productosNecesarios = siguienteNivel.productosRequeridos - productosRequeridosActual;
  const progreso = Math.min(100, Math.round((productosEnNivel / productosNecesarios) * 100));

  return {
    nivelActual,
    nombreNivelActual,
    productosPagados,
    productosRequeridosActual,
    productosRequeridosSiguiente: siguienteNivel.productosRequeridos,
    productosFaltantes,
    progreso,
    esMaximo: false,
    siguienteNivel: siguienteNivel.nivel,
    nombreSiguienteNivel: siguienteNivel.nombre,
    iconoSiguienteNivel: siguienteNivel.icono
  };
}

// ============================================================
// OBTENER NOMBRE DEL NIVEL
// ============================================================
export async function getNombreNivel(nivel) {
  const niveles = await getNivelesConfig();
  const nivelConfig = niveles.find(n => n.nivel === nivel);
  return nivelConfig?.nombre || 'Básico';
}

// ============================
// OBTENER NIVEL ACTUAL DEL CLIENTE (CORREGIDO - USA clients)
// ============================
export async function getNivelCliente(clienteId) {
  try {
    // ✅ Buscar en clients, no en niveles_cliente
    const clientRecord = await pb.collection('clients').getFirstListItem(
      `userId = "${clienteId}"`
    );
    return clientRecord.nivel || 1;
  } catch (error) {
    console.log('Cliente sin registro, nivel por defecto 1');
    return 1;
  }
}

// ============================================================
// OBTENER LISTA DE NIVELES (PARA UI)
// ============================================================
export async function getNivelesList() {
  return getNivelesConfig();
}

// ============================================================
// SINCRONIZAR CLIENTE (Actualizar desde orders/payments)
// ============================================================
export async function sincronizarCliente(clienteId) {
  try {
    // Obtener todas las órdenes del cliente
    const orders = await pb.collection(COLLECTIONS.ORDERS).getFullList({
      filter: `userId = "${clienteId}"`
    });

    // Calcular estadísticas reales
    const stats = {
      productosComprados: orders.length,
      productosPagados: orders.filter(o => o.estadoPago === 'completada').length,
      productosEnCurso: orders.filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago').length,
      deudaActual: orders
        .filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago')
        .reduce((sum, o) => sum + (o.saldoRestante || 0), 0),
      totalGastado: orders
        .filter(o => o.estadoPago === 'completada')
        .reduce((sum, o) => sum + (o.totalPagar || 0), 0)
    };

    // Actualizar cliente
    const client = await getOrCreateClient(clienteId);
    await pb.collection(COLLECTIONS.CLIENTS).update(client.id, stats);

    // Recalcular nivel
    await actualizarNivelCliente(clienteId);

    return stats;
  } catch (error) {
    console.error('Error sincronizando cliente:', error);
    throw error;
  }
}