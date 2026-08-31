'use client'
import { useState } from 'react'

const navItems = [
  { label: 'Inicio', href: '/' },
  { 
    label: 'Cocina Y Mesa', 
    href: '#', 
    hasDropdown: true,
    dropdown: [
      { 
        label: 'Electrodomésticos', 
        subItems: [
          { label: 'Cafeteras Y Hervidores', slug: 'electrodomesticos' },
          { label: 'Exprimidores Y Extractores', slug: 'electrodomesticos' },
          { label: 'Freidoras', slug: 'electrodomesticos' },
          { label: 'Hornos Y Tostadores', slug: 'electrodomesticos' },
          { label: 'Licuadoras Y Batidoras', slug: 'electrodomesticos' },
          { label: 'Planchas', slug: 'electrodomesticos' },
          { label: 'Procesadores De Alimentos', slug: 'electrodomesticos' },
        ] 
      },
      { 
        label: 'Línea Blanca', 
        subItems: [
          { label: 'Estufas Y Parrillas', slug: 'linea-blanca' },
          { label: 'Lavadoras', slug: 'linea-blanca' },
          { label: 'Refrigeración Y Congelación', slug: 'linea-blanca' },
          { label: 'Calefactores', slug: 'linea-blanca' },
          { label: 'Ventiladores', slug: 'linea-blanca' },
          { label: 'Aspiradoras Y Complementos', slug: 'linea-blanca' },
        ] 
      },
      { 
        label: 'Ferretería', 
        subItems: [
          { label: 'Herramientas', slug: 'ferreteria' },
          { label: 'Iluminación', slug: 'ferreteria' },
          { label: 'Organización Y Almacenamiento', slug: 'ferreteria' },
          { label: 'Tornillería Y Fijaciones', slug: 'ferreteria' },
          { label: 'Seguridad Y Protección', slug: 'ferreteria' },
        ] 
      },
      { 
        label: 'Mascotas', 
        subItems: [
          { label: 'Casas De Plástico', slug: 'mascotas' },
          { label: 'Higiene Y Cuidado', slug: 'mascotas' },
          { label: 'Juguetes Y Accesorios', slug: 'mascotas' },
          { label: 'Ropa', slug: 'mascotas' },
        ] 
      },
      { 
        label: 'Patio Y Jardín', 
        subItems: [
          { label: 'Macetas', slug: 'patio-y-jardin' },
          { label: 'Riego', slug: 'patio-y-jardin' },
          { label: 'Sombrillas Y Paraguas', slug: 'patio-y-jardin' },
        ] 
      },
      { 
        label: 'Oficina Y Papelería', 
        subItems: [
          { label: 'Limpieza', slug: 'oficina-y-papeleria' },
          { label: 'Botes Y Costos', slug: 'oficina-y-papeleria' },
          { label: 'Cubetas', slug: 'oficina-y-papeleria' },
          { label: 'Escobas, Trapaedores, Pinzas Y Más', slug: 'oficina-y-papeleria' },
          { label: 'Insumos De Limpieza', slug: 'oficina-y-papeleria' },
        ] 
      },
      { 
        label: 'Belleza Y Cuidado Personal', 
        subItems: [
          { label: 'Bebés Y Niños', slug: 'belleza-y-cuidado-personal' },
          { label: 'Muebles Y Decoración', slug: 'belleza-y-cuidado-personal' },
          { label: 'Organización Para El Hogar', slug: 'belleza-y-cuidado-personal' },
          { label: 'Estantes', slug: 'belleza-y-cuidado-personal' },
          { label: 'Mesas Y Sillas', slug: 'belleza-y-cuidado-personal' },
        ] 
      },
    ]
  },
  { 
    label: 'Hogar', 
    href: '#', 
    hasDropdown: true,
    dropdown: [
      { 
        label: 'Muebles', 
        subItems: [
          { label: 'Sofás', slug: 'muebles' },
          { label: 'Mesas', slug: 'muebles' },
          { label: 'Sillas', slug: 'muebles' },
          { label: 'Estanterías', slug: 'muebles' },
        ] 
      },
      { 
        label: 'Decoración', 
        subItems: [
          { label: 'Cuadros', slug: 'decoracion' },
          { label: 'Espejos', slug: 'decoracion' },
          { label: 'Alfombras', slug: 'decoracion' },
          { label: 'Cortinas', slug: 'decoracion' },
        ] 
      },
      { 
        label: 'Organización', 
        subItems: [
          { label: 'Cajas', slug: 'organizacion' },
          { label: 'Estantes', slug: 'organizacion' },
          { label: 'Percheros', slug: 'organizacion' },
        ] 
      },
    ]
  },
  { label: 'Cuisine Spot', href: '#' },
  { 
    label: 'Juguetería', 
    href: '#', 
    hasDropdown: true,
    dropdown: [
      { 
        label: 'Juguetes Educativos', 
        subItems: [
          { label: 'Rompecabezas', slug: 'juguetes-educativos' },
          { label: 'Juegos De Mesa', slug: 'juguetes-educativos' },
          { label: 'Libros', slug: 'juguetes-educativos' },
        ] 
      },
      { 
        label: 'Muñecas Y Accesorios', 
        subItems: [
          { label: 'Muñecas', slug: 'munecas-y-accesorios' },
          { label: 'Ropa De Muñecas', slug: 'munecas-y-accesorios' },
          { label: 'Accesorios', slug: 'munecas-y-accesorios' },
        ] 
      },
      { 
        label: 'Juguetes De Construcción', 
        subItems: [
          { label: 'Bloques', slug: 'juguetes-de-construccion' },
          { label: 'Legos', slug: 'juguetes-de-construccion' },
          { label: 'Herramientas', slug: 'juguetes-de-construccion' },
        ] 
      },
    ]
  },
  { label: 'Ofertas', href: '#' },
  { label: 'Catálogos', href: '#', hasDot: true },
  { label: 'Ver Más', href: '#', hasDropdown: true },
]

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  return (
    <nav className="bg-white border-b-2 border-[#5B2BE0] relative z-40">
      <div className="max-w-[1400px] mx-auto px-6">
        <ul className="flex items-center text-sm text-gray-700">
          {navItems.map((item) => (
            <li
              key={item.label}
              className="relative py-4 px-5 cursor-pointer hover:text-[#5B2BE0] flex items-center gap-1 group"
              onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a href={item.href}>{item.label}</a>
              {item.hasDropdown && (
                <i className="fa-solid fa-chevron-down text-xs ml-1" />
              )}
              {item.hasDot && (
                <span className="inline-block w-2 h-2 bg-gray-800 rounded-full ml-1" />
              )}

              {/* Dropdown menu */}
              {item.hasDropdown && item.dropdown && activeDropdown === item.label && (
                <div className="absolute top-full left-0 mt-0 bg-white shadow-xl border border-gray-200 rounded-b-lg min-w-[280px] py-2 z-50">
                  {item.dropdown.map((category) => (
                    <div key={category.label} className="relative group/sub">
                      <div className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer text-gray-700 hover:text-[#5B2BE0]">
                        <span className="text-xs font-semibold uppercase">{category.label}</span>
                        {category.subItems && (
                          <i className="fa-solid fa-chevron-right text-xs text-gray-400" />
                        )}
                      </div>
                      {/* Sub-dropdown (second level) */}
                      {category.subItems && (
                        <div className="absolute left-full top-0 ml-0 bg-white shadow-xl border border-gray-200 rounded-lg min-w-[220px] py-2 hidden group-hover/sub:block">
                          {category.subItems.map((subItem) => (
                            <a
                              key={subItem.label}
                              href={`/categoria/${subItem.slug}`}
                              className="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-[#5B2BE0]"
                            >
                              {subItem.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}