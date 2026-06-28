// src/lib/vendedorService.js
import pb from './pocketbase';

// ============================================================
// CONFIGURACIÓN DE COLECCIONES
// ============================================================
const COLLECTIONS = {
  USERS: 'users',
  VENDEDORES: 'vendedores',
  SOLICITUDES: 'solicitudes',
  NOTIFICACIONES: 'notificaciones',
  ORDERS: 'orders',
  COBROS: 'cobros'
};

// ============================================================
// VERIFICAR UNICIDAD (NO LANZA ERROR, DEVUELVE OBJETO)
// ============================================================
async function verificarUnicidad(email, telefono) {
  try {
    const existente = await pb.collection(COLLECTIONS.USERS).getList(1, 1, {
      filter: `email = "${email}" || telefono = "${telefono}"`
    });
    if (existente.totalItems > 0) {
      const conflicto = existente.items[0];
      if (conflicto.email === email) {
        return { ok: false, error: `El correo ${email} ya está registrado` };
      }
      if (conflicto.telefono === telefono) {
        return { ok: false, error: `El teléfono ${telefono} ya está registrado` };
      }
    }
    return { ok: true };
  } catch (error) {
    // Error de red u otro, lo tratamos como error
    return { ok: false, error: error.message };
  }
}

// ============================================================
// GENERAR CÓDIGO ÚNICO PARA VENDEDOR
// ============================================================
export async function generarCodigoVendedor() {
  try {
    let vendedores = [];
    try {
      vendedores = await pb.collection(COLLECTIONS.VENDEDORES).getFullList({
        sort: '-created'
      });
    } catch (e) {
      console.log('No hay vendedores aún');
    }

    let maxNumero = 0;
    for (const v of vendedores) {
      const match = v.codigo?.match(/MDZ-V-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumero) maxNumero = num;
      }
    }

    const nextNumber = maxNumero + 1;
    return `MDZ-V-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generando código:', error);
    return `MDZ-V-${String(Date.now()).slice(-4)}`;
  }
}

// ============================================================
// GENERAR TOKEN QR PARA VENDEDOR
// ============================================================
export function generarQrToken(codigo) {
  return `${codigo}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================
// CREAR VENDEDOR COMPLETO (USER + VENDEDOR)
// ============================================================
export async function crearVendedorCompleto(data) {
  // ✅ Verificar que el admin está autenticado
  if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
    return { success: false, error: 'No tienes permisos para crear vendedores' };
  }

  // ✅ Verificar unicidad de email y teléfono
  const unicidad = await verificarUnicidad(data.email, data.telefono);
  if (!unicidad.ok) {
    return { success: false, error: unicidad.error };
  }

  try {
    const codigo = await generarCodigoVendedor();
    const qrToken = generarQrToken(codigo);

    // Crear usuario en 'users'
    const newUser = await pb.collection(COLLECTIONS.USERS).create({
      nombre: data.nombre,
      email: data.email,
      password: data.password,
      passwordConfirm: data.password,
      role: 'vendedor',
      telefono: data.telefono,
      emailVisibility: false,
      verified: false,
      activo: true
    });

    console.log('✅ Usuario creado:', newUser.id, newUser.email);

    // Crear vendedor - SIN createdBy
    const vendedorData = {
      userId: newUser.id,
      codigo: codigo,
      qrToken: qrToken,
      zona: data.zona || '',
      comisionPorcentaje: data.comisionPorcentaje || 50,
      totalVentas: 0,
      totalComisiones: 0,
      comisionesPendientes: 0,
      activo: true
    };

    const newVendedor = await pb.collection(COLLECTIONS.VENDEDORES).create(vendedorData);

    console.log(`✅ Vendedor creado: ${codigo}`);

    return {
      success: true,
      data: {
        ...newVendedor,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        password: data.password
      }
    };

  } catch (error) {
    console.error('Error creando vendedor:', error);
    let mensaje = 'Error al crear el vendedor';
    if (error.response?.data) {
      const detalles = Object.entries(error.response.data)
        .map(([campo, info]) => `${campo}: ${info.message}`)
        .join(', ');
      mensaje = `Error en campos: ${detalles}`;
    } else if (error.message) {
      mensaje = error.message;
    }
    return { success: false, error: mensaje };
  }
}

