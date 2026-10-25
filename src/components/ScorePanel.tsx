import React from 'react';

interface ScorePanelProps {
  score: number;
  timeLeft: number;
  highScore: number;
  gameRunning: boolean;
  soundEnabled: boolean;
  scoreBumpClass: string;
  onStart: () => void;
  onReset: () => void;
  onToggleSound: () => void;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({
  score,
  timeLeft,
  highScore,
  gameRunning,
  soundEnabled,
  scoreBumpClass,
  onStart,
  onReset,
  onToggleSound,
}) => {
  const isWarning = timeLeft <= 5 && gameRunning;

  return (
    <div className="score-panel" id="score-panel">
      <div className="stat-box">
        <span className="stat-label">Score</span>
        <span className={`stat-value score-text ${scoreBumpClass}`} id="score">
          {score}
        </span>
      </div>

      <div className="stat-box">
        <span className="stat-label">Time Remaining</span>
        <span className={`stat-value timer-text ${isWarning ? 'time-warning' : ''}`}>
          <span id="time">{timeLeft}</span>s
        </span>
      </div>

      <div className="stat-box">
        <span className="stat-label">High Score</span>
        <span className="stat-value high-score-text" id="high-score">
          {highScore}
        </span>
      </div>

      <div className="controls-box">
        <button
          id="start-btn"
          className="game-btn start-btn"
          aria-label="Start Game"
          disabled={gameRunning}
          onClick={onStart}
        >
          {gameRunning ? 'Playing...' : 'Start Game'}
        </button>
        <button
          id="reset-btn"
          className="game-btn reset-btn"
          aria-label="Reset Game"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          id="sound-btn"
          className="game-btn sound-btn"
          title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
          aria-label="Toggle Sound"
          onClick={onToggleSound}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  );
};
