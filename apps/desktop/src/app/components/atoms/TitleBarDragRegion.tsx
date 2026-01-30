import { useRef, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

type TitleBarDragRegionProps = {
  className?: string;
};

const DOUBLE_CLICK_THRESHOLD_MS = 300;

export function TitleBarDragRegion({ className }: TitleBarDragRegionProps) {
  const lastClickTime = useRef(0);
  const dragTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    // Check if this is a double-click
    if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD_MS) {
      // Cancel any pending drag
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current);
        dragTimeout.current = null;
      }
      lastClickTime.current = 0;
      // Toggle maximize
      void getCurrentWindow().toggleMaximize();
      return;
    }

    lastClickTime.current = now;

    // Delay starting drag to allow double-click detection
    dragTimeout.current = setTimeout(() => {
      dragTimeout.current = null;
      void getCurrentWindow().startDragging();
    }, 150);
  }, []);

  const handleMouseUp = useCallback(() => {
    // If mouse released before drag started, cancel the drag
    // But keep the click time for potential double-click
  }, []);

  return (
    <div
      className={className}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
}
