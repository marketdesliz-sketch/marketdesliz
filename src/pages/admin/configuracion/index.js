// src/pages/admin/configuracion/index.js - OPTIMIZADO
import { useEffect, useState, useCallback } from 'react';
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
  Award,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import pb from '../../../lib/pocketbase';
import { sincronizarTodasCategorias } from '../../../lib/categorias';
import {
  getNivelesList,
  createNivel,
  updateNivel,
  deleteNivel
} from '../../../lib/nivelAdminService';
import { formatMoney } from '../../../lib/utils';

const TABS = [
  { id: 'general', label: 'General', icon: Store },
  { id: 'pagos', label: 'Pagos y Crédito', icon: CreditCard },
  { id: 'niveles', label: 'Niveles', icon: Award },
  { id: 'categorias', label: 'Categorías', icon: Tag }
];

// ─── Utilidades locales ────────────────────────────────────────────────
const esTelefonoValido = (telefono) => {
  if (!telefono) return true; // opcional
  const limpio = telefono.replace(/\D/g, '');
  return /^\d{10}$/.test(limpio);
};

const esColorValido = (color) => {
  return /^#([A-Fa-f0-9]{6})$/.test(color);
};

export default function AdminConfiguracionPage() {
  const router = useRouter();
  const { tab = 'general' } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(tab);
  const [configId, setConfigId] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // ─── Configuración general ──────────────────────────────────────────
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

  // ─── Niveles ──────────────────────────────────────────────────────────
  const [niveles, setNiveles] = useState([]);
  const [nivelesLoading, setNivelesLoading] = useState(false);
  const [showNivelModal, setShowNivelModal] = useState(false);
  const [editingNivel, setEditingNivel] = useState(null);
  const [nivelForm, setNivelForm] = useState({
    nivel: '',
    nombre: '',
    productosRequeridos: '',
    limiteDeuda: '',
    tandaDisponible: '',
    maxProductosCurso: 3,
    colorTarjeta: '#6C3BFF',
    icono: '⭐'
  });
  const [savingNivel, setSavingNivel] = useState(false);
  const [nivelesLoaded, setNivelesLoaded] = useState(false);

  // ─── Sincronización de categorías ────────────────────────────────────
  const [sincronizando, setSincronizando] = useState(false);
  const [resultadoSync, setResultadoSync] = useState(null);

  // ─── Cargar configuración general ──────────────────────────────────
  const cargarConfig = useCallback(async () => {
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
  }, []);

  // ─── Cargar niveles desde PocketBase ──────────────────────────────
  const cargarNiveles = useCallback(async () => {
    setNivelesLoading(true);
    try {
      const data = await getNivelesList();
      setNiveles(data);
      setNivelesLoaded(true);  // ✅ evita futuras recargas automáticas
    } catch (error) {
      console.error('Error cargando niveles:', error);
      setError('No se pudieron cargar los niveles');
      setTimeout(() => setError(''), 5000);
    } finally {
      setNivelesLoading(false);
    }
  }, []);

  // ─── Efecto inicial ──────────────────────────────────────────────────
  useEffect(() => {
    const verificarAdmin = async () => {
      if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      await cargarConfig();
      if (activeTab === 'niveles') {
        await cargarNiveles();
      }
      setLoading(false);
    };
    verificarAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cargar niveles cuando se selecciona el tab y no hay datos ────
  useEffect(() => {
    if (activeTab === 'niveles' && !nivelesLoaded) {
      cargarNiveles();
    }
  }, [activeTab, nivelesLoaded, cargarNiveles]);

  // ─── Persistencia de tab en URL ────────────────────────────────────
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    router.push({ query: { tab: newTab } }, undefined, { shallow: true });
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // ─── Limpiar mensajes ──────────────────────────────────────────────
  const clearSuccess = () => setSuccess('');
  const clearError = () => setError('');

  // ─── Guardar configuración general ──────────────────────────────────
  const handleSave = async () => {
    // Validaciones
    if (config.emailContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.emailContacto)) {
      setError('Correo electrónico inválido');
      setTimeout(() => setError(''), 5000);
      return;
    }
    if (!esTelefonoValido(config.telefonoContacto)) {
      setError('Teléfono inválido (10 dígitos)');
      setTimeout(() => setError(''), 5000);
      return;
    }
    if (config.comisionVendedorDefault < 0 || config.comisionVendedorDefault > 100) {
      setError('La comisión debe estar entre 0 y 100');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const oldConfig = configId ? await pb.collection('config_sistema').getOne(configId) : null;

      if (configId) {
        await pb.collection('config_sistema').update(configId, config);
      } else {
        const nuevo = await pb.collection('config_sistema').create(config);
        setConfigId(nuevo.id);
      }

      // Registrar auditoría
      try {
        await pb.collection('log_actividad').create({
          usuarioId: pb.authStore.model.id,
          entidad: 'config_sistema',
          entidadId: configId || 'nuevo',
          accion: configId ? 'update' : 'create',
          datosPrevios: oldConfig ? JSON.stringify(oldConfig) : null,
          datosNuevos: JSON.stringify(config)
        });
      } catch (logError) {
        console.warn('Error registrando auditoría:', logError);
      }

      setSuccess('✅ Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setError(error.message || 'Error al guardar la configuración');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleNivelSubmit = async (e) => {
    e.preventDefault();
    setSavingNivel(true);
    setError('');
    setSuccess('');

    const nivelNum = parseInt(nivelForm.nivel);
    if (isNaN(nivelNum) || nivelNum < 1) {
      setError('El nivel debe ser un número positivo');
      setTimeout(() => setError(''), 5000);
      setSavingNivel(false);
      return;
    }
    if (!nivelForm.nombre.trim()) {
      setError('El nombre es obligatorio');
      setTimeout(() => setError(''), 5000);
      setSavingNivel(false);
      return;
    }
    if (parseInt(nivelForm.productosRequeridos) < 0) {
      setError('Productos requeridos no puede ser negativo');
      setTimeout(() => setError(''), 5000);
      setSavingNivel(false);
      return;
    }
    // Validación de color hex
    if (!esColorValido(nivelForm.colorTarjeta)) {
      setError('El color debe estar en formato hexadecimal válido (ej: #6C3BFF)');
      setTimeout(() => setError(''), 5000);
      setSavingNivel(false);
      return;
    }

    try {
      const data = {
        nivel: nivelNum,
        nombre: nivelForm.nombre.trim(),
        productosRequeridos: parseInt(nivelForm.productosRequeridos) || 0,
        limiteDeuda: parseFloat(nivelForm.limiteDeuda) || 0,
        tandaDisponible: parseFloat(nivelForm.tandaDisponible) || 0,
        maxProductosCurso: parseInt(nivelForm.maxProductosCurso) || 3,
        colorTarjeta: nivelForm.colorTarjeta || '#6C3BFF',
        icono: nivelForm.icono || '⭐'
      };

      if (editingNivel) {
        await updateNivel(editingNivel.id, data);
        setSuccess('✅ Nivel actualizado correctamente');
      } else {
        await createNivel(data);
        setSuccess('✅ Nivel creado correctamente');
      }

      setShowNivelModal(false);
      setEditingNivel(null);
      resetNivelForm();
      // Recargar niveles
      setNivelesLoaded(false);
      await cargarNiveles();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error guardando nivel:', error);
      setError(error.message || 'Error al guardar el nivel');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSavingNivel(false);
    }
  };

  const handleEditNivel = (nivel) => {
    setEditingNivel(nivel);
    setNivelForm({
      nivel: nivel.nivel || '',
      nombre: nivel.nombre || '',
      productosRequeridos: nivel.productosRequeridos || '',
      limiteDeuda: nivel.limiteDeuda || '',
      tandaDisponible: nivel.tandaDisponible || '',
      maxProductosCurso: nivel.maxProductosCurso || 3,
      colorTarjeta: nivel.colorTarjeta || '#6C3BFF',
      icono: nivel.icono || '⭐'
    });
    setShowNivelModal(true);
  };

  const handleDeleteNivel = async (id, nombre) => {
    if (!confirm(`¿Eliminar el nivel "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteNivel(id);
      setSuccess(`✅ Nivel "${nombre}" eliminado`);
      setNivelesLoaded(false);
      await cargarNiveles();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error eliminando nivel:', error);
      setError(error.message || 'Error al eliminar el nivel');
      setTimeout(() => setError(''), 5000);
    }
  };

  const resetNivelForm = () => {
    setNivelForm({
      nivel: '',
      nombre: '',
      productosRequeridos: '',
      limiteDeuda: '',
      tandaDisponible: '',
      maxProductosCurso: 3,
      colorTarjeta: '#6C3BFF',
      icono: '⭐'
    });
  };

  // ─── Sincronizar categorías ──────────────────────────────────────────
  const handleSincronizar = async () => {
    setSincronizando(true);
    setResultadoSync(null);
    try {
      const resultado = await sincronizarTodasCategorias();
      // Se espera que resultado sea un objeto con { success, created, updated, errors }
      if (resultado && typeof resultado === 'object') {
        const { success, created, updated, errors } = resultado;
        if (success) {
          setResultadoSync({
            exito: true,
            mensaje: `✅ Categorías sincronizadas: ${created || 0} creadas, ${updated || 0} actualizadas. ${errors ? errors.length + ' errores' : ''}`
          });
        } else {
          setResultadoSync({
            exito: false,
            mensaje: `❌ Error al sincronizar: ${errors || 'Error desconocido'}`
          });
        }
      } else {
        // Fallback si la función devuelve solo booleano
        setResultadoSync({
          exito: resultado,
          mensaje: resultado
            ? '✅ Categorías sincronizadas correctamente'
            : '❌ Error al sincronizar categorías'
        });
      }
    } catch (error) {
      setResultadoSync({
        exito: false,
        mensaje: error.message || 'Error al sincronizar categorías'
      });
    } finally {
      setSincronizando(false);
    }
  };

  // ─── Renderizado ──────────────────────────────────────────────────────
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

        {/* Mensajes globales con botón de cierre */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={clearSuccess} className="text-green-500 hover:text-green-700">
              <X size={16} />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs con persistencia */}
        <div className="bg-white rounded-xl border border-gray-100 p-2 mb-6 shadow-sm flex gap-2 flex-wrap">
          {TABS.map(tabItem => {
            const Icono = tabItem.icon;
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => handleTabChange(tabItem.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                  ? 'bg-[#6C3BFF] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Icono size={16} /> {tabItem.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: GENERAL ────────────────────────────────────────── */}
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
                <label htmlFor="nombreTienda" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tienda</label>
                <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-medium">
                  {config.nombreTienda || 'MarketDesliz'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telefonoContacto" className="block text-sm font-medium text-gray-700 mb-1">Teléfono de contacto</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="telefonoContacto"
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
                  <label htmlFor="emailContacto" className="block text-sm font-medium text-gray-700 mb-1">Correo de contacto</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="emailContacto"
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
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="direccion"
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
                <label htmlFor="horarioAtencion" className="block text-sm font-medium text-gray-700 mb-1">Horario de atención</label>
                <input
                  id="horarioAtencion"
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

        {/* ── TAB: PAGOS Y CRÉDITO ────────────────────────────────── */}
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
                  <label htmlFor="comisionVendedorDefault" className="block text-sm font-medium text-gray-700 mb-1">Comisión de vendedor por defecto (%)</label>
                  <div className="relative">
                    <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="comisionVendedorDefault"
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
                  <label htmlFor="porcentajeEngancheDefault" className="block text-sm font-medium text-gray-700 mb-1">Enganche por defecto (%)</label>
                  <div className="relative">
                    <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="porcentajeEngancheDefault"
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
                  <label htmlFor="gasFeeTanda" className="block text-sm font-medium text-gray-700 mb-1">Gas fee de tanda</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="gasFeeTanda"
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
                  <label htmlFor="limiteDeudaDefault" className="block text-sm font-medium text-gray-700 mb-1">Límite de deuda por defecto</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="limiteDeudaDefault"
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
                  <label htmlFor="diasGraciaPago" className="block text-sm font-medium text-gray-700 mb-1">Días de gracia para pagos</label>
                  <input
                    id="diasGraciaPago"
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

        {/* ── TAB: NIVELES (DINÁMICO CON CRUD) ──────────────────── */}
        {activeTab === 'niveles' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award size={16} className="text-[#6C3BFF]" /> Sistema de niveles de cliente
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Configuración de <code className="bg-gray-100 px-1 rounded">config_niveles</code> — el nivel se calcula automáticamente según productos pagados
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingNivel(null);
                  resetNivelForm();
                  setShowNivelModal(true);
                }}
                className="flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
              >
                <Plus size={16} /> Nuevo nivel
              </button>
            </div>

            {nivelesLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : niveles.length === 0 ? (
              <div className="text-center py-12">
                <Award size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay niveles configurados</p>
                <button
                  onClick={() => {
                    setEditingNivel(null);
                    resetNivelForm();
                    setShowNivelModal(true);
                  }}
                  className="mt-3 text-[#6C3BFF] text-sm hover:underline"
                >
                  Crear primer nivel
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Productos requeridos</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanda disponible</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Límite de deuda</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Máx. productos en curso</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {niveles.map((n, index) => (
                      <tr key={n.id} className={`hover:bg-gray-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-5 py-3">
                          <span className="font-mono font-bold text-gray-900">{n.nivel}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: `${n.colorTarjeta || '#6C3BFF'}1A`, color: n.colorTarjeta || '#6C3BFF' }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: n.colorTarjeta || '#6C3BFF' }} />
                            {n.nombre} {n.icono && <span className="ml-1">{n.icono}</span>}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">{n.productosRequeridos}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-[#6C3BFF]">{formatMoney(n.tandaDisponible)}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{formatMoney(n.limiteDeuda)}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{n.maxProductosCurso}</td>
                        <td className="px-5 py-3">
                          <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: n.colorTarjeta || '#6C3BFF' }} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditNivel(n)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                              aria-label="Editar nivel"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteNivel(n.id, n.nombre)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                              aria-label="Eliminar nivel"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700">
                ⚠️ Los cambios en los niveles afectan el cálculo de nivel de los clientes. Modifica con cuidado.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: CATEGORÍAS ────────────────────────────────────── */}
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
                <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${resultadoSync.exito ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {resultadoSync.exito ? (
                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
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

      {/* ─── Modal de creación/edición de niveles ────────────────────── */}
      {showNivelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNivelModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#6C3BFF]/10 rounded-lg flex items-center justify-center">
                  <Award size={16} className="text-[#6C3BFF]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingNivel ? 'Editar nivel' : 'Nuevo nivel'}
                </h2>
              </div>
              <button onClick={() => setShowNivelModal(false)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition" aria-label="Cerrar modal">×</button>
            </div>

            <form onSubmit={handleNivelSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nivelNumero" className="block text-sm font-medium text-gray-700 mb-1">Nivel *</label>
                  <input
                    id="nivelNumero"
                    type="number"
                    value={nivelForm.nivel}
                    onChange={(e) => setNivelForm({ ...nivelForm, nivel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="nivelNombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    id="nivelNombre"
                    type="text"
                    value={nivelForm.nombre}
                    onChange={(e) => setNivelForm({ ...nivelForm, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                    placeholder="Básico"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="productosRequeridos" className="block text-sm font-medium text-gray-700 mb-1">Productos requeridos</label>
                  <input
                    id="productosRequeridos"
                    type="number"
                    value={nivelForm.productosRequeridos}
                    onChange={(e) => setNivelForm({ ...nivelForm, productosRequeridos: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                    placeholder="1"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="limiteDeuda" className="block text-sm font-medium text-gray-700 mb-1">Límite de deuda ($)</label>
                  <input
                    id="limiteDeuda"
                    type="number"
                    value={nivelForm.limiteDeuda}
                    onChange={(e) => setNivelForm({ ...nivelForm, limiteDeuda: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                    placeholder="5000"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tandaDisponible" className="block text-sm font-medium text-gray-700 mb-1">Tanda disponible ($)</label>
                  <input
                    id="tandaDisponible"
                    type="number"
                    value={nivelForm.tandaDisponible}
                    onChange={(e) => setNivelForm({ ...nivelForm, tandaDisponible: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                    placeholder="1000"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="maxProductosCurso" className="block text-sm font-medium text-gray-700 mb-1">Máx. productos en curso</label>
                  <input
                    id="maxProductosCurso"
                    type="number"
                    value={nivelForm.maxProductosCurso}
                    onChange={(e) => setNivelForm({ ...nivelForm, maxProductosCurso: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                    placeholder="3"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="colorTarjeta" className="block text-sm font-medium text-gray-700 mb-1">Color de tarjeta</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="colorTarjetaPicker"
                      type="color"
                      value={nivelForm.colorTarjeta || '#6C3BFF'}
                      onChange={(e) => setNivelForm({ ...nivelForm, colorTarjeta: e.target.value })}
                      className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer"
                    />
                    <input
                      id="colorTarjeta"
                      type="text"
                      value={nivelForm.colorTarjeta || '#6C3BFF'}
                      onChange={(e) => setNivelForm({ ...nivelForm, colorTarjeta: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                      placeholder="#6C3BFF"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="icono" className="block text-sm font-medium text-gray-700 mb-1">Icono (emojis)</label>
                  <input
                    id="icono"
                    type="text"
                    value={nivelForm.icono || '⭐'}
                    onChange={(e) => setNivelForm({ ...nivelForm, icono: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF]"
                    placeholder="⭐"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={savingNivel}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50"
                >
                  {savingNivel ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} /> {editingNivel ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNivelModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}