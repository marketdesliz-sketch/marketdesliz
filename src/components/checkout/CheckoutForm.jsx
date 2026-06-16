// src/components/checkout/CheckoutForm.jsx
import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import pb from '../../lib/pocketbase';
import { createCashOrderSimple, createCreditOrderSimple } from '../../lib/ordersService';
import { createVisitTask, createDeliveryTask } from '../../lib/collectorService';
import DateTimeSelector from './DateTimeSelector';
import MetodoPagoModal from './MetodoPagoModal';
import EscanearVendedorModal from './EscanearVendedorModal';
import TransferenciaModal from './TransferenciaModal';

// ── helpers ────────────────────────────────────────────────────────────────
const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  return phone;
}

// ── Componentes de UI reutilizables ───────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all bg-white ${className}`}
      {...props}
    />
  );
}

function StepIndicator({ current }) {
  const steps = ['Datos personales', 'Dirección', 'Confirmar'];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-[#10b981] text-white' : active ? 'bg-[#6C3BFF] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${active ? 'text-[#6C3BFF] font-semibold' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 ${done ? 'bg-[#10b981]' : 'bg-gray-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function CheckoutForm({ product, phone, tipoSolicitud, planCalculado, onConfirm, onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [showDateTimeSelector, setShowDateTimeSelector] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);
  const [showMetodoPago, setShowMetodoPago] = useState(false);
  const [showEscanearVendedor, setShowEscanearVendedor] = useState(false);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [orderDataTemp, setOrderDataTemp] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '', email: '', telefonoAlternativo: '', diaPago: 'lunes',
    calle: '', numeroExterior: '', numeroInterior: '', colonia: '',
    municipio: '', ciudad: '', estado: '', codigoPostal: '', referenciasDomicilio: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.nombre.trim()) { setError('Nombre completo requerido'); return; }
      if (!formData.telefonoAlternativo || formData.telefonoAlternativo.replace(/\D/g, '').length < 10) {
        setError('Teléfono alternativo válido requerido (10 dígitos)'); return;
      }
      if (!acceptTerms) { setError('Debes aceptar los términos y condiciones'); return; }
      setError('');
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 1) { onBack?.(); } else { setStep(step - 1); setError(''); }
  };

  // ── Lógica de negocio (sin cambios) ──────────────────────────────────────
  const actualizarClientStats = async (userId, monto = null, esCredito = false) => {
    try {
      const clientRecord = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
      const updateData = { fechaUltimaCompra: new Date().toISOString() };
      if (monto !== null && monto > 0) {
        updateData.totalGastado = (clientRecord.totalGastado || 0) + monto;
        updateData.productosComprados = (clientRecord.productosComprados || 0) + 1;
        if (esCredito) {
          updateData.productosEnCurso = (clientRecord.productosEnCurso || 0) + 1;
          updateData.deudaActual = (clientRecord.deudaActual || 0) + monto;
        }
      }
      await pb.collection('clients').update(clientRecord.id, updateData);
    } catch (error) { console.error('Error actualizando cliente:', error); }
  };

  const crearPaymentsParaOrden = async (orderId, userId, plan) => {
    const paymentsCollection = pb.collection('payments');
    try {
      await paymentsCollection.create({
        orderId, userId, numeroSemana: 0, montoProgramado: plan.enganche,
        montoPagado: 0, fechaVencimiento: new Date().toISOString().split('T')[0],
        estado: 'pendiente', metodoPago: 'qr'
      });
      for (let i = 1; i <= plan.semanas; i++) {
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 7));
        let monto = plan.pagoSemanal;
        if (i === plan.semanas && plan.ultimoPago && plan.ultimoPago > 0 && plan.ultimoPago !== plan.pagoSemanal) {
          monto = plan.ultimoPago;
        }
        await paymentsCollection.create({
          orderId, userId, numeroSemana: i, montoProgramado: monto,
          montoPagado: 0, fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
          estado: 'pendiente', metodoPago: null
        });
      }
    } catch (err) { console.error('Error creando payments:', err); throw err; }
  };

  const crearNotificaciones = async (orderId, productoNombre, tipo, vendedorId = null) => {
    try {
      const admins = await pb.collection('users').getFullList({ filter: 'role = "admin"' });
      for (const admin of admins) {
        await pb.collection('notificaciones').create({
          usuarioId: admin.id, tipoUsuario: 'admin', tipo: 'nueva_solicitud',
          titulo: 'Nueva orden creada',
          mensaje: `Orden #${orderId.slice(-6)} - ${productoNombre} - ${tipo}`,
          entidadId: orderId, entidadTipo: 'orden',
          datos: { productoNombre, tipo, timestamp: new Date().toISOString() }
        });
      }
      if (vendedorId) {
        const vendedor = await pb.collection('vendedores').getOne(vendedorId);
        await pb.collection('notificaciones').create({
          usuarioId: vendedor.userId, tipoUsuario: 'vendedor', tipo: 'nueva_solicitud',
          titulo: 'Nueva venta por validar',
          mensaje: `Cliente: ${formData.nombre} - Producto: ${productoNombre}`,
          entidadId: orderId, entidadTipo: 'orden',
          datos: { productoNombre, tipo, clienteNombre: formData.nombre, timestamp: new Date().toISOString() }
        });
      }
    } catch (err) { console.error('Error creando notificaciones:', err); }
  };

  const procesarSolicitudConMetodo = async (metodoPago, vendedorId = null, comprobanteId = null) => {
    setLoading(true);
    setError('');
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) throw new Error('Usuario no autenticado');
      const direccionCompleta = `${formData.calle} ${formData.numeroExterior}, ${formData.colonia}, ${formData.municipio}, ${formData.ciudad}, ${formData.estado} CP ${formData.codigoPostal}`;

      await pb.collection('users').update(currentUser.id, {
        nombre: formData.nombre,
        email: formData.email || `${phone}@temp.com`,
      });

      const clientData = {
        direccionCalle: formData.calle, direccionNumero: formData.numeroExterior,
        direccionInterior: formData.numeroInterior || '', direccionColonia: formData.colonia,
        direccionMunicipio: formData.municipio, direccionCiudad: formData.ciudad,
        direccionEstado: formData.estado, direccionCp: formData.codigoPostal,
        direccionReferencias: formData.referenciasDomicilio || '',
        diaPago: formData.diaPago, telefonoAlternativo: formData.telefonoAlternativo,
        datosCompletos: true, aceptaTerminos: true, fechaAceptaTerminos: new Date().toISOString()
      };

      try {
        const existingClient = await pb.collection('clients').getFirstListItem(`userId = "${currentUser.id}"`);
        await pb.collection('clients').update(existingClient.id, { ...clientData, estadoKyc: existingClient.estadoKyc || 'pendiente' });
      } catch {
        await pb.collection('clients').create({ userId: currentUser.id, ...clientData, estadoKyc: 'pendiente' });
      }

      let resultId = null;
      let totalPrice = 0;
      let esCredito = false;

      if (tipoSolicitud === 'contado') {
        totalPrice = Math.round(product.precio * 2 / 3);
        const order = await createCashOrderSimple({
          clientId: currentUser.id, productId: product.id, productName: product.nombre,
          productPrice: product.precio, totalPrice: product.precio, cashPrice: totalPrice,
          paymentMethod: metodoPago, clientData: { ...formData, direccionCompleta, telefono: phone },
          vendedorId: vendedorId || null, comprobanteId: comprobanteId || null
        });
        resultId = order.id;
      } else if (tipoSolicitud === 'credito' && planCalculado) {
        totalPrice = planCalculado.totalPagar;
        esCredito = true;
        const order = await createCreditOrderSimple({
          clientId: currentUser.id, productId: product.id, productName: product.nombre,
          productPrice: product.precio, totalPrice: planCalculado.totalPagar,
          downPayment: planCalculado.enganche, downPaymentPercentage: planCalculado.enganchePorcentaje,
          weeklyAmount: planCalculado.pagoSemanal, totalWeeks: planCalculado.semanas,
          weeklyPayments: planCalculado.pagos, remainingBalance: planCalculado.saldoRestante,
          diaPago: formData.diaPago, paymentMethod: metodoPago,
          clientData: { ...formData, direccionCompleta, telefono: phone },
          vendedorId: vendedorId || null, comprobanteId: comprobanteId || null
        });
        resultId = order.id;
        await crearPaymentsParaOrden(resultId, currentUser.id, planCalculado);
      }

      await actualizarClientStats(currentUser.id, totalPrice, esCredito);
      await crearNotificaciones(resultId, product.nombre, tipoSolicitud, vendedorId);
      onConfirm(resultId, tipoSolicitud);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar tu solicitud');
    } finally { setLoading(false); }
  };

  const handleMetodoSeleccionado = (metodo) => {
    setShowMetodoPago(false);
    if (metodo === 'qr_vendedor') setShowEscanearVendedor(true);
    else if (metodo === 'transferencia') setShowTransferencia(true);
  };

  const handleVendedorValidado = (vendedor) => {
    setShowEscanearVendedor(false);
    procesarSolicitudConMetodo('qr_vendedor', vendedor.id, null);
  };

  const handleComprobanteEnviado = (comprobanteId) => {
    setShowTransferencia(false);
    procesarSolicitudConMetodo('transferencia', null, comprobanteId);
  };

  const procesarSolicitudConCita = async (appointment) => {
    setLoading(true);
    setError('');
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) throw new Error('Usuario no autenticado');
      const direccionCompleta = `${formData.calle} ${formData.numeroExterior}, ${formData.colonia}, ${formData.municipio}, ${formData.ciudad}, ${formData.estado} CP ${formData.codigoPostal}`;

      await pb.collection('users').update(currentUser.id, { nombre: formData.nombre, email: formData.email || `${phone}@temp.com` });

      const clientData = {
        direccionCalle: formData.calle, direccionNumero: formData.numeroExterior,
        direccionInterior: formData.numeroInterior || '', direccionColonia: formData.colonia,
        direccionMunicipio: formData.municipio, direccionCiudad: formData.ciudad,
        direccionEstado: formData.estado, direccionCp: formData.codigoPostal,
        direccionReferencias: formData.referenciasDomicilio || '',
        diaPago: formData.diaPago, telefonoAlternativo: formData.telefonoAlternativo, datosCompletos: true
      };
      try {
        const existingClient = await pb.collection('clients').getFirstListItem(`userId = "${currentUser.id}"`);
        await pb.collection('clients').update(existingClient.id, clientData);
      } catch {
        await pb.collection('clients').create({ userId: currentUser.id, ...clientData, estadoKyc: 'pendiente' });
      }

      await actualizarClientStats(currentUser.id, null, false);
      let resultId = null;
      const clientAddressDetails = {
        calle: formData.calle, numero: formData.numeroExterior, colonia: formData.colonia,
        ciudad: formData.ciudad, estado: formData.estado, cp: formData.codigoPostal,
        referencias: formData.referenciasDomicilio
      };
      const baseTaskData = {
        clientId: currentUser.id, clientName: formData.nombre, clientPhone: phone,
        clientPhoneAlternativo: formData.telefonoAlternativo, clientAddress: direccionCompleta,
        clientAddressDetails, productId: product.id, productName: product.nombre,
        scheduledDate: `${appointment.date}T${appointment.time}:00`,
        notes: appointment?.notes || '', createdAt: new Date().toISOString()
      };

      if (tipoSolicitud === 'visita') {
        const task = await createVisitTask(baseTaskData);
        resultId = task.id;
      } else if (tipoSolicitud === 'entrega') {
        const task = await createDeliveryTask({ ...baseTaskData, paymentMethod: 'qr' });
        resultId = task.id;
      }

      await crearNotificaciones(resultId, product.nombre, tipoSolicitud);
      onConfirm(resultId, tipoSolicitud);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar tu solicitud');
      setShowDateTimeSelector(false);
    } finally { setLoading(false); }
  };

  const handleAppointmentConfirm = async (appointment) => {
    setAppointmentData(appointment);
    setShowDateTimeSelector(false);
    await procesarSolicitudConCita(appointment);
  };

  const handleSubmit = () => {
    if (tipoSolicitud === 'visita' || tipoSolicitud === 'entrega') {
      setShowDateTimeSelector(true);
    } else {
      setShowMetodoPago(true);
    }
  };

  // ── Renderizado condicional de sub-modales ────────────────────────────
  if (showDateTimeSelector) {
    return (
      <DateTimeSelector
        type={tipoSolicitud}
        onConfirm={handleAppointmentConfirm}
        onBack={() => setShowDateTimeSelector(false)}
      />
    );
  }

  const orderData = {
    tipoSolicitud,
    totalPrice: tipoSolicitud === 'contado' ? Math.round(product.precio * 2 / 3) : planCalculado?.totalPagar || product.precio,
    downPayment: planCalculado?.enganche || 0,
    weeklyAmount: planCalculado?.pagoSemanal || 0,
    totalWeeks: planCalculado?.semanas || 0,
    product: product.id
  };

  if (showMetodoPago) return <MetodoPagoModal product={product} orderData={orderData} onClose={() => setShowMetodoPago(false)} onMetodoSeleccionado={handleMetodoSeleccionado} />;
  if (showEscanearVendedor) return <EscanearVendedorModal onClose={() => setShowEscanearVendedor(false)} onVendedorValidado={handleVendedorValidado} />;
  if (showTransferencia) return <TransferenciaModal orderData={orderData} product={product} onClose={() => setShowTransferencia(false)} onComprobanteEnviado={handleComprobanteEnviado} />;

  const titleMap = { contado: 'Comprar de Contado', credito: 'Comprar a Crédito', visita: 'Solicitar Visita a Domicilio', entrega: 'Solicitar Entrega de Producto' };

  // ── JSX principal ─────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 text-center mb-5">{titleMap[tipoSolicitud] || 'Completar datos'}</h2>

      {(tipoSolicitud === 'contado' || tipoSolicitud === 'credito') && <StepIndicator current={step} />}

      {/* PASO 1 — Datos personales */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
          <div>
            <FieldLabel required>Nombre completo (como en INE)</FieldLabel>
            <Input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Juan Pérez González" required />
          </div>

          <div>
            <FieldLabel>Teléfono principal</FieldLabel>
            <Input value={formatPhoneDisplay(phone)} disabled className="bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>

          <div>
            <FieldLabel required>Teléfono alternativo</FieldLabel>
            <Input
              type="tel" name="telefonoAlternativo" value={formData.telefonoAlternativo}
              onChange={(e) => setFormData({ ...formData, telefonoAlternativo: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="55 1234 5678" required
            />
            <p className="text-[10px] text-gray-400 mt-1">Familiar o referencia de confianza</p>
          </div>

          <div>
            <FieldLabel>Correo electrónico (opcional)</FieldLabel>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
          </div>

          {(tipoSolicitud === 'contado' || tipoSolicitud === 'credito') && (
            <div>
              <FieldLabel required>Día de pago preferente</FieldLabel>
              <div className="flex gap-4">
                {['lunes', 'martes'].map(dia => (
                  <label key={dia} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="diaPago" value={dia} checked={formData.diaPago === dia} onChange={handleChange}
                      className="accent-[#6C3BFF]" />
                    <span className="text-sm text-gray-700 capitalize">{dia}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl cursor-pointer border border-gray-100">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-[#6C3BFF]" />
            <span className="text-xs text-gray-500 leading-relaxed">
              Acepto los <a href="/terminos" target="_blank" className="text-[#6C3BFF] hover:underline">Términos y Condiciones</a> y confirmo que la información proporcionada es correcta y verídica.
            </span>
          </label>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" className="w-full py-3 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            Continuar <ChevronRight size={16} />
          </button>
        </form>
      )}

      {/* PASO 2 — Dirección */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
          <p className="text-sm font-bold text-gray-800 mb-4">
            Dirección de {tipoSolicitud === 'visita' ? 'visita' : tipoSolicitud === 'entrega' ? 'entrega' : 'domicilio'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Calle</FieldLabel>
              <Input name="calle" value={formData.calle} onChange={handleChange} placeholder="Av. Insurgentes" required />
            </div>
            <div>
              <FieldLabel required>Núm. exterior</FieldLabel>
              <Input name="numeroExterior" value={formData.numeroExterior} onChange={handleChange} placeholder="123" required />
            </div>
          </div>

          <div>
            <FieldLabel>Número interior</FieldLabel>
            <Input name="numeroInterior" value={formData.numeroInterior} onChange={handleChange} placeholder="B, 1A, etc." />
          </div>

          <div>
            <FieldLabel required>Colonia</FieldLabel>
            <Input name="colonia" value={formData.colonia} onChange={handleChange} placeholder="Condesa" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Municipio/Alcaldía</FieldLabel>
              <Input name="municipio" value={formData.municipio} onChange={handleChange} placeholder="Cuauhtémoc" required />
            </div>
            <div>
              <FieldLabel required>Ciudad</FieldLabel>
              <Input name="ciudad" value={formData.ciudad} onChange={handleChange} placeholder="Ciudad de México" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Estado</FieldLabel>
              <Input name="estado" value={formData.estado} onChange={handleChange} placeholder="CDMX" required />
            </div>
            <div>
              <FieldLabel required>Código postal</FieldLabel>
              <Input name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} maxLength="5" placeholder="06100" required />
            </div>
          </div>

          <div>
            <FieldLabel>Referencias del domicilio</FieldLabel>
            <textarea
              name="referenciasDomicilio" value={formData.referenciasDomicilio} onChange={handleChange}
              placeholder="Ej: casa azul, junto a la tienda, portón negro..." rows="2"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3BFF]/25 focus:border-[#6C3BFF] transition-all resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={handleBack} className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-1">
              <ChevronLeft size={16} /> Atrás
            </button>
            <button type="submit" className="py-3 bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1">
              Continuar <ChevronRight size={16} />
            </button>
          </div>
        </form>
      )}

      {/* PASO 3 — Confirmar */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-800 mb-4">Confirmar datos</p>

          {/* Resumen producto */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
            <p className="text-xs font-bold text-[#6C3BFF] mb-3 uppercase tracking-wide">Producto</p>
            {[
              ['Producto', product.nombre],
              ['Precio total', formatMoney(product.precio)],
              tipoSolicitud === 'contado' ? ['Precio de contado', formatMoney(Math.round(product.precio * 2 / 3))] : null,
              tipoSolicitud === 'credito' && planCalculado ? ['Enganche', formatMoney(planCalculado.enganche)] : null,
              tipoSolicitud === 'credito' && planCalculado ? ['Pago semanal', `${formatMoney(planCalculado.pagoSemanal)} × ${planCalculado.semanas} semanas`] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-800">{value}</span>
              </div>
            ))}
            {tipoSolicitud === 'credito' && planCalculado && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-800">Total a pagar</span>
                <span className="font-bold text-[#6C3BFF]">{formatMoney(planCalculado.totalPagar)}</span>
              </div>
            )}
          </div>

          {/* Datos personales */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5">
            <p className="text-xs font-bold text-[#6C3BFF] mb-3 uppercase tracking-wide">Datos personales</p>
            {[
              ['Nombre', formData.nombre],
              ['Teléfono', formatPhoneDisplay(phone)],
              ['Tel. alternativo', formatPhoneDisplay(formData.telefonoAlternativo)],
              (tipoSolicitud === 'contado' || tipoSolicitud === 'credito') ? ['Día de pago', formData.diaPago === 'lunes' ? 'Lunes' : 'Martes'] : null,
              formData.email ? ['Email', formData.email] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>

          {/* Dirección */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-[#6C3BFF] mb-3 uppercase tracking-wide">
              {tipoSolicitud === 'visita' ? 'Dirección de visita' : tipoSolicitud === 'entrega' ? 'Dirección de entrega' : 'Domicilio'}
            </p>
            <p className="text-sm text-gray-700">
              {formData.calle} {formData.numeroExterior}{formData.numeroInterior ? `, ${formData.numeroInterior}` : ''}, {formData.colonia}, {formData.municipio}, {formData.ciudad}, {formData.estado} CP {formData.codigoPostal}
            </p>
            {formData.referenciasDomicilio && (
              <p className="text-xs text-gray-400 mt-1.5">Ref: {formData.referenciasDomicilio}</p>
            )}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setStep(2)} className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-1">
              <ChevronLeft size={16} /> Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="py-3 bg-[#6C3BFF] hover:bg-[#5b2ee6] disabled:bg-gray-300 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {loading ? 'Procesando...' : tipoSolicitud === 'visita' ? 'Confirmar visita' : tipoSolicitud === 'entrega' ? 'Confirmar entrega' : 'Confirmar y apartar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
