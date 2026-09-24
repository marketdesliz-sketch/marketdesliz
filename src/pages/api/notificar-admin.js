// src/pages/api/notificar-admin.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mensaje, tipo = 'info' } = req.body || {};

  if (!mensaje || typeof mensaje !== 'string') {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 [DEV] Telegram no configurado. Mensaje:', mensaje);
    }
    return res.status(200).json({ success: false, reason: 'no_config' });
  }

  const emojis = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    pago: '💰',
    orden: '📋',
    visita: '🏠',
    entrega: '🚚',
    cliente: '👤',
    producto: '📦',
    tanda: '🎯',
    kyc: '🔐',
    nivel: '⭐',
    cobro: '💵',
  };

  const texto = `${emojis[tipo] || emojis.info} ${mensaje}`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: texto,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );

    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    const errorText = await response.text();
    console.error('❌ Telegram error:', errorText);
    return res.status(502).json({ success: false, error: errorText });
  } catch (error) {
    console.error('❌ Error Telegram:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}