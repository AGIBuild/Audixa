import { useEffect } from 'react';
import type { SubtitleItem } from '../data/types';
import { usePlayerStore } from './playerStore';
import { useUiStore } from './uiStore';

export function useSubtitleSync(items: SubtitleItem[]) {
  const activeScreen = useUiStore((state) => state.activeScreen);
  const activeSubtitle = useUiStore((state) => state.activeSubtitle);
  const setActiveSubtitle = useUiStore((state) => state.setActiveSubtitle);
  const currentTime = usePlayerStore((state) => state.currentTime);

  useEffect(() => {
    if (activeScreen !== 'player') {
      return;
    }
    if (items.length === 0) {
      if (activeSubtitle) {
        setActiveSubtitle('');
      }
      return;
    }
    const currentMs = Number.isFinite(currentTime) ? currentTime * 1000 : 0;
    const nextItem = items.find(
      (item) => currentMs >= item.startMs && currentMs <= item.endMs,
    );
    const nextId = nextItem?.id ?? '';
    if (nextId !== activeSubtitle) {
      setActiveSubtitle(nextId);
    }
  }, [activeScreen, activeSubtitle, currentTime, items, setActiveSubtitle]);
}
