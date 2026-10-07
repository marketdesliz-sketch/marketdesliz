/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  // ✅ Solo exporta estático cuando se compila para móvil (Capacitor).
  // En Vercel, `output` queda undefined y los API Routes funcionan.
  ...(isStaticExport && { output: 'export' }),

  images: {
    unoptimized: true,           // Necesario para estático (y no molesta en SSR)
  },

  // trailingSlash: true,        // Opcional
};

export default nextConfig;