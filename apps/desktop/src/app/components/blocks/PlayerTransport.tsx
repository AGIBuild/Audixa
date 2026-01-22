import styles from '../../app.module.css';
import { AppButton } from '../atoms/AppButton';
import { IconButton } from '../atoms/IconButton';
import { PrimaryButton } from '../atoms/PrimaryButton';

type PlayerTransportProps = {
  maskLabel: string;
  abState: number;
  onMaskToggle: () => void;
  onAbToggle: () => void;
};

export function PlayerTransport({
  maskLabel,
  abState,
  onMaskToggle,
  onAbToggle,
}: PlayerTransportProps) {
  return (
    <div className={styles.controlsRow}>
      <div className={styles.leftControls}>
        <AppButton variant="secondary" onClick={onMaskToggle}>
          {maskLabel}
        </AppButton>
        <span className={styles.mutedText}>1.0x</span>
      </div>
      <div className={styles.mainControls}>
        <IconButton>Prev</IconButton>
        <PrimaryButton>Play</PrimaryButton>
        <IconButton>Next</IconButton>
      </div>
      <div className={styles.rightControls}>
        <AppButton
          variant="ab"
          className={`${abState === 1 ? styles.abButtonArmed : ''} ${
            abState === 2 ? styles.abButtonActive : ''
          }`}
          onClick={onAbToggle}
        >
          AB
        </AppButton>
        <IconButton>Save</IconButton>
        <IconButton>List</IconButton>
      </div>
    </div>
  );
}
