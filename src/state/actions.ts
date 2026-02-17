import type { DifficultyKey } from '../types/game';

export type GameAction =
  | { type: 'SET_DIFFICULTY'; payload: DifficultyKey }
  | { type: 'REVEAL_CELL';    payload: { row: number; col: number } }
  | { type: 'FLAG_CELL';      payload: { row: number; col: number } }
  | { type: 'CHORD_CLICK';    payload: { row: number; col: number } }
  | { type: 'RESET_GAME' }
  | { type: 'TICK' };
