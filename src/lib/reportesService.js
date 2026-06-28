// src/lib/reportesService.js
import pb from './pocketbase';

/**
 * Obtiene datos para reportes con paginación y filtros optimizados
 * @param {Object} params
 * @param {string} params.tipo - 'ventas' | 'pagos' | 'clientes'
 * @param {string} params.startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} params.endDate - Fecha fin (YYYY-MM-DD)
 * @param {number} params.page - Número de página (default: 1)
 * @param {number} params.perPage - Elementos por página (default: 20)
 * @param {string} params.search - Búsqueda por cliente o producto
 * @param {string} params.estado - Filtro por estado (para ventas/pagos)
 * @param {string} params.sort - Campo de ordenamiento
 * @returns {Promise<Object>} { items, totalItems, totalPages, page, perPage, summary }
 */
export async function getReportData({ tipo = 'ventas', startDate, endDate, page = 1, perPage = 20, search = '', estado = '', sort = '-created' } = {}) {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let collection = '';
        let filter = '';
        let expandFields = '';
        let fields = '';
        let items = [];
        let totalItems = 0;
        let summary = {};

        if (tipo === 'ventas') {
            collection = 'orders';
            filter = `created >= "${start.toISOString()}" && created <= "${end.toISOString()}"`;
            if (search.trim()) {
                const term = search.trim();
                filter += ` && (expand.userId.nombre ~ "${term}" || expand.productId.nombre ~ "${term}" || id ~ "${term}")`;
            }
            if (estado && estado !== 'todos') {
                filter += ` && estadoPago = "${estado}"`;
            }
            expandFields = 'userId,productId';
            fields = 'id,created,userId,productId,totalPagar,enganche,pagoSemanal,semanasTotales,estadoPago,tipo,expand.userId.nombre,expand.productId.nombre';

            const result = await pb.collection(collection).getList(page, perPage, {
                filter: filter || undefined,
                sort: sort,
                expand: expandFields,
                fields: fields
            });

            items = result.items.map(item => ({
                id: item.id,
                fecha: item.created,
                cliente: item.expand?.userId?.nombre || 'N/A',
                producto: item.expand?.productId?.nombre || 'Producto',
                totalPagar: item.totalPagar || 0,
                enganche: item.enganche || 0,
                pagoSemanal: item.pagoSemanal || 0,
                estado: item.estadoPago || 'pendiente_pago',
                tipo: item.tipo || 'credito'
            }));

            totalItems = result.totalItems;

            // Calcular resumen (usando getList con fields para contar y sumar)
            const allVentas = await pb.collection(collection).getFullList({
                filter: filter,
                fields: 'totalPagar'
            });
            const totalVentas = allVentas.reduce((sum, v) => sum + (v.totalPagar || 0), 0);
            summary = {
                totalVentas,
                promedioVenta: items.length > 0 ? totalVentas / items.length : 0
            };

        } else if (tipo === 'pagos') {
            collection = 'payments';
            filter = `fechaPago >= "${start.toISOString()}" && fechaPago <= "${end.toISOString()}" && estado = "pagado"`;
            if (search.trim()) {
                const term = search.trim();
                filter += ` && (expand.userId.nombre ~ "${term}" || expand.orderId.id ~ "${term}")`;
            }
            if (estado && estado !== 'todos') {
                filter += ` && estado = "${estado}"`;
            }
            expandFields = 'userId,orderId';
            fields = 'id,fechaPago,userId,orderId,montoPagado,montoProgramado,numeroSemana,metodoPago,expand.userId.nombre,expand.orderId.id';

            const result = await pb.collection(collection).getList(page, perPage, {
                filter: filter || undefined,
                sort: sort,
                expand: expandFields,
                fields: fields
            });

            items = result.items.map(item => ({
                id: item.id,
                fecha: item.fechaPago,
                cliente: item.expand?.userId?.nombre || 'N/A',
                monto: item.montoPagado || item.montoProgramado || 0,
                semana: item.numeroSemana !== undefined ? `Semana ${item.numeroSemana}` : 'Pago único',
                metodo: item.metodoPago || 'QR'
            }));

            totalItems = result.totalItems;

            const allPagos = await pb.collection(collection).getFullList({
                filter: filter,
                fields: 'montoPagado,montoProgramado'
            });
            const totalCobrado = allPagos.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
            summary = {
                totalCobrado,
                pagoPromedio: items.length > 0 ? totalCobrado / items.length : 0
            };

        } else if (tipo === 'clientes') {
            collection = 'users';
            filter = `created >= "${start.toISOString()}" && created <= "${end.toISOString()}" && role = "cliente"`;
            if (search.trim()) {
                const term = search.trim();
                filter += ` && (nombre ~ "${term}" || telefono ~ "${term}" || email ~ "${term}")`;
            }
            fields = 'id,created,nombre,telefono,email,activo';

            const result = await pb.collection(collection).getList(page, perPage, {
                filter: filter || undefined,
                sort: sort,
                fields: fields
            });

            // Para cada cliente, obtener dirección desde clients
            const itemsWithAddress = await Promise.all(result.items.map(async (item) => {
                let direccion = 'No especificada';
                try {
                    const clientData = await pb.collection('clients').getFirstListItem(`userId = "${item.id}"`, {
                        fields: 'direccionCalle,direccionNumero,direccionColonia'
                    });
                    if (clientData) {
                        direccion = `${clientData.direccionCalle || ''} ${clientData.direccionNumero || ''}, ${clientData.direccionColonia || ''}`.trim() || 'No especificada';
                    }
                } catch (e) {}
                return {
                    id: item.id,
                    fecha: item.created,
                    nombre: item.nombre || 'Sin nombre',
                    telefono: item.telefono || 'No registrado',
                    direccion: direccion,
                    estado: item.activo === true ? 'Activo' : 'Inactivo'
                };
            }));

            items = itemsWithAddress;
            totalItems = result.totalItems;
            summary = {
                clientesNuevos: totalItems
            };
        }

        return {
            items,
            totalItems,
            totalPages: Math.ceil(totalItems / perPage),
            page,
            perPage,
            summary
        };

    } catch (error) {
        console.error('Error obteniendo reportes:', error);
        throw error;
    }
}

/**
 * Obtener estadísticas rápidas para el dashboard de reportes (totales sin paginación)
 */
export async function getReportStats(tipo, startDate, endDate) {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let result = {};

        if (tipo === 'ventas') {
            const ventas = await pb.collection('orders').getFullList({
                filter: `created >= "${start.toISOString()}" && created <= "${end.toISOString()}"`,
                fields: 'totalPagar'
            });
            result.totalVentas = ventas.reduce((sum, v) => sum + (v.totalPagar || 0), 0);
            result.countVentas = ventas.length;
        } else if (tipo === 'pagos') {
            const pagos = await pb.collection('payments').getFullList({
                filter: `fechaPago >= "${start.toISOString()}" && fechaPago <= "${end.toISOString()}" && estado = "pagado"`,
                fields: 'montoPagado,montoProgramado'
            });
            result.totalCobrado = pagos.reduce((sum, p) => sum + (p.montoPagado || p.montoProgramado || 0), 0);
            result.countPagos = pagos.length;
        } else if (tipo === 'clientes') {
            const clientes = await pb.collection('users').getList(1, 1, {
                filter: `created >= "${start.toISOString()}" && created <= "${end.toISOString()}" && role = "cliente"`,
                fields: 'id'
            });
            result.clientesNuevos = clientes.totalItems;
        }

        return result;
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {};
    }
}