import React, { memo } from 'react';
import type { Cell as CellType, GameStatus } from '../../types/game';
import type { GameAction } from '../../state/actions';
import styles from './Cell.module.css';

interface CellProps {
  cell: CellType;
  gameStatus: GameStatus;
  dispatch: React.Dispatch<GameAction>;
}

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000ff',
  2: '#008000',
  3: '#ff0000',
  4: '#000080',
  5: '#800000',
  6: '#008080',
  7: '#000000',
  8: '#808080',
};

function CellComponent({ cell, gameStatus, dispatch }: CellProps) {
  const isOver = gameStatus === 'won' || gameStatus === 'lost';

  const handleClick = () => {
    if (isOver) return;
    if (cell.state === 'hidden') {
      dispatch({ type: 'REVEAL_CELL', payload: { row: cell.row, col: cell.col } });
    } else if (cell.state === 'revealed' && cell.neighborCount > 0) {
      dispatch({ type: 'CHORD_CLICK', payload: { row: cell.row, col: cell.col } });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOver) return;
    if (cell.state !== 'revealed') {
      dispatch({ type: 'FLAG_CELL', payload: { row: cell.row, col: cell.col } });
    }
  };

  const classNames = [styles.cell];
  if (cell.state === 'revealed') {
    classNames.push(styles.revealed);
    if (cell.isMine) classNames.push(styles.mine);
  } else if (cell.state === 'flagged') {
    classNames.push(styles.flagged);
  } else {
    classNames.push(styles.hidden);
  }

  let content: React.ReactNode = null;
  if (cell.state === 'revealed') {
    if (cell.isMine) {
      content = '💣';
    } else if (cell.neighborCount > 0) {
      content = (
        <span style={{ color: NUMBER_COLORS[cell.neighborCount] }}>
          {cell.neighborCount}
        </span>
      );
    }
  } else if (cell.state === 'flagged') {
    content = '🚩';
  }

  return (
    <button
      className={classNames.join(' ')}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      aria-label={`Cell ${cell.row},${cell.col}`}
    >
      {content}
    </button>
  );
}

export const Cell = memo(CellComponent);
