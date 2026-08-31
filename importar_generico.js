const fs = require('fs');
const path = require('path');

// Configuración
const POCKETBASE_URL = 'http://api.povself.com:8090';
// ⚠️ Token actualizado
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

async function importarColeccion(collectionName, fileName = null) {
    if (!fileName) fileName = `${collectionName}.json`;
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Archivo ${fileName} no encontrado. Saltando.`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let items = Array.isArray(data) ? data : (data.items || []);
    if (items.length === 0) {
        console.log(`ℹ️ No hay registros en ${collectionName}.json`);
        return;
    }

    console.log(`📥 Importando ${items.length} registros en "${collectionName}"...`);

    let successCount = 0;
    for (let i = 0; i < items.length; i++) {
        const record = items[i];
        // Eliminar campos de sistema
        delete record.id;
        delete record.created;
        delete record.updated;
        delete record.collectionId;
        delete record.collectionName;

        // Para users, eliminar password y campos relacionados
        if (collectionName === 'users') {
            delete record.password;
            delete record.passwordConfirm;
            delete record.tokenKey;
            delete record.verified;
            delete record.emailVisibility;
        }

        // Para colecciones con archivos, eliminar campos de archivo (no los podemos subir desde JSON)
        if (['carrusel', 'blog', 'negocios', 'products', 'comprobantes', 'kyc_verifications'].includes(collectionName)) {
            // Eliminar campos de archivo comunes
            ['imagen', 'imagenes', 'logo', 'portada', 'foto', 'comprobante', 'idFront', 'idBack', 'cartaCompromiso', 'comprobanteDomicilio'].forEach(field => {
                delete record[field];
            });
        }

        try {
            const result = await apiRequest('POST', `/api/collections/${collectionName}/records`, record);
            successCount++;
            process.stdout.write(`✅ ${successCount}/${items.length} `);
        } catch (err) {
            console.error(`\n❌ Error en registro ${i+1}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 100));
    }
    console.log(`\n🎉 ${successCount}/${items.length} registros importados en "${collectionName}".`);
}

// Lista de colecciones a importar (ordenadas por dependencias)
const colecciones = [
    // 'users',        // ya existen
    // 'categorias',   // ya existe
    // 'subcategorias', // ya existe
    // 'negocios',     // ya existe
    // 'vendedores',   // ya existe
    'clients',          // depende de users
    'tandas',           // depende de users
    'tanda_members',    // depende de tandas, users
    'tanda_pagos',      // depende de tanda_members
    'orders',           // depende de users, products, vendedores, cobradores
    'payments',         // depende de orders, users, cobradores
    'solicitudes',      // depende de users, vendedores, products
    'notificaciones',   // depende de users
    'favoritos',        // depende de users, products
    'comentarios_negocios', // depende de negocios, users
    'carrusel',         // sin dependencias (pero sin imágenes)
    'blog',             // sin dependencias (sin imágenes)
    // 'cobradores',     // si tienes datos
    // 'cobros',         // si tienes datos
    // 'vacantes',       // si tienes datos
    // 'comprobantes',   // si tienes datos
    // 'kyc_verifications', // si tienes datos
    // 'log_actividad',  // si tienes datos
    // 'recordatorios_pagos', // si tienes datos
    // 'user_providers', // si tienes datos
    // 'contacto',       // si tienes datos
    // 'invitaciones_negocios', // si tienes datos
    // 'invitaciones_tanda', // si tienes datos
    // 'bolsa_trabajo',  // si tienes datos
];

async function main() {
    console.log('🚀 Iniciando importación de colecciones...\n');
    for (const col of colecciones) {
        // Si el nombre de archivo difiere, puedes especificarlo
        await importarColeccion(col);
    }
    console.log('\n🎉 Proceso completado.');
}

main().catch(console.error);