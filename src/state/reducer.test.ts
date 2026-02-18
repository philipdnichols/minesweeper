import { describe, it, expect } from 'vitest';
import { gameReducer, initialState } from './reducer';
import { cellIndex, createEmptyBoard } from '../logic/board';
import { DIFFICULTIES } from '../types/game';
import type { Cell, GameState } from '../types/game';
import type { GameAction } from './actions';

function dispatch(state: GameState, action: GameAction): GameState {
  return gameReducer(state, action);
}

describe('SET_DIFFICULTY', () => {
  it('resets board to empty (no mines)', () => {
    // First start playing
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    // Then change difficulty
    state = dispatch(state, { type: 'SET_DIFFICULTY', payload: 'intermediate' });
    expect(state.board.every((c) => !c.isMine)).toBe(true);
  });

  it('sets status to idle', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    state = dispatch(state, { type: 'SET_DIFFICULTY', payload: 'intermediate' });
    expect(state.status).toBe('idle');
  });

  it('resets timer', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    state = dispatch(state, { type: 'TICK' });
    state = dispatch(state, { type: 'SET_DIFFICULTY', payload: 'intermediate' });
    expect(state.elapsedSeconds).toBe(0);
  });

  it('sets board size for intermediate', () => {
    const state = dispatch(initialState, { type: 'SET_DIFFICULTY', payload: 'intermediate' });
    expect(state.board.length).toBe(256); // 16x16
  });

  it('sets board size for expert', () => {
    const state = dispatch(initialState, { type: 'SET_DIFFICULTY', payload: 'expert' });
    expect(state.board.length).toBe(480); // 16x30
  });
});

describe('RESET_GAME', () => {
  it('keeps difficulty', () => {
    let state = dispatch(initialState, { type: 'SET_DIFFICULTY', payload: 'intermediate' });
    state = dispatch(state, { type: 'RESET_GAME' });
    expect(state.difficulty.key).toBe('intermediate');
  });

  it('sets status to idle', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    state = dispatch(state, { type: 'RESET_GAME' });
    expect(state.status).toBe('idle');
  });

  it('clears the board (no mines)', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    state = dispatch(state, { type: 'RESET_GAME' });
    expect(state.board.every((c) => !c.isMine)).toBe(true);
  });

  it('resets timer', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    state = dispatch(state, { type: 'TICK' });
    state = dispatch(state, { type: 'RESET_GAME' });
    expect(state.elapsedSeconds).toBe(0);
  });
});

describe('TICK', () => {
  it('increments elapsedSeconds when playing', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    state = dispatch(state, { type: 'TICK' });
    expect(state.elapsedSeconds).toBe(1);
  });

  it('does not increment when idle', () => {
    const state = dispatch(initialState, { type: 'TICK' });
    expect(state.elapsedSeconds).toBe(0);
  });

  it('returns same reference when not playing', () => {
    const result = dispatch(initialState, { type: 'TICK' });
    expect(result).toBe(initialState);
  });

  it('caps at 999', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    state = { ...state, elapsedSeconds: 999 };
    state = dispatch(state, { type: 'TICK' });
    expect(state.elapsedSeconds).toBe(999);
  });
});

describe('REVEAL_CELL', () => {
  it('transitions from idle to playing on first click', () => {
    const state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    expect(state.status).toBe('playing');
  });

  it('places mines on first click', () => {
    const state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    const mineCount = state.board.filter((c) => c.isMine).length;
    expect(mineCount).toBe(10); // beginner has 10 mines
  });

  it('clicked cell is never a mine on first click', () => {
    for (let i = 0; i < 10; i++) {
      const state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 0, col: 0 } });
      expect(state.board[cellIndex(9, 0, 0)].isMine).toBe(false);
    }
  });

  it('does nothing when game is won', () => {
    const wonState: GameState = { ...initialState, status: 'won' };
    const result = dispatch(wonState, { type: 'REVEAL_CELL', payload: { row: 0, col: 0 } });
    expect(result).toBe(wonState);
  });

  it('does nothing when game is lost', () => {
    const lostState: GameState = { ...initialState, status: 'lost' };
    const result = dispatch(lostState, { type: 'REVEAL_CELL', payload: { row: 0, col: 0 } });
    expect(result).toBe(lostState);
  });

  it('transitions to lost when a mine is revealed', () => {
    // Start the game and get the board
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    // Find a mine
    const mine = state.board.find((c) => c.isMine);
    if (!mine) throw new Error('No mine found');
    state = dispatch(state, { type: 'REVEAL_CELL', payload: { row: mine.row, col: mine.col } });
    expect(state.status).toBe('lost');
  });
});

