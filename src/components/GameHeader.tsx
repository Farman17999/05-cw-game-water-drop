import React from 'react';

export const GameHeader: React.FC = () => {
  return (
    <header className="game-header">
      <div className="brand-bar">
        <img
          src="/img/cw_logo-horizontal.png"
          alt="charity: water logo"
          className="brand-logo"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src.indexOf('cw_logo-horizontal.png') !== -1) {
              target.src = '/img/cw_logo.png';
            }
          }}
        />
      </div>
      <h1 className="game-title">Water Drop Game</h1>
      <p className="game-tagline">Catch clean drops and iconic yellow jerry cans. Avoid murky drops!</p>

      {/* Quick Rules & Point Legend */}
      <div className="game-legend">
        <div className="legend-item">
          <span className="legend-badge drop-badge">💧</span> Clean Drop: <strong>+1 pt</strong>
        </div>
        <div className="legend-item">
          <span className="legend-badge can-badge">🛢️</span> Jerry Can: <strong>+5 pts</strong>
        </div>
        <div className="legend-item">
          <span className="legend-badge bad-badge">☣️</span> Murky Drop: <strong>-2 pts</strong>
        </div>
        <div className="legend-item target-item">
          <span className="legend-badge target-badge">🎯</span> Goal: <strong>20+ pts in 30s</strong>
        </div>
      </div>
    </header>
  );
};
