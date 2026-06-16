// src/components/checkout/ServiceSelector.jsx
import { useState } from 'react';
import { Banknote, CreditCard, Home, Truck } from 'lucide-react';

const formatMoney = (amount) => {
  if (!amount) return '';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0
  }).format(amount);
};

export default function ServiceSelector({ product, planCalculado, onSelect }) {
  const [selectedService, setSelectedService] = useState(null);
  const precioContado = product?.precio ? Math.round(product.precio * 2 / 3) : 0;

  const services = [
    {
      id: 'contado',
      icon: Banknote,
      title: 'Comprar a contado',
      description: 'Pago único con descuento',
      detail: formatMoney(precioContado),
      accent: '#10b981',
      bg: 'hover:border-[#10b981]/40 hover:bg-[#10b981]/5',
      activeBg: 'border-[#10b981] bg-[#10b981]/8',
      activeIcon: 'text-[#10b981]',
    },
    {
      id: 'credito',
      icon: CreditCard,
      title: 'Comprar a crédito',
      description: `Enganche + pagos semanales`,
      detail: planCalculado?.enganche ? `Desde ${formatMoney(planCalculado.enganche)}` : null,
      accent: '#6C3BFF',
      bg: 'hover:border-[#6C3BFF]/40 hover:bg-[#6C3BFF]/5',
      activeBg: 'border-[#6C3BFF] bg-[#6C3BFF]/8',
      activeIcon: 'text-[#6C3BFF]',
    },
    {
      id: 'visita',
      icon: Home,
      title: 'Solicitar visita',
      description: 'Un vendedor va a tu domicilio',
      detail: 'Sin costo',
      accent: '#0ea5e9',
      bg: 'hover:border-sky-300 hover:bg-sky-50',
      activeBg: 'border-sky-400 bg-sky-50',
      activeIcon: 'text-sky-500',
    },
    {
      id: 'entrega',
      icon: Truck,
      title: 'Solicitar entrega',
      description: 'Llevamos el producto a tu casa',
      detail: 'Paga al recibir',
      accent: '#f59e0b',
      bg: 'hover:border-amber-300 hover:bg-amber-50',
      activeBg: 'border-amber-400 bg-amber-50',
      activeIcon: 'text-amber-500',
    },
  ];

  const handleSelect = (serviceId) => {
    setSelectedService(serviceId);
    onSelect(serviceId);
  };

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      {services.map(({ id, icon: Icon, title, description, detail, bg, activeBg, activeIcon }) => {
        const isActive = selectedService === id;
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
              isActive ? activeBg : `border-gray-100 bg-white ${bg}`
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              isActive ? `bg-white shadow-sm` : 'bg-gray-50'
            }`}>
              <Icon size={18} className={isActive ? activeIcon : 'text-gray-400'} />
            </div>
            <p className={`text-sm font-bold leading-tight mb-1 ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              {title}
            </p>
            <p className="text-xs text-gray-400 leading-snug">{description}</p>
            {detail && (
              <p className={`text-xs font-bold mt-2 ${isActive ? activeIcon : 'text-gray-500'}`}>{detail}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}