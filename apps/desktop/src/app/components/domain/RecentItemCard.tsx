import styles from '../../app.module.css';
import type { RecentItem } from '../../data/types';
import { Card } from '../atoms/Card';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';
import { MediaMeta } from '../atoms/MediaMeta';
import { ProgressBar } from '../atoms/ProgressBar';

type RecentItemCardProps = {
  item: RecentItem;
  onSelect?: () => void;
  onDelete?: () => void;
};

export function RecentItemCard({ item, onSelect, onDelete }: RecentItemCardProps) {
  const isDisabled = !item.isValid;
  const canClick = onSelect && !isDisabled;

  return (
    <Card
      className={`${styles.recentItem} ${canClick ? styles.clickableCard : ''} ${isDisabled ? styles.disabledCard : ''}`}
      role={canClick ? 'button' : undefined}
      tabIndex={canClick ? 0 : undefined}
      onClick={canClick ? onSelect : undefined}
      onKeyDown={(event) => {
        if (!canClick) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={styles.recentItemContent}>
        <MediaMeta
          title={item.title}
          subtitle={
            isDisabled
              ? 'File not found'
              : item.libraryName
                ? `${item.libraryName} · ${item.location}`
                : item.location
          }
          titleClassName={`${styles.recentTitle} ${isDisabled ? styles.disabledText : ''}`}
          subtitleClassName={`${styles.recentMeta} ${isDisabled ? styles.errorText : ''}`}
        />
        <ProgressBar value={item.progress} />
      </div>
      {onDelete ? (
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label="Remove from history"
          title="Remove from history"
          className={styles.recentDeleteButton}
        >
          <IconGlyph name="trash" size={14} />
        </IconButton>
      ) : null}
    </Card>
  );
}
