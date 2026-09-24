// src/pages/api/send-sms.js
import { crearOTP } from '../../lib/otpService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telefono } = req.body || {};

  if (!telefono || !/^\d{10}$/.test(telefono)) {
    return res.status(400).json({ error: 'Teléfono inválido' });
  }

  try {
    const { code, expiresInSeconds } = await crearOTP(telefono);
    const telegramEnviado = await notificarTelegram(telefono, code);

    return res.status(200).json({
      success: true,
      expiresIn: expiresInSeconds,
      canal: telegramEnviado ? 'telegram' : 'consola',
    });
  } catch (error) {
    if (error.code === 'rate_limit') {
      return res.status(429).json({
        error: 'Demasiados intentos. Espera 10 minutos antes de reintentar.',
      });
    }
    console.error('❌ Error en send-sms:', error);
    return res.status(500).json({ error: 'Error al enviar el código' });
  }
}

async function notificarTelegram(telefono, codigo) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('💡 CÓDIGO OTP (Telegram no configurado):', telefono, codigo);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            `🔐 *NUEVO CÓDIGO OTP*\n\n` +
            `📞 Teléfono: \`${telefono}\`\n` +
            `🔑 Código: \`${codigo}\`\n` +
            `⏰ Expira en 5 min\n` +
            `🌐 App: MarketDesliz`,
          parse_mode: 'Markdown',
        }),
      }
    );
    const data = await response.json();

    if (response.ok && data.ok) {
      console.log('✅ OTP enviado a Telegram');
      return true;
    }

    console.warn('⚠️ Telegram error:', data.description);
    console.log('💡 CÓDIGO OTP (fallback consola):', telefono, codigo);
    return false;
  } catch (err) {
    console.error('❌ Error Telegram:', err.message);
    console.log('💡 CÓDIGO OTP (fallback consola):', telefono, codigo);
    return false;
  }
}