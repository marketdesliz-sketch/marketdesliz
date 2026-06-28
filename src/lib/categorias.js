// src/lib/categorias.js
// ============================================================
// CATEGORÍAS - VERSIÓN ÚNICA
// Estática + Dinámica (sincronizada con PocketBase)
// ============================================================

import pb from './pocketbase';
// Importar la estructura del mega menú desde config/categorias
import { CATEGORIAS as CATEGORIAS_MEGA_MENU } from '../config/categorias';

// ============================================================
// ESTRUCTURA ESTÁTICA (RESPALDO)
// ============================================================

export const CATEGORIAS_ESTATICAS = {
  // PRODUCTOS
  productos: {
    nombre: 'PRODUCTOS',
    slug: 'productos',
    icono: 'Package',
    subcategorias: {
      electronicos: {
        nombre: 'ELECTRÓNICOS',
        slug: 'electronicos',
        items: ['Teléfonos', 'Tablets', 'Audífonos', 'Parlantes', 'Accesorios']
      },
      computacion: {
        nombre: 'COMPUTACIÓN',
        slug: 'computacion',
        items: ['Laptops', 'PC Escritorio', 'Monitores', 'Teclados', 'Mouse']
      },
      hogar: {
        nombre: 'HOGAR',
        slug: 'hogar',
        items: ['Línea Blanca', 'Muebles', 'Decoración', 'Organización', 'Jardín']
      },
      cocina: {
        nombre: 'COCINA',
        slug: 'cocina',
        items: ['Utensilios', 'Electrodomésticos', 'Vajilla', 'Cubiertos', 'Ollas']
      },
      cortinas: {
        nombre: 'CORTINAS',
        slug: 'cortinas',
        items: ['Roller', 'Blackout', 'Panel Japonés', 'Tela', 'Verticales']
      },
      sabanas: {
        nombre: 'SÁBANAS',
        slug: 'sabanas',
        items: ['Matrimonial', 'Queen', 'King', 'Individual', 'Microfibra']
      },
      almohadas: {
        nombre: 'ALMOHADAS',
        slug: 'almohadas',
        items: ['Viscoelástica', 'Pluma', 'Látex', 'Poliéster', 'Ortopédica']
      },
      colchones: {
        nombre: 'COLCHONES',
        slug: 'colchones',
        items: ['Matrimonial', 'Queen', 'King', 'Individual', 'Pocket Spring']
      }
    }
  },
  // USO PERSONAL
  usoPersonal: {
    nombre: 'USO PERSONAL',
    slug: 'uso-personal',
    icono: 'User',
    subcategorias: {
      belleza: {
        nombre: 'BELLEZA',
        slug: 'belleza',
        items: ['Maquillaje', 'Cuidado Facial', 'Perfumería', 'Cuidado Capilar']
      },
      salud: {
        nombre: 'SALUD',
        slug: 'salud',
        items: ['Vitaminas', 'Equipo Médico', 'Cuidado Personal']
      },
      moda: {
        nombre: 'MODA',
        slug: 'moda',
        items: ['Ropa Mujer', 'Ropa Hombre', 'Calzado', 'Accesorios']
      }
    }
  },
  // GANADO
  ganado: {
    nombre: 'GANADO',
    slug: 'ganado',
    icono: 'Tractor',
    subcategorias: {
      alimentacion: {
        nombre: 'ALIMENTACIÓN',
        slug: 'alimentacion',
        items: ['Alimento para Ganado', 'Suplementos', 'Vitaminas']
      },
      saludAnimal: {
        nombre: 'SALUD ANIMAL',
        slug: 'salud-animal',
        items: ['Vacunas', 'Medicinas', 'Equipo Veterinario']
      },
      equipo: {
        nombre: 'EQUIPO',
        slug: 'equipo',
        items: ['Bebederos', 'Comederos', 'Cercas Eléctricas']
      }
    }
  },
  // INSTRUMENTOS
  instrumentos: {
    nombre: 'INSTRUMENTOS',
    slug: 'instrumentos',
    icono: 'Guitar',
    subcategorias: {
      musicales: {
        nombre: 'MUSICALES',
        slug: 'musicales',
        items: ['Guitarras', 'Baterías', 'Teclados', 'Amplificadores', 'Violines']
      },
      medicion: {
        nombre: 'MEDICIÓN',
        slug: 'medicion',
        items: ['Niveles', 'Medidores', 'Básculas']
      }
    }
  },
  // TANDAS
  tandas: {
    nombre: 'TANDAS',
    slug: 'tandas',
    icono: 'Users',
    subcategorias: {
      disponibles: {
        nombre: 'DISPONIBLES',
        slug: 'disponibles',
        items: ['Tanda Electrónica', 'Tanda Hogar', 'Tanda Libre']
      },
      misTandas: {
        nombre: 'MIS TANDAS',
        slug: 'mis-tandas',
        items: ['Activas', 'Completadas', 'Pendientes']
      }
    }
  },
  // OFERTAS
  ofertas: {
    nombre: 'OFERTAS',
    slug: 'ofertas',
    icono: 'Tag',
    subcategorias: {
      delDia: {
        nombre: 'DEL DÍA',
        slug: 'del-dia',
        items: ['Descuentos Especiales', '2x1', 'Liquidación']
      }
    }
  },
  // CATÁLOGOS
  catalogos: {
    nombre: 'CATÁLOGOS',
    slug: 'catalogos',
    icono: 'BookOpen',
    subcategorias: {
      digitales: {
        nombre: 'DIGITALES',
        slug: 'digitales',
        items: ['Catálogo General', 'Catálogo Tandas', 'Promociones']
      }
    }
  },
  // TEMPORADA
  temporada: {
    nombre: 'TEMPORADA',
    slug: 'temporada',
    icono: 'Calendar',
    subcategorias: {
      actual: {
        nombre: 'ACTUAL',
        slug: 'actual',
        items: ['Día de Muertos', 'Navidad', 'Fin de Año']
      }
    }
  },
  // VER MÁS
  verMas: {
    nombre: 'VER MÁS',
    slug: 'ver-mas',
    icono: 'MoreHorizontal',
    subcategorias: {
      servicios: {
        nombre: 'SERVICIOS',
        slug: 'servicios',
        items: ['Envíos', 'Garantías', 'Soporte', 'Mantenimiento']
      }
    }
  }
};

