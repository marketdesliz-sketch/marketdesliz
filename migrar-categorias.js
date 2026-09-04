// migrar-categorias.js
import pb from './src/lib/pocketbase.js';
import fs from 'fs';
const MIGRATION_LOG = [];

async function migrarCategorias() {
  console.log('🔄 Iniciando migración de categorías...');

  try {
    // 1. Obtener todas las categorías activas
    const categorias = await pb.collection('categorias').getFullList({
      filter: 'activo = true',
      sort: 'nombre',
      fields: 'id,nombre'
    });

    if (categorias.length === 0) {
      console.log('❌ No se encontraron categorías en la base de datos.');
      console.log('💡 Asegúrate de tener categorías creadas en la colección "categorias".');
      return;
    }

    // Crear mapa nombre → ID
    const categoriaMap = {};
    categorias.forEach(cat => {
      categoriaMap[cat.nombre.toLowerCase()] = cat.id;
    });

    console.log(`📂 ${categorias.length} categorías cargadas:`);
    categorias.forEach(cat => console.log(`   - ${cat.nombre} (${cat.id})`));

    // 2. Obtener todos los productos activos
    const productos = await pb.collection('products').getFullList({
      filter: 'activo = true',
      fields: 'id,nombre,categoria,categoriaId'
    });

    console.log(`📦 ${productos.length} productos activos encontrados`);

    let actualizados = 0;
    let errores = 0;

    // 3. Iterar sobre cada producto
    for (const producto of productos) {
      // Si ya tiene categoriaId, saltar
      if (producto.categoriaId) {
        console.log(`⏩ Producto "${producto.nombre}" ya tiene categoría asignada (${producto.categoriaId})`);
        continue;
      }

      // Si no tiene categoria (texto), intentar obtener del nombre
      const categoriaNombre = producto.categoria?.trim();
      if (!categoriaNombre) {
        console.log(`⚠️ Producto "${producto.nombre}" no tiene categoría (campo vacío). Saltando.`);
        MIGRATION_LOG.push(`❌ ${producto.nombre}: sin categoría`);
        continue;
      }

      // Buscar el ID de la categoría por nombre (case-insensitive)
      const categoriaId = categoriaMap[categoriaNombre.toLowerCase()];

      if (!categoriaId) {
        console.log(`⚠️ Categoría "${categoriaNombre}" no encontrada. Saltando producto "${producto.nombre}".`);
        MIGRATION_LOG.push(`❌ ${producto.nombre}: categoría "${categoriaNombre}" no existe`);
        errores++;
        continue;
      }

      // Actualizar el producto con la categoriaId
      try {
        await pb.collection('products').update(producto.id, {
          categoriaId: categoriaId
        });
        console.log(`✅ Producto "${producto.nombre}" actualizado con categoría "${categoriaNombre}" (${categoriaId})`);
        MIGRATION_LOG.push(`✅ ${producto.nombre}: ${categoriaNombre} → ${categoriaId}`);
        actualizados++;
      } catch (error) {
        console.error(`❌ Error actualizando producto "${producto.nombre}":`, error.message);
        MIGRATION_LOG.push(`❌ ${producto.nombre}: error - ${error.message}`);
        errores++;
      }
    }

    // 4. Resumen final
    console.log('\n📊 Resumen de migración:');
    console.log(`   ✅ Productos actualizados: ${actualizados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   ⏩ Productos omitidos (ya tenían categoría): ${productos.length - actualizados - errores}`);

    // Guardar log en archivo
    fs.writeFileSync('migracion-log.json', JSON.stringify(MIGRATION_LOG, null, 2));
    console.log(`\n📝 Log guardado en migracion-log.json`);

  } catch (error) {
    console.error('❌ Error general en la migración:', error);
  }
}

migrarCategorias();