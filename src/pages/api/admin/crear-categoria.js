// src/pages/api/admin/crear-categoria.js
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

// ─── Helper: slug ────────────────────────────────────────
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Helper: decodificar JWT (sin verificar firma) ───────
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ─── 1. Obtener token ───
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // ─── 2. Decodificar payload del JWT (para saber la colección y exp) ───
  const payload = decodeJWT(token);
  console.log('[crear-categoria] Token payload:', {
    type: payload?.type,
    collectionId: payload?.collectionId,
    exp: payload?.exp,
    expirado: payload?.exp ? payload.exp * 1000 <= Date.now() : 'sin exp',
  });

  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    return res.status(401).json({ error: 'Token expirado. Vuelve a iniciar sesión.' });
  }

  // ─── 3. Intentar autenticar en el orden correcto ───
  const pbUser = new PocketBase(PB_URL);
  pbUser.autoCancellation(false);
  pbUser.authStore.save(token, null);

  // Si el payload dice que es superuser, intentar _superusers primero
  const esSuperuserToken =
    payload?.type === 'superuser' ||
    payload?.collectionName === '_superusers' ||
    payload?.collectionId === '_superusers';

  const coleccionesAProbar = esSuperuserToken
    ? ['_superusers', 'users']
    : ['users', '_superusers'];

  let currentUser = null;
  let isSuperuser = false;
  const errores = [];

  for (const coleccion of coleccionesAProbar) {
    try {
      const authData = await pbUser.collection(coleccion).authRefresh();
      if (coleccion === '_superusers') {
        isSuperuser = true;
        currentUser = {
          id: authData.record.id,
          role: 'admin',
          email: authData.record.email,
        };
      } else {
        currentUser = authData.record;
      }
      console.log(`[crear-categoria] Auth OK contra "${coleccion}"`);
      break;
    } catch (err) {
      const msg = err?.message || String(err);
      errores.push(`${coleccion}: ${msg}`);
      console.log(`[crear-categoria] Auth FAIL contra "${coleccion}":`, msg);
    }
  }

  if (!currentUser) {
    return res.status(401).json({
      error: 'Sesión inválida o expirada',
      detalle: errores.join(' | '),
    });
  }

  if (!isSuperuser && currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }

  // ─── 4. Validar parámetros ───
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

  // ─── 5. Autenticar como superadmin (para bypasear API Rules) ───
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

  // ─── 6. Verificar duplicado ───
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

  // ─── 7. Generar slug único ───
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

  // ─── 8. Crear categoría ───
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