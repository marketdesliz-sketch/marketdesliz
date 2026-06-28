// src/lib/collectorService.js
import pb from './pocketbase';

// ============================================================
// CONFIGURACIÓN
// ============================================================
const COLLECTIONS = {
  COBROS: 'cobros',
  NOTIFICACIONES: 'notificaciones',
  USERS: 'users'
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Formatea una fecha ISO a objeto Date de PocketBase
 */
function formatScheduledDate(scheduledDate) {
  if (!scheduledDate) {
    return {
      fecha: new Date().toISOString(),
      hora: '12:00'
    };
  }

  if (scheduledDate.includes('T')) {
    const dateObj = new Date(scheduledDate);
    return {
      fecha: dateObj.toISOString(),
      hora: dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  }

  return {
    fecha: scheduledDate,
    hora: '12:00'
  };
}

/**
 * Crea notificación para admin cuando se genera una tarea
 */
async function notificarAdminTarea(tareaId, tipo, productoNombre, clienteNombre) {
  try {
    const admins = await pb.collection(COLLECTIONS.USERS).getFullList({
      filter: 'role = "admin"'
    });

    for (const admin of admins) {
      await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
        usuarioId: admin.id,
        tipoUsuario: 'admin',
        tipo: 'sistema',
        titulo: `📋 Nueva tarea: ${tipo}`,
        mensaje: `Cliente: ${clienteNombre} - Producto: ${productoNombre}`,
        entidadId: tareaId,
        entidadTipo: 'cobro',
        datos: {
          tipo,
          productoNombre,
          clienteNombre,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (err) {
    console.warn('No se pudo notificar al admin:', err.message);
  }
}

// ============================================================
// CREAR TAREAS (sin cambios)
// ============================================================

export async function createVisitTask(data) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    const { fecha, hora } = formatScheduledDate(data.scheduledDate);

    const task = await pb.collection(COLLECTIONS.COBROS).create({
      userId: data.clientId,
      productId: data.productId,
      tipo: 'visita',
      estado: 'pendiente',
      fecha: fecha,
      fechaProgramada: data.scheduledDate ? new Date(data.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: hora,
      horaEstimada: data.horaEstimada || hora,
      direccion: data.clientAddress,
      notas: data.notes || `Visita para mostrar producto: ${data.productName}`,
      detalles: `Cliente: ${data.clientName || 'Sin nombre'} - Tel: ${data.clientPhone || 'N/A'}`,
      metodoPago: data.paymentMethod || null,
      created: new Date().toISOString()
    });

    await notificarAdminTarea(task.id, 'visita', data.productName, data.clientName || 'Cliente');

    return task;
  } catch (error) {
    console.error('Error creando tarea de visita:', error);
    throw error;
  }
}

export async function createDeliveryTask(data) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    const { fecha, hora } = formatScheduledDate(data.scheduledDate);

    const task = await pb.collection(COLLECTIONS.COBROS).create({
      userId: data.clientId,
      productId: data.productId,
      tipo: 'entrega',
      estado: 'pendiente',
      fecha: fecha,
      fechaProgramada: data.scheduledDate ? new Date(data.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: hora,
      horaEstimada: data.horaEstimada || hora,
      direccion: data.clientAddress,
      notas: data.notes || `Entrega de producto: ${data.productName}`,
      detalles: `Cliente: ${data.clientName || 'Sin nombre'} - Tel: ${data.clientPhone || 'N/A'} - Pago: ${data.paymentMethod || 'QR'}`,
      metodoPago: data.paymentMethod || 'qr',
      created: new Date().toISOString()
    });

    await notificarAdminTarea(task.id, 'entrega', data.productName, data.clientName || 'Cliente');

    return task;
  } catch (error) {
    console.error('Error creando tarea de entrega:', error);
    throw error;
  }
}

export async function createCollectionTask(data) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    const { fecha, hora } = formatScheduledDate(data.scheduledDate);

    const task = await pb.collection(COLLECTIONS.COBROS).create({
      userId: data.clientId,
      orderId: data.orderId || null,
      paymentId: data.paymentId || null,
      cobradorId: data.cobradorId || null,
      tipo: 'cobro',
      estado: 'pendiente',
      fecha: fecha,
      fechaProgramada: data.scheduledDate ? new Date(data.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: hora,
      horaEstimada: data.horaEstimada || data.scheduledTime || hora,
      direccion: data.clientAddress || '',
      notas: data.notes || `Cobro de pago semanal - Monto: $${data.amount || 0}`,
      detalles: `Cliente: ${data.clientName || 'Sin nombre'} - Monto: $${data.amount || 0}`,
      montoCobrado: data.amount || 0,
      metodoPago: data.paymentMethod || 'qr',
      created: new Date().toISOString()
    });

    await notificarAdminTarea(task.id, 'cobro', `Monto: $${data.amount || 0}`, data.clientName || 'Cliente');

    return task;
  } catch (error) {
    console.error('Error creando tarea de cobro:', error);
    throw error;
  }
}

// ============================================================
// CONSULTAS CON PAGINACIÓN Y FILTROS (NUEVA FUNCIÓN PRINCIPAL)
// ============================================================

/**
 * Obtener tareas con paginación y filtros combinados (principal)
 * @param {Object} params
 * @param {number} params.page - Número de página (default: 1)
 * @param {number} params.perPage - Elementos por página (default: 10)
 * @param {string} params.search - Búsqueda en detalles, notas, etc.
 * @param {string} params.estado - pendiente, completada, cancelada, no_encontrado
 * @param {string} params.tipo - visita, entrega, cobro
 * @param {string} params.fechaInicio - Fecha inicio (YYYY-MM-DD)
 * @param {string} params.fechaFin - Fecha fin (YYYY-MM-DD)
 * @param {string} params.cobradorId - ID del cobrador asignado
 * @param {string} params.clienteId - ID del cliente
 * @param {string} params.sort - Campo de ordenamiento (ej: '-created')
 * @returns {Promise<Object>} { items, totalItems, totalPages, page, perPage }
 */
export async function getTasksPaginated({
  page = DEFAULT_PAGE,
  perPage = DEFAULT_PER_PAGE,
  search = '',
  estado = '',
  tipo = '',
  fechaInicio = '',
  fechaFin = '',
  cobradorId = '',
  clienteId = '',
  sort = '-created'
} = {}) {
  try {
    let filter = '';

    if (estado) {
      filter = `estado = "${estado}"`;
    }
    if (tipo) {
      filter = filter ? `${filter} && tipo = "${tipo}"` : `tipo = "${tipo}"`;
    }
    if (fechaInicio) {
      const start = new Date(fechaInicio);
      const end = fechaFin ? new Date(fechaFin) : start;
      end.setHours(23, 59, 59, 999);
      const dateFilter = `fechaProgramada >= "${start.toISOString().split('T')[0]}" && fechaProgramada <= "${end.toISOString().split('T')[0]}"`;
      filter = filter ? `${filter} && ${dateFilter}` : dateFilter;
    }
    if (cobradorId) {
      const cobFilter = `(asignadoA = "${cobradorId}" || cobradorId = "${cobradorId}")`;
      filter = filter ? `${filter} && ${cobFilter}` : cobFilter;
    }
    if (clienteId) {
      const cliFilter = `userId = "${clienteId}"`;
      filter = filter ? `${filter} && ${cliFilter}` : cliFilter;
    }
    if (search.trim()) {
      const term = search.trim();
      const searchFilter = `(detalles ~ "${term}" || notas ~ "${term}")`;
      filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
    }

    const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
      filter: filter || undefined,
      sort: sort,
      expand: 'userId,productId,orderId,paymentId,cobradorId'
    });

    return {
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error('Error obteniendo tareas paginadas:', error);
    throw error;
  }
}

// ============================================================
// CONSULTAS EXISTENTES (MANTENIDAS CON PAGINACIÓN OPCIONAL)
// ============================================================

/**
 * Obtener tareas por cliente (con paginación opcional)
 */
export async function getClientTasks(clientId, page = null, perPage = null) {
  try {
    const filter = `userId = "${clientId}"`;
    let tasks;
    if (page !== null && perPage !== null) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
        filter,
        expand: 'productId,orderId,paymentId,cobradorId',
        sort: '-created'
      });
      tasks = result.items;
    } else {
      tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
        filter,
        expand: 'productId,orderId,paymentId,cobradorId',
        sort: '-created'
      });
    }
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas del cliente:', error);
    return [];
  }
}

