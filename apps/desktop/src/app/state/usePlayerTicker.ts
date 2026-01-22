import { useEffect } from 'react';
import { usePlayerStore } from './playerStore';

const tickIntervalMs = 500;

export function usePlayerTicker() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const tick = usePlayerStore((state) => state.tick);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }
    const id = window.setInterval(() => tick(), tickIntervalMs);
    return () => window.clearInterval(id);
  }, [isPlaying, tick]);
}