// ============================================================
// MENÚ SUPERIOR (estático + dinámico)
// ============================================================

export const MENU_SUPERIOR_ESTATICO = [
  { nombre: 'Inicio', url: '/', slug: 'inicio' },
  { nombre: 'Productos', url: '/productos', slug: 'productos' },
  { nombre: 'USO Personal', url: '/uso-personal', slug: 'uso-personal' },
  { nombre: 'Ganado', url: '/ganado', slug: 'ganado' },
  { nombre: 'Instrumentos', url: '/instrumentos', slug: 'instrumentos' },
  { nombre: 'Tandas', url: '/tandas', slug: 'tandas' },
  { nombre: 'Ofertas', url: '/ofertas', slug: 'ofertas' },
  { nombre: 'Catálogos', url: '/catalogos', slug: 'catalogos' },
  { nombre: 'Temporada', url: '/temporada', slug: 'temporada' },
  { nombre: 'Ver Más', url: '/ver-mas', slug: 'ver-mas' }
];

// ============================================================
// FUNCIONES DINÁMICAS (PocketBase)
// ============================================================

let cacheCategorias = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Sincronizar categorías estáticas con PocketBase
 * Crea las categorías en PB si no existen
 */
export async function sincronizarCategoriasConPB() {
  try {
    console.log('🔄 Sincronizando categorías (estructura estática)...');

    for (const [key, categoria] of Object.entries(CATEGORIAS_ESTATICAS)) {
      let existente;
      try {
        existente = await pb.collection('categorias').getFirstListItem(`slug="${categoria.slug}"`);
      } catch {
        existente = null;
      }

      if (!existente) {
        const nuevaCategoria = await pb.collection('categorias').create({
          nombre: categoria.nombre,
          slug: categoria.slug,
          icono: categoria.icono || 'Package',
          orden: Object.keys(CATEGORIAS_ESTATICAS).indexOf(key) + 1,
          activo: true
        });
        console.log(`✅ Categoría creada: ${categoria.nombre}`);

        for (const [subKey, subcategoria] of Object.entries(categoria.subcategorias || {})) {
          try {
            await pb.collection('categorias').getFirstListItem(`slug="${subcategoria.slug}"`);
          } catch {
            await pb.collection('categorias').create({
              nombre: subcategoria.nombre,
              slug: subcategoria.slug,
              categoriaPadreId: nuevaCategoria.id,
              icono: 'Folder',
              orden: Object.keys(categoria.subcategorias).indexOf(subKey) + 1,
              activo: true
            });
            console.log(`  ✅ Subcategoría creada: ${subcategoria.nombre}`);
          }
        }
      }
    }

    console.log('🎉 Sincronización (estática) completada');
    return true;
  } catch (error) {
    console.error('❌ Error sincronizando categorías estáticas:', error);
    return false;
  }
}

