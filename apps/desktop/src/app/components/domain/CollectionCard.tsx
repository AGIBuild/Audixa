import styles from '../../app.module.css';
import type { ListeningItem } from '../../data';
import { Card } from '../atoms/Card';
import { ProgressBar } from '../atoms/ProgressBar';
import { TagList } from '../blocks/TagList';

type CollectionCardProps = {
  item: ListeningItem;
};

export function CollectionCard({ item }: CollectionCardProps) {
  return (
    <Card className={styles.collectionCard}>
      <div className={styles.collectionHeader}>
        <div className={styles.collectionTitle}>{item.title}</div>
        <span className={styles.collectionDuration}>{item.duration}</span>
      </div>
      <div className={styles.collectionMeta}>{item.source}</div>
      <TagList tags={item.tags} />
      <ProgressBar value={item.progress} variant="compact" />
    </Card>
  );
}
