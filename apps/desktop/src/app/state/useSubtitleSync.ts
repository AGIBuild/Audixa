import { useEffect } from 'react';
import type { SubtitleItem } from '../data';
import { usePlayerStore } from './playerStore';
import { useUiStore } from './uiStore';

export function useSubtitleSync(items: SubtitleItem[]) {
  const activeScreen = useUiStore((state) => state.activeScreen);
  const activeSubtitle = useUiStore((state) => state.activeSubtitle);
  const setActiveSubtitle = useUiStore((state) => state.setActiveSubtitle);
  const progress = usePlayerStore((state) => state.progress);

  useEffect(() => {
    if (activeScreen !== 'player' || items.length === 0) {
      return;
    }
    const step = 100 / items.length;
    const index = Math.min(items.length - 1, Math.floor(progress / step));
    const nextId = items[index]?.id;
    if (nextId && nextId !== activeSubtitle) {
      setActiveSubtitle(nextId);
    }
  }, [activeScreen, activeSubtitle, items, progress, setActiveSubtitle]);
}
