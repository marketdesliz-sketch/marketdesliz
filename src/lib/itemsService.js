// src/lib/itemsService.js
import pb from './pocketbase';

const categoryMapping = {
  'productos': null,
  'uso-personal': 'ropa',
  'ganado': 'ganado',
  'instrumentos': 'instrumentos',
  'tandas': null,
  'servicios': 'servicios'
};

/**
 * Obtener items por tipo
 */
export async function getItemsByType(tipo, filters = {}) {
  if (tipo === 'tandas') {
    return await getTandas(filters);
  }

  const categoriaFiltro = categoryMapping[tipo];
  
  let filter = 'activo = true';
  if (categoriaFiltro) {
    filter += ` && categoria = "${categoriaFiltro}"`;
  }
  if (filters.categoria) {
    filter += ` && categoria = "${filters.categoria}"`;
  }
  if (filters.subcategoria) {
    filter += ` && subcategoria = "${filters.subcategoria}"`;
  }
  if (filters.busqueda) {
    filter += ` && (nombre ~ "${filters.busqueda}" || descripcion ~ "${filters.busqueda}")`;
  }

  try {
    const records = await pb.collection('products').getFullList({
      filter,
      sort: filters.sort || '-created'
    });

    return records.map(item => normalizeProduct(item, tipo));
  } catch (error) {
    console.error(`Error cargando ${tipo}:`, error);
    return [];
  }
}

/**
 * Obtener tandas
 */
async function getTandas(filters = {}) {
  let filter = 'activa = true';
  if (filters.estado) {
    filter += ` && estado = "${filters.estado}"`;
  }

  try {
    const records = await pb.collection('tandas').getFullList({
      filter,
      sort: '-created'
    });

    return records.map(tanda => ({
      id: tanda.id,
      nombre: tanda.nombre,
      descripcion: tanda.descripcion || '',
      monto: tanda.montoTotal || tanda.monto || 0,
      montoCuota: tanda.montoCuota || 0,
      cupoMaximo: tanda.cupoMaximo || tanda.totalMembers || 0,
      miembrosActuales: tanda.miembrosActuales || 0,
      frecuencia: tanda.frecuencia || tanda.frequency || 'semanal',
      diaCobro: tanda.diaPago || tanda.collectionDay || 'Lunes',
      gasFee: tanda.gasFee || 25,
      estado: tanda.estado,
      nivelRequerido: tanda.nivelRequerido || 0,
      productosRequeridos: tanda.productosRequeridos || 0,
      tipo: 'tandas'
    }));
  } catch (error) {
    console.error('Error cargando tandas:', error);
    return [];
  }
}

/**
 * Normalizar producto
 */
function normalizeProduct(item, tipo) {
  return {
    id: item.id,
    nombre: item.nombre || 'Sin nombre',
    descripcion: item.descripcion || '',
    precio: item.precio || 0,
    enganche: item.enganche || 0,
    pagoSemanal: item.pagoSemanal || 0,
    semanas: item.semanas || 12,
    categoria: item.categoria || '',
    subcategoria: item.subcategoria || '',
    imagen: item.imagen ? pb.files.getURL(item, item.imagen) : null,
    stock: item.stock || 0,
    agotado: item.stock === 0,
    nuevo: item.nuevo || false,
    sku: item.sku || '',
    tipo: tipo
  };
}

/**
 * Obtener item por ID
 */
export async function getItemById(id, tipo = 'productos') {
  try {
    if (tipo === 'tandas') {
      const tanda = await pb.collection('tandas').getOne(id);
      return {
        id: tanda.id,
        nombre: tanda.nombre,
        descripcion: tanda.descripcion || '',
        monto: tanda.montoTotal || tanda.monto || 0,
        montoCuota: tanda.montoCuota || 0,
        cupoMaximo: tanda.cupoMaximo || tanda.totalMembers || 0,
        miembrosActuales: tanda.miembrosActuales || 0,
        frecuencia: tanda.frecuencia || tanda.frequency || 'semanal',
        diaCobro: tanda.diaPago || tanda.collectionDay || 'Lunes',
        gasFee: tanda.gasFee || 25,
        estado: tanda.estado,
        nivelRequerido: tanda.nivelRequerido || 0,
        tipo: 'tandas'
      };
    }

    const product = await pb.collection('products').getOne(id);
    return normalizeProduct(product, tipo);
  } catch (error) {
    console.error('Error obteniendo item por ID:', error);
    return null;
  }
}

/**
 * Obtener productos por categoría
 */
export async function getProductsByCategory(categoria, filters = {}) {
  let filter = `activo = true && categoria = "${categoria}"`;
  
  if (filters.subcategoria) {
    filter += ` && subcategoria = "${filters.subcategoria}"`;
  }
  if (filters.precioMin) {
    filter += ` && precio >= ${filters.precioMin}`;
  }
  if (filters.precioMax) {
    filter += ` && precio <= ${filters.precioMax}`;
  }

  try {
    const records = await pb.collection('products').getFullList({
      filter,
      sort: filters.sort || '-created'
    });

    return records.map(item => normalizeProduct(item, 'productos'));
  } catch (error) {
    console.error('Error obteniendo productos por categoría:', error);
    return [];
  }
}

/**
 * Obtener productos destacados (más vendidos o con stock)
 */
export async function getFeaturedProducts(limit = 8) {
  try {
    const records = await pb.collection('products').getFullList({
      filter: 'activo = true && stock > 0',
      sort: '-created',
      limit: limit
    });

    return records.map(item => normalizeProduct(item, 'productos'));
  } catch (error) {
    console.error('Error obteniendo productos destacados:', error);
    return [];
  }
}

/**
 * Obtener productos nuevos
 */
export async function getNewProducts(limit = 8) {
  try {
    const records = await pb.collection('products').getFullList({
      filter: 'activo = true && nuevo = true',
      sort: '-created',
      limit: limit
    });

    return records.map(item => normalizeProduct(item, 'productos'));
  } catch (error) {
    console.error('Error obteniendo productos nuevos:', error);
    return [];
  }
}

/**
 * Obtener productos recomendados
 */
export async function getRecommendedProducts(limit = 4) {
  try {
    const records = await pb.collection('products').getFullList({
      filter: 'activo = true && stock > 0',
      sort: '-created',
      limit: limit
    });

    return records.map(item => normalizeProduct(item, 'productos'));
  } catch (error) {
    console.error('Error obteniendo productos recomendados:', error);
    return [];
  }
}

/**
 * Buscar productos por término
 */
export async function searchProducts(query, limit = 20) {
  try {
    const filter = `activo = true && (nombre ~ "${query}" || descripcion ~ "${query}" || sku ~ "${query}")`;
    
    const records = await pb.collection('products').getFullList({
      filter,
      sort: '-created',
      limit: limit
    });

    return records.map(item => normalizeProduct(item, 'productos'));
  } catch (error) {
    console.error('Error buscando productos:', error);
    return [];
  }
}