// ============================================
// categoriasService.js - Cliente para componentes React
// ============================================

import pb from './pocketbase';

/**
 * Obtener todas las categorías para usar en componentes
 */
export async function fetchCategorias() {
  try {
    const categorias = await pb.collection('categorias').getFullList({
      sort: 'orden',
      filter: 'activo = true'
    });
    return categorias;
  } catch (error) {
    console.error('Error fetching categorias:', error);
    return [];
  }
}

/**
 * Obtener categoría por slug
 */
export async function fetchCategoriaBySlug(slug) {
  try {
    const categoria = await pb.collection('categorias').getFirstListItem(`slug="${slug}"`);
    return categoria;
  } catch {
    return null;
  }
}

/**
 * Obtener subcategorías de una categoría
 */
export async function fetchSubcategorias(categoriaId) {
  try {
    const subcategorias = await pb.collection('categorias').getFullList({
      filter: `categoriaPadreId = "${categoriaId}" && activo = true`,
      sort: 'orden'
    });
    return subcategorias;
  } catch (error) {
    console.error('Error fetching subcategorias:', error);
    return [];
  }
}

/**
 * Sincronizar categorías (ejecutar una vez al inicio)
 */
export async function sincronizarTodasCategorias() {
  try {
    // Importar dinámicamente para evitar circular dependencies
    const { sincronizarCategoriasConPB } = await import('./categorias');
    return await sincronizarCategoriasConPB();
  } catch (error) {
    console.error('Error en sincronización:', error);
    return false;
  }
}
