import styles from '../../app.module.css';
import type { RecentItem } from '../../data/types';
import { Card } from '../atoms/Card';
import { MediaMeta } from '../atoms/MediaMeta';
import { ProgressBar } from '../atoms/ProgressBar';

type RecentItemCardProps = {
  item: RecentItem;
  onSelect?: () => void;
};

export function RecentItemCard({ item, onSelect }: RecentItemCardProps) {
  return (
    <Card
      className={`${styles.recentItem} ${onSelect ? styles.clickableCard : ''}`}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
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
