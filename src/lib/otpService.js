// src/lib/otpService.js
import { getAdminClient } from './pbAdmin';

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX = 3;

// ─────────────────────────────────────────────────────────
// Generar código de 6 dígitos
// ─────────────────────────────────────────────────────────
export function generarCodigoOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────────────────
// Crear OTP · persiste en sms_codes, aplica rate limit
// ─────────────────────────────────────────────────────────
export async function crearOTP(telefono) {
  const pb = await getAdminClient();

  // 1. Rate limit por teléfono
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const recientes = await pb.collection('sms_codes').getFullList({
    filter: `telefono = "${telefono}" && created > "${windowStart}"`,
    sort: '-created',
  });

  if (recientes.length >= RATE_LIMIT_MAX) {
    const err = new Error('rate_limit');
    err.code = 'rate_limit';
    throw err;
  }

  // 2. Invalidar códigos previos (marcar used=true)
  await Promise.all(
    recientes
      .filter((r) => !r.used)
      .map((r) =>
        pb
          .collection('sms_codes')
          .update(r.id, { used: true })
          .catch(() => null)
      )
  );

  // 3. Crear nuevo código
  const code = generarCodigoOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const record = await pb.collection('sms_codes').create({
    telefono,
    code,
    expiresAt: expiresAt.toISOString(),
    attempts: 0,
    used: false,
  });

  return {
    code,
    recordId: record.id,
    expiresInSeconds: OTP_TTL_MINUTES * 60,
  };
}

// ─────────────────────────────────────────────────────────
// Verificar OTP · valida expiración, intentos, match
// ─────────────────────────────────────────────────────────
export async function verificarOTP(telefono, codeIngresado) {
  const pb = await getAdminClient();

  // 1. Buscar el OTP activo más reciente
  const records = await pb.collection('sms_codes').getFullList({
    filter: `telefono = "${telefono}" && used = false`,
    sort: '-created',
  });

  if (!records.length) {
    return { success: false, error: 'no_code' };
  }

  const otp = records[0];

  // 2. Verificar expiración
  if (new Date(otp.expiresAt) < new Date()) {
    await pb.collection('sms_codes').update(otp.id, { used: true }).catch(() => null);
    return { success: false, error: 'expired' };
  }

  // 3. Verificar intentos máximos
  if (otp.attempts >= MAX_ATTEMPTS) {
    await pb.collection('sms_codes').update(otp.id, { used: true }).catch(() => null);
    return { success: false, error: 'max_attempts' };
  }

  // 4. Verificar código
  if (otp.code !== codeIngresado) {
    await pb
      .collection('sms_codes')
      .update(otp.id, { attempts: otp.attempts + 1 })
      .catch(() => null);
    return {
      success: false,
      error: 'invalid',
      attemptsLeft: MAX_ATTEMPTS - otp.attempts - 1,
    };
  }

  // 5. Marcar como usado
  await pb.collection('sms_codes').update(otp.id, { used: true }).catch(() => null);

  return { success: true };
}