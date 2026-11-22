import React from 'react';

interface GoldenSealBadgeProps {
  number: number;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GoldenSealBadge: React.FC<GoldenSealBadgeProps> = ({
  number,
  unlocked,
  size = 'md',
}) => {
  const dim =
    size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${dim} ${
        unlocked ? 'drop-shadow-[0_6px_18px_rgba(251,191,36,0.45)]' : 'opacity-45'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id={`sealGrad-${number}-${unlocked}`} cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor={unlocked ? '#FEF08A' : '#64748B'} />
            <stop offset="55%" stopColor={unlocked ? '#F59E0B' : '#475569'} />
            <stop offset="100%" stopColor={unlocked ? '#B45309' : '#334155'} />
          </radialGradient>
        </defs>
        <path
          d="M50 4 L59 12 L71 8 L76 19 L88 20 L88 32 L96 41 L91 52 L96 63 L87 70 L86 82 L74 84 L68 94 L56 91 L46 97 L36 90 L24 92 L19 81 L8 78 L9 66 L2 56 L8 45 L4 33 L14 27 L17 15 L29 14 L37 5 L47 10 Z"
          fill={`url(#sealGrad-${number}-${unlocked})`}
          stroke={unlocked ? '#FDE68A' : '#475569'}
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="31"
          fill="none"
          stroke={unlocked ? '#78350F' : '#1E293B'}
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        {unlocked ? (
          <path
            d="M50 26 L56 41 L72 42 L59 52 L64 68 L50 58 L36 68 L41 52 L28 42 L44 41 Z"
            fill="#FFFBEB"
          />
        ) : (
          <text
            x="50"
            y="57"
            textAnchor="middle"
            fontSize="24"
            fontWeight="700"
            fill="#CBD5E1"
          >
            {number}
          </text>
        )}
      </svg>
    </div>
  );
};
