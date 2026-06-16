// pages/api/update-user-phone.js
import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId, phone } = req.body;
  if (!userId || !phone) {
    return res.status(400).json({ error: 'userId y phone son requeridos' });
  }

  try {
    const pb = await getAdminClient();
    
    // Actualizar teléfono con cliente administrador
    await pb.collection('users').update(userId, { telefono: phone });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error actualizando teléfono:', error);
    return res.status(500).json({ error: error.message });
  }
}