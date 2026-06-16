// src/pages/contrato-tanda.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function ContratoTandaPage() {
  return (
    <>
      <Head>
        <title>Contrato de Tanda | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">CONTRATO DE PARTICIPACIÓN EN TANDA</h1>
              <p className="text-gray-500">MarketDesliz - Sistema de Tandas</p>
            </div>

            <div className="space-y-4 text-gray-700">
              <p>En la ciudad de __________, a los ___ días del mes de _______ de 2026, comparecen por una parte <strong>MarketDesliz S.A. de C.V.</strong> (en adelante "EL ADMINISTRADOR"), y por otra parte el participante (en adelante "EL PARTICIPANTE"), quien se identifica con los datos proporcionados en su registro.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA PRIMERA - OBJETO</h2>
              <p>EL PARTICIPANTE se une a la tanda denominada "__________", conformada por un grupo de ___ personas, con un monto de aportación semanal de $__________.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA SEGUNDA - ORDEN DE ENTREGA</h2>
              <p>La posición asignada a EL PARTICIPANTE es la número ___ del total de ___ participantes. La posición número 1 corresponde al administrador (MarketDesliz).</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA TERCERA - PAGOS</h2>
              <p>EL PARTICIPANTE se obliga a realizar los pagos semanales de $__________, los cuales serán cobrados por el cobrador designado por EL ADMINISTRADOR en el domicilio registrado.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA CUARTA - GASOLINA</h2>
              <p>EL PARTICIPANTE pagará la cantidad de $25.00 (VEINTICINCO PESOS 00/100 M.N.) por concepto de gastos de administración (gasolina), mismo que es único y no reembolsable.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA QUINTA - RESPONSABILIDADES</h2>
              <p>EL PARTICIPANTE acepta que los pagos deben ser realizados de manera puntual, ya que cualquier atraso afecta a todo el grupo. En caso de atraso, EL ADMINISTRADOR podrá aplicar las siguientes medidas:</p>
              <ul className="list-disc pl-8 space-y-1 mt-2">
                <li>1. Notificación de atraso</li>
                <li>2. Recargo por mora</li>
                <li>3. Exclusión de futuras tandas</li>
              </ul>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA SEXTA - RECEPCIÓN DEL TURNO</h2>
              <p>EL PARTICIPANTE recibirá la cantidad reunida en la tanda en la semana correspondiente a su posición, de acuerdo con el orden establecido.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA SÉPTIMA - ABANDONO</h2>
              <p>En caso de que EL PARTICIPANTE abandone la tanda después de haber recibido su turno, EL ADMINISTRADOR podrá tomar acciones legales para recuperar el monto adeudado.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA OCTAVA - VERIFICACIÓN KYC</h2>
              <p>EL PARTICIPANTE declara bajo protesta de decir verdad que los documentos proporcionados para la verificación KYC (INE, selfie, comprobante de domicilio) son auténticos y verdaderos.</p>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-center">Leído que fue el presente contrato, lo ratifican y firman en unidad de acto.</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-8 pt-8">
                <div className="text-center">
                  <p className="font-bold">_________________________</p>
                  <p>MarketDesliz S.A. de C.V.</p>
                  <p>EL ADMINISTRADOR</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">_________________________</p>
                  <p>{/* Nombre del participante */}</p>
                  <p>EL PARTICIPANTE</p>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 mt-8 pt-8">
                <p>MarketDesliz - Contrato de Tanda v1.0</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={() => window.print()} 
                className="bg-[#6C3BFF] text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                🖨️ Imprimir / Guardar como PDF
              </button>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}