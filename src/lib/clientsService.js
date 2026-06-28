// src/lib/clientsService.js
import pb from './pocketbase';
import QRCode from 'qrcode';

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Obtener los providers de un usuario
 */
async function getUserProviders(userId) {
  try {
    const providers = await pb.collection('user_providers').getFullList({
      filter: `userId = "${userId}"`
    });
    return providers;
  } catch (error) {
    console.error('Error obteniendo providers:', error);
    return [];
  }
}

/**
 * Verificar si un teléfono está disponible (no usado por otro usuario)
 */
export async function isPhoneAvailable(telefono, excludeUserId = null) {
  try {
    let filter = `telefono = "${telefono}"`;
    if (excludeUserId) {
      filter += ` && id != "${excludeUserId}"`;
    }
    const existing = await pb.collection('users').getFirstListItem(filter);
    return false; // Ya existe
  } catch (error) {
    return true; // Disponible
  }
}

// ============================================================
// OBTENER CLIENTE POR USER ID (COMPLETO)
// ============================================================

/**
 * Obtener datos completos de un cliente (user + clients + providers)
 * @deprecated Usar getClientFullData para más información
 */
export async function getClientByUserId(userId) {
  try {
    const user = await pb.collection('users').getOne(userId);
    let clientData = null;
    try {
      clientData = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
    } catch (e) {
      console.log('No se encontró registro en clients');
    }
    const providers = await getUserProviders(userId);
    const hasGoogleAuth = providers.some(p => p.provider === 'google');
    const hasPhoneAuth = providers.some(p => p.provider === 'phone');
    const hasCredentialsAuth = providers.some(p => p.provider === 'credentials');

    return {
      ...user,
      clientData,
      providers,
      hasGoogleAuth,
      hasPhoneAuth,
      hasCredentialsAuth,
      direccionCompleta: clientData ? [
        clientData.direccionCalle,
        clientData.direccionNumero ? `#${clientData.direccionNumero}` : '',
        clientData.direccionColonia,
        clientData.direccionMunicipio,
        clientData.direccionEstado
      ].filter(Boolean).join(', ') : 'Sin dirección'
    };
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    return null;
  }
}

// ============================================================
// OBTENER DATOS COMPLETOS DEL CLIENTE (VERSIÓN MEJORADA)
// ============================================================

/**
 * Obtener datos completos del cliente (incluyendo dirección, estadísticas y providers)
 * Esta es la versión más completa y debe usarse en lugar de getClientByUserId cuando se necesite toda la información.
 */
export async function getClientFullData(clientId) {
  try {
    const user = await pb.collection("users").getOne(clientId);
    let clientData = null;
    try {
      clientData = await pb.collection("clients").getFirstListItem(`userId = "${clientId}"`);
    } catch (e) {
      console.log("No se encontró registro en clients");
    }
    const providers = await getUserProviders(clientId);

    return {
      ...user,
      clientData,
      providers,
      hasGoogleAuth: providers.some(p => p.provider === 'google'),
      hasPhoneAuth: providers.some(p => p.provider === 'phone'),
      hasCredentialsAuth: providers.some(p => p.provider === 'credentials'),
      direccionCompleta: clientData ? [
        clientData.direccionCalle,
        clientData.direccionNumero ? `#${clientData.direccionNumero}` : '',
        clientData.direccionColonia,
        clientData.direccionMunicipio,
        clientData.direccionEstado,
        clientData.direccionCp ? `CP ${clientData.direccionCp}` : ''
      ].filter(Boolean).join(', ') : 'Sin dirección'
    };
  } catch (error) {
    console.error("Error obteniendo datos completos del cliente:", error);
    return null;
  }
}

// ============================================================
// OBTENER CLIENTE POR ID DE REGISTRO EN CLIENTS
// ============================================================

/**
 * Obtener cliente por ID de registro en clients
 */
export async function getClientById(clientRecordId) {
  try {
    const clientRecord = await pb.collection('clients').getOne(clientRecordId, {
      expand: 'userId'
    });
    if (clientRecord.expand?.userId) {
      const providers = await getUserProviders(clientRecord.expand.userId.id);
      return {
        ...clientRecord,
        providers,
        user: clientRecord.expand.userId
      };
    }
    return clientRecord;
  } catch (error) {
    console.error('Error obteniendo cliente por ID:', error);
    return null;
  }
}

