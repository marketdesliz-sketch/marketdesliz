// src/pages/perfil/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  User, Phone, Mail, Edit2, LogOut,
  Package, DollarSign, Target, QrCode, CreditCard,
  MessageCircle, ChevronRight, AlertCircle, CheckCircle, Clock,
  X, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import pb from '../../lib/pocketbase';
import { getClientKYC } from '../../lib/kycService';
import { getClientTandas } from '../../lib/tandasService';
import { getEstadisticasCliente } from '../../lib/nivelClienteService';
import { getClientAuthMethods } from '../../lib/clientsService';
import ModalCompletarDatos from '../../components/ModalCompletarDatos';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { parseJwt, addProviderToUser } from '../../lib/authService';
import { T } from '../../lib/tokens';
import TerminalBar from '../../components/TerminalBar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BackButton from '../../components/BackButton';

// ─────────────────────────────────────────────────────────────────────────
// Helpers · SIN CAMBIOS
// ─────────────────────────────────────────────────────────────────────────
const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return 'No definida';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ─────────────────────────────────────────────────────────────────────────
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = false }) {
  return (
    <p
      className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-4"
      style={{
        color: accent ? T.accent : T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
    </p>
  );
}

function StatBlock({ value, label, sub, accent = false, border = true }) {
  return (
    <div
      className="p-5"
      style={{ borderLeft: border ? `1px solid ${T.line}` : 'none' }}
    >
      <p
        className="text-[20px] md:text-[22px] tabular-nums tracking-[-0.02em] leading-none mb-2"
        style={{
          color: accent ? T.accent : T.ink,
          fontWeight: 500,
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </p>
      <p
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: T.inkFaint, fontWeight: 500 }}
      >
        {label}
      </p>
      {sub && (
        <p
          className="text-[10.5px] mt-1 tabular-nums"
          style={{
            color: T.inkGhost,
            fontWeight: 450,
            fontFeatureSettings: '"tnum"',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function WarningCallout({ icon: Icon = AlertTriangle, children }) {
  return (
    <div
      className="flex items-start gap-3 p-5"
      style={{
        background: 'rgba(184, 130, 14, 0.06)',
        border: `1px solid rgba(184, 130, 14, 0.18)`,
        borderLeft: '2px solid #B8820E',
        borderRadius: '8px',
      }}
    >
      <Icon
        size={16}
        strokeWidth={1.75}
        style={{ color: '#B8820E', flexShrink: 0, marginTop: 2 }}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label
      className="block text-[10px] uppercase tracking-[0.22em] mb-2"
      style={{
        color: T.inkFaint,
        fontWeight: 500,
        fontFeatureSettings: '"ss01"',
      }}
    >
      {children}
      {required && <span style={{ color: T.red, marginLeft: '3px' }}>*</span>}
    </label>
  );
}

function FieldInput({ className = '', ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      className={`w-full outline-none transition-colors ${className}`}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{
        height: '42px',
        padding: '0 14px',
        background: 'transparent',
        border: `1px solid ${focus ? 'rgba(15,15,15,0.24)' : T.line}`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        letterSpacing: '-0.005em',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
        fontFamily: 'inherit',
      }}
    />
  );
}

function FieldTextarea({ className = '', ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      {...props}
      className={`w-full outline-none resize-none transition-colors ${className}`}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{
        padding: '12px 14px',
        background: 'transparent',
        border: `1px solid ${focus ? 'rgba(15,15,15,0.24)' : T.line}`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        lineHeight: 1.55,
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
        fontFamily: 'inherit',
      }}
    />
  );
}

function FieldSelect({ className = '', children, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <select
      {...props}
      className={`w-full outline-none appearance-none transition-colors ${className}`}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{
        height: '42px',
        padding: '0 14px',
        background: 'transparent',
        border: `1px solid ${focus ? 'rgba(15,15,15,0.24)' : T.line}`,
        borderRadius: '6px',
        color: T.ink,
        fontSize: '13.5px',
        fontWeight: 450,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </select>
  );
}

function ActionTile({ href, icon: Icon, label, external }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col items-center justify-center gap-2.5 py-5 px-3 transition-all duration-300"
      style={{
        background: 'transparent',
        border: `1px solid ${hover ? T.line : 'transparent'}`,
        borderRadius: '8px',
        textDecoration: 'none',
        WebkitTapHighlightColor: 'transparent',
        transitionTimingFunction: T.ease,
      }}
    >
      <div
        className="flex items-center justify-center transition-colors duration-300"
        style={{
          width: '40px',
          height: '40px',
          background: hover ? T.accent : 'rgba(15,15,15,0.04)',
          borderRadius: '8px',
          transitionTimingFunction: T.ease,
        }}
      >
        <Icon
          size={16}
          strokeWidth={1.75}
          style={{
            color: hover ? '#FFFFFF' : T.inkMid,
            transition: `color 0.3s ${T.ease}`,
          }}
        />
      </div>
      <span
        className="text-[10.5px] text-center leading-tight transition-colors duration-300"
        style={{
          color: hover ? T.ink : T.inkMid,
          fontWeight: 500,
          letterSpacing: '-0.005em',
          transitionTimingFunction: T.ease,
        }}
      >
        {label}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────
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
    nombre: '',
    telefonoAlternativo: '',
    email: '',
    direccionCalle: '',
    direccionNumero: '',
    direccionInterior: '',
    direccionEstado: '',
    direccionMunicipio: '',
    direccionLocalidad: '',
    direccionSector: '',
    direccionCp: '',
    direccionReferencias: '',
    diaPago: 'lunes',
  });

  const [stats, setStats] = useState({
    totalCompras: 0,
    totalPagado: 0,
    deudaActual: 0,
    siguientePago: null,
    tandasActivas: 0,
  });

  const notifications = [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Foto ───────────────────────────────────────────────
  const getFotoUrl = () => {
    if (!cliente?.foto) return null;
    return pb.files.getURL(cliente, cliente.foto);
  };

  // ─── Verificaciones ─────────────────────────────────────
  const verificarPrimerIngreso = () => {
    const primerIngreso = localStorage.getItem('primerIngreso');
    const userIdGuardado = localStorage.getItem('userIdCompletarDatos');
    if (primerIngreso === 'true' && userIdGuardado && pb.authStore.isValid) {
      setUserIdCompletar(userIdGuardado);
      setShowModalCompletar(true);
    }
  };

  // ─── Cargas ─────────────────────────────────────────────
  const cargarClientData = async (userId) => {
    try {
      const clientRecord = await pb
        .collection('clients')
        .getFirstListItem(`userId = "${userId}"`);
      setClientData(clientRecord);
      setFormData((prev) => ({
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
        diaPago: clientRecord.diaPago || 'lunes',
      }));
    } catch {
      setClientData(null);
    }
  };

  const cargarDatos = async (clienteId) => {
    if (!clienteId) return;
    try {
      setLoading(true);
      const ordenesCliente = await pb.collection('orders').getFullList({
        filter: `userId = "${clienteId}"`,
        sort: '-created',
        expand: 'productId',
      });
      setOrdenes(ordenesCliente);
      const totalCompras = ordenesCliente.length;
      const totalPagado = ordenesCliente
        .filter((o) => o.estadoPago === 'completada')
        .reduce((sum, o) => sum + (o.totalPagar || 0), 0);
      const pendientes = ordenesCliente.filter(
        (o) => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago'
      );
      setPagosPendientes(pendientes);
      const deudaActual = pendientes.reduce((sum, o) => {
        const pagado = (o.pagoSemanal || 0) * (o.pagosRealizados || 0);
        const total =
          o.tipo === 'contado'
            ? o.totalPagar
            : (o.enganche || 0) + (o.pagoSemanal || 0) * (o.semanasTotales || 0);
        return sum + Math.max(0, total - pagado);
      }, 0);
      const proximoPago = pendientes.find((o) => o.estadoPago === 'activa');
      setStats((prev) => ({
        ...prev,
        totalCompras,
        totalPagado,
        deudaActual,
        siguientePago: proximoPago
          ? {
              monto:
                proximoPago.tipo === 'contado'
                  ? proximoPago.totalPagar
                  : proximoPago.pagoSemanal,
              fecha:
                proximoPago.fechaProximoPago ||
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              ordenId: proximoPago.id,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarKYC = async (clienteId) => {
    try {
      const kyc = await getClientKYC(clienteId);
      setKycStatus(kyc?.estado || null);
    } catch (error) {
      console.error('Error cargando KYC:', error);
    }
  };

  const cargarTandas = async (clienteId) => {
    try {
      const misTandas = await getClientTandas(clienteId);
      setTandas(misTandas);
      setStats((prev) => ({
        ...prev,
        tandasActivas: misTandas.filter((t) => t.estadoPago === 'al_corriente')
          .length,
      }));
    } catch (error) {
      console.error('Error cargando tandas:', error);
    }
  };

  const cargarNivel = async (clienteId) => {
    try {
      const s = await getEstadisticasCliente(clienteId);
      setEstadisticasNivel(s);
    } catch (error) {
      console.error('Error cargando nivel:', error);
    }
  };

  const cargarAuthMethods = async (clienteId) => {
    try {
      const methods = await getClientAuthMethods(clienteId);
      setAuthMethods(methods);
    } catch (error) {
      console.error('Error cargando métodos de autenticación:', error);
    }
  };

  const recargarTodo = async (userId) => {
    if (!userId) return;
    await Promise.all([
      cargarDatos(userId),
      cargarClientData(userId),
      cargarKYC(userId),
      cargarTandas(userId),
      cargarNivel(userId),
      cargarAuthMethods(userId),
    ]);
  };

  // ─── Foto handlers ──────────────────────────────────────
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La foto no debe exceder los 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }
      setFotoFile(file);
      setEliminarFoto(false);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEliminarFoto = () => {
    if (cliente?.foto) {
      setEliminarFoto(true);
      setFotoFile(null);
      setFotoPreview(null);
    }
  };

  const actualizarFoto = async (userId) => {
    if (eliminarFoto && cliente?.foto) {
      const fd = new FormData();
      fd.append('foto', null);
      await pb.collection('users').update(userId, fd);
      return null;
    }
    if (fotoFile) {
      const fd = new FormData();
      fd.append('foto', fotoFile);
      const updated = await pb.collection('users').update(userId, fd);
      return updated.foto;
    }
    return cliente?.foto;
  };

  // ─── Guardar perfil ─────────────────────────────────────
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await actualizarFoto(cliente.id);
      const updatedUser = await pb.collection('users').update(cliente.id, {
        nombre: formData.nombre,
        email: formData.email,
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
        datosCompletos: true,
      };
      if (clientData) {
        await pb.collection('clients').update(clientData.id, clientUpdateData);
      } else {
        await pb.collection('clients').create({
          userId: cliente.id,
          ...clientUpdateData,
          nivel: 0,
          productosComprados: 0,
          productosPagados: 0,
          productosEnCurso: 0,
          deudaActual: 0,
          limiteDeuda: 5000,
          estadoKyc: 'pendiente',
          trustScore: 0,
        });
      }
      pb.authStore.save(pb.authStore.token, updatedUser);
      setCliente(updatedUser);
      setFormData((prev) => ({
        ...prev,
        nombre: updatedUser.nombre || '',
        email: updatedUser.email || '',
      }));
      setFotoFile(null);
      setFotoPreview(null);
      setEliminarFoto(false);
      setIsEditing(false);
      await recargarTodo(cliente.id);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('❌ Error detallado:', error);
      let mensajes = [];
      if (error.data?.data) {
        mensajes = Object.entries(error.data.data).map(
          ([campo, info]) => `${campo}: ${info.message}`
        );
      } else {
        mensajes = [error.message || 'Error al actualizar perfil'];
      }
      setErrorMessages(mensajes);
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/');
  };

  const handleDatosCompletados = async () => {
    setShowModalCompletar(false);
    localStorage.removeItem('primerIngreso');
    localStorage.removeItem('userIdCompletarDatos');

    const currentUser = pb.authStore.model;
    if (currentUser) {
      setCliente(currentUser);
      setFormData((prev) => ({
        ...prev,
        nombre: currentUser.nombre || '',
        email: currentUser.email || '',
      }));
    }

    const userId = currentUser?.id || cliente?.id;
    if (userId) {
      await recargarTodo(userId);
    }
  };

  // ─── Agregar teléfono ───────────────────────────────────
  const handleAddPhone = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Ingresa un número válido de 10 dígitos');
      return;
    }

    try {
      const phoneRes = await fetch('/api/get-user-by-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: cleanPhone,
          excludeUserId: cliente.id,
        }),
      });
      const phoneData = await phoneRes.json();
      if (phoneData.exists && phoneData.user.id !== cliente.id) {
        toast.error(
          'Este número de teléfono ya está registrado por otro usuario'
        );
        return;
      }

      await fetch('/api/update-user-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cliente.id, phone: cleanPhone }),
      });
      await addProviderToUser(cliente.id, {
        provider: 'phone',
        telefono: cleanPhone,
      });
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

  // ─── KYC status ─────────────────────────────────────────
  const getKYCStatusInfo = () => {
    if (!kycStatus)
      return {
        label: 'Pendiente',
        fg: '#B8820E',
        bg: 'rgba(184, 130, 14, 0.06)',
        border: 'rgba(184, 130, 14, 0.18)',
        icon: Clock,
        action: 'Iniciar verificación',
        link: '/kyc',
      };
    if (kycStatus === 'pendiente')
      return {
        label: 'En revisión',
        fg: T.accent,
        bg: 'rgba(79, 46, 232, 0.06)',
        border: 'rgba(79, 46, 232, 0.15)',
        icon: Clock,
        action: 'Ver estado',
        link: '/kyc/estado',
      };
    if (kycStatus === 'aprobado')
      return {
        label: 'Verificado',
        fg: T.green,
        bg: 'rgba(26, 127, 75, 0.06)',
        border: 'rgba(26, 127, 75, 0.18)',
        icon: CheckCircle,
        action: null,
        link: null,
      };
    if (kycStatus === 'rechazado')
      return {
        label: 'Rechazado',
        fg: T.red,
        bg: 'rgba(197, 48, 48, 0.06)',
        border: 'rgba(197, 48, 48, 0.18)',
        icon: AlertCircle,
        action: 'Reintentar',
        link: '/kyc',
      };
    return {
      label: 'Desconocido',
      fg: T.inkSoft,
      bg: 'rgba(15, 15, 15, 0.03)',
      border: T.line,
      icon: AlertCircle,
      action: 'Contactar',
      link: '/soporte',
    };
  };

  // ─── Init ───────────────────────────────────────────────
  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/solicitar');
      return;
    }
    const user = pb.authStore.model;
    if (user?.role === 'vendedor') {
      router.push('/vendedor');
      return;
    }
    setCliente(user);
    if (user)
      setFormData((prev) => ({
        ...prev,
        nombre: user.nombre || '',
        email: user.email || '',
      }));
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

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Head><title>Cargando | MarketDesliz</title></Head>
        <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
          <TerminalBar mode="rotating" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span
                className="font-serif text-[32px] block mb-5 select-none"
                style={{ color: T.inkGhost }}
              >
                ʃƪʃƪ
              </span>
              <p
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: T.inkFaint, fontWeight: 500 }}
              >
                Cargando perfil
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Render principal ───────────────────────────────────
  return (
    <>
      <Head>
        <title>Mi Perfil | MarketDesliz</title>
        <meta name="theme-color" content="#0F0F0F" />
      </Head>

      <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
        <BackButton fallback="/" />
        <TerminalBar mode="rotating" />
        <Header notifications={notifications} unreadCount={unreadCount} />

        <main className="flex-1 max-w-[1080px] mx-auto px-6 md:px-14 py-12 md:py-16 w-full">

          {/* ─── Hero editorial ─────────────────────────── */}
          <section className="mb-10">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-6"
              style={{
                color: T.inkFaint,
                fontWeight: 500,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Perfil · MarketDesliz
            </p>

            <h1
              className="text-[36px] md:text-[56px] leading-[1.02] tracking-[-0.035em] max-w-2xl"
              style={{
                color: T.ink,
                fontWeight: 400,
                fontFeatureSettings: '"ss01"',
              }}
            >
              Mi perfil
              <br />
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                y actividad.
              </span>
            </h1>
          </section>

          {/* ─── Header card: foto + datos + acciones ───── */}
          <section className="mb-6">
            <div
              className="p-6 md:p-8"
              style={{
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '8px',
              }}
            >
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Foto */}
                <div
                  className="shrink-0 overflow-hidden flex items-center justify-center"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: 'rgba(79, 46, 232, 0.08)',
                    borderRadius: '12px',
                  }}
                >
                  {getFotoUrl() ? (
                    <img
                      src={getFotoUrl()}
                      alt="Foto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={28} strokeWidth={1.5} style={{ color: T.accent }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-[20px] md:text-[22px] truncate tracking-[-0.01em]"
                    style={{ color: T.ink, fontWeight: 500 }}
                  >
                    {cliente?.nombre || 'Usuario'}
                  </h2>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {cliente?.telefono && (
                      <span
                        className="flex items-center gap-1.5 text-[12px] tabular-nums"
                        style={{
                          color: T.inkSoft,
                          fontWeight: 450,
                          fontFeatureSettings: '"tnum"',
                        }}
                      >
                        <Phone size={12} strokeWidth={1.75} /> {cliente.telefono}
                      </span>
                    )}
                    {cliente?.email && (
                      <span
                        className="flex items-center gap-1.5 text-[12px]"
                        style={{ color: T.inkFaint, fontWeight: 450 }}
                      >
                        <Mail size={12} strokeWidth={1.75} /> {cliente.email}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[11px] mt-2"
                    style={{ color: T.inkFaint, fontWeight: 450 }}
                  >
                    Miembro desde {formatDate(cliente?.created)}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 text-[12.5px] transition-colors"
                    style={{
                      background: isEditing ? 'transparent' : T.accent,
                      color: isEditing ? T.inkMid : '#FFFFFF',
                      border: `1px solid ${isEditing ? T.line : T.accent}`,
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                    onMouseEnter={(e) => {
                      if (!isEditing)
                        e.currentTarget.style.background = T.accentDeep;
                      else
                        e.currentTarget.style.background = 'rgba(15,15,15,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isEditing) e.currentTarget.style.background = T.accent;
                      else e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Edit2 size={13} strokeWidth={1.75} />
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 text-[12.5px] transition-colors"
                    style={{
                      background: 'transparent',
                      color: T.red,
                      border: `1px solid rgba(197, 48, 48, 0.18)`,
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(197,48,48,0.04)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <LogOut size={13} strokeWidth={1.75} /> Salir
                  </button>
                </div>
              </div>

              {/* Auth methods */}
              {authMethods?.methods?.length > 0 && (
                <div
                  className="mt-6 pt-5"
                  style={{ borderTop: `1px solid ${T.line}` }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] mb-3"
                    style={{ color: T.inkFaint, fontWeight: 500 }}
                  >
                    Acceso a tu cuenta
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {authMethods.methods.map((method) => {
                      const isGoogle = method.provider === 'google';
                      const isPhone = method.provider === 'phone';
                      const fg = isGoogle
                        ? '#EA4335'
                        : isPhone
                        ? T.green
                        : T.accent;
                      const bg = isGoogle
                        ? 'rgba(234, 67, 53, 0.06)'
                        : isPhone
                        ? 'rgba(26, 127, 75, 0.06)'
                        : 'rgba(79, 46, 232, 0.06)';
                      const label = isGoogle
                        ? 'Google'
                        : isPhone
                        ? 'SMS'
                        : 'Email';
                      return (
                        <span
                          key={method.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1"
                          style={{
                            background: bg,
                            color: fg,
                            borderRadius: '4px',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontWeight: 600,
                          }}
                        >
                          {label} {method.isPrimary && '· principal'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ─── Alert: sin teléfono ─────────────────────── */}
          {cliente && !cliente.telefono && (
            <section className="mb-6">
              <WarningCallout>
                <p
                  className="text-[13px] leading-[1.55] mb-3"
                  style={{ color: '#8A6109', fontWeight: 450 }}
                >
                  Aún no has registrado un número de teléfono. Esto te
                  permitirá recibir notificaciones y ser contactado por el
                  cobrador.
                </p>
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-white text-[12.5px]"
                  style={{
                    background: T.accent,
                    borderRadius: '6px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
                >
                  <Phone size={13} strokeWidth={1.75} /> Agregar número de teléfono
                </button>
              </WarningCallout>
            </section>
          )}

          {/* ─── Vincular Google ─────────────────────────── */}
          {authMethods && !authMethods.hasGoogle && (
            <section className="mb-6">
              <div
                className="p-6"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <SectionLabel>Vincular cuenta</SectionLabel>
                <p
                  className="text-[13px] leading-[1.55] mb-4"
                  style={{ color: T.inkSoft, fontWeight: 450 }}
                >
                  Vincula tu cuenta de Google para iniciar sesión más rápido.
                </p>
                <GoogleLogin
                  onSuccess={async (response) => {
                    setGoogleLinking(true);
                    try {
                      const decoded = parseJwt(response.credential);
                      await addProviderToUser(cliente.id, {
                        provider: 'google',
                        providerId: decoded.sub,
                        email: decoded.email,
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
                  <p
                    className="text-[11.5px] mt-3 flex items-center gap-2"
                    style={{ color: T.inkFaint, fontWeight: 450 }}
                  >
                    <span
                      className="border-2 rounded-full animate-spin"
                      style={{
                        width: '12px',
                        height: '12px',
                        borderColor: T.line,
                        borderTopColor: T.accent,
                        display: 'inline-block',
                      }}
                    />
                    Vinculando…
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ─── Modo edición ────────────────────────────── */}
          {isEditing && (
            <section className="mb-8">
              <div
                className="p-6 md:p-8"
                style={{
                  background: T.bg,
                  border: `1px solid ${T.line}`,
                  borderRadius: '8px',
                }}
              >
                <SectionLabel accent>Editar información</SectionLabel>

                {/* Foto */}
                <div
                  className="mb-6 pb-6"
                  style={{ borderBottom: `1px solid ${T.line}` }}
                >
                  <FieldLabel>Foto de perfil</FieldLabel>
                  <div className="flex items-center gap-5 mt-2">
                    <div
                      className="shrink-0 overflow-hidden flex items-center justify-center"
                      style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(15,15,15,0.04)',
                        borderRadius: '10px',
                      }}
                    >
                      {fotoPreview ? (
                        <img
                          src={fotoPreview}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : getFotoUrl() ? (
                        <img
                          src={getFotoUrl()}
                          alt="Foto actual"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <User size={22} strokeWidth={1.5} style={{ color: T.inkFaint }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="text-[11.5px] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-[11.5px] file:font-medium file:cursor-pointer"
                        style={{
                          color: T.inkSoft,
                        }}
                      />
                      <p
                        className="text-[10.5px] mt-1.5"
                        style={{ color: T.inkFaint, fontWeight: 450 }}
                      >
                        JPG, PNG — máx. 2MB
                      </p>
                      {cliente?.foto && !fotoPreview && (
                        <button
                          type="button"
                          onClick={handleEliminarFoto}
                          className="text-[11px] mt-1.5 transition-colors"
                          style={{
                            color: T.red,
                            fontWeight: 500,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          Eliminar foto
                        </button>
                      )}
                      {eliminarFoto && (
                        <p
                          className="text-[10.5px] mt-1"
                          style={{ color: T.red, fontWeight: 450 }}
                        >
                          Foto marcada para eliminar
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Datos personales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <FieldLabel>Nombre completo</FieldLabel>
                    <FieldInput
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div>
                    <FieldLabel>Teléfono alternativo</FieldLabel>
                    <FieldInput
                      type="tel"
                      value={formData.telefonoAlternativo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          telefonoAlternativo: e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 10),
                        })
                      }
                      placeholder="55 1234 5678"
                    />
                  </div>
                  <div>
                    <FieldLabel>Correo electrónico</FieldLabel>
                    <FieldInput
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div>
                    <FieldLabel>Día de pago preferente</FieldLabel>
                    <FieldSelect
                      value={formData.diaPago}
                      onChange={(e) =>
                        setFormData({ ...formData, diaPago: e.target.value })
                      }
                    >
                      <option value="lunes">Lunes</option>
                      <option value="martes">Martes</option>
                    </FieldSelect>
                  </div>
                </div>

                {/* Dirección */}
                <SectionLabel>Dirección</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      <FieldInput
                        value={formData[field]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: e.target.value })
                        }
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <FieldLabel>Referencias del domicilio</FieldLabel>
                    <FieldTextarea
                      value={formData.direccionReferencias}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          direccionReferencias: e.target.value,
                        })
                      }
                      rows="2"
                      placeholder="Casa azul, junto a la tienda..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-2.5 mt-8 pt-6" style={{ borderTop: `1px solid ${T.line}` }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="flex-1 h-11 text-[13px] transition-colors disabled:opacity-50"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${T.line}`,
                      borderRadius: '6px',
                      color: T.inkMid,
                      fontWeight: 500,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                    onMouseEnter={(e) => {
                      if (!saving)
                        e.currentTarget.style.background = 'rgba(15,15,15,0.03)';
                    }}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 h-11 text-white text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: T.accent,
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transitionTimingFunction: T.ease,
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) e.currentTarget.style.background = T.accentDeep;
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) e.currentTarget.style.background = T.accent;
                    }}
                  >
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ─── Vista normal ────────────────────────────── */}
          {!isEditing && (
            <>
              {/* Stats */}
              <section className="mb-6">
                <SectionLabel>Resumen</SectionLabel>
                <div
                  className="grid grid-cols-2 md:grid-cols-5"
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <StatBlock
                    value={stats.totalCompras}
                    label="Compras"
                    border={false}
                  />
                  <StatBlock
                    value={formatMoney(stats.totalPagado)}
                    label="Total pagado"
                  />
                  <StatBlock
                    value={formatMoney(stats.deudaActual)}
                    label="Saldo pendiente"
                  />
                  <StatBlock
                    value={formatMoney(stats.siguientePago?.monto || 0)}
                    label="Próximo pago"
                    sub={
                      stats.siguientePago?.fecha
                        ? formatDate(stats.siguientePago.fecha)
                        : null
                    }
                    accent
                  />
                  <StatBlock
                    value={stats.tandasActivas}
                    label="Tandas activas"
                  />
                </div>
              </section>

              {/* Nivel */}
              {estadisticasNivel && (
                <section className="mb-6">
                  <SectionLabel>Tu nivel</SectionLabel>
                  <div
                    className="p-6"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.line}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                      <div>
                        <p
                          className="text-[10px] uppercase tracking-[0.18em] mb-2"
                          style={{ color: T.inkFaint, fontWeight: 500 }}
                        >
                          Nivel actual
                        </p>
                        <p
                          className="text-[32px] tabular-nums tracking-[-0.02em] leading-none"
                          style={{
                            color: T.accent,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {estadisticasNivel.nivelActual}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[10px] uppercase tracking-[0.18em] mb-2"
                          style={{ color: T.inkFaint, fontWeight: 500 }}
                        >
                          Próximo nivel
                        </p>
                        <p
                          className="text-[13px] tabular-nums"
                          style={{
                            color: T.inkMid,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          Faltan {estadisticasNivel.productosFaltantes} productos
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-full overflow-hidden"
                      style={{
                        height: '5px',
                        background: 'rgba(15,15,15,0.04)',
                        borderRadius: '3px',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(
                            100,
                            (estadisticasNivel.productosPagados /
                              (estadisticasNivel.productosPagados +
                                estadisticasNivel.productosFaltantes)) *
                              100
                          )}%`,
                          background: T.accent,
                          borderRadius: '3px',
                          transition: `width 0.6s ${T.ease}`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between flex-wrap gap-2 mt-4">
                      <p
                        className="text-[11.5px]"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        Tandas hasta{' '}
                        <span
                          className="tabular-nums"
                          style={{
                            color: T.accent,
                            fontWeight: 500,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {formatMoney(estadisticasNivel.tandaDisponible)}
                        </span>
                      </p>
                      {estadisticasNivel.productosEnCurso > 0 && (
                        <p
                          className="text-[11.5px] tabular-nums"
                          style={{
                            color: '#B8820E',
                            fontWeight: 450,
                            fontFeatureSettings: '"tnum"',
                          }}
                        >
                          {estadisticasNivel.productosEnCurso} producto(s) en curso
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* KYC */}
              <section className="mb-6">
                <SectionLabel>Verificación</SectionLabel>
                <div
                  className="p-6"
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                  }}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          background: kycInfo.bg,
                          borderRadius: '10px',
                        }}
                      >
                        <KycIcon
                          size={18}
                          strokeWidth={1.75}
                          style={{ color: kycInfo.fg }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-[14px]"
                          style={{ color: T.ink, fontWeight: 500 }}
                        >
                          Verificación KYC
                        </p>
                        <span
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5"
                          style={{
                            background: kycInfo.bg,
                            color: kycInfo.fg,
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            fontWeight: 600,
                          }}
                        >
                          {kycInfo.label}
                        </span>
                      </div>
                    </div>
                    {kycInfo.link && (
                      <Link
                        href={kycInfo.link}
                        className="inline-flex items-center gap-1 text-[12px] transition-colors"
                        style={{
                          color: T.accent,
                          fontWeight: 500,
                          textDecoration: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.textDecoration = 'underline')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.textDecoration = 'none')
                        }
                      >
                        {kycInfo.action} <ChevronRight size={12} strokeWidth={1.75} />
                      </Link>
                    )}
                  </div>
                  {!kycStatus && (
                    <p
                      className="text-[12px] leading-[1.55] mt-4"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      Necesitas verificar tu identidad para poder unirte a
                      tandas.
                    </p>
                  )}
                  {kycStatus === 'rechazado' && (
                    <p
                      className="text-[12px] leading-[1.55] mt-4"
                      style={{ color: T.inkSoft, fontWeight: 450 }}
                    >
                      Tus documentos no fueron aprobados. Por favor, vuelve a
                      subirlos.
                    </p>
                  )}
                </div>
              </section>

              {/* Quick actions */}
              <section className="mb-6">
                <SectionLabel>Accesos</SectionLabel>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { href: '/perfil/ordenes', icon: Package, label: 'Mis órdenes' },
                    { href: '/perfil/pagos', icon: DollarSign, label: 'Mis pagos' },
                    { href: '/tandas/mis-tandas', icon: Target, label: 'Mis tandas' },
                    { href: '/perfil/qr', icon: QrCode, label: 'Mi QR' },
                    { href: '/perfil/tarjeta', icon: CreditCard, label: 'Mi tarjeta' },
                    {
                      href: 'https://wa.me/522821414939',
                      icon: MessageCircle,
                      label: 'Soporte',
                      external: true,
                    },
                  ].map((item) => (
                    <ActionTile key={item.href} {...item} />
                  ))}
                </div>
              </section>

              {/* Órdenes activas */}
              <section className="mb-8">
                <div className="flex items-baseline justify-between mb-4">
                  <SectionLabel>Órdenes activas</SectionLabel>
                  <Link
                    href="/perfil/ordenes"
                    className="text-[11px] uppercase tracking-[0.18em] transition-colors"
                    style={{
                      color: T.inkSoft,
                      fontWeight: 500,
                      textDecoration: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = T.accent)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = T.inkSoft)}
                  >
                    Ver todas →
                  </Link>
                </div>

                <div
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.line}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {pagosPendientes.length === 0 ? (
                    <div className="py-16 px-6 text-center">
                      <CheckCircle
                        size={28}
                        strokeWidth={1.5}
                        style={{
                          color: T.inkGhost,
                          margin: '0 auto 12px',
                        }}
                      />
                      <p
                        className="text-[13px] mb-3"
                        style={{ color: T.inkSoft, fontWeight: 450 }}
                      >
                        No tienes órdenes pendientes
                      </p>
                      <Link
                        href="/productos"
                        className="text-[12px] transition-colors"
                        style={{
                          color: T.accent,
                          fontWeight: 500,
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                          textDecorationThickness: '1px',
                        }}
                      >
                        Ver productos →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {pagosPendientes.map((orden, idx) => (
                        <div
                          key={orden.id}
                          className="px-5 py-4"
                          style={{
                            borderTop: idx === 0 ? 'none' : `1px solid ${T.line}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-[14px] truncate"
                                style={{ color: T.ink, fontWeight: 500 }}
                              >
                                {orden.expand?.productId?.nombre ||
                                  orden.productName ||
                                  orden.productId}
                              </p>
                              <p
                                className="text-[11.5px] mt-1"
                                style={{ color: T.inkFaint, fontWeight: 450 }}
                              >
                                {orden.tipo === 'contado'
                                  ? 'Compra de contado'
                                  : 'Compra a crédito'}
                              </p>
                              {orden.tipo === 'credito' && (
                                <p
                                  className="text-[11.5px] mt-2 tabular-nums"
                                  style={{
                                    color: T.inkSoft,
                                    fontWeight: 450,
                                    fontFeatureSettings: '"tnum"',
                                  }}
                                >
                                  {formatMoney(orden.pagoSemanal)}/sem
                                  <span style={{ color: T.inkGhost }}> · </span>
                                  {orden.semanasTotales} semanas
                                </p>
                              )}
                              <p
                                className="text-[16px] mt-2 tabular-nums tracking-[-0.01em]"
                                style={{
                                  color: T.accent,
                                  fontWeight: 500,
                                  fontFeatureSettings: '"tnum"',
                                }}
                              >
                                {formatMoney(
                                  orden.tipo === 'contado'
                                    ? orden.totalPagar
                                    : (orden.enganche || 0) +
                                        (orden.pagoSemanal || 0) *
                                          (orden.semanasTotales || 0)
                                )}
                              </p>
                            </div>
                            <EstadoOrdenBadge estado={orden.estadoPago} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        <Footer variant="minimal" />
      </div>

      {/* ─── Modal éxito ─────────────────────────────────── */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
        >
          <div
            className="p-8 text-center max-w-sm w-full"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
          >
            <div
              className="inline-flex items-center justify-center mb-5"
              style={{
                width: '56px',
                height: '56px',
                background: 'rgba(26, 127, 75, 0.08)',
                borderRadius: '14px',
              }}
            >
              <CheckCircle
                size={26}
                strokeWidth={1.5}
                style={{ color: T.green }}
              />
            </div>
            <h3
              className="text-[22px] leading-tight tracking-[-0.02em] mb-2"
              style={{ color: T.ink, fontWeight: 400 }}
            >
              Perfil actualizado
            </h3>
            <p
              className="text-[13px] leading-[1.55]"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Tus datos han sido guardados correctamente.
            </p>
          </div>
        </div>
      )}

      {/* ─── Modal error ─────────────────────────────────── */}
      {showErrorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="p-6 max-w-sm w-full"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={18}
                  strokeWidth={1.75}
                  style={{ color: T.red, flexShrink: 0 }}
                />
                <h3
                  className="text-[16px] leading-tight tracking-[-0.01em]"
                  style={{ color: T.ink, fontWeight: 500 }}
                >
                  Error al actualizar
                </h3>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '28px',
                  height: '28px',
                  background: 'rgba(15,15,15,0.03)',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Cerrar"
              >
                <X size={12} strokeWidth={1.75} />
              </button>
            </div>
            <div
              className="p-3.5 mb-5 max-h-40 overflow-auto"
              style={{
                background: 'rgba(197, 48, 48, 0.04)',
                border: `1px solid rgba(197, 48, 48, 0.15)`,
                borderRadius: '6px',
              }}
            >
              {errorMessages.map((msg, idx) => (
                <p
                  key={idx}
                  className="text-[12px] leading-[1.55] mb-1 last:mb-0"
                  style={{ color: T.red, fontWeight: 450 }}
                >
                  {msg}
                </p>
              ))}
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full h-11 text-white text-[13px]"
              style={{
                background: T.accent,
                borderRadius: '6px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal completar datos (compartido) ──────────── */}
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

      {/* ─── Modal agregar teléfono ──────────────────────── */}
      {showPhoneModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,15,15,0.7)' }}
          onClick={() => setShowPhoneModal(false)}
        >
          <div
            className="p-6 max-w-md w-full"
            style={{
              background: T.bg,
              border: `1px solid ${T.line}`,
              borderRadius: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SectionLabel accent>Agregar teléfono</SectionLabel>
            <h3
              className="text-[22px] leading-tight tracking-[-0.02em] mb-3"
              style={{ color: T.ink, fontWeight: 400 }}
            >
              Tu número
              <span className="font-serif italic" style={{ color: T.inkMid }}>
                {' '}de contacto.
              </span>
            </h3>
            <p
              className="text-[13px] leading-[1.55] mb-5"
              style={{ color: T.inkSoft, fontWeight: 450 }}
            >
              Ingresa tu número para recibir notificaciones y ser contactado
              por el cobrador.
            </p>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) =>
                setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="55 1234 5678"
              autoFocus
              className="w-full text-center outline-none transition-colors tabular-nums"
              style={{
                height: '56px',
                background: T.bg,
                border: `1px solid ${T.line}`,
                borderRadius: '6px',
                color: T.ink,
                fontSize: '20px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                fontFeatureSettings: '"tnum"',
                fontFamily: 'ui-monospace, monospace',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = T.line)}
            />
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  setPhoneInput('');
                }}
                className="flex-1 h-11 text-[13px] transition-colors"
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.line}`,
                  borderRadius: '6px',
                  color: T.inkMid,
                  fontWeight: 500,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(15,15,15,0.03)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPhone}
                className="flex-1 h-11 text-white text-[13px]"
                style={{
                  background: T.accent,
                  borderRadius: '6px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transitionTimingFunction: T.ease,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.accentDeep)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
        body {
          font-family:
            -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display',
            'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
        .font-serif {
          font-family:
            ui-serif, 'Iowan Old Style', 'Apple Garamond', 'Palatino',
            Georgia, 'Times New Roman', serif;
        }
        ::selection {
          background: rgba(79, 46, 232, 0.12);
          color: #0F0F0F;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          font-feature-settings: 'kern' 1, 'liga' 1, 'ss01' 1, 'calt' 1;
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EstadoOrdenBadge · badge de estado de orden
// ─────────────────────────────────────────────────────────────────────────
function EstadoOrdenBadge({ estado }) {
  const map = {
    completada: { label: 'Completada', fg: T.green, bg: 'rgba(26, 127, 75, 0.08)' },
    activa: { label: 'Activa', fg: T.accent, bg: 'rgba(79, 46, 232, 0.08)' },
    pendiente_pago: { label: 'Pendiente', fg: '#B8820E', bg: 'rgba(184, 130, 14, 0.08)' },
  };
  const c = map[estado] || map.pendiente_pago;

  return (
    <span
      className="shrink-0 inline-flex items-center px-2.5 py-1"
      style={{
        background: c.bg,
        color: c.fg,
        borderRadius: '4px',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}