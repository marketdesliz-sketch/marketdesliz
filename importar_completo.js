const fs = require('fs');
const path = require('path');

const POCKETBASE_URL = 'http://api.povself.com:8090';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc4MzA0NDAxMSwiaWQiOiJpMGlycXZ4Y3F0dGNjYzQiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.1Vh7kvTCp1o2GsXlyTOviy89-4zjzO_9lox7jtvtRIw';

// 👇 Define el orden de importación (primero sin dependencias)
const coleccionesOrdenadas = [
  'users',
  'categorias',
  'categorias_negocios',
  'estados',
  'municipios',
  'localidades',
  'sectores',
  'negocios',
  'vendedores',
  'cobradores',
  'config_niveles',
  'config_sistema',
  'blog',
  'carrusel',
  'subcategorias',
  'products',
  'clients',
  'orders',
  'payments',
  'tandas',
  'tanda_members',
  'tanda_pagos',
  'solicitudes',
  'notificaciones',
  'favoritos',
  'comentarios_negocios',
  'kyc_verifications',
  'log_actividad',
  'cobros',
  'vacantes',
  'comprobantes',
  'recordatorios_pagos',
  'user_providers',
  'contacto',
  'invitaciones_negocios',
  'invitaciones_tanda',
  'bolsa_trabajo'
];

// Campos que siempre deben eliminarse al crear un registro
const camposSistema = ['id', 'created', 'updated', 'collectionId', 'collectionName'];

// Campos de relación que si no existen, se eliminan (para evitar errores)
const camposRelacion = [
  'userId', 'usuarioId', 'clienteId', 'vendedorId', 'cobradorId',
  'productId', 'orderId', 'paymentId', 'tandaId', 'tandaMemberId',
  'negocioId', 'categoriaId', 'subcategoriaId', 'categoriaNegocioId',
  'estadoId', 'municipioId', 'localidadId', 'sectorId',
  'comprobanteId', 'revisadoPor', 'asignadoA', 'createdBy'
];

async function importarColeccion(collectionName) {
    const filePath = path.join(__dirname, `${collectionName}.json`);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Archivo ${collectionName}.json no encontrado. Saltando.`);
        return;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        console.error(`❌ Error parseando ${collectionName}.json:`, e.message);
        return;
    }

    let items = Array.isArray(data) ? data : (data.items || []);
    if (!Array.isArray(items) || items.length === 0) {
        console.log(`ℹ️ No hay registros en ${collectionName}.json`);
        return;
    }

    console.log(`📥 Importando ${items.length} registros en "${collectionName}"...`);

    let successCount = 0;
    for (const record of items) {
        // 1. Eliminar campos de sistema
        camposSistema.forEach(field => delete record[field]);

        // 2. Para users: eliminar password y campos relacionados
        if (collectionName === 'users') {
            delete record.password;
            delete record.passwordConfirm;
            delete record.tokenKey;
            delete record.verified; // opcional, depende de tu lógica
        }

        // 3. Eliminar campos de relación que podrían causar error si no existen
        // (los eliminamos todos, luego puedes agregar manualmente los que sí existan)
        // Pero para importar datos básicos, es mejor eliminarlos.
        camposRelacion.forEach(field => delete record[field]);

        // 4. Si es products, eliminar campos que no están en la colección
        if (collectionName === 'products') {
            delete record.ventas;
            delete record.visitas;
            // Si tienes imagenes, asegúrate de que sea array
            if (record.imagenes && !Array.isArray(record.imagenes)) {
                record.imagenes = record.imagenes ? [record.imagenes] : [];
            }
        }

        // 5. Si es clients, eliminar campos que no son necesarios en creación
        if (collectionName === 'clients') {
            delete record.tarjetaId;
            delete record.numeroTarjeta;
            delete record.codigoColonia;
            delete record.tarjetaEstado;
            // Dejar solo campos de dirección y nivel
        }

        try {
            const response = await fetch(`${POCKETBASE_URL}/api/collections/${collectionName}/records`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(record),
            });

            if (response.ok) {
                successCount++;
                process.stdout.write('.');
            } else {
                const errorText = await response.text();
                console.error(`\n❌ Error en ${collectionName}: ${response.status} - ${errorText}`);
                // Mostrar el registro problemático (opcional)
                // console.log('Registro:', JSON.stringify(record, null, 2));
            }
        } catch (err) {
            console.error(`\n❌ Error de red en ${collectionName}:`, err.message);
        }

        // Pequeña pausa para no saturar
        await new Promise(r => setTimeout(r, 50));
    }

    console.log(`\n✅ ${collectionName}: ${successCount}/${items.length} registros importados.`);
}

async function main() {
    console.log('🚀 Iniciando importación en orden...\n');
    for (const col of coleccionesOrdenadas) {
        await importarColeccion(col);
    }
    console.log('\n🎉 Proceso completado.');
}

main().catch(console.error);