// src/pages/terminos/index.js
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import StoreLayout from '../../layouts/StoreLayout';
import pb from '../../lib/pocketbase';

export default function TerminosPage() {
  const router = useRouter();
  const [aceptado, setAceptado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const handleAccept = async () => {
    if (!aceptado) return;

    try {
      setLoading(true);
      const clienteId = localStorage.getItem('clienteId');

      if (!clienteId) {
        router.push('/solicitar');
        return;
      }

      // Actualizar KYC con términos aceptados
      const kyc = await pb.collection('kyc_verifications').getFullList({
        filter: `userId = "${clienteId}"`,
        sort: '-created',
        limit: 1
      });

      if (kyc.length > 0) {
        await pb.collection('kyc_verifications').update(kyc[0].id, {
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString()
        });
      }

      router.push('/tandas');

    } catch (error) {
      console.error('Error:', error);
      alert('Error al aceptar términos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Términos y Condiciones | MarketDesliz</title>
        <style>{`
          .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          h1 { color: #333; margin-bottom: 20px; }
          h2 { color: #6C3BFF; font-size: 18px; margin: 20px 0 10px; }
          .terminos-content { max-height: 400px; overflow-y: auto; padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; border: 1px solid #eee; }
          .responsabilidades { background: #F3F0FF; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .responsabilidades h3 { color: #6C3BFF; margin-bottom: 10px; }
          .responsabilidades ul { list-style: none; padding: 0; }
          .responsabilidades li { padding: 8px 0; padding-left: 24px; position: relative; }
          .responsabilidades li:before { content: "✓"; color: #6C3BFF; position: absolute; left: 0; }
          .checkbox { display: flex; align-items: center; margin: 20px 0; }
          .checkbox input { width: 20px; height: 20px; margin-right: 10px; }
          .btn-primary { width: 100%; background: #6C3BFF; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
          .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
          .btn-secondary { width: 100%; background: white; color: #666; border: 2px solid #ddd; padding: 15px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 10px; }
          .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        `}</style>
      </Head>

      <StoreLayout>
        <div className="container">
          <div className="card">
            <h1>📜 Términos y Condiciones</h1>
            <h2>Para participar en tandas MarketDesliz</h2>

            <div className="responsabilidades">
              <h3>🎯 Responsabilidades del participante</h3>
              <ul>
                <li>Realizar los pagos semanales de forma puntual</li>
                <li>Mantener comunicación con el administrador</li>
                <li>No abandonar la tanda después de recibir el dinero</li>
                <li>Respetar el orden de turnos establecido</li>
                <li>Notificar cualquier cambio en tus datos de contacto</li>
              </ul>
            </div>

            <div className="terminos-content">
              <h2>1. Aceptación de términos</h2>
              <p>Al participar en una tanda de MarketDesliz, aceptas cumplir con todas las reglas establecidas. Las tandas son un compromiso grupal donde la confianza y puntualidad son fundamentales.</p>

              <h2>2. Pagos y gasolina</h2>
              <p>El pago de gasolina ($25) es único y no reembolsable. Los pagos semanales deben realizarse en la fecha acordada. El retraso en los pagos puede resultar en la pérdida del turno o penalizaciones.</p>

              <h2>3. Turnos y entregas</h2>
              <p>Los turnos se asignan en orden de registro, con la posición 1 reservada para MarketDesliz (administrador). No se pueden intercambiar posiciones sin autorización.</p>

              <h2>4. Penalizaciones</h2>
              <p>El incumplimiento de pagos puede resultar en:</p>
              <ul>
                <li>Pérdida del turno actual</li>
                <li>Suspensión temporal de la cuenta</li>
                <li>Imposibilidad de unirse a futuras tandas</li>
              </ul>

              <h2>5. Privacidad</h2>
              <p>Tu información personal (nombre, teléfono, dirección) será visible solo para otros miembros de la tanda para facilitar la comunicación y confianza grupal. Tus documentos oficiales son privados y solo visibles para el administrador.</p>

              <h2>6. Cancelación</h2>
              <p>Una vez que recibes tu turno, no puedes cancelar tu participación hasta completar todos los pagos. Si abandonas la tanda sin completar los pagos, tu cuenta será bloqueada.</p>
            </div>

            {!showFull && (
              <button
                className="btn-secondary"
                onClick={() => setShowFull(true)}
              >
                Leer términos completos
              </button>
            )}

            <div className="checkbox">
              <input
                type="checkbox"
                id="acepto"
                checked={aceptado}
                onChange={(e) => setAceptado(e.target.checked)}
              />
              <label htmlFor="acepto">
                He leído y acepto los términos y condiciones, y acepto las responsabilidades como participante de la tanda
              </label>
            </div>

            <div className="warning">
              ⚠️ Recuerda: Las tandas son un compromiso serio. Los pagos atrasados afectan a todo el grupo.
            </div>

            <button
              className="btn-primary"
              onClick={handleAccept}
              disabled={!aceptado || loading}
            >
              {loading ? 'Procesando...' : 'Aceptar y continuar'}
            </button>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}