import styles from '../../app.module.css';
import type { SourceItem } from '../../data/types';
import { SourceCard } from '../domain/SourceCard';

type SourceGridProps = {
  sources: SourceItem[];
  activeSourceId: string | null;
  onSelectSource: (sourceId: string) => void;
};

export function SourceGrid({
  sources,
  activeSourceId,
  onSelectSource,
}: SourceGridProps) {
  return (
    <div className={styles.sourceGrid}>
      {sources.map((source) => (
        <SourceCard
          key={source.id}
          item={source}
          isActive={activeSourceId === source.id}
          onSelect={() => onSelectSource(source.id)}
        />
      ))}
    </div>
  );
}
