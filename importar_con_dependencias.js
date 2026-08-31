const fs = require('fs');
const path = require('path');

// ⚠️ ACTUALIZA ESTE TOKEN con el que obtuviste (el que usaste en curl)
const POCKETBASE_URL = 'http://api.povself.com:8090';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc4MzExNDc1NywiaWQiOiJjczRsNDBvMmtmbWo2ejciLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.gd4bUd4KRVP38Dzki5fTHRLQyM59EaGxYzH5tOHYMqM';

// 📋 Funciones auxiliares
async function apiRequest(method, endpoint, data = null) {
    const url = `${POCKETBASE_URL}${endpoint}`;
    const options = { method, headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    const response = await fetch(url, options);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
    }
    return response.json();
}

async function leerJSON(nombre) {
    const filePath = path.join(__dirname, `${nombre}.json`);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ ${nombre}.json no encontrado. Saltando.`);
        return null;
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`❌ Error parseando ${nombre}.json: ${e.message}`);
        return null;
    }
}

async function importarRegistros(nombre, registros) {
    if (!registros || registros.length === 0) return [];
    console.log(`📥 Importando ${registros.length} registros en "${nombre}"...`);
    const resultados = [];
    for (const rec of registros) {
        // Limpiar campos de sistema
        delete rec.id;
        delete rec.created;
        delete rec.updated;
        delete rec.collectionId;
        delete rec.collectionName;
        // Eliminar campos de archivo (imagen, etc.) para evitar errores
        if (['carrusel', 'blog', 'categorias', 'subcategorias', 'categorias_negocios'].includes(nombre)) {
            delete rec.imagen;
        }
        try {
            const result = await apiRequest('POST', `/api/collections/${nombre}/records`, rec);
            resultados.push(result);
            process.stdout.write('.');
        } catch (err) {
            console.error(`\n❌ Error en ${nombre}: ${err.message}`);
            console.log('   Registro problemático:', JSON.stringify(rec, null, 2));
        }
        await new Promise(r => setTimeout(r, 100));
    }
    console.log(`\n✅ ${nombre}: ${resultados.length} registros creados.`);
    return resultados;
}

async function obtenerPrimerId(collection, filter) {
    try {
        const result = await apiRequest('GET', `/api/collections/${collection}/records?filter=${encodeURIComponent(filter)}&perPage=1`);
        if (result.items && result.items.length > 0) {
            return result.items[0].id;
        }
        return null;
    } catch (e) {
        console.error(`❌ Error obteniendo ID de ${collection}: ${e.message}`);
        return null;
    }
}

// 📦 Main
async function main() {
    try {
        console.log('🚀 Iniciando importación con mapeo automático...\n');

        // ---- 1. IMPORTAR ESTADOS ----
        let estados = await leerJSON('estados');
        if (estados) {
            await importarRegistros('estados', estados);
            const estadoId = await obtenerPrimerId('estados', 'nombre="Ciudad de México"');
            if (estadoId) {
                console.log(`📌 Estado ID obtenido: ${estadoId}`);
                // Actualizar municipios.json en disco
                let municipios = await leerJSON('municipios');
                if (municipios) {
                    municipios.forEach(m => m.estadoId = estadoId);
                    fs.writeFileSync('municipios.json', JSON.stringify(municipios, null, 2));
                    console.log('✅ municipios.json actualizado con estadoId real.');
                }
            }
        }

        // ---- 2. IMPORTAR MUNICIPIOS ----
        let municipios = await leerJSON('municipios');
        if (municipios) {
            await importarRegistros('municipios', municipios);
            const municipioId = await obtenerPrimerId('municipios', 'nombre="Álvaro Obregón"');
            if (municipioId) {
                console.log(`📌 Municipio ID obtenido: ${municipioId}`);
                let localidades = await leerJSON('localidades');
                if (localidades) {
                    localidades.forEach(l => l.municipioId = municipioId);
                    fs.writeFileSync('localidades.json', JSON.stringify(localidades, null, 2));
                    console.log('✅ localidades.json actualizado con municipioId real.');
                }
            }
        }

        // ---- 3. IMPORTAR LOCALIDADES ----
        let localidades = await leerJSON('localidades');
        if (localidades) {
            await importarRegistros('localidades', localidades);
            const localidadId = await obtenerPrimerId('localidades', 'nombre="Santa Fe"');
            if (localidadId) {
                console.log(`📌 Localidad ID obtenido: ${localidadId}`);
                let sectores = await leerJSON('sectores');
                if (sectores) {
                    sectores.forEach(s => s.localidadId = localidadId);
                    fs.writeFileSync('sectores.json', JSON.stringify(sectores, null, 2));
                    console.log('✅ sectores.json actualizado con localidadId real.');
                }
            }
        }

        // ---- 4. IMPORTAR SECTORES ----
        let sectores = await leerJSON('sectores');
        if (sectores) {
            await importarRegistros('sectores', sectores);
        }

        // ---- 5. IMPORTAR CATEGORIAS_NEGOCIOS ----
        let catNegocios = await leerJSON('categorias_negocios');
        if (catNegocios) {
            await importarRegistros('categorias_negocios', catNegocios);
        }

        // ---- 6. IMPORTAR COLECCIONES SIMPLES ----
        const coleccionesSimples = [
            'config_niveles',
            'contacto',
            'vacantes',
            'comprobantes',
            'config_sistema',
            'carrusel',
            'blog',
            'categorias' // categorías de productos (ya tenemos una, pero si hay más, se importan)
        ];
        for (const col of coleccionesSimples) {
            let data = await leerJSON(col);
            if (data) {
                await importarRegistros(col, data);
            }
        }

        // ---- 7. IMPORTAR SUBCATEGORIAS (usando el ID de categoriaProductoId) ----
        let subcat = await leerJSON('subcategorias');
        if (subcat) {
            // Leer IDs base (donde tenemos categoriaProductoId)
            const idsBase = JSON.parse(fs.readFileSync('ids_base.json', 'utf8'));
            // Reemplazar el placeholder con el ID real
            subcat.forEach(s => s.categoriaId = idsBase.categoriaProductoId);
            // Guardar el archivo actualizado (opcional, pero útil para referencia)
            fs.writeFileSync('subcategorias.json', JSON.stringify(subcat, null, 2));
            console.log('✅ subcategorias.json actualizado con categoriaProductoId real.');
            await importarRegistros('subcategorias', subcat);
        }

        console.log('\n🎉 ¡Importación completa! Revisa el panel de administración.');
        console.log('🔍 Recuerda que las colecciones con relaciones (orders, payments, etc.) no se importaron. Si quieres importarlas, necesitamos mapear los IDs de usuarios, productos, etc.');
    } catch (error) {
        console.error('❌ Error en el proceso principal:', error.message);
        console.error(error.stack);
    }
}

main();