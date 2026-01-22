import styles from '../../app.module.css';
import type { SubtitleItem } from '../../data';

type SubtitleListItemProps = {
  item: SubtitleItem;
  isActive: boolean;
  onSelect: (id: string) => void;
};

export function SubtitleListItem({
  item,
  isActive,
  onSelect,
}: SubtitleListItemProps) {
  return (
    <button
      type="button"
      className={`${styles.subtitleItem} ${isActive ? styles.subtitleItemActive : ''}`}
      onClick={() => onSelect(item.id)}
    >
      <div className={styles.subtitleTime}>{item.time}</div>
      <div className={styles.subtitleEn}>{item.en}</div>
      <div className={styles.subtitleCn}>{item.cn}</div>
    </button>
  );
}
