import styles from '../app.module.css';
import { IconGlyph } from '../components/atoms/IconGlyph';
import { IconButton } from '../components/atoms/IconButton';
import { PrimaryButton } from '../components/atoms/PrimaryButton';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { BurnedSubtitleMask } from '../components/blocks/BurnedSubtitleMask';
import { LyricsStage } from '../components/blocks/LyricsStage';
import { MediaSurface } from '../components/blocks/MediaSurface';
import { PlayerControls } from '../components/blocks/PlayerControls';
import { PlayerTimeline } from '../components/blocks/PlayerTimeline';
import { SubtitleOverlay } from '../components/blocks/SubtitleOverlay';
import { SubtitlePanel } from '../components/blocks/SubtitlePanel';
import { SubtitleSearchPanel, type SubtitleSearchOptions } from '../components/blocks/SubtitleSearchPanel';
import { SubtitleLookupPanel } from '../components/blocks/SubtitleLookupPanel';
import type { SourceItem, SubtitleItem } from '../data/types';
import type { BurnedSubtitleRegion, SubtitleTrack } from '../state/subtitleStore';
import type { OpenSubtitleResult } from '../data/openSubtitlesClient';
import type { PlaybackStatus } from '../state/playbackAdapter';

type LookupPanelState = {
  isOpen: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  word: string;
  definition: string;
  pronunciation: string | null;
  error: string | null;
  position: { x: number; y: number } | null;
  placement: 'above' | 'below';
};

type PlayerScreenProps = {
  subtitleItems: SubtitleItem[];
  activeSubtitle: string;
  subtitleTracks: SubtitleTrack[];
  activeSubtitleTrackId: string | null;
  subtitleError: string | null;
  burnedRegion: BurnedSubtitleRegion | null;
  burnedMaskEnabled: boolean;
  burnedDetectionError: string | null;
  maskState: number;
  maskLabel: string;
  isPlaying: boolean;
  playbackRate: number;
  progress: number;
  loopState: number;
  loopA: number;
  loopB: number;
  playbackStatus: PlaybackStatus;
  playbackError: string | null;
  activeSource: SourceItem | null;
  viewMode: 'full' | 'mini';
  onOpenPlayer: () => void;
  activeSubtitleItem: SubtitleItem | null;
  onMaskToggle: () => void;
  onTogglePlay: () => void;
  onPrevSubtitle: () => void;
  onNextSubtitle: () => void;
  onToggleFullscreen: (target?: HTMLElement | null) => void;
  isFullscreen: boolean;
  onCloseMiniPlayer: () => void;
  onToggleLoop: () => void;
  onSeek: (value: number) => void;
  onCycleRate: () => void;
  onSetRate: (value: number) => void;
  onSelectSubtitle: (id: string) => void;
  onSelectSubtitleTrack: (id: string | null) => void;
  onDeleteSubtitleTrack?: (id: string) => void;
  onOpenSubtitleSearch: () => void;
  onCloseSubtitleSearch: () => void;
  subtitleSearchOpen: boolean;
  subtitleSearchStatus: 'idle' | 'loading' | 'ready' | 'error';
  subtitleSearchError: string | null;
  subtitleSearchResults: OpenSubtitleResult[];
  onSearchOnlineSubtitle: (options: SubtitleSearchOptions) => void;
  onSelectOnlineSubtitle: (result: OpenSubtitleResult) => void;
  onAutoMatch?: () => void;
  canAutoMatch?: boolean;
  subtitleSearchInitialQuery?: string;
  subtitleSearchAutoSearch?: boolean;
  onReloadSubtitles: () => void;
  lookupState: LookupPanelState;
  onLookupSelection: (payload: {
    text: string;
    position: { x: number; y: number };
    placement: 'above' | 'below';
  }) => void;
  onCloseLookup: () => void;
  onAddLookupVocab: () => void;
  onSaveListening: () => void;
  onSaveSubtitleItem: (item: SubtitleItem) => void;
  onOpenPlaylist: () => void;
  isPersistDisabled: boolean;
};

