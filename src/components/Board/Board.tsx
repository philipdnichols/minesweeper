import React from 'react';
import type { Board as BoardType, Difficulty, GameStatus } from '../../types/game';
import type { GameAction } from '../../state/actions';
import { Cell } from '../Cell/Cell';
import styles from './Board.module.css';

interface BoardProps {
  board: BoardType;
  difficulty: Difficulty;
  status: GameStatus;
  dispatch: React.Dispatch<GameAction>;
}

export function Board({ board, difficulty, status, dispatch }: BoardProps) {
  return (
    <div
      className={styles.board}
      style={{ '--cols': difficulty.cols } as React.CSSProperties}
    >
      {board.map((cell) => (
        <Cell
          key={`${cell.row}-${cell.col}`}
          cell={cell}
          gameStatus={status}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
}
