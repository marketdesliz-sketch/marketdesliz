// src/pages/api/admin/crear-municipio.js
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, estadoId } = req.body || {};

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: 'El nombre del municipio es obligatorio' });
  }
  if (!estadoId) {
    return res.status(400).json({ error: 'El estado es obligatorio' });
  }

  // ─── 1. Validar token del usuario logueado ────────────────────────
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  let isAdmin = false;

  // Intenta contra `users` (role admin)
  try {
    const pbAuth = new PocketBase(PB_URL);
    pbAuth.authStore.save(token, null);
    await pbAuth.collection('users').authRefresh();
    if (pbAuth.authStore.model?.role === 'admin') isAdmin = true;
  } catch {
    // no es admin de users
  }

  // Si falla, intenta contra `_superusers`
  if (!isAdmin) {
    try {
      const pbSuper = new PocketBase(PB_URL);
      pbSuper.authStore.save(token, null);
      await pbSuper.collection('_superusers').authRefresh();
      isAdmin = true;
    } catch {
      // tampoco
    }
  }

  if (!isAdmin) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // ─── 2. Autenticar como superadmin y crear ────────────────────────
  try {
    const pb = new PocketBase(PB_URL);

    // Intentar con `_superusers` (PocketBase 0.23+)
    try {
      await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    } catch {
      // Fallback a `admins` (PocketBase <0.23)
      await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    const record = await pb.collection('municipios').create({
      nombre: String(nombre).trim(),
      estadoId,
      activo: true,
    });

    return res.status(200).json({
      id: record.id,
      nombre: record.nombre,
    });
  } catch (error) {
    console.error('Error creando municipio:', error);
    return res.status(500).json({
      error: error?.message || 'No se pudo crear el municipio',
    });
  }
}