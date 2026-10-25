import React from 'react';

interface WelcomeOverlayProps {
  onStart: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onStart }) => {
  return (
    <div id="welcome-overlay" className="game-overlay">
      <div className="overlay-card">
        <img
          src="/img/water-can-transparent.png"
          alt="charity: water jerry can"
          className="overlay-can-icon"
        />
        <h2 className="overlay-title">Ready to bring clean water?</h2>
        <p className="overlay-text">
          Tap or click falling clean drops and bonus jerry cans before they hit the ground.
          Avoid contaminated drops! Reach <strong>20 points</strong> in 30 seconds to win.
        </p>
        <button
          id="overlay-start-btn"
          className="game-btn primary-start-btn"
          onClick={onStart}
        >
          Start Playing
        </button>
      </div>
    </div>
  );
};
