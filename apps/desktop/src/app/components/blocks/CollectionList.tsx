import styles from '../../app.module.css';
import type { ListeningItem } from '../../data';
import { CollectionCard } from '../domain/CollectionCard';

type CollectionListProps = {
  items: ListeningItem[];
};

export function CollectionList({ items }: CollectionListProps) {
  return (
    <div className={styles.collectionGrid}>
      {items.map((item) => (
        <CollectionCard key={item.id} item={item} />
      ))}
    </div>
  );
}
