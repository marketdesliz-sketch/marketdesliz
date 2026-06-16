// pages/api/get-user-by-email.js
import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    console.log('🔍 Buscando email:', email);
    const pb = await getAdminClient();
    console.log('✅ Admin autenticado:', !!pb.authStore.token);
    
    const user = await pb.collection('users').getFirstListItem(`email = "${email}"`);
    console.log('👤 Usuario encontrado:', user?.id, user?.email);
    
    return res.status(200).json({ exists: true, user });
  } catch (err) {
    console.error('❌ Error en get-user-by-email:', err.message, err.status);
    // Si no existe, devuelve exists: false
    if (err.status === 404) {
      return res.status(200).json({ exists: false });
    }
    return res.status(500).json({ error: err.message });
  }
}