// src/components/clients/CreateClientForm.jsx
import { useState } from 'react';
import { UserPlus, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import pb from '../../lib/pocketbase';
import { generarPasswordTemporal } from '../../lib/authService';

export default function CreateClientForm({ onCreated, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccionCalle: '',
    direccionNumero: '',
    direccionColonia: '',
    direccionMunicipio: '',
    direccionCiudad: '',
    direccionEstado: '',
    direccionCp: '',
    diaPago: 'lunes',
    telefonoAlternativo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!formData.telefono || formData.telefono.replace(/\D/g, '').length !== 10) {
        throw new Error('El teléfono debe tener 10 dígitos');
      }

      const cleanPhone = formData.telefono.replace(/\D/g, '');
      const tempEmail = formData.email || `user_${cleanPhone}@marketdesliz.com`;
      const tempPassword = generarPasswordTemporal();
      const generarTokenKey = () => 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Verificar si el teléfono ya existe
      const existingUser = await pb.collection('users').getFirstListItem(
        `telefono = "${cleanPhone}"`
      ).catch(() => null);

      if (existingUser) {
        throw new Error('Este número de teléfono ya está registrado');
      }

      // Verificar si el email ya existe
      if (formData.email) {
        const existingEmail = await pb.collection('users').getFirstListItem(
          `email = "${formData.email}"`
        ).catch(() => null);
        if (existingEmail) {
          throw new Error('Este email ya está registrado');
        }
      }

      // Crear usuario
      const newUser = await pb.collection('users').create({
        email: tempEmail,
        password: tempPassword,
        passwordConfirm: tempPassword,
        emailVisibility: false,
        verified: false,
        role: 'cliente',
        nombre: formData.nombre,
        activo: true,
        telefono: cleanPhone,
        tokenKey: generarTokenKey()
      });

      // Crear registro en clients
      await pb.collection('clients').create({
        userId: newUser.id,
        telefono: cleanPhone,
        nombre: formData.nombre,
        direccionCalle: formData.direccionCalle || '',
        direccionNumero: formData.direccionNumero || '',
        direccionColonia: formData.direccionColonia || '',
        direccionMunicipio: formData.direccionMunicipio || '',
        direccionCiudad: formData.direccionCiudad || '',
        direccionEstado: formData.direccionEstado || '',
        direccionCp: formData.direccionCp || '',
        diaPago: formData.diaPago || 'lunes',
        telefonoAlternativo: formData.telefonoAlternativo || '',
        nivel: 0,
        productosComprados: 0,
        productosPagados: 0,
        productosEnCurso: 0,
        deudaActual: 0,
        limiteDeuda: 5000,
        estadoKyc: 'pendiente',
        trustScore: 0,
        datosCompletos: false,
        totalGastado: 0
      });

      // Crear provider phone
      await pb.collection('user_providers').create({
        userId: newUser.id,
        provider: 'phone',
        telefono: cleanPhone,
        isActive: true
      });

      setSuccess(true);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccionCalle: '',
        direccionNumero: '',
        direccionColonia: '',
        direccionMunicipio: '',
        direccionCiudad: '',
        direccionEstado: '',
        direccionCp: '',
        diaPago: 'lunes',
        telefonoAlternativo: ''
      });

      if (onCreated) {
        setTimeout(() => {
          onCreated(newUser);
        }, 1500);
      }

      // Limpiar éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error('Error creando cliente:', error);
      setError(error.message || 'Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <UserPlus size={18} className="text-[#6C3BFF]" />
          Nuevo Cliente
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} className="text-red-500 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg">
            <CheckCircle size={16} className="text-[#10b981] mt-0.5" />
            <p className="text-sm text-[#10b981]">¡Cliente creado exitosamente!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="55 1234 5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Día de pago preferido</label>
            <select
              name="diaPago"
              value={formData.diaPago}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
            >
              <option value="lunes">Lunes</option>
              <option value="martes">Martes</option>
              <option value="miercoles">Miércoles</option>
              <option value="jueves">Jueves</option>
              <option value="viernes">Viernes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono alternativo</label>
            <input
              type="tel"
              name="telefonoAlternativo"
              value={formData.telefonoAlternativo}
              onChange={handleChange}
              placeholder="55 1234 5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Dirección</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
              <input
                type="text"
                name="direccionCalle"
                value={formData.direccionCalle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                type="text"
                name="direccionNumero"
                value={formData.direccionNumero}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colonia</label>
              <input
                type="text"
                name="direccionColonia"
                value={formData.direccionColonia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
              <input
                type="text"
                name="direccionMunicipio"
                value={formData.direccionMunicipio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                type="text"
                name="direccionCiudad"
                value={formData.direccionCiudad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                type="text"
                name="direccionEstado"
                value={formData.direccionEstado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
              <input
                type="text"
                name="direccionCp"
                value={formData.direccionCp}
                onChange={handleChange}
                maxLength="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#6C3BFF] text-white py-2.5 rounded-lg font-medium hover:bg-[#5b2ee6] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader size={16} className="animate-spin" /> Creando...</>
            ) : (
              <><UserPlus size={16} /> Crear Cliente</>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}"// Updated $(date)" 
