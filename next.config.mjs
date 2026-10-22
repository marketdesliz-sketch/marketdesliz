/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  // ✅ Solo exporta estático cuando se compila para móvil (Capacitor).
  ...(isStaticExport && { output: 'export' }),

  images: {
    unoptimized: true,
  },

  // ✅ Desactiva la redirección 308 por barra inclinada
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;