import { useMemo, useState } from 'react';
import styles from '../../app.module.css';
import type { ListeningItem } from '../../data/types';
import { Card } from '../atoms/Card';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';
import { ProgressBar } from '../atoms/ProgressBar';
import { TagList } from '../blocks/TagList';

type CollectionCardProps = {
  item: ListeningItem;
  onSelect?: () => void;
  onEditTitle?: (title: string) => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  compact?: boolean;
};

export function CollectionCard({
  item,
  onSelect,
  onEditTitle,
  onToggleFavorite,
  onDelete,
  compact = false,
}: CollectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const displayTitle = useMemo(() => truncateTitle(item.title), [item.title]);

  const cardClasses = [
    styles.collectionCard,
    compact ? styles.collectionCardCompact : '',
    onSelect ? styles.clickableCard : '',
  ]
    .filter(Boolean)
    .join(' ');
  const headerClasses = [
    styles.collectionHeader,
    compact ? styles.collectionHeaderCompact : '',
  ]
    .filter(Boolean)
    .join(' ');
  const titleClasses = [
    styles.collectionTitle,
    compact ? styles.collectionTitleCompact : '',
  ]
    .filter(Boolean)
    .join(' ');
  const durationClasses = [
    styles.collectionDuration,
    compact ? styles.collectionDurationCompact : '',
  ]
    .filter(Boolean)
    .join(' ');
  const metaClasses = [
    styles.collectionMeta,
    compact ? styles.collectionMetaCompact : '',
  ]
    .filter(Boolean)
    .join(' ');
  const actionClasses = [
    styles.collectionActions,
    compact ? styles.collectionActionsCompact : '',
    compact ? '' : styles.collectionActionsBottom,
  ]
    .filter(Boolean)
    .join(' ');
  const tagRowClass = compact ? styles.collectionTagRowCompact : undefined;

  const actionContent = isEditing ? (
    <>
      <IconButton
        aria-label="Save title"
        title="Save"
        onClick={(event) => {
          event.stopPropagation();
          onEditTitle?.(draftTitle.trim() || item.title);
          setIsEditing(false);
        }}
      >
        <IconGlyph name="save" size={compact ? 14 : 18} />
      </IconButton>
      <IconButton
        aria-label="Cancel edit"
        title="Cancel"
        onClick={(event) => {
          event.stopPropagation();
          setDraftTitle(item.title);
          setIsEditing(false);
        }}
      >
        <IconGlyph name="close" size={compact ? 14 : 18} />
      </IconButton>
    </>
  ) : (
    <>
      <IconButton
        aria-label="Edit title"
        title="Edit"
        onClick={(event) => {
          event.stopPropagation();
          setDraftTitle(item.title);
          setIsEditing(true);
        }}
      >
        <IconGlyph name="edit" size={compact ? 14 : 18} />
      </IconButton>
      <IconButton
        aria-label={item.isFavorite ? 'Unlike' : 'Like'}
        title={item.isFavorite ? 'Liked' : 'Like'}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite?.();
        }}
      >
        <IconGlyph name="heart" size={compact ? 14 : 18} />
      </IconButton>
      <IconButton
        aria-label="Delete"
        title="Delete"
        onClick={(event) => {
          event.stopPropagation();
          onDelete?.();
        }}
      >
        <IconGlyph name="trash" size={compact ? 14 : 18} />
      </IconButton>
    </>
  );

  return (
    <Card
      className={cardClasses}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={headerClasses}>
        {isEditing ? (
          <input
            className={styles.inputField}
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className={titleClasses}>{displayTitle}</div>
        )}
        <span className={durationClasses}>{item.duration}</span>
      </div>
      <div className={metaClasses}>{item.source}</div>
      {compact ? (
        <div className={styles.collectionFooterRow}>
          <TagList
            tags={item.tags}
            className={[styles.collectionTagRowInline, tagRowClass].filter(Boolean).join(' ')}
          />
          <div className={actionClasses}>{actionContent}</div>
        </div>
      ) : (
        <>
          <TagList tags={item.tags} className={tagRowClass} />
          <ProgressBar value={item.progress} variant="compact" />
          <div className={actionClasses}>{actionContent}</div>
        </>
      )}
    </Card>
  );
}

function truncateTitle(value: string, max = 64) {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}
