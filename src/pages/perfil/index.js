// src/pages/perfil/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  User, Phone, Mail, Edit2, LogOut,
  Package, DollarSign, Target, QrCode, CreditCard,
  MessageCircle, ChevronRight, AlertCircle, CheckCircle, Clock, X
} from 'lucide-react';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';
import { getClientKYC } from '../../lib/kycService';
import { getClientTandas } from '../../lib/tandasService';
import { getEstadisticasCliente } from '../../lib/nivelClienteService';
import { getClientAuthMethods } from '../../lib/clientsService';
import ModalCompletarDatos from '../../components/ModalCompletarDatos';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { parseJwt, addProviderToUser } from '../../lib/authService';


const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'No definida';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

function FieldLabel({ children }) {
  return <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{children}</label>;
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white ${className}`}
      {...props}
    />
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [tandas, setTandas] = useState([]);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [eliminarFoto, setEliminarFoto] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [estadisticasNivel, setEstadisticasNivel] = useState(null);
  const [authMethods, setAuthMethods] = useState(null);

  const [showModalCompletar, setShowModalCompletar] = useState(false);
  const [userIdCompletar, setUserIdCompletar] = useState(null);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [googleLinking, setGoogleLinking] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', telefonoAlternativo: '', email: '',
    direccionCalle: '', direccionNumero: '', direccionInterior: '',
    direccionEstado: '', direccionMunicipio: '', direccionLocalidad: '', direccionSector: '', direccionCp: '',
    direccionReferencias: '',
    diaPago: 'lunes'
  });

  const [stats, setStats] = useState({
    totalCompras: 0, totalPagado: 0, deudaActual: 0,
    siguientePago: null, tandasActivas: 0
  });

  const getFotoUrl = () => {
    if (!cliente?.foto) return null;
    return pb.files.getURL(cliente, cliente.foto);
  };

  const verificarPrimerIngreso = () => {
    const primerIngreso = localStorage.getItem('primerIngreso');
    const userIdGuardado = localStorage.getItem('userIdCompletarDatos');
    if (primerIngreso === 'true' && userIdGuardado && pb.authStore.isValid) {
      setUserIdCompletar(userIdGuardado);
      setShowModalCompletar(true);
    }
  };

  const cargarClientData = async (userId) => {
    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
      setClientData(clientRecord);
      setFormData(prev => ({
        ...prev,
        telefonoAlternativo: clientRecord.telefonoAlternativo || '',
        direccionCalle: clientRecord.direccionCalle || '',
        direccionNumero: clientRecord.direccionNumero || '',
        direccionInterior: clientRecord.direccionInterior || '',
        direccionEstado: clientRecord.direccionEstado || '',
        direccionMunicipio: clientRecord.direccionMunicipio || '',
        direccionLocalidad: clientRecord.direccionLocalidad || '',
        direccionSector: clientRecord.direccionSector || '',
        direccionCp: clientRecord.direccionCp || '',
        direccionReferencias: clientRecord.direccionReferencias || '',
        diaPago: clientRecord.diaPago || 'lunes'
      }));
    } catch { setClientData(null); }
  };

  const cargarDatos = async (clienteId) => {
    if (!clienteId) return;
    try {
      setLoading(true);
      const ordenesCliente = await pb.collection('orders').getFullList({
        filter: `userId = "${clienteId}"`, sort: '-created', expand: 'productId'
      });
      setOrdenes(ordenesCliente);
      const totalCompras = ordenesCliente.length;
      const totalPagado = ordenesCliente.filter(o => o.estadoPago === 'completada').reduce((sum, o) => sum + (o.totalPagar || 0), 0);
      const pendientes = ordenesCliente.filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago');
      setPagosPendientes(pendientes);
      const deudaActual = pendientes.reduce((sum, o) => {
        const pagado = (o.pagoSemanal || 0) * (o.pagosRealizados || 0);
        const total = o.tipo === 'contado' ? o.totalPagar : (o.enganche || 0) + ((o.pagoSemanal || 0) * (o.semanasTotales || 0));
        return sum + Math.max(0, total - pagado);
      }, 0);
      const proximoPago = pendientes.find(o => o.estadoPago === 'activa');
      setStats(prev => ({
        ...prev, totalCompras, totalPagado, deudaActual,
        siguientePago: proximoPago ? {
          monto: proximoPago.tipo === 'contado' ? proximoPago.totalPagar : proximoPago.pagoSemanal,
          fecha: proximoPago.fechaProximoPago || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ordenId: proximoPago.id
        } : null
      }));
    } catch (error) { console.error('Error cargando datos:', error); }
    finally { setLoading(false); }
  };

  const cargarKYC = async (clienteId) => {
    try { const kyc = await getClientKYC(clienteId); setKycStatus(kyc?.estado || null); }
    catch (error) { console.error('Error cargando KYC:', error); }
  };

  const cargarTandas = async (clienteId) => {
    try {
      const misTandas = await getClientTandas(clienteId);
      setTandas(misTandas);
      setStats(prev => ({ ...prev, tandasActivas: misTandas.filter(t => t.estadoPago === 'al_corriente').length }));
    } catch (error) { console.error('Error cargando tandas:', error); }
  };

  const cargarNivel = async (clienteId) => {
    try { const s = await getEstadisticasCliente(clienteId); setEstadisticasNivel(s); }
    catch (error) { console.error('Error cargando nivel:', error); }
  };

  const cargarAuthMethods = async (clienteId) => {
    try { const methods = await getClientAuthMethods(clienteId); setAuthMethods(methods); }
    catch (error) { console.error('Error cargando métodos de autenticación:', error); }
  };

  // ─── Recargar todos los datos del cliente ────────────────────────────
  const recargarTodo = async (userId) => {
    if (!userId) return;
    await Promise.all([
      cargarDatos(userId),
      cargarClientData(userId),
      cargarKYC(userId),
      cargarTandas(userId),
      cargarNivel(userId),
      cargarAuthMethods(userId)
    ]);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('La foto no debe exceder los 2MB'); return; }
      if (!file.type.startsWith('image/')) { alert('Solo se permiten archivos de imagen'); return; }
      setFotoFile(file);
      setEliminarFoto(false);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEliminarFoto = () => {
    if (cliente?.foto) { setEliminarFoto(true); setFotoFile(null); setFotoPreview(null); }
  };

  const actualizarFoto = async (userId) => {
    if (eliminarFoto && cliente?.foto) {
      const fd = new FormData(); fd.append('foto', null);
      await pb.collection('users').update(userId, fd); return null;
    }
    if (fotoFile) {
      const fd = new FormData(); fd.append('foto', fotoFile);
      const updated = await pb.collection('users').update(userId, fd); return updated.foto;
    }
    return cliente?.foto;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await actualizarFoto(cliente.id);
      const updatedUser = await pb.collection('users').update(cliente.id, {
        nombre: formData.nombre, email: formData.email
      });
      const clientUpdateData = {
        telefonoAlternativo: formData.telefonoAlternativo,
        direccionCalle: formData.direccionCalle,
        direccionNumero: formData.direccionNumero,
        direccionInterior: formData.direccionInterior,
        direccionEstado: formData.direccionEstado,
        direccionMunicipio: formData.direccionMunicipio,
        direccionLocalidad: formData.direccionLocalidad,
        direccionSector: formData.direccionSector,
        direccionCp: formData.direccionCp,
        direccionReferencias: formData.direccionReferencias,
        diaPago: formData.diaPago,
        datosCompletos: true
      };
      if (clientData) {
        await pb.collection('clients').update(clientData.id, clientUpdateData);
      } else {
        await pb.collection('clients').create({
          userId: cliente.id, ...clientUpdateData,
          nivel: 0, productosComprados: 0, productosPagados: 0, productosEnCurso: 0,
          deudaActual: 0, limiteDeuda: 5000, estadoKyc: 'pendiente', trustScore: 0
        });
      }
      pb.authStore.save(pb.authStore.token, updatedUser);
      setCliente(updatedUser);
      setFormData(prev => ({ ...prev, nombre: updatedUser.nombre || '', email: updatedUser.email || '' }));
      setFotoFile(null); setFotoPreview(null); setEliminarFoto(false); setIsEditing(false);
      await recargarTodo(cliente.id);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('❌ Error detallado:', error);
      let mensajes = [];
      if (error.data?.data) {
        mensajes = Object.entries(error.data.data).map(([campo, info]) => `${campo}: ${info.message}`);
      } else { mensajes = [error.message || 'Error al actualizar perfil']; }
      setErrorMessages(mensajes); setShowErrorModal(true);
    } finally { setSaving(false); }
  };

  const handleLogout = () => { pb.authStore.clear(); router.push('/'); };

  const handleDatosCompletados = async () => {
    setShowModalCompletar(false);
    localStorage.removeItem('primerIngreso');
    localStorage.removeItem('userIdCompletarDatos');

    // ✅ REFRESCAR EL ESTADO CLIENTE DESDE AUTHSTORE
    const currentUser = pb.authStore.model;
    if (currentUser) {
      setCliente(currentUser);
      // Actualizar también el formulario de edición con los nuevos datos
      setFormData(prev => ({
        ...prev,
        nombre: currentUser.nombre || '',
        email: currentUser.email || '',
      }));
    };


    // Recargar datos relacionados (dirección, órdenes, etc.)
    const userId = currentUser?.id || cliente?.id;
    if (userId) {
      await recargarTodo(userId);
    }
  }



  const handleAddPhone = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Ingresa un número válido de 10 dígitos');
      return;
    };

    try {
      // ✅ VERIFICAR QUE EL TELÉFONO NO ESTÉ EN USO POR OTRO USUARIO
      const phoneRes = await fetch('/api/get-user-by-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: cleanPhone, excludeUserId: cliente.id })
      });
      const phoneData = await phoneRes.json();
      if (phoneData.exists && phoneData.user.id !== cliente.id) {
        toast.error('Este número de teléfono ya está registrado por otro usuario');
        return;
      }

      // 1. Actualizar teléfono en users
      await fetch('/api/update-user-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cliente.id, phone: cleanPhone })
      });
      // 2. Agregar provider phone
      await addProviderToUser(cliente.id, {
        provider: 'phone',
        telefono: cleanPhone
      });
      // 3. Actualizar cliente y clientData
      const updatedUser = await pb.collection('users').getOne(cliente.id);
      setCliente(updatedUser);
      cargarClientData(cliente.id);
      cargarAuthMethods(cliente.id);
      setShowPhoneModal(false);
      toast.success('Número de teléfono agregado exitosamente');
    } catch (error) {
      console.error('Error agregando teléfono:', error);
      toast.error('Error al agregar el número de teléfono');
    }
  };

  const getKYCStatusInfo = () => {
    if (!kycStatus) return { label: 'Pendiente', colorClass: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock, action: 'Iniciar verificación', link: '/kyc' };
    if (kycStatus === 'pendiente') return { label: 'En revisión', colorClass: 'bg-blue-50 text-blue-700 border-blue-100', icon: Clock, action: 'Ver estado', link: '/kyc/estado' };
    if (kycStatus === 'aprobado') return { label: 'Verificado', colorClass: 'bg-[#10b981]/8 text-[#10b981] border-[#10b981]/20', icon: CheckCircle, action: null, link: null };
    if (kycStatus === 'rechazado') return { label: 'Rechazado', colorClass: 'bg-red-50 text-red-700 border-red-100', icon: AlertCircle, action: 'Reintentar', link: '/kyc' };
    return { label: 'Desconocido', colorClass: 'bg-gray-50 text-gray-600 border-gray-100', icon: AlertCircle, action: 'Contactar', link: '/soporte' };
  };

  useEffect(() => {
    if (!pb.authStore.isValid) { router.push('/solicitar'); return; }
    const user = pb.authStore.model;
    if (user?.role === 'vendedor') { router.push('/vendedor'); return; }
    setCliente(user);
    if (user) setFormData(prev => ({ ...prev, nombre: user.nombre || '', email: user.email || '' }));
    cargarDatos(user?.id);
    cargarClientData(user?.id);
    cargarKYC(user?.id);
    cargarTandas(user?.id);
    cargarNivel(user?.id);
    cargarAuthMethods(user?.id);
    verificarPrimerIngreso();
  }, [router]);

  const kycInfo = getKYCStatusInfo();
  const KycIcon = kycInfo.icon;

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <>
      <Head><title>Mi Perfil | MarketDesliz</title></Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-8">

          {/* Header del perfil */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-18 h-18 rounded-2xl bg-[#6C3BFF]/10 overflow-hidden flex items-center justify-center" style={{ width: 72, height: 72 }}>
                  {getFotoUrl() ? (
                    <img src={getFotoUrl()} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-[#6C3BFF]" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{cliente?.nombre || 'Usuario'}</h1>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {cliente?.telefono && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Phone size={13} /> {cliente.telefono}
                    </span>
                  )}
                  {cliente?.email && (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Mail size={13} /> {cliente.email}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Miembro desde {formatDate(cliente?.created)}</p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${isEditing
                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    : 'border-[#6C3BFF] text-[#6C3BFF] hover:bg-[#6C3BFF]/5'
                    }`}
                >
                  <Edit2 size={14} /> {isEditing ? 'Cancelar' : 'Editar'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Salir
                </button>
              </div>
            </div>

            {authMethods?.methods?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Acceso a tu cuenta</p>
                <div className="flex flex-wrap gap-2">
                  {authMethods.methods.map((method) => (
                    <span
                      key={method.id}  // ← Usamos el ID único del registro en user_providers
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${method.provider === 'google'
                        ? 'bg-red-50 text-red-600'
                        : method.provider === 'phone'
                          ? 'bg-[#10b981]/10 text-[#10b981]'
                          : 'bg-blue-50 text-blue-600'
                        }`}
                    >
                      {method.provider === 'google' && <>Google {method.isPrimary && '(principal)'}</>}
                      {method.provider === 'phone' && <>SMS {method.isPrimary && '(principal)'}</>}
                      {method.provider === 'credentials' && <>Email {method.isPrimary && '(principal)'}</>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── AGREGAR TELÉFONO (si no tiene) ── */}
          {cliente && !cliente.telefono && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-yellow-700 mb-2 flex items-center gap-2">
                📱 Aún no has registrado un número de teléfono. Esto te permitirá recibir notificaciones y ser contactado por el cobrador.
              </p>
              <button
                onClick={() => setShowPhoneModal(true)}
                className="bg-[#6C3BFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5b2ee6] transition"
              >
                Agregar número de teléfono
              </button>
            </div>
          )}

          {/* ── VINCULAR GOOGLE (si no tiene) ── */}
          {authMethods && !authMethods.hasGoogle && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <p className="text-sm text-gray-600 mb-3">
                🔗 Vincula tu cuenta de Google para iniciar sesión más rápido.
              </p>
              <GoogleLogin
                onSuccess={async (response) => {
                  setGoogleLinking(true);
                  try {
                    const decoded = parseJwt(response.credential);
                    await addProviderToUser(cliente.id, {
                      provider: 'google',
                      providerId: decoded.sub,
                      email: decoded.email
                    });
                    toast.success('Cuenta de Google vinculada exitosamente');
                    cargarAuthMethods(cliente.id);
                  } catch (err) {
                    console.error('Error vinculando Google:', err);
                    toast.error('Error al vincular Google');
                  } finally {
                    setGoogleLinking(false);
                  }
                }}
                onError={() => {
                  toast.error('Error al vincular Google');
                  setGoogleLinking(false);
                }}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width={400}
                disabled={googleLinking}
              />
              {googleLinking && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  <span className="inline-block w-3 h-3 border-2 border-[#6C3BFF] border-t-transparent rounded-full animate-spin mr-1" />
                  Vinculando...
                </p>
              )}
            </div>
          )}

          {/* Modo edición */}
          {isEditing && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Editar información personal</h2>

              <div className="mb-6 pb-5 border-b border-gray-100">
                <FieldLabel>Foto de perfil</FieldLabel>
                <div className="flex items-center gap-5 mt-2">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : getFotoUrl() ? (
                      <img src={getFotoUrl()} alt="Foto actual" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file" accept="image/*" onChange={handleFotoChange}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#6C3BFF]/8 file:text-[#6C3BFF] hover:file:bg-[#6C3BFF]/15 cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">JPG, PNG — máx. 2MB</p>
                    {cliente?.foto && !fotoPreview && (
                      <button type="button" onClick={handleEliminarFoto} className="text-xs text-red-500 hover:text-red-700 mt-1.5">
                        Eliminar foto
                      </button>
                    )}
                    {eliminarFoto && <p className="text-[10px] text-red-500 mt-1">Foto marcada para eliminar</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <FieldLabel>Nombre completo</FieldLabel>
                  <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Juan Pérez" />
                </div>
                <div>
                  <FieldLabel>Teléfono alternativo</FieldLabel>
                  <Input type="tel" value={formData.telefonoAlternativo}
                    onChange={(e) => setFormData({ ...formData, telefonoAlternativo: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="55 1234 5678" />
                </div>
                <div>
                  <FieldLabel>Correo electrónico</FieldLabel>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <FieldLabel>Día de pago preferente</FieldLabel>
                  <select
                    value={formData.diaPago}
                    onChange={(e) => setFormData({ ...formData, diaPago: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white"
                  >
                    <option value="lunes">Lunes</option>
                    <option value="martes">Martes</option>
                  </select>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dirección</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Calle', 'direccionCalle', 'Av. Independencia'],
                  ['Número exterior', 'direccionNumero', '123'],
                  ['Número interior', 'direccionInterior', 'B'],
                  ['Estado *', 'direccionEstado', 'Veracruz'],
                  ['Municipio *', 'direccionMunicipio', 'Perote'],
                  ['Localidad/Pueblo *', 'direccionLocalidad', 'Juan Marcos'],
                  ['Sector / Colonia *', 'direccionSector', 'Centro'],
                  ['Código Postal', 'direccionCp', '91270'],
                ].map(([label, field, placeholder]) => (
                  <div key={field}>
                    <FieldLabel>{label}</FieldLabel>
                    <Input
                      value={formData[field]}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <FieldLabel>Referencias del domicilio</FieldLabel>
                  <textarea
                    value={formData.direccionReferencias}
                    onChange={(e) => setFormData({ ...formData, direccionReferencias: e.target.value })}
                    rows="2"
                    placeholder="Casa azul, junto a la tienda..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-2.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Vista normal */}
          {!isEditing && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'Compras', value: stats.totalCompras, color: 'text-gray-900' },
                  { label: 'Total pagado', value: formatMoney(stats.totalPagado), color: 'text-[#10b981]' },
                  { label: 'Saldo pendiente', value: formatMoney(stats.deudaActual), color: 'text-red-500' },
                  {
                    label: 'Próximo pago', value: formatMoney(stats.siguientePago?.monto || 0), color: 'text-[#6C3BFF]',
                    sub: stats.siguientePago?.fecha ? formatDate(stats.siguientePago.fecha) : null
                  },
                  { label: 'Tandas activas', value: stats.tandasActivas, color: 'text-orange-500' },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
                  </div>
                ))}
              </div>

              {estadisticasNivel && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Tu nivel</p>
                      <p className="text-2xl font-bold text-orange-500">Nivel {estadisticasNivel.nivelActual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Próximo nivel</p>
                      <p className="text-sm font-semibold text-gray-700">Faltan {estadisticasNivel.productosFaltantes} productos</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-orange-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (estadisticasNivel.productosPagados / (estadisticasNivel.productosPagados + estadisticasNivel.productosFaltantes)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-3">
                    <p className="text-xs text-gray-400">
                      Tandas hasta <span className="text-[#6C3BFF] font-semibold">{formatMoney(estadisticasNivel.tandaDisponible)}</span>
                    </p>
                    {estadisticasNivel.productosEnCurso > 0 && (
                      <p className="text-xs text-orange-500">{estadisticasNivel.productosEnCurso} producto(s) en curso</p>
                    )}
                  </div>
                </div>
              )}

              <div className={`bg-white rounded-2xl border shadow-sm p-5 mb-5 ${kycInfo.colorClass}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kycInfo.colorClass}`}>
                      <KycIcon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Verificación KYC</p>
                      <p className="text-xs opacity-80">{kycInfo.label}</p>
                    </div>
                  </div>
                  {kycInfo.link && (
                    <Link href={kycInfo.link} className="flex items-center gap-1 text-xs font-semibold hover:underline">
                      {kycInfo.action} <ChevronRight size={13} />
                    </Link>
                  )}
                </div>
                {!kycStatus && (
                  <p className="text-xs opacity-70 mt-3">Necesitas verificar tu identidad para poder unirte a tandas.</p>
                )}
                {kycStatus === 'rechazado' && (
                  <p className="text-xs opacity-70 mt-3">Tus documentos no fueron aprobados. Por favor, vuelve a subirlos.</p>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {[
                  { href: '/perfil/ordenes', icon: Package, label: 'Mis órdenes' },
                  { href: '/perfil/pagos', icon: DollarSign, label: 'Mis pagos' },
                  { href: '/tandas/mis-tandas', icon: Target, label: 'Mis tandas' },
                  { href: '/perfil/qr', icon: QrCode, label: 'Mi QR' },
                  { href: '/perfil/tarjeta', icon: CreditCard, label: 'Mi tarjeta' },
                  { href: 'https://wa.me/522821414939', icon: MessageCircle, label: 'Soporte', external: true },
                ].map(({ href, icon: Icon, label, external }) => (
                  <Link
                    key={href}
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-[#6C3BFF]/20 transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#6C3BFF]/8 rounded-xl flex items-center justify-center group-hover:bg-[#6C3BFF]/15 transition-colors">
                      <Icon size={18} className="text-[#6C3BFF]" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Package size={16} className="text-[#6C3BFF]" /> Órdenes activas
                  </h2>
                  <Link href="/perfil/ordenes" className="text-xs text-[#6C3BFF] font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    Ver todas <ChevronRight size={13} />
                  </Link>
                </div>

                {pagosPendientes.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-2">No tienes órdenes pendientes</p>
                    <Link href="/productos" className="text-xs text-[#6C3BFF] font-medium hover:underline">
                      Ver productos →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {pagosPendientes.map((orden) => (
                      <div key={orden.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {orden.expand?.productId?.nombre || orden.productName || orden.productId}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {orden.tipo === 'contado' ? 'Compra de contado' : 'Compra a crédito'}
                            </p>
                            <div className="mt-2 space-y-0.5">
                              {orden.tipo === 'credito' && (
                                <p className="text-xs text-gray-500">
                                  {formatMoney(orden.pagoSemanal)}/sem
                                  <span className="text-gray-300 mx-1">·</span>
                                  {orden.semanasTotales} semanas
                                </p>
                              )}
                              <p className="text-sm font-bold text-[#6C3BFF]">
                                {formatMoney(orden.tipo === 'contado'
                                  ? orden.totalPagar
                                  : (orden.enganche || 0) + ((orden.pagoSemanal || 0) * (orden.semanasTotales || 0))
                                )}
                              </p>
                            </div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${orden.estadoPago === 'completada' ? 'bg-[#10b981]/10 text-[#10b981]' :
                            orden.estadoPago === 'activa' ? 'bg-blue-50 text-blue-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                            {orden.estadoPago === 'completada' ? 'Completada' :
                              orden.estadoPago === 'activa' ? 'Activa' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modales */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-7 text-center shadow-2xl">
              <div className="w-14 h-14 bg-[#10b981] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¡Perfil actualizado!</h3>
              <p className="text-sm text-gray-500">Tus datos han sido guardados correctamente.</p>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Error al actualizar</h3>
                <button onClick={() => setShowErrorModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 max-h-40 overflow-auto space-y-1">
                {errorMessages.map((msg, idx) => (
                  <p key={idx} className="text-sm text-red-600">{msg}</p>
                ))}
              </div>
              <button onClick={() => setShowErrorModal(false)} className="w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
                Entendido
              </button>
            </div>
          </div>
        )}

        <ModalCompletarDatos
          isOpen={showModalCompletar}
          onClose={() => {
            setShowModalCompletar(false);
            localStorage.removeItem('primerIngreso');
            localStorage.removeItem('userIdCompletarDatos');
          }}
          userId={userIdCompletar}
          onDatosCompletados={handleDatosCompletados}
        />

        {/* ── MODAL AGREGAR TELÉFONO ── */}
        {showPhoneModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-center mb-2">Agregar número de teléfono</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Ingresa tu número para recibir notificaciones y ser contactado por el cobrador.
              </p>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="55 1234 5678"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg mb-4 focus:ring-2 focus:ring-[#6C3BFF] focus:border-transparent transition"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhoneModal(false);
                    setPhoneInput('');
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddPhone}
                  className="flex-1 py-2.5 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </StoreLayout>
    </>
  );
}
