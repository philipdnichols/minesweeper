import React from 'react';
import type { GameState } from '../../types/game';
import type { GameAction } from '../../state/actions';
import { Header } from '../Header/Header';
import { DifficultySelector } from '../DifficultySelector/DifficultySelector';
import { Board } from '../Board/Board';
import styles from './Game.module.css';

interface GameProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function Game({ state, dispatch }: GameProps) {
  const { difficulty, board, status, minesRemaining, elapsedSeconds } = state;

  return (
    <div className={styles.game}>
      <DifficultySelector
        currentKey={difficulty.key}
        onSelect={(key) => dispatch({ type: 'SET_DIFFICULTY', payload: key })}
      />
      <div className={styles.panel}>
        <Header
          minesRemaining={minesRemaining}
          elapsedSeconds={elapsedSeconds}
          status={status}
          onReset={() => dispatch({ type: 'RESET_GAME' })}
        />
        <Board
          board={board}
          difficulty={difficulty}
          status={status}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
}
