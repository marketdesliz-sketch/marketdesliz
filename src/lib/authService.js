// src/lib/authService.js
import pb from './pocketbase';

// ============================
// FUNCIONES AUXILIARES
// ============================

export function generarPasswordTemporal() {
  return 'MDZ_' + Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
}

export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
}

// ============================
// BUSCAR USUARIO POR TELÉFONO (ÚNICO)
// ============================
async function findUserByPhone(telefono, excludeUserId = null) {
  try {
    const response = await fetch('/api/get-user-by-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono, excludeUserId })
    });
    const data = await response.json();
    return data.exists ? data.user : null;
  } catch (error) {
    console.error('Error en findUserByPhone:', error);
    return null;
  }
}

// ============================
// AGREGAR PROVIDER A USUARIO
// ============================
export async function addProviderToUser(userId, providerData) {
  try {
    // Para Google, verificar si ya existe un provider con el mismo providerId
    if (providerData.provider === 'google' && providerData.providerId) {
      const existingByProviderId = await pb.collection('user_providers').getFirstListItem(
        `provider = "google" && providerId = "${providerData.providerId}"`
      ).catch(() => null);

      if (existingByProviderId) {
        // Si el provider ya existe pero pertenece a otro usuario, actualizar userId
        if (existingByProviderId.userId !== userId) {
          console.log(`🔄 Moviendo provider Google de ${existingByProviderId.userId} a ${userId}`);
          await pb.collection('user_providers').update(existingByProviderId.id, {
            userId: userId,
            isActive: true
          });
        } else {
          // Ya existe para este usuario, solo activar
          await pb.collection('user_providers').update(existingByProviderId.id, {
            isActive: true
          });
        }
        return existingByProviderId;
      }
    }

    // Verificar si ya existe un provider con el mismo userId y provider
    const existing = await pb.collection('user_providers').getFirstListItem(
      `userId = "${userId}" && provider = "${providerData.provider}"`
    ).catch(() => null);

    if (existing) {
      // Si existe pero está inactivo, activarlo
      if (!existing.isActive) {
        await pb.collection('user_providers').update(existing.id, { isActive: true });
      }
      return existing;
    }

    // Crear nuevo provider con isActive = true
    const newProvider = await pb.collection('user_providers').create({
      userId: userId,
      ...providerData,
      isActive: true,
      linkedAt: new Date().toISOString()
    });

    console.log(`✅ Provider ${providerData.provider} agregado a usuario ${userId}`);
    return newProvider;
  } catch (error) {
    console.error('Error agregando provider:', error);
    throw error;
  }
}

// ============================
// BUSCAR USUARIO POR PROVIDER
// ============================
async function findUserByProvider(provider, value) {
  try {
    // Construir el objeto de consulta según el tipo de provider
    let queryData = {};

    if (provider === 'google') {
      queryData = {
        provider: 'google',
        providerId: value
      };
    } else if (provider === 'phone') {
      queryData = {
        provider: 'phone',
        telefono: value
      };
    } else if (provider === 'credentials') {
      queryData = {
        provider: 'credentials',
        email: value
      };
    } else {
      // Provider no soportado
      return { user: null, providerRecord: null };
    }

    // Llamar al API route que consulta con cliente administrador
    const response = await fetch('/api/get-user-by-provider', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    });

    const data = await response.json();

    if (data.exists) {
      return {
        user: data.user,
        providerRecord: data.providerRecord
      };
    } else {
      return { user: null, providerRecord: null };
    }

  } catch (error) {
    console.error('Error en findUserByProvider:', error);
    return { user: null, providerRecord: null };
  }
}

