import { describe, it, expect } from 'vitest';
import { toggleFlag } from './flag';
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

describe('toggleFlag', () => {
  it('hidden → flagged returns delta +1', () => {
    const board = makeBoard([]);
    const [newBoard, delta] = toggleFlag(board, D.cols, 2, 2);
    expect(delta).toBe(1);
    expect(newBoard[cellIndex(D.cols, 2, 2)].state).toBe('flagged');
  });

  it('flagged → hidden returns delta -1', () => {
    const board = makeBoard([{ row: 2, col: 2, state: 'flagged' }]);
    const [newBoard, delta] = toggleFlag(board, D.cols, 2, 2);
    expect(delta).toBe(-1);
    expect(newBoard[cellIndex(D.cols, 2, 2)].state).toBe('hidden');
  });

  it('revealed cell returns delta 0 and same board reference', () => {
    const board = makeBoard([{ row: 2, col: 2, state: 'revealed' }]);
    const [newBoard, delta] = toggleFlag(board, D.cols, 2, 2);
    expect(delta).toBe(0);
    expect(newBoard).toBe(board);
  });

  it('other cells are not mutated when flagging', () => {
    const board = makeBoard([]);
    const [newBoard] = toggleFlag(board, D.cols, 2, 2);
    // Spot check a different cell
    expect(newBoard[cellIndex(D.cols, 0, 0)].state).toBe('hidden');
    expect(newBoard[cellIndex(D.cols, 4, 4)].state).toBe('hidden');
  });

  it('other cells are not mutated when unflagging', () => {
    const board = makeBoard([
      { row: 2, col: 2, state: 'flagged' },
      { row: 0, col: 0, state: 'flagged' },
    ]);
    const [newBoard] = toggleFlag(board, D.cols, 2, 2);
    // Other flagged cell should stay flagged
    expect(newBoard[cellIndex(D.cols, 0, 0)].state).toBe('flagged');
  });

  it('returns a new board array when state changes', () => {
    const board = makeBoard([]);
    const [newBoard] = toggleFlag(board, D.cols, 2, 2);
    expect(newBoard).not.toBe(board);
  });
});
