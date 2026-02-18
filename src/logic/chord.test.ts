import { describe, it, expect } from 'vitest';
import { chordClick } from './chord';
import { cellIndex, createEmptyBoard } from './board';
import type { Board, Cell, Difficulty } from '../types/game';

const D: Difficulty = { key: 'beginner', label: 'Beginner', rows: 5, cols: 5, mines: 1 };

function makeBoard(overrides: Partial<Cell>[]): Board {
  const base = createEmptyBoard(D);
  const cells = base.slice() as Cell[];
  for (const o of overrides) {
    const idx = cellIndex(D.cols, o.row!, o.col!);
    cells[idx] = { ...cells[idx], ...o };
  }
  return cells;
}

describe('chordClick', () => {
  it('no-op when flagCount does not equal neighborCount', () => {
    // Cell (2,2) is revealed with neighborCount=1 but no flags around it
    const board = makeBoard([{ row: 2, col: 2, state: 'revealed', neighborCount: 1 }]);
    const result = chordClick(board, D, 2, 2);
    expect(result).toBe(board);
  });

  it('no-op on hidden cell', () => {
    const board = makeBoard([{ row: 2, col: 2, state: 'hidden', neighborCount: 1 }]);
    const result = chordClick(board, D, 2, 2);
    expect(result).toBe(board);
  });

  it('no-op on cell with zero neighborCount', () => {
    const board = makeBoard([{ row: 2, col: 2, state: 'revealed', neighborCount: 0 }]);
    const result = chordClick(board, D, 2, 2);
    expect(result).toBe(board);
  });

  it('reveals hidden unflagged neighbors when flagCount matches neighborCount', () => {
    // (2,2) is revealed with neighborCount=1; (2,1) is flagged (the "mine"); (2,3) is hidden
    const board = makeBoard([
      { row: 2, col: 2, state: 'revealed', neighborCount: 1 },
      { row: 2, col: 1, state: 'flagged', isMine: true },
    ]);
    const result = chordClick(board, D, 2, 2);
    // (2,3) should be revealed since it was hidden and unflagged
    expect(result[cellIndex(D.cols, 2, 3)].state).toBe('revealed');
    expect(result).not.toBe(board);
  });

  it('flagged neighbors stay flagged after chord', () => {
    const board = makeBoard([
      { row: 2, col: 2, state: 'revealed', neighborCount: 1 },
      { row: 2, col: 1, state: 'flagged', isMine: true },
    ]);
    const result = chordClick(board, D, 2, 2);
    expect(result[cellIndex(D.cols, 2, 1)].state).toBe('flagged');
  });

  it('no-op when all neighbors are already revealed (no hidden to reveal)', () => {
    // Reveal all neighbors of (0,0) — corner has 3 neighbors
    const board = makeBoard([
      { row: 0, col: 0, state: 'revealed', neighborCount: 1 },
      { row: 0, col: 1, state: 'revealed' },
      { row: 1, col: 0, state: 'revealed' },
      // (1,1) needs to be flagged to match neighborCount=1
      { row: 1, col: 1, state: 'flagged', isMine: true },
    ]);
    const result = chordClick(board, D, 0, 0);
    // No hidden neighbors → nothing changes
    expect(result).toBe(board);
  });

  it('no-op on a mine cell even if revealed', () => {
    const board = makeBoard([
      { row: 2, col: 2, state: 'revealed', isMine: true, neighborCount: 1 },
    ]);
    const result = chordClick(board, D, 2, 2);
    expect(result).toBe(board);
  });
});
