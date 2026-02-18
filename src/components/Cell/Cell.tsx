import React, { memo, useCallback, useRef } from 'react';
import type { Cell as CellType, GameStatus } from '../../types/game';
import type { GameAction } from '../../state/actions';
import styles from './Cell.module.css';

interface CellProps {
  cell: CellType;
  gameStatus: GameStatus;
  dispatch: React.Dispatch<GameAction>;
  isPendingReveal: boolean;
  onChordStart: (row: number, col: number) => void;
  onChordCommit: (row: number, col: number) => void;
  onChordCancel: () => void;
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

function CellComponent({
  cell,
  gameStatus,
  dispatch,
  isPendingReveal,
  onChordStart,
  onChordCommit,
  onChordCancel,
}: CellProps) {
  const isOver = gameStatus === 'won' || gameStatus === 'lost';

  const pressedButtons = useRef<Set<number>>(new Set());
  const chordActive = useRef<boolean>(false);
  const suppressNextContextMenu = useRef<boolean>(false);

  const isChordTarget = cell.state === 'revealed' && !cell.isMine && cell.neighborCount > 0;

  const handleClick = useCallback(() => {
    if (isOver) return;
    if (cell.state === 'hidden') {
      dispatch({ type: 'REVEAL_CELL', payload: { row: cell.row, col: cell.col } });
    }
    // Revealed cells no longer chord on left-click alone
  }, [isOver, cell, dispatch]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      pressedButtons.current.add(e.button);

      if (isOver || !isChordTarget || chordActive.current) return;

      const isMiddle = e.button === 1;
      const isLR =
        (e.button === 0 && pressedButtons.current.has(2)) ||
        (e.button === 2 && pressedButtons.current.has(0));

      if (isMiddle || isLR) {
        chordActive.current = true;
        suppressNextContextMenu.current = true;
        onChordStart(cell.row, cell.col);
        if (e.button === 1) e.preventDefault(); // prevent scroll on middle-click
      }
    },
    [isOver, isChordTarget, onChordStart, cell.row, cell.col],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (chordActive.current) {
        chordActive.current = false;
        pressedButtons.current.clear();
        onChordCommit(cell.row, cell.col);
      } else {
        pressedButtons.current.delete(e.button);
      }
    },
    [onChordCommit, cell.row, cell.col],
  );

  const handleMouseLeave = useCallback(() => {
    if (chordActive.current) {
      chordActive.current = false;
      pressedButtons.current.clear();
      onChordCancel();
    }
  }, [onChordCancel]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (suppressNextContextMenu.current) {
        suppressNextContextMenu.current = false;
        return;
      }
      if (isOver) return;
      if (cell.state !== 'revealed') {
        dispatch({ type: 'FLAG_CELL', payload: { row: cell.row, col: cell.col } });
      }
    },
    [isOver, cell, dispatch],
  );

  const classNames = [styles.cell];
  if (isPendingReveal && cell.state === 'hidden') {
    classNames.push(styles.pendingReveal);
  } else if (cell.state === 'revealed') {
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
        <span style={{ color: NUMBER_COLORS[cell.neighborCount] }}>{cell.neighborCount}</span>
      );
    }
  } else if (cell.state === 'flagged') {
    content = '🚩';
  }

  return (
    <button
      className={classNames.join(' ')}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      onAuxClick={(e) => e.preventDefault()}
      aria-label={`Cell ${cell.row},${cell.col}`}
    >
      {content}
    </button>
  );
}

export const Cell = memo(CellComponent);
