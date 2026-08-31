export default function RightPanel() {
  return (
    <aside className="w-64 min-w-[16rem] flex flex-col gap-3 m-3 ml-0 overflow-y-auto">

      {/* Tu Resumen */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Tu resumen</h3>
          <span className="text-gray-400 cursor-pointer">👁</span>
        </div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">Deuda actual</p>
            <p className="text-2xl font-extrabold text-gray-900">
              $1,850.<span className="text-lg">00</span>
            </p>
          </div>
          <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-1">
            Al día
          </span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">Próximo pago</p>
            <p className="text-base font-bold text-gray-900">
              $100.<span className="text-sm">00</span>
            </p>
          </div>
          <p className="text-[10px] text-gray-400">📅 15 Mayo 2024</p>
        </div>
        <button className="w-full bg-primary hover:bg-primaryDark text-white font-semibold text-sm py-2.5 rounded-xl transition">
          Realizar pago
        </button>
      </div>

      {/* Mi Tarjeta Virtual */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Mi tarjeta virtual</h3>
        <div className="bg-gradient-to-br from-primary to-primaryDark rounded-2xl p-4 flex items-center justify-between mb-3">
          <div>
            <p className="text-white text-xs font-semibold">Mariana López García</p>
            <p className="text-white/70 text-[10px] mt-0.5">ID: MDZ-C01235678</p>
            <span className="inline-block mt-1.5 text-[9px] bg-yellow-400 text-yellow-900 font-semibold px-2 py-0.5 rounded-full">
              Nivel Oro
            </span>
          </div>
          <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center text-2xl">
            ▦
          </div>
        </div>
        <a href="/tarjeta" className="flex items-center justify-center gap-1.5 text-primary text-sm font-medium hover:underline">
          Ver mi tarjeta →
        </a>
      </div>

      {/* Mis Tandas Activas */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Mis tandas activas</h3>
          <a href="/tandas" className="text-primary text-xs font-medium hover:underline">Ver todas</a>
        </div>
        <div className="space-y-3">
          {TANDA_ACTIVITY.map((item, i) => (
            <div key={i}>
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 ${item.bg} rounded-full flex items-center justify-center flex-shrink-0 text-sm`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.sub}</p>
                </div>
                <span className={`text-[10px] whitespace-nowrap ${item.badgeCls}`}>{item.badge}</span>
              </div>
              {i < TANDA_ACTIVITY.length - 1 && (
                <div className="border-t border-gray-100 mt-3" />
              )}
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}

const TANDA_ACTIVITY = [
  { icon: "✓", bg: "bg-green-100", title: "Pago recibido", sub: "01 Mayo 2024", badge: "Posición #3", badgeCls: "text-primary font-medium" },
  { icon: "🛒", bg: "bg-primaryLight", title: "Compra realizada", sub: "Mesa para 6 personas", badge: "02 Mayo 2024", badgeCls: "text-gray-400" },
  { icon: "↑", bg: "bg-yellow-50", title: "¡Subiste de nivel!", sub: "Ahora eres Nivel Oro", badge: "01 Mayo 2024", badgeCls: "text-gray-400" },
];
