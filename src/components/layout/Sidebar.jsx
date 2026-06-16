src/components/layout/Sidebar.jsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Sidebar() {
  const router = useRouter();
  const [openCategories, setOpenCategories] = useState({
    'ELECTRODOMÉSTICOS': true,
    'HOGAR': false,
    'CUIDADO PERSONAL': false,
    'COCINA': false
  });

  const toggleCategory = (categoryName) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const categories = [
    {
      name: 'ELECTRODOMÉSTICOS',
      subcategories: [
        {
          name: 'LÍNEA BLANCA',
          items: ['Refrigeradores', 'Lavadoras', 'Secadoras', 'Microondas', 'Estufas', 'Hornos']
        },
        {
          name: 'FERRETERÍA',
          items: ['Herramientas', 'Iluminación', 'Lonas', 'Organización Y Almacenamiento', 'Tornillería Y Fijaciones', 'Seguridad Y Protección']
        }
      ]
    },
    {
      name: 'HOGAR',
      subcategories: [
        {
          name: 'MASCOTAS',
          items: ['Casas De Plástico', 'Higiene Y Cuidado', 'Juguetes Y Accesorios', 'Ropa']
        },
        {
          name: 'PATIO Y JARDÍN',
          items: ['Macetas', 'Riego', 'Sombrillas Y Paraguas']
        },
        {
          name: 'OFICINA Y PAPELERÍA',
          items: ['Material Escolar', 'Suministros De Oficina', 'Mobiliario']
        }
      ]
    },
    {
      name: 'CUIDADO PERSONAL',
      subcategories: [
        {
          name: 'LIMPIEZA',
          items: ['Botes Y Cestos', 'Cubetas', 'Escobas, Trapeadores, Pinzas Y Más', 'Insumos De Limpieza']
        },
        {
          name: 'BELLEZA Y CUIDADO PERSONAL',
          items: ['Cuidado De La Piel', 'Maquillaje', 'Cuidado Capilar', 'Fragancias']
        },
        {
          name: 'BEBÉS Y NIÑOS',
          items: ['Cuidado Del Bebé', 'Juguetes Infantiles', 'Ropa Para Bebés']
        }
      ]
    },
    {
      name: 'COCINA',
      subcategories: [
        {
          name: 'MUEBLES Y DECORACIÓN',
          items: ['Organización Para El Hogar', 'Estantes', 'Mesas Y Sillas']
        },
        {
          name: 'ELECTRODOMÉSTICOS DE COCINA',
          items: ['Exprimidores Y Extractores', 'Freidoras', 'Hornos Y Tostadores', 'Licuadoras Y Batidoras', 'Planchas', 'Procesadores De Alimentos']
        }
      ]
    }
  ];

  const getSlug = (itemName) => {
    return itemName.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        INICIO
      </h3>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.name} className="border-b border-gray-100 pb-3 last:border-b-0">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center justify-between w-full text-left font-bold text-gray-800 hover:text-purple-600 transition-colors"
            >
              <span>{category.name}</span>
              <span className="text-gray-400 text-sm">
                {openCategories[category.name] ? '−' : '+'}
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
                      {sub.items.map((item) => (
                        <li key={item}>
                          <Link
                            href={`/productos/categoria/${getSlug(item)}`}
                            className={`block py-1 text-sm text-gray-600 hover:text-purple-600 transition-colors ${
                              router.asPath.includes(getSlug(item)) ? 'text-purple-600 font-medium' : ''
                            }`}
                          >
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link href="/productos" className="block py-2 text-sm text-gray-600 hover:text-purple-600 transition-colors">
          Ver todos los productos
        </Link>
        <Link href="/ofertas" className="block py-2 text-sm text-orange-600 hover:text-orange-700 transition-colors font-medium">
          Ofertas especiales
        </Link>
      </div>
    </div>
  );
}  
