const fs = require('fs');
const path = require('path');

const POCKETBASE_URL = 'http://api.povself.com:8090';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc4MzExNDc1NywiaWQiOiJjczRsNDBvMmtmbWo2ejciLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.gd4bUd4KRVP38Dzki5fTHRLQyM59EaGxYzH5tOHYMqM';

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

async function obtenerUsuarioPorEmail(email) {
    try {
        const result = await apiRequest('GET', `/api/collections/users/records?filter=email="${email}"&perPage=1`);
        return result.items && result.items.length > 0 ? result.items[0].id : null;
    } catch (e) {
        return null;
    }
}

async function obtenerUsuarioPorTelefono(telefono) {
    try {
        const result = await apiRequest('GET', `/api/collections/users/records?filter=telefono="${telefono}"&perPage=1`);
        return result.items && result.items.length > 0 ? result.items[0].id : null;
    } catch (e) {
        return null;
    }
}

async function crearUsuarioDesdeCliente(cliente) {
    // Crear un usuario a partir de los datos del cliente
    const email = cliente.email || `${cliente.telefono || 'cliente'}@temp.com`;
    const data = {
        email: email,
        password: 'Temp123!',
        passwordConfirm: 'Temp123!',
        nombre: cliente.nombre || 'Cliente',
        role: 'cliente',
        telefono: cliente.telefono || '',
        verified: true
    };
    try {
        const result = await apiRequest('POST', '/api/collections/users/records', data);
        console.log(`   👤 Usuario creado: ${result.id} (${email})`);
        return result.id;
    } catch (e) {
        console.error(`   ❌ Error al crear usuario para ${cliente.nombre}: ${e.message}`);
        return null;
    }
}

async function importarClients() {
    const filePath = path.join(__dirname, 'clients.json');
    if (!fs.existsSync(filePath)) {
        console.error('❌ No se encuentra clients.json');
        return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let items = Array.isArray(data) ? data : (data.items || []);
    if (items.length === 0) {
        console.log('ℹ️ No hay clientes en clients.json');
        return;
    }

    console.log(`📥 Importando ${items.length} clientes...`);
    let success = 0;
    for (const cliente of items) {
        // Limpiar campos de sistema
        delete cliente.id;
        delete cliente.created;
        delete cliente.updated;
        delete cliente.collectionId;
        delete cliente.collectionName;

        // Buscar o crear usuario
        let userId = null;
        if (cliente.email) {
            userId = await obtenerUsuarioPorEmail(cliente.email);
        }
        if (!userId && cliente.telefono) {
            userId = await obtenerUsuarioPorTelefono(cliente.telefono);
        }
        if (!userId) {
            // Si no se encuentra, crear uno nuevo
            userId = await crearUsuarioDesdeCliente(cliente);
        }
        if (!userId) {
            console.error(`❌ No se pudo obtener/crear usuario para ${cliente.nombre || cliente.id}. Saltando.`);
            continue;
        }

        // Asignar el userId real
        cliente.userId = userId;

        // Para clients, también podemos mapear otros campos si es necesario

        try {
            const result = await apiRequest('POST', '/api/collections/clients/records', cliente);
            success++;
            process.stdout.write('.');
        } catch (err) {
            console.error(`\n❌ Error al importar cliente ${cliente.nombre}: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 100));
    }
    console.log(`\n✅ ${success}/${items.length} clientes importados.`);
}

importarClients().catch(console.error);