
export type ToppingType = 'ketchup' | 'cheese' | 'olives';

export interface Topping {
  id: string;
  type: ToppingType;
  x: number; // percentage
  y: number; // percentage
  rotation: number;
}

export type Order = Record<ToppingType, number>;

export interface HighScore {
  id: number;
  name: string;
  score: number;
}

export enum GameState {
  NotStarted,
  InProgress,
  LevelComplete,
  GameOver,
}
