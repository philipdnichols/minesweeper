import React, { useCallback, useMemo, useState } from 'react';
import type { Board as BoardType, Difficulty, GameStatus } from '../../types/game';
import type { GameAction } from '../../state/actions';
import { cellIndex, getNeighbors } from '../../logic/board';
import { Cell } from '../Cell/Cell';
import styles from './Board.module.css';

interface BoardProps {
  board: BoardType;
  difficulty: Difficulty;
  status: GameStatus;
  dispatch: React.Dispatch<GameAction>;
}

export function Board({ board, difficulty, status, dispatch }: BoardProps) {
  const [chordTarget, setChordTarget] = useState<{ row: number; col: number } | null>(null);

  const pendingRevealSet = useMemo(() => {
    if (!chordTarget) return new Set<number>();
    return new Set(
      getNeighbors(board, difficulty, chordTarget.row, chordTarget.col)
        .filter((n) => n.state === 'hidden')
        .map((n) => cellIndex(difficulty.cols, n.row, n.col)),
    );
  }, [chordTarget, board, difficulty]);

  const handleChordStart = useCallback((row: number, col: number) => {
    setChordTarget({ row, col });
  }, []);

  const handleChordCommit = useCallback(
    (row: number, col: number) => {
      setChordTarget(null);
      dispatch({ type: 'CHORD_CLICK', payload: { row, col } });
    },
    [dispatch],
  );

  const handleChordCancel = useCallback(() => {
    setChordTarget(null);
  }, []);

  return (
    <div
      className={styles.board}
      style={{ '--cols': difficulty.cols } as React.CSSProperties}
      onMouseUp={handleChordCancel}
    >
      {board.map((cell) => {
        const idx = cellIndex(difficulty.cols, cell.row, cell.col);
        return (
          <Cell
            key={`${cell.row}-${cell.col}`}
            cell={cell}
            gameStatus={status}
            dispatch={dispatch}
            isPendingReveal={pendingRevealSet.has(idx)}
            onChordStart={handleChordStart}
            onChordCommit={handleChordCommit}
            onChordCancel={handleChordCancel}
          />
        );
      })}
    </div>
  );
}
