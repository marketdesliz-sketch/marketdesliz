// src/pages/contrato-credito.js
import Head from 'next/head';
import StoreLayout from '../layouts/StoreLayout';

export default function ContratoCreditoPage() {
  return (
    <>
      <Head>
        <title>Contrato de Crédito | MarketDesliz</title>
      </Head>

      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">CONTRATO DE CRÉDITO</h1>
              <p className="text-gray-500">MarketDesliz - Compra a Crédito</p>
            </div>

            <div className="space-y-4 text-gray-700">
              <p>En la ciudad de __________, a los ___ días del mes de _______ de 2026, comparecen por una parte <strong>MarketDesliz S.A. de C.V.</strong> (en adelante "EL ACREEDOR"), y por otra parte el cliente (en adelante "EL CLIENTE"), quien se identifica con los datos proporcionados en su registro.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA PRIMERA - OBJETO</h2>
              <p>EL ACREEDOR otorga a EL CLIENTE un crédito para la adquisición de producto(s) seleccionado(s) en la plataforma MarketDesliz, mismo que será pagado en los plazos y términos establecidos en el presente contrato.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA SEGUNDA - MONTO Y FORMA DE PAGO</h2>
              <p>El monto total del crédito es de $__________ (______________________ pesos 00/100 M.N.). EL CLIENTE pagará un enganche del ___% ($__________) y el saldo restante en pagos semanales de $__________ durante ___ semanas.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA TERCERA - INTERESES</h2>
              <p>El presente crédito NO genera intereses adicionales. El monto total a pagar es el precio del producto menos el enganche pagado.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA CUARTA - DOMICILIO PARA NOTIFICACIONES</h2>
              <p>EL CLIENTE señala como su domicilio para recibir notificaciones el registrado en su perfil de MarketDesliz, mismo que se encuentra en: ________________________________________.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA QUINTA - COBRO</h2>
              <p>EL CLIENTE acepta que el cobro de los pagos semanales se realice a través de un cobrador designado por EL ACREEDOR, quien se presentará en el domicilio señalado en la fecha y hora acordada.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA SEXTA - INCUMPLIMIENTO</h2>
              <p>En caso de incumplimiento en los pagos, EL ACREEDOR podrá dar por terminado el presente contrato y exigir el pago total del saldo pendiente, además de los gastos de cobranza.</p>

              <h2 className="text-lg font-bold mt-6">CLÁUSULA SÉPTIMA - RESPONSABILIDAD DEL PRODUCTO</h2>
              <p>EL CLIENTE reconoce que el producto es de su entera responsabilidad una vez entregado. Cualquier garantía será gestionada directamente con el proveedor.</p>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-center">Leído que fue el presente contrato, lo ratifican y firman en unidad de acto.</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-8 pt-8">
                <div className="text-center">
                  <p className="font-bold">_________________________</p>
                  <p>MarketDesliz S.A. de C.V.</p>
                  <p>EL ACREEDOR</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">_________________________</p>
                  <p>{/* Nombre del cliente */}</p>
                  <p>EL CLIENTE</p>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 mt-8 pt-8">
                <p>MarketDesliz - Contrato de Crédito v1.0</p>
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