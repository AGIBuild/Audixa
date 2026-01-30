import type { SubtitleItem } from '../../data/types';
import { MediaList } from '../blocks/MediaList';
import { SubtitleListItem } from './SubtitleListItem';

type SubtitleListProps = {
  items: SubtitleItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onSave: (item: SubtitleItem) => void;
};

export function SubtitleList({ items, activeId, onSelect, onSave }: SubtitleListProps) {
  return (
    <MediaList
      items={items}
      variant="subtitle"
      renderItem={(item) => (
        <SubtitleListItem
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          onSelect={onSelect}
          onSave={onSave}
        />
      )}
    />
  );
}
