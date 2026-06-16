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
// OBTENER CLIENTE POR USER ID
// ============================================================

/**
 * Obtener datos completos de un cliente (user + clients + providers)
 */
export async function getClientByUserId(userId) {
  try {
    const user = await pb.collection('users').getOne(userId);
    
    let clientData = null;
    try {
      clientData = await pb.collection('clients').getFirstListItem(
        `userId = "${userId}"`
      );
    } catch (e) {
      console.log('No se encontró registro en clients');
    }
    
    // Obtener providers del usuario
    const providers = await getUserProviders(userId);
    
    // Determinar métodos de autenticación disponibles
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
// OBTENER CLIENTE POR TELÉFONO
// ============================================================

/**
 * Obtener cliente por teléfono
 */
export async function getClientByPhone(phone) {
  try {
    const user = await pb.collection('users').getFirstListItem(
      `telefono = "${phone}"`
    );
    
    let clientData = null;
    try {
      clientData = await pb.collection('clients').getFirstListItem(
        `userId = "${user.id}"`
      );
    } catch (e) {
      console.log('No se encontró registro en clients');
    }
    
    const providers = await getUserProviders(user.id);
    
    return {
      ...user,
      clientData,
      providers
    };
  } catch (error) {
    console.error('Error obteniendo cliente por teléfono:', error);
    return null;
  }
}

// ============================================================
// OBTENER CLIENTE POR EMAIL
// ============================================================

/**
 * Obtener cliente por email
 */
export async function getClientByEmail(email) {
  try {
    const user = await pb.collection('users').getFirstListItem(
      `email = "${email}"`
    );
    
    let clientData = null;
    try {
      clientData = await pb.collection('clients').getFirstListItem(
        `userId = "${user.id}"`
      );
    } catch (e) {
      console.log('No se encontró registro en clients');
    }
    
    const providers = await getUserProviders(user.id);
    
    return {
      ...user,
      clientData,
      providers
    };
  } catch (error) {
    console.error('Error obteniendo cliente por email:', error);
    return null;
  }
}

// ============================================================
// OBTENER TODOS LOS CLIENTES
// ============================================================

/**
 * Obtener todos los clientes
 */
export async function getAllClients() {
  try {
    const users = await pb.collection('users').getFullList({
      filter: 'role = "cliente"',
      sort: '-created'
    });
    
    const clientsWithData = await Promise.all(
      users.map(async (user) => {
        let clientData = null;
        try {
          clientData = await pb.collection('clients').getFirstListItem(
            `userId = "${user.id}"`
          );
        } catch (e) {
          // No tiene registro en clients
        }
        
        const providers = await getUserProviders(user.id);
        const hasGoogleAuth = providers.some(p => p.provider === 'google');
        const hasPhoneAuth = providers.some(p => p.provider === 'phone');
        
        return {
          ...user,
          clientData,
          providers,
          hasGoogleAuth,
          hasPhoneAuth,
          nivel: clientData?.nivel || 0,
          deudaActual: clientData?.deudaActual || 0,
          estadoKyc: clientData?.estadoKyc || 'pendiente',
          productosEnCurso: clientData?.productosEnCurso || 0,
          productosPagados: clientData?.productosPagados || 0
        };
      })
    );
    
    return clientsWithData;
  } catch (error) {
    console.error('Error obteniendo todos los clientes:', error);
    return [];
  }
}

// ============================================================
// ACTUALIZAR DATOS DEL CLIENTE
// ============================================================

/**
 * Actualizar datos del cliente
 */
export async function updateClient(userId, data) {
  try {
    // Validar que el teléfono no esté en uso por otro usuario
    if (data.telefono) {
      const isAvailable = await isPhoneAvailable(data.telefono, userId);
      if (!isAvailable) {
        throw new Error('Este número de teléfono ya está registrado por otro usuario');
      }
    }
    
    // Actualizar datos en users
    const updateUserData = {};
    if (data.nombre !== undefined) updateUserData.nombre = data.nombre;
    if (data.email !== undefined) updateUserData.email = data.email;
    if (data.telefono !== undefined) updateUserData.telefono = data.telefono;
    
    const updatedUser = await pb.collection('users').update(userId, updateUserData);
    
    // Si se actualizó el teléfono, actualizar también el provider phone
    if (data.telefono) {
      try {
        const phoneProvider = await pb.collection('user_providers').getFirstListItem(
          `userId = "${userId}" && provider = "phone"`
        ).catch(() => null);
        
        if (phoneProvider) {
          await pb.collection('user_providers').update(phoneProvider.id, {
            telefono: data.telefono
          });
        } else {
          await pb.collection('user_providers').create({
            userId: userId,
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
    
    // Actualizar o crear en clients
    try {
      const existingClient = await pb.collection('clients').getFirstListItem(
        `userId = "${userId}"`
      );
      await pb.collection('clients').update(existingClient.id, {
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
      await pb.collection('clients').create({
        userId: userId,
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
    console.error('Error actualizando cliente:', error);
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

/**
 * Obtener clientes por nivel
 */
export async function getClientsByLevel(nivel) {
  try {
    const clientRecords = await pb.collection('clients').getFullList({
      filter: `nivel >= ${nivel}`,
      expand: 'userId',
      sort: '-nivel'
    });
    
    // Enriquecer con información de providers
    const clientsWithProviders = await Promise.all(
      clientRecords.map(async (client) => {
        if (client.expand?.userId) {
          const providers = await getUserProviders(client.expand.userId.id);
          return {
            ...client,
            providers
          };
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

/**
 * Obtener clientes con KYC pendiente
 */
export async function getClientsWithPendingKYC() {
  try {
    const clientRecords = await pb.collection('clients').getFullList({
      filter: 'estadoKyc = "pendiente"',
      expand: 'userId',
      sort: '-created'
    });
    
    // Enriquecer con información de providers
    const clientsWithProviders = await Promise.all(
      clientRecords.map(async (client) => {
        if (client.expand?.userId) {
          const providers = await getUserProviders(client.expand.userId.id);
          return {
            ...client,
            providers
          };
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

/**
 * Obtener estadísticas completas de un cliente
 */
export async function getClientStats(userId) {
  try {
    const user = await pb.collection('users').getOne(userId);
    const providers = await getUserProviders(userId);
    
    let clientData = null;
    try {
      clientData = await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
    } catch (e) {}
    
    // Contar órdenes del cliente
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

// src/lib/clientsService.js - Agregar al final del archivo

/**
 * Obtener todos los clientes (función para la página de clientes)
 */
export async function getClients() {
  try {
    const users = await pb.collection('users').getFullList({
      filter: 'role = "cliente"',
      sort: '-created'
    });
    
    const clientsWithData = await Promise.all(
      users.map(async (user) => {
        let clientData = null;
        try {
          clientData = await pb.collection('clients').getFirstListItem(
            `userId = "${user.id}"`
          );
        } catch (e) {
          // No tiene registro en clients
        }
        
        const providers = await getUserProviders(user.id);
        
        return {
          ...user,
          clientData,
          providers,
          nivel: clientData?.nivel || 0,
          deudaActual: clientData?.deudaActual || 0,
          estadoKyc: clientData?.estadoKyc || 'pendiente',
          productosEnCurso: clientData?.productosEnCurso || 0,
          productosPagados: clientData?.productosPagados || 0
        };
      })
    );
    
    return clientsWithData;
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return [];
  }
}