/**
 * Sincronizar el mega menú (estructura con sections)
 * Usa la estructura definida en config/categorias.js
 */
export async function sincronizarMegaMenuCategorias() {
  console.log('🔄 Sincronizando mega menú categorías...');

  try {
    for (const [key, categoria] of Object.entries(CATEGORIAS_MEGA_MENU)) {
      // Solo procesar categorías que tengan sections (mega menú)
      if (!categoria.sections) continue;

      // 1. Crear/actualizar la sección principal
      let seccion = await pb.collection('categorias').getFirstListItem(`slug="${categoria.slug}"`).catch(() => null);
      if (!seccion) {
        seccion = await pb.collection('categorias').create({
          nombre: categoria.nombre,
          slug: categoria.slug,
          icono: categoria.icono || 'Package',
          orden: Object.keys(CATEGORIAS_MEGA_MENU).indexOf(key) + 1,
          activo: true,
          categoriaPadreId: null
        });
        console.log(`✅ Sección creada: ${categoria.nombre}`);
      } else {
        // Actualizar si es necesario
        await pb.collection('categorias').update(seccion.id, {
          nombre: categoria.nombre,
          icono: categoria.icono || 'Package',
          activo: true
        });
        console.log(`🔄 Sección actualizada: ${categoria.nombre}`);
      }

      // 2. Procesar cada subcategoría (categories dentro de sections)
      for (const section of categoria.sections) {
        for (const cat of section.categories) {
          // cat.name es el nombre de la subcategoría (ej. "Ventilación")
          const slugSub = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[\/]/g, '');
          let subcat = await pb.collection('categorias').getFirstListItem(`slug="${slugSub}"`).catch(() => null);

          if (!subcat) {
            subcat = await pb.collection('categorias').create({
              nombre: cat.name,
              slug: slugSub,
              icono: 'Folder',
              orden: 0,
              activo: true,
              categoriaPadreId: seccion.id
            });
            console.log(`  ✅ Subcategoría creada: ${cat.name}`);
          } else {
            // Asegurar que esté vinculada a la sección correcta
            if (subcat.categoriaPadreId !== seccion.id) {
              await pb.collection('categorias').update(subcat.id, {
                categoriaPadreId: seccion.id
              });
              console.log(`  🔄 Subcategoría reasignada: ${cat.name}`);
            }
          }
        }
      }
    }
    console.log('🎉 Sincronización del mega menú completada');
    return true;
  } catch (error) {
    console.error('❌ Error sincronizando mega menú:', error);
    return false;
  }
}

/**
 * Sincronizar todas las categorías (ambas estructuras)
 * Útil para ejecutar una sincronización completa
 */
export async function sincronizarTodasCategorias() {
  try {
    const estatica = await sincronizarCategoriasConPB();
    const mega = await sincronizarMegaMenuCategorias();
    return estatica && mega;
  } catch (error) {
    console.error('❌ Error en sincronización completa:', error);
    return false;
  }
}

/**
 * Obtener todas las categorías (con caché)
 */
export async function getCategorias(forceRefresh = false) {
  const ahora = Date.now();
  const cacheValido = cacheCategorias && (ahora - cacheTimestamp) < CACHE_DURATION;

  if (cacheValido && !forceRefresh) {
    return cacheCategorias;
  }

  try {
    const categorias = await pb.collection('categorias').getFullList({
      sort: 'orden',
      filter: 'activo = true'
    });

    cacheCategorias = categorias;
    cacheTimestamp = ahora;
    return categorias;
  } catch (error) {
    console.error('Error cargando categorías de PB:', error);
    return convertirEstructuraEstaticaACategorias();
  }
}

