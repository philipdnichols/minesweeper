import type { Board, Cell } from '../types/game';

export function checkWin(board: Board): boolean {
  return board.every((cell) => cell.isMine || cell.state === 'revealed');
}

export function checkLoss(board: Board): boolean {
  return board.some((cell) => cell.isMine && cell.state === 'revealed');
}

export function flagAllMines(board: Board): Board {
  const cells = board.slice() as Cell[];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].isMine && cells[i].state !== 'flagged') {
      cells[i] = { ...cells[i], state: 'flagged' };
    }
  }
  return cells;
}
