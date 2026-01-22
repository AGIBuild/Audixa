import styles from '../../app.module.css';
import type { SourceItem } from '../../data';
import { Card } from '../atoms/Card';
import { MediaMeta } from '../atoms/MediaMeta';

type SourceCardProps = {
  item: SourceItem;
};

export function SourceCard({ item }: SourceCardProps) {
  return (
    <Card className={styles.sourceCard}>
      <MediaMeta
        title={item.title}
        subtitle={item.subtitle}
        titleClassName={styles.sourceTitle}
        subtitleClassName={styles.sourceSubtitle}
      />
    </Card>
  );
}
