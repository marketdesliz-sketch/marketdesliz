// src/pages/api/verify-otp.js
import { verificarOTP } from '../../lib/otpService';
import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telefono, code, newPassword } = req.body || {};

  if (!telefono || !code || !newPassword) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  if (!/^\d{10}$/.test(telefono)) {
    return res.status(400).json({ error: 'Teléfono inválido' });
  }

  try {
    // 1. Verificar OTP contra PocketBase
    const result = await verificarOTP(telefono, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // 2. Encontrar o crear usuario
    const pb = await getAdminClient();
    const userResult = await findOrCreateUser(pb, telefono, newPassword);

    return res.status(200).json({
      success: true,
      email: userResult.email,
      userId: userResult.id,
      isNewUser: userResult.isNew,
    });
  } catch (error) {
    console.error('❌ Error en verify-otp:', error);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
}

// ─────────────────────────────────────────────────────────
// Encontrar o crear usuario · asegura email + password válidos
// ─────────────────────────────────────────────────────────
async function findOrCreateUser(pb, telefono, newPassword) {
  const tempEmail = `user_${telefono}@marketdesliz.com`;

  // Buscar existente
  let existing = null;
  try {
    existing = await pb
      .collection('users')
      .getFirstListItem(`telefono = "${telefono}"`);
  } catch (e) {
    // No existe
  }

  if (existing) {
    // Asegurar que tenga email (necesario para authWithPassword)
    const email = existing.email || tempEmail;

    await pb.collection('users').update(existing.id, {
      email,
      password: newPassword,
      passwordConfirm: newPassword,
    });

    return { ...existing, email, isNew: false };
  }

  // Crear nuevo usuario
  const tokenKey =
    'pk_' +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  let newUser;
  try {
    newUser = await pb.collection('users').create({
      email: tempEmail,
      password: newPassword,
      passwordConfirm: newPassword,
      emailVisibility: false,
      verified: false,
      role: 'cliente',
      nombre: `Usuario ${telefono.slice(-4)}`,
      activo: true,
      telefono,
      tokenKey,
    });
  } catch (err) {
    // Race condition: alguien lo creó entre el find y el create
    if (err.message?.includes('validation_not_unique')) {
      const existing = await pb
        .collection('users')
        .getFirstListItem(`telefono = "${telefono}"`);
      await pb.collection('users').update(existing.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      });
      return { ...existing, isNew: false };
    }
    throw err;
  }

  // Crear client
  try {
    await pb.collection('clients').create({
      userId: newUser.id,
      telefono,
      nombre: newUser.nombre,
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
      telefonoAlternativo: '',
    });
  } catch (e) {
    console.error('⚠️ Error creando client:', e.message);
  }

  // Crear provider phone
  try {
    await pb.collection('user_providers').create({
      userId: newUser.id,
      provider: 'phone',
      telefono,
      isActive: true,
    });
  } catch (e) {
    console.error('⚠️ Error creando provider:', e.message);
  }

  return { ...newUser, email: tempEmail, isNew: true };
}