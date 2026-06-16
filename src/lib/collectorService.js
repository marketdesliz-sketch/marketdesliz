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
// CREAR TAREA DE VISITA
// ============================================================
export async function createVisitTask(data) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    const { fecha, hora } = formatScheduledDate(data.scheduledDate);

    const task = await pb.collection(COLLECTIONS.COBROS).create({
      // Relaciones
      userId: data.clientId,
      productId: data.productId,
      
      // Tipo y estado
      tipo: 'visita',
      estado: 'pendiente',
      
      // Fechas y horarios
      fecha: fecha,
      fechaProgramada: data.scheduledDate ? new Date(data.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: hora,
      horaEstimada: data.horaEstimada || hora,
      
      // Ubicación y detalles
      direccion: data.clientAddress,
      notas: data.notes || `Visita para mostrar producto: ${data.productName}`,
      detalles: `Cliente: ${data.clientName || 'Sin nombre'} - Tel: ${data.clientPhone || 'N/A'}`,
      
      // Método de pago (si aplica)
      metodoPago: data.paymentMethod || null,
      
      // Metadata
      created: new Date().toISOString()
    });
    
    // Notificar al admin
    await notificarAdminTarea(task.id, 'visita', data.productName, data.clientName || 'Cliente');
    
    return task;
  } catch (error) {
    console.error('Error creando tarea de visita:', error);
    throw error;
  }
}

// ============================================================
// CREAR TAREA DE ENTREGA
// ============================================================
export async function createDeliveryTask(data) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    const { fecha, hora } = formatScheduledDate(data.scheduledDate);

    const task = await pb.collection(COLLECTIONS.COBROS).create({
      // Relaciones
      userId: data.clientId,
      productId: data.productId,
      
      // Tipo y estado
      tipo: 'entrega',
      estado: 'pendiente',
      
      // Fechas y horarios
      fecha: fecha,
      fechaProgramada: data.scheduledDate ? new Date(data.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: hora,
      horaEstimada: data.horaEstimada || hora,
      
      // Ubicación y detalles
      direccion: data.clientAddress,
      notas: data.notes || `Entrega de producto: ${data.productName}`,
      detalles: `Cliente: ${data.clientName || 'Sin nombre'} - Tel: ${data.clientPhone || 'N/A'} - Pago: ${data.paymentMethod || 'QR'}`,
      
      // Método de pago
      metodoPago: data.paymentMethod || 'qr',
      
      // Metadata
      created: new Date().toISOString()
    });
    
    // Notificar al admin
    await notificarAdminTarea(task.id, 'entrega', data.productName, data.clientName || 'Cliente');
    
    return task;
  } catch (error) {
    console.error('Error creando tarea de entrega:', error);
    throw error;
  }
}

// ============================================================
// CREAR TAREA DE COBRO
// ============================================================
export async function createCollectionTask(data) {
  try {
    if (!pb.authStore.isValid) {
      throw new Error('Debes iniciar sesión');
    }

    const { fecha, hora } = formatScheduledDate(data.scheduledDate);

    const task = await pb.collection(COLLECTIONS.COBROS).create({
      // Relaciones
      userId: data.clientId,
      orderId: data.orderId || null,
      paymentId: data.paymentId || null,
      cobradorId: data.cobradorId || null,
      
      // Tipo y estado
      tipo: 'cobro',
      estado: 'pendiente',
      
      // Fechas y horarios
      fecha: fecha,
      fechaProgramada: data.scheduledDate ? new Date(data.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: hora,
      horaEstimada: data.horaEstimada || data.scheduledTime || hora,
      
      // Ubicación y detalles
      direccion: data.clientAddress || '',
      notas: data.notes || `Cobro de pago semanal - Monto: $${data.amount || 0}`,
      detalles: `Cliente: ${data.clientName || 'Sin nombre'} - Monto: $${data.amount || 0}`,
      
      // Monto a cobrar
      montoCobrado: data.amount || 0,
      
      // Método de pago
      metodoPago: data.paymentMethod || 'qr',
      
      // Metadata
      created: new Date().toISOString()
    });
    
    // Notificar al admin
    await notificarAdminTarea(task.id, 'cobro', `Monto: $${data.amount || 0}`, data.clientName || 'Cliente');
    
    return task;
  } catch (error) {
    console.error('Error creando tarea de cobro:', error);
    throw error;
  }
}

// ============================================================
// OBTENER TAREAS POR CLIENTE
// ============================================================
export async function getClientTasks(clientId) {
  try {
    const tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
      filter: `userId = "${clientId}"`,
      expand: 'productId,orderId,paymentId,cobradorId',
      sort: '-created'
    });
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas del cliente:', error);
    return [];
  }
}

