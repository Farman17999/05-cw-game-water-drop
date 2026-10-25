import React from 'react';

interface GameOverModalProps {
  score: number;
  isWon: boolean;
  message: string;
  onPlayAgain: () => void;
  onReset: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  isWon,
  message,
  onPlayAgain,
  onReset,
}) => {
  return (
    <div id="game-over-modal" className="game-overlay">
      <div className="overlay-card modal-card" id="modal-card">
        <div id="modal-icon" className="modal-emoji">
          {isWon ? '🏆' : '💧'}
        </div>
        <h2 id="modal-title" className="overlay-title">
          {isWon ? 'You Won!' : 'Good Effort!'}
        </h2>
        <div className="modal-score-summary">
          <span className="summary-label">Final Score:</span>
          <span id="final-score" className="summary-number">
            {score}
          </span>
        </div>
        <p id="modal-message" className="modal-description">
          {message}
        </p>
        <div className="modal-impact-note" id="modal-impact-note">
          💧 <strong>Did you know?</strong> 703 million people lack basic access to clean water. Every action builds awareness!
        </div>
        <div className="modal-actions">
          <button
            id="play-again-btn"
            className="game-btn primary-start-btn"
            onClick={onPlayAgain}
          >
            Play Again
          </button>
          <button
            id="modal-reset-btn"
            className="game-btn reset-btn"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
