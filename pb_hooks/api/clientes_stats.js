// pb_hooks/api/clientes_stats.js
// Endpoint: /api/clientes_stats
// Método: GET
// Parámetros: page, perPage, search, status, sort

const ITEMS_PER_PAGE = 10;

// ─── Función para obtener estadísticas de un cliente ──────────────────
async function getClientStats(clientId, $app) {
    const stats = {
        totalOrders: 0,
        totalVentas: 0,
        totalPagado: 0,
        deudaTotal: 0,
        pendingPayments: 0,
        pagosHoy: 0,
        pagosAtrasados: 0,
        tieneTarjeta: false,
        kycEstado: 'pendiente',
        tandasActivas: 0
    };

    try {
        // ── Órdenes ──
        const orders = await $app.dao().findRecordsByFilter(
            'orders',
            `userId = "${clientId}"`,
            '-created',
            0,  // sin límite
            0
        );
        stats.totalOrders = orders.length;
        stats.totalVentas = orders.reduce((sum, o) => sum + (o.get('totalPagar') || 0), 0);

        // ── Pagos ──
        const payments = await $app.dao().findRecordsByFilter(
            'payments',
            `userId = "${clientId}"`,
            '-fechaVencimiento',
            0,
            0
        );
        const hoy = new Date();
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

        payments.forEach(p => {
            const estado = p.get('estado');
            const monto = p.get('montoProgramado') || p.get('monto') || 0;
            const fechaVencimiento = p.get('fechaVencimiento') ? new Date(p.get('fechaVencimiento')) : null;

            if (estado === 'pagado') {
                stats.totalPagado += monto;
            } else if (estado === 'pendiente' || estado === 'atrasado') {
                stats.deudaTotal += monto;
                if (estado === 'pendiente') stats.pendingPayments++;
                if (estado === 'atrasado') stats.pagosAtrasados++;
                if (fechaVencimiento && fechaVencimiento >= inicioHoy && fechaVencimiento < finHoy) {
                    stats.pagosHoy++;
                }
            }
        });

        // ── KYC ──
        const kycRecords = await $app.dao().findRecordsByFilter(
            'kyc_verifications',
            `userId = "${clientId}"`,
            '-submittedAt',
            1,
            0
        );
        if (kycRecords.length > 0) {
            stats.kycEstado = kycRecords[0].get('estado') || 'pendiente';
        }

        // ── Tarjeta ──
        const clientRecord = await $app.dao().findFirstRecordByFilter(
            'clients',
            `userId = "${clientId}"`
        );
        if (clientRecord) {
            stats.tieneTarjeta = !!clientRecord.get('tarjetaId');
        }

        // ── Tandas activas ──
        const tandas = await $app.dao().findRecordsByFilter(
            'tanda_members',
            `userId = "${clientId}" && estado = "activo"`,
            '',
            0,
            0
        );
        stats.tandasActivas = tandas.length;

    } catch (e) {
        console.error(`Error obteniendo stats para cliente ${clientId}:`, e);
    }

    return stats;
}

// ─── Endpoint principal ──────────────────────────────────────────────────
routerAdd('GET', '/api/clientes_stats', async (c) => {   // ✅ AÑADIDO 'async'
    try {
        const $app = c.getApp();
        const dao = $app.dao();

        // ── Leer parámetros ──
        const page = parseInt(c.request.query.get('page')) || 1;
        const perPage = parseInt(c.request.query.get('perPage')) || ITEMS_PER_PAGE;
        const search = c.request.query.get('search') || '';
        const status = c.request.query.get('status') || 'todos';
        const sort = c.request.query.get('sort') || '-created';

        // ── Construir filtro ──
        let filter = 'role = "cliente" || role = "user"';
        if (search.trim()) {
            const term = search.trim();
            filter += ` && (nombre ~ "${term}" || telefono ~ "${term}" || id ~ "${term}")`;
        }
        if (status === 'activos') {
            filter += ' && activo = true';
        } else if (status === 'bloqueados') {
            filter += ' && activo = false';
        }

        // ── Obtener usuarios (paginados) ──
        const result = dao.findRecordsByFilter(
            'users',
            filter,
            sort,
            perPage,
            (page - 1) * perPage
        );

        // ── Obtener estadísticas para cada usuario ──
        const clientesConStats = result.items.map(async (user) => {
            const stats = await getClientStats(user.id, $app);
            return {
                id: user.id,
                nombre: user.get('nombre'),
                email: user.get('email'),
                telefono: user.get('telefono'),
                activo: user.get('activo'),
                created: user.get('created'),
                ...stats
            };
        });

        // Esperar todas las promesas (ahora funciona porque el callback es async)
        const items = await Promise.all(clientesConStats);

        // ── Contar total de clientes (sin paginación) ──
        const totalRecords = dao.findRecordsByFilter(
            'users',
            filter,
            '',
            0,
            0
        );

        return c.json(200, {
            items,
            totalItems: totalRecords.length,
            totalPages: Math.ceil(totalRecords.length / perPage),
            page,
            perPage
        });

    } catch (e) {
        console.error('Error en /api/clientes_stats:', e);
        return c.json(500, { error: e.message });
    }
});