// ============================================================
// OBTENER CLIENTE POR TELÉFONO (CON PROVIDERS)
// ============================================================

export async function getClientByPhone(phone) {
  try {
    const result = await pb.collection("users").getList(1, 1, {
      filter: `telefono = "${phone}"`
    });
    const user = result.items[0] || null;
    if (!user) return null;
    const providers = await getUserProviders(user.id);

    return {
      ...user,
      providers,
      hasGoogleAuth: providers.some(p => p.provider === 'google'),
      hasPhoneAuth: providers.some(p => p.provider === 'phone'),
      hasCredentialsAuth: providers.some(p => p.provider === 'credentials')
    };
  } catch (error) {
    console.error("Error obteniendo cliente por teléfono:", error);
    return null;
  }
}

// ============================================================
// OBTENER CLIENTE POR EMAIL (CON PROVIDERS)
// ============================================================

export async function getClientByEmail(email) {
  try {
    const result = await pb.collection("users").getList(1, 1, {
      filter: `email = "${email}"`
    });
    const user = result.items[0] || null;
    if (!user) return null;
    const providers = await getUserProviders(user.id);

    return {
      ...user,
      providers,
      hasGoogleAuth: providers.some(p => p.provider === 'google'),
      hasPhoneAuth: providers.some(p => p.provider === 'phone'),
      hasCredentialsAuth: providers.some(p => p.provider === 'credentials')
    };
  } catch (error) {
    console.error("Error obteniendo cliente por email:", error);
    return null;
  }
}

// ============================================================
// ACTUALIZAR DATOS DEL CLIENTE (VERSIÓN UNIFICADA)
// ============================================================

/**
 * Actualizar perfil del cliente (con soporte para providers)
 * Esta es la versión unificada que reemplaza a updateClient y updateClientProfile
 */
export async function updateClient(clientId, data) {
  try {
    // Validar teléfono único
    if (data.telefono) {
      const isAvailable = await isPhoneAvailable(data.telefono, clientId);
      if (!isAvailable) {
        throw new Error('Este número de teléfono ya está registrado por otro usuario');
      }
    }

    // Actualizar datos básicos en 'users'
    const userUpdateData = {};
    if (data.nombre !== undefined) userUpdateData.nombre = data.nombre;
    if (data.email !== undefined) userUpdateData.email = data.email;
    if (data.telefono !== undefined) userUpdateData.telefono = data.telefono;

    const updatedUser = await pb.collection("users").update(clientId, userUpdateData);

    // Si se actualizó el teléfono, actualizar también el provider phone
    if (data.telefono) {
      try {
        const phoneProvider = await pb.collection('user_providers').getFirstListItem(
          `userId = "${clientId}" && provider = "phone"`
        ).catch(() => null);

        if (phoneProvider) {
          await pb.collection('user_providers').update(phoneProvider.id, {
            telefono: data.telefono
          });
        } else {
          await pb.collection('user_providers').create({
            userId: clientId,
            provider: 'phone',
            telefono: data.telefono,
            verified: true,
            isPrimary: false
          });
        }
      } catch (providerError) {
        console.warn('Error actualizando provider phone:', providerError.message);
      }
    }

    // Actualizar o crear registro en 'clients'
    try {
      const existingClient = await pb.collection("clients").getFirstListItem(
        `userId = "${clientId}"`
      );
      await pb.collection("clients").update(existingClient.id, {
        direccionCalle: data.direccionCalle ?? existingClient.direccionCalle,
        direccionNumero: data.direccionNumero ?? existingClient.direccionNumero,
        direccionInterior: data.direccionInterior ?? '',
        direccionColonia: data.direccionColonia ?? existingClient.direccionColonia,
        direccionMunicipio: data.direccionMunicipio ?? existingClient.direccionMunicipio,
        direccionCiudad: data.direccionCiudad ?? existingClient.direccionCiudad,
        direccionEstado: data.direccionEstado ?? existingClient.direccionEstado,
        direccionCp: data.direccionCp ?? existingClient.direccionCp,
        direccionReferencias: data.direccionReferencias ?? '',
        diaPago: data.diaPago ?? existingClient.diaPago,
        telefonoAlternativo: data.telefonoAlternativo ?? existingClient.telefonoAlternativo,
        datosCompletos: true
      });
    } catch (e) {
      await pb.collection("clients").create({
        userId: clientId,
        direccionCalle: data.direccionCalle || '',
        direccionNumero: data.direccionNumero || '',
        direccionInterior: data.direccionInterior || '',
        direccionColonia: data.direccionColonia || '',
        direccionMunicipio: data.direccionMunicipio || '',
        direccionCiudad: data.direccionCiudad || '',
        direccionEstado: data.direccionEstado || '',
        direccionCp: data.direccionCp || '',
        direccionReferencias: data.direccionReferencias || '',
        diaPago: data.diaPago || 'lunes',
        telefonoAlternativo: data.telefonoAlternativo || '',
        datosCompletos: true,
        nivel: 0,
        productosComprados: 0,
        productosPagados: 0,
        productosEnCurso: 0,
        deudaActual: 0,
        limiteDeuda: 5000,
        estadoKyc: 'pendiente',
        trustScore: 0,
        totalGastado: 0,
        fechaUltimaCompra: null,
        aceptaTerminos: false,
        documentosCompletos: false
      });
    }

    return updatedUser;
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    throw error;
  }
}

