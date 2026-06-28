// src/lib/cobradoresService.js
import pb from './pocketbase';

const ITEMS_PER_PAGE = 10;

/**
 * Obtener cobradores con paginación, búsqueda y filtros
 * @param {Object} params
 * @param {number} params.page - Número de página (default: 1)
 * @param {number} params.perPage - Elementos por página (default: 10)
 * @param {string} params.search - Búsqueda por nombre, teléfono, zona o código
 * @param {string} params.status - 'todos' | 'activos' | 'inactivos'
 * @param {string} params.sort - Campo de ordenamiento (ej: '-created', 'nombre')
 * @returns {Promise<Object>} { items, totalItems, totalPages, page, perPage }
 */
export async function getCobradoresPaginated({
  page = 1,
  perPage = ITEMS_PER_PAGE,
  search = '',
  status = 'todos',
  sort = '-created'
} = {}) {
  try {
    let filter = '';

    // Filtro de estado
    if (status === 'activos') {
      filter = 'activo = true';
    } else if (status === 'inactivos') {
      filter = 'activo = false';
    }

    // Búsqueda: nombre, telefono, zona, codigo
    if (search.trim()) {
      const term = search.trim();
      const searchFilter = `(nombre ~ "${term}" || telefono ~ "${term}" || zona ~ "${term}" || codigo ~ "${term}")`;
      filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
    }

    const result = await pb.collection('cobradores').getList(page, perPage, {
      filter: filter || undefined,
      sort: sort,
      expand: 'userId', // para obtener nombre/telefono del usuario si es necesario
      fields: 'id,nombre,telefono,zona,vehiculo,activo,codigo,created,userId,expand.userId.nombre,expand.userId.telefono'
    });

    // Para cada cobrador, obtener conteo de cobros asignados/completados
    // Nota: podríamos optimizar con una consulta agregada o mantener la lógica
    const itemsWithCounts = await Promise.all(
      result.items.map(async (c) => {
        let cobrosAsignados = 0;
        let cobrosCompletados = 0;
        try {
          // Obtener cobros asignados al cobrador
          const cobros = await pb.collection('cobros').getFullList({
            filter: `cobradorId = "${c.id}"`,
            fields: 'estado'
          });
          cobrosAsignados = cobros.length;
          cobrosCompletados = cobros.filter(cb => cb.estado === 'completado').length;
        } catch (e) {
          // Si la colección no existe o hay error, se queda en 0
        }
        return {
          ...c,
          cobrosAsignados,
          cobrosCompletados,
          // Asegurar nombre y teléfono desde expand si no están en el registro
          nombre: c.nombre || c.expand?.userId?.nombre || 'Sin nombre',
          telefono: c.telefono || c.expand?.userId?.telefono || 'N/A'
        };
      })
    );

    return {
      items: itemsWithCounts,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error('Error obteniendo cobradores paginados:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas rápidas de cobradores (totales, activos, inactivos, cobros asignados)
 * @returns {Promise<Object>} { total, activos, inactivos, cobrosAsignados }
 */
export async function getCobradoresStats() {
  try {
    const totalResult = await pb.collection('cobradores').getList(1, 1, {
      fields: 'id'
    });

    const activosResult = await pb.collection('cobradores').getList(1, 1, {
      filter: 'activo = true',
      fields: 'id'
    });

    const inactivosResult = await pb.collection('cobradores').getList(1, 1, {
      filter: 'activo = false',
      fields: 'id'
    });

    // Sumar cobros asignados de todos los cobradores
    const todos = await pb.collection('cobradores').getFullList({
      fields: 'id'
    });
    let totalCobros = 0;
    for (const c of todos) {
      try {
        const cobros = await pb.collection('cobros').getFullList({
          filter: `cobradorId = "${c.id}"`,
          fields: 'id'
        });
        totalCobros += cobros.length;
      } catch (e) { /* ignore */ }
    }

    return {
      total: totalResult.totalItems,
      activos: activosResult.totalItems,
      inactivos: inactivosResult.totalItems,
      cobrosAsignados: totalCobros
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de cobradores:', error);
    return {
      total: 0,
      activos: 0,
      inactivos: 0,
      cobrosAsignados: 0
    };
  }
}