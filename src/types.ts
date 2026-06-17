export interface Fraction {
  num: number; // Numerator
  den: number; // Denominator
}

export interface CardItem {
  id: string; // Unique id for the card instances
  value: Fraction; // Numeric value as exact fraction
  expression: string; // Expression representation (e.g. "8", "(3 + 4)")
  originalNumbers: number[]; // Track original indices used to construct this card (for undo and verification)
}

export interface HistoryItem {
  id: string;
  numbers: number[];
  solution: string;
  userExpression: string;
  isSolved: boolean;
  timeTaken: number; // in seconds
  passed: boolean;
}

export type GameStatus = 'idle' | 'playing' | 'gameover';
export type GameMode = 'challenge' | 'practice';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'veryhard';
