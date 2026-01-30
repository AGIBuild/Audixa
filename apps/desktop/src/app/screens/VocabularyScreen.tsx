import { useEffect, useMemo, useState } from 'react';
import styles from '../app.module.css';
import { IconButton } from '../components/atoms/IconButton';
import { IconGlyph } from '../components/atoms/IconGlyph';
import { SectionHeader } from '../components/blocks/SectionHeader';
import { MediaList } from '../components/blocks/MediaList';
import { StatRow } from '../components/blocks/StatRow';
import { VocabCard } from '../components/domain/VocabCard';
import type { VocabItem } from '../data/types';

type VocabularyScreenProps = {
  vocabItems: VocabItem[];
  vocabTab: string;
  onTabChange: (value: string) => void;
  onToggleFavorite: (id: string) => Promise<void>;
  onToggleMastered: (id: string) => Promise<void>;
  onDeleteVocab: (id: string) => Promise<void>;
};

const tabs = [
  { id: 'Vocabulary', icon: 'book' as const, label: 'Vocabulary' },
  { id: 'History', icon: 'history' as const, label: 'History' },
];
const pageSize = 18;

export function VocabularyScreen({
  vocabItems,
  vocabTab,
  onTabChange,
  onToggleFavorite,
  onToggleMastered,
  onDeleteVocab,
}: VocabularyScreenProps) {
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMastered, setShowMastered] = useState(false);
  const [sortMode, setSortMode] = useState<'recent' | 'alpha'>('recent');
  const [page, setPage] = useState(1);
  const tabIds = useMemo(() => tabs.map((tab) => tab.id), []);

  useEffect(() => {
    if (!tabIds.includes(vocabTab)) {
      onTabChange(tabIds[0] ?? 'Vocabulary');
    }
  }, [onTabChange, tabIds, vocabTab]);

  useEffect(() => {
    setPage(1);
  }, [showFavorites, showMastered, sortMode]);

  useEffect(() => {
    if (!isBatchMode) {
      setSelectedIds(new Set());
    }
  }, [isBatchMode]);

  const filteredItems = useMemo(() => {
    let items = vocabItems;
    if (showFavorites) {
      items = items.filter((item) => item.isFavorite);
    }
    if (showMastered) {
      items = items.filter((item) => item.isMastered);
    }
    const next = [...items];
    if (sortMode === 'alpha') {
      next.sort((a, b) => a.word.localeCompare(b.word));
    } else {
      next.sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : -1));
    }
    return next;
  }, [showFavorites, showMastered, sortMode, vocabItems]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [clampedPage, filteredItems]);

  const totalCount = vocabItems.length;
  const favoriteCount = vocabItems.filter((item) => item.isFavorite).length;
  const masteredCount = vocabItems.filter((item) => item.isMastered).length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const setAllSelected = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pagedItems.map((item) => item.id)));
  };

  const handleCopyEntry = (item: VocabItem) => {
    const parts = [
      item.word,
      item.pronunciation ?? '',
      item.definition,
      item.example,
    ].filter(Boolean);
    const text = parts.join('\n');
    void navigator.clipboard?.writeText(text);
  };

  const handleCopyExample = (item: VocabItem) => {
    if (!item.example) {
      return;
    }
    void navigator.clipboard?.writeText(item.example);
  };

  const handleCopyBatch = () => {
    const items = vocabItems.filter((item) => selectedIds.has(item.id));
    if (items.length === 0) {
      return;
    }
    const text = items
      .map((item) => {
        const parts = [
          item.word,
          item.pronunciation ?? '',
          item.definition,
          item.example,
        ].filter(Boolean);
        return parts.join('\n');
      })
      .join('\n\n');
    void navigator.clipboard?.writeText(text);
  };

  const handleSpeak = (item: VocabItem) => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.word);
    utterance.lang = item.locale || 'en';
    window.speechSynthesis.speak(utterance);
  };

  const handleBatchFavorite = async () => {
    const items = vocabItems.filter((item) => selectedIds.has(item.id));
    if (items.length === 0) {
      return;
    }
    const shouldFavorite = items.some((item) => !item.isFavorite);
    for (const item of items) {
      if (item.isFavorite !== shouldFavorite) {
        await onToggleFavorite(item.id);
      }
    }
  };

  const handleBatchMastered = async () => {
    const items = vocabItems.filter((item) => selectedIds.has(item.id));
    if (items.length === 0) {
      return;
    }
    const shouldMaster = items.some((item) => !item.isMastered);
    for (const item of items) {
      if (item.isMastered !== shouldMaster) {
        await onToggleMastered(item.id);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    await onDeleteVocab(id);
  };

  const handleBatchDelete = async () => {
    const ids = vocabItems.filter((item) => selectedIds.has(item.id)).map((item) => item.id);
    if (ids.length === 0) {
      return;
    }
    for (const id of ids) {
      await onDeleteVocab(id);
    }
    setSelectedIds(new Set());
  };

  const handleCycleSort = () => {
    setSortMode((prev) => (prev === 'recent' ? 'alpha' : 'recent'));
  };

  return (
    <section className={styles.screen}>
      <div className={styles.screenBody}>
        <SectionHeader
          title="Vocabulary"
          actions={
            <div className={styles.tabRow}>
              {tabs.map((tab) => (
                <IconButton
                  key={tab.id}
                  isActive={vocabTab === tab.id}
                  activeClassName={styles.tabIconActive}
                  onClick={() => onTabChange(tab.id)}
                  aria-label={tab.label}
                  title={tab.label}
                >
                  <IconGlyph name={tab.icon} size={16} />
                </IconButton>
              ))}
            </div>
          }
        />
        <StatRow
          items={[
            { value: String(totalCount), label: 'Total words' },
            { value: String(favoriteCount), label: 'Favorites' },
            { value: String(masteredCount), label: 'Mastered' },
          ]}
        />
        <div className={styles.vocabToolbar}>
          <div className={styles.vocabToolbarGroup}>
            <IconButton
              className={styles.vocabToolbarButton}
              isActive={showFavorites}
              activeClassName={styles.vocabActionActive}
              onClick={() => setShowFavorites((prev) => !prev)}
              aria-label="Filter favorites"
              title="Filter favorites"
            >
              <IconGlyph name="heart" size={16} />
            </IconButton>
            <IconButton
              className={styles.vocabToolbarButton}
              isActive={showMastered}
              activeClassName={styles.vocabActionActive}
              onClick={() => setShowMastered((prev) => !prev)}
              aria-label="Filter mastered"
              title="Filter mastered"
            >
              <IconGlyph name="check" size={16} />
            </IconButton>
          </div>
          <div className={styles.vocabToolbarGroup}>
            <IconButton
              className={styles.vocabToolbarButton}
              onClick={handleCycleSort}
              aria-label="Cycle sort"
              title={sortMode === 'recent' ? 'Sort: Recent' : 'Sort: A to Z'}
            >
              <IconGlyph name="sort" size={16} />
            </IconButton>
            <IconButton
              className={styles.vocabToolbarButton}
              isActive={isBatchMode}
              activeClassName={styles.vocabActionActive}
              onClick={() => setIsBatchMode((prev) => !prev)}
              aria-label="Batch mode"
              title="Batch mode"
            >
              <IconGlyph name="list" size={16} />
            </IconButton>
          </div>
        </div>
        {isBatchMode ? (
          <div className={styles.vocabBatchBar}>
            <IconButton
              className={styles.vocabToolbarButton}
              onClick={() => setAllSelected(true)}
              aria-label="Select page"
              title="Select page"
            >
              <IconGlyph name="selectAll" size={16} />
            </IconButton>
            <IconButton
              className={styles.vocabToolbarButton}
              onClick={() => setAllSelected(false)}
              aria-label="Clear selection"
              title="Clear selection"
            >
              <IconGlyph name="close" size={16} />
            </IconButton>
            <IconButton
              className={styles.vocabToolbarButton}
              onClick={handleBatchFavorite}
              aria-label="Toggle favorites"
              title="Toggle favorites"
            >
              <IconGlyph name="heart" size={16} />
            </IconButton>
            <IconButton
              className={styles.vocabToolbarButton}
              onClick={handleBatchMastered}
              aria-label="Toggle mastered"
              title="Toggle mastered"
            >
              <IconGlyph name="check" size={16} />
            </IconButton>
            <IconButton
              className={styles.vocabToolbarButton}
              onClick={handleBatchDelete}
              aria-label="Delete selected"
              title="Delete selected"
            >
              <IconGlyph name="trash" size={16} />
            </IconButton>
            <IconButton
              className={styles.vocabToolbarButton}
              onClick={handleCopyBatch}
              aria-label="Copy selected"
              title="Copy selected"
            >
              <IconGlyph name="copy" size={16} />
            </IconButton>
            <span className={styles.vocabBatchCount}>
              {selectedIds.size} selected
            </span>
          </div>
        ) : null}
        <div className={styles.scrollArea}>
          <MediaList
            items={pagedItems}
            variant="vocab"
            renderItem={(item) => (
              <VocabCard
                key={item.id}
                item={item}
                selectionMode={isBatchMode}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onPlay={handleSpeak}
                onCopy={handleCopyEntry}
                onCopyExample={handleCopyExample}
                onToggleFavorite={onToggleFavorite}
                onToggleMastered={onToggleMastered}
                onDelete={handleDeleteEntry}
              />
            )}
          />
        </div>
        <div className={styles.vocabPagination}>
          <IconButton
            className={styles.vocabToolbarButton}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            aria-label="Previous page"
            title="Previous page"
            disabled={clampedPage <= 1}
          >
            <IconGlyph name="chevronLeft" />
          </IconButton>
          <span className={styles.vocabPageLabel}>
            {clampedPage} / {totalPages}
          </span>
          <IconButton
            className={styles.vocabToolbarButton}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            aria-label="Next page"
            title="Next page"
            disabled={clampedPage >= totalPages}
          >
            <IconGlyph name="chevronRight" />
          </IconButton>
        </div>
      </div>
    </section>
  );
}
