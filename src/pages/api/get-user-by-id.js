import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId requerido' });
  }

  try {
    const pb = await getAdminClient();
    const user = await pb.collection('users').getOne(userId);
    return res.status(200).json({ exists: true, user });
  } catch (err) {
    if (err.status === 404) {
      return res.status(200).json({ exists: false });
    }
    console.error('Error en get-user-by-id:', err);
    return res.status(500).json({ error: err.message });
  }
}