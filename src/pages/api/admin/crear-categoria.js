// src/pages/api/admin/crear-categoria.js
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ─── 1. Verificar que el usuario logueado es admin del sitio ───
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const pbUser = new PocketBase(PB_URL);
  pbUser.authStore.save(token, null);

  let currentUser;
  try {
    // Refrescar el token para validar y obtener el usuario
    const authData = await pbUser.collection('users').authRefresh();
    currentUser = authData.record;
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  if (currentUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }

  // ─── 2. Validar parámetros ───
  const { nombre, vertical = 'products' } = req.body || {};
  const limpio = String(nombre || '').trim();

  if (!limpio) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (limpio.length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  }

  const verticalesValidos = ['products', 'eshe_parallel', 'frutas', 'ganado', 'servicios'];
  if (!verticalesValidos.includes(vertical)) {
    return res.status(400).json({ error: `Vertical inválido: ${vertical}` });
  }

  // ─── 3. Autenticar como superadmin ───
  const pbAdmin = new PocketBase(PB_URL);
  pbAdmin.autoCancellation(false);

  try {
    await pbAdmin
      .collection('_superusers')
      .authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
  } catch (err) {
    console.error('[crear-categoria] Error autenticando superadmin:', err);
    return res.status(500).json({
      error: 'Error de configuración del servidor. Contacta al soporte.',
    });
  }

  // ─── 4. Verificar duplicado ───
  try {
    const duplicado = await pbAdmin.collection('categorias').getFirstListItem(
      `nombre = "${limpio.replace(/"/g, '\\"')}" && vertical = "${vertical}"`
    );
    if (duplicado) {
      return res.status(409).json({
        error: `Ya existe una categoría llamada "${limpio}" en este vertical`,
      });
    }
  } catch {
    // 404 esperado → no existe, seguir
  }

  // ─── 5. Generar slug único ───
  let slug = slugify(limpio) || `cat-${Date.now()}`;
  try {
    const slugExistente = await pbAdmin.collection('categorias').getFirstListItem(
      `slug = "${slug}"`
    );
    if (slugExistente) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
  } catch {
    // 404 → disponible
  }

  // ─── 6. Crear categoría ───
  try {
    const record = await pbAdmin.collection('categorias').create({
      nombre: limpio,
      slug,
      vertical,
      activo: true,
      orden: 0,
    });
    return res.status(200).json({
      id: record.id,
      nombre: record.nombre,
      slug: record.slug,
    });
  } catch (err) {
    console.error('[crear-categoria] Error creando:', err);
    const data = err?.response?.data || err?.data || {};
    const detalles = Object.entries(data)
      .map(([campo, info]) => `${campo}: ${info?.message || info?.code || 'inválido'}`)
      .join(' · ');
    return res.status(400).json({
      error: detalles || err?.message || 'No se pudo crear la categoría',
    });
  }
}