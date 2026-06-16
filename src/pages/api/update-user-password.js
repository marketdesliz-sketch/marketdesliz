import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId, newPassword } = req.body;
  
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'userId y newPassword son requeridos' });
  }

  try {
    const pb = await getAdminClient();
    
    // Actualizar contraseña con cliente administrador
    await pb.collection('users').update(userId, {
      password: newPassword,
      passwordConfirm: newPassword
    });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    return res.status(500).json({ error: error.message });
  }
}