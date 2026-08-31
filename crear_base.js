const fs = require('fs');

// Configuración
const POCKETBASE_URL = 'http://api.povself.com:8090';
// ⚠️ REEMPLAZA ESTE TOKEN CON EL TUYO (el que obtuviste al hacer login)
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

async function crearUsuario() {
    console.log('📝 Creando usuario...');
    const data = {
        email: 'vendedor@marketdesliz.com',
        password: 'Vendedor123!',
        passwordConfirm: 'Vendedor123!',
        nombre: 'Vendedor Principal',
        role: 'vendedor',
    };
    const result = await apiRequest('POST', '/api/collections/users/records', data);
    console.log(`✅ Usuario creado: ${result.id} (${result.email})`);
    return result.id;
}

async function crearNegocio(usuarioId) {
    console.log('📝 Creando negocio...');
    const data = {
        nombre: 'Mi Negocio',
        usuarioId: usuarioId,
        categoria: 'Abarrotes', // valor válido del select (requerido)
        descripcion: 'Negocio de prueba',
        activo: true,
        estadoActivacion: 'activo', // requerido
        verificado: true,
        orden: 0,
        visitas: 0,
        totalComentarios: 0,
        calificacion: 0,
        atencionWhatsapp: true,
        citasPrevias: false,
        domicilio: false,
        destacado: false,
        // No incluimos categoriaNegocioId porque no existe en producción
    };
    const result = await apiRequest('POST', '/api/collections/negocios/records', data);
    console.log(`✅ Negocio creado: ${result.id} (${result.nombre})`);
    return result.id;
}

async function crearVendedor(usuarioId) {
    console.log('📝 Creando vendedor...');
    const codigo = 'VEND' + Date.now().toString(36).toUpperCase();
    const qrToken = 'QR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
    const data = {
        userId: usuarioId,
        createdBy: usuarioId,   // 👈 Agregamos este campo
        codigo: codigo,
        qrToken: qrToken,
        activo: true,
        comisionPorcentaje: 50,
    };
    const result = await apiRequest('POST', '/api/collections/vendedores/records', data);
    console.log(`✅ Vendedor creado: ${result.id} (código: ${result.codigo})`);
    return result.id;
}

async function crearCategoriaProducto() {
    console.log('📝 Creando categoría de producto...');
    const data = {
        nombre: 'Electrónicos',
        slug: 'electronicos',
        activo: true,
    };
    const result = await apiRequest('POST', '/api/collections/categorias/records', data);
    console.log(`✅ Categoría de producto creada: ${result.id} (${result.nombre})`);
    return result.id;
}

async function crearSubcategoria(categoriaId) {
    console.log('📝 Creando subcategoría...');
    const data = {
        nombre: 'Lavadoras',
        slug: 'lavadoras',
        categoriaId: categoriaId,
        activo: true,
    };
    const result = await apiRequest('POST', '/api/collections/subcategorias/records', data);
    console.log(`✅ Subcategoría creada: ${result.id} (${result.nombre})`);
    return result.id;
}

async function main() {
    try {
        console.log('🚀 Iniciando creación de datos base...\n');

        // 1. Usar usuario existente (el que creaste antes)
        // Reemplaza ESTE_ID con el ID de tu usuario en producción
        const usuarioId = 'nt3e2h9koh1zr1p'; // 👈 CAMBIA ESTE ID POR EL TUYO
        console.log(`📌 Usando usuario existente: ${usuarioId}`);

        // 2. Negocio
        // const negocioId = await crearNegocio(usuarioId);
        const negocioId = 'x83g96o2bf7mqnt'; // 👈 PON AQUÍ TU ID
        console.log(`📌 Usando negocio existente: ${negocioId}`);

        // 3. Vendedor
        const vendedorId = await crearVendedor(usuarioId);

        // 4. Categoría de producto
        const categoriaProductoId = await crearCategoriaProducto();

        // 5. Subcategoría
        const subcategoriaId = await crearSubcategoria(categoriaProductoId);

        // Guardar los IDs en un archivo
        const ids = {
            usuarioId,
            negocioId,
            vendedorId,
            categoriaProductoId,
            subcategoriaId,
        };

        fs.writeFileSync('ids_base.json', JSON.stringify(ids, null, 2));
        console.log('\n📄 IDs guardados en ids_base.json');
        console.log('\n📋 Resumen de IDs:');
        console.log(`   usuarioId:           ${usuarioId}`);
        console.log(`   negocioId:           ${negocioId}`);
        console.log(`   vendedorId:          ${vendedorId}`);
        console.log(`   categoriaProductoId: ${categoriaProductoId}`);
        console.log(`   subcategoriaId:      ${subcategoriaId}`);

        console.log('\n✅ Proceso completado. Usa estos IDs para modificar products.json.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

main();