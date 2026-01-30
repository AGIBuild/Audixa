import { useState, useEffect, useRef } from 'react';
import styles from '../../app.module.css';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';
import { AppButton } from '../atoms/AppButton';
import type { OpenSubtitleResult } from '../../data/openSubtitlesClient';

const SUBTITLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-cn', label: '简体中文' },
  { code: 'zh-tw', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt-br', label: 'Português (BR)' },
  { code: 'ru', label: 'Русский' },
];

export type SubtitleSearchOptions = {
  query?: string;
  language: string;
  moviehash?: string;
};

type SubtitleSearchPanelProps = {
  isOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  results: OpenSubtitleResult[];
  onSearch: (options: SubtitleSearchOptions) => void;
  onSelect: (result: OpenSubtitleResult) => void;
  onClose: () => void;
  onAutoMatch?: () => void;
  canAutoMatch?: boolean;
  /** Initial query to prefill (e.g., current media title) */
  initialQuery?: string;
  /** Auto-trigger search when panel opens */
  autoSearch?: boolean;
};

export function SubtitleSearchPanel({
  isOpen,
  status,
  error,
  results,
  onSearch,
  onSelect,
  onClose,
  onAutoMatch,
  canAutoMatch = false,
  initialQuery = '',
  autoSearch = false,
}: SubtitleSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState('en');
  const hasAutoSearched = useRef(false);
  const prevIsOpen = useRef(isOpen);

  // Update query when initialQuery changes (new media loaded)
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Auto-search when panel opens
  useEffect(() => {
    // Detect panel just opened
    if (isOpen && !prevIsOpen.current) {
      hasAutoSearched.current = false;
    }
    prevIsOpen.current = isOpen;

    if (!isOpen || hasAutoSearched.current) {
      return;
    }

    // Auto-search: prefer hash match for local files, otherwise use query
    if (autoSearch && canAutoMatch && onAutoMatch) {
      hasAutoSearched.current = true;
      onAutoMatch();
    } else if (autoSearch && initialQuery) {
      hasAutoSearched.current = true;
      onSearch({ query: initialQuery, language });
    }
  }, [isOpen, autoSearch, canAutoMatch, onAutoMatch, initialQuery, language, onSearch]);

  if (!isOpen) {
    return null;
  }

  const handleSearch = () => {
    onSearch({ query, language });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className={styles.subtitleSearchPanel}>
      <div className={styles.subtitleSearchHeader}>
        <span>Online Subtitles</span>
        <IconButton aria-label="Close search" title="Close" onClick={onClose}>
          <IconGlyph name="close" />
        </IconButton>
      </div>
      <div className={styles.subtitleSearchRow}>
        <select
          className={styles.inputField}
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          style={{ width: 'auto', minWidth: '100px' }}
        >
          {SUBTITLE_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.subtitleSearchRow}>
        <input
          className={styles.inputField}
          placeholder="Search by title or release"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <IconButton
          aria-label={status === 'loading' ? 'Searching' : 'Search'}
          title={status === 'loading' ? 'Searching...' : 'Search'}
          onClick={handleSearch}
          disabled={status === 'loading'}
        >
          <IconGlyph name="search" />
        </IconButton>
      </div>
      {canAutoMatch && onAutoMatch ? (
        <div className={styles.subtitleSearchRow}>
          <AppButton
            variant="secondary"
            onClick={onAutoMatch}
            disabled={status === 'loading'}
            style={{ width: '100%' }}
          >
            {status === 'loading' ? 'Matching...' : 'Auto Match by File Hash'}
          </AppButton>
        </div>
      ) : null}
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
