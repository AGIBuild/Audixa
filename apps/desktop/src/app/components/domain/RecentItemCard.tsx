import styles from '../../app.module.css';
import type { RecentItem } from '../../data';
import { Card } from '../atoms/Card';
import { MediaMeta } from '../atoms/MediaMeta';
import { ProgressBar } from '../atoms/ProgressBar';

type RecentItemCardProps = {
  item: RecentItem;
};

export function RecentItemCard({ item }: RecentItemCardProps) {
  return (
    <Card className={styles.recentItem}>
      <MediaMeta
        title={item.title}
        subtitle={item.location}
        titleClassName={styles.recentTitle}
        subtitleClassName={styles.recentMeta}
      />
      <ProgressBar value={item.progress} />
    </Card>
  );
}
