/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',              // Genera carpeta 'out' con archivos estáticos
  images: {
    unoptimized: true,           // Desactiva optimización de imágenes de Next (necesario para estático)
  },
  trailingSlash: true,           // Opcional, mejora compatibilidad con rutas en Capacitor
  // Si usas variables de entorno, asegúrate de definirlas en .env o en el build
};

export default nextConfig;