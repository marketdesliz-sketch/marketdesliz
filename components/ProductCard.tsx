"use client";

import Link from 'next/link';

interface ProductCardProps {
  id: string | number;  // ← NUEVO: identificador único para el producto
  name: string;
  weekly?: string;
  price: string;
  imageSrc?: string;
  imageAlt?: string;
  badge?: string;
  badgeStyle?: string;
  imageHeight?: string;
  showQuickActions?: boolean;
}

export function ProductCard({
  id,  // ← NUEVO: recibimos el id
  name,
  weekly,
  price,
  imageSrc = "/images/placeholder.jpg",
  imageAlt = "Producto",
  badge,
  badgeStyle = "bg-[#5B2BE0]",
  imageHeight = "h-44",
  showQuickActions = false,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      <div className={`relative ${imageHeight} bg-gray-100 flex items-center justify-center`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl text-gray-300">📦</span>
        )}
        {badge && (
          <span className={`absolute top-2.5 left-2.5 ${badgeStyle} text-white text-[10px] px-2 py-0.5 rounded font-medium`}>
            {badge}
          </span>
        )}
        <button className="absolute top-2.5 right-2.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
          <span className="text-gray-400 text-sm">♡</span>
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm">{name}</h3>
        <p className="text-gray-900 font-bold text-base mt-1">{price}</p>
        {/* Botón "Ver detalles" con Link */}
        <Link href={`/producto/${id}`} className="w-full block">
          <button className="w-full mt-2 py-1.5 border border-[#5B2BE0] text-[#5B2BE0] rounded-lg text-xs font-semibold hover:bg-[#F3EEFF] transition-colors">
            Ver detalles
          </button>
        </Link>
      </div>
    </div>
  );
}