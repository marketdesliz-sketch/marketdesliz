'use client'
import { useState } from 'react'

export default function FloatingButtons() {
  const [helpVisible, setHelpVisible] = useState(true)

  return (
    <>
      {/* Iniciar Sesión — Cyan side tab */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[60]">
        <div
          className="bg-[#00bcd4] text-white rounded-l-lg flex flex-col items-center justify-center gap-1 cursor-pointer shadow-lg"
          style={{ width: '64px', padding: '14px 8px' }}
        >
          <i className="fa-regular fa-user text-xl" />
          <span className="text-[11px] font-semibold text-center leading-tight mt-1">
            Iniciar<br/>Sesión
          </span>
        </div>
      </div>

      {/* ¿Te ayudamos? bubble */}
      {helpVisible && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2">
          <div className="bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-md cursor-pointer">
            ¿Te ayudamos?
          </div>
          <button
            className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            onClick={() => setHelpVisible(false)}
          >✕</button>
        </div>
      )}

      {/* WhatsApp */}
      <div className="fixed bottom-6 right-4 z-50">
        <a href="https://wa.me/528002424833" target="_blank" rel="noreferrer">
          <div className="bg-green-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg cursor-pointer text-2xl">
            <i className="fa-brands fa-whatsapp" />
          </div>
        </a>
      </div>

      {/* Scroll to top */}
      <div className="fixed bottom-24 right-[88px] z-40">
        <button
          className="border-2 border-dashed border-gray-400 rounded-full w-10 h-10 flex items-center justify-center bg-white hover:border-[#cc0000]"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="fa-solid fa-arrow-up text-[#cc0000] text-sm" />
        </button>
      </div>

      {/* Cookie badge */}
      <div className="fixed bottom-0 left-0 z-50">
        <div className="bg-white border border-gray-300 rounded-tr-lg p-2 shadow">
          <span className="text-2xl">🍪</span>
        </div>
      </div>
    </>
  )
}