import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ error: 'userId y email son requeridos' });
  }

  try {
    const pb = await getAdminClient();
    await pb.collection('users').update(userId, { email });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error actualizando email:', error);
    return res.status(500).json({ error: error.message });
  }
}