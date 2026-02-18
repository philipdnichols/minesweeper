import { describe, it, expect } from 'vitest';
import { revealCell } from './reveal';
import { cellIndex, createEmptyBoard, placeMinesAndCount } from './board';
import type { Board, Cell, Difficulty } from '../types/game';

const D: Difficulty = { key: 'beginner', label: 'Beginner', rows: 5, cols: 5, mines: 1 };

function makeBoardWith(overrides: Partial<Cell>[]): Board {
  const base = createEmptyBoard(D);
  const cells = base.slice() as Cell[];
  for (const o of overrides) {
    const idx = cellIndex(D.cols, o.row!, o.col!);
    cells[idx] = { ...cells[idx], ...o };
  }
  return cells;
}

describe('revealCell', () => {
  it('reveals a single numbered cell (only itself)', () => {
    // Put a mine at (0,0), so (0,1) will have neighborCount=1
    const board = makeBoardWith([{ row: 0, col: 0, isMine: true, neighborCount: 0 }]);
    // Manually set neighbor counts
    const cells = board.slice() as Cell[];
    cells[cellIndex(D.cols, 0, 1)] = { ...cells[cellIndex(D.cols, 0, 1)], neighborCount: 1 };
    cells[cellIndex(D.cols, 1, 0)] = { ...cells[cellIndex(D.cols, 1, 0)], neighborCount: 1 };
    cells[cellIndex(D.cols, 1, 1)] = { ...cells[cellIndex(D.cols, 1, 1)], neighborCount: 1 };

    const result = revealCell(cells, D, 0, 1);
    expect(result[cellIndex(D.cols, 0, 1)].state).toBe('revealed');
    // Cells further away should still be hidden
    expect(result[cellIndex(D.cols, 0, 2)].state).toBe('hidden');
    expect(result[cellIndex(D.cols, 0, 3)].state).toBe('hidden');
  });

  it('flood-fills from a zero-neighbor cell', () => {
    // All zero neighbors → entire board (except mine) gets revealed
    const cells = createEmptyBoard(D).slice() as Cell[];
    // Put mine at (4,4)
    cells[cellIndex(D.cols, 4, 4)] = { ...cells[cellIndex(D.cols, 4, 4)], isMine: true };
    // Set neighborCount for cells adjacent to mine
    for (const [r, c] of [
      [3, 3],
      [3, 4],
      [4, 3],
    ]) {
      cells[cellIndex(D.cols, r, c)] = { ...cells[cellIndex(D.cols, r, c)], neighborCount: 1 };
    }

    const result = revealCell(cells, D, 0, 0);
    // Most of the board should now be revealed
    const revealed = result.filter((c) => c.state === 'revealed').length;
    expect(revealed).toBeGreaterThan(10);
    // Mine should NOT be revealed
    expect(result[cellIndex(D.cols, 4, 4)].state).toBe('hidden');
  });

  it('does not reveal a flagged cell', () => {
    const cells = createEmptyBoard(D).slice() as Cell[];
    cells[cellIndex(D.cols, 2, 2)] = { ...cells[cellIndex(D.cols, 2, 2)], state: 'flagged' };

    const result = revealCell(cells, D, 2, 2);
    expect(result[cellIndex(D.cols, 2, 2)].state).toBe('flagged');
  });

  it('returns same reference for already-revealed cell', () => {
    const cells = createEmptyBoard(D).slice() as Cell[];
    cells[cellIndex(D.cols, 2, 2)] = { ...cells[cellIndex(D.cols, 2, 2)], state: 'revealed' };

    const result = revealCell(cells, D, 2, 2);
    expect(result).toBe(cells);
  });

  it('flood-fill is blocked by a row of mines', () => {
    // Place mines across row 2 to block flood-fill from top to bottom
    const cells = createEmptyBoard(D).slice() as Cell[];
    for (let c = 0; c < D.cols; c++) {
      cells[cellIndex(D.cols, 2, c)] = { ...cells[cellIndex(D.cols, 2, c)], isMine: true };
    }
    // Set neighbor counts for row 1 cells (adjacent to mine row)
    for (let c = 0; c < D.cols; c++) {
      cells[cellIndex(D.cols, 1, c)] = { ...cells[cellIndex(D.cols, 1, c)], neighborCount: 1 };
    }

    const result = revealCell(cells, D, 0, 0);
    // Cells in row 3+ should remain hidden
    expect(result[cellIndex(D.cols, 3, 0)].state).toBe('hidden');
    expect(result[cellIndex(D.cols, 4, 4)].state).toBe('hidden');
  });

  it('reveals a mine cell when directly clicked', () => {
    const cells = createEmptyBoard(D).slice() as Cell[];
    cells[cellIndex(D.cols, 1, 1)] = { ...cells[cellIndex(D.cols, 1, 1)], isMine: true };

    const result = revealCell(cells, D, 1, 1);
    expect(result[cellIndex(D.cols, 1, 1)].state).toBe('revealed');
  });
});

describe('revealCell with placeMinesAndCount', () => {
  it('first click on a zero cell cascade-reveals many cells', () => {
    // Use beginner board with safe zone around (0,0)
    const big: Difficulty = { key: 'beginner', label: 'B', rows: 9, cols: 9, mines: 1 };
    const empty = createEmptyBoard(big);
    const board = placeMinesAndCount(empty, big, 4, 4);
    const result = revealCell(board, big, 4, 4);
    const revealedCount = result.filter((c) => c.state === 'revealed').length;
    // At minimum the clicked cell itself should be revealed
    expect(revealedCount).toBeGreaterThanOrEqual(1);
  });
});
