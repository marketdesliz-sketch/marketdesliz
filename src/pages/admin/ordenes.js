// src/pages/admin/ordenes.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Package, 
  Truck,
  Home,
  Eye,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  Filter,
  Search,
  FileText,
  TrendingUp,
  Wallet,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import pb from '../../lib/pocketbase';

export default function AdminOrdenesPage() {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todas');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [validando, setValidando] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        cargarOrdenes();
    }, []);

    const cargarOrdenes = async () => {
        try {
            setLoading(true);

            const records = await pb.collection('orders').getFullList({
                sort: '-created',
                expand: 'userId,productId'
            });

            const ordersWithData = records.map(order => {
                let clienteData = null;
                try {
                    if (order.clienteData) {
                        if (typeof order.clienteData === 'string') {
                            clienteData = JSON.parse(order.clienteData);
                        } else {
                            clienteData = order.clienteData;
                        }
                    }
                } catch (e) {
                    console.error('Error parseando clienteData:', e);
                    clienteData = null;
                }

                return {
                    ...order,
                    clienteData: clienteData,
                    cliente: order.expand?.userId?.nombre || order.cliente || 'Cliente sin nombre',
                    clienteEmail: order.expand?.userId?.email || '',
                    clienteTelefono: order.expand?.userId?.telefono || '',
                    productoNombre: order.expand?.productId?.nombre || 'Producto'
                };
            });

            setOrdenes(ordersWithData);

        } catch (error) {
            console.error('Error cargando órdenes:', error);
        } finally {
            setLoading(false);
        }
    };

    const validarPago = async (order) => {
        setValidando(true);
        try {
            await pb.collection('orders').update(order.id, {
                estadoPago: 'validado',
                fechaValidacion: new Date().toISOString()
            });

            cargarOrdenes();
            setShowModal(false);
        } catch (error) {
            console.error('Error validando pago:', error);
            alert('Error al validar el pago');
        } finally {
            setValidando(false);
        }
    };

    const rechazarPago = async (order) => {
        if (!confirm('¿Estás seguro de rechazar este pago?')) return;

        setValidando(true);
        try {
            await pb.collection('orders').update(order.id, {
                estadoPago: 'rechazado',
                fechaValidacion: new Date().toISOString()
            });

            cargarOrdenes();
            setShowModal(false);
        } catch (error) {
            console.error('Error rechazando pago:', error);
            alert('Error al rechazar el pago');
        } finally {
            setValidando(false);
        }
    };

    const getTipoConfig = (tipo) => {
        const config = {
            contado: { icono: CreditCard, bg: 'bg-green-100', text: 'text-green-700', label: 'Contado' },
            credito: { icono: Package, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Crédito' },
            visita: { icono: Home, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Visita' },
            entrega: { icono: Truck, bg: 'bg-orange-100', text: 'text-orange-700', label: 'Entrega' }
        };
        return config[tipo] || { icono: ShoppingBag, bg: 'bg-gray-100', text: 'text-gray-700', label: tipo };
    };

    const getEstadoConfig = (estado) => {
        const config = {
            completada: { icono: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', label: 'Completada' },
            cancelada: { icono: XCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
            activa: { icono: CheckCircle, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Activa' },
            pendiente: { icono: Clock, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' }
        };
        return config[estado] || { icono: AlertCircle, bg: 'bg-gray-100', text: 'text-gray-700', label: estado };
    };

    const getPagoConfig = (estadoPago) => {
        const config = {
            pendiente: { icono: Clock, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Esperando validación' },
            validado: { icono: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', label: 'Validado' },
            rechazado: { icono: XCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazado' }
        };
        return config[estadoPago] || { icono: AlertCircle, bg: 'bg-gray-100', text: 'text-gray-700', label: estadoPago };
    };

    const formatMoney = (amount) => {
        if (!amount) return '$0';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const ordenesFiltradas = ordenes.filter(orden => {
        const matchesSearch = searchTerm === '' ||
            orden.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orden.productoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orden.id?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'todas') return matchesSearch;
        if (filter === 'pendientes') return matchesSearch && orden.estadoPago === 'pendiente';
        if (filter === 'validados') return matchesSearch && orden.estadoPago === 'validado';
        return matchesSearch && orden.tipo === filter;
    });

    const stats = {
        total: ordenes.length,
        contado: ordenes.filter(o => o.tipo === 'contado').length,
        credito: ordenes.filter(o => o.tipo === 'credito').length,
        visita: ordenes.filter(o => o.tipo === 'visita').length,
        entrega: ordenes.filter(o => o.tipo === 'entrega').length,
        pendientesValidacion: ordenes.filter(o => o.estadoPago === 'pendiente').length,
        validados: ordenes.filter(o => o.estadoPago === 'validado').length
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <>
            <Head>
                <title>Gestión de Órdenes | Admin</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto">
                    
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={20} className="text-[#6C3BFF]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h1>
                                <p className="text-sm text-gray-500">Administra todas las solicitudes y valida pagos</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <ShoppingBag size={18} className="text-purple-500" />
                                <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
                            </div>
                            <p className="text-xs text-gray-500">Total órdenes</p>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <Clock size={18} className="text-yellow-500" />
                                <span className="text-2xl font-bold text-yellow-600">{stats.pendientesValidacion}</span>
                            </div>
                            <p className="text-xs text-gray-500">Pendientes</p>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <CheckCircle size={18} className="text-green-500" />
                                <span className="text-2xl font-bold text-green-600">{stats.validados}</span>
                            </div>
                            <p className="text-xs text-gray-500">Completadas</p>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <CreditCard size={18} className="text-blue-500" />
                                <span className="text-2xl font-bold text-gray-900">{stats.contado}</span>
                            </div>
                            <p className="text-xs text-gray-500">Contado</p>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <Package size={18} className="text-indigo-500" />
                                <span className="text-2xl font-bold text-gray-900">{stats.credito}</span>
                            </div>
                            <p className="text-xs text-gray-500">Crédito</p>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <TrendingUp size={18} className="text-green-500" />
                                <span className="text-xl font-bold text-gray-900">{stats.entrega + stats.visita}</span>
                            </div>
                            <p className="text-xs text-gray-500">Visitas/Entregas</p>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent text-sm"
                                    placeholder="Buscar por cliente, producto o ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'todas', label: 'Todas', icono: ShoppingBag, color: 'purple', count: stats.total },
                                    { id: 'pendientes', label: 'Pendientes', icono: Clock, color: 'yellow', count: stats.pendientesValidacion },
                                    { id: 'validados', label: 'Completadas', icono: CheckCircle, color: 'green', count: stats.validados },
                                    { id: 'contado', label: 'Contado', icono: CreditCard, color: 'blue', count: stats.contado },
                                    { id: 'credito', label: 'Crédito', icono: Package, color: 'indigo', count: stats.credito }
                                ].map(f => {
                                    const Icono = f.icono;
                                    const isActive = filter === f.id;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setFilter(f.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                                isActive 
                                                    ? `bg-${f.color}-500 text-white shadow-sm` 
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            <Icono size={14} /> {f.label}
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                                isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {f.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    {ordenesFiltradas.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-700 mb-1">No hay órdenes</h3>
                            <p className="text-sm text-gray-400">No se encontraron órdenes en esta categoría.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {ordenesFiltradas.map((orden) => {
                                const TipoIcono = getTipoConfig(orden.tipo).icono;
                                const tipoConfig = getTipoConfig(orden.tipo);
                                const estadoConfig = getEstadoConfig(orden.estado);
                                const pagoConfig = getPagoConfig(orden.estadoPago);
                                const PagoIcono = pagoConfig.icono;
                                const isPendiente = orden.estadoPago === 'pendiente';
                                
                                return (
                                    <div key={orden.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-200 ${isPendiente ? 'border-yellow-200 bg-yellow-50/20' : 'border-gray-100'}`}>
                                        <div className="p-5">
                                            <div className="flex flex-wrap justify-between items-start gap-3">
                                                <div className="flex-1">
                                                    {/* Badges */}
                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tipoConfig.bg} ${tipoConfig.text}`}>
                                                            <TipoIcono size={12} /> {tipoConfig.label}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                                                            {estadoConfig.icono && <estadoConfig.icono size={12} />} {estadoConfig.label}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${pagoConfig.bg} ${pagoConfig.text}`}>
                                                            <PagoIcono size={12} /> {pagoConfig.label}
                                                        </span>
                                                    </div>

                                                    {/* Cliente info */}
                                                    <h3 className="font-bold text-gray-900 text-lg mb-1">{orden.cliente}</h3>
                                                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-2">
                                                        <span className="flex items-center gap-1"><Package size={12} /> {orden.productoNombre}</span>
                                                        {orden.clienteTelefono && (
                                                            <span className="flex items-center gap-1"><Phone size={12} /> {orden.clienteTelefono}</span>
                                                        )}
                                                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatFecha(orden.created)}</span>
                                                    </div>

                                                    {/* Financial info */}
                                                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                                        <span className="font-semibold text-gray-900">Total: {formatMoney(orden.totalPagar || orden.total)}</span>
                                                        {orden.enganche > 0 && (
                                                            <span className="text-purple-600">Enganche: {formatMoney(orden.enganche)}</span>
                                                        )}
                                                        {orden.pagoSemanal > 0 && (
                                                            <span className="text-blue-600">Semanal: {formatMoney(orden.pagoSemanal)}</span>
                                                        )}
                                                        {orden.saldoRestante > 0 && (
                                                            <span className="text-red-600">Restante: {formatMoney(orden.saldoRestante)}</span>
                                                        )}
                                                        {orden.semanasTotales > 0 && (
                                                            <span className="text-gray-500">{orden.semanasTotales} semanas</span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-gray-400 mt-2">ID: {orden.id.slice(-8)}</p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(orden);
                                                        setShowModal(true);
                                                    }}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${isPendiente ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-[#6C3BFF] text-white hover:bg-[#5a2ee6]'}`}
                                                >
                                                    <Eye size={14} /> {isPendiente ? 'Validar pago' : 'Ver detalles'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Modal de validación/detalles */}
                    {showModal && selectedOrder && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                                            <ShoppingBag size={16} className="text-[#6C3BFF]" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {selectedOrder.estadoPago === 'pendiente' ? 'Validar pago' : 'Detalles de la solicitud'}
                                        </h3>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">×</button>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Información del cliente */}
                                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User size={16} className="text-[#6C3BFF]" /> Datos del cliente</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{selectedOrder.cliente}</span></div>
                                            {selectedOrder.clienteTelefono && <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{selectedOrder.clienteTelefono}</span></div>}
                                            {selectedOrder.clienteEmail && <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedOrder.clienteEmail}</span></div>}
                                            <div><span className="text-gray-500">Fecha de solicitud:</span> <span className="font-medium">{formatFecha(selectedOrder.created)}</span></div>
                                        </div>
                                    </div>

                                    {/* Información del producto */}
                                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Package size={16} className="text-[#6C3BFF]" /> Información del producto</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Producto:</span><span className="font-medium">{selectedOrder.productoNombre}</span></div>
                                            <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Precio total:</span><span className="font-bold text-[#6C3BFF]">{formatMoney(selectedOrder.totalPagar || selectedOrder.total)}</span></div>
                                            {selectedOrder.enganche > 0 && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Enganche:</span><span className="font-medium">{formatMoney(selectedOrder.enganche)}</span></div>}
                                            {selectedOrder.pagoSemanal > 0 && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Pago semanal:</span><span className="font-medium">{formatMoney(selectedOrder.pagoSemanal)}</span></div>}
                                            {selectedOrder.semanasTotales > 0 && <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Semanas:</span><span className="font-medium">{selectedOrder.semanasTotales}</span></div>}
                                            {selectedOrder.saldoRestante > 0 && <div className="flex justify-between py-1"><span className="text-gray-500">Saldo restante:</span><span className="font-bold text-red-600">{formatMoney(selectedOrder.saldoRestante)}</span></div>}
                                        </div>
                                    </div>

                                    {/* Información de pago */}
                                    {selectedOrder.comprobante && (
                                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText size={16} className="text-[#6C3BFF]" /> Comprobante de pago</h4>
                                            <div className="text-center">
                                                <a href={pb.files.getURL(selectedOrder, selectedOrder.comprobante)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#6C3BFF] hover:underline text-sm">
                                                    <Eye size={14} /> Ver comprobante
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Dirección de entrega */}
                                    {(selectedOrder.direccionEntrega || selectedOrder.direccion) && (
                                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin size={16} className="text-[#6C3BFF]" /> Dirección de entrega</h4>
                                            <p className="text-sm text-gray-700">{selectedOrder.direccionEntrega || selectedOrder.direccion}</p>
                                        </div>
                                    )}

                                    {/* Botones de acción para validación */}
                                    {selectedOrder.estadoPago === 'pendiente' && (
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => validarPago(selectedOrder)}
                                                disabled={validando}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
                                            >
                                                <CheckCircle size={16} /> Validar pago
                                            </button>
                                            <button
                                                onClick={() => rechazarPago(selectedOrder)}
                                                disabled={validando}
                                                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50"
                                            >
                                                <XCircle size={16} /> Rechazar pago
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
                                    <button onClick={() => setShowModal(false)} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </>
    );
}