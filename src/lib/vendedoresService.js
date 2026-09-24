// src/lib/vendedoresService.js
import pb from './pocketbase';

// ─── SOLICITUD DEL VENDEDOR ─────────────────────────────

/**
 * Obtiene la solicitud del usuario actual (si existe)
 */
export async function getMiSolicitud() {
  const user = pb.authStore.model;
  if (!user) return null;
  try {
    const solicitud = await pb.collection('solicitudes_vendedor').getFirstListItem(
      `userId = "${user.id}" && activo = true`
    );
    return solicitud;
  } catch (error) {
    return null;
  }
}

/**
 * Crea o actualiza la solicitud del usuario con los datos dados
 */
export async function guardarProgreso(data) {
  const user = pb.authStore.model;
  if (!user) throw new Error('No autenticado');

  const existente = await getMiSolicitud();

  if (existente) {
    return await pb.collection('solicitudes_vendedor').update(existente.id, data);
  } else {
    return await pb.collection('solicitudes_vendedor').create({
      userId: user.id,
      estado: 'en_progreso',
      pasoActual: 1,
      activo: true,
      ...data,
    });
  }
}

/**
 * Avanza al siguiente paso
 */
export async function avanzarPaso(nuevoPaso, data = {}) {
  return await guardarProgreso({
    pasoActual: nuevoPaso,
    ...data,
  });
}

/**
 * Marca la solicitud como aprobada (admin)
 */
export async function aprobarSolicitud(id, notas = '') {
  return await pb.collection('solicitudes_vendedor').update(id, {
    estado: 'aprobado',
    aceptado: true,
    fechaAceptacion: new Date().toISOString(),
    notasAdmin: notas,
  });
}

/**
 * Marca la solicitud como rechazada (admin)
 */
export async function rechazarSolicitud(id, notas = '') {
  return await pb.collection('solicitudes_vendedor').update(id, {
    estado: 'rechazado',
    notasAdmin: notas,
  });
}

/**
 * Lista todas las solicitudes (admin)
 */
export async function getAllSolicitudes({
  page = 1,
  perPage = 20,
  search = '',
  estado = '',
  sort = '-created',
} = {}) {
  const filters = ['activo = true'];
  if (estado) filters.push(`estado = "${estado}"`);
  if (search) {
    const s = search.replace(/"/g, '\\"');
    filters.push(`(nombreCompleto ~ "${s}" || ciudad ~ "${s}")`);
  }
  const filter = filters.join(' && ');
  try {
    return await pb.collection('solicitudes_vendedor').getList(page, perPage, {
      filter,
      sort,
      expand: 'userId,evaluadorId',
    });
  } catch (error) {
    console.error('Error getSolicitudes:', error);
    return { items: [], totalItems: 0, totalPages: 0 };
  }
}