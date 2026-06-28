// src/config/categorias.js
// ============================================
// CONFIGURACIÓN DE CATEGORÍAS - VERSIÓN MEJORADA
// ============================================
// Esta configuración sincroniza con las colecciones:
// - categorias (tabla principal)
// - subcategorias (relacionadas con categorias)
// - products (contienen categoriaId y subcategoriaId)
// ============================================

export const CATEGORIAS = {
  // ============================================================
  // PRODUCTOS - Categoría principal
  // ============================================================
  productos: {
    id: 'categoria_productos', // ID simulado para referencia
    nombre: "Productos",
    slug: "productos",
    icono: "Package",
    href: "/productos",
    simple: false,
    megaMenu: true,
    // Metadatos adicionales
    descripcion: "Encuentra todo tipo de productos para el hogar, cocina, limpieza y más.",
    imagen: "/images/categorias/productos.jpg",
    activo: true,
    orden: 1,
    // Secciones que agrupan subcategorías (para el mega menú)
    sections: [
      {
        title: "ELECTRODOMÉSTICOS",
        // Cada categoría (subcategoría real) debe coincidir con la colección subcategorias
        categories: [
          { 
            name: "VENTILACIÓN", 
            items: ["Ventilador de Piso", "Ventilador de Pedestal Zfan"],
            baseSlug: "productos/categoria",
            // Podríamos añadir IDs simulados de subcategorías
            subcategoriaId: "sub_ventilacion",
            descripcion: "Ventiladores para todo tipo de espacios."
          },
          { 
            name: "PREPARACIÓN DE ALIMENTOS", 
            items: ["Licuadora Osterizer", "Licuadora de Vaso de Vidrio", "Batidoras"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_preparacion",
            descripcion: "Electrodomésticos para cocinar y preparar alimentos."
          },
          { 
            name: "CUIDADO DEL HOGAR", 
            items: ["Planchas"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_cuidado_hogar",
            descripcion: "Planchas y accesorios para el cuidado de la ropa."
          }
        ]
      },
      {
        title: "HOGAR",
        categories: [
          { 
            name: "DESCANSO", 
            items: ["Colchones", "Almohadas Sognare", "Cobertores Providencia", "Frazadas", "Sábanas Individuales", "Sábanas Matrimoniales", "Sábanas Queen Size", "Sábanas King Size"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_descanso",
            descripcion: "Todo para un buen descanso: colchones, sábanas, almohadas."
          },
          { 
            name: "CORTINAS", 
            items: ["Cortinas para Ventana", "Cortinas para Puerta"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_cortinas",
            descripcion: "Cortinas para todos los ambientes."
          },
          { 
            name: "CUBRESALAS", 
            items: ["Cubre Sala Armado", "Cubre Sala de Avión", "Cubre Sala de Ayacal", "Cubresala Tipo Sábana"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_cubresalas",
            descripcion: "Cubresalas para proteger y decorar tu sala."
          }
        ]
      },
      {
        title: "LIMPIEZA Y ORGANIZACIÓN",
        categories: [
          { 
            name: "ORGANIZACIÓN", 
            items: ["Anaqueles", "Trasteros", "Cajoneras de Plástico", "Cajoneras de Madera"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_organizacion",
            descripcion: "Soluciones de almacenamiento y organización."
          },
          { 
            name: "LAVANDERÍA", 
            items: ["Cestos para Ropa"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_lavanderia",
            descripcion: "Accesorios para lavandería."
          },
          { 
            name: "ALMACENAMIENTO DE AGUA", 
            items: ["Bote para Agua 125L", "Tina 210L", "Tina 400L"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_almacenamiento_agua",
            descripcion: "Depósitos y tinas para almacenar agua."
          }
        ]
      },
      {
        title: "COCINA",
        categories: [
          { 
            name: "BATERÍAS Y OLLAS", 
            items: ["Baterías de Acero Inoxidable", "Baterías de Peltre", "Juego de Cazos"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_baterias",
            descripcion: "Baterías y ollas para cocinar."
          },
          { 
            name: "SARTENES", 
            items: ["Sartenes", "Sartenes de Teflón"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_sartenes",
            descripcion: "Sartenes de diferentes materiales."
          },
          { 
            name: "COCCIÓN", 
            items: ["Vaporera Grande"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_coccion",
            descripcion: "Utensilios para cocción al vapor."
          }
        ]
      },
      {
        title: "MUEBLES Y DECORACIÓN",
        categories: [
          { 
            name: "MESAS", 
            items: ["Mesa de 4 Patas", "Mesa de Portafolio", "Mesa para 6 Personas", "Mesa para 8 Personas"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_mesas",
            descripcion: "Mesas para diferentes usos."
          },
          { 
            name: "SILLAS Y BANCAS", 
            items: ["Sillas de Plástico", "Bancos de Plástico", "Banca Tapizada", "Silla Mecedora de Madera"],
            baseSlug: "productos/categoria",
            subcategoriaId: "sub_sillas",
            descripcion: "Sillas y bancas para todo tipo de espacios."
          }
        ]
      }
    ]
  },

  // ============================================================
  // NEGOCIOS
  // ============================================================
  negocios: {
    id: 'categoria_negocios',
    nombre: "Negocios",
    slug: "negocios",
    icono: "Store",
    href: "/negocios",
    simple: false,
    megaMenu: true,
    descripcion: "Directorio de negocios y servicios profesionales.",
    imagen: "/images/categorias/negocios.jpg",
    activo: true,
    orden: 2,
    sections: [
      {
        title: "ALIMENTACIÓN",
        categories: [
          { 
            name: "ALIMENTACIÓN", 
            items: ["Abarrotes", "Carnicería", "Dulcería", "Frutería / verdulería", "Panadería", "Tortillería", "Pescadería", "Pollería"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_alimentacion",
            descripcion: "Negocios de alimentos y abarrotes."
          }
        ]
      },
      {
        title: "HOGAR Y CONSTRUCCIÓN",
        categories: [
          { 
            name: "HOGAR Y CONSTRUCCIÓN", 
            items: ["Ferretería", "Papelería", "Lavandería / tintorería", "Refaccionaria (auto partes)", "Taller mecánico", "Taller de costura"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_hogar_construccion",
            descripcion: "Servicios para el hogar y construcción."
          }
        ]
      },
      {
        title: "SALUD Y BELLEZA",
        categories: [
          { 
            name: "SALUD Y BELLEZA", 
            items: ["Farmacia", "Estética / salón de belleza", "Barbería / peluquería", "Consultorio médico", "Veterinaria"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_salud_belleza",
            descripcion: "Servicios de salud y estética."
          }
        ]
      },
      {
        title: "MODA Y ACCESORIOS",
        categories: [
          { 
            name: "MODA Y ACCESORIOS", 
            items: ["Tienda de ropa", "Zapatería", "Joyería", "Boutique (ropa)", "Accesorios (bisutería, celulares, etc.)"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_moda_accesorios",
            descripcion: "Tiendas de moda y accesorios."
          }
        ]
      },
      {
        title: "OTROS NEGOCIOS",
        categories: [
          { 
            name: "OTROS NEGOCIOS", 
            items: ["Agencia de viajes", "Cafetería", "Restaurante", "Taquería", "Lonchería", "Antojitos / comida corrida", "Heladería / paletería", "Pastelería", "Florería", "Imprenta", "Ciber (internet)", "Cerrajería"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_otros_negocios",
            descripcion: "Otros tipos de negocios y servicios."
          }
        ]
      },
      {
        title: "SERVICIOS PROFESIONALES",
        categories: [
          { 
            name: "REPARACIONES", 
            items: ["Plomería", "Electricidad", "Carpintería", "Albañilería", "Pintura", "Jardinería"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_reparaciones",
            descripcion: "Servicios de reparación y mantenimiento."
          },
          { 
            name: "TECNOLOGÍA", 
            items: ["Reparación de PCs", "Reparación de Celulares", "Diseño Gráfico", "Programación", "Marketing Digital"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_tecnologia",
            descripcion: "Servicios tecnológicos y digitales."
          }
        ]
      },
      {
        title: "EDUCACIÓN",
        categories: [
          { 
            name: "EDUCACIÓN", 
            items: ["Clases Particulares", "Tutorías", "Cursos Online", "Idiomas", "Música", "Artes"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_educacion",
            descripcion: "Servicios educativos y formativos."
          }
        ]
      },
      {
        title: "MANTENIMIENTO DEL HOGAR",
        categories: [
          { 
            name: "MANTENIMIENTO DEL HOGAR", 
            items: ["Limpieza Profesional", "Mudanzas", "Fumigaciones", "Jardinería", "Piscinas"],
            baseSlug: "negocios/categoria",
            subcategoriaId: "sub_mantenimiento_hogar",
            descripcion: "Servicios de mantenimiento y limpieza."
          }
        ]
      }
    ]
  },

  // ============================================================
  // USO PERSONAL
  // ============================================================
  usoPersonal: {
    id: 'categoria_uso_personal',
    nombre: "Uso Personal",
    slug: "uso-personal",
    icono: "User",
    href: "/uso-personal",
    simple: false,
    megaMenu: true,
    descripcion: "Artículos de uso personal, ropa, accesorios, y cuidado.",
    imagen: "/images/categorias/uso_personal.jpg",
    activo: true,
    orden: 3,
    sections: [
      { 
        title: "ROPA", 
        categories: [
          { 
            name: "HOMBRE", 
            items: ["Camisas", "Sudaderas"],
            baseSlug: "uso-personal/categoria",
            subcategoriaId: "sub_ropa_hombre",
            descripcion: "Ropa para caballero."
          }
        ] 
      },
      { 
        title: "ACCESORIOS", 
        categories: [
          { 
            name: "BOLSOS", 
            items: ["Crossbody", "Crossbody con Diseño", "Bolso Estándar", "Bolso de Mano"],
            baseSlug: "uso-personal/categoria",
            subcategoriaId: "sub_bolsos",
            descripcion: "Bolsos y carteras."
          }
        ] 
      },
      { 
        title: "CUIDADO PERSONAL", 
        categories: [
          { 
            name: "BAÑO", 
            items: ["Toallas"],
            baseSlug: "uso-personal/categoria",
            subcategoriaId: "sub_banio",
            descripcion: "Artículos para el baño."
          }
        ] 
      }
    ]
  },

  // ============================================================
  // GANADO
  // ============================================================
  ganado: {
    id: 'categoria_ganado',
    nombre: "Ganado",
    slug: "ganado",
    icono: "Tractor",
    href: "/ganado",
    simple: false,
    megaMenu: true,
    descripcion: "Animales de granja y ganado.",
    imagen: "/images/categorias/ganado.jpg",
    activo: true,
    orden: 4,
    sections: [
      { 
        title: "AVES", 
        categories: [
          { 
            name: "AVES", 
            items: ["Pollitos", "Gallinas", "Guajolotes", "Patos"],
            baseSlug: "ganado/categoria",
            subcategoriaId: "sub_aves",
            descripcion: "Aves de corral."
          }
        ] 
      },
      { 
        title: "OVINOS Y CAPRINOS", 
        categories: [
          { 
            name: "OVINOS Y CAPRINOS", 
            items: ["Borregos", "Chivos"],
            baseSlug: "ganado/categoria",
            subcategoriaId: "sub_ovinos_caprinos",
            descripcion: "Ovejas y cabras."
          }
        ] 
      },
      { 
        title: "PEQUEÑAS ESPECIES", 
        categories: [
          { 
            name: "PEQUEÑAS ESPECIES", 
            items: ["Conejos"],
            baseSlug: "ganado/categoria",
            subcategoriaId: "sub_pequenas_especies",
            descripcion: "Conejos y otros animales pequeños."
          }
        ] 
      },
      { 
        title: "BOVINOS", 
        categories: [
          { 
            name: "BOVINOS", 
            items: ["Becerros", "Vacas"],
            baseSlug: "ganado/categoria",
            subcategoriaId: "sub_bovinos",
            descripcion: "Ganado bovino."
          }
        ] 
      },
      { 
        title: "PORCINOS", 
        categories: [
          { 
            name: "PORCINOS", 
            items: ["Lechones", "Cerdos"],
            baseSlug: "ganado/categoria",
            subcategoriaId: "sub_porcinos",
            descripcion: "Ganado porcino."
          }
        ] 
      }
    ]
  },

  // ============================================================
  // INSTRUMENTOS
  // ============================================================
  instrumentos: {
    id: 'categoria_instrumentos',
    nombre: "Instrumentos",
    slug: "instrumentos",
    icono: "Guitar",
    href: "/instrumentos",
    simple: false,
    megaMenu: true,
    descripcion: "Instrumentos musicales y accesorios.",
    imagen: "/images/categorias/instrumentos.jpg",
    activo: true,
    orden: 5,
    sections: [
      { 
        title: "MUSICALES", 
        categories: [
          { 
            name: "CUERDAS", 
            items: ["Guitarras", "Violines", "Bajos", "Ukeleles"],
            baseSlug: "instrumentos/categoria",
            subcategoriaId: "sub_cuerdas",
            descripcion: "Instrumentos de cuerda."
          }, 
          { 
            name: "PERCUSIÓN", 
            items: ["Baterías", "Tambores", "Cajones"],
            baseSlug: "instrumentos/categoria",
            subcategoriaId: "sub_percusion",
            descripcion: "Instrumentos de percusión."
          }
        ] 
      },
      { 
        title: "VIENTO", 
        categories: [
          { 
            name: "METALES", 
            items: ["Trompetas", "Saxofones", "Clarinetes", "Flautas"],
            baseSlug: "instrumentos/categoria",
            subcategoriaId: "sub_viento_metal",
            descripcion: "Instrumentos de viento metal."
          }
        ] 
      },
      { 
        title: "EQUIPO", 
        categories: [
          { 
            name: "ACCESORIOS", 
            items: ["Amplificadores", "Cables", "Fundas", "Afinadores"],
            baseSlug: "instrumentos/categoria",
            subcategoriaId: "sub_accesorios_instrumentos",
            descripcion: "Accesorios para instrumentos musicales."
          }
        ] 
      }
    ]
  },

  // ============================================================
  // TANDAS
  // ============================================================
  tandas: {
    id: 'categoria_tandas',
    nombre: "Tandas",
    slug: "tandas",
    icono: "Users",
    href: "/tandas",
    simple: false,
    megaMenu: true,
    descripcion: "Sistema de tandas y ahorro.",
    imagen: "/images/categorias/tandas.jpg",
    activo: true,
    orden: 6,
    sections: [
      { 
        title: "TANDAS ACTIVAS", 
        categories: [
          { 
            name: "POR MONTO", 
            items: ["Tandas de $500", "Tandas de $1000", "Tandas de $2000", "Tandas Personalizadas"],
            baseSlug: "tandas/categoria",
            subcategoriaId: "sub_tandas_monto",
            descripcion: "Tandas según monto."
          }
        ] 
      },
      { 
        title: "REGLAS", 
        categories: [
          { 
            name: "INFORMACIÓN", 
            items: ["Cómo Funcionan", "Requisitos", "Beneficios", "Preguntas Frecuentes"],
            baseSlug: "tandas/categoria",
            subcategoriaId: "sub_tandas_reglas",
            descripcion: "Información sobre las tandas."
          }
        ] 
      },
      { 
        title: "MIS TANDAS", 
        categories: [
          { 
            name: "SEGUIMIENTO", 
            items: ["Mis Inscripciones", "Historial", "Próximos Pagos", "Posiciones"],
            baseSlug: "tandas/categoria",
            subcategoriaId: "sub_tandas_seguimiento",
            descripcion: "Seguimiento de tus tandas."
          }
        ] 
      }
    ]
  },

  // ============================================================
  // SIMPLES (sin mega menú)
  // ============================================================
  bolsaTrabajo: {
    id: 'categoria_bolsa_trabajo',
    nombre: "Bolsa de Trabajo",
    slug: "bolsa-trabajo",
    icono: "Briefcase",
    href: "/bolsa-trabajo",
    simple: true,
    descripcion: "Ofertas de empleo y búsqueda de trabajo.",
    activo: true,
    orden: 7
  },
  catalogos: {
    id: 'categoria_catalogos',
    nombre: "Catálogos",
    slug: "catalogos",
    icono: "BookOpen",
    href: "/catalogos",
    simple: true,
    descripcion: "Catálogos de productos y servicios.",
    activo: true,
    orden: 8
  },
  temporada: {
    id: 'categoria_temporada',
    nombre: "Temporada",
    slug: "temporada",
    icono: "Calendar",
    href: "/temporada",
    simple: true,
    descripcion: "Productos y ofertas de temporada.",
    activo: true,
    orden: 9
  }
};

// ============================================================
// MENÚ SUPERIOR - Orden y configuración
// ============================================================
export const MENU_SUPERIOR = [
  { nombre: "Inicio", href: "/", slug: "inicio", simple: true },
  { nombre: "Productos", href: "/productos", slug: "productos", key: "productos" },
  { nombre: "Negocios", href: "/negocios", slug: "negocios", key: "negocios" },
  { nombre: "Uso Personal", href: "/uso-personal", slug: "uso-personal", key: "usoPersonal" },
  { nombre: "Ganado", href: "/ganado", slug: "ganado", key: "ganado" },
  { nombre: "Instrumentos", href: "/instrumentos", slug: "instrumentos", key: "instrumentos" },
  { nombre: "Tandas", href: "/tandas", slug: "tandas", key: "tandas" },
  { nombre: "Bolsa de Trabajo", href: "/bolsa-trabajo", slug: "bolsa-trabajo", simple: true },
  { nombre: "Catálogos", href: "/catalogos", slug: "catalogos", simple: true },
  { nombre: "Temporada", href: "/temporada", slug: "temporada", simple: true },
  {
    nombre: "Ver Más",
    href: "#",
    slug: "ver-mas",
    submenu: [
      { nombre: "Blog", href: "/blog" },
      { nombre: "Contacto", href: "/contacto" },
      { nombre: "Ayuda", href: "/ayuda" }
    ]
  }
];

// ============================================================
// FUNCIONES DE UTILIDAD (SINCRÓNICAS)
// ============================================================

/**
 * Devuelve el array de items para el menú superior.
 * Esta función es síncrona y usa la estructura estática.
 */
export function getMenuItems() {
  return MENU_SUPERIOR.map(item => {
    if (item.key && CATEGORIAS[item.key]) {
      const categoria = CATEGORIAS[item.key];
      return {
        ...item,
        ...categoria,
        sections: categoria.sections || [],
        megaMenu: categoria.megaMenu || false,
        // Asegurar que los items tengan nombre consistente
        nombre: categoria.nombre || item.nombre
      };
    }
    return item;
  });
}

/**
 * Devuelve las categorías para el sidebar (solo PRODUCTOS).
 * Pero ahora puede incluir más categorías si se desea.
 */
export function getCategoriasParaSidebar() {
  const resultado = [];
  // Podríamos incluir todas las categorías que tengan sections (no simples)
  const categoriasConSecciones = Object.values(CATEGORIAS).filter(cat => cat.sections && cat.sections.length > 0);
  
  categoriasConSecciones.forEach(categoria => {
    const sidebarCategory = {
      name: categoria.nombre,
      subcategories: []
    };
    for (const section of categoria.sections) {
      for (const cat of section.categories) {
        // Evitar duplicados (por nombre de subcategoría)
        if (!sidebarCategory.subcategories.some(sub => sub.name === cat.name)) {
          sidebarCategory.subcategories.push({
            name: cat.name,
            items: cat.items || [],
            // Añadir metadatos adicionales si existen
            descripcion: cat.descripcion,
            subcategoriaId: cat.subcategoriaId,
            baseSlug: cat.baseSlug
          });
        }
      }
    }
    resultado.push(sidebarCategory);
  });
  
  return resultado;
}

/**
 * Obtener la configuración de una categoría por slug.
 */
export function getCategoriaBySlug(slug) {
  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (categoria.slug === slug) {
      return { key, ...categoria };
    }
  }
  return null;
}

/**
 * Obtener las secciones de una categoría para el mega menú.
 */
export function getSectionsForCategory(categoryKey) {
  const categoria = CATEGORIAS[categoryKey];
  return categoria?.sections || [];
}

/**
 * Generar slug a partir de un texto.
 * Mejorado para manejar caracteres especiales y múltiples espacios.
 */
export function generarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-'); // Evitar múltiples guiones
}

/**
 * Construir URL para un item de categoría.
 * Ahora busca en todas las categorías.
 */
export function construirUrl(categoriaSlug, subcategoriaNombre, item) {
  const itemSlug = generarSlug(item);
  // Buscar en todas las categorías
  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    if (categoria.slug === categoriaSlug && categoria.sections) {
      for (const section of categoria.sections) {
        for (const cat of section.categories) {
          if (cat.name === subcategoriaNombre && cat.items.includes(item)) {
            return `/${cat.baseSlug}/${itemSlug}`;
          }
        }
      }
    }
  }
  // Fallback
  return `/${categoriaSlug}/${itemSlug}`;
}

/**
 * Obtener todos los items (productos/nombres) de una categoría para búsquedas.
 */
export function getAllItemsFromCategoria(categoriaSlug) {
  const categoria = getCategoriaBySlug(categoriaSlug);
  if (!categoria || !categoria.sections) return [];
  const items = [];
  for (const section of categoria.sections) {
    for (const cat of section.categories) {
      items.push(...cat.items);
    }
  }
  return items;
}

/**
 * Obtener la subcategoría por nombre dentro de una categoría.
 */
export function getSubcategoriaByName(categoriaSlug, subcategoriaNombre) {
  const categoria = getCategoriaBySlug(categoriaSlug);
  if (!categoria || !categoria.sections) return null;
  for (const section of categoria.sections) {
    for (const cat of section.categories) {
      if (cat.name === subcategoriaNombre) {
        return cat;
      }
    }
  }
  return null;
}

// ============================================================
// COMPATIBILIDAD CON VERSIONES ANTERIORES
// ============================================================
export const CATEGORIAS_ESTATICAS = CATEGORIAS;
export const MENU_SUPERIOR_ESTATICO = MENU_SUPERIOR;
export function getCategoriaBySlugLegacy(slug) {
  return getCategoriaBySlug(slug);
}