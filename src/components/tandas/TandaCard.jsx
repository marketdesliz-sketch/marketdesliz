// src/components/tandas/TandaCard.jsx
import { useState } from 'react';

export default function TandaCard({
  tanda,
  onUnirse,
  isLoggedIn,
  isKycApproved,
  nivelMaximoParticipado = 0,  // ✅ NUEVO: nivel máximo alcanzado por el usuario
  haParticipado = false        // ✅ NUEVO: si ya ha participado en alguna tanda
}) {

  const [isHovered, setIsHovered] = useState(false);

  const miembrosActuales = tanda.miembrosActuales || 0;
  const cupoMaximo = tanda.cupoMaximo || tanda.totalMembers || 1;
  const cupoDisponible = cupoMaximo - miembrosActuales;
  const progreso = cupoMaximo > 0 ? (miembrosActuales / cupoMaximo) * 100 : 0;
  const estaCompleta = cupoDisponible <= 0;
  const montoTotal = tanda.montoTotal || tanda.monto || 0;
  const montoCuota = tanda.montoCuota || 0;

  // ✅ Determinar si la tanda está bloqueada por nivel progresivo
  const nivelRequerido = tanda.nivelRequerido || 1;
  let estaBloqueadaPorProgreso = false;
  let mensajeBloqueo = '';

  if (haParticipado === false && nivelRequerido > 1) {
    estaBloqueadaPorProgreso = true;
    mensajeBloqueo = 'Debes comenzar desde nivel básico';
  } else if (haParticipado && nivelRequerido > nivelMaximoParticipado + 1) {
    estaBloqueadaPorProgreso = true;
    mensajeBloqueo = `Completa nivel ${nivelMaximoParticipado} primero`;
  }

  const getFrequencyText = (freq) => {
    const map = {
      'semanal': 'Semanal',
      'quincenal': 'Quincenal',
      'mensual': 'Mensual',
      'weekly': 'Semanal',
      'biweekly': 'Quincenal',
      'monthly': 'Mensual'
    };
    return map[freq] || freq || 'Semanal';
  };

  const getStatusColor = () => {
    if (estaCompleta) return '#6c757d';
    if (cupoDisponible <= 3) return '#ff9800';
    return '#28a745';
  };

  const getEstadoBadge = () => {
    const estados = {
      'abierta': { text: 'Abierta', color: '#28a745', bg: '#E8F5E9' },
      'en_curso': { text: 'En curso', color: '#6C3BFF', bg: '#F3F0FF' },
      'completada': { text: 'Completada', color: '#6c757d', bg: '#f8f9fa' },
      'cancelada': { text: 'Cancelada', color: '#dc3545', bg: '#fef2f2' }
    };
    return estados[tanda.estado] || estados['abierta'];
  };

  const estadoBadge = getEstadoBadge();

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isHovered ? '0 8px 24px rgba(108,59,255,0.15)' : '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header con gradiente */}
      <div style={{
        background: 'linear-gradient(135deg, #6C3BFF, #9A7BFF)',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '5px', fontWeight: 'bold' }}>
          {tanda.nombre || `Tanda $${montoTotal.toLocaleString()}`}
        </h3>
        {tanda.descripcion && (
          <p style={{ fontSize: '12px', opacity: 0.9, margin: '5px 0 0' }}>
            {tanda.descripcion}
          </p>
        )}
        <span style={{
          background: estadoBadge.bg,
          color: estadoBadge.color,
          padding: '3px 12px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          display: 'inline-block',
          marginTop: '8px'
        }}>
          {estadoBadge.text}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>
        {/* Monto principal */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>Monto por turno</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6C3BFF' }}>
            ${montoTotal.toLocaleString()}
          </div>
          {montoCuota > 0 && (
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              ${montoCuota.toLocaleString()} por pago
            </div>
          )}
        </div>

        {/* Información en grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#666' }}>Participantes</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {miembrosActuales}/{cupoMaximo}
            </div>
          </div>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#666' }}>Frecuencia</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {getFrequencyText(tanda.frecuencia || tanda.frequency)}
            </div>
          </div>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#666' }}>Día de cobro</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {tanda.diaPago || tanda.collectionDay || 'Lunes'}
            </div>
          </div>
          <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#666' }}>Gasolina</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              ${(tanda.gasFee || 25).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            height: '8px',
            background: '#eee',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, progreso)}%`,
              height: '100%',
              background: getStatusColor(),
              transition: 'width 0.3s'
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '12px'
          }}>
            <span style={{ color: '#666' }}>Progreso</span>
            <span style={{ fontWeight: 'bold', color: getStatusColor() }}>
              {estaCompleta ? '¡Completa!' : `${cupoDisponible} lugares`}
            </span>
          </div>
        </div>

        {/* Badges informativos */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{
            background: '#F3F0FF',
            color: '#6C3BFF',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            ⭐ Posición #1 Admin
          </span>
          {tanda.nivelRequerido > 0 && (
            <span style={{
              background: '#FFF3E0',
              color: '#E65100',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              📊 Nivel {tanda.nivelRequerido}+
            </span>
          )}
          {tanda.productosRequeridos > 0 && (
            <span style={{
              background: '#E8F5E9',
              color: '#28a745',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              📦 {tanda.productosRequeridos}+ productos
            </span>
          )}
          <span style={{
            background: '#E3F2FD',
            color: '#1565C0',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            🔐 KYC requerido
          </span>
          {tanda.pagoEnDosPartes && (
            <span style={{
              background: '#E8F5E9',
              color: '#2E7D32',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              💰 Pago en 2 partes
            </span>
          )}
        </div>

        {/* Badge de nivel bloqueado por progreso */}
        {estaBloqueadaPorProgreso && (
          <span style={{
            background: '#FFEBEE',
            color: '#C62828',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            🔒 {mensajeBloqueo}
          </span>
        )}

        {/* Botones */}
        {tanda.estado === 'abierta' && (
          <button
            onClick={() => onUnirse?.(tanda.id)}
            disabled={estaCompleta || estaBloqueadaPorProgreso}
            style={{
              width: '100%',
              padding: '14px',
              background: (estaCompleta || estaBloqueadaPorProgreso) ? '#ccc' : '#6C3BFF',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (estaCompleta || estaBloqueadaPorProgreso) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!estaCompleta && !estaBloqueadaPorProgreso) e.target.style.background = '#5A2FE0';
            }}
            onMouseLeave={(e) => {
              if (!estaCompleta && !estaBloqueadaPorProgreso) e.target.style.background = '#6C3BFF';
            }}
          >
            {estaCompleta ? 'Tanda completa' :
              estaBloqueadaPorProgreso ? 'Nivel bloqueado' :
                'Unirme a la tanda'}
          </button>
        )}

        {tanda.estado === 'en_curso' && (
          <button
            disabled
            style={{
              width: '100%',
              padding: '14px',
              background: '#f5f5f5',
              color: '#999',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'not-allowed'
            }}
          >
            Tanda en curso
          </button>
        )}

        {tanda.estado === 'completada' && (
          <button
            disabled
            style={{
              width: '100%',
              padding: '14px',
              background: '#f5f5f5',
              color: '#999',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'not-allowed'
            }}
          >
            Tanda finalizada
          </button>
        )}
      </div>
    </div>
  );
}