// src/pages/admin/configuracion/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Settings,
  Save,
  Store,
  Percent,
  Layers,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Tag,
  Award
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import pb from '../../../lib/pocketbase';
import { sincronizarTodasCategorias } from '../../../lib/categoriasService';

// Tabla de niveles — referencia fija definida en config_niveles
const NIVELES = [
  { nivel: 1, nombre: 'Básico', productos: 1, tanda: 1000, color: '#9CA3AF' },
  { nivel: 3, nombre: 'Bronce', productos: 3, tanda: 3000, color: '#CD7F32' },
  { nivel: 5, nombre: 'Plata', productos: 5, tanda: 5000, color: '#C0C0C0' },
  { nivel: 10, nombre: 'Oro', productos: 10, tanda: 10000, color: '#F59E0B' },
  { nivel: 20, nombre: 'Platino', productos: 20, tanda: 20000, color: '#94A3B8' },
  { nivel: 30, nombre: 'Diamante', productos: 30, tanda: 30000, color: '#60A5FA' },
  { nivel: 40, nombre: 'Zafiro', productos: 40, tanda: 40000, color: '#3B82F6' },
  { nivel: 50, nombre: 'Rubí', productos: 50, tanda: 50000, color: '#DC2626' }
];

const TABS = [
  { id: 'general', label: 'General', icon: Store },
  { id: 'pagos', label: 'Pagos y Crédito', icon: CreditCard },
  { id: 'niveles', label: 'Niveles', icon: Award },
  { id: 'categorias', label: 'Categorías', icon: Tag }
];

