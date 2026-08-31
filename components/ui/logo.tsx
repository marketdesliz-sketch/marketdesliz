"use client";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { width: 48, height: 30 },
    md: { width: 72, height: 44 },
    lg: { width: 100, height: 60 },
    xl: { width: 140, height: 85 },
  };

  const { width, height } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} viewBox="0 0 120 70" fill="none">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B2BE0" />
            <stop offset="60%" stopColor="#7B3FEE" />
            <stop offset="100%" stopColor="#9B5AFF" />
          </linearGradient>
        </defs>
        <path
          d="M8 54 C8 28 16 14 26 14 C36 14 36 30 36 38
             C36 46 40 54 50 54 C60 54 60 38 60 30
             C60 22 66 14 76 14 C86 14 90 22 92 32
             C94 40 94 50 100 54 C106 58 112 52 112 44"
          stroke="url(#logoGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className="font-display font-bold text-xl text-textMain tracking-tight">
          Market<span className="text-primary">Desliz</span>
        </span>
      )}
    </div>
  );
}