// src/lib/accountService.js
import pb from "./pocketbase";

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
 * Verificar si un teléfono está disponible
 */
async function isPhoneAvailable(telefono, excludeUserId = null) {
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
// OBTENER CLIENTE POR TELÉFONO
// ============================================================

/**
 * Obtener cliente por teléfono (con providers)
 */
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
// OBTENER CLIENTE POR EMAIL
// ============================================================

/**
 * Obtener cliente por email (con providers)
 */
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
// OBTENER ÓRDENES POR CLIENTE
// ============================================================

/**
 * Obtener órdenes por cliente
 */
export async function getOrdersByClient(clientId) {
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

// ============================================================
// OBTENER PAGOS POR CLIENTE
// ============================================================

/**
 * Obtener pagos por cliente
 */
export async function getPaymentsByClient(clientId) {
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
// OBTENER DATOS COMPLETOS DEL CLIENTE
// ============================================================

/**
 * Obtener datos completos del cliente (incluyendo dirección, estadísticas y providers)
 */
export async function getClientFullData(clientId) {
  try {
    const user = await pb.collection("users").getOne(clientId);
    
    let clientData = null;
    try {
      clientData = await pb.collection("clients").getFirstListItem(
        `userId = "${clientId}"`
      );
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
// OBTENER CLIENTE POR ID
// ============================================================

/**
 * Obtener cliente por ID (con providers)
 */
export async function getClientById(clientId) {
  try {
    const user = await pb.collection("users").getOne(clientId);
    const providers = await getUserProviders(clientId);
    
    return {
      ...user,
      providers,
      hasGoogleAuth: providers.some(p => p.provider === 'google'),
      hasPhoneAuth: providers.some(p => p.provider === 'phone'),
      hasCredentialsAuth: providers.some(p => p.provider === 'credentials')
    };
  } catch (error) {
    console.error("Error obteniendo cliente por ID:", error);
    return null;
  }
}

// ============================================================
// ACTUALIZAR PERFIL DEL CLIENTE
// ============================================================

/**
 * Actualizar perfil del cliente (con soporte para providers)
 */
export async function updateClientProfile(clientId, data) {
  try {
    // Validar teléfono único si se está actualizando
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
    console.error("Error actualizando perfil del cliente:", error);
    throw error;
  }
}

// ============================================================
// OBTENER RESUMEN DE CUENTA DEL CLIENTE
// ============================================================

/**
 * Obtener resumen de cuenta del cliente (con providers)
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

    // Obtener providers para información de autenticación
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
      // Información de autenticación
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
// AGREGAR MÉTODO DE AUTENTICACIÓN AL CLIENTE
// ============================================================

/**
 * Agregar un nuevo método de autenticación a un cliente
 */
export async function addClientAuthMethod(clientId, providerData) {
  try {
    // Verificar si ya existe este provider
    const existing = await pb.collection('user_providers').getFirstListItem(
      `userId = "${clientId}" && provider = "${providerData.provider}"`
    ).catch(() => null);
    
    if (existing) {
      throw new Error(`Ya tienes el método ${providerData.provider} registrado`);
    }
    
    // Verificar unicidad según el tipo
    if (providerData.provider === 'phone' && providerData.telefono) {
      const phoneInUse = await pb.collection('user_providers').getFirstListItem(
        `provider = "phone" && telefono = "${providerData.telefono}" && userId != "${clientId}"`
      ).catch(() => null);
      
      if (phoneInUse) {
        throw new Error('Este número de teléfono ya está vinculado a otra cuenta');
      }
    }
    
    if (providerData.provider === 'google' && providerData.providerId) {
      const googleInUse = await pb.collection('user_providers').getFirstListItem(
        `provider = "google" && providerId = "${providerData.providerId}" && userId != "${clientId}"`
      ).catch(() => null);
      
      if (googleInUse) {
        throw new Error('Esta cuenta de Google ya está vinculada a otra cuenta');
      }
    }
    
    const newProvider = await pb.collection('user_providers').create({
      userId: clientId,
      ...providerData,
      linkedAt: new Date().toISOString()
    });
    
    return newProvider;
  } catch (error) {
    console.error("Error agregando método de autenticación:", error);
    throw error;
  }
}

// ============================================================
// ELIMINAR MÉTODO DE AUTENTICACIÓN DEL CLIENTE
// ============================================================

/**
 * Eliminar un método de autenticación de un cliente
 */
export async function removeClientAuthMethod(clientId, provider) {
  try {
    // Verificar que no sea el único método
    const providers = await getUserProviders(clientId);
    if (providers.length <= 1) {
      throw new Error('No puedes eliminar el único método de acceso a tu cuenta');
    }
    
    const providerRecord = await pb.collection('user_providers').getFirstListItem(
      `userId = "${clientId}" && provider = "${provider}"`
    );
    
    await pb.collection('user_providers').delete(providerRecord.id);
    return true;
  } catch (error) {
    console.error("Error eliminando método de autenticación:", error);
    throw error;
  }
}
