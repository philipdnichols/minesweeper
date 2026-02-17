import type { GameStatus } from '../../types/game';
import styles from './Header.module.css';

interface HeaderProps {
  minesRemaining: number;
  elapsedSeconds: number;
  status: GameStatus;
  onReset: () => void;
}

function padThree(n: number): string {
  return String(Math.max(0, Math.min(999, n))).padStart(3, '0');
}

function smiley(status: GameStatus): string {
  if (status === 'won') return '😎';
  if (status === 'lost') return '😵';
  return '🙂';
}

export function Header({ minesRemaining, elapsedSeconds, status, onReset }: HeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.counter}>{padThree(minesRemaining)}</div>
      <button className={styles.reset} onClick={onReset} aria-label="Reset game">
        {smiley(status)}
      </button>
      <div className={styles.counter}>{padThree(elapsedSeconds)}</div>
    </div>
  );
}
