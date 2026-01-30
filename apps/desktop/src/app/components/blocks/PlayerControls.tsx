import styles from '../../app.module.css';
import { PlayerTimeline } from './PlayerTimeline';
import { PlayerTransport } from './PlayerTransport';
import type { SubtitleTrack } from '../../state/subtitleStore';

type PlayerControlsProps = {
  maskLabel: string;
  isPlaying: boolean;
  playbackRate: number;
  progress: number;
  loopState: number;
  loopA: number;
  loopB: number;
  subtitleTracks: SubtitleTrack[];
  activeSubtitleTrackId: string | null;
  onMaskToggle: () => void;
  onTogglePlay: () => void;
  onPrevSubtitle: () => void;
  onNextSubtitle: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isVisible?: boolean;
  onToggleLoop: () => void;
  onSeek: (value: number) => void;
  onCycleRate: () => void;
  onSetRate: (value: number) => void;
  onSelectSubtitleTrack: (id: string | null) => void;
  onDeleteSubtitleTrack?: (id: string) => void;
  onOpenSubtitleSearch: () => void;
  canSearchOnline: boolean;
  onReloadSubtitles: () => void;
  onSaveListening: () => void;
  onOpenPlaylist: () => void;
  isPersistDisabled: boolean;
};

export function PlayerControls({
  maskLabel,
  isPlaying,
  playbackRate,
  progress,
  loopState,
  loopA,
  loopB,
  subtitleTracks,
  activeSubtitleTrackId,
  onMaskToggle,
  onTogglePlay,
  onPrevSubtitle,
  onNextSubtitle,
  onToggleFullscreen,
  isFullscreen,
  isVisible = true,
  onToggleLoop,
  onSeek,
  onCycleRate,
  onSetRate,
  onSelectSubtitleTrack,
  onDeleteSubtitleTrack,
  onOpenSubtitleSearch,
  canSearchOnline,
  onReloadSubtitles,
  onSaveListening,
  onOpenPlaylist,
  isPersistDisabled,
}: PlayerControlsProps) {
  const fullscreenClass = isFullscreen
    ? ` ${styles.controlsAreaFullscreen}${isVisible ? ` ${styles.controlsAreaVisible}` : ''}`
    : '';
  return (
    <div className={`${styles.controlsArea}${fullscreenClass}`}>
      <PlayerTimeline
        progress={progress}
        showMarkerA={loopState >= 1}
        showMarkerB={loopState >= 2}
        markerAPosition={loopA}
        markerBPosition={loopB}
        onSeek={onSeek}
      />
      <PlayerTransport
        maskLabel={maskLabel}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        loopState={loopState}
        subtitleTracks={subtitleTracks}
        activeSubtitleTrackId={activeSubtitleTrackId}
        onMaskToggle={onMaskToggle}
        onTogglePlay={onTogglePlay}
        onPrevSubtitle={onPrevSubtitle}
        onNextSubtitle={onNextSubtitle}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
        onToggleLoop={onToggleLoop}
        onCycleRate={onCycleRate}
        onSetRate={onSetRate}
        onSelectSubtitleTrack={onSelectSubtitleTrack}
        onDeleteSubtitleTrack={onDeleteSubtitleTrack}
        onOpenSubtitleSearch={onOpenSubtitleSearch}
        canSearchOnline={canSearchOnline}
        onReloadSubtitles={onReloadSubtitles}
        onSaveListening={onSaveListening}
        onOpenPlaylist={onOpenPlaylist}
        isPersistDisabled={isPersistDisabled}
      />
    </div>
  );
}
