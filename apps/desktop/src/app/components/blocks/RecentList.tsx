import type { RecentItem } from '../../data';
import { RecentItemCard } from '../domain/RecentItemCard';
import { MediaList } from './MediaList';

type RecentListProps = {
  items: RecentItem[];
};

export function RecentList({ items }: RecentListProps) {
  return (
    <MediaList
      items={items}
      variant="recent"
      renderItem={(item) => <RecentItemCard key={item.title} item={item} />}
    />
  );
}
