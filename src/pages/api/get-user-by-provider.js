// pages/api/get-user-by-provider.js
import { getAdminClient } from '../../lib/pbAdmin';

export default async function handler(req, res) {
  // Solo aceptar método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { provider, providerId, telefono, email } = req.body;

  try {
    const pb = await getAdminClient();
    
    // Construir el filtro según el tipo de provider
    let filter = '';
    if (provider === 'google' && providerId) {
      filter = `provider = "google" && providerId = "${providerId}"`;
    } else if (provider === 'phone' && telefono) {
      filter = `provider = "phone" && telefono = "${telefono}"`;
    } else if (provider === 'credentials' && email) {
      filter = `provider = "credentials" && email = "${email}"`;
    } else {
      return res.status(400).json({ error: 'Datos insuficientes o inválidos' });
    }

    // Buscar el registro en user_providers
    const providerRecord = await pb.collection('user_providers').getFirstListItem(filter);
    
    // Obtener el usuario asociado
    const user = await pb.collection('users').getOne(providerRecord.userId);
    
    return res.status(200).json({
      exists: true,
      user: user,
      providerRecord: providerRecord
    });

  } catch (error) {
    // Si no encuentra el registro (404), devolver exists: false
    if (error.status === 404) {
      return res.status(200).json({ exists: false });
    }
    
    console.error('Error en API get-user-by-provider:', error);
    return res.status(500).json({ error: error.message });
  }
}