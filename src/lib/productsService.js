import pb from './pocketbase';

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
  let imageUrl = null;
  if (record.imagen) {
    imageUrl = pb.files.getURL(record, record.imagen);
  }
  
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
// CREAR/ACTUALIZAR PRODUCTO (para admin)
// ============================================
export async function createProduct(data) {
  try {
    const formData = new FormData();
    
    formData.append('nombre', data.nombre);
    formData.append('descripcion', data.descripcion || '');
    formData.append('precio', parseFloat(data.precio));
    formData.append('enganche', parseFloat(data.enganche) || 0);
    formData.append('pagoSemanal', parseFloat(data.pagoSemanal) || 0);
    formData.append('semanas', parseInt(data.semanas) || 12);
    formData.append('categoria', data.categoria.toLowerCase().trim());
    formData.append('subcategoria', data.subcategoria || '');
    formData.append('stock', parseInt(data.stock) || 0);
    formData.append('activo', data.activo === true);
    formData.append('nuevo', true);
    
    if (data.imagen) {
      formData.append('imagen', data.imagen);
    }
    
    const record = await pb.collection('products').create(formData);
    console.log(`✅ Producto creado: ${record.nombre}`);
    return formatProduct(record);
  } catch (error) {
    console.error('❌ Error creando producto:', error);
    throw error;
  }
}

export async function updateProduct(id, data) {
  try {
    const formData = new FormData();
    
    formData.append('nombre', data.nombre);
    formData.append('descripcion', data.descripcion || '');
    formData.append('precio', parseFloat(data.precio));
    formData.append('enganche', parseFloat(data.enganche) || 0);
    formData.append('pagoSemanal', parseFloat(data.pagoSemanal) || 0);
    formData.append('semanas', parseInt(data.semanas) || 12);
    formData.append('categoria', data.categoria.toLowerCase().trim());
    formData.append('subcategoria', data.subcategoria || '');
    formData.append('stock', parseInt(data.stock) || 0);
    formData.append('activo', data.activo === true);
    
    if (data.imagen && typeof data.imagen !== 'string') {
      formData.append('imagen', data.imagen);
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
