// src/lib/ganadoService.js
import pb from './pocketbase';

// ─── HELPERS ─────────────────────────────────────────────

function escapeFilterValue(value) {
  if (!value) return '';
  return String(value).replace(/[\\"']/g, '\\$&');
}

/**
 * Normaliza un registro de la colección `ganado` para la UI.
 * La categoría ahora es `categoriaId` (relation a `categorias`).
 */
function mapGanado(record) {
  const imagenes = [];
  if (record.imagen) imagenes.push(pb.files.getURL(record, record.imagen));
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
    userId: record.userId || null,
    creado: record.created,
    actualizado: record.updated,
    expand: record.expand || {},
    municipioNombre: record.expand?.municipioId?.nombre || '',
    localidadNombre: record.expand?.localidadId?.nombre || '',
  };
}

// ─── GANADO ──────────────────────────────────────────────

/**
 * Obtiene ganado con paginación, búsqueda y filtros.
 * Nota: `categoria` (text) ya no existe; ahora es `categoriaId` (relation).
 */
export async function getGanado({
  page = 1,
  perPage = 20,
  search = '',
  categoriaId = 'todos',
  sexo = '',
  municipioId = '',
  localidadId = '',
  soloDestacados = false,
  soloNuevos = false,
  sort = 'orden, nombre',
} = {}) {
  const filters = ['activo = true'];

  if (search) {
    const s = escapeFilterValue(search);
    filters.push(
      `(nombre ~ "${s}" || descripcion ~ "${s}" || raza ~ "${s}" || categoriaId.nombre ~ "${s}")`
    );
  }

  if (categoriaId && categoriaId !== 'todos' && categoriaId !== 'todas') {
    filters.push(`categoriaId = "${categoriaId}"`);
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
      expand: 'categoriaId,municipioId,localidadId,userId',
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

export async function getGanadoById(id) {
  try {
    const record = await pb.collection('ganado').getOne(id, {
      expand: 'categoriaId,municipioId,localidadId,userId',
    });
    return mapGanado(record);
  } catch (error) {
    console.error('Error en getGanadoById:', error);
    return null;
  }
}

export async function getGanadoDestacado(limit = 8) {
  try {
    const records = await pb.collection('ganado').getFullList({
      filter: 'activo = true && destacado = true',
      sort: '-created',
      limit,
      expand: 'categoriaId',
    });
    return records.map(mapGanado);
  } catch (error) {
    console.error('Error en getGanadoDestacado:', error);
    return [];
  }
}

export async function getGanadoByUsuario(userId) {
  try {
    const records = await pb.collection('ganado').getFullList({
      filter: `userId = "${userId}"`,
      sort: '-created',
      expand: 'categoriaId',
    });
    return records.map(mapGanado);
  } catch (error) {
    console.error('Error en getGanadoByUsuario:', error);
    return [];
  }
}

/**
 * Ganado relacionado (misma categoría, excluye actual)
 * @param {string} categoriaId - ID de la categoría (antes era el nombre)
 */
export async function getGanadoRelacionado(categoriaId, ganadoId, limit = 6) {
  if (!categoriaId) return [];
  try {
    const records = await pb.collection('ganado').getFullList({
      filter: `categoriaId = "${categoriaId}" && id != "${ganadoId}" && activo = true`,
      sort: '-created',
      limit,
      expand: 'categoriaId',
    });
    return records.map(mapGanado);
  } catch (error) {
    console.error('Error en getGanadoRelacionado:', error);
    return [];
  }
}

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

// ─── CATEGORÍAS DE GANADO ────────────────────────────────

/**
 * Obtiene las categorías del vertical "ganado" desde PocketBase.
 * Devuelve estructura PLANA con jerarquía marcada por `depth`.
 */
export async function getGanadoCategorias() {
  try {
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true && vertical = "ganado"',
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
    console.error('Error en getGanadoCategorias:', error);
    return [];
  }
}

// ─── CREAR / ACTUALIZAR GANADO ──────────────────────────

/**
 * Crea un nuevo animal. Recibe un FormData ya construido.
 */
export async function createGanado(formData) {
  try {
    const record = await pb.collection('ganado').create(formData);
    return mapGanado(record);
  } catch (error) {
    console.error('Error en createGanado:', error);
    throw error;
  }
}

/**
 * Actualiza un animal existente. Recibe `id` y un FormData.
 */
export async function updateGanado(id, formData) {
  try {
    const record = await pb.collection('ganado').update(id, formData);
    return mapGanado(record);
  } catch (error) {
    console.error('Error en updateGanado:', error);
    throw error;
  }
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

export function getSexoLabel(sexo) {
  const map = {
    Macho: 'Macho',
    Hembra: 'Hembra',
    Mixto: 'Mixto',
  };
  return map[sexo] || sexo || 'No especificado';
}

// ─── CREAR CATEGORÍA / MUNICIPIO / LOCALIDAD ────────────

export async function createCategoria(nombre, vertical = 'ganado') {
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