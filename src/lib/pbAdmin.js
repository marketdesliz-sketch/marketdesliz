// src/lib/pbAdmin.js
import PocketBase from 'pocketbase';

const pbAdmin = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
pbAdmin.autoCancellation(false);

let authPromise = null;

export async function getAdminClient() {
  if (pbAdmin.authStore.isValid) return pbAdmin;

  // Evitar múltiples auths concurrentes en la misma request
  if (authPromise) {
    await authPromise;
    return pbAdmin;
  }

  authPromise = (async () => {
    try {
      // SDK 0.22+ usa _superusers en lugar de pb.admins
      await pbAdmin
        .collection('_superusers')
        .authWithPassword(
          process.env.POCKETBASE_ADMIN_EMAIL,
          process.env.POCKETBASE_ADMIN_PASSWORD
        );
    } finally {
      authPromise = null;
    }
  })();

  await authPromise;
  return pbAdmin;
}