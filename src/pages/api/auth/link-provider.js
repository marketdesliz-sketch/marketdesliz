// src/pages/api/auth/link-provider.js
import { getAdminClient } from '../../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, provider, providerId, email, telefono } = req.body;

  if (!userId || !provider) {
    return res.status(400).json({ error: 'Faltan datos requeridos (userId, provider)' });
  }

  try {
    const pb = await getAdminClient();

    // 1. Verificar si el provider ya existe para este usuario
    try {
      const existing = await pb.collection('user_providers').getFirstListItem(
        `userId = "${userId}" && provider = "${provider}"`
      );
      // Si ya existe, lo actualizamos a activo y devolvemos el registro
      const updated = await pb.collection('user_providers').update(existing.id, { isActive: true });
      return res.status(200).json(updated);
    } catch (e) {
      // No existe, procedemos a crearlo
    }

    // 2. Verificar si el providerId (ej: ID de Google) ya está en uso por otro usuario
    if (provider === 'google' && providerId) {
      try {
        const inUse = await pb.collection('user_providers').getFirstListItem(
          `provider = "google" && providerId = "${providerId}"`
        );
        if (inUse.userId !== userId) {
          // Si estaba en otra cuenta, lo movemos a esta (vinculación)
          const updated = await pb.collection('user_providers').update(inUse.id, { 
            userId: userId, 
            isActive: true 
          });
          return res.status(200).json(updated);
        }
      } catch (e) {
        // No está en uso, seguimos
      }
    }

    // 3. Crear el nuevo provider con permisos de Admin
    const record = await pb.collection('user_providers').create({
      userId,
      provider,
      providerId: providerId || '',
      email: email || '',
      telefono: telefono || '',
      isActive: true,
      linkedAt: new Date().toISOString()
    });

    return res.status(200).json(record);
  } catch (error) {
    console.error('❌ Error en link-provider:', error);
    return res.status(500).json({ error: error.message });
  }
}