/**
 * Obtener tareas pendientes (con paginación opcional)
 */
export async function getPendingTasks(page = null, perPage = null) {
  try {
    const filter = 'estado = "pendiente"';
    let tasks;
    if (page !== null && perPage !== null) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
        filter,
        expand: 'userId,productId,cobradorId',
        sort: 'fechaProgramada,horaEstimada'
      });
      tasks = result.items;
    } else {
      tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
        filter,
        expand: 'userId,productId,cobradorId',
        sort: 'fechaProgramada,horaEstimada'
      });
    }
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas pendientes:', error);
    return [];
  }
}

/**
 * Obtener tarea por ID (sin cambios)
 */
export async function getTaskById(taskId) {
  try {
    const task = await pb.collection(COLLECTIONS.COBROS).getOne(taskId, {
      expand: 'userId,productId,orderId,paymentId,cobradorId'
    });
    return task;
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    return null;
  }
}

/**
 * Actualizar estado de tarea (sin cambios)
 */
export async function updateTaskStatus(taskId, estado, opciones = {}) {
  try {
    const updateData = {
      estado: estado
    };

    if (estado === 'completada') {
      updateData.fechaCompletado = opciones.fechaCompletado || new Date().toISOString();
    }

    if (opciones.notas) {
      updateData.notas = opciones.notas;
    }

    if (opciones.montoCobrado !== undefined) {
      updateData.montoCobrado = opciones.montoCobrado;
    }

    if (opciones.metodoPago) {
      updateData.metodoPago = opciones.metodoPago;
    }

    const updated = await pb.collection(COLLECTIONS.COBROS).update(taskId, updateData);

    if (estado === 'completada') {
      try {
        const task = await pb.collection(COLLECTIONS.COBROS).getOne(taskId);
        await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
          usuarioId: task.userId,
          tipoUsuario: 'cliente',
          tipo: 'sistema',
          titulo: '✅ Tarea completada',
          mensaje: `La tarea de ${task.tipo} ha sido completada.`,
          entidadId: taskId,
          entidadTipo: 'cobro'
        });
      } catch (err) {
        console.warn('No se pudo notificar al cliente:', err.message);
      }
    }

    return updated;
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    throw error;
  }
}

