import type { SubtitleItem } from '../../data';
import { MediaList } from '../blocks/MediaList';
import { SubtitleListItem } from './SubtitleListItem';

type SubtitleListProps = {
  items: SubtitleItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function SubtitleList({ items, activeId, onSelect }: SubtitleListProps) {
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
        />
      )}
    />
  );
}
