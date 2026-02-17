import type { Board, Cell } from '../types/game';
import { cellIndex } from './board';

/** Returns [newBoard, flagDelta] where flagDelta is +1 (flagged) or -1 (unflagged) */
export function toggleFlag(board: Board, cols: number, row: number, col: number): [Board, number] {
  const idx = cellIndex(cols, row, col);
  const cell = board[idx];

  if (cell.state === 'revealed') return [board, 0];

  const cells = board.slice() as Cell[];
  if (cell.state === 'hidden') {
    cells[idx] = { ...cell, state: 'flagged' };
    return [cells, 1];
  } else {
    // flagged → hidden
    cells[idx] = { ...cell, state: 'hidden' };
    return [cells, -1];
  }
}