// ============================================================
// AGREGAR PROVIDER A CLIENTE
// ============================================================

/**
 * Agregar un nuevo método de autenticación a un cliente
 */
export async function addClientProvider(userId, providerData) {
  try {
    // Verificar si ya existe este provider
    const existing = await pb.collection('user_providers').getFirstListItem(
      `userId = "${userId}" && provider = "${providerData.provider}"`
    ).catch(() => null);

    if (existing) {
      return existing;
    }

    // Verificar unicidad según el tipo de provider
    if (providerData.provider === 'phone' && providerData.telefono) {
      const phoneInUse = await pb.collection('user_providers').getFirstListItem(
        `provider = "phone" && telefono = "${providerData.telefono}" && userId != "${userId}"`
      ).catch(() => null);

      if (phoneInUse) {
        throw new Error('Este número de teléfono ya está vinculado a otra cuenta');
      }
    }

    if (providerData.provider === 'google' && providerData.providerId) {
      const googleInUse = await pb.collection('user_providers').getFirstListItem(
        `provider = "google" && providerId = "${providerData.providerId}" && userId != "${userId}"`
      ).catch(() => null);

      if (googleInUse) {
        throw new Error('Esta cuenta de Google ya está vinculada a otra cuenta');
      }
    }

    const newProvider = await pb.collection('user_providers').create({
      userId: userId,
      ...providerData,
      linkedAt: new Date().toISOString()
    });

    return newProvider;
  } catch (error) {
    console.error('Error agregando provider a cliente:', error);
    throw error;
  }
}

// ============================================================
// ELIMINAR PROVIDER DE CLIENTE
// ============================================================

/**
 * Eliminar un método de autenticación de un cliente
 */
export async function removeClientProvider(userId, provider) {
  try {
    // No permitir eliminar el último provider
    const providers = await getUserProviders(userId);
    if (providers.length <= 1) {
      throw new Error('No puedes eliminar el único método de acceso a tu cuenta');
    }

    const providerRecord = await pb.collection('user_providers').getFirstListItem(
      `userId = "${userId}" && provider = "${provider}"`
    );

    await pb.collection('user_providers').delete(providerRecord.id);
    return true;
  } catch (error) {
    console.error('Error eliminando provider:', error);
    throw error;
  }
}

// ============================================================
// OBTENER MÉTODOS DE AUTENTICACIÓN DEL CLIENTE
// ============================================================

/**
 * Obtener los métodos de autenticación disponibles para un cliente
 */
export async function getClientAuthMethods(clientId) {
  try {
    const providers = await getUserProviders(clientId);

    return {
      userId: clientId,
      methods: providers.map(p => ({
        id: p.id,
        provider: p.provider,
        providerId: p.providerId || null,
        telefono: p.telefono || null,
        email: p.email || null,
        verified: p.verified,
        isPrimary: p.isPrimary,
        linkedAt: p.linkedAt || p.created
      })),
      hasGoogle: providers.some(p => p.provider === 'google'),
      hasPhone: providers.some(p => p.provider === 'phone'),
      hasCredentials: providers.some(p => p.provider === 'credentials'),
      totalMethods: providers.length
    };
  } catch (error) {
    console.error("Error obteniendo métodos de autenticación:", error);
    return null;
  }
}

