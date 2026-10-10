// src/lib/frutasService.js
import pb from './pocketbase';

// ─── HELPERS ─────────────────────────────────────────────

function escapeFilterValue(value) {
  if (!value) return '';
  return String(value).replace(/[\\"']/g, '\\$&');
}

function formatFruta(record) {
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
    categoriaId: record.categoriaId || null,
    categoriaNombre: record.expand?.categoriaId?.nombre || '',
    categoriaSlug: record.expand?.categoriaId?.slug || '',
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
    telefono: record.telefono || '',
    whatsapp: record.whatsapp || '',
    creado: record.created,
    actualizado: record.updated,
    expand: record.expand || {},
    municipioNombre: record.expand?.municipioId?.nombre || '',
    localidadNombre: record.expand?.localidadId?.nombre || '',
  };
}

// ─── FRUTAS ──────────────────────────────────────────────

export async function getFrutas({
  page = 1,
  perPage = 20,
  search = '',
  categoriaId = 'todos',
  municipioId = '',
  localidadId = '',
  soloDestacadas = false,
  soloTemporada = false,
  sort = 'orden, nombre',
} = {}) {
  const filters = ['activo = true'];

  if (search) {
    const s = escapeFilterValue(search);
    filters.push(
      `(nombre ~ "${s}" || descripcion ~ "${s}" || categoriaId.nombre ~ "${s}")`
    );
  }

  if (categoriaId && categoriaId !== 'todos' && categoriaId !== 'todas') {
    filters.push(`categoriaId = "${categoriaId}"`);
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
      expand: 'categoriaId,municipioId,localidadId,usuarioId',
    });

    return {
      items: result.items.map(formatFruta),
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

export async function getFrutaById(id) {
  try {
    const record = await pb.collection('frutas').getOne(id, {
      expand: 'categoriaId,municipioId,localidadId,usuarioId',
    });
    return formatFruta(record);
  } catch (error) {
    console.error('Error en getFrutaById:', error);
    return null;
  }
}

export async function getFrutasTemporada(limit = 8) {
  try {
    const records = await pb.collection('frutas').getFullList({
      filter: 'activo = true && temporada = true',
      sort: '-created',
      limit,
      expand: 'categoriaId',
    });
    return records.map(formatFruta);
  } catch (error) {
    console.error('Error en getFrutasTemporada:', error);
    return [];
  }
}

export async function getFrutasByUsuario(userId) {
  try {
    const records = await pb.collection('frutas').getFullList({
      filter: `usuarioId = "${userId}"`,
      sort: '-created',
      expand: 'categoriaId',
    });
    return records.map(formatFruta);
  } catch (error) {
    console.error('Error en getFrutasByUsuario:', error);
    return [];
  }
}

export async function getFrutasRelacionadas(categoriaId, frutaId, limit = 6) {
  if (!categoriaId) return [];
  try {
    const records = await pb.collection('frutas').getFullList({
      filter: `categoriaId = "${categoriaId}" && id != "${frutaId}" && activo = true`,
      sort: '-created',
      limit,
      expand: 'categoriaId',
    });
    return records.map(formatFruta);
  } catch (error) {
    console.error('Error en getFrutasRelacionadas:', error);
    return [];
  }
}

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

export async function getFrutaCategorias() {
  try {
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true && vertical = "frutas"',
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
    console.error('Error en getFrutaCategorias:', error);
    return [];
  }
}

// ─── CREAR / ACTUALIZAR FRUTA (directo con PB) ─────────

/**
 * Crea una nueva fruta. Recibe un FormData ya construido.
 */
export async function createFruta(formData) {
  try {
    const record = await pb.collection('frutas').create(formData);
    return formatFruta(record);
  } catch (error) {
    console.error('Error en createFruta:', error);
    throw error;
  }
}

/**
 * Actualiza una fruta existente. Recibe `id` y un FormData.
 */
export async function updateFruta(id, formData) {
  try {
    const record = await pb.collection('frutas').update(id, formData);
    return formatFruta(record);
  } catch (error) {
    console.error('Error en updateFruta:', error);
    throw error;
  }
}

// ─── CREAR CATEGORÍA (vía API Route) ────────────────────

export async function createCategoria(nombre, vertical = 'frutas') {
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo crear la categoría');
  }

  return data;
}

// ─── CREAR MUNICIPIO (vía API Route) ────────────────────

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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo crear el municipio');
  }

  return data;
}

// ─── CREAR LOCALIDAD (vía API Route) ────────────────────

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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo crear la localidad');
  }

  return data;
}