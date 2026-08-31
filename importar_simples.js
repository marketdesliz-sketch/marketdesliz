const fs = require('fs');
const path = require('path');

const POCKETBASE_URL = 'http://api.povself.com:8090';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc4MzExNDc1NywiaWQiOiJjczRsNDBvMmtmbWo2ejciLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.gd4bUd4KRVP38Dzki5fTHRLQyM59EaGxYzH5tOHYMqM';

const colecciones = [
    'carrusel',
    'blog',
    'categorias',
    'subcategorias',
    'config_niveles',
    'estados',
    'municipios',
    'localidades',
    'sectores',
    'categorias_negocios',
    'contacto',
    'vacantes',
    'comprobantes',
    'config_sistema'
];

async function importarColeccion(nombre) {
    const filePath = path.join(__dirname, `${nombre}.json`);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Archivo ${nombre}.json no encontrado. Saltando.`);
        return;
    }

    let data;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(raw);
    } catch (e) {
        console.error(`❌ Error parseando ${nombre}.json: ${e.message}`);
        return;
    }

    let items = Array.isArray(data) ? data : (data.items || []);
    if (items.length === 0) {
        console.log(`ℹ️ No hay registros en ${nombre}.json`);
        return;
    }

    console.log(`📥 Importando ${items.length} registros en "${nombre}"...`);
    let success = 0;
    for (const record of items) {
        delete record.id;
        delete record.created;
        delete record.updated;
        delete record.collectionId;
        delete record.collectionName;

        // Eliminar campos de archivo (no se pueden subir por API)
        if (nombre === 'carrusel' || nombre === 'blog' || nombre === 'categorias' || nombre === 'subcategorias' || nombre === 'categorias_negocios') {
            delete record.imagen;
        }

        try {
            const res = await fetch(`${POCKETBASE_URL}/api/collections/${nombre}/records`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(record),
            });
            if (res.ok) {
                success++;
                process.stdout.write('.');
            } else {
                const errText = await res.text();
                console.error(`\n❌ Error en ${nombre}: ${res.status} - ${errText}`);
            }
        } catch (err) {
            console.error(`\n❌ Error de red en ${nombre}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 50));
    }
    console.log(`\n✅ ${nombre}: ${success}/${items.length} importados.`);
}

async function main() {
    console.log('🚀 Importando colecciones...\n');
    for (const col of colecciones) {
        await importarColeccion(col);
    }
    console.log('\n🎉 Proceso completado.');
}

main().catch(console.error);