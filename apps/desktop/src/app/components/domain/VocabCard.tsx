import styles from '../../app.module.css';
import type { VocabItem } from '../../data/types';
import { Card } from '../atoms/Card';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';
import { VocabBody } from './VocabBody';
import { VocabHeader } from './VocabHeader';

type VocabCardProps = {
  item: VocabItem;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onPlay?: (item: VocabItem) => void;
  onCopy?: (item: VocabItem) => void;
  onCopyExample?: (item: VocabItem) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleMastered?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function VocabCard({
  item,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onPlay,
  onCopy,
  onCopyExample,
  onToggleFavorite,
  onToggleMastered,
  onDelete,
}: VocabCardProps) {
  return (
    <Card className={styles.vocabCard}>
      <div className={styles.vocabHeaderRow}>
        {selectionMode ? (
          <label className={styles.vocabSelect}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(item.id)}
            />
          </label>
        ) : null}
        <VocabHeader word={item.word} pronunciation={item.pronunciation} />
        <div className={styles.vocabActions}>
          <IconButton
            className={styles.vocabActionButton}
            onClick={() => onPlay?.(item)}
            aria-label="Play pronunciation"
            title="Play pronunciation"
            disabled={!item.pronunciation}
          >
            <IconGlyph name="play" size={16} />
          </IconButton>
          <IconButton
            className={styles.vocabActionButton}
            onClick={() => onCopy?.(item)}
            aria-label="Copy entry"
            title="Copy entry"
          >
            <IconGlyph name="copy" size={16} />
          </IconButton>
          <IconButton
            className={styles.vocabActionButton}
            onClick={() => onCopyExample?.(item)}
            aria-label="Copy example"
            title="Copy example"
            disabled={!item.example}
          >
            <IconGlyph name="quote" size={16} />
          </IconButton>
          <IconButton
            className={styles.vocabActionButton}
            isActive={item.isFavorite}
            activeClassName={styles.vocabActionActive}
            onClick={() => onToggleFavorite?.(item.id)}
            aria-label="Toggle favorite"
            title="Toggle favorite"
          >
            <IconGlyph name="heart" size={16} />
          </IconButton>
          <IconButton
            className={styles.vocabActionButton}
            isActive={item.isMastered}
            activeClassName={styles.vocabActionActive}
            onClick={() => onToggleMastered?.(item.id)}
            aria-label="Toggle mastered"
            title="Toggle mastered"
          >
            <IconGlyph name="check" size={16} />
          </IconButton>
          <IconButton
            className={styles.vocabActionButton}
            onClick={() => onDelete?.(item.id)}
            aria-label="Delete entry"
            title="Delete entry"
          >
            <IconGlyph name="trash" size={16} />
          </IconButton>
        </div>
      </div>
      <VocabBody
        definition={item.definition}
        example={item.example}
        source={item.source}
      />
    </Card>
  );
}
