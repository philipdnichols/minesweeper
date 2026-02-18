export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  neighborCount: number;
  state: CellState;
}

export type Board = ReadonlyArray<Cell>;

export type DifficultyKey = 'beginner' | 'intermediate' | 'expert';

export interface Difficulty {
  key: DifficultyKey;
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Record<DifficultyKey, Difficulty> = {
  beginner: { key: 'beginner', label: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { key: 'intermediate', label: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { key: 'expert', label: 'Expert', rows: 16, cols: 30, mines: 99 },
};

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GameState {
  difficulty: Difficulty;
  board: Board;
  status: GameStatus;
  minesRemaining: number;
  elapsedSeconds: number;
}