// ============================
// LOGIN CON GOOGLE
// ============================
export async function loginWithGoogle(credentialResponse) {
  try {
    const decoded = parseJwt(credentialResponse.credential);
    if (!decoded) {
      throw new Error('No se pudo decodificar el token de Google');
    }

    const googleEmail = decoded.email;
    const googleId = decoded.sub;
    const googleName = decoded.name;

    console.log('📧 Email Google:', googleEmail);
    console.log('🆔 Google ID:', googleId);
    console.log('👤 Nombre:', googleName);

    // ✅ 1. Buscar por providerId en user_providers
    let result = await findUserByProvider('google', googleId);

    if (result.user) {
      console.log('✅ Usuario encontrado por Google ID:', result.user.id);
      const user = result.user;

      if (user.telefono && user.telefono !== '') {
        console.log('✅ Usuario con teléfono, login exitoso');
        const tempPassword = generarPasswordTemporal();

        // ✅ USAR API ROUTE en lugar de pb.collection('users').update()
        const updateResponse = await fetch('/api/update-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            newPassword: tempPassword
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'No se pudo actualizar la contraseña');
        }

        const authData = await pb.collection('users').authWithPassword(user.email, tempPassword);
        return {
          success: true,
          user: authData.record,
          needsPhone: false
        };
      }

      console.log('📱 Usuario sin teléfono, solicitar número');
      return {
        success: false,
        needsPhone: true,
        userId: user.id,
        email: googleEmail,
        nombre: googleName || user.nombre
      };
    }

    // ✅ 2. Buscar por email en users
    let existingUser = null;
    try {
      const response = await fetch('/api/get-user-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail })
      });
      const data = await response.json();
      if (data.exists) {
        existingUser = data.user;
        console.log('✅ Usuario encontrado por email:', existingUser.id);
      } else {
        console.log('📧 Email no registrado, continuando con creación...');
        existingUser = null;
      }
    } catch (err) {
      console.error('Error buscando usuario por email:', err);
      existingUser = null;
    }

    // ✅ 3. Si existe usuario por email, vincular Google
    if (existingUser) {
      console.log('🔄 Usuario ya existe por email, vinculando Google...');

      // Verificar si ya tiene el provider Google (evitar duplicados)
      const existingProvider = await findUserByProvider('google', googleId);
      if (!existingProvider.user) {
        await addProviderToUser(existingUser.id, {
          provider: 'google',
          providerId: googleId,
          email: googleEmail
        });
      }

      if (existingUser.telefono && existingUser.telefono !== '') {
        const tempPassword = generarPasswordTemporal();

        // ✅ USAR API ROUTE en lugar de pb.collection('users').update()
        const updateResponse = await fetch('/api/update-user-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: existingUser.id,
            newPassword: tempPassword
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'No se pudo actualizar la contraseña');
        }

        const authData = await pb.collection('users').authWithPassword(existingUser.email, tempPassword);
        return { success: true, user: authData.record, needsPhone: false };
      }

      // CASO SIN TELÉFONO: generar contraseña temporal
      const tempPassword = generarPasswordTemporal();

      // ✅ USAR API ROUTE en lugar de pb.collection('users').update()
      const updateResponse = await fetch('/api/update-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: existingUser.id,
          newPassword: tempPassword
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'No se pudo actualizar la contraseña');
      }

      return {
        success: false,
        needsPhone: true,
        userId: existingUser.id,
        email: googleEmail,
        nombre: googleName || existingUser.nombre,
        tempPassword: tempPassword
      };
    }

    // ✅ 4. Crear NUEVO cliente (no existe por email ni Google)
    console.log('🆕 Creando nuevo cliente con Google...');

    const nombre = googleName || `Usuario_${Date.now()}`;
    const tempPassword = generarPasswordTemporal();

    const generarTokenKey = () => {
      return 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const newUser = await pb.collection('users').create({
      email: googleEmail,
      password: tempPassword,
      passwordConfirm: tempPassword,
      nombre: nombre,
      emailVisibility: false,
      verified: false,
      role: 'cliente',
      activo: true,
      tokenKey: generarTokenKey()
    });

    console.log('✅ Usuario creado:', newUser.id);

    await addProviderToUser(newUser.id, {
      provider: 'google',
      providerId: googleId,
      email: googleEmail
    });

    return {
      success: false,
      needsPhone: true,
      userId: newUser.id,
      email: googleEmail,
      nombre: nombre,
      tempPassword: tempPassword
    };

  } catch (error) {
    console.error('❌ Error en loginWithGoogle:', error);
    throw error;
  }
}

// ============================
// COMPLETAR REGISTRO CON TELÉFONO
// ============================
export async function completeGoogleRegistration(userId, telefono, nombre = null, tempPassword = null) {
  try {
    const cleanPhone = telefono.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw new Error('El teléfono debe tener 10 dígitos');
    }

    // 1. Verificar teléfono único (detecta conflicto con otra cuenta)
    const existingPhoneUser = await findUserByPhone(cleanPhone, userId);
    if (existingPhoneUser && existingPhoneUser.id !== userId) {
      return {
        success: false,
        conflict: true,
        existingUserId: existingPhoneUser.id,
        existingEmail: existingPhoneUser.email,
        existingNombre: existingPhoneUser.nombre,
        phone: cleanPhone
      };
    }

    // 2. Actualizar usuario
    const updateData = { telefono: cleanPhone };
    if (nombre) updateData.nombre = nombre;
    const updatedUser = await pb.collection('users').update(userId, updateData);
    console.log('✅ Usuario actualizado');

    // 3. Agregar provider phone
    await addProviderToUser(userId, {
      provider: 'phone',
      telefono: cleanPhone
    });

    // 4. Autenticar con la contraseña temporal
    if (!tempPassword) {
      throw new Error('No se puede autenticar: falta la contraseña temporal');
    }
    const authData = await pb.collection('users').authWithPassword(updatedUser.email, tempPassword);
    console.log('✅ Usuario autenticado');

    // 5. Crear registro en clients si no existe
    try {
      await pb.collection('clients').getFirstListItem(`userId = "${userId}"`);
      console.log('✅ Clients ya existe');
    } catch (e) {
      await pb.collection('clients').create({
        userId: userId,
        telefono: cleanPhone,
        nombre: updatedUser.nombre,
        nivel: 0,
        productosComprados: 0,
        productosPagados: 0,
        productosEnCurso: 0,
        deudaActual: 0,
        limiteDeuda: 5000,
        estadoKyc: 'pendiente',
        trustScore: 0,
        datosCompletos: false,
        totalGastado: 0,
        diaPago: 'lunes',
        telefonoAlternativo: ''
      });
      console.log('✅ Clients creado');
    }

    return { success: true, user: authData.record };

  } catch (error) {
    console.error('❌ Error en completeGoogleRegistration:', error);
    throw error;
  }
}

// ============================
// LOGIN CON EMAIL/PASSWORD (SOLO VENDEDORES/ADMIN)
// ============================
export async function loginWithEmail(email, password) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);

    if (authData.record.role === 'cliente') {
      throw new Error('Los clientes deben usar Google o SMS para iniciar sesión');
    }

    return authData;
  } catch (error) {
    console.error('Error en login con email:', error);
    throw error;
  }
}

// ============================
// VERIFICAR SI USUARIO TIENE TELÉFONO
// ============================
export async function userHasPhone(userId) {
  try {
    const user = await pb.collection('users').getOne(userId);
    return user.telefono && user.telefono.length === 10;
  } catch (error) {
    console.error('Error verificando teléfono:', error);
    return false;
  }
}

// ============================
// OBTENER PROVIDERS DEL USUARIO
// ============================
export async function getUserProviders(userId) {
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