export function PlayerScreen({
  subtitleItems,
  activeSubtitle,
  subtitleTracks,
  activeSubtitleTrackId,
  subtitleError,
  burnedRegion,
  burnedMaskEnabled,
  burnedDetectionError,
  maskState,
  maskLabel,
  isPlaying,
  playbackRate,
  progress,
  loopState,
  loopA,
  loopB,
  playbackStatus,
  playbackError,
  activeSource,
  viewMode,
  onOpenPlayer,
  activeSubtitleItem,
  onMaskToggle,
  onTogglePlay,
  onPrevSubtitle,
  onNextSubtitle,
  onToggleFullscreen,
  isFullscreen,
  onCloseMiniPlayer,
  onToggleLoop,
  onSeek,
  onCycleRate,
  onSetRate,
  onSelectSubtitle,
  onSelectSubtitleTrack,
  onDeleteSubtitleTrack,
  onOpenSubtitleSearch,
  onCloseSubtitleSearch,
  subtitleSearchOpen,
  subtitleSearchStatus,
  subtitleSearchError,
  subtitleSearchResults,
  onSearchOnlineSubtitle,
  onSelectOnlineSubtitle,
  onAutoMatch,
  canAutoMatch = false,
  subtitleSearchInitialQuery = '',
  subtitleSearchAutoSearch = false,
  onReloadSubtitles,
  lookupState,
  onLookupSelection,
  onCloseLookup,
  onAddLookupVocab,
  onSaveListening,
  onSaveSubtitleItem,
  onOpenPlaylist,
  isPersistDisabled,
}: PlayerScreenProps) {
  const isMini = viewMode === 'mini';
  const isAudio = activeSource?.kind === 'audio';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [lyricsScrollToken, setLyricsScrollToken] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [headerAutoVisible, setHeaderAutoVisible] = useState(true);
  const videoAreaRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const resizeState = useRef<{ startX: number; startWidth: number } | null>(null);
  const headerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minPlayerWidth = 420;
  const maxSidebarWidth = layoutWidth ? Math.max(0, layoutWidth - minPlayerWidth) : sidebarWidth;
  const sidebarWidthClamped = useMemo(() => {
    if (!layoutWidth) {
      return sidebarWidth;
    }
    return Math.min(maxSidebarWidth, Math.max(0, sidebarWidth));
  }, [layoutWidth, maxSidebarWidth, sidebarWidth]);
  const sidebarVisibleWidth = isSidebarCollapsed ? 44 : sidebarWidthClamped;

  // Auto-hide header after 5 seconds when media is loaded.
  const showHeader = !activeSource || isHovering || headerAutoVisible;
  // For video: always show subtitle sidebar (even if no subtitles)
  // For audio: hide sidebar (uses LyricsStage instead)
  const hideSubtitleSidebar = isAudio;

  const handleSeekWithLyrics = useCallback(
    (value: number) => {
      setLyricsScrollToken((t) => t + 1);
      onSeek(value);
    },
    [onSeek],
  );

  useEffect(() => {
    if (!activeSource) {
      // No media - always show header.
      setHeaderAutoVisible(true);
      return;
    }
    // Media loaded - show for 5 seconds then hide.
    setHeaderAutoVisible(true);
    if (headerTimerRef.current) {
      clearTimeout(headerTimerRef.current);
    }
    headerTimerRef.current = setTimeout(() => {
      setHeaderAutoVisible(false);
    }, 5000);
    return () => {
      if (headerTimerRef.current) {
        clearTimeout(headerTimerRef.current);
      }
    };
  }, [activeSource?.id]);

  // Pointer events handle resizing.

  useEffect(() => {
    if (!layoutRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLayoutWidth(entry.contentRect.width);
      }
    });
    observer.observe(layoutRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`${styles.screen} ${styles.playerScreen} ${
        isMini ? styles.playerScreenMini : styles.playerScreenFull
      } ${isMini && isAudio ? styles.playerScreenMiniAudio : ''} ${!isMini && isAudio ? styles.playerAudioMode : ''}`}
    >
      <div
        ref={layoutRef}
        className={isMini ? styles.playerMiniLayout : styles.playerLayout}
        style={
          isMini
            ? undefined
            : { gridTemplateColumns: hideSubtitleSidebar ? '1fr 0px' : `1fr ${sidebarVisibleWidth}px` }
        }
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          ref={videoAreaRef}
          className={styles.videoArea}
          data-player-area
          onDoubleClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('button')) {
              return;
            }
            // Prevent double-click on subtitle overlay from triggering play/pause.
            if (
              target.closest('[data-subtitle-overlay]') ||
              target.closest('[data-subtitle-lookup]')
            ) {
              return;
            }
            onTogglePlay();
          }}
        >
          <MediaSurface source={activeSource} status={playbackStatus} />
          {isAudio ? null : (
            <BurnedSubtitleMask region={burnedRegion} isVisible={burnedMaskEnabled} />
          )}
          {isAudio && !isMini ? (
            <LyricsStage
              items={subtitleItems}
              activeId={activeSubtitle}
              onSeek={handleSeekWithLyrics}
              scrollToken={lyricsScrollToken}
              maskState={maskState}
            />
          ) : null}
          {isMini ? (
            <IconButton
              onClick={onCloseMiniPlayer}
              className={styles.miniCloseButton}
              aria-label="Close mini player"
              title="Close mini player"
            >
              <IconGlyph name="close" size={16} />
            </IconButton>
          ) : null}
          {isMini || isAudio ? null : (
            <SubtitleOverlay
              maskState={maskState}
              lineEn={activeSubtitleItem?.en}
              lineCn={activeSubtitleItem?.cn}
              onLookupSelection={onLookupSelection}
              onLookupDismiss={onCloseLookup}
            />
          )}
          <SubtitleLookupPanel
            isOpen={lookupState.isOpen}
            status={lookupState.status}
            word={lookupState.word}
            definition={lookupState.definition}
            pronunciation={lookupState.pronunciation}
            error={lookupState.error}
            position={lookupState.position}
            placement={lookupState.placement}
            onClose={onCloseLookup}
            onAdd={onAddLookupVocab}
          />
          {playbackError ? (
            <div className={styles.playerError}>{playbackError}</div>
          ) : null}
          {isMini ? null : (
            <header
              className={`${styles.playerHeader} ${showHeader ? '' : styles.playerHeaderHidden}`}
            >
              <div className={styles.playerHeaderInfo}>
                <div className={styles.playerTitle}>
                  {activeSource?.title ?? 'No media selected'}
                </div>
                <div className={styles.playerSubtitle}>
                  {activeSource?.subtitle ?? 'Select a media item to start'}
                </div>
              </div>
            </header>
          )}
        </div>

        {isMini ? (
          <div className={styles.miniControls}>
            <PrimaryButton
              onClick={onTogglePlay}
              className={`${styles.miniPlayButton} ${styles.transportPlayButton}`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <IconGlyph name={isPlaying ? 'pause' : 'play'} size={24} />
            </PrimaryButton>
            <div className={styles.miniTimeline}>
              <PlayerTimeline
                progress={progress}
                showMarkerA={loopState >= 1}
                showMarkerB={loopState >= 2}
                markerAPosition={loopA}
                markerBPosition={loopB}
                onSeek={handleSeekWithLyrics}
              />
            </div>
            <IconButton
              onClick={onOpenPlayer}
              className={`${styles.transportIconButton} ${styles.miniOpenButton}`}
              aria-label="Open player"
              title="Open player"
            >
              <IconGlyph name="open" />
            </IconButton>
          </div>
        ) : (
          <>
            {hideSubtitleSidebar ? null : (
              <aside
                className={`${styles.playerSidebar} ${
                  isSidebarCollapsed ? styles.playerSidebarCollapsed : ''
                }`}
                style={isMini ? undefined : { width: `${sidebarVisibleWidth}px` }}
              >
                {isSidebarCollapsed ? (
                  <div className={styles.sidebarCollapsedContent}>
                    <IconButton
                      aria-label="Expand subtitle panel"
                      title="Expand"
                      onClick={() => setIsSidebarCollapsed(false)}
                    >
                      <IconGlyph name="chevronLeft" />
                    </IconButton>
                  </div>
                ) : (
                  <>
                    {isAudio ? null : (
                      <>
                        <SubtitlePanel
                          items={subtitleItems}
                          activeId={activeSubtitle}
                          onSelect={onSelectSubtitle}
                          error={subtitleError}
                          onToggleCollapse={() => setIsSidebarCollapsed(true)}
                          onSaveItem={onSaveSubtitleItem}
                          formatLabel={
                            subtitleTracks.find((track) => track.id === activeSubtitleTrackId)
                              ?.format ?? null
                          }
                        />
                      </>
                    )}
                    <div
                      className={styles.sidebarResizeHandle}
                      role="separator"
                      aria-orientation="vertical"
                      onPointerDown={(event) => {
                        resizeState.current = {
                          startX: event.clientX,
                          startWidth: sidebarVisibleWidth,
                        };
                        setIsResizing(true);
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={(event) => {
                        const state = resizeState.current;
                        if (!state) {
                          return;
                        }
                        event.preventDefault();
                        const delta = state.startX - event.clientX;
                        const next = state.startWidth + delta;
                        const maxWidth = layoutWidth
                          ? Math.max(0, layoutWidth - minPlayerWidth)
                          : Number.POSITIVE_INFINITY;
                        setSidebarWidth(Math.min(maxWidth, Math.max(0, next)));
                      }}
                      onPointerUp={(event) => {
                        resizeState.current = null;
                        setIsResizing(false);
                        event.currentTarget.releasePointerCapture(event.pointerId);
                      }}
                      onPointerCancel={(event) => {
                        resizeState.current = null;
                        setIsResizing(false);
                        event.currentTarget.releasePointerCapture(event.pointerId);
                      }}
                    />
                  </>
                )}
              </aside>
            )}

            <PlayerControls
              maskLabel={maskLabel}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              progress={progress}
              loopState={loopState}
              loopA={loopA}
              loopB={loopB}
              subtitleTracks={subtitleTracks}
              activeSubtitleTrackId={activeSubtitleTrackId}
              onMaskToggle={onMaskToggle}
              onTogglePlay={onTogglePlay}
              onPrevSubtitle={onPrevSubtitle}
              onNextSubtitle={onNextSubtitle}
              onToggleFullscreen={() => onToggleFullscreen(videoAreaRef.current)}
              isFullscreen={isFullscreen}
              onToggleLoop={onToggleLoop}
              onSeek={handleSeekWithLyrics}
              onCycleRate={onCycleRate}
              onSetRate={onSetRate}
              onSelectSubtitleTrack={onSelectSubtitleTrack}
              onDeleteSubtitleTrack={onDeleteSubtitleTrack}
              onOpenSubtitleSearch={onOpenSubtitleSearch}
              canSearchOnline={true}
              onReloadSubtitles={onReloadSubtitles}
              onSaveListening={onSaveListening}
              onOpenPlaylist={onOpenPlaylist}
              isPersistDisabled={isPersistDisabled}
            />
          </>
        )}
      </div>
      <SubtitleSearchPanel
        isOpen={subtitleSearchOpen}
        status={subtitleSearchStatus}
        error={subtitleSearchError ?? burnedDetectionError}
        results={subtitleSearchResults}
        onSearch={onSearchOnlineSubtitle}
        onSelect={onSelectOnlineSubtitle}
        onClose={onCloseSubtitleSearch}
        onAutoMatch={onAutoMatch}
        canAutoMatch={canAutoMatch}
        initialQuery={subtitleSearchInitialQuery}
        autoSearch={subtitleSearchAutoSearch}
      />
    </section>
  );
}
