// src/lib/syncCategorias.js
import pb from './pocketbase';
import { CATEGORIAS } from '../config/categorias';

export async function sincronizarCategoriasConPB() {
  console.log('🔄 Sincronizando categorías con PocketBase...');

  for (const [key, categoria] of Object.entries(CATEGORIAS)) {
    // Solo sincronizar categorías con megaMenú (tienen sections)
    if (!categoria.sections) continue;

    // 1. Crear/actualizar la categoría principal (sección)
    let seccion = await pb.collection('categorias').getFirstListItem(`slug="${categoria.slug}"`).catch(() => null);
    if (!seccion) {
      seccion = await pb.collection('categorias').create({
        nombre: categoria.nombre,
        slug: categoria.slug,
        icono: categoria.icono || 'Package',
        orden: Object.keys(CATEGORIAS).indexOf(key) + 1,
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

    // 2. Procesar cada sección (sections)
    for (const section of categoria.sections) {
      // Cada section tiene un título (no se usa como categoría) y categories
      for (const cat of section.categories) {
        // cat.name es la subcategoría (ej. "Ventilación")
        // cat.items son los productos (items)
        // Buscar o crear la subcategoría en PocketBase
        let subcat = await pb.collection('categorias').getFirstListItem(
          `slug="${cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[\/]/g, '')}"`
        ).catch(() => null);

        const slugSub = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[\/]/g, '');
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
  console.log('🎉 Sincronización completada');
}
