import type { Board, Cell, Difficulty } from '../types/game';
import { cellIndex, getNeighbors } from './board';

export function revealCell(board: Board, difficulty: Difficulty, row: number, col: number): Board {
  const { cols } = difficulty;
  const cells = board.slice() as Cell[];
  const idx = cellIndex(cols, row, col);

  if (cells[idx].state !== 'hidden') return board;

  const queue: number[] = [idx];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const cell = cells[current];
    if (cell.state !== 'hidden') continue;

    cells[current] = { ...cell, state: 'revealed' };

    // Flood-fill: only expand from zero-neighbor, non-mine cells
    if (!cell.isMine && cell.neighborCount === 0) {
      const neighbors = getNeighbors(cells, difficulty, cell.row, cell.col);
      for (const n of neighbors) {
        const nIdx = cellIndex(cols, n.row, n.col);
        if (!visited.has(nIdx) && cells[nIdx].state === 'hidden') {
          queue.push(nIdx);
        }
      }
    }
  }

  return cells;
}
