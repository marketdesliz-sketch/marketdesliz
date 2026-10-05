// src/lib/vendedoresService.js
import pb from './pocketbase';

// ─── SOLICITUD DEL VENDEDOR ─────────────────────────────

/**
 * Obtiene la solicitud del usuario actual (si existe).
 * Filtra por `activo = true` y `pasoActual > 0` para excluir registros vacíos.
 */
export async function getMiSolicitud() {
  const user = pb.authStore.model;
  if (!user) return null;
  try {
    const solicitud = await pb.collection('vacantes').getFirstListItem(
      `userId = "${user.id}" && activo = true && pasoActual > 0`
    );
    return solicitud;
  } catch (error) {
    return null;
  }
}

/**
 * Crea o actualiza la solicitud del usuario.
 * - Si ya existe → update
 * - Si no → create
 * - Si por race condition otra llamada ya creó → reintenta update
 */
export async function guardarProgreso(data) {
  const user = pb.authStore.model;
  if (!user) throw new Error('No autenticado');

  const existente = await getMiSolicitud();

  if (existente) {
    return await pb.collection('vacantes').update(existente.id, data);
  }

  // Primera vez: crear registro base
  try {
    return await pb.collection('vacantes').create({
      userId: user.id,
      estado: 'en_progreso',
      pasoActual: 1,
      activo: true,
      ...data,
    });
  } catch (error) {
    // Race condition: otro llamado ya creó el registro → reintentar como update
    const reintento = await getMiSolicitud();
    if (reintento) {
      return await pb.collection('vacantes').update(reintento.id, data);
    }
    throw error;
  }
}

/**
 * Avanza al siguiente paso del wizard.
 */
export async function avanzarPaso(nuevoPaso, data = {}) {
  if (!Number.isInteger(nuevoPaso) || nuevoPaso < 1) {
    throw new Error('pasoActual debe ser un entero >= 1');
  }
  return await guardarProgreso({
    pasoActual: nuevoPaso,
    ...data,
  });
}

/**
 * Marca la solicitud como aprobada (admin).
 */
export async function aprobarSolicitud(id, notas = '') {
  return await pb.collection('vacantes').update(id, {
    estado: 'aprobado',
    aceptado: true,
    fechaAceptacion: new Date().toISOString(),
    notasAdmin: notas,
  });
}

/**
 * Marca la solicitud como rechazada (admin).
 */
export async function rechazarSolicitud(id, notas = '') {
  return await pb.collection('vacantes').update(id, {
    estado: 'rechazado',
    notasAdmin: notas,
  });
}

/**
 * Lista todas las solicitudes del wizard (admin).
 * Filtra por `activo = true` y `pasoActual > 0`.
 * Search por ciudad o teléfono (nombre ya no existe en la colección).
 */
export async function getAllSolicitudes({
  page = 1,
  perPage = 20,
  search = '',
  estado = '',
  sort = '-created',
} = {}) {
  const filters = ['activo = true', 'pasoActual > 0'];

  if (estado) filters.push(`estado = "${estado}"`);

  if (search) {
    const s = search.replace(/"/g, '\\"');
    filters.push(`(ciudad ~ "${s}" || telefono ~ "${s}")`);
  }

  const filter = filters.join(' && ');

  try {
    return await pb.collection('vacantes').getList(page, perPage, {
      filter,
      sort,
      expand: 'userId,evaluadorId',
    });
  } catch (error) {
    console.error('Error getAllSolicitudes:', error);
    return { items: [], totalItems: 0, totalPages: 0 };
  }
}