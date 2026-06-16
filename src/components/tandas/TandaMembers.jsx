// src/components/tandas/TandaMembers.jsx
import { useState } from 'react';

export default function TandaMembers({ miembros, totalMembers, currentUserId, onSelectNumber, selectedNumber, canSelect }) {
  const [expanded, setExpanded] = useState(false);
  
  const mostrarMiembros = expanded ? miembros : miembros.slice(0, 10);
  const tieneMas = miembros.length > 10;

  const getPositionStyle = (posicion, estado) => {
    if (posicion === 1) {
      return {
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        color: '#333',
        label: '👑 Administrador'
      };
    }
    if (estado === 'activo') {
      return {
        background: '#E8F5E9',
        color: '#28a745',
        label: '✓ Activo'
      };
    }
    return {
      background: '#FFF3E0',
      color: '#FF9800',
      label: '⏳ Pendiente'
    };
  };

  // ✅ Obtener nombre del miembro (si está expandido)
  const getMemberName = (miembro) => {
    if (miembro.posicion === 1) return 'MarketDesliz';
    if (miembro.expand?.userId?.nombre) return miembro.expand.userId.nombre;
    return `Participante ${miembro.posicion}`;
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>
          👥 Miembros ({miembros.length}/{totalMembers})
        </h3>
        {canSelect && (
          <span style={{
            fontSize: '12px',
            color: '#6C3BFF',
            background: '#F3F0FF',
            padding: '4px 12px',
            borderRadius: '20px'
          }}>
            Selecciona tu número
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: expanded ? 'none' : '300px',
        overflowY: expanded ? 'visible' : 'auto',
        border: '1px solid #eee',
        borderRadius: '12px',
        padding: '12px'
      }}>
        {mostrarMiembros.map((miembro, index) => {
          const style = getPositionStyle(miembro.posicion, miembro.estado);
          const isSelected = selectedNumber === miembro.posicion;
          const isDisabled = miembro.estado === 'activo' || miembro.posicion === 1;
          const memberName = getMemberName(miembro);
          
          return (
            <div
              key={miembro.id || index}
              onClick={() => {
                if (canSelect && !isDisabled && onSelectNumber) {
                  onSelectNumber(miembro.posicion);
                }
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: isSelected ? '#F3F0FF' : '#f9f9f9',
                borderRadius: '10px',
                cursor: (canSelect && !isDisabled) ? 'pointer' : 'default',
                border: isSelected ? '2px solid #6C3BFF' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: style.background,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: style.color
                }}>
                  {miembro.posicion}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {memberName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{style.label}</div>
                </div>
              </div>
              {isSelected && (
                <span style={{ color: '#6C3BFF', fontSize: '20px' }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      {tieneMas && (
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
          {expanded ? 'Ver menos ▲' : `Ver más (${miembros.length - 10} más) ▼`}
        </button>
      )}
    </div>
  );
}