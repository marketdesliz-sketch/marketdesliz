// src/components/layout/Sidebar.jsx
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, X } from 'lucide-react';
import { getCategoriasParaSidebar, generarSlug } from '../../config/categorias';

export default function Sidebar() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [openCategories, setOpenCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productCounts, setProductCounts] = useState({});

  // ============================================================
  // 1. CARGAR DATOS Y ESTADO PERSISTENTE
  // ============================================================
  useEffect(() => {
    const loadData = () => {
      // Obtener categorías (síncrono)
      const data = getCategoriasParaSidebar();
      setCategories(data);
      setFilteredCategories(data);

      // Cargar preferencias de categorías abiertas desde localStorage
      const saved = localStorage.getItem('sidebar_open_categories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setOpenCategories(parsed);
        } catch {
          initializeOpenCategories(data);
        }
      } else {
        initializeOpenCategories(data);
      }

      // Cargar contadores de productos (simulados, reemplazar con API)
      const counts = {};
      data.forEach(cat => {
        cat.subcategories.forEach(sub => {
          sub.items.forEach(item => {
            const slug = generarSlug(item);
            // Simular conteo aleatorio (en producción vendría de una API)
            counts[slug] = Math.floor(Math.random() * 30) + 2;
          });
        });
      });
      setProductCounts(counts);

      setIsLoading(false);
    };

    loadData();
  }, []);

  // ============================================================
  // 2. INICIALIZAR CATEGORÍAS ABIERTAS
  // ============================================================
  const initializeOpenCategories = (data) => {
    const initial = {};
    data.forEach((cat, idx) => {
      // Abrir solo la primera categoría por defecto
      initial[cat.name] = idx === 0;
    });
    setOpenCategories(initial);
  };

  // ============================================================
  // 3. PERSISTIR ESTADO EN LOCALSTORAGE
  // ============================================================
  useEffect(() => {
    if (Object.keys(openCategories).length > 0) {
      localStorage.setItem('sidebar_open_categories', JSON.stringify(openCategories));
    }
  }, [openCategories]);

  // ============================================================
  // 4. BÚSQUEDA EN TIEMPO REAL
  // ============================================================
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = categories
      .map(cat => {
        const subcats = cat.subcategories
          .map(sub => ({
            ...sub,
            items: sub.items.filter(item =>
              item.toLowerCase().includes(term) ||
              sub.name.toLowerCase().includes(term) ||
              cat.name.toLowerCase().includes(term)
            )
          }))
          .filter(sub => sub.items.length > 0);
        return { ...cat, subcategories: subcats };
      })
      .filter(cat => cat.subcategories.length > 0);

    setFilteredCategories(filtered);

    // Auto-abrir categorías que tienen resultados
    if (searchTerm.trim()) {
      const newOpen = {};
      filtered.forEach(cat => {
        newOpen[cat.name] = true;
      });
      setOpenCategories(prev => ({ ...prev, ...newOpen }));
    }
  }, [searchTerm, categories]);

  // ============================================================
  // 5. FUNCIONES DE UTILIDAD
  // ============================================================
  const toggleCategory = (name) => {
    setOpenCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const clearSearch = () => setSearchTerm('');

  // Memoizar slugs para evitar recálculos en cada render
  const itemsWithSlugs = useMemo(() => {
    const result = {};
    filteredCategories.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.items.forEach(item => {
          result[item] = generarSlug(item);
        });
      });
    });
    return result;
  }, [filteredCategories]);

  // Contar total de productos (para el badge)
  const totalProducts = useMemo(() => {
    return categories.reduce(
      (acc, cat) => acc + cat.subcategories.reduce((sum, sub) => sum + sub.items.length, 0),
      0
    );
  }, [categories]);

  // ============================================================
  // 6. ESTADOS DE CARGA
  // ============================================================
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          INICIO
        </h3>
        <p className="text-center text-gray-500 text-sm py-4">
          No hay categorías disponibles
        </p>
      </div>
    );
  }

  // ============================================================
  // 7. RENDERIZADO PRINCIPAL
  // ============================================================
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Encabezado con total de productos */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">INICIO</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {totalProducts} productos
        </span>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar en categorías..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar en categorías"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {searchTerm && (
        <div className="mb-3 text-sm text-gray-500">
          {filteredCategories.reduce(
            (acc, cat) => acc + cat.subcategories.reduce((sum, sub) => sum + sub.items.length, 0),
            0
          )}{' '}
          resultados encontrados
        </div>
      )}

      {/* Lista de categorías */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.name} className="border-b border-gray-100 pb-3 last:border-b-0">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center justify-between w-full text-left font-bold text-gray-800 hover:text-purple-600 transition-colors group"
              aria-expanded={openCategories[category.name]}
            >
              <span>{category.name}</span>
              <span className="flex items-center gap-2 text-gray-400 text-sm">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {category.subcategories.reduce((acc, sub) => acc + sub.items.length, 0)}
                </span>
                <span className="text-gray-400 text-sm">
                  {openCategories[category.name] ? '−' : '+'}
                </span>
              </span>
            </button>

            {openCategories[category.name] && (
              <div className="mt-2 ml-3 space-y-3">
                {category.subcategories.map((sub) => (
                  <div key={sub.name} className="space-y-1">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      {sub.name}
                    </h4>
                    <ul className="space-y-1 ml-2">
                      {sub.items.map((item) => {
                        const slug = itemsWithSlugs[item] || generarSlug(item);
                        const isActive = router.asPath.includes(slug);
                        const count = productCounts[slug] || 0;
                        return (
                          <li key={item}>
                            <Link
                              href={`/productos/categoria/${slug}`}
                              className={`flex items-center justify-between py-1 text-sm transition-colors group ${
                                isActive
                                  ? 'text-purple-600 font-medium'
                                  : 'text-gray-600 hover:text-purple-600'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-1 h-1 rounded-full transition-all ${
                                    isActive
                                      ? 'bg-purple-600'
                                      : 'bg-gray-300 group-hover:bg-purple-400'
                                  }`}
                                />
                                {item}
                              </span>
                              {count > 0 && (
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                                  {count}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mensaje de sin resultados */}
      {searchTerm && filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            No se encontraron resultados para "{searchTerm}"
          </p>
        </div>
      )}

      {/* Enlaces adicionales */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link
          href="/productos"
          className="block py-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
        >
          Ver todos los productos
        </Link>
        <Link
          href="/ofertas"
          className="block py-2 text-sm text-orange-600 hover:text-orange-700 transition-colors font-medium"
        >
          Ofertas especiales
        </Link>
      </div>
    </div>
  );
}