describe('FLAG_CELL', () => {
  it('no-op when idle', () => {
    const result = dispatch(initialState, { type: 'FLAG_CELL', payload: { row: 0, col: 0 } });
    expect(result).toBe(initialState);
  });

  it('decrements minesRemaining when flagging a hidden cell', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    const before = state.minesRemaining;
    // Find a hidden cell — flood-fill from (4,4) may reveal arbitrary cells so don't hardcode
    const hidden = state.board.find((c) => c.state === 'hidden');
    if (!hidden) throw new Error('No hidden cells found');
    state = dispatch(state, { type: 'FLAG_CELL', payload: { row: hidden.row, col: hidden.col } });
    expect(state.minesRemaining).toBe(before - 1);
  });

  it('increments minesRemaining when unflagging', () => {
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    const hidden = state.board.find((c) => c.state === 'hidden');
    if (!hidden) throw new Error('No hidden cells found');
    state = dispatch(state, { type: 'FLAG_CELL', payload: { row: hidden.row, col: hidden.col } });
    const before = state.minesRemaining;
    state = dispatch(state, { type: 'FLAG_CELL', payload: { row: hidden.row, col: hidden.col } });
    expect(state.minesRemaining).toBe(before + 1);
  });
});

describe('CHORD_CLICK', () => {
  it('no-op when not playing', () => {
    const result = dispatch(initialState, { type: 'CHORD_CLICK', payload: { row: 4, col: 4 } });
    expect(result).toBe(initialState);
  });

  it('no-op when playing but chord conditions not met', () => {
    // Start game — the revealed cell at (4,4) won't have matching flag count
    let state = dispatch(initialState, { type: 'REVEAL_CELL', payload: { row: 4, col: 4 } });
    const before = state;
    state = dispatch(state, { type: 'CHORD_CLICK', payload: { row: 4, col: 4 } });
    // Board should be same reference since chord was a no-op
    expect(state.board).toBe(before.board);
  });

  it('changes board and stays playing when chord reveals safe cells', () => {
    const difficulty = DIFFICULTIES.beginner;
    const cells = createEmptyBoard(difficulty).slice() as Cell[];
    // (2,1) flagged mine — correctly flagged
    cells[cellIndex(9, 2, 1)] = { ...cells[cellIndex(9, 2, 1)], isMine: true, state: 'flagged' };
    // Second mine at (8,8) — stays hidden; not adjacent to the chord expansion area
    cells[cellIndex(9, 8, 8)] = { ...cells[cellIndex(9, 8, 8)], isMine: true };
    // (2,2) revealed, neighborCount=1 matches the one flagged neighbor
    cells[cellIndex(9, 2, 2)] = {
      ...cells[cellIndex(9, 2, 2)],
      state: 'revealed',
      neighborCount: 1,
    };
    // Give every hidden neighbor of (2,2) a non-zero neighborCount so chord-reveal
    // stops at those cells and the rest of the board stays hidden (game stays playing)
    cells[cellIndex(9, 1, 1)] = { ...cells[cellIndex(9, 1, 1)], neighborCount: 1 };
    cells[cellIndex(9, 1, 2)] = { ...cells[cellIndex(9, 1, 2)], neighborCount: 1 };
    cells[cellIndex(9, 1, 3)] = { ...cells[cellIndex(9, 1, 3)], neighborCount: 1 };
    cells[cellIndex(9, 2, 3)] = { ...cells[cellIndex(9, 2, 3)], neighborCount: 1 };
    cells[cellIndex(9, 3, 1)] = { ...cells[cellIndex(9, 3, 1)], neighborCount: 1 };
    cells[cellIndex(9, 3, 2)] = { ...cells[cellIndex(9, 3, 2)], neighborCount: 1 };
    cells[cellIndex(9, 3, 3)] = { ...cells[cellIndex(9, 3, 3)], neighborCount: 1 };

    const state: GameState = {
      difficulty,
      board: cells,
      status: 'playing',
      minesRemaining: 1,
      elapsedSeconds: 0,
    };

    const result = dispatch(state, { type: 'CHORD_CLICK', payload: { row: 2, col: 2 } });
    expect(result.board).not.toBe(state.board);
    expect(result.status).toBe('playing');
  });

  it('transitions to lost when chord reveals a mine', () => {
    const difficulty = DIFFICULTIES.beginner;
    const cells = createEmptyBoard(difficulty).slice() as Cell[];
    // Two flagged non-mines to match neighborCount=2
    cells[cellIndex(9, 2, 1)] = { ...cells[cellIndex(9, 2, 1)], state: 'flagged' };
    cells[cellIndex(9, 2, 3)] = { ...cells[cellIndex(9, 2, 3)], state: 'flagged' };
    // (1,1) is a hidden mine — chord will reveal it
    cells[cellIndex(9, 1, 1)] = { ...cells[cellIndex(9, 1, 1)], isMine: true };
    // (2,2) revealed, neighborCount=2 matches two flagged neighbors
    cells[cellIndex(9, 2, 2)] = {
      ...cells[cellIndex(9, 2, 2)],
      state: 'revealed',
      neighborCount: 2,
    };

    const state: GameState = {
      difficulty,
      board: cells,
      status: 'playing',
      minesRemaining: 0,
      elapsedSeconds: 0,
    };

    const result = dispatch(state, { type: 'CHORD_CLICK', payload: { row: 2, col: 2 } });
    expect(result.status).toBe('lost');
  });

  it('transitions to won when chord reveals the last non-mine cell', () => {
    const difficulty = DIFFICULTIES.beginner;
    const cells = createEmptyBoard(difficulty).slice() as Cell[];
    // One mine at (2,1), flagged
    cells[cellIndex(9, 2, 1)] = { ...cells[cellIndex(9, 2, 1)], isMine: true, state: 'flagged' };
    // Reveal all non-mine cells except (2,3) — that's the last hidden one
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].isMine) continue;
      if (i === cellIndex(9, 2, 2)) continue; // the chord target, stays revealed
      if (i === cellIndex(9, 2, 3)) continue; // last hidden cell
      cells[i] = { ...cells[i], state: 'revealed' };
    }
    // (2,2) revealed, neighborCount=1 matches the one flagged neighbor
    cells[cellIndex(9, 2, 2)] = {
      ...cells[cellIndex(9, 2, 2)],
      state: 'revealed',
      neighborCount: 1,
    };

    const state: GameState = {
      difficulty,
      board: cells,
      status: 'playing',
      minesRemaining: 0,
      elapsedSeconds: 0,
    };

    const result = dispatch(state, { type: 'CHORD_CLICK', payload: { row: 2, col: 2 } });
    expect(result.status).toBe('won');
  });
});

describe('REVEAL_CELL (win path)', () => {
  it('transitions to won when last non-mine cell is revealed', () => {
    const difficulty = DIFFICULTIES.beginner;
    const cells = createEmptyBoard(difficulty).slice() as Cell[];
    // One mine at (0,0)
    cells[cellIndex(9, 0, 0)] = { ...cells[cellIndex(9, 0, 0)], isMine: true };
    // Reveal every non-mine cell except (8,8)
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].isMine) continue;
      if (i === cellIndex(9, 8, 8)) continue;
      cells[i] = { ...cells[i], state: 'revealed' };
    }

    const state: GameState = {
      difficulty,
      board: cells,
      status: 'playing',
      minesRemaining: 1,
      elapsedSeconds: 0,
    };

    const result = dispatch(state, { type: 'REVEAL_CELL', payload: { row: 8, col: 8 } });
    expect(result.status).toBe('won');
    // flagAllMines should have flagged the mine at (0,0)
    expect(result.board[cellIndex(9, 0, 0)].state).toBe('flagged');
  });
});
