import { useEffect, useMemo, useState } from 'react';
import styles from '../../app.module.css';
import type { LibraryItem } from '../../data/types';
import { getFileName, getParentPath } from '../../data/utils';
import { Card } from '../atoms/Card';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';

type LibraryItemCardProps = {
  item: LibraryItem;
  onSelect?: () => void;
  onRename?: (nextName: string) => void;
  onDelete?: () => void;
};

export function LibraryItemCard({ item, onSelect, onRename, onDelete }: LibraryItemCardProps) {
  const location = getParentPath(item.uri) || item.uri;
  const fileName = useMemo(() => getFileName(item.uri), [item.uri]);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(fileName);
  const showActions = Boolean(onRename || onDelete);

  useEffect(() => {
    if (!isEditing) {
      setDraftName(fileName);
    }
  }, [fileName, isEditing]);

  const handleSaveRename = () => {
    const nextName = draftName.trim();
    if (!nextName) {
      return;
    }
    onRename?.(nextName);
    setIsEditing(false);
  };

  return (
    <Card
      className={`${styles.libraryItemCard} ${onSelect ? styles.clickableCard : ''}`}
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
      <div className={styles.libraryItemHeader}>
        {isEditing ? (
          <input
            className={styles.inputField}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className={styles.libraryItemTitle}>{item.title}</div>
        )}
        {showActions ? (
          <div className={styles.libraryItemActions}>
            {isEditing ? (
              <>
                <IconButton
                  aria-label="Save"
                  title="Save"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSaveRename();
                  }}
                >
                  <IconGlyph name="save" size={16} />
                </IconButton>
                <IconButton
                  aria-label="Cancel"
                  title="Cancel"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDraftName(fileName);
                    setIsEditing(false);
                  }}
                >
                  <IconGlyph name="close" size={16} />
                </IconButton>
              </>
            ) : (
              <>
                {onRename ? (
                  <IconButton
                    aria-label="Rename"
                    title="Rename"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <IconGlyph name="edit" size={16} />
                  </IconButton>
                ) : null}
                {onDelete ? (
                  <IconButton
                    aria-label="Delete"
                    title="Delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete?.();
                    }}
                  >
                    <IconGlyph name="trash" size={16} />
                  </IconButton>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className={styles.libraryItemMeta}>{location}</div>
    </Card>
  );
}
