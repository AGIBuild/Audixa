import styles from '../../app.module.css';
import type { BurnedSubtitleRegion } from '../../state/subtitleStore';

type BurnedSubtitleMaskProps = {
  region: BurnedSubtitleRegion | null;
  isVisible: boolean;
};

export function BurnedSubtitleMask({ region, isVisible }: BurnedSubtitleMaskProps) {
  if (!region || !isVisible) {
    return null;
  }
  return (
    <div
      className={styles.burnedSubtitleMask}
      style={{
        left: `${region.x * 100}%`,
        top: `${region.y * 100}%`,
        width: `${region.width * 100}%`,
        height: `${region.height * 100}%`,
      }}
    />
  );
}
