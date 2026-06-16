import PocketBase from 'pocketbase';

const pbAdmin = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Autenticación con cuenta de administrador (guarda credenciales en .env.local)
export async function getAdminClient() {
  if (!pbAdmin.authStore.isValid) {
    await pbAdmin.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );
  }
  return pbAdmin;
}