export default function AdminConfiguracionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [configId, setConfigId] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [config, setConfig] = useState({
    nombreTienda: 'MarketDesliz',
    telefonoContacto: '',
    emailContacto: '',
    direccion: '',
    horarioAtencion: '',
    comisionVendedorDefault: 50,
    gasFeeTanda: 25,
    limiteDeudaDefault: 5000,
    diasGraciaPago: 2,
    porcentajeEngancheDefault: 20
  });

  // Estado para sincronización de categorías
  const [sincronizando, setSincronizando] = useState(false);
  const [resultadoSync, setResultadoSync] = useState(null);

  useEffect(() => {
    verificarAdmin();
  }, []);

  const verificarAdmin = async () => {
    try {
      if (!pb.authStore.isValid) {
        router.push('/admin/login');
        return;
      }
      const user = pb.authStore.model;
      if (user?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      await cargarConfig();
    } catch (error) {
      console.error('Error en verificación:', error);
      router.push('/admin/login');
    }
  };

  const cargarConfig = async () => {
    try {
      setLoading(true);

      const records = await pb.collection('config_sistema').getFullList({ limit: 1 });

      if (records.length > 0) {
        const record = records[0];
        setConfigId(record.id);
        setConfig({
          nombreTienda: record.nombreTienda || 'MarketDesliz',
          telefonoContacto: record.telefonoContacto || '',
          emailContacto: record.emailContacto || '',
          direccion: record.direccion || '',
          horarioAtencion: record.horarioAtencion || '',
          comisionVendedorDefault: record.comisionVendedorDefault ?? 50,
          gasFeeTanda: record.gasFeeTanda ?? 25,
          limiteDeudaDefault: record.limiteDeudaDefault ?? 5000,
          diasGraciaPago: record.diasGraciaPago ?? 2,
          porcentajeEngancheDefault: record.porcentajeEngancheDefault ?? 20
        });
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setConfig({
      ...config,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (configId) {
        await pb.collection('config_sistema').update(configId, config);
      } else {
        const nuevo = await pb.collection('config_sistema').create(config);
        setConfigId(nuevo.id);
      }
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setError(error.message || 'Error al guardar la configuración');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleSincronizar = async () => {
    setSincronizando(true);
    setResultadoSync(null);

    try {
      const exito = await sincronizarTodasCategorias();
      setResultadoSync({
        exito,
        mensaje: exito
          ? 'Categorías sincronizadas correctamente con PocketBase'
          : 'Error al sincronizar categorías'
      });
    } catch (error) {
      setResultadoSync({
        exito: false,
        mensaje: error.message || 'Error al sincronizar categorías'
      });
    } finally {
      setSincronizando(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
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
        <title>Configuración | Admin MarketDesliz</title>
      </Head>

      <AdminLayout>
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <Settings size={20} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="text-sm text-gray-500">Ajustes generales de la plataforma MarketDesliz</p>
              </div>
            </div>
          </div>

          {/* Mensajes globales */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 p-2 mb-6 shadow-sm flex gap-2 flex-wrap">
            {TABS.map(tab => {
              const Icono = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#6C3BFF] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icono size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB: GENERAL ─────────────────────────────── */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Store size={16} className="text-[#6C3BFF]" /> Información de la tienda
                </h2>
                <p className="text-xs text-gray-500 mt-1">Estos datos se muestran en el footer y páginas de contacto</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tienda</label>
                  <input
                    type="text"
                    name="nombreTienda"
                    value={config.nombreTienda}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="MarketDesliz"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de contacto</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="telefonoContacto"
                        value={config.telefonoContacto}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                        placeholder="(+52) 282-141-4939"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo de contacto</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="emailContacto"
                        value={config.emailContacto}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                        placeholder="marketdesliz@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="direccion"
                      value={config.direccion}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      placeholder="Calle, número, colonia, ciudad"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horario de atención</label>
                  <input
                    type="text"
                    name="horarioAtencion"
                    value={config.horarioAtencion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="Lun–Vie: 9am – 6pm"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: PAGOS Y CRÉDITO ─────────────────────── */}
          {activeTab === 'pagos' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-[#6C3BFF]" /> Parámetros de pagos y crédito
                </h2>
                <p className="text-xs text-gray-500 mt-1">Valores por defecto usados al crear nuevas órdenes, tandas y vendedores</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comisión de vendedor por defecto (%)</label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="comisionVendedorDefault"
                        value={config.comisionVendedorDefault}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Aplicada al crear un nuevo vendedor</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enganche por defecto (%)</label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="porcentajeEngancheDefault"
                        value={config.porcentajeEngancheDefault}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Sugerido al calcular el enganche en productos nuevos</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas fee de tanda</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="gasFeeTanda"
                        value={config.gasFeeTanda}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Costo fijo al unirse a una tanda nueva</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Límite de deuda por defecto</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="limiteDeudaDefault"
                        value={config.limiteDeudaDefault}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Aplicado a nuevos registros en <code className="bg-gray-100 px-1 rounded">clients</code></p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Días de gracia para pagos</label>
                    <input
                      type="number"
                      name="diasGraciaPago"
                      value={config.diasGraciaPago}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Días después del vencimiento antes de marcar un pago como atrasado</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: NIVELES (referencia) ────────────────── */}
          {activeTab === 'niveles' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award size={16} className="text-[#6C3BFF]" /> Sistema de niveles de cliente
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Configuración de <code className="bg-gray-100 px-1 rounded">config_niveles</code> — el nivel se calcula automáticamente según productos pagados
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Productos requeridos</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanda disponible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {NIVELES.map((n, index) => (
                      <tr key={n.nivel} className={`hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-5 py-3">
                          <span className="font-mono font-bold text-gray-900">{n.nivel}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: `${n.color}1A`, color: n.color }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: n.color }} />
                            {n.nombre}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">{n.productos} producto{n.productos !== 1 ? 's' : ''} pagado{n.productos !== 1 ? 's' : ''}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-[#6C3BFF]">{formatMoney(n.tanda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
                <p className="text-xs text-amber-700">
                  Esta tabla es de referencia. El cálculo de nivel se realiza con <code className="bg-amber-100 px-1 rounded">calcularNivel(productosPagados)</code> en <code className="bg-amber-100 px-1 rounded">nivelClienteService.js</code>.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB: CATEGORÍAS ───────────────────────────── */}
          {activeTab === 'categorias' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Tag size={16} className="text-[#6C3BFF]" /> Sincronizar categorías
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Copia todas las categorías de <code className="bg-gray-100 px-1 rounded">categorias.js</code> a PocketBase para que sean dinámicas
                </p>
              </div>
              <div className="p-6">
                <button
                  onClick={handleSincronizar}
                  disabled={sincronizando}
                  className="flex items-center gap-2 bg-[#6C3BFF] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#5a2ee6] transition disabled:opacity-50"
                >
                  {sincronizando ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      Sincronizar ahora
                    </>
                  )}
                </button>

                {resultadoSync && (
                  <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                    resultadoSync.exito ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {resultadoSync.exito ? (
                      <CheckCircle size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                    <span className="text-sm">{resultadoSync.mensaje}</span>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Layers size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">¿Cuándo sincronizar?</p>
                      <p className="text-sm text-blue-600">
                        Ejecuta esta sincronización cada vez que agregues o modifiques categorías en el código
                        fuente, para que aparezcan disponibles en los filtros de catálogo, formularios de productos
                        y el panel de negocios aliados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </AdminLayout>
    </>
  );
}