// src/components/store/BenefitsSection.js
export default function BenefitsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F9F9F9] p-8 rounded-lg">
      {/* Crédito Fácil */}
      <div className="text-center">
        <div className="w-16 h-16 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg">Crédito Fácil</h3>
        <p className="text-gray-600">Sin requisitos complicados</p>
      </div>

      {/* Pagos Semanales */}
      <div className="text-center">
        <div className="w-16 h-16 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg">Pagos Semanales</h3>
        <p className="text-gray-600">Plazos cómodos y flexibles</p>
      </div>

      {/* Cobro con QR */}
      <div className="text-center">
        <div className="w-16 h-16 bg-[#6C3BFF] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#6C3BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg">Cobro con QR</h3>
        <p className="text-gray-600">Escaneo rápido con nuestro cobrador</p>
      </div>
    </div>
  );
}
