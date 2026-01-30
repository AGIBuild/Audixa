import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import styles from '../../app.module.css';
import type { SubtitleItem } from '../../data/types';
import { usePlayerStore } from '../../state/playerStore';

type LyricsStageProps = {
  items: SubtitleItem[];
  activeId: string;
  onSeek: (timeSeconds: number) => void;
  scrollToken?: number;
  maskState?: number;
};

export function LyricsStage({ items, activeId, onSeek, scrollToken, maskState = 0 }: LyricsStageProps) {
  // maskState: 0=Off, 1=Hide CN, 2=Hide EN, 3=Blind (full frosted glass)
  const isMasked = maskState > 0;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [isStageHovering, setIsStageHovering] = useState(false);
  // Use both ref (for sync read in mouseup) and state (for render)
  const dragHitIdRef = useRef<string | null>(null);
  const [dragHitIdForRender, setDragHitIdForRender] = useState<string | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const hasAutoPositionedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const lastSeekRef = useRef(0);
  const seekThrottleMs = 120;

  const orderedItems = useMemo(
    () => items.slice().sort((a, b) => a.startMs - b.startMs),
    [items],
  );
  const itemById = useMemo(() => {
    return new Map(orderedItems.map((item) => [item.id, item]));
  }, [orderedItems]);
  const playbackActiveId = useMemo(() => {
    if (orderedItems.length === 0) {
      return '';
    }
    // Derive active line from playback time (NetEase-style).
    // Apply offset so positive offset delays lyric display.
    const currentMs = (Number.isFinite(currentTime) ? currentTime : 0) * 1000;
    const adjustedMs = currentMs - offsetMs;
    const index = findActiveIndexByTime(orderedItems, adjustedMs);
    return orderedItems[index]?.id ?? orderedItems[0]!.id;
  }, [currentTime, offsetMs, orderedItems]);

  const displayActiveId = dragging && dragHitIdForRender ? dragHitIdForRender : playbackActiveId;

  const nextId = useMemo(() => {
    const idx = orderedItems.findIndex((i) => i.id === displayActiveId);
    if (idx >= 0 && idx + 1 < orderedItems.length) {
      return orderedItems[idx + 1]?.id ?? null;
    }
    return null;
  }, [displayActiveId, orderedItems]);

  const smoothScrollTo = useCallback((target: number) => {
    const container = listRef.current;
    if (!container) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const start = container.scrollTop;
    const change = target - start;
    const duration = 250;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (startTime === null) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      container.scrollTop = start + change * eased;
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const scrollToActive = useCallback(
    (immediate: boolean) => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-lyric-id="${displayActiveId}"]`,
    );
    if (node) {
      const container = listRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const target =
        container.scrollTop +
        (nodeRect.top - containerRect.top) +
        nodeRect.height / 2 -
        container.clientHeight / 2;
      if (immediate) {
        container.scrollTop = target;
        return;
      }
      smoothScrollTo(target);
    }
    },
    [displayActiveId, smoothScrollTo],
  );

  useLayoutEffect(() => {
    if (dragging) {
      return;
    }
    // Ensure the first render after items load immediately positions the active line at center.
    const immediate = !hasAutoPositionedRef.current;
    scrollToActive(immediate);
    hasAutoPositionedRef.current = true;
  }, [scrollToActive, dragging, orderedItems.length]);

  useEffect(() => {
    if (!dragging) {
      scrollToActive(false);
    }
  }, [scrollToActive, scrollToken, dragging, displayActiveId]);

  const performSeek = useCallback(
    (item: SubtitleItem, options?: { force?: boolean }) => {
      const now = performance.now();
      if (!options?.force && now - lastSeekRef.current < seekThrottleMs) {
        return;
      }
      lastSeekRef.current = now;
      const targetMs = Math.max(0, item.startMs + offsetMs);
      const targetSeconds = targetMs / 1000;
      // onSeek expects a percentage (0-100), not seconds
      const percent = duration > 0 ? (targetSeconds / duration) * 100 : 0;
      onSeek(percent);
    },
    [onSeek, offsetMs, duration],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!listRef.current) {
        return;
      }
      event.preventDefault();
      setDragging(true);
      // Sync set both ref and state
      const initialHit = displayActiveId || null;
      dragHitIdRef.current = initialHit;
      setDragHitIdForRender(initialHit);
      dragStartYRef.current = event.clientY;
      dragStartScrollRef.current = listRef.current.scrollTop;
    },
    [displayActiveId],
  );

  // Helper: find lyric id at reference line position
  const findLyricAtReferenceLine = useCallback(() => {
    const container = listRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return null;

    const stageRect = stage.getBoundingClientRect();
    const referenceY = stageRect.top + stageRect.height / 2;

    let targetId: string | null = null;
    let minDelta = Number.POSITIVE_INFINITY;

    // Find line that reference line intersects
    container.querySelectorAll<HTMLElement>('[data-lyric-id]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const id = el.dataset.lyricId ?? null;
      if (!id) return;
      if (referenceY >= rect.top && referenceY <= rect.bottom) {
        const center = rect.top + rect.height / 2;
        const delta = Math.abs(center - referenceY);
        if (delta < minDelta) {
          minDelta = delta;
          targetId = id;
        }
      }
    });

    // Fallback: nearest center
    if (!targetId) {
      minDelta = Number.POSITIVE_INFINITY;
      container.querySelectorAll<HTMLElement>('[data-lyric-id]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const id = el.dataset.lyricId ?? null;
        if (!id) return;
        const center = rect.top + rect.height / 2;
        const delta = Math.abs(center - referenceY);
        if (delta < minDelta) {
          minDelta = delta;
          targetId = id;
        }
      });
    }

    return targetId;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragging) {
      return;
    }
    // Directly calculate which line is at the reference line NOW
    const targetId = findLyricAtReferenceLine();
    const targetItem = targetId ? itemById.get(targetId) : null;
    if (targetItem) {
      performSeek(targetItem, { force: true });
    }
    // Clean up
    dragHitIdRef.current = null;
    setDragHitIdForRender(null);
    setDragging(false);
  }, [dragging, itemById, performSeek, findLyricAtReferenceLine]);

  useEffect(() => {
    if (!dragging) {
      return;
    }
    const handleMove = (event: MouseEvent) => {
      if (!listRef.current) {
        return;
      }
      const delta = dragStartYRef.current - event.clientY;
      listRef.current.scrollTop = dragStartScrollRef.current + delta;
      // Update highlight for render (visual feedback during drag)
      const targetId = findLyricAtReferenceLine();
      if (targetId) {
        dragHitIdRef.current = targetId;
        setDragHitIdForRender(targetId);
      }
    };
    const handleUp = () => handleMouseUp();
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, handleMouseUp, findLyricAtReferenceLine]);

  return (
    <div
      className={`${styles.lyricsStage} ${dragging ? styles.lyricsStageDragging : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsStageHovering(true)}
      onMouseLeave={() => setIsStageHovering(false)}
      ref={stageRef}
    >
      <div className={styles.lyricsStageOverlay} />
      {isMasked ? <div className={styles.lyricsMask} /> : null}
      {dragging ? (
        <div className={styles.lyricsReferenceLine} />
      ) : null}
      <div
        ref={listRef}
        className={styles.lyricsList}
        onMouseLeave={() => setHoverId(null)}
      >
        <div className={styles.lyricsSpacer} aria-hidden="true" />
        {orderedItems.map((item) => {
          const isActive = item.id === displayActiveId;
          const isHover = item.id === hoverId;
          const isNext = item.id === nextId;
          return (
            <button
              key={item.id}
              type="button"
              data-lyric-id={item.id}
              className={`${styles.lyricsLine} ${isActive ? styles.lyricsLineActive : ''} ${
                isNext ? styles.lyricsLineNext : ''
              } ${isHover ? styles.lyricsLineHover : ''}`}
              onMouseEnter={() => {
                if (!dragging) {
                  setHoverId(item.id);
                }
              }}
              onClick={() => performSeek(item)}
            >
              <div className={styles.lyricsText}>
                {item.en || item.cn || '(...)'}
              </div>
            </button>
          );
        })}
        <div className={styles.lyricsSpacer} aria-hidden="true" />
      </div>
      {isStageHovering ? (
        <div className={styles.lyricsOffsetBar}>
          <span className={styles.lyricsOffsetLabel}>偏移</span>
          <div className={styles.lyricsOffsetControls}>
            <button
              type="button"
              className={styles.offsetButton}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setOffsetMs((v) => Math.max(-3000, v - 500))}
            >
              -0.5s
            </button>
            <span className={styles.offsetValue}>{(offsetMs / 1000).toFixed(1)}s</span>
            <button
              type="button"
              className={styles.offsetButton}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setOffsetMs((v) => Math.min(3000, v + 500))}
            >
              +0.5s
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function findActiveIndexByTime(items: SubtitleItem[], timeMs: number): number {
  if (items.length === 0) {
    return 0;
  }
  if (!Number.isFinite(timeMs)) {
    return 0;
  }
  // Before first line: keep the first line centered.
  if (timeMs <= items[0]!.startMs) {
    return 0;
  }
  // After last line: keep the last line centered.
  const last = items[items.length - 1]!;
  if (timeMs >= last.endMs) {
    return items.length - 1;
  }
  // Binary search last item whose startMs <= timeMs.
  let lo = 0;
  let hi = items.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = items[mid]!.startMs;
    if (start <= timeMs) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const candidate = Math.max(0, lo - 1);
  return candidate;
}
