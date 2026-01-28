import styles from '../app.module.css';
import { IconGlyph } from '../components/atoms/IconGlyph';
import { IconButton } from '../components/atoms/IconButton';
import { PrimaryButton } from '../components/atoms/PrimaryButton';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BurnedSubtitleMask } from '../components/blocks/BurnedSubtitleMask';
import { MediaSurface } from '../components/blocks/MediaSurface';
import { PlayerControls } from '../components/blocks/PlayerControls';
import { PlayerTimeline } from '../components/blocks/PlayerTimeline';
import { SubtitleOverlay } from '../components/blocks/SubtitleOverlay';
import { SubtitlePanel } from '../components/blocks/SubtitlePanel';
import { SubtitleSearchPanel } from '../components/blocks/SubtitleSearchPanel';
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
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onCloseMiniPlayer: () => void;
  onToggleLoop: () => void;
  onSeek: (value: number) => void;
  onCycleRate: () => void;
  onSetRate: (value: number) => void;
  onSelectSubtitle: (id: string) => void;
  onSelectSubtitleTrack: (id: string | null) => void;
  onOpenSubtitleSearch: () => void;
  onCloseSubtitleSearch: () => void;
  subtitleSearchOpen: boolean;
  subtitleSearchStatus: 'idle' | 'loading' | 'ready' | 'error';
  subtitleSearchError: string | null;
  subtitleSearchResults: OpenSubtitleResult[];
  onSearchOnlineSubtitle: (query: string) => void;
  onSelectOnlineSubtitle: (result: OpenSubtitleResult) => void;
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
  onOpenSubtitleSearch,
  onCloseSubtitleSearch,
  subtitleSearchOpen,
  subtitleSearchStatus,
  subtitleSearchError,
  subtitleSearchResults,
  onSearchOnlineSubtitle,
  onSelectOnlineSubtitle,
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
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const resizeState = useRef<{ startX: number; startWidth: number } | null>(null);
  const minPlayerWidth = 420;
  const maxSidebarWidth = layoutWidth ? Math.max(0, layoutWidth - minPlayerWidth) : sidebarWidth;
  const sidebarWidthClamped = useMemo(() => {
    if (!layoutWidth) {
      return sidebarWidth;
    }
    return Math.min(maxSidebarWidth, Math.max(0, sidebarWidth));
  }, [layoutWidth, maxSidebarWidth, sidebarWidth]);
  const sidebarVisibleWidth = isSidebarCollapsed ? 44 : sidebarWidthClamped;

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
      } ${isMini && isAudio ? styles.playerScreenMiniAudio : ''}`}
    >
      <div
        ref={layoutRef}
        className={isMini ? styles.playerMiniLayout : styles.playerLayout}
        style={
          isMini
            ? undefined
            : { gridTemplateColumns: `1fr ${sidebarVisibleWidth}px` }
        }
      >
        <div
          className={styles.videoArea}
          onDoubleClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('button')) {
              return;
            }
            if (
              target.closest(`.${styles.subtitleOverlay}`) ||
              target.closest(`.${styles.subtitleLookupPanel}`)
            ) {
              return;
            }
            onTogglePlay();
          }}
        >
          <MediaSurface source={activeSource} status={playbackStatus} />
          <BurnedSubtitleMask region={burnedRegion} isVisible={burnedMaskEnabled} />
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
          {isMini ? null : (
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
                onSeek={onSeek}
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
            <header className={styles.playerHeader}>
              <div className={styles.playerHeaderInfo}>
                <div className={styles.playerTitle}>
                  {activeSource?.title ?? 'No media selected'}
                </div>
                <div className={styles.playerSubtitle}>
                  {activeSource?.subtitle ?? 'Select a media item to start'}
                </div>
              </div>
            </header>
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
                  <SubtitleSearchPanel
                    isOpen={subtitleSearchOpen}
                    status={subtitleSearchStatus}
                    error={subtitleSearchError ?? burnedDetectionError}
                    results={subtitleSearchResults}
                    onSearch={onSearchOnlineSubtitle}
                    onSelect={onSelectOnlineSubtitle}
                    onClose={onCloseSubtitleSearch}
                  />
                  <SubtitlePanel
                    items={subtitleItems}
                    activeId={activeSubtitle}
                    onSelect={onSelectSubtitle}
                    error={subtitleError}
                    onToggleCollapse={() => setIsSidebarCollapsed(true)}
                    onSaveItem={onSaveSubtitleItem}
                    formatLabel={
                      subtitleTracks.find((track) => track.id === activeSubtitleTrackId)?.format ??
                      null
                    }
                  />
                  <div
                    className={styles.sidebarResizeHandle}
                    role="separator"
                    aria-orientation="vertical"
                    onPointerDown={(event) => {
                      resizeState.current = {
                        startX: event.clientX,
                        startWidth: sidebarWidthClamped,
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
              onToggleFullscreen={onToggleFullscreen}
              isFullscreen={isFullscreen}
              onToggleLoop={onToggleLoop}
              onSeek={onSeek}
              onCycleRate={onCycleRate}
              onSetRate={onSetRate}
              onSelectSubtitleTrack={onSelectSubtitleTrack}
              onOpenSubtitleSearch={onOpenSubtitleSearch}
              canSearchOnline={Boolean(burnedRegion)}
              onReloadSubtitles={onReloadSubtitles}
              onSaveListening={onSaveListening}
              onOpenPlaylist={onOpenPlaylist}
              isPersistDisabled={isPersistDisabled}
            />
          </>
        )}
      </div>
    </section>
  );
}
