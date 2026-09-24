// src/components/Logo.jsx
// Logo compartido · bold negro · soporta badge "Admin"

const T = {
  ink: '#0F0F0F',
  inkMid: 'rgba(15, 15, 15, 0.58)',
  inkFaint: 'rgba(15, 15, 15, 0.22)',
};

export default function Logo({
  color = T.ink,
  labelColor = T.inkMid,
  size = 22,
  withLabel = true,
  badge = '', // 'Admin' opcional
}) {
  return (
    <div className="flex items-baseline gap-3 select-none">
      <span
        className="font-bold leading-none tracking-tight"
        style={{ color, fontSize: `${size}px` }}
      >
        ʃƪʃƪ
      </span>
      {withLabel && (
        <span
          className="text-[13px] tracking-[-0.005em]"
          style={{ color: labelColor, fontWeight: 500 }}
        >
          MarketDesliz
        </span>
      )}
      {badge && (
        <span
          className="hidden sm:inline text-[10px] uppercase tracking-[0.18em]"
          style={{ color: T.inkFaint, fontWeight: 500 }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}