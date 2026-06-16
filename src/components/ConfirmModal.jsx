// src/components/ConfirmModal.jsx
import { useEffect, useState } from 'react';

export default function ConfirmModal({ 
  title, 
  message, 
  confirmText = 'Eliminar', 
  cancelText = 'Cancelar',
  onConfirm, 
  onCancel,
  type = 'danger' // danger, warning, info
}) {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      if (onCancel) onCancel();
    }, 200);
  };

  const handleConfirm = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      if (onConfirm) onConfirm();
    }, 200);
  };

  if (!visible) return null;

  const colors = {
    danger: {
      icon: '⚠️',
      button: 'bg-red-600 hover:bg-red-700',
      border: 'border-red-200'
    },
    warning: {
      icon: '⚠️',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      border: 'border-yellow-200'
    },
    info: {
      icon: 'ℹ️',
      button: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-200'
    }
  };

  const color = colors[type] || colors.danger;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all duration-200 ${closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Header */}
        <div className={`p-5 border-b ${color.border} flex items-center gap-3`}>
          <span className="text-3xl">{color.icon}</span>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition ${color.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}