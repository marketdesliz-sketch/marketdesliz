// src/components/checkout/DateTimeSelector.jsx
import { useState } from 'react';

export default function DateTimeSelector({ type, onConfirm, onBack }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generar fechas disponibles (próximos 14 días, sin domingos)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Excluir domingos
      if (date.getDay() !== 0) {
        const dateValue = date.toISOString().split('T')[0];
        const isToday = i === 1;
        const isTomorrow = i === 1 && date.getDay() === (today.getDay() + 1) % 7;
        
        let label = date.toLocaleDateString('es-MX', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        });
        
        // Destacar mañana
        if (i === 1 && date.getDay() !== 0) {
          label = 'Mañana';
        }
        
        dates.push({
          value: dateValue,
          label: label,
          fullLabel: date.toLocaleDateString('es-MX', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })
        });
      }
    }
    return dates;
  };

  // Horarios disponibles (8:00 AM a 7:00 PM)
  const morningSlots = ['08:00', '09:00', '10:00', '11:00'];
  const afternoonSlots = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  const getSelectedDateLabel = () => {
    if (!selectedDate) return '';
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!selectedDate) {
      setError('Por favor selecciona una fecha para tu visita.');
      return;
    }
    if (!selectedTime) {
      setError('Por favor selecciona una hora disponible.');
      return;
    }
    
    setLoading(true);
    try {
      await onConfirm({ 
        date: selectedDate, 
        time: selectedTime, 
        notes: notes.trim() || '' 
      });
    } catch (err) {
      setError('Error al agendar. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const isDateSelected = (dateValue) => selectedDate === dateValue;
  const isTimeSelected = (time) => selectedTime === time;

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: type === 'visita' 
            ? 'linear-gradient(135deg, #6C3BFF, #8B5CF6)' 
            : 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: type === 'visita'
            ? '0 8px 24px rgba(108, 59, 255, 0.3)'
            : '0 8px 24px rgba(16, 185, 129, 0.3)'
        }}>
          <span style={{ fontSize: '32px' }}>
            {type === 'visita' ? '🏠' : '📦'}
          </span>
        </div>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          marginBottom: '6px',
          color: '#1a1a1a'
        }}>
          {type === 'visita' ? 'Agenda tu visita' : 'Agenda tu entrega'}
        </h3>
        <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
          {type === 'visita' 
            ? 'Un vendedor irá a tu domicilio para mostrarte el producto.'
            : 'Llevaremos el producto directamente a tu domicilio.'}
        </p>
      </div>

      {/* Resumen de selección */}
      {(selectedDate || selectedTime) && (
        <div style={{
          background: '#f0f4ff',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid #d0d8ff'
        }}>
          <span>📅</span>
          <span style={{ color: '#333' }}>
            {selectedDate ? getSelectedDateLabel() : 'Selecciona una fecha'}
            {selectedTime && ` a las ${selectedTime} hrs`}
          </span>
        </div>
      )}

      {/* Selección de fecha */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px', 
          fontWeight: '600',
          fontSize: '15px',
          color: '#333'
        }}>
          <span>📅</span> Selecciona una fecha <span style={{ color: '#e53935' }}>*</span>
        </label>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
          gap: '8px' 
        }}>
          {getAvailableDates().map(date => (
            <button
              key={date.value}
              onClick={() => {
                setSelectedDate(date.value);
                setError('');
              }}
              title={date.fullLabel}
              style={{
                padding: '12px 8px',
                background: isDateSelected(date.value) 
                  ? type === 'visita' ? '#6C3BFF' : '#10b981'
                  : '#f5f5f5',
                color: isDateSelected(date.value) ? 'white' : '#333',
                border: isDateSelected(date.value) 
                  ? '2px solid transparent' 
                  : '2px solid #e8e8e8',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: isDateSelected(date.value) ? 'bold' : '500',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => {
                if (!isDateSelected(date.value)) {
                  e.target.style.background = '#e8e8e8';
                  e.target.style.borderColor = '#d0d0d0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDateSelected(date.value)) {
                  e.target.style.background = '#f5f5f5';
                  e.target.style.borderColor = '#e8e8e8';
                }
              }}
            >
              {date.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
          * No se realizan visitas en domingo. Días disponibles: Lunes a Sábado.
        </p>
      </div>

      {/* Selección de hora */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px', 
          fontWeight: '600',
          fontSize: '15px',
          color: '#333'
        }}>
          <span>⏰</span> Selecciona una hora <span style={{ color: '#e53935' }}>*</span>
        </label>

        {/* Mañana */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: '500' }}>
            🌅 Mañana
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {morningSlots.map(time => (
              <button
                key={time}
                onClick={() => {
                  setSelectedTime(time);
                  setError('');
                }}
                style={{
                  padding: '10px',
                  background: isTimeSelected(time) 
                    ? type === 'visita' ? '#6C3BFF' : '#10b981'
                    : '#f5f5f5',
                  color: isTimeSelected(time) ? 'white' : '#333',
                  border: isTimeSelected(time) ? '2px solid transparent' : '2px solid #e8e8e8',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isTimeSelected(time) ? 'bold' : '500',
                  transition: 'all 0.15s ease'
                }}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Tarde */}
        <div>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: '500' }}>
            🌤️ Tarde
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {afternoonSlots.map(time => (
              <button
                key={time}
                onClick={() => {
                  setSelectedTime(time);
                  setError('');
                }}
                style={{
                  padding: '10px',
                  background: isTimeSelected(time) 
                    ? type === 'visita' ? '#6C3BFF' : '#10b981'
                    : '#f5f5f5',
                  color: isTimeSelected(time) ? 'white' : '#333',
                  border: isTimeSelected(time) ? '2px solid transparent' : '2px solid #e8e8e8',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isTimeSelected(time) ? 'bold' : '500',
                  transition: 'all 0.15s ease'
                }}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notas adicionales */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px', 
          fontWeight: '600',
          fontSize: '15px',
          color: '#333'
        }}>
          <span>📝</span> Notas adicionales
          <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Casa de color azul con portón negro, el timbre no funciona, tocar 3 veces..."
          rows="3"
          maxLength={200}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => e.target.style.borderColor = '#6C3BFF'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
        <p style={{ fontSize: '11px', color: '#999', marginTop: '4px', textAlign: 'right' }}>
          {notes.length}/200 caracteres
        </p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          disabled={loading}
          style={{
            flex: 1,
            padding: '14px',
            background: '#f5f5f5',
            color: '#666',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#e8e8e8')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#f5f5f5')}
        >
          ← Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedDate || !selectedTime || loading}
          style={{
            flex: 1.5,
            padding: '14px',
            background: (!selectedDate || !selectedTime || loading) 
              ? '#ccc' 
              : type === 'visita' ? '#6C3BFF' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: (!selectedDate || !selectedTime || loading) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: (!selectedDate || !selectedTime) ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (selectedDate && selectedTime && !loading) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="spinner-small"></span>
              Agendando...
            </span>
          ) : (
            `Confirmar ${type === 'visita' ? 'visita' : 'entrega'}`
          )}
        </button>
      </div>

      {/* Spinner pequeño */}
      <style>{`
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}