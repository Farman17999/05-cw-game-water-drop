import React, { useMemo } from 'react';

const COLORS = ['#FFC907', '#2E9DF7', '#4FCB53', '#8BD1CB', '#FF902A', '#F16061'];
const TOTAL_PIECES = 60;

export const Confetti: React.FC = () => {
  const pieces = useMemo(() => {
    return Array.from({ length: TOTAL_PIECES }).map((_, index) => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const left = Math.random() * 95; // percentage
      const isCircle = Math.random() > 0.5;
      const duration = (Math.random() * 1.5 + 2.0).toFixed(2);
      const delay = (Math.random() * 0.8).toFixed(2);

      return {
        id: `confetti-${index}-${Date.now()}`,
        color,
        left,
        isCircle,
        duration,
        delay,
      };
    });
  }, []);

  return (
    <div id="confetti-container" className="confetti-container" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            top: '-10px',
            borderRadius: piece.isCircle ? '50%' : '2px',
            width: piece.isCircle ? '12px' : '8px',
            height: piece.isCircle ? '12px' : '14px',
            animationDuration: `${piece.duration}s`,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