/**
 * Alias de getCategorias para compatibilidad con categoriasService
 */
export const fetchCategorias = getCategorias;

/**
 * Convertir estructura estática a formato PocketBase
 */
function convertirEstructuraEstaticaACategorias() {
  const categorias = [];
  let orden = 1;

  for (const [key, cat] of Object.entries(CATEGORIAS_ESTATICAS)) {
    categorias.push({
      id: `static_${key}`,
      nombre: cat.nombre,
      slug: cat.slug,
      icono: cat.icono || 'Package',
      orden: orden++,
      activo: true,
      esEstatica: true
    });

    for (const [subKey, subCat] of Object.entries(cat.subcategorias || {})) {
      categorias.push({
        id: `static_${key}_${subKey}`,
        nombre: subCat.nombre,
        slug: subCat.slug,
        categoriaPadreId: `static_${key}`,
        icono: 'Folder',
        orden: orden++,
        activo: true,
        esEstatica: true
      });
    }
  }

  return categorias;
}

/**
 * Obtener menú superior (combina estático + dinámico)
 */
export async function getMenuSuperior() {
  try {
    const categoriasPB = await getCategorias();
    const categoriasPrincipales = categoriasPB.filter(c => !c.categoriaPadreId);

    if (categoriasPrincipales.length > 0) {
      return categoriasPrincipales.map(cat => ({
        nombre: cat.nombre,
        url: `/${cat.slug}`,
        slug: cat.slug,
        icono: cat.icono
      }));
    }
  } catch (error) {
    console.error('Error obteniendo menú de PB:', error);
  }

  return MENU_SUPERIOR_ESTATICO;
}

/**
 * Obtener subcategorías de una categoría (por slug)
 */
export async function getSubcategorias(categoriaSlug) {
  try {
    let categoriaPadre;
    try {
      categoriaPadre = await pb.collection('categorias').getFirstListItem(`slug="${categoriaSlug}"`);
    } catch {
      const estatica = CATEGORIAS_ESTATICAS[categoriaSlug];
      if (estatica && estatica.subcategorias) {
        return Object.entries(estatica.subcategorias).map(([key, sub]) => ({
          id: `static_${categoriaSlug}_${key}`,
          nombre: sub.nombre,
          slug: sub.slug,
          items: sub.items || []
        }));
      }
      return [];
    }

    const subcategorias = await pb.collection('categorias').getFullList({
      filter: `categoriaPadreId = "${categoriaPadre.id}" && activo = true`,
      sort: 'orden'
    });
    return subcategorias;
  } catch (error) {
    console.error('Error obteniendo subcategorías:', error);
    return [];
  }
}

/**
 * Obtener subcategorías por ID de categoría (para compatibilidad con categoriasService)
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
 * Obtener categoría por slug (desde PocketBase)
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
 * Obtener items de una subcategoría (desde estática)
 */
export function getItemsSubcategoria(categoriaSlug, subcategoriaSlug) {
  const categoria = CATEGORIAS_ESTATICAS[categoriaSlug];
  if (categoria && categoria.subcategorias) {
    const subcategoria = Object.values(categoria.subcategorias).find(
      sub => sub.slug === subcategoriaSlug
    );
    return subcategoria?.items || [];
  }
  return [];
}

// ============================================================
// FUNCIONES SÍNCRONAS (para uso en componentes sin async)
// ============================================================

export const CATEGORIAS = CATEGORIAS_ESTATICAS;
export const MENU_SUPERIOR = MENU_SUPERIOR_ESTATICO;

export function getCategoriaBySlug(slug) {
  return CATEGORIAS_ESTATICAS[slug] || null;
}

export function getSubcategoriaBySlug(categoriaSlug, subcategoriaSlug) {
  const categoria = CATEGORIAS_ESTATICAS[categoriaSlug];
  if (categoria && categoria.subcategorias) {
    return categoria.subcategorias[subcategoriaSlug] || null;
  }
  return null;
}

export function getNombreCategoria(slug) {
  const categoria = CATEGORIAS_ESTATICAS[slug];
  return categoria ? categoria.nombre : slug;
}