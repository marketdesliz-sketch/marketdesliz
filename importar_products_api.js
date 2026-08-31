const fs = require('fs');

const POCKETBASE_URL = 'http://api.povself.com:8090';
// ⚠️ Usa el token que funciona (el que renovaste)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc4MzExNDc1NywiaWQiOiJjczRsNDBvMmtmbWo2ejciLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.gd4bUd4KRVP38Dzki5fTHRLQyM59EaGxYzH5tOHYMqM';

async function apiRequest(method, endpoint, data = null) {
    const url = `${POCKETBASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
    }
    return response.json();
}

async function importarProductos() {
    try {
        // Leer el archivo generado por actualizar_products.js
        const filePath = 'products_modificado.json';
        if (!fs.existsSync(filePath)) {
            console.error(`❌ No se encuentra ${filePath}. Ejecuta primero actualizar_products.js`);
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let items = Array.isArray(data) ? data : (data.items || []);
        if (items.length === 0) {
            console.log('⚠️ No hay productos para importar.');
            return;
        }

        console.log(`📥 Importando ${items.length} productos...`);

        let successCount = 0;
        for (let i = 0; i < items.length; i++) {
            const producto = items[i];

            // Eliminar campos que no se pueden crear (archivos, relaciones opcionales)
            delete producto.id;
            delete producto.created;
            delete producto.updated;
            delete producto.collectionId;
            delete producto.collectionName;
            // Eliminar campos de archivo (imagen, imagenes) porque no hay archivos subidos
            delete producto.imagen;
            delete producto.imagenes;

            // Asegurar que campos requeridos tengan valores válidos
            if (!producto.nombre) producto.nombre = `Producto ${i + 1}`;
            if (producto.precio === undefined) producto.precio = 0;
            if (producto.enganche === undefined) producto.enganche = 0;
            if (producto.pagoSemanal === undefined) producto.pagoSemanal = 0;
            if (producto.semanas === undefined) producto.semanas = 12;
            if (!producto.frecuenciaPago) producto.frecuenciaPago = 'semanal';
            if (producto.activo === undefined) producto.activo = true;
            if (producto.stock === undefined) producto.stock = 0;

            try {
                const result = await apiRequest('POST', '/api/collections/products/records', producto);
                successCount++;
                process.stdout.write(`✅ ${successCount}/${items.length} `);
            } catch (err) {
                console.error(`\n❌ Error en producto ${i+1}: ${err.message}`);
                // Opcional: mostrar el producto problemático
                // console.log('Producto:', JSON.stringify(producto, null, 2));
            }

            // Pequeña pausa para no saturar
            await new Promise(r => setTimeout(r, 100));
        }

        console.log(`\n🎉 ${successCount}/${items.length} productos importados correctamente.`);
    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

importarProductos();