// ============================================================
// OBTENER VENDEDOR POR TOKEN QR
// ============================================================
export async function getVendedorByToken(qrToken) {
  try {
    if (!qrToken) return null;

    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getFirstListItem(
      `qrToken = "${qrToken}" && activo = true`,
      { expand: 'userId' }
    );

    // Agregar datos del usuario al resultado
    if (vendedor.expand?.userId) {
      vendedor.nombre = vendedor.expand.userId.nombre;
      vendedor.email = vendedor.expand.userId.email;
      vendedor.telefono = vendedor.expand.userId.telefono;
    }

    return vendedor;
  } catch (error) {
    if (error.status === 404) return null;
    console.error('Error buscando vendedor:', error);
    return null;
  }
}

// ============================================================
// OBTENER VENDEDOR POR ID
// ============================================================
export async function getVendedorById(vendedorId) {
  try {
    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId, {
      expand: 'userId'
    });

    if (vendedor.expand?.userId) {
      vendedor.nombre = vendedor.expand.userId.nombre;
      vendedor.email = vendedor.expand.userId.email;
      vendedor.telefono = vendedor.expand.userId.telefono;
    }

    return vendedor;
  } catch (error) {
    console.error('Error obteniendo vendedor:', error);
    return null;
  }
}

// ============================================================
// OBTENER VENDEDOR POR EMAIL
// ============================================================
export async function getVendedorByEmail(email) {
  try {
    // Primero buscar usuario por email
    const user = await pb.collection(COLLECTIONS.USERS).getFirstListItem(
      `email = "${email}" && role = "vendedor"`
    );

    if (!user) return null;

    // Luego buscar vendedor por userId
    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getFirstListItem(
      `userId = "${user.id}" && activo = true`,
      { expand: 'userId' }
    );

    if (vendedor.expand?.userId) {
      vendedor.nombre = vendedor.expand.userId.nombre;
      vendedor.email = vendedor.expand.userId.email;
      vendedor.telefono = vendedor.expand.userId.telefono;
    }

    return vendedor;
  } catch (error) {
    if (error.status === 404) return null;
    console.error('Error buscando vendedor:', error);
    return null;
  }
}

// ============================================================
// OBTENER SOLICITUDES PENDIENTES DE UN VENDEDOR
// ============================================================
export async function getSolicitudesPendientes(vendedorId) {
  try {
    const solicitudes = await pb.collection(COLLECTIONS.SOLICITUDES).getFullList({
      filter: `vendedorId = "${vendedorId}" && estado = "pendiente_vendedor"`,
      sort: '-created',
      expand: 'clienteId,productoId'
    });
    return solicitudes;
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return [];
  }
}

