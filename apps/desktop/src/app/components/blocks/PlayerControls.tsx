import styles from '../../app.module.css';
import { PlayerTimeline } from './PlayerTimeline';
import { PlayerTransport } from './PlayerTransport';

type PlayerControlsProps = {
  maskLabel: string;
  abState: number;
  onMaskToggle: () => void;
  onAbToggle: () => void;
};

export function PlayerControls({
  maskLabel,
  abState,
  onMaskToggle,
  onAbToggle,
}: PlayerControlsProps) {
  return (
    <div className={styles.controlsArea}>
      <PlayerTimeline
        progress={38}
        showMarkerA={abState >= 1}
        showMarkerB={abState >= 2}
        markerAPosition={30}
        markerBPosition={46}
      />
      <PlayerTransport
        maskLabel={maskLabel}
        abState={abState}
        onMaskToggle={onMaskToggle}
        onAbToggle={onAbToggle}
      />
    </div>
  );
}
