// src/components/TarjetaVendedor.jsx
import { QRCodeCanvas } from 'qrcode.react';
import { ShieldCheck } from 'lucide-react';

export default function TarjetaVendedor({ datos, tipo = 'frente' }) {
    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/validar-vendedor/${datos?.qrToken}`;

    if (tipo === 'frente') {
        return (
            <div className="relative w-72 bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:w-[85mm] border border-gray-200">

                {/* Header con banda de color */}
                <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] px-4 py-2.5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-white font-bold text-sm tracking-tight">
                                Market<span className="text-white/80">Desliz</span>
                            </h1>
                            <p className="text-white/70 text-[8px] font-medium mt-0.5">
                                Comprá fácil, compra Desliz
                            </p>
                        </div>
                        <ShieldCheck size={18} className="text-white/80" />
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="p-4">

                    {/* Nombre centrado */}
                    <div className="text-center mb-1">
                        <h2 className="text-base font-bold text-gray-800">{datos?.nombre?.toUpperCase() || 'VENDEDOR'}</h2>
                    </div>

                    {/* Vendedor Verificado centrado */}
                    <div className="text-center mb-3">
                        <p className="text-[9px] font-medium text-[#6C3BFF]">✓ Vendedor Verificado</p>
                    </div>

                    {/* Ruta (izquierda) + Código (derecha) */}
                    <div className="flex justify-between items-center mb-3 text-[9px]">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">Ruta:</span>
                            <span className="font-medium text-gray-700">{datos?.zona || 'No asignada'}</span>
                        </div>
                        <div>
                            <span className="font-mono font-bold text-[#6C3BFF]">{datos?.codigo || 'MDZ-V-02'}</span>
                        </div>
                    </div>

                    {/* QR CENTRAL - Protagonista */}
                    <div className="flex justify-center mb-3">
                        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-md">
                            {datos?.qrToken && (
                                <QRCodeCanvas value={qrUrl} size={110} level="H" />
                            )}
                        </div>
                    </div>

                    {/* Leyenda del QR */}
                    <div className="text-center">
                        <p className="text-[9px] font-medium text-gray-700">Escanea para identificar</p>
                        <p className="text-[7px] text-gray-400">al vendedor</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-4 py-1.5 bg-gray-50/50">
                    <p className="text-[6px] text-gray-400 text-center">
                        Credencial oficial MarketDesliz · Uso exclusivo del personal autorizado
                    </p>
                </div>
            </div>
        );
    }

    // REVERSO del gafete - Con la misma estructura y altura que el frente
    return (
        <div className="relative w-72 bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:w-[85mm] border border-gray-200">

            {/* Header vacío con banda de color (misma altura que el frente) */}
            <div className="bg-gradient-to-r from-[#6C3BFF] to-[#9A7BFF] px-4 py-2.5 h-[62px]">
                {/* Espacio vacío para mantener la misma altura */}
            </div>

            {/* Contenido principal - misma altura que el frente */}
            <div className="p-4 flex flex-col justify-between" style={{ minHeight: '280px' }}>

                {/* Título / Identificador */}
                <div className="text-center mb-2">
                    <p className="text-[10px] font-bold text-gray-800">{datos?.codigo || 'MDZ-V-02'}</p>
                </div>

                {/* Fecha de vencimiento */}
                <div className="text-center mb-2">
                    <p className="text-[7px] text-gray-500">Valido hasta:</p>
                    <p className="text-sm font-bold text-gray-800">31 / 12 / 2025</p>
                </div>

                {/* Separador */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Instrucciones */}
                <div className="mb-2">
                    <p className="text-[7px] font-bold text-gray-700 mb-1">Instrucciones</p>
                    <ul className="text-[6px] text-gray-600 space-y-0.5 list-disc pl-3">
                        <li>Esta credencial es personal e intransferible.</li>
                        <li><span className="font-bold">Preséntala</span> para identificarte como vendedor autorizado.</li>
                        <li>El código QR permite validar tu identidad.</li>
                        <li>En caso de extravío, comunícate de inmediato.</li>
                    </ul>
                </div>

                {/* Separador */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Contacto */}
                <div className="text-center">
                    <p className="text-[7px] font-bold text-gray-700 mb-1">Contacto</p>
                    <p className="text-[6px] text-gray-600">+52 55 1234 5678</p>
                    <p className="text-[6px] text-gray-600">soporte@marketdesliz.com</p>
                    <p className="text-[6px] text-gray-600">www.marketdesliz.com</p>
                </div>

                {/* Footer - idéntico al frente */}
                <div className="border-t border-gray-100 px-0 py-1.5 bg-gray-50/50 -mx-4 -mb-4 mt-2">
                    <p className="text-[6px] text-gray-400 text-center">
                        Credencial oficial MarketDesliz · Uso exclusivo del personal autorizado
                    </p>
                </div>
            </div>
        </div>
    );
}