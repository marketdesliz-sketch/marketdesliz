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
  // Función auxiliar para obtener URL de un campo de imagen (soporta string o array)
  const getImageUrl = (fileField) => {
    if (!fileField) return null;
    // Si es un string (nombre de archivo), lo usamos directamente
    if (typeof fileField === 'string') return pb.files.getURL(record, fileField);
    // Si es un array, tomamos el primer elemento (que puede ser string u objeto)
    if (Array.isArray(fileField) && fileField.length > 0) {
      const first = fileField[0];
      if (typeof first === 'string') return pb.files.getURL(record, first);
      if (typeof first === 'object' && first !== null) return pb.files.getURL(record, first);
    }
    return null;
  };

  // Intentar obtener imagen principal; si no, la primera de imagenes
  const imageUrl = getImageUrl(record.imagen) || getImageUrl(record.imagenes);

  return {
    id: record.id,
    nombre: record.nombre || '',
    descripcion: record.descripcion || '',
    precio: record.precio || 0,
    precioContado: Math.round((record.precio || 0) * 2 / 3),
    enganche: record.enganche || Math.round((record.precio || 0) * 0.15),
    pagoSemanal: record.pagoSemanal || Math.round((record.precio || 0) * 0.05),
    semanas: record.semanas || 12,
    frecuenciaPago: record.frecuenciaPago || 'semanal',
    categoria: record.categoria || '',
    subcategoria: record.subcategoria || '',
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
    console.log('📦 Cargando productos desde PocketBase...');

    const records = await pb.collection('products').getFullList({
      filter: 'activo = true',
      sort: '-created'
    });

    console.log(`✅ ${records.length} productos cargados`);
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
    const record = await pb.collection('products').getOne(id);
    return formatProduct(record);
  } catch (error) {
    console.error('❌ Error obteniendo producto por ID:', error);
    return null;
  }
}

// ============================================
// OBTENER PRODUCTOS POR CATEGORÍA (MEJORADO)
// ============================================
export async function getProductsByCategory(categoria, limit = null) {
  try {
    if (!categoria || categoria === 'todos' || categoria === 'Todas') {
      return await getProducts();
    }

    // Normalizar el nombre de la categoría
    const categoriaNormalizada = escapeFilterValue(categoria.toLowerCase().trim());

    console.log(`📂 Filtrando productos por categoría: "${categoriaNormalizada}"`);

    const options = {
      filter: `categoria = "${categoriaNormalizada}" && activo = true`,
      sort: '-created'
    };

    if (limit) options.limit = limit;

    const records = await pb.collection('products').getFullList(options);

    console.log(`✅ ${records.length} productos en categoría ${categoriaNormalizada}`);
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
      limit: limit
    });

    console.log(`⭐ ${records.length} productos destacados cargados`);
    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error obteniendo productos destacados:', error);
    return [];
  }
}

