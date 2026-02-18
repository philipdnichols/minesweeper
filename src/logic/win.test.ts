import { describe, it, expect } from 'vitest';
import { checkWin, checkLoss, flagAllMines } from './win';
import { cellIndex, createEmptyBoard } from './board';
import type { Board, Cell, Difficulty } from '../types/game';

const D: Difficulty = { key: 'beginner', label: 'Beginner', rows: 3, cols: 3, mines: 1 };

function makeBoard(overrides: Partial<Cell>[]): Board {
  const base = createEmptyBoard(D);
  const cells = base.slice() as Cell[];
  for (const o of overrides) {
    const idx = cellIndex(D.cols, o.row!, o.col!);
    cells[idx] = { ...cells[idx], ...o };
  }
  return cells;
}

describe('checkWin', () => {
  it('returns true when all non-mine cells are revealed', () => {
    // 3x3 board: mine at (0,0), all others revealed
    const board = makeBoard([
      { row: 0, col: 0, isMine: true },
      { row: 0, col: 1, state: 'revealed' },
      { row: 0, col: 2, state: 'revealed' },
      { row: 1, col: 0, state: 'revealed' },
      { row: 1, col: 1, state: 'revealed' },
      { row: 1, col: 2, state: 'revealed' },
      { row: 2, col: 0, state: 'revealed' },
      { row: 2, col: 1, state: 'revealed' },
      { row: 2, col: 2, state: 'revealed' },
    ]);
    expect(checkWin(board)).toBe(true);
  });

  it('returns false when some non-mine cells remain hidden', () => {
    const board = makeBoard([{ row: 0, col: 0, isMine: true }]);
    expect(checkWin(board)).toBe(false);
  });

  it('flagged non-mine cell counts as not-won', () => {
    // All cells accounted for except (1,0) which is flagged (not a mine)
    const board = makeBoard([
      { row: 0, col: 0, isMine: true },
      { row: 0, col: 1, state: 'revealed' },
      { row: 0, col: 2, state: 'revealed' },
      { row: 1, col: 0, state: 'flagged' }, // not a mine!
      { row: 1, col: 1, state: 'revealed' },
      { row: 1, col: 2, state: 'revealed' },
      { row: 2, col: 0, state: 'revealed' },
      { row: 2, col: 1, state: 'revealed' },
      { row: 2, col: 2, state: 'revealed' },
    ]);
    expect(checkWin(board)).toBe(false);
  });
});

describe('checkLoss', () => {
  it('returns true when a mine is revealed', () => {
    const board = makeBoard([{ row: 0, col: 0, isMine: true, state: 'revealed' }]);
    expect(checkLoss(board)).toBe(true);
  });

  it('returns false when no mines are revealed', () => {
    const board = makeBoard([{ row: 0, col: 0, isMine: true }]);
    expect(checkLoss(board)).toBe(false);
  });

  it('returns false for a flagged mine', () => {
    const board = makeBoard([{ row: 0, col: 0, isMine: true, state: 'flagged' }]);
    expect(checkLoss(board)).toBe(false);
  });
});

describe('flagAllMines', () => {
  it('flags unflagged mines', () => {
    const board = makeBoard([{ row: 0, col: 0, isMine: true }]);
    const result = flagAllMines(board);
    expect(result[cellIndex(D.cols, 0, 0)].state).toBe('flagged');
  });

  it('already-flagged mine stays flagged', () => {
    const board = makeBoard([{ row: 0, col: 0, isMine: true, state: 'flagged' }]);
    const result = flagAllMines(board);
    expect(result[cellIndex(D.cols, 0, 0)].state).toBe('flagged');
  });

  it('non-mine cells are not changed', () => {
    const board = makeBoard([
      { row: 0, col: 0, isMine: true },
      { row: 0, col: 1, state: 'revealed' },
    ]);
    const result = flagAllMines(board);
    expect(result[cellIndex(D.cols, 0, 1)].state).toBe('revealed');
    expect(result[cellIndex(D.cols, 1, 0)].state).toBe('hidden');
  });
});
