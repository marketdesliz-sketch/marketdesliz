const fs = require('fs');

// Leer los IDs base
const ids = JSON.parse(fs.readFileSync('ids_base.json', 'utf8'));

// Leer el archivo products.json
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

// Asegurarnos de que products sea un array
let items = Array.isArray(products) ? products : (products.items || []);

if (items.length === 0) {
    console.log('⚠️ No hay productos en products.json');
    process.exit(0);
}

console.log(`📥 Procesando ${items.length} productos...`);

// Actualizar cada producto
const productosActualizados = items.map((producto, index) => {
    // Eliminar campos de sistema
    delete producto.id;
    delete producto.created;
    delete producto.updated;
    delete producto.collectionId;
    delete producto.collectionName;

    // Asignar los IDs base a los campos de relación
    producto.negocioId = ids.negocioId;
    producto.categoriaId = ids.categoriaProductoId;
    producto.subcategoriaId = ids.subcategoriaId;

    // Si tiene vendedorId, también lo asignamos (aunque en products no es obligatorio)
    // pero por si acaso
    if (producto.vendedorId) {
        producto.vendedorId = ids.vendedorId;
    }

    // Asegurar que campos requeridos tengan valores
    if (!producto.nombre) producto.nombre = `Producto ${index + 1}`;
    if (!producto.precio) producto.precio = 0;
    if (producto.enganche === undefined) producto.enganche = 0;
    if (producto.pagoSemanal === undefined) producto.pagoSemanal = 0;
    if (producto.semanas === undefined) producto.semanas = 12;
    if (!producto.frecuenciaPago) producto.frecuenciaPago = 'semanal';
    if (producto.activo === undefined) producto.activo = true;
    if (producto.stock === undefined) producto.stock = 0;

    // Asegurar que imagenes sea un array
    if (producto.imagenes && !Array.isArray(producto.imagenes)) {
        producto.imagenes = [producto.imagenes];
    }

    return producto;
});

// Guardar el archivo modificado
fs.writeFileSync('products_modificado.json', JSON.stringify(productosActualizados, null, 2));
console.log(`✅ products_modificado.json creado con ${productosActualizados.length} productos.`);
console.log('\n📋 Campos de relación asignados:');
console.log(`   negocioId:     ${ids.negocioId}`);
console.log(`   categoriaId:   ${ids.categoriaProductoId}`);
console.log(`   subcategoriaId: ${ids.subcategoriaId}`);
console.log(`   vendedorId:    ${ids.vendedorId} (si existía)`);