/**
 * Obtener tareas por fecha (con paginación opcional)
 */
export async function getTasksByDate(date, page = null, perPage = null) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const filter = `fechaProgramada >= "${startOfDay.toISOString().split('T')[0]}" && fechaProgramada <= "${endOfDay.toISOString().split('T')[0]}"`;
    let tasks;
    if (page !== null && perPage !== null) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
        filter,
        expand: 'userId,productId,cobradorId',
        sort: 'horaEstimada'
      });
      tasks = result.items;
    } else {
      tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
        filter,
        expand: 'userId,productId,cobradorId',
        sort: 'horaEstimada'
      });
    }
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas por fecha:', error);
    return [];
  }
}

/**
 * Obtener tareas por tipo (con paginación opcional)
 */
export async function getTasksByType(tipo, page = null, perPage = null) {
  try {
    const filter = `tipo = "${tipo}"`;
    let tasks;
    if (page !== null && perPage !== null) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
        filter,
        expand: 'userId,productId',
        sort: '-created'
      });
      tasks = result.items;
    } else {
      tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
        filter,
        expand: 'userId,productId',
        sort: '-created'
      });
    }
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas por tipo:', error);
    return [];
  }
}

/**
 * Obtener tareas por cobrador asignado (con paginación opcional)
 */
export async function getTasksByCollector(asignadoA, page = null, perPage = null) {
  try {
    const filter = `asignadoA = "${asignadoA}" || cobradorId = "${asignadoA}"`;
    let tasks;
    if (page !== null && perPage !== null) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
        filter,
        expand: 'userId,productId',
        sort: 'fechaProgramada,horaEstimada'
      });
      tasks = result.items;
    } else {
      tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
        filter,
        expand: 'userId,productId',
        sort: 'fechaProgramada,horaEstimada'
      });
    }
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas por cobrador:', error);
    return [];
  }
}

/**
 * Asignar tarea a cobrador (sin cambios)
 */
