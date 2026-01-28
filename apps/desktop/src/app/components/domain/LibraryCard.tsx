import styles from '../../app.module.css';
import type { Library } from '../../data/types';
import { Card } from '../atoms/Card';

type LibraryCardProps = {
  item: Library;
  isActive: boolean;
  onSelect: () => void;
};

const formatLibraryType = (type: Library['type']) => {
  switch (type) {
    case 'local-manual':
      return 'Manual';
    case 'webdav':
      return 'WebDAV';
    case 'cloud-drive':
      return 'Cloud';
    default:
      return 'Library';
  }
};

export function LibraryCard({ item, isActive, onSelect }: LibraryCardProps) {
  return (
    <Card
      className={`${styles.libraryCard} ${isActive ? styles.libraryCardActive : ''}`}
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
      <div className={styles.libraryCardName}>{item.name}</div>
      <div className={styles.libraryCardMeta}>{formatLibraryType(item.type)}</div>
    </Card>
  );
}
