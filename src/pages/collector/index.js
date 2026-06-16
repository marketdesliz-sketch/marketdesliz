// src/pages/collector/index.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CollectorPage() {
  const router = useRouter();
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState('');

  const iniciarEscaneo = () => {
    setEscaneando(true);
    
    const scanner = new Html5QrcodeScanner('lector-qr', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render((decodedText) => {
      // Cuando se escanea un QR
      console.log('QR escaneado:', decodedText);
      setResultado(decodedText);
      scanner.clear();
      
      // Extraer ID del cliente (formato: MDZ-CLIENT-xxx)
      const match = decodedText.match(/MDZ-CLIENT-(.+)/);
      if (match && match[1]) {
        router.push(`/collector/cliente/${match[1]}`);
      } else {
        alert('QR no válido');
        setEscaneando(false);
      }
    }, (error) => {
      console.warn('Error escaneando:', error);
    });
  };

  return (
    <>
      <Head>
        <title>Colector | MarketDesliz</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #f5f5f5; font-family: Arial; }
          .header { background: #6C3BFF; color: white; padding: 20px; text-align: center; }
          .container { max-width: 600px; margin: 40px auto; padding: 20px; }
          .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .btn { background: #6C3BFF; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 18px; cursor: pointer; width: 100%; }
          .btn:hover { background: #5A2FE0; }
          .info { text-align: center; color: #666; margin: 20px 0; }
          #lector-qr { width: 100%; margin: 20px 0; }
        `}</style>
      </Head>

      <div className="header">
        <h1>📱 Colector MarketDesliz</h1>
      </div>

      <div className="container">
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Escanea el QR del cliente</h2>
          
          {!escaneando ? (
            <button className="btn" onClick={iniciarEscaneo}>
              📷 Iniciar escáner
            </button>
          ) : (
            <div>
              <div id="lector-qr"></div>
              <button 
                className="btn" 
                onClick={() => setEscaneando(false)}
                style={{ background: '#dc3545', marginTop: '20px' }}
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="info">
            <p>O ingresa manualmente el ID del cliente:</p>
            <input
              type="text"
              placeholder="ID del cliente"
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  router.push(`/collector/cliente/${e.target.value}`);
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
