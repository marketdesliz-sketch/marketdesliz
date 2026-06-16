import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { telefono, excludeUserId } = req.body;
  if (!telefono) {
    return res.status(400).json({ error: 'Teléfono requerido' });
  }

  try {
    const pb = await getAdminClient();
    let filter = `telefono = "${telefono}"`;
    if (excludeUserId) {
      filter += ` && id != "${excludeUserId}"`;
    }
    const user = await pb.collection('users').getFirstListItem(filter);
    return res.status(200).json({ exists: true, user });
  } catch (err) {
    if (err.status === 404) {
      return res.status(200).json({ exists: false });
    }
    console.error('Error en get-user-by-phone:', err);
    return res.status(500).json({ error: err.message });
  }
}