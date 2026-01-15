
export interface BackgroundInfo {
  id: string;
  url: string;
  label: string;
  prompt: string;
  emoji: string;
}

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED'
}

export interface GameSettings {
  brushSize: number;
  wipesRequired: number; // How many passes to clear a spot
}
