import React from 'react';

const FLAKES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 3.7 + (i % 5) * 4) % 100}%`,
  size: 4 + (i % 4) * 2,
  duration: 11 + (i % 7) * 2.5,
  delay: -(i * 1.1) % 12,
  opacity: 0.25 + (i % 4) * 0.14,
}));

export const SnowfallOverlay: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
    >
      {FLAKES.map((flake) => (
        <span
          key={flake.id}
          className="animate-snowfall absolute top-0 rounded-full bg-white"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
          }}
        />
      ))}
    </div>
  );
};
