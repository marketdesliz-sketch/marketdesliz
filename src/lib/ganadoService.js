// src/lib/ganadoService.js
import pb from './pocketbase';

// ─── GANADO ──────────────────────────────────────────────

/**
 * Obtiene ganado con paginación, búsqueda y filtros
 */
export async function getGanado({
  page = 1,
  perPage = 20,
  search = '',
  categoria = 'todos',
  sexo = '',
  municipioId = '',
  localidadId = '',
  soloDestacados = false,
  soloNuevos = false,
  sort = 'orden, nombre',
} = {}) {
  const filters = ['activo = true'];

  if (search) {
    const s = search.replace(/"/g, '\\"');
    filters.push(`(nombre ~ "${s}" || descripcion ~ "${s}" || categoria ~ "${s}" || raza ~ "${s}")`);
  }

  if (categoria && categoria !== 'todos') {
    filters.push(`categoria = "${categoria}"`);
  }

  if (sexo) filters.push(`sexo = "${sexo}"`);
  if (municipioId) filters.push(`municipioId = "${municipioId}"`);
  if (localidadId) filters.push(`localidadId = "${localidadId}"`);
  if (soloDestacados) filters.push('destacado = true');
  if (soloNuevos) filters.push('nuevo = true');

  const filter = filters.join(' && ');

  try {
    const result = await pb.collection('ganado').getList(page, perPage, {
      filter,
      sort,
      expand: 'municipioId,localidadId,usuarioId',
    });

    return {
      items: result.items.map(mapGanado),
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
    };
  } catch (error) {
    console.error('Error en getGanado:', error);
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
 * Obtiene un registro de ganado por ID
 */
export async function getGanadoById(id) {
  try {
    const record = await pb.collection('ganado').getOne(id, {
      expand: 'municipioId,localidadId,usuarioId',
    });
    return mapGanado(record);
  } catch (error) {
    console.error('Error en getGanadoById:', error);
    return null;
  }
}

/**
 * Ganado destacado
 */
export async function getGanadoDestacado(limit = 8) {
  try {
    const records = await pb.collection('ganado').getFullList({
      filter: 'activo = true && destacado = true',
      sort: '-created',
      limit,
    });
    return records.map(mapGanado);
  } catch (error) {
    console.error('Error en getGanadoDestacado:', error);
    return [];
  }
}

/**
 * Ganado de un usuario específico
 */
export async function getGanadoByUsuario(userId) {
  try {
    const records = await pb.collection('ganado').getFullList({
      filter: `usuarioId = "${userId}"`,
      sort: '-created',
    });
    return records.map(mapGanado);
  } catch (error) {
    console.error('Error en getGanadoByUsuario:', error);
    return [];
  }
}

/**
 * Ganado relacionado (misma categoría, excluye actual)
 */
export async function getGanadoRelacionado(categoria, ganadoId, limit = 6) {
  if (!categoria) return [];
  try {
    const records = await pb.collection('ganado').getFullList({
      filter: `categoria = "${categoria}" && id != "${ganadoId}" && activo = true`,
      sort: '-created',
      limit,
    });
    return records.map(mapGanado);
  } catch (error) {
    console.error('Error en getGanadoRelacionado:', error);
    return [];
  }
}

/**
 * Registrar visita
 */
export async function registrarVisitaGanado(id) {
  try {
    const record = await pb.collection('ganado').getOne(id, { fields: 'id,visitas' });
    const nuevas = (record.visitas || 0) + 1;
    await pb.collection('ganado').update(id, { visitas: nuevas });
    return nuevas;
  } catch (error) {
    console.warn('No se pudo registrar visita:', error.message);
    return null;
  }
}

// ─── HELPERS ─────────────────────────────────────────────

function mapGanado(record) {
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
    raza: record.raza || '',
    sexo: record.sexo || '',
    edadMeses: record.edadMeses || 0,
    pesoKg: record.pesoKg || 0,
    precio: record.precio || 0,
    precioAnterior: record.precioAnterior || 0,
    unidad: record.unidad || 'cabeza',
    cantidad: record.cantidad || 0,
    vacunado: record.vacunado === true,
    certificado: record.certificado === true,
    imagen: imagenes[0] || null,
    imagenes,
    municipioId: record.municipioId || null,
    localidadId: record.localidadId || null,
    telefono: record.telefono || '',
    whatsapp: record.whatsapp || '',
    email: record.email || '',
    activo: record.activo !== false,
    nuevo: record.nuevo === true,
    destacado: record.destacado === true,
    orden: record.orden || 0,
    visitas: record.visitas || 0,
    calificacion: record.calificacion || 0,
    totalComentarios: record.totalComentarios || 0,
    usuarioId: record.usuarioId || null,
    creado: record.created,
    actualizado: record.updated,
    expand: record.expand || {},
    municipioNombre: record.expand?.municipioId?.nombre || '',
    localidadNombre: record.expand?.localidadId?.nombre || '',
  };
}

// ─── HELPERS DE PRESENTACIÓN ────────────────────────────

/**
 * Formatea la edad en meses a un texto legible
 */
export function formatEdad(meses) {
  if (!meses || meses <= 0) return 'No especificada';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const años = Math.floor(meses / 12);
  const resto = meses % 12;
  if (resto === 0) return `${años} ${años === 1 ? 'año' : 'años'}`;
  return `${años}a ${resto}m`;
}

/**
 * Devuelve el label del sexo con icono
 */
export function getSexoLabel(sexo) {
  const map = {
    'Macho': 'Macho',
    'Hembra': 'Hembra',
    'Mixto': 'Mixto',
  };
  return map[sexo] || sexo || 'No especificado';
}