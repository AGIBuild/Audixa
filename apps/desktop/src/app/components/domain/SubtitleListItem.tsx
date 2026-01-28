import styles from '../../app.module.css';
import type { SubtitleItem } from '../../data/types';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';

type SubtitleListItemProps = {
  item: SubtitleItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onSave: (item: SubtitleItem) => void;
};

export function SubtitleListItem({
  item,
  isActive,
  onSelect,
  onSave,
}: SubtitleListItemProps) {
  return (
    <div className={styles.subtitleItemRow}>
      <button
        type="button"
        className={`${styles.subtitleItem} ${isActive ? styles.subtitleItemActive : ''}`}
        onClick={() => onSelect(item.id)}
      >
        <div className={styles.subtitleTime}>{item.time}</div>
        <div className={styles.subtitleEn}>{item.en}</div>
        <div className={styles.subtitleCn}>{item.cn}</div>
      </button>
      <IconButton
        className={styles.subtitleSaveButton}
        aria-label="Save subtitle"
        title="Save"
        onClick={() => onSave(item)}
      >
        <IconGlyph name="save" />
      </IconButton>
    </div>
  );
}
