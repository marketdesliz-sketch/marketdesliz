// src/pages/admin/vendedores/crear.js - OPTIMIZADO
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Percent,
  Lock,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Users,
  Key,
  Smartphone,
  User
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { crearVendedorCompleto } from '../../../lib/vendedorService';

export default function CrearVendedorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vendedorCreado, setVendedorCreado] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    zona: '',
    comisionPorcentaje: 50,
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copiarCredenciales = () => {
    const credenciales = `📋 CREDENCIALES DEL VENDEDOR\n\n` +
      `Nombre: ${vendedorCreado.nombre}\n` +
      `Email: ${vendedorCreado.email}\n` +
      `Contraseña: ${formData.password}\n` +
      `Código: ${vendedorCreado.codigo}\n\n` +
      `🔗 Inicio de sesión: /vendedor/login`;

    navigator.clipboard.writeText(credenciales);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Ingresa un correo electrónico válido');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const telefonoLimpio = formData.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length !== 10) {
      setError('Ingresa un número de teléfono válido de 10 dígitos');
      setLoading(false);
      return;
    }

    try {
      const resultado = await crearVendedorCompleto({
        nombre: formData.nombre,
        email: formData.email,
        telefono: telefonoLimpio,
        zona: formData.zona,
        comisionPorcentaje: parseFloat(formData.comisionPorcentaje),
        password: formData.password
      });

      if (resultado.success) {
        setVendedorCreado(resultado.data);
        setSuccess(true);
        setCopied(false);

        // Limpiar formulario (opcional, pero ya lo hacemos)
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          zona: '',
          comisionPorcentaje: 50,
          password: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          router.push('/admin/vendedores');
        }, 3000);
      } else {
        setError(resultado.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setError('Error inesperado al crear el vendedor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setVendedorCreado(null);
    setCopied(false);
    setError('');
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      zona: '',
      comisionPorcentaje: 50,
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <>
      <Head>
        <title>Crear Vendedor | Admin MarketDesliz</title>
      </Head>

      <AdminLayout>
        <div className="max-w-3xl mx-auto">

          {/* Success Card */}
          {success && vendedorCreado && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-green-800">¡Vendedor creado exitosamente!</h2>
                  <p className="text-sm text-green-600">Las credenciales han sido generadas</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="font-medium text-gray-900">{vendedorCreado.nombre}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium text-gray-900">{vendedorCreado.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <span className="text-gray-500">Código:</span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{vendedorCreado.codigo}</code>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500">Contraseña:</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{formData.password}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={copiarCredenciales}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    copied
                      ? 'bg-green-200 text-green-800'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle size={14} /> ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copiar credenciales
                    </>
                  )}
                </button>
                <Link
                  href="/admin/vendedores"
                  className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-200 transition"
                >
                  <Users size={14} /> Ver lista de vendedores
                </Link>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-200 transition"
                >
                  <UserPlus size={14} /> Crear otro vendedor
                </button>
              </div>

              <div className="text-sm text-green-700 bg-green-100/50 rounded-lg p-3">
                <p>📋 Las credenciales son únicas. El vendedor puede iniciar sesión en: <strong className="font-mono">/vendedor/login</strong></p>
              </div>
              <p className="text-xs text-green-600 mt-2">🔄 Serás redirigido automáticamente en 3 segundos...</p>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C3BFF]/10 rounded-xl flex items-center justify-center">
                  <UserPlus size={20} className="text-[#6C3BFF]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Crear nuevo vendedor</h1>
                  <p className="text-sm text-gray-500">Completa el formulario para registrar un nuevo vendedor</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nombre completo */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="Carlos López García"
                    required
                  />
                </div>
              </div>

              {/* Correo electrónico */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="carlos@marketdesliz.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Este será el correo para iniciar sesión</p>
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                    placeholder="55 1234 5678"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">10 dígitos, ejemplo: 5512345678</p>
              </div>

              {/* Zona de trabajo */}
              <div>
                <label htmlFor="zona" className="block text-sm font-medium text-gray-700 mb-1">
                  Zona de trabajo
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="zona"
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
                <label htmlFor="comisionPorcentaje" className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de comisión (%)
                </label>
                <div className="relative">
                  <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    id="comisionPorcentaje"
                    name="comisionPorcentaje"
                    value={formData.comisionPorcentaje}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent bg-white appearance-none"
                  >
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50% (recomendado)</option>
                    <option value="60">60%</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-1">El vendedor gana este porcentaje del enganche del cliente</p>
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-[#6C3BFF] text-white py-3 rounded-xl font-semibold hover:bg-[#5a2ee6] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando vendedor...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Crear vendedor
                  </>
                )}
              </button>

              {/* Back link */}
              <div className="text-center pt-2">
                <Link
                  href="/admin/vendedores"
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#6C3BFF] transition"
                >
                  <ArrowLeft size={14} /> Volver a la lista de vendedores
                </Link>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}