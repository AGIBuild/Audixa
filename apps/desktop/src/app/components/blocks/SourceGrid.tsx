import styles from '../../app.module.css';
import type { SourceItem } from '../../data';
import { SourceCard } from '../domain/SourceCard';

type SourceGridProps = {
  sources: SourceItem[];
};

export function SourceGrid({ sources }: SourceGridProps) {
  return (
    <div className={styles.sourceGrid}>
      {sources.map((source) => (
        <SourceCard key={source.title} item={source} />
      ))}
    </div>
  );
}