// ============================================================
// OBTENER HISTORIAL DE SOLICITUDES DE UN VENDEDOR
// ============================================================
export async function getHistorialSolicitudes(vendedorId) {
  try {
    const solicitudes = await pb.collection(COLLECTIONS.SOLICITUDES).getFullList({
      filter: `vendedorId = "${vendedorId}" && estado != "pendiente_vendedor"`,
      sort: '-created',
      expand: 'clienteId,productoId'
    });
    return solicitudes;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}

// ============================================================
// VALIDAR SOLICITUD (VENDEDOR)
// ============================================================
export async function validarSolicitud(solicitudId, notas = '') {
  try {
    const solicitud = await pb.collection(COLLECTIONS.SOLICITUDES).update(solicitudId, {
      estado: 'vendedor_validado',
      fechaValidacionVendedor: new Date().toISOString(),
      notasVendedor: notas
    });

    // ✅ Notificar al admin usando colección UNIFICADA
    await crearNotificacionAdmin(solicitudId, solicitud);
    return solicitud;
  } catch (error) {
    console.error('Error validando solicitud:', error);
    throw error;
  }
}

// ============================================================
// MARCAR ENGANCHE COMO RECIBIDO
// ============================================================
export async function marcarEngancheRecibido(solicitudId, monto, metodoPago = 'qr') {
  try {
    const solicitud = await pb.collection(COLLECTIONS.SOLICITUDES).update(solicitudId, {
      enganchePagado: true,
      engancheRecibidoPor: pb.authStore.model?.id,
      engancheRecibidoFecha: new Date().toISOString(),
      notasVendedor: `Enganche de $${monto} recibido en ${metodoPago}`
    });

    // Si hay orden asociada, actualizar el enganche como pagado
    if (solicitud.productoId) {
      try {
        const ordenes = await pb.collection(COLLECTIONS.ORDERS).getFullList({
          filter: `userId = "${solicitud.clienteId}" && productId = "${solicitud.productoId}" && enganchePagado = false`
        });

        for (const orden of ordenes) {
          await pb.collection(COLLECTIONS.ORDERS).update(orden.id, {
            enganchePagado: true,
            estadoPago: orden.tipo === 'credito' ? 'activa' : 'completada'
          });
        }
      } catch (e) {
        console.warn('No se pudo actualizar orden:', e.message);
      }
    }

    return solicitud;
  } catch (error) {
    console.error('Error marcando enganche:', error);
    throw error;
  }
}

// ============================================================
// CREAR NOTIFICACIÓN PARA ADMIN (COLECCIÓN UNIFICADA)
// ============================================================
async function crearNotificacionAdmin(solicitudId, solicitud = null) {
  try {
    // Buscar admins
    const admins = await pb.collection(COLLECTIONS.USERS).getFullList({
      filter: 'role = "admin"'
    });

    for (const admin of admins) {
      await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
        usuarioId: admin.id,
        tipoUsuario: 'admin',
        tipo: 'nueva_solicitud',
        titulo: '📋 Solicitud validada por vendedor',
        mensaje: solicitud
          ? `Vendedor validó solicitud para: ${solicitud.productoNombre || 'Producto'}`
          : 'Un vendedor ha validado una solicitud. Revisa los detalles.',
        entidadId: solicitudId,
        entidadTipo: 'solicitud',
        datos: {
          solicitudId,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(`✅ Notificaciones enviadas a ${admins.length} admin(s)`);
  } catch (error) {
    console.error('Error creando notificación:', error);
  }
}

// ============================================================
// OBTENER NOTIFICACIONES DEL VENDEDOR (COLECCIÓN UNIFICADA)
// ============================================================
export async function getNotificacionesVendedor(vendedorId) {
  try {
    // Obtener el userId del vendedor
    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId);

    if (!vendedor?.userId) return [];

    // Buscar notificaciones en colección unificada
    const notificaciones = await pb.collection(COLLECTIONS.NOTIFICACIONES).getFullList({
      filter: `usuarioId = "${vendedor.userId}" && tipoUsuario = "vendedor"`,
      sort: '-created',
      limit: 20
    });
    return notificaciones;
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

// ============================================================
// MARCAR NOTIFICACIÓN COMO LEÍDA (COLECCIÓN UNIFICADA)
// ============================================================
export async function marcarNotificacionLeida(notificacionId) {
  try {
    await pb.collection(COLLECTIONS.NOTIFICACIONES).update(notificacionId, {
      leida: true,
      leidaEn: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marcando notificación:', error);
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DEL VENDEDOR
// ============================================================
export async function getEstadisticasVendedor(vendedorId) {
  try {
    const totales = await pb.collection(COLLECTIONS.SOLICITUDES).getFullList({
      filter: `vendedorId = "${vendedorId}"`
    });

    const completadas = totales.filter(s => s.estado === 'completada');
    const enganchesRecibidos = totales
      .filter(s => s.enganchePagado)
      .reduce((sum, s) => sum + (s.enganche || 0), 0);

    let comisionPorcentaje = 50;
    try {
      const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId);
      comisionPorcentaje = vendedor.comisionPorcentaje || 50;
    } catch (e) { }

    const comisionTotal = (enganchesRecibidos * comisionPorcentaje) / 100;

    return {
      totalSolicitudes: totales.length,
      completadas: completadas.length,
      pendientes: totales.filter(s => s.estado === 'pendiente_vendedor').length,
      enganchesRecibidos: enganchesRecibidos,
      comisionEstimada: comisionTotal,
      tasaExito: totales.length ? (completadas.length / totales.length) * 100 : 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalSolicitudes: 0,
      completadas: 0,
      pendientes: 0,
      enganchesRecibidos: 0,
      comisionEstimada: 0,
      tasaExito: 0
    };
  }
}

// ============================================================
// REGISTRAR VENTA DE VENDEDOR (SIN ventas_vendedor)
// ============================================================
export async function registrarVentaVendedor(vendedorId, clienteId, productoId, ordenId, enganche, porcentajeEnganche) {
  try {
    // Obtener el vendedor con su porcentaje de comisión
    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId);
    const comisionPorcentaje = vendedor.comisionPorcentaje || 50; // fallback a 50%

    // Calcular comisión usando el porcentaje real
    const comisionVendedor = Math.round(enganche * (comisionPorcentaje / 100));

    // Actualizar estadísticas del vendedor
    await pb.collection(COLLECTIONS.VENDEDORES).update(vendedorId, {
      totalVentas: (vendedor.totalVentas || 0) + 1,
      totalComisiones: (vendedor.totalComisiones || 0) + comisionVendedor,
      comisionesPendientes: (vendedor.comisionesPendientes || 0) + comisionVendedor
    });

    console.log(`💰 Venta registrada: Comisión $${comisionVendedor} (${comisionPorcentaje}%) para vendedor ${vendedorId}`);

    return {
      success: true,
      data: {
        vendedorId,
        clienteId,
        productoId,
        ordenId,
        montoEnganche: enganche,
        comisionVendedor,
        porcentajeEnganche,
        comisionPorcentaje,
        pagada: false
      }
    };
  } catch (error) {
    console.error('Error registrando venta:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Error al registrar la venta'
    };
  }
}

// ============================================================
// OBTENER VENTAS DEL VENDEDOR CON PAGINACIÓN (ADMIN)
// ============================================================
export async function getVentasVendedorPaginated({
  vendedorId,
  page = 1,
  perPage = 10,
  search = '',
  estado = 'todos',
  sort = '-created'
}) {
  try {
    let filter = `vendedorId = "${vendedorId}"`;

    if (estado === 'completadas') {
      filter += ` && estado = "completada"`;
    } else if (estado === 'pendientes') {
      filter += ` && estado != "completada"`;
    }

    if (search.trim()) {
      const term = search.trim();
      // Búsqueda por productoNombre o por nombre del cliente (usando expand en dos pasos)
      // Simplificamos: buscar por productoNombre
      filter += ` && (productoNombre ~ "${term}" || clienteId ~ "${term}")`;
    }

    const result = await pb.collection(COLLECTIONS.SOLICITUDES).getList(page, perPage, {
      filter,
      sort,
      expand: 'clienteId,productoId'
    });

    const items = result.items.map(s => ({
      id: s.id,
      cliente: s.expand?.clienteId?.nombre || 'Cliente',
      clienteTelefono: s.expand?.clienteId?.telefono || 'Sin teléfono',
      producto: s.productoNombre || s.expand?.productoId?.nombre || 'Producto',
      montoTotal: s.totalPagar || 0,
      enganche: s.enganche || 0,
      estado: s.estado,
      fecha: s.created || s.fechaSolicitud,
      enganchePagado: s.enganchePagado || false
    }));

    return {
      items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error('Error obteniendo ventas paginadas:', error);
    throw error;
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DE VENTAS DEL VENDEDOR (EFICIENTE)
// ============================================================
export async function getEstadisticasVentasVendedor(vendedorId) {
  try {
    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId);
    const comisionPorcentaje = vendedor.comisionPorcentaje || 50;

    // Totales y completadas usando getList con fields para eficiencia
    const totalResult = await pb.collection(COLLECTIONS.SOLICITUDES).getList(1, 1, {
      filter: `vendedorId = "${vendedorId}"`,
      fields: 'id'
    });
    const completadasResult = await pb.collection(COLLECTIONS.SOLICITUDES).getList(1, 1, {
      filter: `vendedorId = "${vendedorId}" && estado = "completada"`,
      fields: 'id'
    });

    // Suma de enganches de completadas (usando getFullList con solo fields)
    const enganches = await pb.collection(COLLECTIONS.SOLICITUDES).getFullList({
      filter: `vendedorId = "${vendedorId}" && estado = "completada"`,
      fields: 'enganche'
    });
    const totalEnganches = enganches.reduce((sum, s) => sum + (s.enganche || 0), 0);
    const comisionTotal = Math.round(totalEnganches * (comisionPorcentaje / 100));

    return {
      totalVentas: totalResult.totalItems,
      completadas: completadasResult.totalItems,
      pendientes: totalResult.totalItems - completadasResult.totalItems,
      totalEnganches,
      comisionTotal,
      comisionPorcentaje
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de ventas:', error);
    return {
      totalVentas: 0,
      completadas: 0,
      pendientes: 0,
      totalEnganches: 0,
      comisionTotal: 0,
      comisionPorcentaje: 0
    };
  }
}

// ============================================================
// OBTENER TODOS LOS VENDEDORES (ADMIN)
// ============================================================
export async function getAllVendedores() {
  try {
    const vendedores = await pb.collection(COLLECTIONS.VENDEDORES).getFullList({
      sort: '-created',
      expand: 'userId,createdBy'
    });

    // Agregar datos del usuario a cada vendedor
    return vendedores.map(v => ({
      ...v,
      nombre: v.expand?.userId?.nombre || 'Sin nombre',
      email: v.expand?.userId?.email || 'Sin email',
      telefono: v.expand?.userId?.telefono || 'Sin teléfono'
    }));
  } catch (error) {
    console.error('Error obteniendo vendedores:', error);
    return [];
  }
}

// ============================================================
// ACTUALIZAR VENDEDOR
// ============================================================
export async function updateVendedor(vendedorId, data) {
  try {
    // Actualizar vendedor
    const updated = await pb.collection(COLLECTIONS.VENDEDORES).update(vendedorId, {
      zona: data.zona,
      comisionPorcentaje: data.comisionPorcentaje,
      activo: data.activo
    });

    // Actualizar usuario relacionado si es necesario
    if (data.nombre || data.email || data.telefono) {
      const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId);
      if (vendedor.userId) {
        const userUpdate = {};
        if (data.nombre) userUpdate.nombre = data.nombre;
        if (data.email) userUpdate.email = data.email;
        if (data.telefono) userUpdate.telefono = data.telefono;

        if (Object.keys(userUpdate).length > 0) {
          await pb.collection(COLLECTIONS.USERS).update(vendedor.userId, userUpdate);
        }
      }
    }

    return updated;
  } catch (error) {
    console.error('Error actualizando vendedor:', error);
    throw error;
  }
}

// ============================================================
// PAGAR COMISIONES A VENDEDOR
// ============================================================
export async function pagarComisiones(vendedorId, monto) {
  try {
    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId);

    await pb.collection(COLLECTIONS.VENDEDORES).update(vendedorId, {
      comisionesPendientes: Math.max(0, (vendedor.comisionesPendientes || 0) - monto)
    });

    await pb.collection(COLLECTIONS.NOTIFICACIONES).create({
      usuarioId: vendedor.userId,
      tipoUsuario: 'vendedor',
      tipo: 'sistema',
      titulo: '💰 Comisión pagada',
      mensaje: `Se ha realizado un pago de comisiones por $${monto.toLocaleString()}.`,
      datos: { monto, fecha: new Date().toISOString() }
    });

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error pagando comisiones:', error);
    return { success: false, data: null, error: error.message };
  }
}

export async function desactivarVendedor(vendedorId) {
  try {
    await pb.collection(COLLECTIONS.VENDEDORES).update(vendedorId, { activo: false });

    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId);
    if (vendedor.userId) {
      await pb.collection(COLLECTIONS.USERS).update(vendedor.userId, { activo: false });
    }

    return { success: true, data: null, error: null };
  } catch (error) {
    console.error('Error desactivando vendedor:', error);
    return { success: false, data: null, error: error.message };
  }
}

// ============================================================
// OBTENER VENDEDOR COMPLETO (CON DATOS DEL USUARIO)
// ============================================================
export async function getVendedorCompleto(vendedorId) {
  try {
    const vendedor = await pb.collection(COLLECTIONS.VENDEDORES).getOne(vendedorId, {
      expand: 'userId'
    });

    const user = vendedor.expand?.userId;

    let fotoUrl = null;
    if (user?.foto) {
      fotoUrl = pb.files.getURL(user, user.foto);
    }

    return {
      id: vendedor.id,
      userId: vendedor.userId,
      codigo: vendedor.codigo,
      qrToken: vendedor.qrToken,
      zona: vendedor.zona,
      comisionPorcentaje: vendedor.comisionPorcentaje,
      activo: vendedor.activo,
      nombre: user?.nombre || 'Sin nombre',
      email: user?.email || 'Sin email',
      telefono: user?.telefono || 'Sin teléfono',
      foto: fotoUrl
    };
  } catch (error) {
    console.error('Error obteniendo vendedor completo:', error);
    return null;
  }
}

// ============================================================
// OBTENER VENDEDORES CON PAGINACIÓN (ADMIN)
// ============================================================
// src/lib/vendedorService.js (fragmento mejorado)

export async function getVendedoresPaginated({
  page = 1,
  perPage = 10,
  search = '',
  estado = 'todos',
  sort = '-created'
} = {}) {
  try {
    let filter = '';

    if (estado === 'activos') {
      filter = 'activo = true';
    } else if (estado === 'inactivos') {
      filter = 'activo = false';
    }

    // ─── BÚSQUEDA MEJORADA ──────────────────────────────────────────────
    if (search.trim()) {
      const term = search.trim();

      // 1. Buscar usuarios que coincidan por nombre, email o teléfono
      const usuariosCoincidentes = await pb.collection(COLLECTIONS.USERS).getFullList({
        filter: `nombre ~ "${term}" || email ~ "${term}" || telefono ~ "${term}"`,
        fields: 'id'
      });
      const userIds = usuariosCoincidentes.map(u => u.id);

      // 2. Construir filtro: código ~ term O userId en (lista de ids)
      let searchFilter = `codigo ~ "${term}"`;
      if (userIds.length > 0) {
        const userIdFilter = userIds.map(id => `userId = "${id}"`).join(' || ');
        searchFilter = `(${searchFilter} || ${userIdFilter})`;
      }

      filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
    }

    const result = await pb.collection(COLLECTIONS.VENDEDORES).getList(page, perPage, {
      filter: filter || undefined,
      sort: sort,
      expand: 'userId'
    });

    const items = result.items.map(v => ({
      ...v,
      nombre: v.expand?.userId?.nombre || 'Sin nombre',
      email: v.expand?.userId?.email || 'Sin email',
      telefono: v.expand?.userId?.telefono || 'Sin teléfono'
    }));

    return {
      items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      page: result.page,
      perPage: result.perPage
    };
  } catch (error) {
    console.error('Error obteniendo vendedores paginados:', error);
    throw error;
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DE VENDEDORES (ADMIN)
// ============================================================
export async function getVendedoresStats() {
  try {
    const totalResult = await pb.collection(COLLECTIONS.VENDEDORES).getList(1, 1, { fields: 'id' });
    const activosResult = await pb.collection(COLLECTIONS.VENDEDORES).getList(1, 1, {
      filter: 'activo = true',
      fields: 'id'
    });
    const inactivosResult = await pb.collection(COLLECTIONS.VENDEDORES).getList(1, 1, {
      filter: 'activo = false',
      fields: 'id'
    });

    // Comisión promedio (necesita todos los registros)
    const comisiones = await pb.collection(COLLECTIONS.VENDEDORES).getFullList({
      fields: 'comisionPorcentaje'
    });
    const comisionPromedio = comisiones.length > 0
      ? Math.round(comisiones.reduce((sum, v) => sum + (v.comisionPorcentaje || 0), 0) / comisiones.length)
      : 0;

    return {
      total: totalResult.totalItems,
      activos: activosResult.totalItems,
      inactivos: inactivosResult.totalItems,
      comisionPromedio
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de vendedores:', error);
    return { total: 0, activos: 0, inactivos: 0, comisionPromedio: 0 };
  }
}
