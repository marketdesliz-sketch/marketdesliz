// src/components/TarjetaCliente.jsx
import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function TarjetaCliente({ datos, tipo = 'frente' }) {
  const tarjetaRef = useRef(null);

  // ==============================================
  // DATOS DEL CLIENTE
  // ==============================================
  const numeroTarjeta = datos?.numeroTarjetaFormateado ||
    String(datos?.numeroTarjeta || 1).padStart(3, '0');

  const nombreCliente = datos?.nombre?.toUpperCase() ||
    datos?.expand?.userId?.nombre?.toUpperCase() ||
    'CLIENTE';

  const idCliente = datos?.tarjetaId ||
    datos?.idCliente ||
    `MDZ-${(datos?.userId || datos?.id || '').slice(-6)}`;

  const pagoSemanal = datos?.pagoSemanal || 100;
  const totalPagar = datos?.totalPagar || datos?.precioTotal || 11500;

  const qrUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/cliente/${datos?.userId || datos?.id || ''}`;

  const fotoCliente = datos?.foto || datos?.expand?.userId?.foto;

  // ==============================================
  // DATOS DE NIVEL
  // ==============================================
  const nivel = datos?.nivel || 0;
  const nivelNombre = datos?.nivelNombre || obtenerNombreNivel(nivel);
  const productosPagados = datos?.productosPagados || 0;
  const productosFaltantes = datos?.productosFaltantes || 0;
  const siguienteNivel = datos?.siguienteNivel || obtenerSiguienteNivel(nivel);
  const siguienteNivelNombre = datos?.nombreSiguienteNivel || '';
  const tandaDisponible = datos?.tandaDisponible || 0;

  const fechaPrimerProducto = datos?.fechaPrimerProducto || datos?.fechaPrimerCompra;
  const fechaTarjeta = fechaPrimerProducto ?
    new Date(fechaPrimerProducto).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }) : '';

  const antiguedadMeses = fechaPrimerProducto ?
    Math.floor((new Date() - new Date(fechaPrimerProducto)) / (1000 * 60 * 60 * 24 * 30)) : 0;

  // ==============================================
  // FUNCIONES AUXILIARES
  // ==============================================
  function obtenerNombreNivel(nivel) {
    const nombres = {
      0: 'Sin nivel',
      1: 'Básico',
      3: 'Bronce',
      5: 'Plata',
      10: 'Oro',
      20: 'Platino',
      30: 'Diamante',
      40: 'Zafiro',
      50: 'Rubí'
    };
    return nombres[nivel] || `Nivel ${nivel}`;
  }

  function obtenerSiguienteNivel(nivelActual) {
    const niveles = [1, 3, 5, 10, 20, 30, 40, 50];
    for (const n of niveles) {
      if (n > nivelActual) return n;
    }
    return null;
  }

  const calcularProgresoNivel = () => {
    if (!siguienteNivel || productosFaltantes <= 0) return 0;
    const totalRequerido = productosPagados + productosFaltantes;
    if (totalRequerido <= 0) return 0;
    return Math.min(100, (productosPagados / totalRequerido) * 100);
  };

  // ==============================================
  // FRENTE
  // ==============================================
  if (tipo === 'frente') {
    return (
      <div ref={tarjetaRef} className="w-[380px] h-[580px] bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200 font-sans">
        <div className="p-5 flex flex-col h-full">

          <div className="text-right text-gray-400 text-sm font-mono mb-2">
            No. {numeroTarjeta}
          </div>

          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-purple-700">MarketDesliz</div>
            <div className="text-xs text-gray-500">Compra fácil, compra Desliz</div>
          </div>

          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full shadow-sm">
              <span className="text-sm">🏆</span>
              <span className="text-xs font-bold text-white">Nivel {nivel}</span>
              <span className="text-[10px] text-yellow-100">({nivelNombre})</span>
            </div>
          </div>

          {fechaTarjeta && (
            <div className="text-center mb-1">
              <p className="text-[9px] text-gray-400">Socio desde {fechaTarjeta}</p>
              {antiguedadMeses > 0 && (
                <p className="text-[8px] text-gray-400">🎯 {antiguedadMeses} meses de confianza</p>
              )}
            </div>
          )}

          {siguienteNivel && productosFaltantes > 0 && (
            <div className="mb-3 px-2">
              <div className="flex justify-between text-[8px] text-gray-500 mb-0.5">
                <span>Próximo: {siguienteNivelNombre || `Nivel ${siguienteNivel}`}</span>
                <span>Faltan {productosFaltantes} productos</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${calcularProgresoNivel()}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center overflow-hidden border-4 border-purple-200 shadow-md flex-shrink-0">
              {fotoCliente ? (
                <img
                  src={fotoCliente}
                  alt="Foto del cliente"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">🚀</span>
              )}
            </div>

            <div className="flex-1">
              <div className="text-xl font-bold text-gray-800 tracking-wide">{nombreCliente}</div>
              <div className="text-sm text-gray-500 font-mono">{idCliente}</div>
              <div className="text-green-600 text-sm font-medium">✔ Cliente Activo</div>
              <div className="text-xs text-gray-400">Titular de la cuenta</div>
            </div>
          </div>

          {datos?.planPagos && (
            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
              <div>
                <div className="text-xs text-gray-500">Pago semanal</div>
                <div className="text-2xl font-bold text-gray-800">
                  ${(datos.planPagos.pagoSemanal || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total a pagar</div>
                <div className="text-2xl font-bold text-purple-700">
                  ${(datos.planPagos.totalPagar || 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {tandaDisponible > 0 && (
            <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="text-[10px] font-bold text-green-700">🎯 Tanda disponible</p>
              <p className="text-lg font-bold text-green-600">${tandaDisponible.toLocaleString()}</p>
              <p className="text-[8px] text-green-600">Por tu nivel {nivel} - {nivelNombre}</p>
            </div>
          )}

          <div className="flex justify-center mb-5">
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-200">
              <QRCodeCanvas value={qrUrl} size={120} level="H" />
            </div>
          </div>

          <div className="border-t border-gray-200 my-3"></div>

          <div className="text-center text-xs text-gray-400 space-y-1 mt-auto">
            <div>Escanea para ver tu cuenta</div>
            <div>Presenta este código para pago</div>
            <div className="font-semibold text-gray-500">Válido solo con identificación</div>
          </div>

        </div>
      </div>
    );
  }

  // ==============================================
  // REVERSO
  // ==============================================
  return (
    <div ref={tarjetaRef} className="w-[380px] h-[580px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 font-sans">
      <div className="p-4 flex flex-col h-full">

        <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-purple-700">🏆 Tu nivel</p>
              <p className="text-sm font-bold text-purple-800">Nivel {nivel} - {nivelNombre}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-purple-600">Productos pagados</p>
              <p className="text-sm font-bold text-purple-700">{productosPagados}</p>
            </div>
          </div>
          {siguienteNivel && productosFaltantes > 0 && (
            <div className="mt-1">
              <div className="w-full bg-purple-200 rounded-full h-1">
                <div
                  className="bg-purple-600 h-1 rounded-full"
                  style={{ width: `${calcularProgresoNivel()}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-400">
                    <th className="text-left py-1.5 font-bold text-gray-700 w-[35%]">FECHA</th>
                    <th className="text-right py-1.5 font-bold text-gray-700 w-[30%]">ABONO</th>
                    <th className="text-right py-1.5 font-bold text-gray-700 w-[35%]">SALDO</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(10).fill().map((_, i) => (
                    <tr key={`left-${i}`} className="border-b border-dotted border-gray-200">
                      <td className="py-1 text-gray-500 font-mono">___/___</td>
                      <td className="py-1 text-right text-gray-500 font-mono">$ _______</td>
                      <td className="py-1 text-right text-gray-500 font-mono">$ _______</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-400">
                    <th className="text-left py-1.5 font-bold text-gray-700 w-[35%]">FECHA</th>
                    <th className="text-right py-1.5 font-bold text-gray-700 w-[30%]">ABONO</th>
                    <th className="text-right py-1.5 font-bold text-gray-700 w-[35%]">SALDO</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(10).fill().map((_, i) => (
                    <tr key={`right-${i}`} className="border-b border-dotted border-gray-200">
                      <td className="py-1 text-gray-500 font-mono">___/___</td>
                      <td className="py-1 text-right text-gray-500 font-mono">$ _______</td>
                      <td className="py-1 text-right text-gray-500 font-mono">$ _______</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-gray-300">
          <div className="text-[11px] font-bold text-gray-700 mb-2">
            🎯 TANDAS ACTIVAS
          </div>

          <div className="space-y-2">
            {datos?.tandas && datos.tandas.length > 0 ? (
              datos.tandas.slice(0, 3).map((tanda) => (
                <div key={tanda.id} className="flex items-center justify-between text-xs p-1.5 bg-gray-50 rounded-md">
                  <span className="text-gray-700 font-medium truncate">{tanda.nombre}</span>
                  <span className="text-gray-500">Pos #{tanda.posicion}</span>
                  <span className="text-gray-400 text-[10px]">
                    {tanda.pagosRealizados || 0}/{tanda.totalRounds || '?'}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between text-xs p-1.5 bg-gray-50 rounded-md">
                  <span className="text-gray-300">Sin tandas activas</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 pt-2 text-[9px] text-gray-400 border-t border-gray-200">
            Firma del cobrador: _________________________
          </div>
        </div>

      </div>
    </div>
  );
} "// Updated $(date)" 
