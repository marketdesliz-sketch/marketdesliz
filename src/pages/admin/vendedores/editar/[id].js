// src/pages/admin/vendedores/editar/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Percent,
  CheckCircle,
  AlertCircle,
  Smartphone,
  UserCheck,
  X
} from 'lucide-react';
import AdminLayout from '../../../../layouts/AdminLayout';
import pb from '../../../../lib/pocketbase';

export default function EditarVendedorPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [vendedor, setVendedor] = useState(null);
  const [usuario, setUsuario] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    zona: '',
    comisionPorcentaje: 50,
    activo: true
  });

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar autenticación
      if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }

      // Obtener vendedor con expand
      const vendedorData = await pb.collection('vendedores').getOne(id, {
        expand: 'userId'
      });

      if (!vendedorData) {
        setError('Vendedor no encontrado');
        setLoading(false);
        return;
      }

      setVendedor(vendedorData);

      const userData = vendedorData.expand?.userId;
      setUsuario(userData);

      setFormData({
        nombre: userData?.nombre || '',
        email: userData?.email || '',
        telefono: userData?.telefono || '',
        zona: vendedorData.zona || '',
        comisionPorcentaje: vendedorData.comisionPorcentaje || 50,
        activo: vendedorData.activo ?? true
      });

    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('No se pudo cargar la información del vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      setSaving(false);
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Ingresa un correo electrónico válido');
      setSaving(false);
      return;
    }

    const telefonoLimpio = formData.telefono?.replace(/\D/g, '');
    if (telefonoLimpio && telefonoLimpio.length !== 10) {
      setError('El teléfono debe tener 10 dígitos');
      setSaving(false);
      return;
    }

    try {
      // Actualizar usuario
      if (usuario?.id) {
        const userUpdate = {
          nombre: formData.nombre,
          email: formData.email
        };
        if (telefonoLimpio) {
          userUpdate.telefono = telefonoLimpio;
        }
        await pb.collection('users').update(usuario.id, userUpdate);
      }

      // Actualizar vendedor
      await pb.collection('vendedores').update(id, {
        zona: formData.zona,
        comisionPorcentaje: parseFloat(formData.comisionPorcentaje),
        activo: formData.activo
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/vendedores');
      }, 2000);

    } catch (error) {
      console.error('Error guardando cambios:', error);
      if (error.response?.data) {
        const detalles = Object.entries(error.response.data)
          .map(([campo, info]) => `${campo}: ${info.message}`)
          .join(', ');
        setError(`Error en los campos: ${detalles}`);
      } else {
        setError(error.message || 'Error al guardar los cambios');
      }
    } finally {
      setSaving(false);
    }
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

  if (error && !vendedor) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Vendedor no encontrado</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <Link
              href="/admin/vendedores"
              className="inline-flex items-center gap-2 bg-[#6C3BFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#5a2ee6] transition"
            >
              <ArrowLeft size={16} /> Volver a vendedores
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Editar Vendedor | Admin MarketDesliz</title>
      </Head>

      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin/vendedores"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition mb-4"
            >
              <ArrowLeft size={14} /> Volver a la lista
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                <UserCheck size={24} className="text-[#6C3BFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Vendedor</h1>
                <p className="text-sm text-gray-500">
                  Código: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{vendedor?.codigo}</code>
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Éxito */}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="text-sm text-green-700">¡Cambios guardados exitosamente! Redirigiendo...</p>
                </div>
              )}

              {/* Error */}
              {error && !success && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Nombre completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Correo electrónico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="55 1234 5678"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">10 dígitos, ejemplo: 5512345678</p>
              </div>

              {/* Zona de trabajo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona de trabajo
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="zona"
                    value={formData.zona}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="Norte, Centro, Sur, etc."
                  />
                </div>
              </div>

              {/* Comisión */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de comisión (%)
                </label>
                <div className="relative">
                  <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    name="comisionPorcentaje"
                    value={formData.comisionPorcentaje}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent bg-white"
                  >
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                    <option value="60">60%</option>
                  </select>
                </div>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-700">Estado del vendedor</p>
                  <p className="text-xs text-gray-400">Activo puede iniciar sesión y recibir solicitudes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleCheckboxChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6C3BFF]/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C3BFF]"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">
                    {formData.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Link
                  href="/admin/vendedores"
                  className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#6C3BFF] hover:bg-[#5a2ee6] disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}