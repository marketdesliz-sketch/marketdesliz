// src/components/tandas/TandaRounds.jsx
import { useState } from 'react';

export default function TandaRounds({ members, currentRound, totalRounds, onSelectRound, userPosition }) {
  const [expanded, setExpanded] = useState(false);
  
  // ✅ Crear rondas basadas en los miembros (cada miembro recibe en su posición)
  const rounds = members
    .filter(m => m.estado === 'activo')
    .map(member => ({
      roundNumber: member.posicion,
      estado: member.posicion < currentRound ? 'completado' 
              : member.posicion === currentRound ? 'activo' 
              : 'pendiente',
      receiverId: member.userId,
      receiverName: member.expand?.userId?.nombre || `Participante ${member.posicion}`
    }))
    .sort((a, b) => a.roundNumber - b.roundNumber);
  
  const mostrarRounds = expanded ? rounds : rounds.slice(0, 8);
  
  // Calcular en qué ronda recibe el usuario
  const userReceiveRound = userPosition;
  const isUserTurn = (roundNumber) => roundNumber === userReceiveRound;
  
  const getRoundStatus = (round) => {
    if (round.estado === 'completado') {
      return { label: 'Completado', color: '#28a745', bg: '#E8F5E9' };
    }
    if (round.estado === 'activo') {
      return { label: 'En curso', color: '#FF9800', bg: '#FFF3E0' };
    }
    if (round.estado === 'pendiente') {
      if (round.roundNumber === currentRound) {
        return { label: 'Actual', color: '#6C3BFF', bg: '#F3F0FF' };
      }
      return { label: 'Pendiente', color: '#999', bg: '#f5f5f5' };
    }
    return { label: round.estado || 'Desconocido', color: '#999', bg: '#f5f5f5' };
  };

  if (rounds.length === 0) {
    return (
      <div style={{ marginTop: '20px', textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '12px' }}>
        <p style={{ color: '#666' }}>No hay rondas disponibles</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>
          📊 Rondas ({currentRound}/{totalRounds})
        </h3>
        {userReceiveRound && (
          <span style={{
            fontSize: '12px',
            color: '#6C3BFF',
            background: '#F3F0FF',
            padding: '4px 12px',
            borderRadius: '20px'
          }}>
            Recibes en ronda #{userReceiveRound}
          </span>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '8px',
        maxHeight: expanded ? 'none' : '200px',
        overflowY: expanded ? 'visible' : 'auto',
        padding: '4px'
      }}>
        {mostrarRounds.map((round) => {
          const status = getRoundStatus(round);
          const isUserReceive = isUserTurn(round.roundNumber);
          
          return (
            <div
              key={round.roundNumber}
              onClick={() => {
                if (round.estado === 'pendiente' && onSelectRound) {
                  onSelectRound(round);
                }
              }}
              style={{
                background: isUserReceive ? 'linear-gradient(135deg, #6C3BFF20, #9A7BFF20)' : status.bg,
                padding: '12px 8px',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: round.estado === 'pendiente' && onSelectRound ? 'pointer' : 'default',
                border: isUserReceive ? '2px solid #6C3BFF' : '1px solid #eee',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: isUserReceive ? '#6C3BFF' : status.color
              }}>
                #{round.roundNumber}
              </div>
              <div style={{ fontSize: '10px', color: status.color, marginTop: '4px' }}>
                {status.label}
              </div>
              {isUserReceive && (
                <div style={{ fontSize: '10px', color: '#6C3BFF', marginTop: '4px' }}>
                  🎯 ¡Tu turno!
                </div>
              )}
              {round.receiverName && round.roundNumber !== userReceiveRound && (
                <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                  {round.receiverName}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rounds.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '8px',
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#666',
            fontSize: '12px'
          }}
        >
          {expanded ? 'Ver menos ▲' : `Ver más rondas (${rounds.length - 8} más) ▼`}
        </button>
      )}
    </div>
  );
}