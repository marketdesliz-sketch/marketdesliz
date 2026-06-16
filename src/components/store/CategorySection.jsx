// src/components/store/CategorySection.jsx
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';

const formatMoney = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CategorySection({ title, icon: Icon, categoria, productos, seeAllLink }) {
  // Mostrar solo los primeros 5 productos
  const productosMostrar = productos.slice(0, 5);

  if (productosMostrar.length === 0) return null;

  return (
    <section className="py-12 bg-white border-t border-gray-100 first:border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Encabezado de sección */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={24} className="text-[#6C3BFF]" />}
            <h2 className="text-xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          <Link
            href={seeAllLink}
            className="flex items-center gap-1 text-sm text-[#6C3BFF] font-medium hover:gap-2 transition-all"
          >
            Ver todo <ChevronRight size={15} />
          </Link>
        </div>

        {/* Scroll horizontal en mobile, grid en desktop */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="flex gap-4 min-w-max lg:grid lg:grid-cols-5 lg:gap-4 lg:min-w-0">
            {productosMostrar.map((producto) => {
              // ✅ CORREGIDO: producto.imagen ya es la URL completa
              const imageUrl = producto.imagen;
              const enganche = producto.enganche || Math.round((producto.precio || 0) * 0.15);
              const pagoSemanal = producto.pagoSemanal || Math.round((producto.precio || 0) * 0.05);

              return (
                <Link
                  key={producto.id}
                  href={`/productos/${producto.id}`}
                  className="w-[180px] lg:w-full flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  {/* Imagen */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    {/* Fallback cuando no hay imagen */}
                    <div className="w-full h-full flex items-center justify-center" style={{ display: imageUrl ? 'none' : 'flex' }}>
                      <Package size={32} className="text-gray-300" />
                    </div>
                  </div>

                  {/* Info compacta */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-[#6C3BFF] transition">
                      {producto.nombre}
                    </h3>
                    
                    <div className="mt-2 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Paga</span>
                        <span className="text-xs font-bold text-[#6C3BFF]">{formatMoney(pagoSemanal)}<span className="text-[9px]">/sem</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Enganche</span>
                        <span className="text-xs font-semibold text-[#10b981]">{formatMoney(enganche)}</span>
                      </div>
                    </div>

                    {/* Botón rápido */}
                    <div className="mt-2 pt-1.5 border-t border-gray-50">
                      <span className="text-[10px] font-medium text-[#6C3BFF] flex items-center justify-center gap-0.5">
                        Ver producto <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}