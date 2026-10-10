// src/pages/api/admin/crear-localidad.js
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, municipioId } = req.body || {};

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: 'El nombre de la localidad es obligatorio' });
  }
  if (!municipioId) {
    return res.status(400).json({ error: 'El municipio es obligatorio' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  let isAdmin = false;

  try {
    const pbAuth = new PocketBase(PB_URL);
    pbAuth.authStore.save(token, null);
    await pbAuth.collection('users').authRefresh();
    if (pbAuth.authStore.model?.role === 'admin') isAdmin = true;
  } catch {}

  if (!isAdmin) {
    try {
      const pbSuper = new PocketBase(PB_URL);
      pbSuper.authStore.save(token, null);
      await pbSuper.collection('_superusers').authRefresh();
      isAdmin = true;
    } catch {}
  }

  if (!isAdmin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const pb = new PocketBase(PB_URL);

    try {
      await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    } catch {
      await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    const record = await pb.collection('localidades').create({
      nombre: String(nombre).trim(),
      municipioId,
      activo: true,
    });

    return res.status(200).json({
      id: record.id,
      nombre: record.nombre,
    });
  } catch (error) {
    console.error('Error creando localidad:', error);
    return res.status(500).json({
      error: error?.message || 'No se pudo crear la localidad',
    });
  }
}