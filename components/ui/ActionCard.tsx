"use client";

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

export function ActionCard({ icon, title, subtitle, onClick }: ActionCardProps) {
  return (
    <div 
      onClick={onClick}
      className="
        flex items-center justify-between
        bg-white rounded-[20px] px-[22px] py-5
        shadow-card border border-white/90
        cursor-pointer transition-all duration-150
        hover:-translate-y-0.5 hover:shadow-card-hover
        group
      "
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-[14px] bg-primaryLight flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-bold text-textMain mb-0.5 tracking-tight">{title}</p>
          <p className="text-[13px] text-textMuted font-normal">{subtitle}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#F5F4FA] flex items-center justify-center shrink-0 group-hover:bg-primaryLight transition-colors">
        <svg width={11} height={11} fill="none" viewBox="0 0 24 24"
          stroke="#9895B4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
