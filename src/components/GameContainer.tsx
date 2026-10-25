import React, { useRef } from 'react';
import { FallingItem, ScorePopup } from '../types';

interface GameContainerProps {
  items: FallingItem[];
  popups: ScorePopup[];
  isShaking: boolean;
  onItemClick: (item: FallingItem, event: React.PointerEvent<HTMLDivElement>) => void;
  onItemAnimationEnd: (itemId: string) => void;
  children?: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  items,
  popups,
  isShaking,
  onItemClick,
  onItemAnimationEnd,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      id="game-container"
      className={isShaking ? 'container-shake' : ''}
      tabIndex={0}
      role="region"
      aria-label="Water Drop Play Area"
    >
      {/* Background Water Waves at the bottom */}
      <div className="water-surface" />

      {/* Falling Items */}
      {items.map((item) => {
        if (item.type === 'good') {
          return (
            <div
              key={item.id}
              className={`water-drop ${item.isPopping ? 'popping' : ''}`}
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                left: `${item.x}%`,
                animationDuration: `${item.speed}s`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onItemClick(item, e);
              }}
              onAnimationEnd={() => {
                if (!item.isPopping) {
                  onItemAnimationEnd(item.id);
                }
              }}
            />
          );
        }

        if (item.type === 'bad') {
          return (
            <div
              key={item.id}
              className={`water-drop bad-drop ${item.isPopping ? 'popping' : ''}`}
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                left: `${item.x}%`,
                animationDuration: `${item.speed}s`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onItemClick(item, e);
              }}
              onAnimationEnd={() => {
                if (!item.isPopping) {
                  onItemAnimationEnd(item.id);
                }
              }}
            />
          );
        }

        if (item.type === 'can') {
          return (
            <div
              key={item.id}
              className={`water-can-item ${item.isPopping ? 'popping' : ''}`}
              style={{
                width: `${item.size}px`,
                height: `${item.size}px`,
                left: `${item.x}%`,
                animationDuration: `${item.speed}s`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onItemClick(item, e);
              }}
              onAnimationEnd={() => {
                if (!item.isPopping) {
                  onItemAnimationEnd(item.id);
                }
              }}
            >
              <img
                src="/img/water-can-transparent.png"
                alt="charity: water jerry can"
                draggable={false}
              />
            </div>
          );
        }

        return null;
      })}

      {/* Floating score popups */}
      {popups.map((popup) => (
        <div
          key={popup.id}
          className={`score-popup ${popup.className}`}
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
          }}
        >
          {popup.text}
        </div>
      ))}

      {/* Overlays / Modals / Confetti */}
      {children}
    </div>
  );
};
