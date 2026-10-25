import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameHeader } from './components/GameHeader';
import { ScorePanel } from './components/ScorePanel';
import { GameContainer } from './components/GameContainer';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { GameOverModal } from './components/GameOverModal';
import { Confetti } from './components/Confetti';
import { FallingItem, ScorePopup } from './types';
import { playSound, initAudio } from './utils/sound';
import { winningMessages, losingMessages } from './utils/messages';

type GameState = 'welcome' | 'playing' | 'gameover';

export const App: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scoreBumpClass, setScoreBumpClass] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const [endMessage, setEndMessage] = useState<string>('');
  const [isWon, setIsWon] = useState<boolean>(false);

  const gameTimerRef = useRef<number | null>(null);
  const dropMakerRef = useRef<number | null>(null);
  const scoreBumpTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);

  // Load high score from localStorage on initial mount
  useEffect(() => {
    try {
      const savedScore = localStorage.getItem('cw_water_drop_highscore');
      if (savedScore !== null) {
        setHighScore(parseInt(savedScore, 10) || 0);
      }
    } catch {
      // LocalStorage access may be restricted in sandboxes
    }
  }, []);

  // Update high score helper
  const checkAndUpdateHighScore = useCallback((finalScore: number) => {
    setHighScore((prev) => {
      if (finalScore > prev) {
        try {
          localStorage.setItem('cw_water_drop_highscore', `${finalScore}`);
        } catch {
          // ignore
        }
        return finalScore;
      }
      return prev;
    });
  }, []);

  // Visual score bump effect
  const triggerScoreBump = (change: number) => {
    if (scoreBumpTimeoutRef.current) {
      window.clearTimeout(scoreBumpTimeoutRef.current);
    }
    setScoreBumpClass(change > 0 ? 'score-bump' : 'score-drop');
    scoreBumpTimeoutRef.current = window.setTimeout(() => {
      setScoreBumpClass('');
    }, 200);
  };

  // Screen shake on penalty
  const triggerScreenShake = () => {
    if (shakeTimeoutRef.current) {
      window.clearTimeout(shakeTimeoutRef.current);
    }
    setIsShaking(false);
    // Restart animation on next frame
    window.requestAnimationFrame(() => {
      setIsShaking(true);
      shakeTimeoutRef.current = window.setTimeout(() => {
        setIsShaking(false);
      }, 350);
    });
  };

  // End Game handler
  const endGame = useCallback((finalScore: number) => {
    if (dropMakerRef.current) {
      clearInterval(dropMakerRef.current);
      dropMakerRef.current = null;
    }
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }

    setItems([]);
    checkAndUpdateHighScore(finalScore);

    const won = finalScore >= 20;
    setIsWon(won);

    if (won) {
      const randomIndex = Math.floor(Math.random() * winningMessages.length);
      setEndMessage(winningMessages[randomIndex]);
      playSound('win', soundEnabled);
    } else {
      const randomIndex = Math.floor(Math.random() * losingMessages.length);
      setEndMessage(losingMessages[randomIndex]);
    }

    setGameState('gameover');
  }, [checkAndUpdateHighScore, soundEnabled]);

  // Spawn falling item (clean drop, bad drop, or jerry can)
  const spawnItem = useCallback(() => {
    const roll = Math.random();
    let type: 'good' | 'bad' | 'can' = 'good';
    let size = 55;
    let speed = 3.6;

    if (roll < 0.65) {
      // 65% chance: Clean Water Drop (+1)
      type = 'good';
      const sizeMultiplier = Math.random() * 0.4 + 0.8;
      size = Math.round(55 * sizeMultiplier);
      speed = parseFloat((Math.random() * 1.0 + 3.2).toFixed(2));
    } else if (roll < 0.85) {
      // 20% chance: Contaminated Sludge Drop (-2)
      type = 'bad';
      size = 52;
      speed = parseFloat((Math.random() * 0.8 + 2.8).toFixed(2));
    } else {
      // 15% chance: Bonus Jerry Can (+5)
      type = 'can';
      size = 60;
      speed = parseFloat((Math.random() * 1.0 + 3.4).toFixed(2));
    }

    // Keep horizontal position between 3% and 88% to avoid overflowing
    const xPos = Math.max(3, Math.min(88, Math.random() * 88 + 3));

    const newItem: FallingItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      type,
      x: xPos,
      size,
      speed,
      isPopping: false,
    };

    setItems((prev) => [...prev, newItem]);
  }, []);

  // Start / Restart Game
  const startGame = useCallback(() => {
    initAudio();

    if (dropMakerRef.current) clearInterval(dropMakerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setItems([]);
    setPopups([]);
    setScore(0);
    setTimeLeft(30);
    setScoreBumpClass('');
    setIsShaking(false);
    setGameState('playing');

    // Interval to spawn drops every 750ms
    dropMakerRef.current = window.setInterval(() => {
      spawnItem();
    }, 750);
  }, [spawnItem]);

  // Countdown timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    gameTimerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
    };
  }, [gameState]);

  // Watch for timer hitting 0 to end game
  useEffect(() => {
    if (gameState === 'playing' && timeLeft === 0) {
      endGame(score);
    }
  }, [timeLeft, gameState, score, endGame]);

  // Reset Game completely
  const resetGame = useCallback(() => {
    if (dropMakerRef.current) {
      clearInterval(dropMakerRef.current);
      dropMakerRef.current = null;
    }
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }

    setItems([]);
    setPopups([]);
    setScore(0);
    setTimeLeft(30);
    setScoreBumpClass('');
    setIsShaking(false);
    setGameState('welcome');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dropMakerRef.current) clearInterval(dropMakerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (scoreBumpTimeoutRef.current) window.clearTimeout(scoreBumpTimeoutRef.current);
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  // Item Click / Collect interaction
  const handleItemClick = (item: FallingItem, event: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || item.isPopping) return;

    // Get click location relative to game container
    const container = document.getElementById('game-container');
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Trigger visual pop on the clicked item
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isPopping: true } : i))
    );

    // Remove popped item after 150ms
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }, 150);

    let pointDelta = 0;
    let popupClass = '';
    let popupText = '';

    if (item.type === 'good') {
      pointDelta = 1;
      popupText = '+1';
      popupClass = 'plus-one';
      playSound('drop', soundEnabled);
    } else if (item.type === 'can') {
      pointDelta = 5;
      popupText = '+5';
      popupClass = 'plus-five';
      playSound('can', soundEnabled);
    } else if (item.type === 'bad') {
      pointDelta = -2;
      popupText = '-2';
      popupClass = 'minus-two';
      playSound('bad', soundEnabled);
      triggerScreenShake();
    }

    // Update score
    setScore((prev) => Math.max(0, prev + pointDelta));
    triggerScoreBump(pointDelta);

    // Create floating score popup
    const popupId = `popup-${Date.now()}-${Math.random()}`;
    const newPopup: ScorePopup = {
      id: popupId,
      x: clickX,
      y: clickY,
      text: popupText,
      className: popupClass,
    };

    setPopups((prev) => [...prev, newPopup]);

    // Remove popup after animation ends (650ms)
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 650);
  };

  // Remove item when it falls out of view
  const handleItemAnimationEnd = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  return (
    <div className="game-wrapper">
      {/* charity: water Branding & Header */}
      <GameHeader />

      {/* Score & Control Panel */}
      <ScorePanel
        score={score}
        timeLeft={timeLeft}
        highScore={highScore}
        gameRunning={gameState === 'playing'}
        soundEnabled={soundEnabled}
        scoreBumpClass={scoreBumpClass}
        onStart={startGame}
        onReset={resetGame}
        onToggleSound={toggleSound}
      />

      {/* Main Game Area */}
      <GameContainer
        items={items}
        popups={popups}
        isShaking={isShaking}
        onItemClick={handleItemClick}
        onItemAnimationEnd={handleItemAnimationEnd}
      >
        {/* Welcome Overlay */}
        {gameState === 'welcome' && (
          <WelcomeOverlay onStart={startGame} />
        )}

        {/* Game Over Modal */}
        {gameState === 'gameover' && (
          <>
            {isWon && <Confetti />}
            <GameOverModal
              score={score}
              isWon={isWon}
              message={endMessage}
              onPlayAgain={startGame}
              onReset={resetGame}
            />
          </>
        )}
      </GameContainer>

      {/* charity: water Impact Footer */}
      <footer className="game-footer">
        <p>100% of public donations fund clean water projects. Clean water changes everything.</p>
      </footer>
    </div>
  );
};

export default App;