// ============================================================
// AGREGAR MÉTODO DE AUTENTICACIÓN AL CLIENTE (ALIAS)
// ============================================================

/**
 * @deprecated Usar addClientProvider en su lugar
 */
export async function addClientAuthMethod(clientId, providerData) {
  console.warn('⚠️ addClientAuthMethod está deprecada. Usa addClientProvider.');
  return addClientProvider(clientId, providerData);
}

// ============================================================
// ELIMINAR MÉTODO DE AUTENTICACIÓN DEL CLIENTE (ALIAS)
// ============================================================

/**
 * @deprecated Usar removeClientProvider en su lugar
 */
export async function removeClientAuthMethod(clientId, provider) {
  console.warn('⚠️ removeClientAuthMethod está deprecada. Usa removeClientProvider.');
  return removeClientProvider(clientId, provider);
}

// ============================================================
// GENERAR QR PARA CLIENTE
// ============================================================

/**
 * Generar QR para cliente
 */
export async function generateClientQR(userId) {
  try {
    const qrText = `MDZ-CLIENT-${userId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrText, {
      width: 256,
      margin: 2,
      color: {
        dark: '#6C3BFF',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generando QR:', error);
    throw error;
  }
}

// ============================================================
// OBTENER CLIENTES POR NIVEL
// ============================================================

export async function getClientsByLevel(nivel) {
  try {
    const clientRecords = await pb.collection('clients').getFullList({
      filter: `nivel >= ${nivel}`,
      expand: 'userId',
      sort: '-nivel'
    });

    const clientsWithProviders = await Promise.all(
      clientRecords.map(async (client) => {
        if (client.expand?.userId) {
          const providers = await getUserProviders(client.expand.userId.id);
          return { ...client, providers };
        }
        return client;
      })
    );

    return clientsWithProviders;
  } catch (error) {
    console.error('Error obteniendo clientes por nivel:', error);
    return [];
  }
}

// ============================================================
// OBTENER CLIENTES CON KYC PENDIENTE
// ============================================================

export async function getClientsWithPendingKYC() {
  try {
    const clientRecords = await pb.collection('clients').getFullList({
      filter: 'estadoKyc = "pendiente"',
      expand: 'userId',
      sort: '-created'
    });

    const clientsWithProviders = await Promise.all(
      clientRecords.map(async (client) => {
        if (client.expand?.userId) {
          const providers = await getUserProviders(client.expand.userId.id);
          return { ...client, providers };
        }
        return client;
      })
    );

    return clientsWithProviders;
  } catch (error) {
    console.error('Error obteniendo clientes KYC:', error);
    return [];
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS DE CLIENTE
// ============================================================

export async function getClientStats(userId) {
  try {
    const user = await pb.collection('users').getOne(userId);
    const providers = await getUserProviders(userId);

    let clientData = null;
    try {
      clientData = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
    } catch (e) { }

    const orders = await pb.collection('orders').getFullList({
      filter: `userId = "${userId}"`
    });

    const completedOrders = orders.filter(o => o.estadoPago === 'completada');
    const activeOrders = orders.filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago');

    return {
      userId: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      role: user.role,
      activo: user.activo,
      providers: providers.map(p => p.provider),
      tieneGoogleAuth: providers.some(p => p.provider === 'google'),
      tienePhoneAuth: providers.some(p => p.provider === 'phone'),
      tieneCredentialsAuth: providers.some(p => p.provider === 'credentials'),
      nivel: clientData?.nivel || 0,
      totalCompras: orders.length,
      completadas: completedOrders.length,
      activas: activeOrders.length,
      deudaActual: clientData?.deudaActual || 0,
      limiteDeuda: clientData?.limiteDeuda || 5000,
      estadoKyc: clientData?.estadoKyc || 'pendiente',
      productosEnCurso: clientData?.productosEnCurso || 0,
      productosPagados: clientData?.productosPagados || 0,
      totalGastado: clientData?.totalGastado || 0,
      fechaRegistro: user.created,
      datosCompletos: clientData?.datosCompletos || false
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del cliente:', error);
    return null;
  }
}

// ============================================================
// OBTENER RESUMEN DE CUENTA DEL CLIENTE
// ============================================================

/**
 * Obtener resumen completo de cuenta del cliente (órdenes, pagos, autenticación)
 */
export async function getClientSummary(clientId) {
  try {
    const [ordenes, pagos, clientFull] = await Promise.all([
      getOrdersByClient(clientId),
      getPaymentsByClient(clientId),
      getClientFullData(clientId)
    ]);

    const ordenesActivas = ordenes.filter(o => o.estadoPago === 'activa' || o.estadoPago === 'pendiente_pago');
    const ordenesCompletadas = ordenes.filter(o => o.estadoPago === 'completada');
    const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'atrasado');
    const deudaTotal = pagosPendientes.reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);

    const providers = clientFull?.providers || [];
    const tieneGoogle = providers.some(p => p.provider === 'google');
    const tienePhone = providers.some(p => p.provider === 'phone');

    return {
      cliente: clientFull,
      totalOrdenes: ordenes.length,
      ordenesActivas: ordenesActivas.length,
      ordenesCompletadas: ordenesCompletadas.length,
      totalPagos: pagos.length,
      pagosPendientes: pagosPendientes.length,
      deudaTotal,
      clientData: clientFull?.clientData,
      authMethods: {
        google: tieneGoogle,
        phone: tienePhone,
        credentials: clientFull?.hasCredentialsAuth || false
      }
    };
  } catch (error) {
    console.error("Error obteniendo resumen del cliente:", error);
    return null;
  }
}

// ============================================================
// ÓRDENES Y PAGOS POR CLIENTE
// ============================================================

/**
 * Obtener órdenes por cliente
 * @deprecated Usar getOrdersByClient de ordersService
 */
export async function getOrdersByClient(clientId) {
  console.warn('⚠️ getOrdersByClient está deprecada en clientsService. Usa ordersService.getOrdersByClient.');
  try {
    const orders = await pb.collection("orders").getFullList({
      filter: `userId = "${clientId}"`,
      sort: "-created",
      expand: "productId"
    });
    return orders;
  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    return [];
  }
}

/**
 * Obtener pagos por cliente
 * @deprecated Usar getPaymentsByClient de paymentsService
 */
export async function getPaymentsByClient(clientId) {
  console.warn('⚠️ getPaymentsByClient está deprecada en clientsService. Usa paymentsService.getPaymentsByClient.');
  try {
    const payments = await pb.collection("payments").getFullList({
      filter: `userId = "${clientId}"`,
      sort: "-fechaVencimiento"
    });
    return payments;
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    return [];
  }
}

// ============================================================
// OBTENER CLIENTES CON PAGINACIÓN Y ESTADÍSTICAS (OPTIMIZADO)
// ============================================================

/**
 * Obtener clientes con paginación, búsqueda, filtros y estadísticas agregadas.
 * Esta es la función que se usa en la página de administración.
 * 
 * @param {Object} params
 * @param {number} params.page - Número de página (default: 1)
 * @param {number} params.perPage - Elementos por página (default: 10)
 * @param {string} params.search - Búsqueda por nombre, teléfono o ID
 * @param {string} params.status - 'todos' | 'activos' | 'bloqueados' | 'morosos' | 'pagos_hoy' | 'kyc_pendiente' | 'kyc_aprobado'
 * @param {string} params.sort - Campo de ordenamiento (ej: '-created', 'nombre')
 * @returns {Promise<Object>} { items, totalItems, totalPages, page, perPage }
 */
export async function getClients({ page = 1, perPage = 10, search = '', status = 'todos', sort = '-created' } = {}) {
  try {
    let userFilter = 'role = "cliente" || role = "user"';

    if (search.trim()) {
      const term = search.trim();
      userFilter += ` && (nombre ~ "${term}" || telefono ~ "${term}" || id ~ "${term}")`;
    }

    if (status === 'activos') {
      userFilter += ' && activo = true';
    } else if (status === 'bloqueados') {
      userFilter += ' && activo = false';
    }

    const usersResult = await pb.collection('users').getList(page, perPage, {
      filter: userFilter,
      sort: sort,
      fields: 'id,nombre,email,telefono,activo,created'
    });

    const userIds = usersResult.items.map(u => u.id);

    if (userIds.length === 0) {
      return {
        items: [],
        totalItems: usersResult.totalItems,
        totalPages: usersResult.totalPages,
        page: usersResult.page,
        perPage: usersResult.perPage
      };
    }

    const userIdFilter = userIds.map(id => `userId = "${id}"`).join(' || ');

    // ── Pagos ──
    const payments = await pb.collection('payments').getFullList({
      filter: userIdFilter,
      fields: 'userId,montoProgramado,monto,estado,fechaVencimiento,fechaPago,numeroSemana'
    });

    // ── Órdenes ──
    const orders = await pb.collection('orders').getFullList({
      filter: userIdFilter,
      fields: 'userId,totalPagar,enganche,pagoSemanal,semanasTotales,saldoRestante,estadoPago'
    });

    // ── KYC ──
    const kycs = await pb.collection('kyc_verifications').getFullList({
      filter: userIdFilter,
      fields: 'userId,estado,fechaEnvio',
      sort: '-fechaEnvio'
    });
    const kycMap = {};
    kycs.forEach(k => {
      if (!kycMap[k.userId]) {
        kycMap[k.userId] = k.estado || 'pendiente';
      }
    });

    // ── Clients ──
    const clients = await pb.collection('clients').getFullList({
      filter: userIdFilter,
      fields: 'userId,tarjetaId,nivel'
    });
    const clientMap = {};
    clients.forEach(c => {
      clientMap[c.userId] = {
        tieneTarjeta: !!c.tarjetaId,
        nivel: c.nivel || 0
      };
    });

    // ── Tandas activas ──
    const tandas = await pb.collection('tanda_members').getFullList({
      filter: userIdFilter + ' && estadoPago = "al_corriente"',
      fields: 'userId'
    });
    const tandaCountMap = {};
    tandas.forEach(t => {
      tandaCountMap[t.userId] = (tandaCountMap[t.userId] || 0) + 1;
    });

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

    const items = usersResult.items.map(user => {
      const userPayments = payments.filter(p => p.userId === user.id);
      const userOrders = orders.filter(o => o.userId === user.id);

      let totalVentas = 0;
      let totalPagado = 0;
      let deudaTotal = 0;
      let pendingPayments = 0;
      let pagosHoy = 0;
      let pagosAtrasados = 0;

      userPayments.forEach(p => {
        const estado = p.estado;
        const monto = p.montoProgramado || p.monto || 0;
        const fechaVencimiento = p.fechaVencimiento ? new Date(p.fechaVencimiento) : null;

        if (estado === 'pagado') {
          totalPagado += monto;
        } else if (estado === 'pendiente' || estado === 'atrasado') {
          deudaTotal += monto;
          if (estado === 'pendiente') {
            pendingPayments++;
            if (fechaVencimiento && fechaVencimiento >= inicioHoy && fechaVencimiento < finHoy) {
              pagosHoy++;
            }
          } else if (estado === 'atrasado') {
            pagosAtrasados++;
          }
        }
      });

      userOrders.forEach(o => {
        totalVentas += o.totalPagar || 0;
      });

      const clientInfo = clientMap[user.id] || { tieneTarjeta: false, nivel: 0 };
      const kycEstado = kycMap[user.id] || 'pendiente';
      const tandasActivas = tandaCountMap[user.id] || 0;

      const isMoroso = deudaTotal > 0;
      const tienePagosHoy = pagosHoy > 0;
      const kycPendiente = kycEstado === 'pendiente';
      const kycAprobado = kycEstado === 'aprobado';

      return {
        ...user,
        totalOrders: userOrders.length,
        totalVentas,
        totalPagado,
        deudaTotal,
        pendingPayments,
        pagosHoy,
        pagosAtrasados,
        tieneTarjeta: clientInfo.tieneTarjeta,
        kycEstado,
        nivel: clientInfo.nivel,
        tandasActivas,
        _moroso: isMoroso,
        _pagosHoy: tienePagosHoy,
        _kycPendiente: kycPendiente,
        _kycAprobado: kycAprobado
      };
    });

    let filteredItems = items;
    if (status === 'morosos') {
      filteredItems = filteredItems.filter(item => item._moroso);
    } else if (status === 'pagos_hoy') {
      filteredItems = filteredItems.filter(item => item._pagosHoy);
    } else if (status === 'kyc_pendiente') {
      filteredItems = filteredItems.filter(item => item._kycPendiente);
    } else if (status === 'kyc_aprobado') {
      filteredItems = filteredItems.filter(item => item._kycAprobado);
    }

    return {
      items: filteredItems,
      totalItems: usersResult.totalItems,
      totalPages: usersResult.totalPages,
      page: usersResult.page,
      perPage: usersResult.perPage
    };
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      perPage: 10
    };
  }
}

// ============================================================
// OBTENER ESTADÍSTICAS GENERALES DE CLIENTES
// ============================================================

/**
 * Obtener estadísticas rápidas (totales, activos, deuda total, etc.)
 * Usa getList con fields: 'id' para contar, y una consulta de pagos para la deuda.
 */
export async function getClientesEstadisticas() {
  try {
    const totalResult = await pb.collection('users').getList(1, 1, {
      filter: 'role = "cliente" || role = "user"',
      fields: 'id'
    });
    const activosResult = await pb.collection('users').getList(1, 1, {
      filter: 'role = "cliente" || role = "user" && activo = true',
      fields: 'id'
    });
    const deudaPagos = await pb.collection('payments').getFullList({
      filter: 'estado = "pendiente" || estado = "atrasado"',
      fields: 'montoProgramado,monto'
    });
    const deudaTotal = deudaPagos.reduce((sum, p) => sum + (p.montoProgramado || p.monto || 0), 0);
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    const pagosHoyResult = await pb.collection('payments').getList(1, 1, {
      filter: `estado = "pendiente" && fechaVencimiento >= "${inicioHoy.toISOString()}" && fechaVencimiento < "${finHoy.toISOString()}"`,
      fields: 'id'
    });
    const tarjetas = await pb.collection('clients').getFullList({
      filter: 'tarjetaId != null && tarjetaId != ""',
      fields: 'userId'
    });

    const deudaClientes = new Set();
    deudaPagos.forEach(p => {
      if (p.userId) deudaClientes.add(p.userId);
    });

    return {
      total: totalResult.totalItems,
      activos: activosResult.totalItems,
      conDeuda: deudaClientes.size,
      pagosHoy: pagosHoyResult.totalItems,
      conTarjeta: tarjetas.length,
      deudaTotal
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de clientes:', error);
    return {
      total: 0,
      activos: 0,
      conDeuda: 0,
      pagosHoy: 0,
      conTarjeta: 0,
      deudaTotal: 0
    };
  }
}

// ============================================================
// COBROS (REGISTRAR PAGO Y NO PAGO)
// ============================================================

/**
 * Registrar cobro de un pago (marcar como pagado y actualizar orden)
 * @param {string} pagoId - ID del pago en la colección 'payments'
 * @param {number} monto - Monto cobrado
 * @param {string} orderId - ID de la orden asociada
 * @returns {Promise<void>}
 */
export async function registrarCobro(pagoId, monto, orderId) {
  try {
    // Actualizar pago
    await pb.collection('payments').update(pagoId, {
      estado: 'pagado',
      montoPagado: monto,
      fechaPago: new Date().toISOString()
    });

    // Actualizar orden si existe
    if (orderId) {
      const orden = await pb.collection('orders').getOne(orderId);
      const nuevoSaldo = Math.max(0, (orden.saldoRestante || 0) - monto);
      await pb.collection('orders').update(orderId, {
        saldoRestante: nuevoSaldo,
        pagosRealizados: (orden.pagosRealizados || 0) + 1,
        estadoPago: nuevoSaldo <= 0 ? 'completada' : orden.estadoPago
      });
    }
  } catch (error) {
    console.error('Error registrando cobro:', error);
    throw error;
  }
}

/**
 * Registrar no pago (marcar como atrasado)
 * @param {string} pagoId - ID del pago en la colección 'payments'
 * @param {string} motivo - Motivo del no pago
 * @returns {Promise<void>}
 */
export async function registrarNoPago(pagoId, motivo) {
  try {
    await pb.collection('payments').update(pagoId, {
      estado: 'atrasado',
      notas: motivo || 'No se presentó'
    });
  } catch (error) {
    console.error('Error registrando no pago:', error);
    throw error;
  }
}
