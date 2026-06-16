// src/pages/vendedor/perfil.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { User, Phone, Mail, MapPin, Edit2, DollarSign, Code } from 'lucide-react';
import VendedorLayout from '../../layouts/VendedorLayout';
import pb from '../../lib/pocketbase';

export default function VendedorPerfilPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [vendedor, setVendedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/vendedor/login');
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const user = pb.authStore.model;
      setUser(user);

      const vendedorData = await pb.collection('vendedores').getFirstListItem(
        `userId = "${user.id}"`
      );

      setVendedor(vendedorData);
      setFormData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        email: user.email || ''
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const user = pb.authStore.model;
      await pb.collection('users').update(user.id, {
        nombre: formData.nombre,
        telefono: formData.telefono
      });

      setIsEditing(false);
      alert('✅ Perfil actualizado correctamente');
      cargarDatos();

    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </VendedorLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Mi Perfil | MarketDesliz Vendedor</title>
      </Head>

      <VendedorLayout>
        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-400 mt-0.5">Información personal y datos de tu cuenta</p>
        </div>

        {/* ── Datos del vendedor ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Nombre</p>
                    <p className="text-sm font-semibold text-gray-900">{user?.nombre || 'Vendedor'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Code size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Código</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{vendedor?.codigo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Phone size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Teléfono</p>
                    <p className="text-sm font-semibold text-gray-900">{user?.telefono || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Mail size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Correo</p>
                    <p className="text-sm font-semibold text-gray-900">{user?.email || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <MapPin size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Zona</p>
                    <p className="text-sm font-semibold text-gray-900">{vendedor?.zona || 'No asignada'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#10b981]/10 rounded-xl flex items-center justify-center">
                    <DollarSign size={16} className="text-[#10b981]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Comisión</p>
                    <p className="text-sm font-bold text-[#10b981]">{vendedor?.comisionPorcentaje || 5}%</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-6 inline-flex items-center justify-center gap-2 py-2.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <Edit2 size={16} />
                Editar perfil
              </button>
            </div>
          )}
        </div>
      </VendedorLayout>

      <style jsx>{`
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #6C3BFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}