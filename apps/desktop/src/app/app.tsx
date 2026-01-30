import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import styles from './app.module.css';
import { AppButton } from './components/atoms/AppButton';
import { WindowControls } from './components/atoms/WindowControls';
import { LibraryScreen } from './screens/LibraryScreen';
import { ListeningScreen } from './screens/ListeningScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { VocabularyScreen } from './screens/VocabularyScreen';
import { getParentPath, getFileName, extractSearchQuery } from './data/utils';
import { detectBurnedSubtitleRegion, loadSubtitleTrack, loadSubtitlesForSource } from './data/subtitleService';
import { lookupDictionaryWord } from './data/dictionaryClient';
import { normalizeSelectionText } from './data/selection';
import { getMaskLabel, useUiStore } from './state/uiStore';
import { usePlayerStore } from './state/playerStore';
import { useSubtitleSync } from './state/useSubtitleSync';
import { useDesktopDataStore } from './state/desktopDataStore';
import { useSubtitleStore } from './state/subtitleStore';
import { useGlobalShortcuts } from './state/useGlobalShortcuts';
import type { LibraryItem, LibraryType, MediaKind, SubtitleItem } from './data/types';
import {
  downloadOpenSubtitle,
  searchOpenSubtitles,
  type OpenSubtitleResult,
  type OpenSubtitleSearchOptions,
} from './data/openSubtitlesClient';
import type { SubtitleSearchOptions } from './components/blocks/SubtitleSearchPanel';
import { computeMovieHash } from './data/movieHash';
import { getDesktopRepository } from './data/repository';

const screens = [
  { id: 'library', label: 'Library' },
  { id: 'player', label: 'Player' },
  { id: 'listening', label: 'Listening Library' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'settings', label: 'Settings' },
] as const;

type ScreenId = (typeof screens)[number]['id'];

type LookupPanelState = {
  isOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  word: string;
  definition: string;
  pronunciation: string | null;
  error: string | null;
  position: { x: number; y: number } | null;
  placement: 'above' | 'below';
  example: string;
};

const initialLookupState: LookupPanelState = {
  isOpen: false,
  status: 'idle',
  word: '',
  definition: '',
  pronunciation: null,
  error: null,
  position: null,
  placement: 'above',
  example: '',
};

type LookupSelectionPayload = {
  text: string;
  position: { x: number; y: number };
  placement: 'above' | 'below';
};

