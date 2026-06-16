// pages/api/delete-user.js
import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId es requerido' });
  }

  try {
    const pb = await getAdminClient();
    
    // Eliminar usuario con cliente administrador
    await pb.collection('users').delete(userId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return res.status(500).json({ error: error.message });
  }
}