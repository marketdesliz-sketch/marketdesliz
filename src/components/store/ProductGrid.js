// src/components/store/ProductGrid.js
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import FavoriteButton from '../FavoriteButton';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getImageUrl = (product, pb) => {
  if (!product.imagen) return null;
  if (Array.isArray(product.imagen) && product.imagen.length > 0) {
    return pb.files.getURL(product, product.imagen[0]);
  }
  if (typeof product.imagen === 'string') {
    return pb.files.getURL(product, product.imagen);
  }
  return null;
};

export default function ProductGrid({ products = [], pb }) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Package size={28} className="text-gray-300" />
        </div>
        <p className="text-gray-500 text-sm font-medium">No hay productos disponibles</p>
        <p className="text-gray-400 text-xs mt-1">Vuelve pronto, estamos actualizando el catálogo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        const imageUrl = getImageUrl(product, pb);
        const enganche = product.enganche || Math.round((product.precio || 0) * 0.15);
        const pagoSemanal = product.pagoSemanal || Math.round((product.precio || 0) * 0.05);

        return (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            {/* ── Imagen ──────────────────────────────────────── */}
            <div className="relative">
              <Link href={`/productos/${product.id}`}>
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback visible cuando imagen falla o no existe */}
                  <div
                    className="w-full h-full items-center justify-center"
                    style={{ display: imageUrl ? 'none' : 'flex' }}
                  >
                    <Package size={40} className="text-gray-300" />
                  </div>
                </div>
              </Link>

              {/* Botón favorito — fondo blanco siempre definido */}
              <div className="absolute top-2.5 right-2.5">
                <FavoriteButton productId={product.id} productName={product.nombre} />
              </div>
            </div>

            {/* ── Info ────────────────────────────────────────── */}
            <div className="p-4">
              {/* Badge categoría — debajo de la imagen, nunca encima */}
              {product.categoria && (
                <span className="inline-block text-[10px] font-semibold text-[#6C3BFF] bg-[#6C3BFF]/8 px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                  {product.categoria}
                </span>
              )}

              <Link href={`/productos/${product.id}`}>
                <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2 hover:text-[#6C3BFF] transition-colors">
                  {product.nombre}
                </h3>
              </Link>

              {/* Bloque de precios — diferenciador clave de MarketDesliz */}
              <div className="mt-3 space-y-1 border-t border-gray-50 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Desde</span>
                  <span className="text-sm font-bold text-gray-900">{formatMoney(product.precio)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Enganche</span>
                  <span className="text-sm font-semibold text-[#6C3BFF]">{formatMoney(enganche)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Paga</span>
                  <span className="text-sm font-bold text-[#10b981]">{formatMoney(pagoSemanal)}/sem</span>
                </div>
              </div>

              {/* CTA — siempre visible, siempre igual */}
              <Link
                href={`/productos/${product.id}`}
                className="mt-4 flex items-center justify-center gap-1.5 w-full bg-[#6C3BFF] hover:bg-[#5b2ee6] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Ver producto <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
