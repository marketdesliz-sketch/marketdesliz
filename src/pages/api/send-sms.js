// src/pages/api/send-sms.js - Versión solo Telegram
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { telefono, codigo } = req.body;

  if (!telefono || !codigo) {
    return res.status(400).json({ error: 'Teléfono y código son requeridos' });
  }

  console.log('=================================');
  console.log('📱 SOLICITUD DE VERIFICACIÓN');
  console.log('📞 Teléfono del usuario:', telefono);
  console.log('🔐 Código generado:', codigo);
  console.log('=================================');

  let enviado = false;
  let errorMensaje = null;

  // Enviar por Telegram
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errorMensaje = 'TELEGRAM_BOT_TOKEN no configurado';
  } else if (!process.env.TELEGRAM_CHAT_ID) {
    errorMensaje = 'TELEGRAM_CHAT_ID no configurado';
  } else {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      const mensajeTelegram = `🔐 *NUEVO CÓDIGO DE VERIFICACIÓN*\n\n` +
        `📞 *Teléfono:* ${telefono}\n` +
        `🔑 *Código:* ${codigo}\n` +
        `⏰ *Hora:* ${new Date().toLocaleString()}\n\n` +
        `⚠️ Este código expira en 5 minutos.\n` +
        `🌐 *App:* MarketDesliz\n\n` +
        `_Ingresa este código en la aplicación para continuar._`;

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: mensajeTelegram,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        console.log('✅ Código enviado a Telegram correctamente');
        console.log('📨 Mensaje ID:', data.result.message_id);
        enviado = true;
      } else {
        errorMensaje = `Telegram error: ${data.description || 'Error desconocido'}`;
        console.log('❌', errorMensaje);
      }
    } catch (error) {
      errorMensaje = `Error al enviar a Telegram: ${error.message}`;
      console.log('❌', errorMensaje);
    }
  }

  // Respuesta al cliente
  if (enviado) {
    res.status(200).json({ 
      success: true, 
      message: '✅ Código enviado a Telegram del administrador',
      codigo: codigo,
      enviadoPor: 'telegram'
    });
  } else {
    // Fallback: mostrar código en consola
    console.log('💡 CÓDIGO DE VERIFICACIÓN (no se pudo enviar):', codigo);
    res.status(200).json({ 
      success: true, 
      message: '⚠️ Código disponible en consola del servidor',
      codigo: codigo,
      enviadoPor: 'consola',
      error: errorMensaje
    });
  }
}