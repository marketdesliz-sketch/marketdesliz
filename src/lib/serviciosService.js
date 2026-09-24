// src/lib/serviciosService.js
import pb from './pocketbase';

// ─── SERVICIOS ────────────────────────────────────────────

/**
 * Obtiene servicios con paginación, búsqueda y filtros
 */
export async function getServicios({
  page = 1,
  perPage = 20,
  search = '',
  categoria = 'todos',
  municipioId = '',
  localidadId = '',
  sort = 'orden, nombre',
  soloMarketDesliz = null, // null=todos, true=soloMD, false=excluirMD
  destacados = false,
} = {}) {
  const filters = ['activo = true'];

  if (search) {
    const s = search.replace(/"/g, '\\"');
    filters.push(`(nombre ~ "${s}" || descripcion ~ "${s}" || categoria ~ "${s}" || direccion ~ "${s}")`);
  }

  if (categoria && categoria !== 'todos') {
    filters.push(`categoria = "${categoria}"`);
  }

  if (municipioId) filters.push(`municipioId = "${municipioId}"`);
  if (localidadId) filters.push(`localidadId = "${localidadId}"`);

  if (soloMarketDesliz === true) filters.push('esMarketDesliz = true');
  if (soloMarketDesliz === false) filters.push('esMarketDesliz = false');
  if (destacados) filters.push('destacado = true');

  const filter = filters.join(' && ');

  try {
    const result = await pb.collection('servicios').getList(page, perPage, {
      filter,
      sort,
      expand: 'municipioId,localidadId,sectorId,usuarioId',
    });

    return {
      items: result.items.map(mapServicio),
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
    };
  } catch (error) {
    console.error('Error en getServicios:', error);
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
 * Obtiene un servicio por ID
 */
export async function getServicioById(id) {
  try {
    const record = await pb.collection('servicios').getOne(id, {
      expand: 'municipioId,localidadId,sectorId,usuarioId',
    });
    return mapServicio(record);
  } catch (error) {
    console.error('Error en getServicioById:', error);
    return null;
  }
}

/**
 * Servicios propios de MarketDesliz (moto, mandados, invitaciones...)
 */
export async function getServiciosMarketDesliz() {
  try {
    const records = await pb.collection('servicios').getFullList({
      filter: 'activo = true && esMarketDesliz = true',
      sort: 'orden, nombre',
    });
    return records.map(mapServicio);
  } catch (error) {
    console.error('Error en getServiciosMarketDesliz:', error);
    return [];
  }
}

/**
 * Servicios de un usuario específico
 */
export async function getServiciosByUsuario(userId) {
  try {
    const records = await pb.collection('servicios').getFullList({
      filter: `usuarioId = "${userId}"`,
      sort: '-created',
    });
    return records.map(mapServicio);
  } catch (error) {
    console.error('Error en getServiciosByUsuario:', error);
    return [];
  }
}

/**
 * Registrar visita a un servicio
 */
export async function registrarVisita(id) {
  try {
    const record = await pb.collection('servicios').getOne(id, {
      fields: 'id,visitas',
    });
    const nuevasVisitas = (record.visitas || 0) + 1;
    await pb.collection('servicios').update(id, { visitas: nuevasVisitas });
    return nuevasVisitas;
  } catch (error) {
    // Silencioso: no bloquea la vista si falla
    console.warn('No se pudo registrar visita:', error.message);
    return null;
  }
}

/**
 * Servicios relacionados (misma categoría, excluye el actual)
 */
export async function getServiciosRelacionados(categoria, servicioId, limit = 6) {
  if (!categoria) return [];
  try {
    const records = await pb.collection('servicios').getFullList({
      filter: `categoria = "${categoria}" && id != "${servicioId}" && activo = true && esMarketDesliz = false`,
      sort: '-created',
      limit,
    });
    return records.map(mapServicio);
  } catch (error) {
    console.error('Error en getServiciosRelacionados:', error);
    return [];
  }
}

// ─── GEOGRAFÍA ────────────────────────────────────────────

export async function getEstados() {
  try {
    return await pb.collection('estados').getFullList({
      sort: 'nombre',
      fields: 'id,nombre',
    });
  } catch (error) {
    console.error('Error en getEstados:', error);
    return [];
  }
}

export async function getMunicipios(estadoId) {
  if (!estadoId) return [];
  try {
    return await pb.collection('municipios').getFullList({
      filter: `estadoId = "${estadoId}"`,
      sort: 'nombre',
      fields: 'id,nombre,estadoId',
    });
  } catch (error) {
    console.error('Error en getMunicipios:', error);
    return [];
  }
}

export async function getLocalidades(municipioId) {
  if (!municipioId) return [];
  try {
    return await pb.collection('localidades').getFullList({
      filter: `municipioId = "${municipioId}"`,
      sort: 'nombre',
      fields: 'id,nombre,municipioId',
    });
  } catch (error) {
    console.error('Error en getLocalidades:', error);
    return [];
  }
}

export async function getSectores(localidadId) {
  if (!localidadId) return [];
  try {
    return await pb.collection('sectores').getFullList({
      filter: `localidadId = "${localidadId}"`,
      sort: 'nombre',
      fields: 'id,nombre,localidadId',
    });
  } catch (error) {
    console.error('Error en getSectores:', error);
    return [];
  }
}

// ─── HELPERS ─────────────────────────────────────────────

/**
 * Normaliza un registro de PocketBase a un objeto plano
 */
function mapServicio(record) {
  const imagenes = [];
  if (record.logo) imagenes.push(pb.files.getURL(record, record.logo));
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
    direccion: record.direccion || '',
    ubicacion: record.ubicacion || '',
    telefono: record.telefono || '',
    whatsapp: record.whatsapp || '',
    email: record.email || '',
    horario: record.horario || '',
    sitioWeb: record.sitioWeb || '',
    facebook: record.facebook || '',
    instagram: record.instagram || '',
    tiktok: record.tiktok || '',
    logo: record.logo ? pb.files.getURL(record, record.logo) : null,
    imagenes,
    imagen: imagenes[0] || null,
    usuarioId: record.usuarioId || null,
    estadoId: record.estadoId || null,
    municipioId: record.municipioId || null,
    localidadId: record.localidadId || null,
    sectorId: record.sectorId || null,
    codigoPostal: record.codigoPostal || '',
    latitud: record.latitud || null,
    longitud: record.longitud || null,
    servicios: record.servicios || '',
    precioBase: record.precioBase || 0,
    atencionWhatsapp: record.atencionWhatsapp !== false,
    citasPrevias: record.citasPrevias === true,
    domicilio: record.domicilio === true,
    esMarketDesliz: record.esMarketDesliz === true,
    estadoActivacion: record.estadoActivacion || 'inactivo',
    activo: record.activo !== false,
    destacado: record.destacado === true,
    verificado: record.verificado === true,
    orden: record.orden || 0,
    visitas: record.visitas || 0,
    calificacion: record.calificacion || 0,
    totalComentarios: record.totalComentarios || 0,
    creado: record.created,
    actualizado: record.updated,
    // Expand (relaciones geográficas)
    expand: record.expand || {},
    municipioNombre: record.expand?.municipioId?.nombre || '',
    localidadNombre: record.expand?.localidadId?.nombre || '',
    sectorNombre: record.expand?.sectorId?.nombre || '',
  };
}