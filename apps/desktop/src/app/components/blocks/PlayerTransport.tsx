import styles from '../../app.module.css';
import { AppButton } from '../atoms/AppButton';
import { IconButton } from '../atoms/IconButton';
import { PrimaryButton } from '../atoms/PrimaryButton';

type PlayerTransportProps = {
  maskLabel: string;
  isPlaying: boolean;
  playbackRate: number;
  loopState: number;
  onMaskToggle: () => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onCycleRate: () => void;
};

export function PlayerTransport({
  maskLabel,
  isPlaying,
  playbackRate,
  loopState,
  onMaskToggle,
  onTogglePlay,
  onToggleLoop,
  onCycleRate,
}: PlayerTransportProps) {
  return (
    <div className={styles.controlsRow}>
      <div className={styles.leftControls}>
        <AppButton variant="secondary" onClick={onMaskToggle}>
          {maskLabel}
        </AppButton>
        <AppButton variant="secondary" onClick={onCycleRate}>
          Rate {playbackRate.toFixed(1)}x
        </AppButton>
      </div>
      <div className={styles.mainControls}>
        <IconButton>Prev</IconButton>
        <PrimaryButton onClick={onTogglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </PrimaryButton>
        <IconButton>Next</IconButton>
      </div>
      <div className={styles.rightControls}>
        <AppButton
          variant="ab"
          className={`${loopState === 1 ? styles.abButtonArmed : ''} ${
            loopState === 2 ? styles.abButtonActive : ''
          }`}
          onClick={onToggleLoop}
        >
          AB
        </AppButton>
        <IconButton>Save</IconButton>
        <IconButton>List</IconButton>
      </div>
    </div>
  );
}
