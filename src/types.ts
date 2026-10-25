export type ItemType = 'good' | 'bad' | 'can';

export interface FallingItem {
  id: string;
  type: ItemType;
  x: number; // percentage or px
  size: number;
  speed: number; // duration in seconds
  isPopping?: boolean;
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  text: string;
  className: string;
}

export interface ConfettiPiece {
  id: string;
  color: string;
  left: number;
  isCircle: boolean;
  duration: number;
  delay: number;
}
