// src/lib/frutasService.js
import pb from './pocketbase';

// ─── FRUTAS ──────────────────────────────────────────────

/**
 * Obtiene frutas con paginación, búsqueda y filtros
 */
export async function getFrutas({
  page = 1,
  perPage = 20,
  search = '',
  categoria = 'todos',
  municipioId = '',
  localidadId = '',
  soloDestacadas = false,
  soloTemporada = false,
  sort = 'orden, nombre',
} = {}) {
  const filters = ['activo = true'];

  if (search) {
    const s = search.replace(/"/g, '\\"');
    filters.push(`(nombre ~ "${s}" || descripcion ~ "${s}" || categoria ~ "${s}")`);
  }

  if (categoria && categoria !== 'todos') {
    filters.push(`categoria = "${categoria}"`);
  }

  if (municipioId) filters.push(`municipioId = "${municipioId}"`);
  if (localidadId) filters.push(`localidadId = "${localidadId}"`);
  if (soloDestacadas) filters.push('destacado = true');
  if (soloTemporada) filters.push('temporada = true');

  const filter = filters.join(' && ');

  try {
    const result = await pb.collection('frutas').getList(page, perPage, {
      filter,
      sort,
      expand: 'municipioId,localidadId,usuarioId',
    });

    return {
      items: result.items.map(mapFruta),
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
    };
  } catch (error) {
    console.error('Error en getFrutas:', error);
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      perPage,
    };
  }
}

/**
 * Obtiene una fruta por ID
 */
export async function getFrutaById(id) {
  try {
    const record = await pb.collection('frutas').getOne(id, {
      expand: 'municipioId,localidadId,usuarioId',
    });
    return mapFruta(record);
  } catch (error) {
    console.error('Error en getFrutaById:', error);
    return null;
  }
}

/**
 * Frutas de temporada destacadas
 */
export async function getFrutasTemporada(limit = 8) {
  try {
    const records = await pb.collection('frutas').getFullList({
      filter: 'activo = true && temporada = true',
      sort: '-created',
      limit,
    });
    return records.map(mapFruta);
  } catch (error) {
    console.error('Error en getFrutasTemporada:', error);
    return [];
  }
}

/**
 * Frutas de un usuario específico
 */
export async function getFrutasByUsuario(userId) {
  try {
    const records = await pb.collection('frutas').getFullList({
      filter: `usuarioId = "${userId}"`,
      sort: '-created',
    });
    return records.map(mapFruta);
  } catch (error) {
    console.error('Error en getFrutasByUsuario:', error);
    return [];
  }
}

/**
 * Frutas relacionadas (misma categoría, excluye actual)
 */
export async function getFrutasRelacionadas(categoria, frutaId, limit = 6) {
  if (!categoria) return [];
  try {
    const records = await pb.collection('frutas').getFullList({
      filter: `categoria = "${categoria}" && id != "${frutaId}" && activo = true`,
      sort: '-created',
      limit,
    });
    return records.map(mapFruta);
  } catch (error) {
    console.error('Error en getFrutasRelacionadas:', error);
    return [];
  }
}

/**
 * Registrar visita
 */
export async function registrarVisitaFruta(id) {
  try {
    const record = await pb.collection('frutas').getOne(id, { fields: 'id,visitas' });
    const nuevas = (record.visitas || 0) + 1;
    await pb.collection('frutas').update(id, { visitas: nuevas });
    return nuevas;
  } catch (error) {
    console.warn('No se pudo registrar visita:', error.message);
    return null;
  }
}

// ─── HELPERS ─────────────────────────────────────────────

function mapFruta(record) {
  const imagenes = [];
  if (record.imagen) imagenes.push(pb.files.getURL(record, record.imagen));
  if (record.imagenes) {
    const arr = Array.isArray(record.imagenes) ? record.imagenes : [record.imagenes];
    arr.forEach(img => {
      if (img) imagenes.push(pb.files.getURL(record, img));
    });
  }

  return {
    id: record.id,
    nombre: record.nombre || '',
    descripcion: record.descripcion || '',
    categoria: record.categoria || '',
    precio: record.precio || 0,
    precioAnterior: record.precioAnterior || 0,
    unidad: record.unidad || 'kg',
    stock: record.stock || 0,
    imagen: imagenes[0] || null,
    imagenes,
    activo: record.activo !== false,
    nuevo: record.nuevo === true,
    destacado: record.destacado === true,
    temporada: record.temporada === true,
    orden: record.orden || 0,
    visitas: record.visitas || 0,
    calificacion: record.calificacion || 0,
    totalComentarios: record.totalComentarios || 0,
    usuarioId: record.usuarioId || null,
    negocioId: record.negocioId || null,
    municipioId: record.municipioId || null,
    localidadId: record.localidadId || null,
    creado: record.created,
    actualizado: record.updated,
    expand: record.expand || {},
    municipioNombre: record.expand?.municipioId?.nombre || '',
    localidadNombre: record.expand?.localidadId?.nombre || '',
  };
}