import type { Board, Difficulty } from '../types/game';
import { getNeighbors } from './board';
import { revealCell } from './reveal';

export function chordClick(board: Board, difficulty: Difficulty, row: number, col: number): Board {
  const { cols } = difficulty;
  const idx = row * cols + col;
  const cell = board[idx];

  // Only chord on revealed numbered cells
  if (cell.state !== 'revealed' || cell.isMine || cell.neighborCount === 0) return board;

  const neighbors = getNeighbors(board, difficulty, row, col);
  const flaggedCount = neighbors.filter((n) => n.state === 'flagged').length;

  if (flaggedCount !== cell.neighborCount) return board;

  // Reveal all hidden unflagged neighbors
  let current = board;
  for (const n of neighbors) {
    if (n.state === 'hidden') {
      current = revealCell(current, difficulty, n.row, n.col);
    }
  }
  return current;
}
