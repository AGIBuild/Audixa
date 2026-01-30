import type { ReactNode } from 'react';
import { StackList } from '../atoms/StackList';

type MediaListProps<T> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  variant: 'recent' | 'subtitle' | 'vocab';
};

export function MediaList<T>({ items, renderItem, variant }: MediaListProps<T>) {
  return <StackList variant={variant}>{items.map(renderItem)}</StackList>;
}
