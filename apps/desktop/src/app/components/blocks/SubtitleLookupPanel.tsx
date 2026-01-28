import styles from '../../app.module.css';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';

type SubtitleLookupPanelProps = {
  isOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  word: string;
  definition: string;
  pronunciation: string | null;
  error: string | null;
  position: { x: number; y: number } | null;
  placement: 'above' | 'below';
  onClose: () => void;
  onAdd: () => void;
};

export function SubtitleLookupPanel({
  isOpen,
  status,
  word,
  definition,
  pronunciation,
  error,
  position,
  placement,
  onClose,
  onAdd,
}: SubtitleLookupPanelProps) {
  if (!isOpen || !position) {
    return null;
  }

  return (
    <div
      className={styles.subtitleLookupPanel}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: placement === 'above' ? 'translateY(-100%)' : 'none',
      }}
    >
      <div className={styles.subtitleLookupHeader}>
        <div className={styles.subtitleLookupWord}>
          {word}
          {pronunciation ? (
            <span className={styles.subtitleLookupPronunciation}>{pronunciation}</span>
          ) : null}
        </div>
        <IconButton aria-label="Close lookup" title="Close" onClick={onClose}>
          <IconGlyph name="close" />
        </IconButton>
      </div>
      {status === 'loading' ? (
        <div className={styles.subtitleLookupHint}>Looking up definition...</div>
      ) : null}
      {status === 'error' ? (
        <div className={styles.errorBanner}>{error ?? 'Lookup unavailable.'}</div>
      ) : null}
      {status === 'ready' && definition ? (
        <div className={styles.subtitleLookupDefinition}>{definition}</div>
      ) : null}
      {status === 'ready' && !definition ? (
        <div className={styles.subtitleLookupHint}>No definition found.</div>
      ) : null}
      <div className={styles.subtitleLookupActions}>
        <IconButton
          onClick={onAdd}
          disabled={!word || status === 'loading'}
          aria-label="Add to vocabulary"
          title="Add to vocabulary"
          className={styles.subtitleLookupAddButton}
        >
          <IconGlyph name="book" />
        </IconButton>
      </div>
    </div>
  );
}
