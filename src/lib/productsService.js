// src/lib/productsService.js
import pb from './pocketbase';

const ITEMS_PER_PAGE = 12;

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Escapar caracteres especiales para PocketBase filter
 */
function escapeFilterValue(value) {
  if (!value) return '';
  return String(value).replace(/[\\"']/g, '\\$&');
}

/**
 * Formatear producto para la UI
 */
function formatProduct(record) {
  const getImageUrl = (fileField) => {
    if (!fileField) return null;
    if (typeof fileField === 'string') return pb.files.getURL(record, fileField);
    if (Array.isArray(fileField) && fileField.length > 0) {
      const first = fileField[0];
      if (typeof first === 'string') return pb.files.getURL(record, first);
      if (typeof first === 'object' && first !== null) return pb.files.getURL(record, first);
    }
    return null;
  };

  const imageUrl = getImageUrl(record.imagen) || getImageUrl(record.imagenes);

  return {
    id: record.id,
    nombre: record.nombre || '',
    descripcion: record.descripcion || '',
    precio: record.precio || 0,
    precioContado: Math.round((record.precio || 0) * 0.75),
    enganche: record.enganche || Math.round((record.precio || 0) * 0.15),
    pagoSemanal: record.pagoSemanal || Math.round((record.precio || 0) * 0.05),
    semanas: record.semanas || 12,
    frecuenciaPago: record.frecuenciaPago || 'semanal',
    categoria: record.expand?.categoriaId?.nombre || '',
    categoriaId: record.categoriaId || null,
    imagen: imageUrl,
    activo: record.activo === true,
    stock: record.stock || 0,
    agotado: record.stock === 0,
    nuevo: record.nuevo === true,
    sku: record.sku || record.id?.substring(0, 6).toUpperCase(),
    created: record.created,
    negocioId: record.negocioId
  };
}

// ============================================
// OBTENER TODOS LOS PRODUCTOS ACTIVOS
// ============================================
export async function getProducts() {
  try {
    const records = await pb.collection('products').getFullList({
      filter: 'activo = true',
      sort: '-created',
      expand: 'categoriaId'
    });
    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTO POR ID
// ============================================
export async function getProductById(id) {
  try {
    const record = await pb.collection('products').getOne(id, {
      expand: 'categoriaId'   // ✅ Eliminado subcategoriaId (no existe)
    });
    return formatProduct(record);
  } catch (error) {
    console.error('❌ Error obteniendo producto por ID:', error);
    return null;
  }
}

// ============================================
// OBTENER PRODUCTOS POR CATEGORÍA
// ============================================
export async function getProductsByCategory(categoriaId, limit = null) {
  try {
    if (!categoriaId || categoriaId === 'todos' || categoriaId === 'Todas') {
      return await getProducts();
    }

    const options = {
      filter: `categoriaId = "${categoriaId}" && activo = true`,
      sort: '-created',
      expand: 'categoriaId'
    };

    if (limit) options.limit = limit;

    const records = await pb.collection('products').getFullList(options);
    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error obteniendo productos por categoría:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTOS DESTACADOS (NUEVOS)
// ============================================
export async function getFeaturedProducts(limit = 8) {
  try {
    const records = await pb.collection('products').getFullList({
      filter: 'activo = true && nuevo = true',
      sort: '-created',
      limit: limit,
      expand: 'categoriaId'
    });
    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error obteniendo productos destacados:', error);
    return [];
  }
}

// ============================================
// BUSCAR PRODUCTOS
// ============================================
export async function searchProducts(query, categoriaId = null, filtros = {}) {
  try {
    if ((!query || query.trim() === '') && categoriaId && categoriaId !== 'todos') {
      return await getProductsByCategory(categoriaId);
    }

    if (!query || query.trim() === '') {
      return await getProducts();
    }

    const searchTerm = escapeFilterValue(query.trim().toLowerCase());

    let filter = `activo = true && (nombre ~ "${searchTerm}" || descripcion ~ "${searchTerm}" || sku ~ "${searchTerm}")`;

    if (categoriaId && categoriaId !== 'todos') {
      filter += ` && categoriaId = "${categoriaId}"`;
    }

    if (filtros.precioMax && filtros.precioMax > 0) {
      filter += ` && precio <= ${filtros.precioMax}`;
    }

    if (filtros.soloDisponibles) {
      filter += ` && stock > 0`;
    }

    const records = await pb.collection('products').getFullList({
      filter: filter,
      sort: '-created',
      expand: 'categoriaId'
    });

    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error buscando productos:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTOS RELACIONADOS
// ============================================
export async function getRelatedProducts(productId, categoriaId, limit = 6) {
  try {
    if (!categoriaId) return [];

    const records = await pb.collection('products').getFullList({
      filter: `categoriaId = "${categoriaId}" && id != "${productId}" && activo = true`,
      sort: '-created',
      limit: limit,
      expand: 'categoriaId'
    });

    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error obteniendo productos relacionados:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTOS POR RANGO DE PRECIO
// ============================================
export async function getProductsByPriceRange(minPrice, maxPrice, categoriaId = null) {
  try {
    let filter = `activo = true && precio >= ${minPrice} && precio <= ${maxPrice}`;

    if (categoriaId && categoriaId !== 'todos') {
      filter += ` && categoriaId = "${categoriaId}"`;
    }

    const records = await pb.collection('products').getFullList({
      filter: filter,
      sort: 'precio',
      expand: 'categoriaId'
    });

    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error filtrando por precio:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTOS MÁS VENDIDOS
// ============================================
export async function getTopSellingProducts(limit = 10) {
  try {
    const records = await pb.collection('products').getFullList({
      filter: 'activo = true',
      sort: '-created',
      limit: limit,
      expand: 'categoriaId'
    });
    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error obteniendo top productos:', error);
    return [];
  }
}

// ============================================
// OBTENER CATEGORÍAS CON CONTEO DE PRODUCTOS
// ============================================
export async function getCategoriesWithCount() {
  try {
    // ✅ Filtrado por vertical = "products"
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true && vertical = "products"',
      sort: 'nombre',
      fields: 'id,nombre'
    });

    if (categorias.length === 0) return [];

    const productos = await pb.collection('products').getFullList({
      filter: 'activo = true',
      fields: 'categoriaId'
    });

    const conteo = {};
    productos.forEach(p => {
      if (p.categoriaId) {
        conteo[p.categoriaId] = (conteo[p.categoriaId] || 0) + 1;
      }
    });

    const resultado = categorias.map(cat => ({
      id: cat.id,
      nombre: cat.nombre,
      slug: cat.nombre.toLowerCase().replace(/\s+/g, '-'),
      count: conteo[cat.id] || 0
    }));

    resultado.sort((a, b) => b.count - a.count);
    return resultado;
  } catch (error) {
    console.error('❌ Error obteniendo conteo de categorías:', error);
    return [];
  }
}

// ============================================
// CREAR PRODUCTO
// ============================================
export async function createProduct(data) {
  try {
    const formData = new FormData();

    formData.append('nombre', data.nombre);
    formData.append('precio', parseFloat(data.precio));
    formData.append('enganche', parseFloat(data.enganche) || 0);
    formData.append('pagoSemanal', parseFloat(data.pagoSemanal) || 0);
    formData.append('semanas', parseInt(data.semanas) || 12);
    formData.append('categoriaId', data.categoriaId);
    formData.append('activo', data.activo === true);

    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.stock !== undefined) formData.append('stock', parseInt(data.stock) || 0);
    if (data.sku) formData.append('sku', data.sku);
    if (data.costo !== undefined) formData.append('costo', parseFloat(data.costo) || 0);
    if (data.diasEntrega !== undefined) formData.append('diasEntrega', parseInt(data.diasEntrega) || 1);
    if (data.nuevo !== undefined) formData.append('nuevo', data.nuevo === true);

    if (data.imagen) formData.append('imagen', data.imagen);

    if (data.imagenes && Array.isArray(data.imagenes) && data.imagenes.length > 0) {
      data.imagenes.forEach(file => formData.append('imagenes', file));
    }

    const record = await pb.collection('products').create(formData);
    return formatProduct(record);
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    throw error;
  }
}

// ============================================
// ACTUALIZAR PRODUCTO
// ============================================
export async function updateProduct(id, data) {
  try {
    const formData = new FormData();

    formData.append('nombre', data.nombre);
    formData.append('precio', parseFloat(data.precio));
    formData.append('enganche', parseFloat(data.enganche) || 0);
    formData.append('pagoSemanal', parseFloat(data.pagoSemanal) || 0);
    formData.append('semanas', parseInt(data.semanas) || 12);
    formData.append('categoriaId', data.categoriaId);
    formData.append('activo', data.activo === true);

    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.stock !== undefined) formData.append('stock', parseInt(data.stock) || 0);
    if (data.sku) formData.append('sku', data.sku);
    if (data.costo !== undefined) formData.append('costo', parseFloat(data.costo) || 0);
    if (data.diasEntrega !== undefined) formData.append('diasEntrega', parseInt(data.diasEntrega) || 1);
    if (data.nuevo !== undefined) formData.append('nuevo', data.nuevo === true);

    if (data.imagen && typeof data.imagen !== 'string') {
      formData.append('imagen', data.imagen);
    }

    if (data.imagenes && Array.isArray(data.imagenes) && data.imagenes.length > 0) {
      data.imagenes.forEach(file => formData.append('imagenes', file));
    }

    const record = await pb.collection('products').update(id, formData);
    return formatProduct(record);
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    throw error;
  }
}

// ============================================
// ELIMINAR PRODUCTO
// ============================================
export async function deleteProduct(id) {
  try {
    await pb.collection('products').delete(id);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    return false;
  }
}

// ============================================
// ACTUALIZAR STOCK
// ============================================
export async function updateStock(productId, cantidad) {
  try {
    const producto = await pb.collection('products').getOne(productId);
    const nuevoStock = (producto.stock || 0) + cantidad;

    await pb.collection('products').update(productId, {
      stock: Math.max(0, nuevoStock)
    });

    return true;
  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
    return false;
  }
}

// ============================================
// FUNCIONES PARA ADMIN
// ============================================

/**
 * Obtener productos con paginación, búsqueda y filtros (para admin)
 *
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.perPage
 * @param {string} params.search
 * @param {string} params.categoriaId - UUID o 'todos'
 * @param {string} params.estado - 'todos' | 'activos' | 'inactivos'
 * @param {string} params.sort
 */
export async function getProductsPaginated({
  page = 1,
  perPage = ITEMS_PER_PAGE,
  search = '',
  categoriaId = 'todos',
  estado = 'todos',
  sort = '-created'
} = {}) {
  try {
    let filter = '';

    // Filtro de estado
    if (estado === 'activos') {
      filter = 'activo = true';
    } else if (estado === 'inactivos') {
      filter = 'activo = false';
    }

    // ✅ Filtro de categoría usando ID directamente (sin lookup por nombre)
    if (categoriaId && categoriaId !== 'todos') {
      const catFilter = `categoriaId = "${categoriaId}"`;
      filter = filter ? `${filter} && ${catFilter}` : catFilter;
    }

    // Búsqueda por nombre, descripción o SKU
    if (search.trim()) {
      const term = escapeFilterValue(search.trim());
      const searchFilter = `(nombre ~ "${term}" || descripcion ~ "${term}" || sku ~ "${term}")`;
      filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
    }

    const result = await pb.collection('products').getList(page, perPage, {
      filter: filter || undefined,
      sort: sort,
      expand: 'categoriaId'
    });

    const items = result.items.map(record => {
      const formatted = formatProduct(record);
      if (record.imagenes && Array.isArray(record.imagenes)) {
        formatted.imagenesUrls = record.imagenes.map(img => pb.files.getURL(record, img));
      } else {
        formatted.imagenesUrls = [];
      }
      formatted.costo = record.costo || 0;
      formatted.diasEntrega = record.diasEntrega || 1;
      return formatted;
    });

    return {
      items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error('❌ Error obteniendo productos paginados:', error);
    throw error;
  }
}

/**
 * Obtener lista de categorías de productos (filtrado por vertical)
 */
export async function getProductCategories() {
  try {
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true && vertical = "products"',
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

    // Huérfanos (hijos sin padre válido)
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
  } catch (e) {
    console.warn('⚠️ No se pudieron cargar categorías desde PocketBase', e);
    return [];
  }
}

/**
 * Obtener estadísticas generales de productos
 */
export async function getProductsStats() {
  try {
    const totalResult = await pb.collection('products').getList(1, 1, { fields: 'id' });
    const activosResult = await pb.collection('products').getList(1, 1, {
      filter: 'activo = true',
      fields: 'id'
    });
    const inactivosResult = await pb.collection('products').getList(1, 1, {
      filter: 'activo = false',
      fields: 'id'
    });

    // Categorías únicas en uso (solo del vertical products)
    const productos = await pb.collection('products').getFullList({
      filter: 'activo = true',
      expand: 'categoriaId',
      fields: 'categoriaId'
    });

    const categoriasSet = new Set();
    productos.forEach(p => {
      const nombre = p.expand?.categoriaId?.nombre;
      if (nombre) categoriasSet.add(nombre);
    });

    return {
      total: totalResult.totalItems,
      activos: activosResult.totalItems,
      inactivos: inactivosResult.totalItems,
      categorias: categoriasSet.size
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de productos:', error);
    return { total: 0, activos: 0, inactivos: 0, categorias: 0 };
  }
}

// ============================================
// CREAR CATEGORÍA (vía API Route)
// ============================================

/**
 * Crea una nueva categoría llamando al API Route de Next.js.
 * El API Route corre en el servidor y usa credenciales de superadmin.
 *
 * @param {string} nombre - Nombre de la categoría
 * @param {string} vertical - 'products' | 'eshe_parallel' | 'frutas' | 'ganado' | 'servicios'
 * @returns {Promise<Object>} La categoría creada { id, nombre, slug }
 */
export async function createCategoria(nombre, vertical = 'products') {
  const limpio = String(nombre || '').trim();
  if (!limpio) throw new Error('El nombre de la categoría es obligatorio');

  // Token del usuario logueado (para que el API Route valide su rol admin)
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

  return data; // { id, nombre, slug }
}

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================
export default {
  getProducts,
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  searchProducts,
  getRelatedProducts,
  getProductsByPriceRange,
  getTopSellingProducts,
  getCategoriesWithCount,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductsPaginated,
  getProductCategories,
  getProductsStats
};