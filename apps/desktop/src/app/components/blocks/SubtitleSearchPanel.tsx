import { useState } from 'react';
import styles from '../../app.module.css';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';
import type { OpenSubtitleResult } from '../../data/openSubtitlesClient';

type SubtitleSearchPanelProps = {
  isOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  results: OpenSubtitleResult[];
  onSearch: (query: string) => void;
  onSelect: (result: OpenSubtitleResult) => void;
  onClose: () => void;
};

export function SubtitleSearchPanel({
  isOpen,
  status,
  error,
  results,
  onSearch,
  onSelect,
  onClose,
}: SubtitleSearchPanelProps) {
  const [query, setQuery] = useState('');

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.subtitleSearchPanel}>
      <div className={styles.subtitleSearchHeader}>
        <span>Online Subtitles</span>
        <IconButton aria-label="Close search" title="Close" onClick={onClose}>
          <IconGlyph name="close" />
        </IconButton>
      </div>
      <div className={styles.subtitleSearchRow}>
        <input
          className={styles.inputField}
          placeholder="Search by title or release"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <IconButton
          aria-label={status === 'loading' ? 'Searching' : 'Search'}
          title={status === 'loading' ? 'Searching...' : 'Search'}
          onClick={() => onSearch(query)}
          disabled={status === 'loading'}
        >
          <IconGlyph name="search" />
        </IconButton>
      </div>
      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      <div className={styles.subtitleSearchResults}>
        {results.map((result) => (
          <button
            key={result.id}
            type="button"
            className={styles.subtitleSearchResult}
            onClick={() => onSelect(result)}
          >
            <div className={styles.subtitleSearchTitle}>{result.fileName}</div>
            <div className={styles.subtitleSearchMeta}>
              {result.language} · {result.downloads} downloads
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
