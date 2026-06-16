// src/components/ToastNotification.jsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastNotification({
  message, type = 'success', duration = 3000,
  onClose, showGoToCart = false
}) {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setClosing(true);
      setTimeout(() => { setVisible(false); onClose?.(); }, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const config = {
    success: { icon: CheckCircle, bg: 'bg-[#10b981]' },
    error:   { icon: XCircle,     bg: 'bg-[#dc3545]' },
    info:    { icon: Info,         bg: 'bg-[#6C3BFF]' },
    warning: { icon: AlertTriangle,bg: 'bg-[#f59e0b]' },
  }[type];

  const Icon = config.icon;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setVisible(false); onClose?.(); }, 300);
  };

  return (
    <div className={`fixed bottom-5 right-5 z-[9999] transition-all duration-300 ${closing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
      <div className={`${config.bg} text-white rounded-2xl shadow-xl overflow-hidden min-w-[260px] max-w-xs`}>
        <div className="px-4 py-3.5 flex items-start gap-3">
          <Icon size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{message}</p>
            {showGoToCart && (
              <Link
                href="/carrito"
                className="text-xs text-white/80 hover:text-white underline mt-1 inline-block"
                onClick={handleClose}
              >
                Ver carrito →
              </Link>
            )}
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white shrink-0">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
