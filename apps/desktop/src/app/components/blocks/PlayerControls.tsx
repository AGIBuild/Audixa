import styles from '../../app.module.css';
import { PlayerTimeline } from './PlayerTimeline';
import { PlayerTransport } from './PlayerTransport';

type PlayerControlsProps = {
  maskLabel: string;
  isPlaying: boolean;
  playbackRate: number;
  progress: number;
  loopState: number;
  loopA: number;
  loopB: number;
  onMaskToggle: () => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSeek: (value: number) => void;
  onCycleRate: () => void;
};

export function PlayerControls({
  maskLabel,
  isPlaying,
  playbackRate,
  progress,
  loopState,
  loopA,
  loopB,
  onMaskToggle,
  onTogglePlay,
  onToggleLoop,
  onSeek,
  onCycleRate,
}: PlayerControlsProps) {
  return (
    <div className={styles.controlsArea}>
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
        onMaskToggle={onMaskToggle}
        onTogglePlay={onTogglePlay}
        onToggleLoop={onToggleLoop}
        onCycleRate={onCycleRate}
      />
    </div>
  );
}
