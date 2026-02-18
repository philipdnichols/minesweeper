import { describe, it, expect } from 'vitest';
import { cellIndex, createEmptyBoard, getNeighbors, placeMinesAndCount } from './board';
import type { Difficulty } from '../types/game';

const BEGINNER: Difficulty = { key: 'beginner', label: 'Beginner', rows: 9, cols: 9, mines: 10 };
const TINY: Difficulty = { key: 'beginner', label: 'Tiny', rows: 3, cols: 3, mines: 1 };

describe('cellIndex', () => {
  it('computes index correctly for first cell', () => {
    expect(cellIndex(9, 0, 0)).toBe(0);
  });

  it('computes index for last cell', () => {
    expect(cellIndex(9, 8, 8)).toBe(80);
  });

  it('computes index mid-board', () => {
    expect(cellIndex(9, 2, 3)).toBe(21);
  });

  it('handles different col widths', () => {
    expect(cellIndex(16, 3, 5)).toBe(53);
  });
});

describe('createEmptyBoard', () => {
  it('creates correct number of cells', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(board.length).toBe(81);
  });

  it('all cells start hidden', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(board.every((c) => c.state === 'hidden')).toBe(true);
  });

  it('no mines initially', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(board.every((c) => !c.isMine)).toBe(true);
  });

  it('all neighborCounts start at 0', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(board.every((c) => c.neighborCount === 0)).toBe(true);
  });

  it('cells have correct row/col', () => {
    const board = createEmptyBoard(TINY);
    expect(board[0].row).toBe(0);
    expect(board[0].col).toBe(0);
    expect(board[4].row).toBe(1);
    expect(board[4].col).toBe(1);
    expect(board[8].row).toBe(2);
    expect(board[8].col).toBe(2);
  });
});

describe('getNeighbors', () => {
  it('corner cell (0,0) has 3 neighbors', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(getNeighbors(board, BEGINNER, 0, 0)).toHaveLength(3);
  });

  it('edge cell (0,4) has 5 neighbors', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(getNeighbors(board, BEGINNER, 0, 4)).toHaveLength(5);
  });

  it('center cell (4,4) has 8 neighbors', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(getNeighbors(board, BEGINNER, 4, 4)).toHaveLength(8);
  });

  it('does not include the cell itself', () => {
    const board = createEmptyBoard(BEGINNER);
    const neighbors = getNeighbors(board, BEGINNER, 4, 4);
    const self = board[cellIndex(9, 4, 4)];
    expect(neighbors).not.toContain(self);
  });

  it('bottom-right corner has 3 neighbors', () => {
    const board = createEmptyBoard(BEGINNER);
    expect(getNeighbors(board, BEGINNER, 8, 8)).toHaveLength(3);
  });
});

describe('placeMinesAndCount', () => {
  it('places correct number of mines', () => {
    const empty = createEmptyBoard(BEGINNER);
    const board = placeMinesAndCount(empty, BEGINNER, 4, 4);
    expect(board.filter((c) => c.isMine).length).toBe(10);
  });

  it('safe zone: clicked cell is never a mine (20 runs)', () => {
    for (let i = 0; i < 20; i++) {
      const empty = createEmptyBoard(BEGINNER);
      const board = placeMinesAndCount(empty, BEGINNER, 4, 4);
      expect(board[cellIndex(9, 4, 4)].isMine).toBe(false);
    }
  });

  it('safe zone: direct neighbors of clicked cell are never mines (20 runs)', () => {
    for (let i = 0; i < 20; i++) {
      const empty = createEmptyBoard(BEGINNER);
      const board = placeMinesAndCount(empty, BEGINNER, 4, 4);
      const neighbors = getNeighbors(board, BEGINNER, 4, 4);
      expect(neighbors.every((n) => !n.isMine)).toBe(true);
    }
  });

  it('neighborCount is accurate for non-mine cells', () => {
    const empty = createEmptyBoard(BEGINNER);
    const board = placeMinesAndCount(empty, BEGINNER, 4, 4);
    for (const cell of board) {
      if (!cell.isMine) {
        const actualMineNeighbors = getNeighbors(board, BEGINNER, cell.row, cell.col).filter(
          (n) => n.isMine,
        ).length;
        expect(cell.neighborCount).toBe(actualMineNeighbors);
      }
    }
  });

  it('returns a new board (not mutating original)', () => {
    const empty = createEmptyBoard(BEGINNER);
    const board = placeMinesAndCount(empty, BEGINNER, 4, 4);
    expect(board).not.toBe(empty);
  });
});
