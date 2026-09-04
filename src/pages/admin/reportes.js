// src/pages/admin/reportes.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Users,
    Target,
    Calendar,
    Download,
    FileText,
    Search,
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    PieChart,
    LineChart,
    Activity,
    Clock,
    Wallet,
    ShoppingBag,
    CreditCard,
    UserCheck,
    Loader2,
    AlertCircle
} from 'lucide-react';
import AdminLayoutMinimal from '../../layouts/AdminLayoutMinimal';
import { getReportData, getReportStats } from '../../lib/reportesService';
import { exportToExcel, exportToPDF } from '../../lib/exportarReportesService';
import { formatMoney } from '../../lib/utils';

const ITEMS_PER_PAGE = 20;

export default function AdminReportesPage() {
    const router = useRouter();

    // ─── Parámetros de URL ────────────────────────────────────────────────
    const { tipo = 'ventas', start = '', end = '', page = 1, search = '', estado = '', sort = '-created' } = router.query;
    const currentPage = parseInt(page) || 1;

    // ─── Estados ──────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [exportando, setExportando] = useState(false);
    const [tipoReporte, setTipoReporte] = useState(tipo);
    const [filteredData, setFilteredData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState({
        totalVentas: 0,
        totalCobrado: 0,
        clientesNuevos: 0,
        tandasActivas: 0,
        promedioVenta: 0,
        pagoPromedio: 0
    });
    const [filtroSearch, setFiltroSearch] = useState(search || '');
    const [filtroEstado, setFiltroEstado] = useState(estado || '');
    const [sortBy, setSortBy] = useState(sort || '-created');

    // ─── Fechas ────────────────────────────────────────────────────────────
    const getDefaultStartDate = () => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    };
    const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState({
        start: start || getDefaultStartDate(),
        end: end || getDefaultEndDate()
    });

    // ─── Actualizar URL ──────────────────────────────────────────────────
    const actualizarURL = useCallback((params) => {
        const query = {
            tipo: tipoReporte !== 'ventas' ? tipoReporte : undefined,
            start: dateRange.start !== getDefaultStartDate() ? dateRange.start : undefined,
            end: dateRange.end !== getDefaultEndDate() ? dateRange.end : undefined,
            page: currentPage > 1 ? currentPage : undefined,
            search: filtroSearch || undefined,
            estado: filtroEstado || undefined,
            sort: sortBy !== '-created' ? sortBy : undefined,
            ...params
        };
        Object.keys(query).forEach(key => {
            if (query[key] === undefined || query[key] === '') delete query[key];
        });
        router.push({ pathname: '/admin/reportes', query }, undefined, { shallow: true });
    }, [tipoReporte, dateRange.start, dateRange.end, currentPage, filtroSearch, filtroEstado, sortBy, router]);

    // ─── Cargar datos ──────────────────────────────────────────────────────
    const cargarDatos = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const result = await getReportData({
                tipo: tipoReporte,
                startDate: dateRange.start,
                endDate: dateRange.end,
                page: currentPage,
                perPage: ITEMS_PER_PAGE,
                search: filtroSearch,
                estado: filtroEstado,
                sort: sortBy
            });

            setFilteredData(result.items);
            setTotalItems(result.totalItems);
            setTotalPages(result.totalPages);

            // Actualizar resumen combinando con datos de estadísticas
            const stats = await getReportStats(tipoReporte, dateRange.start, dateRange.end);
            setSummary({
                totalVentas: stats.totalVentas || 0,
                totalCobrado: stats.totalCobrado || 0,
                clientesNuevos: stats.clientesNuevos || 0,
                tandasActivas: 0, // se puede obtener aparte si se necesita
                promedioVenta: stats.countVentas > 0 ? (stats.totalVentas || 0) / stats.countVentas : 0,
                pagoPromedio: stats.countPagos > 0 ? (stats.totalCobrado || 0) / stats.countPagos : 0
            });

        } catch (err) {
            console.error('Error cargando reportes:', err);
            setError('No se pudieron cargar los reportes. Intenta de nuevo.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tipoReporte, dateRange.start, dateRange.end, currentPage, filtroSearch, filtroEstado, sortBy]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // ─── Manejadores de eventos ──────────────────────────────────────────
    const handleTipoChange = (e) => {
        const val = e.target.value;
        setTipoReporte(val);
        actualizarURL({ tipo: val, page: 1 });
    };

    const handleFechaChange = (field, value) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
        actualizarURL({ [field]: value, page: 1 });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const term = new FormData(e.target).get('search') || '';
        setFiltroSearch(term);
        actualizarURL({ search: term, page: 1 });
    };

    const handleEstadoChange = (e) => {
        const val = e.target.value;
        setFiltroEstado(val);
        actualizarURL({ estado: val, page: 1 });
    };

    const handleSortChange = (e) => {
        const val = e.target.value;
        setSortBy(val);
        actualizarURL({ sort: val, page: 1 });
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        actualizarURL({ page: newPage });
    };

    const handleExportExcel = () => {
        if (filteredData.length === 0) return;
        setExportando(true);
        try {
            exportToExcel(filteredData, tipoReporte, dateRange.start, dateRange.end);
        } catch (err) {
            console.error(err);
            alert('Error al exportar a Excel');
        } finally {
            setExportando(false);
        }
    };

    const handleExportPDF = () => {
        if (filteredData.length === 0) return;
        setExportando(true);
        try {
            exportToPDF(filteredData, tipoReporte, dateRange.start, dateRange.end, summary);
        } catch (err) {
            console.error(err);
            alert('Error al exportar a PDF');
        } finally {
            setExportando(false);
        }
    };

    const tipoReportes = [
        { id: 'ventas', label: 'Ventas', icon: ShoppingBag, color: 'purple' },
        { id: 'pagos', label: 'Pagos', icon: CreditCard, color: 'green' },
        { id: 'clientes', label: 'Clientes nuevos', icon: UserCheck, color: 'blue' }
    ];

    const TipoIcono = tipoReportes.find(t => t.id === tipoReporte)?.icon || BarChart3;

    if (loading && !refreshing) {
        return (
            <AdminLayoutMinimal>
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayoutMinimal>
        );
    }

    return (
        <>
            <Head>
                <title>Reportes | Admin</title>
            </Head>

            <AdminLayoutMinimal>
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                                <BarChart3 size={20} className="text-[#6C3BFF]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
                                <p className="text-sm text-gray-500">Visualiza, analiza y exporta el rendimiento de tu negocio</p>
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de reporte</label>
                                <div className="relative">
                                    <TipoIcono size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] bg-white appearance-none"
                                        value={tipoReporte}
                                        onChange={handleTipoChange}
                                    >
                                        {tipoReportes.map(t => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                                        value={dateRange.start}
                                        onChange={(e) => handleFechaChange('start', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                                        value={dateRange.end}
                                        onChange={(e) => handleFechaChange('end', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => cargarDatos(true)}
                                    disabled={refreshing}
                                    className="w-full flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-2.5 rounded-xl font-medium hover:bg-[#5a2ee6] transition disabled:opacity-50"
                                >
                                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <DollarSign size={18} className="text-green-500" />
                                <span className="text-xl font-bold text-gray-900">{formatMoney(summary.totalVentas)}</span>
                            </div>
                            <p className="text-xs text-gray-500">Ventas totales</p>
                            <p className="text-xs text-gray-400 mt-1">{filteredData.length} registros</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <Wallet size={18} className="text-blue-500" />
                                <span className="text-xl font-bold text-gray-900">{formatMoney(summary.totalCobrado)}</span>
                            </div>
                            <p className="text-xs text-gray-500">Total cobrado</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <Users size={18} className="text-purple-500" />
                                <span className="text-xl font-bold text-gray-900">{summary.clientesNuevos}</span>
                            </div>
                            <p className="text-xs text-gray-500">Clientes nuevos</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <TrendingUp size={18} className="text-orange-500" />
                                <span className="text-lg font-bold text-gray-900">{formatMoney(summary.promedioVenta)}</span>
                            </div>
                            <p className="text-xs text-gray-500">Promedio por venta</p>
                        </div>
                    </div>

                    {/* Búsqueda y filtros adicionales */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={filtroSearch}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] text-sm"
                                    placeholder="Buscar por cliente, producto o ID..."
                                />
                            </form>
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                                    value={filtroEstado}
                                    onChange={handleEstadoChange}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="completada">Completadas</option>
                                    <option value="activa">Activas</option>
                                    <option value="pendiente_pago">Pendientes</option>
                                    <option value="cancelada">Canceladas</option>
                                </select>
                            </div>
                            <div className="relative">
                                <select
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                                    value={sortBy}
                                    onChange={handleSortChange}
                                >
                                    <option value="-created">Más recientes</option>
                                    <option value="created">Más antiguos</option>
                                    <option value="totalPagar">Por monto</option>
                                    <option value="cliente">Por cliente</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 text-red-700">
                            <AlertCircle size={18} className="shrink-0" />
                            <span className="text-sm">{error}</span>
                            <button
                                onClick={() => cargarDatos()}
                                className="ml-auto text-sm font-medium hover:underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Exportación y tabla */}
                    {filteredData.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-6">
                            <button
                                onClick={handleExportExcel}
                                disabled={exportando}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {exportando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {exportando ? 'Exportando...' : 'Exportar a Excel'}
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={exportando}
                                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {exportando ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                {exportando ? 'Exportando...' : 'Exportar a PDF'}
                            </button>
                        </div>
                    )}

                    {/* Tabla */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <TipoIcono size={16} className="text-[#6C3BFF]" />
                                {tipoReporte === 'ventas' && 'Listado de Ventas'}
                                {tipoReporte === 'pagos' && 'Listado de Pagos'}
                                {tipoReporte === 'clientes' && 'Clientes Nuevos'}
                                <span className="text-sm text-gray-400 font-normal ml-2">
                                    ({filteredData.length} registros encontrados)
                                </span>
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            {filteredData.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <BarChart3 size={32} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-500">No hay datos para el período seleccionado</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            {Object.keys(filteredData[0] || {}).map(key => (
                                                <th key={key} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredData.map((row, idx) => (
                                            <tr key={idx} className={`hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                {Object.entries(row).map(([key, val], i) => {
                                                    if (key === 'Estado' && tipoReporte === 'ventas') {
                                                        const status = String(val).toLowerCase();
                                                        let badgeClass = '';
                                                        if (status.includes('completada')) badgeClass = 'bg-green-100 text-green-700';
                                                        else if (status.includes('activa')) badgeClass = 'bg-blue-100 text-blue-700';
                                                        else badgeClass = 'bg-yellow-100 text-yellow-700';
                                                        return (
                                                            <td key={i} className="px-5 py-3 text-sm">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                                                                    {val}
                                                                </span>
                                                            </td>
                                                        );
                                                    }
                                                    return <td key={i} className="px-5 py-3 text-sm text-gray-600">{val}</td>;
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 px-6 py-4">
                                <span className="text-sm text-gray-500">
                                    Mostrando {filteredData.length} de {totalItems} registros
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                                    >
                                        <ChevronLeft size={14} /> Anterior
                                    </button>
                                    <span className="px-4 py-2 text-sm text-gray-500">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:border-[#6C3BFF] hover:text-[#6C3BFF] transition-colors"
                                    >
                                        Siguiente <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayoutMinimal>
        </>
    );
}