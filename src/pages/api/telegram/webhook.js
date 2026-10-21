// src/pages/api/telegram/webhook.js
import { getAdminClient } from '../../../lib/pbAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { message } = req.body || {};
    if (!message || !message.text) return res.status(200).end();

    const chatId = message.chat.id;
    const text = message.text.trim();

    // El usuario envía: /start 5512345678
    if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const telefono = parts[1]; // El teléfono que viene desde la web

        if (!telefono || !/^\d{10}$/.test(telefono)) {
            await sendTelegramMessage(chatId, '⚠️ Para vincular tu cuenta, haz clic en el botón desde la página web de MarketDesliz.');
            return res.status(200).end();
        }

        try {
            const pb = await getAdminClient();

            // 1. Verificar si el teléfono ya está en uso por otro chat
            let existing = null;
            try {
                existing = await pb.collection('telegram_links').getFirstListItem(`telefono = "${telefono}"`);
            } catch (e) { /* No existe, ok */ }

            if (existing && existing.chatId !== chatId.toString()) {
                await sendTelegramMessage(chatId, '⚠️ Este número de teléfono ya está vinculado a otra cuenta de Telegram.');
                return res.status(200).end();
            }

            // 2. Guardar o actualizar el vínculo
            if (existing) {
                await pb.collection('telegram_links').update(existing.id, { chatId: chatId.toString() });
            } else {
                await pb.collection('telegram_links').create({
                    telefono,
                    chatId: chatId.toString()
                });
            }

            await sendTelegramMessage(chatId, `✅ ¡Número ${telefono} vinculado exitosamente a MarketDesliz!\n\nYa puedes volver a la página web, ingresar tu número y recibirás tu código de acceso aquí.`);
        } catch (error) {
            console.error('Error webhook telegram:', error);
            await sendTelegramMessage(chatId, '❌ Ocurrió un error al vincular tu cuenta. Intenta de nuevo.');
        }
    }

    return res.status(200).json({ ok: true });
}

// Helper para enviar mensajes
async function sendTelegramMessage(chatId, text) {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.error('❌ FALTA TELEGRAM_BOT_TOKEN en las variables de entorno');
        return;
    }

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
}