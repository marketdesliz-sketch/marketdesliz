'use client'
import { useState } from 'react'
import LoginDropdown from './LoginDropdown'

export default function Header() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [cartCount] = useState(0)

  return (
    <header className="bg-white shadow-sm py-3 px-6 relative z-50">
      {/* Red Top Banner - Cambiado a morado */}
      <div className="bg-[#5B2BE0] text-white text-center text-sm py-2 font-medium -mx-6 -mt-3 mb-3">
        🖥️ <strong>Bienvenido a MarketDesliz</strong> Desliza • Conecta • Descubre 
      </div>

      <div className="max-w-[1400px] mx-auto flex items-center gap-6">
        {/* Logo */}
        <div className="flex-shrink-0" style={{ minWidth: '180px' }}>
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center border border-gray-300 rounded-full px-5 py-2.5 bg-white">
          <input
            type="text"
            placeholder="Buscar En Toda La Tienda..."
            className="flex-1 outline-none text-gray-500 text-sm bg-transparent"
          />
          {/* Lupa cambiada a morado */}
          <button className="text-[#5B2BE0] text-lg ml-2">
            <i className="fa-solid fa-magnifying-glass" />
          </button>
        </div>

        {/* Account + Cart */}
        <div className="flex items-center gap-7 flex-shrink-0 relative">
          {/* Account - hover cambiado a morado */}
          <div className="relative">
            <button
              className="flex items-center gap-2 text-gray-700 hover:text-[#5B2BE0]"
              onClick={() => setLoginOpen(!loginOpen)}
            >
              <i className="fa-regular fa-user text-xl" />
              <span className="text-sm font-medium">Mi cuenta</span>
            </button>
            {loginOpen && <LoginDropdown onClose={() => setLoginOpen(false)} />}
          </div>

          {/* Cart - hover y badge cambiados a morado */}
          <div className="flex items-center gap-2 cursor-pointer hover:text-[#5B2BE0]">
            <div className="relative">
              <i className="fa-regular fa-bag-shopping text-2xl text-gray-700" />
              <span className="absolute -top-2 -right-2 bg-[#5B2BE0] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-gray-800">Mi Carrito</div>
              <div className="text-gray-500 text-xs">$0.00</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}