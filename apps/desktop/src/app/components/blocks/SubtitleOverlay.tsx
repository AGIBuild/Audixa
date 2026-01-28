import { useCallback, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import styles from '../../app.module.css';

type SubtitleOverlayProps = {
  maskState: number;
  lineEn?: string;
  lineCn?: string;
  onLookupSelection?: (payload: {
    text: string;
    position: { x: number; y: number };
    placement: 'above' | 'below';
  }) => void;
  onLookupDismiss?: () => void;
};

export function SubtitleOverlay({
  maskState,
  lineEn,
  lineCn,
  onLookupSelection,
  onLookupDismiss,
}: SubtitleOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const handleSelection = useCallback(
    (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
      if (!onLookupSelection) {
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        onLookupDismiss?.();
        return;
      }
      const overlayNode = overlayRef.current;
      if (!overlayNode) {
        return;
      }
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      if (
        (anchorNode && !overlayNode.contains(anchorNode)) ||
        (focusNode && !overlayNode.contains(focusNode))
      ) {
        return;
      }
      if (!selection.rangeCount) {
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const panelWidth = 320;
      const margin = 12;
      const x = Math.min(
        Math.max(margin, rect.left),
        Math.max(margin, window.innerWidth - panelWidth - margin),
      );
      const minHeight = 160;
      const placement = rect.top >= minHeight + margin ? 'above' : 'below';
      const y = placement === 'above' ? rect.top - 8 : rect.bottom + 8;
      onLookupSelection({ text: selection.toString(), position: { x, y }, placement });
    },
    [onLookupDismiss, onLookupSelection],
  );

  if (!lineEn && !lineCn) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className={styles.subtitleOverlay}
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
    >
      {lineEn ? (
        <div
          className={`${styles.subtitleLine} ${
            maskState === 2 || maskState === 3 ? styles.subtitleBlur : ''
          }`}
        >
          {lineEn}
        </div>
      ) : null}
      {lineCn ? (
        <div
          className={`${styles.subtitleLine} ${
            maskState === 1 || maskState === 3 ? styles.subtitleBlur : ''
          }`}
        >
          {lineCn}
        </div>
      ) : null}
    </div>
  );
}
