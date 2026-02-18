import type { Board, Cell, Difficulty } from '../types/game';

export function cellIndex(cols: number, row: number, col: number): number {
  return row * cols + col;
}

export function createEmptyBoard(difficulty: Difficulty): Board {
  const { rows, cols } = difficulty;
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, isMine: false, neighborCount: 0, state: 'hidden' });
    }
  }
  return cells;
}

export function getNeighbors(
  board: Board,
  difficulty: Difficulty,
  row: number,
  col: number,
): Cell[] {
  const { rows, cols } = difficulty;
  const neighbors: Cell[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push(board[cellIndex(cols, nr, nc)]);
      }
    }
  }
  return neighbors;
}

export function placeMinesAndCount(
  board: Board,
  difficulty: Difficulty,
  safeRow: number,
  safeCol: number,
): Board {
  const { rows, cols, mines } = difficulty;

  // Collect safe indices (clicked cell + its 8 neighbors)
  const safeSet = new Set<number>();
  safeSet.add(cellIndex(cols, safeRow, safeCol));
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeRow + dr;
      const nc = safeCol + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        safeSet.add(cellIndex(cols, nr, nc));
      }
    }
  }

  // Build pool of eligible indices
  const pool: number[] = [];
  for (let i = 0; i < rows * cols; i++) {
    if (!safeSet.has(i)) pool.push(i);
  }

  // Fisher-Yates shuffle, take first `mines` entries
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const mineIndices = new Set(pool.slice(0, mines));

  // First pass: place mines
  let cells: Cell[] = board.map((cell, idx) => ({
    ...cell,
    isMine: mineIndices.has(idx),
  }));

  // Second pass: compute neighborCount
  cells = cells.map((cell) => {
    if (cell.isMine) return cell;
    const count = getNeighbors(cells, difficulty, cell.row, cell.col).filter(
      (n) => n.isMine,
    ).length;
    return { ...cell, neighborCount: count };
  });

  return cells;
}
