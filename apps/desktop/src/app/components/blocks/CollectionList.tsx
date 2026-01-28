import type { ListeningItem } from '../../data/types';
import { MediaList } from './MediaList';
import { CollectionCard } from '../domain/CollectionCard';

type CollectionListProps = {
  items: ListeningItem[];
  onSelect?: (id: string) => void;
  onEditTitle?: (id: string, title: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
};

export function CollectionList({
  items,
  onSelect,
  onEditTitle,
  onToggleFavorite,
  onDelete,
  compact = false,
}: CollectionListProps) {
  return (
    <MediaList
      items={items}
      variant="vocab"
      renderItem={(item) => (
        <CollectionCard
          key={item.id}
          item={item}
          compact={compact}
          onSelect={onSelect ? () => onSelect(item.id) : undefined}
          onEditTitle={onEditTitle ? (title) => onEditTitle(item.id, title) : undefined}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
          onDelete={onDelete ? () => onDelete(item.id) : undefined}
        />
      )}
    />
  );
}
