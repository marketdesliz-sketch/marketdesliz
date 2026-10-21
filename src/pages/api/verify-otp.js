// src/pages/api/verify-otp.js
import { verificarOTP } from '../../lib/otpService';
import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telefono, code } = req.body || {};

  if (!telefono || !code) {
    return res.status(400).json({ error: 'Faltan datos requeridos (teléfono o código)' });
  }

  if (!/^\d{10}$/.test(telefono)) {
    return res.status(400).json({ error: 'Teléfono inválido' });
  }

  try {
    // 1. Verificar el código OTP
    const result = await verificarOTP(telefono, code);

    if (!result.success) {
      const errorMap = {
        no_code: 'No hay un código activo. Solicita uno nuevo.',
        expired: 'El código expiró. Solicita uno nuevo.',
        max_attempts: 'Demasiados intentos. Solicita uno nuevo.',
        invalid: 'Código incorrecto. Verifica e intenta de nuevo.',
      };
      return res.status(400).json({ error: errorMap[result.error] || 'Error al verificar el código' });
    }

    // 2. Conectar como Administrador para gestionar usuarios
    const pb = await getAdminClient();

    // 3. Buscar si el usuario ya existe por teléfono
    let existingUser = null;
    try {
      existingUser = await pb.collection('users').getFirstListItem(`telefono = "${telefono}"`);
    } catch (e) {
      // El usuario no existe, se creará abajo
    }

    let userId = null;
    let isNewUser = false;
    let userRecord = null;

    // 4. Lógica de Negocio: Crear o recuperar la cuenta unificada
    if (existingUser) {
      // Usuario existente: Solo necesitamos su ID
      userId = existingUser.id;
      userRecord = existingUser;
    } else {
      // Usuario NUEVO: Creamos su cuenta maestra
      const tempEmail = `user_${telefono}@marketdesliz.com`;
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'; 
      
      userRecord = await pb.collection('users').create({
        email: tempEmail,
        password: tempPassword,
        passwordConfirm: tempPassword,
        nombre: `Usuario ${telefono.slice(-4)}`,
        telefono: telefono,
        role: 'cliente',
        activo: true,
        verified: false,
      });
      
      userId = userRecord.id;
      isNewUser = true;

      // 4.1 Crear el registro en 'clients' (con términos y condiciones aceptados)
      try {
        await pb.collection('clients').create({
          userId: userId,
          telefono: telefono,
          nombre: userRecord.nombre,
          nivel: 0,
          estadoKyc: 'pendiente',
          aceptaTerminos: true, 
          fechaAceptaTerminos: new Date().toISOString()
        });
      } catch (e) {
        console.error('Error creando client:', e.message);
      }

      // 4.2 Crear el provider de tipo 'phone'
      try {
        await pb.collection('user_providers').create({
          userId: userId,
          provider: 'phone',
          telefono: telefono,
          isActive: true
        });
      } catch (e) {
        console.error('Error creando provider:', e.message);
      }
    }

    // 5. LA MAGIA (Impersonate): Generar token de sesión sin tocar la contraseña
    // PocketBase permite a un admin generar una sesión para cualquier usuario.
    // Esto es exactamente lo que hacen Google o Meta con los Magic Links / OTPs.
    const impersonateAuth = await pb.collection('users').impersonate(userId, 3600); 
    // 3600 = duración del token en segundos (1 hora)

    if (!impersonateAuth || !impersonateAuth.token) {
      throw new Error('No se pudo generar el token de acceso');
    }

    // 6. Devolver el token al frontend
    return res.status(200).json({
      success: true,
      token: impersonateAuth.token,
      record: impersonateAuth.record,
      isNewUser,
    });

  } catch (error) {
    console.error('❌ Error en verify-otp:', error);
    return res.status(500).json({ error: error.message || 'Error interno al procesar tu cuenta' });
  }
}