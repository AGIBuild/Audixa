import styles from '../../app.module.css';
import type { SourceItem } from '../../data/types';
import { Card } from '../atoms/Card';
import { MediaMeta } from '../atoms/MediaMeta';

type SourceCardProps = {
  item: SourceItem;
  isActive: boolean;
  onSelect: () => void;
};

export function SourceCard({ item, isActive, onSelect }: SourceCardProps) {
  return (
    <Card
      className={`${styles.sourceCard} ${isActive ? styles.sourceCardActive : ''}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <MediaMeta
        title={item.title}
        subtitle={item.subtitle}
        titleClassName={styles.sourceTitle}
        subtitleClassName={styles.sourceSubtitle}
      />
    </Card>
  );
}