export async function assignTask(taskId, asignadoA) {
  try {
    const updated = await pb.collection(COLLECTIONS.COBROS).update(taskId, {
      asignadoA: asignadoA,
      cobradorId: asignadoA,
      fechaAsignacion: new Date().toISOString()
    });

    try {
      await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
        usuarioId: asignadoA,
        tipoUsuario: 'admin',
        tipo: 'sistema',
        titulo: '📋 Nueva tarea asignada',
        mensaje: 'Se te ha asignado una nueva tarea de cobro/visita.',
        entidadId: taskId,
        entidadTipo: 'cobro'
      });
    } catch (err) {
      console.warn('No se pudo notificar al cobrador:', err.message);
    }

    return updated;
  } catch (error) {
    console.error('Error asignando tarea:', error);
    throw error;
  }
}

/**
 * Obtener tareas de hoy (con paginación opcional)
 */
export async function getTodayTasks(page = null, perPage = null) {
  try {
    const today = new Date().toISOString().split('T')[0];
    return getTasksByDate(today, page, perPage);
  } catch (error) {
    console.error('Error obteniendo tareas de hoy:', error);
    return [];
  }
}

/**
 * Obtener tareas de la semana (con paginación opcional)
 */
export async function getWeekTasks(page = null, perPage = null) {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
    endOfWeek.setHours(23, 59, 59, 999);
    const filter = `fechaProgramada >= "${startOfWeek.toISOString().split('T')[0]}" && fechaProgramada <= "${endOfWeek.toISOString().split('T')[0]}"`;
    let tasks;
    if (page !== null && perPage !== null) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
        filter,
        expand: 'userId,productId,cobradorId',
        sort: 'fechaProgramada,horaEstimada'
      });
      tasks = result.items;
    } else {
      tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
        filter,
        expand: 'userId,productId,cobradorId',
        sort: 'fechaProgramada,horaEstimada'
      });
    }
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas de la semana:', error);
    return [];
  }
}

// ============================================================
// ESTADÍSTICAS OPTIMIZADAS
// ============================================================

export async function getTaskStats() {
  try {
    // Total de tareas
    const totalResult = await pb.collection(COLLECTIONS.COBROS).getList(1, 1, { fields: 'id' });

    // Conteo por estado usando getList con filtros
    const estados = ['pendiente', 'completada', 'cancelada', 'no_encontrado'];
    const counts = {};
    for (const est of estados) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(1, 1, {
        filter: `estado = "${est}"`,
        fields: 'id'
      });
      counts[est] = result.totalItems;
    }

    // Conteo por tipo
    const tipos = ['visita', 'entrega', 'cobro'];
    const tipoCounts = {};
    for (const tipo of tipos) {
      const result = await pb.collection(COLLECTIONS.COBROS).getList(1, 1, {
        filter: `tipo = "${tipo}"`,
        fields: 'id'
      });
      tipoCounts[tipo] = result.totalItems;
    }

    return {
      total: totalResult.totalItems,
      pendientes: counts.pendiente || 0,
      completadas: counts.completada || 0,
      canceladas: counts.cancelada || 0,
      noEncontrado: counts.no_encontrado || 0,
      porTipo: tipoCounts
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      total: 0,
      pendientes: 0,
      completadas: 0,
      canceladas: 0,
      noEncontrado: 0,
      porTipo: { visita: 0, entrega: 0, cobro: 0 }
    };
  }
}

// ============================================================
// RUTA DE HOY (con paginación opcional)
// ============================================================

/**
 * Obtener la ruta de hoy para un cobrador (con paginación opcional)
 * @param {string} collectorId - ID del cobrador (opcional)
 * @param {number} page - Número de página (default: 1)
 * @param {number} perPage - Elementos por página (default: 10)
 * @returns {Promise<Object>} { date, tasks, count }
 */
export async function getTodayRoute(collectorId = null, page = DEFAULT_PAGE, perPage = DEFAULT_PER_PAGE) {
  try {
    const today = new Date().toISOString().split('T')[0];

    let filter = `fechaProgramada = "${today}" && (estado = "pendiente" || estado = "asignado")`;
    if (collectorId) {
      filter += ` && (asignadoA = "${collectorId}" || cobradorId = "${collectorId}")`;
    }

    const result = await pb.collection(COLLECTIONS.COBROS).getList(page, perPage, {
      filter: filter,
      expand: 'userId,productId,orderId,paymentId',
      sort: 'horaEstimada'
    });

    return {
      date: today,
      tasks: result.items,
      count: result.totalItems
    };
  } catch (error) {
    console.error('Error obteniendo ruta de hoy:', error);
    return { date: new Date().toISOString().split('T')[0], tasks: [], count: 0 };
  }
}