// ============================================
// BUSCAR PRODUCTOS (MEJORADO - PROFESIONAL)
// ============================================
export async function searchProducts(query, categoria = null, filtros = {}) {
  try {
    // Caso: Sin búsqueda, solo filtrar por categoría
    if ((!query || query.trim() === '') && categoria && categoria !== 'todos') {
      return await getProductsByCategory(categoria);
    }

    // Caso: Sin búsqueda ni categoría, traer todos
    if (!query || query.trim() === '') {
      return await getProducts();
    }

    // Normalizar la búsqueda
    const searchTerm = escapeFilterValue(query.trim().toLowerCase());

    // Construir filtro base
    let filter = `activo = true && (nombre ~ "${searchTerm}" || descripcion ~ "${searchTerm}" || sku ~ "${searchTerm}")`;

    // Agregar filtro de categoría si viene
    if (categoria && categoria !== 'todos') {
      filter += ` && categoria = "${categoria}"`;
    }

    // Agregar filtro de precio máximo
    if (filtros.precioMax && filtros.precioMax > 0) {
      filter += ` && precio <= ${filtros.precioMax}`;
    }

    // Agregar filtro de solo disponibles
    if (filtros.soloDisponibles) {
      filter += ` && stock > 0`;
    }

    console.log(`🔍 Buscando: "${query}" | Filtro: ${filter}`);

    const records = await pb.collection('products').getFullList({
      filter: filter,
      sort: '-created'
    });

    console.log(`✅ Encontrados ${records.length} productos para "${query}"`);
    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error buscando productos:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTOS RELACIONADOS
// ============================================
export async function getRelatedProducts(productId, categoria, limit = 6) {
  try {
    if (!categoria) return [];

    const records = await pb.collection('products').getFullList({
      filter: `categoria = "${escapeFilterValue(categoria)}" && id != "${productId}" && activo = true`,
      sort: '-created',
      limit: limit
    });

    console.log(`🔗 ${records.length} productos relacionados encontrados`);
    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error obteniendo productos relacionados:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTOS POR RANGO DE PRECIO
// ============================================
export async function getProductsByPriceRange(minPrice, maxPrice, categoria = null) {
  try {
    let filter = `activo = true && precio >= ${minPrice} && precio <= ${maxPrice}`;

    if (categoria && categoria !== 'todos') {
      filter += ` && categoria = "${escapeFilterValue(categoria)}"`;
    }

    const records = await pb.collection('products').getFullList({
      filter: filter,
      sort: 'precio'
    });

    return records.map(formatProduct);
  } catch (error) {
    console.error('❌ Error filtrando por precio:', error);
    return [];
  }
}

// ============================================
// OBTENER PRODUCTOS MÁS VENDIDOS (para analytics)
// ============================================
export async function getTopSellingProducts(limit = 10) {
  try {
    // Esto requiere que tengas un campo 'ventas' o similar
    // Por ahora, retorna los más recientes
    const records = await pb.collection('products').getFullList({
      filter: 'activo = true',
      sort: '-created',
      limit: limit
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
    const productos = await pb.collection('products').getFullList({
      filter: 'activo = true'
    });

    const conteo = {};
    productos.forEach(p => {
      if (p.categoria) {
        conteo[p.categoria] = (conteo[p.categoria] || 0) + 1;
      }
    });

    return Object.entries(conteo).map(([nombre, count]) => ({
      nombre,
      slug: nombre.toLowerCase().replace(/\s+/g, '-'),
      count
    })).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('❌ Error obteniendo conteo de categorías:', error);
    return [];
  }
}

// ============================================
// CREAR PRODUCTO (VERSIÓN MEJORADA)
// ============================================
export async function createProduct(data) {
  try {
    const formData = new FormData();

    // Campos obligatorios
    formData.append('nombre', data.nombre);
    formData.append('precio', parseFloat(data.precio));
    formData.append('enganche', parseFloat(data.enganche) || 0);
    formData.append('pagoSemanal', parseFloat(data.pagoSemanal) || 0);
    formData.append('semanas', parseInt(data.semanas) || 12);
    formData.append('categoria', data.categoria.toLowerCase().trim());
    formData.append('activo', data.activo === true);

    // Campos opcionales
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.subcategoria) formData.append('subcategoria', data.subcategoria);
    if (data.stock !== undefined) formData.append('stock', parseInt(data.stock) || 0);
    if (data.sku) formData.append('sku', data.sku);
    if (data.costo !== undefined) formData.append('costo', parseFloat(data.costo) || 0);
    if (data.diasEntrega !== undefined) formData.append('diasEntrega', parseInt(data.diasEntrega) || 1);
    if (data.nuevo !== undefined) formData.append('nuevo', data.nuevo === true);

    // Imagen principal
    if (data.imagen) {
      formData.append('imagen', data.imagen);
    }

    // Múltiples imágenes
    if (data.imagenes && Array.isArray(data.imagenes) && data.imagenes.length > 0) {
      data.imagenes.forEach(file => {
        formData.append('imagenes', file);
      });
    }

    const record = await pb.collection('products').create(formData);
    console.log(`✅ Producto creado: ${record.nombre}`);
    return formatProduct(record);
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    throw error;
  }
}

// ============================================
// ACTUALIZAR PRODUCTO (VERSIÓN MEJORADA)
// ============================================
export async function updateProduct(id, data) {
  try {
    const formData = new FormData();

    // Campos obligatorios
    formData.append('nombre', data.nombre);
    formData.append('precio', parseFloat(data.precio));
    formData.append('enganche', parseFloat(data.enganche) || 0);
    formData.append('pagoSemanal', parseFloat(data.pagoSemanal) || 0);
    formData.append('semanas', parseInt(data.semanas) || 12);
    formData.append('categoria', data.categoria.toLowerCase().trim());
    formData.append('activo', data.activo === true);

    // Campos opcionales
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.subcategoria) formData.append('subcategoria', data.subcategoria);
    if (data.stock !== undefined) formData.append('stock', parseInt(data.stock) || 0);
    if (data.sku) formData.append('sku', data.sku);
    if (data.costo !== undefined) formData.append('costo', parseFloat(data.costo) || 0);
    if (data.diasEntrega !== undefined) formData.append('diasEntrega', parseInt(data.diasEntrega) || 1);
    if (data.nuevo !== undefined) formData.append('nuevo', data.nuevo === true);

    // Imagen principal (si es un archivo nuevo, no una URL)
    if (data.imagen && typeof data.imagen !== 'string') {
      formData.append('imagen', data.imagen);
    }

    // Múltiples imágenes
    if (data.imagenes && Array.isArray(data.imagenes) && data.imagenes.length > 0) {
      data.imagenes.forEach(file => {
        formData.append('imagenes', file);
      });
    }

    const record = await pb.collection('products').update(id, formData);
    console.log(`✅ Producto actualizado: ${record.nombre}`);
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
    console.log(`✅ Producto ${id} eliminado`);
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

    console.log(`📦 Stock actualizado: ${productId} → ${nuevoStock}`);
    return true;
  } catch (error) {
    console.error('❌ Error actualizando stock:', error);
    return false;
  }
}
// ============================================
// FUNCIONES PARA ADMIN (PAGINACIÓN Y ESTADÍSTICAS)
// ============================================

/**
 * Obtener productos con paginación, búsqueda y filtros (para admin)
 * @param {Object} params
 * @param {number} params.page - Número de página (default: 1)
 * @param {number} params.perPage - Elementos por página (default: 12)
 * @param {string} params.search - Búsqueda por nombre, descripción o SKU
 * @param {string} params.categoria - 'todos' o nombre de categoría
 * @param {string} params.estado - 'todos' | 'activos' | 'inactivos'
 * @param {string} params.sort - Campo de ordenamiento (ej: '-created')
 * @returns {Promise<Object>} { items, totalItems, totalPages, page, perPage }
 */
export async function getProductsPaginated({ page = 1, perPage = ITEMS_PER_PAGE, search = '', categoria = 'todos', estado = 'todos', sort = '-created' } = {}) {
  try {
    let filter = '';

    // Filtro de estado (activo/inactivo/todos)
    if (estado === 'activos') {
      filter = 'activo = true';
    } else if (estado === 'inactivos') {
      filter = 'activo = false';
    }

    // Filtro de categoría
    if (categoria && categoria !== 'todos') {
      const catFilter = `categoria = "${escapeFilterValue(categoria)}"`;
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
      sort: sort
    });

    // Formatear productos (con imágenes)
    const items = result.items.map(record => {
      const formatted = formatProduct(record);
      // Agregar URLs de imágenes adicionales
      if (record.imagenes && Array.isArray(record.imagenes)) {
        formatted.imagenesUrls = record.imagenes.map(img => pb.files.getURL(record, img));
      } else {
        formatted.imagenesUrls = [];
      }
      // Agregar campo costo y diasEntrega
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
 * Obtener lista de categorías de productos (desde PocketBase o fallback)
 * @returns {Promise<Array>} Lista de nombres de categorías
 */
export async function getProductCategories() {
  try {
    // Intentar obtener desde la colección 'categorias' (si existe)
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true',
      sort: 'nombre',
      fields: 'nombre'
    });
    if (categorias.length > 0) {
      const names = categorias.map(c => c.nombre).filter(Boolean);
      // Filtrar duplicados y categorías que no son de productos
      return [...new Set(names)];
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron cargar categorías desde PocketBase, usando fallback');
  }

  // Fallback: extraer categorías únicas de productos existentes
  try {
    const productos = await pb.collection('products').getFullList({
      fields: 'categoria',
      filter: 'activo = true'
    });
    const names = productos.map(p => p.categoria).filter(Boolean);
    return [...new Set(names)].sort();
  } catch (e) {
    console.warn('⚠️ No se pudieron obtener categorías desde productos, usando fallback estático');
  }

  // Fallback final: lista estática de categorías comunes
  return [
    'electronica', 'hogar', 'ropa', 'instrumentos', 'ganado', 'servicios',
    'cortinas', 'sabanas', 'almohadas', 'cubre-salas', 'botes', 'sillas',
    'bancos-plastico', 'baterias-peltre', 'acero-inoxidable', 'vapoderas',
    'sartenes', 'colchones', 'bases-cama', 'cajoneras', 'licuadoras',
    'bocinas', 'mesas', 'batidoras', 'planchas', 'ventiladores', 'anaqueles'
  ];
}

/**
 * Obtener estadísticas generales de productos (para el dashboard de admin)
 * @returns {Promise<Object>} { total, activos, inactivos, categorias }
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

    // Contar categorías únicas (solo de productos activos)
    const productos = await pb.collection('products').getFullList({
      fields: 'categoria',
      filter: 'activo = true'
    });
    const categoriasSet = new Set(productos.map(p => p.categoria).filter(Boolean));

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
  updateStock
};
