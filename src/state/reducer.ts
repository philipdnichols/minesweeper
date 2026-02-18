import { DIFFICULTIES } from '../types/game';
import type { GameState } from '../types/game';
import { createEmptyBoard, placeMinesAndCount } from '../logic/board';
import { revealCell } from '../logic/reveal';
import { toggleFlag } from '../logic/flag';
import { chordClick } from '../logic/chord';
import { checkWin, checkLoss, flagAllMines } from '../logic/win';
import type { GameAction } from './actions';

function makeInitialState(difficulty = DIFFICULTIES.beginner): GameState {
  return {
    difficulty,
    board: createEmptyBoard(difficulty),
    status: 'idle',
    minesRemaining: difficulty.mines,
    elapsedSeconds: 0,
  };
}

export const initialState: GameState = makeInitialState();

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_DIFFICULTY': {
      const difficulty = DIFFICULTIES[action.payload];
      return makeInitialState(difficulty);
    }

    case 'RESET_GAME': {
      return makeInitialState(state.difficulty);
    }

    case 'TICK': {
      if (state.status !== 'playing') return state;
      return { ...state, elapsedSeconds: Math.min(999, state.elapsedSeconds + 1) };
    }

    case 'REVEAL_CELL': {
      if (state.status === 'won' || state.status === 'lost') return state;

      const { row, col } = action.payload;
      let board = state.board;
      let status = state.status;

      // First click: place mines safely, then reveal
      if (status === 'idle') {
        board = placeMinesAndCount(board, state.difficulty, row, col);
        status = 'playing';
      }

      board = revealCell(board, state.difficulty, row, col);

      if (checkLoss(board)) {
        return { ...state, board, status: 'lost' };
      }
      if (checkWin(board)) {
        return { ...state, board: flagAllMines(board), status: 'won' };
      }
      return { ...state, board, status };
    }

    case 'FLAG_CELL': {
      if (state.status === 'idle' || state.status === 'won' || state.status === 'lost')
        return state;

      const { row, col } = action.payload;
      const [board, delta] = toggleFlag(state.board, state.difficulty.cols, row, col);
      return { ...state, board, minesRemaining: state.minesRemaining - delta };
    }

    case 'CHORD_CLICK': {
      if (state.status !== 'playing') return state;

      const { row, col } = action.payload;
      const board = chordClick(state.board, state.difficulty, row, col);
      if (board === state.board) return state;

      if (checkLoss(board)) {
        return { ...state, board, status: 'lost' };
      }
      if (checkWin(board)) {
        return { ...state, board: flagAllMines(board), status: 'won' };
      }
      return { ...state, board };
    }

    default:
      return state;
  }
}
