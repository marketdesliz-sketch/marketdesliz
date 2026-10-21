// src/lib/serviciosService.js
import pb from './pocketbase';

// ─── HELPERS ─────────────────────────────────────────────

function escapeFilterValue(value) {
  if (!value) return '';
  return String(value).replace(/[\\"']/g, '\\$&');
}

/**
 * Normaliza un registro de la colección `servicios` para la UI.
 * La categoría ahora es `categoriaId` (relation a `categorias`).
 */
function mapServicio(record) {
  const imagenes = [];
  if (record.logo) imagenes.push(pb.files.getURL(record, record.logo));
  if (record.imagenes) {
    const arr = Array.isArray(record.imagenes) ? record.imagenes : [record.imagenes];
    arr.forEach((img) => {
      if (img) imagenes.push(pb.files.getURL(record, img));
    });
  }

  return {
    id: record.id,
    nombre: record.nombre || '',
    descripcion: record.descripcion || '',

    // ✅ Categoría por relación
    categoriaId: record.categoriaId || null,
    categoriaNombre: record.expand?.categoriaId?.nombre || '',
    categoriaSlug: record.expand?.categoriaId?.slug || '',

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

    userId: record.userId || null,

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
    estadoActivacion: record.estadoActivacion || 'pendiente_activacion',
    activo: record.activo !== false,
    destacado: record.destacado === true,
    verificado: record.verificado === true,
    orden: record.orden || 0,
    visitas: record.visitas || 0,
    calificacion: record.calificacion || 0,
    totalComentarios: record.totalComentarios || 0,

    creado: record.created,
    actualizado: record.updated,

    // Expand
    expand: record.expand || {},
    municipioNombre: record.expand?.municipioId?.nombre || '',
    localidadNombre: record.expand?.localidadId?.nombre || '',
    sectorNombre: record.expand?.sectorId?.nombre || '',
  };
}

// ─── SERVICIOS ───────────────────────────────────────────
/**
 * Obtiene servicios con paginación, búsqueda y filtros.
 * Usa `categoriaId` (relation) en vez de `categoria` (text).
 *
 * ✅ NUEVOS PARAMS (opcionales, backwards-compatible):
 *   - incluirInactivos: si true, no aplica el filtro `activo = true`.
 *                       Necesario para el admin (ver/reactivar inactivos).
 *   - estadoActivacion: filtra por 'activo' | 'pendiente_activacion' | 'inactivo'.
 *   - verificado:       null=todos, true=solo verificados, false=solo no verificados.
 */
export async function getServicios({
  page = 1,
  perPage = 20,
  search = '',
  categoriaId = 'todos',
  municipioId = '',
  localidadId = '',
  sort = 'orden, nombre',
  soloMarketDesliz = null, // null=todos, true=soloMD, false=excluirMD
  destacados = false,
  // ✅ NUEVOS (backwards-compatible con el público)
  incluirInactivos = false,
  estadoActivacion = null,
  verificado = null,
} = {}) {
  const filters = [];

  // Por defecto, solo activos (comportamiento público sin cambios)
  if (!incluirInactivos) filters.push('activo = true');

  if (search) {
    const s = escapeFilterValue(search);
    filters.push(
      `(nombre ~ "${s}" || descripcion ~ "${s}" || categoriaId.nombre ~ "${s}" || direccion ~ "${s}")`
    );
  }

  // ✅ Filtro por ID (no por nombre)
  if (categoriaId && categoriaId !== 'todos' && categoriaId !== 'todas') {
    filters.push(`categoriaId = "${categoriaId}"`);
  }

  if (municipioId) filters.push(`municipioId = "${municipioId}"`);
  if (localidadId) filters.push(`localidadId = "${localidadId}"`);

  if (soloMarketDesliz === true) filters.push('esMarketDesliz = true');
  if (soloMarketDesliz === false) filters.push('esMarketDesliz = false');
  if (destacados) filters.push('destacado = true');

  // ✅ NUEVOS filtros
  if (estadoActivacion) filters.push(`estadoActivacion = "${estadoActivacion}"`);
  if (verificado !== null) filters.push(`verificado = ${verificado}`);

  const filter = filters.length > 0 ? filters.join(' && ') : '';

  try {
    const result = await pb.collection('servicios').getList(page, perPage, {
      filter,
      sort,
      expand: 'categoriaId,municipioId,localidadId,sectorId,userId',
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
 * Obtiene un servicio por ID.
 */
export async function getServicioById(id) {
  try {
    const record = await pb.collection('servicios').getOne(id, {
      expand: 'categoriaId,municipioId,localidadId,sectorId,userId',
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
      expand: 'categoriaId',
    });
    return records.map(mapServicio);
  } catch (error) {
    console.error('Error en getServiciosMarketDesliz:', error);
    return [];
  }
}

/**
 * Servicios de un usuario específico.
 */
export async function getServiciosByUsuario(userId) {
  try {
    const records = await pb.collection('servicios').getFullList({
      filter: `userId = "${userId}"`,
      sort: '-created',
      expand: 'categoriaId,municipioId,localidadId',
    });
    return records.map(mapServicio);
  } catch (error) {
    console.error('Error en getServiciosByUsuario:', error);
    return [];
  }
}


/**
 * Servicios relacionados (misma categoría, excluye el actual).
 * @param {string} categoriaId - ID de la categoría (antes era el nombre)
 */
export async function getServiciosRelacionados(categoriaId, servicioId, limit = 6) {
  if (!categoriaId) return [];
  try {
    const records = await pb.collection('servicios').getFullList({
      filter: `categoriaId = "${categoriaId}" && id != "${servicioId}" && activo = true && esMarketDesliz = false`,
      sort: '-created',
      limit,
      expand: 'categoriaId',
    });
    return records.map(mapServicio);
  } catch (error) {
    console.error('Error en getServiciosRelacionados:', error);
    return [];
  }
}

/**
 * Crea un nuevo servicio. Recibe un FormData ya construido.
 */
export async function createServicio(formData) {
  try {
    const record = await pb.collection('servicios').create(formData);
    return mapServicio(record);
  } catch (error) {
    console.error('Error en createServicio:', error);
    throw error;
  }
}

/**
 * Actualiza un servicio existente. Recibe `id` y un FormData.
 */
export async function updateServicio(id, formData) {
  try {
    const record = await pb.collection('servicios').update(id, formData);
    return mapServicio(record);
  } catch (error) {
    console.error('Error en updateServicio:', error);
    throw error;
  }
}

// ─── CATEGORÍAS DE SERVICIOS ─────────────────────────────

/**
 * Obtiene las categorías del vertical "servicios" desde PocketBase.
 * Devuelve estructura PLANA con jerarquía marcada por `depth`.
 */
export async function getServicioCategorias() {
  try {
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true && vertical = "servicios"',
      sort: 'orden,nombre',
      fields: 'id,nombre,slug,orden,categoriaPadreId',
    });

    if (categorias.length === 0) return [];

    const padres = categorias.filter((c) => !c.categoriaPadreId);
    const hijos = categorias.filter((c) => c.categoriaPadreId);

    const planas = [];

    padres.forEach((padre) => {
      const hijosDeEste = hijos.filter((h) => h.categoriaPadreId === padre.id);
      planas.push({
        id: padre.id,
        nombre: padre.nombre,
        slug: padre.slug,
        esPadre: true,
        tieneHijos: hijosDeEste.length > 0,
        depth: 0,
      });
      hijosDeEste.forEach((hijo) => {
        planas.push({
          id: hijo.id,
          nombre: hijo.nombre,
          slug: hijo.slug,
          esPadre: false,
          tieneHijos: false,
          depth: 1,
        });
      });
    });

    // Huérfanos
    hijos.forEach((hijo) => {
      if (!padres.find((p) => p.id === hijo.categoriaPadreId)) {
        planas.push({
          id: hijo.id,
          nombre: hijo.nombre,
          slug: hijo.slug,
          esPadre: false,
          tieneHijos: false,
          depth: 1,
        });
      }
    });

    return planas;
  } catch (error) {
    console.error('Error en getServicioCategorias:', error);
    return [];
  }
}

// ─── GEOGRAFÍA ───────────────────────────────────────────

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

// ─── CREAR CATEGORÍA / MUNICIPIO / LOCALIDAD (admin API) ─

export async function createCategoria(nombre, vertical = 'servicios') {
  const limpio = String(nombre || '').trim();
  if (!limpio) throw new Error('El nombre de la categoría es obligatorio');

  const token = pb.authStore.token;
  if (!token) throw new Error('Sesión no iniciada');

  const res = await fetch('/api/admin/crear-categoria', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nombre: limpio, vertical }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo crear la categoría');
  }
  return data;
}

export async function createMunicipio(nombre, estadoId) {
  const limpio = String(nombre || '').trim();
  if (!limpio) throw new Error('El nombre del municipio es obligatorio');
  if (!estadoId) throw new Error('El estado es obligatorio');

  const token = pb.authStore.token;
  if (!token) throw new Error('Sesión no iniciada');

  const res = await fetch('/api/admin/crear-municipio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nombre: limpio, estadoId }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo crear el municipio');
  }
  return data;
}

export async function createLocalidad(nombre, municipioId) {
  const limpio = String(nombre || '').trim();
  if (!limpio) throw new Error('El nombre de la localidad es obligatorio');
  if (!municipioId) throw new Error('El municipio es obligatorio');

  const token = pb.authStore.token;
  if (!token) throw new Error('Sesión no iniciada');

  const res = await fetch('/api/admin/crear-localidad', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nombre: limpio, municipioId }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo crear la localidad');
  }
  return data;
}

// ═════════════════════════════════════════════════════════════════════════
// VISITAS · CONTACTOS · FAVORITOS (servicios)
// ═════════════════════════════════════════════════════════════════════════

/**
 * Registra una visita al servicio.
 *   1. Incrementa `servicios.visitas` (contador global).
 *   2. Crea un evento en `visitas_servicios` (para tendencias).
 *
 * @param {string} servicioId
 * @param {string|null} userId  ID del usuario logueado, o null si anónimo.
 */
export async function registrarVisita(servicioId, userId = null) {
  try {
    // 1. Contador
    const record = await pb.collection('servicios').getOne(servicioId, {
      fields: 'id,visitas',
    });
    const nuevasVisitas = (record.visitas || 0) + 1;
    await pb.collection('servicios').update(servicioId, { visitas: nuevasVisitas });

    // 2. Evento (no bloquea si falla)
    pb.collection('visitas_servicios')
      .create({ servicioId, userId: userId || null })
      .catch(() => {});

    return nuevasVisitas;
  } catch (error) {
    console.warn('No se pudo registrar visita:', error.message);
    return null;
  }
}

/**
 * Registra un contacto desde un servicio.
 *
 * @param {string} servicioId
 * @param {'whatsapp'|'telefono'|'email'} tipo
 * @param {string|null} userId
 */
export async function registrarContacto(servicioId, tipo, userId = null) {
  try {
    await pb.collection('contactos_servicios').create({
      servicioId,
      userId: userId || null,
      tipo,
    });
    return true;
  } catch (error) {
    console.warn('No se pudo registrar contacto:', error.message);
    return false;
  }
}

/**
 * Cuenta los favoritos de un servicio específico.
 */
export async function getFavoritosCount(servicioId) {
  if (!servicioId) return 0;
  try {
    const result = await pb.collection('favoritos_servicios').getList(1, 1, {
      filter: `servicioId = "${servicioId}"`,
      fields: 'id',
    });
    return result.totalItems;
  } catch (error) {
    console.warn('No se pudo contar favoritos:', error.message);
    return 0;
  }
}

/**
 * Total global de favoritos (para stats del admin).
 */
export async function getTotalFavoritos() {
  try {
    const result = await pb.collection('favoritos_servicios').getList(1, 1, {
      fields: 'id',
    });
    return result.totalItems;
  } catch (error) {
    console.warn('No se pudo contar favoritos totales:', error.message);
    return 0;
  }
}