// src/pages/api/auth/send-otp.js
import { crearOTP } from '../../../lib/otpService';
import { getAdminClient } from '../../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { telefono } = req.body || {};
  if (!telefono || !/^\d{10}$/.test(telefono)) {
    return res.status(400).json({ error: 'Teléfono inválido' });
  }

  try {
    const pb = await getAdminClient();

    // 1. Buscar el chatId del usuario en Telegram
    let telegramLink = null;
    try {
      telegramLink = await pb.collection('telegram_links').getFirstListItem(`telefono = "${telefono}"`);
    } catch (e) {
      return res.status(400).json({
        error: 'TELEGRAM_NOT_LINKED',
        message: 'Para recibir tu código, primero debes vincular tu Telegram.'
      });
    }

    // 2. Generar y guardar OTP en PB
    const { code, expiresInSeconds } = await crearOTP(telefono);

    // 3. Enviar OTP al Telegram del usuario
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const msg = `🔐 *Tu código de acceso a MarketDesliz*\n\nTu código es: \`${code}\`\n\nExpira en 5 minutos. No compartas este código.`;

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramLink.chatId,
        text: msg,
        parse_mode: 'Markdown'
      })
    });

    if (!tgRes.ok) {
      const errorData = await tgRes.json();
      console.error('Error enviando a Telegram:', errorData);
      return res.status(500).json({ error: 'Error al enviar el mensaje por Telegram' });
    }

    // ✅ CORREGIDO: expiresIn en lugar de expiresSeconds
    return res.status(200).json({ success: true, expiresIn: expiresInSeconds });
    
  } catch (error) {
    if (error.code === 'rate_limit') {
      return res.status(429).json({ error: 'Demasiados intentos. Espera 10 minutos.' });
    }
    console.error('❌ Error en send-otp:', error);
    return res.status(500).json({ error: 'Error al enviar el código' });
  }
}