// ============================================================
// OBTENER TAREAS PENDIENTES (PARA ADMIN/COBRADOR)
// ============================================================
export async function getPendingTasks() {
  try {
    const tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
      filter: 'estado = "pendiente"',
      expand: 'userId,productId,cobradorId',
      sort: 'fechaProgramada,horaEstimada'
    });
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas pendientes:', error);
    return [];
  }
}

// ============================================================
// OBTENER TAREA POR ID
// ============================================================
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

// ============================================================
// ACTUALIZAR ESTADO DE TAREA
// ============================================================
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
    
    // Si se completó, notificar
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

// ============================================================
// OBTENER TAREAS POR FECHA
// ============================================================
export async function getTasksByDate(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
      filter: `fechaProgramada >= "${startOfDay.toISOString().split('T')[0]}" && fechaProgramada <= "${endOfDay.toISOString().split('T')[0]}"`,
      expand: 'userId,productId,cobradorId',
      sort: 'horaEstimada'
    });
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas por fecha:', error);
    return [];
  }
}

// ============================================================
// OBTENER TAREAS POR TIPO
// ============================================================
export async function getTasksByType(tipo) {
  try {
    const tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
      filter: `tipo = "${tipo}"`,
      expand: 'userId,productId',
      sort: '-created'
    });
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas por tipo:', error);
    return [];
  }
}

// ============================================================
// OBTENER TAREAS POR COBRADOR ASIGNADO
// ============================================================
export async function getTasksByCollector(asignadoA) {
  try {
    const tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
      filter: `asignadoA = "${asignadoA}" || cobradorId = "${asignadoA}"`,
      expand: 'userId,productId',
      sort: 'fechaProgramada,horaEstimada'
    });
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas por cobrador:', error);
    return [];
  }
}

// ============================================================
// ASIGNAR TAREA A COBRADOR
// ============================================================
export async function assignTask(taskId, asignadoA) {
  try {
    const updated = await pb.collection(COLLECTIONS.COBROS).update(taskId, {
      asignadoA: asignadoA,
      cobradorId: asignadoA,
      fechaAsignacion: new Date().toISOString()
    });
    
    // Notificar al cobrador asignado
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

// ============================================================
// OBTENER TAREAS DE HOY
// ============================================================
export async function getTodayTasks() {
  try {
    const today = new Date().toISOString().split('T')[0];
    return getTasksByDate(today);
  } catch (error) {
    console.error('Error obteniendo tareas de hoy:', error);
    return [];
  }
}

// ============================================================
// OBTENER TAREAS DE LA SEMANA
// ============================================================
export async function getWeekTasks() {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
    endOfWeek.setHours(23, 59, 59, 999);
    
    const tasks = await pb.collection(COLLECTIONS.COBROS).getFullList({
      filter: `fechaProgramada >= "${startOfWeek.toISOString().split('T')[0]}" && fechaProgramada <= "${endOfWeek.toISOString().split('T')[0]}"`,
      expand: 'userId,productId,cobradorId',
      sort: 'fechaProgramada,horaEstimada'
    });
    return tasks;
  } catch (error) {
    console.error('Error obteniendo tareas de la semana:', error);
    return [];
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DE TAREAS
// ============================================================
export async function getTaskStats() {
  try {
    const allTasks = await pb.collection(COLLECTIONS.COBROS).getFullList();
    
    const stats = {
      total: allTasks.length,
      pendientes: allTasks.filter(t => t.estado === 'pendiente').length,
      completadas: allTasks.filter(t => t.estado === 'completada').length,
      canceladas: allTasks.filter(t => t.estado === 'cancelada').length,
      noEncontrado: allTasks.filter(t => t.estado === 'no_encontrado').length,
      porTipo: {
        visita: allTasks.filter(t => t.tipo === 'visita').length,
        entrega: allTasks.filter(t => t.tipo === 'entrega').length,
        cobro: allTasks.filter(t => t.tipo === 'cobro').length
      }
    };
    
    return stats;
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

// src/lib/collectorService.js - Agregar al final del archivo

/**
 * Obtener la ruta de hoy para un cobrador (alias de getTodayTasks para compatibilidad)
 */
export async function getTodayRoute(collectorId = null) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let filter = `fechaProgramada = "${today}" && (estado = "pendiente" || estado = "asignado")`;
    if (collectorId) {
      filter += ` && (asignadoA = "${collectorId}" || cobradorId = "${collectorId}")`;
    }
    
    const tasks = await pb.collection('cobros').getFullList({
      filter: filter,
      expand: 'userId,productId,orderId,paymentId',
      sort: 'horaEstimada'
    });
    
    return {
      date: today,
      tasks: tasks,
      count: tasks.length
    };
  } catch (error) {
    console.error('Error obteniendo ruta de hoy:', error);
    return { date: new Date().toISOString().split('T')[0], tasks: [], count: 0 };
  }
}