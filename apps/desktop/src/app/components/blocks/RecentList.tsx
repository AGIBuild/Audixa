import type { RecentItem } from '../../data/types';
import { RecentItemCard } from '../domain/RecentItemCard';
import { MediaList } from './MediaList';

type RecentListProps = {
  items: RecentItem[];
  onSelect?: (sourceId: string) => void;
  onDelete?: (id: string) => void;
};

export function RecentList({ items, onSelect, onDelete }: RecentListProps) {
  return (
    <MediaList
      items={items}
      variant="recent"
      renderItem={(item) => (
        <RecentItemCard
          key={item.id}
          item={item}
          onSelect={onSelect ? () => onSelect(item.mediaSourceId) : undefined}
          onDelete={onDelete ? () => onDelete(item.id) : undefined}
        />
      )}
    />
  );
}
