import { DIFFICULTIES } from '../../types/game';
import type { DifficultyKey } from '../../types/game';
import styles from './DifficultySelector.module.css';

interface DifficultySelectorProps {
  currentKey: DifficultyKey;
  onSelect: (key: DifficultyKey) => void;
}

export function DifficultySelector({ currentKey, onSelect }: DifficultySelectorProps) {
  return (
    <div className={styles.selector}>
      {Object.values(DIFFICULTIES).map((d) => (
        <button
          key={d.key}
          className={`${styles.button} ${d.key === currentKey ? styles.active : ''}`}
          onClick={() => onSelect(d.key)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
