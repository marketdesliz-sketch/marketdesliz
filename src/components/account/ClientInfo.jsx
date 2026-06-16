// src/components/account/ClientInfo.jsx
import { useState } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Award, CreditCard, ShieldCheck, Edit2, Save, X } from 'lucide-react';
import { updateClient } from '../../lib/clientsService';

export default function ClientInfo({ client, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: client?.nombre || '',
    email: client?.email || '',
    telefono: client?.telefono || '',
    direccionCalle: client?.clientData?.direccionCalle || '',
    direccionNumero: client?.clientData?.direccionNumero || '',
    direccionColonia: client?.clientData?.direccionColonia || '',
    direccionMunicipio: client?.clientData?.direccionMunicipio || '',
    direccionCiudad: client?.clientData?.direccionCiudad || '',
    direccionEstado: client?.clientData?.direccionEstado || '',
    direccionCp: client?.clientData?.direccionCp || '',
    telefonoAlternativo: client?.clientData?.telefonoAlternativo || '',
    diaPago: client?.clientData?.diaPago || 'lunes'
  });

  if (!client) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateClient(client.id, formData);
      if (onUpdate) onUpdate(updated);
      setEditing(false);
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      alert('Error al actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getMetodosAuth = () => {
    const methods = [];
    if (client.hasGoogleAuth) methods.push('Google');
    if (client.hasPhoneAuth) methods.push('SMS');
    if (client.hasCredentialsAuth) methods.push('Email');
    return methods.length > 0 ? methods.join(' • ') : 'Ninguno';
  };

  const formatPhone = (phone) => {
    if (!phone) return 'No registrado';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 10)}`;
    }
    return phone;
  };

  const getDireccionCompleta = () => {
    if (!client.clientData) return 'Sin dirección registrada';
    const partes = [
      client.clientData.direccionCalle,
      client.clientData.direccionNumero ? `#${client.clientData.direccionNumero}` : '',
      client.clientData.direccionColonia,
      client.clientData.direccionMunicipio,
      client.clientData.direccionEstado,
      client.clientData.direccionCp ? `CP ${client.clientData.direccionCp}` : ''
    ].filter(Boolean);
    return partes.length > 0 ? partes.join(', ') : 'Sin dirección registrada';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <User size={18} className="text-[#6C3BFF]" />
          Información Personal
        </h3>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#6C3BFF]/10 text-[#6C3BFF] rounded-lg hover:bg-[#6C3BFF]/20 transition"
        >
          {editing ? <X size={14} /> : <Edit2 size={14} />}
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Día de pago</label>
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

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#6C3BFF] text-white py-2.5 rounded-lg font-medium hover:bg-[#5b2ee6] transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : <><Save size={16} className="inline mr-2" /> Guardar cambios</>}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Nombre</p>
                  <p className="font-medium text-gray-900">{client.nombre || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Teléfono</p>
                  <p className="font-medium text-gray-900">{formatPhone(client.telefono)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-medium text-gray-900">{client.email || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Registro</p>
                  <p className="font-medium text-gray-900">
                    {new Date(client.created).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Dirección</p>
                  <p className="font-medium text-gray-900">{getDireccionCompleta()}</p>
                </div>
              </div>
              {client.clientData?.telefonoAlternativo && (
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Teléfono alternativo</p>
                    <p className="font-medium text-gray-900">{formatPhone(client.clientData.telefonoAlternativo)}</p>
                  </div>
                </div>
              )}
              {client.clientData?.diaPago && (
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Día de pago</p>
                    <p className="font-medium text-gray-900 capitalize">{client.clientData.diaPago}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Métodos de autenticación</p>
                  <p className="font-medium text-gray-900">{getMetodosAuth()}</p>
                </div>
              </div>
              {client.clientData?.nivel !== undefined && (
                <div className="flex items-start gap-3">
                  <Award size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Nivel</p>
                    <p className="font-medium text-gray-900">⭐ {client.clientData.nivel}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}