export function App() {
  const {
    activeScreen,
    maskState,
    activeSubtitle,
    listeningFilter,
    vocabTab,
    setActiveScreen,
    toggleMask,
    setMaskState,
    setActiveSubtitle,
    setListeningFilter,
    setVocabTab,
  } = useUiStore();

  const maskLabel = getMaskLabel(maskState);

  const {
    isPlaying,
    playbackRate,
    progress,
    duration,
    loopState,
    loopA,
    loopB,
    status,
    playbackError,
    initialize,
    loadSource,
    togglePlay,
    toggleLoop,
    setProgress,
    cyclePlaybackRate,
    setPlaybackRate,
    increaseRate,
    decreaseRate,
    seekToTime,
    pause,
  } = usePlayerStore();

  const {
    sources,
    recentItems,
    listeningItems,
    vocabItems,
    libraries,
    libraryItems,
    activeLibraryId,
    activeSourceId,
    libraryLoading,
    error,
    loadAll,
    selectLibrary,
    refreshActiveLibrary,
    createLibrary,
    createWebDavLibrary,
    createCloudDriveLibrary,
    addManualItemToActive,
    selectLibraryItem,
    deleteActiveLibrary,
    renameLibraryItem,
    deleteLibraryItem,
    saveListeningItem,
    addVocabFromLookup,
    toggleVocabFavorite,
    toggleVocabMastered,
    deleteVocabItem,
    clearActiveSource,
    recordRecentPlayback,
    deleteRecentItem,
    updateListeningItemTitle,
    toggleListeningItemFavorite,
    deleteListeningItem,
  } = useDesktopDataStore();

  const {
    tracks: subtitleTracks,
    activeTrackId,
    items: subtitleItems,
    error: subtitleError,
    setTracks,
    setItems,
    setError,
    selectTrack,
    burnedRegion,
    burnedMaskEnabled,
    burnedDetectionError,
    setBurnedRegion,
    setBurnedMaskEnabled,
    setBurnedDetectionError,
    clear: clearSubtitles,
  } = useSubtitleStore();

  useSubtitleSync(subtitleItems);

  // Loop handling is managed inside the playback adapter subscription.

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const activeLibrary = useMemo(
    () => libraries.find((library) => library.id === activeLibraryId) ?? null,
    [libraries, activeLibraryId],
  );

  const activeLibraryItem = useMemo(
    () => libraryItems.find((item) => item.id === activeSourceId) ?? null,
    [libraryItems, activeSourceId],
  );

  const activeSource = useMemo(() => {
    if (activeLibraryItem) {
      return {
        id: activeLibraryItem.id,
        title: activeLibraryItem.title,
        subtitle:
          getParentPath(activeLibraryItem.uri) || activeLibrary?.name || '',
        uri: activeLibraryItem.uri,
        kind: activeLibraryItem.kind,
        createdAt: activeLibraryItem.createdAt,
        updatedAt: activeLibraryItem.updatedAt,
      };
    }
    return sources.find((source) => source.id === activeSourceId) ?? null;
  }, [activeLibrary, activeLibraryItem, activeSourceId, sources]);

  const lastLoadedId = useRef<string | null>(null);

  useEffect(() => {
    if (!activeSource) {
      lastLoadedId.current = null;
      return;
    }
    if (lastLoadedId.current === activeSource.id) {
      return;
    }
    lastLoadedId.current = activeSource.id;
    void loadSource({ uri: activeSource.uri, kind: activeSource.kind });
  }, [activeSource?.id, activeSource?.uri, activeSource?.kind, loadSource]);

  const activeSubtitleItem =
    subtitleItems.find((item) => item.id === activeSubtitle) ?? null;
  const canPersist = Boolean(activeSourceId && activeSubtitleItem);
  const previousIsPlaying = useRef(isPlaying);
  const lastRecordedProgress = useRef(-1);
  const lastRecordedAt = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const [subtitleSearchOpen, setSubtitleSearchOpen] = useState(false);
  const [subtitleSearchResults, setSubtitleSearchResults] = useState<OpenSubtitleResult[]>([]);
  const [subtitleSearchStatus, setSubtitleSearchStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [subtitleSearchError, setSubtitleSearchError] = useState<string | null>(null);
  const [subtitleSearchLanguage, setSubtitleSearchLanguage] = useState('en');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lookupState, setLookupState] = useState<LookupPanelState>(initialLookupState);
  const lookupSeq = useRef(0);

  const resetLookupState = useCallback((clearSelection: boolean) => {
    lookupSeq.current += 1;
    if (clearSelection) {
      window.getSelection()?.removeAllRanges();
    }
    setLookupState(initialLookupState);
  }, []);

  const getSubtitlePreferenceKey = useCallback(
    (uri: string) => `subtitle_track:${encodeURIComponent(uri)}`,
    [],
  );

  const saveSubtitlePreference = useCallback(
    async (trackId: string | null) => {
      if (!activeSource) {
        return;
      }
      const repo = await getDesktopRepository();
      const key = getSubtitlePreferenceKey(activeSource.uri);
      await repo.setAppSetting(key, trackId ?? 'off');
    },
    [activeSource, getSubtitlePreferenceKey],
  );

  const recordProgress = useCallback(
    (force: boolean) => {
      if (!activeSourceId) {
        return;
      }
      const now = Date.now();
      const delta = Math.abs(progress - lastRecordedProgress.current);
      if (force || delta >= 1 || now - lastRecordedAt.current >= 15000) {
        lastRecordedProgress.current = progress;
        lastRecordedAt.current = now;
        void recordRecentPlayback(progress);
      }
    },
    [activeSourceId, progress, recordRecentPlayback],
  );

  useEffect(() => {
    if (previousIsPlaying.current && !isPlaying) {
      void recordProgress(true);
    }
    previousIsPlaying.current = isPlaying;
  }, [isPlaying, recordProgress]);

  useEffect(() => {
    lastRecordedProgress.current = -1;
    lastRecordedAt.current = 0;
  }, [activeSourceId]);

  useEffect(() => {
    if (!lookupState.isOpen) {
      return;
    }
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        resetLookupState(false);
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [lookupState.isOpen, resetLookupState]);

  useEffect(() => {
    if (pendingSeekRef.current === null) {
      return;
    }
    if (duration <= 0) {
      return;
    }
    seekToTime(pendingSeekRef.current);
    pendingSeekRef.current = null;
  }, [duration, seekToTime]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    recordProgress(false);
    const interval = window.setInterval(() => {
      recordProgress(false);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPlaying, recordProgress]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const subtitleLoadSeq = useRef(0);

  const runSubtitleLoad = useCallback(
    (context: {
      uri: string;
      kind: MediaKind;
      libraryId: string | null;
      libraryType: LibraryType | null;
      libraryItems: LibraryItem[];
    }) => {
      subtitleLoadSeq.current += 1;
      const seq = subtitleLoadSeq.current;
      setSubtitleSearchOpen(false);
      setSubtitleSearchResults([]);
      setSubtitleSearchStatus('idle');
      setSubtitleSearchError(null);
      setError(null);
      setBurnedDetectionError(null);
      void (async () => {
        const repo = await getDesktopRepository();
        const key = getSubtitlePreferenceKey(context.uri);
        const preferredTrackId = await repo.getAppSetting(key);
        return loadSubtitlesForSource(context, preferredTrackId ?? undefined);
      })()
        .then((result) => {
          if (seq !== subtitleLoadSeq.current) {
            return;
          }
          setTracks(result.tracks, result.activeTrackId);
          setItems(result.items);
          setActiveSubtitle(result.items[0]?.id ?? '');
          if (result.tracks.length === 0 && context.kind === 'video') {
            void detectBurnedSubtitleRegion(context).then((detection) => {
              if (seq !== subtitleLoadSeq.current) {
                return;
              }
              setBurnedRegion(detection.region);
              setBurnedDetectionError(detection.error ?? null);
              if (detection.error) {
                setError(detection.error);
              }
            });
          } else {
            setBurnedRegion(null);
            setBurnedMaskEnabled(false);
          }
        })
        .catch((error) => {
          if (seq !== subtitleLoadSeq.current) {
            return;
          }
          setTracks([], null);
          setItems([]);
          setActiveSubtitle('');
          const message =
            error instanceof Error ? error.message : error ? String(error) : 'Subtitle load failed.';
          setError(message || 'Subtitle load failed.');
        });
    },
    [
      setActiveSubtitle,
      setBurnedDetectionError,
      setBurnedMaskEnabled,
      setBurnedRegion,
      setError,
      setItems,
      setTracks,
    ],
  );

  useEffect(() => {
    if (!activeSource) {
      subtitleLoadSeq.current += 1;
      clearSubtitles();
      setBurnedRegion(null);
      setBurnedMaskEnabled(false);
      setBurnedDetectionError(null);
      setSubtitleSearchOpen(false);
      setSubtitleSearchResults([]);
      setSubtitleSearchStatus('idle');
      setSubtitleSearchError(null);
      setActiveSubtitle('');
      return;
    }
    const context = {
      uri: activeSource.uri,
      kind: activeSource.kind,
      libraryId: activeLibraryId,
      libraryType: activeLibrary?.type ?? null,
      libraryItems,
    };
    runSubtitleLoad(context);
  }, [
    activeSource,
    activeLibrary?.type,
    activeLibraryId,
    clearSubtitles,
    libraryItems,
    runSubtitleLoad,
    setActiveSubtitle,
    setBurnedDetectionError,
    setBurnedMaskEnabled,
    setBurnedRegion,
  ]);

  const handleReloadSubtitles = () => {
    if (!activeSource) {
      return;
    }
    runSubtitleLoad({
      uri: activeSource.uri,
      kind: activeSource.kind,
      libraryId: activeLibraryId,
      libraryType: activeLibrary?.type ?? null,
      libraryItems,
    });
  };

  const handleLookupSelection = useCallback(
    async ({ text, position, placement }: LookupSelectionPayload) => {
      const word = normalizeSelectionText(text);
      if (!word) {
        resetLookupState(false);
        return;
      }
      const subtitleItem = activeSubtitleItem;
      const example = subtitleItem?.en?.trim() || word;
      const seq = lookupSeq.current + 1;
      lookupSeq.current = seq;
      setLookupState({
        isOpen: true,
        status: 'loading',
        word,
        definition: '',
        pronunciation: null,
        error: null,
        position,
        placement,
        example,
      });
      const result = await lookupDictionaryWord(word);
      if (lookupSeq.current !== seq) {
        return;
      }
      if (result.status === 'success') {
        setLookupState((prev) => ({
          ...prev,
          status: 'ready',
          definition: result.definition,
          pronunciation: result.pronunciation,
          error: null,
        }));
      } else {
        setLookupState((prev) => ({
          ...prev,
          status: 'error',
          definition: '',
          pronunciation: null,
          error: result.reason,
        }));
      }
    },
    [activeSubtitleItem, resetLookupState],
  );

  const handleSelectSubtitleTrack = async (trackId: string | null) => {
    if (!trackId) {
      void saveSubtitlePreference(null);
      selectTrack(null);
      setItems([]);
      setActiveSubtitle('');
      setError(null);
      setBurnedMaskEnabled(false);
      return;
    }
    const track = subtitleTracks.find((entry) => entry.id === trackId);
    if (!track || !activeSource) {
      return;
    }
    try {
      setError(null);
      selectTrack(trackId);
      setBurnedMaskEnabled(Boolean(burnedRegion && track.isOnline));
      const items = await loadSubtitleTrack(track, {
        uri: activeSource.uri,
        kind: activeSource.kind,
        libraryId: activeLibraryId,
        libraryType: activeLibrary?.type ?? null,
        libraryItems,
      });
      setItems(items);
      setActiveSubtitle(items[0]?.id ?? '');
      void saveSubtitlePreference(track.id);
    } catch (error) {
      setItems([]);
      setActiveSubtitle('');
      setError(error instanceof Error ? error.message : 'Subtitle load failed.');
    }
  };

  const handleSelectSubtitle = useCallback(
    (id: string) => {
      setActiveSubtitle(id);
      const item = subtitleItems.find((entry) => entry.id === id);
      if (item) {
        seekToTime(item.startMs / 1000);
      }
    },
    [seekToTime, setActiveSubtitle, subtitleItems],
  );

  const handlePrevSubtitle = useCallback(() => {
    if (subtitleItems.length === 0) {
      return;
    }
    const currentIndex = subtitleItems.findIndex((item) => item.id === activeSubtitle);
    const targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    const target = subtitleItems[targetIndex] ?? subtitleItems[0];
    if (target) {
      handleSelectSubtitle(target.id);
    }
  }, [activeSubtitle, handleSelectSubtitle, subtitleItems]);

  const handleNextSubtitle = useCallback(() => {
    if (subtitleItems.length === 0) {
      return;
    }
    const currentIndex = subtitleItems.findIndex((item) => item.id === activeSubtitle);
    const targetIndex =
      currentIndex >= 0 ? Math.min(subtitleItems.length - 1, currentIndex + 1) : 0;
    const target = subtitleItems[targetIndex] ?? subtitleItems[0];
    if (target) {
      handleSelectSubtitle(target.id);
    }
  }, [activeSubtitle, handleSelectSubtitle, subtitleItems]);

  const handleToggleFullscreen = useCallback((target?: HTMLElement | null) => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    // Use provided target, or find player area by data attribute, or fallback to document
    const element =
      target ??
      document.querySelector<HTMLElement>('[data-player-area]') ??
      document.documentElement;
    if ('requestFullscreen' in element) {
      void element.requestFullscreen();
    }
  }, []);

  const handleCloseMiniPlayer = useCallback(() => {
    if (isPlaying) {
      pause();
    }
    clearActiveSource();
  }, [clearActiveSource, isPlaying, pause]);

  const handleSearchOnlineSubtitles = async (options: SubtitleSearchOptions) => {
    if (!options.query?.trim() && !options.moviehash) {
      return;
    }
    // Store the selected language for auto-match
    setSubtitleSearchLanguage(options.language);
    setSubtitleSearchStatus('loading');
    setSubtitleSearchError(null);
    try {
      const repo = await getDesktopRepository();
      const apiKey = await repo.getAppSetting('openSubtitlesApiKey');
      if (!apiKey) {
        throw new Error('OpenSubtitles API key is missing. Set it in Settings.');
      }
      const searchOptions: OpenSubtitleSearchOptions = {
        languages: options.language,
      };
      if (options.query?.trim()) {
        searchOptions.query = options.query.trim();
      }
      if (options.moviehash) {
        searchOptions.moviehash = options.moviehash;
      }
      const results = await searchOpenSubtitles(apiKey, searchOptions);
      setSubtitleSearchResults(results);
      setSubtitleSearchStatus('ready');
      if (results.length === 0) {
        setSubtitleSearchError('No subtitles found.');
      }
    } catch (err) {
      setSubtitleSearchStatus('error');
      setSubtitleSearchError(
        err instanceof Error ? err.message : 'Subtitle search failed.',
      );
    }
  };

  // Check if auto-match is available (local file, not WebDAV/remote)
  const canAutoMatch = useMemo(() => {
    if (!activeSource) return false;
    if (activeSource.kind !== 'video') return false;
    // WebDAV URLs start with http:// or https://
    const uri = activeSource.uri;
    return !uri.startsWith('http://') && !uri.startsWith('https://');
  }, [activeSource]);

  // Extract search query from current media file name
  const subtitleSearchInitialQuery = useMemo(() => {
    if (!activeSource) return '';
    const fileName = getFileName(activeSource.uri);
    return extractSearchQuery(fileName);
  }, [activeSource]);

  const handleAutoMatch = useCallback(async () => {
    if (!activeSource || !canAutoMatch) {
      return;
    }
    setSubtitleSearchStatus('loading');
    setSubtitleSearchError(null);
    try {
      const repo = await getDesktopRepository();
      const apiKey = await repo.getAppSetting('openSubtitlesApiKey');
      if (!apiKey) {
        throw new Error('OpenSubtitles API key is missing. Set it in Settings.');
      }
      // Compute movie hash
      const moviehash = await computeMovieHash(activeSource.uri);
      const searchOptions: OpenSubtitleSearchOptions = {
        moviehash,
        languages: subtitleSearchLanguage,
      };
      const results = await searchOpenSubtitles(apiKey, searchOptions);
      setSubtitleSearchResults(results);
      setSubtitleSearchStatus('ready');
      if (results.length === 0) {
        setSubtitleSearchError('No matching subtitles found for this file.');
      }
    } catch (err) {
      setSubtitleSearchStatus('error');
      setSubtitleSearchError(
        err instanceof Error ? err.message : 'Auto-match failed.',
      );
    }
  }, [activeSource, canAutoMatch, subtitleSearchLanguage]);

  const handleSelectOnlineSubtitle = async (result: OpenSubtitleResult) => {
    if (!activeSource) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      const apiKey = await repo.getAppSetting('openSubtitlesApiKey');
      if (!apiKey) {
        throw new Error('OpenSubtitles API key is missing. Set it in Settings.');
      }
      setSubtitleSearchStatus('loading');
      const download = await downloadOpenSubtitle(result.fileId, apiKey);
      const track = {
        id: `online-${result.fileId}`,
        kind: 'external' as const,
        format: result.format as 'srt' | 'vtt' | 'ass',
        label: `Online: ${download.fileName}`,
        source: download.path,
        isOnline: true,
      };
      const nextTracks = [track, ...subtitleTracks.filter((item) => item.id !== track.id)];
      setTracks(nextTracks, track.id);
      selectTrack(track.id);
      setBurnedMaskEnabled(Boolean(burnedRegion));
      const items = await loadSubtitleTrack(track, {
        uri: activeSource.uri,
        kind: activeSource.kind,
        libraryId: activeLibraryId,
        libraryType: activeLibrary?.type ?? null,
        libraryItems,
      });
      setItems(items);
      setActiveSubtitle(items[0]?.id ?? '');
      setSubtitleSearchStatus('ready');
      setSubtitleSearchOpen(false);
      void saveSubtitlePreference(track.id);
    } catch (err) {
      setSubtitleSearchStatus('error');
      setSubtitleSearchError(
        err instanceof Error ? err.message : 'Subtitle download failed.',
      );
    }
  };

  const handleSelectLibraryItem = (itemId: string) => {
    flushSync(() => {
      selectLibraryItem(itemId);
      setActiveScreen('player');
    });
    const item = libraryItems.find((entry) => entry.id === itemId);
    if (item) {
      lastLoadedId.current = item.id;
      void loadSource({ uri: item.uri, kind: item.kind }, { autoPlay: true });
    }
  };

  const handleSelectRecent = (sourceId: string) => {
    flushSync(() => {
      selectLibraryItem(sourceId);
      setActiveScreen('player');
    });
    const source = sources.find((item) => item.id === sourceId);
    if (source) {
      lastLoadedId.current = source.id;
      void loadSource({ uri: source.uri, kind: source.kind }, { autoPlay: true });
    }
  };

  const handleSelectListeningItem = useCallback(
    (listeningItemId: string) => {
      const item = listeningItems.find((entry) => entry.id === listeningItemId);
      if (!item) {
        return;
      }
      const libraryItem = libraryItems.find((entry) => entry.id === item.mediaSourceId) ?? null;
      const source = libraryItem
        ? {
            id: libraryItem.id,
            uri: libraryItem.uri,
            kind: libraryItem.kind,
          }
        : sources.find((entry) => entry.id === item.mediaSourceId) ?? null;
      if (!source) {
        return;
      }
      flushSync(() => {
        selectLibraryItem(source.id);
        setActiveScreen('player');
      });
      pendingSeekRef.current = item.startMs / 1000;
      lastLoadedId.current = source.id;
      void loadSource({ uri: source.uri, kind: source.kind }, { autoPlay: true });
    },
    [libraryItems, listeningItems, loadSource, selectLibraryItem, setActiveScreen, sources],
  );

  const handleOpenPlayer = () => {
    setActiveScreen('player');
  };

  const handleSaveListening = () => {
    if (!activeSubtitleItem) {
      return;
    }
    void saveListeningItem(activeSubtitleItem);
  };

  const handleSaveSubtitleItem = useCallback(
    (item: SubtitleItem) => {
      void saveListeningItem(item);
    },
    [saveListeningItem],
  );

  const handleAddLookupVocab = useCallback(() => {
    if (!lookupState.word) {
      return;
    }
    void addVocabFromLookup({
      word: lookupState.word,
      definition: lookupState.definition || undefined,
      pronunciation: lookupState.pronunciation,
      example: lookupState.example || undefined,
    });
    resetLookupState(true);
  }, [addVocabFromLookup, lookupState, resetLookupState]);

  const handleOpenPlaylist = useCallback(() => {
    setActiveScreen('library');
  }, [setActiveScreen]);

  // Toggle mask with different behavior for audio (on/off) vs video (4 states)
  const handleToggleMask = useCallback(() => {
    if (activeSource?.kind === 'audio') {
      // Audio: toggle between 0 (off) and 1 (on)
      setMaskState(maskState === 0 ? 1 : 0);
    } else {
      // Video: cycle through all 4 states
      toggleMask();
    }
  }, [activeSource?.kind, maskState, setMaskState, toggleMask]);

  // Global keyboard shortcuts for player controls.
  useGlobalShortcuts({
    togglePlay,
    prevSubtitle: handlePrevSubtitle,
    nextSubtitle: handleNextSubtitle,
    toggleFullscreen: handleToggleFullscreen,
    toggleLoop,
    toggleMask: handleToggleMask,
    saveListening: handleSaveListening,
    increaseRate,
    decreaseRate,
  });

  return (
    <div className={styles.appShell}>
      <header className={styles.topNav}>
        <div
          className={styles.topNavDragRegion}
          onMouseDown={(e) => {
            // Only start dragging on left mouse button
            if (e.button === 0 && e.target === e.currentTarget) {
              e.preventDefault();
              void import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
                void getCurrentWindow().startDragging();
              });
            }
          }}
          onDoubleClick={(e) => {
            // Double-click to toggle maximize
            if (e.target === e.currentTarget) {
              void import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
                void getCurrentWindow().toggleMaximize();
              });
            }
          }}
        />
        <div className={styles.logo}>Audixa</div>
        <nav className={styles.navLinks}>
          {screens.map((screen) => (
            <AppButton
              key={screen.id}
              variant="nav"
              isActive={activeScreen === screen.id}
              activeClassName={styles.navButtonActive}
              onClick={() => setActiveScreen(screen.id)}
            >
              {screen.label}
            </AppButton>
          ))}
        </nav>
        <WindowControls />
      </header>

      <main className={styles.mainArea}>
        {activeScreen === 'library' && (
          <LibraryScreen
            libraries={libraries}
            libraryItems={libraryItems}
            activeLibraryId={activeLibraryId}
            libraryLoading={libraryLoading}
            error={error}
            recentItems={recentItems}
            onSelectLibrary={selectLibrary}
            onSelectLibraryItem={handleSelectLibraryItem}
            onRefreshLibrary={refreshActiveLibrary}
            onAddManualItem={addManualItemToActive}
            onCreateManualLibrary={(name) =>
              createLibrary({ name, type: 'local-manual' })
            }
            onCreateWebDavLibrary={createWebDavLibrary}
            onCreateCloudDriveLibrary={createCloudDriveLibrary}
            onDeleteLibrary={deleteActiveLibrary}
            onSelectRecent={handleSelectRecent}
            onDeleteRecent={deleteRecentItem}
            onRenameLibraryItem={renameLibraryItem}
            onDeleteLibraryItem={deleteLibraryItem}
          />
        )}

        {activeScreen === 'listening' && (
          <ListeningScreen
            listeningItems={listeningItems}
            listeningFilter={listeningFilter}
            onFilterChange={setListeningFilter}
            onSelectItem={handleSelectListeningItem}
            onEditTitle={updateListeningItemTitle}
            onToggleFavorite={toggleListeningItemFavorite}
            onDeleteItem={deleteListeningItem}
          />
        )}

        {activeScreen === 'vocabulary' && (
          <VocabularyScreen
            vocabItems={vocabItems}
            vocabTab={vocabTab}
            onTabChange={setVocabTab}
            onToggleFavorite={toggleVocabFavorite}
            onToggleMastered={toggleVocabMastered}
            onDeleteVocab={deleteVocabItem}
          />
        )}

        {activeScreen === 'settings' && <SettingsScreen />}

        {(activeScreen === 'player' || activeSource) && (
          <PlayerScreen
            subtitleItems={subtitleItems}
            activeSubtitle={activeSubtitle}
            subtitleTracks={subtitleTracks}
            activeSubtitleTrackId={activeTrackId}
            subtitleError={subtitleError}
            burnedRegion={burnedRegion}
            burnedMaskEnabled={burnedMaskEnabled}
            burnedDetectionError={burnedDetectionError}
            maskState={maskState}
            maskLabel={maskLabel}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            progress={progress}
            loopState={loopState}
            loopA={loopA}
            loopB={loopB}
            playbackStatus={status}
            playbackError={playbackError}
            activeSource={activeSource}
            viewMode={activeScreen === 'player' ? 'full' : 'mini'}
            onOpenPlayer={handleOpenPlayer}
            activeSubtitleItem={activeSubtitleItem}
            onMaskToggle={handleToggleMask}
            onTogglePlay={togglePlay}
            onPrevSubtitle={handlePrevSubtitle}
            onNextSubtitle={handleNextSubtitle}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
            onCloseMiniPlayer={handleCloseMiniPlayer}
            onToggleLoop={toggleLoop}
            onSeek={setProgress}
            onCycleRate={cyclePlaybackRate}
            onSetRate={setPlaybackRate}
            onSelectSubtitle={handleSelectSubtitle}
            onSelectSubtitleTrack={handleSelectSubtitleTrack}
            onOpenSubtitleSearch={() => setSubtitleSearchOpen(true)}
            onCloseSubtitleSearch={() => setSubtitleSearchOpen(false)}
            subtitleSearchOpen={subtitleSearchOpen}
            subtitleSearchStatus={subtitleSearchStatus}
            subtitleSearchError={subtitleSearchError}
            subtitleSearchResults={subtitleSearchResults}
            onSearchOnlineSubtitle={handleSearchOnlineSubtitles}
            onSelectOnlineSubtitle={handleSelectOnlineSubtitle}
            onAutoMatch={handleAutoMatch}
            canAutoMatch={canAutoMatch}
            subtitleSearchInitialQuery={subtitleSearchInitialQuery}
            subtitleSearchAutoSearch={true}
            onReloadSubtitles={handleReloadSubtitles}
            lookupState={lookupState}
            onLookupSelection={handleLookupSelection}
            onCloseLookup={() => resetLookupState(true)}
            onAddLookupVocab={handleAddLookupVocab}
            onSaveListening={handleSaveListening}
            onSaveSubtitleItem={handleSaveSubtitleItem}
            onOpenPlaylist={handleOpenPlaylist}
            isPersistDisabled={!canPersist}
          />
        )}
      </main>
    </div>
  );
}

export default App;

if (import.meta.vitest) {
  // add tests related to your file here
  // For more information please visit the Vitest docs site here: https://vitest.dev/guide/in-source.html

  const { it, expect, beforeEach } = import.meta.vitest;
  let render: typeof import('@testing-library/react').render;

  beforeEach(async () => {
    render = (await import('@testing-library/react')).render;
  });

  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should show the default screen', () => {
    const { getByText } = render(<App />);
    expect(getByText('Add Source')).toBeTruthy();
  });
}
