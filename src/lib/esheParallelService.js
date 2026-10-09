// src/lib/esheParallelService.js
import pb from './pocketbase';

// ─── ÉSHÉ PARALLEL ───────────────────────────────────────

/**
 * Obtiene productos de Éshé Parallel con paginación y filtros.
 * Nota: `categoria` (select) ya no existe; ahora es `categoriaId` (relation).
 */
export async function getEsheParallel({
  page = 1,
  perPage = 20,
  search = '',
  categoriaId = 'todos',
  genero = '',
  coleccion = '',
  temporada = '',
  soloDestacados = false,
  soloNuevos = false,
  soloOfertas = false,
  sort = 'orden, nombre',
} = {}) {
  const filters = ['activo = true'];

  if (search) {
    const s = search.replace(/"/g, '\\"');
    // Buscar por nombre, descripción, color, material
    // y por el nombre de la categoría relacionada (join implícito con `categoriaId.nombre`)
    filters.push(
      `(nombre ~ "${s}" || descripcion ~ "${s}" || color ~ "${s}" || material ~ "${s}" || categoriaId.nombre ~ "${s}")`
    );
  }

  if (categoriaId && categoriaId !== 'todos') {
    filters.push(`categoriaId = "${categoriaId}"`);
  }
  if (genero) filters.push(`genero = "${genero}"`);
  if (coleccion) filters.push(`coleccion = "${coleccion}"`);
  if (temporada) filters.push(`temporada = "${temporada}"`);
  if (soloDestacados) filters.push('destacado = true');
  if (soloNuevos) filters.push('nuevo = true');
  if (soloOfertas) filters.push('precioAnterior > 0 && precioAnterior > precio');

  const filter = filters.join(' && ');

  try {
    const result = await pb.collection('eshe_parallel').getList(page, perPage, {
      filter,
      sort,
      expand: 'categoriaId,usuarioId',
    });

    return {
      items: result.items.map(mapProducto),
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage,
    };
  } catch (error) {
    console.error('Error en getEsheParallel:', error);
    return { items: [], totalItems: 0, totalPages: 0, page: 1, perPage };
  }
}

/**
 * Obtiene un producto por ID
 */
export async function getEsheParallelById(id) {
  try {
    const record = await pb.collection('eshe_parallel').getOne(id, {
      expand: 'categoriaId,usuarioId',
    });
    return mapProducto(record);
  } catch (error) {
    console.error('Error en getEsheParallelById:', error);
    return null;
  }
}

/**
 * Productos destacados
 */
export async function getEsheParallelDestacados(limit = 8) {
  try {
    const records = await pb.collection('eshe_parallel').getFullList({
      filter: 'activo = true && destacado = true',
      sort: '-created',
      limit,
      expand: 'categoriaId',
    });
    return records.map(mapProducto);
  } catch (error) {
    console.error('Error en getEsheParallelDestacados:', error);
    return [];
  }
}

/**
 * Productos relacionados (misma categoría)
 * @param {string} categoriaId - ID de la categoría (antes era el nombre)
 */
export async function getEsheParallelRelacionados(categoriaId, productoId, limit = 6) {
  if (!categoriaId) return [];
  try {
    const records = await pb.collection('eshe_parallel').getFullList({
      filter: `categoriaId = "${categoriaId}" && id != "${productoId}" && activo = true`,
      sort: '-created',
      limit,
      expand: 'categoriaId',
    });
    return records.map(mapProducto);
  } catch (error) {
    console.error('Error en getEsheParallelRelacionados:', error);
    return [];
  }
}

/**
 * Productos por usuario (para admin/mis productos)
 */
export async function getEsheParallelByUsuario(userId) {
  try {
    const records = await pb.collection('eshe_parallel').getFullList({
      filter: `usuarioId = "${userId}"`,
      sort: '-created',
      expand: 'categoriaId',
    });
    return records.map(mapProducto);
  } catch (error) {
    console.error('Error en getEsheParallelByUsuario:', error);
    return [];
  }
}

/**
 * Registrar visita
 */
export async function registrarVisitaEshe(id) {
  try {
    const record = await pb.collection('eshe_parallel').getOne(id, { fields: 'id,visitas' });
    const nuevas = (record.visitas || 0) + 1;
    await pb.collection('eshe_parallel').update(id, { visitas: nuevas });
    return nuevas;
  } catch (error) {
    console.warn('No se pudo registrar visita:', error.message);
    return null;
  }
}

/**
 * Obtiene las colecciones únicas (para filtros)
 */
export async function getColecciones() {
  try {
    const records = await pb.collection('eshe_parallel').getFullList({
      filter: 'activo = true',
      fields: 'coleccion',
    });
    const set = new Set(records.map(r => r.coleccion).filter(Boolean));
    return Array.from(set).sort();
  } catch (error) {
    console.error('Error en getColecciones:', error);
    return [];
  }
}

/**
 * Obtiene las categorías del vertical eshe_parallel desde PocketBase
 */
export async function getEsheCategorias() {
  try {
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true && vertical = "eshe_parallel"',
      sort: 'orden,nombre',
      fields: 'id,nombre,slug,orden,categoriaPadreId',
    });
    return categorias;
  } catch (error) {
    console.error('Error en getEsheCategorias:', error);
    return [];
  }
}

// ─── HELPERS ─────────────────────────────────────────────

function mapProducto(record) {
  const imagenes = [];
  if (record.imagen) imagenes.push(pb.files.getURL(record, record.imagen));
  if (record.imagenes) {
    const arr = Array.isArray(record.imagenes) ? record.imagenes : [record.imagenes];
    arr.forEach(img => {
      if (img) imagenes.push(pb.files.getURL(record, img));
    });
  }

  // Normalizar tallas (puede ser array o JSON)
  let tallasArr = [];
  if (record.talla) {
    tallasArr = Array.isArray(record.talla) ? record.talla : [record.talla];
  }

  // Normalizar colores
  let coloresArr = [];
  if (record.colores) {
    try {
      coloresArr = typeof record.colores === 'string' ? JSON.parse(record.colores) : record.colores;
    } catch { coloresArr = []; }
  }

  // Normalizar etiquetas
  let etiquetasArr = [];
  if (record.etiquetas) {
    try {
      etiquetasArr = typeof record.etiquetas === 'string' ? JSON.parse(record.etiquetas) : record.etiquetas;
    } catch { etiquetasArr = []; }
  }

  // Normalizar stock por talla
  let tallasStock = {};
  if (record.tallas) {
    try {
      tallasStock = typeof record.tallas === 'string' ? JSON.parse(record.tallas) : record.tallas;
    } catch { tallasStock = {}; }
  }

  return {
    id: record.id,
    nombre: record.nombre || '',
    descripcion: record.descripcion || '',

    // ✅ Cambio: categoría por relación
    categoriaId: record.categoriaId || null,
    categoriaNombre: record.expand?.categoriaId?.nombre || '',
    categoriaSlug: record.expand?.categoriaId?.slug || '',

    subcategoria: record.subcategoria || '',
    coleccion: record.coleccion || '',
    talla: tallasArr,
    color: record.color || '',
    material: record.material || '',
    genero: record.genero || '',
    precio: record.precio || 0,
    precioAnterior: record.precioAnterior || 0,
    precioCredito: record.precioCredito || 0,
    enganche: record.enganche || 0,
    pagoSemanal: record.pagoSemanal || 0,
    stock: record.stock || 0,
    sku: record.sku || '',
    imagen: imagenes[0] || null,
    imagenes,
    tallasStock,
    colores: coloresArr,
    etiquetas: etiquetasArr,
    temporada: record.temporada || '',
    activo: record.activo !== false,
    nuevo: record.nuevo === true,
    destacado: record.destacado === true,
    edicionLimitada: record.edicionLimitada === true,
    orden: record.orden || 0,
    visitas: record.visitas || 0,
    calificacion: record.calificacion || 0,
    totalComentarios: record.totalComentarios || 0,
    usuarioId: record.usuarioId || null,
    creado: record.created,
    actualizado: record.updated,
    expand: record.expand || {},
  };
}

// ─── HELPERS DE PRESENTACIÓN ────────────────────────────

export function calcularDescuento(precio, precioAnterior) {
  if (!precioAnterior || precioAnterior <= precio) return 0;
  return Math.round(((precioAnterior - precio) / precioAnterior) * 100);
}

export function getTallasDisponibles(producto) {
  return producto.talla || [];
}